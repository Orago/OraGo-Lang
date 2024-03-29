import betterIterable from './util/betterIterables.js';
import evalMath from './util/math.js';
import { keywordDict } from './util/keyword.js';
import { forceType } from './util/forceType.js';
import { isString, parseString, parseBlock } from './util/parseTools.js';
import { oraLexer, chunkLexed } from './util/lexer.js';

import OraType from './util/DataTypes.js';

import {
	customFunctionContainer,
	customFunction as oraFunction,
	customKeyword as oraKeyword,
	customExtension as oraExtension,
	extensionPack as oraExtensionPack,
	valueProcessor,
	valuePreProcessor,
	valuePostProcessor,
} from './util/extensions.js';

import VariableObserver from './_observer.js';

const isNum = num => !isNaN(num);
const isA_0 = x => x != undefined && /[a-z0-9_]/i.test(x);

function getValue(variable, property) {
  if (variable instanceof OraType.any)
    variable = variable.value;

  if (property != null) {
    if (Array.isArray(property))
      return getValue(variable?.[property.shift()], property.length > 0 ? property : undefined);

    return getValue(variable?.[property]);
  }

  return variable;
}

class OraScopeVariables {};

class OraScope {
	parent;
	data = {};
	variables = new OraScopeVariables;

	constructor (parent, { data, variables } = {}){
		this.parent = parent;

		if (typeof data == 'object')
			this.data = data;

		if (typeof variables == 'object')
			this.variables = variables;
	}
}

class sleepObserver extends VariableObserver {
	validate (newValue){
		return typeof newValue == 'boolean';
	}
}

export default class Ora {
	settings = {};
	customKeywords;
	customFunctions;

	//* Attributes *//
	variables;
	classes;
	functions;
	mainScope = new OraScope(this);

	utils = {
		chunkLexed,
		isA_0,
		isNum,
		forceType,
		evalMath
	}

	DataType = OraType;

	paused = new sleepObserver(false);

	constructor (settings = {}) {
		const {
			functions: customFunctions,
			customClasses,
			customTypes,
			keywords: customKeywords,
			extensions,
			variables,
		} = forceType.forceObject(settings);

		this.utils.parseInput = this.parseInput;

		if (typeof customTypes == 'object')
			this.DataType = { ...this.DataType, ...customTypes };

		this.init({
			customFunctions,
			classes: customClasses,
			extensions,
			customKeywords,
			variables
		});
	}

	iterable (...args){
		return new betterIterable(...args);
	}

	init (initData){
		let {
			customKeywords: initKW,
			customFunctions: initFN,
			classes,
			extensions: initExtensions,
			variables
		} = initData;

		const extensions = forceType.forceArray(initExtensions);
		const customKeywords = forceType.forceArray(initKW);
		const customFunctions = forceType.forceArray(initFN);

		if (Array.isArray(initData.customFunctions))
			customFunctions.push(...initData.customFunctions);

		this.keywords = new keywordDict();
		this.customKeywords = customKeywords;
		this.customFunctions = customFunctions;

		this.valueProcessors = [];
		this.valuePreProcessors = [];
		this.valuePostProcessors = [];

		{
			const finder = e => e instanceof oraExtensionPack;
			while (extensions.some(finder)){
				const item = extensions.find(finder);
				const index = extensions.indexOf(item);

				extensions.splice(index, 1, ...item);
			}
		}

		// Handle Extensions
		if (extensions.some(e => e instanceof oraExtension != true))
			throw 'Invalid extension input';

		for (const extension of extensions){
			if (extension.keyword && customKeywords.includes(extension.keyword) != true)
				customKeywords.push(extension.keyword);
			
			if (extension.function && customFunctions.includes(extension.function) != true)
				customFunctions.push(extension.function);

			if (extension.processors){
				for (const processor of extension.processors){
					if (processor instanceof valuePreProcessor)
						this.valuePreProcessors.push(processor);

					else if (processor instanceof valuePostProcessor)
						this.valuePostProcessors.push(processor);

					else if (processor instanceof valueProcessor)
						this.valueProcessors.push(processor)
				}
			}
		}

		// Handle Keywords
		if (customKeywords.some(e => e instanceof oraKeyword != true))
			throw 'Invalid custom keyword';

		for (const customKW of customKeywords)
			this.keywords.addKeyword(
				...customKW.bound(this)
			);


		// Handle variables and classes
		this.variables = forceType.forceObject(variables);
		this.classes = forceType.forceObject(classes);

		const { keywords: kw } = this;
		const parseInput = this.parseInput.bind(this);

		let mappedFunctions = {};

		if (Array.isArray(customFunctions)){
			if (customFunctions.some(e => e instanceof customFunctionContainer != true && e instanceof oraFunction != true))
				throw 'Invalid custom function input';

			mappedFunctions = Object.assign({}, ...customFunctions.map(custom => custom.bound(this)));
		}

		this.functions = {
			[kw.id.delete] ({ iter, scope }) {
				const source = iter.disposeIf(next => kw.is(next, kw.id.global)) ? this.variables : scope.variables;
				const varname = iter.next().value;

				if (kw.has(varname)) kw.deleteKeyword(varname);

				if (isA_0(varname))
					this.setOnPath({
						source,
						path: [varname, ...this.getPath({ iter, scope })],
						$delete: true
					});

				else throw `Invalid Variable Name: (${varname})`;
			},

			[kw.id.for] ({ iter, scope, handleItems, maxCalls = 100 }) {
				const input = iter.next();
				const items = [...iter];
				let calls = 0;

				while (val = parseInput(iter, input, scope) == true) {
					if (calls++ >= maxCalls) return console.error('Call Stack Exceeded Maximum Amount');

					handleItems(
						new betterIterable(items, { tracking: true })
					);
				}
			},

			[kw.id.if] ({ iter, scope, handleItems }) {
				if (iter.disposeIf('(')){
					const toCheck = [parseInput(iter, iter.next(), scope)];

					while (iter.disposeIf(next => kw.is(next, kw.id.and)) && isA_0(iter.peek().value))
						toCheck.push( parseInput(iter, iter.next(), scope) );

					if (!iter.disposeIf(')'))
						throw new Error('Expected ")" to close BIND statement!');

					if (toCheck.some(val => val != true)){

						return parseBlock({ iter });
					};
				}
				else throw new Error('Expected "(" to open IF statement!');

					
				handleItems(
					new betterIterable(
						parseBlock({ iter, scope }), // Items
						{ tracking: true }
					),
					scope
				)
			},

			[kw.id.class] ({ iter, scope }) {
				const className = iter.next().value;
				const items = [];

				for (const item of iter) items.push(item);

				if (isA_0(className))
					scope.classes[className] = { items, scope };
			},


			...mappedFunctions,
		}

		this.functions = Object.fromEntries(
			Object.entries(this.functions).map(([keywordID, func]) => [keywordID, func.bind(this)])
		);

		delete this.init;
	}

	includesFunction = name => this.dictionary.find($ => $[0].includes(name)) != null;
	
	createScope (data, variables){
		return new OraScope(this, { data, variables });
	}

	setOnPath ({ source, path, value, type = OraType.any, $delete = false }) {
		if (!Array.isArray(path) || !path?.length) return;

		for (const sub of path.slice(0, path.length - 1)){
			// Scaffolding a new object if nothing
			source[sub] ??= {};

			source = source instanceof OraType.any ? source.value?.[sub] : source[sub];
		}

		const p = path[
			path.length > 1 ? path.length - 1 : 0
		];

		if ($delete === true){
			if (source instanceof OraType.any)
				delete source.value?.[p];

			else delete source?.[p];

			return;
		}

		source[p] ??= new type(value);

		if (source[p] instanceof OraType.any != true)
			throw 'aoiudahujdawiufdhugrrii 🎟🎭🎟🎉👔👕';

		const valueType = source[p]?.constructor;

		if (valueType != type && valueType != this.valueToType(value))
			throw new Error(`[Ora] Cannot Change Type on (${path.join('.')}) from [${this.typeToKeyword(source[p]?.constructor)}] to [${this.typeToKeyword(type)}]`);

		source[p] = new type(value);
		
		if (value == undefined) delete source[p];
	}

	typeToKeyword (type){
		switch (true){
			case type === OraType.object: return 'OBJECT';
			case type === OraType.array:  return 'ARRAY';
			case type === OraType.string: return 'STRING';
			case type === OraType.number: return 'NUMBER';
			case type === OraType.bool:   return 'BOOLEAN';
			default: return 'ANY';
		}
	}

	valueToType (value){
		switch (true){
			case Array.isArray(value):      return OraType.array;
			case typeof value == 'object':  return OraType.object;
			case typeof value == 'string':  return OraType.string;
			case typeof value == 'number':  return OraType.number;
			case typeof value == 'boolean': return OraType.bool;
			default: return OraType.any;
		}
	}

	keywordToType (value) {
		const { keywords: kw } = this;
		const kIs = (key) => kw.is(value, kw.id[key]);

		switch (true){
			case kIs('true'):   return OraType.bool;
			case kIs('false'):  return OraType.bool;
			case kIs('string'): return OraType.string;
			case kIs('object'): return OraType.object;
			case kIs('array'):  return OraType.array;
			case kIs('number'): return OraType.number;

			default: return OraType.any;
		}
	}

	getPath ({ iter, scope }){
		const path = [];

		const cylce = () => {
			if (iter.disposeIf('.')){
				const next = iter.next().value;
				const parsed = this.parseValueBasic(iter, next, scope);

				if (Array.isArray(parsed))
					path.push(...parsed.filter(isA_0));

				else if (isA_0(parsed))
					path.push(parsed);

				cylce();
			}
		}

		cylce();

		return path;
	}

	expectSetVar ({ iter, scope, data }, arrayForce = true){
		let varData = this.parseInput(iter.clone(), iter.peek(1), scope);

		if (arrayForce)
			varData = forceType.forceArray(varData);

		const name = iter.next().value;

		if (data.functions.hasOwnProperty(name))
			throw `Cannot set variable to function name: ${name}`;

		return {
			name,
			path: [name, ...this.getPath({ iter, scope })],
			data: varData
		}
	}

	parseValueBasic (iter, value, scope = {}){
		for (const processor of this.valuePreProcessors)
			if (processor.validate.bind(this)({ iter, value, scope }) === true){
				const processed = processor.parse.bind(this)({ iter, value, scope });

				if (processor.immediate)
					return processed;

				else value = processed;
			}

		if (isString(value))
			return parseString(value);

		if (value == '{'){
			const object = {};

			let tries = 0;

			while (true){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an object');
				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				const key = iter.next();
				if (key.value == undefined || key.value == '}') break;

				const path = [key.value];

				while (iter.disposeIf('.') && isA_0(iter.peek().value))
					path.push( iter.next().value );

				this.setOnPath({
					source: object,
					path,
					value: this.parseValue(
						iter,
						(iter.disposeIf(':') ? iter.next() : key).value,
						scope
					)
				});
			}

			return this.parseInputToVariable(iter, { }, { variables: object });
		}

		if (value == '['){
			const array = [];
			let tries = 0;

			while (!iter.disposeIf(']')){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an array');
				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				const nextItem = iter.next();

				if (nextItem.value == undefined) break;

				array.push(
					this.parseValue(iter, nextItem.value, scope)
				);
			}

			return array;
		}

		if (this.keywords.is(value, this.keywords.id.function)){
			const args = [];
			let functionName = false;
			
			const peekNext = iter.peek().value;

			if (isA_0(peekNext)){
				iter.next();
				functionName = isString(peekNext) ? parseString(peekNext) : peekNext;
			}

			if (iter.disposeIf('(')){
				let passes = 0;
		
				while (!iter.disposeIf(')')){
					if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

					args.push(iter.next().value);
					
					if (passes++ > 100) return console.error(new Error('Cannot add more than 100 args on a function'));
				}
			}
			else throw new Error('Missing Opening \'(\' after parameters');

			const items = parseBlock({ iter, scope });

			const handleItems = this.handleItems.bind(this);
			const parseInput = this.parseInput.bind(this);

			const temp = {
				[functionName] (...inputs){
					const variables = {};

					for (const [key, value] of Object.entries(scope.variables))
						variables[key] = value;

					for (const [i, value] of Object.entries(args)) {
						if (['object', 'function'].includes(typeof inputs[i]))
							variables[value] = inputs[i];

						else variables[value] = parseInput(
							new betterIterable([], { tracking: true }),
							{ value: inputs[i] },
							scope
						);
					}

					return handleItems(
						new betterIterable(items, { tracking: true }),
						{
							functions: scope.functions,
							variables
						}
					);
				}
			}

			if (functionName != false){
				this.setOnPath({
					source: scope.variables,
					path: [functionName],
					value: temp[functionName]
				})
			}

			return temp[functionName];
		}

		if (isNum(value))
			return Number(value);

		if (isA_0(value))
			return value;
	}

	parseNext (iter, scope){
		return this.parseValue(iter, iter.next().value, scope);
	}

	parseValue (iter, value, scope = {}) {
		const { variables } = scope;
		const { keywords: kw, functions } = this;

		const extendedPath = this.getPath({ iter, scope });
		const path = [value, ...extendedPath];

		const feedProcessor = { iter, value, scope, path, extendedPath };

		for (const processor of this.valueProcessors)
			if (processor.validate.bind(this)(feedProcessor) === true){
				const processed = processor.parse.bind(this)(feedProcessor);

				if (processor.immediate) return processed;
				else value = processed;
			}

		if (isA_0(value) && variables.hasOwnProperty(value))
			return this.parseInputToVariable(iter, { value }, scope);

		const basicRes = this.parseValueBasic(iter, value, scope);
		if (basicRes != null) return basicRes;

		if (kw.has(value) && functions.hasOwnProperty(kw.match(value)))
			return functions[kw.match(value)]({
				iter,
				scope,
				handleItems: this.handleItems.bind(this)
			});
		
		return value;
	}

	parseInputToVariable (iter, input, scope, functions = true) {
		const { parseInput, keywords: kw } = this;
		const { variables = {} } = scope;
		const { value } = input;

		const scaleTree = ({ source, property }) => {
			let scopeV = getValue(source, property);

			const isClass = scopeV?.prototype?.constructor?.toString()?.substring(0, 5) === 'class';

			if (!isClass && typeof scopeV == 'function' && typeof scopeV?.bind == 'function')
				scopeV = scopeV?.bind(source);

			if (iter.disposeIf(next => kw.is(next, kw.id.bind))){
				if (typeof scopeV == 'function' && !isClass){
					scopeV = scopeV.bind(
						forceType.forceObject(
							parseInput(iter, iter.next(), scope)
						)
					);
				}
				else if (typeof scopeV == 'object'){
					if (iter.disposeIf('(')){
						const toBind = [];
						let passes = 0;

						while (!iter.disposeIf(')')){
							if (iter.disposeIf(',')) continue;

							toBind.push(
								parseInput(iter, iter.next(), scope)
							);
							
							if (passes++ > 100)
								return console.error(
									new Error('Cannot run more than 100 args on a function')
								);
								
							if (iter.peek(1).value == undefined) break;
						}

						scopeV = Object.assign(scopeV, ...toBind);
					}
					else scopeV = Object.assign(scopeV, 
						forceType.forceObject(
							parseInput(iter, iter.next(), scope, false)
						)
					);
				}
			}
			

			//* Try Looping on path
			if (iter.disposeIf('.')){
				return scaleTree({
					source: scopeV,
					property: this.parseValue(iter, iter.next().value, scopeV)
				});
			}

			// //* Updating variable if assignment operator comes after
			// if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
			// 	if (property != undefined)
			// 		this.setOnPath({
			// 			source,
			// 			path: [property],
			// 			value: this.parseInput(iter, iter.next(), scope)
			// 		});
			// 	else throw 'Cannot mod a raw variable to a value!'
					
			// 	return source;
			// }

			// Scope Fix
			if (typeof scopeV?.value === 'function') scopeV = scopeV.value;

			// Try Calling Function
			if (functions && iter.disposeIf('(')){
				// Validate Function
				if (!(typeof scopeV === 'function' || isClass)){
					// Fail Function
					console.error('Cannot call function on non-function', property,
						'\n',
						iter.stack
					);

					return;
				}

				const items = [];
				let passes = 0;
		
				while (!iter.disposeIf(')')){
					if (iter.disposeIf(',')) continue;

					items.push(this.parseNext(iter, scope));
					
					if (passes++ > 100)
						return console.error(
							new Error('Cannot run more than 100 args on a function')
						);
						
					if (iter.peek(1).value == null) break;
				}

				return scaleTree({
					source: isClass ? new scopeV(...items) : scopeV(...items)
				});
			}


			//* Return Result
			if (scopeV != undefined) return scopeV?.hasOwnProperty('value') ? scopeV.value : scopeV;
		}
		
		return scaleTree({
			source: variables,
			property: value
		});
	}

	trueValueEntryMap (key, value){
		return [key, this.trueValue(value)];
	}

	trueValue (input){
		if (input instanceof OraType.any)
			input = input.value;

		if (Array.isArray(input))
			input = input.map(item => this.trueValue(item));

		else if (typeof input == 'object')
			input = Object.fromEntries(
				Object.entries(input).map(e => this.trueValueEntryMap(...e))
			);

		return input;
	}

	parseInput (iter, input, scope = {}) {
		const { keywords: kw } = this;

		const mathSymbols = {
			[kw.id.add]: '+',
			[kw.id.subtract]: '-',
			[kw.id.multiply]: '*',
			[kw.id.divide]: '/',
		};

		const getValue = (iterIn) => this.parseValue(iter, iterIn.value, scope); 

		let result = getValue(input);

		const handleProcessors = () => {
			let canGoAgain = false;
			
			for (const processor of this.valuePostProcessors){
				if (processor.validate.bind(this)({ iter, value: result, scope }) === true){
					const processed = processor.parse.bind(this)({ iter, value: result, scope });

					if (processed != null){
						if (processor.immediate) return processed;
						else result = processed;

						canGoAgain = true;
					}
				}
			}

			if (canGoAgain) handleProcessors();
		}

		console.log('HANDLE RESULT', handleProcessors())

		while (mathSymbols.hasOwnProperty(kw.matchUnsafe(iter.peek().value))) {
			const symbol = mathSymbols[kw.matchUnsafe(iter.next().value)];
			const value = getValue(iter.next());

			if (typeof result == 'string')
				switch (symbol){
					case '+': result = result.concat(value); break;
					case '-': result = result.replace(value, ''); break;
					case '*': throw 'Not a feature yet';
					case '/': result = result.replaceAll(value, ''); break;
				}

			if (typeof result == 'number')
				result = evalMath(`${result} ${symbol} ${value}`);

			// For Arrays
			else if (Array.isArray(result))
				for (let i = 0; i < result.length; i++)
					result[i] = evalMath(`${result[i]} ${symbol} ${value}`);

			// For Objects
			else if (typeof result == 'object'){
				result = this.trueValue(result);

				for (const key of Object.keys(result))
					result[key] = evalMath(`${result[key]} ${symbol} ${value}`);
			}
		}

		// if (iter.disposeIf(next => kw.is(next, kw.id.as))) {
		// 	if (iter.disposeIf(next => kw.is(next, kw.id.array))) {
		// 		if (typeof result == 'string')
		// 			result = result.split('');
		// 	}

		// 	else if (iter.disposeIf(next => kw.is(next, kw.id.string))) {
		// 		if (Array.isArray(result))
		// 			result = result.join('');

		// 		else if (typeof result == 'object')
		// 			result = JSON.stringify(result);
		// 	}
		// }

		//* String repeater
		if (iter.disposeIf(next => kw.is(next, kw.id.multiply))) {
			if (typeof result === 'string')
				result = result.repeat(
					// Size (if item isn't a number it will fallback to blank text)
					this.parseNext(iter, scope)
				);
		}

		//* Power Of
		if (iter.disposeIf(next => kw.is(next, kw.id.power))) {
			const size = forceType.forceNumber(
				this.parseNext(iter, scope)
			);

			if (Array.isArray(result)) {
				let newRes = [];

				for (let i = 0; i < size; i++)
					newRes = [...newRes, ...result];

				result = newRes;
			}

			else if (typeof result === 'number')
				result = Math.pow(result, size);
		}

		//* Using
		if (iter.disposeIf(next => kw.is(next, kw.id.using))) {
			const list = getValue(iter.next());

			if (!Array.isArray(list))
				throw new Error('Cannot Take From Object Without List Of Items To Take From');

			return Object.fromEntries(
				Object.entries(result).filter(([key]) => list.includes(key))
			);
		}

		//* Equals
		if (iter.disposeIf(next => kw.is(next, kw.id.equals)))
			return result == getValue(iter.next());

		//* Has
		if (iter.disposeIf(next => kw.is(next, kw.id.has))) {
			const nextValue = getValue(iter.next());

			switch (typeof result) {
				case 'string': return result.includes(nextValue);
				case 'object': return Array.isArray(result) ? result.includes(nextValue) : result.hasOwnProperty(nextValue);
				case 'number': return typeof nextValue == 'number' && result >= nextValue;
				default:       return false;
			}
		}

		if (iter.disposeIf(next => kw.is(next, kw.id.jsver)))
			return this.trueValue(result);

		return result;
	};

	handleItems (iter, scope = this.mainScope) {
		const { functions } = this;
		const { keywords: kw } = this;

		for (const method of iter) {
			if (!kw.has(method) || !functions.hasOwnProperty(kw.match(method))){
				
				// if (variables?.hasOwnProperty(method))
					this.parseInput(iter, { value: method }, scope);
				
				continue;
			}

			const response = functions[kw.match(method)]({
				iter,
				scope,
				handleItems: this.handleItems.bind(this)
			});
			
			if (response?.break == true) break;
			if (response) return response;
		}
	}

	run (codeInput){
		const lexed = oraLexer(codeInput);
		const chunks = chunkLexed(lexed);

		const chunkRes = this.#handleChunks(chunks);

		if (chunkRes) return chunkRes;
	}

	#handleChunks (chunks){
		let parsed = 0;

		for (const chunk of chunks){
			if (this.paused.value){
				this.paused.once(() => this.#handleChunks(chunks.slice(parsed, chunks.length)));
				break;
			}
			
			const response = this.handleItems(
				new betterIterable(
					chunk,
					{ tracking: true }
				)
			);

			if (response?.exit == true) return response?.value;
			
			parsed++;
		}
	}

	reInstance (){
		return new Ora({
			functions: this.customFunctions,
			keywords: this.customKeywords,
			settings: this.settings
		});
	}
}
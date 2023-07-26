import betterIterable from './util/betterIterables.js';
import evalMath from './util/evalMath.js';
import { keywordDict } from './util/keyword.js';
import { forceType, isNum, isA_0 } from './util/forceType.js';
import { isString, parseString, parseBlock } from './util/parseTools.js';
import { oraLexer, chunkLexed } from './util/lexer.js';

import defaultFunctions from './util/functions/default.js';

import OraType from './util/DataTypes.js';
import { customFunctionContainer, customFunction, customKeyword } from './util/extensions.js';

function getValue (variable, property){
	if (variable instanceof OraType.any)
		variable = variable.value;

	if (property != null){

		if (Array.isArray(property)){
			if (variable.hasOwnProperty(property[0])){
				return getValue(variable[property.shift()], property.length > 0 ? property : undefined);
			}
			
			return undefined;
		}
		
		if (variable.hasOwnProperty(property))
			return getValue(variable[property]);

		return undefined;
	}

	return variable;
}

class Ora {
	settings = {};
	customKeywords;
	customFunctions;

	//* Attributes *//
	variables;
	classes;
	functions;

	utils = {
		chunkLexed,
		isA_0,
		isNum,
		forceType,
		evalMath
	}

	DataType = OraType;

	constructor (settings = {}) {
		const {
			functions: customFunctions,
			customClasses,
			customTypes,
			keywords: customKeywords,
			variables
		} = forceType.forceObject(settings);

		this.utils.parseInput = this.parseInput;

		if (typeof customTypes == 'object')
			this.DataType = { ...this.DataType, ...customTypes };

		this.init({
			customFunctions,
			classes: customClasses,
			customKeywords,
			variables
		});
	}

	iterable (...args){
		return new betterIterable(...args);
	}

	init (initData){
		const {
			customFunctions, classes, customKeywords,
			variables
		} = initData;

		this.keywords = new keywordDict();
		this.customKeywords = customKeywords;
		this.customFunctions = customFunctions;


		if (Array.isArray(customKeywords)){
			if (customKeywords.some(e => e instanceof customKeyword != true))
				throw 'Invalid custom keyword';


			for (const custom of customKeywords)
				this.keywords.addKeyword( ...custom.bound(this) );
		}

		this.variables = forceType.forceObject(variables);
		this.classes = forceType.forceObject(classes);

		const { keywords: kw } = this;
		const parseInput = this.parseInput.bind(this);

		let mappedFunctions = {};


		if (Array.isArray(customFunctions)){
			if (customFunctions.some(e => e instanceof customFunctionContainer != true && e instanceof customFunction != true))
				throw 'Invalid custom function input';

			mappedFunctions = Object.assign({}, ...customFunctions.map(custom => custom.bound(this)));
		}

		this.functions = {
			...defaultFunctions.bind(this)(),

			[kw.id.delete] ({ iter, data }) {
				const source = iter.disposeIf(next => kw.is(next, kw.id.global)) ? this.variables : data.variables;
				const varname = iter.next().value;

				if (kw.has(varname)) kw.deleteKeyword(varname);

				if (isA_0(varname))
					this.setOnPath({
						source,
						path: [varname, ...this.getPath({ iter, data })],
						$delete: true
					});

				else throw `Invalid Variable Name: (${varname})`;
			},

			[kw.id.for] ({ iter, data, handleItems, maxCalls = 100 }) {
				const input = iter.next();
				const items = [...iter];
				let calls = 0;

				while (val = parseInput(iter, input, data) == true) {
					if (calls++ >= maxCalls) return console.log('Call Stack Exceeded Maximum Amount');

					handleItems(
						new betterIterable(items, { tracking: true })
					);
				}
			},

			[kw.id.if] ({ iter, data, handleItems }) {
				if (iter.disposeIf('(')){
					const toCheck = [parseInput(iter, iter.next(), data)];

					while (iter.disposeIf(next => kw.is(next, kw.id.and)) && isA_0(iter.peek().value))
						toCheck.push( parseInput(iter, iter.next(), data) );

					if (!iter.disposeIf(')'))
						throw new Error('Expected ")" to close BIND statement!');

					if (toCheck.some(val => val != true)){
						return parseBlock(iter);
					};
				}
				
				else throw new Error('Expected "(" to open IF statement!');
					
				handleItems(
					new betterIterable(
						parseBlock({ iter, data }), // Items
						{ tracking: true }
					),
					data
				)
			},

			[kw.id.class] ({ iter, data }) {
				const className = iter.next().value;
				const items = [];

				for (const item of iter) items.push(item);

				if (isA_0(className)) data.classes[className] = { items, data };
			},

			[kw.id.function] ({ iter, data, handleItems }) {
				const path = [iter.next().value];

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );

				const args = [];

				if (iter.disposeIf('(')){
					let passes = 0;
			
					while (!iter.disposeIf(')')){
						if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;
	
						args.push(iter.next().value);
						
						if (passes++ > 100) return console.error(new Error('Cannot add more than 100 args on a function'));
					}
				}

				const items = parseBlock({ iter, data });

				const func = (...inputs) => {
					const variables = {};

					for (const [key, value] of Object.entries(data.variables))
						variables[key] = value;

					for (const [i, value] of Object.entries(args)){
						if (['object', 'function'].includes(typeof inputs[i]))
							variables[value] = inputs[i];

						else variables[value] = parseInput(
							new betterIterable([], { tracking: true }),
							{ value: inputs[i] },
							data
						);
					}

					return handleItems(
						new betterIterable(items, { tracking: true }),
						{
							functions: data.functions,
							variables
						}
					)
				}

				this.setOnPath({
					source: data.variables,
					path,
					value: func
				});
			},


			...mappedFunctions,
		}

		this.functions = Object.fromEntries(
			Object.entries(this.functions).map(([keywordID, func]) => [keywordID, func.bind(this)])
		);

		delete this.init;
	}

	includesFunction = name => this.dictionary.find($ => $[0].includes(name)) != null;

	handleItems (iter, data = this) {
		const { functions, variables } = data;
		const { keywords: kw } = this;

		for (const method of iter) {
			if (!kw.has(method) || !functions.hasOwnProperty(kw.match(method))){
				if (variables?.hasOwnProperty(method))
					this.parseInput(iter, { value: method }, data);
				
				continue;
			}

			const response = functions[kw.match(method)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});
			
			if (response?.break == true) break;
			if (response) return response;
		}
	}

	setOnPath ({ source, path, value, type = OraType.any, $delete = false }) {
		if (!Array.isArray(path) || !path?.length) return;

		for (const sub of path.slice(0, path.length - 1))
			source = source instanceof OraType.any ? source.value?.[sub] : source[sub];

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

		if (!source[p] instanceof OraType.any)
			throw 'aoiudahujdawiufdhugrrii 🎟🎭🎟🎉👔👕';

		if (source[p]?.constructor != type)
			throw new Error(`[Ora] Cannot Change Type on (${path.join('.')}) from [${this.typeToKeyword(source[p]?.constructor)}] to [${this.typeToKeyword(type)}]`);

		source[p] = new type(value);
		
		if (value == undefined) delete source[p];
	}

	typeToKeyword (type){
		switch (true){
			case type === OraType.object: return 'OBJECT';
			case type === OraType.array: return 'ARRAY';
			case type === OraType.string: return 'STRING';
			case type === OraType.number: return 'NUMBER';
			case type === OraType.bool: return 'BOOLEAN';

			default: return 'ANY';
		}
	}

	valueToType (value){
		switch (true){
			case Array.isArray(value): return OraType.array;
			case typeof value == 'object': return OraType.object;
			case typeof value == 'string': return OraType.string;
			case typeof value == 'number': return OraType.number;
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

	getPath ({ iter, data }){
		const path = [];

		const cylce = () => {
			if (iter.disposeIf('.')){
				const next = this.parseValueBasic(iter, iter.next().value, data);

				if (Array.isArray(next))
					path.push(...next.filter(isA_0));

				else if (isA_0(next))
					path.push(next);

				cylce();
			}
		}

		cylce();

		return path;
	}

	expectSetVar ({ iter, data }, arrayForce = true){
		let varData = this.parseInput(iter.clone(), iter.peek(1), data);

		if (arrayForce)
			varData = forceType.forceArray(varData);

		const name = iter.next().value;
		const path = [name, ...this.getPath({ iter, data })];

		if (data.functions.hasOwnProperty(name))
			throw `Cannot set variable to function name: ${name}`;

		return {
			name,
			path,
			data: varData
		}
	}

	parseValueBasic (iter, value, data = {}){
		if (isString(value)) return parseString(value);

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
						data
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
					this.parseValue(iter, nextItem.value, data)
				);
			}

			return array;
		}

		if (isNum(value)) return Number(value);

		if (isA_0(value)) return value;
	}

	parseValue (iter, value, data = {}) {
		const { variables = {} } = data;
		const { keywords: kw, functions } = this;

		if (isA_0(value) && variables.hasOwnProperty(value))
			return this.parseInputToVariable(iter, { value }, data);

		const basicRes = this.parseValueBasic(iter, value, data);
		if (basicRes != null) return basicRes;

		if (kw.has(value) && functions.hasOwnProperty(kw.match(value)))
			return functions[kw.match(value)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});

		if (value === 'CURRENT_DATE') return Date.now();

		return value;
	}

	parseInputToVariable (iter, input, data = {}, functions = true) {
		const { parseInput, keywords: kw } = this;
		const { variables = {} } = data;
		const { value } = input;

		const scaleTree = ({ source, property }) => {
			let scopeV = getValue(source, property);

			const isClass = scopeV?.prototype?.constructor?.toString()?.substring(0, 5) === 'class';

			if (!isClass && typeof scopeV == 'function' && typeof scopeV?.bind == 'function')
				scopeV = scopeV?.bind(source);

			if (iter.disposeIf(next => kw.is(next, kw.id.bind))){
				if (typeof scopeV == 'function' && !isClass){
					const toBind = forceType.forceObject(
						parseInput(iter, iter.next(), data)
					);
					
					scopeV = scopeV.bind(toBind);
				}
				else if (typeof scopeV == 'object'){
					if (iter.disposeIf('(')){
						const toBind = [];
						let passes = 0;

						while (!iter.disposeIf(')')){
							if (iter.disposeIf(',')) continue;

							toBind.push(
								parseInput(iter, iter.next(), data)
							);
							
							if (passes++ > 100)
								return console.error(
									new Error('Cannot run more than 100 args on a function')
								);
								
							if (iter.peek(1).value == undefined) break;
						}

						scopeV = Object.assign(scopeV, ...toBind);
					}
					else {
						const toBind = forceType.forceObject(
							parseInput(iter, iter.next(), data, false)
						);

						scopeV = Object.assign(scopeV, toBind);
					}
				}
			}
			

			//* Try Looping on path
			if (iter.disposeIf('.')){
				const property = this.parseValue(iter, iter.next().value, scopeV);

				return scaleTree({
					source: scopeV,
					property
				});
			}

			// //* Updating variable if assignment operator comes after
			// if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
			// 	if (property != undefined)
			// 		this.setOnPath({
			// 			source,
			// 			path: [property],
			// 			value: parseInput(iter, iter.next(), data)
			// 		});
			// 	else throw 'Cannot mod a raw variable to a value!'
					
			// 	return source;
			// }

			//* Scope Fix
			if (typeof scopeV?.value === 'function') scopeV = scopeV.value;

			//* Try Calling Function
			if (functions && iter.disposeIf('(')){
				//* Validate Function
				if (!(typeof scopeV === 'function' || isClass)){
					//* Fail Function
					console.error('Cannot call function on non-function', property,
						'\n',
						iter.stack()
					);

					return;
				}

				const items = [];
				let passes = 0;
		
				while (!iter.disposeIf(')')){
					if (iter.disposeIf(',')) continue;

					items.push(
						parseInput(iter, iter.next(), data)
					);
					
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

	parseInput (iter, input, data = {}) {
		const { keywords: kw } = this;

		const mathSymbols = {
			[kw.id.add]: '+',
			[kw.id.subtract]: '-',
			[kw.id.multiply]: '*',
			[kw.id.divide]: '/',
		};

		const getValue = (iterIn) => this.parseValue(iter, iterIn.value, data); 

		let result = getValue(input);


		while (mathSymbols.hasOwnProperty(kw.matchUnsafe(iter.peek().value))) {
			const symbol = mathSymbols[kw.matchUnsafe(iter.next().value)];
			const value = getValue(iter.next());

			if (typeof result == 'string'){
				switch (symbol){
					case '+': result = result.concat(value); break;
					case '-': result = result.replace(value, ''); break;
					case '*': throw 'Not a feature yet';
					case '/': result = result.replaceAll(value, ''); break;
				}
			}

			if (typeof result == 'number'){
				result = evalMath(`${result} ${symbol} ${value}`);
			}

			//* For Arrays
			else if (Array.isArray(result))
				for (let i = 0; i < result.length; i++)
					result[i] = evalMath(`${result[i]} ${symbol} ${value}`);

			//* For Objects
			else if (typeof result == 'object'){
				result = this.trueValue(result);

				for (const key of Object.keys(result))
					result[key] = evalMath(`${result[key]} ${symbol} ${value}`);
			}
		}

		if (iter.disposeIf(next => kw.is(next, kw.id.as))) {
			if (iter.disposeIf(next => kw.is(next, kw.id.array))) {
				if (typeof result == 'string')
					result = result.split('');
			}

			else if (iter.disposeIf(next => kw.is(next, kw.id.string))) {
				if (Array.isArray(result))
					result = result.join('');

				else if (typeof result == 'object')
					result = JSON.stringify(result);
			}
		}


		//* Greater Than
		if (iter.disposeIf(next => kw.is(next, kw.id.greater_than)))
			result = result > getValue(iter.next());

		//* Less Than
		if (iter.disposeIf(next => kw.is(next, kw.id.less_than)))
			result = result < getValue(iter.next());

		if (iter.disposeIf(next => kw.is(next, kw.id.multiply))) {
			const size = forceType.forceNumber(
				this.parseValue(iter, iter.next().value, data)
			);

			if (typeof result === 'string')
				result = result.repeat(size);
		}

		//* Power Of
		if (iter.disposeIf(next => kw.is(next, kw.id.power))) {
			const size = forceType.forceNumber(
				this.parseValue(iter, iter.next().value, data)
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
				case 'string':
					return result.includes(nextValue);

				case 'object': {
					return Array.isArray(result) ? result.includes(nextValue) : result.hasOwnProperty(nextValue);
				}

				case 'number':
					return typeof nextValue == 'number' && result >= nextValue;

				default: return false;
			}
		}

		return result;
	};

	run (codeInput){
		const lexed = oraLexer(codeInput);
		const chunks = chunkLexed(lexed);

		for (const chunk of chunks){
			const response = this.handleItems(
				new betterIterable(
					chunk,
					{ tracking: true }
				)
			);

			if (response?.exit == true) return response?.value;
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


export default Ora;
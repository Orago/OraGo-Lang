import betterIterable from './util/betterIterables.js';
import evalMath from './util/evalMath.js';
import deepClone from './util/deepClone.js';
import { keywordDict } from './util/keyword.js';
import { forceType, resolveTyped, Enum, isNum, isA_0, areSameType } from './util/forceType.js';
import { isString, parseString, parseBlock } from './util/parseTools.js';
import { oraLexer, chunkLexed } from './util/lexer.js';

import defaultFunctions from './util/defaultFunctions.js';
import loggingFunctions from './util/functions/logging.js';

function expectSetVar({ iter, data }) {
	const varData = forceType.forceArray(
		this.parseInput(iter.clone(), iter.peek(1), data)
	);

	const name = iter.next().value;
	const path = [name];

	while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
		path.push( iter.next().value );

	if (data.functions.hasOwnProperty(name))
		throw `Cannot set variable to function name: ${name}`;

	return {
		name,
		path,
		data: varData
	}
}

class Ora {
	//#region //* Attributes *//
	variables;
	classes;
	functions;

	utils = {
		chunkLexed,
		isA_0,
		isNum,
		forceType,
		evalMath,
		expectSetVar
	}
	//#endregion //* Attributes *//

	constructor (settings = {}) {
		const {
			customFunctions,
			customClasses,
			overrideFunctions,
			overrideDictionary,
			functionGenerator,
			variables
		} = forceType.forceObject(settings);

		this.settings = {};

		this.utils.parseInput = this.parseInput;

		this.init({
			functions: customFunctions,
			classes: customClasses,
			overrideFunctions,
			overrideDictionary,
			functionGenerator,
			variables
		});
	}

	iterable (...args){
		return betterIterable(...args);
	}

	init ({ functions, classes, overrideFunctions, overrideDictionary, functionGenerator, variables }){
		this.keywords = new keywordDict(overrideDictionary);

		if (typeof functionGenerator === 'function'){
			const gen = functionGenerator(this);

			if (typeof gen === 'object' && gen !== null)
				functions = { ...functions, ...gen };
		}

		this.variables = variables;
		this.classes = forceType.forceObject(classes);

		const { keywords: kw, parseInput } = this;

		this.functions = {
			...forceType.forceObject(functions),
			...defaultFunctions({ kw }),
			...loggingFunctions({ kw }),

			[kw.id.comment]: () => ({ break: true }),

			[kw.id.set]: ({ iter, data }) => {
				const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);
				const path = [iter.next().value];
				
				if (data.functions.hasOwnProperty(path[0]))
					throw `Cannot set variable to function name: ${path[0]}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);

				if (isA_0(path[0]) && iter.disposeIf(next => kw.is(next, kw.id.assign))){
					const value = parseInput(iter, iter.next(), data);

					this.setOnPath({
						source: variables,
						path,
						type: iter.disposeIf(next => kw.is(next, kw.id.as)) ? this.parseType(iter.next().value).type : 'any',
						value
					});
				}

				else throw `Invalid Variable Name: (${path[0]}), or next sequence (${iter.stack()[0]})`;
			},

			[kw.id.delete] ({ iter, data }) {
				const variables = iter.disposeIf(next => kw.is(next, kw.id.global)) ? this.variables : data.variables;
				const path = [iter.next().value];
				
				if (data.functions.hasOwnProperty(path[0]))
					throw `Cannot set variable to function name: ${path[0]}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);

				if (isA_0(path[0]))
					this.setOnPath({
						source: variables,
						path
					});

				else throw `Invalid Variable Name: (${path[0]})`;
			},

			[kw.id.for] ({ iter, data, handleItems, maxCalls = 100 }) {
				const input = iter.next();
				const items = [...iter];
				let calls = 0;

				while (val = parseInput(iter, input, data) == true) {
					if (calls++ >= maxCalls) return console.log('Call Stack Exceeded Maximum Amount');

					handleItems(
						betterIterable(items, { tracking: true })
					);
				}
			},

			[kw.id.if] ({ iter, data, handleItems }) {
				if (iter.disposeIf('(')){
					const toCheck = [parseInput(iter, iter.next(), data)];

					while (iter.disposeIf(next => kw.is(next, kw.id.and)) && isA_0(iter.peek().value))
						toCheck.push( parseInput(iter, iter.next(), data) );

					if (!iter.disposeIf(')')) throw new Error('Expected ")" to close BIND statement!');

					if (toCheck.some(val => val != true)){
						while (iter.peek()?.done != true)
							iter.next();

						return;
					};
				}
				else throw new Error('Expected "(" to open IF statement!');
					
				handleItems(
					betterIterable(
						parseBlock({ iter, data }), // Items
						{ tracking: true }
					),
					data
				)
			},

			[kw.id.return]: ({ iter: i, data }) => parseInput(i, i.next(), data),

			[kw.id.class] ({ iter, data }) {
				const className = iter.next().value;
				const items = [];

				for (const item of iter) items.push(item);

				if (isA_0(className)) data.classes[className] = { items, data };
			},

			[kw.id.function]: ({ iter, data, handleItems }) => {
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
							betterIterable([], { tracking: true }),
							{ value: inputs[i] },
							data
						);
					}

					return handleItems(
						betterIterable(items, { tracking: true }),
						{
							functions: data.functions,
							variables
						}
					)//.catch(e => console.log('Handle-Items (function) Error: ', e));;
				}

				this.setOnPath({
					source: data.variables,
					path,
					value: func
				});
			},

			[kw.id.exit]: () => process.exit(),

			[kw.id.push]: ({ iter, data }) =>  {
				const items = [parseInput(iter, iter.next(), data)];

				while (iter.disposeIf(',') && parseInput(iter.clone(), iter.peek(1), data) != null)
					items.push(
						parseInput(iter, iter.next(), data)
					);

				const nextSeq = iter.next();

				if (!nextSeq.done && kw.is(nextSeq.value, kw.id.assign) && isA_0(iter.peek(1).value)){
					const variable = expectSetVar.bind(this)({ iter, data });
					const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);

					this.setOnPath({
						source: variables,
						path: variable.path,
						value: [...variable.data, ...items]
					});
				}
			},

			[kw.id.shift]: ({ iter, data }) => {
				const variable = expectSetVar.bind(this)({ iter, data });

				variable.data.shift();
			},

			[kw.id.pop]: ({ iter, data }) => {
				const variable = expectSetVar.bind(this)({ iter, data });

				variable.data.pop();
			},

			[kw.id.await]: async ({ iter, data }) => await parseInput(iter, iter.next(), data),

			async [kw.id.sleep] ({ iter, data }) {
				const time = parseInput(iter, iter.next(), data);

				return new Promise(resolve => setTimeout(resolve, time));
			},

			[kw.id.copy]: ({ iter, data }) => {
				const variable = deepClone(parseInput(iter, iter.next(), data));

				return variable;
			},

			...forceType.forceObject(overrideFunctions),
		}

		this.functions = Object.fromEntries(
			Object.entries(this.functions).map(([keywordID, func]) => [keywordID, func.bind(this)])
		);

		delete this.init;
	}

	includesFunction = name => this.dictionary.find($ => $[0].includes(name)) != null;


	handleItems = (iter, data = this) => {
		const { functions, variables } = data;
		const { keywords: kw } = this;

		for (const method of iter) {
			if (!kw.has(method) || !functions.hasOwnProperty(kw.match(method)))
				if (variables?.hasOwnProperty(method))
					this.parseInput(iter, { value: method }, data);
				
				else continue;

			const response = functions[kw.match(method)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});
			
			if (response?.break == true) break;
			if (response) return response;
		}
	}

	setOnPath ({ source, path, value, type = 'any' }) {
		for (const sub of path.slice(0, path.length - 1)){
			if (typeof source[sub] !== 'object')
				source[sub] = { value: source[sub] };

			if (source[sub].value == null)
				delete source[sub].value;

			source = source[sub];
		}

		const p = path[
			path.length > 1 ? path.length - 1 : 0
		]

		source[p] ??= { value }

		const __type = source[p]?.__type ?? type;

		if (typeof value == 'object' && !value.hasOwnProperty('__type'))
			Object.defineProperty(value, '__type', {
				enumerable: false,
				writable: false,
				value: __type
			});

		else if (__type !== type && __type != 'any')
			throw new Error(`[Ora] Cannot Change Type on (${path.join('.')})`);

		if (__type != 'any'){
			const e = value;

			value = resolveTyped(value, type);

			if (!areSameType(e, value))
				throw new Error('Invalid Typing');
		}

		
		if (value != undefined) source[p] = value;
		else delete source[p];
	}

	parseType = (value) => {
		const { keywords: kw } = this;
		const kIs = (key) => kw.is(value, kw.id[key]);
		
		let type = 'any'

		if   	  (kIs('true')){
			type = true;
		}
		else if (kIs('false')){
			type = false;
		}
		else if (kIs('string')){
			type = '';
		}
		else if (kIs('object')){
			type = {};
		}
		else if (kIs('array')){
			type = [];
		}
		else if (kIs('null')){
			type = null;
		}
		else if (kIs('undefined')){
			type = undefined;
		}
		else if (kIs('nan')){
			type = NaN;
		}
		else if (kIs('Infinity')){
			type = Infinity;
		}
		else if (kIs('negativeInfinity')){
			type = -Infinity;
		}

		return { type };
	}

	parseValue = (iter, value, data = {}) => {
		const { variables = {} } = data;
		const { keywords: kw, functions } = this;

		if (isA_0(value) && variables.hasOwnProperty(value))
			return this.parseInputToVariable(iter, { value }, data);

		if (kw.has(value) && functions.hasOwnProperty(kw.match(value)))
			return functions[kw.match(value)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});

		else if (isString(value)) return parseString(value);

		else if (value == '{'){
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

		else if (value == '['){
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

		else if (kw.is(value, kw.id.enum)){
			if (!iter.disposeIf('{')) throw new Error('Expected "{" after ENUM');

			const enumObject = [];

			let tries = 0;

			while (!iter.disposeIf('}')){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an enum');

				if (iter.disposeIf(next => kw.is(next, kw.id.and)) && iter.disposeIfNot(isA_0)) continue;

				const key = iter.next();
				if (key.value == undefined) break;

				enumObject.push(wrapped(key.value));
			}

			return Enum(...enumObject);
		}
		
		else if (isNum(value)) return Number(value);

		return value;
	}

	parseInputToVariable (iter, input, data = {}, functions = true) {
		const { parseInput, keywords: kw } = this;

		const { variables = {} } = data;
		const { value } = input;

		const scaleTree = ({ source, property }) => {
			let scopeV;

			if (property != undefined){
				if (source[property] == undefined) source[property] = {};

				scopeV = source[property];
			}
			else scopeV = source;
				
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
			if (iter.disposeIf('.') && iter.disposeIf(isA_0))
				return scaleTree({
					source: scopeV,
					property: iter.last()
				});


			//* Updating variable if assignment operator comes after
			if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
				if (property != undefined)
					this.setOnPath({
						source,
						path: [property],
						value: parseInput(iter, iter.next(), data)
					});
				else throw 'Cannot mod a raw variable to a value!'
					
				return source;
			}

			//* Scope Fix
			if (typeof(scopeV?.value) === 'function')
				scopeV = scopeV.value;


			//* Try Calling Function
			if (functions && iter.disposeIf('(')){

				//* Validate Function
				if (typeof(scopeV) === 'function' || isClass){
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
					
					const called = isClass ? new scopeV(...items) : scopeV(...items);

					return scaleTree({
						source: called
					});
				}

				//* Fail Function
				else {
					console.error('Cannot call function on non-function', property,
						'\n',
						iter.stack()
					);

					return;
				}
			}

			//* Return Result
			else if (scopeV != undefined) return scopeV?.hasOwnProperty('value') ? scopeV.value : scopeV;
		}
		
		return scaleTree({
			property: value,
			source: variables
		});
	}

	parseInput = (iter, input, data = {}) => {
		const { keywords: kw } = this;

		const mathSymbols = {
			[kw.id.add]: '+',
			[kw.id.subtract]: '-',
			[kw.id.multiply]: '*',
			[kw.id.divide]: '/',
		};

		const wrapped = (value) => {
			value = this.parseValue(iter, value, data);
			
			if (kw.is(iter.peek().value, kw.id.add)){
				let stringResult = value;

				while (iter.disposeIf(next => kw.is(next, kw.id.add)) && iter.peek().value != null)
					stringResult += this.parseValue(iter, iter.next().value, data);

				return stringResult;
			}

			let result = value;

			mathBlock: if (isNum(value) && typeof result === 'number'){
				const total = forceType.forceNumber(isNum(value) ? value : result);
				if (total == null) break mathBlock;

				let mathString = total + '';
				
				while (mathSymbols.hasOwnProperty(kw.matchUnsafe(iter.peek().value))) {
					const symbol = mathSymbols[kw.matchUnsafe(iter.next().value)];
					const nextItem = iter.next().value;

					//* Check if `nextItem` is A number or variable
					if (isNaN(nextItem) && !isA_0(nextItem)) continue;
					
					const variable = this.parseInputToVariable(iter, { value: nextItem }, data);
					const num = forceType.forceNumber(isNum(nextItem) ? nextItem : variable);

					mathString += ` ${symbol} ${num}`;
				}

				return evalMath(mathString);
			}

			if (value === 'CURRENT_DATE') return Date.now();

			return result;
		}

		let result = wrapped(input.value);

		while (mathSymbols.hasOwnProperty(kw.matchUnsafe(iter.peek().value))) {
			const symbol = mathSymbols[kw.matchUnsafe(iter.next().value)];
			const value = wrapped(iter.next().value);

			//* For Arrays
			if (Array.isArray(result))
				for (let i = 0; i < result.length; i++)
					result[i] = evalMath(`${result[i]} ${symbol} ${value}`);


			//* For Objects
			else if (typeof result == 'object')
				for (const key of Object.keys(result))
					result[key] = evalMath(`${result[key]} ${symbol} ${value}`);
		}
		

		//* Greater Than
		if (iter.disposeIf(next => kw.is(next, kw.id.greater_than)))
			result = result > wrapped(iter.next().value);
		

		//* Less Than
		if (iter.disposeIf(next => kw.is(next, kw.id.less_than)))
			result = result < wrapped(iter.next().value);

		
		//* Power Of
		if (iter.disposeIf(next => kw.is(next, kw.id.power))){
			const size = forceType.forceNumber(
				this.parseValue(iter, iter.next().value, data)
			);

			if (Array.isArray(result))
				for (let i = 0; i < size; i++)
					result = [
						...result,
						...result
					];

			else if (typeof result === 'string')
				result = result.repeat(size);
			
			else if (typeof result === 'number')
				result = Math.pow(result, size);
		}

		//* Using
		if (iter.disposeIf(next => kw.is(next, kw.id.using))){
			const list = wrapped(iter.next().value);

			if (!Array.isArray(list))
				throw new Error('Cannot Take From Object Without List Of Items To Take From')
			
			return Object.fromEntries(
				Object.entries(result).filter(([ key ]) => list.includes(key))
			);
		}

		//* Equals
		if (iter.disposeIf(next => kw.is(next, kw.id.equals))) 
			return result == wrapped(iter.next().value);
		
		//* Has
		if (iter.disposeIf(next => kw.is(next, kw.id.has)))
			return result[typeof result == 'array' ? 'includes' : 'hasOwnProperty'](wrapped(iter.next().value));
		
		else return result;
	}

	run (codeInput){
		const lexed = oraLexer(codeInput);
		const chunks = chunkLexed(lexed);

		for (const chunk of chunks){
			const response = this.handleItems(
				betterIterable(
					chunk,
					{ tracking: true }
				)
			);

			if (response?.exit == true) return response?.value;
		}

		return this;
	}
}


export default Ora;
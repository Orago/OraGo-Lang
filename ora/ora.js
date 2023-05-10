import betterIterable from './util/betterIterables.js';
import evalMath from './util/evalMath.js';
import deepClone from './util/deepClone.js';

import {
	forceType,
	resolveTyped,
	Enum,
	isNum,
	isA_0,
	areSameType
} from './util/forceType.js';

const random = ( min = 0, max = 50 ) => Math.floor( Math.random() * ( max - min ) + min );


function oraLexer(input) {
	const output = input.match(/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g);

	if (output == null) throw 'This is a blank file!';

	while (output.indexOf(' ') != -1) output.splice(output.indexOf(' '), 1);

	return output;
}

function chunkLexed(lexed) {
	const chunks = [];
	let chunk = [];

	let scopeDepth = 0;

	for (const item of lexed){
		if (item === '{'){
			scopeDepth++;
			chunk.push(item);
			continue;
		}
		else if (item === '}'){
			scopeDepth--;
			chunk.push(item);
			continue;
		}

		if (item === ';') {
			if (scopeDepth == 0){
				chunks.push(chunk);
				chunk = [];
			}
			else chunk.push(item)
		}
		else if (item !== '\n' && item !== '\t' && item !== '\r') chunk.push(item);
	}

	return chunks;
}

const strReg = /(['"])(.*?)\1/;
const isString = input => strReg.test(input);
const parseString = input => strReg.exec(input)?.[2];



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

function parseBlock (iter){
	const items = [];

	if (!iter.disposeIf('{'))
		throw new Error('Missing Opening \'{\' after parameters');

	let openBrackets = 1;
	let closedBrackets = 0;
	
	for (const item of iter){
		if (item === '{') openBrackets++;
		else if (item === '}') closedBrackets++;

		if (item == '\r') continue;
		
		items.push(item);

		if (openBrackets == closedBrackets && openBrackets > 0) break;
	}

	if (items[items.length - 1] !== '}')
		throw new Error('Missing Closing \'}\' at end of function');

	else items.pop();

	return items;
}

function shuffleArray(arr) { // randomly rearanges the items in an array
  const result = [];
  for (let i = arr.length-1; i >= 0; i--) {
    // picks an integer between 0 and i:
    const r = Math.floor(Math.random()*(i+1));   // NOTE: use a better RNG if cryptographic security is needed
    // inserts the arr[i] element in the r-th free space in the shuffled array:
    for(let j = 0, k = 0; j <= arr.length-1; j++) {
      if(result[j] === undefined) {
        if(k === r) {
          result[j] = arr[i];    // NOTE: if array contains objects, this doesn't clone them! Use a better clone function instead, if that is needed. 
          break;
        }
        k++;
      }
    }
  }
  return result;
}

function parseArgs (iter){
	const args = [];

	if (iter.disposeIf('(')){
		let passes = 0;

		while (!iter.disposeIf(')')){
			if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

			args.push(iter.next().value);
			
			if (passes++ > 100)
				return console.error(
					new Error('Cannot add more than 100 args on a function')
				);
		}
	}

	return args;
}

const keywordDict = (input) => {
	const keywordsToParse = {
		//#region //* Commands *//
		comment: ['comment', '#'],
		set: ['set', 'let'],
		assign: ['to', '='],
		delete: ['delete'],
		print: ['print'],
		loop: ['loop'],
		for: ['for'],
		if: ['if'],
		equals: ['equals'],
		return: ['return'],
		class: ['class'],
		function: ['func'],
		exit: ['exit'],
		push: ['push'],
		pop: ['pop'],
		shift: ['shift'],
		await: ['await'],
		sleep: ['sleep'],
		and: ['and', '&'],
		from: ['from'],
		bind: ['bind'],
		as: ['as', ':'],
		has: ['has'],
		copy: ['copy'],
		using: ['using'],
		randomize: ['randomize'],
		split: ['split'],
		global: ['global'],
		//#endregion //* Commands *//

		log_variables: ['LOG_VARIABLES'],
		log_scope: ['LOG_SCOPE'],

		//#region //* Operators *//
		add: ['+'],
		subtract: ['-'],
		multiply: ['*'],
		divide: ['/'],
		power: ['^'],
		greater_than: ['>'],
		less_than: ['<'],
		//#endregion //* Operators *//

		//#region //* Types *//
		string: ['STRING'],
		number: ['NUMBER'],
		boolean: ['BOOLEAN'],
		object: ['OBJECT'],
		array: ['ARRAY'],
		enum: ['ENUM'],
		true: ['TRUE'],
		false: ['FALSE'],
		null: ['NULL'],
		undefined: ['UNDEFINED'],
		NaN: ['NAN'],
		Infinity: ['INFINITY'],
		negativeInfinity: ['NEGATIVE_INFINITY'],
		//#endregion //* Types *//
		
		...input
	};

	const keywordIDs = Enum(...Object.keys(keywordsToParse));

	const has = (search) => Object.values(keywordsToParse).some((value) => value.includes(search));

	const match = (search) => {
		const res = Object.entries(keywordsToParse).find(([key, value]) => value.includes(search));

		if (res == undefined) throw new Error(`Keyword ${search} not found in dictionary`);
		else return keywordIDs[res[0]];
	}

	const matchUnsafe = (search) => {
		const res = Object.entries(keywordsToParse).find(([key, value]) => value.includes(search));

		return res != undefined ? keywordIDs[res[0]] : null;
	}

	const is = (search, keywordID) => matchUnsafe(search) === keywordID;

	return {
		id: keywordIDs,
		match,
		matchUnsafe,
		has,
		is
	};
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

	init ({ functions, classes, overrideFunctions, overrideDictionary, functionGenerator, variables }){
		this.keywords = keywordDict(overrideDictionary);

		if (typeof functionGenerator === 'function'){
			const gen = functionGenerator(this);

			if (typeof gen === 'object' && gen !== null)
				functions = {
					...functions,
					...gen
				};
		}

		this.variables = { ...variables };

		this.classes = {
			...forceType.forceObject(classes)
		};

		const { keywords: kw, parseInput } = this;

		this.functions = {
			...forceType.forceObject(functions),

			[kw.id.comment]: () => ({ break: true }),

			[kw.id.set]: ({ iter, data }) => {
				const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);
				const path = [iter.next().value];
				
				if (data.functions.hasOwnProperty(path[0]))
					throw `Cannot set variable to function name: ${path[0]}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );

				let type = 'any';
				

				if (iter.disposeIf(next => kw.is(next, kw.id.as))){
					type = this.parseType(iter.next().value).type
				}
				
				if (isA_0(path[0]) && iter.disposeIf(next => kw.is(next, kw.id.assign))){
					const value = parseInput(iter, iter.next(), data);

					this.setOnPath({
						source: variables,
						path,
						type,
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

			[kw.id.print] ({ iter, data }) {
				const input = iter.next();
				if (!input.value) return;

				const results = [parseInput(iter, input, data)];

				while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done){
					const res = parseInput(iter, iter.next(), data);

					results.push(res);
				}

				results.length > 0 && console.log(...results);
			},

			[kw.id.loop]: ({ iter, handleItems }) => {
				const input = iter.next().value, 
							items = [...iter];

				if (!isNaN(input)) {
					const timesToRun = forceType.forceNumber(input);

					for (let i = 0; i < timesToRun; i++)
						handleItems(
							betterIterable(
								items,
								{ tracking: true }
							),
							this
						);
				}
				else throw 'Cannot Find Loop Status';
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
						parseBlock(iter);

						return;
					};
				}
				else throw new Error('Expected "(" to open IF statement!');
					
				const items = parseBlock(iter);

				handleItems(
					betterIterable(
						items,
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

				if (isA_0(className))
					data.classes[className] = { items, data };
			},

			[kw.id.log_variables]: ({ data }) => console.log('\n', `ORA LANG VARIABLES:`, '\n',  data.variables, '\n'),

			[kw.id.log_scope]: ({ data }) => console.log('\n', `ORA LANG SCOPE:`, '\n', data, '\n'),
				
			[kw.id.function]: ({ iter, data, handleItems }) => {
				const path = [iter.next().value];

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);

				const args = parseArgs(iter);
				const items = parseBlock(iter);

				const func = (...inputs) => {
					const variables = { ...data.variables };

					for (const [key, value] of Object.entries(args))
						variables[value] = (
							['object', 'function'].includes(typeof inputs[key]) ?
							inputs[key] :
							parseInput(
								betterIterable([], { tracking: true }),
								{ value: inputs[key] },
								data
							)
						);

					return handleItems(
						betterIterable(items, { tracking: true }),
						{ functions: data.functions, variables }
					);
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

		delete this.init;
	}

	includesFunction = name => this.dictionary.find($ => $[0].includes(name)) != null;


	handleItems = (iter, data = this) => {
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
			if (response)                return response;
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

			// console.log(e, value, 'poolio')

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

		if (isA_0(value) && variables.hasOwnProperty(value)){
			return this.parseInputToVariable(iter, { value }, data);
		}

		else if (isString(value)){
			return parseString(value);
		}

		else if (value == '{'){
			const object = {};

			let tries = 0;

			while (true){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an object');
				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				const key = iter.next();
				if (key.value == undefined || key.value == '}') break;

				let path = [key.value];

				while (iter.disposeIf('.') && (isA_0(iter.peek().value)))
					path.push( iter.next().value );

				path = path.map($ => isString($) ? parseString($) : $);
				

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

				array.push( this.parseValue(iter, nextItem.value, data) );
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

		else if (kw.is(value, kw.id.function)){
			const args = parseArgs(iter);

			const items = parseBlock(iter);

			const func = (...inputs) => {
				const variables = { ...data.variables };

				for (const [key, value] of Object.entries(args))
					variables[value] = (
						['object', 'function'].includes(typeof inputs[key]) ?
						inputs[key] :
						this.parseInput(
							betterIterable([], { tracking: true }),
							{ value: inputs[key] },
							data
						)
					);

				return this.handleItems(
					betterIterable(items, { tracking: true }),
					{ functions: data.functions, variables }
				);
			}

			return func;
		}

		else if (kw.has(value) && functions.hasOwnProperty(kw.match(value)))
			return functions[kw.match(value)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});
		
		else if (isNum(value)){
			return Number(value);
		}
		

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


			// //* Updating variable if assignment operator comes after
			// if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
			// 	console.log(source, property);

			// 	if (property != undefined)
			// 		this.setOnPath({
			// 			source: variables,
			// 			path: [property],
			// 			value: parseInput(iter, iter.next(), data)
			// 		});
			// 	else throw 'Cannot mod a raw variable to a value!'
					
			// 	return source;
			// }

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
		const { keywords: kw, variables } = this;

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

				while (iter.disposeIf(next => kw.is(next, kw.id.add)) && iter.peek().value != null){
					const w = this.parseValue(iter, iter.next().value, data);

					stringResult += w;
				}

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

		if (iter.disposeIf(next => kw.is(next, kw.id.as))){
			if (iter.disposeIf(next => kw.is(next, kw.id.array))){
				if (typeof result == 'string')
					result = result.split('');
			}

			else if (iter.disposeIf(next => kw.is(next, kw.id.string))){
				if (Array.isArray(result))
					result = result.join('');

				else if (typeof result == 'object')
					result = JSON.stringify(result);
			}


		}

		//* Updating variable if assignment operator comes after
		// if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
		// 	if (property != undefined)
		// 		this.setOnPath({
		// 			source: variables,
		// 			path: [property],
		// 			value: parseInput(iter, iter.next(), data)
		// 		});
		// 	else throw 'Cannot mod a raw variable to a value!'
				
		// 	return source;
		// }
		

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

			else if (typeof result === 'string'){
				const text = result;

				for (let i = 0; i < size; i++) result += text;
			}

			else if (typeof result === 'number')
				result = Math.pow(result, size);
		}


		//* Randomize
		if (iter.disposeIf(next => kw.is(next, kw.id.randomize))){
			if (Array.isArray(result)){
				result = shuffleArray(result);
			}
			else if (typeof result === 'string'){
				result = shuffleArray(result.split('')).join('');
			}

			else if (typeof result === 'number'){
				const size = forceType.forceNumber(
					this.parseValue(iter, iter.next().value, data)
				);

				result = random(result, size);
			}
		}

		
		//* Using
		if (iter.disposeIf(next => kw.is(next, kw.id.using))){
			const list = wrapped(iter.next().value);

			if (!Array.isArray(list)) throw new Error('Cannot Take From Object Without List Of Items To Take From')
			
			return Object.fromEntries(
				Object.entries(result).filter(([key, value]) => list.includes(key))
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
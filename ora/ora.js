
//#region //* UTIL *//
function betterIterable(itemsInput, settings = {}) {
	const { tracking = false, maxStack = 10 } = settings;
	const items = [...itemsInput];
	const source = items;
	let stack = [];

	return {
		source,

		*[Symbol.iterator]() {
			while (items.length > 0)
				yield this.next().value;
		},

		next(n = 0) {
			if (typeof n === 'number') for (let i = 0; i < n; i++) items.shift();

			if (tracking){
				stack.push(items[0]);
				
				stack.length > maxStack && stack.shift();
			}

			return {
				value: items.shift(),
				done: 1 > items.length
			}
		},

		peek(n = 1) {
			return { value: items[n - 1], done: 1 > items.length };
		},

		clone() {
			return betterIterable(items, settings);
		},

		push(...itemToPush) {
			items.push(itemToPush);
		},

		size() {
			return items.length;
		},

		test (check, n = 1){
			const item = items[n - 1];
			
			return (
				(typeof check === 'string' && check == item) ||
				(check instanceof Function && check(item) === true) ||
				(check instanceof RegExp   && check.test(item))
			);
		},

		disposeIf (check, n = 1) {
			const status = this.test(check, n);

			status && this.next(n - 1);

			return status;
		},

		disposeIfNot (check, n = 1){
			const status = this.test(check, n);

			!status && this.next(n - 1);

			return status;
		},

		stringify(join = ' ') {
			return items.join(join);
		},
		
		stack (){
			return stack;
		},

		last (n = 0){
			return stack[stack.length - 1 - n]
		}
	};
}

const typeEnforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();

const forceType = {
	forceNull:    $ => null,
	forceBoolean: $ => typeEnforcer(Boolean, $),
	forceNumber:  $ => typeEnforcer(Number, isNaN($) ? false : Number($)),
	forceBigInt:  $ => typeEnforcer(BigInt, $),
	forceString:  $ => typeEnforcer(String, $),
	forceObject:  $ => typeEnforcer(Object, $),
	forceArray:   $ => Array.isArray($) ? $ : []
}

const Enum = (...args) => Object.freeze(args.reduce((v, arg, i) => (v[arg] = i, v), {}));


const isNum = (num) => !isNaN(num);

const isA0  = (x) => x != undefined && /[a-z0-9]/i.test(x);
const isA_0 = (x) => x != undefined && /[a-z0-9_]/i.test(x);

const isMath = input => /^(~\w+|[\d\s+\-*/()]+)+$/.test(input);

function evalMath(mathString) {
	try {
		let applyMath = (symbol, a, b) => {
			switch (symbol) {
				case '+': return b + a;
				case '-': return b - a;
				case '*': return b * a;
				case '/': return b / a;
				case '^': return b ** a;
			}
		}

		// using a stack and a postfix notation algorithm to evaluate the math string
		const operators = ['+', '-', '*', '/', '^'];
		const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
		let stack = [];
		let postfix = [];

		for (let i = 0; i < mathString.length; i++) {
			const char = mathString[i];
			
			if (!isNaN(parseFloat(char)) || char === '.') {
				let number = char;

				while (!isNaN(parseFloat(mathString[i + 1])) || mathString[i + 1] === '.')
					number += mathString[++i];

				postfix.push(parseFloat(number));
			}
			else if (operators.indexOf(char) !== -1) {
				while (stack.length && operators.indexOf(stack[stack.length - 1]) !== -1 && precedence[char] <= precedence[stack[stack.length - 1]])
					postfix.push(stack.pop());

				stack.push(char);
			}

			else if (char === '(') stack.push(char);

			else if (char === ')') {
				while (stack[stack.length - 1] !== '(')
					postfix.push(stack.pop());

				stack.pop();
			}
		}

		while (stack.length)
			postfix.push(stack.pop());

		for (const symbol of postfix)
			stack.push(
				typeof symbol === 'number' ?
				symbol :
				applyMath(
					symbol,
					stack.pop(),
					stack.pop()
				)
			);

		return stack[0];
	}
	catch (error) {
		console.error(`Error: ${error}`);
		return NaN;
	}
}

//#endregion //* UTIL *//

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

function parseInputToVariable (iter, input, data = {}, functions = true) {
	const { parseInput, keywords: kw } = this;

	const { variables = {} } = data;
	const { value } = input;
	let parent = variables;

	const scaleTree = ({ source, property }) => {
		let scopeV;
		
		// let scopeV = (property != undefined ? source[property] : source);

		if (property != undefined){
			if (source[property] == undefined) source[property] = {};

			scopeV = source[property];
		}
		else scopeV = source;
			
			
		const isClass = scopeV?.prototype?.constructor?.toString()?.substring(0, 5) === 'class';

		if (!isClass && typeof scopeV == 'function'){
			scopeV = scopeV.bind(source);
		}

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
		
		if (iter.disposeIf('.') && iter.disposeIf(isA_0))
			return scaleTree({
				source: scopeV,
				property: iter.last()
			});

		if (iter.disposeIf(next => kw.is(next, kw.id.assign))){
			if (property != undefined) source[property] = parseInput(iter, iter.next(), data);
			else throw 'Cannot mod a raw variable to a value!'
				
			return source;
		}

		if (functions && iter.disposeIf('(')){
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
						
					if (iter.peek(1).value == undefined)
						break;
				}

				const called = isClass ? new scopeV(...items) : scopeV(...items);

				return scaleTree({
					source: called
				});
			}
			else {
				console.error('Cannot call function on non-function', property,
					'\n',
					iter.stack()
				);

				return;
			}
		}
		
		else if (scopeV != undefined)
			return scopeV?.hasOwnProperty('value') ? scopeV.value : scopeV;
	}
	
	return scaleTree({
		property: value,
		source: variables
	});
}


const setOnPath = ({ value, path, source }) => {
	for (const sub of path.slice(0, path.length - 1)){
		if (typeof source[sub] !== 'object') source[sub] = { value: source[sub] };
		if (source[sub].value == null) delete source[sub].value;

		source = source[sub];
	}

	const i = path.length > 1 ? path.length - 1 : 0;
	
	if (value != undefined) source[path[i]] = value;
	else delete source[path[i]];
}

function expectSetVar({ iter, data }) {
	const varData = forceType.forceArray(
		parseInput(iter.clone(), iter.peek(1), data)
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

const parseBlock = ({ iter }) => {
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

const keywordDict = (input) => {
	const keywordsToParse = {
		// Commands
		comment: ['COMMENT'],
		set: ['SET', 'LET'],
		assign: ['TO', '='],
		delete: ['DELETE'],
		print: ['PRINT'],
		loop: ['LOOP'],
		for: ['FOR'],
		if: ['IF'],
		equals: ['EQUALS'],
		return: ['RETURN'],
		class: ['CLASS'],
		function: ['FUNCTION'],
		exit: ['EXIT'],
		push: ['PUSH'],
		pop: ['POP'],
		shift: ['SHIFT'],
		await: ['AWAIT'],
		sleep: ['SLEEP'],
		and: ['AND', '&'],
		from: ['FROM'],
		bind: ['BIND'],

		// Operators
		add: ['+'],
		subtract: ['-'],
		multiply: ['*'],
		divide: ['/'],
		
		// types
		number: ['NUMBER'],
		string: ['STRING'],
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

		
		...input
	};

	const keywordIDs = Enum(...Object.keys(keywordsToParse));

	const has = (search) => {
		return Object.values(keywordsToParse).some((value) => value.includes(search));
	}

	const match = (search) => {
		const res = Object.entries(keywordsToParse).find(([key, value]) => value.includes(search));

		if (res == undefined) throw new Error(`Keyword ${search} not found in dictionary`);
		else return keywordIDs[res[0]];
	}

	const matchUnsafe = (search) => {
		const res = Object.entries(keywordsToParse).find(([key, value]) => value.includes(search));

		return res != undefined ? keywordIDs[res[0]] : null;
	}

	const is = (search, keywordID) => {
		return matchUnsafe(search) === keywordID;
	}

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
		setOnPath,
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
			functionGenerator
		} = forceType.forceObject(settings);

		this.settings = {};

		this.utils.parseInput = this.parseInput;

		this.init({
			functions: customFunctions,
			classes: customClasses,
			overrideFunctions,
			overrideDictionary,
			functionGenerator
		});
	}

	init ({ functions, classes, overrideFunctions, overrideDictionary, functionGenerator }){
		this.keywords = keywordDict(overrideDictionary);

		if (typeof functionGenerator === 'function'){
			const gen = functionGenerator(this);

			if (typeof gen === 'object' && gen !== null)
				functions = {
					...functions,
					...gen
				};
		}

		this.variables = {};

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
				
				if (isA_0(path[0]) && iter.disposeIf(next => kw.is(next, kw.id.assign))){
					if (false){
						
					}
					else setOnPath({
						source: variables,
						path,
						value: parseInput(iter, iter.next(), data)
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
					setOnPath({
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

			async [kw.id.if] ({ iter, data, handleItems }) {
				if (iter.disposeIf('(')){
					const toCheck = [parseInput(iter, iter.next(), data, true)];

					while (iter.disposeIf(next => kw.is(next, kw.id.and)) && isA_0(iter.peek().value))
						toCheck.push( parseInput(iter, iter.next(), data, true) );

					if (!iter.disposeIf(')')) throw new Error('Expected ")" to close BIND statement!');
					if (toCheck.some(val => val != true)) return;
				}
					
				const items = parseBlock({ iter, data });

				await handleItems(
					betterIterable(
						items,
						{ tracking: true }
					),
					data
				);
			},

			[kw.id.return]: ({ iter: i, data }) => parseInput(i, i.next(), data),


			[kw.id.class] ({ iter, data }) {
				const className = iter.next().value;
				const items = [];

				for (const item of iter) items.push(item);

				if (isA_0(className))
					data.classes[className] = { items, data };
			},

			// LOG_VARIABLES: ({ data }) => console.log('\n', `ORA LANG VARIABLES:`, '\n',  data.variables, '\n'),

			// LOG_SCOPE: ({ data }) => console.log('\n', `ORA LANG SCOPE:`, '\n', data, '\n'),
				
			[kw.id.function] ({ iter, data, handleItems }) {
				const variableName = iter.next().value;
				const path = [variableName];

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

				const items = parseBlock({iter, data});

				const func = async (...inputs) => {
					const variables = {};

					for (const [key, value] of Object.entries(data.variables))
						variables[key] = value;

					for (const [i, value] of Object.entries(args)){
						if (['object', 'function'].includes(typeof inputs[i])) variables[value] = inputs[i];
						else {
							variables[value] = parseInput(
								betterIterable([], { tracking: true }),
								{ value: inputs[i] },
								data
							);
						}
					}

					return await handleItems(
						betterIterable(items, { tracking: true }),
						{
							functions: data.functions,
							variables
						}
					);
				}

				setOnPath({
					source: data.variables,
					path,
					value: func
				});
			},

			[kw.id.exit]: () => process.exit(),

			[kw.id.push] ({ iter, data }) {
				const items = [parseInput(iter, iter.next(), data)];

				while (iter.disposeIf(',') && parseInput(iter.clone(), iter.peek(1), data) != null)
					items.push(
						parseInput(iter, iter.next(), data)
					);

				const nextSeq = iter.next();

				if (!nextSeq.done && kw.is(nextSeq.value, kw.id.assign) && isA_0(iter.peek(1).value)){
					const variable = expectSetVar({ iter, data });
					const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);

					setOnPath({
						source: variables,
						path: variable.path,
						value: [...variable.data, ...items]
					});
				}
			},

			[kw.id.shift] ({ iter, data }) {
				const variable = expectSetVar({ iter, data });

				variable.data.shift();
			},

			[kw.id.pop] ({ iter, data }) {
				const variable = expectSetVar({ iter, data });

				variable.data.pop();
			},

			[kw.id.await]: async ({ iter, data }) => await parseInput(iter, iter.next(), data),

			async [kw.id.sleep] ({ iter, data }) {
				const time = parseInput(iter, iter.next(), data);

				return new Promise(resolve => setTimeout(resolve, time));
			},

			...forceType.forceObject(overrideFunctions),
		}

		delete this.init;
	}

	includesFunction = name => this.dictionary.find($ => $[0].includes(name)) != null;

	handleItems = async (iter, data = this) => {
		const { functions, variables } = data;
		const { keywords: kw } = this;

		for (const method of iter) {
			if (!kw.has(method) || !functions.hasOwnProperty(kw.match(method))){

				if (variables?.hasOwnProperty(method))
					await this.parseInput(iter, { value: method }, data);
				
				continue;
			}

			const response = await functions[kw.match(method)]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});
			
			if (response?.break == true) break;

			if (response) return response;
		}
	}

	parseType = (value) => {
		const { keywords: kw } = this;
		const kIs = (key) => kw.is(value, kw.id[key]);
		
		let r = 'any';

		if   	  (kIs('true'))             r = true;
		else if (kIs('false'))            r = false;
		else if (kIs('object'))           r = {};
		else if (kIs('array'))            r = [];
		else if (kIs('null'))             r = null;
		else if (kIs('undefined'))        r = undefined;
		else if (kIs('nan'))              r = NaN;
		else if (kIs('Infinity'))         r = Infinity;
		else if (kIs('negativeInfinity')) r = -Infinity;

		return { type: r };
	}

	parseInput = (iter, input, data = {}) => {
		const { variables = {} } = data;
		const { keywords: kw, parseType } = this;

		const mathSymbols = {
			[kw.id.add]: '+',
			[kw.id.subtract]: '-',
			[kw.id.multiply]: '*',
			[kw.id.divide]: '/',
		};

		const wrapped = (value) => {
			const { type } = parseType(value);
			if (type !== 'any') return type;
			
			if (value == '{'){
				const object = {};

				let tries = 0;

				while (true){
					if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an object');
					if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

					const key = iter.next();
					if (key.value == undefined || key.value == '}') break;

					const path = [key.value];

					while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
						path.push( iter.next().value );

					setOnPath({
						source: object,
						path,
						value: wrapped((iter.disposeIf(':') ? iter.next() : key).value)
					});
				}

				return parseInputToVariable.bind(this)(iter, { }, { variables: object });
			}
			else if (value == '['){
				const array = [];
				let tries = 0;

				while (!iter.disposeIf(']')){
					if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an array');
					if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

					const nextItem = iter.next();

					if (nextItem.value == undefined) break;

					array.push( wrapped(nextItem.value) );
				}

				return array;
			}
			else if (isString(value)){
				let stringResult = parseString(value);


				while (iter.disposeIf(next => kw.is(next, kw.id.add)) && iter.peek(1).value != null)
					stringResult = stringResult.concat(
						wrapped(iter.next().value)
					);
				
				return stringResult;
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

			let result;

			if (isA_0(value) && variables.hasOwnProperty(value))
				result = parseInputToVariable.bind(this)(iter, { value }, data);
			

			mathBlock: {
				if (isNaN(value) && typeof result !== 'number') break mathBlock;

				const total = forceType.forceNumber(isNum(value) ? value : result);
				if (total == null) break mathBlock;

				let mathString = total + '';
				
				while (mathSymbols.hasOwnProperty(kw.matchUnsafe(iter.peek().value))) {
					const symbol = mathSymbols[kw.matchUnsafe(iter.next().value)];
					const nextItem = iter.next().value;

					if (isNaN(nextItem) && !isA_0(nextItem)) continue;

					const variable = parseInputToVariable.bind(this)(iter, { value: nextItem }, data);
					const num = forceType.forceNumber(isNum(nextItem) ? nextItem : variable);

					mathString += ` ${symbol} ${num}`;
				}

				return evalMath(mathString);
			}

			if (value === 'CURRENT_DATE') return Date.now();

			return result;
		}

		const result = wrapped(input.value);

		if (iter.disposeIf(next => kw.is(next, kw.id.equals))) 
			return result == wrapped(iter.next.value);

		else return result;
	}

	async run (codeInput){
		const lexed = oraLexer(codeInput);
		const chunks = chunkLexed(lexed);

		for (const chunk of chunks){
			const response = await this.handleItems(
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


module.exports = Ora;
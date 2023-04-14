
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
				case '^': return Math.pow(b, a);
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
	const output = input.match(/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]/g);

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

			continue
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

const parseInputToVariable = (iter, input, data = {}, functions = true) => {
	const { variables = {} } = data;
	const { value } = input;

	const scaleTree = ({ source, property }) => {
		let scopeV = (property != undefined ? source[property] : source);
		const isClass = scopeV?.prototype?.constructor?.toString()?.substring(0, 5) === 'class';

		if (!isClass && typeof scopeV == 'function'){
			scopeV = scopeV.bind(source);
		}

		if (iter.disposeIf('BIND')){
			if (typeof scopeV == 'function' && !isClass){
				const toBind = forceType.forceObject(
					parseInput(iter, iter.next(), data, false)
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

		if (iter.disposeIf('=')){
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

function parseInput (iter, input, data = {}) {
	const { variables = {} } = data;
	const mathSymbols = ['+', '-', '*', '/', '^'];

	const wrapped = (value) => {

		switch(value) {
			case 'true':              return true;
			case 'false':             return false;
			case 'OBJECT':            return {};
			case 'ARRAY':             return [];
			case 'NULL':              return null;
			case 'UNDEFINED':         return undefined;
			case 'NAN':               return NaN;
			case 'INFINITY':          return Infinity;
			case 'NEGATIVE_INFINITY': return -Infinity;
		}
		
		
		
		if (value == '{'){
			const object = {};

			let tries = 0;

			while (!iter.disposeIf('}')){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an object');

				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				const key = iter.next();
				if (key.value == undefined) break;

				if (!iter.disposeIf(':')) throw new Error('Expected ":" after key');

				object[key.value] = wrapped(iter.next().value);
			}

			return parseInputToVariable(iter, { }, { variables: object });
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
					wrapped(nextItem.value)
				);
			}

			return array;
		}
		else if (isString(value)){
			let stringResult = parseString(value);

			while (iter.disposeIf('+') && iter.peek(1).value != null)
				stringResult = stringResult.concat(
					wrapped(iter.next().value)
				);
			
			return stringResult;
		}

		else if (value == 'ENUM'){
			if (!iter.disposeIf('{')) throw new Error('Expected "{" after ENUM');

			const enumObject = [];

			let tries = 0;

			while (!iter.disposeIf('}')){
				if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an enum');

				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				const key = iter.next();
				if (key.value == undefined) break;

				enumObject.push(wrapped(key.value));
			}

			return Enum(...enumObject);
			
		}

		let result;

		if (isA_0(value) && variables.hasOwnProperty(value)){
			result = parseInputToVariable(iter, { value }, data);
		}

		mathBlock: {
			if (isNaN(value) && typeof result !== 'number') break mathBlock;

			const total = forceType.forceNumber(isNum(value) ? value : result);
			if (total == null) break mathBlock;

			let mathString = total + '';
			
			while (mathSymbols.includes(iter.peek().value)) {
				const symbol = iter.next().value;
				const nextItem = iter.next().value;

				if (isNaN(nextItem) && !isA_0(nextItem)) continue;

				const variable = parseInputToVariable(iter, { value: nextItem }, data);
				const num = forceType.forceNumber(isNum(nextItem) ? nextItem : variable);

				mathString += ` ${symbol} ${num}`;
			}

			return evalMath(mathString);
		}

		if (value === 'CURRENT_DATE') return Date.now();

		return result;
	}

	const result = wrapped(input.value);

	if (iter.disposeIf('EQUALS')) 
		return result == wrapped(iter.next.value);

	else 
		return result;
}

const setOnPath = ({ value, path, data: obj }) => {
	for (const sub of path.slice(0, path.length - 1)){
		if (typeof obj[sub] !== 'object') obj[sub] = { value: obj[sub] };

		if (obj[sub].value == null) delete obj[sub].value;

		obj = obj[sub];
	}

	const i = path.length > 1 ? path.length - 1 : 0;
	
	if (value != undefined){
		obj[path[i]] = value;
	}
	else delete obj[path[i]];
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

const parseBlock = ({ iter, data }) => {
	const items = [];

	if (!iter.disposeIf('{')){
		const err = 'Missing Opening \'{\' after parameters';

		throw new Error(err);
	}

	let openBrackets = 1;
	let closedBrackets = 0;
	
	for (const item of iter){
		if (item === '{') openBrackets++;
		else if (item === '}') closedBrackets++;
		if (item == '\r') continue;
		
		items.push(item);

		if (openBrackets == closedBrackets && openBrackets > 0) break;
	}

	if (items[items.length - 1] !== '}'){
		const err = 'Missing Closing \'}\' at end of function';

		throw new Error(err);
	}
	else items.pop();

	return items;
}

class Ora {
	#variables;
	#classes;
	#functions;

	utils = {
		setOnPath,
		parseInput,
		chunkLexed,
		isA_0,
		isNum,
		forceType,
		evalMath,
		expectSetVar
	}

	constructor (settings = {}) {
		const { customFunctions, customClasses, overrideFunctions } = forceType.forceObject(settings);

		this.init({
			functions: customFunctions,
			classes: customClasses,
			overrideFunctions
		});
	}

	init ({ functions, classes, overrideFunctions }){
		this.#variables = {};

		this.#classes = {
			...forceType.forceObject(classes)
		};

		this.#functions = {
			...forceType.forceObject(functions),

			['/'] (){
				return this.COMMENT(...arguments);
			},

			COMMENT (){
				return { break: true };
			},

			LET (){
				return this.SET(...arguments);
			},

			SET: ({ iter, data }) => {
				const variables = iter.disposeIf('GLOBAL') ? this.#variables : data.variables;
				const variableName = iter.next().value;
				const path = [variableName];
				
				if (data.functions.hasOwnProperty(variableName))
					throw `Cannot set variable to function name: ${variableName}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );
				
				const nextSeq = iter.next();

				if (isA_0(variableName) && !nextSeq.done && nextSeq.value === 'TO' || nextSeq.value === '=')
					setOnPath({
						data: variables,
						path,
						value: parseInput(iter, iter.next(), data)
					});

				else throw `Invalid Variable Name: (${variableName}), or next sequence (${nextSeq.value})`;
			},

			DELETE ({ iter, data }) {
				const variables = iter.disposeIf('GLOBAL') ? this.#variables : data.variables;

				const variableName = iter.next().value;
				const path = [variableName];
				
				if (data.functions.hasOwnProperty(variableName))
					throw `Cannot set variable to function name: ${variableName}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);

				if (isA_0(variableName))
					setOnPath({
						data: variables,
						path
					});

				else throw `Invalid Variable Name: (${variableName})`;
			},

			PRINT ({ iter, data }) {
				const input = iter.next();
				if (!input.value) return;

				const results = [parseInput(iter, input, data)];

				while ((iter.peek().value == '&' || iter.peek().value == 'AND') && !iter.peek(2).done){
					const res = parseInput(iter, iter.next(1), data);

					results.push(res);
				}

				results.length > 0 && console.log(...results);
			},

			LOOP ({ iter, handleItems }) {
				const input = iter.next().value;
				const items = [...iter];

				if (!isNaN(input)) {
					const timesToRun = forceType.forceNumber(input);

					for (let i = 0; i < timesToRun; i++)
						handleItems(
							betterIterable(
								items,
								{ tracking: true }
							)
						);
				}
				else throw 'Cannot Find Loop Status';
			},

			FOR ({ iter, data, handleItems, maxCalls = 100 }) {
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

			async IF ({ iter, data, handleItems }) {
				if (iter.disposeIf('(')){
					const toCheck = [parseInput(iter, iter.next(), data, true)];

					while (iter.disposeIf('AND') && isA_0(iter.peek().value))
						toCheck.push( parseInput(iter, iter.next(), data, true) );

					if (!iter.disposeIf(')'))
						throw new Error('Expected ")" to close BIND statement!');
					
					if (toCheck.some(val => val != true)) return;
				}
					

				const items = parseBlock({ iter, data });

				await handleItems(
					betterIterable(items, { tracking: true }),
					data
				);
			},

			RETURN ({ iter, data }) {
				return parseInput(iter, iter.next(), data);
			},

			CLASS ({ iter, data, handleItems }) {
				const className = iter.next().value;
				const items = [];

				for (const item of iter) items.push(item);

				if (isA_0(className))
					data.classes[className] = { items, data };
			},

			LOG_VARIABLES ({ iter, data }) {
				console.log('\n', `ORA LANG VARIABLES:`, '\n',  data.variables, '\n');
			},

			LOG_SCOPE ({ iter, data }) {
				console.log('\n', `ORA LANG SCOPE:`, '\n', data, '\n');
			},
				
			FUNCTION ({ iter, data, handleItems }) {
				const variableName = iter.next().value;
				const path = [variableName];

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );

				const args = [];

				if (iter.disposeIf('(')){
					let passes = 0;
			
					while (!iter.disposeIf(')')){
						if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;
	
						args.push(
							iter.next().value
						);
						
						if (passes++ > 100) return console.error(new Error('Cannot add more than 100 args on a function'));
					}
				}

				const items = parseBlock({iter, data});

				const func = async (...inputs) => {
					const variables = {};

					for (const [key, value] of Object.entries(data.variables))
						variables[key] = value;


					for (const [i, value] of Object.entries(args)){
						if (typeof inputs[i] == 'object' || typeof inputs[i] == 'function'){
							variables[value] = inputs[i]
						}
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
					data: data.variables,
					path,
					value: func
				});

				// return { break: true };
			},

			EXIT () {
				process.exit();
			},

			EXPORT ({ iter, data }) {
				return {
					exit: true,
					value: parseInput(iter, iter.next(), data)
				}
			},

			async IMPORT ({ iter, data }){
				const fs = await import('fs');
				const pathModule = await import('path')
				const resolveFrom = await import('resolve-from');

				const variableName = iter.next().value;
				const path = [variableName];
				let { variables } = data;
				
				if (data.functions.hasOwnProperty(variableName))
					throw `Cannot set variable to function name: ${variableName}`;

				if (iter.disposeIf('GLOBAL')) variables = this.#variables;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );

				const nextSeq = iter.next();
					
				if (isA_0(variableName) ){
					if (!nextSeq.done && nextSeq.value === 'FROM'){
						const importUrl = parseInput(iter, iter.next(), data);
						let url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? '../'+importUrl : importUrl;

						if (typeof url === 'string'){
							if (url.endsWith('.ora')){
								setOnPath({
									data: variables,
									path,
									value: new Ora().run(
										fs.readFileSync(pathModule.relative(__dirname, url), 'utf-8')
									)
								});
							}
							else if (url.endsWith('.js') || url.endsWith('.npm')){
								if (url.endsWith('.npm')) url = ('../node_modules/' + url.slice(0, url.length - 4) + '/');

								setOnPath({
									data: variables,
									path,
									value: await import(pathModule.relative(__dirname, url))
								});
							}

							else throw 'INVALID URL';
						}
						else throw 'IMPORT URL IS NOT A STRING';
					}
				}
			},

			PUSH ({ iter, data }) {
				const items = [
					parseInput(iter, iter.next(), data)
				];

				while (iter.disposeIf(',') && parseInput(iter.clone(), iter.peek(1), data) != null)
					items.push(
						parseInput(iter, iter.next(), data)
					);

				const nextSeq = iter.next();

				if (!nextSeq.done && nextSeq.value === 'TO' && isA_0(iter.peek(1).value)){
					const variable = expectSetVar({ iter, data });
					let { variables } = data;

					if (iter.disposeIf('GLOBAL')) variables = this.#variables;

					setOnPath({
						data: variables,
						path: variable.path,
						value: [...variable.data, ...items]
					});
				}
			},

			SHIFT ({ iter, data }) {
				const variable = expectSetVar({ iter, data });

				variable.data.shift();
			},

			POP ({ iter, data }) {
				const variable = expectSetVar({ iter, data });

				variable.data.pop();
			},

			async AWAIT ({ iter, data }) {
				const ep = parseInput(iter, iter.next(), data);

				return await ep;
			},

			async SLEEP ({ iter, data }) {
				const time = parseInput(iter, iter.next(), data);

				return new Promise(resolve => setTimeout(resolve, time));
			},

			...forceType.forceObject(overrideFunctions),
		}

		delete this.init;
	}

	async handleItems (iter, data = { variables: this.#variables, functions: this.#functions }){
		const { functions, variables } = data;

		for (const method of iter) {
			if (!functions.hasOwnProperty(method)){
				if (variables?.hasOwnProperty(method))
					await parseInput(iter, { value: method }, data);
				
				continue;
			}

			const response = await functions[method]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});
			
			if (response?.break == true) break;

			if (response) return response;
		}
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
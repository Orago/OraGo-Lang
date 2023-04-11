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
				
				if (stack.length > maxStack) stack.shift();
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

const isNum = (num) => !isNaN(num);

const isA0  = (x) => x == undefined || /[a-z0-9]/i.test(x);
const isA_0 = (x) => x == undefined || /[a-z0-9_]/i.test(x);

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
			let char = mathString[i];
			
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

		for (const symbol of postfix){
			stack.push(
				typeof symbol === 'number' ?
				symbol :
				applyMath(
					symbol,
					stack.pop(),
					stack.pop()
				)
			);
		}

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

	while (output.indexOf(' ') != -1) output.splice(output.indexOf(' '), 1);

	return output;
}

function chunkLexed(lexed) {
	const chunks = [];
	let chunk = [];

	let scopeDepth = 0;
	let openBrackets = 0;
	let closedBrackets = 0;

	for (const item of lexed)
		if (item === '{'){
			scopeDepth++;
			openBrackets++;

			chunk.push(item);
		}
		else if (item === '}'){
			closedBrackets++;
			scopeDepth--;

			chunk.push(item);

			if (scopeDepth == 0){
				chunks.push(chunk);
				chunk = [];
			}
		}
		else if (item === ';') {
			if (scopeDepth == 0){
				chunks.push(chunk);
				chunk = [];
			}
			else chunk.push(item)
		}
		else if (item != '\n' && item != '\t') chunk.push(item);

	return chunks;
}

const strReg = /(['"])(.*?)\1/;
const isString = input => strReg.test(input);
const parseString = input => strReg.exec(input)?.[2];

const parseInputToVariable = (iter, input, data = {}) => {
	const { variables = {} } = data;
	const { value } = input;
	let itemsPassed = 1;

	const scaleTree = ({ source, property }) => {
		if (iter.peek(itemsPassed).value === '.' && isA_0(iter.peek(itemsPassed + 1).value))
			return scaleTree({
				source: source[property],
				property: iter.next(1).value,
				i: itemsPassed++
			});

		const scopeV = source?.[property];
		
		if (isA_0(property) && scopeV != undefined)
			return scopeV?.hasOwnProperty('value') ? scopeV.value : scopeV;
	}

	const resultObj = scaleTree({
		property: value,
		source: variables
	});

	if (typeof(resultObj) === 'function'){
		const stat = iter.disposeIf('(');

		if (stat){
			const items = [];
			let passes = 0;
	
			while (!iter.disposeIf(')')){
				
				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;

				items.push(
					iter.next().value
				);
				
				if (passes++ > 100)
					return console.error(
						new Error('Cannot run more than 100 args on a function')
					);
			}

			return resultObj(...items);
		}
		else {
			console.error('Missing opening parenthesis to function',
				'\n',
				iter.stack()
			);

			return;
		}
	}

	return resultObj
}

const parseInput = (iter, input, data = {}) => {
	const { variables = {} } = data;
	let { value } = input;
	const mathSymbols = ['+', '-', '*', '/', '^'];

	if (value == 'true')       return true;
	else if (value == 'false') return false;
	else if (isString(value))  return parseString(value);
	else if (value == 'OBJECT')   return {};

	let iterCache = iter.clone();
	let result;

	if (isA_0(value) && variables.hasOwnProperty(value))
		result = parseInputToVariable(iter, { value }, data);

	mathBlock: {
		if (isNaN(value) && typeof result !== 'number')
			break mathBlock;

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

	iter = iterCache;

	if (value === 'CURRENT_DATE') return Date.now();

	return result;
}

const setOnPath = ({ value, path, data: obj }) => {
	for (const sub of path.slice(0, path.length - 1)){
		if (typeof obj[sub] !== 'object') obj[sub] = { value: obj[sub] };

		if (obj[sub].value == null) delete obj[sub].value;

		obj = obj[sub];
	}

	const i = path.length > 1 ? path.length - 1 : 0;
	
	obj[path[i]] = value;
}

class Ora {
	#variables;
	#classes;
	#functions;

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

			SET: ({ iter, data }) => {
				const variableName = iter.next().value;
				const path = [variableName];
				let variables = data.variables;
				
				if (this.#functions.hasOwnProperty(variableName))
					throw `Cannot set variable to function name: ${variableName}`;

				if (iter.disposeIf('GLOBAL')) variables = this.#variables;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);
				
				const nextSeq = iter.next();

				if (isA_0(variableName) && !nextSeq.done && nextSeq.value === 'TO')
					setOnPath({
						data: data.variables,
						path,
						value: parseInput(iter, iter.next(), data)
					});

				else throw `Invalid Variable Name: (${variableName}), or next sequence (${nextSeq.value})`;
			},

			PRINT ({ iter, data }) {
				const input = iter.next();
				if (!input.value) return;

				const results = [parseInput(iter, input, data)];

				while (iter.peek().value == '&' && !iter.peek(2).done){
					const res = parseInput(iter, iter.next(1), data);

					results.push(
						res
					);
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
								items
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
						betterIterable(items)
					);
				}
			},

			IF ({ iter, data, handleItems }) {
				const input = iter.next();
				const items = [];

				for (const item of iter) items.push(item);

				if (parseInput(iter, input, data) == true)
					handleItems(
						betterIterable(items)
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
				const variablePath = [iter.next().value];
				const args = [], items = [];

				while (iter.disposeIf('.') && iter.peek().value)
					variablePath.push(
						iter.next().value
					);

				if (iter.disposeIf('(')){
					let passes = 0;
			
					while (!iter.disposeIf(')')){
						if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;
	
						args.push(
							iter.next().value
						);
						
						if (passes++ > 100)
							return console.error(new Error('Cannot add more than 100 args on a function'));
					}
				}

				if (!iter.disposeIf('{')){
					const err = 'Missing \'{\' after parameters';

					throw new Error(err);
				}

				let openBrackets = 1;
				let closedBrackets = 0;
				
				for (const item of iter){
					if (item === '{') openBrackets++;
					else if (item === '}') closedBrackets++;
					
					items.push(item);

					if (openBrackets == closedBrackets && openBrackets > 0){
						console.log('broke', items)
						break;
					}
				}

				if (items[items.length - 1] !== '}'){
					const err = 'Missing Closing \'}\' at end of function';

					throw new Error(err);
				}
				else items.pop();

				const func = (...inputs) => {
					const variables = {};

					for (const [key, value] of Object.entries(data.variables))
						variables[key] = value;

					for (const [i, value] of Object.entries(args))
						variables[value] = parseInput(
							betterIterable([]),
							{ value: inputs[i] },
							data
						);

					return handleItems(
						betterIterable(items),
						{
							functions: data.functions,
							variables
						}
					);
				}

				setOnPath({
					data: data.variables,
					path: variablePath,
					value: func
				});

				return { break: true };
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

			...forceType.forceObject(overrideFunctions),
		}

		delete this.init;
	}

	handleItems (iter, data = { variables: this.#variables, functions: this.#functions }){
		const { functions, variables } = data;

		for (const method of iter) {
			if (!functions.hasOwnProperty(method)){
				if (variables?.hasOwnProperty(method))
					parseInput(iter, { value: method }, data);
				
				continue;
			}

			const response = functions[method]({
				iter,
				data,
				handleItems: this.handleItems.bind(this)
			});

			if (response?.break == true) break;
			if (response) return response;
		}
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

module.exports = Ora;
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
			if (typeof n === 'number')
				for (let i = 0; i < n; i++)
					items.shift();

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

const isA0 = (x) => x == undefined || /[a-z0-9]/i.test(x);
const isA_0 = (x) => x == undefined || /[a-z0-9_]/i.test(x);

const isMath = input => /^(~\w+|[\d\s+\-*/()]+)+$/.test(input);
function evalMath(mathString) {
	try {
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
			else if (char === '(')
				stack.push(char);

			else if (char === ')') {
				while (stack[stack.length - 1] !== '(')
					postfix.push(stack.pop());

				stack.pop();
			}
		}

		while (stack.length)
			postfix.push(stack.pop());

		for (let i = 0; i < postfix.length; i++) {
			if (typeof postfix[i] === 'number')
				stack.push(postfix[i]);

			else {
				const [a, b] = [stack.pop(), stack.pop()]

				let result;
				switch (postfix[i]) {
					case '+': result = b + a; break;
					case '-': result = b - a; break;
					case '*': result = b * a; break;
					case '/': result = b / a; break;
					case '^': result = Math.pow(b, a); break;
				}

				stack.push(result);
			}
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
	const regex = /(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*()-_+"\\/.;:\[\]\s]/g;
	const output = input.match(regex);

	while (output.indexOf(' ') != -1)
		output.splice(output.indexOf(' '), 1);

	return output;
}

function chunkLexed(lexed) {
	const chunks = [];
	let chunk = [];

	for (const item of lexed)
		if (item === ';') {
			chunks.push(chunk);
			chunk = [];
		}
		else if (!['\n', '\t'].includes(item))
			chunk.push(item);

	return chunks;
}

const strReg = /(['"])(.*?)\1/;
const isString = input => strReg.test(input);
const parseString = input => strReg.exec(input)?.[2];

const parseInputToVariable = (iter, input, data = {}) => {
	const { variables = {}, functions } = data;
	const { value } = input;
	let itemsPassed = 1;
	// 

	const scaleTree = ({ property, source }) => {
		if (iter.peek(itemsPassed).value === '.' && isA_0(iter.peek(itemsPassed + 1).value))
			return scaleTree({
				source: source[property],
				property: iter.next(1).value,
				i: itemsPassed++
			});
		
		if (isA_0(property) && source?.hasOwnProperty(property)){
			if (source[property]?.hasOwnProperty('value'))
				return source[property].value;

			return source[property];
		}
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
				if (iter.disposeIf(',') && iter.disposeIfNot(isA_0))
					continue;

				items.push( iter.next().value );
				
				if (passes++ > 100)
					return console.error(new Error('Cannot run more than 100 args on a function'));
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

	let iterCache = iter.clone();


	mathReset: {
		mathBlock: {
			const result = parseInputToVariable(iter, { value }, data);
	
			if (isNaN(value) && typeof result !== 'number')
				break mathBlock;
	
			let total = !isNaN(value) ? Number(value) : forceType.forceNumber(result);
	
			if (total == null) break mathBlock;
			
			while (mathSymbols.includes(iter.peek().value)) {
				const symbol = iter.next().value;
				const nn = iter.next().value;
	
				if (isNaN(nn) && !isA_0(nn)) continue;
	
				const test12 = parseInputToVariable(iter, { value: nn }, data);
				let num = !isNaN(nn) ? Number(nn) : forceType.forceNumber(test12);
	
				total = evalMath(total + " " + symbol + " " + num);
			}
	
			return total;
		}

		iter = iterCache;
	}

	if (isA_0(value) && variables.hasOwnProperty(value)){
		return parseInputToVariable(iter, { value }, data);
	}
	

	//isA_0(value) && parseInputToVariable(mathIter, input, data) != null

	if (value === 'CURRENT_DATE') return Date.now();

	return;
}

const oraGo = (settings = {}) => codeInput => {
	if (typeof codeInput != 'string') return;

	const { customFunctions, customClasses } = forceType.forceObject(settings);

	const lexed = oraLexer(codeInput);
	const chunks = chunkLexed(lexed);

	const setOnPath = ({ value, path, data: obj }) => {
		for (let subVar of path.slice(0, path.length - 1)){
			if (typeof obj[subVar] !== 'object') obj[subVar] = { value: obj[subVar] };

			if (obj[subVar].value == null) delete obj[subVar].value;

			obj = obj[subVar];
		}

		const i = path.length > 1 ? path.length - 1 : 0;
		
		obj[path[i]] = value
	}

	const oraGoData = {
		variables: {
			testObj: {
				cat: 'meow',
				person: {
					age: 18,
					cool: true
					// welcome: (name, num = 1) => console.log('hello, my name is', name, 'and I like the number', num)
				}
			}
		},
		classes: {
			...forceType.forceObject(customClasses)
		},
		functions: {
			...forceType.forceObject(customFunctions),
			['/'] (options){
				return this.COMMENT.bind(this)(options);
			},
			COMMENT ({ iter }){
				for (let i of iter)
					continue;
			},
			SET ({ iter, data }) {
				const variableName = iter.next().value;
				const path = [variableName];
				
				while (iter.disposeIf('.') && !isA_0(iter.peek(1).value))
					path.push(
						iter.next().value
					);
				
				const nextSeq = iter.next();
				
				if (isA_0(variableName) && !nextSeq.done && nextSeq.value === 'TO'){
					setOnPath({
						data: data.variables,
						path,
						value: parseInput(iter, iter.next(), data)
					});
				}

				else throw `Invalid Variable Name: (${variableName}), or next sequence (${nextSeq.value})`;
			},
			PRINT ({ iter, data }) {
				const input = iter.next();
				const results = [];

				if (input) {
					results.push(parseInput(iter, input, data));

					while (iter.peek().value == '&' && iter.peek(2).done == false) {
						iter.next();

						results.push(parseInput(iter, iter.next(), data));
					}
				}

				results.length > 0 && console.log(...results);
			},

			LOOP ({ iter, handleItems }) {
				const input = iter.next().value;
				const items = [];

				if (!isNaN(input)) {
					const timesToRun = forceType.forceNumber(input);
					for (const item of [...iter])
						items.push(item);

					for (let i = 0; i < timesToRun; i++)
						handleItems(
							items[Symbol.iterator]()
						);
				}
				else throw 'Cannot Find Loop Status';
			},

			FOR ({ iter, data, handleItems, maxCalls = 100 }) {
				const input = iter.next();
				const items = [];
				let calls = 0;

				for (let item of iter)
					items.push(item);

				while (val = parseInput(iter, input, data) == true) {
					if (calls++ >= maxCalls) {
						console.log('Call Stack Exceeded Maximum Amount');
						break;
					}

					handleItems(
						betterIterable(items)
					);
				}
			},

			IF ({ iter, data, handleItems }) {
				const input = iter.next();
				const items = [];

				for (const item of iter)
					items.push(item);

				if (parseInput(iter, input, data) == true)
					handleItems(
						betterIterable(items)
					);
			},

			RETURN ({ iter, data }) {
				return parseInput(iter, iter.next(), data);
			},

			LOG_VARIABLES ({ data }) {
				console.log(`ORAGO LANG DATA:`);
				console.log(data.variables);
			},

			FUNCTION ({ iter, data, handleItems }) {
				const args = [];
				const variablePath = [iter.next().value];
				const items = [];

				while (iter.disposeIf('.') && iter.peek().value)
					variablePath.push(
						iter.next().value
					);

				if (iter.disposeIf('(')){
					let passes = 0;
			
					while (!iter.disposeIf(')')){
						if (iter.disposeIf(',') && iter.disposeIfNot(isA_0)) continue;
	
						args.push( iter.next().value );
						
						if (passes++ > 100){
							console.error(new Error('Cannot add more than 100 args on a function'));
							return;
						}
					}
				}
				
				for (const item of iter)
					items.push(item);

				const func = (...inputs) => {
					const scopeData = {
						variables: {}
					};

					for (let [key, value] of Object.entries(data.variables))
						scopeData.variables[key] = value;

					for (let [i, value] of Object.entries(args))
						scopeData.variables[value] = parseInput(betterIterable([]), { value: inputs[i] }, data);

					return handleItems(
						betterIterable(items),
						scopeData
					);
				}


				setOnPath({
					data: data.variables,
					path: variablePath,
					value: func
				});

				return {
					break: true
				};
			}
		}
	}

	const { functions, variables } = oraGoData;

	function handleItems(iter, data = oraGoData) {
		itemsLoop: for (const method of iter) {
			if (!functions.hasOwnProperty(method)){
				if (variables?.hasOwnProperty(method))
					parseInput(iter, { value: method }, data);
				
				continue;
			}

			const response = functions[method]({
				iter,
				data,
				handleItems
			});

			if (response?.break == true)
				break itemsLoop;

			if (response)
				return response;
		}
	}

	for (const chunk of chunks){
		// console.log('CHUNK -->', chunk);
		handleItems(
			betterIterable(
				chunk[Symbol.iterator](),
				{ tracking: true }
			)
		);
	}

	return oraGoData;
}

const run = oraGo({
	customFunctions: {}
});


const test1 = `
COMMENT this is a test;
SET cat TO "Meow lol";
SET testObj.person.orago TO 'yeahhh';
SET testObj.person.orago.isCool TO true;

PRINT "HELLO WORLD" & cat;

PRINT CURRENT_DATE;

SET canLoop TO true;

IF canLoop
	PRINT "hehe loop" & "meow"

	SET canLoop TO false
;

PRINT testObj.person.orago;
LOG_VARIABLES;
`;

const test2 = `
SET theMath to 5 + 2 - 3;
PRINT "Result equals" & theMath;
`;

const test3 = `

FUNCTION myAge (birthyear, currentyear)
	PRINT currentyear - birthyear;

myAge(2004, 2023);

// FUNCTION reTm (a, b)
// 	RETURN a + b;

// PRINT reTm(5, 4) + 54;

// LOG_VARIABLES;
`;

run(test3);
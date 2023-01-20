//#region //* Util *//
function replaceTabs(text, spacesPerTab) {
	return text.replace(/\t/g, ' '.repeat(spacesPerTab));
}

function splitByNewlines(text) {
	let output = [];
	let current = "";
	let openBrackets = 0;
	let closedBrackets = 0;
	let insideFunction = false;
	for (let i = 0; i < text?.length; i++) {
			if (text[i] === "{") {
					openBrackets++;
					current += text[i];
					insideFunction = true;
			} else if (text[i] === "}") {
					closedBrackets++;
					current += text[i];
					if (openBrackets === closedBrackets) {
							insideFunction = false;
					}
			} else if (text[i] === "\n" && !insideFunction) {
					output.push(current);
					current = "";
			} else {
					current += text[i];
			}
	}
	output.push(current);
	return output;
}

function splitCommas(str) {
	let insideQuotes = false;
	let insideDoubleQuotes = false;
	let insideParenthesis = false;
	let current = "";
	let output = [];
	for (let i = 0; i < str?.length; i++) {
			if (str[i] === "\"") {
					insideDoubleQuotes = !insideDoubleQuotes;
					current += str[i];
			} else if (str[i] === "'") {
					insideQuotes = !insideQuotes;
					current += str[i];
			} else if(str[i] === "(" ) {
					insideParenthesis = true;
					current += str[i];
			} else if (str[i] === ")" ) {
					insideParenthesis = false;
					current += str[i];
			} else if (str[i] === "," && !insideDoubleQuotes && !insideQuotes && !insideParenthesis) {
					output.push(current);
					current = "";
			} else current += str[i];
	}
	output.push(current);
	return output;
}

function evalMath(mathString) {
	try {
			// using a stack and a postfix notation algorithm to evaluate the math string
			let stack = [];
			let postfix = [];
			let operators = ['+', '-', '*', '/', '^'];
			let precedence = {'+':1, '-':1, '*':2, '/':2, '^':3};
			for (let i = 0; i < mathString.length; i++) {
					let char = mathString[i];
					if (!isNaN(parseFloat(char)) || char === '.') {
							let number = char;
							while (!isNaN(parseFloat(mathString[i+1])) || mathString[i+1] === '.') {
									number += mathString[++i];
							}
							postfix.push(parseFloat(number));
					}
					else if (operators.indexOf(char) !== -1) {
							while (stack.length && operators.indexOf(stack[stack.length-1]) !== -1 && precedence[char] <= precedence[stack[stack.length-1]]) {
									postfix.push(stack.pop());
							}
							stack.push(char);
					}
					else if (char === '(') {
							stack.push(char);
					}
					else if (char === ')') {
							while (stack[stack.length-1] !== '(') {
									postfix.push(stack.pop());
							}
							stack.pop();
					}
			}
			while (stack.length) {
					postfix.push(stack.pop());
			}
			for (let i = 0; i < postfix.length; i++) {
					if (typeof postfix[i] === 'number') {
							stack.push(postfix[i]);
					}
					else {
							let a = stack.pop();
							let b = stack.pop();
							let result;
							switch (postfix[i]) {
									case '+': result = b + a; break;
									case '-': result = b - a; break;
									case '*': result = b * a; break;
									case '/': result = b / a; break;
									case '^': result = Math.pow(b,a); break;
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

function performOperation(operator, op1, op2) {
	switch (operator) {
		case "+": return op1 + op2;
		case "-": return op1 - op2;
		case "*": return op1 * op2;
		case "/": return op1 / op2;
	}
}
//#endregion //* Util *//

//#region //* Is Validators *//
	const isReturn = section => section?.match(/^return (.*?);/) != null;
	const isFunc = section => section?.match(/^!(.*?)\([\w\s](.*?)[\w\s]\)+$/) != null;
	const isFuncCaller = section => section?.match(/^!(.*?)\((.*?)\)+$/) != null;
	const isString = section => /~(\w+)/.test(section);
	
	const isVariableSetter = section => /^\s*var\s+(\S+)\s*=\s*(.+);?\s*$/.test(section);
	const isNumber = char => /[0-9]/.test(char);
	const isOperator = char => /[+\-*/]/.test(char);
	const isMath = input => /^(~\w+|[\d\s+\-*/()]+)+$/.test(input);
//#endregion //* Is Validators *//

//#region //* Parsers *//
	const parseParenthesis = text => (/\(([^)]+)\)/).exec(text)?.[1].split(',').map($ => $.replace(/^ /g, ''));
	const parseFuncName = text => (/\b(\w+)\s*(?=\()/).exec(text)?.[1];

	const parseFuncBlock = text => text.match(/func.*?\{([^}]*(}[^}]*)*)}/)?.[1];
	const parseFuncCaller = text => /^!(\S+)\(([^()]*(?:\((?:[^()]*|(\2))*\))*[^()]*)\)$/.exec(text);
	const parseFuncCallerName = text => /!(.*?)\(/.exec(text)?.[1];
	const parseFuncCallerContent = text => /^!(\w+)\((.*)\)$/.exec(text)?.[2];

	const trimSection = text => text.replace(/^ +| +$/g, '');


	const findVariables = text => text.match(/~(\w+)/g);
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	const isVariable = section => /\((.*?)=\s?(.*?)\s?\)/.test(section);
	const parseVariable = text => {
		const [originalText, variableName, variableValue] = text.match(/\((.*?)=\s?(.*?)\s?\)$/);
		console.log(null, originalText, variableName, variableValue)
		return [trimSection(variableName), convertToType(trimSection(variableValue))?.[0]];
	};

	function convertToType(str) {
		const strReg = /(['"])(.*?)\1/;

    if (!isNaN(str))
			return [Number(str), 'number'];
    
		else if (str === "true" || str === "false")
      return [str === "true", 'bool'];
    
		else if (str === "undefined")
      return [undefined, 'undefined'];
		
		else if (str === "null")
      return [null, 'null'];

    else if (str[0] === "[" || str[0] === "{")
      return [JSON.parse(str), 'object'];

			// else if (strReg.test(str))
			// return [strReg.exec(str)?.[2], 'string']

    return [str, 'string'];
	}
//#endregion //* Parsers *//

//#region //* Handlers *//
	const handleSections = text => splitByNewlines(text).map($ => $.replace(/^[\n\t]/g, '')).filter($ => $ != '');

	const flatFunctions = ({ langData = {}, setCurVal }) => ({
		'//': options => options,
		clear: options => {
			if (options.includes('stack')) langData.stack = [];
			if (options.includes('cache')) langData.cache = [];
			if (options.includes('dict')) langData.dict = {};
		},
		cache: options => {
			if (options[0] == 'open') langData.cacheIsOpen = true;
			if (options[0] == 'close') langData.cacheIsOpen = false;
			if (options[0] == 'next') langData.cacheIsOpen = 'next';
			if (options[0] == 'log') console.log(langData.cache);
			if (options[0] == 'set'){
				const [undefined, key, cacheIndex] = options;

				if (!key) return console.log('Missing Key');
				
				langData.dict[key] = langData.cache[Number(cacheIndex) || langData.cache.length - 1];
			}
		},
		set: options => {
			if (options.length < 2)
				return console.log('Could Not Set Value, Incorrect Amount Of Values (2 Required)');

			const [key, value] = options;

			langData.dict[key] = value;
		},
		'log-data': options => console.log(langData),
		print: options => console.log(...options),
		timer: options => {
			if (options[0] == 'start') console.time(options[1] || 'timer');
			else if (options[0] == 'end') console.timeEnd(options[1] || 'timer');
		},
		math: options => {
			if (isMath(options[0]))
				return setCurVal(
					evalMath(options[0])
				);
			
			console.log('Could Not Parse Math');
		}
	});

	const flatLang = ({ functions = () => ({}) }) => 
	
	inputs => {
		const text = (
			inputs[0]
			.replace(/\n\n/g, '\n')
			.replace(/\t\t/g, '\t')
			.replace(/^\n/g, '')
			.replace(/\(([^()]*|\(([^()]*|\([^()]*\))*\))*\)/g, (...options) => {
				return options[0].replace(/[\t\n]| {2,}/g, '');
			})
		);

		const langData = {
			stack: [],
			cache: [],
			cacheIsOpen: false,
			dict: {}
		}

		let curVal;

		let setCurVal = value => curVal = value;

		const funcs = flatFunctions({ langData, setCurVal });
		const extraFuncs = functions({ langData, setCurVal });

		for (let section of handleSections(text)){
			const [method, ...options] = splitCommas(section);
			curVal = null;
			langData.stack.push([method, options]);

			if (extraFuncs.hasOwnProperty(method))
				extraFuncs[method](options, { isVariable, parseVariable });

			else if (funcs.hasOwnProperty(method))
				funcs[method](options, { isVariable, parseVariable });

			

			if ((langData.cacheIsOpen == true || langData.cacheIsOpen == 'next') && curVal != null){
				langData.cache.push(curVal);

				if (langData.cacheIsOpen == 'next' && method != 'cache') langData.cacheIsOpen = false;
			}
		}
		
	}

export {
	flatLang,
	splitCommas,
	convertToType,
	isVariable, parseVariable
};
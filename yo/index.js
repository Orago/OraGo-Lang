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
			} else {
					current += str[i];
			}
	}
	output.push(current);
	return output;
}

function removeNewlinesFromParentheses(str) {
  let newstr = "";
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char === "(") {
      depth++;
      newstr += char;
    } else if (char === ")") {
      depth--;
      newstr += char;
    } else if (depth > 0 && (char === "\n" || char === " ")) {
      continue;
    } else if(depth > 0 && newstr[newstr.length-1] === " "){
      continue;
    } else {
      newstr += char;
    }
  }
  return newstr;
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
	const isVariable = section => /~(\w+)/.test(section);
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

		else if (strReg.test(str))
			return [strReg.exec(str)?.[2], 'string']

    else return [str, 'string'];
	}
//#endregion //* Parsers *//

//#region //* Handlers *//
	const handleSections = text => splitByNewlines(text).map($ => $.replace(/^[\n\t]/g, '')).filter($ => $ != '');
	const handleVariable = (section, langData) => {
		let [originalFunc, variableName, variableValue] = section.match(/var\s(.*?)\s=\s(.*?);/);

		if (variableName == null)
			return console.error ('Variable Name Cannot Be Null!');
		
		return setVariable(langData, variableName, variableValue);
	}

	const initBlock = ({ sections = [], langData, variablePath = [], variableData = {} }) => {
		langData.depth ??= 0;

		for (let section of sections){
			if (isVariableSetter(section)){
				handleVariable(section, langData);
			}
			else if (isFunc(section)){
				initFuncBlock(section, langData, variablePath, variableData);
			}
		}

		if (langData.depth > 0) langData.depth--;
	}

	const builtIn = {
		print: (...args) => console.log(...args)
	}



	const runReturn = ({ input, langData, variableData, argNames = [], argInputs = [] }) => {
		let returnText = input.match(/return\s*(.*?);/)?.[1] ?? '';

		for (let i = 0; i < argNames.length; i++)
			returnText = returnText.replace('~'+argNames[i], argInputs?.[i] || null);

		if (isFuncCaller(returnText)){
			// console.log(null, returnText)

			// return runBlock(
			// 	handleSections(
			// 		langData.variables?.[parseFuncCallerName(returnText)]?.code
			// 	)
			// )
		}

		if (isMath(returnText)){
			return evalMath(returnText)
		}

		return 'return*null'
	}

	const setVariable = (langData, key, value = null, data = {}) => {
		if (!key) throw 'Trying To Set Variable Without A Key!';
		const [parsedValue, type] = convertToType(value);

		langData.variables[key] = {
			...data,
			key,
			value: parsedValue,
			type: data?.variable ?? type
		};

		return parsedValue;
	}

	const initFuncBlock = (input, langData) => {
		const code = parseFuncBlock(input);
		const args = parseParenthesis(input);
		
		setVariable(
			langData,
			parseFuncName(input),
			null,
			{ code, args }
		);
	}
//#endregion //* Handlers *//

const parseFunc = input => {
	return {
		name: parseFuncName(input),
		args: parseParenthesis(input),
	}
}

const mittzlang = inputs => {
	const text = (
		inputs[0]
		.replace(/\n\n/g, '\n')
		.replace(/\t\t/g, '\t')
		.replace(/^\n/g, '')
	);

	const langData = {
		variables: {}
	}

	const parseSection = (section, sectionData = {}) => {
		const { blockData = {} } = sectionData;
		
		if (isFuncCaller(section)){
			const funcName = parseFuncCallerName(section);
			const funcValue = (parseFuncCallerContent(section) ?? '').replace(/ $/g, '');

			if (isFuncCaller(funcValue)){
				const data = parseSection(funcValue, sectionData);
				if (builtIn.hasOwnProperty(funcName)){
					return builtIn[funcName]('testo');
				}
				
				return data;
			}
			
			const args = [];

			for (let part of splitCommas(funcValue).map(trimSection))
				args.push(
					isFuncCaller(part) ? parseSection(part, sectionData) : convertToType(part)[0]
				);

			const { [funcName]: variable } = blockData?.langData?.variables ?? {};

			if (variable != null){
				for (let nestedSection of handleSections(variable.code)){
					if (isReturn(nestedSection)){
						return runReturn({
							input: nestedSection,
							langData,
							variableData: {}, 
							argInputs: args,
							argNames: variable.args
						});
					}
				}
			}
			
			return null;
		}
	}

	const runBlock = (blockData = {}) => {
		const { sections } = blockData;

		for (let section of sections){
			const response = parseSection(section, { blockData });


			if (response){
				console.log('!!!!!', response)
			}
		}

	}

	const baseData = {
		sections: handleSections(text),
		langData
	}

	initBlock(baseData);
	runBlock(baseData);
}


mittzlang`

`;
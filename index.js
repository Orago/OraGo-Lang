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
	for (let i = 0; i < text.length; i++) {
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

	function evalMath(expression) {
    let stack = [];
    let num = "";

    for (let i = 0; i < expression.length; i++) {
        let char = expression[i];
        if (isNumber(char)) {
            num += char;
        }
				else if (char === " ") {
            continue;
        } else {
            if (num !== "") {
                stack.push(parseFloat(num));
                num = "";
            }
            if (isOperator(char)) {
                let op2 = stack.pop();
                let op1 = stack.pop();
                let result = performOperation(char, op1, op2);
                stack.push(result);
            }
        }
    }

    if (num !== "") stack.push( parseFloat(num) );

    return stack.pop();
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
	const isFunc = section => section?.match(/^func (.*?)\(/) != null;
	const isFuncCaller = section => section?.match(/^!(.*?)\(/) != null;
	const isString = section => /~(\w+)/.test(section);
	const isVariable = section => /~(\w+)/.test(section);
	const isNumber = char => /[0-9]/.test(char);
	const isOperator = char => /[+\-*/]/.test(char);
	const isMath = input => /^(~\w+|[\d\s+\-*/()]+)+$/.test(input);
//#endregion //* Is Validators *//

//#region //* Parsers *//
	const parseParenthesis = text => (/\(([^)]+)\)/).exec(text)?.[1].split(',').map($ => $.replace(/^ /g, ''));
	const parseFuncName = text => (/\b(\w+)\s*(?=\()/).exec(text)?.[1];
	const parseFuncCallerName = text => /!(.*?)\(/.exec(text)?.[1];
	const parseFuncBlock = text => text.match(/func.*?\{([^}]*(}[^}]*)*)}/)?.[1];
//#endregion //* Parsers *//

//#region //* Handlers *//
	const handleSections = text => splitByNewlines(text).map($ => $.replace(/^[\n\t]/g, '')).filter($ => $ != '');

	const initBlock = (sections = [], langData, variablePath = [], variableData = {}) => {
		langData.depth ??= 0;

		for (let section of sections){
			if (isFunc(section)){
				initFuncBlock(section, langData, variablePath, variableData);
			}
		}

		if (langData.depth > 0) langData.depth--;
	}

	const runBlock = (sections = [], langData, variablePath = [], variableData = {}) => {
		for (let section of sections){
			if (isFuncCaller(section)){
				runBlock(
					handleSections(
						langData.variables?.[parseFuncCallerName(section)]?.code
					)
				)
			}
			else if (isReturn(section)){
				return runReturn(section, langData, variableData, []);
			}
		}
		
	}

	const runReturn = (input, langData, variableData, args = {}) => {
		const returnText = input.match(/return\s*(.*?);/)?.[1];
		if (isFuncCaller(returnText)){
			return runBlock(
				handleSections(
					langData.variables?.[parseFuncCallerName(returnText)]?.code
				)
			)
		}
		if (isMath(returnText)){

		}

		// for (let part of returnText.split(/ /g)){
		// 	console.log(part)
		// }
	}

	const newVariable = (value = null, type = 'var', data = {}) => ({
		...data,
		type,
		value,
		variables: {}
	});

	const initFuncBlock = (input, langData, variablePath, variableData) => {
		const inside = parseFuncBlock(input);
		// if (inside == null) throw 'Incorrect Function Syntax!!';
		const sections = handleSections(inside);
		const funcName = parseFuncName(input);
		const funcArgs = parseParenthesis(input);
		
		if (langData.depth == 0){
			langData.variables[funcName] = newVariable(null, 'func', {
				code: inside,
				args: funcArgs
			});
		}

		for (let variableName of variablePath.slice(0, variablePath.length)){
			if (typeof variableData[variableName]?.variables == 'object')
				variableData = variableData[variableName]?.variables;

			else variableData[variableName] = newVariable('testo', 'func');
		}

		variablePath.push(funcName);

		return initBlock(sections, langData, variablePath, variableData);
	}
//#endregion //* Handlers *//

const parseFunc = input => {
	return {
		name: parseFuncName(input),
		args: parseParenthesis(input),
	}
}

const mittzlang = inputs => {
	const text = inputs[0].replace(/\n\n/g, '\n').replace(/\t\t/g, '\t').replace(/^\n/g, '');

	const langData = {
		variables: {}
	}

	initBlock(
		handleSections(text),
		langData
	);

	runBlock(
		handleSections(text),
		langData
	)

	// console.log(
	// 	JSON.stringify(langData, null, 2)
	// )
}


mittzlang`

func test(tesawt, yes){
	return !add(1 + 2);
}

func add (first, second){
	return ~first + ~second;
}

!test('yo')
`;
// console.log(
// 	getType(testText),
// 	parseParenthesis(testText),
// 	parseFuncName(testText)
// )
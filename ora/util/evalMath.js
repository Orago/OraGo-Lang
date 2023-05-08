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

export default evalMath;
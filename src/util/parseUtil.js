import { Token } from './token.js';
import { DataType } from './dataType.js';
export class Arrow {
	static test (iter, pos = 1){
		return (
			(
				iter.peek(pos).type === Token.Type.Op &&
				iter.peek(pos).value === '-'
			) &&
			(
				iter.peek(pos + 1).type === Token.Type.Op &&
				iter.peek(pos + 1).value === '>'
			)
		);
	}

	static disposeIf (iter){
		return Arrow.test(iter) && iter.dispose(2).length == 2;
	}
}

export class Parenthesis {
	static test (iter){
		return (
			iter.peek().type === Token.Type.Seperator &&
			iter.peek().value === '(' &&
			iter.tokens.findIndex(
				token => token.type === Token.Type.Seperator && token.value === ')'
			) > 0
		);
	}

	static parseIdentifiers (iter){
		const tokens = [];

		const loopSearch = () => {
			const peek = iter.peek();

			// Return success no params for basic
			if (peek.value === ')')
				return (iter.dispose(1), true);

			if (peek.type === Token.Type.Identifier)
				tokens.push(iter.read());

			else return false;

			if (iter.disposeIf(token => token.value === ',' && token.type === Token.Type.Op))
				return loopSearch();

			return iter.disposeIf(')') == true;
		}

		if (Parenthesis.test(iter) && iter.disposeIf('('))
			return {
				status: loopSearch(),
				tokens
			};

		return {
			status: false,
			tokens
		};
	}

	static parse (Instance, { iter, scope }){
		const items = [];
		const item = (value, token) =>
			items.push({ value, token });

		const loopSearch = () => {
			const peek = iter.peek();

			if (peek.value === ')') return (iter.dispose(1), true);

			if (Token.isData(iter.peek())){
				const token = iter.read();

				item(
					Instance.processValue({
						iter,
						value: token.value,
						token,
						scope
					}),
					token
				);
			}
			else return false;

			if (iter.disposeIf(token => token.value === ',' && token.type === Token.Type.Op))
				return loopSearch();

			return iter.disposeIf(')') == true;
		}

		if (Parenthesis.test(iter))
			if (iter.disposeIf('('))
				return {
					status: loopSearch(),
					items
				};
		
		return {
			status: false,
			items
		}
	}
}

export class Block {
	static test (iter){
		let depth = -1;
		const hasOpener = (
			iter.peek().type === Token.Type.Seperator &&
			iter.peek().value === '{'
		);

		if (hasOpener) depth = iter.peek().depth;

		const hasCloser = iter.tokens.some(token => (
			token.type === Token.Type.Seperator &&
			token.value === '}' &&
			token.depth === depth
		));

		return hasOpener && hasCloser;
	}

	static sameCloser (openToken, closeToken){
		return (
			closeToken.value === '}' &&
			closeToken.depth === openToken.depth &&
			closeToken.type === Token.Type.Seperator
		);
	}

	static read (iter){
		const tokens = [];

		if (Block.test(iter) === true){
			const [openToken] = iter.dispose(1); // Delete {

			while (!iter.disposeIf(token => this.sameCloser(openToken, token)))
				tokens.push(iter.read());
		}

		return {
			status: false,
			tokens
		}
	}
}

export class Math {
	static Operators = ['+', '-', '*', '/', '^'];

	static handleValue (value){
		return value instanceof DataType.Number ? value.valueOf() : value;
	}

	static test (iter, testValue){
		const value = this.handleValue(testValue);

		if (iter.peek().type === Token.Type.Op){
			console.log('valid op');
		}
		else console.log('invalid op');
	}

	static parse (iterator) {
		function expression() {
			let left = term();

			while (iterator.peek().status) {
				const token = iterator.peek().value;

				if (['+', '-'].includes(token)) {
					iterator.read(); // Consume the operator
					const right = term();
					left = token === '+' ? left + right : left - right;
				}
				else break;
			}

			return left;
		}

		function term() {
			let left = factor();

			while (iterator.peek().status) {
				const token = iterator.peek().value;

				if (['*', '/'].includes(token)) {
					iterator.read(); // Consume the operator
					const right = factor();
					left = token === '*' ? left * right : left / right;
				}
				else break;
			}

			return left;
		}

		function factor() {
			const token = iterator.read().value;

			if (token === '(') {
				const result = expression();

				if (!iterator.disposeIf(')'))
					throw new Error('Unmatched parentheses');

				return result;
			}
			else if (!isNaN(token)) return parseFloat(token);
			else throw new Error('Unexpected token: ' + token);
		}

		return expression();
	}

	static StringMathOperators = ['+', '-', '/'];

	static performStringOperation (Instance, { iter, scope }) {
		let result = iter.read().value;

		opLoop: while (this.StringMathOperators.includes(iter.peek().value)) {

			if (iter.disposeIf('+')) {
				
				if (Token.isData(iter.peek())) {
					result += Instance.processNext({ iter, scope }) + '';
				}
				else throw new Error('Invalid string concatenation');
			}
			else if (iter.disposeIf('/')) {
				if (Token.isData(iter.peek())) {
					const str2 = Instance.processNext({ iter, scope }) + '';
					result = result.replace(new RegExp(str2, 'g'), '');
					iter.read();
				}
				else throw new Error('Invalid string replacement');
			}
			else if (iter.peek().value == '-') {
				// Allow arrow func canceling
				if (iter.peek(2).type === Token.Type.Op && iter.peek(2).value === '>')
					break opLoop;

				iter.dispose(1);

				if (Token.isData(iter.peek())) {
					const str2 = Instance.processNext({ iter, scope }) + '';

					const lastIndex = result.lastIndexOf(str2);

					if (lastIndex !== -1)
						result = result.slice(0, lastIndex) + result.slice(lastIndex + str2.length);
					
					iter.read();
				}
				else throw new Error('Invalid string removal');
			}
			else throw new Error('Unsupported operator: ' + `(${token.value})`);
		}

		return result;
	}
}


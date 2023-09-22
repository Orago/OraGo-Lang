import { Token } from './token.js';

export class Arrow {
	static test (iter){
		return (
			(
				iter.peek().type === Token.Type.Op &&
				iter.peek().value === '-'
			) &&
			(
				iter.peek(2).type === Token.Type.Op &&
				iter.peek(2).value === '>'
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
			if (peek.value === ')') return true;

			if (peek.type === Token.Type.Identifier)
				tokens.push(iter.read());
			else false;

			if (iter.disposeIf(token => token.value === ',' && token.type === Token.Type.Op))
				return loopSearch();

			return iter.disposeIf(')') == true;
		}

		if (Parenthesis.test(iter))
			if (iter.disposeIf('(')){
				return {
					status: loopSearch(),
					tokens
				};
			}

		return {
			status: false,
			tokens
		}
	}

	static parse (Instance, { iter, scope }){
		const items = [];
		const item = (value, token) => items.push({ value, token });

		const loopSearch = () => {
			if (Token.isData(iter.peek())){
				const token = iter.read();

				item(
					Instance.processValue({ iter, value: token.value, token, scope }),
					token
				);
			}

			if (iter.disposeIf(token => token.value === ',' && token.type === Token.Type.Op))
				loopSearch();
		}

		if (Parenthesis.test(iter))
			if (iter.disposeIf('(')){
				loopSearch();

				return {
					status: iter.disposeIf(')') == true,
					items
				};
			}
		
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
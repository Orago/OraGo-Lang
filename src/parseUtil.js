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

	static parse (iter){
		const tokens = [];

		if (Parenthesis.test(iter))
			if (iter.disposeIf('(')){
				while (!iter.disposeIf(')'))
					tokens.push(iter.read());

				return {
					status: true,
					tokens
				}
			}
		
		return {
			status: false,
			tokens
		}
	}
}
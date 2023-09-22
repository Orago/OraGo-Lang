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

				if (iter.disposeIf(')') != true)
					throw 'Unended parenthesis';

				return {
					status: true,
					items
				}
			}
		
		return {
			status: false,
			tokens: items
		}
	}
}
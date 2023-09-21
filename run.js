import Ora, { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'
import { Token, KeywordToken } from './src/token.js';

const printFN = new CustomFunction('print', function ({ iter, scope }) {
	const { keywords: kw } = this;
	const input = iter.next();
	
	if (!input.value) return;

	const results = [this.parseInput(iter, input, scope)];

	while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done)
		results.push(
			this.parseInput(iter, iter.next(), scope)
		);

	results.length > 0 && console.log(...results.map(e => this.trueValue(e)));
});

const OraPrint = new Extension({
	keyword: new CustomKeyword('print', ['printout']),
	processors: [
		new ValueProcessor({
			validate ({ token }){
				return token.type === Token.Type.Keyword && token.keyword === 'print';
			},
			parse ({ iter, value, token, scope }){
				const read = iter.read();

				if (read.type === Token.Type.String){
					console.log(read.value);
				}
				else {
					console.log(read)
					throw new Error('^ Invalid value to print');
				}
				return value;
			}
		})
	],
});

const oraComment = new Extension({
	keyword: new CustomKeyword('comment', ['comment', '#']),
	function: new CustomFunction('comment', function () {
		return ({ break: true });
	})
});

const toylang = new Ora({
	extensions: [
		oraComment,
		OraPrint
	]
});

toylang.run(`printout "hello world"`);

/*
	fn catto {
		printout "hello world";
	}

*/
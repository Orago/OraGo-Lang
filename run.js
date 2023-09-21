import Ora, { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'
import { Token, KeywordToken } from './src/token.js';

const printFN = new CustomFunction('print', function ({ iter, scope }) {
	const { keywords: kw } = this;
	
	const results = [];

	const handleAdd = () => {
		const token = iter.read();

		if ([Token.Type.String, Token.Type.Number].some(ttype => ttype === token.type)){
			results.push(this.getNext({ iter, scope }));
		}
		
	}

	handleAdd();
	
	// if (false){
	// 	const results = [this.processValue({ iter, value: token, token })];
	// }

	// while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done)
	// 	results.push(
	// 		this.parseInput(iter, iter.read(), scope)
	// 	);

	results.length > 0 && console.log(...results);
});



const OraPrint = new Extension({
	keyword: new CustomKeyword('print', ['printout']),
	function: printFN
	// processors: [
	// 	new ValueProcessor({
	// 		validate ({ token }){
	// 			return token.type === Token.Type.Keyword && token.keyword === 'print';
	// 		},
	// 		parse ({ iter, value }){
	// 			const read = iter.read();

	// 			if (read.type === Token.Type.String){
	// 				console.log(read.value);
	// 			}
	// 			else {
	// 				console.log(read)
	// 				throw new Error('^ Invalid value to print');
	// 			}
	// 			return value;
	// 		}
	// 	})
	// ],
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
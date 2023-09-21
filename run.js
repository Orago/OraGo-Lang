import Ora, { OraProcessed, CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'
import { Token, KeywordToken } from './src/token.js';

const printFN = new CustomFunction('print', function ({ iter, scope }) {
	const results = [];

	const handleAdd = () => {
		const token = iter.peek();

			results.push(this.getNext({ iter, scope }));
		
		if (iter.disposeIf(next => next.type === Token.Type.Op && next.value === '&'))
			handleAdd();
	}

	handleAdd();

	results.length > 0 && console.log(...results);
});



const OraPrint = new Extension({
	keyword: new CustomKeyword('print', ['printout']),
	function: printFN
});

const oraComment = new Extension({
	keyword: new CustomKeyword('comment', ['comment', '#']),
	function: new CustomFunction('comment', function () {
		return ({ break: true });
	})
});

const arrayCreation = new Extension({
	processors: [
		new ValueProcessor({
			validate ({ iter, token, value }){
				return token.type === Token.Type.Seperator && token.value === '[';
				// return token.type === Token.Type.Keyword && token.keyword === 'print';
			},
			parse ({ iter, scope }){
				const array = [];
				let tries = 0;

				console.log(iter.peek())
				
				while (!iter.disposeIf(']')){
					if (tries++ > 1000) throw new Error('Cannot parse more than 1000 items in an array');
					if (iter.disposeIf(',') && iter.disposeIfNot(next => {
						console.log('testnot', next)
						return false;
					})) continue;

					const token = iter.read();

					if (token.value == undefined) break;

					array.push(
						this.processValue({ iter, value: token.value, token, scope })
					);
				}

				return array;
			}
		})
	]
})

const stringExt = new Extension({
	processors: [
		new ValueProcessor({
			validate ({ iter, token, value }){
				return (
					token.type === Token.Type.String &&
					this.disposeIfArrow(iter)
				);
				// return token.type === Token.Type.Keyword && token.keyword === 'print';
			},
			parse ({ iter, value }){
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

const toylang = new Ora({
	extensions: [
		arrayCreation,

		oraComment,
		OraPrint,
		stringExt,
	]
});

console.time('processed');
toylang.run(`
	printout [50, '22']
`);
console.timeEnd('processed');

/*
	fn catto {
		printout "hello world";
	}

*/
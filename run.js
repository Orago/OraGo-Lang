import Ora, { OraProcessed, CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'
import { Token, KeywordToken } from './src/token.js';
import { DataType } from './src/dataType.js';

const printFN = new CustomFunction('print', function ({ iter, scope }) {
	const results = [];

	const handleAdd = () => {
		const token = iter.peek();

		if (Token.isData(token)){
			results.push(this.getNext({ iter, scope }));
		}
		
		if (iter.disposeIf(next => next.type === Token.Type.Op && next.value === '&'))
			handleAdd();
	}

	handleAdd();

	results.length > 0 && console.log('PRINTING', ...results.map(item => item instanceof DataType.Any ? item.valueOf() : item));
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
				return (
					token.type === Token.Type.Seperator &&
					token.value === '[' &&
					value instanceof DataType.Array != true
				);
			},
			parse ({ iter, scope }){
				const array = [];
				let tries = 0;

				while (!iter.disposeIf(']')){
					if (tries++ > 20) throw new Error('Cannot parse more than 1000 items in an array');
					if (iter.disposeIf(',')){
						if (Token.isData(iter.peek()) != true)
							iter.dispose(1);
						continue;
					}

					const token = iter.read();

					if (token.value == undefined) break;

					array.push(
						this.processValue({ iter, value: token.value, token, scope })
					);
				}

				return new OraProcessed({ value: new DataType.Array(array) });
			}
		})
	]
});

// must come first
const toDataType = new Extension({
	processors: [
		new ValueProcessor({
			validate ({ value }){
				return value instanceof DataType.Any != true;
				// return token.type === Token.Type.Keyword && token.keyword === 'print';
			},
			parse ({ value }){
				if (typeof value === 'string')
					return new OraProcessed({
						value: new DataType.String(value)
					})

				else if (typeof value === 'number')
					return new OraProcessed({
						value: new DataType.Number(value)
					});
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
					console.log('STRING EXT', read.value);
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
		// must come first
		toDataType,
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
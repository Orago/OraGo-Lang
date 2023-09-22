import Ora, { OraProcessed, CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'
import { Token, KeywordToken } from './src/token.js';
import { DataType } from './src/dataType.js';
import { Arrow, Parenthesis } from './src/parseUtil.js';

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
					value === '[' &&
					value instanceof DataType.Array != true
				);
			},
			parse ({ iter, scope, token }){
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
			validate ({ value, token }){
				return (
					value instanceof DataType.Any != true && Token.isData(token)
				);
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

const arrayExt = new Extension({
	processors: [
		new ValueProcessor({
			validate ({ iter, value }){
				return (
					value instanceof DataType.Array &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value }){
				const read = iter.read();

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'join': {
							const parenthesis = Parenthesis.parse(iter);

							if (parenthesis.status != true || parenthesis.tokens.length != 1)
								throw 'Failed to join';

							const [token] = parenthesis.tokens;
							const text = (token.type === Token.Type.String || token.type === Token.Type.Number) ? token.value : ''

							return new OraProcessed({
								value: new DataType.String(
									value.valueOf().join(text)
								)
							})
						};

						case 'reverse': {
							value.value.reverse();

							return new OraProcessed({ value });
						}
						default: throw 'Invalid submethod on array'
					}
				}
				else {
					console.log(read)
					throw new Error('^ Invalid value to print');
				}
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
		arrayExt,
	]
});

console.time('processed');
toylang.run(`
	printout [50, '22'] -> reverse -> join(' !!!! ')
`);
console.timeEnd('processed');

/*
	fn catto {
		printout "hello world";
	}

*/
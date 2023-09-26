
import { OraProcessed } from '../main.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from '../util/extensions.js';
import { DataType } from '../util/dataType.js';
import { Token } from '../util/token.js';
import { Arrow, Parenthesis } from '../util/parseUtil.js';

import { fnExt } from './basic/function.js';
export { fnExt };

import { varExt } from './basic/variable.js';
export { varExt };

const printFN = new CustomFunction('print', function ({ iter, scope }) {
	const results = [];

	const handleAdd = () => {
		const token = iter.peek();

		if (Token.isData(token)){
			results.push(this.processNext({ iter, scope }));
		}
		
		if (iter.disposeIf(next => next.type === Token.Type.Op && next.value === '&'))
			handleAdd();
	}

	handleAdd();

	results.length > 0 && console.log('PRINTING', ...results.map(item => item instanceof DataType.Any ? item.valueOf() : item));
});

export const OraPrint = new Extension({
	keyword: new CustomKeyword('print', ['print']),
	function: printFN
});

export const arrayCreation = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.pre,
			validate ({ token, value }){
				return (
					token.type === Token.Type.Seperator &&
					value === '[' &&
					value instanceof DataType.Array != true
				);
			},
			parse ({ iter, scope }){
				const array = [];
				let tries = 0;

				while (!iter.disposeIf(']')){
					if (tries++ > 20)
						throw new Error('Cannot parse more than 1000 items in an array');

					if (iter.disposeIf(',')){
						if (Token.isData(iter.peek()) != true)
							iter.dispose(1);

						continue;
					}

					const token = iter.read();

					if (token.value == undefined) break;

					array.push(
						this.processValue({
							iter,
							value: token.value,
							token,
							scope
						})
					);
				}

				return new OraProcessed({
					value: new DataType.Array(array)
				});
			}
		})
	]
});

export const arrayExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, value }){
				return (
					value instanceof DataType.Array &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value, scope }){
				const read = iter.read();

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'size':
							return new OraProcessed({
								value: new DataType.Number(value.value.length)
							});

						case 'join': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true || parenthesis.items.length != 1)
								throw 'Failed to join';

							const [{ token }] = parenthesis.items;
							const text = (token.type === Token.Type.String || token.type === Token.Type.Number) ? token.value : ''

							return new OraProcessed({
								value:
									new DataType.String(
										value.valueOf().join(text)
									)
							})
						};

						case 'get': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true)
								throw 'Failed to get';

							const [{ token }] = parenthesis.items;
							const index = token.type === Token.Type.Number ? token.value : -1

							return new OraProcessed({
								value: value.valueOf()[index]
							});
						};

						case 'push': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true || parenthesis.items.length == 0)
								throw 'Failed to push';

							for (const item of parenthesis.items)
								value.value.push(item.value);
							
							return new OraProcessed({
								changed: true
							});
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

export const objectExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, value }){
				return (
					value instanceof DataType.Object &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value }){
				const read = iter.read();

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'size':
							return new OraProcessed({
								value: new DataType.Number(Object.keys(value.valueOf()).length)
							});

						default: throw 'Invalid submethod on object'
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
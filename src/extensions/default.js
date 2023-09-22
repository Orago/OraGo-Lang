
import { OraProcessed } from '../main.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from '../extensions.js';
import { DataType } from '../dataType.js';
import { Token } from '../token.js';
import { Arrow, Parenthesis, Math } from '../parseUtil.js';

export const oraComment = new Extension({
	keyword: new CustomKeyword('comment', ['comment', '#']),
	function: new CustomFunction('comment', function () {
		return ({ break: true });
	})
});

export const toDataType = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.pre,
			validate ({ value, token }){
				return (
					value instanceof DataType.Any != true && Token.isData(token)
				);
			},
			parse ({ value, token, scope }){
				if (typeof value === 'string'){
					if (token.type === Token.Type.String){
						return new OraProcessed({
							value: new DataType.String(value)
						})
					}
					else if (token.type === Token.Type.Identifier){
						return new OraProcessed({
							value: scope.flat?.[value]
						})
					}
				}
	
				else if (typeof value === 'number' && token.type === Token.Type.Number)
					return new OraProcessed({
						value: new DataType.Number(value)
					});

				// else if (typeof value === 'string ')
			}
		})
	]
});

export const stringExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, token }){
				if (
					token.value === '(' &&
					token.type === Token.Type.Seperator && 
					iter.peek().type === Token.Type.String
				) return true;

				return (
					token.type === Token.Type.String &&
					iter.peek().type === Token.Type.Op &&
					Math.Operators.includes(iter.peek().value)
				);
			},
			parse ({ iter, token }){
				iter.tokens.unshift(token);

				const parsed = Math.performStringOperation(iter);

				return new OraProcessed({ value: new DataType.String(parsed) });
			}
		}),
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,

			validate ({ iter, value }){
				return (
					value instanceof DataType.String &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value, scope }){
				const read = iter.read();

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'size': return new OraProcessed({
							value: new DataType.Number(value.value.length)
						});

						case 'split': {
							const parenthesis = Parenthesis.parse(this, { iter, scope })
							if (parenthesis.status != true || parenthesis.tokens.length != 1)
								throw 'Failed to join';

							const [{ token }] = parenthesis.items;
							const text = (token.type === Token.Type.String || token.type === Token.Type.Number) ? token.value : ''

							return new OraProcessed({
								value: new DataType.Array(
									value.valueOf().split(text)
								)
							})
						};

						default: throw 'Invalid submethod on string'
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

export const numberExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, token }){
				if (
					token.value === '(' &&
					token.type === Token.Type.Seperator && 
					iter.peek().type === Token.Type.Number
				) return (iter.tokens.unshift(token), true);

				return (
					token.type === Token.Type.Number &&
					iter.peek().type === Token.Type.Op &&
					Math.Operators.includes(iter.peek().value)
				);
			},
			parse ({ iter }){
				const parsed = Math.parse(iter);

				return new OraProcessed({
					value: new DataType.Number(parsed)
				});
			}
		})
	]
});
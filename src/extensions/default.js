
import { ValueChange } from '../main.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from '../util/extensions.js';
import { DataType } from '../util/dataType.js';
import { Token } from '../util/token.js';
import { Arrow, Parenthesis, OraMath } from '../util/parseUtil.js';

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
				return value instanceof DataType.Any != true && Token.isData(token);
			},
			parse ({ value, token, scope }){
				if (typeof value === 'string'){
					if (token.type === Token.Type.Identifier)
						return new ValueChange({ value: scope.flat?.[value] });

					else if (token.type === Token.Type.String)
						return new ValueChange({ value: new DataType.String(value) });
				}
	
				else if (typeof value === 'number' && token.type === Token.Type.Number)
					return new ValueChange({ value: new DataType.Number(value) });
			}
		})
	]
});

export const stringExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, value }){
				return (
					(value instanceof DataType.String) &&
					iter.peek().type === Token.Type.Op &&
					OraMath.Operators.includes(iter.peek().value)
				);
			},
			parse ({ iter, token, value, scope }){
				token.value = value.valueOf();
				iter.tokens.unshift(token);

				const parsed = OraMath.performStringOperation(this, { iter, scope });

				return new ValueChange({
					value: new DataType.String(parsed)
				});
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
						case 'size':
							return new ValueChange({
								value: new DataType.Number(value.value.length)
							});

						case 'split': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true || parenthesis.items.length != 1)
								throw 'Failed to join';

							const [{ token }] = parenthesis.items;
							const text = (token.type === Token.Type.String || token.type === Token.Type.Number) ? token.value : ''

							return new ValueChange({
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
					OraMath.Operators.includes(iter.peek().value)
				);
			},
			parse ({ iter }){
				const parsed = OraMath.parse(iter);

				return new ValueChange({
					value: new DataType.Number(parsed)
				});
			}
		})
	]
});

import Ora, { OraProcessed, Scope } from '../main.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from '../extensions.js';
import { DataType } from '../dataType.js';
import { Token } from '../token.js';
import { Arrow, Parenthesis, Block } from '../parseUtil.js';

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
	keyword: new CustomKeyword('print', ['print']),
	function: printFN
});

export const oraComment = new Extension({
	keyword: new CustomKeyword('comment', ['comment', '#']),
	function: new CustomFunction('comment', function () {
		return ({ break: true });
	})
});

export const arrayCreation = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.pre,
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
							value: 
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
})

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
						case 'size': return new OraProcessed({
							value: new DataType.Number(value.value.length)
						});

						case 'join': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true || parenthesis.tokens.length != 1)
								throw 'Failed to join';

							const [{ token }] = parenthesis.items;
							const text = (token.type === Token.Type.String || token.type === Token.Type.Number) ? token.value : ''

							return new OraProcessed({
								value: new DataType.String(
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
							})
						};

						case 'push': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true || parenthesis.items.length == 0)
								throw 'Failed to push';

							for (const item of parenthesis.items){
								value.value.push(item.value);
							}
							
							return new OraProcessed({
								changed: true
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

export const stringExt = new Extension({
	processors: [
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
						case 'size': return new OraProcessed({
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

DataType.Function = class FunctionDataType extends DataType.Any {
	Instance;

	scope;
	tokens;
	arguments;

	constructor (Instance, { scope, code, args }){
		super (Symbol('DataType.Function'));

		if (Instance instanceof Ora != true)
			throw 'Invalid Instance';

		this.Instance = Instance;

		if (scope instanceof Scope != true)
			throw 'Invalid function scope';

		this.scope = scope;

		if (Array.isArray(code) != true)
			throw new Error('Invalid function code');

		this.tokens = code;

		if (Array.isArray(args) != true)
			throw new Error('Invalid function arguments');

		this.arguments = args;
	}

	call (...args){
		let i = -1;

		for (const arg of args)
			this.scope[this.arguments[i++]] = arg;

		this.Instance.runTokens(this);
	}
}

export const fnExt = new Extension({
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.pre,
			validate ({ iter, value, token }){
				return (
					token.type === Token.Type.Keyword &&
					token.keyword === 'function' &&
					value instanceof DataType.Function != true
				);
			},
			parse ({ iter, value, scope: oldScope }){
				let assign = true;
				let scope = oldScope;
				let varname;

				if (iter.peek().type === Token.Type.Identifier){
					const [read] = iter.dispose(1);
					assign = true;
					scope = this.subscope(oldScope);
					varname = read.value;
				}

				const pst = Parenthesis.parseIdentifiers(iter);

				if (pst.status === true){
					const args = pst.tokens.map(token => token.value);

					if (Arrow.disposeIf(iter)){
						console.log ('is arrow func');
					}
					else if (Block.test(iter)){
						const { tokens: code } = Block.read(iter);

						const fn = new DataType.Function(this, { scope, code, args });

						if (varname != null && assign) oldScope.data[varname] = fn;

						return new OraProcessed({
							value: fn
						});
					}
					else throw new Error('Invalid function continuance');
				}
				else throw new Error('Failed to parse arguments');
			}
		}),
		new ValueProcessor({
			priority: ValueProcessor.Priority.modifier,
			validate ({ iter, value, token }){
				console.log('testing', token, value?.valueOf(), value instanceof DataType.Function)
				return (
					value instanceof DataType.Function &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value, scope }){
				const read = iter.read();

				console.log('next')

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'call': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });
							const args = [];

							if (parenthesis.status != true || parenthesis.items.length == 0)
								throw 'Failed to call';

							for (const item of parenthesis.items){
								args.push(item.value);
							}

							console.log('VALUES TO RUN', args)
							
							return new OraProcessed({
								changed: true
							})
						};

						default: throw 'Invalid submethod on function'
					}
				}
				else {
					console.log(read)
					throw new Error('^ Invalid value to printdwadwadaw func');
				}
			}
		})
	],
});

export const allDefaults = [
	toDataType,
	arrayCreation,
	oraComment,
	OraPrint,

	arrayExt,
	stringExt,

	fnExt
];
import Ora, { OraProcessed, Scope, CustomKeyword } from '../../main.js';
import { ValueProcessor, Extension } from '../../util/extensions.js';
import { DataType } from '../../util/dataType.js';
import { Token } from '../../util/token.js';
import { Arrow, Parenthesis, Block } from '../../util/parseUtil.js';

DataType.Function = class FunctionDataType extends DataType.Any {
	constructor (Instance, { scope, code, args }){
		if (Instance instanceof Ora != true)
			throw 'Invalid Instance';

		if (scope instanceof Scope != true)
			throw 'Invalid function scope';

		if (Array.isArray(code) != true)
			throw new Error('Invalid function code');

		if (Array.isArray(args) != true)
			throw new Error('Invalid function arguments');

		super (Symbol('DataType.Function'));

		this.instance = Instance;
		this.scope = scope;
		this.tokens = code;
		this.arguments = args;
	}

	call (...args){
		let i = 0;

		for (const arg of args)
			this.scope.data[this.arguments[i++]] = arg;

		return this.instance.runTokens(this);
	}
}

export const fnExt = new Extension({
	keyword: new CustomKeyword('function', ['fn']),
	processors: [
		new ValueProcessor({
			priority: ValueProcessor.Priority.pre,
			validate ({ value, token }){
				return (
					token.type === Token.Type.Keyword &&
					token.keyword === 'function' &&
					value instanceof DataType.Function != true
				);
			},
			parse ({ iter, scope: oldScope }){
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

						if (varname != null && assign)
							oldScope.data[varname] = fn;

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
			validate ({ iter, value }){
				return (
					value instanceof DataType.Function &&
					Arrow.disposeIf(iter)
				);
			},
			parse ({ iter, value, scope }){
				const read = iter.read();

				if (read.type === Token.Type.Identifier){
					switch (read.value){
						case 'call': {
							const parenthesis = Parenthesis.parse(this, { iter, scope });

							if (parenthesis.status != true)
								throw 'Failed to call';

							return new OraProcessed({
								value: value.call(...parenthesis.items)
							});
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
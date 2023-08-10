import {
	valueProcessor,
	valuePostProcessor,

	customFunction,
	customKeyword,
	customExtension,
	extensionPack
} from '../ora/util/extensions.js';


const oraComment = new customExtension({
	keyword: new customKeyword('comment', ['comment', '#']),
	function: new customFunction('comment', function () {
		return ({ break: true });
	})
});

export { oraComment };

const oraReturn = new customExtension({
	keyword: new customKeyword('return', ['return']),
	function: new customFunction('return', function ({ iter, scope }) {
		return this.parseNext(iter, scope)
	})
});

export { oraReturn };

const oraValueSetter = new customExtension({
	keyword: new customKeyword('set', ['let']),
	processors: [
		new valueProcessor({
			validate ({ iter }){
				const { keywords: kw } = this;

				return iter.disposeIf(next => kw.is(next, kw.id.assign));
			},
			parse ({ iter, value, scope, path }){
				if (value != undefined)
					this.setOnPath({
						source: scope.variables,
						path,
						value: this.parseNext(iter, scope)
					});
				else throw 'Cannot mod a raw variable to a value!'
			}
		})
	],
	function: new customFunction('set', function ({ iter, scope }) {
		const { keywords: kw, DataType } = this;
		const { isA_0 } = this.utils;

		const { variables: source } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : scope);
		const varname = iter.next().value;
		
		if (kw.has(varname))
			throw `Cannot set variable to function name: ${varname}`;
		
		let type = DataType.any;

		if (iter.disposeIf(next => kw.is(next, kw.id.as)))
			type = this.keywordToType(iter.next().value);

		if (isA_0(varname) ){
			if (iter.disposeIf(next => kw.is(next, kw.id.assign)))
				this.setOnPath({
					source,
					path: [varname, ...this.getPath({ iter, scope })],
					type,
					value: this.parseInput(iter, iter.next(), scope)
				});
				
			else 
				this.setOnPath({
					source,
					path: [varname, ...this.getPath({ iter, scope })],
					type,
					value: type.default
				});
		}

		else throw `Invalid Variable Name: (${varname})`;
	})
});

export { oraValueSetter };


//* Arrays

const oraArrayAddon = new customExtension({
	processors: [
		new valuePostProcessor({
			validate ({ value }){
				return Array.isArray(value);
			},
			parse ({ iter, value, scope }){
				const Next = () => this.parseNext(iter, scope);

				const handle = (arr) => {
					if (iter.disposeIf('push')){
						arr.push(Next());

						return handle(arr);
					}
					else if (iter.disposeIf('pop')){
						arr.pop();

						return handle(arr);
					}
					else if (iter.disposeIf('concat')){
						const nextItem = Next();

						if (Array.isArray(nextItem) != true)
							throw 'Cannot concat on non array';
						
						return handle([].concat.apply([], [arr, nextItem]));
					}
					else if (iter.disposeIf('join')){
						const nextItem = Next();

						if (Array.isArray(nextItem) != true)
							throw 'Cannot join on non array';

						arr.push(...nextItem);

						return handle(arr);
					}

					return arr;
				}

				return handle(value);
			}
		})
	],
});

export { oraArrayAddon };

const oraBasicExtension = new extensionPack(
	oraComment,
	oraReturn,
	oraValueSetter,
	oraArrayAddon
);
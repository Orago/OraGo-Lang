import {
	valueProcessor,
	valuePostProcessor,

	customFunction,
	customKeyword,
	customExtension,
	extensionPack
} from '../ora/util/extensions.js';

export const oraComment = new customExtension({
	keyword: new customKeyword('comment', ['comment', '#']),
	function: new customFunction('comment', function () {
		return ({ break: true });
	})
});

export const oraReturn = new customExtension({
	keyword: new customKeyword('return', ['return']),
	function: new customFunction('return', function ({ iter, scope }) {
		return this.parseInput(iter, iter.next(), scope)
	})
});

export const oraValueSetter = new customExtension({
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

//* Arrays
export const oraArrayAddon = new customExtension({
	processors: [
		new valuePostProcessor({
			validate ({ value }){
				return Array.isArray(value);
			},
			parse ({ iter, value, scope }){
				const { keywords: kw } = this;
				const Next = () => this.parseNext(iter, scope);

				function ReflectArray(oldArr, newArr) {
					while (oldArr.length > 0)
						oldArr.pop();

					oldArr.push(...newArr);

					return newArr;
				}

				function handle(arr) {
					// console.log('Peeky', iter.stack, arr)
					// if (iter.disposeIfNot(next => kw.is(next, kw.id.concat)))
					// 	return arr;
					
					if (iter.disposeIf('push')) {
						arr.push(Next());

						return handle(arr);
					}
					else if (iter.disposeIf('pop')) {
						arr.pop();

						return handle(arr);
					}
					else if (iter.disposeIf('concat')) {
						const nextItem = Next();

						if (Array.isArray(nextItem) != true)
							throw 'Cannot concat on non array';

						return handle([].concat.apply([], [arr, nextItem]));
					}
					else if (iter.disposeIf('join')) {
						const nextItem = Next();

						if (Array.isArray(nextItem) != true)
							throw 'Cannot join on non array';

						arr.push(...nextItem);

						return handle(arr);
					}
					else if (iter.disposeIf(next => kw.is(next, kw.id.has))){
						return arr.includes(Next());
					}
					else if (iter.disposeIf('map')){
						const nextItem = Next();

						if (typeof nextItem != 'function')
							throw 'Invalid function to map to';

						const mapped = arr.map(nextItem);

						if (iter.disposeIf('reflect'))
							ReflectArray(arr, mapped);

						return mapped;
					}

					return arr;
				}

				return handle(value);
			}
		})
	],
});


export const oraObjectAddon = new customExtension({
	processors: [
		new valuePostProcessor({
			validate ({ value }){
				return typeof value === 'object' && Array.isArray(value) != true;
			},
			parse ({ iter, value, scope }){
				console.log('THIS OBJ', value.hello)
				return value;
			}
		})
	],
});

export const oraDEFAULTS = new extensionPack(
	oraComment,
	oraReturn,
	oraValueSetter,
	oraArrayAddon,
	oraObjectAddon
);
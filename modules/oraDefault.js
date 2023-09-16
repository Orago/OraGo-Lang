import {
	valueProcessor,
	valuePostProcessor,

	customFunction,
	customKeyword,
	customExtension,
	extensionPack
} from '../ora/util/extensions.js';

import OraType from '../ora/util/DataTypes.js';

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
					if (iter.disposeIf('reverse')) {
						return handle(arr.reverse());
					}
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

						return handle(mapped);
					}
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
				// console.log('THIS OBJ', value.hello)
				return value;
			}
		})
	],
});

export const oraStringAddon = new customExtension({
	processors: [
		new valuePostProcessor({
			validate ({ value }){
				return typeof value === 'string';
			},
			parse ({ iter, value, scope }){
				const { keywords: kw } = this;
				const Next = () => this.parseNext(iter, scope);

				function handle(str) {
					if (iter.disposeIf('reverse')) {
						return handle(str.split('').reverse().join(''));
					}
					else if (iter.disposeIf('concat')) {
						const nextItem = Next();

						if (typeof nextItem != 'string')
							throw 'Cannot concat on non string';

						return handle(str.concat(nextItem));
					}
					else if (iter.disposeIf('split')){
						return str.split(Next());
					}
					else if (iter.disposeIf(next => kw.is(next, kw.id.has))){
						return str.includes(Next());
					}
				}

				return handle(value);
			}
		})
	],
});

Object.entries({ cat: 'meow', dog: 'woof' }).map(item => item.join(':')).join(',');

export const oraTypeConversion = new customExtension({
	processors: [
		new valuePostProcessor({
			validate ({ iter }){
				const { keywords: kw } = this;

				return iter.disposeIf(next => kw.is(next, kw.id.as));
			},
			parse ({ iter, value, scope }){
				const Next = () => this.parseNext(iter, scope);
				const toEnum = arr => Object.fromEntries(arr.map((item, index) => [item, index]));
				const fromEnum = obj => Object.keys(obj);
				const err = type => `Invalid casting for ${type}`;

				const handle = (value) => {
					const castType = this.keywordToType(Next());

					if (Array.isArray(value)){
						switch (castType){
							case OraType.string: return value.join('');
							case OraType.object: return toEnum(value);
							case OraType.bool: return value.length > 0;
							case OraType.number: return value.length;
							default: throw err('array');
						}
					}
					else if (typeof value == 'object'){
						switch (castType){
							case OraType.array: return Object.entries(value);
							case OraType.string: return Object.entries(value)
								.map(item => item.join(':'))
								.join(',');
							case OraType.bool: return Object.keys(value).length > 0;
							default: throw err('object');
						}
					}
					else if (typeof value == 'string'){
						switch (castType){
							case OraType.array: return value.split('');
							case OraType.number: return isNaN(value) ? 0 : Number(value);
							case OraType.bool: return value.length > 0;
							default: throw err('string');
						}
					}
					else if (typeof value === 'number'){
						switch (castType){
							case OraType.array: return Array.from({ length: value }, (_, index) => index + 1);
							case OraType.number: return isNaN(value) ? 0 : Number(value);
							case OraType.bool: return value > 0;
							default: throw err('number');
						}
					}
				}

				return handle(value);
			}
		})
	],
});

export const oraDEFAULTS = new extensionPack(
	oraComment,
	oraReturn,
	oraValueSetter,
	oraArrayAddon,
	oraObjectAddon,
	oraStringAddon,
	oraTypeConversion
);
import deepClone from './util/deepClone.js';


export default function (){
	const { keywords: kw } = this;

	return {
		[kw.id.copy] ({ iter, scope }) {
			return deepClone(this.parseInput(iter, iter.next(), scope));
		},

		[kw.id.random] ({ iter, scope }) {
			const nextResult = this.parseInput(iter, iter.next(), scope);

			if (Array.isArray(result)){
				// result = shuffleArray(result);
			}
			else if (typeof result === 'string'){
				// result = shuffleArray(result.split('')).join('');
			}

			else if (typeof result === 'number'){
				// const size = forceType.forceNumber(
				// 	this.parseValue(iter, iter.next().value, data)
				// );

				// result = random(result, size);
			}
		}
	};
};
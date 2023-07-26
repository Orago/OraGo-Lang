import deepClone from './util/deepClone.js';


export default function (){
	const { keywords: kw } = this;

	return {
		[kw.id.copy] ({ iter, data }) {
			return deepClone(parseInput(iter, iter.next(), data));
		}
	};
};
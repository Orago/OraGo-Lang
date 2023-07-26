import { customFunctionContainer } from '../extensions.js';

function loggingUtil (){
	const { keywords: kw } = this;

	return {
		[kw.id.print] ({ iter, data }) {
			const input = iter.next();
			
			if (!input.value) return;

			const results = [this.parseInput(iter, input, data)];

			while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done)
				results.push(
						this.parseInput(iter, iter.next(), data)
				);

			results.length > 0 && console.log(...results.map(e => this.trueValue(e)));
		}
	};
};

export default new customFunctionContainer(loggingUtil)
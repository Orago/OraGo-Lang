import { customFunction, customKeyword, customExtension } from '../ora/util/extensions.js';

const printKW = new customKeyword('print', ['print']);

const printFN = new customFunction('print', function ({ iter, scope }) {
	const { keywords: kw } = this;
	
	const input = iter.next();
	
	if (!input.value) return;

	const results = [this.parseInput(iter, input, scope)];

	while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done)
		results.push(
			this.parseInput(iter, iter.next(), scope)
		);

	results.length > 0 && console.log(...results.map(e => this.trueValue(e)));
});

const oraPrint = 
	new customExtension({
		keyword: printKW,
		function: printFN,
	});

export {
	oraPrint
};
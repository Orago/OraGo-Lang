import Ora from './src/main.js'
import * as Defaults from './src/extensions/default.js';
import * as Basics from './src/extensions/basic.js';

const toylang = new Ora({
	extensions: [
		...Object.values(Defaults),
		...Object.values(Basics),
	]
});

console.time('processed');

toylang.run(`
print 'I am orago, and this is oralang!!!!!!'
`);

console.timeEnd('processed');
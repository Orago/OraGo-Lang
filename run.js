import Ora from './src/main.js'
import { allDefaults } from './src/extensions/default.js';

const toylang = new Ora({
	extensions: allDefaults
});

console.time('processed');
toylang.run(`
	print [50, '22'] -> size
`);

console.timeEnd('processed');

/*
	fn catto {
		printout "hello world";
	}

*/
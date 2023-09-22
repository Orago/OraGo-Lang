import Ora from './src/main.js'
import { allDefaults } from './src/extensions/default.js';
const toylang = new Ora({
	extensions: allDefaults
});

console.time('processed');

toylang.run(`
	print (36 * 7) + 3 / (5 + 2)
`);


console.timeEnd('processed');

/*
	fn catto {
		printout "hello world";
	}

*/



// toylang.run(`
// 	fn cat (hello, world){
// 		print 'hello' & 'world';
// 	}

// 	print [50, '22'] -> push(5, 3, ['3', '2']) -> reverse -> get(0)
// `);
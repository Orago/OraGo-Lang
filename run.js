import Ora from './src/main.js'
import { allDefaults } from './src/extensions/default.js';
const toylang = new Ora({
	extensions: allDefaults
});

console.time('processed');

toylang.run(`
	fn cat (hello, world){
		return 'hello' & 'world';
	}

	print cat -> call();
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
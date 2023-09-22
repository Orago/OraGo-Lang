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
	fn removeAll (fullText, toRemove){
		print 'yeah' & fullText / toRemove

		return fullText / 'dog'
	}


	print removeAll -> call('I am a silly catdog lover, My favorite animals are silly kittdogies', 'dog')
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
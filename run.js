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
  return fullText / toRemove
}

let silly = 'I am a silly catdog lover, My favorite animals are silly kittdogies'

print removeAll -> call(silly, 'dog') -> split(' ') -> reverse -> join('.')
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
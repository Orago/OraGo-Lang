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

let silly = 'We love cats'

print removeAll -> call(silly, 'e')
`);

console.timeEnd('processed');
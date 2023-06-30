import fs from 'fs';
import betterIterable from '../ora/util/betterIterables.js';

const memory = {};

const data = fs.readFileSync('testcode.txt', 'utf8');

const lex_ParseItem = item => isNaN(item) ? item : Number(item);

function oraLexer(input) {
	const output = input.match(/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g);

	if (output == null) throw 'This is a blank file!';

	while (output.indexOf(' ') != -1)
		output.splice(output.indexOf(' '), 1);

	return output;
};

const instance = new class extends betterIterable {
	constructor (){
		
	}
}

console.log(
	oraLexer(data)
)
import fs from 'fs';
import betterIterable from '../ora/util/betterIterables.js';
import { oraLexer } from '../ora/util/lexer.js';

const memory = {};

const data = fs.readFileSync('testcode.txt', 'utf8');

const lex_ParseItem = item => isNaN(item) ? item : Number(item);

const lexText = text => text.split(' ').map(lex_ParseItem);

function lexIntoSections (lexedText){
	const sections = [];

	let section = [];
	let index = 0;

	for (const item of lexedText){
		index++;

		if (item == '\t' || item == '\r') continue;
		else if (item != ';' && item != '\n')
			section.push(item);

		if (item == ';' || item == '\n' || index == lexedText.length){
			if (section.length)
				sections.push(section);

			section = [];
		}
	}

	return sections;
}

class lang {
	#lexed;

	constructor (lexed){
		this.#lexed = lexed;
	}

	seperat
}

console.log(
	lexIntoSections(
		oraLexer(data)
	)
)
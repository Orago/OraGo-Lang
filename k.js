const fs = require('fs');

const memory = {};

const data = fs.readFileSync('e.txt', 'utf8');

// String
// Number

const lex_ParseItem = item => isNaN(item) ? item : Number(item);
const lexText = text => text.split(' ').map(lex_ParseItem);

class tempLang {
	constructor (code){
		this.code = code;
	}
}

console.log(
	lexText(data)
)
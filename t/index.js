const sandbox = require('./sandbox.js');

function splitByNewlines(text) {
	let output = [];
	let current = "";
	let openBrackets = 0;
	let closedBrackets = 0;
	let insideFunction = false;
	for (let i = 0; i < text?.length; i++) {
			if (text[i] === "{") {
					openBrackets++;
					current += text[i];
					insideFunction = true;
			} else if (text[i] === "}") {
					closedBrackets++;
					current += text[i];
					if (openBrackets === closedBrackets) {
							insideFunction = false;
					}
			} else if (text[i] === "\n" && !insideFunction && current?.length > 0) {
					output.push(current);
					current = "";
			} else {
					current += text[i];
			}
	}
	
	current?.length > 0 && output.push(current);

	return output;
}

const code = `
function cat(){
	console.log('hello');
}

function miau (hehe){
	this.d = 'yo';
}
`

console.log(
	splitByNewlines(code)
)
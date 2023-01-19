let input = "This is a function(){console.log('Hello World\n')};\nwith some newlines\ninside\nand outside";

function splitByNewlines(text) {
	let output = [];
	let current = "";
	let brackets = 0;
	for (let i = 0; i < text.length; i++) {
			if (text[i] === "{") {
					brackets++;
					current += text[i];
			} else if (text[i] === "}") {
					brackets--;
					current += text[i];
			} else if (text[i] === "\n" && brackets === 0) {
					output.push(current);
					current = "";
			} else {
					current += text[i];
			}
	}
	output.push(current);
	return output;
}

console.log(
	splitByNewlines(input)
);
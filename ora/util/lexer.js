export function oraLexer(input) {
	const output = input.match(/(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*{}()-_+"'\\/.;:\[\]\s]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g);

	if (output == null) throw 'This is a blank file!';

	while (output.indexOf(' ') != -1)
		output.splice(output.indexOf(' '), 1);

	return output;
}

export function chunkLexed(lexed) {
	const chunks = [];
	let chunk = [];
	let scopeDepth = 0;

	for (const item of lexed) {
			if (item === '{') scopeDepth++;
			else if (item === '}') scopeDepth--;

			if (item === ';' && scopeDepth === 0) {
					chunks.push(chunk);
					chunk = [];
			}
			else if (!['\n', '\t', '\r'].includes(item)) chunk.push(item);
	}

	return chunks;
}
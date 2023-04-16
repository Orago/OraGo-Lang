const fs = require('fs');
const ora = require('../ora/commonJS.js');

const newDict = {
	set: ['me'],
	assign: ['ow'],
	print: ['mrow'],
	function: ['mew'],
	return: ['mow'],

	require: ['mah'],
	import: ['meh'],
	from: ['muh'],

	if: ['meuh'],
	else: ['meah'],
	and: ['ma'],
}

const run = (code) => new ora({ overrideDictionary: newDict }).run(code);

const runPath = async (path) => {
	try { run( await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; }) ); }

	catch (err){ console.error(err); }
}

runPath('index.ora');
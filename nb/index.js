const fs = require('fs');
const ora = require('../ora/commonJS.js');

const newDict = {
	set: ['👉'],
	assign: ['💨'],
	print: ['💬'],
	function: ['🔨'],
	return: ['🏠'],

	import: ['📥'],
	export: ['📤'],

	require: ['🚚'],
	from: ['📦'],
	global: ['🌎'],

	if: ['🤔'],
	else: ['🤷‍♂️'],

	for: ['🔁'],
	loop: ['🔄'],

	equal: ['👌'],
	delete: ['🧺'],
	comment: ['🔇'],
}

const run = (code) => new ora({ overrideDictionary: newDict }).run(code);

const runPath = async (path) => {
	try { run( await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; }) ); }

	catch (err){ console.error(err); }
}

runPath('index.ora');
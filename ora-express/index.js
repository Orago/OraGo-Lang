const fs = require('fs');
const ora = require('../ora/commonJS.js');

const newDict = {
	if: ['?'],
	set: ['@'],
	assign: ['='],
	function: ['*'],
	return: ['>'],
	from: ['~'],
	import: ['imp'],
	require: ['req'],
	global: ['$'],
	print: ['!']
}

const run = (code) => new ora({ overrideDictionary: newDict }).run(code);

const runPath = async (path) => {
	try { run( await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; }) ); }

	catch (err){ console.error(err); }
}

runPath('index.ora');
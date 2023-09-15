import fs from 'fs';
import Ora from '../../ora/ora.js';

const newDict = {
	if: ['?'],
	set: ['@'],
	assign: ['='],
	function: ['*'],
	return: ['>'],
	from: [':'],
	as: ['~'],
	import: ['imp'],
	require: ['req'],
	global: ['$'],
	comment: ['#']
	// print: ['!']
}

const run = (code) => new Ora({ overrideDictionary: newDict }).run(code);

const runPath = async (path) => {
	try { run( await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; }) ); }

	catch (err){ console.error(err); }
}

runPath('index.ora');
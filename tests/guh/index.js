const fs = require('fs');
const ora = require('../../ora/commonJS.js');

const run = (code) => new ora({  }).run(code);

const runPath = async (path) => {
	try { run( await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; }) ); }

	catch (err){ console.error(err); }
}

runPath('index.ora');
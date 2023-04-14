const fs = require('fs');
const ora = require('../ora/index.js');

const run = (code) => {
	const oraInstance = new ora();

	return oraInstance.run(code);
}

const runPath = async (path) => {
	try {
		const code = await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; });

		return run(code);
	}

	catch (err){
		console.error(err);
	}
}

runPath('index.ora');
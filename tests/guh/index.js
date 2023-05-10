import fs from 'fs';
import ora from '../../ora/esm.js';

const run = async (code) => {
	const instance = ora({
		variables: {
			cat: 'testa'
		}
	});
	
	return instance.run(code);
};

const runPath = async (path) => {
	try {
		run(
			await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; })
		);
	}

	catch (err){ console.error(err); }
}

runPath('index.ora');
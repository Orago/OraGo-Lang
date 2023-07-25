import fs from 'fs';
import ora from '../../ora/esm.js';

const run = (code) => {
	const instance = ora({
		variables: { cat: 'testa' }
	});
	
	return instance.run(code);
};

const runPath = (path) => {
	try {
		run(
			fs.readFileSync(path, 'utf8')
		);
	}

	catch (err){ console.error(err); }
}

runPath('index.ora');
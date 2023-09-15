import fs from 'fs';
import ora from '../../ora/ora.js';
import { devUtilKW, devUtilFN } from '../../modules/exec.js';
import logging from '../../ora/util/functions/logging.js';
import loops from '../../ora/util/functions/loops.js';

const run = (code) => {
	const instance = new ora({
		keywords: [
			...devUtilKW
		],
		functions: [
			...devUtilFN,
			logging,
			loops
		]
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

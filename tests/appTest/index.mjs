import fs from 'fs';
import ora from '../../ora/ora.js';
import logging from '../../ora/util/functions/logging.js';
import loops from '../../ora/util/functions/loops.js';
import { appKeywords, appFunctions } from '../app/app.js';

const run = (code) => {
	const instance = new ora({
		keywords: [
			...appKeywords
		],
		functions: [
			logging,
			loops,
			...appFunctions
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

runPath('app.ora');

export default '';
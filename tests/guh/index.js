import fs from 'fs';
import ora from '../../ora/ora.js';
import logging from '../../ora/util/functions/logging.js';
import loops from '../../ora/util/functions/loops.js';
import {
	exportKW,
	importKW,
	exportFunc,
	importFunc
} from '../../ora/esm.js';

const run = (code) => {
	const instance = new ora({
		keywords: [
			exportKW,
			importKW,
		],
		functions: [
			logging,
			loops,
			exportFunc,
			importFunc
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
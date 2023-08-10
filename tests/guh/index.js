import fs from 'fs';
import ora from '../../ora/ora.js';
import loops from '../../ora/util/functions/loops.js';
import oraModules from '../../modules/oraModules.js';

import { oraPrint } from '../../modules/oraLogging.js';

const run = (code) => {
	const instance = new ora({
		extensions: [
			oraPrint,
			oraModules
		],

		functions: [
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
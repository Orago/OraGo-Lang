import fs from 'fs';
import ora from '../../ora/ora.js';
import oraModules from '../../modules/oraModules.js';

import { oraPrint } from '../../modules/oraLogging.js';
import * as OraLoops from '../../modules/oraLoops.js';
import { oraDeveloperUtil } from '../../modules/oraDeveloper.js';
import { oraMessageBoxOk } from '../../modules/MessageBox/index.js';

import { oraDEFAULTS } from '../../modules/oraDefault.js';
import { oraComparison } from '../../modules/oraMath.js';
import { oraArrayAddon } from '../../modules/oraDefault.js';

const run = (code) => {
	const instance = new ora({
		extensions: [
			...Object.values(OraLoops),
			oraDEFAULTS,
			oraDeveloperUtil,
			oraPrint,
			oraModules,
			oraMessageBoxOk,
			oraComparison,
			oraArrayAddon
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

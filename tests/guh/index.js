import fs from 'fs';
import ora from '../../ora/ora.js';
import oraModules from '../../modules/oraModules.js';

import { oraPrint } from '../../modules/oraLogging.js';
import { oraLoopPack } from '../../modules/oraLoops.js';
import { oraDeveloperUtil } from '../../modules/oraDeveloper.js';
import { oraMessageBoxOk } from '../../modules/MessageBox/index.js';

import { oraValueSetter } from '../../modules/oraDefault.js';
import { oraComparison } from '../../modules/oraMath.js';
import { oraArrayAddon } from '../../modules/oraDefault.js';
import { getClipboardText } from '../../modules/MessageBox/clipboard.js';

console.log(getClipboardText())

const run = (code) => {
	const instance = new ora({
		extensions: [
			oraDeveloperUtil,
			oraPrint,
			oraModules,
			oraLoopPack,
			oraMessageBoxOk,
			oraValueSetter,
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

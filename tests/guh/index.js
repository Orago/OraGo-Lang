import fs from 'fs';
import ora from '../../ora/ora.js';
import oraModules from '../../modules/oraModules.js';

import { oraPrint } from '../../modules/oraLogging.js';
import { oraLoopPack } from '../../modules/oraLoops.js';
import { oraDeveloperUtil } from '../../modules/oraDeveloper.js';
import { oraMessageBoxOk } from '../../modules/MessageBox/index.js';

import { valuePreProcessor, customExtension, customKeyword } from '../../ora/util/extensions.js';

const gibby = new customExtension({
	keyword: new customKeyword('gibby', ['gibby']),
	valuePreProcessors: [
		new valuePreProcessor({
			validate ({ value }){
				return value === 'gibby';
			},
			parse ({ value }){
				return 'meyehehehehe'
			}
		})
	]
})

const run = (code) => {
	const instance = new ora({
		extensions: [
			oraDeveloperUtil,
			oraPrint,
			oraModules,
			oraLoopPack,
			oraMessageBoxOk,
			gibby
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

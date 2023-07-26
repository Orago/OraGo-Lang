import fs from 'fs';
import ora from '../../ora/ora.js';
import logging from '../../ora/util/functions/logging.js';
import loops from '../../ora/util/functions/loops.js';
import { customFunction, customKeyword } from '../../ora/util/extensions.js';

const vars = new customFunction('teehee', function ({ data }){
	console.log('\n', `ORA LANG SCOPE:`, '\n', data.variables, '\n')
})

const run = (code) => {
	const instance = new ora({
		keywords: [
			new customKeyword('teehee', ['5', '3'])
		],
		functions: [
			logging,
			loops,
			vars
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
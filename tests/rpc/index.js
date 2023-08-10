import fs from 'fs';
import ora from '../../ora/ora.js';
import { oraRPC } from '../../modules/oraDiscordRPC/index.js';

const run = (code) => {
	const instance = new ora({
		extensions: [
			oraRPC
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
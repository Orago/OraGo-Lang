const fs = require('fs');
const ora = require('./index.js');
const args = process.argv.slice(2);

const run = (code) => {
	const oraInstance = new ora();

	return oraInstance.run(code);
}

const runPath = async (path) => {
	const data = await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; });

	return run(data);
}

switch (args[0]) {
	case '-info': {
		runPath(__dirname + '/info.ora');
	} break;

	case '-file': {
		const file = args[1];

		if (!file) {
			const err = new Error('Invalid argument, Syntax: ora -file <file>');

			throw err;
		}
		else if (!file.endsWith('.ora')) {
			const err = new Error('Invalid file type, Syntax: ora -file <file>');

			throw err;
		}

		runPath(file).then((result) => {
			result && console.log(result);
		});
	} break;

	// case '-code': {
	// 	const code = args.slice(1).join(' ');

	// 	if (!code) {
	// 		const err = new Error('Invalid argument, Syntax: ora -code <code>');

	// 		throw err;
	// 	}

	// 	run(code);
	// } break;

	case 'start': {
		if (fs.existsSync('./index.ora')) {
			runPath('./index.ora');
		}
		else {
			const err = new Error('No index.ora file found.');

			throw err;
		}

	} break;

	default: {
		const err = new Error('Invalid argument, Syntax: ora -file <file> or ora -code <code>');

		throw err;
	}
}
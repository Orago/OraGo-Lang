const fs = require('fs');
const ora = require('./oraLang.js');
const args = process.argv.slice(2);

const run = (code) => {
	const oraInstance = new ora();

	return oraInstance.run(code);
}

const main = async () => {
	switch (args[0]) {
		case '-info': {
			const data = await fs.promises.readFile(__dirname + '/info.ora', 'utf8').catch((err) => { throw err; });
			
			run(data);
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

			const data = await fs.promises.readFile(file, 'utf8').catch((err) => { throw err; });
			
			const result = run(data);

			result && console.log(result);
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
			const data = await fs.promises.readFile(file, 'utf8').catch((err) => { throw err; });
			
			const result = run(data);

			result && console.log(result);
			
			fs.readFile(__dirname + '/info.ora', 'utf8', (err, data) => {
				if (err) throw err;

				run(data);
			});
		} break;

		default: {
			const err = new Error('Invalid argument, Syntax: ora -file <file> or ora -code <code>');

			throw err;
		}
	}
}

main();
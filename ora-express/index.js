const fs = require('fs');
const ora = require('../ora/commonJS.js');

const newDict = {
	if: ['if'],
	set: ['let'],
	assign: ['='],
	function: ['func'],
	return: ['return'],
	from: ['from'],
	import: ['import'],
	require: ['require'],
	global: ['global'],
	print: ['consolelog']
}

const run = (code) => {
	const oraInstance = new ora({
		overrideDictionary: newDict
	});

	return oraInstance.run(code);
}

const runPath = async (path) => {
	try {
		const code = await fs.promises.readFile(path, 'utf8').catch((err) => { throw err; });

		return run(code);
	}

	catch (err){
		console.error(err);
	}
}

runPath('index.ora');
const ora = require('./ora');

function commonOra (data) {
	const customFunctions = {};

	customFunctions['REQUIRE'] = async function ({ iter, data }) {
		if (typeof require !== 'function') throw 'REQUIRE IS NOT SUPPORTED IN THIS ENVIRONMENT';
		const pathModule = require('path');

		const variableName = iter.next().value;
		const path = [variableName];
		let { variables } = data;

		if (data.functions.hasOwnProperty(variableName))
			throw `Cannot set variable to function name: ${variableName}`;

		if (iter.disposeIf('GLOBAL')) variables = data.variables;

		while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
			path.push( iter.next().value );

		const nextSeq = iter.next();

			
		if (data.utils.isA_0(variableName) ){
			if (!nextSeq.done && nextSeq.value === 'FROM'){
				const importUrl = data.utils.parseInput(iter, iter.next(), data);
				let url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? pathModule.join(process.argv[1], '../'+importUrl) : importUrl;

				if (typeof url === 'string' && (url.endsWith('.js') || url.endsWith('.npm'))){
					if (url.endsWith('.npm')) url = pathModule.join(process.argv[1], '../node_modules/' + url.slice(0, url.length - 4) + '/');
					
					data.utils.setOnPath({
						data: variables,
						path,
						value: require(url)
					});
				}
				else throw 'IMPORT URL IS NOT A STRING OR INVALID URL';
			}
		}
	};

	customFunctions['IMPORT'] = async function ({ iter, data }){
		try {
			const fs = require('fs');
			const pathModule = require('path');

			const variableName = iter.next().value;
			const path = [variableName];
			let { variables } = data;
			
			if (data.functions.hasOwnProperty(variableName))
				throw `Cannot set variable to function name: ${variableName}`;

			if (iter.disposeIf('GLOBAL')) variables = data.variables;

			while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
				path.push( iter.next().value );

			const nextSeq = iter.next();
				
			if (data.utils.isA_0(variableName) ){
				if (!nextSeq.done && nextSeq.value === 'FROM'){
					const importUrl = parseInput(iter, iter.next(), data);
					const url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? pathModule.join(process.argv[1], '../'+importUrl) : importUrl;

					if (typeof url === 'string' && url.endsWith('.ora')){
						data.utils.setOnPath({
							data: variables,
							path,
							value: new Ora().run(
								fs.readFileSync(url, 'utf-8')
							)
						});
					}
					else throw 'IMPORT URL IS NOT VALID';
				}
			}
		}
		catch (err){
			throw console.error(err);
		}
	};



	return new ora({
		customFunctions,
		...data
	});
}

module.exports = commonOra;

/*

*/
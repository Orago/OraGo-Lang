import fs from 'fs';
import ora from './ora.js';
import pathModule from 'path';

async function esmOra (data) {
	const customFunctions = {};
	const cjsDict = {
		require: ['REQUIRE'],
		import: ['IMPORT'],
		export: ['EXPORT']
	};

	function functionGenerator ({ keywords: kw, settings }){

		// customFunctions[kw.id.require] = async function ({ iter, data }) {

		// 	if (typeof require !== 'function') throw 'REQUIRE IS NOT SUPPORTED IN THIS ENVIRONMENT';

		// 	const pathModule = require('path');
		// 	let { variables } = data;

		// 	const variableName = iter.next().value;
		// 	const path = [variableName];

		// 	if (data.functions.hasOwnProperty(variableName))
		// 		throw `Cannot set variable to function name: ${variableName}`;

		// 	while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
		// 		path.push( iter.next().value );

		// 	const nextSeq = iter.next();

				
		// 	if (data.utils.isA_0(variableName) ){
		// 		if (!nextSeq.done && kw.is(nextSeq.value, kw.id.from)){
		// 			const importUrl = data.utils.parseInput(iter, iter.next(), data);
		// 			let url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? pathModule.join(process.argv[1], '../'+importUrl) : importUrl;

		// 			if (typeof url === 'string' && (url.endsWith('.js') || url.endsWith('.npm'))){
		// 				if (url.endsWith('.npm')) url = pathModule.join(process.argv[1], '../node_modules/' + url.slice(0, url.length - 4) + '/');
						
		// 				data.utils.setOnPath({
		// 					data: variables,
		// 					path,
		// 					value: require(url)
		// 				});
		// 			}
		// 			else throw 'IMPORT URL IS NOT A STRING OR INVALID URL';
		// 		}
		// 	}
		// };

		customFunctions[kw.id.export] = ({ iter, data }) => {
			const value = data.utils.parseInput(iter, iter.next(), data);

			console.log(value)

			return {
				exit: true,
				value
			}
		};

		customFunctions[kw.id.import] = async function ({ iter, data }){
			try {
				let { variables } = data;

				const variableName = iter.next().value;
				const path = [variableName];
				
				if (data.functions.hasOwnProperty(variableName))
					throw `Cannot set variable to function name: ${variableName}`;

				while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
					path.push( iter.next().value );

				const nextSeq = iter.next();
					
				if (data.utils.isA_0(variableName) ){
					if (!nextSeq.done && kw.is(nextSeq.value, kw.id.from)){
						const importUrl = data.utils.parseInput(iter, iter.next(), data);
						const url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? pathModule.join(process.argv[1], '../'+importUrl) : importUrl;

						if (typeof url === 'string' && url.endsWith('.ora')){
							const instance = await esmOra(settings);

							const value = await instance.run(
								fs.readFileSync(url, 'utf-8')
							);

							data.utils.setOnPath({
								source: variables,
								path,
								value: await value
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
		
	}

	return new ora({
		customFunctions,
		functionGenerator,
		...data,
		overrideDictionary: {
			...cjsDict,
			...data?.overrideDictionary,
		},
	});
}

export default esmOra;
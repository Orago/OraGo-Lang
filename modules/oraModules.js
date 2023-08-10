import fs from 'fs';
import pathModule from 'path';
import { customFunction, customKeyword, customExtension, extensionPack } from '../ora/util/extensions.js';
import { isA_0 } from '../ora/util/forceType.js';

const exportFunc = new customFunction('export', function ({ iter, scope }) {
	const value = this.parseInput(iter, iter.next(), scope);

	return {
		exit: true,
		value
	};
});

const importFunc = new customFunction('import', function ({ iter, scope }){
	const { variables } = scope;

	try {

		const variableName = iter.next().value;
		const path = [variableName];

		if (this.functions.hasOwnProperty(variableName))
			throw `Cannot set variable to function name: ${variableName}`;

		while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
			path.push( iter.next().value );

		const nextSeq = iter.next();
			
		if (isA_0(variableName)){
			if (!nextSeq.done && this.keywords.is(nextSeq.value, this.keywords.id.from)){
				const importUrl = this.parseInput(iter, iter.next(), scope);
				const url = (importUrl.startsWith('.') || importUrl.startsWith('/')) ? pathModule.join(process.argv[1], '../'+importUrl) : importUrl;

				if (typeof url === 'string' && url.endsWith('.ora')){
					const instance = this.reInstance();

					const value = instance.run(
						fs.readFileSync(url, 'utf-8')
					);

					this.setOnPath({
						source: variables,
						path,
						value: value
					});
				}
				else throw 'IMPORT URL IS NOT VALID';
			}
		}
	}
	catch (err){
		throw console.error(err);
	}
});


const ImportSupport = new customExtension({
	keyword: new customKeyword('import', ['import']),
	function: importFunc
});

const ExportSupport = new customExtension({
	keyword: new customKeyword('export', ['export']),
	function: exportFunc
});

const oraModules = new extensionPack(ImportSupport, ExportSupport);

export default oraModules;
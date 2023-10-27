import { Extension, CustomKeyword, ValueProcessor, CustomFunction } from './extensions.js';
import { Token } from './token.js';
import { Scope } from './scope.js';

export class OraSetup {
	static HandleExtensions (Instance, extensions){
		if (Array.isArray(extensions) != true)
			throw 'Invalid extension setup';
		
		for (const extension of extensions){
			if (extension instanceof Extension != true)
				throw 'Invalid extension'

			if (extension?.keyword instanceof CustomKeyword){
				Instance.Keywords.addKeyword(
					...extension.keyword.bound
				);
			}

			if (Array.isArray(extension.processors)){
				if (extension.processors.every(processor => processor instanceof ValueProcessor))
					Instance.Options.Processors.push(...extension.processors);
				
				else {
					console.log(extension.processors);
					throw 'Invalid Processor';
				}
			}

			if (extension.function instanceof CustomFunction)
				Object.assign(
					Instance.Options.Methods,
					extension.function.bound({ keywords: Instance.Keywords})
				);
		}
	}
}

export class OraProcessed {
	changed = false;

	constructor (options){
		if (options.changed === true)
			this.changed = true;

		if (options?.token instanceof Token){
			this.changed = true;
			this.token = options.token;
		}

		if (options?.scope instanceof Scope){
			this.changed = true;
			this.scope = options.scope;
		}

		if (options?.value != null){
			this.changed = true;
			this.value = options.value;
		}
	}
}
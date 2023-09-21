import { Lexer } from './lexer.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './extensions.js';
export { CustomKeyword, CustomFunction, ValueProcessor, Extension };

class Scope {
	data = {};
}


class TokenIterator {
	constructor (tokens){
		this.tokens = tokens;
	};

	peek (pos = 1){
		return {
			status: this.tokens.length > pos - 1,
			value: this.tokens[pos - 1]
		}
	}

	read (pos = 1){
		const max = pos - 1;

		if (max > 0) this.dispose(max);
		
		return {
			status: this.tokens.length > 0,
			value: this.tokens.shift()
		}
	}

	dispose (count = 0){
		const disposed = [];

		for (let i = 0; i < count; i++)
			disposed.push(this.tokens.shift());

		return disposed;
	}
}

class OraSetup {
	static HandleExtensions (Instance, extensions){
		if (Array.isArray(extensions) != true)
			throw 'Invalid extension setup';
		
		for (const extension of extensions){
			if (extension instanceof Extension != true)
				throw 'Invalid extension'

			if (extension?.keyword instanceof CustomKeyword){
				extension.keyword.assign(Instance.Options.Lexer.keywords);
			}
		}
	}
}

export default class Ora {
	scope = new Scope;
	
	Options = {
		Lexer: {
			keywords: {}
		},
		Processors: []
	};

	constructor (options){
		if (typeof options?.keywords === 'object')
			this.Options.Lexer.keywords = options.keywords;

		OraSetup.HandleExtensions(this, options?.extensions);
	}

	get extensionData () {
		return {
			scope: this.scope
		}
	}

	run (code){
		const lexed = new Lexer(this.Options.Lexer).tokenize(code);

		const iter = new TokenIterator(lexed.tokens);

		console.log(this.Options.Lexer.keywords)

		for (const token of lexed.tokens){
			
		}
	}
}
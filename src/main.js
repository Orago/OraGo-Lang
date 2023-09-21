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

	static get Blank (){
		return {
			value: ''
		};
	}

	peek (pos = 1){
		const status = this.tokens.length > pos - 1;

		return {
			...status ? this.tokens[pos - 1] : TokenIterator.Blank,
			status
		}
	}

	read (pos = 1){
		const max = pos - 1;

		if (max > 0) this.dispose(max);

		const status = this.tokens.length > 0
		
		return {
			...this.tokens.shift() ?? TokenIterator.Blank,
			status
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

			if (Array.isArray(extension.processors)){
				if (extension.processors.every(processor => processor instanceof ValueProcessor)){
					Instance.Options.Processors.push(...extension.processors);
				}
				else {
					console.log(extension.processors);
					throw 'Invalid Processor';
				}
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

	extensionData ({ iter }) {
		return {
			scope: this.scope,
			iter
		}
	}

	getValue ({ iter, token }){
		const handleProcessors = () => {
			let canGoAgain = false;

			const pass = Object.assign(this.extensionData({ iter }), { token });
			
			for (const processor of this.Options.Processors){
				if (processor.validate.bind(this)(pass) === true){
					const processed = processor.parse.bind(this)(pass);

					if (processed != null){
						if (processor.immediate) return processed;
						else result = processed;

						canGoAgain = true;
					}
				}
			}

			if (canGoAgain) handleProcessors();
		}

		handleProcessors();
	}

	run (code){
		const lexed = new Lexer(this.Options.Lexer).tokenize(code);
		const iter = new TokenIterator(lexed.tokens);

		for (const token of lexed.tokens){
			let value = token.value;
			iter.dispose(1);
			this.getValue({ iter, token });
		}
	}
}
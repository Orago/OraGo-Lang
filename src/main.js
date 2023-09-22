import { Lexer } from './lexer.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './extensions.js';
export { CustomKeyword, CustomFunction, ValueProcessor, Extension };

import { KeywordDict } from './keyword.js';
import { Token } from './token.js';

export class Scope {
	parent = this;
	data = {};

	constructor (parent){
		if (parent instanceof Scope)
			this.parent = parent;
	}

	get flat (){
		let dataOut = { ...this };
		let scope;

		while (scope?.parent != this){
			scope = scope.parent;
			dataOut = Object.assign({}, scope.data, dataOut);
		}

		return dataOut;
	}
}

class TokenIterator {
	constructor (tokens){
		this.tokens = tokens;
	};

	static get Blank (){
		return {
			value: undefined
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

	test (check, n = 1){
		const item = this.peek(n);
		
		return (
			(typeof check === 'string' && check == item.value) ||
			(check instanceof Function && check(item) === true) ||
			(check instanceof RegExp   && check.test(item))
		);
	}

	disposeIf (check, n = 1) {
		const status = this.test(check, n);

		status && this.read(n - 1);

		return status;
	}

	disposeIfNot (check, n = 1){
		const status = this.test(check, n);

		!status && this.read(n - 1);

		return status;
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
				Instance.Keywords.addKeyword(
					...extension.keyword.bound
				);
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

export default class Ora {
	scope = new Scope;
	Keywords = new KeywordDict;

	Options = {
		Lexer: {},
		Methods: {},
		Processors: []
	};

	constructor (options){
		OraSetup.HandleExtensions(this, options?.extensions);

		this.Options.Processors = this.Options.Processors.sort((a, b) => b < 0 || a < 0 ? b-a : a-b);
	}

	extensionData ({ iter }) {
		return {
			scope: this.scope,
			iter
		}
	}

	processValue ({ iter, value, token, scope }){
		let canGoAgain = false;

		const pass = Object.assign(this.extensionData({ iter }), { token, value, scope, self: this });

		for (const processor of this.Options.Processors){
			if (processor.validate.bind(this)(pass) === true){
				const processed = processor.parse.bind(this)(pass);

				if (processed instanceof OraProcessed && processed.changed){
					if (processor?.immediate) return processed.value;
					else {
						if (processed.value != null) value = processed.value;
						if (processed.token != null) token = processed.token;
						if (processed.scope != null) scope = processed.scope;
					}

					canGoAgain = true;
				}
			}
		}

		if (canGoAgain) return this.processValue({ iter, value, token, scope });

		return value;
	}

	getNext ({ iter, scope }){
		const token = iter.read();

		return this.processValue({ iter, scope, value: token.value, token });
	}

	subscope (scope){
		return new Scope(scope);
	}

	runTokens ({ tokens, scope }){
		const { Methods } = this.Options;
		const iter = new TokenIterator(tokens);

		while (iter.tokens.length > 0){
			const [token] = iter.dispose(1);

			if (token.type === Token.Type.Keyword){
				// Validate keyword
				if (this.Keywords.hasID(token.keyword)){
					// Validate method for keyword
					if (Methods.hasOwnProperty(token.keyword)){
						Methods[token.keyword].bind(this)({ iter, scope });
					}
					else this.processValue({ iter, value: token.value, token, scope });
				}
				else throw new Error(`Invalid keyword (${token.value}) / ([${token.keyword}])`);
			}
		}
	}

	run (code){
		const { tokens } = new Lexer(this.Keywords).tokenize(code);
		const scope = this.scope;

		this.runTokens({ tokens, scope });
	}
}
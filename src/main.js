import { Lexer } from './util/lexer.js';
import { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './util/extensions.js';
export { CustomKeyword, CustomFunction, ValueProcessor, Extension };
import { DataType } from './util/dataType.js';
import { KeywordDict } from './util/keyword.js';
import { Token, TokenIterator } from './util/token.js';

import { Scope } from './util/scope.js';
export { Scope };

import { ValueChange, OraSetup } from './util/handling.js';
export * from './util/handling.js';

export default class Ora {
	scope = new Scope;
	Keywords = new KeywordDict;

	Options = {
		Lexer: {},
		Methods: {},
		Processors: []
	};

	/**
	 * @param {object} options 
	 */
	constructor (options){
		OraSetup.HandleExtensions(this, options?.extensions);

		this.Options.Processors = this.Options.Processors.sort((a, b) => b < 0 || a < 0 ? b-a : a-b);
	}

	processValue ({ iter, value, token, scope }){
		let canGoAgain = false;

		const pass = {
			iter,
			token,
			value,
			scope,
			self: this
		};

		for (const processor of this.Options.Processors){
			if (processor.validate.bind(this)(pass) === true){
				const processed = processor.parse.bind(this)(pass);

				if (processed instanceof ValueChange && processed.changed){
					if (processor?.immediate)
						return processed.value;

					else {
						if (processed.value != null)
							pass.value = processed.value;

						if (processed.token != null)
							pass.token = processed.token;

						if (processed.scope != null)
							pass.scope = processed.scope;
					}

					canGoAgain = true;
				}
			}
		}

		return canGoAgain ? this.processValue(pass) : pass.value;
	}
	/**
	 * 
	 * @param {{ iter: TokenIterator, scope: Scope }} param0 
	 * @returns {object}
	 */
	processNext ({ iter, scope }){
		const token = iter.read();

		return this.processValue({
			iter,
			scope,
			value: token.value,
			token
		});
	}

	/**
	 * @param {Scope} scope 
	 * @returns {new Scope}
	 */
	subscope (scope){
		return new Scope(scope);
	}

	/**
	 * 
	 * @param {{ tokens: Array<Token>, scope: Scope }} param0 
	 * @returns {void}
	 */
	runTokens ({ tokens, scope }){
		const { Methods } = this.Options;
		const iter = new TokenIterator(tokens);

		while (iter.tokens.length > 0){
			const [token] = iter.dispose(1);

			if (token.type === Token.Type.Keyword){
				if (token.keyword === 'return'){
					if (Token.isData(iter.peek()))
						return this.processNext({ iter, scope });

					return;
				}

				/**
				 * Validate methods for keyword
				 */
				if (this.Keywords.hasID(token.keyword)){
					/**
					 * Validate methods for keyword
					 */
					if (Methods.hasOwnProperty(token.keyword))
						Methods[token.keyword].bind(this)({ iter, scope });

					else this.processValue({
						iter,
						value: token.value,
						token,
						scope
					});
				}
				else throw new Error(`Invalid keyword (${token.value}) / ([${token.keyword}])`);
			}
		}
	}

	/**
	 * 
	 * @param {String} code 
	 * @returns {any|undefined}
	 */
	run (code){
		const tokens = new Lexer(this.Keywords).tokenize(code);
		const scope = this.scope;

		const out = this.runTokens({
			tokens,
			scope
		});

		return DataType.simplify(out);
	}
}
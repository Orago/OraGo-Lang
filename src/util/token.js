export class Token {
	static Type = {
		Op: Symbol('Token.Op'),
		String: Symbol('Token.String'),
		Number: Symbol('Token.Number'),
		Keyword: Symbol('Token.Keyword'),
		Seperator: Symbol('Token.Seperator'),
		Identifier: Symbol('Token.Identifier'),
	};

	/**
	 * 
	 * @param {string} type 
	 * @param {string | number} value 
	 * @param {number} depth 
	 * @param {number} tabs 
	 * @param {object} options 
	 */
	constructor(type, value, depth = 0, tabs = 0, options) {
		this.type = type;
		this.value = value;
		this.depth = depth;
		this.tabs = tabs;
		
		if (typeof options?.keyword === 'string')
			this.keyword = options.keyword;
	}

	/**
	 * @param {Token} tokenIn 
	 * @returns {boolean}
	 */
	static isData (tokenIn){
		return [
			Token.Type.String,
			Token.Type.Identifier,
			Token.Type.Number,
			Token.Type.Seperator,
		].some(tokenType => tokenType === tokenIn.type && tokenIn.value !== ';');
	}
}

export class TokenIterator {
	/**
	 * @param {Array<Token>} tokens 
	 */
	constructor (tokens){
		this.tokens = tokens;
	};

	static get Blank (){
		return { value: undefined };
	}

	peek (pos = 1){
		const status = this.tokens.length > pos - 1;

		return {
			...status ? this.tokens[pos - 1] : TokenIterator.Blank,
			status
		}
	}

	read (pos = 1){
		if (pos > 1) this.dispose(pos - 1);

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
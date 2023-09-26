export class Token {
	static Type = {
		Keyword: Symbol('Token.Keyword'),
		Op: Symbol('Token.Op'),
		String: Symbol('Token.String'),
		Seperator: Symbol('Token.Seperator'),
		Identifier: Symbol('Token.Identifier'),
		Number: Symbol('Token.Number')
	};

	constructor(type, value, depth = 0, tabs = 0) {
		this.type = type;
		this.value = value;
		this.depth = depth;
		this.tabs = tabs;
	}

	static isData (tokenIn){
		return [
			Token.Type.String,
			Token.Type.Identifier,
			Token.Type.Number,
			Token.Type.Seperator,
		].some(tokenType => tokenType === tokenIn.type && tokenIn.value !== ';');
	}
}

export class KeywordToken extends Token {
	constructor(type, value, depth, tabs, keyword) {
		super(type, value, depth, tabs);

		this.keyword = keyword;
	}
};


export class TokenIterator {
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
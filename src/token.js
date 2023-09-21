export class Token {
	static Type = {
		Keyword: Symbol('Token.Keyword'),
		Op: Symbol('Token.Op'),
		String: Symbol('Token.String'),
		Seperator: Symbol('Token.Seperator'),
		Identifier: Symbol('Token.Identifier'),
		Number: Symbol('Token.Number'),
		// BlockStart: Symbol('Token.BlockStart'),
		// BlockEnd: Symbol('Token.BlockEnd')
	};

	constructor(type, value, depth) {
		this.type = type;
		this.value = value;
		this.depth = depth ?? 0;
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
	constructor(type, value, depth, keyword) {
		super(type, value, depth);

		this.keyword = keyword;
	}
};
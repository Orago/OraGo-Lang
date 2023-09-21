export class Token {
	static Type = {
		String: Symbol('Token.String'),
		Op: Symbol('Token.Op'),
		Keyword: Symbol('Token.Keyword'),
		Identifier: Symbol('Token.Identifier'),
		Number: Symbol('Token.Number'),
		BlockStart: Symbol('Token.BlockStart'),
		BlockEnd: Symbol('Token.BlockEnd')
	};

	constructor(type, value, depth) {
		this.type = type;
		this.value = value;
		this.depth = depth ?? 0;
	}
}

export class KeywordToken extends Token {
	constructor(type, value, depth, keyword) {
		super(type, value, depth);

		this.keyword = keyword;
	}
}
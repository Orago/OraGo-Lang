const defaultKeywords = {
	//* Commands *//
	assign: ['=', 'to'],
	if: ['if'],
	equals: ['equals', 'is'],
	return: ['return'],
	and: ['and', '&'],
	from: ['from'],
	bind: ['bind'],
	as: ['as', ':'],
	//* Operators *//
	add: ['+'],
	subtract: ['-'],
	multiply: ['*'],
	divide: ['/'],
	power: ['^'],
	greater_than: ['>'],
	less_than: ['<'],

	//* Types *//
	number: ['NUMBER'],
	string: ['STRING'],
	boolean: ['BOOLEAN'],
	object: ['OBJECT'],
	array: ['ARRAY'],
	enum: ['ENUM'],
};

export class KeywordDict {
	keywords = { ...defaultKeywords };

	constructor (input = {}){
		this.keywords = { ...this.keywords, ...input };
		this.refreshKeywordIDs();
	}

	refreshKeywordIDs (){
		this.keywordIDs = Object.fromEntries(Object.keys(this.keywords).map(key => [key, key]));
	}

	has (search){
		return Object.values(this.keywords).some((value) => value.includes(search))
	}

	hasID (id){
		return this.keywords.hasOwnProperty(id);
	}

	match (search){
		const res = Object.entries(this.keywords).find(([key, value]) => value.includes(search));

		if (res == undefined)
			throw new Error(`Keyword ${search} not found in dictionary`);
		
		return this.keywordIDs[res[0]];
	}

	matchUnsafe (search){
		const res = Object.entries(this.keywords).find(([key, value]) => value.includes(search));

		return res != undefined ? this.keywordIDs[res[0]] : null;
	}

	is (search, keywordID){
		return this.matchUnsafe(search) === keywordID
	}

	get id (){
		return this.keywordIDs;
	}

	deleteKeyword (keywordID){
		for (const [keyword, options] of Object.entries(this.keywords)){
			if (!options.includes(keywordID)) continue;

			options.splice(options.indexOf(keywordID));

			if (options.length == 0){
				delete this.keywords[keyword];
				this.refreshKeywordIDs();
			}
		}
	}

	addKeyword (id, keywords){
		const notIncluded = keywords.filter(kw => this.keywords?.[id]?.includes(kw) != true);

		(this.keywords[id] ??= [])
			.push(...notIncluded);

		this.refreshKeywordIDs();
	}
}
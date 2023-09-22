const defaultKeywords = {
	//#region //* Commands *//
	// comment: ['comment', '#'],
	// set: ['let'],
	assign: ['=', 'to'],
	delete: ['delete'],
	// print: ['print'],
	loop: ['loop'],
	for: ['for'],
	if: ['if'],
	equals: ['equals', 'is'],
	return: ['return'],
	class: ['class'],
	exit: ['exit'],
	shift: ['shift'],
	await: ['await'],
	sleep: ['sleep'],
	and: ['and', '&'],
	from: ['from'],
	bind: ['bind'],
	as: ['as', ':'],
	has: ['has'],
	copy: ['copy'],
	using: ['using'],
	jsver: ['JSVER'],
	random: ['random'],
	//#endregion //* Commands *//

	log_variables: ['LOG_VARIABLES'],
	log_scope: ['LOG_SCOPE'],

	//#region //* Operators *//
	add: ['+'],
	subtract: ['-'],
	multiply: ['*'],
	divide: ['/'],
	power: ['^'],
	greater_than: ['>'],
	less_than: ['<'],
	//#endregion //* Operators *//

	//#region //* Types *//
	number: ['NUMBER'],
	string: ['STRING'],
	boolean: ['BOOLEAN'],
	object: ['OBJECT'],
	array: ['ARRAY'],
	enum: ['ENUM'],
	true: ['TRUE'],
	false: ['FALSE'],
	null: ['NULL'],
	undefined: ['UNDEFINED'],
	NaN: ['NAN'],
	Infinity: ['INFINITY'],
	negativeInfinity: ['NEGATIVE_INFINITY'],
	//#endregion //* Types *//
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

		(this.keywords[id] ??= []).push(...notIncluded);

		this.refreshKeywordIDs();
	}
}
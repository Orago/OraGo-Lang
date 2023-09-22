const isA_0 = x => x != undefined && /[a-z0-9_]/i.test(x);

export class CustomFunction {
	#fn;
	#keyword;

	constructor (keyword, fn){
		if (typeof keyword != 'string' || !isA_0(keyword))
			throw 'Invalid custom keyword' + keyword;

		if (typeof fn != 'function')
			throw 'Invalid custom function input';

		this.#keyword = keyword;
		this.#fn = fn;
	}

	bound ({ keywords }){
		if (keywords.hasID(this.#keyword) != true)
			throw 'Invalid keyword to boot: ' + this.#keyword;

		return { [keywords.id[this.#keyword]]: this.#fn };
	}
}

export class CustomKeyword {
	#id;
	#keywords;

	constructor (id, keywords){
		if (typeof id != 'string' || !isA_0(id))
			throw `Invalid custom keywordID ${id}`;

		if (!Array.isArray(keywords) || keywords.some(e => typeof e != 'string' || (!isA_0(e) && e.length != 1))){
			console.log(keywords);
			throw `^ Invalid custom keywordList (#${id}),\nMust only include strings`;
		}

		this.#id = id;
		this.#keywords = keywords;
	}

	get id (){
		return this.#id;
	}

	get keywords (){
		return this.#keywords;
	}

	get bound (){
		return [this.#id, this.#keywords];
	}

	assign (extensions){
		(extensions[this.id] ??= []).push(...this.#keywords)
	}
}

export class ProcessorPriority {
	static unimportant = -1;
	static identifier = 0;
	static modifier = 1; 
}

export class ValueProcessor {
	static Priority = {
		unimportant: -1,
		pre: 0,
		identifier: .5,
		modifier: 1,
		post: 2
	};

	priority = ProcessorPriority.unimportant;

	constructor ({ validate, parse, priority }){
		if (typeof validate != 'function')
			throw `Invalid validator for ${this.prefix}Processor`;

		this.validate = validate;

		if (typeof parse != 'function')
			throw `Invalid parser for ${this.prefix}Processor`;
		
		this.parse = parse;

		if (typeof priority === 'number')
			this.priority = priority;
	}
}

export class Extension {
	constructor ({ keyword, function: fn, processors }){
		if (keyword != null) //= |
			if (keyword instanceof CustomKeyword)
				this.keyword = keyword;
			else {
				console.log(keyword);
				throw '^ Invalid keyword instance for extension';
			}

		if (fn != null) //= |
			if (fn instanceof CustomFunction)
				this.function = fn;
			else {
				console.log(fn);
				throw '^ Invalid function instance for extension';
			}

		if (processors != null && Array.isArray(processors)){
			for (const PreP of processors){
				if (PreP instanceof ValueProcessor != true){
					console.log(PreP);

					throw '^ Invalid processor instance for extension';
				}
			}
				
			this.processors = processors;
		}
	}
}
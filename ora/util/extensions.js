import { isA_0 } from './forceType.js';

export class customFunctionContainer {
	#functions;

	constructor (overrideFunctions){
		if (typeof overrideFunctions != 'function')
			throw 'Override function container must be an function';

		this.#functions = overrideFunctions;
	}

	bound (oraInstance){
		return this.#functions.bind(oraInstance)();
	}
}

export class customFunction {
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

export class customKeyword {
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

	bound ({ keywords }){
		// if (keywords.hasID(this.#id))
		// 	throw `Keyword already exists (#${this.#id})`;

		return [this.#id, this.#keywords];
	}
}

export class customExtension {
	constructor ({ keyword: KW, function: FN, processors }){
		if (KW != null) //= |
			if (KW instanceof customKeyword)
				this.keyword = KW;
			else {
				console.log(KW);
				throw '^ Invalid keyword instance for extension';
			}

		if (FN != null) //= |
			if (FN instanceof customFunction)
				this.function = FN;
			else {
				console.log(FN);
				throw '^ Invalid function instance for extension';
			}

		if (processors != null && Array.isArray(processors)){
			for (const PreP of processors){
				if (PreP instanceof valueProcessor != true){
					console.log(PreP);

					throw '^ Invalid processor instance for extension';
				}
			}
				
			this.processors = processors;
		}
	}
}

// class customPreProcessor {
// 	validate ({ iter, value }){
// 		return false;
// 	}

// 	parse ({ iter, }){
		
// 	}
// }

export class valueProcessor {
	static prefix = 'Value';
	validate;
	parse;
	immediate = false;

	constructor ({ validate, parse, immediate }){
		if (typeof validate != 'function')
			throw `Invalid validator for ${this.prefix}Processor`;

		if (typeof parse != 'function')
			throw `Invalid parser for ${this.prefix}Processor`;

		this.validate = validate;
		this.parse = parse;
		
		if (immediate === true)
			this.immediate = true;
	}
}

export class valuePreProcessor extends valueProcessor {
	static prefix = 'ValuePre';
}

export class valuePostProcessor extends valueProcessor {
	static prefix = 'ValuePost';
}

export class extensionPack {
	#extensions = [];

	constructor (...extensionsToPack){
		for (const extension of extensionsToPack)
			// Add extension
			if (extension instanceof customExtension)
				this.#extensions.push(extension);

			// Decompress and add extensions
			else if (extension instanceof extensionPack)
				this.#extensions.push(...extension);

			// Throw
			else {
				console.log(extension);
				throw '^ Cannot pack extension';
			}
	}

	*[Symbol.iterator]() {
    for (const item of this.#extensions)
      yield item;
  }
}
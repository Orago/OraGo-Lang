import { isA_0 } from './forceType.js';

class customFunctionContainer {
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

class customFunction {
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

class customKeyword {
	#id;
	#keywords;

	constructor (id, keywords){
		if (typeof id != 'string' || !isA_0(id))
			throw `Invalid custom keywordID ${id}`;

		if (!Array.isArray(keywords) || keywords.some(e => typeof e != 'string' || !isA_0(e))){
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

class customExtension {
	constructor ({ keyword: KW, function: FN }){
		if (KW instanceof customKeyword != true)
			throw 'Invalid keyword instance for extension';

		if (FN instanceof customFunction != true)
			throw 'Invalid function instance for extension';

		this.keyword = KW;
		this.function = FN;
	}
}

class extensionPack {
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

export {
	customFunctionContainer,
	customFunction,
	customKeyword,
	customExtension,
	extensionPack
};
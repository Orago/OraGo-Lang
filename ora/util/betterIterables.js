function bettderIterable(itemsInput, settings = {}) {
	const { tracking = false, maxStack = 10 } = settings;
	const items = [...itemsInput];
	const source = items;
	let stack = [];

	return {
		source,

		*[Symbol.iterator]() {
			while (items.length > 0)
				yield this.next().value;
		},

		next(n = 0) {
			if (typeof n === 'number') for (let i = 0; i < n; i++) items.shift();

			if (tracking){
				stack.push(items[0]);
				
				stack.length > maxStack && stack.shift();
			}

			return {
				value: items.shift(),
				done: 1 > items.length
			}
		},

		peek(n = 1) {
			return { value: items[n - 1], done: 1 > items.length };
		},

		clone() {
			return betterIterable(items, settings);
		},

		push(...itemToPush) {
			items.push(itemToPush);
		},

		size() {
			return items.length;
		},

		test (check, n = 1){
			const item = items[n - 1];
			
			return (
				(typeof check === 'string' && check == item) ||
				(check instanceof Function && check(item) === true) ||
				(check instanceof RegExp   && check.test(item))
			);
		},

		disposeIf (check, n = 1) {
			const status = this.test(check, n);

			status && this.next(n - 1);

			return status;
		},

		disposeIfNot (check, n = 1){
			const status = this.test(check, n);

			!status && this.next(n - 1);

			return status;
		},

		stringify(join = ' ') {
			return items.join(join);
		},
		
		stack (){
			return stack;
		},

		last (n = 0){
			return stack[stack.length - 1 - n]
		}
	};
}

class betterIterable {
	#stack = [];
	#items = [];
	#settings;
	
	constructor (itemsInput, settings = {}){
		this.#items = [...itemsInput];
		this.#settings = settings;
	}

	get items (){
		return this.#items;
	}

	*[Symbol.iterator]() {
		while (this.#items.length > 0)
			yield this.next().value;
	}

	next (amount = 0){
		const { items } = this;

		if (typeof amount === 'number')
			for (let i = 0; i < amount; i++)
				items.shift();

		if (this.#settings?.tracking){
			this.#stack.push(items[0]);
			this.#stack.length > this.#settings?.maxStack && this.#stack.shift();
		}

		return {
			value: items.shift(),
			done: 1 > items.length
		}
	};

	peek = (amount = 1) => ({
		value: this.items[amount - 1],
		done: 1 > this.items
	});

	clone (){
		return new betterIterable(this.items, this.#settings);
	}

	get size (){
		return this.items.length;
	}

	test (check, n = 1){
		const item = this.items[n - 1];
		
		return (
			(typeof check === 'string' && check == item) ||
			(check instanceof Function && check(item) === true) ||
			(check instanceof RegExp   && check.test(item))
		);
	}

	disposeIf (check, n = 1) {
		const status = this.test(check, n);

		status && this.next(n - 1);

		return status;
	}

	disposeIfNot (check, n = 1){
		const status = this.test(check, n);

		!status && this.next(n - 1);

		return status;
	}

	stringify (join = ' ') {
		return this.items.join(join);
	}

	get stack (){
		return this.#stack;
	}

	last (n = 0){
		return this.stack[this.stack.length - 1 - n];
	}
}

export default betterIterable;
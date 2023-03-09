function betterIterable (itemsInput) {
	const items = [...itemsInput];
	const source = items;
	
  return {
		source,

    *[Symbol.iterator]() {
      while (items.length > 0)
				yield this.next().value;
    },
    
    next (){
     return {
				value: items.shift(),
				done: 1 > items.length
			}
		},

		peek (n = 1){
			return {
				value: items[n - 1],
				done: 1 > items.length - n
			}
		},

		clone (){
			return betterIterable(items);
		},

		push (...itemToPush){
			items.push(itemToPush);
		}
  };
}

// Create Iterable
const n = betterIterable([ 1, 'a', 2, 3, 4, 5 ]);

for (const method of n)
	console.log(method)

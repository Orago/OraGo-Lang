function betterIterable (itemsInput) {
	const items = [...itemsInput];
	const startItems = items;
	
  return {
    *[Symbol.iterator]() {
      while (items.length > 0)
				yield this.next.value;
    },
    
    get next (){
     return {
				value: items.shift(),
				done: 1 > items.length
			}
		},

		get peek (){
			
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
const n = superIterable([ 1, 'a', 2, 3, 4, 5 ]);

for (let e of n.clone())
	console.log(e);


for (let e of n){
	console.log(e, 'd')
}
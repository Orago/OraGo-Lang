function peekableIterator(iterator) {
  let cache = [];
  let currentIndex = 0;

  function fillCache() {
    while (true) {
      let next = iterator.next();
      if (next.done) break;
      cache.push(next);
    }

		cache[cache.length - 1].done = true;
  }
	

  fillCache();

  return {
    next() {
      if (currentIndex < cache.length) {
        const value = cache[currentIndex++];
				
        return value;
      }
			else {
        const next = iterator.next();
        if (next.done) return next;
        
				else {
          cache.push(next);
          cache.shift();
          return next
        }
      }
    },

    peek(n = 1) {
			console.log(cache)
      if (currentIndex + n - 1 < cache.length)
        return cache[currentIndex + n - 1];

			else return { value: [].u, done: true };
    }
  };
}


function* someIterator () { yield 1; yield 2; yield 3; yield 4; yield 5; yield 6; }
let iter = peekableIterator(someIterator());

console.log(
	iter.next(),
	iter.peek(5),
	iter.peek(1),
	iter.next()
)
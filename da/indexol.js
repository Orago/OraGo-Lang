function peekableIterator (iterator) {
  let state = iterator.next();

	function* buildIterator () {
    while (!state.done) {
      const current = state.value;
      state = iterator.next();
      
			yield current;
    }

    return state.value;
  }

  const _i = buildIterator();

  _i.peek = () => state;
  return _i;
}

function* someIterator () { yield 1; yield 2; yield 3; yield 4; yield 5; yield 6; }
let iter = peekableIterator(someIterator());

for (let i of iter){
	console.log(i, iter.peek())
}
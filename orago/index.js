const typeEnforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();

const forceType = {
  forceNull:    $ => null,
  forceBoolean: $ => typeEnforcer(Boolean, $),
  forceNumber:  $ => typeEnforcer(Number, isNaN($) ? false : Number($)),
  forceBigInt:  $ => typeEnforcer(BigInt, $),
  forceString:  $ => typeEnforcer(String, $),
  forceObject:  $ => typeEnforcer(Object, $),
  forceArray: $ => Array.isArray($) ? $ : []
}

const isA0 = (x) => x == undefined || /[^a-z0-9]/i.test(x);
const isA_0 = (x) => x == undefined || /[^a-z0-9_]/i.test(x);

const oraLexer = input => {
	const regex = /(['"])(.*?)\1|\w+|(?!\\)[~!@#$%^&*()_+"\\/.;:\[\]\s]/g;
	const output = input.match(regex);

	while (output.indexOf(' ') != -1)
		output.splice(output.indexOf(' '), 1);

	return output;
}

const chunkLexed = lexed => {
	const chunks = [];
	let chunk = [];

	for (const item of lexed)
		if (item === ';'){
			chunks.push(chunk);
			chunk = [];
		}
		else if (!['\n', '\t'].includes(item))
			chunk.push(item);

	return chunks;
}

const strReg = /(['"])(.*?)\1/;
const isString = input => strReg.test(input);
const parseString = input => strReg.exec(input)?.[2];

function peekableIterator () {
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

const parseInput = (iter, input, { variables = {} } = {}) => {
	if (input.value == 'true')
		return true;

	else if (input.value == 'false')
		return false;

	else if (isString(input.value))
		return parseString(input.value);

	else if (!isNaN(input.value))
		return Number(input.value);

	else if (input.value === '~'){
		const variableName = iter.next().value;
		console.log(variableName, 'vn')


		if (!isA_0(variableName) && variables.hasOwnProperty(variableName))
			return variables[variableName]
	}
	else if (input.value === 'CURRENT_DATE'){
		return Date.now();
	}

	// else if (input.value === 'GET_DATE'){
	// 	const input = iter.next().value;
	// }

	return undefined;
}


function tee(iterable) {
    const source = iterable[Symbol.iterator]();
    const buffers = [[], []];  // substitute in queue type for efficiency
    const DONE = Object.create(null);

    const next = i => {
        if (buffers[i].length !== 0)
					return buffers[i].shift();

        const x = source.next();

        if (x.done) return DONE;

        buffers[1 - i].push(x.value);
        return x.value;
    };

    return buffers.map(function* (_, i) {
        for (;;) {
            const x = next(i);

            if (x === DONE) {
                break;
            }

            yield x;
        }
    });
}

const oraGo = (settings = {}) => codeInput => {
	if (typeof codeInput != 'string') return;

	const { customFunctions } = settings;
	
	const lexed = oraLexer(codeInput);
	const chunks = chunkLexed(lexed);
	const oraGoData = {
		variables: {},
		functions: {
			...forceType.forceObject(customFunctions),
			SET ({ iter, data }) {
				if (iter.next().value === '~'){
					const variableName = iter.next().value;
					const nextSeq = iter.next();
					let value;
			
					if (!isA_0(variableName && !nextSeq.done)){
						if (nextSeq.value === 'TO')
							value = parseInput(iter, iter.next(), oraGoData);
						
						else if (nextSeq.value === '~')
							 value = parseInput(iter, nextSeq, oraGoData)
					}
					else throw `Invalid Variable Name: (${variableName}), or next sequence (${nextSeq.value})`;

					oraGoData.variables[variableName] = value;
				}
				else throw 'augh'
			},
			PRINT ({ iter, data }) {
				const input = iter.next();
			
				if (input)
					console.log(parseInput(iter, input, data));
			},

			LOOP ({ iter, handleItems }) {
				const input = iter.next().value;
				const items = [];

				if (!isNaN(input)){
					const timesToRun = forceType.forceNumber(input);
					for (const item of [...iter])
						items.push(item);
					
					for (let i = 0; i < timesToRun; i++)
						handleItems(
							items[Symbol.iterator]()
						);
				}
				else throw 'Cannot Find Loop Status';
			},

			FOR ({ iter, data, handleItems, maxCalls = 100 }) {
				const input = parseInput([...iter][Symbol.iterator](), input, data);
				const items = [];
				let calls = 0;
				
				for (let item of [...iter][Symbol.iterator]())
						items.push(item);


				if (parseInput([...iter][Symbol.iterator](), input, data) == true){
					


					while (parseInput([...iter][Symbol.iterator](), input, data) == true){
						if (calls++ >= maxCalls){
							console.log('Call Stack Exceeded Maximum Amount');
							break;
						}

						handleItems(
							items[Symbol.iterator]()
						);
					}

				}
				else throw 'Cannot Find FOR Status';
			}
		}
	}

	const { functions } = oraGoData;

	function handleItems (iter){
		itemsLoop: for (const method of iter){
			if (functions.hasOwnProperty(method)){
				const response = functions[method]({
					iter,
					data: oraGoData,
					handleItems
				});

				if (response?.break == true)
					break itemsLoop;
			}
		}
	}
	
	for (const chunk of chunks){
		handleItems(
			peekableIterator(
				chunk[Symbol.iterator]()
			)
		);
	}

	return oraGoData;
}

const run = oraGo({
	customFunctions: {
		
	}
});

run(`
	COMMENT this is a test;
	SET ~cat TO "Meow lol";

	PRINT "HELLO WORLD";
	PRINT ~cat;

	PRINT CURRENT_DATE;

	SET ~canLoop TO true;

	FOR ~canLoop
		SET ~canLoop TO false
		PRINT "hehe loop"
		
	;
`);
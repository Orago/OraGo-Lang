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

const parseInput = (iter, input, { variables = {} } = {}) => {
	if (isString(input.value))
		return parseString(input.value);

	else if (!isNaN(input.value))
		return Number(input.value);

	else if (input.value === '~'){
		const variableName = iter.next().value;

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
		}
	}

	const { functions } = oraGoData;
	
	for (const chunk of chunks){
		const iter = chunk[Symbol.iterator]();

		itemsLoop: for (const method of iter){
			if (functions.hasOwnProperty(method)){
				const response = functions[method]({
					iter,
					data: oraGoData
				});

				if (response?.break == true)
					break itemsLoop;
			}
		}
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

	PRINT CURRENT_DATE
`);
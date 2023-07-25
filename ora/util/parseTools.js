const strReg = /(['"])(.*?)\1/;

const isString = input => strReg.test(input);
const parseString = input => strReg.exec(input)?.[2];

function parseBlock ({ iter }) {
	const items = [];

	if (!iter.disposeIf('{'))
		throw new Error('Missing Opening \'{\' after parameters');

	let openBrackets = 1;
	let closedBrackets = 0;
	
	for (const item of iter){
		if (item === '{') openBrackets++;
		else if (item === '}') closedBrackets++;

		if (item == '\r') continue;
		
		items.push(item);

		if (openBrackets == closedBrackets && openBrackets > 0) break;
	}

	if (items[items.length - 1] !== '}')
		throw new Error('Missing Closing \'}\' at end of function');

	else items.pop();

	return items;
}

export {
	isString,
	parseString,
	parseBlock
};
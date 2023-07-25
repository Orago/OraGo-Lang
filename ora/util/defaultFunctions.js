import { parseBlock } from './parseTools.js';

function handleLoop ({ iter, data, handleItems }){
	const input = iter.next().value;

	if (!isNaN(input)) {
		const timesToRun = this.utils.forceType.forceNumber(input);
		const parsed = parseBlock({ iter, data });

		for (let i = 0; i < timesToRun; i++)
			handleItems(
				this.iterable(parsed, { tracked: true }),
				data
			);
	}
	else throw 'A number has to come after a loop then the code block';
};

export default function ({ kw }){
	return {
		[kw.id.comment]: () => ({ break: true }),
		[kw.id.loop]: handleLoop,
	};
};
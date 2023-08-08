import { parseBlock } from '../parseTools.js';
import { customFunctionContainer } from '../extensions.js';

function handleLoop ({ iter, scope, handleItems }){
	const input = iter.next().value;

	if (!isNaN(input)) {
		const timesToRun = this.utils.forceType.forceNumber(input);
		const parsed = parseBlock({ iter, scope });

		for (let i = 0; i < timesToRun; i++)
			handleItems(
				this.iterable(parsed, { tracked: true }),
				scope
			);
	}
	else throw 'A number has to come after a loop then the code block';
};

export default new customFunctionContainer(function (){
	return {
		[this.keywords.id.loop]: handleLoop,
	};
});
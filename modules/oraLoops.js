import { customFunction, customKeyword, customExtension, extensionPack } from '../ora/util/extensions.js';
import { parseBlock } from '../ora/util/parseTools.js';

export const oraLoop = new customExtension({
	keyword: new customKeyword('loop', ['loop']),
	function: new customFunction('loop', function ({ iter, scope, handleItems }) {
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
	})
});

export const oraFor = new customExtension({
	keyword: new customKeyword('for', ['for']),
	function: new customFunction('for', function ({ iter, scope, handleItems }) {
		const input = iter.next();
		const items = [...iter];
		let calls = 0;

		while (val = parseInput(iter, input, scope) == true) {
			if (calls++ >= maxCalls) return console.error('Call Stack Exceeded Maximum Amount');

			handleItems(
				new betterIterable(items, { tracking: true })
			);
		}
	})
});

export const oraLoopPack = new extensionPack(oraLoop, oraFor);
import { CustomKeyword } from '../../main.js';
import { Extension, CustomFunction } from '../../util/extensions.js';
import { Token } from '../../util/token.js';

export const varExt = new Extension({
	keyword:  new CustomKeyword('variable', ['let']),
	function: new CustomFunction('variable', function ({ iter, scope }) {
		if (iter.peek().type === Token.Type.Identifier){
			const { value: varname } = iter.read();

			if (iter.disposeIf('='))
				scope.data[varname] = this.processNext({ iter, scope });
			else throw new Error('Missing = after varname');
		}
		else throw new Error('Invalid variable name');
	})
});
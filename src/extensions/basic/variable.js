import { CustomKeyword } from '../../main.js';
import { Extension, CustomFunction } from '../../extensions.js';
import { Token } from '../../token.js';


export const varExt = new Extension({
	keyword: new CustomKeyword('variable', ['let']),
	function: new CustomFunction('variable', function ({ iter, scope }) {
		if (iter.peek().type === Token.Type.Identifier){
			// Variable name
			const { value: varname } = iter.read();

			if (iter.disposeIf('=')){
				const value = this.processNext({ iter, scope });

				scope.data[varname] = value;
			}
			else throw new Error('Missing = after varname');
		}
		else throw new Error('Invalid variable name');
	})
});
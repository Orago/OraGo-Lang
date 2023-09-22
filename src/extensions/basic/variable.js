import Ora, { OraProcessed, Scope, CustomKeyword } from '../../main.js';
import { ValueProcessor, Extension, CustomFunction } from '../../extensions.js';
import { DataType } from '../../dataType.js';
import { Token } from '../../token.js';
import { Arrow, Parenthesis, Block } from '../../parseUtil.js';


export const varExt = new Extension({
	keyword: new CustomKeyword('variable', ['let']),
	function: new CustomFunction('variable', function ({ iter, scope }) {
		console.log('ahh')
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
	}),



	// processors: [
	// 	new ValueProcessor({
	// 		priority: ValueProcessor.Priority.modifier,
	// 		validate ({ iter, token }){
	// 			return (
	// 				token.type === Token.Type.Keyword &&
	// 				token.keyword === 'variable' &&
	// 				iter.peek().type === Token.Type.Identifier
	// 				// Arrow.test(iter, 2) &&
	// 				// iter.peek(3).status == true
	// 			);
	// 		},
	// 		parse ({ iter, value, scope }){
	// 			// remove var keyword;
	// 			iter.dispose(1);

	// 			// Variable name
	// 			const varname = iter.peek().value;

	// 			let value;

	// 			// Dispose arrow
	// 			if (Arrow.disposeIf(iter)){

	// 			}

	// 			scope[value]
	// 		}
	// 	})
	// ],
});
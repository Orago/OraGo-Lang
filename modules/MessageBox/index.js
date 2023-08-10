import { customFunction, customKeyword, customExtension } from '../../ora/util/extensions.js';

import { ok, okCancel, abortRetryIgnore } from './messagebox.js';

const oraMessageBoxOk = new customExtension({
	keyword: new customKeyword('M.B_Ok', ['msgBoxOk']),
	function: new customFunction('M.B_Ok', function ({ iter, scope }) {
		if (iter.disposeIf('(')){
			const dialogTitle = this.parseNext(iter, scope);

			if (typeof dialogTitle != 'string')
				throw 'Invalid Command (title has to be a string)';

			if (iter.disposeIf(',') != true)
				throw 'Missing seperator for message';

			const dialogMessage = this.parseNext(iter, scope);

			if (typeof dialogMessage != 'string')
				throw 'Invalid Command (message has to be a string)';

			if (iter.disposeIf(')') != true)
				throw 'Missing closing parenthesis for alert';

			

			return ok(dialogTitle, dialogMessage);
		}
		else throw 'Missing openening parenthesis for alert';
	})
});
















export { oraMessageBoxOk };
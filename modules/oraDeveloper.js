import { customFunction, customKeyword, customExtension, extensionPack } from '../ora/util/extensions.js';
import { exec } from 'child_process';


const execProcesses = [];

const oraExecute = new customExtension({
	keyword: new customKeyword('exec', ['exec']),
	function: new customFunction('exec', function ({ iter, scope }) {
		const command = this.parseNext(iter, scope);
		
		if (typeof command != 'string')
			throw 'Invalid Command (has to be a string)';

		const process = exec(command);

		execProcesses.push(process);

		return { kill: process.kill };
	})
});

const oraDialog = new customExtension({
	keyword: new customKeyword('dialog', ['dialog']),
	function: new customFunction('dialog', function ({ iter, scope }) {
		const dialogText = this.parseNext(iter, scope);
		
		if (typeof dialogText != 'string')
			throw 'Invalid Command (has to be a string)';
		
		const command = `mshta vbscript:Execute("msgbox "${JSON.stringify(dialogText)}":close")`;

		const process = exec(command);
		execProcesses.push(process);
		return { kill: process.kill };
	})
});

const oraAlertFN = new customFunction('alert', function ({ iter, scope }) {
	if (iter.disposeIf('(')){
		const dialogText = this.parseNext(iter, scope);

		if (typeof dialogText != 'string')
			throw 'Invalid Command (has to be a string)';

		if (iter.disposeIf(')') != true)
			throw 'Missing closing parenthesis for alert';
		
		const command = `mshta vbscript:Execute("msgbox "${JSON.stringify(dialogText)}"")`;

		const process = exec(command);
		execProcesses.push(process);
		return { kill: process.kill };
	}
	else throw 'Missing openening parenthesis for alert';
});

const oraAlert = new customExtension({
	keyword: new customKeyword('alert', ['jankyalert']),
	function: oraAlertFN
});


// Handle terminal close
function onKill (code){
	for (const process of execProcesses)
		process.kill();

  // Your cleanup or finalization code here
  // console.log('Node.js process is about to exit with code:', code);
}

// Signal listeners
process.on('exit', onKill);
process.on('SIGINT', () => {
	onKill('SIGINT');
	process.exit(0);
});

const oraExitProcess = new customExtension({
	keyword: new customKeyword('exit_process', ['exit_process']),
	function: new customFunction('exit_process', function () {
		return process.exit();
	})
});

const oraDeveloperUtil = new extensionPack(
	oraExecute,
	oraDialog,
	oraAlert,
	oraExitProcess
);

export {
	oraDeveloperUtil,

	// extensions
	oraExecute,
	oraDialog,
	oraAlert,
	oraExitProcess
};
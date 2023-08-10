import { customFunction, customKeyword } from '../ora/util/extensions.js';
import { exec } from 'child_process';

const execProcesses = [];

const execKW = new customKeyword('exec', ['exec']);

const execFN = new customFunction('exec', function ({ iter, scope }) {
	const command = this.parseNext(iter, scope);
	
	if (typeof command != 'string')
		throw 'Invalid Command (has to be a string)';

	const process = exec(command);
	execProcesses.push(process);
	return { kill: process.kill };
});

const dialogKW = new customKeyword('dialog', ['dialog']);
const dialogFN = new customFunction('dialog', function ({ iter, scope }) {
	const dialogText = this.parseNext(iter, scope);
	
	if (typeof dialogText != 'string')
		throw 'Invalid Command (has to be a string)';
	
	const command = `mshta vbscript:Execute("msgbox "${JSON.stringify(dialogText)}":close")`;

	const process = exec(command);
	execProcesses.push(process);
	return { kill: process.kill };
});

const alertKW = new customKeyword('alert', ['alert']);
const alertFN = new customFunction('alert', function ({ iter, scope }) {
	if (iter.disposeIf('(')){
		const dialogText = this.parseNext(iter, scope);

		if (typeof dialogText != 'string')
			throw 'Invalid Command (has to be a string)';

		if (iter.disposeIf(')') != true)
			throw 'Missing closing parenthesis for alert';

		console.log('printing', [JSON.stringify(dialogText)])
		
		const command = `mshta vbscript:Execute("msgbox "${JSON.stringify(dialogText)}"")`;

		const process = exec(command);
		execProcesses.push(process);
		return { kill: process.kill };
	}
	else throw 'Missing openening parenthesis for alert';
});

const devUtilKW = [execKW, dialogKW, alertKW];
const devUtilFN = [execFN, dialogFN, alertFN];

function onKill (code){
	for (const process of execProcesses)
		process.kill();

	console.log('PROCESSES', execProcesses)
  // Your cleanup or finalization code here
  console.log('Node.js process is about to exit with code:', code);
}

process.on('exit', onKill);
process.on('SIGINT', () => {
	onKill('SIGINT');
	process.exit(0);
});

export { devUtilKW, devUtilFN };
import { customFunction, customKeyword, customExtension } from '../../ora/util/extensions.js';
import rpc from 'discord-rpc';

function defaultActivity (){
	return {
		pid: process.pid,
		activity: {
			details: 'Pending Details',
			state: 'pending state',
			assets: {}
		}
	}
}

let rpcInstance;
let rpcActivity = defaultActivity();
let activityLoad;

function createClient (clientID){
	if (typeof clientID != 'number' && typeof clientID != 'string')
		throw 'Invalid client ID';

	const client = new rpc.Client({ transport: 'ipc' });
	const RPC = { clientID, client, ready: false };
	
	rpcInstance = RPC;

	client.login({ clientId: (RPC.clientID + '') }).catch(console.error);

	client.on('ready', () => {
		console.log('[DEBUG] Presence now active!');
    console.log('[WARN] Do not close this Console as it will terminate the rpc');
    console.log('=================== Error Output ===================');

		RPC.ready = true;

		if (activityLoad != null) client.request('SET_ACTIVITY', activityLoad);

		activityLoad = undefined;
	});
}


function handleImage (size, items, activity){
	if (Array.isArray(items) != true || items.length != 2)
		throw `Invalid ${size}_image data`;

	const [image, text] = items;

	activity.assets[`${size}_image`] = image;
	activity.assets[`${size}_text`] = text;
}

const updateActivityFN = new customFunction('rich_presence', function ({ iter, scope }) {
	const method = this.parseNext(iter, scope);

	if (method == 'connect'){
		if (rpcInstance) throw 'Already in a rpc instance';
		else return createClient(this.parseNext(iter, scope));
	}

	if (rpcInstance == null)
		throw 'RPC isn\'t instanced!';

	const { activity } = rpcActivity;

	if (method == 'large')
		handleImage(method, this.trueValue(this.parseNext(iter, scope)), activity);
	
	else if (method == 'small')
		handleImage('small', this.trueValue(this.parseNext(iter, scope)), activity);
	
	else if (method == 'state')   activity.state = this.parseNext(iter, scope);
	else if (method == 'details') activity.details = this.parseNext(iter, scope);

	else if (method == 'update'){
		if (rpcInstance?.ready)
			rpcInstance.client.request('SET_ACTIVITY', rpcActivity);
		
		else activityLoad = rpcActivity;
	}
});

export const oraRPC = new customExtension({
	keyword: new customKeyword('rich_presence', ['rpc']),
	function: updateActivityFN
});
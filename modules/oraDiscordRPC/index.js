import { customFunction, customKeyword, customExtension, extensionPack } from '../../ora/util/extensions.js';
import rpc from 'discord-rpc';

let activityLoad;

const createRpcKW = new customKeyword('createRPC', ['rpc']);

const createRpcFN = new customFunction('createRPC', function ({ iter, scope }) {
	if (scope.data.hasOwnProperty('discordRPC'))
		throw 'RPC already exists!';

	const clientID = this.parseNext(iter, scope);
	
	if (typeof clientID != 'number' && typeof clientID != 'string')
		throw 'Invalid client ID';

	const client = new rpc.Client({ transport: 'ipc' });

	const RPC = {
		clientID,
		client,
		ready: false
	};
	
	scope.data.discordRPC = RPC;

	client.login({ clientId: (RPC.clientID + '') }).catch(console.error);

	client.on('ready', () => {
		console.log('[DEBUG] Presence now active!');
    console.log('[WARN] Do not close this Console as it will terminate the rpc');
    console.log('=================== Error Output ===================');

		RPC.ready = true;

		if (activityLoad != null) client.request('SET_ACTIVITY', activityLoad);

		activityLoad = undefined;
	});
});


const updateActivityKW = new customKeyword('activity', ['activity']);

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

function handleImage (size, items, activity){
	if (Array.isArray(items) != true || items.length != 2)
		throw `Invalid ${size}_image data`;

	const [image, text] = items;

	activity.assets[`${size}_image`] = image;
	activity.assets[`${size}_text`] = text;
}

const updateActivityFN = new customFunction('activity', function ({ iter, scope }) {
	if (scope.data.hasOwnProperty('discordRPC') != true)
		throw 'RPC doesn\'t exist!';

	const method = this.parseNext(iter, scope);

	scope.data.rpcActivity ??= defaultActivity();

	const { activity } = scope.data.rpcActivity;

	if (method == 'large')
		handleImage(method, this.trueValue(this.parseNext(iter, scope)), activity);
	
	else if (method == 'small')
		handleImage('small', this.trueValue(this.parseNext(iter, scope)), activity);
	
	else if (method == 'state')   activity.state = this.parseNext(iter, scope);
	else if (method == 'details') activity.details = this.parseNext(iter, scope);

	else if (method == 'set'){
		if (scope.data.discordRPC.ready)
			scope.data.discordRPC.client.request('SET_ACTIVITY', scope.data.rpcActivity);
		
		else activityLoad = scope.data.rpcActivity;
	}
});

const rpcKeywords = [
	createRpcKW,
	updateActivityKW
];

const rpcFunctions = [
	createRpcFN,
	updateActivityFN
];

export { rpcKeywords, rpcFunctions };
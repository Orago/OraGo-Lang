'use strict';

/* eslint-disable no-console */
import { customFunction, customKeyword } from '../../ora/util/extensions.js';

import electron from 'electron';
const { app, BrowserWindow } = electron;
import path from 'path';

const apps = {};

class appTemplate {
	windowConfig = new windowConfig();
	app;
	window;
	index = 'index.html';

	constructor (inputApp){
		this.app = inputApp;
	}

	createWindow (){
		this.window = new BrowserWindow(this.windowConfig);

		console.log('huhhhhh', __dirname);
		
		this.window.loadURL(path.join(__dirname, this.index))
	}

	start (){
		const { app } = this;

		app.on('ready', () => this.createWindow());
	}
}

class windowConfig {
	width = 400;
	height = 400;
	resizable = false;
	titleBarStyle = 'hidden';
}


const createAppKW = new customKeyword('createApp', ['createApp']);


function fullLoop (appName, { ora, iter, scope }){
	// if next statement is and
	if (iter.disposeIf('(')){
		const appSettings = ora.trueValue(ora.parseNext(iter, scope));

		if (typeof appSettings != 'object')
			throw 'Missing app settings';

		// Missing closer
		if (iter.disposeIf(')') != true)
			throw 'Missing closing parenthesis';
		
		const { width, height, index } = appSettings;

		const app = apps[appName];
		const { windowConfig } = app;

		if (typeof width == 'number') windowConfig.width = width;
		if (typeof height == 'number') windowConfig.height = height;
		if (typeof index != 'string') throw 'Invalid index';
		
		app.index = index;
		app.start();
	}
	else throw 'Missing openening parenthesis after app name.';
}

const createAppFN = new customFunction('createApp', function ({ iter, scope }) {
	const appName = this.parseNext(iter, scope);

	if (typeof appName != 'string')
		throw 'Invalid app name';

	if (apps.hasOwnProperty(appName))
		throw 'App already exists!';

	apps[appName] ??= new appTemplate();

	console.log('something')

	fullLoop(appName,{ ora: this, iter, scope});
});


const appKeywords = [
	createAppKW,
];

const appFunctions = [
	createAppFN,
];

export { appKeywords, appFunctions };
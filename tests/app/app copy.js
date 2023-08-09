'use strict';

/* eslint-disable no-console */

const { app, BrowserWindow } = require('electron');
import path from 'path';
import { URL } from 'url';

const apps = {};

class appTemplate {
	windowConfig = new windowConfig();
	app;
	window;
	clientIndex = 'index.html';

	constructor (inputApp){
		this.app = inputApp;
	}

	createWindow (){
		this.window = new BrowserWindow(this.windowConfig);
		
		this.window.loadURL(url.format)
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


const createRpcFN = new customFunction('createApp', function ({ iter, scope }) {
	const appName = this.parseNext(iter, scope);

	if (typeof appName != 'string')
		throw 'Invalid app name';

	if (apps.hasOwnProperty(appName))
		throw 'App already exists!';

});







return process.exit();






//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 380,
    resizable: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Set this to your Client ID.
const clientId = '578319500475105341';

// Only needed if you want to use spectate, join, or ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'websocket' });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc || !mainWindow) {
    return;
  }

  const boops = await mainWindow.webContents.executeJavaScript('window.boops');

  // You'll need to have snek_large and snek_small assets uploaded to
  // https://discord.com/developers/applications/<application_id>/rich-presence/assets
  rpc.setActivity({
    details: `booped ${boops} times`,
    state: 'in slither party',
    startTimestamp,
    largeImageKey: 'snek_large',
    largeImageText: 'tea is delicious',
    smallImageKey: 'snek_small',
    smallImageText: 'i am my own pillows',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login({ clientId }).catch(console.error);
const djs = require('discord.js');

class bot {
	token;
	rest;

	constructor({ token, clientID }) {
		this.token = token;
		this.clientID = clientID;
		this.commandsExist = false;
	}

	instance (){
		const { Client, GatewayIntentBits } = djs;
		
		this.client = new Client({
			intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
			]
		});

		return this.client;
	}

	login (){
		if (!this.client) throw new Error('Client not initialized. Use the instance() method to initialize the client.');

		this.client.login(this.token);
	}

	async refreshCommands (commands, thenRun){
		const { REST, Routes } = djs;


		if (!this.commandsExist) this.rest = new REST({ version: '10' }).setToken(this.token);

		try {
			console.log('Started refreshing application (/) commands.');

			await this.rest.put(Routes.applicationCommands(this.clientID), { body: commands });

			console.log('Successfully reloaded application (/) commands.');

			if (typeof thenRun === 'function') thenRun(this);

			this.commandsExist = true;
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = bot;
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];


(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands('578319500475105341'), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

class bot {
	token;
	rest;

	constructor(token) {
		this.token = token;
		this.rest = new REST({ version: '10' }).setToken(token);
	}

	async refreshCommands (thenRun){
		try {
			console.log('Started refreshing application (/) commands.');

			await this.rest.put(Routes.applicationCommands('578319500475105341'), { body: commands });

			console.log('Successfully reloaded application (/) commands.');

			if (typeof thenRun === 'function') thenRun(this);
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = bot;
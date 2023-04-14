const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken('NTc4MzE5NTAwNDc1MTA1MzQx.GoiK-M.92mLeyDjbAL6Z5n8VfcNnoogLCTudtbpsdTB8g');

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands('578319500475105341'), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

module.exports = {}
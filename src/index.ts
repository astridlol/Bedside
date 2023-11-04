import 'reflect-metadata';

import { importx } from '@discordx/importer';
import { Client } from 'discordx';
import NodeCache from 'node-cache';
import { CommandInteraction, EmbedBuilder, IntentsBitField } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { env } from './env/server';

require('dotenv').config();

const commandCache = new NodeCache({ stdTTL: 2.5 });

export const prisma = new PrismaClient();

export const client = new Client({
	intents: [
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.Guilds
	],
	silent: false
});

client.on('ready', async () => {
	await client.clearApplicationCommands();
	await client.initApplicationCommands();

	console.log('> Bot online, logged in as: ' + client.user!!.tag);
});

client.on('interactionCreate', (interaction) => {
	if (interaction instanceof CommandInteraction) {
		let name = interaction.commandName;
		if (commandCache.has(name)) {
			const embed = new EmbedBuilder();
			embed.setDescription('⏱ This command was used recently, please wait');

			interaction.reply({
				ephemeral: true,
				embeds: [embed]
			});
			return;
		}
		commandCache.set(name, true);
	}

	client.executeInteraction(interaction);
});

async function start() {
	await importx(__dirname + '/commands/*.{js,ts}');
	await importx(__dirname + '/commands/*/*.{js,ts}');
	await importx(__dirname + '/events/*.{js,ts}');
	await client.login(env.TOKEN);
}

start()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

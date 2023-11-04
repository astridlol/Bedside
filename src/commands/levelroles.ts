import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	CommandInteraction,
	EmbedBuilder,
	Role,
	roleMention
} from 'discord.js';
import { prisma } from '..';
import Colors from '../constants/Colors';

@Discord()
@SlashGroup({ description: 'Manage leveling', name: 'leveling' })
@SlashGroup('leveling')
class LevelingCommand {}

@Discord()
@SlashGroup({
	description: 'Manage level roles',
	name: 'roles',
	root: 'leveling'
})
@SlashGroup('roles', 'leveling')
class LevelRoles {
	@Slash({ description: 'Add a level role', defaultMemberPermissions: 'ManageGuild' })
	async add(
		@SlashOption({
			description: 'No description provided',
			name: 'role',
			required: true,
			type: ApplicationCommandOptionType.Role
		})
		role: Role,
		@SlashOption({
			description: 'No description provided',
			name: 'level',
			required: true,
			type: ApplicationCommandOptionType.Number
		})
		level: number,
		interaction: CommandInteraction
	) {
		await prisma.levelRoles.create({
			data: {
				roleId: role.id,
				neededLvl: level,
				serverId: interaction.guildId
			}
		});

		const embed = new EmbedBuilder().setTitle('Success!').setColor(Colors.green);
		embed.setDescription(
			`Successfully set ${roleMention(
				role.id
			)} as a role obtainable when members reach level ${level}.`
		);

		interaction.reply({
			embeds: [embed],
			ephemeral: true
		});
	}

	@Slash({ description: 'Delete a level role', defaultMemberPermissions: 'ManageGuild' })
	async remove(
		@SlashOption({
			autocomplete: async function (interaction: AutocompleteInteraction) {
				const levelRoles = await prisma.levelRoles.findMany({
					where: {
						serverId: interaction.guildId
					}
				});

				const resp = await Promise.all(
					levelRoles.map(async (l) => {
						const role = await interaction.guild.roles.fetch(l.roleId);

						const name = `${role.name} - Given at level ${l.neededLvl}`;

						return {
							name,
							value: `${l.id}`
						};
					})
				);

				interaction.respond(resp);
			},
			description: 'Role to remove',
			name: 'role',
			required: true,
			type: ApplicationCommandOptionType.String
		})
		role: string,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		const where = {
			id: parseInt(role)
		};

		const roleData = await prisma.levelRoles.findFirst({
			where
		});

		if (!roleData) {
			const errorEmbed = new EmbedBuilder()
				.setColor(Colors.red)
				.setTitle('Uh oh!')
				.setDescription(`Could not delete that role as it doesn't exist anymore.`);

			await interaction.editReply({
				embeds: [errorEmbed]
			});

			return;
		}

		await prisma.levelRoles.delete({
			where
		});

		const embed = new EmbedBuilder()
			.setTitle('Success!')
			.setColor(Colors.green)
			.setDescription(`Successfully removed the role for level ${roleData.neededLvl}`);

		interaction.editReply({
			embeds: [embed]
		});
	}
}

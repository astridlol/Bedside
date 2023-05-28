import {
	ApplicationCommandOptionType,
	CommandInteraction,
	EmbedBuilder,
	GuildMember
} from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { prisma } from '..';
import Colors from '../constants/Colors';

@Discord()
class Reputation {
	@Slash({ description: 'View your prison reputation' })
	async rank(
		@SlashOption({
			description: 'The member',
			name: 'member',
			required: false,
			type: ApplicationCommandOptionType.User
		})
		user: GuildMember,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		const userId = user ? user.id : interaction.user.id;

		const rank = await prisma.userLevel.findFirst({
			where: {
				userId,
				serverId: interaction.guildId
			}
		});

		if (!rank) {
			const embed = new EmbedBuilder()
				.setColor(Colors.red)
				.setTitle('Uh oh!')
				.setDescription(
					user
						? 'This person is either not in this server, or has never talked.'
						: 'Could not fetch rank information for you.'
				);

			interaction.editReply({
				embeds: [embed]
			});

			return;
		}

		let content =
			(user ? `${user.user.username} is level` : `You are level`) +
			` ${rank.level} (${rank.exp} exp / ${rank.level * 50} exp)`;

		interaction.editReply({
			content
		});
	}
}

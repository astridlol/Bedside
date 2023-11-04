import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';
import { prisma } from '..';
import { RequireGuildMember } from '../guards/RequireGuildMember';

@Discord()
class Level {
	@Guard(RequireGuildMember)
	@Slash({ description: 'View your level' })
	async rank(
		@SlashOption({
			description: 'The member',
			name: 'member',
			required: false,
			type: ApplicationCommandOptionType.User
		})
		member: GuildMember,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		if (member && member.user.bot) {
			interaction.editReply({
				content: "Bots can't have levels sadly"
			});
			return;
		}

		const userId = member ? member.id : interaction.user.id;

		let rank = await prisma.userLevel.findFirst({
			where: {
				userId,
				serverId: interaction.guildId
			}
		});

		if (!rank) {
			await prisma.userLevel.create({
				data: {
					userId,
					serverId: interaction.guildId
				}
			});
			rank = await prisma.userLevel.findFirst({
				where: {
					userId,
					serverId: interaction.guildId
				}
			});
		}

		let content =
			(member ? `${member.user.username} is level` : `You are level`) +
			` ${rank.level} (${rank.exp} exp / ${rank.level * 50} exp)`;

		interaction.editReply({
			content
		});
	}
}

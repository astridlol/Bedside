import { EmbedBuilder, GuildMember } from 'discord.js';
import Colors from './Colors';

const LevelUp = (member: GuildMember, level: Number): EmbedBuilder => {
	const embed = new EmbedBuilder().setTitle('Level up!').setColor(Colors.blue);
	embed.setDescription(`${member.displayName} just reached reputation level ${level} 🎉`);
	return embed;
};

export { LevelUp };

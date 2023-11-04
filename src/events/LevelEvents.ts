import { ArgsOf, Discord, Guard, On } from 'discordx';
import NodeCache from 'node-cache';
import { client, prisma } from '..';
import { PreventBots } from '../guards/PreventBots';
import * as Embeds from '../constants/Embeds';
const isWord = require('is-word')('american-english');

const levelCache = new NodeCache({ stdTTL: 30 });

interface LevelResponse {
	leveled: boolean;
	newLevel?: number;
}

@Discord()
class LevelEvents {
	async checkLevel(userId: string): Promise<LevelResponse> {
		const userLevel = await prisma.userLevel.findFirst({ where: { userId } });

		const { level, exp } = userLevel;
		const neededExp = level * 50;

		if (exp < neededExp)
			return {
				leveled: false
			};

		await prisma.userLevel.update({
			where: { userId },
			data: { level: { increment: 1 }, exp: 0 }
		});

		const carriedOver = exp - neededExp;

		if (carriedOver > 0) {
			await prisma.userLevel.update({
				where: { userId },
				data: { exp: carriedOver }
			});
		}

		const newLevel = level + 1;

		const levelRoles = await prisma.levelRoles.findMany({
			where: {
				serverId: userLevel.serverId,
				neededLvl: newLevel
			}
		});

		if (levelRoles.length > 0) {
			const server = await client.guilds.fetch(userLevel.serverId);
			const member = await server.members.fetch(userId);

			levelRoles.forEach((r) => member.roles.add(r.roleId, `Achieved level ${newLevel}`));
		}

		return {
			leveled: true,
			newLevel
		};
	}

	@Guard(PreventBots)
	@On({ event: 'messageCreate' })
	async onMessage([message]: ArgsOf<'messageCreate'>) {
		const { content, author, guildId } = message;

		// Enforces our cooldown
		if (levelCache.has(author.id)) return;
		if (content.length === 1) return;

		const where = {
			userId: author.id
		};

		const user = await prisma.userLevel.findFirst({
			where
		});

		if (!user) {
			await prisma.userLevel.create({
				data: {
					userId: author.id,
					serverId: guildId
				}
			});
		}

		let validWords = 0;

		content.split(/\s+/g).forEach((w) => {
			if (isWord.check(w)) validWords++;
		});

		let randomExp = Math.ceil(Math.random() * 5) + 5;
		let wordExp = Math.ceil(validWords / 6);

		let addedExp = wordExp + randomExp;

		levelCache.set(author.id, true);

		await prisma.userLevel.update({
			where,
			data: {
				exp: {
					increment: addedExp
				}
			}
		});

		const hasLeveled = await this.checkLevel(author.id);

		if (!hasLeveled.leveled) return;

		const levelEmbed = Embeds.LevelUp(message.member, hasLeveled.newLevel);
		message.channel.send({
			embeds: [levelEmbed]
		});
	}
}

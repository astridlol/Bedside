import { GuardFunction, ArgsOf } from 'discordx';

export const PreventBots: GuardFunction<ArgsOf<'messageCreate'>> = async ([message], _, next) => {
	if (!message.author.bot) await next();
};

import { Message } from "discord.js";
import GlobalHandler from "./command";
import logger from "./logger";

/**
 * Command prefix
 */
export const prefix = "!b ";
const commandRegex = new RegExp(`^${prefix}(\\w+) ?(((\\w+) ?)+)?`, 'm')

/**
 * Route a discord message content to a command handler.
 * @param msg Discord message that needs be validated and routed.
 */
export function Route(msg : Message) : boolean {
    let match : null | RegExpMatchArray;
    try {
        while ((match = commandRegex.exec(msg.content)) !== null) {
            // avoid infinite loops with zero-width matches
            if (match.index === commandRegex.lastIndex) {
                commandRegex.lastIndex++;
            }
            if(match.length >= 3) {
                GlobalHandler.Handle(match[1].toLowerCase(), {msg});
                return true;
            }
        }
    }
    catch(err) {
        logger.Log(err);
    }
    return false;
}

import embedsCache from "../cache";
import GlobalHandler from "../command";
import logger from "../logger";
import { prefix } from "../router";
import webClient from "../webClient";

const commandName = 'init';
GlobalHandler.Register(commandName, {
    description: "Add a new embed to a server: ```" + prefix + commandName + " #channel-name```Only one embed is allowed per server, the embed is updated automatically every 5 minutes.",
    handle: async function({msg}) {
        try {
            if(msg.guild?.id && msg.member?.permissions.has(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_MESSAGES', 'MANAGE_ROLES'])) {
                let target = msg.mentions.channels.first();
                if(!target) {
                    msg.channel.send("Please run the command again and provide a channel```!b init #channel-name```");
                    return;
                }
                const embed = embedsCache.NewEmbed(msg.guild.id, webClient.statusCache, webClient.timestamp);
                if(embed) {
                    // Send the embed to the same channel as the message
                    target.send(embed).then((sentMsg) => {
                        embedsCache.Add(msg.guild?.id, sentMsg);
                    });
                }
            }
        }        
        catch(err) {
            logger.Log(err);
        }
    }
});

export default commandName;
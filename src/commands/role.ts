import embedsCache from "../cache";
import GlobalHandler from "../command";
import logger from "../logger";
import { prefix } from "../router";

const commandName = 'role';
GlobalHandler.Register(commandName,{
    description: "Ping a role when the servers are online or offline: ```" + prefix + commandName + " @role```To check what role would be pinged: ```" + prefix + commandName +"```The ping would be deleted automatically after 10 minutes.",
    handle: async function({msg}) {
        try 
        {
            if(msg.guild?.id && msg.member?.permissions.has(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_MESSAGES', 'MANAGE_ROLES'])) {
                let role = msg.mentions.roles.first();
                if(!role) {
                    let role = embedsCache.GetRole(msg.guild.id);
                    if(role) {
                        msg.channel.send(`Role: \`${role.name}\``);
                        return;
                    }
                    msg.channel.send("Please run the command again with and provide a role\n```" + prefix + commandName+ " @role```");
                }
                else if(msg.guild.id) {
                    let added = await embedsCache.UpdateRole(msg.guild.id, role);
                    if(added) {
                        msg.channel.send("The bot will ping role `"+role.name+"` when the servers become online.");
                    }
                    else {
                        msg.channel.send("Please initialize the bot first (add an embed) before adding or updating a ping role.");
                    }
                }
            }
        }
        catch(err) {
            logger.Log(err);
        }
    }
});

export default commandName;
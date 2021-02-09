import GlobalHandler from "../command";
import logger from "../logger";
let commandName = 'help';
GlobalHandler.Register(commandName,{
    description: "Show all available commands.",
    handle: async function({msg}) {
        try {
            if(msg.guild?.id && msg.member?.permissions.has(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_MESSAGES', 'MANAGE_ROLES'])) {
                msg.channel.send(GlobalHandler.commandsInfo)
            }
        }
        catch(err) {
            logger.Log(err);
        }
    }
});

export default commandName;
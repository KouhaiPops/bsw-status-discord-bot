import GlobalHandler from "../command";
import logger from "../logger";
import fs from 'fs';
import { prefix } from "../router";

const commandName = "report";
// THIS IS AN UNSAFE HANDLER AS IT SAVES ANYTHING SENT TO THE POINT TO A FILE INSTEAD TO LOGGING SINK
GlobalHandler.Register(commandName,{
    description: "Report an error, bug or request improvements: ```" + prefix + commandName + " [message]```",
    handle: async function({msg}) {
        if(!fs.existsSync("./reports")) {
            fs.mkdirSync("./reports");
        }
        fs.writeFile(`./reports/${msg.id}`, msg.content, (err) => {
            if(err)
            {
                logger.Log(err.message);
            }
        });
    }
})

export default commandName;
import { Message } from "discord.js";
import { ne } from "sequelize/types/lib/operators";

export interface ICommandHandler {
    [Key: string] : ICommand;
}

export interface ICommand {
    handle : (params : ICommandParams) => void;
    description? : string;
}

export interface ICommandParams {
    msg : Message;
    data? : string;
};


class GlobalCommandHandler {
    private handler : ICommandHandler = {};
    private _commandsInfo! : string;
    get commandsInfo() : string {
        return this._commandsInfo;
    }


    /**
     * Register a function to be called when the provided commandName is called. 
     * @param commandName the name of the command after the prefix
     * @param command a function to handle the command
     */
    Register(commandName : string, command : ICommand) : GlobalCommandHandler
    {
        // Check if a name is actually provided
        if(commandName.length == 0) {
            throw new Error("Trying to register a command that doesn't have a name.");
        }
        // Check if the provided commandName has not been already registered.
        if(this.handler[commandName]) {
            throw new Error(`Command ${commandName} is already registered an cannot be overwritten.`);
        }

        // Add the command
        this.handler[commandName] = command;

        // Allow to call multiple times
        return this;
    }

    Handle(commandName : string, params : ICommandParams) : boolean 
    {
        if(commandName.length == 0) {
            throw new Error("Trying to call a command that doesn't have an actual name, but instead is an empty string.");
        }
        if(this.handler[commandName]) {
            this.handler[commandName].handle(params);
            return true;
        }
        return false;
    }


    UpdateHelpMessage()
    {
        let helpMessage = "Commands:\n";
        for(const commandName in this.handler)
        {
            helpMessage += `\n\`${commandName}\`\n`;
            if(this.handler[commandName].description) {
                helpMessage += `${this.handler[commandName].description}\n`;
            }
        }
        this._commandsInfo = helpMessage;
    }

}

let GlobalHandler = new GlobalCommandHandler();
export default GlobalHandler;
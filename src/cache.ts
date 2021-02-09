import { Client, DiscordAPIError, Guild, Message, MessageEmbed, Role, TextChannel } from "discord.js";
import { MessageDTO } from "./db";
import logger from "./logger";
import { IStatusCache } from "./webClient";
enum status {
    online = ":white_check_mark:",
    offline = ":x:",
} 
/**
 * An interface to represent a hash map of IPingMessage
 * Maps a guild id string to it's embedded message.
 */
interface IEmbedsCache {
    [guildId : string] : IPingMessage;
}

/**
 * A collection of an embedded message and a role that could be pinged
 */
interface IPingMessage {
    Content : Message,
    Role? : Role,
}

// TODO REFACTOR
/**
 * THIS CLASS SHOULD BE REFACTORED, IT HANDLES BUSINESS LOGIC EVEN THOUGH IT SHOULD ONLY BE A CACHE
 * TOO LAZY TO FIX FOR NOW
 */
class EmbedsCache {
    // Use class cache instead of using discord.js
    private _embedsCache : IEmbedsCache = {};
    private _pingMessages : Message[] = [];
    private prevOverallStatus : boolean | null = null;
    

    /**
     * Update the pingable role of a guild.
     * @param guildId Id of the guild that requested the role to be updated
     * @param role The new role that the guild requested to be pinged
     */
    async UpdateRole(guildId: string, role: Role) : Promise<boolean> {
        let message = await MessageDTO.findOne({where: {guildId: guildId}});
        if(message) {
            message.roleId = role.id;
            message.save();
            
            let pingableMessage = this._embedsCache[guildId];
            pingableMessage.Role = role;
            return true;
        }
        return false;
    }

    /**
     * Get a guild's cached id.
     * @param guildId The guild that queried it's Id
     */
    GetRole(guildId : string) : Role | undefined {
        return this._embedsCache[guildId]?.Role;
    }
    
    /**
     * Query database and cache everything in memory
     * This assumes there aren't too many connected users, needs load balancing
     * @param client The bot discord client.
     */
    async InitializeMessage(client: Client) {
        // Get embeds from db
        let embeds = await MessageDTO.findAll();

        // Get current connected guilds
        let guilds = client.guilds.cache.array();
        let guildWithEmbed : Guild;
        let channel : TextChannel;
        let message : Message ;
        // Integrate over the embeds
        for (const embed of embeds) {

            // This could potentially be a hot path O(n^2), but only on startup so w/e
            if((guildWithEmbed = guilds.filter(guild => guild.id == embed.guildId)[0])) {
                 
                // Try to only get text based channels
                if((channel = guildWithEmbed.
                    channels.
                    cache.
                    filter(ch => (ch.type == "text" || ch.type == "news") && 
                    embed.channelId == ch.id)
                    .array()[0] as TextChannel)) {
                    try {
                        // Try to get the embedded message
                        if(( message = await (channel.messages.fetch(embed.messageId)))) {
                            let cachedEmbed : IPingMessage = {Content: message};

                            if(embed.roleId) {
                                let role = await guildWithEmbed.roles.fetch(embed.roleId);
                                if(role) {
                                    logger.Log(`role id ${role.id} role name ${role.name}`);
                                    cachedEmbed.Role = role;
                                }
                            }
                            this._embedsCache[embed.guildId] = cachedEmbed;
                            continue;
                        }
                    }
                    catch(err) {
                        if(err instanceof DiscordAPIError && err.code == 50001) {
                            this.Delete(embed.guildId);
                        }
                    }
                }
            }
            // Delete from database if a guild removed the bot while it's down
            await MessageDTO.destroy({where: {id: embed.id}});
        }
    }

    /**
     * Update embeds timestamps without changing their fields
     */
    UpdateTimeStamp() {

        let toBoDeleted : string[] = [];
        // Iterate over cached embeds
        for (const guildId in this._embedsCache) {
            // Get message
            let msg = this._embedsCache[guildId]?.Content;
            if(!msg)
                // This should never be reached, if it was, this is a fatal error that's being suppressed
                continue;

            if(msg.deleted || !msg.editable) {
                toBoDeleted.push(guildId);
                continue;
            }
            let embed = msg.embeds[0];
            embed.setFooter(`Last checked on: ${new Date().toISOString()}`);
            msg.edit(embed).catch((reason) => {
                if(reason instanceof DiscordAPIError) {
                    if(reason.code == 50001) {
                        toBoDeleted.push(guildId);
                    }
                }
            });
        }
        for (const guildId of toBoDeleted)
        {
            this.Delete(guildId);
        }
    }

    /**
     * Add a new embed to a guild.
     * @param guildId The guild id that requested a new embed
     * @param statusCache The current state that would be embedded
     * @param timestamp The timestamp of the last cached state
     */
    NewEmbed(guildId : string, statusCache: IStatusCache, timestamp: string) {
        let embed : Message;
        if((embed = this._embedsCache[guildId]?.Content))
            if(embed.deleted)
                this.Delete(guildId);
            else
                return null;
        
        return new MessageEmbed()
        // Set the title of the field
        .setTitle('BSW Status')
        // Set the color of the embed
        .setColor(0xff0000)
        // Set the main content of the embed
        .setDescription(`BSW Site / CDN / Servers status!`)
        .addFields(
            { name: 'site', value: statusCache.site ? status.online : status.offline, inline: true},
            { name: 'cdn 0', value: statusCache["cdn 0"] ? status.online : status.offline, inline: true},
            { name: 'cdn 1', value: statusCache["cdn 1"] ? status.online : status.offline, inline: true},
            { name: 'cdn 2', value: statusCache["cdn 2"] ? status.online : status.offline, inline: true},
            { name: 'cdn 3', value: statusCache["cdn 3"] ? status.online : status.offline, inline: true},
            { name: 'cdn 4', value: statusCache["cdn 4"] ? status.online : status.offline, inline: true},
            { name: 'login', value: statusCache.login ? status.online : status.offline, inline: true},
            { name: 'character', value: statusCache.char ? status.online : status.offline, inline: true},
            { name: 'world', value: statusCache.world ? status.online : status.offline, inline: true},
        ).setFooter(`Last checked on: ${timestamp}`);

    }

    /**
     * Update embeds.
     * @param changed The new changed state
     * @param timestamp The of the last cached state (current state)
     */
    async UpdateStatus(changed: IStatusCache, timestamp : string) {
        let currentOverallStatus = changed.char && changed.login && changed.world;
        let toBoDeleted : string[] = [];
        for (const guildId in this._embedsCache) {
            let msg = this._embedsCache[guildId]?.Content;
            let role = this._embedsCache[guildId].Role;

            if(!msg)
                continue;

            if(msg.deleted || !msg.editable) {
                toBoDeleted.push(guildId);
                continue;
            }
            let embed = msg.embeds[0];
            for (const field of embed.fields) {
                if(field.name == 'character') {
                    field.value = changed.char ? status.online : status.offline;
                    continue;
                }
                field.value = changed[field.name] ? status.online : status.offline;
            }
            embed.setFooter(`Last checked on: ${timestamp}`);
            try {
                await msg.edit(embed);
                console.log(role);
                if(role) {
                    logger.Log(`role name: ${role.name} id: ${role.id} | previous: ${this.prevOverallStatus} current: ${currentOverallStatus}`)
                }
                if(role && this.prevOverallStatus != null && currentOverallStatus != this.prevOverallStatus) {
                    try {
                        var pingMessage = await msg.channel.send(`<@&${role.id}> ` + (currentOverallStatus ? "servers are up" : "servers are down"));
                        this._pingMessages.push(pingMessage);
                    }
                    catch(err) {
                        if(err instanceof DiscordAPIError) {
                            logger.Log(`err code: ${err.code} msg ${err.message}`);
                        }
                    }
                }
            }
            catch(err) {
                if(err instanceof DiscordAPIError) {
                    if(err.code == 50001) {
                        toBoDeleted.push(guildId);
                    }
                }
            }
        } 
        this.prevOverallStatus = currentOverallStatus;
        for (const guildId of toBoDeleted)
        {
            this.Delete(guildId);
        }
    }

    /**
     * Clear all ping messages
     */
    ClearPings() : void {
        while(this._pingMessages.length != 0) {
            this._pingMessages.pop()?.delete();
        }
    }

    async Add(guildId : string | undefined, embed : Message) : Promise<boolean> {
        if(guildId == undefined || this._embedsCache[guildId])
        return false;
        
        this._embedsCache[guildId] = {Content: embed};
        const message = await MessageDTO.create({messageId: embed.id, channelId: embed.channel.id, guildId: guildId});
        logger.Log(`New message: ${message.id}`)
        return true;
    }

    Get(guildId : string | undefined) : Message | null {
        if(guildId == undefined)
            return null;
        
        return this._embedsCache[guildId].Content;
    }

    private Delete(guildId : string) : void {
        delete this._embedsCache[guildId];
        MessageDTO.destroy({where: {guildId: guildId}});
    }
}
let embedsCache = new EmbedsCache();
export default embedsCache;
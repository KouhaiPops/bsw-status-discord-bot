// Get env vars before importing anything
import dotenv from 'dotenv'
dotenv.config();

import logger from './logger';

import { Client } from 'discord.js';

// This imports all commands imported in ./commands/commands, this should be avoided and instead
// import commands manually here or make an express-like router.
import './commands/commands';
import cron from 'node-cron';
import { Route } from './router';
import embedsCache from './cache';
import webClient from './webClient';
import GlobalHandler from './command';
import { AddNotifiedUser } from './db';

// Update help message based registered commands
GlobalHandler.UpdateHelpMessage();

let initializing = true;
webClient.OnUpdate((changed) => {
    if(changed) {
        embedsCache.UpdateStatus(changed, webClient.timestamp).then(() => {
            if(initializing) {
                initializing = false;
                return;
            }
            cron.schedule(`*/10 * * * *`, () => {
                embedsCache.ClearPings();
            })
        });
    }
    else {
        embedsCache.UpdateTimeStamp();
    }
});

const client = new Client();


client.on('ready', () => {
    initializing = true;
    logger.Log(`Bot started - Serving: ${client.guilds.cache.array().length} servers`);
    embedsCache.InitializeMessage(client);
})

client.on('message', (msg) => {
    if(msg.author.bot)
        return;
    if(Route(msg)) {
    }
})

client.on('guildCreate', (guild) => {
    guild.fetchAuditLogs({type: "BOT_ADD", limit: 1}).then(log => {
        let executor = log.entries.first()?.executor;
        executor?.send(GlobalHandler.commandsInfo)    
        AddNotifiedUser(executor);
    }).catch((reason) => {
        logger.Log(reason);
    })
})

client.login(process.env['TOKEN']);

process.on("unhandledRejection", (reason, promise) => {
    logger.Log("-=- Unhandled rejections -=-");
    logger.Log("-=- Stack -=-");
    // @ts-ignore
    logger.Log(reason.stack);
    logger.Log("-=- End of Stack -=-");
    // @ts-ignore
    logger.Log(reason);
})
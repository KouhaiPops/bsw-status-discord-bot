#!/bin/bash
if [ ! -f .env ]; then
   echo "No enviroment files were provided"
   exit
fi

if ! command -v pm2 &> /dev/null; then
   echo "pm2 is not installed"
   echo "Attempting to install pm2"
   npm install -g pm2
   exit
fi

if ! pm2 list | grep -q bsw-discord-bot; then
   echo "No bot instance is running, starting a new instance with pm2"
   pm2 start npm --name "bsw-discord-bot" -- start
   exit
fi

echo "Bot instance is already running, restarting the instance"
pm2 restart bsw-discord-bot
exit
# BurningSW Status discord bot

A discord bot to show status of burning soulworker servers based on a backend.

## Dependencies

* Npm
* Nodejs
* Axios
* Discord.js
* dotnev
* node-cron
* sequelize
* sqlite3 (5.0.0)
* Typscript compiler

## Building

To compile TS files, in a terminal
```bash
npm run build
```
To run and cimpile TS files, in a terminal
```bash
npm start
```
TS files will be compiled to `out` directory.

#### Notes

The bot token and backend URL should be defined in `.env` file
```py
TOKEN=[token]
baseURl=https://example.com
```
If using Jenkins CI/CD, a simple pipeline is defined in `Jenkinsfile`</br>
If building on Linux, `build.sh` script is preferred to be used over normal building as it automatically installs pm2 and runs the bot as a pm2 process.</br>
If running on Linux, make sure sqlite3 version is 5.0.0, as of 1/28/2021 versions newer than 5.0.0 caused fatal errors.


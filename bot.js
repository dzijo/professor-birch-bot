var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
/*var fs = require('fs');
var fsExtra = require('fs-extra');*/
var mysql = require('mysql');


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
var con;


bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    con = mysql.createConnection({
        host: auth.host,
        user: auth.username,
        password: auth.password,
        database: auth.database
    });
    //con.connect();
});

var clearing = false;
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            // !ping
            case 'ping':
                clearing = false;
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            // adding a player
            case 'enroll':
                clearing = false;
                //fs.readFile(folder + userID + ".txt", (err, data) => {
                con.query(`SELECT * FROM test;`, function (err, results, fields) {
                    if (err) {
                        throw err;
                        //fs.writeFile(folder + userID + ".txt", "", (err) => {
                        /*if (err) {
                            bot.sendMessage({
                                to: channelID,
                                message: "There was an issue, try again."
                            })
                        }
                        else {
                            bot.sendMessage({
                                to: channelID,
                                message: `Congrats, ${user}, you have successfully enrolled in the Pokémon draft tournament.`
                            })
                        }*/
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `F`
                        });
                        console.log(`F: ${results[0].name}`);
                    }
                });
                break;
            // clear all participants
            case 'clearall':
                if (auth.mods.includes(userID)) {
                    bot.sendMessage({
                        to: channelID,
                        message: `Are you sure you want to clear all participants? Type !yes to confirm, !no to cancel.`
                    });
                    clearing = true;
                }
                break;
            // confirm clear
            case 'yes':
                if (clearing === true && auth.mods.includes(userID)) {
                    //fsExtra.emptyDirSync('players')
                    clearing = false;
                    bot.sendMessage({
                        to: channelID,
                        message: `Deleted all participants.`
                    });
                }
                break;
            // cancel clear
            case 'no':
                if (clearing === true && auth.mods.includes(userID)) {
                    clearing = false;
                    bot.sendMessage({
                        to: channelID,
                        message: `Canceled...`
                    });
                }
                break;
            // roll a pokemon
            case 'roll':
                clearing = false;
                break;
            // add result
            case 'result':
                clearing = false;
                break;
        }
    }
});
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var mysql = require('mysql');
var functions = require('./functions');


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
});

var clearing = false;
bot.on('message', function (user, userID, channelID, message, evt) {
    // Bot will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        functions.log(con, user, userID, channelID, message, evt);
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
                functions.enroll(bot, con, user, userID, channelID, message, evt);
                break;
            // show stats
            case 'stats':
                clearing = false;
                functions.standings(bot, con, channelID);
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
                    //clear
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
                if (auth.mods.includes(userID)) {
                    functions.firstPokemon(bot, con);
                }
                break;

            case 'choose1':
                clearing = false;
                functions.choosePokemon(bot, con, user, userID, 1);
                break;
            case 'choose2':
                clearing = false;
                functions.choosePokemon(bot, con, user, userID, 2);
                break;
            case 'choose3':
                clearing = false;
                functions.choosePokemon(bot, con, user, userID, 3);
                break;



            // add result
            case 'result':
                clearing = false;
                break;
        }
    }
});
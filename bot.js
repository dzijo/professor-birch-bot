const Discord = require('discord.io');
const logger = require('winston');
const mysql = require('mysql');
const functions = require('./functions.js');
const config = require('./config.js')


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
let bot = new Discord.Client({
    token: config.token,
    autorun: true
});
let con;


bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    con = mysql.createPool({
        host: config.host,
        user: config.username,
        password: config.password,
        database: config.database,
        multipleStatements: true
    });
});

let clearing = false;
bot.on('message', function (user, userID, channelID, message, evt) {
    // Bot will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        functions.log(con, user, userID, channelID, message, evt, config.timezone);
        config.matchweek += 1;
        let args = message.substring(1).split(' ');
        let cmd = args[0];

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
                functions.stats(bot, con, channelID);
                break;

            case 'weeklyStats':
                clearing = false;
                functions.weeklyStats(bot, con, channelID);
                break;

            case 'result':
                clearing = false;
                if (args[0]) {
                    let opponent = args[0].slice(3, -1);
                    if (opponent) {
                        functions.addResult(bot, con, user, userID, channelID, opponent, args[1], evt, config.timezone);
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `Please tag your opponent, ${user}. Use !result for help.`
                        });
                    }
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `Correct usage of the command:\n!result @<opponent> <score1>-<score2>.\nMake sure to tag your opponent.`
                    });
                }
                break;


            case 'delete':
                clearing = false;
                if (config.mods.includes(userID)) {
                    if (args[0]) {
                        let deleteUserId = args[0].slice(3, -1);
                        functions.removePlayer(con, bot, channelID, deleteUserId);
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `Tag a user you want to delete, ${user}.`
                        });
                    }
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `You can't do that, ${user}.`
                    });
                }
                break;

            // clear all participants
            case 'clearall':
                if (config.mods.includes(userID)) {
                    bot.sendMessage({
                        to: channelID,
                        message: `Are you sure you want to clear all participants? Type !yes to confirm, !no to cancel.`
                    });
                    clearing = true;
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `You can't do that, ${user}.`
                    });
                }
                break;
            // confirm clear
            case 'yes':
                if (clearing === true && config.mods.includes(userID)) {
                    //clear
                    clearing = false;
                    functions.clearAll(con, bot, channelID);
                }
                break;
            // cancel clear
            case 'no':
                if (clearing === true && config.mods.includes(userID)) {
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
                if (config.mods.includes(userID)) {
                    functions.rollPokemon(bot, con, channelID, evt, config.timezone);
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
        }
    }
});
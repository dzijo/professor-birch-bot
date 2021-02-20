const Discord = require('discord.io');
const logger = require('winston');
const mysql = require('mysql');
const functions = require('./functions.js');
const config = require('./config.js');
const table = require('easy-table');


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
    if (evt.d.guild_id && !config.channels.includes(channelID)) {
        return;
    }
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
            case 'join':
            case 'enroll':
                clearing = false;
                functions.enroll(bot, con, user, userID, channelID, message, evt);
                break;
            // show stats
            case 'standings':
            case 'leaderboard':
            case 'stats':
                clearing = false;
                functions.stats(bot, con, channelID);
                break;

            case 'week':
            case 'weekly':
            case 'weeklystats':
            case 'weeklyStats':
                clearing = false;
                functions.weeklyStats(bot, con, channelID, args[0]);
                break;

            case 'playedwith':
            case 'playedWith':
            case 'alreadyPlayed':
            case 'alreadyplayed':
            case 'played':
                clearing = false;
                functions.playedWith(bot, con, user, userID, channelID);
                break;

            case 'addgame':
            case 'game':
            case 'addGame':
            case 'result':
                clearing = false;
                if (args[0]) {
                    let start = args[0].search(/\d/);
                    let opponent = args[0].slice(start, -1);
                    if (opponent) {
                        functions.addResult(bot, con, user, userID, channelID, opponent, args[1], evt, config.timezone);
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `Please tag your opponent, <@${userID}>. Use !result for help.`
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

            case 'trade':
                clearing = false;
                if (args[0]) {
                    let start = args[0].search(/\d/);
                    let tradee = args[0].slice(start, -1);
                    if (tradee) {
                        functions.tradePokemon(bot, con, user, userID, channelID, tradee, args[1], args[2]);
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `Please tag your trading partner, <@${userID}>.`
                        });
                    }
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `Correct usage of the command:\n!trade @<partner> <your pokemon> <partner's pokemon>.\nMake sure to tag your partner.`
                    });
                }
                break;

            case 'delete':
                clearing = false;
                if (config.mods.includes(userID)) {
                    if (args[0]) {
                        let start = args[0].search(/\d/);
                        let deleteUserId = args[0].slice(start, -1);
                        functions.removePlayer(con, bot, channelID, deleteUserId);
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: `Tag a user you want to delete, <@${userID}>.`
                        });
                    }
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: `You can't do that, <@${userID}>.`
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
                        message: `You can't do that, <@${userID}>.`
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
            case 'start':
            case 'roll':
                clearing = false;
                if (config.mods.includes(userID)) {
                    functions.rollPokemon(bot, con, channelID, evt, config.timezone);
                }
                break;
            
            case 'choices':
                clearing = false;
                functions.resendChoices(bot, con, userID);
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




            case 'help':
                clearing = false;
                let data = [
                    { command: '!join/!enroll', function: 'Join the league.' },
                    { command: '!stats', function: 'Check the stats of the whole league.' },
                    { command: '!weekly', function: 'Check the stats of a matchweek.' },
                    { command: '!played', function: 'Check against whom you have played this week.' },
                    { command: '!game/!result', function: 'Add a game. Use empty command for more help.' },
                    { command: '!choices', function: 'Politely ask the professor to send you your choices for this matchweek.'},
                    { command: '!chooseX', function: 'Used for choosing a pokemon at the start of a matchweek.' },
                    { command: '!trade', function: 'Used for trading a pokemon. Use empty command for more help.' }
                ];
                let msg = `Available commands:\n`;
                msg += `\`\`\`${table.print(data)}\`\`\``;
                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
                break;

            default:
                bot.sendMessage({
                    to: channelID,
                    message: `Unknown command, use !help.`
                });
                break;
        }
    }
});
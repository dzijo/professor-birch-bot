const moment = require('moment');

module.exports = {
    log: function (con, user, userID, channelID, message, evt) {
        //console.log(evt.d.timestamp);
        //let date = new Date(evt.d.timestamp).toISOString().slice(0, 19).replace('T', ' ');
        let date = moment(evt.d.timestamp).format('YYYY-MM-DD HH:mm:ss');
        //console.log(date.toString());
        let sql = `INSERT INTO log(stamp, command, userName, userId) VALUES ('${date}', '${message}', '${user}', '${userID}');`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                //console.log(results);
                //console.log(channelID);
            }
        });
    },

    enroll: function (bot, con, user, userID, channelID, message, evt) {
        let sql = `SELECT * FROM players WHERE userId = ${userID}`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                if (results[0]) {
                    bot.sendMessage({
                        to: channelID,
                        message: `You are already in the league, ${user}.`
                    });
                }
                else {
                    let sql = `INSERT INTO players (userId, userName) VALUES ('${userID}', '${user}');`;
                    con.query(sql, function (err, results, fields) {
                        if (err) {
                            bot.sendMessage({
                                to: channelID,
                                message: `There was an issue, try again.`
                            });
                        }
                        else {
                            bot.sendMessage({
                                to: channelID,
                                message: `Congrats, ${user}, you have successfully enrolled in the Pokémon draft league.`
                            })
                        }
                    });
                }
            }
        });
    },

    standings: function (bot, con, channelID) {
        let sql = `SELECT userName, wins, losses, PF, PA FROM players ORDER BY wins DESC, PF - PA DESC`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                //console.log(results);
                let stats = "Name: W-L | PF-PA-PD";
                for (r of results) {
                    stats += `\n${r.userName}: ${r.wins}-${r.losses} | ${r.PF}-${r.PA}-${r.PF - r.PA}`;
                }
                bot.sendMessage({
                    to: channelID,
                    message: stats
                });
            }
        })
    },

    firstPokemon: function (bot, con) {
        let sql = `SELECT userId FROM players`;
        let players;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                let players = results;
                let sql = `SELECT pokemon FROM pokemon WHERE ownerId IS NULL`
                con.query(sql, function (err, results, fields) {
                    if (err) throw err;
                    else {
                        pokemon = shuffle(results);
                        let sql = `DELETE FROM choices;`
                        con.query(sql, function (err, results, fields) {
                            if (err) throw err;
                            else {
                                let i = 0;
                                for (p of players) {
                                    let sql = `INSERT INTO choices (userId, pokemon, choice) VALUES\n`;
                                    let message = ``;
                                    for (j of [1, 2, 3]) {
                                        let mon = pokemon[i + j].pokemon
                                        message += `Option ${j}: ${mon}\n`;
                                        sql += `('${p.userId}', '${mon}', ${j}),\n`;
                                    }
                                    sql = sql.slice(0, -2) + ";";
                                    con.query(sql, function (err, results, fields) {
                                        if (err) throw err;
                                    });
                                    message += `Please answer with "!choose<number of option>" to choose a pokemon. E.g. !choose1`;
                                    bot.sendMessage({
                                        to: p.userId,
                                        message: message
                                    });
                                    i += 3;
                                }
                            }
                        });
                    }
                });
            }
        })
    },

    choosePokemon: function (bot, con, user, userID, choice) {
        let sql = `SELECT pokemon FROM choices WHERE userId = '${userID}' AND choice = ${choice};`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                let pokemon = results[0].pokemon;
                let sql = `UPDATE pokemon SET ownerId = '${userID}' WHERE pokemon = '${pokemon}';`
                con.query(sql, function (err, results, fields) {
                    if (err) throw err;
                    else {
                        bot.sendMessage({
                            to: userID,
                            message: `Congrats, ${user}, you have chosen ${pokemon} to be your partner! Good luck!`
                        });
                    }
                });
            }
        });
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
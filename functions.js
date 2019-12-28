const moment = require('moment-timezone');

module.exports = {
    log: function (con, user, userID, channelID, message, evt, timezone) {

        //console.log(evt.d.timestamp);
        //let date = new Date(evt.d.timestamp).toISOString().slice(0, 19).replace('T', ' ');
        let date = moment.tz(evt.d.timestamp, timezone).format('YYYY-MM-DD HH:mm:ss');
        //console.log(date.toString());
        let sql = `INSERT INTO log(stamp, command, userName, userId) VALUES ('${date}', '${message}', '${user}', '${userID}');`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
        });
    },

    enroll: function (bot, con, user, userID, channelID, message, evt) {
        let sql = `SELECT * FROM players WHERE userId = ${userID}`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            if (results[0]) {
                bot.sendMessage({
                    to: channelID,
                    message: `You are already in the league, ${user}.`
                });
                return;
            }
            let sql = `INSERT INTO players (userId, userName) VALUES ('${userID}', '${user}');`;
            con.query(sql, function (err, results, fields) {
                if (err) {
                    bot.sendMessage({
                        to: channelID,
                        message: `There was an issue, try again.`
                    });
                    return;
                }
                bot.sendMessage({
                    to: channelID,
                    message: `Congrats, ${user}, you have successfully enrolled in the Pokémon draft league.`
                })
            });
        });
    },

    stats: function (bot, con, channelID) {
        let sql = `SELECT userName, wins, losses, PF, PA FROM players ORDER BY wins DESC, PF - PA DESC`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            let stats = "Name: W-L | PF-PA(PD)";
            for (r of results) {
                stats += `\n${r.userName}: ${r.wins}-${r.losses} | ${r.PF}-${r.PA}(${r.PF - r.PA})`;
            }
            bot.sendMessage({
                to: channelID,
                message: stats
            });
        })
    },

    weeklyStats: function (bot, con, channelID) {
        let sql = `SELECT * FROM matchweeks ORDER BY startTime DESC LIMIT 1;`
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            matchweek = results.matchweek;
            let sql = `SELECT userName, wins, losses, PF, PA FROM resultsbymatchweek WHERE matchweek = ${matchweek} ORDER BY wins DESC, PF - PA DESC`;
            con.query(sql, function (err, results, fields) {
                if (err) throw err;
                let stats = `Matchweek ${matchweek}\n`;
                stats += "Name: W-L | PF-PA(PD)";
                for (r of results) {
                    stats += `\n${r.userName}: ${r.wins}-${r.losses} | ${r.PF}-${r.PA}(${r.PF - r.PA})`;
                }
                bot.sendMessage({
                    to: channelID,
                    message: stats
                });
            });
        });
    },

    addResult: function (bot, con, user, userID, channelID, opponent, result, evt, timezone) {
        if (userID === opponent) {
            bot.sendMessage({
                to: channelID,
                message: `Can't play against yourself, ${user}.`
            });
            return;
        }
        if (!result) {
            bot.sendMessage({
                to: channelID,
                message: `Please enter the score, ${user}.`
            });
            return;
        }
        let score1 = parseInt(result[0], 10);
        let score2 = parseInt(result[2], 10);
        if (isNaN(score1) || isNaN(score2) || (score1 > 6 || score2 > 6) || (score1 !== 0 && score2 !== 0) || (score1 === 0 && score2 === 0)) {
            bot.sendMessage({
                to: channelID,
                message: `Please enter the score correctly, ${user}. <player1score>-<player2score>`
            });
            return;
        }
        let sql = `SELECT * FROM players WHERE userId = '${userID}' OR userId = '${opponent}';`
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            if (!results[1]) {
                bot.sendMessage({
                    to: channelID,
                    message: `You have to both be in the leauge and tag your opponent correctly if you haven't, ${user}. Use !result for help.`
                });
                return;
            }
            let sql = `SELECT * FROM matchweeks ORDER BY startTime DESC LIMIT 1;`;
            let matchweek;
            con.query(sql, function (err, results, fields) {
                if (err) throw err;
                if (results[0].endTime) {
                    bot.sendMessage({
                        to: channelID,
                        message: `The matchweek is over, ${user}. Notify an admin to get the next one going.`
                    });
                    return;
                }
                matchweek = results[0].matchweek;
                let sql = `SELECT * FROM records WHERE ((user1Id = '${userID}' AND user2Id = '${opponent}') OR (user2Id = '${userID}' AND user1Id = '${opponent}')) AND matchweek = ${matchweek};`;
                con.query(sql, function (err, results, fields) {
                    if (err) throw err;
                    if (results[0]) {
                        bot.sendMessage({
                            to: channelID,
                            message: `You two have already played, ${user}.`
                        });
                        return;
                    }
                    let date = moment.tz(evt.d.timestamp, timezone).format('YYYY-MM-DD HH:mm:ss');
                    let winnerId;
                    let loserId;
                    let fscore;
                    if (score1 === 0) {
                        winnerId = opponent;
                        loserId = userID;
                        fscore = score2;
                    }
                    else {
                        winnerId = userID;
                        loserId = opponent;
                        fscore = score1;
                    }
                    let sql =
                        `INSERT INTO records (stamp, matchweek, user1Id, user2Id, score1, score2, winnerId) VALUES ('${date}', ${matchweek}, '${userID}', '${opponent}', ${score1}, ${score2}, '${winnerId}');
                        UPDATE players SET wins = wins + 1, PF = PF + ${fscore} WHERE userId = '${winnerId}';
                        UPDATE players SET losses = losses + 1, PA = PA + ${fscore} WHERE userId = '${loserId}';`;
                    con.query(sql, function (err, results, fields) {
                        if (err) throw err;
                        let sql = `SELECT * FROM players;`;
                        con.query(sql, function (err, results, fields) {
                            let n = results.length;
                            let sql = `SELECT * FROM records WHERE matchweek = ${matchweek};`;
                            con.query(sql, function (err, results, fields) {
                                if (err) throw err;
                                let goal = (n * (n - 1)) / 2;
                                if (goal < results.length) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: `Someone made a big booboo.`
                                    });
                                }
                                else if (goal === results.length) {
                                    let sql = `UPDATE matchweeks SET endTime = '${date}' WHERE matchweek = ${matchweek};`;
                                    con.query(sql, function (err, result, fields) {
                                        if (err) throw err;
                                        bot.sendMessage({
                                            to: channelID,
                                            message: `Congrats! That was the last game of this matchweek. Please notify an admin to begin the next matchweek.`
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    },

    rollPokemon: function (bot, con, channelID, evt, timezone) {
        let sql =
            `SELECT userId FROM players;
        SELECT * FROM matchweeks ORDER BY startTime DESC LIMIT 1;
        DELETE FROM choices;`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            let res = results[1];
            let matchweek;
            if (!res[0]) {
                matchweek = 1;
            }
            else {
                if (!res[0].endTime) {
                    bot.sendMessage({
                        to: channelID,
                        message: `The last matchweek hasn't finished yet.`
                    });
                    return;
                }
                matchweek = res[0].matchweek + 1;
            }
            let players = results[0];
            let date = moment.tz(evt.d.timestamp, timezone).format('YYYY-MM-DD HH:mm:ss');
            let sql =
                `SELECT pokemon FROM pokemon WHERE ownerId IS NULL;
            INSERT INTO matchweeks (matchweek, startTime) VALUES (${matchweek}, '${date}');`;
            con.query(sql, function (err, results, fields) {
                if (err) throw err;
                pokemon = shuffle(results[0]);
                if (matchweek === 1) {
                    setAllChoices(players, 3);
                    giveChoices(players, con, bot);
                    /*let i = 0;
                    for (p of players) {
                        p.numberOfChoices = 3;
                        let [sql, message] = givePokemon(i, pokemon, p);
                        bot.sendMessage({
                            to: p.userId,
                            message: message
                        });
                        i += p.numberOfChoices;
                        con.query(sql, function (err, results, fields) {
                            if (err) throw err;
                        });
                    }*/
                    return;
                }
                let sql = `SELECT userId, wins, losses, PF-PA AS PD, PF, PA FROM resultsbymatchweek WHERE matchweek = ${matchweek - 1} ORDER BY wins DESC, PF-PA DESC, PF DESC;`
                con.query(sql, function (err, results, fields) {
                    if (err) throw err;
                    setChoices(players, results);
                    giveChoices(players, con, bot);
                    return;
                })

            });
        })
    },

    choosePokemon: function (bot, con, user, userID, choice) {
        let sql = `SELECT pokemon FROM choices WHERE userId = '${userID}' AND choice = ${choice};`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            if (!results[0]) {
                bot.sendMessage({
                    to: userID,
                    message: `You can't choose right now, ${user}.`
                });
                return;
            }
            let pokemon = results[0].pokemon;
            let sql = `UPDATE pokemon SET ownerId = '${userID}' WHERE pokemon = '${pokemon}';`
            con.query(sql, function (err, results, fields) {
                if (err) throw err;
                bot.sendMessage({
                    to: userID,
                    message: `Congrats, ${user}, you have chosen ${pokemon} to be your partner! Good luck!`
                });
                let sql = `DELETE FROM choices WHERE userId = '${userID}';`;
                con.query(sql, function (err, results, fields) {
                    if (err) throw err;
                })
            });
        });
    },

    clearAll: function (con, bot, channelID) {
        let sql =
            `DELETE FROM choices;
            DELETE FROM matchweeks;
            DELETE FROM players;
            UPDATE pokemon SET ownerId = NULL;
            DELETE FROM records;`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            bot.sendMessage({
                to: channelID,
                message: `All users successfully deleted.`
            });
        });
    },

    removePlayer: function (con, bot, channelID, userID) {
        let sql = `DELETE FROM players WHERE userId = '${userID}'`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            if (results.affectedRows !== 0) {
                bot.sendMessage({
                    to: channelID,
                    message: `User successfully deleted.`
                });
                return;
            }
            bot.sendMessage({
                to: channelID,
                message: `That user is not in the league.`
            });
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

function givePokemon(i, pokemon, p) {
    let sql = `INSERT INTO choices (userId, pokemon, choice) VALUES\n`;
    let message = ``;
    for (let j = 1; j <= p.numberOfChoices; j++) {
        let mon = pokemon[i + j].pokemon
        message += `Option ${j}: ${mon}\n`;
        sql += `('${p.userId}', '${mon}', ${j}),\n`;
    }
    sql = sql.slice(0, -2) + ";";
    message += `Please answer with "!choose<number of option>" to choose a pokemon. E.g. !choose1`;
    return [sql, message];
}

function setChoices(players, results) {
    let i = 0;
    for (r of results) {
        let p = players.find(p => p.userId === r.userId);
        if (i <= 1 || checkIfTie(r, results[1]) || i === results.length - 1) {
            p.numberOfChoices = 3;
        }
        else {
            p.numberOfChoices = 2;
        }
    }
    return;
}

function checkIfTie(checkee, second) {
    if (checkee.wins === second.wins && checkee.PD === second.PD && checkee.PF === second.PF) {
        return true;
    }
    return false;
}

function giveChoices(players, con, bot) {
    let i = 0;
    for (p of players) {
        let [sql, message] = givePokemon(i, pokemon, p);
        bot.sendMessage({
            to: p.userId,
            message: message
        });
        i += p.numberOfChoices;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
        });
    }
    return;
}

function setAllChoices(players, numberOfChoices) {
    for (p of players) {
        p.numberOfChoices = numberOfChoices;
    }
}
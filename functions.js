const moment = require('moment');

module.exports = {
    log: function (con, user, userID, channelID, message, evt) {
        //console.log(evt.d.timestamp);
        //var date = new Date(evt.d.timestamp).toISOString().slice(0, 19).replace('T', ' ');
        var date = moment(evt.d.timestamp).format('YYYY-MM-DD HH:mm:ss');
        //console.log(date.toString());
        var sql = `INSERT INTO log(stamp, command, userName, userId) VALUES ('${date}', '${message}', '${user}', '${userID}');`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else console.log(results);
        });
    },

    enroll: function (bot, con, user, userID, channelID, message, evt) {
        var sql = `SELECT * FROM players WHERE userId = ${userID}`;
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
                    var sql = `INSERT INTO players (userId, userName) VALUES ('${userID}', '${user}');`;
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
        var sql = `SELECT userName, wins, losses, PF, PA FROM players ORDER BY wins DESC, PF - PA DESC`;
        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            else {
                console.log(results);
                var stats = "Name: W-L | PF-PA-PD";
                for (r of results) {
                    stats += `\n${r.userName}: ${r.wins}-${r.losses} | ${r.PF}-${r.PA}-${r.PF - r.PA}`;
                }
                bot.sendMessage({
                    to: channelID,
                    message: stats
                });
            }
        })
    }
}
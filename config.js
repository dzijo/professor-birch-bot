require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    host: process.env.HOST,
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
    mods: [
        process.env.ADMIN
    ],
    matchweek: process.env.MATCHWEEK
}
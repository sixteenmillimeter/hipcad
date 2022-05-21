'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Session module using redis and connect-redis to connect
 * @module sessionr
 */
const url_1 = require("url");
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
/**
*
* Configure the module with the following ENVIRONMENT variables.
*
* * `REDIS_HOST` - Default is "localhost", set if connecting to remote
* * `REDIS_PORT` - Default is `6379`, set if local or remote uses non-standard port
* * `REDIS_PORT` - Optional, set if redis is password protected
* * `SESSION_NAME` - Default is "session", set to customize for app
* * `SESSION_SECRET` - Default is "Please set a session secret", set to secure the session cookie
*
* Usage
* ```const session = require('sessionr')```
* then...
* ```app.use(session)```
*/
function sessionr() {
    let REDIS_URL = typeof process.env.REDIS_URL !== 'undefined' ? process.env.REDIS_URL : null;
    let REDIS_OPTS = { logErrors: true };
    let AUTH;
    //for heroku
    if (REDIS_URL) {
        AUTH = (0, url_1.parse)(REDIS_URL);
        //REDIS_OPTS.user = AUTH[0];
        //REDIS_OPTS.password = AUTH[1];
        REDIS_OPTS.host = AUTH.hostname;
        REDIS_OPTS.port = AUTH.port;
    }
    else {
        REDIS_OPTS.host = typeof process.env.REDIS_HOST !== 'undefined' ? process.env.REDIS_HOST : 'localhost';
        REDIS_OPTS.port = typeof process.env.REDIS_PORT !== 'undefined' ? parseInt(process.env.REDIS_PORT) : 6379;
    }
    if (typeof process.env.REDIS_USER !== 'undefined' && process.env.REDIS_USER != 'false') {
        REDIS_OPTS.user = process.env.REDIS_USER;
    }
    if (typeof process.env.REDIS_PASS !== 'undefined' && process.env.REDIS_PASS != 'false') {
        REDIS_OPTS.password = process.env.REDIS_PASS;
    }
    const SESSION_OPTS = {
        name: process.env.SESSION_NAME || 'session',
        secret: process.env.SESSION_SECRET || 'Please set a session secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 12 * 30 * 24 * 3600000 //year
        }
    };
    console.log(REDIS_OPTS);
    const redisClient = redis.createClient(REDIS_OPTS);
    redisClient.on('error', (err) => {
        console.error('auth/session ' + JSON.stringify(err));
    });
    redisClient.connect();
    SESSION_OPTS.store = new RedisStore({ client: redisClient });
    return session(SESSION_OPTS);
}
module.exports = sessionr();
//# sourceMappingURL=index.js.map
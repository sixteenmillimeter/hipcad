'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const Pool = require('pg-pool');
const POOL_MAX = (typeof process.env.POOL_MAX !== 'undefined') ? parseInt(process.env.POOL_MAX, 10) : 5;
const SSL = (process.env.DATABASE_SSL == '0') ? false : true; //ssl by default
const PARAMS = url_1.parse(process.env.DATABASE_URL || 'postgres://localhost:5432/sandbox');
const AUTH = PARAMS.auth.split(':');
const config = {
    user: AUTH[0],
    password: AUTH[1],
    host: PARAMS.hostname,
    port: PARAMS.port,
    database: PARAMS.pathname.split('/')[1],
    ssl: SSL,
    max: POOL_MAX
};
const pool = new Pool(config);
module.exports = pool;

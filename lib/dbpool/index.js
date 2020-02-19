'use strict';

const Pool = require('pg-pool');
const url = require('url');

const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

const POOL_MAX = process.env.POOL_MAX || 5;

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: true,
  max : POOL_MAX
};

const pool = new Pool(config);

module.exports = pool;
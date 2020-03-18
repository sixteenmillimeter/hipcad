'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const bcrypt_1 = require("bcrypt");
const uuid_1 = require("uuid");
const iz = require('iz');
const DB = require('db');
const delay = require('delay');
const log = require('log')('users');
const users = {};
let usersDB;
users.exists = async function users_exists(usernamehash, emailhash) {
    let exists = null;
    let res;
    try {
        res = await usersDB.find(`usernamehash = '${usernamehash}' OR emailhash = '${emailhash}'`);
    }
    catch (err) {
        throw err;
    }
    if (res.rows && res.rows.length > 0) {
        exists = `User already exists. Username or email is already in use.`;
    }
    return exists;
};
users.prohibit = ['static', 'user', 'object', 'hipcad', 'twittercb'];
users.create = async function users_create(username, email, pwstring, pwstring2) {
    const userobj = {
        id: uuid_1.v4(),
        username,
        email,
        joined: new Date().getTime(),
        paid: null,
        transaction: null
    };
    let exists;
    let failed;
    userobj.usernamehash = users.hash(username.toLowerCase());
    userobj.emailhash = users.hash(userobj.email.toLowerCase());
    failed = users.validateInfo(userobj.username, userobj.email, pwstring, pwstring2);
    if (failed) {
        await delay(2000);
        return { error: failed };
    }
    try {
        exists = await users.exists(userobj.usernamehash, userobj.emailhash);
    }
    catch (err) {
        log.error(err);
    }
    if (exists) {
        await delay(3000);
        return { error: exists };
    }
    try {
        userobj.passwordhash = await users.hashpw(pwstring);
    }
    catch (err) {
        log.error(err);
        return { error: err };
    }
    try {
        await usersDB.insert(userobj);
    }
    catch (err) {
        log.error(err);
        return { error: err };
    }
    return userobj;
};
users.reset = async function users_reset(username, email, pwstring) {
    //
};
users.auth = async function users_auth(username, pwstring) {
    let userobj;
    let matched = false;
    try {
        userobj = await users.get(username);
    }
    catch (err) {
        log.error(err);
    }
    if (!userobj) {
        await delay(2000);
        return { error: `User not found` };
    }
    try {
        matched = await bcrypt_1.compare(pwstring, userobj.passwordhash);
    }
    catch (err) {
        log.error(err);
        return { error: 'Error confirming password' };
    }
    if (!matched) {
        await delay(2000);
        return { error: `Password is incorrect` };
    }
    return userobj;
};
users.hash = function users_hash(str) {
    //
    return crypto_1.createHash('sha256').update(str).digest('base64');
};
users.hashpw = async function users_hashpw(value) {
    //
    return bcrypt_1.hash(value, 10);
};
users.destroy = async function users_destroy(username, pwstring) {
    let userobj;
    let matched = false;
    try {
        userobj = await users.get(username);
    }
    catch (err) {
        log.error(err);
    }
    if (!userobj) {
        await delay(2000);
        return { error: `User not found` };
    }
    try {
        matched = await bcrypt_1.compare(pwstring, userobj.passwordhash);
    }
    catch (err) {
        log.error(err);
    }
    if (!matched) {
        await delay(2000);
        return { error: `Password is incorrect` };
    }
    try {
        await usersDB.update(`id = '${userobj.id}'`, { deleted: 1 });
    }
    catch (err) {
        log.error(err);
    }
    try {
        await usersDB.delete(`id = ${userobj.id}`);
    }
    catch (err) {
        log.error(err);
    }
    return { success: true };
};
users.get = async function users_get(username) {
    let usernamehash = users.hash(username.toLowerCase());
    let res;
    try {
        res = await usersDB.find(`usernamehash = '${usernamehash}'`);
    }
    catch (err) {
        throw err;
    }
    if (res && res.rows && res.rows.length === 1) {
        return res.rows[0];
    }
    return null;
};
users.list = async function users_list() {
    let res;
    try {
        res = await usersDB.list();
    }
    catch (err) {
        log.error(err);
    }
    return res.rows;
};
users.validateInfo = function users_validateInfo(username, email, pwstring, pwstring2) {
    if (users.prohibit.indexOf(username) !== -1) {
        return 'Username unavailable.';
    }
    if (!iz.maxLength(username, 256)) {
        return 'Username too long.';
    }
    if (!iz.email(email)) {
        return 'Email is invalid.';
    }
    if (pwstring !== pwstring2) {
        return 'Passwords do not match.';
    }
    if (!iz.minLength(pwstring, 8)) {
        return 'Passwords is too short. Minimum length is 8 characters.';
    }
    return null;
};
module.exports = async (pool) => {
    usersDB = new DB('users', pool);
    await usersDB.connect();
    return users;
};
//# sourceMappingURL=index.js.map
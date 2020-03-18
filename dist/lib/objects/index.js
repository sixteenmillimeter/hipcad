'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const DB = require('db');
const log = require('log')('objects');
let objectsDB;
const objects = {};
objects.hash = function objects_hash(str) {
    //
    return crypto_1.createHash('sha256').update(str).digest('base64');
};
/**
 * Check whether object exists, using username and object id
 */
objects.exists = async function objects_exists(username, object) {
    const pathStr = `${username.toLowerCase()}/${object.toLowerCase()}`;
    const pathHash = objects.hash(pathStr);
    let exists = false;
    let res;
    try {
        res = await objectsDB.find(`pathhash = '${pathHash}' AND deleted = 0`);
    }
    catch (err) {
        log.error(err);
    }
    if (res && res.rows && res.rows.length === 1) {
        exists = true;
    }
    return exists;
};
objects.create = async function objects_create(user, object, source) {
    const pathStr = `${user.username.toLowerCase()}/${object.toLowerCase()}`;
    const pathHash = objects.hash(pathStr);
    const doc = {
        id: uuid_1.v4(),
        username: user.username,
        userid: user.id,
        path: pathStr,
        pathhash: pathHash,
        created: new Date().getTime(),
        updated: new Date().getTime(),
        src: source,
        includes: JSON.stringify(objects.includes.parse(source)),
        rendered: 0
    };
    try {
        await objectsDB.insert(doc);
    }
    catch (err) {
        log.error(err);
        throw err;
    }
    return doc;
};
objects.index = async function objects_index(user) {
    let res;
    let rows = [];
    try {
        res = await objectsDB.find(`userid = '${user.id}' AND deleted = 0`);
    }
    catch (err) {
        log.error(err);
    }
    if (res && res.rows) {
        rows = res.rows;
    }
    return rows;
};
objects.update = async function objects_update(user, object, source) {
    const pathStr = `${user.username.toLowerCase()}/${object.toLowerCase()}`;
    const pathHash = objects.hash(pathStr);
    const update = {
        updated: new Date().getTime(),
        src: source,
        includes: JSON.stringify(objects.includes.parse(source)),
        rendered: 0
    };
    try {
        await objectsDB.update(`pathhash = '${pathHash}`, update);
    }
    catch (err) {
        log.error(err);
        throw err;
    }
    log.info('Updated object ' + user.username + '/' + object);
    return update;
};
/**
 * Retrieve an object, using username and object id
 */
objects.get = async function objects_get(username, object) {
    const pathStr = `${username.toLowerCase()}/${object.toLowerCase()}`;
    const pathHash = objects.hash(pathStr);
    let exists = false;
    let res;
    try {
        res = await objectsDB.find(`pathhash = '${pathHash}' AND deleted = 0`);
    }
    catch (err) {
        log.error(err);
    }
    if (res && res.rows && res.rows.length === 1) {
        return res.rows[0];
    }
    return null;
};
objects.destroy = async function objects_destroy(username, object) {
    const pathStr = `${username.toLowerCase()}/${object.toLowerCase()}`;
    const pathHash = objects.hash(pathStr);
    let success = false;
    try {
        await objects.update(`pathhash = '${pathHash}'`, { deleted: 1 });
        success = true;
    }
    catch (err) {
        log.error(err);
    }
    return success;
};
objects.includes = {};
objects.includes.process = async function objects_includes_process(source, includes) {
    const paths = includes.map(function (obj) {
        return objects.includes.toPath(obj);
    });
    let count = 0;
    let parts;
    let object;
    for (let path of paths) {
        parts = path.split('/');
        try {
            object = await objectsDB.get(parts[0], parts[1]);
        }
        catch (err) {
            log.error(err);
        }
        if (object && object.src) {
            source = source.replace(includes[count], '//' + includes[count] + '\n' + object.src + '\n');
        }
        count++;
    }
    return source;
};
objects.includes.parse = function objects_includes_parse(source) {
    const lines = source.split('\n');
    const reInclude = /(include <)+(.*)+(>;)/g;
    const inc = lines.filter(function (elem) {
        if (elem.indexOf('include') !== -1
            && elem.indexOf('<') !== -1
            && elem.indexOf('>') !== -1
            && elem.indexOf(';') !== -1) {
            if (elem.split('<')[1].indexOf('/') !== -1) {
                return elem;
            }
        }
    });
    return inc;
};
objects.includes.toPath = function objects_includes_toPath(str) {
    const re1 = /(include)/g;
    const re2 = /(include )/g;
    const re3 = /([<>;])/g;
    let slashes;
    let output = str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
    if (output[0] === '/') {
        output = output.substring(1);
    }
    if (output[output.length - 1] === '/') {
        output = output.slice(0, -1);
    }
    slashes = (output.match(new RegExp('/', 'g')) || []).length;
    if (slashes) {
    }
    return output.trim();
};
module.exports = async (pool) => {
    objectsDB = new DB('objects', pool);
    await objectsDB.connect();
    return objects;
};
//# sourceMappingURL=index.js.map
//db.js
'use strict';

const db = {};
let nano;
let log;
let config;
let dev = false;

/*-----------------------------------------------------------------------------
 * db.start
 * Assigns DB with fallback to create if doesn't exist
 *---------------------------------------------------------------------------*/
db.start = function (dbname, callback) {
    var dbStr = db.PREFIX + dbname;
    nano.db.create(dbStr, function (err, data) {
        if (err && err.statusCode === 412) {
            log.info('DB "' + dbname + '"\t@ /' + dbStr + '\talready exists');
        } else if (!err) {
            log.info('DB "' + dbname + '"\t@ /' + dbStr + '\tcreated');
        } else if (err) {
            log.warn('Error creating ' + dbStr, err);
        }
        db[dbname] = nano.db.use(dbStr);
        db[dbname].compact();
        if (callback) callback();
    });
};
/*-----------------------------------------------------------------------------
 * db.wipe 
 * Destroys, creates and re-assigns a DB
 *---------------------------------------------------------------------------*/
db.wipe = function (dbname) {
    var dbStr = db.PREFIX + dbname;
    nano.db.destroy(dbStr, function (err, data) {
        if (err) return log.error('Error destroying ' + dbStr, err);
        log.info('DB "' + dbname + '"\t@ /' + dbStr + '\terased');
        db.start(dbname);
    });
};

/*-----------------------------------------------------------------------------
 * db.destroyDoc
 * hand over db and document for destruction
 *---------------------------------------------------------------------------*/
db.destroyDoc = function (DB, docname, callback) {
    DB.get(docname, function (err, body) {
        if (err) {
            log.error(err);
            return callback(false, err);
        }
        DB.destroy(docname, body._rev, function (e, b) {
            if (e) {
                log.error(e);
                return callback(false, e);
            }
            callback(true);
        });
    });
};

db.addView = function (DB, docPath, viewName, mapFunction, callback) {
    DB.get('_design/' + docPath, function (err, body) {
        if (err && err.statusCode === 404) {
            var doc = {
                    views : {}
            };
            doc.views[viewName] =  {
                map : mapFunction
            };
            return DB.insert(doc, '_design/' + docPath, function (err, res) {
                if (err) { return log.error(err); }
                log.info( 'Added view ' + viewName + ' to _design/' + docPath);
                callback(true);
            });
        } else if (err) {
            log.error('Error adding view', err);
            return callback(false);
        }
        if (body !== undefined) {
            body.views[viewName] = {
                map : mapFunction
            };
            return DB.insert({ views : body.views, _rev : body._rev }, '_design/' + docPath, function (err, res) {
                if (err) { return log.error(err); }
                log.info('Appended view ' + viewName + ' to _design/' + docPath);
                callback(true);
            });
        } else {
            return callback(false);
        }
    });
    /*
    var mapFunction = function (doc) {
        if (doc.type === 'special') {
             emit(doc.time, doc.data);
        }
    };
    */
};
//
/*
DB.view(viewKey, 'entries', function (err, b) {
        if (err) {
                if (err.status_code !== 404){
                        return console.log(err);
                }
        }
});
*/
db.getRev = function (dbname, docname, rev, callback) {
    var dbStr = db.PREFIX + dbname,
        query = { 
            db: dbStr,
            doc: docname,
            method: 'get',
            params: { rev: rev }
        };
    nano.request(query, callback);
};

module.exports = function (cfg) {
    config = cfg;
    nano = require('nano')(config.couch_db);
    log = require('./logger.js')(config, 'db');
    if (process.argv.indexOf('-d') !== -1 ||
        process.argv.indexOf('--dev') !== -1) {
        dev = true;
    }
    db.PREFIX = config.db_prefix;
    db.POSTFIX = '_dev'; //temp disabled
    return db;
};
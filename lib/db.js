var db = {},
	nano = require('nano')('http://localhost:5984'),
    logger = require('./logger.js')('/var/log/hipcad/db.log');

db.PREFIX = 'hipcad_';
/*-----------------------------------------------------------------------------
 * db.start
 * Assigns DB with fallback to create if doesn't exist
 *---------------------------------------------------------------------------*/
db.start = function (dbname, callback) {
    'use strict';
    var dbStr = db.PREFIX + dbname;
    nano.db.create(dbStr, function (err, data) {
        if (err && err.status_code === 412) {
            logger.info('DB "' + dbname + '"\t@ /' + dbStr + '\talready exists');
        } else if (!err) {
            logger.info('DB "' + dbname + '"\t@ /' + dbStr + '\tcreated');
        }
        db[dbname] = nano.db.use(dbStr);
        if (callback) callback();
    });
};
/*-----------------------------------------------------------------------------
 * db.wipe 
 * Destroys, creates and re-assigns a DB
 *---------------------------------------------------------------------------*/
db.wipe = function (dbname) {
	'use strict';
	var dbStr = db.PREFIX + dbname;
    nano.db.destroy(dbStr, function (err, data) {
    	if (err) console.log(err);
    	logger.info('DB "' + dbname + '"\t@ /' + dbStr + '\terased');
    	db.start(dbname);
    });
};

/*-----------------------------------------------------------------------------
 * db.destroyDoc
 * hand over db and document for destruction
 *---------------------------------------------------------------------------*/
db.destroyDoc = function (DB, docname, callback) {
    'use strict';
    DB.get(docname, function (err, body) {
        if (err) {
            logger.warn(err);
            return callback(false, err);
        }
        DB.destroy(docname, body._rev, function (e, b) {
            if (e) {
                logger.warn(err);
                return callback(false, err);
            }
            logger.info('Destroyed doc ' + docname);
            callback(true);
        });
    });
};

module.exports = db;
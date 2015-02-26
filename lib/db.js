var db = {},
	nano = require('nano')('http://localhost:5984');

db.PREFIX = 'hipcad_';
/*-----------------------------------------------------------------------------
 * db.start
 * Assigns DB with fallback to create if doesn't exist
 *---------------------------------------------------------------------------*/
db.start = function (dbname, callback) {
    var dbStr = db.PREFIX + dbname;
    nano.db.create(dbStr, function (err, data) {
        if (err && err.status_code === 412) {
            console.log('DB "' + dbname + '"\t@ /' + dbStr + '\talready exists');
        } else if (!err) {
            console.log('DB "' + dbname + '"\t@ /' + dbStr + '\tcreated');
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
    	console.log('DB "' + dbname + '"\t@ /' + dbStr + '\terased');
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
            console.log(err);
            return callback(false, err);
        }
        DB.destroy(docname, body._rev, function (e, b) {
            if (e) {
                console.log(err);
                return callback(false, err);
            }
            callback(true);
        });
    });
}

module.exports = db;
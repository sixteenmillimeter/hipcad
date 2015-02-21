var db = {},
	nano = require('nano')('http://localhost:5984');

db.PREFIX = 'ls3d_';
/*-----------------------------------------------------------------------------
 * W.start()
 * Assigns DB with fallback to create if non-existant
 * Contains a switch for dev/prod DB
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
 * W.wipe();
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

module.exports = db;
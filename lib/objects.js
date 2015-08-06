var objects = {},
	uuid = require('node-uuid');
	DB = require('./db.js'),
	logger = require('./logger.js')('/var/log/hipcad/objects.log');

DB.start('objects', function () {});
DB.start('indexes', function () {});

objects.exists = function (username, object, callback) {
	DB.objects.head( username + '/' + object, function( err, body, header ) {
        if (err && err['status-code'] == 404) {
            return callback(false);
        } else if ( header && header[ 'status-code' ] == 200) { 
            return callback(true);
        }
        callback(undefined);
    });
};
objects.create = function (username, object, source, callback) {
	var objobj = {
		path : username + '/' + object,
		id : uuid.v4(),
		created : +new Date(),
		updated : +new Date(),
		src : source
	},
	objindex = {
		path : objobj.path,
		id : objobj.id
	}
	DB.objects.insert({object : objobj}, objobj.path, function (err, body) {
		if (err) return logger.warn(err);
		
		DB.indexes.get(username, function (e, b) {
			if (e) {
				logger.warn(e);
				return callback(false, e);
			}
			b.objects.push(objindex);
			DB.indexes.insert({objects: b.objects, "_rev" : b._rev}, username, function (ee, bb) {
				if (ee) {
					logger.warn(ee);
					return callback(false, ee);
				}
				callback(body.objects);
			});
		});
	});
};
objects.index = function (username, callback) {
	DB.indexes.get(username, function (err, body) {
		if (err) {
			if (err['status-code'] !== 404) {
				logger.warn(err);
			}
			return callback(false);
		}
		callback(body.objects);
	});
};
objects.update = function (username, object, source, callback) {
	DB.objects.get(username + '/' + object, function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(false, err);
		}
		body.object.src = source;
		body.object.updated = +new Date();
		DB.objects.insert({object: body.object, "_rev" : body._rev}, username + '/' + object, function (e, b) {
			if (e) {
				logger.warn(e);
				return callback(false, e);
			}
			callback(b.object);
		});
	});
};
objects.get = function (username, object, callback) {
	DB.objects.get(username + '/' + object, function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(false, err);
		}
		callback(body.object);
	});
};

objects.tests = function () {
	//console.time('objects.tests');
	//objects.index('matt', function (data) {
		//console.timeEnd('objects.tests');
	//})
	//objects.create('matt', 'testobj22', 'This is bulshit source', function () {});
};

module.exports = objects;
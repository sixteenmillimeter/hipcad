var objects = {},
	uuid = require('node-uuid'),
	DB,
	logger;

objects.exists = function (username, object, callback) {
	'use strict';
	DB.objects.head( username + '/' + object, function( err, body, header ) {
        if (err && err.statusCode === 404) {
            return callback(false);
        } else if ( header && header.statusCode === 404) { 
            return callback(true);
        }
        callback(undefined);
    });
};
objects.create = function (username, object, source, callback) {
	'use strict';
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
	'use strict';
	DB.indexes.get(username, function (err, body) {
		if (err) {
			if (err.statusCode === 404) {
				//do nothing
			} else {
				logger.warn(err);
			}
			return callback(false);
		}
		callback(body.objects);
	});
};
objects.update = function (username, object, source, callback) {
	'use strict';
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
	'use strict';
	DB.objects.get(username + '/' + object, function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(false, err);
		}
		callback(body.object);
	});
};
objects.delete = function (username, object, callback) {
	'use strict';
	DB.destroyDoc(DB.objects, username + '/' + object, function (success, err) {
		if (!success && err) {
			logger.warn(err);
			return callback(false, err);
		}
		logger.info('Deleted ' + username + '/' + object);
		callback(true);
	});
};
module.exports = function (cfg) {
	'use strict';
	DB = require('./db.js')(cfg);
	logger = require('./logger.js')(cfg, 'objects');

	DB.start('objects', function () {});
	DB.start('indexes', function () {});
	return objects;
}
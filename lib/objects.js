var objects = {},
	diff = require('diff'),
	uuid = require('node-uuid'),
	DB,
	logger;

objects.exists = function (username, object, callback) {
	'use strict';
	DB.objects.head(username + '/' + object, function( err, body, header ) {
        if ((err && err.statusCode === 404) || (header && header.statusCode === 404)) {
            return callback(false);
        } else if (header && header.statusCode === 200) {
            return callback(true);
        }
        callback(undefined);
    });
};
objects.create = function (username, object, source, callback) {
	'use strict';
	var doc = {
		path : username + '/' + object,
		id : uuid.v4(),
		created : +new Date(),
		updated : +new Date(),
		src : source,
		includes : objects.includes.parse(source),
		rendered : false
	},
	objindex = {
		path : doc.path,
		id : doc.id
	},
	objectsInsertCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		DB.indexes.get(username, indexesGetCb);
	},
	indexesGetCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		body.objects.push(objindex);
		DB.indexes.insert({objects: body.objects, "_rev" : body._rev}, username, indexesInsertCb);
	},
	indexesInsertCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		logger.info('Created object ' + username + '/' + object);
		callback(null, doc);
	};
	DB.objects.insert({object : doc}, doc.path, objectsInsertCb);
};
objects.index = function (username, callback) {
	'use strict';
	DB.indexes.get(username, function (err, body) {
		if (err) {
			if (err.statusCode === 404) {
				//do nothing
				callback(err);
			}
			logger.warn(err);
			return callback(err);
		}
		callback(null, body.objects);
	});
};
objects.update = function (username, object, source, callback) {
	'use strict';
	var objectsGetCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}

		//TODO: diff code
		//apply diff to src, validate

		body.object.src = source;
		body.object.includes = objects.includes.parse(source);
		body.object.updated = +new Date();
		body.object.rendered = false;
		DB.objects.insert({object: body.object, "_rev" : body._rev}, username + '/' + object, objectsInsertCb);
	},
	objectsInsertCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		logger.info('Updated object ' + username + '/' + object);
		callback(null, body.object);
	};
	DB.objects.get(username + '/' + object, objectsGetCb);
};
objects.get = function (username, object, callback) {
	'use strict';
	DB.objects.get(username + '/' + object, function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		callback(null, body.object);
	});
};
objects.destroy = function (username, object, callback) {
	'use strict';
	var objId = username + '/' + object,
	destroyDocCb = function (destroyed) {
		if (!destroyed && err) {
			logger.warn(err);
			return callback(err);
		} else if (destroyed) {
			DB.indexes.get(username, getIndexCb);
		}
	},
	getIndexCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		body.objects = body.objects.filter(function (obj) {
			if (obj.path !== objId) {
				return obj;
			}
		});
		DB.indexes.insert({objects: body.objects, "_rev" : body._rev}, username, updateIndexCb);
	},
	updateIndexCb = function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		logger.info('Deleted ' + username + '/' + object);
		callback(null, {success: true, id: objId});
	};
	DB.destroyDoc(DB.objects, username + '/' + object, destroyDocCb);
};
objects.includes = {};
objects.includes.process = function (source, includes, callback) {
	'use strict';
	var paths = includes.map(function (elem) {
			return objects.includes.toPath(elem);
		}),
		count = -1,
		next = function () {
			count++;
			if (count === paths.length) {
				callback(source);
			} else {
				if (paths[count] !== undefined) {
					DB.objects.get(paths[count], function (err, doc) {
						if (err) {
							log.error(err);
						}
						if (doc.object) {
							source = source.replace(includes[count], '//' + includes[count] + '\n' + doc.object.src + '\n');
						}
						next();
					});
				} else {
					next();
				}
			}
		};
	next();
};
objects.includes.parse = function (source) {
	'use strict';
	var lines = source.split('\n'),
		reInclude = /(include <)+(.*)+(>;)/g,
		inc = lines.filter(function (elem) {
			if (elem.indexOf('include') !== -1
			&& elem.indexOf('<') !== -1
			&& elem.indexOf('>') !== -1
			&& elem.indexOf(';') !== -1) {
				if (elem.split('<')[1].indexOf('/') !== -1){
					return elem;
				}
			}
		});
	return inc;
};

objects.includes.toPath = function (str) {
	'use strict';
	var re1 = /(include)/g,
		re2 = /(include )/g,
		re3 = /([<>;])/g,
		slashes;
	str = str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
	if (str[0] === '/') {
		str = str.substring(1);
	}
	if (str[str.length - 1] === '/') {
		str = str.slice(0, -1);
	}
	slashes = (str.match(new RegExp('/', 'g')) || []).length;
	if (slashes) {

	}
	return str.trim();
};

module.exports = function (cfg) {
	'use strict';
	DB = require('./db.js')(cfg);
	logger = require('./logger.js')(cfg, 'objects');

	DB.start('objects', function () {});
	DB.start('indexes', function () {});
	return objects;
};
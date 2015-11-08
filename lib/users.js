var users = {},
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	iz = require('iz'),
	DB,
	logger;

users.exists = function (username, callback) {
	'use strict';
    DB.users.head(username, function( err, body, header ) {
        if (err && (err['status-code'] === 404 || err.statusCode === 404)) {
            return callback(false);
        } else if ( header && (header['status-code'] === 200 || header.statusCode === 200)) { 
            return callback(true);
        }
        callback(undefined);
    });
};

users.prohibit = ['static', 'user', 'object', 'hipcad'];

//if availa
users.available = function (username, email, pwstring, callback) {
	'use strict';
	if (users.prohibit.indexOf(username) !== -1) {
		return callback(false);
	}
	users.exists(username, function (exists) {
		if (exists) {
			return callback(false);
		} else {
			//more levels
			if (iz.email(email)
				&& iz.minLength(pwstring, 8)
				&& iz.maxLength(pwstring, 144)) {
				return callback(true);
			} else {
				return callback(false);
			}
			
		}
	});
};

users.create = function (username, email, pwstring, callback) {
	'use strict';
	var userobj = {
		username : username,
		id : uuid.v4(),
		email : email,
		joined : +new Date(),
		paid : {
			status : false,
			paid : null,
			transaction : null,
		}
	},
	pwobj = {
		salt : null,
		hash : null
	};
	DB.users.insert(userobj, username, function (err, body) {
		if (err) {
			callback(err);
			return logger.warn(err);
		}
		users.hash(pwstring, false, function (hash, salt) {
			pwobj.salt = salt;
			pwobj.hash = hash;
			DB.pw.insert(pwobj, username, function (e, b) {
				if (e) {
					callback(e);
					return logger.warn(e);
				}
				DB.indexes.insert({objects:[]}, username, function (ee, bb) {
					if (ee) {
						callback(ee);
						return logger.warn(ee);
					}
					callback(userobj);
				})
			});
		});
	});
};

users.reset = function (username, email, pwstring, callback) {
	'use strict';
	DB.pw.get(username, function (err, body) {
		if (err) {
			logger.warn(err);
			return callback(err);
		}
		console.dir(body);
	});
};

users.login = function (username, pwstring, callback) {
	'use strict';
	DB.pw.get(username, function (err, body) {
	 	if (err) {
	 		if ((err['status-code'] === 404 || err.statusCode === 404) ) {
				//do nothing
	 		} else {
	 			logger.warn(err);
	 		}
	 		return callback(false, err);
	 	}
		users.hash(pwstring, body.salt, function (key, salt) {
			if (body.hash === key) {
				callback(true);
			} else {
				callback(false);
			}
		});
	});
};

users.hash = function (value, salt, callback) {
	'use strict';
	var key;
	if (salt === false) {
		salt = crypto.randomBytes(512).toString('base64') + '';
	}
	key = crypto.createHmac('sha512', salt).update(value).digest('base64');
	callback(key, salt);
};

users.salt = function () {
	'use strict';
	return Math.round((new Date().valueOf() * Math.random())) + '';
};

users.destroy = function () {};
users.list = function () {};

module.exports = function (cfg) {
	'use strict';
	DB = require('./db.js')(cfg);
	logger = require('./logger.js')(cfg, 'users');

	DB.start('users', function () {});
	DB.start('pw', function () {});
	DB.start('indexes', function () {});

	return users;
}

/*

user obj
{
	username
	id
}

pw obj
{
	hash : '',
	salt : ''
}

*/
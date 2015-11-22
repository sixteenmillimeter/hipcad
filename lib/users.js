var users = {},
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	iz = require('iz'),
	DB,
	logger;

//TODO: #1
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
			logger.warn(err);
			return callback(err);
		}
		users.hash(pwstring, false, function (hash, salt) {
			pwobj.salt = salt;
			pwobj.hash = hash;
			DB.pw.insert(pwobj, username, function (e, b) {
				if (e) {
					logger.warn(e);
					return callback(e);
				}
				DB.indexes.insert({objects:[]}, username, function (ee, bb) {
					if (ee) {
						logger.warn(ee);
						return callback(ee);
					}
					callback(null, userobj);
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

users.auth = function (username, pwstring, callback) {
	'use strict';
	DB.pw.get(username, function (err, body) {
	 	if (err) {
	 		if ((err['status-code'] === 404 || err.statusCode === 404) ) {
				//do nothing
	 		} else {
	 			logger.warn(err);
	 		}
	 		return callback(err);
	 	}
		users.hash(pwstring, body.salt, function (key, salt) {
			if (body.hash === key) {
				callback(null, true);
			} else {
				callback(null, false);
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

users.destroy = function (username, pwstring, callback) {
	'use strict';
	var checkUserExists = function (exists) {
		if (exists) {
			users.auth(username, pwstring, loginUser);
		} else {
			callback('Failed to find user');
		}
	},
	loginUser = function (err, login) {
		if (login) {
			DB.destroyDoc(DB.users, username, destroyUser);
		} else {
			callback('Failed logging in user');
		}
	}, 
	destroyUser = function (destroyed) {
		if (destroyed) {
			DB.destroyDoc(DB.pw, username, destroyPw);
		} else {
			callback('Failed destroying user document');
		}
	},
	destroyPw = function (dd) {
		if (dd) {
			DB.destroyDoc(DB.indexes, username, destroyIndex);
		} else {
			callback('Failed destroying user pw document');
		}
	},
	destroyIndex = function (ddd) {
		if (ddd) {
			return callback(null, true)
		} else {
			callback('Failed destroying user index document');
		}
	};
	users.exists(username, checkUserExists);
};
users.list = function (callback) {
	'use strict';
	DB.users.list(function (err, body) {
		if (err) {
			console.error(err);
			return callback(true, err);
		}
		console.dir(body)
		callback(false, body.rows);
	});
};

users.uniqueEmail = function () {

};

module.exports = function (cfg) {
	'use strict';
	DB = require('./db.js')(cfg);
	logger = require('./logger.js')(cfg, 'users');

	DB.start('users', function () {});
	DB.start('pw', function () {});
	DB.start('indexes', function () {});

	//DB.addView(DB.users, )
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
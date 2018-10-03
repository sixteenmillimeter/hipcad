'use strict';

const users = {};
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const uuid = require('uuid').v4;
const iz = require('iz');
let DB;
let logger = require('log')('users');

//TODO: #1
users.exists = function (username, callback) {
    DB.users.head(username, function( err, body, header ) {
        if (err && err.statusCode === 404) {
            return callback(false);
        } else if ( header && header.statusCode === 200) {
            return callback(true);
        }
        callback(undefined);
    });
};

users.prohibit = ['static', 'user', 'object', 'hipcad', 'twittercb'];

users.available = function (username, callback) {
	if (users.prohibit.indexOf(username) !== -1) {
		return callback(false);
	}
	users.exists(username, function (exists) {
		if (exists) {
			return callback(false);
		} else {
			return callback(true);
		}
	});
};

users.create = function (username, email, pwstring, callback) {
	var userobj = {
		username : username,
		id : uuid(),
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
	},
	usersInsertCb = function (err, body) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		users.hash(pwstring, false, usersHashCb);
	},
	usersHashCb = function (hash, salt) {
		pwobj.salt = salt;
		pwobj.hash = hash;
		DB.pw.insert(pwobj, username, pwInsertCb);
	},
	pwInsertCb = function (err, body) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		DB.indexes.insert({objects:[]}, username, indexesInsertCb);
	},
	indexesInsertCb = function (err, body) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		logger.info('users.create', userobj);
		callback(null, userobj);
	};
	DB.users.insert(userobj, username, usersInsertCb);
};

users.reset = function (username, email, pwstring, callback) {
	DB.pw.get(username, function (err, body) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		console.dir(body);
	});
};

users.auth = function (username, pwstring, callback) {
	DB.pw.get(username, function (err, body) {
	 	if (err) {
	 		if (err.statusCode === 404) {
				//do nothing
	 		} else {
	 			logger.error(err);
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
	var key;
	if (salt === false) {
		salt = crypto.randomBytes(512).toString('base64') + '';
	}
	key = crypto.createHmac('sha512', salt).update(value).digest('base64');
	callback(key, salt);
};

users.salt = function () {
	return Math.round((new Date().valueOf() * Math.random())) + '';
};

users.destroy = function (username, pwstring, callback) {
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
			logger.error(err);
			callback('Failed logging in user');
		}
	},
	destroyUser = function (destroyed, err) {
		if (destroyed) {
			DB.destroyDoc(DB.pw, username, destroyPw);
		} else {
			logger.error(err);
			callback('Failed destroying user document');
		}
	},
	destroyPw = function (destroyed, err) {
		if (destroyed) {
			DB.destroyDoc(DB.indexes, username, destroyIndex);
		} else {
			logger.error(err);
			callback('Failed destroying user pw document');
		}
	},
	destroyIndex = function (destroyed, err) {
		if (destroyed) {
			return callback(null, true)
		} else {
			logger.error(err);
			callback('Failed destroying user index document');
		}
	};
	users.exists(username, checkUserExists);
};
users.get = function (username, callback) {
	DB.users.get(username, function (err, doc) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		return callback(null, doc);
	});
};
users.list = function (callback) {
	DB.users.list(function (err, body) {
		if (err) {
			console.error(err);
			return callback(true, err);
		}
		console.dir(body)
		callback(false, body.rows);
	});
};

users.uniqueEmail = function (email, callback) {
	var found = [];
	DB.users.view('users', 'emails',  function (err, data) {
        if (err) {
                if (err.statusCode !== 404){
                    logger.error(err);
                    return callback(err, false);
                }
        }
        found = data.rows.filter(function (elem) {
        	if (elem.key === email) {
        		return elem;
        	}
        });
        if (found.length === 0) {
        	return callback(null, true);
        } else if (found.length > 0) {
        	return callback(null, false);
        }
	});

};
users.uniqueEmailView = function () {
	var mapFunction = function (doc) {
		emit(doc.email);
	};
	DB.addView(DB.users, 'users', 'emails', mapFunction, function (added) {
		if (added) {
			logger.info('Added uniqueEmailView to users DB');
		}
	});
};

users.validateInfo = function (username, email, pwstring, pwstring2, callback) {
	if (users.prohibit.indexOf(username) !== -1) {
		return callback({item: 'username', msg: 'Username unavailable.'}, false);
	}
	if (!iz.maxLength(username, 256)) {
		return callback({item: 'username', msg: 'Username too long.'}, false);
	}
	if (!iz.email(email)) {
		return callback({item: 'email', msg: 'Email is invalid.'}, false)
	}
	if (pwstring !== pwstring2) {
		return callback({item: 'pwstring', msg: 'Passwords do not match.'}, false);
	}
	if (!iz.minLength(pwstring, 8)) {
		return callback({item: 'pwstring', msg: 'Passwords is too short.'}, false);
	}
	if (!iz.maxLength(pwstring, 256)) {
		return callback({item: 'pwstring', msg: 'Passwords is too long.'}, false);
	}
	users.available(username, function (available) {
		if (available) {
			return callback(null, true);
		} else {
			return callback({item: 'username', msg: 'Username unavailable.'}, false);
		}
	});
};

module.exports = function (cfg) {
	DB = require('./db.js')(cfg);

	DB.start('users', function () {
		users.uniqueEmailView();
	});
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

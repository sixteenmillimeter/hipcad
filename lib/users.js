var users = {},
	crypto = require('crypto'),
	uuid = require('node-uuid');
	DB = require('./db.js');

DB.wipe('users', function () {});
DB.wipe('pw', function () {});

users.exists = function (username, callback) {
    DB.users.head( username, function( err, body, header ) {
        if (err && err['status-code'] == 404) {
            return callback(false);
        } else if ( header && header[ 'status-code' ] == 200) { 
            return callback(true);
        }
        callback(undefined);
    });
};

users.validate = function () {};

users.create = function (username, email, pwstring, callback) {
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
			return console.log(err);
		}
		users.hash(pwstring, false, function (hash, salt) {
			pwobj.salt = salt;
			pwobj.hash = hash;
			DB.pw.insert(pwobj, username, function (e, b) {
				if (e) {
					return console.log(e);
				}
				callback(userobj);
			});
		});
	});
};

users.reset = function (username, email, pwstring, callback) {
	DB.pw.get(username, function (err, body) {
		if (err) return console.log(err);
		console.dir(body);
	});
};

users.login = function (username, pwstring, callback) {
	 DB.pw.get(username, function (err, body) {
		if (err) return console.log(err);
		users.hash(pwstring, body.salt, function (obj) {
			if (body.hash === obj.hash) {
				callback(true);
			} else {
				callback(false);
			}
		});
	});
};

users.hash = function (value, salt, callback) {
	if (salt === false) {
		salt = crypto.randomBytes(128).toString('base64')
	}
	crypto.pbkdf2(value, salt, 10000, 512, function(err, dk) { 
		key = Buffer(dk, 'binary').toString('hex');
		callback(key, salt);
	});
};

users.salt = function () {
	return Math.round((new Date().valueOf() * Math.random())) + '';
};

users.destroy = function () {};
users.list = function () {};



users.test = function () {
	console.time('users.test');
	users.exists('matt', function (exists) {
		console.log(exists);
	});
	users.create('matt', 'mmcwilliams@aspectart.org', 'test', function (obj) {
		console.dir(obj);
		users.exists('matt', function (exists) {
			console.log(exists);
			users.login('matt', 'test', function (success) {
				if (success) {
					console.log('logged in!');
					console.timeEnd('users.test');
				}
			});
		});
	});
};

module.exports = users;

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
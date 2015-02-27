var users = {},
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	iz = require('iz'),
	DB = require('./db.js');

DB.start('users', function () {});
DB.start('pw', function () {});
DB.start('indexes', function () {});
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

users.prohibit = ['static', 'user', 'object'];

users.validate = function (username, email, pwstring, callback) {
	if (uesrs.prohibit.indexOf(username) !== -1) {
		return callback(false);
	}
	users.exists(username, function (exists) {
		if (exists) {
			return callback(false);
		} else {
			//more levels

			return callback(true);
		}
	});
};

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
			callback(err);
			return console.log(err);
		}
		users.hash(pwstring, false, function (hash, salt) {
			pwobj.salt = salt;
			pwobj.hash = hash;
			DB.pw.insert(pwobj, username, function (e, b) {
				if (e) {
					callback(e);
					return console.log(e);
				}
				DB.indexes.insert({objects:[]}, username, function (ee, bb) {
					if (ee) {
						callback(ee);
						return console.log(ee);
					}
					callback(userobj);
				})
			});
		});
	});
};

users.reset = function (username, email, pwstring, callback) {
	DB.pw.get(username, function (err, body) {
		if (err) {
			callback(err);
			return console.log(err);
		}
		console.dir(body);
	});
};

users.login = function (username, pwstring, callback) {
	DB.pw.get(username, function (err, body) {
	 	if (err) {
	 		if (err['status-code'] !== 404) {
				console.log(err);
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

users.destroy = function () {};
users.list = function () {};

users.test = function () {
	console.time('users.test');
	//users.create('matt', 'mmcwilliams@aspectart.org', 'test', function (obj) {
		//console.dir(obj);
		//users.exists('matt', function (exists) {
			//console.log(exists);
			//users.login('matt', 'test', function (success) {
				//if (success) {
					//console.log('logged in!');
				//} else {
					//console.log('login failed');
				//}
				console.timeEnd('users.test');
			//});
		//});
	//});
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
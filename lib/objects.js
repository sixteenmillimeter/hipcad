var objects = {},
	uuid = require('node-uuid');
	DB = require('./db.js');

objects.temp = {
	'/matt/first-object' : {
		src : 'cube();\rcylinder(r=1, h=1, center=true);'
	}, 
	'/matt/second-object' : {
		src : 'module cylinder  () { \ncylinder(r=3, h=3, center=true); \n}'
	}
};

DB.wipe('objects', function () {});
DB.wipe('indexes', function () {});
objects.exists = function (username, object, callback) {
	DB.objects.head( username '/' + object, function( err, body, header ) {
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
	};
	DB.objects.insert(objobj, objobj.path, function (err, body) {
		if (err) return console.log(err);
		callback(body)
	});
};
objects.update = function () {};
objects.get = function (username, object, callback) {
	DB.objects.get(username + '/' + object, function (err, body) {});
	callback(objects.temp['/' + username + '/' + object]);
};

module.exports = objects;
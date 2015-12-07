var config = require('../lib/cfg.js'),
	objects = require('../lib/objects.js')(config),
	users = require('../lib/users.js')(config);

setTimeout(function () {
	var testUser = 'mmcwilliams',
		testUserPw = 'jinjin89!!',
		testUserEmail = 'mmcwilliams@aspectart.org',
		testObj = 'demo',
		testObjText = 'cube([5, 5, 15], center = true); \ntranslate([0, 10, 0]) cube([5, 5, 15], center = true);\ntranslate([0, 5, 0]) cube([5, 10, 5], center = true);\ntranslate([0, 20, 0]) cube([5, 5, 15], center = true);';
	console.time('all tests');
	var usersExistsCb = function (exists) {
		if (exists) {
			objects.exists(testUser, testObj, objectsExistsCb);
		} else {
			//(username, email, pwstring, callback
			users.create(testUser, testUserEmail, testUserPw, usersCreateCb);
		}
	},
	usersCreateCb = function (err, data) {
		if (err) {
			console.error(err);
		}
		objects.exists(testUser, testObj, objectsExistsCb);
	},
	objectsExistsCb = function (exists) {
		if (exists) {
			//
		} else {
			objects.create(testUser, testObj, testObjText, objectsCreateCb);
		}
	},
	objectsCreateCb = function (err, obj) {
		if (err) {
			console.error(err);
		}
		console.timeEnd('all tests');
	};
	users.exists(testUser, usersExistsCb);

}, 500);
var config = require('../lib/cfg.js'),
	objects = require('../lib/objects.js')(config),
	users = require('../lib/users.js')(config);

setTimeout(function () {
	var testUser = 'testUserString',
		testUserPw = 'testUserPWString',
		testUserEmail = 'email@website.org',
		testObj = 'testObjectName',
		testObjText = 'cube([100, 100, 100], center = true);';
	console.time('all tests');
	var usersExistsCb = function (exists) {
		if (exists) {

		} else {

		}
	},
	usersCreateCb = function () {},
	objectsExistsCb = function (exists) {
		if (exists) {

		} else {

		}
	},
	objectsCreateCb = function (err, obj) {
		if (err) {
			console.error(err);
		}

	},
	objectsUpdap
	users.exists(testUser, usersExistsCb);

}, 500);
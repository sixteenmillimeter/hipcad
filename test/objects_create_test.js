var objects = require('../lib/objects.js')(),
	users = require('../lib/users.js')();

setTimeout(function () {
	var testUser = 'testUserString',
		testUserPw = 'testUserPWString',
		testUserEmail = 'email@website.org',
		testObj = 'testObjectName',
		testObjText = 'cube([10, 10, 10], center = true);';
		testObj2 = 'testObjectName2',
		testObjText2 = 'translate([20, 0, 0]) cube([10, 10, 10], center = true);';
		testObj3 = 'testObjectName3',
		testObjText3 = 'translate([40, 0, 0]) cube([10, 10, 10], center = true);';
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
		objects.create(testUser, testObj2, testObjText2, objectsCreateCb2);
	},
	objectsCreateCb2 = function (err, obj) {
		if (err) {
			console.error(err);
		}
		objects.create(testUser, testObj3, testObjText3, objectsCreateCb3);
	};
	objectsCreateCb3 = function (err, obj) {
		if (err) {
			console.error(err);
		}
		console.timeEnd('all tests');
	};
	users.exists(testUser, usersExistsCb);

}, 500);
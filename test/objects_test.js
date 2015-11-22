var config = require('../lib/cfg.js'),
	objects = require('../lib/objects.js')(config),
	users = require('../lib/users.js')(config);

setTimeout(function () {
	var user = 'objTestUser',
		email = 'mmcwilliams+object@aspectart.org',
		pw = 'objTestUserPw1239!###',
		testObj = 'testObj',
		testSource= 'cube([100, 20, 20]);';
	/*users.auth(user, pw, function (err, auth) {
		if (err) {
			console.error('users.auth test failed');
			console.trace();
		} else {
			if (auth) {
				console.log('users.auth test passed!');
			} else {
			console.error('users.auth test failed');
			console.trace();
			}
		}
		object.
	});*/
	var objectsExistsCb = function (exists) {
		if (exists) {
			console.error('objects.exists test failed');
			console.trace();
		} else {
			console.log('objects.exists test passed!');
		}
		objects.create(username, object, source, objectsCreateCb);
	},
	objectsCreateCb = function (err, obj) {
		if (err) {
			console.error('objects.create test failed');
			console.trace();
		} else {

		}
	};
	objects.exists(user, testObj, objectsExistsCb);
	
}, 500);
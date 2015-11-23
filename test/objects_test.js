var config = require('../lib/cfg.js'),
	objects = require('../lib/objects.js')(config),
	users = require('../lib/users.js')(config);

setTimeout(function () {
	console.time('all tests');
	var user = 'objTestUser',
		email = 'mmcwilliams+object@aspectart.org',
		pw = 'objTestUserPw1239!###',
		testObj = 'testObj',
		testSource= 'cube([100, 20, 20]);',
		updateStr = testSource + '\n' + testSource;
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
		//
	});*/
	var objectsExistsCb = function (exists) {
		if (exists) {
			console.error('objects.exists test failed');
			console.trace();
		} else {
			console.log('objects.exists test passed!');
		}
		objects.create(user, testObj, testSource, objectsCreateCb);
	},
	objectsCreateCb = function (err, obj) {
		if (err) {
			console.error('objects.create test failed');
			console.trace();
		} else {
			console.log('objects.create test passed!');
		}
		objects.index(user, objectsIndexCb);
	},
	objectsIndexCb = function (err, index) {
		if (err) {
			console.error('objects.index test failed');
			console.trace();
		} else {
			console.error('objects.index test passed!');
		}
		objects.update(user, testObj, updateStr, objectsUpdateCb);
	},
	objectsUpdateCb = function (err, obj) {
		if (err) {
			console.error('objects.update test failed');
			console.trace();
		} else {
			console.error('objects.update test passed!');
		}
		objects.get(user, testObj, objectsGetCb);
	},
	objectsGetCb = function (err, obj) {
		if (err) {
			console.error('objects.get test failed');
			console.trace();
		} else {
			console.error('objects.get test passed!');
		}
		objects.destroy(user, testObj, objectsDestroyCb);
	},
	objectsDestroyCb = function (err, obj) {
		if (err) {
			console.error('objects.destroy test failed');
			console.trace();
		} else {
			console.error('objects.destroy test passed!');
		}
		console.timeEnd('all tests');
	}
	//delete
	objects.exists(user, testObj, objectsExistsCb);
	
}, 500);
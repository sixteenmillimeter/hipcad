var config = require('../lib/cfg.js'),
	users = require('../lib/users.js')(config);

setTimeout(function () {
	console.time('all tests');
	var testUser = 'TestUserString',
		testEmail = 'testuser@testemail.com',
		testPw = 'pwstring123',
	userExistsTest = function (exists) {
		if (!exists) {
			console.log('user.exists test passed!');
		} else {
			console.error('user.exists test failed');
			console.trace();
		}
		users.available('static', testEmail, testPw, userAvailableTest);
	},
	userAvailableTest = function (available) {
		if (!available) {
			console.log('user.available test passed!');
		} else {
			console.error('user.available test failed');
			console.trace();
		}
		users.available(testUser, testEmail, testPw, userAvailableTest2);
	},
	userAvailableTest2 = function (available) {
		if (available) {
			console.log('user.available test 2 passed!');
		} else {
			console.error('user.available test 2 failed');
			console.trace();
		}
		users.create(testUser, testEmail, testPw, userCreateTest);
	},
	userCreateTest = function (err, data) {
		if (err) {
			console.error('user.create test failed');
			console.trace();
		} else {
			console.log('user.create test passed!');
		}
		users.auth(testUser, testPw, userLoginTest);
	},
	userLoginTest = function (err, auth) {
		if (err) {
			console.error('user.auth test failed');
			console.trace();
		} else {
			if (auth) {
				console.log('user.auth test passed!')
			} else {
				console.error('user.auth test failed');
				console.trace();
			}
		}
		users.destroy(testUser, testPw, userDestroyTest);
	},
	userDestroyTest = function (err, destroyed) {
		if (err) {
			console.log(err);

			console.error('user.destroy test failed');
			console.trace();
		} else {
			if (destroyed) {
				console.log('user.destroy test passed!')
			} else {
				console.error('user.destroy test failed');
				console.trace();
			}
		}
		console.timeEnd('all tests');
	};
	
	users.exists(testUser, userExistsTest);
	/*	var user = 'objTestUser',
		email = 'mmcwilliams+object@aspectart.org',
		pw = 'objTestUserPw1239!###';
	users.create(user, email, pw, function(){});
	*/
}, 500);
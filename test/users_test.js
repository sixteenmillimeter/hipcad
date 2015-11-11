var users = require('../lib/users.js');

setTimeout(function () {
		//console.time('users.test');
		//console.timeEnd('users.test');
		/*
		users.create('matt', 'mmcwilliams@aspectart.org', 'test', function (obj) {
			console.dir(obj);
			users.exists('matt', function (exists) {
				console.log(exists);
				users.login('matt', 'test', function (success) {
					if (success) {
						console.log('logged in!');
					} else {
						console.log('login failed');
					}
					
				});
			});
		});
		users.available('matt', null, null, function (success) {
			if (success) {
				console.log('users.available failed user check');
			} else {
				console.log('users.available passed user check');
			}
		});
	
	users.available('impossiblenonrealuser', 'matt@gmail.com', 'passwird123', function (success) {
		if (success) {
			console.log('users.available passed user check');
		} else {
			console.log('users.available failed user check');
		}
	});*/
	//users.create('hipcad', 'mmcwilliams@aspectart.org', 'test1234', function (obj) {
		//console.dir(obj);
		/*users.exists('hipcad', function (exists) {
			console.log('exists:');
			console.log(exists);
			users.login('matt', 'test1234', function (success) {
				if (success) {
					console.log('logged in!');
				} else {
					console.log('login failed');
				}
				
			});
		});*/
	//});

	users.create('matt', 'mmcwilliams@aspectart.org', 'b@dp@ssw0rd', function (success) {
		if (success) {
			console.log('worked!');
		} else {
			console.log('fuck!');
		}
	});
				/*users.login('matt', 'test12345', function (success) {
				if (success) {
					console.log('logged in!');
				} else {
					console.log('login failed');
				}
				
			});*/
}, 500);
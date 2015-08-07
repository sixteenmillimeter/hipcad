var users = require('../lib/users.js');

setTimeout(function () {
	//users.create('hipcad', 'mmcwilliams@aspectart.org', 'test1234', function (obj) {
		//console.dir(obj);
		users.exists('hipcad', function (exists) {
			console.log('exists:');
			console.log(exists);
			users.login('matt', 'test1234', function (success) {
				if (success) {
					console.log('logged in!');
				} else {
					console.log('login failed');
				}
				
			});
		});
	//});
}, 500);
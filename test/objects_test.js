var objects = require('../lib/objects.js');
//objects.tests = function () {
	//console.time('objects.tests');
	//objects.index('matt', function (data) {
		//console.timeEnd('objects.tests');
	//})
	//objects.create('matt', 'testobj22', 'This is bulshit source', function () {});
//};

setTimeout(function () {
	console.time('took');
	objects.index('matt', function (data) {
		console.log(data);
		objects.create('matt', 'testobj22', 'This is bulshit source', function () {
			objects.index('matt', function (d) {
				console.log(d);
				objects.delete('matt', 'testobj22', function () {
					objects.index('matt', function (d2) {
						console.log(d2);
						console.time('tookEnd');
					});
				});
			});
		});
	})
}, 1000);
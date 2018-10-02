var config = require('../lib/cfg.js'),
	openscad = require('../lib/openscad.js')(config),
	uuid = require('uuid'),
	fs = require('fs');

var testFile = fs.readFileSync('./test/openscad_test.scad', 'utf8'),
	testId = uuid.v4();

setTimeout(function () {
	openscad.toFile(testId, testFile, function (fileName) {
		openscad.render(fileName, function () {
			openscad.cleanTmp(fileName, function () {

			});
		});
	});
}, 500);

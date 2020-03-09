var openscad = require('../lib/openscad.js')(),
	uuid = require('uuid').v4,
	fs = require('fs');

var testFile = fs.readFileSync('./test/openscad_test.scad', 'utf8'),
	testId = uuid();

setTimeout(function () {
	openscad.toFile(testId, testFile, function (fileName) {
		openscad.render(fileName, function () {
			openscad.cleanTmp(fileName, function () {

			});
		});
	});
}, 500);

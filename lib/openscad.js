var openscad = {},
	fs = require('fs'),
	request = require('request'),
	logger,
	execRaw = require('child_process').exec,
	tmpDir = '/tmp/hipcad/';

var exec = function (cmd, callback) {
	'use strict';
	var mb = {
		maxBuffer: 1024 * 10000 //10 Gigs? ugh woops
	};
	execRaw(cmd, mb, function (err, std) {
		if (err) {
			logger.error(err);
			return callback(false);
		}
		if (typeof callback !== 'undefined') {
			return callback(std);
		}
	});
};

openscad.render = function (scad, callback) {
	'use strict';
	var output = scad.replace('.scad', '.stl'),
		cmd = 'openscad -o ' + tmpDir + output + ' ' + tmpDir + scad;
	logger.info(cmd);
	exec(cmd, function (data) {
		if (data) {
			logger.info('Rendered ' + scad + ' to ' + output);
		}
		callback(data);
	});
};

openscad.toFile = function (id, text, callback) {
	'use strict';
	var now = +new Date(),
		fileName = now + '_' + id + '.scad';
	fs.writeFile(tmpDir + fileName, text, function (err, data) {
		if (err) {
			logger.error(err);
			return callback(err);
		}
		logger.info('Wrote scad data to ' + tmpDir + fileName);
		callback(false, fileName);
	}, 'utf8');
};

openscad.cleanTmp = function (scad, callback) {
	'use strict';
	var both = scad.replace('.scad', '*'),
		cmd = 'rm ' + tmpDir + both;
	exec(cmd, function (data) {
		if (data) {
			logger.info('Removed ' + tmpDir + both);
		}
	});
};

openscad.service = function openscad_service (username, object, source, callback) {
	'use strict';
	var query = {
			url : 'http://openscad.hipcad.com/openscad', 
			form: {
				username : username,
				object : object,
				source : source
			}
	},
	postResponse = function (err, res, body) {
		if (err) {
			return callback(err);
		}
		try{
			body = JSON.parse(res.body);
		} catch (e) {
			callback('Invalid response');
		}
		if (body) {
			callback(null, body);
		} else {
			callback('Invalid token');
		}
	};
	request.post(query, postResponse)
};

module.exports = function (cfg) {
	'use strict';
	logger = require('./logger.js')(cfg, 'openscad');
	return openscad;
};
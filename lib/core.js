// UTILITIES
var core = {},
	exec = require('child_process').exec,
	handlebars = require('handlebars'),
	uuid = require('node-uuid');
	
core.exec = function (cmd, callback) {
	var mb = {
		maxBuffer: 1024 * 10000
	};
	exec(cmd, mb, function (err, std) {
		if (err) {
			core.log(err + '');
			return callback(false);
		}
		if (typeof callback !== 'undefined') {
			return callback(std);
		}
	});
};
core.log = function (msg, logfile) {
	msg = +new Date() + ', ' + msg;
	if (typeof logfile !== 'undefined') {
		console.log(logfile + ' >> ' + msg);
		core.exec('echo "' + msg + '" >> ' + 'log/' + logfile + '.csv', function () {});
	} else {
		console.log(msg);
	}
};
core.cmd = function (a, b) { 
	return process.argv.indexOf(a) !== -1 || 
			process.argv.indexOf(b) !== -1; 
};
core.page = function (template, data) {
	var t = handlebars.compile(template);
	return t(data);
};
core.tag = function (req, res, callback) {
	var user;
	if (req && req.signedCookies && req.signedCookies._uuid) {
		user = req.signedCookies._uuid;
	} else {
		user = uuid.v4();
		var opt = { 
			signed: true, 
			expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) //10 years
		};
		res.cookie('_uuid', user, opt);
		console.dir(req.header);
		//core.log( , 'tags');
	}
	callback(req, res, user);
};

module.exports = core;
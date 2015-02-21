// UTILITIES
var hipcad = {},
	exec = require('child_process').exec,
	handlebars = require('handlebars');
	
hipcad.exec = function (cmd, callback) {
	var mb = {
		maxBuffer: 1024 * 10000
	};
	exec(cmd, mb, function (err, std) {
		if (err) {
			hipcad.log(err + '');
			return callback(false);
		}
		if (typeof callback !== 'undefined') {
			return callback(std);
		}
	});
};
hipcad.log = function (msg, logfile) {
	msg = +new Date() + ', ' + msg;
	if (typeof logfile !== 'undefined') {
		hipcad.exec('echo "' + msg + '" >> ' + 'log/' + logfile + '.csv');
	} else {
		console.log(msg);
	}
};
hipcad.cmd = function (a, b) { 
	return process.argv.indexOf(a) !== -1 || 
			process.argv.indexOf(b) !== -1; 
};
hipcad.page = function (template, data) {
	//
};
hipcad.tag = function (req, res, callback) {
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
	}
	callback(req, res, user);
};

module.exports = hipcad;
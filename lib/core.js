'use strict';

// UTILITIES
var core = {},
	exec = require('child_process').exec,
	shellescape = require('shell-escape'),
	handlebars = require('handlebars'),
	uuid = require('node-uuid'),
	logger = require('./logger.js')('/var/log/hipcad/hipcad.log');
	
core.exec = function (cmd, callback) {
	var mb = {
		maxBuffer: 1024 * 10000
	};
	exec(cmd, mb, function (err, std) {
		if (err) {
			log.warn(err);
			return callback(false);
		}
		if (typeof callback !== 'undefined') {
			return callback(std);
		}
	});
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
	var tag;
	if (req && req.signedCookies && req.signedCookies._uuid) {
		tag = req.signedCookies._uuid;
	} else {
		tag = uuid.v4();
		var opt = { 
			signed: true, 
			expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) //10 years
		};
		res.cookie('_uuid', tag, opt);
		core.taglog(tag, req);
	}
	callback(req, res, tag);
};
core.taglog = function (tag, req) {
	var line = tag + ',';
	line += req.headers['user-agent'] + ',';
	line += req.headers['accept-language'] + ',';
	line += req.headers['x-real-ip'] + ',';
	line += req.headers['x-forwarded-for'];
	logger.log(line);
	//time,tag,user-agent,language,real-ip,forwarded-ip,
};

core.logger = logger;

module.exports = core;
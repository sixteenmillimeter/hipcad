'use strict';

// UTILITIES
const core = {};
const exec = require('child_process').exec;
const shellescape = require('shell-escape');
const handlebars = require('handlebars');
const uuid = require('uuid').v4;
let log = require('log')('tags');
	
core.exec = function (cmd, callback) {
	var mb = {
		maxBuffer: 1024 * 10000
	};
	//properly escape cmd
	exec(cmd, mb, function (err, std) {
		if (err) {
			log.error(err);
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
		tag = uuid();
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
	var logLine = {};
	logLine.timestamp = +new Date();
	logLine.tag = tag;
	logLine['user-agent'] = req.headers['user-agent'];
	logLine['accept-language'] = req.headers['accept-language'];
	logLine['x-real-ip'] = req.headers['x-real-ip'];
	logLine['x-forwarded-for'] = req.headers['x-forwarded-for'];
	log.info(logLine);
};


module.exports = function (cfg) {
	return core;
};
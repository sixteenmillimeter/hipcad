'use strict';

const tmpl = {};
const handlebars = require('handlebars');
const fs = require('fs-extra');
let log = require('log')('tmpl');

tmpl.page = function (name, data) {
	var t = handlebars.compile(tmpl[name]); //cache compiled templates in object?
	return t(data);
};
	
tmpl.watchBetter = function (path, callback) {
	fs.watch(path, function (curr, prev) {
		if (global['watch_' + path] === undefined) {
			global['watch_' + path] = 'parked';
		} else {
			callback(path, curr, prev);
			global['watch_' + path] = undefined;
			delete global['watch_' + path];
		}
	});
};

tmpl.assign = function (name, path, callback) {
	//log.info('Assigning ' + path + ' to tmpl.' + name);
	if (typeof callback !== 'undefined') {
		tmpl.update(name, path, callback);
	} else {
		tmpl.update(name, path);
	}
	/*tmpl.watchBetter(path, function () {
		log.warn('Updated during runtime: ' + name + ' @ ' + path);
		tmpl.update(name, path);
	});*/
};

tmpl.update = function (name, path, callback) {
	fs.readFile(path, 'utf8', function (err, data) {
		if (err) return log.error(err);
		//log.info('Updating tmpl.' + name + ' from ' + path);
		tmpl[name] = data;
		if (typeof callback !== 'undefined') callback();
	});
};

module.exports = tmpl;
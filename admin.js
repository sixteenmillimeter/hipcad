var fs = require('fs'),
	os = require('os'),
	cmd = require('commander'),
    moment = require('moment'),
    path = require('path'),
    uuid = require('uuid'),
    cfg = require('./lib/cfg.js');

var readLog = function (path) {
	'use strict';
	var logRaw = fs.readFileSync(path, 'utf8').split('\n'),
		log = [],
		stitch = '',
		i;
	for (i = 0; i < logRaw.length; i++) {
		if (logRaw[i][0] === '{' && logRaw[i][logRaw[i].length - 1] === '}') {
			log.push(JSON.parse(logRaw[i]));
		} else {
			if (stitch === '') {
				stitch += logRaw[i] + '\n';
			} else {
				stitch = logRaw[i];
				if (logRaw[i][logRaw[i].length - 1] === '}') {
					log.push(JSON.parse(stitch));
					stitch = '';
				} else {
					stitch += '\n';
				}
			}
		}
	}
	return log;
};

var log = readLog('/var/log/hipcad/db.log');

console.dir(log);
var winston = require('winston');

module.exports = function (cfg, path, silent) {
	'use strict';
	var transports = [
	    new (winston.transports.File)({ 
	        filename: cfg.logs + path + '.log',  
	        colorize: true 
	    })
	],
	logger;
	if (typeof silent !== 'undefined'
		&& silent) {
		transports.push(new (winston.transports.Console)({ colorize: true, level: 'error' }));
	} else {
		transports.push(new (winston.transports.Console)({ colorize: true }));
	}
	logger = new (winston.Logger)({ transports: transports });
	return logger;
};
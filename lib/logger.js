'use strict';

const winston = require('winston');

module.exports = function (cfg, path, silent) {
	var transports = [
	    new (winston.transports.File)({ 
	        filename: cfg.logs + path + '.log',  
	        colorize: true,
	       	options: {
                flags: 'a',
                highWaterMark: 24 // just to be sure that it's really using this property
            } 
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
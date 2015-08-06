var winston = require('winston');

module.exports = function (path) {
	var logger = new (winston.Logger)({ transports: [
	    new (winston.transports.File)({ 
	        filename: path, 
	        colorize: true 
	    }),
	    new (winston.transports.Console)({ colorize: true })
	] });
	return logger;
};
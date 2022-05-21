'use strict';
/** @module log */
/** Wrapper for winston that tags streams and optionally writes files with a simple interface. */
/** Module now also supports optional papertrail integration, other services to follow */
const winston = require('winston');
const PAPERTRAIL_HOST = process.env.PAPERTRAIL_HOST || null;
const PAPERTRAIL_PORT = process.env.PAPERTRAIL_PORT || null;
const PAPERTRAIL_HOSTNAME = process.env.PAPERTRAIL_HOSTNAME || null;
const APP_NAME = process.env.APP_NAME || 'default';
let winstonPapertrail;
/**
* Returns a winston logger configured to service
*
* @param {string} label Label appearing on logger
* @param {string} filename Optional file to write log to
*
* @returns {object} Winston logger
*/
function createLog(label, filename = null) {
    const transports = [
        new (winston.transports.Console)({ label, timestamp: true })
    ];
    const format = winston.format.combine(winston.format.label({ label }), winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }), winston.format.json());
    let papertrailOpts;
    if (typeof process.env.LOGS !== 'undefined') {
        filename = process.env.LOGS;
    }
    if (filename !== null) {
        transports.push(new (winston.transports.File)({ label, filename, timestamp: true }));
    }
    if (PAPERTRAIL_HOST && PAPERTRAIL_PORT) {
        require('winston-papertrail').Papertrail;
        papertrailOpts = {
            host: PAPERTRAIL_HOST,
            port: PAPERTRAIL_PORT,
            program: APP_NAME,
            inlineMeta: true,
            level: 'debug',
            colorize: true
        };
        if (PAPERTRAIL_HOSTNAME) {
            papertrailOpts.hostname = PAPERTRAIL_HOSTNAME;
        }
        winstonPapertrail = new winston.transports.Papertrail(papertrailOpts);
        winstonPapertrail.on('error', (err) => {
            console.error(err);
        });
        transports.push(winstonPapertrail);
    }
    return winston.createLogger({
        format,
        transports
    });
}
module.exports = createLog;
//# sourceMappingURL=index.js.map
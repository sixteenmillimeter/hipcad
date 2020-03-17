'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = require("os");
const pool = require('dbpool');
const debug = require('debug')('app');
const log = require('log')('app');
const NUM_CPU = typeof process.env.WORKERS !== 'undefined' ?
    parseInt(process.env.WORKERS) : os_1.cpus().length;
const PORT = typeof process.env.PORT !== 'undefined' ?
    parseInt(process.env.PORT) : 3022;
let app;
let server;
process.on('uncaughtException', function (err) {
    log.error('uncaughtException', err);
    log.warn('Exiting with code 1');
    process.exit(1);
});
cluster_1.default.on('exit', (worker) => {
    log.warn('Worker exited', { pid: worker.id });
    if (NUM_CPU > 1) {
        log.info('Forking new worker process');
        cluster_1.default.fork();
    }
});
if (NUM_CPU === 1 || cluster_1.default.isWorker) {
    (async () => {
        try {
            app = await require('./server')(pool);
            app.set('port', PORT);
            server = app.listen(app.get('port'), () => {
                log.info(`Express HTTP server listening`, { port: PORT, pid: process.pid });
            });
        }
        catch (err) {
            log.error('Error forking Express HTTP server', err);
        }
    })();
}
else if (cluster_1.default.isMaster) {
    log.info(`Forking ${NUM_CPU} workers`);
    for (let i = 0; i < NUM_CPU; i++) {
        cluster_1.default.fork({ THREAD_COUNT: i });
    }
}
//# sourceMappingURL=index.js.map
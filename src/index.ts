'use strict';
import 'dotenv/config'
import cluster from 'cluster';
import { cpus } from 'os';

const pool = require('dbpool');

const debug = require('debug')('app');
const log = require('log')('app');

const NUM_CPU : number = typeof process.env.WORKERS !== 'undefined' ?
					 parseInt(process.env.WORKERS) : cpus().length;
const PORT : number = typeof process.env.PORT !== 'undefined' ?
					 parseInt(process.env.PORT) : 3022;

let app : any;
let server : any;

process.on('uncaughtException', function (err : Error) {
	log.error('uncaughtException', err);
	log.warn('Exiting with code 1');
	process.exit(1);
})

cluster.on('exit', (worker : any) => {
	log.warn('Worker exited', { pid : worker.id });
	if (NUM_CPU > 1) {
		log.info('Forking new worker process');
		cluster.fork();
	}
})

if (NUM_CPU === 1 || cluster.isWorker) {
	(async () => {
		try {
			app = await require('./server')(pool);
			app.set('port', PORT);
			server = app.listen(app.get('port'), () => {
				log.info(`Express HTTP server listening`, { port : PORT, pid : process.pid });
			});
		} catch (err) {
			log.error('Error forking Express HTTP server', err);
		}

	})()
} else if (cluster.isMaster) {
	log.info(`Forking ${NUM_CPU} workers`);
	for (let i : number = 0; i < NUM_CPU; i++) {
		cluster.fork({ THREAD_COUNT : i });
	}
}
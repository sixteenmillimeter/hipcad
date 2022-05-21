'use strict';

import { readFile } from 'fs-extra';
import { platform } from 'os';
import { join, resolve } from 'path';
import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { v4 as uuid } from 'uuid';

const session = require('sessionr');
const log = require('log')('server');

const app = express();

const DEBUG : boolean = platform().indexOf('darwin') !== -1 
	|| process.argv.indexOf('-d') !== -1 
	|| process.argv.indexOf('--dev') !== -1
	|| (typeof process.env.DEBUG !== 'undefined' && process.env.DEBUG === 'true');

log.info('Starting hipcad...');

if (!DEBUG) {
	app.use(helmet());
}

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session);

app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit : '5mb', extended: false}));

if ( DEBUG ) {
	log.info('Serving /static from node process');
	log.info(resolve(join(__dirname + '/../static')));
	app.use('/static', express.static( resolve(join(__dirname + '/../static')) )); //for local dev
}

app.get('/robots.txt', function(req : any, res : any, next : Function) {
	'use strict';
	res.set('Content-Type', 'text/plain');
	res.send('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Slurp\nAllow: /\nUser-agent: bingbot\nAllow: /');
});

module.exports = async function (pool : any) {
	const { hipcad, controller } = await require('./lib/controller')(pool);
	
	hipcad.tmpl.assign('home', './views/index.html');
	hipcad.tmpl.assign('err', './views/err.html');
	hipcad.tmpl.assign('user', './views/user.html');

	app.get('/', controller.home);

	app.post('/user/login', controller.login);
	app.post('/user/logout', controller.logout);
	app.get('/user/logout', controller.logout);

	app.post('/user/create', controller.user.create);

	app.get('/:user', controller.user.get);
	//app.put('/:user', controller.user.update);
	//app.delete('/:user', controller.user.update);

	//app.get('/:user/:object', controller.object.get);
	//app.get('/:user/:object/:rev', controller.object.getRevision);
	//app.post('/:user/:object', controller.object.create);
	//app.put('/:user/:object', controller.object.update);
	//app.delete('/:user/:object', controller.object.destroy);

	//app.get('/:user/:object/render', controller.object.render);

	if (DEBUG) {
	    log.info('Running in development mode');
	    hipcad.dev = true;
	} else {
	    hipcad.dev = false;
	}

	try {
		hipcad.homePage = await readFile('./views/info.txt', 'utf8');
	} catch (err) {
		log.error(err);
	}
	
	return app;
};



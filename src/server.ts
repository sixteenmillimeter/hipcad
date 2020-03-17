'use strict';

import { readFile } from 'fs-extra';
import { platform } from 'os';
import { join, resolve } from 'path';
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const FileStore = require('session-file-store')(expressSession);
const uuid = require('uuid').v4;

const session = require('sessionr');
const log = require('log')('server');

const app = express();

log.info('Starting hipcad...');

app.use(helmet());

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session);

app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit : '5mb', extended: false}));

if (platform().indexOf('darwin') !== -1 || process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--dev') !== -1) {
	log.info('Serving /static from node process on OSX');
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

	app.get('/:user/:object', controller.object.get);
	//app.get('/:user/:object/:rev', controller.object.getRevision);
	app.post('/:user/:object', controller.object.create);
	app.put('/:user/:object', controller.object.update);
	app.delete('/:user/:object', controller.object.destroy);

	//app.get('/:user/:object/render', controller.object.render);

	if (hipcad.cmd('-d', '--dev')) {
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



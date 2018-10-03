'use strict';

const fs = require('fs-extra');
const os = require('os');
const express = require('express');
const app = express();
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const FileStore = require('session-file-store')(expressSession);
const uuid = require('uuid').v4;

const { hipcad, controller } = require('./lib/controller');

hipcad.log.info('Starting hipcad.js...');

app.use(helmet());

app.use(cookieParser(hipcad.cfg.cookie_secret));
app.use(expressSession({
	store: new RedisStore({
    	host: hipcad.cfg.redis_url,
    	pass: '',
    	port: hipcad.cfg.redis_port
  	}),
	//store: new FileStore(),
	secret: hipcad.cfg.session_secret,
	saveUninitialized: true,
	resave: true,
	maxAge: 24 * 3600000
}));

app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit : '5mb', extended: false}));

hipcad.tmpl.assign('home', './views/index.html');
hipcad.tmpl.assign('err', './views/err.html');
hipcad.tmpl.assign('user', './views/user.html');

if (os.platform().indexOf('darwin') !== -1 || process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--dev') !== -1) {
	hipcad.log.info('Serving /static from node process on OSX');
	app.use('/static', express.static(__dirname + '/static')); //for local dev
}

app.get('/robots.txt', function(req, res) {
	'use strict';
	res.set('Content-Type', 'text/plain');
	res.send('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Slurp\nAllow: /\nUser-agent: bingbot\nAllow: /');
});

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

const init = function () {
	hipcad.log.infoPath = hipcad.cfg.logs;
	if (hipcad.cmd('-d', '--dev')) {
	    hipcad.log.info('Running in development mode');
	    hipcad.dev = true;
	} else {
	    hipcad.dev = false;
	}
	hipcad.homePage = fs.readFileSync('./views/info.txt', 'utf8');
	app.listen(hipcad.cfg.port);
	hipcad.log.info('Started server on http://127.0.0.1:' + hipcad.cfg.port);
};

init();

console.log('Starting hipcad.js...');

var fs = require('fs'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
    moment = require('moment'),
    path = require('path');

var hipcad = require('./lib/core.js');
hipcad.cfg = require('./lib/cfg.js');
hipcad.users = require('./lib/users.js');
hipcad.objects = require('./lib/objects.js');
hipcad.tmpl = require('./lib/templates.js');
hipcad.mail = require('./lib/mail.js');

hipcad.init = function () {
	hipcad.logger.infoPath = hipcad.cfg.logs;
	if (hipcad.cmd('-d', '--dev')) {
	    hipcad.logger.info('Running in development mode');
	    hipcad.dev = true;
	} else {
	    hipcad.dev = false;
	}
	app.listen(hipcad.cfg.port);
	hipcad.logger.info('Started server on http://127.0.0.1:' + hipcad.cfg.port);
};

var controller = {};
controller.fail = function (res, msg, status, json) {
	if (json) {
		page = {success: false, err : msg};
		return res.status(status).json(page);
	} else {
		page = hipcad.page(hipcad.tmpl.err, {message: msg});
		return res.status(status).send(page);
	}
};
controller.home = function (req, res) {
	hipcad.tag(req, res, function (req, res, tag) {
		hipcad.logger.info(tag + ',200,Front page', 'controller');
		res.status(200).send(hipcad.page(hipcad.tmpl.home, {src: "Welcome"}));
	});
};
controller.user = function (req, res) {
	var user = req.params['user'],
		json = false,
		page;
	if (req.query 
		&& req.query['json'] 
		&& req.query['json'] === 'true') {
		json = true;
	}
	hipcad.tag(req, res, function (req, res, tag) {
		hipcad.users.exists(user, function (uexists) {
			if (uexists) {
				hipcad.objects.index(user, function (data) {
					if (json) {
						page = {success: true, user : user, objects: data};
						hipcad.logger.info(tag + ',200,/' + user + ',json', 'controller');
						return res.status(200).json(page);
					} else {
						hipcad.logger.info(tag + ',200,/' + user, 'controller');
						page = hipcad.page(hipcad.tmpl.user, {user:user, objects:data});
					}
					return res.status(200).send(page);
				});
			} else {
				hipcad.logger.info(tag + ',404,/' + user, 'controller');
				controller.fail(res, 'Page not found.', 404, json);
			}
			
		});
	});
};
controller.object = function (req, res) {
	var user = req.params['user'],
		object = req.params['object'],
		json = false,
		page;
	if (req.query 
		&& req.query['json'] 
		&& req.query['json'] === 'true') {
		json = true;
	}
	hipcad.tag(req, res, function (req, res, tag) {
		hipcad.users.exists(user, function (uexists) {
			if (uexists) {
				hipcad.objects.exists(user, object, function (oexists) {
					if (oexists) {
						//hipcad.logger.info('User ' + tag + ' requested page for /' + user + '/' + object);
						hipcad.objects.get(user, object, function (obj) {
							if (json) {
								hipcad.logger.info(tag + ',200,/' + user + '/' + object + ',json', 'controller');
								delete obj.id;
								res.status(200).json({success: true, object: obj});
							} else {
								hipcad.logger.info(tag + ',200,/' + user + '/' + object, 'controller');
								res.status(200).send(hipcad.page(hipcad.tmpl.home, {src: obj.src}));
							}
						});
					} else {
						//hipcad.logger.info('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
						hipcad.logger.info(tag + ',404,/' + user + '/' + object, 'controller');
						controller.fail(res, 'Page not found.', 404, json);
					}
				});
			} else {
				//hipcad.logger.info('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
				hipcad.logger.info(tag + ',404,/' + user + '/' + object, 'controller');
				controller.fail(res, 'Page not found.', 404, json);
			}
		});
	});
};
controller.login = function (req, res) {
	var username, pwstring;
	hipcad.tag(req, res, function (req, res, tag) {
		username = req.body.user;
		pwstring = req.body.pwstring;
		hipcad.users.login(username, pwstring, function (success) {
			if (success) {
				hipcad.logger.info(tag + ',200,Logged in,' + username, 'controller');
				//give token
				res.status(200).json({success: success});
			} else {
				hipcad.logger.info(tag + ',401.1,Failed login,' + username);
				controller.fail(res, 'User login failed', 401.1, true);
			}
		});
	});
};

app.use(cookieParser(hipcad.cfg.cookie_secret));
app.use(expressSession({ 
	secret: hipcad.cfg.session_secret,
	saveUninitialized: true,
	resave: true
}));
app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit : '5mb', extended: false}));

app.get('/robots.txt', function(req, res) {
	res.set('Content-Type', 'text/plain');
	res.send('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Slurp\nAllow: /\nUser-agent: bingbot\nAllow: /');
});

app.get('/', controller.home);
app.get('/:user', controller.user);
app.get('/:user/:object', controller.object);
//app.get('/:user/:object/:rev', controller.revision);

//app.get('/static/'); -> being reserved by nginx
app.post('/user/login', controller.login);
app.post('/user/logout');
app.get('/user/logout');
app.post('/user/create');

app.post('/object/create/:user/:object');
app.post('/object/update/:user/:object');
app.post('/object/delete/:user/:object');

hipcad.init();

setTimeout(function () {
	hipcad.users.test();
	hipcad.objects.tests();
	hipcad.tmpl.tests();
}, 2000);
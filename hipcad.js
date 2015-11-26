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
hipcad.users = require('./lib/users.js')(hipcad.cfg);
hipcad.objects = require('./lib/objects.js')(hipcad.cfg);
hipcad.tmpl = require('./lib/templates.js')(hipcad.cfg);
hipcad.mail = require('./lib/mail.js')(hipcad.cfg);
hipcad.log = require('./lib/logger.js')(hipcad.cfg, 'app');

hipcad.init = function () {
	'use strict';
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

var controller = {};
controller.fail = function (res, msg, status, json) {
	'use strict';
	var page;
	if (json) {
		page = {success: false, err : msg};
		return res.status(status).json(page);
	} else {
		page = hipcad.page(hipcad.tmpl.err, {message: msg});
		return res.status(status).send(page);
	}
};
controller.home = function (req, res) {
	'use strict';
	var tagUserCb = function (req, res, tag) {
		hipcad.log.info(tag + ',200,Front page', 'controller');
		res.status(200).send(hipcad.page(hipcad.tmpl.home, {src: hipcad.homePage}));
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.user = {};
controller.user.get = function (req, res) {
	'use strict';
	var user = req.params['user'],
		json = false,
		page,
		tag;
	if (req.query
		&& req.query['json']
		&& req.query['json'] === 'true') {
		json = true;
	}
	var tagUserCb = function (req, res, t) {
		tag = t;
		hipcad.users.exists(user, userExistsCb);
	},
	userExistsCb = function (uexists) {
		if (uexists) {
			hipcad.objects.index(user, userIndexCb);
		} else {
			hipcad.log.info(tag + ',404,/' + user, 'controller');
			controller.fail(res, 'Page not found.', 404, json);
		}

	},
	userIndexCb = function (err, data) {
		//TODO: handle err
		if (json) {
			page = {success: true, user : user, objects: data};
			hipcad.log.info(tag + ',200,/' + user + ',json', 'controller');
			return res.status(200).json(page);
		} else {
			hipcad.log.info(tag + ',200,/' + user, 'controller');
			page = hipcad.page(hipcad.tmpl.user, {user:user, objects:data});
		}
		return res.status(200).send(page);
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.object = {};
controller.object.get = function (req, res) {
	'use strict';
	var user = req.params['user'],
		object = req.params['object'],
		json = false,
		page,
		tag;

	if (req.query
		&& req.query['json']
		&& req.query['json'] === 'true') {
		json = true;
	}
	var tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		hipcad.users.exists(user, userExistsCb);
	},
	userExistsCb = function (uexists) {
		if (uexists) {
			hipcad.objects.exists(user, object, objectExitsCb);
		} else {
			//hipcad.log.info('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
			hipcad.log.info(tag + ',404,/' + user + '/' + object, 'controller');
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectExistsCb = function (oexists) {
		if (oexists) {
			//hipcad.log.info('User ' + tag + ' requested page for /' + user + '/' + object);
			hipcad.objects.get(user, object, objectGetCb);
		} else {
			//hipcad.log.info('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
			hipcad.log.info(tag + ',404,/' + user + '/' + object, 'controller');
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectGetCb = function (err, obj) {
		//TODO: handle err
		if (json) {
			hipcad.log.info(tag + ',200,/' + user + '/' + object + ',json', 'controller');
			delete obj.id;
			res.status(200).json({success: true, object: obj});
		} else {
			hipcad.log.info(tag + ',200,/' + user + '/' + object, 'controller');
			res.status(200).send(hipcad.page(hipcad.tmpl.home, {src: obj.src}));
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.object.create = function () {};
controller.object.update = function () {};
controller.object.destroy = function () {};

controller.login = function (req, res) {
	'use strict';
	var username, pwstring;
	var tagUserCb = function (req, res, tag) {
		username = req.body.user;
		pwstring = req.body.pwstring;
		hipcad.users.auth(username, pwstring, userLoginCb);
	},
	userLoginCb = function (success) {
		if (success) {
			hipcad.log.info(tag + ',200,Logged in,' + username, 'controller');
			//give token
			res.status(200).json({success: success});
		} else {
			hipcad.log.info(tag + ',401.1,Failed login,' + username);
			controller.fail(res, 'User login failed', 401.1, true);
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

app.use(cookieParser(hipcad.cfg.cookie_secret));
app.use(expressSession({
	secret: hipcad.cfg.session_secret,
	saveUninitialized: true,
	resave: true
}));

app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit : '5mb', extended: false}));

hipcad.tmpl.assign('home', './views/index.html');
hipcad.tmpl.assign('err', './views/err.html');
hipcad.tmpl.assign('user', './views/user.html');

app.use('/static', express.static(__dirname + '/static')); //for local dev

app.get('/robots.txt', function(req, res) {
	'use strict';
	res.set('Content-Type', 'text/plain');
	res.send('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Slurp\nAllow: /\nUser-agent: bingbot\nAllow: /');
});

app.get('/', controller.home);

app.get('/:user', controller.user.get);
//app.post('/:user');
//app.put('/:user');
//app.delete('/:user');

app.get('/:user/:object', controller.object.get);
	//app.get('/:user/:object/:rev', controller.revision);
app.post('/:user/:object', controller.object.create);
app.put('/:user/:object', controller.object.update);
app.delete('/:user/:object', controller.object.destroy);


//app.get('/static/'); -> being reserved by nginx
app.post('/user/login', controller.login);
app.post('/user/logout');
app.get('/user/logout');
app.post('/user/create');

app.post('/object/create/:user/:object');
app.post('/object/update/:user/:object');
app.post('/object/delete/:user/:object');

hipcad.init();

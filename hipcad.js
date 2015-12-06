console.log('Starting hipcad.js...');

var fs = require('fs'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
    moment = require('moment'),
    path = require('path'),
    cfg = require('./lib/cfg.js');

var hipcad = require('./lib/core.js')(cfg);
hipcad.cfg = cfg;
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
		var pageData = {
		},
		page = {
			src: hipcad.homePage, 
			pageData: JSON.stringify(pageData)
		}
		hipcad.log.info(tag + ',200,Front page', 'controller');
		res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.user = {};
controller.user.get = function (req, res) {
	'use strict';
	var user = req.params.user,
		json = false,
		page,
		tag;
	if (req.query && req.query.json && req.query.json === 'true') {
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
	var user = req.params.user,
		object = req.params.object,
		json = false,
		page,
		tag;

	if (req.query && req.query.json && req.query.json === 'true') {
		json = true;
	}
	var tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		hipcad.users.exists(user, userExistsCb);
	},
	userExistsCb = function (uexists) {
		if (uexists) {
			hipcad.objects.exists(user, object, objectsExistsCb);
		} else {
			hipcad.log.info(tag + ',404,/' + user + '/' + object, 'controller');
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsExistsCb = function (oexists) {
		if (oexists) {
			hipcad.objects.get(user, object, objectsGetCb);
		} else {
			hipcad.log.info(tag + ',404,/' + user + '/' + object, 'controller');
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsGetCb = function (err, obj) {
		//TODO: handle err
		if (json) {
			hipcad.log.info(tag + ',200,/' + user + '/' + object + ',json', 'controller');
			delete obj.id;
			res.status(200).json({success: true, object: obj});
		} else {
			page = {
				pageData : JSON.stringify({}),
				src: obj.src
			};
			hipcad.log.info(tag + ',200,/' + user + '/' + object, 'controller');
			res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.object.create = function (req, res) {
	'use strict';
	var tag,
		json = false,
		username,
		object,
		source,
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		controller.auth(req, req, authCb);
	},
	authCb = function (err, auth) {
		if (err) {
			hipcad.log.error(err);
			return controller.fail(res, 'Server error', 500, json);
		}
		username = req.params.user;
		object = req.params.object;
		source = req.body.source;

		if (username !== req.session.token.username) {
			hipcad.log.error('Unauthorized accesss attempt');
			hipcad.log.error(req);
			return controller.fail(res, 'Unauthorized Access', 403, json);
		}

		objects.create(username, object, source, function (err, data) {

		});
	},
	objectsCreateCb = function (err, data) {

	};
	if (req.query && req.query.json && req.query.json === 'true') {
		json = true;
	}
	hipcad.tag(req, res, tagUserCb);
};
controller.object.update = function () {};
controller.object.destroy = function () {};

controller.login = function (req, res) {
	'use strict';
	var username, pwstring, tag;
	var tagUserCb = function (req, res, tagRaw) {
		tag = tagRaw;
		username = req.body.user;
		pwstring = req.body.pwstring;
		hipcad.users.auth(username, pwstring, usersLoginCb);
	},
	usersLoginCb = function (success) {
		if (success) {
			hipcad.users.get(username, usersGetCb);
		} else {
			hipcad.log.info(tag + ',401.1,Failed login,' + username);
			controller.fail(res, 'User login failed', 401.1, true);
		}
	},
	usersGetCb = function (err, body) {
		var tokenObj,
		opt;
		if (err) {
			hipcad.log.info(tag + ',401.1,Failed login,' + username);
			hipcad.log.error(err);
			return controller.fail(res, 'User login failed', 401.1, true);
		}
		tokenObj = {
			id : uuid.v4(),
			user : body.id,
			tag : tag,
			username : body.username,
			expires: +new Date() + (24 * 60 * 60 * 1000) //1 day
		};
		req.session.token = tokenObj;
		hipcad.log.info(tag + ',200,Logged in,' + username, 'controller');
		res.status(200).json({success: success});
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.logout = function (req, res) {
	'use strict';
	if (req.session && req.session.token) {
		delete req.session.token;
	}
};

controller.auth = function (req, res, callback) {
	'use strict';
	var authToken;
	if (req && req.session && req.session.token) {
		if (+new Date() > req.session.token.expires) {
			if (authToken.id.length === 36) {
				return callback(null, true);
			}
		} else {
			delete req.session.token;
			return callback('Token expired');
		}
	} else {
		return callback('Token invalid');
	}
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
app.post('/user/logout', controller.logout);
app.get('/user/logout');
app.post('/user/create');

app.post('/object/create/:user/:object');
app.post('/object/update/:user/:object');
app.post('/object/delete/:user/:object');

hipcad.init();

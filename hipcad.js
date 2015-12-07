console.log('Starting hipcad.js...');

var fs = require('fs'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	Recaptcha = require('recaptcha').Recaptcha,
	//RedisStore = require('connect-redis')(expressSession),
	FileStore = require('session-file-store')(expressSession)
    moment = require('moment'),
    path = require('path'),
    uuid = require('node-uuid'),
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
	var pageData = {},
		page,
		tag,
		recaptcha,
		logObj = {};
	var tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		controller.auth(req, res, authCb);
	},
	authCb = function (err, auth) {
		if (auth) {
			pageData.session = true;
			pageData.username = req.session.token.username;
		} else {
			recaptcha = new Recaptcha(hipcad.cfg.RECAPTCHA_PUBLIC_KEY, hipcad.cfg.RECAPTCHA_PRIVATE_KEY);
			pageData.recaptcha = encodeURIComponent(recaptcha.toHTML());
		}
		page = {
			src: hipcad.homePage, 
			pageData: JSON.stringify(pageData),
			title : ''
		};
		logObj.tag = tag;
		logObj.path = '/';
		logObj.status = 200;
		hipcad.log.info('controller.home', logObj);
		res.status(200).send(hipcad.page(hipcad.tmpl.home, page));

	};
	hipcad.tag(req, res, tagUserCb);
};

controller.user = {};
controller.user.get = function (req, res) {
	'use strict';
	var user = req.params.user,
		json = controller.json(req),
		page,
		pageData = {},
		tag,
		recaptcha,
		logObj = {
			path : '/' + user,
			tag : '',
			status : 200,
			json : json
		},
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;

		logObj.tag = tag;

		controller.auth(req, res, authCb);
	},
	authCb = function (err, auth) {
		if (auth) {
			pageData.session = true;
			pageData.username = req.session.token.username;

			logData.username = req.session.token.username;
		} else {
			recaptcha = new Recaptcha(hipcad.cfg.RECAPTCHA_PUBLIC_KEY, hipcad.cfg.RECAPTCHA_PRIVATE_KEY);
			pageData.recaptcha = encodeURIComponent(recaptcha.toHTML());
		}
		hipcad.users.exists(user, userExistsCb);
	},
	userExistsCb = function (uexists) {
		if (uexists) {
			hipcad.objects.index(user, userIndexCb);
		} else {
			logObj.status = 404;
			hipcad.log.info('controller.user.get', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}

	},
	userIndexCb = function (err, data) {
		//TODO: handle err
		if (json) {
			page = {success: true, user : user, objects: data};
			hipcad.log.info('controller.user.get', logObj);
			return res.status(200).json(page);
		} else {
			pageData.type = 'user';
			data = data.map(function (elem) {
				return elem.path;
			});
			page = {
				pageData : JSON.stringify(pageData),
				src: JSON.stringify(data, null, '\t'),
				title : ' - ' + user
			};
			hipcad.log.info('controller.user.get', logObj);
			return res.status(200).send(hipcad.page(hipcad.tmpl.home, page));	}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.user.create = function (req, res) {
	'use strict';

};

controller.object = {};
controller.object.get = function (req, res) {
	'use strict';
	var user = req.params.user,
		object = req.params.object,
		json = controller.json(req),
		page,
		pageData = {},
		tag,
		recaptcha,
		logObj = {
			path : '/' + user + '/' + object,
			tag : '',
			status : 200,
			json : json
		},

	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		logObj.tag = tag;
		controller.auth(req, res, authCb);
	},
	authCb = function (err, auth) {
		if (auth) {
			pageData.session = true;
			pageData.username = req.session.token.username;

			logData.username = req.session.token.username;
		} else {
			recaptcha = new Recaptcha(hipcad.cfg.RECAPTCHA_PUBLIC_KEY, hipcad.cfg.RECAPTCHA_PRIVATE_KEY);
			pageData.recaptcha = encodeURIComponent(recaptcha.toHTML());
		}
		hipcad.users.exists(user, objectsExistsCb);
	},
	objectsExistsCb = function (exists) {
		if (exists) {
			hipcad.objects.exists(user, object, objectsExistsCb);
		} else {
			logObj.status = 404;
			hipcad.log.warn('controller.object.get', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsExistsCb = function (oexists) {
		if (oexists) {
			hipcad.objects.get(user, object, objectsGetCb);
		} else {
			logObj.status = 404;
			hipcad.log.warn('controller.object.get', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsGetCb = function (err, obj) {
		//TODO: handle err
		if (json) {
			hipcad.log.info('controller.object.get', logObj);
			delete obj.id;
			res.status(200).json({success: true, object: obj});
		} else {
			pageData.type = 'object';
			page = {
				pageData : JSON.stringify(pageData),
				src: obj.src,
				title : ' - ' + user + '/' + object,
			};
			hipcad.log.info('controller.object.get', logObj);
			res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.object.create = function (req, res) {
	'use strict';
	var tag,
		json = controller.json(req),
		username,
		object,
		source,
		logObj = {},
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
			hipcad.log.error('Unauthorized access attempt');
			hipcad.log.error(req.params);
			return controller.fail(res, 'Unauthorized Access', 403, json);
		}

		hipcad.objects.create(username, object, source, objectsCreateCb);
	},
	objectsCreateCb = function (err, data) {
		if (err) {
			hipcad.log.error(err);
			return controller.fail(res, 'Server error', 500, json);
		}
		logObj.tag = tag;
		logObj.path = username + '/' + object;
		logObj.username = username;
		logObj.statusCode = 200;
		hipcad.log.info(logObj);
		if (json) {
			res.status(200).json({success: true});
		} else {
			res.redirect(username + '/' + object);
		}
	};
	hipcad.tag(req, res, tagUserCb);
};
controller.object.update = function () {};
controller.object.destroy = function () {};

controller.login = function (req, res) {
	'use strict';
	var username, 
		pwstring, 
		json = controller.json(req),
		tag,
		logObj = {
			path : '/user/login',
			tag : '',
			status : 200,
			username: '',
			json : json
		},
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		
		username = req.body.user;
		pwstring = req.body.pwstring;
		
		logObj.tag = tag;
		logObj.username = username;

		hipcad.users.auth(username, pwstring, usersLoginCb);
	},
	usersLoginCb = function (err, success) {
		if (err) {
			logObj.status = 401.1;
			hipcad.log.warn('controller.login', logObj);
			hipcad.log.error(err);
			return controller.fail('User login failed', 401.1, true);
		}
		if (success) {
			hipcad.users.get(username, usersGetCb);
		} else {
			logObj.status = 401.1;
			hipcad.log.warn('controller.login', logObj);
			controller.fail('User login failed', 401.1, true);
		}
	},
	usersGetCb = function (err, body) {
		var tokenObj,
		opt;
		if (err) {
			logObj.status = 401.1;
			hipcad.log.warn('controller.login', logObj);
			hipcad.log.error(err);
			return controller.fail('User login failed', 401.1, true);
		}
		tokenObj = {
			id : uuid.v4(),
			user : body.id,
			tag : tag,
			username : body.username,
			expires: +new Date() + (24 * 60 * 60 * 1000) //1 day
		};

		req.session.token = tokenObj;
		hipcad.log.info('controller.login', logObj);
		res.status(200).json({success: true});
	};
	hipcad.tag(req, res, tagUserCb);
};
controller.logout = function (req, res) {
	'use strict';
	var json = controller.json(req),
		logObj = {},
		realSession = false,
		username,
		tag,
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		console.log(tag);
		if (req.session && req.session.token) {
			realSession = true;
			username = req.session.token.username;
			delete req.session.token;
		}

		logObj.tag = tag;
		logObj.path = '/user/logout';
		logObj.username = username;
		logObj.realSession = realSession;

		hipcad.log.info('controller.logout', logObj);

		if (json) {
			res.status(200).json({success: realSession});
		} else {
			res.redirect('/');
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.json = function (req) {
	'use strict';
	var json = false;
	if (req.query && req.query.json && req.query.json === 'true'){
		json = true;
	}
	return json;
};

controller.auth = function (req, res, callback) {
	'use strict';
	if (req && req.session && req.session.token) {
		if (+new Date() < req.session.token.expires) {
			if (req.session.token.id.length === 36) {
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
	//store: new RedisStore(options),
	store: new FileStore(),
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

app.use('/static', express.static(__dirname + '/static')); //for local dev

app.get('/robots.txt', function(req, res) {
	'use strict';
	res.set('Content-Type', 'text/plain');
	res.send('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Slurp\nAllow: /\nUser-agent: bingbot\nAllow: /');
});

app.get('/', controller.home);

//app.get('/static/'); -> being reserved by nginx
app.post('/user/login', controller.login);
app.post('/user/logout', controller.logout);
app.get('/user/logout', controller.logout);

app.post('/user/create');

//app.post('/object/create/:user/:object');
//app.post('/object/update/:user/:object');
//app.post('/object/delete/:user/:object');

app.get('/:user', controller.user.get);
//app.post('/:user');
//app.put('/:user');
//app.delete('/:user');

app.get('/:user/:object', controller.object.get);
//app.get('/:user/:object/:rev', controller.revision);
app.post('/:user/:object', controller.object.create);
app.put('/:user/:object', controller.object.update);
app.delete('/:user/:object', controller.object.destroy);

hipcad.init();

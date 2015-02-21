console.log('Starting hipcad.js...');

var fs = require('fs'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	uuid = require('node-uuid'),
    moment = require('moment'),
    path = require('path');

var hipcad = require('./lib/core.js');
hipcad.users = require('./lib/users.js');
hipcad.mail = require('./lib/mail.js');
/*
db.wipe('pw', function (obj) {
	console.log(obj);
	users.pw = obj;
});
*/

//hipcad.objects = require('./lib/objects.js')(hipcad.db);

hipcad.init = function () {
	if (hipcad.cmd('-d', '--dev')) {
	    hipcad.log('Running in development mode');
	    hipcad.dev = true;
	} else {
	    hipcad.dev = false;
	}
	app.listen(6445);
};

var controller = {};
controller.fail = function (res, msg, status, json) {
	if (json) {
		page = {success: false, err : msg};
		return res.json(status, page);
	} else {
		page = msg;
		return res.send(status, page);
	}
};
controller.home = function (req, res) {
	console.log('home hit');
	hipcad.tag(req, res, function (req, res, tag) {
		hipcad.log('User ' + tag + ' came to front page');
		hipcad.log(tag + ',Front page', 'users');
		res.send('home');
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
				//get their objects
				hipcad.log('User ' + tag + ' requested page for /' + user);
				hipcad.log(tag + ',/' + user, 'users');
				if (json) {
					page = {success: true, user : user};
					return res.json(200, page);
				} else {
					page = user; //template
				}
			} else {
				hipcad.log('User ' + tag + ' requested non-existant page for /' + user);
				hipcad.log(tag + ',404  @ /' + user, 'users');
				controller.fail(res, 'Page not found.', 404, json);
			}
			return res.send(page);
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
						hipcad.log('User ' + tag + ' requested page for /' + user + '/' + object);
						hipcad.log(tag + ',/' + user + '/' + object, 'users');
						var obj = hipcad.objects.get(user, object);
						if (json) {
							res.json(200, {success: true, object: obj});
						} else {
							res.send(200, obj.src);
						}
					} else {
						hipcad.log('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
						hipcad.log(tag + ',404 @ /' + user + '/' + object, 'users');
						controller.fail(res, 'Page not found.', 404, json);
					}
				});
			} else {
				hipcad.log('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
				hipcad.log(tag + ',404 @ /' + user + '/' + object, 'users');
				controller.fail(res, 'Page not found.', 404, json);
			}
		});
	});
};

//app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser("Some fucking cookie secret"));
app.use(expressSession({ 
	secret: "Some fucking secret that is long",
	saveUninitialized: true,
	resave: true
}));
app.use(bodyParser.json({limit : '50mb'}));
app.use(bodyParser.urlencoded({limit : '50mb', extended: false}));

app.get('/', controller.home);
app.get('/:user', controller.user);
app.get('/:user/:object', controller.object);

app.post('/login');
app.post('/save/:user/:object');
app.post('/delete/:user/:object');

hipcad.init();

setTimeout(function () {
	hipcad.users.test();
	hipcad.mail.send('matt', 'mmcwilliams@aspectart.org', 'hey', 'this a message', '');
}, 2000);
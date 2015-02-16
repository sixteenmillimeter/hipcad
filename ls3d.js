var fs = require('fs'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	handlebars = require("handlebars"),
	uuid = require('node-uuid'),
	nano = require('nano')('http://localhost:5984'),
	exec = require('child_process').exec,
	crypto = require('crypto'),
    moment = require('moment'),
    path = require('path');

var ls3d = {};
// UTILITIES
ls3d.init = function () {
	if (ls3d.cmd('-d', '--dev')) {
	    console.log('Running in development mode');
	    ls3d.dev = true;
	} else {
	    ls3d.dev = false;
	}
	app.listen(6445);
};
ls3d.log = function (msg, logfile) {
	msg = +new Date() + ', ' + msg;
	if (typeof logfile !== 'undefined') {
		ls3d.exec('echo "' + msg + '" >> ' + 'log/' + logfile);
	} else {
		console.log(msg);
	}
};
ls3d.cmd = function (a, b) { 
	return process.argv.indexOf(a) !== -1 || 
			process.argv.indexOf(b) !== -1; 
};
ls3d.exec = function (cmd, callback) {
	exec(cmd, function (err, std) {
		if (err) {
			ls3d.log(err + '');
			return callback(false);
		}
		if (typeof callback !== 'undefined') {
			return callback(std);
		}
	});
};

//TRACKING
ls3d.tag = function (req, res, callback) {
	var user;
	if (req && req.signedCookies && req.signedCookies._uuid) {
		user = req.signedCookies._uuid;
	} else {
		user = uuid.v4();
		var opt = { 
			signed: true, 
			expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) //10 years
		};
		res.cookie('_uuid', user, opt);
	}
	callback(req, res, user);
};

//APP
ls3d.users = {};
ls3d.users.index = ['matt'];
ls3d.users.temp = {
	'matt' : {
		'objects' : [
			'first-object',
			'second-object'
		]
	}
};
ls3d.users.exists = function (username) {
	if (ls3d.users.index.indexOf(username) !== -1) {
		return true;
	} else {
		return false;
	}
};
ls3d.users.objects = function (username) {
	return ls3d.users.temp[username]['objects'];
};

ls3d.objects = {};
ls3d.objects.index = ['/matt/first-object', '/matt/second-object'];
ls3d.objects.temp = {
	'/matt/first-object' : {
		src : 'cube();\rcylinder(r=1, h=1, center=true);'
	}, 
	'/matt/second-object' : {
		src : 'module cylinder  () { \ncylinder(r=3, h=3, center=true); \n}'
	}
};
ls3d.objects.exists = function (username, object) {
	if (ls3d.objects.index.indexOf('/' + username + '/' + object) !== -1) {
		return true;
	} else {
		return false;
	}
};
ls3d.objects.get = function (username, object) {
	return ls3d.objects.temp['/' + username + '/' + object];
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser("Some fucking cookie secret"));
app.use(expressSession({ 
	secret: "Some fucking secret that is long",
	saveUninitialized: true,
	resave: true
}));
app.use(bodyParser.json({limit : '50mb'}));
app.use(bodyParser.urlencoded({limit : '50mb', extended: false}));

var controller = {};
controller.fail = function (msg, status, json) {
	if (json) {
		page = {success: false, err : msg};
		return res.json(status, page);
	} else {
		page = msg;
		return res.send(status, page);
	}
}
controller.home = function (req, res) {
	ls3d.tag(req, res, function (req, res, tag) {
		ls3d.log('User ' + tag + ' came to front page');
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
	ls3d.tag(req, res, function (req, res, tag) {
		if (ls3d.users.exists(user)) {
			ls3d.log('User ' + tag + ' requested page for /' + user);
			if (json) {
				page = {success: true, user : user};
				return res.json(200, page);
			} else {
				page = user; //template
			}
		} else {
			ls3d.log('User ' + tag + ' requested non-existant page for /' + user);
			controller.fail('Page not found.', 404, json);
		}
		return res.send(page);
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
	ls3d.tag(req, res, function (req, res, tag) {
		if (ls3d.users.exists(user)) {
			if (ls3d.objects.exists(user, object)) {
				ls3d.log('User' + tag + ' requested page for /' + user + '/' + object);
				var obj = ls3d.objects.get(user, object);
				if (json) {
					res.json(200, {success: true, object: obj});
				} else {
					res.send(200, obj.src);
				}
			} else {
				ls3d.log('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
				controller.fail('Page not found.', 404, json);
			}
		} else {
			ls3d.log('User ' + tag + ' requested non-existant page for /' + user + '/' + object);
			controller.fail('Page not found.', 404, json);
		}
	});
};

app.get('/', controller.home);
app.get('/:user', controller.user);
app.get('/:user/:object', controller.object);

app.post('/login');
app.post('/save/:user/:object');
app.post('/delete/:user/:object');

ls3d.init()
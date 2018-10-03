'use strict';

const fs = require('fs-extra');

const cfg = require('./cfg');
const pool = require('dbpool');

const hipcad = require('./core')(cfg);
hipcad.cfg = cfg;
hipcad.users = require('./users')(hipcad.cfg);
hipcad.objects = require('./objects')(hipcad.cfg);
hipcad.tmpl = require('./templates')(hipcad.cfg);
hipcad.mail = require('./mail')(hipcad.cfg);
hipcad.recaptcha = require('./recaptcha')(hipcad.cfg);
hipcad.openscad = require('./openscad')(hipcad.cfg);
hipcad.log = require('log')('app');

const controller = {};
controller.fail = function (res, msg, status, json) {
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

			logObj.username = req.session.token.username;
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
			pageData.owner = {
				username : user
			}
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
	var tag,
		json = controller.json(req),
		username,
		email,
		pwstring,
		pwstring2,
		source,
		gcapRes,
		ip,
		logObj = {
			tag: '',
			path : '/user/create',
			status: 200
		},
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		logObj.tag = tag;
		//controller.auth(req, req, authCb);

		if (req.body
			&&req.body.username
			&& req.body.pwstring
			&& req.body.pwstring2
			&& req.body.email
			&& req.body['g-recaptcha-response']
			&& req.body['g-recaptcha-response'].length !== 0
			&& req.connection.remoteAddress || req.headers['x-real-ip']) {

			username = req.body.username;
			pwstring = req.body.pwstring;
			pwstring2 = req.body.pwstring2;
			email = req.body.email;

			gcapRes = req.body['g-recaptcha-response'];
			ip = req.connection.remoteAddress || req.headers['x-real-ip'];

			hipcad.users.validateInfo(username, email, pwstring, pwstring2, validateInfoCb);
		} else {
			logObj.status = 400;
			hipcad.log.warn('controller.user.create', logObj);
			return controller.fail(res, 'Invalid request', 400, json);
		}
	},
	validateInfoCb = function (err, valid) {
		if (valid) {
			hipcad.users.uniqueEmail(email, validateEmailCb);
		} else {
			logObj.status = 400;
			logObj.err = err;
			logObj.username = username;
			hipcad.log.warn('controller.user.create', logObj);
			return controller.fail(res, err, 400, json); //use this to trigger UI events
		}
	},
	validateEmailCb = function (err, valid) {
		if (valid) {
			 hipcad.recaptcha.verify(gcapRes, ip, validateRecaptchaCb);
		} else {
			logObj.status = 400;
			logObj.err = {item: 'email', msg: 'Email is currently in use'};
			logObj.username = username;
			hipcad.log.warn('controller.user.create', logObj);
			return controller.fail(res, err, 400, json);
		}
	},
	validateRecaptchaCb = function (err, valid) {
		if (valid) {
			hipcad.users.create(username, email, pwstring, usersCreateCb);
		} else {
			logObj.status = 400;
			logObj.err = {item: 'recaptcha'};
			logObj.username = username;
			hipcad.log.warn('controller.user.create', logObj);
			return controller.fail(res, err, 400, json);
		}
	},
	usersCreateCb = function (err, userObj) {
		if (err) {
			logObj.status = 500;
			hipcad.log.warn('controller.user.create', logObj);
			return controller.fail(res, 'Error creating user', 500, json);
		}
		hipcad.log.info('controller.user.create', logObj);
		hipcad.mail.send(username, email, 'Welcome to hipcad.com!', 'Thanks for signing up for hipcad. Please feel free to email us with comments or questions.', null);
		if (json) {
			res.status(200).json({success: true});
		} else {
			res.redirect('/#login');
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.object = {};
controller.object.get = function (req, res) {
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

			logObj.username = req.session.token.username;
		}
		hipcad.objects.exists(user, object, objectsExistsCb);
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
		if (oexists === true) {
			hipcad.objects.get(user, object, objectsGetCb);
		} else {
			logObj.status = 404;
			hipcad.log.warn('controller.object.get', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsGetCb = function (err, obj) {
		if (err) {
			logObj.status = 500;
			hipcad.log.error(err);
			hipcad.log.warn('controller.object.get', logObj);
			return controller.fail(res, 'Server error.', 500, json);
		}
		if (json) {
			hipcad.log.info('controller.object.get', logObj);
			delete obj.id;
			res.status(200).json({success: true, object: obj});
		} else {
			pageData.type = 'object';
			pageData.owner = {
				username : user,
				object : object
			}
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

controller.object.get = async function (req, res, next) {
	const user = req.params.user;
	const object = req.params.object;
	const json = controller.json(req);
	let page;
	let pageData = {};
	let tag;
	let recaptcha;
	let logObj = {
		path : `/${user}/${object}`,
		tag : '',
		status : 200,
		json : json
	};
	let exists;

	try{
		exists = await hipcad.objects.exists(user, object);
	} catch (err) {
		logObj.err = err;
		hipcad.log.error(`Error determining if object exists`, logObj);
		return controller.fail(res, 500, 'Error determining if object exists', json);
	}

	hipcad.log.info(logObj);
	return res.send('bla')
};

controller.object.create = function (req, res) {
	var tag,
		json = controller.json(req),
		username,
		object,
		source,
		logObj = {},
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		controller.auth(req, res, authCb);
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
			logObj.status = 500;
			hipcad.log.warn('controller.object.create', logObj);
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
controller.object.update = function (req, res) {
	var tag,
		json = controller.json(req),
		username,
		object,
		source,
		logObj = {},
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
		controller.auth(req, res, authCb);
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

		hipcad.objects.update(username, object, source, objectsUpdateCb);
	},
	objectsUpdateCb = function (err, data) {
		if (err) {
			logObj.status = 500;
			hipcad.log.info('controller.object.update', logObj);
			hipcad.log.error(err);
			return controller.fail(res, 'Server error', 500, json);
		}

		logObj.tag = tag;
		logObj.path = username + '/' + object;
		logObj.username = username;
		logObj.statusCode = 200;
		logObj.json = json;

		hipcad.log.info('controller.object.update', logObj);
		if (json) {
			res.status(200).json({success: true});
		} else {
			res.redirect(username + '/' + object);
		}
	};
	hipcad.tag(req, res, tagUserCb);
};
controller.object.destroy = function () {};

controller.object.render = function (req, res) {
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
			logObj.username = req.session.token.username;
		} else {
			logObj.status = 401;
			hipcad.log.warn('controller.object.render', logObj);
			return controller.fail(res, 'Not logged in.', 401, json);
		}

		if (user !== req.session.token.username) {
			logObj.status = 401;
			hipcad.log.warn('controller.object.render', logObj);
			return controller.fail(res, 'Unauthorized.', 401, json);
		}

		hipcad.objects.exists(user, object, objectsExistsCb);
	},
	objectsExistsCb = function (exists) {
		if (exists) {
			hipcad.objects.exists(user, object, objectsExistsCb);
		} else {
			logObj.status = 404;
			hipcad.log.warn('controller.object.render', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsExistsCb = function (oexists) {
		if (oexists === true) {
			hipcad.objects.get(user, object, objectsGetCb);
		} else {
			logObj.status = 404;
			hipcad.log.warn('controller.object.render', logObj);
			controller.fail(res, 'Page not found.', 404, json);
		}
	},
	objectsGetCb = function (err, obj) {
		if (err) {
			logObj.status = 500;
			hipcad.log.error(err);
			hipcad.log.warn('controller.object.render', logObj);
			return controller.fail(res, 'Server error.', 500, json);
		}

		hipcad.objects.includes.process(obj.src, obj.includes, includes_process_cb);
	},
	includes_process_cb = function (source) {
		hipcad.openscad.service(user, object, source, openscad_service_cb);
	},
	openscad_service_cb = function (err, data) {
		if (err) {
			logObj.status = 500;
			hipcad.log.error(err);
			hipcad.log.warn('controller.object.render', logObj);
			return controller.fail(res, 'Server error.', 500, json);
		}
		hipcad.log.info('controller.object.render', logObj);
		if (json) {
			res.status(200).json(data);
		} else {
			res.redirect(data.data.stl.replace('./', 'http://openscad.hipcad.com/'));
		}
	};
	hipcad.tag(req, res, tagUserCb);
};

controller.login = function (req, res) {
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
			return controller.fail(res, 'User login failed', 401.1, json);
		}
		if (success) {
			hipcad.users.get(username, usersGetCb);
		} else {
			logObj.status = 401.1;
			hipcad.log.warn('users.login callback success false');
			hipcad.log.warn('controller.login', logObj);
			controller.fail(res, 'User login failed', 401.1, json);
		}
	},
	usersGetCb = function (err, body) {
		var tokenObj,
		opt;
		if (err) {
			logObj.status = 401.1;
			hipcad.log.warn('controller.login', logObj);
			hipcad.log.error(err);
			return controller.fail(res, 'User login failed', 401.1, json);
		}
		tokenObj = {
			id : uuid(),
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
	var json = controller.json(req),
		logObj = {},
		realSession = false,
		username,
		tag,
	tagUserCb = function (req, res, tagOutput) {
		tag = tagOutput;
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
	var json = false;
	if (req.query && req.query.json && req.query.json === 'true'){
		json = true;
	}
	return json;
};

controller.auth = function (req, res, callback) {
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

module.exports.controller = controller;
module.exports.hipcad = hipcad;
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const hipcad = require('../core')();
const log = require('log')('app');
const Mail = require('../mail');
const RECAPTCHA_PUBLIC_KEY = process.env.RECAPTCHA_PUBLIC_KEY;
const POSTHOG_URL = process.env.POSTHOG_URL;
const POSTHOG_ID = process.env.POSTHOG_ID;
const controller = {};
controller.fail = function (res, msg, status, json) {
    var page;
    if (json) {
        page = { success: false, err: msg };
        return res.status(status).json(page);
    }
    else {
        page = hipcad.page(hipcad.tmpl.err, { message: msg });
        return res.status(status).send(page);
    }
};
controller.home = async function (req, res, next) {
    let page = {};
    let pageData = {};
    let tag;
    let logObj = {};
    let auth = false;
    //hipcad.tag(req, res, tagUserCb);
    try {
        auth = await controller.auth(req, res);
    }
    catch (err) {
        //log.error(err);
    }
    if (auth) {
        pageData.session = true;
        pageData.username = req.session.token.username;
    }
    page = {
        posthog_url: POSTHOG_URL,
        posthog_id: POSTHOG_ID,
        recaptcha: RECAPTCHA_PUBLIC_KEY,
        src: hipcad.homePage,
        pageData: JSON.stringify(pageData),
        title: ''
    };
    logObj.tag = tag;
    logObj.path = '/';
    logObj.status = 200;
    log.info('controller.home', logObj);
    res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
    return next();
};
controller.user = {};
controller.user.get = async function (req, res, next) {
    const user = req.params.user;
    const json = controller.json(req);
    let page;
    let pageData = {};
    let tag;
    let logObj = {
        path: '/' + user,
        tag: '',
        status: 200,
        json
    };
    let auth = false;
    let exists = false;
    let data;
    //	tag = tagOutput;
    //logObj.tag = tag;
    try {
        auth = await controller.auth(req);
    }
    catch (err) {
        //log.error(err);
    }
    if (auth) {
        pageData.session = true;
        pageData.username = req.session.token.username;
        logObj.username = req.session.token.username;
    }
    try {
        exists = await hipcad.users.exists(user);
    }
    catch (err) {
        log.error(err);
    }
    if (!exists) {
        logObj.status = 404;
        log.info('controller.user.get', logObj);
        return controller.fail(res, 'Page not found.', 404, json);
    }
    try {
        data = await hipcad.objects.index(user);
    }
    catch (err) {
        log.error(err);
        logObj.status = 500;
        log.info('controller.user.get', logObj);
        return controller.fail(res, 'Error getting user objects.', 404, json);
    }
    if (json) {
        page = {
            success: true,
            user: user,
            objects: data
        };
        log.info('controller.user.get', logObj);
        res.status(200).json(page);
    }
    else {
        pageData.type = 'user';
        pageData.owner = {
            username: user
        };
        data = data.map(function (elem) {
            return elem.path;
        });
        page = {
            posthog_url: POSTHOG_URL,
            posthog_id: POSTHOG_ID,
            recaptcha: RECAPTCHA_PUBLIC_KEY,
            pageData: JSON.stringify(pageData),
            src: JSON.stringify(data, null, '\t'),
            title: ' - ' + user
        };
        log.info('controller.user.get', logObj);
        res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
    }
    return next();
};
controller.user.create = async function (req, res, next) {
    const json = controller.json(req);
    let tag;
    let username;
    let email;
    let pwstring;
    let pwstring2;
    let source;
    let gcapRes;
    let ip;
    let logObj = {
        tag: '',
        path: '/user/create',
        status: 200
    };
    let gcapValid = false;
    let valid = false;
    let create = {};
    let subject;
    let body;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    //logObj.tag = tag;
    //controller.auth(req, req, authCb);
    ip = req.connection.remoteAddress || req.headers['x-real-ip'];
    logObj.ip = ip;
    if (req.body
        && req.body.username
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
        valid = true;
    }
    else {
        logObj.status = 400;
        console.dir(req.body);
        log.warn('controller.user.create', logObj);
        return controller.fail(res, 'Invalid request', 400, json);
    }
    if (valid) {
        gcapValid = await hipcad.recaptcha.verify(gcapRes, ip);
    }
    else {
        logObj.status = 400;
        logObj.err = { item: 'email', msg: 'Invalid request' };
        logObj.username = username;
        logObj.email = email;
        log.warn('controller.user.create', logObj);
        return controller.fail(res, new Error('Invalid request'), 400, json);
    }
    if (!gcapValid) {
        logObj.status = 400;
        logObj.err = { item: 'email', msg: 'Google Recaptcha is invalid' };
        logObj.username = username;
        logObj.email = email;
        log.warn('controller.user.create', logObj);
        return controller.fail(res, new Error('Google Recaptcha is invalid'), 400, json);
    }
    try {
        create = await hipcad.users.create(username, email, pwstring, pwstring2);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        logObj.username = username;
        logObj.email = email;
        log.error(err);
        log.warn('controller.user.create', logObj);
        return controller.fail(res, 'Error creating user', 500, json);
    }
    if (!create || create.error) {
        logObj.status = 400;
        logObj.err = { item: 'email', msg: create.error };
        log.warn('controller.user.create', logObj);
        return controller.fail(res, 'Error creating user', 400, json);
    }
    log.info('controller.user.create', logObj);
    subject = 'Welcome to hipcad.com!';
    body = 'Thanks for signing up for hipcad. Please feel free to email us with comments or questions.';
    try {
        hipcad.mail.send([email], subject, body);
    }
    catch (err) {
        log.error(err);
    }
    if (json) {
        res.status(200).json({ success: true });
    }
    else {
        res.redirect('/#login');
    }
    return next();
};
controller.object = {};
controller.object.get = async function (req, res, next) {
    const username = req.params.user;
    const object = req.params.object;
    const json = controller.json(req);
    let data;
    let pageData = {};
    let page;
    let tag;
    let logObj = {
        path: `/${username}/${object}`,
        tag: '',
        status: 200,
        json
    };
    let auth = false;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    //logObj.tag = tag;
    try {
        auth = await controller.auth(req, res);
    }
    catch (err) {
        log.error(err);
    }
    if (auth) {
        pageData.session = true;
        pageData.username = req.session.token.username;
        logObj.username = req.session.token.username;
    }
    try {
        data = await hipcad.objects.get(username, object);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.get', logObj);
        return controller.fail(res, 'Server error.', 500, json);
    }
    if (data) {
        logObj.status = 404;
        log.warn('controller.object.get', logObj);
        return controller.fail(res, 'Page not found.', 404, json);
    }
    if (json) {
        log.info('controller.object.get', logObj);
        delete data.id;
        delete data.user;
        res.status(200).json({ success: true, object: data });
    }
    else {
        pageData.type = 'object';
        pageData.owner = {
            username,
            object
        };
        page = {
            posthog_url: POSTHOG_URL,
            posthog_id: POSTHOG_ID,
            recaptcha: RECAPTCHA_PUBLIC_KEY,
            pageData: JSON.stringify(pageData),
            src: data.src,
            title: ' - ' + username + '/' + object,
        };
        log.info('controller.object.get', logObj);
        res.status(200).send(hipcad.page(hipcad.tmpl.home, page));
    }
};
controller.object.create = async function (req, res, next) {
    const json = controller.json(req);
    let tag;
    let username = req.params.user;
    let object = req.params.object;
    let source = req.body.source;
    let logObj = {
        path: `/${username}/${object}`,
        tag: '',
        status: 200,
        json
    };
    let auth = false;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    //logObj.tag = tag;
    try {
        auth = await controller.auth(req, res);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error(controller.object.create, logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    if (!auth || username !== req.session.token.username) {
        logObj.status = 403;
        log.err = 'Unauthorized access attempt';
        log.error(logObj);
        log.error(req.params);
        return controller.fail(res, 'Unauthorized Access', 403, json);
    }
    try {
        await hipcad.objects.create({ username, id: req.session.token.user }, object, source);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.create', logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    logObj.created = true;
    logObj.username = username;
    logObj.status = 200;
    log.info(logObj);
    if (json) {
        res.status(200).json({ success: true });
    }
    else {
        res.redirect(username + '/' + object);
    }
    return next();
};
controller.object.update = async function (req, res, next) {
    const json = controller.json(req);
    let tag;
    let username = req.params.user;
    let object = req.params.object;
    let source = req.body.source;
    let logObj = {
        path: `/${username}/${object}`,
        tag: '',
        status: 200,
        json
    };
    let auth = false;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    //logObj.tag = tag;
    try {
        auth = await controller.auth(req, res);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.update', logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    if (!auth || username !== req.session.token.username) {
        logObj.status = 403;
        log.err = 'Unauthorized access attempt';
        log.error(logObj);
        log.error(req.params);
        return controller.fail(res, 'Unauthorized Access', 403, json);
    }
    try {
        await hipcad.objects.update({ username, id: req.session.token.user }, object, source);
    }
    catch (err) {
        logObj.status = 500;
        log.info('controller.object.update', logObj);
        log.error(err);
        return controller.fail(res, 'Server error', 500, json);
    }
    logObj.username = username;
    logObj.statusCode = 200;
    logObj.json = json;
    log.info('controller.object.update', logObj);
    if (json) {
        res.status(200).json({ success: true });
    }
    else {
        res.redirect(username + '/' + object);
    }
    return next();
};
controller.object.destroy = function () { };
controller.object.render = async function (req, res, next) {
    const json = controller.json(req);
    let tag;
    let username = req.params.user;
    let object = req.params.object;
    let logObj = {
        path: `/${username}/${object}/render`,
        tag: '',
        status: 200,
        json
    };
    let auth = false;
    let exists = false;
    let source = '';
    let data;
    let renderFile;
    let render;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    //logObj.tag = tag;
    try {
        auth = await controller.auth(req, res);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.render', logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    if (auth) {
        logObj.username = req.session.token.username;
    }
    else {
        logObj.status = 401;
        log.warn('controller.object.render', logObj);
        return controller.fail(res, 'Not logged in.', 401, json);
    }
    if (username !== req.session.token.username) {
        logObj.status = 401;
        log.warn('controller.object.render', logObj);
        return controller.fail(res, 'Unauthorized.', 401, json);
    }
    try {
        exists = await hipcad.objects.exists(username, object);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.render', logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    if (!exists) {
        logObj.status = 404;
        log.warn('controller.object.render', logObj);
        return controller.fail(res, 'Page not found.', 404, json);
    }
    try {
        data = await hipcad.objects.get(username, object);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.render', logObj);
        return controller.fail(res, 'Server error', 500, json);
    }
    try {
        source = hipcad.objects.includes.process(data.src, data.includes);
    }
    catch (err) {
        logObj.status = 500;
        log.error(err);
        log.warn('controller.object.render', logObj);
        return controller.fail(res, 'Server error.', 500, json);
    }
    try {
        renderFile = await hipcad.openscad.toFile(data.id, source);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.render', logObj);
        return controller.fail(res, 'Server error.', 500, json);
    }
    try {
        render = await hipcad.openscad.render(renderFile);
    }
    catch (err) {
        logObj.status = 500;
        logObj.err = err;
        log.error('controller.object.render', logObj);
        return controller.fail(res, 'Server error.', 500, json);
    }
    log.info('controller.object.render', logObj);
    if (json) {
        res.status(200).json(render);
    }
    else {
        res.redirect(render.stl.replace('./', 'http://openscad.hipcad.com/'));
    }
    return next();
};
controller.login = async function (req, res, next) {
    const json = controller.json(req);
    let username;
    let pwstring;
    let tag;
    let logObj = {
        path: '/user/login',
        tag: '',
        status: 200,
        username: '',
        json: json
    };
    let userobj;
    let tokenObj;
    //tag = tagOutput;
    username = req.body.user;
    pwstring = req.body.pwstring;
    //logObj.tag = tag;
    logObj.username = username;
    try {
        userobj = await hipcad.users.auth(username, pwstring);
    }
    catch (err) {
        logObj.status = 401.1;
        logObj.err = err;
        log.warn('controller.login', logObj);
        return controller.fail(res, 'User login failed', 401.1, json);
    }
    if (!userobj || userobj.error) {
        logObj.status = 401.1;
        logObj.err = userobj.error;
        log.warn('controller.login', logObj);
        return controller.fail(res, userobj.error, 401.1, json);
    }
    tokenObj = {
        id: uuid_1.v4(),
        user: userobj.id,
        tag: tag,
        username: userobj.username,
        expires: (new Date().getTime()) + (7 * 24 * 60 * 60 * 1000) //1 week
    };
    req.session.touch();
    req.session.token = tokenObj;
    log.info('controller.login', logObj);
    res.status(200).json({ success: true });
    return next();
};
controller.logout = async function (req, res, next) {
    const json = controller.json(req);
    let logObj = {};
    let activeSession = false;
    let username;
    let tag;
    //hipcad.tag(req, res, tagUserCb);
    //tag = tagOutput;
    if (req.session && req.session.token) {
        activeSession = true;
        username = req.session.token.username;
        delete req.session.token;
        try {
            await controller.endSession(req);
        }
        catch (err) {
            log.error(err);
        }
    }
    logObj.tag = tag;
    logObj.path = '/user/logout';
    logObj.username = username;
    logObj.activeSession = activeSession;
    log.info('controller.logout', logObj);
    if (json) {
        res.status(200).json({ success: activeSession });
    }
    else {
        res.redirect('/');
    }
    return next();
};
controller.endSession = async function (req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err)
                return reject(err);
            return resolve(true);
        });
    });
};
controller.json = function (req) {
    var json = false;
    if (req.query && req.query.json && req.query.json === 'true') {
        json = true;
    }
    return json;
};
controller.auth = function (req) {
    return new Promise((resolve, reject) => {
        if (req && req.session && req.session.token) {
            if (new Date().getTime() < req.session.token.expires) {
                if (req.session.token.id.length === 36) {
                    return resolve(true);
                }
            }
            else {
                delete req.session.token;
                log.info('Token expired');
                return resolve(false);
            }
        }
        else {
            return reject(`No token`);
        }
    });
};
module.exports = async (pool) => {
    hipcad.users = await require('../users')(pool);
    hipcad.objects = await require('../objects')(pool);
    hipcad.openscad = await require('../openscad')(pool);
    hipcad.tmpl = require('../templates');
    hipcad.mail = new Mail();
    hipcad.recaptcha = require('../recaptcha');
    return { hipcad, controller };
};
//# sourceMappingURL=index.js.map
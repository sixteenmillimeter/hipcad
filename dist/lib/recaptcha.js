'use strict';

const request = require('request');
const recaptcha = {};
const url = 'https://www.google.com/recaptcha/api/siteverify';
let privateKey;

recaptcha.verify = function (response, ip, callback) {
	var postObj = {
			url : url, 
			form: {
				secret : privateKey,
				response: response,
				remoteip: ip
			}
		},
		postResponse = function (err, res, body) {

			if (err) {
				return callback(err);
			}
			try{
				body = JSON.parse(res.body);
			} catch (e) {
				callback('Invalid response');
			}
			if (body.success === true) {
				callback(null, true);
			} else {
				callback('Invalid token');
			}
		};
	request.post(postObj, postResponse)
};

module.exports = function () {
	privateKey = process.env.RECAPTCHA_PRIVATE_KEY;
	return recaptcha;
};
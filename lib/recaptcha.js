var request = require('request'),
	recaptcha = {},
	url = 'https://www.google.com/recaptcha/api/siteverify';

recaptcha.verify = function (privateKey, response, ip, callback) {
	'use strict';
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

module.exports = recaptcha;
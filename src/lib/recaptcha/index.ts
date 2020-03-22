'use strict';

import request from 'request-promise';

const recaptcha : any = {};
const url : string = 'https://www.google.com/recaptcha/api/siteverify';
let privateKey : string = process.env.RECAPTCHA_PRIVATE_KEY;

recaptcha.verify = async function (response : string, ip : string) {
	const postObj = {
		method : 'POST',
		url, 
		form: {
			secret : privateKey,
			response,
			remoteip: ip
		}
	};
	let res : any;
	let body : any;

	try {
		res = await request(postObj);
	} catch (err) {
		throw err;
	}

	try {
		body = JSON.parse(res);
	} catch (e) {
		throw new Error('Invalid response');
	}

	if (body.success === true) {
		return true;
	} else {
		return false;
	}
};

module.exports = recaptcha;
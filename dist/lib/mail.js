'use strict';

const log = require('log')('mail');

const mail = {};
let config;

mail.mandrill = require('mandrill-api/mandrill');

//general send mail function to be expanded upon for specific requirements
mail.send = function (name, email, subject, message, tag, callback) {
	var msg = mail.msg(name, email, subject, message, mail.FROM, mail.FROMNAME, mail.REPLYTO, tag),
	query = {
		"message": msg,
		"async": false,
		"ip_pool": null,
		"send_at": null
	};
	log.info('query', query);
	mail.client.messages.send(query, function(result) {
		log.info('Sent email to ' + name + ' <' + email + '>');
		log.info('result', result);
		if (typeof callback !== 'undefined') return callback({success: true, result: result});
	}, function (e) {
		log.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		log.error(e);
		if (typeof callback !== 'undefined') return callback({success: false, err: e});
	});
};

mail.msg = function (name, email, subject, message, from, fromName, replyTo, tag) {
	return {
		"html": null,
		"text": message,
		"subject": subject,
		"from_email": from,
		"from_name": fromName,
		"to": [{
			"email" : email,
			"name" : name
		}],
		"headers": {
			"Reply-To": replyTo
		},
		"important": false,
		"track_opens": null,
		"track_clicks": null,
		"auto_text": null,
		"auto_html": null,
		"inline_css": null,
		"url_strip_qs": null,
		"preserve_recipients": null,
		"bcc_address": null,
		"tracking_domain": null,
		"signing_domain": null,
		"merge": true,
		"global_merge_vars": [],
		"merge_vars": [],
		"tags": [tag],
		"google_analytics_domains": [],
		"google_analytics_campaign": null,
		"metadata": null,
		"recipient_metadata": [],
		"attachments": [],
		"images": []
	};
};

module.exports = function () {
	
	/*mail.KEY = config.mandrill_key;
	mail.FROM = config.mail_from;
	mail.FROMNAME = config.mail_from_name;
	mail.REPLYTO = config.mail_reply_to;
	mail.client = new mail.mandrill.Mandrill(mail.KEY);*/

	return mail;
};
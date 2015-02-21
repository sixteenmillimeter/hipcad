//mail.js

var mail = {},
	handlebars = require('handlebars');
mail.mandrill = require('mandrill-api/mandrill');
mail.KEY = '_65mBuyPhAHJPvLhuHZGmw';
mail.FROM = 'accounts@hipcad.com';
mail.FROMNAME = 'hipcad';
mail.REPLYTO = 'Reply to <contact@hipcad.com>';

mail.client = new mail.mandrill.Mandrill(mail.KEY);
//general send mail function to be expanded upon for specific requirements
mail.send = function (name, email, subject, message, tag, callback) {
	var msg = {
		"html": null,
		"text": message,
		"subject": subject,
		"from_email": mail.FROM,
		"from_name": mail.FROMNAME,
		"to": [{
			"email" : email,
			"name" : name
		}],
		"headers": {
			"Reply-To": mail.REPLYTO
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
	},
	query = {
		"message": msg, 
		"async": false, 
		"ip_pool": null, 
		"send_at": null
	};

	mail.client.messages.send(query, function(result) {
		console.log('Sent email to ' + name + ' <' + email + '>');
		console.log(result);
		callback();
	}, function(e) {
		console.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});
};

mail.test = function () {
	console.log('Service: Mandrill');
	console.log('From address: ' + mail.FROM);
};

module.exports = mail;
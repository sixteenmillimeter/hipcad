var cfg = {},
	fs = require('fs'),
	imp = JSON.parse(fs.readFileSync('/var/cfg/hipcad.com/cfg.json')),
	keys = Object.keys(imp);

//defaults
cfg = {
	port : 6445,
	cookie_secret : '3e712de6-b63f-4fe5-a1a5-61b92e6bcb79',
	session_secret : '324f1231-12fc-4fa5-8e30-3fb6efa361a6',

	logs : '/var/log/hipcad/',
	couch_db : 'http://localhost:5984',
	db_prefix : 'hipcad_',

	redis_port: 6379,
  	redis_url: '127.0.0.1',

	RECAPTCHA_PUBLIC_KEY  : '',
    RECAPTCHA_PRIVATE_KEY : '',

    mandrill_key : '',
    mail_from : 'hi@hipcad.com',
    mail_from_name : 'hipcad.com',
    mail_reply_to : 'hi@hipcad.com'
};

for (var i = 0; i < keys.length; i++) {
	cfg[keys[i]] = imp[keys[i]];
}

module.exports = cfg;

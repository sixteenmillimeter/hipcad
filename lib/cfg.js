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

	RECAPTCHA_PUBLIC_KEY  : '6Le-iRITAAAAALw-YpT23U8-SSD5DGZnUOSukorI',
    RECAPTCHA_PRIVATE_KEY : '6Le-iRITAAAAALkHMAAm2eZhfNR5fveoHHtp0Qa0',

    mandrill_key : '_65mBuyPhAHJPvLhuHZGmw',
    mail_from : 'hi@hipcad.com',
    mail_from_name : 'hipcad.com',
    mail_reply_to : 'hi@hipcad.com',

	twt_c_k : 'GD1hAQmTZZzZbPsyneiGT6OHM',
	twt_c_s : '	ogCjabBTzjGzWVxsNZmK6qQwSBQ6oxCq11lCvGvzP1wy2Ono6o',
	twt_a_t_k : '4754546134-CymcFj0xlxHDNsx076tS5qpgpudjDV0EA9hJxmM',
	twt_a_t_s : '4aeTzxCz42JWS4Rt9gGE9xZWMKMWPgG5qjQIx2GDYcMQW'
};

for (var i = 0; i < keys.length; i++) {
	cfg[keys[i]] = imp[keys[i]];
}

module.exports = cfg;

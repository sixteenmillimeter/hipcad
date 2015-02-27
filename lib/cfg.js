var cfg = {},
	fs = require('fs'),
	imp = JSON.parse(fs.readFileSync('/var/cfg/hipcad.com/cfg.json')),
	keys = Object.keys(imp);

//defaults
cfg = {
	port : 6445
};

for (var i = 0; i < keys.length; i++) {
	cfg[keys[i]] = imp[keys[i]];
}

module.exports = cfg;
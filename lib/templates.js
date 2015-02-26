var tmpl = {},
	fs = require('fs');

tmpl.home = fs.readFileSync('views/index.html', 'utf8');
tmpl.err = fs.readFileSync('views/err.html', 'utf8');
tmpl.user = fs.readFileSync('views/user.html', 'utf8');
tmpl.editor = '';

tmpl.tests = function () {
	//console.dir(tmpl);
};

module.exports = tmpl;
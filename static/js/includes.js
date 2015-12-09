var include = {};
include.store = {};

include.existsName = function (path, cb) {
	var cleanName = path.replace('/', '').trim(),
		obj = {
			url : '/' + cleanName + '?json=true',
			type: 'GET',
			success : function (res) {
				console.dir(res);
				if (cb) cb(res);
			},
			error : function (err) {
				console.log(err);
			}
	};
	$.ajax(obj);
};

include.process = function (source, callback) {
	'use strict';
	var lines = include.parse(source),
		paths = lines.map(function (elem) {
			return include.toPath(elem);
		}),
		count = -1,
		next = function () {
			count++;
			if (count === lines.length) {
				//
				callback(source);
			} else {
				if (paths[count] !== undefined) {
					include.get(paths[count], function (res) {
						if (res.object) {
							source = source.replace(lines[count], '//' + lines[count] + '\n' + res.object.src + '\n');
						}
						next();
					});
				} else {
					next();
				}
			}
		};
	next();
};

include.parse = function (a) {
	'use strict';
	var lines = a.split('\n'),
		reInclude = /(include <)+(.*)+(>;)/g,
		inc = lines.filter(function (elem) {
			if (elem.indexOf('include') !== -1
			&& elem.indexOf('<') !== -1
			&& elem.indexOf('>') !== -1
			&& elem.indexOf(';') !== -1) {
				return elem;
			}
		});
	return inc;
};

include.toPath = function (str) {
	'use strict';
	var re1 = /(include)/g,
		re2 = /(include )/g,
		re3 = /([<>;])/g,
		slashes;
	str = str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
	if (str[0] === '/') {
		str = str.substring(1);
	}
	if (str[str.length - 1] === '/') {
		str = str.slice(0, -1);
	}
	slashes = (str.match(new RegExp('/', 'g')) || []).length;
	if (slashes) {

	}
	return str.trim();
};

include.get = function (cleanPath, callback) {
	'use strict';
	if (typeof include.store[cleanPath] !== 'undefined') {
		return callback(include.store[cleanPath]);
	}
	objects.get(cleanPath, function (err, res) {
		if (err) {
			console.error(err);
			return callback('');
		}
		console.dir(res);
		include.store[cleanPath] = res;
		callback(res);
	})
};

/*global console, $, CodeMirror */

'use strict';

OpenJsCad.AlertUserOfUncaughtExceptions();
var version = '0.017 (2014/01/07)';
var me = document.location.toString().match(/^file:/)?'web-offline':'web-online'; // me: {cli, web-offline, web-online}
var browser = 'unknown';
if(navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i)){
	browser = RegExp.$1.toLowerCase();
}

var editor,
	viewer,
	gProcessor;

var onload = function () {
	'use strict'
	var view = document.getElementById('viewport'),
		txt = document.getElementById('code'),
		data = localStorage.getItem('current'),
		cfg = {
			lineNumbers: true,
			styleActiveLine: true,
			matchBrackets: true,
			theme: 'neat',
			mode: 'lua'
		};

	if (typeof pageData.session !== 'undefined' && pageData.session === true) {
		$('.menu li').removeAttr('disabled');
	}

	txt.height = window.innerHeight;
	if (data !== null) {
		txt.value = data;
	}

	editor = CodeMirror.fromTextArea(txt, cfg);
	editor.setSize(undefined, txt.height);
	editor.on('change', onchange);

	menu.init();

	$(window).on('hashchange', function() {
	  alert(document.location.hash);
	});

	gProcessor = new OpenJsCad.Processor(document.getElementById('viewer'));

	gProcessor.onchange = Onchange;

	if (data !== null) {
		parseSCAD(data);
	}
};

var onchange = function (cm, change) {
	//console.log(cm);
	//console.log(change);
	var body = editor.getValue(),
		line = editor.getLine(change.to.line),
		cha = change.to.ch;
	if (!users.mode) {
		localStorage.setItem('current', body);
		//includes
		parseSCAD(body);
	}
};

//for triggering events when
var isEditing = function (line, char) {
	var area = null;
	if (typeof line !== undefined && line.indexOf('include') !== -1) {
		if (line.indexOf('<') < char
			&& (line.indexOf('>') === -1 || line.indexOf('>') > char)
		) {
			area = 'include';
		}
	}
	return area;
};

var menu = {};
menu.user = false;
menu.init = function () {
	'use strict';
	if (pageData && pageData.user) {
		menu.user = true;
	} else {
		menu.user = false;
	}
	$('#menuNew').on('click', menu.newAction);
};
menu.newAction = function () {
	var str;
	if (menu.user) {
		str = '';
		bootbox.prompt(str, function (val) {
			objects.create(pageData.username + '/' + val, function (err, doc) {
				//
			});
		});
	} else {
		str = 'To create or save objects, you must be logged in. <a href="#login">Login</a> or <a href="#signup">signup!</a>';
		bootbox.alert(str);
	}
};

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

include.find = function (a) {
	'use strict';
	var lines = a.split('\n'),
		reInclude = /(include <)+(.*)+(>;)/g,
		inc = [];
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('include') !== -1
		&& lines[i].indexOf(';') !== -1) {
			
			inc.push(lines[i].match(/<[^>]*>/g)[0].replace('<','').replace('>', ''));
		}
	}
	if (inc.length !== 0) {
		console.dir(inc);
	}
	//$.ajax(obj);
};

include.toPath = function (str) {
	'use strict';
	var re1 = /(include)/g,
		re2 = /(include )/g,
		re3 = /([<>;])/g;
	return str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
};

var objects = {};

objects.exists = function (path, callback) {
	'use strict';
	var slashes = (path.match(new RegExp('/', 'g')) || []).length;
	if (slashes === 0) {
		objects.existsName(path);
	} else if (slashes === 1 || path.trim()[0] === '/') {
		objects.existsName(path);
	} else if ((slashes === 1 || path.trim()[0] !== '/') || slashes === 2) {

	}

	callback();
};

objects.existsName = function (path, cb) {
	var cleanName = path.replace('/', '').trim(),
		obj = {
			url : '/' + cleanName + '?json=true',
			type: 'GET',
			data : {
				source : ''
			},
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

objects.get = function (path, callback) {
	'use strict';

};

objects.create = function (path, callback) {
	'use strict';
	var obj = {
		url : path + '?json=true',
		type : 'POST',
		success : function (data) {
			console.dir(data);
		}, 
		error : function (err) {
			console.error(err);
		}
	};
	$.ajax(obj);
};

var users = {};

users.get = function (user, callback) {
	'use strict';
	var obj = {
		url : '/' + user + '?json=true',
		type: 'GET',
		success : function (data) {
			callback(data);
		},
		error : function (err) {
			console.error(err);
		}
	};
	$.ajax(obj);
};
users.mode = false;
users.layout = function (data) {
	'use strict';
	var onclick;
	user.mode = true;
};


//////////////////////////////////////////////////

//Client code
var gCurrentFile = null;
var gProcessor = null;

var gCurrentFiles = [];       // linear array, contains files (to read)
var gMemFs = [];              // associated array, contains file content in source gMemFs[i].{name,source}
var gMemFsCount = 0;          // async reading: count of already read files
var gMemFsTotal = 0;          // async reading: total files to read (Count==Total => all files read)
var gMemFsChanged = 0;        // how many files have changed
var gRootFs = [];             // root(s) of folders 

var gTime = 0;
	
var _includePath = './';
	
var Onchange = function () {
	if (gTime !== 0) {
		var end = +new Date();
		Log('Generated in ' + (end - gTime) + ' ms')
		gTime = 0;
	}
};



var parseSCAD = function (source) {
	gProcessor.setDebugging(false); 
	gTime = +new Date();
	gProcessor.clearViewer();
	var fn = 'livetext.scad';
  	var editorSource = source;
	if(!editorSource.match(/^\/\/!OpenSCAD/i)) {
		editorSource = "//!OpenSCAD\n"+editorSource;
	}
	source = openscadOpenJscadParser.parse(editorSource);
	if (0) {
		source = "// OpenJSCAD.org: scad importer (openscad-openjscad-translator) '"+ fn + "'\n\n" + source;
	}
	if (gMemFs[fn] === undefined) { 
		gMemFs[fn] = {
			lang: "scad",
			lastModifiedDate: null,
			name: fn,
			size: null,
			source: "",
			type: "",
			webkitRelativePath: "",
			};
	}
    gMemFs[fn].source = source;
    gProcessor.setJsCad(source, fn);
};

var Build = function () {
	parseSCAD(editor.getValue());

};

var Log = function (message) {
	var cons = $('#console'),
		log = cons.val() + message + '\n';
	cons.val(log);
	cons[0].scrollTop = cons[0].scrollHeight;
	console.log(log);
};

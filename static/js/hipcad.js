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

var onready= function () {
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
		$('#menuUserAction').attr('onclick', 'logout();').text('Logout');
	}

	txt.height = window.innerHeight;
	if (data !== null) {
		if (typeof pageData.type !== 'undefined' 
			&& (pageData.type === 'object'
			|| pageData.type === 'user')
		) {
			cfg.readOnly = true;
			console.log('Setting to readonly');
		} else {
			txt.value = data;
		}
	}

	editor = CodeMirror.fromTextArea(txt, cfg);
	editor.setSize(undefined, txt.height);

	if (typeof pageData.type !== 'undefined' 
		&& (pageData.type === 'object'
		|| pageData.type === 'user')
		) {

	} else {
		editor.on('change', onchange);
	}
	
	menu.init();

	$(window).on('hashchange', hashAction);
	hashAction();

	gProcessor = new OpenJsCad.Processor(document.getElementById('viewer'));
	gProcessor.onchange = Onchange;

	Build();
};

var hashAction = function () {
	'use strict';
	var action = document.location.hash;
		bootbox.hideAll();
		if (action === '#login') {
			login();
		} else if (action === '#signup') {
			signup();
		}
	}

var onchange = function (cm, change) {
	//console.log(cm);
	//console.log(change);
	var body = editor.getValue();//,
		//lineno = change.to.line || 0,
		//line = editor.getLine(lineno),
		//cha = change.to.ch || 0;
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
	if (pageData && pageData.session) {
		menu.user = true;
	} else {
		menu.user = false;
	}
	$('#menuNew').on('click', menu.newAction);
	$('#menuOpen').on('click', menu.openAction);
	$('#menuSave').on('click', menu.saveAction);
	$('#menuHome').on('click', menu.homeAction);
};
menu.newAction = function () {
	var str;
	bootbox.hideAll();
	if (menu.user) {
		str = 'Name of new object';
		bootbox.prompt(str, function (val) {
			if (val !== null && val !== undefined && val !== '') {
				objects.create(pageData.username + '/' + val, '', function (err, doc) {
					if (err) {
						return console.error(err);
					}
					document.location = '/' + pageData.username + '/' + val;
				});
			}
		});
	} else {
		str = 'To create or save objects, you must be logged in. <a href="#login">Login</a> or <a href="#signup">sign up!</a>';
		bootbox.alert(str);
	}
};

menu.openAction = function () {
	'use strict';
	if (pageData.session) {
		document.location = '/' + pageData.username;
	}
};

menu.saveAction = function () {
	'use strict';
	if (!pageData.session) {
		return false;
	}
	var url = document.location.href,
		slashes = url.split('/');
	if (slashes.length === 1) {

	}
};

menu.homeAction = function () {
	'use strict';
	return document.location = '/';
}

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
				if (elem.split('<')[1].indexOf('/') !== -1){
					return elem;
				}
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

objects.existsName = function (cleanPath, cb) {
	var obj = {
			url : '/' + cleanPath + '?json=true',
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

objects.get = function (cleanPath, cb) {
	'use strict';
	var obj = {
		url : '/' + cleanPath + '?json=true',
		type: 'GET',
		success : function (res) {
			console.dir(res);
			if (cb) cb(null, res);
		},
		error : function (err) {
			console.log(err);
			if(cb) cb(err);
		}
	};
	$.ajax(obj);
};
objects.create = function (path, source, callback) {
	'use strict';
	var obj = {
		url : path + '?json=true',
		type : 'POST',
		data : {
			source : source
		},
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
			callback(null, data);
		},
		error : function (err) {
			console.error(err);
			callback(err);
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

var login = function () {
	'use strict';
	bootbox.dialog({
            title: "Login",
            message: 
            	'<div class="row">  ' +
                	'<div class="col-md-12"> ' +
                		'<form class="form-horizontal" id="login"> ' +
                			'<div class="form-group col-md-8" style="margin: 0 auto; float: none;"> ' +
                				'<input id="user" name="user" type="text" placeholder="Username" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<input id="pwstring" name="pwstring" type="password" placeholder="Password" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<div id="signupLink">Don\'t have an account? <a href="#signup">Sign up!</a>' +
                			'</div> ' +
                		'</form> </div> </div>',
            buttons: {
                success: {
                    label: "Login",
                    className: "btn-success",
                    callback: function () {
                    	var query = {
                    		url : '/user/login?json=true',
                    		type : 'POST',
                    		data : {
                    			user : $('#user').val(),
                    			pwstring : $('#pwstring').val()
                    		},
                    		success : function () {
                    			bootbox.hideAll();
                    			document.location = '/';
                    		},
                    		error : function () {
                    			//handle error
                    		}
                    	};
                        $.ajax(query);
                        return false;
                    }
                }
            }
        }
    );
};

var logout = function () {
	'use strict';
	var query = {
		url : '/user/logout?json=true',
		type : 'POST',
		success : function () {
			document.location = '/';
		},
		error : function () {}
	};
	$.ajax(query);
};

var signup = function () {
	'use strict';
	var recaptcha = '';
	if (pageData.recaptcha){
		recaptcha = decodeURIComponent(pageData.recaptcha);
	}
	bootbox.dialog({
            title: "Create an account",
            message: 
            	'<div class="row">  ' +
                	'<div class="col-md-12"> ' +
                		'<form class="form-horizontal" id="signup"> ' +
                			'<div class="form-group col-md-8" style="margin: 0 auto; float: none;"> ' +
                			 '<input id="signupEmail" name="email" type="text" placeholder="Email address" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<input id="signupUser" name="signupUser" type="text" placeholder="Username" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<input id="signupPwstring" name="pwstring" type="password" placeholder="Password" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<input id="signupPwstring2" name="signupPwstring2" type="password" placeholder="Password again" class="form-control input-md" style="margin-bottom: 20px;"> ' +
                				'<script src="https://www.google.com/recaptcha/api.js"></script>' +
                				'<div class="g-recaptcha" data-sitekey="6Le-iRITAAAAALw-YpT23U8-SSD5DGZnUOSukorI"></div>' + 
                				'<div id="loginLink">Already have an account? <a href="#login">Login</a>' +
                			'</div> ' +
                		'</form> </div> </div>',
            buttons: {
                success: {
                    label: "Sign up",
                    className: "btn-success",
                    callback: function () {

                    	if ($('#signupEmail').val() === '') {
                    		return false;
                    	}



                    	var query = {
                    		url : '/user/create?json=true',
                    		type : 'POST',
                    		data : {
                    			email : $('#signupEmail').val(),
                    			username : $('#signupUser').val(),
                    			pwstring : $('#signupPwstring').val(),
                    			pwstring2 : $('#signupPwstring2').val(),
                    			'g-recaptcha-response' : $('#g-recaptcha-response').val()
                    		},
                    		success : function () {
                    			bootbox.hideAll();
                    			document.location = '/';
                    		},
                    		error : function (err) {
                    			if (err) {
                    				console.log(err.item);
                    				console.log(err.msg);
                    			}
                    		}
                    	};
                        $.ajax(query);
                        return false;
                    }
                }
            }
        }
    );
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
	include.process(source, function (source) {
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
	});
};

var Build = function () {
	parseSCAD(editor.getValue());

};

var Log = function (message) {
	var cons = $('#console'),
		log = cons.val() + message + '\n';
	cons.val(log);
	cons[0].scrollTop = cons[0].scrollHeight;
	console.log(message);
};

$(document).ready(onready);

'use strict';

if (typeof pageData === 'undefined') {
	var pageData : any = {};
}

//@ts-ignore
OpenJsCad.AlertUserOfUncaughtExceptions();

const version : string = '0.3.0 (2020/03/21)';
const me : string  = document.location.toString().match(/^file:/)?'web-offline':'web-online'; // me: {cli, web-offline, web-online}
let browser : string = 'unknown';
if (navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i)){
	browser = RegExp.$1.toLowerCase();
}

let editor : any;
let viewer : any;

function onready () {
	const view : HTMLElement = document.getElementById('viewport');
	const txt : HTMLTextAreaElement = document.getElementById('code') as HTMLTextAreaElement;
	let data : any = localStorage.getItem('current');
	const cfg : any = {
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		theme: 'neat',
		mode: 'lua',
		extraKeys: {"Ctrl-Q": function(cm : any){ cm.foldCode(cm.getCursor()); }},
		foldGutter: true,
		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
	};

	if (typeof pageData !== 'undefined' && typeof pageData.session !== 'undefined' && pageData.session === true) {
		$('.menu li').removeAttr('disabled');
		$('#menuUserAction').attr('onclick', 'logout();').text('Logout');
	}

	//@ts-ignore
	txt.height = window.innerHeight;
	
	if (typeof pageData !== 'undefined'
		&& typeof pageData.type !== 'undefined'
		&& (pageData.type === 'object'
		|| pageData.type === 'user')
	) {
		cfg.readOnly = true;
		console.log('Setting to readonly');
		$('#menuSave').attr('disabled', 'disabled');
		$('#menuClear').attr('disabled', 'disabled');
	} else {
		if (data !== null) {
			txt.value = data;
		}
	}

	if (pageData.owner
		&& pageData.owner.username === pageData.username
		&& pageData.type !== 'user') {
		cfg.readOnly = false;
		$('#menuSave').attr('disabled', null);
		$('#menuClear').attr('disabled', null);
	}

	editor = CodeMirror.fromTextArea(txt, cfg);
	//@ts-ignore
	editor.setSize(undefined, txt.height);

	if (typeof pageData.type !== 'undefined'
		&& (pageData.type === 'object'
		|| pageData.type === 'user')
		) {
		if (pageData.owner
			&& pageData.owner.username === pageData.username
			&& pageData.type === 'object') {
			editor.on('change', onChange);
		}
	} else {
		editor.on('change', onChange);
	}

	menu.init();

	$(window).on('hashchange', hashAction);
	hashAction();

	//@ts-ignore
	gProcessor = new OpenJsCad.Processor(document.getElementById('viewer'));
	gProcessor.onchange = gProcessorOnChange;

	Build();
}

function hashAction () {
	const action : string = document.location.hash;
	bootbox.hideAll();
	if (action === '#login') {
		login();
	} else if (action === '#signup') {
		signup();
	}
}

function onChange (cm : any, change : any) {
	//console.log(cm);
	//console.log(change);
	const body : string = editor.getValue();//,
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
 function isEditing (line : string, char : number) : string {
	let area : string = null;
	if (typeof line !== undefined && line.indexOf('include') !== -1) {
		if (line.indexOf('<') < char
			&& (line.indexOf('>') === -1 || line.indexOf('>') > char)
		) {
			area = 'include';
		}
	}
	return area;
};

function save () {
	const query : any = {
		url : document.location.href + '?json=true',
		type: 'PUT',
		data : {
			source: editor.getValue()
		},
		success : function (data : any) {
			console.log(data);
		},
		error : function (err : Error) {
			console.log(err);
		}
	};
	$.ajax(query);
};

const menu : any = {};

menu.user = false;
menu.init = function () {
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
	let str : string;
	bootbox.hideAll();
	if (menu.user) {
		str = 'Name of new object';
		bootbox.prompt(str, function (val) {
			if (val !== null && val !== undefined && val !== '') {
				objects.create(pageData.username + '/' + val, '', function (err : Error, doc : any) {
					if (err) {
						return console.error(err);
					}
					document.location.href = '/' + pageData.username + '/' + val;
				});
			}
		});
	} else {
		str = 'To create or save objects, you must be logged in. <a href="#login">Login</a> or <a href="#signup">sign up!</a>';
		bootbox.alert(str);
	}
};

menu.openAction = function () {
	if (pageData.session) {
		document.location.href = '/' + pageData.username;
	}
};

menu.saveAction = function () {
	if (!pageData.session) {
		return false;
	} else {
		if (pageData.owner
			&& pageData.owner.username === pageData.username
			&& pageData.type !== 'user') {
			save();
		}
	}
};

menu.homeAction = function () {
	return document.location.href = '/';
};

const include : any = {};

include.store = {};
include.existsName = function (path : string, cb : Function) {
	const cleanName : string = path.replace('/', '').trim();
	const obj : any = {
		url : '/' + cleanName + '?json=true',
		type: 'GET',
		success : function (res : any) {
			console.dir(res);
			if (cb) cb(res);
		},
		error : function (err : Error) {
			console.log(err);
		}
	};
	$.ajax(obj);
};

include.process = function (source : string, callback : Function) {
	const lines : any[] = include.parse(source);
	const paths : any[] = lines.map(function (elem : any) {
		return include.toPath(elem);
	});
	let count = -1;
	const next = function () {
		count++;
		if (count === lines.length) {
			//
			callback(source);
		} else {
			if (paths[count] !== undefined) {
				include.get(paths[count], function (res : any) {
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

include.parse = function (a : string) : string[] {
	const lines : string[] = a.split('\n');
	const reInclude : RegExp = /(include <)+(.*)+(>;)/g;
	const inc : string[] = lines.filter(function (elem : string) {
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

include.toPath = function (str : string) : string {
	const re1 : RegExp = /(include)/g;
	const re2 : RegExp = /(include )/g;
	const re3 : RegExp = /([<>;])/g;
	let slashes : any;
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

include.get = function (cleanPath : string, callback : Function) {
	if (typeof include.store[cleanPath] !== 'undefined') {
		return callback(include.store[cleanPath]);
	}
	objects.get(cleanPath, function (err : Error, res : any) {
		if (err) {
			console.error(err);
			return callback('');
		}
		console.dir(res);
		include.store[cleanPath] = res;
		callback(res);
	});
};

const objects : any = {};

objects.exists = function (path : string, callback : Function) {
	const slashes : number = (path.match(new RegExp('/', 'g')) || []).length;
	if (slashes === 0) {
		objects.existsName(path);
	} else if (slashes === 1 || path.trim()[0] === '/') {
		objects.existsName(path);
	} else if ((slashes === 1 || path.trim()[0] !== '/') || slashes === 2) {

	}
	callback();
};

objects.existsName = function (cleanPath : string, cb : Function) {
	const obj : any = {
		url : '/' + cleanPath + '?json=true',
		type: 'GET',
		data : {
			source : ''
		},
		success : function (res : any) {
			console.dir(res);
			if (cb) cb(res);
		},
		error : function (err : Error) {
			console.log(err);
		}
	};
	$.ajax(obj);
};

objects.get = function (cleanPath : string, cb : Function) {
	const obj : any = {
		url : '/' + cleanPath + '?json=true',
		type: 'GET',
		success : function (res : any) {
			console.dir(res);
			if (cb) cb(null, res);
		},
		error : function (err : Error) {
			console.log(err);
			if(cb) cb(err);
		}
	};
	$.ajax(obj);
};

objects.create = function (path : string, source : string, callback : Function) {
	const obj : any = {
		url : path + '?json=true',
		type : 'POST',
		data : {
			source : source
		},
		success : function (data : string) {
			console.dir(data);
			document.location.href = path;
		},
		error : function (err : Error) {
			console.error(err);
		}
	};
	$.ajax(obj);
};

const users : any = {};

users.get = function (user : string, callback : Function) {
	const obj : any = {
		url : '/' + user + '?json=true',
		type: 'GET',
		success : function (data : any) {
			callback(null, data);
		},
		error : function (err : Error) {
			console.error(err);
			callback(err);
		}
	};
	$.ajax(obj);
};
users.mode = false;
users.layout = function (data : string) {
	let onclick : any;
	users.mode = true;
};

 function login () {
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
                    			document.location.href = '/';
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
}

function logout  () {
	const query : any = {
		url : '/user/logout?json=true',
		type : 'POST',
		success : function () {
			document.location.href = '/';
		},
		error : function () {}
	};
	$.ajax(query);
}

function signup () {
	let recaptcha : string = '';
	if (pageData.recaptcha){
		recaptcha = decodeURIComponent(pageData.recaptcha);
	}
	setTimeout(function () {
		const options : any = {
			//@ts-ignore
			sitekey: RECAPTCHA_SITE_KEY
		};
		//@ts-ignore
		hcaptcha.render('signup-hcaptcha', options);
	}, 100);
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
                				'<div id="signup-hcaptcha"></div>' +
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

                    	const query : any = {
                    		url : '/user/create?json=true',
                    		type : 'POST',
                    		data : {
                    			email : $('#signupEmail').val(),
                    			username : $('#signupUser').val(),
                    			pwstring : $('#signupPwstring').val(),
                    			pwstring2 : $('#signupPwstring2').val(),
                    			'g-recaptcha-response' : grecaptcha.getResponse()
                    		},
                    		success : function () {
                    			bootbox.hideAll();
                    			document.location.href = '/';
                    		},
                    		error : function (err : any) {
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
}

//////////////////////////////////////////////////

//Client code
let gCurrentFile : string = null;
let gProcessor : any = null;

let gCurrentFiles : any[] = [];       // linear array, contains files (to read)
let gMemFs  : any = {};              // associated array, contains file content in source gMemFs[i].{name,source}
let gMemFsCount : number = 0;          // async reading: count of already read files
let gMemFsTotal : number = 0;          // async reading: total files to read (Count==Total => all files read)
let gMemFsChanged : number = 0;        // how many files have changed
let gRootFs : any[] = [];             // root(s) of folders

let gTime : number = 0;

let _includePath : string = './';

function gProcessorOnChange () {
	let end : number;
	if (gTime !== 0) {
		end = +new Date();
		Log('Generated in ' + (end - gTime) + ' ms')
		gTime = 0;
	}
}

function parseSCAD (source : string) {
	gProcessor.setDebugging(false);
	gTime = +new Date();
	gProcessor.clearViewer();
	include.process(source, function (source : string) {
		var fn = 'livetext.scad';
	  	var editorSource = source;
		if(!editorSource.match(/^\/\/!OpenSCAD/i)) {
			editorSource = "//!OpenSCAD\n"+editorSource;
		}
		//@ts-ignore
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
}

function Build () {
	parseSCAD(editor.getValue());

}

function Log (message : string) {
	const cons : any = $('#console');
	const log : string = cons.val() + message + '\n';
	cons.val(log);
	cons[0].scrollTop = cons[0].scrollHeight;
	console.log(message);
}

$(document).ready(onready);
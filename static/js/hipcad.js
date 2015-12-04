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
	var view = document.getElementById('viewport'),
		txt = document.getElementById('code'),
		data = localStorage.getItem('current'),
		cfg = {
			lineNumbers: true,
			styleActiveLine: true,
			matchBrackets: true,
			theme: 'neat',
			mode: 'OpenSCAD'
		};

	txt.height = window.innerHeight;
	if (data !== null) {
		txt.value = data;
	}

	editor = CodeMirror.fromTextArea(txt, cfg);
	editor.setSize(undefined, txt.height);
	editor.on('change', onchange);

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
	localStorage.setItem('current', body);
	console.log(line);
	console.log(cha);
	if (isEditing(line, cha) === 'include') {
		include.exists('/matt');
	}
	parseSCAD(body);
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

var include = {};
include.store = {};
include.exists = function (path) {
	var slashes = (path.match(new RegExp('/', 'g')) || []).length;
	if (slashes === 0) {
		include.existsName(path);
	} else if (slashes === 1 || path.trim()[0] === '/') {
		include.existsName(path);
	} else if ((slashes === 1 || path.trim()[0] !== '/') || slashes === 2) {

	}
};

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

include.parse = function (a) {
	var lines = a.split('\n'),
		reInclude = /(include <)+(.*)+(>;)/g,

		inc = lines.filter(function (elem) {
			if (elem.indexOf('include') !== -1
			&& elem.indexOf(';') !== -1) {
				return elem;
			}
		});
		inc = inc.map(include.toPath);
		console.dir(inc);
	//$.ajax(obj);
};

include.toPath = function (str) {
	var re1 = /(include)/g,
		re2 = /(include )/g,
		re3 = /([<>;])/g;
		str = str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
		if (str[0] === '/') {

		}
		if (str[str.length - 1] === '/') {

		}
	return str;
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

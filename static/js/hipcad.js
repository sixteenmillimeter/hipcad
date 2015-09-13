/*global console, $, CodeMirror */

'use strict';

OpenJsCad.AlertUserOfUncaughtExceptions();

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
			mode: 'clike'
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
		/*
		b = a.match(/\(/g),
		c = a.match(/\)/g),
		d = a.match(/\{/g),
		e = a.match(/\}/g),
		f = a.match(/\[/g),
		g = a.match(/\]/g),
		h = a.match(/\;/g);*/

		//if (h !== null) {
			//if ((b !== null && c !== null) && (b.length === c.length)) {
				//if ((d === null && e === null) || (d.length === e.length)) {
					//if ((f === null && g === null) || (f.length === g.length)) {
						//includes(body);
					//}
				//}
			//}
		//}
		if (isEditing(line, cha) === 'include') {
			include.exists('/matt');
		}
		console.log(isEditing(line, cha));
		parseSCAD(body);
};

//for triggering events when
var isEditing = function (line, char) {
	var area = null;
	if (line.indexOf('include') !== -1) {
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

include.find = function (a) {
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
	var re1 = /(include)/g,
		re2 = /(include )/g,
		re3 = /([<>;])/g;
	return str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
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

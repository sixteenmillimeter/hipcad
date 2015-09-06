/*global console, $, CodeMirror */

'use strict';

var editor,
	onload;

onload = function () {
	var view = document.getElementById('viewport'),
		txt = document.getElementById('code');
	txt.height = window.innerHeight;
	//var data = localStorage.getItem("compact");
	//if (data !== null) {
		//txt.value = compact.data;
	//}
	editor = CodeMirror.fromTextArea(txt, {
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		theme: 'monokai',
		mode: 'lua'
	});

	editor.setSize(undefined, txt.height);

	editor.on('change', onchange);
};

var onchange = function (cm, change) {
	//console.log(cm);
	//console.log(change);
	var body = editor.getValue(),
		line = editor.getLine(change.to.line),
		cha = change.to.ch;
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
		console.log(isEditing(line, char));
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

var editor,
	onload = function () {
	var view = document.getElementById('viewport');
	var txt = document.getElementById("code");
	txt.height = window.innerHeight;
	//var data = localStorage.getItem("compact");
	//if (compact.data !== null) {
		//compact.txt.value = compact.data;
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
	console.log(cm);
	console.log(change);
	var body = editor.getValue(),
		line = editor.getLine(change.to.line),
		char = change.to.ch;
	console.log(line);
	console.log(char);
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
		console.log(isEditing(line, char));
};

//for triggering events when
var isEditing = function (line, char) {
	var area = null;
	if (line.indexOf('include') !== -1) {
		area = 'includes';
		if (line.indexOf('<') < char || line.indexOf('>') < char) {
			area = null;
		}
	}
	return area;
};

var includes = function (a) {
	var lines = a.split('\n'),
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

var onload = function () {
	var view = document.getElementById('viewport');
	var txt = document.getElementById("code");
	txt.height = window.innerHeight;
	//var data = localStorage.getItem("compact");
	//if (compact.data !== null) {
		//compact.txt.value = compact.data;
	//}
	var editor = CodeMirror.fromTextArea(txt, {
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		//theme: 'monokai',
		mode: 'lua'
	});

	editor.setSize(undefined, txt.height);

	editor.on('change', function (cm, change) {
		var a = editor.getValue(),

		b = a.match(/\(/g),
		c = a.match(/\)/g),
		d = a.match(/\{/g),
		e = a.match(/\}/g),
		f = a.match(/\[/g),
		g = a.match(/\]/g),
		h = a.match(/\;/g);

		//if (h !== null) {
			//if ((b !== null && c !== null) && (b.length === c.length)) {
				//if ((d === null && e === null) || (d.length === e.length)) {
					//if ((f === null && g === null) || (f.length === g.length)) {
						includes(a);
					//}
				//}
			//}
		//}
	});
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

	$.ajax(obj);

};

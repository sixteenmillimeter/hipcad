var gulp = require('gulp'),
  less = require('gulp-less'),
  concat = require('gulp-concat'),
  minify = require('gulp-minify');


gulp.task('default', ['less']);

var scripts = [
	'./static/js/jquery-1.11.3.min.js',
	'./static/js/CodeMirror-master/lib/codemirror.js',
	'./static/js/CodeMirror-master/mode/lua/lua.js',
	'./static/js/spin.min.js',
	'./static/js/thingiview/Three.js',
	'./static/js/thingiview/thingiview_ls3d.js',
	'./static/js/thingiview/stats.js',
	'./static/js/thingiview/plane.js',
	'./static/js/thingiview/binaryReader.js',
	'./static/js/hipcad.js'
];

gulp.task('scripts', function () {
	return gulp.src(scripts)
		.pipe(concat({ path : './static/js/app.js', stat : { mode: 0755 }}))
		.pipe(minify({}))
		.pipe(gulp.dest('./'));
});

gulp.task('less', function () {
	return gulp.src('./static/css/*.less')
		.pipe(less())
		.pipe(gulp.dest('./static/css'));
});

var gulp = require('gulp'),
  less = require('gulp-less'),
  concat = require('gulp-concat');


gulp.task('default', ['less', 'scripts']);

var scripts = [
	'./static/js/jquery-1.11.3.min.js',
	'./static/js/codemirror.js',
	'./static/js/lua.js',
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
		.pipe(gulp.dest('./'));
});

gulp.task('less', function () {
  gulp.src('./static/css/*.less')
  .pipe(less())
  .pipe(gulp.dest('./static/css'));
});

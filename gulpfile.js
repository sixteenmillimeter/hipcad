var gulp = require('gulp'),
  less = require('gulp-less');


gulp.task('default', ['less']);

gulp.task('less', function () {
  gulp.src('./static/css/*.less')
  .pipe(less())
  .pipe(gulp.dest('./static/css'));
});

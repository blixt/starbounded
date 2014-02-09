var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');

gulp.task('default', function () {
    gulp.src('./app.js')
        .pipe(browserify({debug: true}))
          .on('error', function (error) {
            gutil.log(gutil.colors.red('Browserify error:'), error.message);
          })
        .pipe(gulp.dest('build'));
});

gulp.task('watch', ['default'], function () {
    gulp.watch(['app.js', 'lib/*.js'], ['default']);
});

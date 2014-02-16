var gulp = require('gulp');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

function browserifyPipe(path) {
  var production = !!gutil.env.production;

  return gulp.src(path)
    .pipe(browserify({debug: !production}))
      .on('error', function (error) {
        gutil.log(gutil.colors.red('Browserify error:'), error.message);
      })
    .pipe(production ? uglify() : gutil.noop())
    .pipe(gulp.dest('build'));
}

gulp.task('browserify-worker', function () {
  return browserifyPipe('node_modules/starbound-assets/worker.js');
});

gulp.task('browserify', ['browserify-worker'], function () {
  return browserifyPipe('app.js');
});

gulp.task('watch', function () {
  // TEMPORARY vvv
  gulp.watch([
    'node_modules/starbound-assets/*.js',
    'node_modules/starbound-assets/lib/*.js',
    'node_modules/starbound-assets/node_modules/workerproxy/*.js',
    'node_modules/starbound-assets/node_modules/starbound-files/*.js',
    'node_modules/starbound-assets/node_modules/starbound-files/lib/*.js'
  ], ['browserify']);
  // TEMPORARY ^^^

  gulp.watch(['app.js'], ['browserify']);
});

gulp.task('default', ['browserify']);

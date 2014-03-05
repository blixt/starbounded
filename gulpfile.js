var es6ify = require('es6ify');
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

function browserifyPipe(path, opt_newName) {
  var production = !!gutil.env.production;

  var pipeline = gulp.src(path)
    .pipe(browserify({add: es6ify.runtime, debug: !production, transform: es6ify}))
      .on('error', function (error) {
        gutil.log(gutil.colors.red('Browserify error:'), error.message);
      })
    .pipe(production ? uglify() : gutil.noop());

  if (opt_newName) {
    pipeline = pipeline.pipe(rename(opt_newName));
  }

  return pipeline.pipe(gulp.dest('build'));
}

gulp.task('browserify-worker-assets', function () {
  return browserifyPipe('node_modules/starbound-assets/worker.js', 'worker-assets.js');
});

gulp.task('browserify-worker-world', function () {
  return browserifyPipe('node_modules/starbound-world/worker.js', 'worker-world.js');
});

gulp.task('browserify-app', ['browserify-worker-assets', 'browserify-worker-world'], function () {
  return browserifyPipe('app.js');
});

gulp.task('browserify-web', ['browserify-worker-assets', 'browserify-worker-world'], function () {
  return browserifyPipe('web.js');
});

gulp.task('watch', function () {
  // TEMPORARY vvv
  gulp.watch([
    'node_modules/starbound-assets/*.js',
    'node_modules/starbound-assets/lib/*.js',
    'node_modules/starbound-assets/node_modules/workerproxy/*.js',
    'node_modules/starbound-assets/node_modules/starbound-files/*.js',
    'node_modules/starbound-assets/node_modules/starbound-files/lib/*.js',
    'node_modules/starbound-world/*.js',
    'node_modules/starbound-world/lib/*.js'
  ], ['browserify-app', 'browserify-web']);
  // TEMPORARY ^^^

  gulp.watch(['app.js', 'lib/*.js', 'web.js'], ['browserify-app']);
  gulp.watch(['web.js'], ['browserify-web']);
});

gulp.task('default', ['browserify-app', 'browserify-web']);

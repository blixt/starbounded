var browserify = require('browserify');
var es6ify = require('es6ify');
var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var merge = require('merge');
var transform = require('vinyl-transform');

function browserifyPipe(path, opt_options) {
  var production = !!gutil.env.production;

  // Default options.
  var options = {
    debug: !production,
    name: null,
    es6: true,
    uglify: production
  };

  // Apply user options.
  merge(options, opt_options);

  var browserified = transform(function (filename) {
    var b = browserify({debug: options.debug});

    if (options.es6) {
      b.add(es6ify.runtime);
      b.transform(es6ify);
    }

    b.require(require.resolve(filename), {entry: true});
    return b.bundle();
  });

  var pipeline = gulp.src(path)
    .pipe(browserified)
      .on('error', function (error) {
        gutil.log(gutil.colors.red('Browserify error:'), error.message);
      })
    .pipe(options.uglify ? uglify() : gutil.noop());

  if (options.name) {
    pipeline = pipeline.pipe(rename(options.name));
  }

  return pipeline.pipe(gulp.dest('build'));
}

gulp.task('browserify-worker-assets', function () {
  return browserifyPipe('node_modules/starbound-assets/worker.js', {name: 'worker-assets.js'});
});

gulp.task('browserify-worker-world', function () {
  return browserifyPipe('node_modules/starbound-world/worker.js', {name: 'worker-world.js'});
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

  gulp.watch(['app.js', 'lib/**/*.js'], ['browserify-app']);
  gulp.watch(['web.js', 'lib/**/*.js'], ['browserify-web']);
});

gulp.task('default', ['browserify-app', 'browserify-web']);

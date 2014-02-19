StarboundEd
===========

This is a web app that lets you open your Starbound directory and view
the worlds etc. within.

![](https://i.imgur.com/Gmz2Shf.png)

This project is under an MIT license.


Trying it out
-------------

The easiest way to try it out is to go to
[the demo page](http://blixt.github.io/starbounded/).


Installing the Chrome app
-------------------------

For now, you'll have to follow the steps below to run this Chrome app.
In the future it will be available on the Chrome Web Store (for free,
of course!)


Setting up for development
--------------------------

First of all, you'll need to have some things installed:

* [Chrome](https://www.google.com/chrome/) 32 or later
* [Node.js](http://nodejs.org/) (for NPM)

If you have all of the above, start by cloning this repository. Then
run this in the cloned directory:

```bash
$ npm install
# ... lots of output ...

$ node_modules/gulp/bin/gulp.js
[gulp] Using file /.../starbounded/gulpfile.js
[gulp] Working directory changed to /.../starbounded
[gulp] Running 'browserify-worker-assets'...
[gulp] Running 'browserify-worker-world'...
[gulp] Finished 'browserify-worker-world' in 486 ms
[gulp] Finished 'browserify-worker-assets' in 545 ms
[gulp] Running 'browserify-app'...
[gulp] Running 'browserify-web'...
[gulp] Finished 'browserify-app' in 155 ms
[gulp] Finished 'browserify-web' in 154 ms
[gulp] Running 'default'...
[gulp] Finished 'default' in 5.9 μs
```


### Web viewer

If you want to try the simple web viewer, you just need to serve the
current directory somehow. One easy way to do so is to use the `serve`
package:

```bash
$ npm install -g serve
# ... lots of output ...

$ serve
serving /.../starbounded on port 3000
```

Now you can open http://localhost:3000/web.html in your browser.


### Chrome app

To actually run this Chrome app, you need to add it to Chrome. Here's
how:

* In Chrome, navigate to `chrome://extensions` (or go to *Settings* and
  click *Extensions*)
* Ensure that *Developer mode* is checked
* Click *Load unpacked extension...*
* Select the directory that you cloned the source code to
* The app should appear in the list

To launch the app, you can click the *Launch* link on the *Extensions*
page, or you can launch it through any of the normal means of launching
a Chrome app.


Tips & tricks
-------------

### gulp

To avoid having to write that long path to run [gulp][gulpjs], you can
install gulp globally:

```bash
$ npm install -g gulp
```

Now you only need to run this to run gulp:

```bash
$ gulp
```

If you want gulp to automatically build whenever you change a file, run
this instead of `gulp`:

```bash
$ gulp watch
```

It will now watch for changes to any of the source files.


[gulpjs]: http://gulpjs.com/

StarboundEd
===========

This is a web app that lets you open your Starbound directory and view
the worlds etc. within.

![](http://i.imgur.com/qNY45kx.jpg)

![](http://i.imgur.com/zCIIBNg.png)

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


Dependencies
------------

This project has a number of dependencies that you may want to have a
look at, as they hold most of the logic for parsing Starbound files and
rendering worlds.

* [`starbound-assets`](https://github.com/blixt/js-starbound-assets)
* [`starbound-world`](https://github.com/blixt/js-starbound-world)
* [`starbound-files`](https://github.com/blixt/js-starbound-files)


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


Technology
----------

This project is written to be run completely in a browser. Here's some
technologically interesting things that this project does/has:

* Rendering big 2D worlds segmented onto tiles of canvases
* Reading parts of huge binary files (hundreds of MBs) on user's disk
* Parallelising work in multiple Web Workers
* Applying image operations such as hue shifting on the fly
* CommonJS `require` and ECMAScript 6 (Harmony) code using Browserify
* Bundling code as a Chrome app to improve experience


### Obstacles

While it's amazing that browsers can support the things that this are
done in this project, there were some snags (which will hopefully be
resolved some time in the future):

* Chrome is 50x slower than Firefox at some things
* Firefox doesn't allow opening or drag/dropping directories


### Future

In the future, these technologies may also be used in this project:

* Retrieving real-time changes to the world through Web Sockets
* Using a fragment shader in WebGL to render tiles much faster
* Running a Lua VM in a Web Worker
* Running a TCP server that interacts with the game (Chrome app)


[gulpjs]: http://gulpjs.com/

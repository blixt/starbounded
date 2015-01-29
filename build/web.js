(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;
var WorldRenderer = require('starbound-world').WorldRenderer;
exports.setup = function(viewport) {
  var assets = new AssetsManager({
    workerPath: 'build/worker-assets.js',
    workers: 4
  });
  var worlds = new WorldManager({workerPath: 'build/worker-world.js'});
  var renderer = new WorldRenderer(viewport, assets);
  window.addEventListener('resize', function() {
    renderer.refresh();
  });
  document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
      case 37:
        renderer.scroll(-10, 0, true);
        break;
      case 38:
        renderer.scroll(0, 10, true);
        break;
      case 39:
        renderer.scroll(10, 0, true);
        break;
      case 40:
        renderer.scroll(0, -10, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  });
  var dragging = null;
  viewport.addEventListener('mousedown', function(e) {
    dragging = [e.clientX, e.clientY];
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging)
      return;
    renderer.scroll(dragging[0] - e.clientX, e.clientY - dragging[1], true);
    dragging[0] = e.clientX;
    dragging[1] = e.clientY;
  });
  document.addEventListener('mouseup', function() {
    dragging = null;
  });
  viewport.addEventListener('wheel', function(e) {
    if (e.deltaY > 0)
      renderer.zoomOut();
    if (e.deltaY < 0)
      renderer.zoomIn();
    e.preventDefault();
  });
  return {
    assets: assets,
    renderer: renderer,
    worlds: worlds
  };
};


//# sourceURL=/Users/blixt/src/starbounded/lib/starbound.js
},{"starbound-assets":16,"starbound-world":23}],2:[function(require,module,exports){
"use strict";
var ua = require('useragent-wtf');
module.exports = function() {
  switch (ua.os) {
    case 'mac':
      $('.mac').show();
      break;
    case 'windows':
      $('.windows').show();
      break;
  }
};


//# sourceURL=/Users/blixt/src/starbounded/lib/ui/os.js
},{"useragent-wtf":30}],3:[function(require,module,exports){
"use strict";
module.exports = function(starbound) {
  var maxTasks = 0,
      progress = $('#progress');
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
  requestAnimationFrame(function loop() {
    var pendingTasks = starbound.assets.api.pendingCalls + starbound.worlds.api.pendingCalls;
    if (pendingTasks) {
      if (maxTasks < pendingTasks) {
        maxTasks = pendingTasks;
      }
      var percentage = (maxTasks * 1.1 - pendingTasks) / (maxTasks * 1.1) * 100;
      progress.css('width', percentage + '%');
      progress.show();
    } else if (maxTasks) {
      maxTasks = 0;
      progress.css('width', '100%');
      progress.fadeOut();
    }
    requestAnimationFrame(loop);
  });
};


//# sourceURL=/Users/blixt/src/starbounded/lib/ui/progress.js
},{}],4:[function(require,module,exports){
"use strict";
var once = require('once');
module.exports = function(starbound, callback) {
  var directory = document.getElementById('directory'),
      file = document.getElementById('file');
  if (directory.webkitdirectory) {
    $('#directory-selector').modal({
      backdrop: 'static',
      keyboard: false
    });
    directory.onchange = function() {
      var verified = false;
      for (var i = 0; i < this.files.length; i++) {
        var file = this.files[i];
        if (file.webkitRelativePath == 'Starbound/assets/packed.pak') {
          verified = true;
          break;
        }
      }
      var status = $('#directory-status');
      if (verified) {
        status.attr('class', 'text-success');
        status.find('span').attr('class', 'glyphicon glyphicon-ok');
        status.find('strong').text('Click Load assets to continue');
        $('#load-directory').attr('disabled', false);
      } else {
        status.attr('class', 'text-danger');
        status.find('span').attr('class', 'glyphicon glyphicon-remove');
        status.find('strong').text('That does not appear to be the Starbound directory');
        $('#load-directory').attr('disabled', true);
      }
    };
  } else {
    $('#file-selector').modal({
      backdrop: 'static',
      keyboard: false
    });
    file.onchange = function() {
      var status = $('#file-status');
      if (this.files[0].name == 'packed.pak') {
        status.attr('class', 'text-success');
        status.find('span').attr('class', 'glyphicon glyphicon-ok');
        status.find('strong').text('Click Load assets to continue');
        $('#load-file').attr('disabled', false);
      } else {
        status.attr('class', 'text-danger');
        status.find('span').attr('class', 'glyphicon glyphicon-remove');
        status.find('strong').text('That does not appear to be the packed.pak file');
        $('#load-file').attr('disabled', true);
      }
    };
  }
  $('#load-directory').click(function() {
    var pendingFiles = 0;
    var worldFiles = [];
    for (var i = 0; i < directory.files.length; i++) {
      var file = directory.files[i],
          path = file.webkitRelativePath,
          match;
      if (file.name[0] == '.')
        continue;
      if (file.name.match(/\.(ship)?world$/)) {
        worldFiles.push(file);
      } else if (match = path.match(/^Starbound\/(?:assets|mods)(\/.*)/)) {
        if (match[1].substr(0, 13) == '/music/music/') {
          match[1] = match[1].substr(6);
        }
        pendingFiles++;
        starbound.assets.addFile(match[1], file, once(function(err) {
          pendingFiles--;
          if (!pendingFiles) {
            starbound.renderer.preload();
            callback(null, {worldFiles: worldFiles});
          }
        }));
      }
    }
    $('#directory-selector').modal('hide');
  });
  $('#load-file').click(function() {
    starbound.assets.addFile('/', file.files[0], once(function() {
      starbound.renderer.preload();
      callback(null, {worldFiles: []});
    }));
    $('#file-selector').modal('hide');
  });
};


//# sourceURL=/Users/blixt/src/starbounded/lib/ui/web-selector.js
},{"once":15}],5:[function(require,module,exports){
"use strict";
var moment = require('moment');
module.exports = function(starbound) {
  var addWorlds = document.getElementById('add-world-files');
  addWorlds.onchange = (function(event) {
    for (var i = 0; i < addWorlds.files.length; i++) {
      starbound.worlds.open(addWorlds.files[i]);
    }
  });
  var worldList = $('#worlds');
  var worlds = [];
  worldList.on('click', '.list-group-item', (function(event) {
    var item = $(event.target).closest('.list-group-item');
    var index = item.data('index');
    starbound.renderer.setWorld(worlds[index]);
    starbound.renderer.requestRender();
  }));
  starbound.renderer.on('load', (function() {
    worldList.find('.list-group-item').removeClass('active');
    for (var i = 0; i < worlds.length; i++) {
      if (worlds[i] == starbound.renderer.world) {
        worldList.find('[data-index=' + i + ']').addClass('active');
        break;
      }
    }
  }));
  starbound.renderer.on('unload', (function() {
    worldList.find('.list-group-item').removeClass('active');
  }));
  starbound.worlds.on('load', (function(event) {
    var world = event.world;
    var index = worlds.length;
    worlds.push(world);
    var item = $('<a href="#" class="list-group-item">').attr('data-index', index).append($('<h4 class="list-group-item-heading">').text(world.name), $('<p class="list-group-item-text">').text('Played ' + world.lastModified));
    worldList.append(item);
  }));
};


//# sourceURL=/Users/blixt/src/starbounded/lib/ui/world-selector.js
},{"moment":13}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":9}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":10,"_process":9,"inherits":7}],12:[function(require,module,exports){
(function (process,global){
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var method = nonEnum;
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var symbolInternalProperty = newUniqueString();
  var symbolDescriptionProperty = newUniqueString();
  var symbolDataProperty = newUniqueString();
  var symbolValues = $create(null);
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  function isShimSymbol(symbol) {
    return typeof symbol === 'object' && symbol instanceof SymbolValue;
  }
  function typeOf(v) {
    if (isShimSymbol(v))
      return 'symbol';
    return typeof v;
  }
  function Symbol(description) {
    var value = new SymbolValue(description);
    if (!(this instanceof Symbol))
      return value;
    throw new TypeError('Symbol cannot be new\'ed');
  }
  $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
  $defineProperty(Symbol.prototype, 'toString', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!getOption('symbols'))
      return symbolValue[symbolInternalProperty];
    if (!symbolValue)
      throw TypeError('Conversion from symbol to string');
    var desc = symbolValue[symbolDescriptionProperty];
    if (desc === undefined)
      desc = '';
    return 'Symbol(' + desc + ')';
  }));
  $defineProperty(Symbol.prototype, 'valueOf', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!symbolValue)
      throw TypeError('Conversion from symbol to string');
    if (!getOption('symbols'))
      return symbolValue[symbolInternalProperty];
    return symbolValue;
  }));
  function SymbolValue(description) {
    var key = newUniqueString();
    $defineProperty(this, symbolDataProperty, {value: this});
    $defineProperty(this, symbolInternalProperty, {value: key});
    $defineProperty(this, symbolDescriptionProperty, {value: description});
    freeze(this);
    symbolValues[key] = this;
  }
  $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
  $defineProperty(SymbolValue.prototype, 'toString', {
    value: Symbol.prototype.toString,
    enumerable: false
  });
  $defineProperty(SymbolValue.prototype, 'valueOf', {
    value: Symbol.prototype.valueOf,
    enumerable: false
  });
  var hashProperty = createPrivateName();
  var hashPropertyDescriptor = {value: undefined};
  var hashObjectProperties = {
    hash: {value: undefined},
    self: {value: undefined}
  };
  var hashCounter = 0;
  function getOwnHashObject(object) {
    var hashObject = object[hashProperty];
    if (hashObject && hashObject.self === object)
      return hashObject;
    if ($isExtensible(object)) {
      hashObjectProperties.hash.value = hashCounter++;
      hashObjectProperties.self.value = object;
      hashPropertyDescriptor.value = $create(null, hashObjectProperties);
      $defineProperty(object, hashProperty, hashPropertyDescriptor);
      return hashPropertyDescriptor.value;
    }
    return undefined;
  }
  function freeze(object) {
    getOwnHashObject(object);
    return $freeze.apply(this, arguments);
  }
  function preventExtensions(object) {
    getOwnHashObject(object);
    return $preventExtensions.apply(this, arguments);
  }
  function seal(object) {
    getOwnHashObject(object);
    return $seal.apply(this, arguments);
  }
  freeze(SymbolValue.prototype);
  function isSymbolString(s) {
    return symbolValues[s] || privateNames[s];
  }
  function toProperty(name) {
    if (isShimSymbol(name))
      return name[symbolInternalProperty];
    return name;
  }
  function removeSymbolKeys(array) {
    var rv = [];
    for (var i = 0; i < array.length; i++) {
      if (!isSymbolString(array[i])) {
        rv.push(array[i]);
      }
    }
    return rv;
  }
  function getOwnPropertyNames(object) {
    return removeSymbolKeys($getOwnPropertyNames(object));
  }
  function keys(object) {
    return removeSymbolKeys($keys(object));
  }
  function getOwnPropertySymbols(object) {
    var rv = [];
    var names = $getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var symbol = symbolValues[names[i]];
      if (symbol) {
        rv.push(symbol);
      }
    }
    return rv;
  }
  function getOwnPropertyDescriptor(object, name) {
    return $getOwnPropertyDescriptor(object, toProperty(name));
  }
  function hasOwnProperty(name) {
    return $hasOwnProperty.call(this, toProperty(name));
  }
  function getOption(name) {
    return global.traceur && global.traceur.options[name];
  }
  function defineProperty(object, name, descriptor) {
    if (isShimSymbol(name)) {
      name = name[symbolInternalProperty];
    }
    $defineProperty(object, name, descriptor);
    return object;
  }
  function polyfillObject(Object) {
    $defineProperty(Object, 'defineProperty', {value: defineProperty});
    $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
    $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
    $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
    $defineProperty(Object, 'freeze', {value: freeze});
    $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
    $defineProperty(Object, 'seal', {value: seal});
    $defineProperty(Object, 'keys', {value: keys});
  }
  function exportStar(object) {
    for (var i = 1; i < arguments.length; i++) {
      var names = $getOwnPropertyNames(arguments[i]);
      for (var j = 0; j < names.length; j++) {
        var name = names[j];
        if (isSymbolString(name))
          continue;
        (function(mod, name) {
          $defineProperty(object, name, {
            get: function() {
              return mod[name];
            },
            enumerable: true
          });
        })(arguments[i], names[j]);
      }
    }
    return object;
  }
  function isObject(x) {
    return x != null && (typeof x === 'object' || typeof x === 'function');
  }
  function toObject(x) {
    if (x == null)
      throw $TypeError();
    return $Object(x);
  }
  function checkObjectCoercible(argument) {
    if (argument == null) {
      throw new TypeError('Value cannot be converted to an Object');
    }
    return argument;
  }
  function polyfillSymbol(global, Symbol) {
    if (!global.Symbol) {
      global.Symbol = Symbol;
      Object.getOwnPropertySymbols = getOwnPropertySymbols;
    }
    if (!global.Symbol.iterator) {
      global.Symbol.iterator = Symbol('Symbol.iterator');
    }
  }
  function setupGlobals(global) {
    polyfillSymbol(global, Symbol);
    global.Reflect = global.Reflect || {};
    global.Reflect.global = global.Reflect.global || global;
    polyfillObject(global.Object);
  }
  setupGlobals(global);
  global.$traceurRuntime = {
    checkObjectCoercible: checkObjectCoercible,
    createPrivateName: createPrivateName,
    defineProperties: $defineProperties,
    defineProperty: $defineProperty,
    exportStar: exportStar,
    getOwnHashObject: getOwnHashObject,
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
    getOwnPropertyNames: $getOwnPropertyNames,
    isObject: isObject,
    isPrivateName: isPrivateName,
    isSymbolString: isSymbolString,
    keys: $keys,
    setupGlobals: setupGlobals,
    toObject: toObject,
    toProperty: toProperty,
    typeof: typeOf
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  'use strict';
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
})();
(function() {
  'use strict';
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
})();
(function() {
  'use strict';
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__0 = Object,
      getOwnPropertyNames = $__0.getOwnPropertyNames,
      getOwnPropertySymbols = $__0.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superCall(self, homeObject, name, args) {
    return superGet(self, homeObject, name).apply(self, args);
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      if (!descriptor.get)
        return descriptor.value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function getDescriptors(object) {
    var descriptors = {};
    var names = getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      descriptors[name] = $getOwnPropertyDescriptor(object, name);
    }
    var symbols = getOwnPropertySymbols(object);
    for (var i = 0; i < symbols.length; i++) {
      var symbol = symbols[i];
      descriptors[$traceurRuntime.toProperty(symbol)] = $getOwnPropertyDescriptor(object, $traceurRuntime.toProperty(symbol));
    }
    return descriptors;
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  function defaultSuperCall(self, homeObject, args) {
    if ($getPrototypeOf(homeObject) !== null)
      superCall(self, homeObject, 'constructor', args);
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.defaultSuperCall = defaultSuperCall;
  $traceurRuntime.superCall = superCall;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
})();
(function() {
  'use strict';
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $create = Object.create;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value = moveNext(ctx);
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateName();
  var moveNextName = createPrivateName();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  $defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', v);
    }
  };
  $defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = $create(functionObject.prototype);
    object[ctxName] = ctx;
    object[moveNextName] = moveNext;
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = $create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = $create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
})();
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  ;
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function() {
  'use strict';
  var types = {
    any: {name: 'any'},
    boolean: {name: 'boolean'},
    number: {name: 'number'},
    string: {name: 'string'},
    symbol: {name: 'symbol'},
    void: {name: 'void'}
  };
  var GenericType = function GenericType(type, argumentTypes) {
    this.type = type;
    this.argumentTypes = argumentTypes;
  };
  ($traceurRuntime.createClass)(GenericType, {}, {});
  var typeRegister = Object.create(null);
  function genericType(type) {
    for (var argumentTypes = [],
        $__1 = 1; $__1 < arguments.length; $__1++)
      argumentTypes[$__1 - 1] = arguments[$__1];
    var typeMap = typeRegister;
    var key = $traceurRuntime.getOwnHashObject(type).hash;
    if (!typeMap[key]) {
      typeMap[key] = Object.create(null);
    }
    typeMap = typeMap[key];
    for (var i = 0; i < argumentTypes.length - 1; i++) {
      key = $traceurRuntime.getOwnHashObject(argumentTypes[i]).hash;
      if (!typeMap[key]) {
        typeMap[key] = Object.create(null);
      }
      typeMap = typeMap[key];
    }
    var tail = argumentTypes[argumentTypes.length - 1];
    key = $traceurRuntime.getOwnHashObject(tail).hash;
    if (!typeMap[key]) {
      typeMap[key] = new GenericType(type, argumentTypes);
    }
    return typeMap[key];
  }
  $traceurRuntime.GenericType = GenericType;
  $traceurRuntime.genericType = genericType;
  $traceurRuntime.type = types;
})();
(function(global) {
  'use strict';
  var $__2 = $traceurRuntime,
      canonicalizeUrl = $__2.canonicalizeUrl,
      resolveUrl = $__2.resolveUrl,
      isAbsolute = $__2.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  var UncoatedModuleEntry = function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  };
  ($traceurRuntime.createClass)(UncoatedModuleEntry, {}, {});
  var ModuleEvaluationError = function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof $ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  };
  var $ModuleEvaluationError = ModuleEvaluationError;
  ($traceurRuntime.createClass)(ModuleEvaluationError, {
    stripError: function(message) {
      return message.replace(/.*Error:/, this.constructor.name + ':');
    },
    stripCause: function(cause) {
      if (!cause)
        return '';
      if (!cause.message)
        return cause + '';
      return this.stripError(cause.message);
    },
    loadedBy: function(moduleName) {
      this.stack += '\n loaded by ' + moduleName;
    },
    stripStack: function(causeStack) {
      var stack = [];
      causeStack.split('\n').some((function(frame) {
        if (/UncoatedModuleInstantiator/.test(frame))
          return true;
        stack.push(frame);
      }));
      stack[0] = this.stripError(stack[0]);
      return stack.join('\n');
    }
  }, {}, Error);
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  var UncoatedModuleInstantiator = function UncoatedModuleInstantiator(url, func) {
    $traceurRuntime.superConstructor($UncoatedModuleInstantiator).call(this, url, null);
    this.func = func;
  };
  var $UncoatedModuleInstantiator = UncoatedModuleInstantiator;
  ($traceurRuntime.createClass)(UncoatedModuleInstantiator, {getUncoatedModule: function() {
      if (this.value_)
        return this.value_;
      try {
        var relativeRequire;
        if (typeof $traceurRuntime !== undefined) {
          relativeRequire = $traceurRuntime.require.bind(null, this.url);
        }
        return this.value_ = this.func.call(global, relativeRequire);
      } catch (ex) {
        if (ex instanceof ModuleEvaluationError) {
          ex.loadedBy(this.url);
          throw ex;
        }
        if (ex.stack) {
          var lines = this.func.toString().split('\n');
          var evaled = [];
          ex.stack.split('\n').some(function(frame) {
            if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
              return true;
            var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
            if (m) {
              var line = parseInt(m[2], 10);
              evaled = evaled.concat(beforeLines(lines, line));
              evaled.push(columnSpacing(m[3]) + '^');
              evaled = evaled.concat(afterLines(lines, line));
              evaled.push('= = = = = = = = =');
            } else {
              evaled.push(frame);
            }
          });
          ex.stack = evaled.join('\n');
        }
        throw new ModuleEvaluationError(this.url, ex);
      }
    }}, {}, UncoatedModuleEntry);
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach((function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    }));
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, (function() {
        return module;
      }));
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__0 = arguments;
            var depMap = {};
            deps.forEach((function(dep, index) {
              return depMap[dep] = $__0[index];
            }));
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func.call(global), liveModuleSentinel);
    },
    getForTesting: function(name) {
      var $__0 = this;
      if (!this.testingPrefix_) {
        Object.keys(moduleInstances).some((function(key) {
          var m = /(traceur@[^\/]*\/)/.exec(key);
          if (m) {
            $__0.testingPrefix_ = m[1];
            return true;
          }
        }));
      }
      return this.get(this.testingPrefix_ + name);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore', moduleStoreModule);
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  global.System = {
    register: ModuleStore.register.bind(ModuleStore),
    registerModule: ModuleStore.registerModule.bind(ModuleStore),
    get: ModuleStore.get,
    set: ModuleStore.set,
    normalize: ModuleStore.normalize
  };
  $traceurRuntime.getModuleImpl = function(name) {
    var instantiator = getUncoatedModuleInstantiator(name);
    return instantiator && instantiator.getUncoatedModule();
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var toObject = $traceurRuntime.toObject;
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach((function(f) {
      return f(global);
    }));
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Map.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      maybeAddIterator = $__0.maybeAddIterator,
      registerPolyfill = $__0.registerPolyfill;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var deletedSentinel = {};
  function lookupIndex(map, key) {
    if (isObject(key)) {
      var hashObject = getOwnHashObject(key);
      return hashObject && map.objectIndex_[hashObject.hash];
    }
    if (typeof key === 'string')
      return map.stringIndex_[key];
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.deletedCount_ = 0;
  }
  var Map = function Map() {
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Map called on incompatible type');
    if ($hasOwnProperty.call(this, 'entries_')) {
      throw new TypeError('Map can not be reentrantly initialised');
    }
    initMap(this);
    if (iterable !== null && iterable !== undefined) {
      for (var $__2 = iterable[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__3; !($__3 = $__2.next()).done; ) {
        var $__4 = $__3.value,
            key = $__4[0],
            value = $__4[1];
        {
          this.set(key, value);
        }
      }
    }
  };
  ($traceurRuntime.createClass)(Map, {
    get size() {
      return this.entries_.length / 2 - this.deletedCount_;
    },
    get: function(key) {
      var index = lookupIndex(this, key);
      if (index !== undefined)
        return this.entries_[index + 1];
    },
    set: function(key, value) {
      var objectMode = isObject(key);
      var stringMode = typeof key === 'string';
      var index = lookupIndex(this, key);
      if (index !== undefined) {
        this.entries_[index + 1] = value;
      } else {
        index = this.entries_.length;
        this.entries_[index] = key;
        this.entries_[index + 1] = value;
        if (objectMode) {
          var hashObject = getOwnHashObject(key);
          var hash = hashObject.hash;
          this.objectIndex_[hash] = index;
        } else if (stringMode) {
          this.stringIndex_[key] = index;
        } else {
          this.primitiveIndex_[key] = index;
        }
      }
      return this;
    },
    has: function(key) {
      return lookupIndex(this, key) !== undefined;
    },
    delete: function(key) {
      var objectMode = isObject(key);
      var stringMode = typeof key === 'string';
      var index;
      var hash;
      if (objectMode) {
        var hashObject = getOwnHashObject(key);
        if (hashObject) {
          index = this.objectIndex_[hash = hashObject.hash];
          delete this.objectIndex_[hash];
        }
      } else if (stringMode) {
        index = this.stringIndex_[key];
        delete this.stringIndex_[key];
      } else {
        index = this.primitiveIndex_[key];
        delete this.primitiveIndex_[key];
      }
      if (index !== undefined) {
        this.entries_[index] = deletedSentinel;
        this.entries_[index + 1] = undefined;
        this.deletedCount_++;
        return true;
      }
      return false;
    },
    clear: function() {
      initMap(this);
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      for (var i = 0; i < this.entries_.length; i += 2) {
        var key = this.entries_[i];
        var value = this.entries_[i + 1];
        if (key === deletedSentinel)
          continue;
        callbackFn.call(thisArg, value, key, this);
      }
    },
    entries: $traceurRuntime.initGeneratorFunction(function $__5() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return [key, value];
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__5, this);
    }),
    keys: $traceurRuntime.initGeneratorFunction(function $__6() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return key;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__6, this);
    }),
    values: $traceurRuntime.initGeneratorFunction(function $__7() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return value;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__7, this);
    })
  }, {});
  Object.defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function polyfillMap(global) {
    var $__4 = global,
        Object = $__4.Object,
        Symbol = $__4.Symbol;
    if (!global.Map)
      global.Map = Map;
    var mapPrototype = global.Map.prototype;
    if (mapPrototype.entries === undefined)
      global.Map = Map;
    if (mapPrototype.entries) {
      maybeAddIterator(mapPrototype, mapPrototype.entries, Symbol);
      maybeAddIterator(Object.getPrototypeOf(new global.Map().entries()), function() {
        return this;
      }, Symbol);
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Map.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Set.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      maybeAddIterator = $__0.maybeAddIterator,
      registerPolyfill = $__0.registerPolyfill;
  var Map = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Map.js").Map;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  function initSet(set) {
    set.map_ = new Map();
  }
  var Set = function Set() {
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Set called on incompatible type');
    if ($hasOwnProperty.call(this, 'map_')) {
      throw new TypeError('Set can not be reentrantly initialised');
    }
    initSet(this);
    if (iterable !== null && iterable !== undefined) {
      for (var $__4 = iterable[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__5; !($__5 = $__4.next()).done; ) {
        var item = $__5.value;
        {
          this.add(item);
        }
      }
    }
  };
  ($traceurRuntime.createClass)(Set, {
    get size() {
      return this.map_.size;
    },
    has: function(key) {
      return this.map_.has(key);
    },
    add: function(key) {
      this.map_.set(key, key);
      return this;
    },
    delete: function(key) {
      return this.map_.delete(key);
    },
    clear: function() {
      return this.map_.clear();
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      var $__2 = this;
      return this.map_.forEach((function(value, key) {
        callbackFn.call(thisArg, key, key, $__2);
      }));
    },
    values: $traceurRuntime.initGeneratorFunction(function $__7() {
      var $__8,
          $__9;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__8 = this.map_.keys()[Symbol.iterator]();
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__9 = $__8[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__9.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__9.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__9.value;
            default:
              return $ctx.end();
          }
      }, $__7, this);
    }),
    entries: $traceurRuntime.initGeneratorFunction(function $__10() {
      var $__11,
          $__12;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__11 = this.map_.entries()[Symbol.iterator]();
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__12 = $__11[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__12.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__12.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__12.value;
            default:
              return $ctx.end();
          }
      }, $__10, this);
    })
  }, {});
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function polyfillSet(global) {
    var $__6 = global,
        Object = $__6.Object,
        Symbol = $__6.Symbol;
    if (!global.Set)
      global.Set = Set;
    var setPrototype = global.Set.prototype;
    if (setPrototype.values) {
      maybeAddIterator(setPrototype, setPrototype.values, Symbol);
      maybeAddIterator(Object.getPrototypeOf(new global.Set().values()), function() {
        return this;
      }, Symbol);
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Set.js" + '');
System.registerModule("traceur-runtime@0.0.79/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var $__default = asap;
  var browserGlobal = (typeof window !== 'undefined') ? window : {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    return function() {
      process.nextTick(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  var scheduleFlush;
  if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Promise.js";
  var async = System.get("traceur-runtime@0.0.79/node_modules/rsvp/lib/rsvp/asap.js").default;
  var registerPolyfill = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js").registerPolyfill;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: (function(x) {
          promiseResolve(promise, x);
        }),
        reject: (function(r) {
          promiseReject(promise, r);
        })
      };
    } else {
      var result = {};
      result.promise = new C((function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      }));
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function Promise(resolver) {
    if (resolver === promiseRaw)
      return;
    if (typeof resolver !== 'function')
      throw new TypeError;
    var promise = promiseInit(this);
    try {
      resolver((function(x) {
        promiseResolve(promise, x);
      }), (function(r) {
        promiseReject(promise, r);
      }));
    } catch (e) {
      promiseReject(promise, e);
    }
  };
  ($traceurRuntime.createClass)(Promise, {
    catch: function(onReject) {
      return this.then(undefined, onReject);
    },
    then: function(onResolve, onReject) {
      if (typeof onResolve !== 'function')
        onResolve = idResolveHandler;
      if (typeof onReject !== 'function')
        onReject = idRejectHandler;
      var that = this;
      var constructor = this.constructor;
      return chain(this, function(x) {
        x = promiseCoerce(constructor, x);
        return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
      }, onReject);
    }
  }, {
    resolve: function(x) {
      if (this === $Promise) {
        if (isPromise(x)) {
          return x;
        }
        return promiseSet(new $Promise(promiseRaw), +1, x);
      } else {
        return new this(function(resolve, reject) {
          resolve(x);
        });
      }
    },
    reject: function(r) {
      if (this === $Promise) {
        return promiseSet(new $Promise(promiseRaw), -1, r);
      } else {
        return new this((function(resolve, reject) {
          reject(r);
        }));
      }
    },
    all: function(values) {
      var deferred = getDeferred(this);
      var resolutions = [];
      try {
        var count = values.length;
        if (count === 0) {
          deferred.resolve(resolutions);
        } else {
          for (var i = 0; i < values.length; i++) {
            this.resolve(values[i]).then(function(i, x) {
              resolutions[i] = x;
              if (--count === 0)
                deferred.resolve(resolutions);
            }.bind(undefined, i), (function(r) {
              deferred.reject(r);
            }));
          }
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    },
    race: function(values) {
      var deferred = getDeferred(this);
      try {
        for (var i = 0; i < values.length; i++) {
          this.resolve(values[i]).then((function(x) {
            deferred.resolve(x);
          }), (function(r) {
            deferred.reject(r);
          }));
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    }
  });
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async((function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    }));
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = '@@thenable';
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        x[thenableSymbol] = promise;
        return promise;
      }
      if (typeof then === 'function') {
        var p = x[thenableSymbol];
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          x[thenableSymbol] = deferred.promise;
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Promise.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var $__2;
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/StringIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      createIteratorResultObject = $__0.createIteratorResultObject,
      isObject = $__0.isObject;
  var toProperty = $traceurRuntime.toProperty;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function StringIterator() {};
  ($traceurRuntime.createClass)(StringIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
    value: function() {
      var o = this;
      if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
        throw new TypeError('this must be a StringIterator object');
      }
      var s = o[toProperty(iteratedString)];
      if (s === undefined) {
        return createIteratorResultObject(undefined, true);
      }
      var position = o[toProperty(stringIteratorNextIndex)];
      var len = s.length;
      if (position >= len) {
        o[toProperty(iteratedString)] = undefined;
        return createIteratorResultObject(undefined, true);
      }
      var first = s.charCodeAt(position);
      var resultString;
      if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
        resultString = String.fromCharCode(first);
      } else {
        var second = s.charCodeAt(position + 1);
        if (second < 0xDC00 || second > 0xDFFF) {
          resultString = String.fromCharCode(first);
        } else {
          resultString = String.fromCharCode(first) + String.fromCharCode(second);
        }
      }
      o[toProperty(stringIteratorNextIndex)] = position + resultString.length;
      return createIteratorResultObject(resultString, false);
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), Object.defineProperty($__2, Symbol.iterator, {
    value: function() {
      return this;
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), $__2), {});
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[toProperty(iteratedString)] = s;
    iterator[toProperty(stringIteratorNextIndex)] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/String.js";
  var createStringIterator = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/StringIterator.js").createStringIterator;
  var $__1 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint() {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = $traceurRuntime.checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/String.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var $__2;
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/ArrayIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      toObject = $__0.toObject,
      toUint32 = $__0.toUint32,
      createIteratorResultObject = $__0.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function ArrayIterator() {};
  ($traceurRuntime.createClass)(ArrayIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
    value: function() {
      var iterator = toObject(this);
      var array = iterator.iteratorObject_;
      if (!array) {
        throw new TypeError('Object is not an ArrayIterator');
      }
      var index = iterator.arrayIteratorNextIndex_;
      var itemKind = iterator.arrayIterationKind_;
      var length = toUint32(array.length);
      if (index >= length) {
        iterator.arrayIteratorNextIndex_ = Infinity;
        return createIteratorResultObject(undefined, true);
      }
      iterator.arrayIteratorNextIndex_ = index + 1;
      if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
        return createIteratorResultObject(array[index], false);
      if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
        return createIteratorResultObject([index, array[index]], false);
      return createIteratorResultObject(index, false);
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), Object.defineProperty($__2, Symbol.iterator, {
    value: function() {
      return this;
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), $__2), {});
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Array.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/ArrayIterator.js"),
      entries = $__0.entries,
      keys = $__0.keys,
      values = $__0.values;
  var $__1 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      checkIterable = $__1.checkIterable,
      isCallable = $__1.isCallable,
      isConstructor = $__1.isConstructor,
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger,
      toLength = $__1.toLength,
      toObject = $__1.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      for (var $__2 = items[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__3; !($__3 = $__2.next()).done; ) {
        var item = $__3.value;
        {
          if (mapping) {
            arr[k] = mapFn.call(thisArg, item, k);
          } else {
            arr[k] = item;
          }
          k++;
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__4 = 0; $__4 < arguments.length; $__4++)
      items[$__4] = arguments[$__4];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__5 = global,
        Array = $__5.Array,
        Object = $__5.Object,
        Symbol = $__5.Symbol;
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Array.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Object.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill;
  var $__1 = $traceurRuntime,
      defineProperty = $__1.defineProperty,
      getOwnPropertyDescriptor = $__1.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      isPrivateName = $__1.isPrivateName,
      keys = $__1.keys;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        if (isPrivateName(name))
          continue;
        target[name] = source[name];
      }
    }
    return target;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      if (isPrivateName(name))
        continue;
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get is() {
      return is;
    },
    get assign() {
      return assign;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Object.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/Number.js";
  var $__0 = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js"),
      isNumber = $__0.isNumber,
      maybeAddConsts = $__0.maybeAddConsts,
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill,
      toInteger = $__0.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  ;
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  ;
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/Number.js" + '');
System.registerModule("traceur-runtime@0.0.79/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.79/src/runtime/polyfills/polyfills.js";
  var polyfillAll = System.get("traceur-runtime@0.0.79/src/runtime/polyfills/utils.js").polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
System.get("traceur-runtime@0.0.79/src/runtime/polyfills/polyfills.js" + '');

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":9,"path":8}],13:[function(require,module,exports){
(function (global){
module.exports = function() {
  "use strict";
  (function(undefined) {
    var moment,
        VERSION = '2.9.0',
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,
        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,
        locales = {},
        momentProperties = [],
        hasModule = (typeof module !== 'undefined' && module && module.exports),
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
        parseTokenOneOrTwoDigits = /\d\d?/,
        parseTokenOneToThreeDigits = /\d{1,3}/,
        parseTokenOneToFourDigits = /\d{1,4}/,
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/,
        parseTokenDigits = /\d+/,
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi,
        parseTokenT = /T/i,
        parseTokenOffsetMs = /[\+\-]?\d+/,
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/,
        parseTokenOneDigit = /\d/,
        parseTokenTwoDigits = /\d\d/,
        parseTokenThreeDigits = /\d{3}/,
        parseTokenFourDigits = /\d{4}/,
        parseTokenSixDigits = /[+-]?\d{6}/,
        parseTokenSignedNumber = /[+-]?\d+/,
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',
        isoDates = [['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/], ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/], ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/], ['GGGG-[W]WW', /\d{4}-W\d{2}/], ['YYYY-DDD', /\d{4}-\d{3}/]],
        isoTimes = [['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/], ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/], ['HH:mm', /(T| )\d\d:\d\d/], ['HH', /(T| )\d\d/]],
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
          'Milliseconds': 1,
          'Seconds': 1e3,
          'Minutes': 6e4,
          'Hours': 36e5,
          'Days': 864e5,
          'Months': 2592e6,
          'Years': 31536e6
        },
        unitAliases = {
          ms: 'millisecond',
          s: 'second',
          m: 'minute',
          h: 'hour',
          d: 'day',
          D: 'date',
          w: 'week',
          W: 'isoWeek',
          M: 'month',
          Q: 'quarter',
          y: 'year',
          DDD: 'dayOfYear',
          e: 'weekday',
          E: 'isoWeekday',
          gg: 'weekYear',
          GG: 'isoWeekYear'
        },
        camelFunctions = {
          dayofyear: 'dayOfYear',
          isoweekday: 'isoWeekday',
          isoweek: 'isoWeek',
          weekyear: 'weekYear',
          isoweekyear: 'isoWeekYear'
        },
        formatFunctions = {},
        relativeTimeThresholds = {
          s: 45,
          m: 45,
          h: 22,
          d: 26,
          M: 11
        },
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),
        formatTokenFunctions = {
          M: function() {
            return this.month() + 1;
          },
          MMM: function(format) {
            return this.localeData().monthsShort(this, format);
          },
          MMMM: function(format) {
            return this.localeData().months(this, format);
          },
          D: function() {
            return this.date();
          },
          DDD: function() {
            return this.dayOfYear();
          },
          d: function() {
            return this.day();
          },
          dd: function(format) {
            return this.localeData().weekdaysMin(this, format);
          },
          ddd: function(format) {
            return this.localeData().weekdaysShort(this, format);
          },
          dddd: function(format) {
            return this.localeData().weekdays(this, format);
          },
          w: function() {
            return this.week();
          },
          W: function() {
            return this.isoWeek();
          },
          YY: function() {
            return leftZeroFill(this.year() % 100, 2);
          },
          YYYY: function() {
            return leftZeroFill(this.year(), 4);
          },
          YYYYY: function() {
            return leftZeroFill(this.year(), 5);
          },
          YYYYYY: function() {
            var y = this.year(),
                sign = y >= 0 ? '+' : '-';
            return sign + leftZeroFill(Math.abs(y), 6);
          },
          gg: function() {
            return leftZeroFill(this.weekYear() % 100, 2);
          },
          gggg: function() {
            return leftZeroFill(this.weekYear(), 4);
          },
          ggggg: function() {
            return leftZeroFill(this.weekYear(), 5);
          },
          GG: function() {
            return leftZeroFill(this.isoWeekYear() % 100, 2);
          },
          GGGG: function() {
            return leftZeroFill(this.isoWeekYear(), 4);
          },
          GGGGG: function() {
            return leftZeroFill(this.isoWeekYear(), 5);
          },
          e: function() {
            return this.weekday();
          },
          E: function() {
            return this.isoWeekday();
          },
          a: function() {
            return this.localeData().meridiem(this.hours(), this.minutes(), true);
          },
          A: function() {
            return this.localeData().meridiem(this.hours(), this.minutes(), false);
          },
          H: function() {
            return this.hours();
          },
          h: function() {
            return this.hours() % 12 || 12;
          },
          m: function() {
            return this.minutes();
          },
          s: function() {
            return this.seconds();
          },
          S: function() {
            return toInt(this.milliseconds() / 100);
          },
          SS: function() {
            return leftZeroFill(toInt(this.milliseconds() / 10), 2);
          },
          SSS: function() {
            return leftZeroFill(this.milliseconds(), 3);
          },
          SSSS: function() {
            return leftZeroFill(this.milliseconds(), 3);
          },
          Z: function() {
            var a = this.utcOffset(),
                b = '+';
            if (a < 0) {
              a = -a;
              b = '-';
            }
            return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
          },
          ZZ: function() {
            var a = this.utcOffset(),
                b = '+';
            if (a < 0) {
              a = -a;
              b = '-';
            }
            return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
          },
          z: function() {
            return this.zoneAbbr();
          },
          zz: function() {
            return this.zoneName();
          },
          x: function() {
            return this.valueOf();
          },
          X: function() {
            return this.unix();
          },
          Q: function() {
            return this.quarter();
          }
        },
        deprecations = {},
        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],
        updateInProgress = false;
    function dfl(a, b, c) {
      switch (arguments.length) {
        case 2:
          return a != null ? a : b;
        case 3:
          return a != null ? a : b != null ? b : c;
        default:
          throw new Error('Implement me');
      }
    }
    function hasOwnProp(a, b) {
      return hasOwnProperty.call(a, b);
    }
    function defaultParsingFlags() {
      return {
        empty: false,
        unusedTokens: [],
        unusedInput: [],
        overflow: -2,
        charsLeftOver: 0,
        nullInput: false,
        invalidMonth: null,
        invalidFormat: false,
        userInvalidated: false,
        iso: false
      };
    }
    function printMsg(msg) {
      if (moment.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
        console.warn('Deprecation warning: ' + msg);
      }
    }
    function deprecate(msg, fn) {
      var firstTime = true;
      return extend(function() {
        if (firstTime) {
          printMsg(msg);
          firstTime = false;
        }
        return fn.apply(this, arguments);
      }, fn);
    }
    function deprecateSimple(name, msg) {
      if (!deprecations[name]) {
        printMsg(msg);
        deprecations[name] = true;
      }
    }
    function padToken(func, count) {
      return function(a) {
        return leftZeroFill(func.call(this, a), count);
      };
    }
    function ordinalizeToken(func, period) {
      return function(a) {
        return this.localeData().ordinal(func.call(this, a), period);
      };
    }
    function monthDiff(a, b) {
      var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
          anchor = a.clone().add(wholeMonthDiff, 'months'),
          anchor2,
          adjust;
      if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        adjust = (b - anchor) / (anchor - anchor2);
      } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        adjust = (b - anchor) / (anchor2 - anchor);
      }
      return -(wholeMonthDiff + adjust);
    }
    while (ordinalizeTokens.length) {
      i = ordinalizeTokens.pop();
      formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
      i = paddedTokens.pop();
      formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);
    function meridiemFixWrap(locale, hour, meridiem) {
      var isPm;
      if (meridiem == null) {
        return hour;
      }
      if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
      } else if (locale.isPM != null) {
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
          hour += 12;
        }
        if (!isPm && hour === 12) {
          hour = 0;
        }
        return hour;
      } else {
        return hour;
      }
    }
    function Locale() {}
    function Moment(config, skipOverflow) {
      if (skipOverflow !== false) {
        checkOverflow(config);
      }
      copyConfig(this, config);
      this._d = new Date(+config._d);
      if (updateInProgress === false) {
        updateInProgress = true;
        moment.updateOffset(this);
        updateInProgress = false;
      }
    }
    function Duration(duration) {
      var normalizedInput = normalizeObjectUnits(duration),
          years = normalizedInput.year || 0,
          quarters = normalizedInput.quarter || 0,
          months = normalizedInput.month || 0,
          weeks = normalizedInput.week || 0,
          days = normalizedInput.day || 0,
          hours = normalizedInput.hour || 0,
          minutes = normalizedInput.minute || 0,
          seconds = normalizedInput.second || 0,
          milliseconds = normalizedInput.millisecond || 0;
      this._milliseconds = +milliseconds + seconds * 1e3 + minutes * 6e4 + hours * 36e5;
      this._days = +days + weeks * 7;
      this._months = +months + quarters * 3 + years * 12;
      this._data = {};
      this._locale = moment.localeData();
      this._bubble();
    }
    function extend(a, b) {
      for (var i in b) {
        if (hasOwnProp(b, i)) {
          a[i] = b[i];
        }
      }
      if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
      }
      if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
      }
      return a;
    }
    function copyConfig(to, from) {
      var i,
          prop,
          val;
      if (typeof from._isAMomentObject !== 'undefined') {
        to._isAMomentObject = from._isAMomentObject;
      }
      if (typeof from._i !== 'undefined') {
        to._i = from._i;
      }
      if (typeof from._f !== 'undefined') {
        to._f = from._f;
      }
      if (typeof from._l !== 'undefined') {
        to._l = from._l;
      }
      if (typeof from._strict !== 'undefined') {
        to._strict = from._strict;
      }
      if (typeof from._tzm !== 'undefined') {
        to._tzm = from._tzm;
      }
      if (typeof from._isUTC !== 'undefined') {
        to._isUTC = from._isUTC;
      }
      if (typeof from._offset !== 'undefined') {
        to._offset = from._offset;
      }
      if (typeof from._pf !== 'undefined') {
        to._pf = from._pf;
      }
      if (typeof from._locale !== 'undefined') {
        to._locale = from._locale;
      }
      if (momentProperties.length > 0) {
        for (i in momentProperties) {
          prop = momentProperties[i];
          val = from[prop];
          if (typeof val !== 'undefined') {
            to[prop] = val;
          }
        }
      }
      return to;
    }
    function absRound(number) {
      if (number < 0) {
        return Math.ceil(number);
      } else {
        return Math.floor(number);
      }
    }
    function leftZeroFill(number, targetLength, forceSign) {
      var output = '' + Math.abs(number),
          sign = number >= 0;
      while (output.length < targetLength) {
        output = '0' + output;
      }
      return (sign ? (forceSign ? '+' : '') : '-') + output;
    }
    function positiveMomentsDifference(base, other) {
      var res = {
        milliseconds: 0,
        months: 0
      };
      res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
      if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
      }
      res.milliseconds = +other - +(base.clone().add(res.months, 'M'));
      return res;
    }
    function momentsDifference(base, other) {
      var res;
      other = makeAs(other, base);
      if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
      } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
      }
      return res;
    }
    function createAdder(direction, name) {
      return function(val, period) {
        var dur,
            tmp;
        if (period !== null && !isNaN(+period)) {
          deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
          tmp = val;
          val = period;
          period = tmp;
        }
        val = typeof val === 'string' ? +val : val;
        dur = moment.duration(val, period);
        addOrSubtractDurationFromMoment(this, dur, direction);
        return this;
      };
    }
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
      var milliseconds = duration._milliseconds,
          days = duration._days,
          months = duration._months;
      updateOffset = updateOffset == null ? true : updateOffset;
      if (milliseconds) {
        mom._d.setTime(+mom._d + milliseconds * isAdding);
      }
      if (days) {
        rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
      }
      if (months) {
        rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
      }
      if (updateOffset) {
        moment.updateOffset(mom, days || months);
      }
    }
    function isArray(input) {
      return Object.prototype.toString.call(input) === '[object Array]';
    }
    function isDate(input) {
      return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
    }
    function compareArrays(array1, array2, dontConvert) {
      var len = Math.min(array1.length, array2.length),
          lengthDiff = Math.abs(array1.length - array2.length),
          diffs = 0,
          i;
      for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) || (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
          diffs++;
        }
      }
      return diffs + lengthDiff;
    }
    function normalizeUnits(units) {
      if (units) {
        var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
        units = unitAliases[units] || camelFunctions[lowered] || lowered;
      }
      return units;
    }
    function normalizeObjectUnits(inputObject) {
      var normalizedInput = {},
          normalizedProp,
          prop;
      for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
          normalizedProp = normalizeUnits(prop);
          if (normalizedProp) {
            normalizedInput[normalizedProp] = inputObject[prop];
          }
        }
      }
      return normalizedInput;
    }
    function makeList(field) {
      var count,
          setter;
      if (field.indexOf('week') === 0) {
        count = 7;
        setter = 'day';
      } else if (field.indexOf('month') === 0) {
        count = 12;
        setter = 'month';
      } else {
        return;
      }
      moment[field] = function(format, index) {
        var i,
            getter,
            method = moment._locale[field],
            results = [];
        if (typeof format === 'number') {
          index = format;
          format = undefined;
        }
        getter = function(i) {
          var m = moment().utc().set(setter, i);
          return method.call(moment._locale, m, format || '');
        };
        if (index != null) {
          return getter(index);
        } else {
          for (i = 0; i < count; i++) {
            results.push(getter(i));
          }
          return results;
        }
      };
    }
    function toInt(argumentForCoercion) {
      var coercedNumber = +argumentForCoercion,
          value = 0;
      if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        if (coercedNumber >= 0) {
          value = Math.floor(coercedNumber);
        } else {
          value = Math.ceil(coercedNumber);
        }
      }
      return value;
    }
    function daysInMonth(year, month) {
      return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }
    function weeksInYear(year, dow, doy) {
      return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }
    function daysInYear(year) {
      return isLeapYear(year) ? 366 : 365;
    }
    function isLeapYear(year) {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }
    function checkOverflow(m) {
      var overflow;
      if (m._a && m._pf.overflow === -2) {
        overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH : m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE : m._a[HOUR] < 0 || m._a[HOUR] > 24 || (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 || m._a[SECOND] !== 0 || m._a[MILLISECOND] !== 0)) ? HOUR : m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE : m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND : m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND : -1;
        if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
          overflow = DATE;
        }
        m._pf.overflow = overflow;
      }
    }
    function isValid(m) {
      if (m._isValid == null) {
        m._isValid = !isNaN(m._d.getTime()) && m._pf.overflow < 0 && !m._pf.empty && !m._pf.invalidMonth && !m._pf.nullInput && !m._pf.invalidFormat && !m._pf.userInvalidated;
        if (m._strict) {
          m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0 && m._pf.bigHour === undefined;
        }
      }
      return m._isValid;
    }
    function normalizeLocale(key) {
      return key ? key.toLowerCase().replace('_', '-') : key;
    }
    function chooseLocale(names) {
      var i = 0,
          j,
          next,
          locale,
          split;
      while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
          locale = loadLocale(split.slice(0, j).join('-'));
          if (locale) {
            return locale;
          }
          if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
            break;
          }
          j--;
        }
        i++;
      }
      return null;
    }
    function loadLocale(name) {
      var oldLocale = null;
      if (!locales[name] && hasModule) {
        try {
          oldLocale = moment.locale();
          require('./locale/' + name);
          moment.locale(oldLocale);
        } catch (e) {}
      }
      return locales[name];
    }
    function makeAs(input, model) {
      var res,
          diff;
      if (model._isUTC) {
        res = model.clone();
        diff = (moment.isMoment(input) || isDate(input) ? +input : +moment(input)) - (+res);
        res._d.setTime(+res._d + diff);
        moment.updateOffset(res, false);
        return res;
      } else {
        return moment(input).local();
      }
    }
    extend(Locale.prototype, {
      set: function(config) {
        var prop,
            i;
        for (i in config) {
          prop = config[i];
          if (typeof prop === 'function') {
            this[i] = prop;
          } else {
            this['_' + i] = prop;
          }
        }
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
      },
      _months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
      months: function(m) {
        return this._months[m.month()];
      },
      _monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
      monthsShort: function(m) {
        return this._monthsShort[m.month()];
      },
      monthsParse: function(monthName, format, strict) {
        var i,
            mom,
            regex;
        if (!this._monthsParse) {
          this._monthsParse = [];
          this._longMonthsParse = [];
          this._shortMonthsParse = [];
        }
        for (i = 0; i < 12; i++) {
          mom = moment.utc([2000, i]);
          if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
          }
          if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
          }
          if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
          } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
          } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
          }
        }
      },
      _weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
      weekdays: function(m) {
        return this._weekdays[m.day()];
      },
      _weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
      weekdaysShort: function(m) {
        return this._weekdaysShort[m.day()];
      },
      _weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
      weekdaysMin: function(m) {
        return this._weekdaysMin[m.day()];
      },
      weekdaysParse: function(weekdayName) {
        var i,
            mom,
            regex;
        if (!this._weekdaysParse) {
          this._weekdaysParse = [];
        }
        for (i = 0; i < 7; i++) {
          if (!this._weekdaysParse[i]) {
            mom = moment([2000, 1]).day(i);
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
          }
          if (this._weekdaysParse[i].test(weekdayName)) {
            return i;
          }
        }
      },
      _longDateFormat: {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY LT',
        LLLL: 'dddd, MMMM D, YYYY LT'
      },
      longDateFormat: function(key) {
        var output = this._longDateFormat[key];
        if (!output && this._longDateFormat[key.toUpperCase()]) {
          output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function(val) {
            return val.slice(1);
          });
          this._longDateFormat[key] = output;
        }
        return output;
      },
      isPM: function(input) {
        return ((input + '').toLowerCase().charAt(0) === 'p');
      },
      _meridiemParse: /[ap]\.?m?\.?/i,
      meridiem: function(hours, minutes, isLower) {
        if (hours > 11) {
          return isLower ? 'pm' : 'PM';
        } else {
          return isLower ? 'am' : 'AM';
        }
      },
      _calendar: {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L'
      },
      calendar: function(key, mom, now) {
        var output = this._calendar[key];
        return typeof output === 'function' ? output.apply(mom, [now]) : output;
      },
      _relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
      },
      relativeTime: function(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (typeof output === 'function') ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
      },
      pastFuture: function(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
      },
      ordinal: function(number) {
        return this._ordinal.replace('%d', number);
      },
      _ordinal: '%d',
      _ordinalParse: /\d{1,2}/,
      preparse: function(string) {
        return string;
      },
      postformat: function(string) {
        return string;
      },
      week: function(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
      },
      _week: {
        dow: 0,
        doy: 6
      },
      firstDayOfWeek: function() {
        return this._week.dow;
      },
      firstDayOfYear: function() {
        return this._week.doy;
      },
      _invalidDate: 'Invalid date',
      invalidDate: function() {
        return this._invalidDate;
      }
    });
    function removeFormattingTokens(input) {
      if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
      }
      return input.replace(/\\/g, '');
    }
    function makeFormatFunction(format) {
      var array = format.match(formattingTokens),
          i,
          length;
      for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
          array[i] = formatTokenFunctions[array[i]];
        } else {
          array[i] = removeFormattingTokens(array[i]);
        }
      }
      return function(mom) {
        var output = '';
        for (i = 0; i < length; i++) {
          output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
        }
        return output;
      };
    }
    function formatMoment(m, format) {
      if (!m.isValid()) {
        return m.localeData().invalidDate();
      }
      format = expandFormat(format, m.localeData());
      if (!formatFunctions[format]) {
        formatFunctions[format] = makeFormatFunction(format);
      }
      return formatFunctions[format](m);
    }
    function expandFormat(format, locale) {
      var i = 5;
      function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
      }
      localFormattingTokens.lastIndex = 0;
      while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
      }
      return format;
    }
    function getParseRegexForToken(token, config) {
      var a,
          strict = config._strict;
      switch (token) {
        case 'Q':
          return parseTokenOneDigit;
        case 'DDDD':
          return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
          return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
          return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
          return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
          if (strict) {
            return parseTokenOneDigit;
          }
        case 'SS':
          if (strict) {
            return parseTokenTwoDigits;
          }
        case 'SSS':
          if (strict) {
            return parseTokenThreeDigits;
          }
        case 'DDD':
          return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
          return parseTokenWord;
        case 'a':
        case 'A':
          return config._locale._meridiemParse;
        case 'x':
          return parseTokenOffsetMs;
        case 'X':
          return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
          return parseTokenTimezone;
        case 'T':
          return parseTokenT;
        case 'SSSS':
          return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
          return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
          return parseTokenOneOrTwoDigits;
        case 'Do':
          return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default:
          a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
          return a;
      }
    }
    function utcOffsetFromString(string) {
      string = string || '';
      var possibleTzMatches = (string.match(parseTokenTimezone) || []),
          tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
          parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
          minutes = +(parts[1] * 60) + toInt(parts[2]);
      return parts[0] === '+' ? minutes : -minutes;
    }
    function addTimeToArrayFromToken(token, input, config) {
      var a,
          datePartArray = config._a;
      switch (token) {
        case 'Q':
          if (input != null) {
            datePartArray[MONTH] = (toInt(input) - 1) * 3;
          }
          break;
        case 'M':
        case 'MM':
          if (input != null) {
            datePartArray[MONTH] = toInt(input) - 1;
          }
          break;
        case 'MMM':
        case 'MMMM':
          a = config._locale.monthsParse(input, token, config._strict);
          if (a != null) {
            datePartArray[MONTH] = a;
          } else {
            config._pf.invalidMonth = input;
          }
          break;
        case 'D':
        case 'DD':
          if (input != null) {
            datePartArray[DATE] = toInt(input);
          }
          break;
        case 'Do':
          if (input != null) {
            datePartArray[DATE] = toInt(parseInt(input.match(/\d{1,2}/)[0], 10));
          }
          break;
        case 'DDD':
        case 'DDDD':
          if (input != null) {
            config._dayOfYear = toInt(input);
          }
          break;
        case 'YY':
          datePartArray[YEAR] = moment.parseTwoDigitYear(input);
          break;
        case 'YYYY':
        case 'YYYYY':
        case 'YYYYYY':
          datePartArray[YEAR] = toInt(input);
          break;
        case 'a':
        case 'A':
          config._meridiem = input;
          break;
        case 'h':
        case 'hh':
          config._pf.bigHour = true;
        case 'H':
        case 'HH':
          datePartArray[HOUR] = toInt(input);
          break;
        case 'm':
        case 'mm':
          datePartArray[MINUTE] = toInt(input);
          break;
        case 's':
        case 'ss':
          datePartArray[SECOND] = toInt(input);
          break;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'SSSS':
          datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
          break;
        case 'x':
          config._d = new Date(toInt(input));
          break;
        case 'X':
          config._d = new Date(parseFloat(input) * 1000);
          break;
        case 'Z':
        case 'ZZ':
          config._useUTC = true;
          config._tzm = utcOffsetFromString(input);
          break;
        case 'dd':
        case 'ddd':
        case 'dddd':
          a = config._locale.weekdaysParse(input);
          if (a != null) {
            config._w = config._w || {};
            config._w['d'] = a;
          } else {
            config._pf.invalidWeekday = input;
          }
          break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
          token = token.substr(0, 1);
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
          token = token.substr(0, 2);
          if (input) {
            config._w = config._w || {};
            config._w[token] = toInt(input);
          }
          break;
        case 'gg':
        case 'GG':
          config._w = config._w || {};
          config._w[token] = moment.parseTwoDigitYear(input);
      }
    }
    function dayOfYearFromWeekInfo(config) {
      var w,
          weekYear,
          week,
          weekday,
          dow,
          doy,
          temp;
      w = config._w;
      if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;
        weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
        week = dfl(w.W, 1);
        weekday = dfl(w.E, 1);
      } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;
        weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
        week = dfl(w.w, 1);
        if (w.d != null) {
          weekday = w.d;
          if (weekday < dow) {
            ++week;
          }
        } else if (w.e != null) {
          weekday = w.e + dow;
        } else {
          weekday = dow;
        }
      }
      temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
    function dateFromConfig(config) {
      var i,
          date,
          input = [],
          currentDate,
          yearToUse;
      if (config._d) {
        return;
      }
      currentDate = currentDateArray(config);
      if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
      }
      if (config._dayOfYear) {
        yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);
        if (config._dayOfYear > daysInYear(yearToUse)) {
          config._pf._overflowDayOfYear = true;
        }
        date = makeUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
      }
      for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
      }
      for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
      }
      if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
      }
      config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
      if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
      }
      if (config._nextDay) {
        config._a[HOUR] = 24;
      }
    }
    function dateFromObject(config) {
      var normalizedInput;
      if (config._d) {
        return;
      }
      normalizedInput = normalizeObjectUnits(config._i);
      config._a = [normalizedInput.year, normalizedInput.month, normalizedInput.day || normalizedInput.date, normalizedInput.hour, normalizedInput.minute, normalizedInput.second, normalizedInput.millisecond];
      dateFromConfig(config);
    }
    function currentDateArray(config) {
      var now = new Date();
      if (config._useUTC) {
        return [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
      } else {
        return [now.getFullYear(), now.getMonth(), now.getDate()];
      }
    }
    function makeDateFromStringAndFormat(config) {
      if (config._f === moment.ISO_8601) {
        parseISO(config);
        return;
      }
      config._a = [];
      config._pf.empty = true;
      var string = '' + config._i,
          i,
          parsedInput,
          tokens,
          token,
          skipped,
          stringLength = string.length,
          totalParsedInputLength = 0;
      tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];
      for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        if (parsedInput) {
          skipped = string.substr(0, string.indexOf(parsedInput));
          if (skipped.length > 0) {
            config._pf.unusedInput.push(skipped);
          }
          string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
          totalParsedInputLength += parsedInput.length;
        }
        if (formatTokenFunctions[token]) {
          if (parsedInput) {
            config._pf.empty = false;
          } else {
            config._pf.unusedTokens.push(token);
          }
          addTimeToArrayFromToken(token, parsedInput, config);
        } else if (config._strict && !parsedInput) {
          config._pf.unusedTokens.push(token);
        }
      }
      config._pf.charsLeftOver = stringLength - totalParsedInputLength;
      if (string.length > 0) {
        config._pf.unusedInput.push(string);
      }
      if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
        config._pf.bigHour = undefined;
      }
      config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);
      dateFromConfig(config);
      checkOverflow(config);
    }
    function unescapeFormat(s) {
      return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
      });
    }
    function regexpEscape(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    function makeDateFromStringAndArray(config) {
      var tempConfig,
          bestMoment,
          scoreToBeat,
          i,
          currentScore;
      if (config._f.length === 0) {
        config._pf.invalidFormat = true;
        config._d = new Date(NaN);
        return;
      }
      for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
          tempConfig._useUTC = config._useUTC;
        }
        tempConfig._pf = defaultParsingFlags();
        tempConfig._f = config._f[i];
        makeDateFromStringAndFormat(tempConfig);
        if (!isValid(tempConfig)) {
          continue;
        }
        currentScore += tempConfig._pf.charsLeftOver;
        currentScore += tempConfig._pf.unusedTokens.length * 10;
        tempConfig._pf.score = currentScore;
        if (scoreToBeat == null || currentScore < scoreToBeat) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
        }
      }
      extend(config, bestMoment || tempConfig);
    }
    function parseISO(config) {
      var i,
          l,
          string = config._i,
          match = isoRegex.exec(string);
      if (match) {
        config._pf.iso = true;
        for (i = 0, l = isoDates.length; i < l; i++) {
          if (isoDates[i][1].exec(string)) {
            config._f = isoDates[i][0] + (match[6] || ' ');
            break;
          }
        }
        for (i = 0, l = isoTimes.length; i < l; i++) {
          if (isoTimes[i][1].exec(string)) {
            config._f += isoTimes[i][0];
            break;
          }
        }
        if (string.match(parseTokenTimezone)) {
          config._f += 'Z';
        }
        makeDateFromStringAndFormat(config);
      } else {
        config._isValid = false;
      }
    }
    function makeDateFromString(config) {
      parseISO(config);
      if (config._isValid === false) {
        delete config._isValid;
        moment.createFromInputFallback(config);
      }
    }
    function map(arr, fn) {
      var res = [],
          i;
      for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
      }
      return res;
    }
    function makeDateFromInput(config) {
      var input = config._i,
          matched;
      if (input === undefined) {
        config._d = new Date();
      } else if (isDate(input)) {
        config._d = new Date(+input);
      } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
        config._d = new Date(+matched[1]);
      } else if (typeof input === 'string') {
        makeDateFromString(config);
      } else if (isArray(input)) {
        config._a = map(input.slice(0), function(obj) {
          return parseInt(obj, 10);
        });
        dateFromConfig(config);
      } else if (typeof(input) === 'object') {
        dateFromObject(config);
      } else if (typeof(input) === 'number') {
        config._d = new Date(input);
      } else {
        moment.createFromInputFallback(config);
      }
    }
    function makeDate(y, m, d, h, M, s, ms) {
      var date = new Date(y, m, d, h, M, s, ms);
      if (y < 1970) {
        date.setFullYear(y);
      }
      return date;
    }
    function makeUTCDate(y) {
      var date = new Date(Date.UTC.apply(null, arguments));
      if (y < 1970) {
        date.setUTCFullYear(y);
      }
      return date;
    }
    function parseWeekday(input, locale) {
      if (typeof input === 'string') {
        if (!isNaN(input)) {
          input = parseInt(input, 10);
        } else {
          input = locale.weekdaysParse(input);
          if (typeof input !== 'number') {
            return null;
          }
        }
      }
      return input;
    }
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
      return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }
    function relativeTime(posNegDuration, withoutSuffix, locale) {
      var duration = moment.duration(posNegDuration).abs(),
          seconds = round(duration.as('s')),
          minutes = round(duration.as('m')),
          hours = round(duration.as('h')),
          days = round(duration.as('d')),
          months = round(duration.as('M')),
          years = round(duration.as('y')),
          args = seconds < relativeTimeThresholds.s && ['s', seconds] || minutes === 1 && ['m'] || minutes < relativeTimeThresholds.m && ['mm', minutes] || hours === 1 && ['h'] || hours < relativeTimeThresholds.h && ['hh', hours] || days === 1 && ['d'] || days < relativeTimeThresholds.d && ['dd', days] || months === 1 && ['M'] || months < relativeTimeThresholds.M && ['MM', months] || years === 1 && ['y'] || ['yy', years];
      args[2] = withoutSuffix;
      args[3] = +posNegDuration > 0;
      args[4] = locale;
      return substituteTimeAgo.apply({}, args);
    }
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
      var end = firstDayOfWeekOfYear - firstDayOfWeek,
          daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
          adjustedMoment;
      if (daysToDayOfWeek > end) {
        daysToDayOfWeek -= 7;
      }
      if (daysToDayOfWeek < end - 7) {
        daysToDayOfWeek += 7;
      }
      adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
      return {
        week: Math.ceil(adjustedMoment.dayOfYear() / 7),
        year: adjustedMoment.year()
      };
    }
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
      var d = makeUTCDate(year, 0, 1).getUTCDay(),
          daysToAdd,
          dayOfYear;
      d = d === 0 ? 7 : d;
      weekday = weekday != null ? weekday : firstDayOfWeek;
      daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
      dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
      return {
        year: dayOfYear > 0 ? year : year - 1,
        dayOfYear: dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
      };
    }
    function makeMoment(config) {
      var input = config._i,
          format = config._f,
          res;
      config._locale = config._locale || moment.localeData(config._l);
      if (input === null || (format === undefined && input === '')) {
        return moment.invalid({nullInput: true});
      }
      if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
      }
      if (moment.isMoment(input)) {
        return new Moment(input, true);
      } else if (format) {
        if (isArray(format)) {
          makeDateFromStringAndArray(config);
        } else {
          makeDateFromStringAndFormat(config);
        }
      } else {
        makeDateFromInput(config);
      }
      res = new Moment(config);
      if (res._nextDay) {
        res.add(1, 'd');
        res._nextDay = undefined;
      }
      return res;
    }
    moment = function(input, format, locale, strict) {
      var c;
      if (typeof(locale) === 'boolean') {
        strict = locale;
        locale = undefined;
      }
      c = {};
      c._isAMomentObject = true;
      c._i = input;
      c._f = format;
      c._l = locale;
      c._strict = strict;
      c._isUTC = false;
      c._pf = defaultParsingFlags();
      return makeMoment(c);
    };
    moment.suppressDeprecationWarnings = false;
    moment.createFromInputFallback = deprecate('moment construction falls back to js Date. This is ' + 'discouraged and will be removed in upcoming major ' + 'release. Please refer to ' + 'https://github.com/moment/moment/issues/1407 for more info.', function(config) {
      config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    });
    function pickBy(fn, moments) {
      var res,
          i;
      if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
      }
      if (!moments.length) {
        return moment();
      }
      res = moments[0];
      for (i = 1; i < moments.length; ++i) {
        if (moments[i][fn](res)) {
          res = moments[i];
        }
      }
      return res;
    }
    moment.min = function() {
      var args = [].slice.call(arguments, 0);
      return pickBy('isBefore', args);
    };
    moment.max = function() {
      var args = [].slice.call(arguments, 0);
      return pickBy('isAfter', args);
    };
    moment.utc = function(input, format, locale, strict) {
      var c;
      if (typeof(locale) === 'boolean') {
        strict = locale;
        locale = undefined;
      }
      c = {};
      c._isAMomentObject = true;
      c._useUTC = true;
      c._isUTC = true;
      c._l = locale;
      c._i = input;
      c._f = format;
      c._strict = strict;
      c._pf = defaultParsingFlags();
      return makeMoment(c).utc();
    };
    moment.unix = function(input) {
      return moment(input * 1000);
    };
    moment.duration = function(input, key) {
      var duration = input,
          match = null,
          sign,
          ret,
          parseIso,
          diffRes;
      if (moment.isDuration(input)) {
        duration = {
          ms: input._milliseconds,
          d: input._days,
          M: input._months
        };
      } else if (typeof input === 'number') {
        duration = {};
        if (key) {
          duration[key] = input;
        } else {
          duration.milliseconds = input;
        }
      } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
          y: 0,
          d: toInt(match[DATE]) * sign,
          h: toInt(match[HOUR]) * sign,
          m: toInt(match[MINUTE]) * sign,
          s: toInt(match[SECOND]) * sign,
          ms: toInt(match[MILLISECOND]) * sign
        };
      } else if (!!(match = isoDurationRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        parseIso = function(inp) {
          var res = inp && parseFloat(inp.replace(',', '.'));
          return (isNaN(res) ? 0 : res) * sign;
        };
        duration = {
          y: parseIso(match[2]),
          M: parseIso(match[3]),
          d: parseIso(match[4]),
          h: parseIso(match[5]),
          m: parseIso(match[6]),
          s: parseIso(match[7]),
          w: parseIso(match[8])
        };
      } else if (duration == null) {
        duration = {};
      } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(moment(duration.from), moment(duration.to));
        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
      }
      ret = new Duration(duration);
      if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
      }
      return ret;
    };
    moment.version = VERSION;
    moment.defaultFormat = isoFormat;
    moment.ISO_8601 = function() {};
    moment.momentProperties = momentProperties;
    moment.updateOffset = function() {};
    moment.relativeTimeThreshold = function(threshold, limit) {
      if (relativeTimeThresholds[threshold] === undefined) {
        return false;
      }
      if (limit === undefined) {
        return relativeTimeThresholds[threshold];
      }
      relativeTimeThresholds[threshold] = limit;
      return true;
    };
    moment.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', function(key, value) {
      return moment.locale(key, value);
    });
    moment.locale = function(key, values) {
      var data;
      if (key) {
        if (typeof(values) !== 'undefined') {
          data = moment.defineLocale(key, values);
        } else {
          data = moment.localeData(key);
        }
        if (data) {
          moment.duration._locale = moment._locale = data;
        }
      }
      return moment._locale._abbr;
    };
    moment.defineLocale = function(name, values) {
      if (values !== null) {
        values.abbr = name;
        if (!locales[name]) {
          locales[name] = new Locale();
        }
        locales[name].set(values);
        moment.locale(name);
        return locales[name];
      } else {
        delete locales[name];
        return null;
      }
    };
    moment.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', function(key) {
      return moment.localeData(key);
    });
    moment.localeData = function(key) {
      var locale;
      if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
      }
      if (!key) {
        return moment._locale;
      }
      if (!isArray(key)) {
        locale = loadLocale(key);
        if (locale) {
          return locale;
        }
        key = [key];
      }
      return chooseLocale(key);
    };
    moment.isMoment = function(obj) {
      return obj instanceof Moment || (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };
    moment.isDuration = function(obj) {
      return obj instanceof Duration;
    };
    for (i = lists.length - 1; i >= 0; --i) {
      makeList(lists[i]);
    }
    moment.normalizeUnits = function(units) {
      return normalizeUnits(units);
    };
    moment.invalid = function(flags) {
      var m = moment.utc(NaN);
      if (flags != null) {
        extend(m._pf, flags);
      } else {
        m._pf.userInvalidated = true;
      }
      return m;
    };
    moment.parseZone = function() {
      return moment.apply(null, arguments).parseZone();
    };
    moment.parseTwoDigitYear = function(input) {
      return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };
    moment.isDate = isDate;
    extend(moment.fn = Moment.prototype, {
      clone: function() {
        return moment(this);
      },
      valueOf: function() {
        return +this._d - ((this._offset || 0) * 60000);
      },
      unix: function() {
        return Math.floor(+this / 1000);
      },
      toString: function() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
      },
      toDate: function() {
        return this._offset ? new Date(+this) : this._d;
      },
      toISOString: function() {
        var m = moment(this).utc();
        if (0 < m.year() && m.year() <= 9999) {
          if ('function' === typeof Date.prototype.toISOString) {
            return this.toDate().toISOString();
          } else {
            return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
          }
        } else {
          return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
      },
      toArray: function() {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hours(), m.minutes(), m.seconds(), m.milliseconds()];
      },
      isValid: function() {
        return isValid(this);
      },
      isDSTShifted: function() {
        if (this._a) {
          return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
        }
        return false;
      },
      parsingFlags: function() {
        return extend({}, this._pf);
      },
      invalidAt: function() {
        return this._pf.overflow;
      },
      utc: function(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
      },
      local: function(keepLocalTime) {
        if (this._isUTC) {
          this.utcOffset(0, keepLocalTime);
          this._isUTC = false;
          if (keepLocalTime) {
            this.subtract(this._dateUtcOffset(), 'm');
          }
        }
        return this;
      },
      format: function(inputString) {
        var output = formatMoment(this, inputString || moment.defaultFormat);
        return this.localeData().postformat(output);
      },
      add: createAdder(1, 'add'),
      subtract: createAdder(-1, 'subtract'),
      diff: function(input, units, asFloat) {
        var that = makeAs(input, this),
            zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
            anchor,
            diff,
            output,
            daysAdjust;
        units = normalizeUnits(units);
        if (units === 'year' || units === 'month' || units === 'quarter') {
          output = monthDiff(this, that);
          if (units === 'quarter') {
            output = output / 3;
          } else if (units === 'year') {
            output = output / 12;
          }
        } else {
          diff = this - that;
          output = units === 'second' ? diff / 1e3 : units === 'minute' ? diff / 6e4 : units === 'hour' ? diff / 36e5 : units === 'day' ? (diff - zoneDiff) / 864e5 : units === 'week' ? (diff - zoneDiff) / 6048e5 : diff;
        }
        return asFloat ? output : absRound(output);
      },
      from: function(time, withoutSuffix) {
        return moment.duration({
          to: this,
          from: time
        }).locale(this.locale()).humanize(!withoutSuffix);
      },
      fromNow: function(withoutSuffix) {
        return this.from(moment(), withoutSuffix);
      },
      calendar: function(time) {
        var now = time || moment(),
            sod = makeAs(now, this).startOf('day'),
            diff = this.diff(sod, 'days', true),
            format = diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
        return this.format(this.localeData().calendar(format, this, moment(now)));
      },
      isLeapYear: function() {
        return isLeapYear(this.year());
      },
      isDST: function() {
        return (this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset());
      },
      day: function(input) {
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
          input = parseWeekday(input, this.localeData());
          return this.add(input - day, 'd');
        } else {
          return day;
        }
      },
      month: makeAccessor('Month', true),
      startOf: function(units) {
        units = normalizeUnits(units);
        switch (units) {
          case 'year':
            this.month(0);
          case 'quarter':
          case 'month':
            this.date(1);
          case 'week':
          case 'isoWeek':
          case 'day':
            this.hours(0);
          case 'hour':
            this.minutes(0);
          case 'minute':
            this.seconds(0);
          case 'second':
            this.milliseconds(0);
        }
        if (units === 'week') {
          this.weekday(0);
        } else if (units === 'isoWeek') {
          this.isoWeekday(1);
        }
        if (units === 'quarter') {
          this.month(Math.floor(this.month() / 3) * 3);
        }
        return this;
      },
      endOf: function(units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
          return this;
        }
        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
      },
      isAfter: function(input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
          input = moment.isMoment(input) ? input : moment(input);
          return +this > +input;
        } else {
          inputMs = moment.isMoment(input) ? +input : +moment(input);
          return inputMs < +this.clone().startOf(units);
        }
      },
      isBefore: function(input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
          input = moment.isMoment(input) ? input : moment(input);
          return +this < +input;
        } else {
          inputMs = moment.isMoment(input) ? +input : +moment(input);
          return +this.clone().endOf(units) < inputMs;
        }
      },
      isBetween: function(from, to, units) {
        return this.isAfter(from, units) && this.isBefore(to, units);
      },
      isSame: function(input, units) {
        var inputMs;
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
          input = moment.isMoment(input) ? input : moment(input);
          return +this === +input;
        } else {
          inputMs = +moment(input);
          return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
        }
      },
      min: deprecate('moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548', function(other) {
        other = moment.apply(null, arguments);
        return other < this ? this : other;
      }),
      max: deprecate('moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548', function(other) {
        other = moment.apply(null, arguments);
        return other > this ? this : other;
      }),
      zone: deprecate('moment().zone is deprecated, use moment().utcOffset instead. ' + 'https://github.com/moment/moment/issues/1779', function(input, keepLocalTime) {
        if (input != null) {
          if (typeof input !== 'string') {
            input = -input;
          }
          this.utcOffset(input, keepLocalTime);
          return this;
        } else {
          return -this.utcOffset();
        }
      }),
      utcOffset: function(input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (input != null) {
          if (typeof input === 'string') {
            input = utcOffsetFromString(input);
          }
          if (Math.abs(input) < 16) {
            input = input * 60;
          }
          if (!this._isUTC && keepLocalTime) {
            localAdjust = this._dateUtcOffset();
          }
          this._offset = input;
          this._isUTC = true;
          if (localAdjust != null) {
            this.add(localAdjust, 'm');
          }
          if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
              addOrSubtractDurationFromMoment(this, moment.duration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
              this._changeInProgress = true;
              moment.updateOffset(this, true);
              this._changeInProgress = null;
            }
          }
          return this;
        } else {
          return this._isUTC ? offset : this._dateUtcOffset();
        }
      },
      isLocal: function() {
        return !this._isUTC;
      },
      isUtcOffset: function() {
        return this._isUTC;
      },
      isUtc: function() {
        return this._isUTC && this._offset === 0;
      },
      zoneAbbr: function() {
        return this._isUTC ? 'UTC' : '';
      },
      zoneName: function() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
      },
      parseZone: function() {
        if (this._tzm) {
          this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
          this.utcOffset(utcOffsetFromString(this._i));
        }
        return this;
      },
      hasAlignedHourOffset: function(input) {
        if (!input) {
          input = 0;
        } else {
          input = moment(input).utcOffset();
        }
        return (this.utcOffset() - input) % 60 === 0;
      },
      daysInMonth: function() {
        return daysInMonth(this.year(), this.month());
      },
      dayOfYear: function(input) {
        var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
      },
      quarter: function(input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
      },
      weekYear: function(input) {
        var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
        return input == null ? year : this.add((input - year), 'y');
      },
      isoWeekYear: function(input) {
        var year = weekOfYear(this, 1, 4).year;
        return input == null ? year : this.add((input - year), 'y');
      },
      week: function(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
      },
      isoWeek: function(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
      },
      weekday: function(input) {
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
      },
      isoWeekday: function(input) {
        return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
      },
      isoWeeksInYear: function() {
        return weeksInYear(this.year(), 1, 4);
      },
      weeksInYear: function() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
      },
      get: function(units) {
        units = normalizeUnits(units);
        return this[units]();
      },
      set: function(units, value) {
        var unit;
        if (typeof units === 'object') {
          for (unit in units) {
            this.set(unit, units[unit]);
          }
        } else {
          units = normalizeUnits(units);
          if (typeof this[units] === 'function') {
            this[units](value);
          }
        }
        return this;
      },
      locale: function(key) {
        var newLocaleData;
        if (key === undefined) {
          return this._locale._abbr;
        } else {
          newLocaleData = moment.localeData(key);
          if (newLocaleData != null) {
            this._locale = newLocaleData;
          }
          return this;
        }
      },
      lang: deprecate('moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.', function(key) {
        if (key === undefined) {
          return this.localeData();
        } else {
          return this.locale(key);
        }
      }),
      localeData: function() {
        return this._locale;
      },
      _dateUtcOffset: function() {
        return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
      }
    });
    function rawMonthSetter(mom, value) {
      var dayOfMonth;
      if (typeof value === 'string') {
        value = mom.localeData().monthsParse(value);
        if (typeof value !== 'number') {
          return mom;
        }
      }
      dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
      mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
      return mom;
    }
    function rawGetter(mom, unit) {
      return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }
    function rawSetter(mom, unit, value) {
      if (unit === 'Month') {
        return rawMonthSetter(mom, value);
      } else {
        return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
      }
    }
    function makeAccessor(unit, keepTime) {
      return function(value) {
        if (value != null) {
          rawSetter(this, unit, value);
          moment.updateOffset(this, keepTime);
          return this;
        } else {
          return rawGetter(this, unit);
        }
      };
    }
    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;
    moment.fn.toJSON = moment.fn.toISOString;
    moment.fn.isUTC = moment.fn.isUtc;
    function daysToYears(days) {
      return days * 400 / 146097;
    }
    function yearsToDays(years) {
      return years * 146097 / 400;
    }
    extend(moment.duration.fn = Duration.prototype, {
      _bubble: function() {
        var milliseconds = this._milliseconds,
            days = this._days,
            months = this._months,
            data = this._data,
            seconds,
            minutes,
            hours,
            years = 0;
        data.milliseconds = milliseconds % 1000;
        seconds = absRound(milliseconds / 1000);
        data.seconds = seconds % 60;
        minutes = absRound(seconds / 60);
        data.minutes = minutes % 60;
        hours = absRound(minutes / 60);
        data.hours = hours % 24;
        days += absRound(hours / 24);
        years = absRound(daysToYears(days));
        days -= absRound(yearsToDays(years));
        months += absRound(days / 30);
        days %= 30;
        years += absRound(months / 12);
        months %= 12;
        data.days = days;
        data.months = months;
        data.years = years;
      },
      abs: function() {
        this._milliseconds = Math.abs(this._milliseconds);
        this._days = Math.abs(this._days);
        this._months = Math.abs(this._months);
        this._data.milliseconds = Math.abs(this._data.milliseconds);
        this._data.seconds = Math.abs(this._data.seconds);
        this._data.minutes = Math.abs(this._data.minutes);
        this._data.hours = Math.abs(this._data.hours);
        this._data.months = Math.abs(this._data.months);
        this._data.years = Math.abs(this._data.years);
        return this;
      },
      weeks: function() {
        return absRound(this.days() / 7);
      },
      valueOf: function() {
        return this._milliseconds + this._days * 864e5 + (this._months % 12) * 2592e6 + toInt(this._months / 12) * 31536e6;
      },
      humanize: function(withSuffix) {
        var output = relativeTime(this, !withSuffix, this.localeData());
        if (withSuffix) {
          output = this.localeData().pastFuture(+this, output);
        }
        return this.localeData().postformat(output);
      },
      add: function(input, val) {
        var dur = moment.duration(input, val);
        this._milliseconds += dur._milliseconds;
        this._days += dur._days;
        this._months += dur._months;
        this._bubble();
        return this;
      },
      subtract: function(input, val) {
        var dur = moment.duration(input, val);
        this._milliseconds -= dur._milliseconds;
        this._days -= dur._days;
        this._months -= dur._months;
        this._bubble();
        return this;
      },
      get: function(units) {
        units = normalizeUnits(units);
        return this[units.toLowerCase() + 's']();
      },
      as: function(units) {
        var days,
            months;
        units = normalizeUnits(units);
        if (units === 'month' || units === 'year') {
          days = this._days + this._milliseconds / 864e5;
          months = this._months + daysToYears(days) * 12;
          return units === 'month' ? months : months / 12;
        } else {
          days = this._days + Math.round(yearsToDays(this._months / 12));
          switch (units) {
            case 'week':
              return days / 7 + this._milliseconds / 6048e5;
            case 'day':
              return days + this._milliseconds / 864e5;
            case 'hour':
              return days * 24 + this._milliseconds / 36e5;
            case 'minute':
              return days * 24 * 60 + this._milliseconds / 6e4;
            case 'second':
              return days * 24 * 60 * 60 + this._milliseconds / 1000;
            case 'millisecond':
              return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
            default:
              throw new Error('Unknown unit ' + units);
          }
        }
      },
      lang: moment.fn.lang,
      locale: moment.fn.locale,
      toIsoString: deprecate('toIsoString() is deprecated. Please use toISOString() instead ' + '(notice the capitals)', function() {
        return this.toISOString();
      }),
      toISOString: function() {
        var years = Math.abs(this.years()),
            months = Math.abs(this.months()),
            days = Math.abs(this.days()),
            hours = Math.abs(this.hours()),
            minutes = Math.abs(this.minutes()),
            seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);
        if (!this.asSeconds()) {
          return 'P0D';
        }
        return (this.asSeconds() < 0 ? '-' : '') + 'P' + (years ? years + 'Y' : '') + (months ? months + 'M' : '') + (days ? days + 'D' : '') + ((hours || minutes || seconds) ? 'T' : '') + (hours ? hours + 'H' : '') + (minutes ? minutes + 'M' : '') + (seconds ? seconds + 'S' : '');
      },
      localeData: function() {
        return this._locale;
      },
      toJSON: function() {
        return this.toISOString();
      }
    });
    moment.duration.fn.toString = moment.duration.fn.toISOString;
    function makeDurationGetter(name) {
      moment.duration.fn[name] = function() {
        return this._data[name];
      };
    }
    for (i in unitMillisecondFactors) {
      if (hasOwnProp(unitMillisecondFactors, i)) {
        makeDurationGetter(i.toLowerCase());
      }
    }
    moment.duration.fn.asMilliseconds = function() {
      return this.as('ms');
    };
    moment.duration.fn.asSeconds = function() {
      return this.as('s');
    };
    moment.duration.fn.asMinutes = function() {
      return this.as('m');
    };
    moment.duration.fn.asHours = function() {
      return this.as('h');
    };
    moment.duration.fn.asDays = function() {
      return this.as('d');
    };
    moment.duration.fn.asWeeks = function() {
      return this.as('weeks');
    };
    moment.duration.fn.asMonths = function() {
      return this.as('M');
    };
    moment.duration.fn.asYears = function() {
      return this.as('y');
    };
    moment.locale('en', {
      ordinalParse: /\d{1,2}(th|st|nd|rd)/,
      ordinal: function(number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' : (b === 1) ? 'st' : (b === 2) ? 'nd' : (b === 3) ? 'rd' : 'th';
        return number + output;
      }
    });
    function makeGlobal(shouldDeprecate) {
      if (typeof ender !== 'undefined') {
        return;
      }
      oldGlobalMoment = globalScope.moment;
      if (shouldDeprecate) {
        globalScope.moment = deprecate('Accessing Moment through the global scope is ' + 'deprecated, and will be removed in an upcoming ' + 'release.', moment);
      } else {
        globalScope.moment = moment;
      }
    }
    if (hasModule) {
      module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
      define(function(require, exports, module) {
        if (module.config && module.config() && module.config().noGlobal === true) {
          globalScope.moment = oldGlobalMoment;
        }
        return moment;
      });
      makeGlobal(true);
    } else {
      makeGlobal();
    }
  }).call(this);
  return {};
}.call(Reflect.global);


//# sourceURL=/Users/blixt/src/starbounded/node_modules/moment/moment.js
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],14:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],15:[function(require,module,exports){
"use strict";
var wrappy = require('wrappy');
module.exports = wrappy(once);
once.proto = once(function() {
  Object.defineProperty(Function.prototype, 'once', {
    value: function() {
      return once(this);
    },
    configurable: true
  });
});
function once(fn) {
  var f = function() {
    if (f.called)
      return f.value;
    f.called = true;
    return f.value = fn.apply(this, arguments);
  };
  f.called = false;
  return f;
}


//# sourceURL=/Users/blixt/src/starbounded/node_modules/once/once.js
},{"wrappy":14}],16:[function(require,module,exports){
"use strict";
exports.AssetsManager = require('./lib/assetsmanager');


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-assets/index.js
},{"./lib/assetsmanager":17}],17:[function(require,module,exports){
(function (process,__dirname){
"use strict";
var convert = require('color-convert');
var EventEmitter = require('events');
var merge = require('merge');
var util = require('util');
var workerproxy = require('workerproxy');
var ResourceLoader = require('./resourceloader');
module.exports = AssetsManager;
function AssetsManager(opt_options) {
  EventEmitter.call(this);
  var options = {
    workerPath: __dirname + '/../worker.js',
    workers: 1
  };
  Object.seal(options);
  merge(options, opt_options);
  Object.freeze(options);
  this.options = options;
  var workers = [];
  for (var i = 0; i < options.workers; i++) {
    workers.push(new Worker(options.workerPath));
  }
  this.api = workerproxy(workers);
  this._emitting = {};
  this._blobCache = Object.create(null);
  this._framesCache = Object.create(null);
  this._imageCache = Object.create(null);
}
util.inherits(AssetsManager, EventEmitter);
AssetsManager.prototype.addDirectory = function(path, dirEntry, callback) {
  var self = this;
  var pending = 1;
  var decrementPending = function() {
    pending--;
    if (!pending) {
      callback(null);
    }
  };
  var reader = dirEntry.createReader();
  var next = function() {
    reader.readEntries(function(entries) {
      if (!entries.length) {
        process.nextTick(decrementPending);
        return;
      }
      entries.forEach(function(entry) {
        if (entry.name[0] == '.')
          return;
        var entryPath = path + '/' + entry.name;
        if (entry.isDirectory) {
          pending++;
          self.addDirectory(entryPath, entry, decrementPending);
        } else {
          pending++;
          entry.file(function(file) {
            self.addFile(entryPath, file, decrementPending);
          }, decrementPending);
        }
      });
      next();
    });
  };
  next();
};
AssetsManager.prototype.addFile = function(path, file, callback) {
  this.api.addFile.broadcast(path, file, callback);
};
AssetsManager.prototype.addRoot = function(dirEntry, callback) {
  this.addDirectory('', dirEntry, callback);
};
AssetsManager.prototype.emitOncePerTick = function(event) {
  if (this._emitting[event])
    return;
  this._emitting[event] = true;
  var self = this,
      args = Array.prototype.slice.call(arguments);
  process.nextTick(function() {
    self.emit.apply(self, args);
    delete self._emitting[event];
  });
};
AssetsManager.prototype.getBlobURL = function(path, callback) {
  if (path in this._blobCache) {
    callback(null, this._blobCache[path]);
    return;
  }
  var self = this;
  this.api.getBlobURL(path, function(err, url) {
    if (!err)
      self._blobCache[path] = url;
    callback(err, url);
  });
};
AssetsManager.prototype.getFrames = function(imagePath, opt_cachePath) {
  var $__0 = this;
  var dotOffset = imagePath.lastIndexOf('.');
  var path = imagePath.substr(0, dotOffset) + '.frames';
  if (path in this._framesCache)
    return this._framesCache[path];
  this._framesCache[path] = null;
  this.api.getJSON(path, (function(err, frames) {
    if (err) {
      var slashOffset = path.lastIndexOf('/');
      var defaultPath = path.substr(0, slashOffset + 1) + 'default.frames';
      if (path != defaultPath) {
        $__0.getFrames(defaultPath, path);
        return;
      }
      console.error(err.stack);
      return;
    }
    if (opt_cachePath)
      $__0._framesCache[opt_cachePath] = frames;
    $__0._framesCache[path] = frames;
  }));
  return null;
};
AssetsManager.prototype.getImage = function(path) {
  if (path in this._imageCache)
    return this._imageCache[path];
  var self = this;
  var ops = path.split('?');
  var filePath = ops.shift();
  if (!(filePath in this._imageCache)) {
    this._imageCache[filePath] = null;
    this.getBlobURL(filePath, function(err, url) {
      if (err) {
        console.warn('Failed to load %s (%s)', filePath, err.message);
        return;
      }
      var image = new Image();
      image.src = url;
      image.onload = function() {
        self._imageCache[filePath] = image;
        self.emitOncePerTick('images');
      };
    });
  }
  var image = this._imageCache[filePath];
  if (!image)
    return null;
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  var hue = 0,
      flipEveryX = 0,
      replace;
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i].split(/[=;]/);
    switch (op[0]) {
      case 'flipgridx':
        flipEveryX = parseInt(op[1]);
        if (image.width % flipEveryX) {
          console.warn(image.width + ' not divisible by ' + flipEveryX + ' (' + path + ')');
        }
        break;
      case 'hueshift':
        hue = parseFloat(op[1]);
        break;
      case 'replace':
        if (!replace)
          replace = {};
        for (var i = 1; i < op.length; i += 2) {
          var from = [parseInt(op[i].substr(0, 2), 16), parseInt(op[i].substr(2, 2), 16), parseInt(op[i].substr(4, 2), 16)];
          var to = [parseInt(op[i + 1].substr(0, 2), 16), parseInt(op[i + 1].substr(2, 2), 16), parseInt(op[i + 1].substr(4, 2), 16)];
          replace[from] = to;
        }
        break;
      default:
        console.warn('Unsupported image operation:', op);
    }
  }
  var context = canvas.getContext('2d');
  if (flipEveryX) {
    context.save();
    context.scale(-1, 1);
    for (var x = 0; x + flipEveryX <= image.width; x += flipEveryX) {
      var flippedX = -(x + flipEveryX),
          dw = flipEveryX,
          dh = image.height;
      context.drawImage(image, x, 0, dw, dh, flippedX, 0, dw, dh);
    }
    context.restore();
  } else {
    context.drawImage(image, 0, 0);
  }
  if (hue || replace) {
    var imageData = context.getImageData(0, 0, image.width, image.height),
        data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      if (replace) {
        var color = replace[data[i] + ',' + data[i + 1] + ',' + data[i + 2]];
        if (color) {
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
        }
      }
      if (hue) {
        var hsv = convert.rgb2hsv(data[i], data[i + 1], data[i + 2]);
        hsv[0] += hue;
        if (hsv[0] < 0)
          hsv[0] += 360;
        else if (hsv[0] >= 360)
          hsv[0] -= 360;
        var rgb = convert.hsv2rgb(hsv);
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
      }
    }
    context.putImageData(imageData, 0, 0);
  }
  self._imageCache[path] = null;
  image = new Image();
  image.onload = function() {
    self._imageCache[path] = image;
    self.emitOncePerTick('images');
  };
  image.src = canvas.toDataURL();
  return null;
};
AssetsManager.prototype.getResourceLoader = function(extension) {
  return new ResourceLoader(this, extension);
};
AssetsManager.prototype.getResourcePath = function(resource, path) {
  if (path[0] == '/')
    return path;
  var base = resource.__path__;
  return base.substr(0, base.lastIndexOf('/') + 1) + path;
};
AssetsManager.prototype.getTileImage = function(resource, opt_hueShift) {
  var texture = resource.renderParameters && resource.renderParameters.texture;
  if (!texture) {
    throw new Error('Field "renderParameters.texture" not in resource: ' + JSON.stringify(resource));
  }
  var path = this.getResourcePath(resource, texture);
  if (opt_hueShift) {
    path += '?hueshift=' + (opt_hueShift / 255 * 360);
  }
  return this.getImage(path);
};
AssetsManager.prototype.loadResources = function(extension, callback) {
  var self = this;
  this.api.loadResources(extension, function(err, resources) {
    callback(err, resources);
    if (!err) {
      self.emitOncePerTick('resources');
    }
  });
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-assets/lib/assetsmanager.js
}).call(this,require('_process'),"/node_modules/starbound-assets/lib")

},{"./resourceloader":18,"_process":9,"color-convert":20,"events":6,"merge":21,"util":11,"workerproxy":22}],18:[function(require,module,exports){
"use strict";
module.exports = ResourceLoader;
function ResourceLoader(assetsManager, extension) {
  this.assets = assetsManager;
  this.extension = extension;
  this.index = null;
  this._loadingIndex = false;
}
ResourceLoader.prototype.get = function(id) {
  if (!this.index)
    return null;
  return this.index[id] || null;
};
ResourceLoader.prototype.loadIndex = function() {
  if (this._loadingIndex)
    return;
  this._loadingIndex = true;
  var self = this;
  this.assets.loadResources(this.extension, function(err, index) {
    self._loadingIndex = false;
    self.index = index;
  });
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-assets/lib/resourceloader.js
},{}],19:[function(require,module,exports){
/* MIT license */

module.exports = {
  rgb2hsl: rgb2hsl,
  rgb2hsv: rgb2hsv,
  rgb2hwb: rgb2hwb,
  rgb2cmyk: rgb2cmyk,
  rgb2keyword: rgb2keyword,
  rgb2xyz: rgb2xyz,
  rgb2lab: rgb2lab,
  rgb2lch: rgb2lch,

  hsl2rgb: hsl2rgb,
  hsl2hsv: hsl2hsv,
  hsl2hwb: hsl2hwb,
  hsl2cmyk: hsl2cmyk,
  hsl2keyword: hsl2keyword,

  hsv2rgb: hsv2rgb,
  hsv2hsl: hsv2hsl,
  hsv2hwb: hsv2hwb,
  hsv2cmyk: hsv2cmyk,
  hsv2keyword: hsv2keyword,

  hwb2rgb: hwb2rgb,
  hwb2hsl: hwb2hsl,
  hwb2hsv: hwb2hsv,
  hwb2cmyk: hwb2cmyk,
  hwb2keyword: hwb2keyword,

  cmyk2rgb: cmyk2rgb,
  cmyk2hsl: cmyk2hsl,
  cmyk2hsv: cmyk2hsv,
  cmyk2hwb: cmyk2hwb,
  cmyk2keyword: cmyk2keyword,

  keyword2rgb: keyword2rgb,
  keyword2hsl: keyword2hsl,
  keyword2hsv: keyword2hsv,
  keyword2hwb: keyword2hwb,
  keyword2cmyk: keyword2cmyk,
  keyword2lab: keyword2lab,
  keyword2xyz: keyword2xyz,

  xyz2rgb: xyz2rgb,
  xyz2lab: xyz2lab,
  xyz2lch: xyz2lch,

  lab2xyz: lab2xyz,
  lab2rgb: lab2rgb,
  lab2lch: lab2lch,

  lch2lab: lch2lab,
  lch2xyz: lch2xyz,
  lch2rgb: lch2rgb
}


function rgb2hsl(rgb) {
  var r = rgb[0]/255,
      g = rgb[1]/255,
      b = rgb[2]/255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, l;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g)/ delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  l = (min + max) / 2;

  if (max == min)
    s = 0;
  else if (l <= 0.5)
    s = delta / (max + min);
  else
    s = delta / (2 - max - min);

  return [h, s * 100, l * 100];
}

function rgb2hsv(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, v;

  if (max == 0)
    s = 0;
  else
    s = (delta/max * 1000)/10;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  v = ((max / 255) * 1000) / 10;

  return [h, s, v];
}

function rgb2hwb(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      h = rgb2hsl(rgb)[0],
      w = 1/255 * Math.min(r, Math.min(g, b)),
      b = 1 - 1/255 * Math.max(r, Math.max(g, b));

  return [h, w * 100, b * 100];
}

function rgb2cmyk(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      c, m, y, k;

  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k) || 0;
  m = (1 - g - k) / (1 - k) || 0;
  y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
}

function rgb2keyword(rgb) {
  return reverseKeywords[JSON.stringify(rgb)];
}

function rgb2xyz(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y *100, z * 100];
}

function rgb2lab(rgb) {
  var xyz = rgb2xyz(rgb),
        x = xyz[0],
        y = xyz[1],
        z = xyz[2],
        l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}

function rgb2lch(args) {
  return lab2lch(rgb2lab(args));
}

function hsl2rgb(hsl) {
  var h = hsl[0] / 360,
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      t1, t2, t3, rgb, val;

  if (s == 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5)
    t2 = l * (1 + s);
  else
    t2 = l + s - l * s;
  t1 = 2 * l - t2;

  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * - (i - 1);
    t3 < 0 && t3++;
    t3 > 1 && t3--;

    if (6 * t3 < 1)
      val = t1 + (t2 - t1) * 6 * t3;
    else if (2 * t3 < 1)
      val = t2;
    else if (3 * t3 < 2)
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    else
      val = t1;

    rgb[i] = val * 255;
  }

  return rgb;
}

function hsl2hsv(hsl) {
  var h = hsl[0],
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      sv, v;
  l *= 2;
  s *= (l <= 1) ? l : 2 - l;
  v = (l + s) / 2;
  sv = (2 * s) / (l + s);
  return [h, sv * 100, v * 100];
}

function hsl2hwb(args) {
  return rgb2hwb(hsl2rgb(args));
}

function hsl2cmyk(args) {
  return rgb2cmyk(hsl2rgb(args));
}

function hsl2keyword(args) {
  return rgb2keyword(hsl2rgb(args));
}


function hsv2rgb(hsv) {
  var h = hsv[0] / 60,
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      hi = Math.floor(h) % 6;

  var f = h - Math.floor(h),
      p = 255 * v * (1 - s),
      q = 255 * v * (1 - (s * f)),
      t = 255 * v * (1 - (s * (1 - f))),
      v = 255 * v;

  switch(hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
}

function hsv2hsl(hsv) {
  var h = hsv[0],
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      sl, l;

  l = (2 - s) * v;
  sl = s * v;
  sl /= (l <= 1) ? l : 2 - l;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}

function hsv2hwb(args) {
  return rgb2hwb(hsv2rgb(args))
}

function hsv2cmyk(args) {
  return rgb2cmyk(hsv2rgb(args));
}

function hsv2keyword(args) {
  return rgb2keyword(hsv2rgb(args));
}

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
function hwb2rgb(hwb) {
  var h = hwb[0] / 360,
      wh = hwb[1] / 100,
      bl = hwb[2] / 100,
      ratio = wh + bl,
      i, v, f, n;

  // wh + bl cant be > 1
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;
  if ((i & 0x01) != 0) {
    f = 1 - f;
  }
  n = wh + f * (v - wh);  // linear interpolation

  switch (i) {
    default:
    case 6:
    case 0: r = v; g = n; b = wh; break;
    case 1: r = n; g = v; b = wh; break;
    case 2: r = wh; g = v; b = n; break;
    case 3: r = wh; g = n; b = v; break;
    case 4: r = n; g = wh; b = v; break;
    case 5: r = v; g = wh; b = n; break;
  }

  return [r * 255, g * 255, b * 255];
}

function hwb2hsl(args) {
  return rgb2hsl(hwb2rgb(args));
}

function hwb2hsv(args) {
  return rgb2hsv(hwb2rgb(args));
}

function hwb2cmyk(args) {
  return rgb2cmyk(hwb2rgb(args));
}

function hwb2keyword(args) {
  return rgb2keyword(hwb2rgb(args));
}

function cmyk2rgb(cmyk) {
  var c = cmyk[0] / 100,
      m = cmyk[1] / 100,
      y = cmyk[2] / 100,
      k = cmyk[3] / 100,
      r, g, b;

  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
}

function cmyk2hsl(args) {
  return rgb2hsl(cmyk2rgb(args));
}

function cmyk2hsv(args) {
  return rgb2hsv(cmyk2rgb(args));
}

function cmyk2hwb(args) {
  return rgb2hwb(cmyk2rgb(args));
}

function cmyk2keyword(args) {
  return rgb2keyword(cmyk2rgb(args));
}


function xyz2rgb(xyz) {
  var x = xyz[0] / 100,
      y = xyz[1] / 100,
      z = xyz[2] / 100,
      r, g, b;

  r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
  g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
  b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

  // assume sRGB
  r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
    : r = (r * 12.92);

  g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
    : g = (g * 12.92);

  b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
    : b = (b * 12.92);

  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);

  return [r * 255, g * 255, b * 255];
}

function xyz2lab(xyz) {
  var x = xyz[0],
      y = xyz[1],
      z = xyz[2],
      l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}

function xyz2lch(args) {
  return lab2lch(xyz2lab(args));
}

function lab2xyz(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      x, y, z, y2;

  if (l <= 8) {
    y = (l * 100) / 903.3;
    y2 = (7.787 * (y / 100)) + (16 / 116);
  } else {
    y = 100 * Math.pow((l + 16) / 116, 3);
    y2 = Math.pow(y / 100, 1/3);
  }

  x = x / 95.047 <= 0.008856 ? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787 : 95.047 * Math.pow((a / 500) + y2, 3);

  z = z / 108.883 <= 0.008859 ? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787 : 108.883 * Math.pow(y2 - (b / 200), 3);

  return [x, y, z];
}

function lab2lch(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      hr, h, c;

  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  c = Math.sqrt(a * a + b * b);
  return [l, c, h];
}

function lab2rgb(args) {
  return xyz2rgb(lab2xyz(args));
}

function lch2lab(lch) {
  var l = lch[0],
      c = lch[1],
      h = lch[2],
      a, b, hr;

  hr = h / 360 * 2 * Math.PI;
  a = c * Math.cos(hr);
  b = c * Math.sin(hr);
  return [l, a, b];
}

function lch2xyz(args) {
  return lab2xyz(lch2lab(args));
}

function lch2rgb(args) {
  return lab2rgb(lch2lab(args));
}

function keyword2rgb(keyword) {
  return cssKeywords[keyword];
}

function keyword2hsl(args) {
  return rgb2hsl(keyword2rgb(args));
}

function keyword2hsv(args) {
  return rgb2hsv(keyword2rgb(args));
}

function keyword2hwb(args) {
  return rgb2hwb(keyword2rgb(args));
}

function keyword2cmyk(args) {
  return rgb2cmyk(keyword2rgb(args));
}

function keyword2lab(args) {
  return rgb2lab(keyword2rgb(args));
}

function keyword2xyz(args) {
  return rgb2xyz(keyword2rgb(args));
}

var cssKeywords = {
  aliceblue:  [240,248,255],
  antiquewhite: [250,235,215],
  aqua: [0,255,255],
  aquamarine: [127,255,212],
  azure:  [240,255,255],
  beige:  [245,245,220],
  bisque: [255,228,196],
  black:  [0,0,0],
  blanchedalmond: [255,235,205],
  blue: [0,0,255],
  blueviolet: [138,43,226],
  brown:  [165,42,42],
  burlywood:  [222,184,135],
  cadetblue:  [95,158,160],
  chartreuse: [127,255,0],
  chocolate:  [210,105,30],
  coral:  [255,127,80],
  cornflowerblue: [100,149,237],
  cornsilk: [255,248,220],
  crimson:  [220,20,60],
  cyan: [0,255,255],
  darkblue: [0,0,139],
  darkcyan: [0,139,139],
  darkgoldenrod:  [184,134,11],
  darkgray: [169,169,169],
  darkgreen:  [0,100,0],
  darkgrey: [169,169,169],
  darkkhaki:  [189,183,107],
  darkmagenta:  [139,0,139],
  darkolivegreen: [85,107,47],
  darkorange: [255,140,0],
  darkorchid: [153,50,204],
  darkred:  [139,0,0],
  darksalmon: [233,150,122],
  darkseagreen: [143,188,143],
  darkslateblue:  [72,61,139],
  darkslategray:  [47,79,79],
  darkslategrey:  [47,79,79],
  darkturquoise:  [0,206,209],
  darkviolet: [148,0,211],
  deeppink: [255,20,147],
  deepskyblue:  [0,191,255],
  dimgray:  [105,105,105],
  dimgrey:  [105,105,105],
  dodgerblue: [30,144,255],
  firebrick:  [178,34,34],
  floralwhite:  [255,250,240],
  forestgreen:  [34,139,34],
  fuchsia:  [255,0,255],
  gainsboro:  [220,220,220],
  ghostwhite: [248,248,255],
  gold: [255,215,0],
  goldenrod:  [218,165,32],
  gray: [128,128,128],
  green:  [0,128,0],
  greenyellow:  [173,255,47],
  grey: [128,128,128],
  honeydew: [240,255,240],
  hotpink:  [255,105,180],
  indianred:  [205,92,92],
  indigo: [75,0,130],
  ivory:  [255,255,240],
  khaki:  [240,230,140],
  lavender: [230,230,250],
  lavenderblush:  [255,240,245],
  lawngreen:  [124,252,0],
  lemonchiffon: [255,250,205],
  lightblue:  [173,216,230],
  lightcoral: [240,128,128],
  lightcyan:  [224,255,255],
  lightgoldenrodyellow: [250,250,210],
  lightgray:  [211,211,211],
  lightgreen: [144,238,144],
  lightgrey:  [211,211,211],
  lightpink:  [255,182,193],
  lightsalmon:  [255,160,122],
  lightseagreen:  [32,178,170],
  lightskyblue: [135,206,250],
  lightslategray: [119,136,153],
  lightslategrey: [119,136,153],
  lightsteelblue: [176,196,222],
  lightyellow:  [255,255,224],
  lime: [0,255,0],
  limegreen:  [50,205,50],
  linen:  [250,240,230],
  magenta:  [255,0,255],
  maroon: [128,0,0],
  mediumaquamarine: [102,205,170],
  mediumblue: [0,0,205],
  mediumorchid: [186,85,211],
  mediumpurple: [147,112,219],
  mediumseagreen: [60,179,113],
  mediumslateblue:  [123,104,238],
  mediumspringgreen:  [0,250,154],
  mediumturquoise:  [72,209,204],
  mediumvioletred:  [199,21,133],
  midnightblue: [25,25,112],
  mintcream:  [245,255,250],
  mistyrose:  [255,228,225],
  moccasin: [255,228,181],
  navajowhite:  [255,222,173],
  navy: [0,0,128],
  oldlace:  [253,245,230],
  olive:  [128,128,0],
  olivedrab:  [107,142,35],
  orange: [255,165,0],
  orangered:  [255,69,0],
  orchid: [218,112,214],
  palegoldenrod:  [238,232,170],
  palegreen:  [152,251,152],
  paleturquoise:  [175,238,238],
  palevioletred:  [219,112,147],
  papayawhip: [255,239,213],
  peachpuff:  [255,218,185],
  peru: [205,133,63],
  pink: [255,192,203],
  plum: [221,160,221],
  powderblue: [176,224,230],
  purple: [128,0,128],
  rebeccapurple: [102, 51, 153],
  red:  [255,0,0],
  rosybrown:  [188,143,143],
  royalblue:  [65,105,225],
  saddlebrown:  [139,69,19],
  salmon: [250,128,114],
  sandybrown: [244,164,96],
  seagreen: [46,139,87],
  seashell: [255,245,238],
  sienna: [160,82,45],
  silver: [192,192,192],
  skyblue:  [135,206,235],
  slateblue:  [106,90,205],
  slategray:  [112,128,144],
  slategrey:  [112,128,144],
  snow: [255,250,250],
  springgreen:  [0,255,127],
  steelblue:  [70,130,180],
  tan:  [210,180,140],
  teal: [0,128,128],
  thistle:  [216,191,216],
  tomato: [255,99,71],
  turquoise:  [64,224,208],
  violet: [238,130,238],
  wheat:  [245,222,179],
  white:  [255,255,255],
  whitesmoke: [245,245,245],
  yellow: [255,255,0],
  yellowgreen:  [154,205,50]
};

var reverseKeywords = {};
for (var key in cssKeywords) {
  reverseKeywords[JSON.stringify(cssKeywords[key])] = key;
}

},{}],20:[function(require,module,exports){
var conversions = require("./conversions");

var convert = function() {
   return new Converter();
}

for (var func in conversions) {
  // export Raw versions
  convert[func + "Raw"] =  (function(func) {
    // accept array or plain args
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      return conversions[func](arg);
    }
  })(func);

  var pair = /(\w+)2(\w+)/.exec(func),
      from = pair[1],
      to = pair[2];

  // export rgb2hsl and ["rgb"]["hsl"]
  convert[from] = convert[from] || {};

  convert[from][to] = convert[func] = (function(func) { 
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      
      var val = conversions[func](arg);
      if (typeof val == "string" || val === undefined)
        return val; // keyword

      for (var i = 0; i < val.length; i++)
        val[i] = Math.round(val[i]);
      return val;
    }
  })(func);
}


/* Converter does lazy conversion and caching */
var Converter = function() {
   this.convs = {};
};

/* Either get the values for a space or
  set the values for a space, depending on args */
Converter.prototype.routeSpace = function(space, args) {
   var values = args[0];
   if (values === undefined) {
      // color.rgb()
      return this.getValues(space);
   }
   // color.rgb(10, 10, 10)
   if (typeof values == "number") {
      values = Array.prototype.slice.call(args);        
   }

   return this.setValues(space, values);
};
  
/* Set the values for a space, invalidating cache */
Converter.prototype.setValues = function(space, values) {
   this.space = space;
   this.convs = {};
   this.convs[space] = values;
   return this;
};

/* Get the values for a space. If there's already
  a conversion for the space, fetch it, otherwise
  compute it */
Converter.prototype.getValues = function(space) {
   var vals = this.convs[space];
   if (!vals) {
      var fspace = this.space,
          from = this.convs[fspace];
      vals = convert[fspace][space](from);

      this.convs[space] = vals;
   }
  return vals;
};

["rgb", "hsl", "hsv", "cmyk", "keyword"].forEach(function(space) {
   Converter.prototype[space] = function(vals) {
      return this.routeSpace(space, arguments);
   }
});

module.exports = convert;
},{"./conversions":19}],21:[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.2.0
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	/**
	 * Merge one or more objects 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	var Public = function(clone) {

		return merge(clone === true, false, arguments);

	}, publicName = 'merge';

	/**
	 * Merge two or more objects recursively 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	Public.recursive = function(clone) {

		return merge(clone === true, true, arguments);

	};

	/**
	 * Clone the input removing any reference
	 * @param mixed input
	 * @return mixed
	 */

	Public.clone = function(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = Public.clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = Public.clone(input[index]);

		}

		return output;

	};

	/**
	 * Merge two objects recursively
	 * @param mixed input
	 * @param mixed extend
	 * @return mixed
	 */

	function merge_recursive(base, extend) {

		if (typeOf(base) !== 'object')

			return extend;

		for (var key in extend) {

			if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {

				base[key] = merge_recursive(base[key], extend[key]);

			} else {

				base[key] = extend[key];

			}

		}

		return base;

	}

	/**
	 * Merge two or more objects
	 * @param bool clone
	 * @param bool recursive
	 * @param array argv
	 * @return object
	 */

	function merge(clone, recursive, argv) {

		var result = argv[0],
			size = argv.length;

		if (clone || typeOf(result) !== 'object')

			result = {};

		for (var index=0;index<size;++index) {

			var item = argv[index],

				type = typeOf(item);

			if (type !== 'object') continue;

			for (var key in item) {

				var sitem = clone ? Public.clone(item[key]) : item[key];

				if (recursive) {

					result[key] = merge_recursive(result[key], sitem);

				} else {

					result[key] = sitem;

				}

			}

		}

		return result;

	}

	/**
	 * Get type of variable
	 * @param mixed input
	 * @return string
	 *
	 * @see http://jsperf.com/typeofvar
	 */

	function typeOf(input) {

		return ({}).toString.call(input).slice(8, -1).toLowerCase();

	}

	if (isNode) {

		module.exports = Public;

	} else {

		window[publicName] = Public;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],22:[function(require,module,exports){
(function (global){
;(function (commonjs) {
  function errorObject(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  function receiveCallsFromOwner(functions, options) {
    if (typeof Proxy == 'undefined') {
      // Let the other side know about our functions if they can't use Proxy.
      var names = [];
      for (var name in functions) names.push(name);
      self.postMessage({functionNames: names});
    }

    function createCallback(id) {
      function callback() {
        var args = Array.prototype.slice.call(arguments);
        self.postMessage({callResponse: id, arguments: args});
      }

      callback._autoDisabled = false;
      callback.disableAuto = function () { callback._autoDisabled = true; };

      callback.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        self.postMessage({callResponse: id, arguments: args}, transferList);
      };

      return callback;
    }

    self.addEventListener('message', function (e) {
      var message = e.data;

      if (message.call) {
        var callId = message.callId;

        // Find the function to be called.
        var fn = functions[message.call];
        if (!fn) {
          self.postMessage({
            callResponse: callId,
            arguments: [errorObject(new Error('That function does not exist'))]
          });
          return;
        }

        var args = message.arguments || [];
        var callback = createCallback(callId);
        args.push(callback);

        var returnValue;
        if (options.catchErrors) {
          try {
            returnValue = fn.apply(functions, args);
          } catch (e) {
            callback(errorObject(e));
          }
        } else {
          returnValue = fn.apply(functions, args);
        }

        // If the option for it is enabled, automatically call the callback.
        if (options.autoCallback && !callback._autoDisabled) {
          callback(null, returnValue);
        }
      }
    });
  }

  function sendCallsToWorker(workers, options) {
    var cache = {},
        callbacks = {},
        timers,
        nextCallId = 1,
        fakeProxy,
        queue = [];

    // Create an array of number of pending tasks for each worker.
    var pending = workers.map(function () { return 0; });

    // Each individual call gets a timer if timing calls.
    if (options.timeCalls) timers = {};

    if (typeof Proxy == 'undefined') {
      // If we have no Proxy support, we have to pre-define all the functions.
      fakeProxy = {pendingCalls: 0};
      options.functionNames.forEach(function (name) {
        fakeProxy[name] = getHandler(null, name);
      });
    }

    function getNumPendingCalls() {
      return queue.length + pending.reduce(function (x, y) { return x + y; });
    }

    function getHandler(_, name) {
      if (name == 'pendingCalls') return getNumPendingCalls();
      if (cache[name]) return cache[name];

      var fn = cache[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        queueCall(name, args);
      };

      // Sends the same call to all workers.
      fn.broadcast = function () {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < workers.length; i++) {
          sendCall(i, name, args);
        }
        if (fakeProxy) fakeProxy.pendingCalls = getNumPendingCalls();
      };

      // Marks the objects in the first argument (array) as transferable.
      fn.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        queueCall(name, args, transferList);
      };

      return fn;
    }

    function flushQueue() {
      // Keep the fake proxy pending count up-to-date.
      if (fakeProxy) fakeProxy.pendingCalls = getNumPendingCalls();

      if (!queue.length) return;

      for (var i = 0; i < workers.length; i++) {
        if (pending[i]) continue;

        // A worker is available.
        var params = queue.shift();
        sendCall(i, params[0], params[1], params[2]);

        if (!queue.length) return;
      }
    }

    function queueCall(name, args, opt_transferList) {
      queue.push([name, args, opt_transferList]);
      flushQueue();
    }

    function sendCall(workerIndex, name, args, opt_transferList) {
      // Get the worker and indicate that it has a pending task.
      pending[workerIndex]++;
      var worker = workers[workerIndex];

      var id = nextCallId++;

      // If the last argument is a function, assume it's the callback.
      var maybeCb = args[args.length - 1];
      if (typeof maybeCb == 'function') {
        callbacks[id] = maybeCb;
        args = args.slice(0, -1);
      }

      // If specified, time calls using the console.time interface.
      if (options.timeCalls) {
        var timerId = name + '(' + args.join(', ') + ')';
        timers[id] = timerId;
        console.time(timerId);
      }

      worker.postMessage({callId: id, call: name, arguments: args}, opt_transferList);
    }

    function listener(e) {
      var workerIndex = workers.indexOf(this);
      var message = e.data;

      if (message.callResponse) {
        var callId = message.callResponse;

        // Call the callback registered for this call (if any).
        if (callbacks[callId]) {
          callbacks[callId].apply(null, message.arguments);
          delete callbacks[callId];
        }

        // Report timing, if that option is enabled.
        if (options.timeCalls && timers[callId]) {
          console.timeEnd(timers[callId]);
          delete timers[callId];
        }

        // Indicate that this task is no longer pending on the worker.
        pending[workerIndex]--;
        flushQueue();
      } else if (message.functionNames) {
        // Received a list of available functions. Only useful for fake proxy.
        message.functionNames.forEach(function (name) {
          fakeProxy[name] = getHandler(null, name);
        });
      }
    }

    // Listen to messages from all the workers.
    for (var i = 0; i < workers.length; i++) {
      workers[i].addEventListener('message', listener);
    }

    if (typeof Proxy == 'undefined') {
      return fakeProxy;
    } else if (Proxy.create) {
      return Proxy.create({get: getHandler});
    } else {
      return new Proxy({}, {get: getHandler});
    }
  }

  /**
   * Call this function with either a Worker instance, a list of them, or a map
   * of functions that can be called inside the worker.
   */
  function createWorkerProxy(workersOrFunctions, opt_options) {
    var options = {
      // Automatically call the callback after a call if the return value is not
      // undefined.
      autoCallback: false,
      // Catch errors and automatically respond with an error callback. Off by
      // default since it breaks standard behavior.
      catchErrors: false,
      // A list of functions that can be called. This list will be used to make
      // the proxy functions available when Proxy is not supported. Note that
      // this is generally not needed since the worker will also publish its
      // known functions.
      functionNames: [],
      // Call console.time and console.timeEnd for calls sent though the proxy.
      timeCalls: false
    };

    if (opt_options) {
      for (var key in opt_options) {
        if (!(key in options)) continue;
        options[key] = opt_options[key];
      }
    }
    Object.freeze(options);

    // Ensure that we have an array of workers (even if only using one worker).
    if (typeof Worker != 'undefined' && (workersOrFunctions instanceof Worker)) {
      workersOrFunctions = [workersOrFunctions];
    }

    if (Array.isArray(workersOrFunctions)) {
      return sendCallsToWorker(workersOrFunctions, options);
    } else {
      receiveCallsFromOwner(workersOrFunctions, options);
    }
  }

  if (commonjs) {
    module.exports = createWorkerProxy;
  } else {
    var scope;
    if (typeof global != 'undefined') {
      scope = global;
    } else if (typeof window != 'undefined') {
      scope = window;
    } else if (typeof self != 'undefined') {
      scope = self;
    }

    scope.createWorkerProxy = createWorkerProxy;
  }
})(typeof module != 'undefined' && module.exports);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],23:[function(require,module,exports){
"use strict";
exports.World = require('./lib/world');
exports.WorldManager = require('./lib/worldmanager');
exports.WorldRenderer = require('./lib/worldrenderer');


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-world/index.js
},{"./lib/world":25,"./lib/worldmanager":26,"./lib/worldrenderer":27}],24:[function(require,module,exports){
"use strict";
module.exports = RegionRenderer;
var TILES_X = 32;
var TILES_Y = 32;
var TILES_PER_REGION = TILES_X * TILES_Y;
var HEADER_BYTES = 3;
var BYTES_PER_TILE = 30;
var BYTES_PER_ROW = BYTES_PER_TILE * TILES_X;
var BYTES_PER_REGION = HEADER_BYTES + BYTES_PER_TILE * TILES_PER_REGION;
var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;
var REGION_WIDTH = TILE_WIDTH * TILES_X;
var REGION_HEIGHT = TILE_HEIGHT * TILES_Y;
function getInt16(region, offset) {
  if (region && region.view)
    return region.view.getInt16(offset);
}
function getOrientation(orientations, index) {
  var curIndex = 0,
      image,
      direction;
  for (var i = 0; i < orientations.length; i++) {
    var o = orientations[i];
    if (curIndex == index) {
      if (o.imageLayers) {
        image = o.imageLayers[0].image;
      } else {
        image = o.image || o.leftImage || o.dualImage;
      }
      direction = o.direction || 'left';
      if (!image)
        throw new Error('Could not get image for orientation');
      break;
    }
    curIndex++;
    if (o.dualImage || o.rightImage) {
      if (curIndex == index) {
        image = o.rightImage || o.dualImage;
        direction = 'right';
        break;
      }
      curIndex++;
    }
  }
  if (!image) {
    throw new Error('Could not get orientation');
  }
  return {
    image: image,
    direction: direction,
    flip: o.flipImages || !!(o.dualImage && direction == 'left'),
    info: o
  };
}
function getUint8(region, offset) {
  if (region && region.view)
    return region.view.getUint8(offset);
}
function RegionRenderer(x, y) {
  this.x = x;
  this.y = y;
  this.tileX = x * TILES_X;
  this.tileY = y * TILES_Y;
  this.entities = null;
  this.view = null;
  this.neighbors = null;
  this.state = RegionRenderer.STATE_UNINITIALIZED;
  this.dirty = {
    background: false,
    foreground: false,
    sprites: false
  };
  this._spritesMinX = 0;
  this._spritesMinY = 0;
}
RegionRenderer.STATE_ERROR = -1;
RegionRenderer.STATE_UNITIALIZED = 0;
RegionRenderer.STATE_LOADING = 1;
RegionRenderer.STATE_READY = 2;
RegionRenderer.prototype.render = function(renderer, offsetX, offsetY) {
  if (this.state != RegionRenderer.STATE_READY)
    return;
  this._renderEntities(renderer, offsetX, offsetY);
  this._renderTiles(renderer, offsetX, offsetY);
};
RegionRenderer.prototype.setDirty = function() {
  this.dirty.background = true;
  this.dirty.foreground = true;
  this.dirty.sprites = true;
};
RegionRenderer.prototype.unload = function() {
  this.entities = null;
  this.view = null;
  this.neighbors = null;
  this.state = RegionRenderer.STATE_UNINITIALIZED;
};
RegionRenderer.prototype._renderEntities = function(renderer, offsetX, offsetY) {
  var canvas = renderer.getCanvas(this, 2);
  if (!this.dirty.sprites) {
    canvas.style.left = (offsetX + this._spritesMinX * renderer.zoom) + 'px';
    canvas.style.bottom = (offsetY + (REGION_HEIGHT - this._spritesMaxY) * renderer.zoom) + 'px';
    canvas.style.visibility = 'visible';
  }
  this.dirty.sprites = false;
  var minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0,
      originX = this.x * TILES_X,
      originY = this.y * TILES_Y,
      allSprites = [];
  for (var i = 0; i < this.entities.length; i++) {
    var entity = this.entities[i],
        sprites = null;
    switch (entity.__name__ + entity.__version__) {
      case 'ItemDropEntity1':
        sprites = this._renderItem(renderer, entity);
        break;
      case 'MonsterEntity1':
        sprites = this._renderMonster(renderer, entity);
        break;
      case 'NpcEntity1':
        break;
      case 'NpcEntity2':
        sprites = this._renderNPC(renderer, entity);
        break;
      case 'ObjectEntity1':
      case 'ObjectEntity2':
      case 'ObjectEntity3':
        sprites = this._renderObject(renderer, entity);
        break;
      case 'PlantEntity1':
      case 'PlantEntity2':
        sprites = this._renderPlant(renderer, entity);
        break;
      default:
        console.warn('Unsupported entity/version:', entity);
    }
    if (sprites) {
      for (var j = 0; j < sprites.length; j++) {
        var sprite = sprites[j];
        if (!sprite || !sprite.image) {
          this.dirty.sprites = true;
          continue;
        }
        if (!sprite.sx)
          sprite.sx = 0;
        if (!sprite.sy)
          sprite.sy = 0;
        if (!sprite.width)
          sprite.width = sprite.image.width;
        if (!sprite.height)
          sprite.height = sprite.image.height;
        sprite.canvasX = (sprite.x - originX) * TILE_WIDTH;
        sprite.canvasY = REGION_HEIGHT - (sprite.y - originY) * TILE_HEIGHT - sprite.height;
        minX = Math.min(sprite.canvasX, minX);
        maxX = Math.max(sprite.canvasX + sprite.width, maxX);
        minY = Math.min(sprite.canvasY, minY);
        maxY = Math.max(sprite.canvasY + sprite.height, maxY);
        allSprites.push(sprite);
      }
    } else {
      this.dirty.sprites = true;
    }
  }
  canvas = renderer.getCanvas(this, 2, maxX - minX, maxY - minY);
  this._spritesMinX = minX;
  this._spritesMinY = minY;
  if (allSprites.length) {
    var context = canvas.getContext('2d');
    for (var i = 0; i < allSprites.length; i++) {
      var sprite = allSprites[i];
      context.drawImage(sprite.image, sprite.sx, sprite.sy, sprite.width, sprite.height, -minX + sprite.canvasX, -minY + sprite.canvasY, sprite.width, sprite.height);
    }
    canvas.style.left = (offsetX + minX * renderer.zoom) + 'px';
    canvas.style.bottom = (offsetY + (REGION_HEIGHT - maxY) * renderer.zoom) + 'px';
    canvas.style.visibility = 'visible';
  } else {
    canvas.style.visibility = 'hidden';
  }
};
RegionRenderer.prototype._renderItem = function(renderer, entity) {};
RegionRenderer.prototype._renderMonster = function(renderer, entity) {};
RegionRenderer.prototype._renderNPC = function(renderer, entity) {};
RegionRenderer.prototype._renderObject = function(renderer, entity) {
  var objects = renderer.objects.index;
  if (!objects)
    return;
  var assets = renderer.assets;
  var def = objects[entity.name];
  if (!def) {
    console.warn('Object not in index: ' + entity.name);
    return [];
  }
  if (def.animation) {
    var animationPath = assets.getResourcePath(def, def.animation);
  }
  var orientation = getOrientation(def.orientations, entity.orientationIndex);
  var pathAndFrame = orientation.image.split(':');
  var imagePath = assets.getResourcePath(def, pathAndFrame[0]);
  var frames = assets.getFrames(imagePath);
  if (orientation.flip) {
    if (!frames)
      return;
    imagePath += '?flipgridx=' + frames.frameGrid.size[0];
  }
  var image = assets.getImage(imagePath);
  if (!frames || !image)
    return;
  var sprite = {
    image: image,
    x: entity.tilePosition[0] + orientation.info.imagePosition[0] / TILE_WIDTH,
    y: entity.tilePosition[1] + orientation.info.imagePosition[1] / TILE_HEIGHT,
    sx: 0,
    sy: 0,
    width: frames.frameGrid.size[0],
    height: frames.frameGrid.size[1]
  };
  return [sprite];
};
RegionRenderer.prototype._renderPlant = function(renderer, entity) {
  var assets = renderer.assets,
      position = entity.tilePosition,
      x = position[0],
      y = position[1];
  return entity.pieces.map(function(piece) {
    return {
      image: assets.getImage(piece.image),
      x: x + piece.offset[0],
      y: y + piece.offset[1]
    };
  });
};
RegionRenderer.prototype._renderTiles = function(renderer, offsetX, offsetY) {
  var bg = renderer.getCanvas(this, 1, REGION_WIDTH, REGION_HEIGHT);
  bg.style.left = offsetX + 'px';
  bg.style.bottom = offsetY + 'px';
  bg.style.visibility = 'visible';
  var fg = renderer.getCanvas(this, 4, REGION_WIDTH, REGION_HEIGHT);
  fg.style.left = offsetX + 'px';
  fg.style.bottom = offsetY + 'px';
  fg.style.visibility = 'visible';
  if (!this.dirty.background && !this.dirty.foreground)
    return;
  var assets = renderer.assets,
      materials = renderer.materials.index,
      matmods = renderer.matmods.index;
  if (!materials || !matmods) {
    this.dirty.background = true;
    this.dirty.foreground = true;
    return;
  }
  var drawBackground = this.dirty.background || this.dirty.foreground,
      drawForeground = this.dirty.foreground;
  var bgContext = bg.getContext('2d'),
      fgContext = fg.getContext('2d');
  if (drawBackground)
    bgContext.clearRect(0, 0, bg.width, bg.height);
  if (drawForeground)
    fgContext.clearRect(0, 0, fg.width, fg.height);
  this.dirty.background = false;
  this.dirty.foreground = false;
  var view = this.view,
      backgroundId,
      foregroundId,
      foreground;
  bgContext.fillStyle = 'rgba(0, 0, 0, .5)';
  var neighbors = [this, HEADER_BYTES + BYTES_PER_ROW, this, HEADER_BYTES + BYTES_PER_ROW + BYTES_PER_TILE, null, null, this.neighbors[4], BYTES_PER_REGION - BYTES_PER_ROW + BYTES_PER_TILE, this.neighbors[4], BYTES_PER_REGION - BYTES_PER_ROW, this.neighbors[5], BYTES_PER_REGION - BYTES_PER_TILE, null, null, this.neighbors[6], HEADER_BYTES + BYTES_PER_ROW + BYTES_PER_ROW - BYTES_PER_TILE];
  var x = 0,
      y = 0,
      sx = 0,
      sy = REGION_HEIGHT - TILE_HEIGHT;
  for (var offset = HEADER_BYTES; offset < BYTES_PER_REGION; offset += BYTES_PER_TILE) {
    if (x == 0) {
      neighbors[4] = this;
      neighbors[5] = offset + BYTES_PER_TILE;
      if (y == 1) {
        neighbors[8] = this;
        neighbors[9] = HEADER_BYTES;
      }
      neighbors[12] = this.neighbors[6];
      neighbors[13] = offset - BYTES_PER_TILE + BYTES_PER_ROW;
      if (y == TILES_Y - 1) {
        neighbors[0] = this.neighbors[0];
        neighbors[1] = HEADER_BYTES;
        neighbors[2] = this.neighbors[0];
        neighbors[3] = HEADER_BYTES + BYTES_PER_TILE;
        neighbors[14] = this.neighbors[7];
        neighbors[15] = HEADER_BYTES + BYTES_PER_ROW - BYTES_PER_TILE;
      } else if (y > 0) {
        neighbors[6] = this;
        neighbors[7] = offset - BYTES_PER_ROW + BYTES_PER_TILE;
        neighbors[10] = this.neighbors[6];
        neighbors[11] = offset - BYTES_PER_TILE;
        neighbors[14] = this.neighbors[6];
        neighbors[15] = offset - BYTES_PER_TILE + BYTES_PER_ROW + BYTES_PER_ROW;
      }
    } else if (x == 1) {
      if (y == 0) {
        neighbors[10] = this.neighbors[4];
        neighbors[11] = BYTES_PER_REGION - BYTES_PER_ROW;
      } else {
        neighbors[10] = this;
        neighbors[11] = offset - BYTES_PER_ROW - BYTES_PER_TILE;
      }
      neighbors[12] = this;
      neighbors[13] = offset - BYTES_PER_TILE;
      if (y == TILES_Y - 1) {
        neighbors[14] = this.neighbors[0];
        neighbors[15] = HEADER_BYTES;
      } else {
        neighbors[14] = this;
        neighbors[15] = offset + BYTES_PER_ROW - BYTES_PER_TILE;
      }
    } else if (x == TILES_X - 1) {
      if (y == TILES_Y - 1) {
        neighbors[2] = this.neighbors[1];
        neighbors[3] = HEADER_BYTES;
      } else {
        neighbors[2] = this.neighbors[2];
        neighbors[3] = offset + BYTES_PER_TILE;
      }
      neighbors[4] = this.neighbors[2];
      neighbors[5] = offset - BYTES_PER_ROW + BYTES_PER_TILE;
      if (y == 0) {
        neighbors[6] = this.neighbors[3];
        neighbors[7] = BYTES_PER_REGION - BYTES_PER_ROW;
      } else {
        neighbors[6] = this.neighbors[2];
        neighbors[7] = offset - BYTES_PER_TILE;
      }
    }
    foregroundId = view.getInt16(offset);
    foreground = materials[foregroundId];
    if (drawBackground && (!foreground || foreground.transparent)) {
      var variant = renderer.getVariant(this.tileX + x, this.tileY + y, true);
      if (!this._renderTile(bgContext, sx, sy, assets, materials, matmods, view, offset, 7, variant, neighbors)) {
        this.dirty.background = true;
      }
      bgContext.globalCompositeOperation = 'source-atop';
      bgContext.fillRect(sx, sy, 8, 8);
      bgContext.globalCompositeOperation = 'source-over';
    }
    if (drawForeground) {
      var variant = renderer.getVariant(this.tileX + x, this.tileY + y);
      if (!this._renderTile(fgContext, sx, sy, assets, materials, matmods, view, offset, 0, variant, neighbors)) {
        this.dirty.foreground = true;
      }
    }
    for (var i = 1; i < 16; i += 2) {
      neighbors[i] += BYTES_PER_TILE;
    }
    if (++x == 32) {
      x = 0;
      y++;
      sx = 0;
      sy -= TILE_HEIGHT;
    } else {
      sx += TILE_WIDTH;
    }
  }
};
RegionRenderer.prototype._renderTile = function(context, x, y, assets, materials, matmods, view, offset, delta, variant, neighbors) {
  var mcenter = view.getInt16(offset + delta),
      mtop = getInt16(neighbors[0], neighbors[1] + delta),
      mright = getInt16(neighbors[4], neighbors[5] + delta),
      mbottom = getInt16(neighbors[8], neighbors[9] + delta),
      mleft = getInt16(neighbors[12], neighbors[13] + delta),
      icenter,
      itop,
      iright,
      ibottom,
      ileft,
      ocenter,
      otop,
      oright,
      obottom,
      oleft,
      vcenter,
      vtop,
      vright,
      vbottom,
      vleft;
  var dtop = mtop > 0 && (mcenter < 1 || mcenter > mtop),
      dright = mright > 0 && (mcenter < 1 || mcenter > mright),
      dbottom = mbottom > 0 && (mcenter < 1 || mcenter > mbottom),
      dleft = mleft > 0 && (mcenter < 1 || mcenter > mleft);
  if (dtop) {
    otop = materials[mtop];
    if (!otop)
      return false;
    if (otop.platform) {
      dtop = false;
    } else {
      itop = assets.getTileImage(otop, getUint8(neighbors[0], neighbors[1] + delta + 2));
      if (!itop)
        return false;
      vtop = variant % otop.renderParameters.variants * 16;
    }
  }
  if (dright) {
    oright = materials[mright];
    if (!oright)
      return false;
    if (oright.platform) {
      dright = false;
    } else {
      iright = assets.getTileImage(oright, getUint8(neighbors[4], neighbors[5] + delta + 2));
      if (!iright)
        return false;
      vright = variant % oright.renderParameters.variants * 16;
    }
  }
  if (dleft) {
    oleft = materials[mleft];
    if (!oleft)
      return false;
    if (oleft.platform) {
      dleft = false;
    } else {
      ileft = assets.getTileImage(oleft, getUint8(neighbors[12], neighbors[13] + delta + 2));
      if (!ileft)
        return false;
      vleft = variant % oleft.renderParameters.variants * 16;
    }
  }
  if (dbottom) {
    obottom = materials[mbottom];
    if (!obottom)
      return false;
    if (obottom.platform) {
      dbottom = false;
    } else {
      ibottom = assets.getTileImage(obottom, getUint8(neighbors[8], neighbors[9] + delta + 2));
      if (!ibottom)
        return false;
      vbottom = variant % obottom.renderParameters.variants * 16;
    }
  }
  if (mcenter > 0) {
    ocenter = materials[mcenter];
    if (!ocenter)
      return false;
    var hueShift = view.getUint8(offset + delta + 2);
    if (ocenter.platform) {
      icenter = assets.getTileImage(ocenter, hueShift);
      if (!icenter)
        return false;
      vcenter = variant % ocenter.renderParameters.variants * 8;
      if (mleft > 0 && mleft != mcenter && mright > 0 && mright != mcenter) {
        vcenter += 24 * ocenter.renderParameters.variants;
      } else if (mright > 0 && mright != mcenter) {
        vcenter += 16 * ocenter.renderParameters.variants;
      } else if (mleft < 1 || mleft == mcenter) {
        vcenter += 8 * ocenter.renderParameters.variants;
      }
      context.drawImage(icenter, vcenter, 0, 8, 8, x, y, 8, 8);
    } else {
      icenter = assets.getTileImage(ocenter, hueShift);
      if (!icenter)
        return false;
      vcenter = variant % ocenter.renderParameters.variants * 16;
      context.drawImage(icenter, vcenter + 4, 12, 8, 8, x, y, 8, 8);
    }
  }
  if (dtop) {
    if (mtop == mleft) {
      context.drawImage(itop, vtop, 0, 4, 4, x, y, 4, 4);
    } else if (mtop < mleft) {
      if (dleft)
        context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
      if (dleft)
        context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
  }
  x += 4;
  if (dtop) {
    if (mtop == mright) {
      context.drawImage(itop, vtop + 4, 0, 4, 4, x, y, 4, 4);
    } else if (mtop < mright) {
      if (dright)
        context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
      if (dright)
        context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
  }
  y += 4;
  if (dbottom) {
    if (mbottom == mright) {
      context.drawImage(ibottom, vbottom + 4, 4, 4, 4, x, y, 4, 4);
    } else if (mbottom < mright) {
      if (dright)
        context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
      if (dright)
        context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
  }
  x -= 4;
  if (dbottom) {
    if (mbottom == mleft) {
      context.drawImage(ibottom, vbottom, 4, 4, 4, x, y, 4, 4);
    } else if (mbottom < mleft) {
      if (dleft)
        context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
      if (dleft)
        context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
  }
  var modId = view.getInt16(offset + delta + 4),
      mod,
      modImage;
  if (modId > 0) {
    mod = matmods[modId];
    if (!mod)
      return false;
    modImage = assets.getTileImage(mod, view.getUint8(offset + delta + 6));
    if (!modImage)
      return false;
    context.drawImage(modImage, 4 + variant % mod.renderParameters.variants * 16, 12, 8, 8, x, y - 4, 8, 8);
  }
  if (!ocenter && neighbors[8]) {
    modId = getInt16(neighbors[8], neighbors[9] + delta + 4);
    if (modId > 0) {
      mod = matmods[modId];
      if (!mod)
        return false;
      modImage = assets.getTileImage(mod, getUint8(neighbors[8], neighbors[9] + delta + 6));
      if (!modImage)
        return false;
      context.drawImage(modImage, 4 + variant % mod.renderParameters.variants * 16, 8, 8, 4, x, y, 8, 4);
    }
  }
  return true;
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-world/lib/regionrenderer.js
},{}],25:[function(require,module,exports){
"use strict";
module.exports = World;
function World(manager, file, info) {
  this._handle = info.handle;
  this._manager = manager;
  this.lastModified = file.lastModifiedDate;
  this.metadata = info.metadata;
  var location,
      data,
      params;
  switch (info.metadata.__version__) {
    case 1:
      data = info.metadata.planet;
      params = data.config.celestialParameters;
      var coord = data.config.skyParameters.coordinate;
      if (coord) {
        location = coord.parentSystem.location;
      }
      break;
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      data = info.metadata.worldTemplate;
      params = data.celestialParameters;
      if (params) {
        location = params.coordinate.location;
      }
      break;
    default:
      throw new Error('Unsupported metadata version ' + metadata.__version__);
  }
  this.tilesX = data.size[0];
  this.tilesY = data.size[1];
  this.spawnX = info.metadata.playerStart[0];
  this.spawnY = info.metadata.playerStart[1];
  if (params) {
    this.name = params.name;
    if (params.parameters) {
      this.biome = params.parameters.worldType;
    } else if (params.primaryBiomeName) {
      this.biome = params.primaryBiomeName;
    } else if (params.scanData) {
      this.biome = params.scanData.primaryBiomeName;
    }
  } else {
    if (file.name.match(/\.shipworld$/)) {
      this.name = 'Ship';
    } else {
      this.name = 'Unknown';
    }
    this.biome = null;
  }
  if (location) {
    this.x = location[0];
    this.y = location[1];
  } else {
    this.x = null;
    this.y = null;
  }
  this.seed = info.metadata.worldTemplate.seed;
}
World.prototype.close = function(callback) {
  this._manager.api.close(this._handle, callback);
  this._manager = null;
  this._handle = -1;
};
World.prototype.getRegion = function(x, y, callback) {
  if (!this._manager)
    throw new Error('The world file is closed');
  this._manager.api.getRegion(this._handle, x, y, callback);
};
World.prototype.isOpen = function() {
  return !!this._manager;
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-world/lib/world.js
},{}],26:[function(require,module,exports){
(function (__dirname){
"use strict";
var EventEmitter = require('events');
var merge = require('merge');
var util = require('util');
var workerproxy = require('workerproxy');
var World = require('./world');
module.exports = WorldManager;
function WorldManager(opt_options) {
  EventEmitter.call(this);
  var options = {workerPath: __dirname + '/worker.js'};
  Object.seal(options);
  merge(options, opt_options);
  Object.freeze(options);
  this.options = options;
  var worker = new Worker(options.workerPath);
  this.api = workerproxy(worker);
}
util.inherits(WorldManager, EventEmitter);
WorldManager.prototype.open = function(file, opt_callback) {
  var $__0 = this;
  this.api.open(file, (function(err, info) {
    if (err) {
      if (opt_callback)
        opt_callback(err, null);
      return;
    }
    var world = new World($__0, file, info);
    $__0.emit('load', {world: world});
    if (opt_callback)
      opt_callback(err, world);
  }));
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-world/lib/worldmanager.js
}).call(this,"/node_modules/starbound-world/lib")

},{"./world":25,"events":6,"merge":28,"util":11,"workerproxy":29}],27:[function(require,module,exports){
"use strict";
var EventEmitter = require('events');
var util = require('util');
var RegionRenderer = require('./regionrenderer');
var World = require('./world');
module.exports = WorldRenderer;
var TILES_X = 32;
var TILES_Y = 32;
var TILES_PER_REGION = TILES_X * TILES_Y;
var HEADER_BYTES = 3;
var BYTES_PER_TILE = 30;
var BYTES_PER_ROW = BYTES_PER_TILE * TILES_X;
var BYTES_PER_REGION = HEADER_BYTES + BYTES_PER_TILE * TILES_PER_REGION;
var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;
var REGION_WIDTH = TILE_WIDTH * TILES_X;
var REGION_HEIGHT = TILE_HEIGHT * TILES_Y;
var MIN_ZOOM = .1;
var MAX_ZOOM = 3;
var FNV_OFFSET_BASIS = 2166136279;
var FNV_PRIME = 16777619;
var FNV_SEED = 2938728349;
var BACKGROUND_VARIANT_SEED = 455934271;
var FOREGROUND_VARIANT_SEED = 786571541;
var fnvView = new DataView(new ArrayBuffer(12));
fnvView.setUint32(8, FNV_SEED);
function fnvHashView(hash, view) {
  for (var i = 0; i < view.byteLength; i++) {
    hash = ((hash ^ view.getUint8(i)) >>> 0) * FNV_PRIME;
  }
  return hash;
}
function WorldRenderer(viewport, assetsManager, opt_world) {
  var $__0 = this;
  EventEmitter.call(this);
  var position = getComputedStyle(viewport).getPropertyValue('position');
  if (position != 'absolute' && position != 'relative') {
    viewport.style.position = 'relative';
  }
  this.viewport = viewport;
  this.assets = assetsManager;
  this.world = opt_world || null;
  this.centerX = 0;
  this.centerY = 0;
  this.zoom = 1;
  this.viewportX = 0;
  this.viewportY = 0;
  this.screenRegionWidth = REGION_WIDTH;
  this.screenRegionHeight = REGION_HEIGHT;
  this.materials = assetsManager.getResourceLoader('.material');
  this.matmods = assetsManager.getResourceLoader('.matmod');
  this.objects = assetsManager.getResourceLoader('.object');
  this.assets.on('images', (function() {
    return $__0.requestRender();
  }));
  this.assets.on('resources', (function() {
    return $__0.requestRender();
  }));
  this._canvasPool = [];
  this._freePool = null;
  this._poolLookup = null;
  this._backgrounds = [];
  this._regions = Object.create(null);
  this._bounds = viewport.getBoundingClientRect();
  this._regionsX = 0;
  this._regionsY = 0;
  this._tilesX = 0;
  this._tilesY = 0;
  this._fromRegionX = 0;
  this._fromRegionY = 0;
  this._toRegionX = 0;
  this._toRegionY = 0;
  this._visibleRegionsX = 0;
  this._visibleRegionsY = 0;
  this._loaded = false;
  this._requestingRender = false;
  this._setup = false;
  this._bgVariantHashBase = NaN;
  this._fgVariantHashBase = NaN;
  if (this.world) {
    this._loadMetadata();
  }
}
util.inherits(WorldRenderer, EventEmitter);
WorldRenderer.prototype.center = function(tileX, tileY) {
  this.centerX = tileX;
  this.centerY = tileY;
  this._calculateViewport();
};
WorldRenderer.prototype.getCanvas = function(region, z, opt_width, opt_height) {
  var key = region.x + ':' + region.y + ':' + z;
  var item = this._poolLookup[key],
      canvas;
  if (item) {
    canvas = item.canvas;
  } else {
    if (this._freePool.length) {
      item = this._freePool.pop();
      canvas = item.canvas;
    } else {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.visibility = 'hidden';
      this.viewport.appendChild(canvas);
      item = {
        canvas: canvas,
        region: region,
        z: z
      };
      this._canvasPool.push(item);
    }
    item.z = z;
    item.region = region;
    this._poolLookup[key] = item;
    region.setDirty();
  }
  var width = typeof opt_width == 'number' ? opt_width : canvas.width,
      height = typeof opt_height == 'number' ? opt_height : canvas.height;
  if (canvas.width != width || canvas.height != height) {
    canvas.width = width;
    canvas.height = height;
    region.setDirty();
  }
  canvas.style.width = Math.round(width * this.zoom) + 'px';
  canvas.style.height = Math.round(height * this.zoom) + 'px';
  canvas.style.zIndex = z;
  return canvas;
};
WorldRenderer.prototype.getRegion = function(regionX, regionY, opt_skipNeighbors) {
  var $__0 = this;
  if (!this._loaded)
    return null;
  if (regionX >= this._regionsX) {
    regionX -= this._regionsX;
  } else if (regionX < 0) {
    regionX += this._regionsX;
  }
  if (regionY < 0 || regionY >= this._regionsY) {
    return null;
  }
  var key = regionX + ':' + regionY;
  var region;
  if (key in this._regions) {
    region = this._regions[key];
  } else {
    region = new RegionRenderer(regionX, regionY);
    this._regions[key] = region;
  }
  if (region.state == RegionRenderer.STATE_UNINITIALIZED) {
    region.state = RegionRenderer.STATE_LOADING;
    this.world.getRegion(regionX, regionY, (function(err, regionData) {
      if (err) {
        region.state = RegionRenderer.STATE_ERROR;
        if (err.message != 'Key not found') {
          console.error(err.stack);
        }
        return;
      } else if (regionData.buffer.byteLength != BYTES_PER_REGION) {
        region.state = RegionRenderer.STATE_ERROR;
        console.error('Corrupted region ' + regionX + ', ' + regionY);
        return;
      }
      region.entities = regionData.entities;
      region.view = new DataView(regionData.buffer);
      region.state = RegionRenderer.STATE_READY;
      region.setDirty();
      $__0.requestRender();
    }));
  }
  if (opt_skipNeighbors)
    return region;
  if (!region.neighbors) {
    region.neighbors = [this.getRegion(regionX, regionY + 1, true), this.getRegion(regionX + 1, regionY + 1, true), this.getRegion(regionX + 1, regionY, true), this.getRegion(regionX + 1, regionY - 1, true), this.getRegion(regionX, regionY - 1, true), this.getRegion(regionX - 1, regionY - 1, true), this.getRegion(regionX - 1, regionY, true), this.getRegion(regionX - 1, regionY + 1, true)];
    for (var i = 0; i < 8; i++) {
      var neighbor = region.neighbors[i];
      if (!neighbor)
        continue;
      neighbor.setDirty();
    }
    region.setDirty();
    this.requestRender();
  }
  return region;
};
WorldRenderer.prototype.getVariant = function(x, y, opt_background) {
  var hash = opt_background ? this._bgVariantHashBase : this._fgVariantHashBase;
  fnvView.setUint32(0, x);
  fnvView.setUint32(4, y);
  return fnvHashView(hash, fnvView);
};
WorldRenderer.prototype.isRegionVisible = function(region) {
  if (!region)
    return false;
  var fromX = this._fromRegionX,
      toX = this._toRegionX,
      fromY = this._fromRegionY,
      toY = this._toRegionY;
  var visibleY = region.y >= fromY && region.y < toY;
  var visibleX = (region.x >= fromX && region.x < toX) || (region.x >= fromX - this._regionsX && region.x < toX - this._regionsX) || (region.x >= fromX + this._regionsX && region.x < toX + this._regionsX);
  return visibleX && visibleY;
};
WorldRenderer.prototype.preload = function() {
  this.materials.loadIndex();
  this.matmods.loadIndex();
  this.objects.loadIndex();
};
WorldRenderer.prototype.refresh = function() {
  this._calculateViewport();
};
WorldRenderer.prototype.render = function() {
  if (!this._loaded)
    return;
  if (!this._setup) {
    this._calculateViewport();
    return;
  }
  this._prepareCanvasPool();
  for (var i = 0; i < this._backgrounds.length; i++) {
    var bg = this._backgrounds[i];
    var image = this.assets.getImage(bg.image);
    if (!image)
      continue;
    var width = image.naturalWidth * this.zoom,
        height = image.naturalHeight * this.zoom;
    var x = bg.min[0] * this._screenTileWidth - this.viewportX,
        y = bg.min[1] * this._screenTileHeight - this.viewportY;
    image.style.left = x + 'px';
    image.style.bottom = y + 'px';
    image.style.width = width + 'px';
    image.style.height = height + 'px';
    if (!image.parentNode) {
      image.style.position = 'absolute';
      image.style.zIndex = 0;
      this.viewport.appendChild(image);
    }
  }
  for (var regionY = this._fromRegionY; regionY < this._toRegionY; regionY++) {
    for (var regionX = this._fromRegionX; regionX < this._toRegionX; regionX++) {
      var region = this.getRegion(regionX, regionY);
      if (!region)
        continue;
      var offsetX = regionX * this.screenRegionWidth - this.viewportX,
          offsetY = regionY * this.screenRegionHeight - this.viewportY;
      region.render(this, offsetX, offsetY);
    }
  }
};
WorldRenderer.prototype.requestRender = function() {
  var $__0 = this;
  if (!this._loaded || this._requestingRender)
    return;
  this._requestingRender = true;
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
  requestAnimationFrame((function() {
    $__0.render();
    $__0._requestingRender = false;
  }));
};
WorldRenderer.prototype.scroll = function(deltaX, deltaY, opt_screenPixels) {
  if (opt_screenPixels) {
    deltaX /= this._screenTileWidth;
    deltaY /= this._screenTileHeight;
  }
  this.centerX += deltaX;
  this.centerY += deltaY;
  if (this.centerX < 0) {
    this.centerX += this._tilesX;
  } else if (this.centerX >= this._tilesX) {
    this.centerX -= this._tilesX;
  }
  this._calculateRegions();
};
WorldRenderer.prototype.setWorld = function(world) {
  if (!world || !(world instanceof World)) {
    throw new Error('Invalid world');
  }
  this.unload();
  this.world = world;
  this._loadMetadata();
  this._calculateViewport();
};
WorldRenderer.prototype.setZoom = function(zoom) {
  if (zoom < MIN_ZOOM)
    zoom = MIN_ZOOM;
  if (zoom > MAX_ZOOM)
    zoom = MAX_ZOOM;
  if (zoom == this.zoom)
    return;
  this.zoom = zoom;
  this._calculateViewport();
};
WorldRenderer.prototype.unload = function() {
  if (!this._loaded)
    return;
  this.zoom = 1;
  this.centerX = 0;
  this.centerY = 0;
  this._tilesX = 0;
  this._tilesY = 0;
  this._regionsX = 0;
  this._regionsY = 0;
  for (var i = 0; i < this._canvasPool.length; i++) {
    var poolItem = this._canvasPool[i];
    poolItem.region = null;
    poolItem.canvas.style.visibility = 'hidden';
  }
  for (var key in this._regions) {
    this._regions[key].unload();
  }
  this._regions = Object.create(null);
  for (var i = 0; i < this._backgrounds.length; i++) {
    var image = this.assets.getImage(this._backgrounds[i].image);
    if (image) {
      this.viewport.removeChild(image);
    }
  }
  this._backgrounds = [];
  this.world = null;
  this._loaded = false;
  this._setup = false;
  this.emit('unload');
};
WorldRenderer.prototype.zoomIn = function() {
  this.setZoom(this.zoom + this.zoom * .1);
};
WorldRenderer.prototype.zoomOut = function() {
  this.setZoom(this.zoom - this.zoom * .1);
};
WorldRenderer.prototype._calculateRegions = function() {
  if (!this._loaded)
    return;
  this._fromRegionX = Math.floor(this.centerX / TILES_X - this._bounds.width / 2 / this.screenRegionWidth) - 1;
  this._fromRegionY = Math.floor(this.centerY / TILES_Y - this._bounds.height / 2 / this.screenRegionHeight) - 2;
  this._toRegionX = this._fromRegionX + this._visibleRegionsX;
  this._toRegionY = this._fromRegionY + this._visibleRegionsY;
  this.viewportX = this.centerX * this._screenTileWidth - this._bounds.width / 2, this.viewportY = this.centerY * this._screenTileHeight - this._bounds.height / 2;
  this.requestRender();
};
WorldRenderer.prototype._calculateViewport = function() {
  if (!this._loaded)
    return;
  this._setup = true;
  this.screenRegionWidth = Math.round(REGION_WIDTH * this.zoom);
  this.screenRegionHeight = Math.round(REGION_HEIGHT * this.zoom);
  this._screenTileWidth = this.screenRegionWidth / TILES_X;
  this._screenTileHeight = this.screenRegionHeight / TILES_Y;
  this._bounds = this.viewport.getBoundingClientRect();
  this._visibleRegionsX = Math.ceil(this._bounds.width / this.screenRegionWidth + 3);
  this._visibleRegionsY = Math.ceil(this._bounds.height / this.screenRegionHeight + 3);
  this._calculateRegions();
};
WorldRenderer.prototype._loadMetadata = function() {
  var spawn,
      size;
  this.centerX = this.world.spawnX;
  this.centerY = this.world.spawnY;
  this._tilesX = this.world.tilesX;
  this._tilesY = this.world.tilesY;
  this._regionsX = Math.ceil(this._tilesX / TILES_X);
  this._regionsY = Math.ceil(this._tilesY / TILES_Y);
  if (this.world.metadata.centralStructure) {
    this._backgrounds = this.world.metadata.centralStructure.backgroundOverlays;
  }
  var view = new DataView(new ArrayBuffer(4));
  view.setUint32(0, this.world.seed + BACKGROUND_VARIANT_SEED);
  this._bgVariantHashBase = fnvHashView(FNV_OFFSET_BASIS, view);
  view.setUint32(0, this.world.seed + FOREGROUND_VARIANT_SEED);
  this._fgVariantHashBase = fnvHashView(FNV_OFFSET_BASIS, view);
  this._loaded = true;
  this.emit('load');
};
WorldRenderer.prototype._prepareCanvasPool = function() {
  var freePool = [],
      poolLookup = {};
  for (var i = 0; i < this._canvasPool.length; i++) {
    var poolItem = this._canvasPool[i],
        region = poolItem.region;
    if (region && this.isRegionVisible(region)) {
      poolLookup[region.x + ':' + region.y + ':' + poolItem.z] = poolItem;
    } else {
      poolItem.canvas.style.visibility = 'hidden';
      freePool.push(poolItem);
    }
  }
  this._freePool = freePool;
  this._poolLookup = poolLookup;
};


//# sourceURL=/Users/blixt/src/starbounded/node_modules/starbound-world/lib/worldrenderer.js
},{"./regionrenderer":24,"./world":25,"events":6,"util":11}],28:[function(require,module,exports){
module.exports=require(21)
},{"/Users/blixt/src/starbounded/node_modules/starbound-assets/node_modules/merge/merge.js":21}],29:[function(require,module,exports){
(function (global){
;(function (commonjs) {
  function errorObject(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  function receiveCallsFromOwner(functions, options) {
    if (typeof Proxy == 'undefined') {
      // Let the other side know about our functions if they can't use Proxy.
      var names = [];
      for (var name in functions) names.push(name);
      self.postMessage({functionNames: names});
    }

    function createCallback(id) {
      function callback() {
        var args = Array.prototype.slice.call(arguments);
        self.postMessage({callResponse: id, arguments: args});
      }

      callback._autoDisabled = false;
      callback.disableAuto = function () { callback._autoDisabled = true; };

      callback.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        self.postMessage({callResponse: id, arguments: args}, transferList);
      };

      return callback;
    }

    self.addEventListener('message', function (e) {
      var message = e.data;

      if (message.call) {
        var callId = message.callId;

        // Find the function to be called.
        var fn = functions[message.call];
        if (!fn) {
          self.postMessage({
            callResponse: callId,
            arguments: [errorObject(new Error('That function does not exist'))]
          });
          return;
        }

        var args = message.arguments || [];
        var callback = createCallback(callId);
        args.push(callback);

        var returnValue;
        if (options.catchErrors) {
          try {
            returnValue = fn.apply(functions, args);
          } catch (e) {
            callback(errorObject(e));
          }
        } else {
          returnValue = fn.apply(functions, args);
        }

        // If the option for it is enabled, automatically call the callback.
        if (options.autoCallback && !callback._autoDisabled) {
          callback(null, returnValue);
        }
      }
    });
  }

  function sendCallsToWorker(workers, options) {
    var cache = {},
        callbacks = {},
        timers,
        nextCallId = 1,
        fakeProxy,
        queue = [];

    // Create an array of number of pending tasks for each worker.
    var pending = workers.map(function () { return 0; });

    // Each individual call gets a timer if timing calls.
    if (options.timeCalls) timers = {};

    if (typeof Proxy == 'undefined') {
      // If we have no Proxy support, we have to pre-define all the functions.
      fakeProxy = {pendingCalls: 0};
      options.functionNames.forEach(function (name) {
        fakeProxy[name] = getHandler(null, name);
      });
    }

    function getNumPendingCalls() {
      return queue.length + pending.reduce(function (x, y) { return x + y; });
    }

    function getHandler(_, name) {
      if (name == 'pendingCalls') return getNumPendingCalls();
      if (cache[name]) return cache[name];

      var fn = cache[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        queueCall(name, args);
      };

      // Sends the same call to all workers.
      fn.broadcast = function () {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < workers.length; i++) {
          sendCall(i, name, args);
        }
        if (fakeProxy) fakeProxy.pendingCalls = getNumPendingCalls();
      };

      // Marks the objects in the first argument (array) as transferable.
      fn.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        queueCall(name, args, transferList);
      };

      return fn;
    }

    function flushQueue() {
      // Keep the fake proxy pending count up-to-date.
      if (fakeProxy) fakeProxy.pendingCalls = getNumPendingCalls();

      if (!queue.length) return;

      for (var i = 0; i < workers.length; i++) {
        if (pending[i]) continue;

        // A worker is available.
        var params = queue.shift();
        sendCall(i, params[0], params[1], params[2]);

        if (!queue.length) return;
      }
    }

    function queueCall(name, args, opt_transferList) {
      queue.push([name, args, opt_transferList]);
      flushQueue();
    }

    function sendCall(workerIndex, name, args, opt_transferList) {
      // Get the worker and indicate that it has a pending task.
      pending[workerIndex]++;
      var worker = workers[workerIndex];

      var id = nextCallId++;

      // If the last argument is a function, assume it's the callback.
      var maybeCb = args[args.length - 1];
      if (typeof maybeCb == 'function') {
        callbacks[id] = maybeCb;
        args = args.slice(0, -1);
      }

      // If specified, time calls using the console.time interface.
      if (options.timeCalls) {
        var timerId = name + '(' + args.join(', ') + ')';
        timers[id] = timerId;
        console.time(timerId);
      }

      worker.postMessage({callId: id, call: name, arguments: args}, opt_transferList);
    }

    function listener(e) {
      var workerIndex = workers.indexOf(this);
      var message = e.data;

      if (message.callResponse) {
        var callId = message.callResponse;

        // Call the callback registered for this call (if any).
        if (callbacks[callId]) {
          callbacks[callId].apply(null, message.arguments);
          delete callbacks[callId];
        }

        // Report timing, if that option is enabled.
        if (options.timeCalls && timers[callId]) {
          console.timeEnd(timers[callId]);
          delete timers[callId];
        }

        // Indicate that this task is no longer pending on the worker.
        pending[workerIndex]--;
        flushQueue();
      } else if (message.functionNames) {
        // Received a list of available functions. Only useful for fake proxy.
        message.functionNames.forEach(function (name) {
          fakeProxy[name] = getHandler(null, name);
        });
      }
    }

    // Listen to messages from all the workers.
    for (var i = 0; i < workers.length; i++) {
      workers[i].addEventListener('message', listener);
    }

    if (typeof Proxy == 'undefined') {
      return fakeProxy;
    } else if (Proxy.create) {
      return Proxy.create({get: getHandler});
    } else {
      return new Proxy({}, {get: getHandler});
    }
  }

  /**
   * Call this function with either a Worker instance, a list of them, or a map
   * of functions that can be called inside the worker.
   */
  function createWorkerProxy(workersOrFunctions, opt_options) {
    var options = {
      // Automatically call the callback after a call if the return value is not
      // undefined.
      autoCallback: false,
      // Catch errors and automatically respond with an error callback. Off by
      // default since it breaks standard behavior.
      catchErrors: false,
      // A list of functions that can be called. This list will be used to make
      // the proxy functions available when Proxy is not supported. Note that
      // this is generally not needed since the worker will also publish its
      // known functions.
      functionNames: [],
      // Call console.time and console.timeEnd for calls sent though the proxy.
      timeCalls: false
    };

    if (opt_options) {
      for (var key in opt_options) {
        if (!(key in options)) continue;
        options[key] = opt_options[key];
      }
    }
    Object.freeze(options);

    // Ensure that we have an array of workers (even if only using one worker).
    if (typeof Worker != 'undefined' && (workersOrFunctions instanceof Worker)) {
      workersOrFunctions = [workersOrFunctions];
    }

    if (Array.isArray(workersOrFunctions)) {
      return sendCallsToWorker(workersOrFunctions, options);
    } else {
      receiveCallsFromOwner(workersOrFunctions, options);
    }
  }

  if (commonjs) {
    module.exports = createWorkerProxy;
  } else {
    var scope;
    if (typeof global != 'undefined') {
      scope = global;
    } else if (typeof window != 'undefined') {
      scope = window;
    } else if (typeof self != 'undefined') {
      scope = self;
    }

    scope.createWorkerProxy = createWorkerProxy;
  }
})(typeof module != 'undefined' && module.exports);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],30:[function(require,module,exports){
"use strict";
try {
  var ua = require('ua_parser/src/js/userAgent').util.userAgent();
  var b = ua.browser;
  module.exports = {
    browser: b.name,
    os: ua.os.name,
    platform: ua.platform,
    version: b.version
  };
} catch (err) {
  if (console)
    console.error(err);
  module.exports = {
    browser: 'unknown',
    os: 'unknown',
    platform: 'unknown',
    version: {info: '?.?.?'}
  };
}


//# sourceURL=/Users/blixt/src/starbounded/node_modules/useragent-wtf/index.js
},{"ua_parser/src/js/userAgent":31}],31:[function(require,module,exports){
/*jshint browser: true, node: true
*/

(function (exports) {
    'use strict';

    var userAgent = exports.userAgent = function (ua) {
        ua = (ua || window.navigator.userAgent).toString().toLowerCase();
        function checkUserAgent(ua) {
            var browser = {};
            var match = /(dolfin)[ \/]([\w.]+)/.exec( ua ) ||
                    /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                    /(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(webkit)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(msie) ([\w.]+)/.exec( ua ) ||
                    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
                    ["","unknown"];
            if (match[1] === "webkit") {
                match = /(iphone|ipad|ipod)[\S\s]*os ([\w._\-]+) like/.exec(ua) ||
                    /(android)[ \/]([\w._\-]+);/.exec(ua) || [match[0], "safari", match[2]];
            } else if (match[1] === "mozilla") {
                if (/trident/.test(ua)) {
                    match[1] = "msie";
                } else {
                    match[1] = "firefox";
                }
            } else if (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)) {
                match[1] = "polaris";
            }

            browser[match[1]] = true;
            browser.name = match[1];
            browser.version = setVersion(match[2]);

            return browser;
        }

        function setVersion(versionString) {
            var version = {};

            var versions = versionString ? versionString.split(/\.|-|_/) : ["0","0","0"];
            version.info = versions.join(".");
            version.major = versions[0] || "0";
            version.minor = versions[1] || "0";
            version.patch = versions[2] || "0";

            return version;
        }

        function checkPlatform (ua) {
            if (isPc(ua)) {
                return "pc";
            } else if (isTablet(ua)) {
                return "tablet";
            } else if (isMobile(ua)) {
                return "mobile";
            } else {
                return "";
            }
        }
        function isPc (ua) {
            if (ua.match(/linux|windows (nt|98)|macintosh/) && !ua.match(/android|mobile|polaris|lgtelecom|uzard|natebrowser|ktf;|skt;/)) {
                return true;
            }
            return false;
        }
        function isTablet (ua) {
            if (ua.match(/ipad/) || (ua.match(/android/) && !ua.match(/mobi|mini|fennec/))) {
                return true;
            }
            return false;
        }
        function isMobile (ua) {
            if (!!ua.match(/ip(hone|od)|android.+mobile|windows (ce|phone)|blackberry|bb10|symbian|webos|firefox.+fennec|opera m(ob|in)i|polaris|iemobile|lgtelecom|nokia|sonyericsson|dolfin|uzard|natebrowser|ktf;|skt;/)) {
                return true;
            } else {
                return false;
            }
        }

        function checkOs (ua) {
            var os = {},
                match = /(iphone|ipad|ipod)[\S\s]*os ([\w._\-]+) like/.exec(ua) ||
                        /(android)[ \/]([\w._\-]+);/.exec(ua) ||
                        (/android/.test(ua)? ["", "android", "0.0.0"] : false) ||
                        (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)? ["", "polaris", "0.0.0"] : false) ||
                        /(windows)(?: nt | phone(?: os){0,1} | )([\w._\-]+)/.exec(ua) ||
                        (/(windows)/.test(ua)? ["", "windows", "0.0.0"] : false) ||
                        /(mac) os x ([\w._\-]+)/.exec(ua) ||
                        (/(linux)/.test(ua)? ["", "linux", "0.0.0"] : false) ||
                        (/webos/.test(ua)? ["", "webos", "0.0.0"] : false) ||
                        /(bada)[ \/]([\w._\-]+)/.exec(ua) ||
                        (/bada/.test(ua)? ["", "bada", "0.0.0"] : false) ||
                        (/(rim|blackberry|bb10)/.test(ua)? ["", "blackberry", "0.0.0"] : false) ||
                        ["", "unknown", "0.0.0"];

            if (match[1] === "iphone" || match[1] === "ipad" || match[1] === "ipod") {
                match[1] = "ios";
            } else if (match[1] === "windows" && match[2] === "98") {
                match[2] = "0.98.0";
            }
            os[match[1]] = true;
            os.name = match[1];
            os.version = setVersion(match[2]);
            return os;
        }

        function checkApp (ua) {
            var app = {},
                match = /(crios)[ \/]([\w.]+)/.exec( ua ) ||
                        /(daumapps)[ \/]([\w.]+)/.exec( ua ) ||
                        ["",""];

            if (match[1]) {
                app.isApp = true;
                app.name = match[1];
                app.version = setVersion(match[2]);
            } else {
                app.isApp = false;
            }

            return app;
        }

        return {
            ua: ua,
            browser: checkUserAgent(ua),
            platform: checkPlatform(ua),
            os: checkOs(ua),
            app: checkApp(ua)
        };
    };

    if (typeof window === 'object' && window.navigator.userAgent) {
        window.ua_result = userAgent(window.navigator.userAgent) || null;
    }

})((function (){
    // Make userAgent a Node module, if possible.
    if (typeof exports === 'object') {
        exports.daumtools = exports;
        exports.util = exports;
        return exports;
    } else if (typeof window === 'object') {
        window.daumtools = (typeof window.daumtools === 'undefined') ? {} : window.daumtools;
        window.util = (typeof window.util === 'undefined') ? window.daumtools : window.util;
        return window.daumtools;
    }
})());
},{}],32:[function(require,module,exports){
"use strict";
var starbound = require('./lib/starbound').setup(document.getElementById('viewport'));
require('./lib/ui/os')();
require('./lib/ui/progress')(starbound);
require('./lib/ui/world-selector')(starbound);
require('./lib/ui/web-selector')(starbound, (function(error, info) {
  var mostRecentWorld = null;
  for (var i = 0; i < info.worldFiles.length; i++) {
    var world = info.worldFiles[i];
    var isMoreRecent = !mostRecentWorld || world.lastModifiedDate > mostRecentWorld.lastModifiedDate;
    if (world.name.match(/\.world$/) && isMoreRecent) {
      mostRecentWorld = world;
    }
  }
  if (mostRecentWorld) {
    starbound.worlds.open(mostRecentWorld, function(error, world) {
      if (!error)
        starbound.renderer.setWorld(world);
    });
  }
}));
starbound.renderer.on('load', (function() {
  $('#world-status').text(starbound.renderer.world.name);
}));
starbound.renderer.on('unload', (function() {
  $('#world-status').text('No world loaded');
}));


//# sourceURL=/Users/blixt/src/starbounded/web.js
},{"./lib/starbound":1,"./lib/ui/os":2,"./lib/ui/progress":3,"./lib/ui/web-selector":4,"./lib/ui/world-selector":5}]},{},[12,32])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi9zdGFyYm91bmQuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi91aS9vcy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL3VpL3Byb2dyZXNzLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9saWIvdWkvd2ViLXNlbGVjdG9yLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9saWIvdWkvd29ybGQtc2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZXM2aWZ5L25vZGVfbW9kdWxlcy90cmFjZXVyL2Jpbi90cmFjZXVyLXJ1bnRpbWUuanMiLCJAdHJhY2V1ci9nZW5lcmF0ZWQvVGVtcGxhdGVQYXJzZXIvMiIsIm5vZGVfbW9kdWxlcy9vbmNlL25vZGVfbW9kdWxlcy93cmFwcHkvd3JhcHB5LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvb25jZS9vbmNlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbGliL2Fzc2V0c21hbmFnZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL2xpYi9yZXNvdXJjZWxvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L2NvbnZlcnNpb25zLmpzIiwibm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbm9kZV9tb2R1bGVzL2NvbG9yLWNvbnZlcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvbWVyZ2UvbWVyZ2UuanMiLCJub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvd29ya2VycHJveHkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3JlZ2lvbnJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9saWIvd29ybGRtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZHJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9ub2RlX21vZHVsZXMvd29ya2VycHJveHkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy91c2VyYWdlbnQtd3RmL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3VzZXJhZ2VudC13dGYvbm9kZV9tb2R1bGVzL3VhX3BhcnNlci9zcmMvanMvdXNlckFnZW50LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC93ZWIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUFBLEFBQUksRUFBQSxDQUFBLGFBQVksRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLGtCQUFpQixDQUFDLGNBQWMsQ0FBQztBQUM3RCxBQUFJLEVBQUEsQ0FBQSxZQUFXLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxhQUFhLENBQUM7QUFDMUQsQUFBSSxFQUFBLENBQUEsYUFBWSxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsaUJBQWdCLENBQUMsY0FBYyxDQUFDO0FBRTVELE1BQU0sTUFBTSxFQUFJLFVBQVUsUUFBTyxDQUFHO0FBRWxDLEFBQUksSUFBQSxDQUFBLE1BQUssRUFBSSxJQUFJLGNBQVksQUFBQyxDQUFDO0FBQzdCLGFBQVMsQ0FBRyx5QkFBdUI7QUFDbkMsVUFBTSxDQUFHLEVBQUE7QUFBQSxFQUNYLENBQUMsQ0FBQztBQUdGLEFBQUksSUFBQSxDQUFBLE1BQUssRUFBSSxJQUFJLGFBQVcsQUFBQyxDQUFDLENBQUMsVUFBUyxDQUFHLHdCQUFzQixDQUFDLENBQUMsQ0FBQztBQUdwRSxBQUFJLElBQUEsQ0FBQSxRQUFPLEVBQUksSUFBSSxjQUFZLEFBQUMsQ0FBQyxRQUFPLENBQUcsT0FBSyxDQUFDLENBQUM7QUFHbEQsT0FBSyxpQkFBaUIsQUFBQyxDQUFDLFFBQU8sQ0FBRyxVQUFTLEFBQUMsQ0FBRTtBQUM1QyxXQUFPLFFBQVEsQUFBQyxFQUFDLENBQUM7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QUFFbEIsQUFBSSxNQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsQ0FBQSxBQUFDLENBQUMsc0NBQXFDLENBQUMsS0FDN0MsQUFBQyxDQUFDLFlBQVcsQ0FBRyxNQUFJLENBQUMsT0FDbkIsQUFBQyxDQUNMLENBQUEsQUFBQyxDQUFDLHNDQUFxQyxDQUFDLEtBQUssQUFBQyxDQUFDLEtBQUksS0FBSyxDQUFDLENBR3pELENBQUEsQ0FBQSxBQUFDLENBQUMsa0NBQWlDLENBQUMsS0FBSyxBQUFDLENBQUMsU0FBUSxFQUFJLENBQUEsS0FBSSxhQUFhLENBQUMsQ0FDM0UsQ0FBQztBQUVILFlBQVEsT0FBTyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUM7RUFDeEIsRUFBQyxDQUFDO0FBQ0osQ0FBQztBQUNEOzs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFBSSxRQUFBLENBQUEsUUFBTyxDQUFDO0FBQ1osU0FBSSxDQUFBLEdBQUcsR0FBSyxDQUFBLENBQUEsSUFBSSxTQUFTLElBQU0sRUFBQyxDQUFBLENBQUc7QUFDL0IsZUFBTyxFQUNILENBQUEsQ0FBQSxHQUFHLENBQUUsS0FBSSxDQUFDLEVBQUksRUFBQSxDQUFBLEVBQUssQ0FBQSxDQUFBLEdBQUcsQ0FBRSxLQUFJLENBQUMsRUFBSSxHQUFDLENBQUEsQ0FBSSxNQUFJLEVBQzFDLENBQUEsQ0FBQSxHQUFHLENBQUUsSUFBRyxDQUFDLEVBQUksRUFBQSxDQUFBLEVBQUssQ0FBQSxDQUFBLEdBQUcsQ0FBRSxJQUFHLENBQUMsRUFBSSxDQUFBLFdBQVUsQUFBQyxDQUFDLENBQUEsR0FBRyxDQUFFLElBQUcsQ0FBQyxDQUFHLENBQUEsQ0FBQSxHQUFHLENBQUUsS0FBSSxDQUFDLENBQUMsQ0FBQSxDQUFJLEtBQUcsRUFDekUsQ0FBQSxDQUFBLEdBQUcsQ0FBRSxJQUFHLENBQUMsRUFBSSxFQUFBLENBQUEsRUFBSyxDQUFBLENBQUEsR0FBRyxDQUFFLElBQUcsQ0FBQyxFQUFJLEdBQUMsQ0FBQSxFQUM1QixFQUFDLENBQUEsR0FBRyxDQUFFLElBQUcsQ0FBQyxJQUFNLEdBQUMsQ0FBQSxFQUFLLEVBQUMsQ0FBQSxHQUFHLENBQUUsTUFBSyxDQUFDLElBQU0sRUFBQSxDQUFBLEVBQ2pCLENBQUEsQ0FBQSxHQUFHLENBQUUsTUFBSyxDQUFDLElBQU0sRUFBQSxDQUFBLEVBQ2pCLENBQUEsQ0FBQSxHQUFHLENBQUUsV0FBVSxDQUFDLElBQU0sRUFBQSxDQUFDLENBQUMsQ0FBQSxDQUFJLEtBQUcsRUFDMUQsQ0FBQSxDQUFBLEdBQUcsQ0FBRSxNQUFLLENBQUMsRUFBSSxFQUFBLENBQUEsRUFBSyxDQUFBLENBQUEsR0FBRyxDQUFFLE1BQUssQ0FBQyxFQUFJLEdBQUMsQ0FBQSxDQUFJLE9BQUssRUFDN0MsQ0FBQSxDQUFBLEdBQUcsQ0FBRSxNQUFLLENBQUMsRUFBSSxFQUFBLENBQUEsRUFBSyxDQUFBLENB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QUFBLENBQUEsU0FBUSxFQUFJLENBQUEsS0FBSSxBQUFDLENBQUMsQ0FBQyxNQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUMsUUFBUSxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUEsQ0FBSSxDQUFBLE1BQUssQUFBQyxDQUFDLElBQUcsQ0FBQyxRQUFRLEFBQUMsQ0FBQyxNQUFLLENBQUMsQ0FBQyxFQUFJLE1BQUksQ0FBQyxDQUFBLENBQUksRUFBQSxDQUFDO0FBQy9GLGFBQU8sQ0FBQSxLQUFJLEdBQUssS0FBRyxDQUFBLENBQUksVUFBUSxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxDQUFDLEtBQUksRUFBSSxVQUFRLENBQUMsQ0FBRyxJQUFFLENBQUMsQ0FBQztNQUN6RTtBQUVBLFlBQU0sQ0FBSSxVQUFVLEtBQUksQ0FBRztBQUN2QixhQUFPLENBQUEsS0FBSSxHQUFLLEtBQUcsQ0FBQSxDQUFJLENBQUEsSUFBRyxLQUFLLEFBQUMsQ0FBQyxDQUFDLElBQUcsTUFBTSxBQUFDLEVBQUMsQ0FBQSxDQUFJLEVBQUEsQ0FBQyxFQUFJLEVBQUEsQ0FBQyxDQUFBLENBQUksQ0FBQSxJQUFHLE1BQU0sQUFBQyxDQUFDLENBQUMsS0FBSSxFQUFJLEVBQUEsQ0FBQyxFQUFJLEVBQUEsQ0FBQSxDQUFJLENBQUEsSUFBRyxNQUFNLEFBQUMsRUFBQyxDQUFBLENBQUksRUFBQSxDQUFDLENBQUM7TUFDN0c7QUFFQSxhQUFPLENBQUksVUFBVSxLQUFJLENBQUc7QUFDeEIsQUFBSSxVQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsVUFBUyxBQUFDLENBQUMsSUFBRyxDQUFHLENBQUEsSUFBRyxXQUFXLEFBQUMsRUFBQyxNQUFNLElBQUksQ0FBRyxDQUFBLElBQUcsV0FBVyxBQUFDLEVBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzFGLGFBQU8sQ0FBQSxLQUFJLEdBQUssS0FBRyxDQUFBLENBQUksS0FBRyxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxDQUFDLEtBQUksRUFBSSxLQUFHLENBQUMsQ0FBRyxJQUFFLENBQUMsQ0FBQztNQUMvRDtBQUVBLGdCQUFVLENBQUksVUFBVSxLQUFJLENBQUc7QUFDM0IsQUFBSSxVQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsVUFBUyxBQUFDLENBQUMsSUFBRyxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUMsS0FBSyxDQUFDO0FBQ3RDLGFBQU8sQ0FBQSxLQUFJLEdBQUssS0FBRyxDQUFBLENBQUksS0FBRyxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxDQUFDLEtBQUksRUFBSSxLQUFHLENBQUMsQ0FBRyxJQUFFLENBQUMsQ0FBQztNQUMvRDtBQUVBLFNBQUcsQ0FBSSxVQUFVLEtBQUksQ0FBRztBQUNwQixBQUFJLFVBQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxJQUFHLFdBQVcsQUFBQyxFQUFDLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDO0FBQ3ZDLGFBQU8sQ0FBQSxLQUFJLEdBQUssS0FBRyxDQUFBLENBQUksS0FBRyxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxDQUFDLEtBQUksRUFBSSxLQUFHLENBQUMsRUFBSSxFQUFBLENBQUcsSUFBRSxDQUFDLENBQUM7TUFDbkU7QUFFQSxZQUFNLENBQUksVUFBVSxLQUFJLENBQUc7QUFDdkIsQUFBSSxVQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsVUFBUyxBQUFDLENBQUMsSUFBRyxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUMsS0FBSyxDQUFDO0FBQ3RDLGFBQU8sQ0FBQSxLQUFJLEdBQUssS0FBRyxDQUFBLENBQUksS0FBRyxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxDQUFDLEtBQUksRUFBSSxLQUFHLENBQUMsRUFBSSxFQUFBLENBQUcsSUFBRSxDQUFDLENBQUM7TUFDbkU7QUFFQSxZQUFNLENBQUksVUFBVSxLQUFJLENBQUc7QUFDdkIsQUFBSSxVQUFBLENBQUEsT0FBTSxFQUFJLENBQUEsQ0FBQyxJQUFHLElBQUksQUFBQyxFQUFDLENBQUEsQ0FBSSxFQUFBLENBQUEsQ0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25yQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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VUFBVSxBQUFDLENBQUMsTUFBSyxDQUFHLE9BQUssQ0FBRyxHQUFDLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUMsQ0FBQztBQUFBLElBQzNEO0FBQUEsRUFDRixLQUFPLEtBQUksTUFBSyxDQUFHO0FBQ2pCLFVBQU0sVUFBVSxBQUFDLENBQUMsTUFBSyxDQUFHLE9BQUssQ0FBRyxHQUFDLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUMsQ0FBQztFQUN6RDtBQUFBLEFBRUEsRUFBQSxHQUFLLEVBQUEsQ0FBQztBQUVOLEtBQUksT0FBTSxDQUFHO0FBQ1gsT0FBSSxPQUFNLEdBQUssTUFBSSxDQUFHO0FBQ3BCLFlBQU0sVUFBVSxBQUFDLENBQUMsT0FBTSxDQUFHLFFBQU0sQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUMsQ0FBQztJQUMxRCxLQUFPLEtBQUksT0FBTSxFQUFJLE1BQUksQ0FBRztBQUMxQixTQUFJLEtBQUk7QUFDTixjQUFNLFVBQVUsQUFBQyxDQUFDLEtBQUksQ0FBRyxDQUFBLEtBQUksRUFBSSxHQUFDLENBQUcsR0FBQyxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFDLENBQUM7QUFBQSxBQUM1RCxZQUFNLFVBQVUsQUFBQyxDQUFDLE9BQU0sQ0FBRyxDQUFBLE9BQU0sRUFBSSxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFDLENBQUM7SUFDOUQsS0FBTztBQUNMLFlBQU0sVUFBVSxBQUFDLENBQUMsT0FBTSxDQUFHLENBQUEsT0FBTSxFQUFJLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q0FBQyxlQUFjLENBQUMsS0FBSyxBQUFDLENBQUMsaUJBQWdCLENBQUMsQ0FBQztBQUM1QyxFQUFDLENBQUM7QUFDRiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQXNzZXRzTWFuYWdlciA9IHJlcXVpcmUoJ3N0YXJib3VuZC1hc3NldHMnKS5Bc3NldHNNYW5hZ2VyO1xudmFyIFdvcmxkTWFuYWdlciA9IHJlcXVpcmUoJ3N0YXJib3VuZC13b3JsZCcpLldvcmxkTWFuYWdlcjtcbnZhciBXb3JsZFJlbmRlcmVyID0gcmVxdWlyZSgnc3RhcmJvdW5kLXdvcmxkJykuV29ybGRSZW5kZXJlcjtcblxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uICh2aWV3cG9ydCkge1xuICAvLyBDcmVhdGUgYW4gYXNzZXRzIG1hbmFnZXIgd2hpY2ggd2lsbCBkZWFsIHdpdGggcGFja2FnZSBmaWxlcyBldGMuXG4gIHZhciBhc3NldHMgPSBuZXcgQXNzZXRzTWFuYWdlcih7XG4gICAgd29ya2VyUGF0aDogJ2J1aWxkL3dvcmtlci1hc3NldHMuanMnLFxuICAgIHdvcmtlcnM6IDRcbiAgfSk7XG5cbiAgLy8gQ3JlYXRlIGEgd29ybGQgbWFuYWdlciB0aGF0IGhhbmRsZXMgbG9hZGluZyB3b3JsZHMuXG4gIHZhciB3b3JsZHMgPSBuZXcgV29ybGRNYW5hZ2VyKHt3b3JrZXJQYXRoOiAnYnVpbGQvd29ya2VyLXdvcmxkLmpzJ30pO1xuXG4gIC8vIFNldCB1cCBhIHJlbmRlcmVyIHRoYXQgd2lsbCByZW5kZXIgdGhlIGdyYXBoaWNzIG9udG8gc2NyZWVuLlxuICB2YXIgcmVuZGVyZXIgPSBuZXcgV29ybGRSZW5kZXJlcih2aWV3cG9ydCwgYXNzZXRzKTtcblxuICAvLyBVcGRhdGUgdGhlIHZpZXdwb3J0IHdoZW4gdGhlIHBhZ2UgaXMgcmVzaXplZC5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICByZW5kZXJlci5yZWZyZXNoKCk7XG4gIH0pO1xuXG4gIC8vIEVuYWJsZSBrZXlib2FyZCBzY3JvbGxpbmcuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzc6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgtMTAsIDAsIHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzg6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgwLCAxMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOTpcbiAgICAgICAgcmVuZGVyZXIuc2Nyb2xsKDEwLCAwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwOlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoMCwgLTEwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIGRyYWdnaW5nIHRvIHNjcm9sbC5cbiAgdmFyIGRyYWdnaW5nID0gbnVsbDtcbiAgdmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBkcmFnZ2luZyA9IFtlLmNsaWVudFgsIGUuY2xpZW50WV07XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcbiAgICByZW5kZXJlci5zY3JvbGwoZHJhZ2dpbmdbMF0gLSBlLmNsaWVudFgsIGUuY2xpZW50WSAtIGRyYWdnaW5nWzFdLCB0cnVlKTtcbiAgICBkcmFnZ2luZ1swXSA9IGUuY2xpZW50WDtcbiAgICBkcmFnZ2luZ1sxXSA9IGUuY2xpZW50WTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICBkcmFnZ2luZyA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIEVuYWJsZSB6b29taW5nIHdpdGggdGhlIG1vdXNlIHdoZWVsLlxuICB2aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUuZGVsdGFZID4gMCkgcmVuZGVyZXIuem9vbU91dCgpO1xuICAgIGlmIChlLmRlbHRhWSA8IDApIHJlbmRlcmVyLnpvb21JbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBhc3NldHM6IGFzc2V0cyxcbiAgICByZW5kZXJlcjogcmVuZGVyZXIsXG4gICAgd29ybGRzOiB3b3JsZHMsXG4gIH07XG59O1xuIiwidmFyIHVhID0gcmVxdWlyZSgndXNlcmFnZW50LXd0ZicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgc3dpdGNoICh1YS5vcykge1xuICAgIGNhc2UgJ21hYyc6XG4gICAgICAkKCcubWFjJykuc2hvdygpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnd2luZG93cyc6XG4gICAgICAkKCcud2luZG93cycpLnNob3coKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RhcmJvdW5kKSB7XG4gIHZhciBtYXhUYXNrcyA9IDAsXG4gICAgICBwcm9ncmVzcyA9ICQoJyNwcm9ncmVzcycpO1xuXG4gIHZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgdmFyIHBlbmRpbmdUYXNrcyA9IHN0YXJib3VuZC5hc3NldHMuYXBpLnBlbmRpbmdDYWxscyArXG4gICAgICAgICAgICAgICAgICAgICAgIHN0YXJib3VuZC53b3JsZHMuYXBpLnBlbmRpbmdDYWxscztcblxuICAgIGlmIChwZW5kaW5nVGFza3MpIHtcbiAgICAgIGlmIChtYXhUYXNrcyA8IHBlbmRpbmdUYXNrcykge1xuICAgICAgICBtYXhUYXNrcyA9IHBlbmRpbmdUYXNrcztcbiAgICAgIH1cblxuICAgICAgdmFyIHBlcmNlbnRhZ2UgPSAobWF4VGFza3MgKiAxLjEgLSBwZW5kaW5nVGFza3MpIC8gKG1heFRhc2tzICogMS4xKSAqIDEwMDtcbiAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCBwZXJjZW50YWdlICsgJyUnKTtcbiAgICAgIHByb2dyZXNzLnNob3coKTtcbiAgICB9IGVsc2UgaWYgKG1heFRhc2tzKSB7XG4gICAgICBtYXhUYXNrcyA9IDA7XG4gICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgJzEwMCUnKTtcbiAgICAgIHByb2dyZXNzLmZhZGVPdXQoKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG4gIH0pO1xufTtcbiIsInZhciBvbmNlID0gcmVxdWlyZSgnb25jZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdGFyYm91bmQsIGNhbGxiYWNrKSB7XG4gIHZhciBkaXJlY3RvcnkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlyZWN0b3J5JyksXG4gICAgICBmaWxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbGUnKTtcblxuICBpZiAoZGlyZWN0b3J5LndlYmtpdGRpcmVjdG9yeSkge1xuICAgICQoJyNkaXJlY3Rvcnktc2VsZWN0b3InKS5tb2RhbCh7YmFja2Ryb3A6ICdzdGF0aWMnLCBrZXlib2FyZDogZmFsc2V9KTtcbiAgICBkaXJlY3Rvcnkub25jaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCBhIFN0YXJib3VuZCBkaXJlY3RvcnkgaXMgc2VsZWN0ZWQuXG4gICAgICB2YXIgdmVyaWZpZWQgPSBmYWxzZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5maWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IHRoaXMuZmlsZXNbaV07XG4gICAgICAgIGlmIChmaWxlLndlYmtpdFJlbGF0aXZlUGF0aCA9PSAnU3RhcmJvdW5kL2Fzc2V0cy9wYWNrZWQucGFrJykge1xuICAgICAgICAgIHZlcmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc3RhdHVzID0gJCgnI2RpcmVjdG9yeS1zdGF0dXMnKTtcbiAgICAgIGlmICh2ZXJpZmllZCkge1xuICAgICAgICBzdGF0dXMuYXR0cignY2xhc3MnLCAndGV4dC1zdWNjZXNzJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzcGFuJykuYXR0cignY2xhc3MnLCAnZ2x5cGhpY29uIGdseXBoaWNvbi1vaycpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3Ryb25nJykudGV4dCgnQ2xpY2sgTG9hZCBhc3NldHMgdG8gY29udGludWUnKVxuICAgICAgICAkKCcjbG9hZC1kaXJlY3RvcnknKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXR1cy5hdHRyKCdjbGFzcycsICd0ZXh0LWRhbmdlcicpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3BhbicpLmF0dHIoJ2NsYXNzJywgJ2dseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzdHJvbmcnKS50ZXh0KCdUaGF0IGRvZXMgbm90IGFwcGVhciB0byBiZSB0aGUgU3RhcmJvdW5kIGRpcmVjdG9yeScpXG4gICAgICAgICQoJyNsb2FkLWRpcmVjdG9yeScpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICAkKCcjZmlsZS1zZWxlY3RvcicpLm1vZGFsKHtiYWNrZHJvcDogJ3N0YXRpYycsIGtleWJvYXJkOiBmYWxzZX0pO1xuICAgIGZpbGUub25jaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCBwYWNrZWQucGFrIGlzIHNlbGVjdGVkLlxuICAgICAgdmFyIHN0YXR1cyA9ICQoJyNmaWxlLXN0YXR1cycpO1xuICAgICAgaWYgKHRoaXMuZmlsZXNbMF0ubmFtZSA9PSAncGFja2VkLnBhaycpIHtcbiAgICAgICAgc3RhdHVzLmF0dHIoJ2NsYXNzJywgJ3RleHQtc3VjY2VzcycpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3BhbicpLmF0dHIoJ2NsYXNzJywgJ2dseXBoaWNvbiBnbHlwaGljb24tb2snKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3N0cm9uZycpLnRleHQoJ0NsaWNrIExvYWQgYXNzZXRzIHRvIGNvbnRpbnVlJylcbiAgICAgICAgJCgnI2xvYWQtZmlsZScpLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdHVzLmF0dHIoJ2NsYXNzJywgJ3RleHQtZGFuZ2VyJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzcGFuJykuYXR0cignY2xhc3MnLCAnZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmUnKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3N0cm9uZycpLnRleHQoJ1RoYXQgZG9lcyBub3QgYXBwZWFyIHRvIGJlIHRoZSBwYWNrZWQucGFrIGZpbGUnKVxuICAgICAgICAkKCcjbG9hZC1maWxlJykuYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgJCgnI2xvYWQtZGlyZWN0b3J5JykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgIHZhciBwZW5kaW5nRmlsZXMgPSAwO1xuXG4gICAgdmFyIHdvcmxkRmlsZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpcmVjdG9yeS5maWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGZpbGUgPSBkaXJlY3RvcnkuZmlsZXNbaV0sXG4gICAgICAgICAgcGF0aCA9IGZpbGUud2Via2l0UmVsYXRpdmVQYXRoLFxuICAgICAgICAgIG1hdGNoO1xuXG4gICAgICAvLyBTa2lwIGhpZGRlbiBmaWxlcy9kaXJlY3Rvcmllcy5cbiAgICAgIGlmIChmaWxlLm5hbWVbMF0gPT0gJy4nKSBjb250aW51ZTtcblxuICAgICAgaWYgKGZpbGUubmFtZS5tYXRjaCgvXFwuKHNoaXApP3dvcmxkJC8pKSB7XG4gICAgICAgIHdvcmxkRmlsZXMucHVzaChmaWxlKTtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2ggPSBwYXRoLm1hdGNoKC9eU3RhcmJvdW5kXFwvKD86YXNzZXRzfG1vZHMpKFxcLy4qKS8pKSB7XG4gICAgICAgIC8vIE5vdCBzdXJlIHdoeSBtdXNpYyBmaWxlcyBhcmUgc3RvcmVkIGluY29ycmVjdGx5IGxpa2UgdGhpcy5cbiAgICAgICAgaWYgKG1hdGNoWzFdLnN1YnN0cigwLCAxMykgPT0gJy9tdXNpYy9tdXNpYy8nKSB7XG4gICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS5zdWJzdHIoNik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGZpbGUgYW5kIHRoZW4gcHJlbG9hZCB0aGUgcmVuZGVyZXIgb25jZSBhbGwgYXNzZXRzIGhhdmUgYmVlblxuICAgICAgICAvLyBhZGRlZC5cbiAgICAgICAgcGVuZGluZ0ZpbGVzKys7XG4gICAgICAgIHN0YXJib3VuZC5hc3NldHMuYWRkRmlsZShtYXRjaFsxXSwgZmlsZSwgb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgcGVuZGluZ0ZpbGVzLS07XG4gICAgICAgICAgaWYgKCFwZW5kaW5nRmlsZXMpIHtcbiAgICAgICAgICAgIHN0YXJib3VuZC5yZW5kZXJlci5wcmVsb2FkKCk7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7d29ybGRGaWxlczogd29ybGRGaWxlc30pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgICQoJyNkaXJlY3Rvcnktc2VsZWN0b3InKS5tb2RhbCgnaGlkZScpO1xuICB9KTtcblxuICAkKCcjbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE86IEFsbG93IGFkZGluZyBtb2RzP1xuICAgIHN0YXJib3VuZC5hc3NldHMuYWRkRmlsZSgnLycsIGZpbGUuZmlsZXNbMF0sIG9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgc3RhcmJvdW5kLnJlbmRlcmVyLnByZWxvYWQoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHt3b3JsZEZpbGVzOiBbXX0pO1xuICAgIH0pKTtcblxuICAgICQoJyNmaWxlLXNlbGVjdG9yJykubW9kYWwoJ2hpZGUnKTtcbiAgfSk7XG59O1xuIiwidmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdGFyYm91bmQpIHtcbiAgdmFyIGFkZFdvcmxkcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtd29ybGQtZmlsZXMnKTtcbiAgYWRkV29ybGRzLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGRXb3JsZHMuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHN0YXJib3VuZC53b3JsZHMub3BlbihhZGRXb3JsZHMuZmlsZXNbaV0pO1xuICAgIH1cbiAgfTtcblxuICB2YXIgd29ybGRMaXN0ID0gJCgnI3dvcmxkcycpO1xuXG4gIHZhciB3b3JsZHMgPSBbXTtcblxuICB3b3JsZExpc3Qub24oJ2NsaWNrJywgJy5saXN0LWdyb3VwLWl0ZW0nLCAoZXZlbnQpID0+IHtcbiAgICB2YXIgaXRlbSA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcubGlzdC1ncm91cC1pdGVtJyk7XG5cbiAgICB2YXIgaW5kZXggPSBpdGVtLmRhdGEoJ2luZGV4Jyk7XG4gICAgc3RhcmJvdW5kLnJlbmRlcmVyLnNldFdvcmxkKHdvcmxkc1tpbmRleF0pO1xuICAgIHN0YXJib3VuZC5yZW5kZXJlci5yZXF1ZXN0UmVuZGVyKCk7XG4gIH0pO1xuXG4gIHN0YXJib3VuZC5yZW5kZXJlci5vbignbG9hZCcsICgpID0+IHtcbiAgICB3b3JsZExpc3QuZmluZCgnLmxpc3QtZ3JvdXAtaXRlbScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmxkcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHdvcmxkc1tpXSA9PSBzdGFyYm91bmQucmVuZGVyZXIud29ybGQpIHtcbiAgICAgICAgd29ybGRMaXN0LmZpbmQoJ1tkYXRhLWluZGV4PScgKyBpICsgJ10nKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCd1bmxvYWQnLCAoKSA9PiB7XG4gICAgd29ybGRMaXN0LmZpbmQoJy5saXN0LWdyb3VwLWl0ZW0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gIH0pO1xuXG4gIHN0YXJib3VuZC53b3JsZHMub24oJ2xvYWQnLCAoZXZlbnQpID0+IHtcbiAgICB2YXIgd29ybGQgPSBldmVudC53b3JsZDtcblxuICAgIHZhciBpbmRleCA9IHdvcmxkcy5sZW5ndGg7XG4gICAgd29ybGRzLnB1c2god29ybGQpO1xuXG4gICAgdmFyIGl0ZW0gPSAkKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwibGlzdC1ncm91cC1pdGVtXCI+JylcbiAgICAgIC5hdHRyKCdkYXRhLWluZGV4JywgaW5kZXgpXG4gICAgICAuYXBwZW5kKFxuICAgICAgICAkKCc8aDQgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW0taGVhZGluZ1wiPicpLnRleHQod29ybGQubmFtZSksXG4gICAgICAgIC8vIFRPRE86IEZpeCB0aGlzIGlzc3VlIHdpdGggZXM2aWZ5OlxuICAgICAgICAvLyQoJzxwIGNsYXNzPVwibGlzdC1ncm91cC1pdGVtLXRleHRcIj4nKS50ZXh0KCdQbGF5ZWQgJyArIG1vbWVudCh3b3JsZC5sYXN0TW9kaWZpZWQpLmZyb21Ob3coKSlcbiAgICAgICAgJCgnPHAgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW0tdGV4dFwiPicpLnRleHQoJ1BsYXllZCAnICsgd29ybGQubGFzdE1vZGlmaWVkKVxuICAgICAgKTtcblxuICAgIHdvcmxkTGlzdC5hcHBlbmQoaXRlbSk7XG4gIH0pO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIihmdW5jdGlvbihnbG9iYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBpZiAoZ2xvYmFsLiR0cmFjZXVyUnVudGltZSkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgJE9iamVjdCA9IE9iamVjdDtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIHZhciAkY3JlYXRlID0gJE9iamVjdC5jcmVhdGU7XG4gIHZhciAkZGVmaW5lUHJvcGVydGllcyA9ICRPYmplY3QuZGVmaW5lUHJvcGVydGllcztcbiAgdmFyICRkZWZpbmVQcm9wZXJ0eSA9ICRPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZnJlZXplID0gJE9iamVjdC5mcmVlemU7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlOYW1lcyA9ICRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgdmFyICRrZXlzID0gJE9iamVjdC5rZXlzO1xuICB2YXIgJGhhc093blByb3BlcnR5ID0gJE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciAkdG9TdHJpbmcgPSAkT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgdmFyICRwcmV2ZW50RXh0ZW5zaW9ucyA9IE9iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucztcbiAgdmFyICRzZWFsID0gT2JqZWN0LnNlYWw7XG4gIHZhciAkaXNFeHRlbnNpYmxlID0gT2JqZWN0LmlzRXh0ZW5zaWJsZTtcbiAgZnVuY3Rpb24gbm9uRW51bSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgfVxuICB2YXIgbWV0aG9kID0gbm9uRW51bTtcbiAgdmFyIGNvdW50ZXIgPSAwO1xuICBmdW5jdGlvbiBuZXdVbmlxdWVTdHJpbmcoKSB7XG4gICAgcmV0dXJuICdfXyQnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWU5KSArICckJyArICsrY291bnRlciArICckX18nO1xuICB9XG4gIHZhciBzeW1ib2xJbnRlcm5hbFByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEYXRhUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgdmFyIHN5bWJvbFZhbHVlcyA9ICRjcmVhdGUobnVsbCk7XG4gIHZhciBwcml2YXRlTmFtZXMgPSAkY3JlYXRlKG51bGwpO1xuICBmdW5jdGlvbiBpc1ByaXZhdGVOYW1lKHMpIHtcbiAgICByZXR1cm4gcHJpdmF0ZU5hbWVzW3NdO1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZVByaXZhdGVOYW1lKCkge1xuICAgIHZhciBzID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gICAgcHJpdmF0ZU5hbWVzW3NdID0gdHJ1ZTtcbiAgICByZXR1cm4gcztcbiAgfVxuICBmdW5jdGlvbiBpc1NoaW1TeW1ib2woc3ltYm9sKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzeW1ib2wgPT09ICdvYmplY3QnICYmIHN5bWJvbCBpbnN0YW5jZW9mIFN5bWJvbFZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIHR5cGVPZih2KSB7XG4gICAgaWYgKGlzU2hpbVN5bWJvbCh2KSlcbiAgICAgIHJldHVybiAnc3ltYm9sJztcbiAgICByZXR1cm4gdHlwZW9mIHY7XG4gIH1cbiAgZnVuY3Rpb24gU3ltYm9sKGRlc2NyaXB0aW9uKSB7XG4gICAgdmFyIHZhbHVlID0gbmV3IFN5bWJvbFZhbHVlKGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU3ltYm9sKSlcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTeW1ib2wgY2Fubm90IGJlIG5ld1xcJ2VkJyk7XG4gIH1cbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2wucHJvdG90eXBlLCAndG9TdHJpbmcnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgaWYgKCFzeW1ib2xWYWx1ZSlcbiAgICAgIHRocm93IFR5cGVFcnJvcignQ29udmVyc2lvbiBmcm9tIHN5bWJvbCB0byBzdHJpbmcnKTtcbiAgICB2YXIgZGVzYyA9IHN5bWJvbFZhbHVlW3N5bWJvbERlc2NyaXB0aW9uUHJvcGVydHldO1xuICAgIGlmIChkZXNjID09PSB1bmRlZmluZWQpXG4gICAgICBkZXNjID0gJyc7XG4gICAgcmV0dXJuICdTeW1ib2woJyArIGRlc2MgKyAnKSc7XG4gIH0pKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd2YWx1ZU9mJywgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlO1xuICB9KSk7XG4gIGZ1bmN0aW9uIFN5bWJvbFZhbHVlKGRlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGtleSA9IG5ld1VuaXF1ZVN0cmluZygpO1xuICAgICRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBzeW1ib2xEYXRhUHJvcGVydHksIHt2YWx1ZTogdGhpc30pO1xuICAgICRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBzeW1ib2xJbnRlcm5hbFByb3BlcnR5LCB7dmFsdWU6IGtleX0pO1xuICAgICRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5LCB7dmFsdWU6IGRlc2NyaXB0aW9ufSk7XG4gICAgZnJlZXplKHRoaXMpO1xuICAgIHN5bWJvbFZhbHVlc1trZXldID0gdGhpcztcbiAgfVxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbCkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndG9TdHJpbmcnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd2YWx1ZU9mJywge1xuICAgIHZhbHVlOiBTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gIHZhciBoYXNoUHJvcGVydHkgPSBjcmVhdGVQcml2YXRlTmFtZSgpO1xuICB2YXIgaGFzaFByb3BlcnR5RGVzY3JpcHRvciA9IHt2YWx1ZTogdW5kZWZpbmVkfTtcbiAgdmFyIGhhc2hPYmplY3RQcm9wZXJ0aWVzID0ge1xuICAgIGhhc2g6IHt2YWx1ZTogdW5kZWZpbmVkfSxcbiAgICBzZWxmOiB7dmFsdWU6IHVuZGVmaW5lZH1cbiAgfTtcbiAgdmFyIGhhc2hDb3VudGVyID0gMDtcbiAgZnVuY3Rpb24gZ2V0T3duSGFzaE9iamVjdChvYmplY3QpIHtcbiAgICB2YXIgaGFzaE9iamVjdCA9IG9iamVjdFtoYXNoUHJvcGVydHldO1xuICAgIGlmIChoYXNoT2JqZWN0ICYmIGhhc2hPYmplY3Quc2VsZiA9PT0gb2JqZWN0KVxuICAgICAgcmV0dXJuIGhhc2hPYmplY3Q7XG4gICAgaWYgKCRpc0V4dGVuc2libGUob2JqZWN0KSkge1xuICAgICAgaGFzaE9iamVjdFByb3BlcnRpZXMuaGFzaC52YWx1ZSA9IGhhc2hDb3VudGVyKys7XG4gICAgICBoYXNoT2JqZWN0UHJvcGVydGllcy5zZWxmLnZhbHVlID0gb2JqZWN0O1xuICAgICAgaGFzaFByb3BlcnR5RGVzY3JpcHRvci52YWx1ZSA9ICRjcmVhdGUobnVsbCwgaGFzaE9iamVjdFByb3BlcnRpZXMpO1xuICAgICAgJGRlZmluZVByb3BlcnR5KG9iamVjdCwgaGFzaFByb3BlcnR5LCBoYXNoUHJvcGVydHlEZXNjcmlwdG9yKTtcbiAgICAgIHJldHVybiBoYXNoUHJvcGVydHlEZXNjcmlwdG9yLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIGZyZWV6ZShvYmplY3QpIHtcbiAgICBnZXRPd25IYXNoT2JqZWN0KG9iamVjdCk7XG4gICAgcmV0dXJuICRmcmVlemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuICBmdW5jdGlvbiBwcmV2ZW50RXh0ZW5zaW9ucyhvYmplY3QpIHtcbiAgICBnZXRPd25IYXNoT2JqZWN0KG9iamVjdCk7XG4gICAgcmV0dXJuICRwcmV2ZW50RXh0ZW5zaW9ucy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG4gIGZ1bmN0aW9uIHNlYWwob2JqZWN0KSB7XG4gICAgZ2V0T3duSGFzaE9iamVjdChvYmplY3QpO1xuICAgIHJldHVybiAkc2VhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG4gIGZyZWV6ZShTeW1ib2xWYWx1ZS5wcm90b3R5cGUpO1xuICBmdW5jdGlvbiBpc1N5bWJvbFN0cmluZyhzKSB7XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlc1tzXSB8fCBwcml2YXRlTmFtZXNbc107XG4gIH1cbiAgZnVuY3Rpb24gdG9Qcm9wZXJ0eShuYW1lKSB7XG4gICAgaWYgKGlzU2hpbVN5bWJvbChuYW1lKSlcbiAgICAgIHJldHVybiBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIHJldHVybiBuYW1lO1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZVN5bWJvbEtleXMoYXJyYXkpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIWlzU3ltYm9sU3RyaW5nKGFycmF5W2ldKSkge1xuICAgICAgICBydi5wdXNoKGFycmF5W2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG4gIGZ1bmN0aW9uIGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KSB7XG4gICAgcmV0dXJuIHJlbW92ZVN5bWJvbEtleXMoJGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KSk7XG4gIH1cbiAgZnVuY3Rpb24ga2V5cyhvYmplY3QpIHtcbiAgICByZXR1cm4gcmVtb3ZlU3ltYm9sS2V5cygka2V5cyhvYmplY3QpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgdmFyIG5hbWVzID0gJGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3ltYm9sID0gc3ltYm9sVmFsdWVzW25hbWVzW2ldXTtcbiAgICAgIGlmIChzeW1ib2wpIHtcbiAgICAgICAgcnYucHVzaChzeW1ib2wpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkge1xuICAgIHJldHVybiAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cbiAgZnVuY3Rpb24gaGFzT3duUHJvcGVydHkobmFtZSkge1xuICAgIHJldHVybiAkaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCB0b1Byb3BlcnR5KG5hbWUpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPcHRpb24obmFtZSkge1xuICAgIHJldHVybiBnbG9iYWwudHJhY2V1ciAmJiBnbG9iYWwudHJhY2V1ci5vcHRpb25zW25hbWVdO1xuICB9XG4gIGZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwgZGVzY3JpcHRvcikge1xuICAgIGlmIChpc1NoaW1TeW1ib2wobmFtZSkpIHtcbiAgICAgIG5hbWUgPSBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIH1cbiAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKTtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsT2JqZWN0KE9iamVjdCkge1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdkZWZpbmVQcm9wZXJ0eScsIHt2YWx1ZTogZGVmaW5lUHJvcGVydHl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlOYW1lcycsIHt2YWx1ZTogZ2V0T3duUHJvcGVydHlOYW1lc30pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3InLCB7dmFsdWU6IGdldE93blByb3BlcnR5RGVzY3JpcHRvcn0pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnaGFzT3duUHJvcGVydHknLCB7dmFsdWU6IGhhc093blByb3BlcnR5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2ZyZWV6ZScsIHt2YWx1ZTogZnJlZXplfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ3ByZXZlbnRFeHRlbnNpb25zJywge3ZhbHVlOiBwcmV2ZW50RXh0ZW5zaW9uc30pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdzZWFsJywge3ZhbHVlOiBzZWFsfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2tleXMnLCB7dmFsdWU6IGtleXN9KTtcbiAgfVxuICBmdW5jdGlvbiBleHBvcnRTdGFyKG9iamVjdCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhhcmd1bWVudHNbaV0pO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuYW1lcy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2pdO1xuICAgICAgICBpZiAoaXNTeW1ib2xTdHJpbmcobmFtZSkpXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIChmdW5jdGlvbihtb2QsIG5hbWUpIHtcbiAgICAgICAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gbW9kW25hbWVdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoYXJndW1lbnRzW2ldLCBuYW1lc1tqXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbiAgZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgIHJldHVybiB4ICE9IG51bGwgJiYgKHR5cGVvZiB4ID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyk7XG4gIH1cbiAgZnVuY3Rpb24gdG9PYmplY3QoeCkge1xuICAgIGlmICh4ID09IG51bGwpXG4gICAgICB0aHJvdyAkVHlwZUVycm9yKCk7XG4gICAgcmV0dXJuICRPYmplY3QoeCk7XG4gIH1cbiAgZnVuY3Rpb24gY2hlY2tPYmplY3RDb2VyY2libGUoYXJndW1lbnQpIHtcbiAgICBpZiAoYXJndW1lbnQgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhbiBPYmplY3QnKTtcbiAgICB9XG4gICAgcmV0dXJuIGFyZ3VtZW50O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsU3ltYm9sKGdsb2JhbCwgU3ltYm9sKSB7XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sKSB7XG4gICAgICBnbG9iYWwuU3ltYm9sID0gU3ltYm9sO1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scztcbiAgICB9XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sLml0ZXJhdG9yKSB7XG4gICAgICBnbG9iYWwuU3ltYm9sLml0ZXJhdG9yID0gU3ltYm9sKCdTeW1ib2wuaXRlcmF0b3InKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc2V0dXBHbG9iYWxzKGdsb2JhbCkge1xuICAgIHBvbHlmaWxsU3ltYm9sKGdsb2JhbCwgU3ltYm9sKTtcbiAgICBnbG9iYWwuUmVmbGVjdCA9IGdsb2JhbC5SZWZsZWN0IHx8IHt9O1xuICAgIGdsb2JhbC5SZWZsZWN0Lmdsb2JhbCA9IGdsb2JhbC5SZWZsZWN0Lmdsb2JhbCB8fCBnbG9iYWw7XG4gICAgcG9seWZpbGxPYmplY3QoZ2xvYmFsLk9iamVjdCk7XG4gIH1cbiAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG4gIGdsb2JhbC4kdHJhY2V1clJ1bnRpbWUgPSB7XG4gICAgY2hlY2tPYmplY3RDb2VyY2libGU6IGNoZWNrT2JqZWN0Q29lcmNpYmxlLFxuICAgIGNyZWF0ZVByaXZhdGVOYW1lOiBjcmVhdGVQcml2YXRlTmFtZSxcbiAgICBkZWZpbmVQcm9wZXJ0aWVzOiAkZGVmaW5lUHJvcGVydGllcyxcbiAgICBkZWZpbmVQcm9wZXJ0eTogJGRlZmluZVByb3BlcnR5LFxuICAgIGV4cG9ydFN0YXI6IGV4cG9ydFN0YXIsXG4gICAgZ2V0T3duSGFzaE9iamVjdDogZ2V0T3duSGFzaE9iamVjdCxcbiAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I6ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgZ2V0T3duUHJvcGVydHlOYW1lczogJGdldE93blByb3BlcnR5TmFtZXMsXG4gICAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICAgIGlzUHJpdmF0ZU5hbWU6IGlzUHJpdmF0ZU5hbWUsXG4gICAgaXNTeW1ib2xTdHJpbmc6IGlzU3ltYm9sU3RyaW5nLFxuICAgIGtleXM6ICRrZXlzLFxuICAgIHNldHVwR2xvYmFsczogc2V0dXBHbG9iYWxzLFxuICAgIHRvT2JqZWN0OiB0b09iamVjdCxcbiAgICB0b1Byb3BlcnR5OiB0b1Byb3BlcnR5LFxuICAgIHR5cGVvZjogdHlwZU9mXG4gIH07XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBwYXRoO1xuICBmdW5jdGlvbiByZWxhdGl2ZVJlcXVpcmUoY2FsbGVyUGF0aCwgcmVxdWlyZWRQYXRoKSB7XG4gICAgcGF0aCA9IHBhdGggfHwgdHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnICYmIHJlcXVpcmUoJ3BhdGgnKTtcbiAgICBmdW5jdGlvbiBpc0RpcmVjdG9yeShwYXRoKSB7XG4gICAgICByZXR1cm4gcGF0aC5zbGljZSgtMSkgPT09ICcvJztcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoKSB7XG4gICAgICByZXR1cm4gcGF0aFswXSA9PT0gJy8nO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1JlbGF0aXZlKHBhdGgpIHtcbiAgICAgIHJldHVybiBwYXRoWzBdID09PSAnLic7XG4gICAgfVxuICAgIGlmIChpc0RpcmVjdG9yeShyZXF1aXJlZFBhdGgpIHx8IGlzQWJzb2x1dGUocmVxdWlyZWRQYXRoKSlcbiAgICAgIHJldHVybjtcbiAgICByZXR1cm4gaXNSZWxhdGl2ZShyZXF1aXJlZFBhdGgpID8gcmVxdWlyZShwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGNhbGxlclBhdGgpLCByZXF1aXJlZFBhdGgpKSA6IHJlcXVpcmUocmVxdWlyZWRQYXRoKTtcbiAgfVxuICAkdHJhY2V1clJ1bnRpbWUucmVxdWlyZSA9IHJlbGF0aXZlUmVxdWlyZTtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgZnVuY3Rpb24gc3ByZWFkKCkge1xuICAgIHZhciBydiA9IFtdLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgaXRlclJlc3VsdDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlVG9TcHJlYWQgPSAkdHJhY2V1clJ1bnRpbWUuY2hlY2tPYmplY3RDb2VyY2libGUoYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWVUb1NwcmVhZFskdHJhY2V1clJ1bnRpbWUudG9Qcm9wZXJ0eShTeW1ib2wuaXRlcmF0b3IpXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3Qgc3ByZWFkIG5vbi1pdGVyYWJsZSBvYmplY3QuJyk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlciA9IHZhbHVlVG9TcHJlYWRbJHRyYWNldXJSdW50aW1lLnRvUHJvcGVydHkoU3ltYm9sLml0ZXJhdG9yKV0oKTtcbiAgICAgIHdoaWxlICghKGl0ZXJSZXN1bHQgPSBpdGVyLm5leHQoKSkuZG9uZSkge1xuICAgICAgICBydltqKytdID0gaXRlclJlc3VsdC52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG4gICR0cmFjZXVyUnVudGltZS5zcHJlYWQgPSBzcHJlYWQ7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciAkT2JqZWN0ID0gT2JqZWN0O1xuICB2YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcbiAgdmFyICRjcmVhdGUgPSAkT2JqZWN0LmNyZWF0ZTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0aWVzID0gJHRyYWNldXJSdW50aW1lLmRlZmluZVByb3BlcnRpZXM7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSAkdHJhY2V1clJ1bnRpbWUuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJHRyYWNldXJSdW50aW1lLmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eU5hbWVzID0gJHRyYWNldXJSdW50aW1lLmdldE93blByb3BlcnR5TmFtZXM7XG4gIHZhciAkZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG4gIHZhciAkX18wID0gT2JqZWN0LFxuICAgICAgZ2V0T3duUHJvcGVydHlOYW1lcyA9ICRfXzAuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICAgIGdldE93blByb3BlcnR5U3ltYm9scyA9ICRfXzAuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuICBmdW5jdGlvbiBzdXBlckRlc2NyaXB0b3IoaG9tZU9iamVjdCwgbmFtZSkge1xuICAgIHZhciBwcm90byA9ICRnZXRQcm90b3R5cGVPZihob21lT2JqZWN0KTtcbiAgICBkbyB7XG4gICAgICB2YXIgcmVzdWx0ID0gJGdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90bywgbmFtZSk7XG4gICAgICBpZiAocmVzdWx0KVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgcHJvdG8gPSAkZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIH0gd2hpbGUgKHByb3RvKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIHN1cGVyQ29uc3RydWN0b3IoY3Rvcikge1xuICAgIHJldHVybiBjdG9yLl9fcHJvdG9fXztcbiAgfVxuICBmdW5jdGlvbiBzdXBlckNhbGwoc2VsZiwgaG9tZU9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBzdXBlckdldChzZWxmLCBob21lT2JqZWN0LCBuYW1lKS5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBmdW5jdGlvbiBzdXBlckdldChzZWxmLCBob21lT2JqZWN0LCBuYW1lKSB7XG4gICAgdmFyIGRlc2NyaXB0b3IgPSBzdXBlckRlc2NyaXB0b3IoaG9tZU9iamVjdCwgbmFtZSk7XG4gICAgaWYgKGRlc2NyaXB0b3IpIHtcbiAgICAgIGlmICghZGVzY3JpcHRvci5nZXQpXG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yLnZhbHVlO1xuICAgICAgcmV0dXJuIGRlc2NyaXB0b3IuZ2V0LmNhbGwoc2VsZik7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gc3VwZXJTZXQoc2VsZiwgaG9tZU9iamVjdCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHN1cGVyRGVzY3JpcHRvcihob21lT2JqZWN0LCBuYW1lKTtcbiAgICBpZiAoZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgZGVzY3JpcHRvci5zZXQuY2FsbChzZWxmLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHRocm93ICRUeXBlRXJyb3IoKFwic3VwZXIgaGFzIG5vIHNldHRlciAnXCIgKyBuYW1lICsgXCInLlwiKSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0RGVzY3JpcHRvcnMob2JqZWN0KSB7XG4gICAgdmFyIGRlc2NyaXB0b3JzID0ge307XG4gICAgdmFyIG5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICBkZXNjcmlwdG9yc1tuYW1lXSA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBuYW1lKTtcbiAgICB9XG4gICAgdmFyIHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xzW2ldO1xuICAgICAgZGVzY3JpcHRvcnNbJHRyYWNldXJSdW50aW1lLnRvUHJvcGVydHkoc3ltYm9sKV0gPSAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgJHRyYWNldXJSdW50aW1lLnRvUHJvcGVydHkoc3ltYm9sKSk7XG4gICAgfVxuICAgIHJldHVybiBkZXNjcmlwdG9ycztcbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVDbGFzcyhjdG9yLCBvYmplY3QsIHN0YXRpY09iamVjdCwgc3VwZXJDbGFzcykge1xuICAgICRkZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjb25zdHJ1Y3RvcicsIHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgaWYgKHR5cGVvZiBzdXBlckNsYXNzID09PSAnZnVuY3Rpb24nKVxuICAgICAgICBjdG9yLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9ICRjcmVhdGUoZ2V0UHJvdG9QYXJlbnQoc3VwZXJDbGFzcyksIGdldERlc2NyaXB0b3JzKG9iamVjdCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG9iamVjdDtcbiAgICB9XG4gICAgJGRlZmluZVByb3BlcnR5KGN0b3IsICdwcm90b3R5cGUnLCB7XG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuICRkZWZpbmVQcm9wZXJ0aWVzKGN0b3IsIGdldERlc2NyaXB0b3JzKHN0YXRpY09iamVjdCkpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFByb3RvUGFyZW50KHN1cGVyQ2xhc3MpIHtcbiAgICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBwcm90b3R5cGUgPSBzdXBlckNsYXNzLnByb3RvdHlwZTtcbiAgICAgIGlmICgkT2JqZWN0KHByb3RvdHlwZSkgPT09IHByb3RvdHlwZSB8fCBwcm90b3R5cGUgPT09IG51bGwpXG4gICAgICAgIHJldHVybiBzdXBlckNsYXNzLnByb3RvdHlwZTtcbiAgICAgIHRocm93IG5ldyAkVHlwZUVycm9yKCdzdXBlciBwcm90b3R5cGUgbXVzdCBiZSBhbiBPYmplY3Qgb3IgbnVsbCcpO1xuICAgIH1cbiAgICBpZiAoc3VwZXJDbGFzcyA9PT0gbnVsbClcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHRocm93IG5ldyAkVHlwZUVycm9yKChcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyArIFwiLlwiKSk7XG4gIH1cbiAgZnVuY3Rpb24gZGVmYXVsdFN1cGVyQ2FsbChzZWxmLCBob21lT2JqZWN0LCBhcmdzKSB7XG4gICAgaWYgKCRnZXRQcm90b3R5cGVPZihob21lT2JqZWN0KSAhPT0gbnVsbClcbiAgICAgIHN1cGVyQ2FsbChzZWxmLCBob21lT2JqZWN0LCAnY29uc3RydWN0b3InLCBhcmdzKTtcbiAgfVxuICAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MgPSBjcmVhdGVDbGFzcztcbiAgJHRyYWNldXJSdW50aW1lLmRlZmF1bHRTdXBlckNhbGwgPSBkZWZhdWx0U3VwZXJDYWxsO1xuICAkdHJhY2V1clJ1bnRpbWUuc3VwZXJDYWxsID0gc3VwZXJDYWxsO1xuICAkdHJhY2V1clJ1bnRpbWUuc3VwZXJDb25zdHJ1Y3RvciA9IHN1cGVyQ29uc3RydWN0b3I7XG4gICR0cmFjZXVyUnVudGltZS5zdXBlckdldCA9IHN1cGVyR2V0O1xuICAkdHJhY2V1clJ1bnRpbWUuc3VwZXJTZXQgPSBzdXBlclNldDtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgaWYgKHR5cGVvZiAkdHJhY2V1clJ1bnRpbWUgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0cmFjZXVyIHJ1bnRpbWUgbm90IGZvdW5kLicpO1xuICB9XG4gIHZhciBjcmVhdGVQcml2YXRlTmFtZSA9ICR0cmFjZXVyUnVudGltZS5jcmVhdGVQcml2YXRlTmFtZTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0aWVzID0gJHRyYWNldXJSdW50aW1lLmRlZmluZVByb3BlcnRpZXM7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSAkdHJhY2V1clJ1bnRpbWUuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbiAgdmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gIGZ1bmN0aW9uIG5vbkVudW0odmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gIH1cbiAgdmFyIFNUX05FV0JPUk4gPSAwO1xuICB2YXIgU1RfRVhFQ1VUSU5HID0gMTtcbiAgdmFyIFNUX1NVU1BFTkRFRCA9IDI7XG4gIHZhciBTVF9DTE9TRUQgPSAzO1xuICB2YXIgRU5EX1NUQVRFID0gLTI7XG4gIHZhciBSRVRIUk9XX1NUQVRFID0gLTM7XG4gIGZ1bmN0aW9uIGdldEludGVybmFsRXJyb3Ioc3RhdGUpIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKCdUcmFjZXVyIGNvbXBpbGVyIGJ1ZzogaW52YWxpZCBzdGF0ZSBpbiBzdGF0ZSBtYWNoaW5lOiAnICsgc3RhdGUpO1xuICB9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckNvbnRleHQoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IDA7XG4gICAgdGhpcy5HU3RhdGUgPSBTVF9ORVdCT1JOO1xuICAgIHRoaXMuc3RvcmVkRXhjZXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZmluYWxseUZhbGxUaHJvdWdoID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc2VudF8gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRyeVN0YWNrXyA9IFtdO1xuICB9XG4gIEdlbmVyYXRvckNvbnRleHQucHJvdG90eXBlID0ge1xuICAgIHB1c2hUcnk6IGZ1bmN0aW9uKGNhdGNoU3RhdGUsIGZpbmFsbHlTdGF0ZSkge1xuICAgICAgaWYgKGZpbmFsbHlTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgZmluYWxseUZhbGxUaHJvdWdoID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5U3RhY2tfLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKHRoaXMudHJ5U3RhY2tfW2ldLmNhdGNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZpbmFsbHlGYWxsVGhyb3VnaCA9IHRoaXMudHJ5U3RhY2tfW2ldLmNhdGNoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmaW5hbGx5RmFsbFRocm91Z2ggPT09IG51bGwpXG4gICAgICAgICAgZmluYWxseUZhbGxUaHJvdWdoID0gUkVUSFJPV19TVEFURTtcbiAgICAgICAgdGhpcy50cnlTdGFja18ucHVzaCh7XG4gICAgICAgICAgZmluYWxseTogZmluYWxseVN0YXRlLFxuICAgICAgICAgIGZpbmFsbHlGYWxsVGhyb3VnaDogZmluYWxseUZhbGxUaHJvdWdoXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGNhdGNoU3RhdGUgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50cnlTdGFja18ucHVzaCh7Y2F0Y2g6IGNhdGNoU3RhdGV9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBvcFRyeTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnRyeVN0YWNrXy5wb3AoKTtcbiAgICB9LFxuICAgIGdldCBzZW50KCkge1xuICAgICAgdGhpcy5tYXliZVRocm93KCk7XG4gICAgICByZXR1cm4gdGhpcy5zZW50XztcbiAgICB9LFxuICAgIHNldCBzZW50KHYpIHtcbiAgICAgIHRoaXMuc2VudF8gPSB2O1xuICAgIH0sXG4gICAgZ2V0IHNlbnRJZ25vcmVUaHJvdygpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbnRfO1xuICAgIH0sXG4gICAgbWF5YmVUaHJvdzogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5hY3Rpb24gPT09ICd0aHJvdycpIHtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSAnbmV4dCc7XG4gICAgICAgIHRocm93IHRoaXMuc2VudF87XG4gICAgICB9XG4gICAgfSxcbiAgICBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgc3dpdGNoICh0aGlzLnN0YXRlKSB7XG4gICAgICAgIGNhc2UgRU5EX1NUQVRFOlxuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjYXNlIFJFVEhST1dfU1RBVEU6XG4gICAgICAgICAgdGhyb3cgdGhpcy5zdG9yZWRFeGNlcHRpb247XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgZ2V0SW50ZXJuYWxFcnJvcih0aGlzLnN0YXRlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGhhbmRsZUV4Y2VwdGlvbjogZnVuY3Rpb24oZXgpIHtcbiAgICAgIHRoaXMuR1N0YXRlID0gU1RfQ0xPU0VEO1xuICAgICAgdGhpcy5zdGF0ZSA9IEVORF9TVEFURTtcbiAgICAgIHRocm93IGV4O1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gbmV4dE9yVGhyb3coY3R4LCBtb3ZlTmV4dCwgYWN0aW9uLCB4KSB7XG4gICAgc3dpdGNoIChjdHguR1N0YXRlKSB7XG4gICAgICBjYXNlIFNUX0VYRUNVVElORzpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKChcIlxcXCJcIiArIGFjdGlvbiArIFwiXFxcIiBvbiBleGVjdXRpbmcgZ2VuZXJhdG9yXCIpKTtcbiAgICAgIGNhc2UgU1RfQ0xPU0VEOlxuICAgICAgICBpZiAoYWN0aW9uID09ICduZXh0Jykge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZG9uZTogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgeDtcbiAgICAgIGNhc2UgU1RfTkVXQk9STjpcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3Rocm93Jykge1xuICAgICAgICAgIGN0eC5HU3RhdGUgPSBTVF9DTE9TRUQ7XG4gICAgICAgICAgdGhyb3cgeDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHRocm93ICRUeXBlRXJyb3IoJ1NlbnQgdmFsdWUgdG8gbmV3Ym9ybiBnZW5lcmF0b3InKTtcbiAgICAgIGNhc2UgU1RfU1VTUEVOREVEOlxuICAgICAgICBjdHguR1N0YXRlID0gU1RfRVhFQ1VUSU5HO1xuICAgICAgICBjdHguYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICBjdHguc2VudCA9IHg7XG4gICAgICAgIHZhciB2YWx1ZSA9IG1vdmVOZXh0KGN0eCk7XG4gICAgICAgIHZhciBkb25lID0gdmFsdWUgPT09IGN0eDtcbiAgICAgICAgaWYgKGRvbmUpXG4gICAgICAgICAgdmFsdWUgPSBjdHgucmV0dXJuVmFsdWU7XG4gICAgICAgIGN0eC5HU3RhdGUgPSBkb25lID8gU1RfQ0xPU0VEIDogU1RfU1VTUEVOREVEO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICBkb25lOiBkb25lXG4gICAgICAgIH07XG4gICAgfVxuICB9XG4gIHZhciBjdHhOYW1lID0gY3JlYXRlUHJpdmF0ZU5hbWUoKTtcbiAgdmFyIG1vdmVOZXh0TmFtZSA9IGNyZWF0ZVByaXZhdGVOYW1lKCk7XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uKCkge31cbiAgZnVuY3Rpb24gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUoKSB7fVxuICBHZW5lcmF0b3JGdW5jdGlvbi5wcm90b3R5cGUgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZTtcbiAgJGRlZmluZVByb3BlcnR5KEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKEdlbmVyYXRvckZ1bmN0aW9uKSk7XG4gIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsXG4gICAgbmV4dDogZnVuY3Rpb24odikge1xuICAgICAgcmV0dXJuIG5leHRPclRocm93KHRoaXNbY3R4TmFtZV0sIHRoaXNbbW92ZU5leHROYW1lXSwgJ25leHQnLCB2KTtcbiAgICB9LFxuICAgIHRocm93OiBmdW5jdGlvbih2KSB7XG4gICAgICByZXR1cm4gbmV4dE9yVGhyb3codGhpc1tjdHhOYW1lXSwgdGhpc1ttb3ZlTmV4dE5hbWVdLCAndGhyb3cnLCB2KTtcbiAgICB9XG4gIH07XG4gICRkZWZpbmVQcm9wZXJ0aWVzKEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7ZW51bWVyYWJsZTogZmFsc2V9LFxuICAgIG5leHQ6IHtlbnVtZXJhYmxlOiBmYWxzZX0sXG4gICAgdGhyb3c6IHtlbnVtZXJhYmxlOiBmYWxzZX1cbiAgfSk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgbm9uRW51bShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSkpO1xuICBmdW5jdGlvbiBjcmVhdGVHZW5lcmF0b3JJbnN0YW5jZShpbm5lckZ1bmN0aW9uLCBmdW5jdGlvbk9iamVjdCwgc2VsZikge1xuICAgIHZhciBtb3ZlTmV4dCA9IGdldE1vdmVOZXh0KGlubmVyRnVuY3Rpb24sIHNlbGYpO1xuICAgIHZhciBjdHggPSBuZXcgR2VuZXJhdG9yQ29udGV4dCgpO1xuICAgIHZhciBvYmplY3QgPSAkY3JlYXRlKGZ1bmN0aW9uT2JqZWN0LnByb3RvdHlwZSk7XG4gICAgb2JqZWN0W2N0eE5hbWVdID0gY3R4O1xuICAgIG9iamVjdFttb3ZlTmV4dE5hbWVdID0gbW92ZU5leHQ7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBmdW5jdGlvbiBpbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb25PYmplY3QpIHtcbiAgICBmdW5jdGlvbk9iamVjdC5wcm90b3R5cGUgPSAkY3JlYXRlKEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSk7XG4gICAgZnVuY3Rpb25PYmplY3QuX19wcm90b19fID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gICAgcmV0dXJuIGZ1bmN0aW9uT2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIEFzeW5jRnVuY3Rpb25Db250ZXh0KCkge1xuICAgIEdlbmVyYXRvckNvbnRleHQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmVyciA9IHVuZGVmaW5lZDtcbiAgICB2YXIgY3R4ID0gdGhpcztcbiAgICBjdHgucmVzdWx0ID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBjdHgucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICBjdHgucmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuICB9XG4gIEFzeW5jRnVuY3Rpb25Db250ZXh0LnByb3RvdHlwZSA9ICRjcmVhdGUoR2VuZXJhdG9yQ29udGV4dC5wcm90b3R5cGUpO1xuICBBc3luY0Z1bmN0aW9uQ29udGV4dC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLnN0YXRlKSB7XG4gICAgICBjYXNlIEVORF9TVEFURTpcbiAgICAgICAgdGhpcy5yZXNvbHZlKHRoaXMucmV0dXJuVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUkVUSFJPV19TVEFURTpcbiAgICAgICAgdGhpcy5yZWplY3QodGhpcy5zdG9yZWRFeGNlcHRpb24pO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMucmVqZWN0KGdldEludGVybmFsRXJyb3IodGhpcy5zdGF0ZSkpO1xuICAgIH1cbiAgfTtcbiAgQXN5bmNGdW5jdGlvbkNvbnRleHQucHJvdG90eXBlLmhhbmRsZUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUgPSBSRVRIUk9XX1NUQVRFO1xuICB9O1xuICBmdW5jdGlvbiBhc3luY1dyYXAoaW5uZXJGdW5jdGlvbiwgc2VsZikge1xuICAgIHZhciBtb3ZlTmV4dCA9IGdldE1vdmVOZXh0KGlubmVyRnVuY3Rpb24sIHNlbGYpO1xuICAgIHZhciBjdHggPSBuZXcgQXN5bmNGdW5jdGlvbkNvbnRleHQoKTtcbiAgICBjdHguY3JlYXRlQ2FsbGJhY2sgPSBmdW5jdGlvbihuZXdTdGF0ZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGN0eC5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgICBjdHgudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgbW92ZU5leHQoY3R4KTtcbiAgICAgIH07XG4gICAgfTtcbiAgICBjdHguZXJyYmFjayA9IGZ1bmN0aW9uKGVycikge1xuICAgICAgaGFuZGxlQ2F0Y2goY3R4LCBlcnIpO1xuICAgICAgbW92ZU5leHQoY3R4KTtcbiAgICB9O1xuICAgIG1vdmVOZXh0KGN0eCk7XG4gICAgcmV0dXJuIGN0eC5yZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0TW92ZU5leHQoaW5uZXJGdW5jdGlvbiwgc2VsZikge1xuICAgIHJldHVybiBmdW5jdGlvbihjdHgpIHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIGlubmVyRnVuY3Rpb24uY2FsbChzZWxmLCBjdHgpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGhhbmRsZUNhdGNoKGN0eCwgZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVDYXRjaChjdHgsIGV4KSB7XG4gICAgY3R4LnN0b3JlZEV4Y2VwdGlvbiA9IGV4O1xuICAgIHZhciBsYXN0ID0gY3R4LnRyeVN0YWNrX1tjdHgudHJ5U3RhY2tfLmxlbmd0aCAtIDFdO1xuICAgIGlmICghbGFzdCkge1xuICAgICAgY3R4LmhhbmRsZUV4Y2VwdGlvbihleCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN0eC5zdGF0ZSA9IGxhc3QuY2F0Y2ggIT09IHVuZGVmaW5lZCA/IGxhc3QuY2F0Y2ggOiBsYXN0LmZpbmFsbHk7XG4gICAgaWYgKGxhc3QuZmluYWxseUZhbGxUaHJvdWdoICE9PSB1bmRlZmluZWQpXG4gICAgICBjdHguZmluYWxseUZhbGxUaHJvdWdoID0gbGFzdC5maW5hbGx5RmFsbFRocm91Z2g7XG4gIH1cbiAgJHRyYWNldXJSdW50aW1lLmFzeW5jV3JhcCA9IGFzeW5jV3JhcDtcbiAgJHRyYWNldXJSdW50aW1lLmluaXRHZW5lcmF0b3JGdW5jdGlvbiA9IGluaXRHZW5lcmF0b3JGdW5jdGlvbjtcbiAgJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlID0gY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2U7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBidWlsZEZyb21FbmNvZGVkUGFydHMob3B0X3NjaGVtZSwgb3B0X3VzZXJJbmZvLCBvcHRfZG9tYWluLCBvcHRfcG9ydCwgb3B0X3BhdGgsIG9wdF9xdWVyeURhdGEsIG9wdF9mcmFnbWVudCkge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBpZiAob3B0X3NjaGVtZSkge1xuICAgICAgb3V0LnB1c2gob3B0X3NjaGVtZSwgJzonKTtcbiAgICB9XG4gICAgaWYgKG9wdF9kb21haW4pIHtcbiAgICAgIG91dC5wdXNoKCcvLycpO1xuICAgICAgaWYgKG9wdF91c2VySW5mbykge1xuICAgICAgICBvdXQucHVzaChvcHRfdXNlckluZm8sICdAJyk7XG4gICAgICB9XG4gICAgICBvdXQucHVzaChvcHRfZG9tYWluKTtcbiAgICAgIGlmIChvcHRfcG9ydCkge1xuICAgICAgICBvdXQucHVzaCgnOicsIG9wdF9wb3J0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdF9wYXRoKSB7XG4gICAgICBvdXQucHVzaChvcHRfcGF0aCk7XG4gICAgfVxuICAgIGlmIChvcHRfcXVlcnlEYXRhKSB7XG4gICAgICBvdXQucHVzaCgnPycsIG9wdF9xdWVyeURhdGEpO1xuICAgIH1cbiAgICBpZiAob3B0X2ZyYWdtZW50KSB7XG4gICAgICBvdXQucHVzaCgnIycsIG9wdF9mcmFnbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBvdXQuam9pbignJyk7XG4gIH1cbiAgO1xuICB2YXIgc3BsaXRSZSA9IG5ldyBSZWdFeHAoJ14nICsgJyg/OicgKyAnKFteOi8/Iy5dKyknICsgJzopPycgKyAnKD86Ly8nICsgJyg/OihbXi8/I10qKUApPycgKyAnKFtcXFxcd1xcXFxkXFxcXC1cXFxcdTAxMDAtXFxcXHVmZmZmLiVdKiknICsgJyg/OjooWzAtOV0rKSk/JyArICcpPycgKyAnKFtePyNdKyk/JyArICcoPzpcXFxcPyhbXiNdKikpPycgKyAnKD86IyguKikpPycgKyAnJCcpO1xuICB2YXIgQ29tcG9uZW50SW5kZXggPSB7XG4gICAgU0NIRU1FOiAxLFxuICAgIFVTRVJfSU5GTzogMixcbiAgICBET01BSU46IDMsXG4gICAgUE9SVDogNCxcbiAgICBQQVRIOiA1LFxuICAgIFFVRVJZX0RBVEE6IDYsXG4gICAgRlJBR01FTlQ6IDdcbiAgfTtcbiAgZnVuY3Rpb24gc3BsaXQodXJpKSB7XG4gICAgcmV0dXJuICh1cmkubWF0Y2goc3BsaXRSZSkpO1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZURvdFNlZ21lbnRzKHBhdGgpIHtcbiAgICBpZiAocGF0aCA9PT0gJy8nKVxuICAgICAgcmV0dXJuICcvJztcbiAgICB2YXIgbGVhZGluZ1NsYXNoID0gcGF0aFswXSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgdmFyIHRyYWlsaW5nU2xhc2ggPSBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgdmFyIHNlZ21lbnRzID0gcGF0aC5zcGxpdCgnLycpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICB2YXIgdXAgPSAwO1xuICAgIGZvciAodmFyIHBvcyA9IDA7IHBvcyA8IHNlZ21lbnRzLmxlbmd0aDsgcG9zKyspIHtcbiAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbcG9zXTtcbiAgICAgIHN3aXRjaCAoc2VnbWVudCkge1xuICAgICAgICBjYXNlICcnOlxuICAgICAgICBjYXNlICcuJzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLi4nOlxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoKVxuICAgICAgICAgICAgb3V0LnBvcCgpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHVwKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgb3V0LnB1c2goc2VnbWVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbGVhZGluZ1NsYXNoKSB7XG4gICAgICB3aGlsZSAodXAtLSA+IDApIHtcbiAgICAgICAgb3V0LnVuc2hpZnQoJy4uJyk7XG4gICAgICB9XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMClcbiAgICAgICAgb3V0LnB1c2goJy4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGxlYWRpbmdTbGFzaCArIG91dC5qb2luKCcvJykgKyB0cmFpbGluZ1NsYXNoO1xuICB9XG4gIGZ1bmN0aW9uIGpvaW5BbmRDYW5vbmljYWxpemVQYXRoKHBhcnRzKSB7XG4gICAgdmFyIHBhdGggPSBwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXSB8fCAnJztcbiAgICBwYXRoID0gcmVtb3ZlRG90U2VnbWVudHMocGF0aCk7XG4gICAgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF0gPSBwYXRoO1xuICAgIHJldHVybiBidWlsZEZyb21FbmNvZGVkUGFydHMocGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSwgcGFydHNbQ29tcG9uZW50SW5kZXguVVNFUl9JTkZPXSwgcGFydHNbQ29tcG9uZW50SW5kZXguRE9NQUlOXSwgcGFydHNbQ29tcG9uZW50SW5kZXguUE9SVF0sIHBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdLCBwYXJ0c1tDb21wb25lbnRJbmRleC5RVUVSWV9EQVRBXSwgcGFydHNbQ29tcG9uZW50SW5kZXguRlJBR01FTlRdKTtcbiAgfVxuICBmdW5jdGlvbiBjYW5vbmljYWxpemVVcmwodXJsKSB7XG4gICAgdmFyIHBhcnRzID0gc3BsaXQodXJsKTtcbiAgICByZXR1cm4gam9pbkFuZENhbm9uaWNhbGl6ZVBhdGgocGFydHMpO1xuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVVcmwoYmFzZSwgdXJsKSB7XG4gICAgdmFyIHBhcnRzID0gc3BsaXQodXJsKTtcbiAgICB2YXIgYmFzZVBhcnRzID0gc3BsaXQoYmFzZSk7XG4gICAgaWYgKHBhcnRzW0NvbXBvbmVudEluZGV4LlNDSEVNRV0pIHtcbiAgICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzW0NvbXBvbmVudEluZGV4LlNDSEVNRV0gPSBiYXNlUGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IENvbXBvbmVudEluZGV4LlNDSEVNRTsgaSA8PSBDb21wb25lbnRJbmRleC5QT1JUOyBpKyspIHtcbiAgICAgIGlmICghcGFydHNbaV0pIHtcbiAgICAgICAgcGFydHNbaV0gPSBiYXNlUGFydHNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwYXJ0c1tDb21wb25lbnRJbmRleC5QQVRIXVswXSA9PSAnLycpIHtcbiAgICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gICAgfVxuICAgIHZhciBwYXRoID0gYmFzZVBhcnRzW0NvbXBvbmVudEluZGV4LlBBVEhdO1xuICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcbiAgICBwYXRoID0gcGF0aC5zbGljZSgwLCBpbmRleCArIDEpICsgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF07XG4gICAgcGFydHNbQ29tcG9uZW50SW5kZXguUEFUSF0gPSBwYXRoO1xuICAgIHJldHVybiBqb2luQW5kQ2Fub25pY2FsaXplUGF0aChwYXJ0cyk7XG4gIH1cbiAgZnVuY3Rpb24gaXNBYnNvbHV0ZShuYW1lKSB7XG4gICAgaWYgKCFuYW1lKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYW1lWzBdID09PSAnLycpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgcGFydHMgPSBzcGxpdChuYW1lKTtcbiAgICBpZiAocGFydHNbQ29tcG9uZW50SW5kZXguU0NIRU1FXSlcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAkdHJhY2V1clJ1bnRpbWUuY2Fub25pY2FsaXplVXJsID0gY2Fub25pY2FsaXplVXJsO1xuICAkdHJhY2V1clJ1bnRpbWUuaXNBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XG4gICR0cmFjZXVyUnVudGltZS5yZW1vdmVEb3RTZWdtZW50cyA9IHJlbW92ZURvdFNlZ21lbnRzO1xuICAkdHJhY2V1clJ1bnRpbWUucmVzb2x2ZVVybCA9IHJlc29sdmVVcmw7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciB0eXBlcyA9IHtcbiAgICBhbnk6IHtuYW1lOiAnYW55J30sXG4gICAgYm9vbGVhbjoge25hbWU6ICdib29sZWFuJ30sXG4gICAgbnVtYmVyOiB7bmFtZTogJ251bWJlcid9LFxuICAgIHN0cmluZzoge25hbWU6ICdzdHJpbmcnfSxcbiAgICBzeW1ib2w6IHtuYW1lOiAnc3ltYm9sJ30sXG4gICAgdm9pZDoge25hbWU6ICd2b2lkJ31cbiAgfTtcbiAgdmFyIEdlbmVyaWNUeXBlID0gZnVuY3Rpb24gR2VuZXJpY1R5cGUodHlwZSwgYXJndW1lbnRUeXBlcykge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5hcmd1bWVudFR5cGVzID0gYXJndW1lbnRUeXBlcztcbiAgfTtcbiAgKCR0cmFjZXVyUnVudGltZS5jcmVhdGVDbGFzcykoR2VuZXJpY1R5cGUsIHt9LCB7fSk7XG4gIHZhciB0eXBlUmVnaXN0ZXIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBmdW5jdGlvbiBnZW5lcmljVHlwZSh0eXBlKSB7XG4gICAgZm9yICh2YXIgYXJndW1lbnRUeXBlcyA9IFtdLFxuICAgICAgICAkX18xID0gMTsgJF9fMSA8IGFyZ3VtZW50cy5sZW5ndGg7ICRfXzErKylcbiAgICAgIGFyZ3VtZW50VHlwZXNbJF9fMSAtIDFdID0gYXJndW1lbnRzWyRfXzFdO1xuICAgIHZhciB0eXBlTWFwID0gdHlwZVJlZ2lzdGVyO1xuICAgIHZhciBrZXkgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0T3duSGFzaE9iamVjdCh0eXBlKS5oYXNoO1xuICAgIGlmICghdHlwZU1hcFtrZXldKSB7XG4gICAgICB0eXBlTWFwW2tleV0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgICB0eXBlTWFwID0gdHlwZU1hcFtrZXldO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRUeXBlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGtleSA9ICR0cmFjZXVyUnVudGltZS5nZXRPd25IYXNoT2JqZWN0KGFyZ3VtZW50VHlwZXNbaV0pLmhhc2g7XG4gICAgICBpZiAoIXR5cGVNYXBba2V5XSkge1xuICAgICAgICB0eXBlTWFwW2tleV0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgfVxuICAgICAgdHlwZU1hcCA9IHR5cGVNYXBba2V5XTtcbiAgICB9XG4gICAgdmFyIHRhaWwgPSBhcmd1bWVudFR5cGVzW2FyZ3VtZW50VHlwZXMubGVuZ3RoIC0gMV07XG4gICAga2V5ID0gJHRyYWNldXJSdW50aW1lLmdldE93bkhhc2hPYmplY3QodGFpbCkuaGFzaDtcbiAgICBpZiAoIXR5cGVNYXBba2V5XSkge1xuICAgICAgdHlwZU1hcFtrZXldID0gbmV3IEdlbmVyaWNUeXBlKHR5cGUsIGFyZ3VtZW50VHlwZXMpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZU1hcFtrZXldO1xuICB9XG4gICR0cmFjZXVyUnVudGltZS5HZW5lcmljVHlwZSA9IEdlbmVyaWNUeXBlO1xuICAkdHJhY2V1clJ1bnRpbWUuZ2VuZXJpY1R5cGUgPSBnZW5lcmljVHlwZTtcbiAgJHRyYWNldXJSdW50aW1lLnR5cGUgPSB0eXBlcztcbn0pKCk7XG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyICRfXzIgPSAkdHJhY2V1clJ1bnRpbWUsXG4gICAgICBjYW5vbmljYWxpemVVcmwgPSAkX18yLmNhbm9uaWNhbGl6ZVVybCxcbiAgICAgIHJlc29sdmVVcmwgPSAkX18yLnJlc29sdmVVcmwsXG4gICAgICBpc0Fic29sdXRlID0gJF9fMi5pc0Fic29sdXRlO1xuICB2YXIgbW9kdWxlSW5zdGFudGlhdG9ycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHZhciBiYXNlVVJMO1xuICBpZiAoZ2xvYmFsLmxvY2F0aW9uICYmIGdsb2JhbC5sb2NhdGlvbi5ocmVmKVxuICAgIGJhc2VVUkwgPSByZXNvbHZlVXJsKGdsb2JhbC5sb2NhdGlvbi5ocmVmLCAnLi8nKTtcbiAgZWxzZVxuICAgIGJhc2VVUkwgPSAnJztcbiAgdmFyIFVuY29hdGVkTW9kdWxlRW50cnkgPSBmdW5jdGlvbiBVbmNvYXRlZE1vZHVsZUVudHJ5KHVybCwgdW5jb2F0ZWRNb2R1bGUpIHtcbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLnZhbHVlXyA9IHVuY29hdGVkTW9kdWxlO1xuICB9O1xuICAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShVbmNvYXRlZE1vZHVsZUVudHJ5LCB7fSwge30pO1xuICB2YXIgTW9kdWxlRXZhbHVhdGlvbkVycm9yID0gZnVuY3Rpb24gTW9kdWxlRXZhbHVhdGlvbkVycm9yKGVycm9uZW91c01vZHVsZU5hbWUsIGNhdXNlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgJzogJyArIHRoaXMuc3RyaXBDYXVzZShjYXVzZSkgKyAnIGluICcgKyBlcnJvbmVvdXNNb2R1bGVOYW1lO1xuICAgIGlmICghKGNhdXNlIGluc3RhbmNlb2YgJE1vZHVsZUV2YWx1YXRpb25FcnJvcikgJiYgY2F1c2Uuc3RhY2spXG4gICAgICB0aGlzLnN0YWNrID0gdGhpcy5zdHJpcFN0YWNrKGNhdXNlLnN0YWNrKTtcbiAgICBlbHNlXG4gICAgICB0aGlzLnN0YWNrID0gJyc7XG4gIH07XG4gIHZhciAkTW9kdWxlRXZhbHVhdGlvbkVycm9yID0gTW9kdWxlRXZhbHVhdGlvbkVycm9yO1xuICAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShNb2R1bGVFdmFsdWF0aW9uRXJyb3IsIHtcbiAgICBzdHJpcEVycm9yOiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKC8uKkVycm9yOi8sIHRoaXMuY29uc3RydWN0b3IubmFtZSArICc6Jyk7XG4gICAgfSxcbiAgICBzdHJpcENhdXNlOiBmdW5jdGlvbihjYXVzZSkge1xuICAgICAgaWYgKCFjYXVzZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYgKCFjYXVzZS5tZXNzYWdlKVxuICAgICAgICByZXR1cm4gY2F1c2UgKyAnJztcbiAgICAgIHJldHVybiB0aGlzLnN0cmlwRXJyb3IoY2F1c2UubWVzc2FnZSk7XG4gICAgfSxcbiAgICBsb2FkZWRCeTogZnVuY3Rpb24obW9kdWxlTmFtZSkge1xuICAgICAgdGhpcy5zdGFjayArPSAnXFxuIGxvYWRlZCBieSAnICsgbW9kdWxlTmFtZTtcbiAgICB9LFxuICAgIHN0cmlwU3RhY2s6IGZ1bmN0aW9uKGNhdXNlU3RhY2spIHtcbiAgICAgIHZhciBzdGFjayA9IFtdO1xuICAgICAgY2F1c2VTdGFjay5zcGxpdCgnXFxuJykuc29tZSgoZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgaWYgKC9VbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvci8udGVzdChmcmFtZSkpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHN0YWNrLnB1c2goZnJhbWUpO1xuICAgICAgfSkpO1xuICAgICAgc3RhY2tbMF0gPSB0aGlzLnN0cmlwRXJyb3Ioc3RhY2tbMF0pO1xuICAgICAgcmV0dXJuIHN0YWNrLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgfSwge30sIEVycm9yKTtcbiAgZnVuY3Rpb24gYmVmb3JlTGluZXMobGluZXMsIG51bWJlcikge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgZmlyc3QgPSBudW1iZXIgLSAzO1xuICAgIGlmIChmaXJzdCA8IDApXG4gICAgICBmaXJzdCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbnVtYmVyOyBpKyspIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxpbmVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBhZnRlckxpbmVzKGxpbmVzLCBudW1iZXIpIHtcbiAgICB2YXIgbGFzdCA9IG51bWJlciArIDE7XG4gICAgaWYgKGxhc3QgPiBsaW5lcy5sZW5ndGggLSAxKVxuICAgICAgbGFzdCA9IGxpbmVzLmxlbmd0aCAtIDE7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSBudW1iZXI7IGkgPD0gbGFzdDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChsaW5lc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZnVuY3Rpb24gY29sdW1uU3BhY2luZyhjb2x1bW5zKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sdW1ucyAtIDE7IGkrKykge1xuICAgICAgcmVzdWx0ICs9ICctJztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICB2YXIgVW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3IgPSBmdW5jdGlvbiBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcih1cmwsIGZ1bmMpIHtcbiAgICAkdHJhY2V1clJ1bnRpbWUuc3VwZXJDb25zdHJ1Y3RvcigkVW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3IpLmNhbGwodGhpcywgdXJsLCBudWxsKTtcbiAgICB0aGlzLmZ1bmMgPSBmdW5jO1xuICB9O1xuICB2YXIgJFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yID0gVW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3I7XG4gICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yLCB7Z2V0VW5jb2F0ZWRNb2R1bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMudmFsdWVfKVxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZV87XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgcmVsYXRpdmVSZXF1aXJlO1xuICAgICAgICBpZiAodHlwZW9mICR0cmFjZXVyUnVudGltZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmVsYXRpdmVSZXF1aXJlID0gJHRyYWNldXJSdW50aW1lLnJlcXVpcmUuYmluZChudWxsLCB0aGlzLnVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVfID0gdGhpcy5mdW5jLmNhbGwoZ2xvYmFsLCByZWxhdGl2ZVJlcXVpcmUpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV4IGluc3RhbmNlb2YgTW9kdWxlRXZhbHVhdGlvbkVycm9yKSB7XG4gICAgICAgICAgZXgubG9hZGVkQnkodGhpcy51cmwpO1xuICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChleC5zdGFjaykge1xuICAgICAgICAgIHZhciBsaW5lcyA9IHRoaXMuZnVuYy50b1N0cmluZygpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICB2YXIgZXZhbGVkID0gW107XG4gICAgICAgICAgZXguc3RhY2suc3BsaXQoJ1xcbicpLnNvbWUoZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgICAgIGlmIChmcmFtZS5pbmRleE9mKCdVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvci5nZXRVbmNvYXRlZE1vZHVsZScpID4gMClcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB2YXIgbSA9IC8oYXRcXHNbXlxcc10qXFxzKS4qPjooXFxkKik6KFxcZCopXFwpLy5leGVjKGZyYW1lKTtcbiAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgIHZhciBsaW5lID0gcGFyc2VJbnQobVsyXSwgMTApO1xuICAgICAgICAgICAgICBldmFsZWQgPSBldmFsZWQuY29uY2F0KGJlZm9yZUxpbmVzKGxpbmVzLCBsaW5lKSk7XG4gICAgICAgICAgICAgIGV2YWxlZC5wdXNoKGNvbHVtblNwYWNpbmcobVszXSkgKyAnXicpO1xuICAgICAgICAgICAgICBldmFsZWQgPSBldmFsZWQuY29uY2F0KGFmdGVyTGluZXMobGluZXMsIGxpbmUpKTtcbiAgICAgICAgICAgICAgZXZhbGVkLnB1c2goJz0gPSA9ID0gPSA9ID0gPSA9Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBldmFsZWQucHVzaChmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZXguc3RhY2sgPSBldmFsZWQuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IE1vZHVsZUV2YWx1YXRpb25FcnJvcih0aGlzLnVybCwgZXgpO1xuICAgICAgfVxuICAgIH19LCB7fSwgVW5jb2F0ZWRNb2R1bGVFbnRyeSk7XG4gIGZ1bmN0aW9uIGdldFVuY29hdGVkTW9kdWxlSW5zdGFudGlhdG9yKG5hbWUpIHtcbiAgICBpZiAoIW5hbWUpXG4gICAgICByZXR1cm47XG4gICAgdmFyIHVybCA9IE1vZHVsZVN0b3JlLm5vcm1hbGl6ZShuYW1lKTtcbiAgICByZXR1cm4gbW9kdWxlSW5zdGFudGlhdG9yc1t1cmxdO1xuICB9XG4gIDtcbiAgdmFyIG1vZHVsZUluc3RhbmNlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHZhciBsaXZlTW9kdWxlU2VudGluZWwgPSB7fTtcbiAgZnVuY3Rpb24gTW9kdWxlKHVuY29hdGVkTW9kdWxlKSB7XG4gICAgdmFyIGlzTGl2ZSA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgY29hdGVkTW9kdWxlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh1bmNvYXRlZE1vZHVsZSkuZm9yRWFjaCgoZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGdldHRlcixcbiAgICAgICAgICB2YWx1ZTtcbiAgICAgIGlmIChpc0xpdmUgPT09IGxpdmVNb2R1bGVTZW50aW5lbCkge1xuICAgICAgICB2YXIgZGVzY3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHVuY29hdGVkTW9kdWxlLCBuYW1lKTtcbiAgICAgICAgaWYgKGRlc2NyLmdldClcbiAgICAgICAgICBnZXR0ZXIgPSBkZXNjci5nZXQ7XG4gICAgICB9XG4gICAgICBpZiAoIWdldHRlcikge1xuICAgICAgICB2YWx1ZSA9IHVuY29hdGVkTW9kdWxlW25hbWVdO1xuICAgICAgICBnZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29hdGVkTW9kdWxlLCBuYW1lLCB7XG4gICAgICAgIGdldDogZ2V0dGVyLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9KSk7XG4gICAgT2JqZWN0LnByZXZlbnRFeHRlbnNpb25zKGNvYXRlZE1vZHVsZSk7XG4gICAgcmV0dXJuIGNvYXRlZE1vZHVsZTtcbiAgfVxuICB2YXIgTW9kdWxlU3RvcmUgPSB7XG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbihuYW1lLCByZWZlcmVyTmFtZSwgcmVmZXJlckFkZHJlc3MpIHtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ21vZHVsZSBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIG5vdCAnICsgdHlwZW9mIG5hbWUpO1xuICAgICAgaWYgKGlzQWJzb2x1dGUobmFtZSkpXG4gICAgICAgIHJldHVybiBjYW5vbmljYWxpemVVcmwobmFtZSk7XG4gICAgICBpZiAoL1teXFwuXVxcL1xcLlxcLlxcLy8udGVzdChuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBuYW1lIGVtYmVkcyAvLi4vOiAnICsgbmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAobmFtZVswXSA9PT0gJy4nICYmIHJlZmVyZXJOYW1lKVxuICAgICAgICByZXR1cm4gcmVzb2x2ZVVybChyZWZlcmVyTmFtZSwgbmFtZSk7XG4gICAgICByZXR1cm4gY2Fub25pY2FsaXplVXJsKG5hbWUpO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbihub3JtYWxpemVkTmFtZSkge1xuICAgICAgdmFyIG0gPSBnZXRVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSk7XG4gICAgICBpZiAoIW0pXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB2YXIgbW9kdWxlSW5zdGFuY2UgPSBtb2R1bGVJbnN0YW5jZXNbbS51cmxdO1xuICAgICAgaWYgKG1vZHVsZUluc3RhbmNlKVxuICAgICAgICByZXR1cm4gbW9kdWxlSW5zdGFuY2U7XG4gICAgICBtb2R1bGVJbnN0YW5jZSA9IE1vZHVsZShtLmdldFVuY29hdGVkTW9kdWxlKCksIGxpdmVNb2R1bGVTZW50aW5lbCk7XG4gICAgICByZXR1cm4gbW9kdWxlSW5zdGFuY2VzW20udXJsXSA9IG1vZHVsZUluc3RhbmNlO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihub3JtYWxpemVkTmFtZSwgbW9kdWxlKSB7XG4gICAgICBub3JtYWxpemVkTmFtZSA9IFN0cmluZyhub3JtYWxpemVkTmFtZSk7XG4gICAgICBtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSA9IG5ldyBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSwgKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgICAgfSkpO1xuICAgICAgbW9kdWxlSW5zdGFuY2VzW25vcm1hbGl6ZWROYW1lXSA9IG1vZHVsZTtcbiAgICB9LFxuICAgIGdldCBiYXNlVVJMKCkge1xuICAgICAgcmV0dXJuIGJhc2VVUkw7XG4gICAgfSxcbiAgICBzZXQgYmFzZVVSTCh2KSB7XG4gICAgICBiYXNlVVJMID0gU3RyaW5nKHYpO1xuICAgIH0sXG4gICAgcmVnaXN0ZXJNb2R1bGU6IGZ1bmN0aW9uKG5hbWUsIGRlcHMsIGZ1bmMpIHtcbiAgICAgIHZhciBub3JtYWxpemVkTmFtZSA9IE1vZHVsZVN0b3JlLm5vcm1hbGl6ZShuYW1lKTtcbiAgICAgIGlmIChtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkdXBsaWNhdGUgbW9kdWxlIG5hbWVkICcgKyBub3JtYWxpemVkTmFtZSk7XG4gICAgICBtb2R1bGVJbnN0YW50aWF0b3JzW25vcm1hbGl6ZWROYW1lXSA9IG5ldyBVbmNvYXRlZE1vZHVsZUluc3RhbnRpYXRvcihub3JtYWxpemVkTmFtZSwgZnVuYyk7XG4gICAgfSxcbiAgICBidW5kbGVTdG9yZTogT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24obmFtZSwgZGVwcywgZnVuYykge1xuICAgICAgaWYgKCFkZXBzIHx8ICFkZXBzLmxlbmd0aCAmJiAhZnVuYy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1vZHVsZShuYW1lLCBkZXBzLCBmdW5jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVuZGxlU3RvcmVbbmFtZV0gPSB7XG4gICAgICAgICAgZGVwczogZGVwcyxcbiAgICAgICAgICBleGVjdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkX18wID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGRlcE1hcCA9IHt9O1xuICAgICAgICAgICAgZGVwcy5mb3JFYWNoKChmdW5jdGlvbihkZXAsIGluZGV4KSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZXBNYXBbZGVwXSA9ICRfXzBbaW5kZXhdO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdmFyIHJlZ2lzdHJ5RW50cnkgPSBmdW5jLmNhbGwodGhpcywgZGVwTWFwKTtcbiAgICAgICAgICAgIHJlZ2lzdHJ5RW50cnkuZXhlY3V0ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdHJ5RW50cnkuZXhwb3J0cztcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXRBbm9ueW1vdXNNb2R1bGU6IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgIHJldHVybiBuZXcgTW9kdWxlKGZ1bmMuY2FsbChnbG9iYWwpLCBsaXZlTW9kdWxlU2VudGluZWwpO1xuICAgIH0sXG4gICAgZ2V0Rm9yVGVzdGluZzogZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyICRfXzAgPSB0aGlzO1xuICAgICAgaWYgKCF0aGlzLnRlc3RpbmdQcmVmaXhfKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG1vZHVsZUluc3RhbmNlcykuc29tZSgoZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgdmFyIG0gPSAvKHRyYWNldXJAW15cXC9dKlxcLykvLmV4ZWMoa2V5KTtcbiAgICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgJF9fMC50ZXN0aW5nUHJlZml4XyA9IG1bMV07XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmdldCh0aGlzLnRlc3RpbmdQcmVmaXhfICsgbmFtZSk7XG4gICAgfVxuICB9O1xuICB2YXIgbW9kdWxlU3RvcmVNb2R1bGUgPSBuZXcgTW9kdWxlKHtNb2R1bGVTdG9yZTogTW9kdWxlU3RvcmV9KTtcbiAgTW9kdWxlU3RvcmUuc2V0KCdAdHJhY2V1ci9zcmMvcnVudGltZS9Nb2R1bGVTdG9yZScsIG1vZHVsZVN0b3JlTW9kdWxlKTtcbiAgTW9kdWxlU3RvcmUuc2V0KCdAdHJhY2V1ci9zcmMvcnVudGltZS9Nb2R1bGVTdG9yZS5qcycsIG1vZHVsZVN0b3JlTW9kdWxlKTtcbiAgdmFyIHNldHVwR2xvYmFscyA9ICR0cmFjZXVyUnVudGltZS5zZXR1cEdsb2JhbHM7XG4gICR0cmFjZXVyUnVudGltZS5zZXR1cEdsb2JhbHMgPSBmdW5jdGlvbihnbG9iYWwpIHtcbiAgICBzZXR1cEdsb2JhbHMoZ2xvYmFsKTtcbiAgfTtcbiAgJHRyYWNldXJSdW50aW1lLk1vZHVsZVN0b3JlID0gTW9kdWxlU3RvcmU7XG4gIGdsb2JhbC5TeXN0ZW0gPSB7XG4gICAgcmVnaXN0ZXI6IE1vZHVsZVN0b3JlLnJlZ2lzdGVyLmJpbmQoTW9kdWxlU3RvcmUpLFxuICAgIHJlZ2lzdGVyTW9kdWxlOiBNb2R1bGVTdG9yZS5yZWdpc3Rlck1vZHVsZS5iaW5kKE1vZHVsZVN0b3JlKSxcbiAgICBnZXQ6IE1vZHVsZVN0b3JlLmdldCxcbiAgICBzZXQ6IE1vZHVsZVN0b3JlLnNldCxcbiAgICBub3JtYWxpemU6IE1vZHVsZVN0b3JlLm5vcm1hbGl6ZVxuICB9O1xuICAkdHJhY2V1clJ1bnRpbWUuZ2V0TW9kdWxlSW1wbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaW5zdGFudGlhdG9yID0gZ2V0VW5jb2F0ZWRNb2R1bGVJbnN0YW50aWF0b3IobmFtZSk7XG4gICAgcmV0dXJuIGluc3RhbnRpYXRvciAmJiBpbnN0YW50aWF0b3IuZ2V0VW5jb2F0ZWRNb2R1bGUoKTtcbiAgfTtcbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcyk7XG5TeXN0ZW0ucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiO1xuICB2YXIgJGNlaWwgPSBNYXRoLmNlaWw7XG4gIHZhciAkZmxvb3IgPSBNYXRoLmZsb29yO1xuICB2YXIgJGlzRmluaXRlID0gaXNGaW5pdGU7XG4gIHZhciAkaXNOYU4gPSBpc05hTjtcbiAgdmFyICRwb3cgPSBNYXRoLnBvdztcbiAgdmFyICRtaW4gPSBNYXRoLm1pbjtcbiAgdmFyIHRvT2JqZWN0ID0gJHRyYWNldXJSdW50aW1lLnRvT2JqZWN0O1xuICBmdW5jdGlvbiB0b1VpbnQzMih4KSB7XG4gICAgcmV0dXJuIHggPj4+IDA7XG4gIH1cbiAgZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgIHJldHVybiB4ICYmICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHggPT09ICdmdW5jdGlvbicpO1xuICB9XG4gIGZ1bmN0aW9uIGlzQ2FsbGFibGUoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgfVxuICBmdW5jdGlvbiBpc051bWJlcih4KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVtYmVyJztcbiAgfVxuICBmdW5jdGlvbiB0b0ludGVnZXIoeCkge1xuICAgIHggPSAreDtcbiAgICBpZiAoJGlzTmFOKHgpKVxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHggPT09IDAgfHwgISRpc0Zpbml0ZSh4KSlcbiAgICAgIHJldHVybiB4O1xuICAgIHJldHVybiB4ID4gMCA/ICRmbG9vcih4KSA6ICRjZWlsKHgpO1xuICB9XG4gIHZhciBNQVhfU0FGRV9MRU5HVEggPSAkcG93KDIsIDUzKSAtIDE7XG4gIGZ1bmN0aW9uIHRvTGVuZ3RoKHgpIHtcbiAgICB2YXIgbGVuID0gdG9JbnRlZ2VyKHgpO1xuICAgIHJldHVybiBsZW4gPCAwID8gMCA6ICRtaW4obGVuLCBNQVhfU0FGRV9MRU5HVEgpO1xuICB9XG4gIGZ1bmN0aW9uIGNoZWNrSXRlcmFibGUoeCkge1xuICAgIHJldHVybiAhaXNPYmplY3QoeCkgPyB1bmRlZmluZWQgOiB4W1N5bWJvbC5pdGVyYXRvcl07XG4gIH1cbiAgZnVuY3Rpb24gaXNDb25zdHJ1Y3Rvcih4KSB7XG4gICAgcmV0dXJuIGlzQ2FsbGFibGUoeCk7XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QodmFsdWUsIGRvbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZG9uZTogZG9uZVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCBkZXNjcikge1xuICAgIGlmICghKG5hbWUgaW4gb2JqZWN0KSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwgZGVzY3IpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBtYXliZURlZmluZU1ldGhvZChvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVEZWZpbmVDb25zdChvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgbWF5YmVEZWZpbmUob2JqZWN0LCBuYW1lLCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFkZEZ1bmN0aW9ucyhvYmplY3QsIGZ1bmN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnVuY3Rpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgbmFtZSA9IGZ1bmN0aW9uc1tpXTtcbiAgICAgIHZhciB2YWx1ZSA9IGZ1bmN0aW9uc1tpICsgMV07XG4gICAgICBtYXliZURlZmluZU1ldGhvZChvYmplY3QsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVBZGRDb25zdHMob2JqZWN0LCBjb25zdHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnN0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIG5hbWUgPSBjb25zdHNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBjb25zdHNbaSArIDFdO1xuICAgICAgbWF5YmVEZWZpbmVDb25zdChvYmplY3QsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVBZGRJdGVyYXRvcihvYmplY3QsIGZ1bmMsIFN5bWJvbCkge1xuICAgIGlmICghU3ltYm9sIHx8ICFTeW1ib2wuaXRlcmF0b3IgfHwgb2JqZWN0W1N5bWJvbC5pdGVyYXRvcl0pXG4gICAgICByZXR1cm47XG4gICAgaWYgKG9iamVjdFsnQEBpdGVyYXRvciddKVxuICAgICAgZnVuYyA9IG9iamVjdFsnQEBpdGVyYXRvciddO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIFN5bWJvbC5pdGVyYXRvciwge1xuICAgICAgdmFsdWU6IGZ1bmMsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgdmFyIHBvbHlmaWxscyA9IFtdO1xuICBmdW5jdGlvbiByZWdpc3RlclBvbHlmaWxsKGZ1bmMpIHtcbiAgICBwb2x5ZmlsbHMucHVzaChmdW5jKTtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbEFsbChnbG9iYWwpIHtcbiAgICBwb2x5ZmlsbHMuZm9yRWFjaCgoZnVuY3Rpb24oZikge1xuICAgICAgcmV0dXJuIGYoZ2xvYmFsKTtcbiAgICB9KSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBnZXQgdG9PYmplY3QoKSB7XG4gICAgICByZXR1cm4gdG9PYmplY3Q7XG4gICAgfSxcbiAgICBnZXQgdG9VaW50MzIoKSB7XG4gICAgICByZXR1cm4gdG9VaW50MzI7XG4gICAgfSxcbiAgICBnZXQgaXNPYmplY3QoKSB7XG4gICAgICByZXR1cm4gaXNPYmplY3Q7XG4gICAgfSxcbiAgICBnZXQgaXNDYWxsYWJsZSgpIHtcbiAgICAgIHJldHVybiBpc0NhbGxhYmxlO1xuICAgIH0sXG4gICAgZ2V0IGlzTnVtYmVyKCkge1xuICAgICAgcmV0dXJuIGlzTnVtYmVyO1xuICAgIH0sXG4gICAgZ2V0IHRvSW50ZWdlcigpIHtcbiAgICAgIHJldHVybiB0b0ludGVnZXI7XG4gICAgfSxcbiAgICBnZXQgdG9MZW5ndGgoKSB7XG4gICAgICByZXR1cm4gdG9MZW5ndGg7XG4gICAgfSxcbiAgICBnZXQgY2hlY2tJdGVyYWJsZSgpIHtcbiAgICAgIHJldHVybiBjaGVja0l0ZXJhYmxlO1xuICAgIH0sXG4gICAgZ2V0IGlzQ29uc3RydWN0b3IoKSB7XG4gICAgICByZXR1cm4gaXNDb25zdHJ1Y3RvcjtcbiAgICB9LFxuICAgIGdldCBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdDtcbiAgICB9LFxuICAgIGdldCBtYXliZURlZmluZSgpIHtcbiAgICAgIHJldHVybiBtYXliZURlZmluZTtcbiAgICB9LFxuICAgIGdldCBtYXliZURlZmluZU1ldGhvZCgpIHtcbiAgICAgIHJldHVybiBtYXliZURlZmluZU1ldGhvZDtcbiAgICB9LFxuICAgIGdldCBtYXliZURlZmluZUNvbnN0KCkge1xuICAgICAgcmV0dXJuIG1heWJlRGVmaW5lQ29uc3Q7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVBZGRGdW5jdGlvbnMoKSB7XG4gICAgICByZXR1cm4gbWF5YmVBZGRGdW5jdGlvbnM7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVBZGRDb25zdHMoKSB7XG4gICAgICByZXR1cm4gbWF5YmVBZGRDb25zdHM7XG4gICAgfSxcbiAgICBnZXQgbWF5YmVBZGRJdGVyYXRvcigpIHtcbiAgICAgIHJldHVybiBtYXliZUFkZEl0ZXJhdG9yO1xuICAgIH0sXG4gICAgZ2V0IHJlZ2lzdGVyUG9seWZpbGwoKSB7XG4gICAgICByZXR1cm4gcmVnaXN0ZXJQb2x5ZmlsbDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbEFsbCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbEFsbDtcbiAgICB9XG4gIH07XG59KTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL01hcC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIjtcbiAgdmFyICRfXzAgPSBTeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvdXRpbHMuanNcIiksXG4gICAgICBpc09iamVjdCA9ICRfXzAuaXNPYmplY3QsXG4gICAgICBtYXliZUFkZEl0ZXJhdG9yID0gJF9fMC5tYXliZUFkZEl0ZXJhdG9yLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzAucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyIGdldE93bkhhc2hPYmplY3QgPSAkdHJhY2V1clJ1bnRpbWUuZ2V0T3duSGFzaE9iamVjdDtcbiAgdmFyICRoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciBkZWxldGVkU2VudGluZWwgPSB7fTtcbiAgZnVuY3Rpb24gbG9va3VwSW5kZXgobWFwLCBrZXkpIHtcbiAgICBpZiAoaXNPYmplY3Qoa2V5KSkge1xuICAgICAgdmFyIGhhc2hPYmplY3QgPSBnZXRPd25IYXNoT2JqZWN0KGtleSk7XG4gICAgICByZXR1cm4gaGFzaE9iamVjdCAmJiBtYXAub2JqZWN0SW5kZXhfW2hhc2hPYmplY3QuaGFzaF07XG4gICAgfVxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJylcbiAgICAgIHJldHVybiBtYXAuc3RyaW5nSW5kZXhfW2tleV07XG4gICAgcmV0dXJuIG1hcC5wcmltaXRpdmVJbmRleF9ba2V5XTtcbiAgfVxuICBmdW5jdGlvbiBpbml0TWFwKG1hcCkge1xuICAgIG1hcC5lbnRyaWVzXyA9IFtdO1xuICAgIG1hcC5vYmplY3RJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5zdHJpbmdJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5wcmltaXRpdmVJbmRleF8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1hcC5kZWxldGVkQ291bnRfID0gMDtcbiAgfVxuICB2YXIgTWFwID0gZnVuY3Rpb24gTWFwKCkge1xuICAgIHZhciBpdGVyYWJsZSA9IGFyZ3VtZW50c1swXTtcbiAgICBpZiAoIWlzT2JqZWN0KHRoaXMpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTWFwIGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgdHlwZScpO1xuICAgIGlmICgkaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnZW50cmllc18nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTWFwIGNhbiBub3QgYmUgcmVlbnRyYW50bHkgaW5pdGlhbGlzZWQnKTtcbiAgICB9XG4gICAgaW5pdE1hcCh0aGlzKTtcbiAgICBpZiAoaXRlcmFibGUgIT09IG51bGwgJiYgaXRlcmFibGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZm9yICh2YXIgJF9fMiA9IGl0ZXJhYmxlWyR0cmFjZXVyUnVudGltZS50b1Byb3BlcnR5KFN5bWJvbC5pdGVyYXRvcildKCksXG4gICAgICAgICAgJF9fMzsgISgkX18zID0gJF9fMi5uZXh0KCkpLmRvbmU7ICkge1xuICAgICAgICB2YXIgJF9fNCA9ICRfXzMudmFsdWUsXG4gICAgICAgICAgICBrZXkgPSAkX180WzBdLFxuICAgICAgICAgICAgdmFsdWUgPSAkX180WzFdO1xuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKE1hcCwge1xuICAgIGdldCBzaXplKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZW50cmllc18ubGVuZ3RoIC8gMiAtIHRoaXMuZGVsZXRlZENvdW50XztcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgaW5kZXggPSBsb29rdXBJbmRleCh0aGlzLCBrZXkpO1xuICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzLmVudHJpZXNfW2luZGV4ICsgMV07XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIHZhciBvYmplY3RNb2RlID0gaXNPYmplY3Qoa2V5KTtcbiAgICAgIHZhciBzdHJpbmdNb2RlID0gdHlwZW9mIGtleSA9PT0gJ3N0cmluZyc7XG4gICAgICB2YXIgaW5kZXggPSBsb29rdXBJbmRleCh0aGlzLCBrZXkpO1xuICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbnRyaWVzX1tpbmRleCArIDFdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleCA9IHRoaXMuZW50cmllc18ubGVuZ3RoO1xuICAgICAgICB0aGlzLmVudHJpZXNfW2luZGV4XSA9IGtleTtcbiAgICAgICAgdGhpcy5lbnRyaWVzX1tpbmRleCArIDFdID0gdmFsdWU7XG4gICAgICAgIGlmIChvYmplY3RNb2RlKSB7XG4gICAgICAgICAgdmFyIGhhc2hPYmplY3QgPSBnZXRPd25IYXNoT2JqZWN0KGtleSk7XG4gICAgICAgICAgdmFyIGhhc2ggPSBoYXNoT2JqZWN0Lmhhc2g7XG4gICAgICAgICAgdGhpcy5vYmplY3RJbmRleF9baGFzaF0gPSBpbmRleDtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpbmdNb2RlKSB7XG4gICAgICAgICAgdGhpcy5zdHJpbmdJbmRleF9ba2V5XSA9IGluZGV4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucHJpbWl0aXZlSW5kZXhfW2tleV0gPSBpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGxvb2t1cEluZGV4KHRoaXMsIGtleSkgIT09IHVuZGVmaW5lZDtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgb2JqZWN0TW9kZSA9IGlzT2JqZWN0KGtleSk7XG4gICAgICB2YXIgc3RyaW5nTW9kZSA9IHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnO1xuICAgICAgdmFyIGluZGV4O1xuICAgICAgdmFyIGhhc2g7XG4gICAgICBpZiAob2JqZWN0TW9kZSkge1xuICAgICAgICB2YXIgaGFzaE9iamVjdCA9IGdldE93bkhhc2hPYmplY3Qoa2V5KTtcbiAgICAgICAgaWYgKGhhc2hPYmplY3QpIHtcbiAgICAgICAgICBpbmRleCA9IHRoaXMub2JqZWN0SW5kZXhfW2hhc2ggPSBoYXNoT2JqZWN0Lmhhc2hdO1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLm9iamVjdEluZGV4X1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzdHJpbmdNb2RlKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5zdHJpbmdJbmRleF9ba2V5XTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc3RyaW5nSW5kZXhfW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleCA9IHRoaXMucHJpbWl0aXZlSW5kZXhfW2tleV07XG4gICAgICAgIGRlbGV0ZSB0aGlzLnByaW1pdGl2ZUluZGV4X1trZXldO1xuICAgICAgfVxuICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbnRyaWVzX1tpbmRleF0gPSBkZWxldGVkU2VudGluZWw7XG4gICAgICAgIHRoaXMuZW50cmllc19baW5kZXggKyAxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5kZWxldGVkQ291bnRfKys7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgaW5pdE1hcCh0aGlzKTtcbiAgICB9LFxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrRm4pIHtcbiAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVudHJpZXNfLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHZhciBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmVudHJpZXNfW2kgKyAxXTtcbiAgICAgICAgaWYgKGtleSA9PT0gZGVsZXRlZFNlbnRpbmVsKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBjYWxsYmFja0ZuLmNhbGwodGhpc0FyZywgdmFsdWUsIGtleSwgdGhpcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbnRyaWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzUoKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgdmFsdWU7XG4gICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGgpID8gOCA6IC0yO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuZW50cmllc19baSArIDFdO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpID8gNCA6IDY7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMjtcbiAgICAgICAgICAgICAgcmV0dXJuIFtrZXksIHZhbHVlXTtcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgJGN0eC5tYXliZVRocm93KCk7XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSA0O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHJldHVybiAkY3R4LmVuZCgpO1xuICAgICAgICAgIH1cbiAgICAgIH0sICRfXzUsIHRoaXMpO1xuICAgIH0pLFxuICAgIGtleXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fNigpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICB2YWx1ZTtcbiAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICB3aGlsZSAodHJ1ZSlcbiAgICAgICAgICBzd2l0Y2ggKCRjdHguc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKGkgPCB0aGlzLmVudHJpZXNfLmxlbmd0aCkgPyA4IDogLTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSAxMjtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgIGtleSA9IHRoaXMuZW50cmllc19baV07XG4gICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5lbnRyaWVzX1tpICsgMV07XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSA5O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChrZXkgPT09IGRlbGV0ZWRTZW50aW5lbCkgPyA0IDogNjtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSAyO1xuICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAkY3R4Lm1heWJlVGhyb3coKTtcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgfSwgJF9fNiwgdGhpcyk7XG4gICAgfSksXG4gICAgdmFsdWVzOiAkdHJhY2V1clJ1bnRpbWUuaW5pdEdlbmVyYXRvckZ1bmN0aW9uKGZ1bmN0aW9uICRfXzcoKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgdmFsdWU7XG4gICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IChpIDwgdGhpcy5lbnRyaWVzXy5sZW5ndGgpID8gOCA6IC0yO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICBrZXkgPSB0aGlzLmVudHJpZXNfW2ldO1xuICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuZW50cmllc19baSArIDFdO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gOTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSAoa2V5ID09PSBkZWxldGVkU2VudGluZWwpID8gNCA6IDY7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMjtcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAkY3R4Lm1heWJlVGhyb3coKTtcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgfSwgJF9fNywgdGhpcyk7XG4gICAgfSlcbiAgfSwge30pO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwLnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBNYXAucHJvdG90eXBlLmVudHJpZXNcbiAgfSk7XG4gIGZ1bmN0aW9uIHBvbHlmaWxsTWFwKGdsb2JhbCkge1xuICAgIHZhciAkX180ID0gZ2xvYmFsLFxuICAgICAgICBPYmplY3QgPSAkX180Lk9iamVjdCxcbiAgICAgICAgU3ltYm9sID0gJF9fNC5TeW1ib2w7XG4gICAgaWYgKCFnbG9iYWwuTWFwKVxuICAgICAgZ2xvYmFsLk1hcCA9IE1hcDtcbiAgICB2YXIgbWFwUHJvdG90eXBlID0gZ2xvYmFsLk1hcC5wcm90b3R5cGU7XG4gICAgaWYgKG1hcFByb3RvdHlwZS5lbnRyaWVzID09PSB1bmRlZmluZWQpXG4gICAgICBnbG9iYWwuTWFwID0gTWFwO1xuICAgIGlmIChtYXBQcm90b3R5cGUuZW50cmllcykge1xuICAgICAgbWF5YmVBZGRJdGVyYXRvcihtYXBQcm90b3R5cGUsIG1hcFByb3RvdHlwZS5lbnRyaWVzLCBTeW1ib2wpO1xuICAgICAgbWF5YmVBZGRJdGVyYXRvcihPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IGdsb2JhbC5NYXAoKS5lbnRyaWVzKCkpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LCBTeW1ib2wpO1xuICAgIH1cbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsTWFwKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgTWFwKCkge1xuICAgICAgcmV0dXJuIE1hcDtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbE1hcCgpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbE1hcDtcbiAgICB9XG4gIH07XG59KTtcblN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIiArICcnKTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiLCBbXSwgZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9TZXQuanNcIjtcbiAgdmFyICRfXzAgPSBTeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvdXRpbHMuanNcIiksXG4gICAgICBpc09iamVjdCA9ICRfXzAuaXNPYmplY3QsXG4gICAgICBtYXliZUFkZEl0ZXJhdG9yID0gJF9fMC5tYXliZUFkZEl0ZXJhdG9yLFxuICAgICAgcmVnaXN0ZXJQb2x5ZmlsbCA9ICRfXzAucmVnaXN0ZXJQb2x5ZmlsbDtcbiAgdmFyIE1hcCA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9NYXAuanNcIikuTWFwO1xuICB2YXIgZ2V0T3duSGFzaE9iamVjdCA9ICR0cmFjZXVyUnVudGltZS5nZXRPd25IYXNoT2JqZWN0O1xuICB2YXIgJGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgZnVuY3Rpb24gaW5pdFNldChzZXQpIHtcbiAgICBzZXQubWFwXyA9IG5ldyBNYXAoKTtcbiAgfVxuICB2YXIgU2V0ID0gZnVuY3Rpb24gU2V0KCkge1xuICAgIHZhciBpdGVyYWJsZSA9IGFyZ3VtZW50c1swXTtcbiAgICBpZiAoIWlzT2JqZWN0KHRoaXMpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2V0IGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgdHlwZScpO1xuICAgIGlmICgkaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnbWFwXycpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTZXQgY2FuIG5vdCBiZSByZWVudHJhbnRseSBpbml0aWFsaXNlZCcpO1xuICAgIH1cbiAgICBpbml0U2V0KHRoaXMpO1xuICAgIGlmIChpdGVyYWJsZSAhPT0gbnVsbCAmJiBpdGVyYWJsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3IgKHZhciAkX180ID0gaXRlcmFibGVbJHRyYWNldXJSdW50aW1lLnRvUHJvcGVydHkoU3ltYm9sLml0ZXJhdG9yKV0oKSxcbiAgICAgICAgICAkX181OyAhKCRfXzUgPSAkX180Lm5leHQoKSkuZG9uZTsgKSB7XG4gICAgICAgIHZhciBpdGVtID0gJF9fNS52YWx1ZTtcbiAgICAgICAge1xuICAgICAgICAgIHRoaXMuYWRkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShTZXQsIHtcbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcF8uc2l6ZTtcbiAgICB9LFxuICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXBfLmhhcyhrZXkpO1xuICAgIH0sXG4gICAgYWRkOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHRoaXMubWFwXy5zZXQoa2V5LCBrZXkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFwXy5kZWxldGUoa2V5KTtcbiAgICB9LFxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcF8uY2xlYXIoKTtcbiAgICB9LFxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrRm4pIHtcbiAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICAgICAgdmFyICRfXzIgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMubWFwXy5mb3JFYWNoKChmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIGNhbGxiYWNrRm4uY2FsbCh0aGlzQXJnLCBrZXksIGtleSwgJF9fMik7XG4gICAgICB9KSk7XG4gICAgfSxcbiAgICB2YWx1ZXM6ICR0cmFjZXVyUnVudGltZS5pbml0R2VuZXJhdG9yRnVuY3Rpb24oZnVuY3Rpb24gJF9fNygpIHtcbiAgICAgIHZhciAkX184LFxuICAgICAgICAgICRfXzk7XG4gICAgICByZXR1cm4gJHRyYWNldXJSdW50aW1lLmNyZWF0ZUdlbmVyYXRvckluc3RhbmNlKGZ1bmN0aW9uKCRjdHgpIHtcbiAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgc3dpdGNoICgkY3R4LnN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICRfXzggPSB0aGlzLm1hcF8ua2V5cygpW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICAgICAgICAgICAgJGN0eC5zZW50ID0gdm9pZCAwO1xuICAgICAgICAgICAgICAkY3R4LmFjdGlvbiA9ICduZXh0JztcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICRfXzkgPSAkX184WyRjdHguYWN0aW9uXSgkY3R4LnNlbnRJZ25vcmVUaHJvdyk7XG4gICAgICAgICAgICAgICRjdHguc3RhdGUgPSA5O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9ICgkX185LmRvbmUpID8gMyA6IDI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAkY3R4LnNlbnQgPSAkX185LnZhbHVlO1xuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gLTI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gMTI7XG4gICAgICAgICAgICAgIHJldHVybiAkX185LnZhbHVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuICRjdHguZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgfSwgJF9fNywgdGhpcyk7XG4gICAgfSksXG4gICAgZW50cmllczogJHRyYWNldXJSdW50aW1lLmluaXRHZW5lcmF0b3JGdW5jdGlvbihmdW5jdGlvbiAkX18xMCgpIHtcbiAgICAgIHZhciAkX18xMSxcbiAgICAgICAgICAkX18xMjtcbiAgICAgIHJldHVybiAkdHJhY2V1clJ1bnRpbWUuY3JlYXRlR2VuZXJhdG9ySW5zdGFuY2UoZnVuY3Rpb24oJGN0eCkge1xuICAgICAgICB3aGlsZSAodHJ1ZSlcbiAgICAgICAgICBzd2l0Y2ggKCRjdHguc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgJF9fMTEgPSB0aGlzLm1hcF8uZW50cmllcygpW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICAgICAgICAgICAgJGN0eC5zZW50ID0gdm9pZCAwO1xuICAgICAgICAgICAgICAkY3R4LmFjdGlvbiA9ICduZXh0JztcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICRfXzEyID0gJF9fMTFbJGN0eC5hY3Rpb25dKCRjdHguc2VudElnbm9yZVRocm93KTtcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAkY3R4LnN0YXRlID0gKCRfXzEyLmRvbmUpID8gMyA6IDI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAkY3R4LnNlbnQgPSAkX18xMi52YWx1ZTtcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IC0yO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgJGN0eC5zdGF0ZSA9IDEyO1xuICAgICAgICAgICAgICByZXR1cm4gJF9fMTIudmFsdWU7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm4gJGN0eC5lbmQoKTtcbiAgICAgICAgICB9XG4gICAgICB9LCAkX18xMCwgdGhpcyk7XG4gICAgfSlcbiAgfSwge30pO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2V0LnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBTZXQucHJvdG90eXBlLnZhbHVlc1xuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNldC5wcm90b3R5cGUsICdrZXlzJywge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogU2V0LnByb3RvdHlwZS52YWx1ZXNcbiAgfSk7XG4gIGZ1bmN0aW9uIHBvbHlmaWxsU2V0KGdsb2JhbCkge1xuICAgIHZhciAkX182ID0gZ2xvYmFsLFxuICAgICAgICBPYmplY3QgPSAkX182Lk9iamVjdCxcbiAgICAgICAgU3ltYm9sID0gJF9fNi5TeW1ib2w7XG4gICAgaWYgKCFnbG9iYWwuU2V0KVxuICAgICAgZ2xvYmFsLlNldCA9IFNldDtcbiAgICB2YXIgc2V0UHJvdG90eXBlID0gZ2xvYmFsLlNldC5wcm90b3R5cGU7XG4gICAgaWYgKHNldFByb3RvdHlwZS52YWx1ZXMpIHtcbiAgICAgIG1heWJlQWRkSXRlcmF0b3Ioc2V0UHJvdG90eXBlLCBzZXRQcm90b3R5cGUudmFsdWVzLCBTeW1ib2wpO1xuICAgICAgbWF5YmVBZGRJdGVyYXRvcihPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IGdsb2JhbC5TZXQoKS52YWx1ZXMoKSksIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sIFN5bWJvbCk7XG4gICAgfVxuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxTZXQpO1xuICByZXR1cm4ge1xuICAgIGdldCBTZXQoKSB7XG4gICAgICByZXR1cm4gU2V0O1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsU2V0KCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsU2V0O1xuICAgIH1cbiAgfTtcbn0pO1xuU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1NldC5qc1wiICsgJycpO1xuU3lzdGVtLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9ub2RlX21vZHVsZXMvcnN2cC9saWIvcnN2cC9hc2FwLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvbm9kZV9tb2R1bGVzL3JzdnAvbGliL3JzdnAvYXNhcC5qc1wiO1xuICB2YXIgbGVuID0gMDtcbiAgZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgcXVldWVbbGVuXSA9IGNhbGxiYWNrO1xuICAgIHF1ZXVlW2xlbiArIDFdID0gYXJnO1xuICAgIGxlbiArPSAyO1xuICAgIGlmIChsZW4gPT09IDIpIHtcbiAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICB9XG4gIH1cbiAgdmFyICRfX2RlZmF1bHQgPSBhc2FwO1xuICB2YXIgYnJvd3Nlckdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB7fTtcbiAgdmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgdmFyIGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcbiAgZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICAgIH07XG4gIH1cbiAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBxdWV1ZVtpXTtcbiAgICAgIHZhciBhcmcgPSBxdWV1ZVtpICsgMV07XG4gICAgICBjYWxsYmFjayhhcmcpO1xuICAgICAgcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICBxdWV1ZVtpICsgMV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxlbiA9IDA7XG4gIH1cbiAgdmFyIHNjaGVkdWxlRmx1c2g7XG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG4gIH0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICB9IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gIH0gZWxzZSB7XG4gICAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbiAgfVxuICByZXR1cm4ge2dldCBkZWZhdWx0KCkge1xuICAgICAgcmV0dXJuICRfX2RlZmF1bHQ7XG4gICAgfX07XG59KTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvUHJvbWlzZS5qc1wiO1xuICB2YXIgYXN5bmMgPSBTeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9ub2RlX21vZHVsZXMvcnN2cC9saWIvcnN2cC9hc2FwLmpzXCIpLmRlZmF1bHQ7XG4gIHZhciByZWdpc3RlclBvbHlmaWxsID0gU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3V0aWxzLmpzXCIpLnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciBwcm9taXNlUmF3ID0ge307XG4gIGZ1bmN0aW9uIGlzUHJvbWlzZSh4KSB7XG4gICAgcmV0dXJuIHggJiYgdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHguc3RhdHVzXyAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIGlkUmVzb2x2ZUhhbmRsZXIoeCkge1xuICAgIHJldHVybiB4O1xuICB9XG4gIGZ1bmN0aW9uIGlkUmVqZWN0SGFuZGxlcih4KSB7XG4gICAgdGhyb3cgeDtcbiAgfVxuICBmdW5jdGlvbiBjaGFpbihwcm9taXNlKSB7XG4gICAgdmFyIG9uUmVzb2x2ZSA9IGFyZ3VtZW50c1sxXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMV0gOiBpZFJlc29sdmVIYW5kbGVyO1xuICAgIHZhciBvblJlamVjdCA9IGFyZ3VtZW50c1syXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbMl0gOiBpZFJlamVjdEhhbmRsZXI7XG4gICAgdmFyIGRlZmVycmVkID0gZ2V0RGVmZXJyZWQocHJvbWlzZS5jb25zdHJ1Y3Rvcik7XG4gICAgc3dpdGNoIChwcm9taXNlLnN0YXR1c18pIHtcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICB0aHJvdyBUeXBlRXJyb3I7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHByb21pc2Uub25SZXNvbHZlXy5wdXNoKG9uUmVzb2x2ZSwgZGVmZXJyZWQpO1xuICAgICAgICBwcm9taXNlLm9uUmVqZWN0Xy5wdXNoKG9uUmVqZWN0LCBkZWZlcnJlZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSArMTpcbiAgICAgICAgcHJvbWlzZUVucXVldWUocHJvbWlzZS52YWx1ZV8sIFtvblJlc29sdmUsIGRlZmVycmVkXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAtMTpcbiAgICAgICAgcHJvbWlzZUVucXVldWUocHJvbWlzZS52YWx1ZV8sIFtvblJlamVjdCwgZGVmZXJyZWRdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9XG4gIGZ1bmN0aW9uIGdldERlZmVycmVkKEMpIHtcbiAgICBpZiAodGhpcyA9PT0gJFByb21pc2UpIHtcbiAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZUluaXQobmV3ICRQcm9taXNlKHByb21pc2VSYXcpKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IHByb21pc2UsXG4gICAgICAgIHJlc29sdmU6IChmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcHJvbWlzZVJlc29sdmUocHJvbWlzZSwgeCk7XG4gICAgICAgIH0pLFxuICAgICAgICByZWplY3Q6IChmdW5jdGlvbihyKSB7XG4gICAgICAgICAgcHJvbWlzZVJlamVjdChwcm9taXNlLCByKTtcbiAgICAgICAgfSlcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5wcm9taXNlID0gbmV3IEMoKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZXN1bHQucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIHJlc3VsdC5yZWplY3QgPSByZWplY3Q7XG4gICAgICB9KSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlU2V0KHByb21pc2UsIHN0YXR1cywgdmFsdWUsIG9uUmVzb2x2ZSwgb25SZWplY3QpIHtcbiAgICBwcm9taXNlLnN0YXR1c18gPSBzdGF0dXM7XG4gICAgcHJvbWlzZS52YWx1ZV8gPSB2YWx1ZTtcbiAgICBwcm9taXNlLm9uUmVzb2x2ZV8gPSBvblJlc29sdmU7XG4gICAgcHJvbWlzZS5vblJlamVjdF8gPSBvblJlamVjdDtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlSW5pdChwcm9taXNlKSB7XG4gICAgcmV0dXJuIHByb21pc2VTZXQocHJvbWlzZSwgMCwgdW5kZWZpbmVkLCBbXSwgW10pO1xuICB9XG4gIHZhciBQcm9taXNlID0gZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmIChyZXNvbHZlciA9PT0gcHJvbWlzZVJhdylcbiAgICAgIHJldHVybjtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICB2YXIgcHJvbWlzZSA9IHByb21pc2VJbml0KHRoaXMpO1xuICAgIHRyeSB7XG4gICAgICByZXNvbHZlcigoZnVuY3Rpb24oeCkge1xuICAgICAgICBwcm9taXNlUmVzb2x2ZShwcm9taXNlLCB4KTtcbiAgICAgIH0pLCAoZnVuY3Rpb24ocikge1xuICAgICAgICBwcm9taXNlUmVqZWN0KHByb21pc2UsIHIpO1xuICAgICAgfSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHByb21pc2VSZWplY3QocHJvbWlzZSwgZSk7XG4gICAgfVxuICB9O1xuICAoJHRyYWNldXJSdW50aW1lLmNyZWF0ZUNsYXNzKShQcm9taXNlLCB7XG4gICAgY2F0Y2g6IGZ1bmN0aW9uKG9uUmVqZWN0KSB7XG4gICAgICByZXR1cm4gdGhpcy50aGVuKHVuZGVmaW5lZCwgb25SZWplY3QpO1xuICAgIH0sXG4gICAgdGhlbjogZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCkge1xuICAgICAgaWYgKHR5cGVvZiBvblJlc29sdmUgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIG9uUmVzb2x2ZSA9IGlkUmVzb2x2ZUhhbmRsZXI7XG4gICAgICBpZiAodHlwZW9mIG9uUmVqZWN0ICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICBvblJlamVjdCA9IGlkUmVqZWN0SGFuZGxlcjtcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgIHZhciBjb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICByZXR1cm4gY2hhaW4odGhpcywgZnVuY3Rpb24oeCkge1xuICAgICAgICB4ID0gcHJvbWlzZUNvZXJjZShjb25zdHJ1Y3RvciwgeCk7XG4gICAgICAgIHJldHVybiB4ID09PSB0aGF0ID8gb25SZWplY3QobmV3IFR5cGVFcnJvcikgOiBpc1Byb21pc2UoeCkgPyB4LnRoZW4ob25SZXNvbHZlLCBvblJlamVjdCkgOiBvblJlc29sdmUoeCk7XG4gICAgICB9LCBvblJlamVjdCk7XG4gICAgfVxuICB9LCB7XG4gICAgcmVzb2x2ZTogZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKHRoaXMgPT09ICRQcm9taXNlKSB7XG4gICAgICAgIGlmIChpc1Byb21pc2UoeCkpIHtcbiAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZVNldChuZXcgJFByb21pc2UocHJvbWlzZVJhdyksICsxLCB4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgdGhpcyhmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICByZXNvbHZlKHgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdDogZnVuY3Rpb24ocikge1xuICAgICAgaWYgKHRoaXMgPT09ICRQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlU2V0KG5ldyAkUHJvbWlzZShwcm9taXNlUmF3KSwgLTEsIHIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzKChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICByZWplY3Qocik7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFsbDogZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBnZXREZWZlcnJlZCh0aGlzKTtcbiAgICAgIHZhciByZXNvbHV0aW9ucyA9IFtdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIGNvdW50ID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNvbHV0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZXNbaV0pLnRoZW4oZnVuY3Rpb24oaSwgeCkge1xuICAgICAgICAgICAgICByZXNvbHV0aW9uc1tpXSA9IHg7XG4gICAgICAgICAgICAgIGlmICgtLWNvdW50ID09PSAwKVxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzb2x1dGlvbnMpO1xuICAgICAgICAgICAgfS5iaW5kKHVuZGVmaW5lZCwgaSksIChmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSxcbiAgICByYWNlOiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9IGdldERlZmVycmVkKHRoaXMpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0aGlzLnJlc29sdmUodmFsdWVzW2ldKS50aGVuKChmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHgpO1xuICAgICAgICAgIH0pLCAoZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHIpO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG4gIH0pO1xuICB2YXIgJFByb21pc2UgPSBQcm9taXNlO1xuICB2YXIgJFByb21pc2VSZWplY3QgPSAkUHJvbWlzZS5yZWplY3Q7XG4gIGZ1bmN0aW9uIHByb21pc2VSZXNvbHZlKHByb21pc2UsIHgpIHtcbiAgICBwcm9taXNlRG9uZShwcm9taXNlLCArMSwgeCwgcHJvbWlzZS5vblJlc29sdmVfKTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlUmVqZWN0KHByb21pc2UsIHIpIHtcbiAgICBwcm9taXNlRG9uZShwcm9taXNlLCAtMSwgciwgcHJvbWlzZS5vblJlamVjdF8pO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VEb25lKHByb21pc2UsIHN0YXR1cywgdmFsdWUsIHJlYWN0aW9ucykge1xuICAgIGlmIChwcm9taXNlLnN0YXR1c18gIT09IDApXG4gICAgICByZXR1cm47XG4gICAgcHJvbWlzZUVucXVldWUodmFsdWUsIHJlYWN0aW9ucyk7XG4gICAgcHJvbWlzZVNldChwcm9taXNlLCBzdGF0dXMsIHZhbHVlKTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlRW5xdWV1ZSh2YWx1ZSwgdGFza3MpIHtcbiAgICBhc3luYygoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHByb21pc2VIYW5kbGUodmFsdWUsIHRhc2tzW2ldLCB0YXNrc1tpICsgMV0pO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxuICBmdW5jdGlvbiBwcm9taXNlSGFuZGxlKHZhbHVlLCBoYW5kbGVyLCBkZWZlcnJlZCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVzdWx0ID0gaGFuZGxlcih2YWx1ZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBkZWZlcnJlZC5wcm9taXNlKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgZWxzZSBpZiAoaXNQcm9taXNlKHJlc3VsdCkpXG4gICAgICAgIGNoYWluKHJlc3VsdCwgZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICB9XG4gIHZhciB0aGVuYWJsZVN5bWJvbCA9ICdAQHRoZW5hYmxlJztcbiAgZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgIHJldHVybiB4ICYmICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHggPT09ICdmdW5jdGlvbicpO1xuICB9XG4gIGZ1bmN0aW9uIHByb21pc2VDb2VyY2UoY29uc3RydWN0b3IsIHgpIHtcbiAgICBpZiAoIWlzUHJvbWlzZSh4KSAmJiBpc09iamVjdCh4KSkge1xuICAgICAgdmFyIHRoZW47XG4gICAgICB0cnkge1xuICAgICAgICB0aGVuID0geC50aGVuO1xuICAgICAgfSBjYXRjaCAocikge1xuICAgICAgICB2YXIgcHJvbWlzZSA9ICRQcm9taXNlUmVqZWN0LmNhbGwoY29uc3RydWN0b3IsIHIpO1xuICAgICAgICB4W3RoZW5hYmxlU3ltYm9sXSA9IHByb21pc2U7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBwID0geFt0aGVuYWJsZVN5bWJvbF07XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGRlZmVycmVkID0gZ2V0RGVmZXJyZWQoY29uc3RydWN0b3IpO1xuICAgICAgICAgIHhbdGhlbmFibGVTeW1ib2xdID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhlbi5jYWxsKHgsIGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgfSBjYXRjaCAocikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geDtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbFByb21pc2UoZ2xvYmFsKSB7XG4gICAgaWYgKCFnbG9iYWwuUHJvbWlzZSlcbiAgICAgIGdsb2JhbC5Qcm9taXNlID0gUHJvbWlzZTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsUHJvbWlzZSk7XG4gIHJldHVybiB7XG4gICAgZ2V0IFByb21pc2UoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZTtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFByb21pc2UoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxQcm9taXNlO1xuICAgIH1cbiAgfTtcbn0pO1xuU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1Byb21pc2UuanNcIiArICcnKTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZ0l0ZXJhdG9yLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciAkX18yO1xuICB2YXIgX19tb2R1bGVOYW1lID0gXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmdJdGVyYXRvci5qc1wiO1xuICB2YXIgJF9fMCA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiKSxcbiAgICAgIGNyZWF0ZUl0ZXJhdG9yUmVzdWx0T2JqZWN0ID0gJF9fMC5jcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCxcbiAgICAgIGlzT2JqZWN0ID0gJF9fMC5pc09iamVjdDtcbiAgdmFyIHRvUHJvcGVydHkgPSAkdHJhY2V1clJ1bnRpbWUudG9Qcm9wZXJ0eTtcbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyIGl0ZXJhdGVkU3RyaW5nID0gU3ltYm9sKCdpdGVyYXRlZFN0cmluZycpO1xuICB2YXIgc3RyaW5nSXRlcmF0b3JOZXh0SW5kZXggPSBTeW1ib2woJ3N0cmluZ0l0ZXJhdG9yTmV4dEluZGV4Jyk7XG4gIHZhciBTdHJpbmdJdGVyYXRvciA9IGZ1bmN0aW9uIFN0cmluZ0l0ZXJhdG9yKCkge307XG4gICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKFN0cmluZ0l0ZXJhdG9yLCAoJF9fMiA9IHt9LCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMiwgXCJuZXh0XCIsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbyA9IHRoaXM7XG4gICAgICBpZiAoIWlzT2JqZWN0KG8pIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIGl0ZXJhdGVkU3RyaW5nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGlzIG11c3QgYmUgYSBTdHJpbmdJdGVyYXRvciBvYmplY3QnKTtcbiAgICAgIH1cbiAgICAgIHZhciBzID0gb1t0b1Byb3BlcnR5KGl0ZXJhdGVkU3RyaW5nKV07XG4gICAgICBpZiAocyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCh1bmRlZmluZWQsIHRydWUpO1xuICAgICAgfVxuICAgICAgdmFyIHBvc2l0aW9uID0gb1t0b1Byb3BlcnR5KHN0cmluZ0l0ZXJhdG9yTmV4dEluZGV4KV07XG4gICAgICB2YXIgbGVuID0gcy5sZW5ndGg7XG4gICAgICBpZiAocG9zaXRpb24gPj0gbGVuKSB7XG4gICAgICAgIG9bdG9Qcm9wZXJ0eShpdGVyYXRlZFN0cmluZyldID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHZhciBmaXJzdCA9IHMuY2hhckNvZGVBdChwb3NpdGlvbik7XG4gICAgICB2YXIgcmVzdWx0U3RyaW5nO1xuICAgICAgaWYgKGZpcnN0IDwgMHhEODAwIHx8IGZpcnN0ID4gMHhEQkZGIHx8IHBvc2l0aW9uICsgMSA9PT0gbGVuKSB7XG4gICAgICAgIHJlc3VsdFN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZmlyc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNlY29uZCA9IHMuY2hhckNvZGVBdChwb3NpdGlvbiArIDEpO1xuICAgICAgICBpZiAoc2Vjb25kIDwgMHhEQzAwIHx8IHNlY29uZCA+IDB4REZGRikge1xuICAgICAgICAgIHJlc3VsdFN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZmlyc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdFN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZmlyc3QpICsgU3RyaW5nLmZyb21DaGFyQ29kZShzZWNvbmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvW3RvUHJvcGVydHkoc3RyaW5nSXRlcmF0b3JOZXh0SW5kZXgpXSA9IHBvc2l0aW9uICsgcmVzdWx0U3RyaW5nLmxlbmd0aDtcbiAgICAgIHJldHVybiBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdChyZXN1bHRTdHJpbmcsIGZhbHNlKTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMiwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KSwgJF9fMiksIHt9KTtcbiAgZnVuY3Rpb24gY3JlYXRlU3RyaW5nSXRlcmF0b3Ioc3RyaW5nKSB7XG4gICAgdmFyIHMgPSBTdHJpbmcoc3RyaW5nKTtcbiAgICB2YXIgaXRlcmF0b3IgPSBPYmplY3QuY3JlYXRlKFN0cmluZ0l0ZXJhdG9yLnByb3RvdHlwZSk7XG4gICAgaXRlcmF0b3JbdG9Qcm9wZXJ0eShpdGVyYXRlZFN0cmluZyldID0gcztcbiAgICBpdGVyYXRvclt0b1Byb3BlcnR5KHN0cmluZ0l0ZXJhdG9yTmV4dEluZGV4KV0gPSAwO1xuICAgIHJldHVybiBpdGVyYXRvcjtcbiAgfVxuICByZXR1cm4ge2dldCBjcmVhdGVTdHJpbmdJdGVyYXRvcigpIHtcbiAgICAgIHJldHVybiBjcmVhdGVTdHJpbmdJdGVyYXRvcjtcbiAgICB9fTtcbn0pO1xuU3lzdGVtLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL1N0cmluZy5qc1wiO1xuICB2YXIgY3JlYXRlU3RyaW5nSXRlcmF0b3IgPSBTeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvU3RyaW5nSXRlcmF0b3IuanNcIikuY3JlYXRlU3RyaW5nSXRlcmF0b3I7XG4gIHZhciAkX18xID0gU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3V0aWxzLmpzXCIpLFxuICAgICAgbWF5YmVBZGRGdW5jdGlvbnMgPSAkX18xLm1heWJlQWRkRnVuY3Rpb25zLFxuICAgICAgbWF5YmVBZGRJdGVyYXRvciA9ICRfXzEubWF5YmVBZGRJdGVyYXRvcixcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18xLnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciAkdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICB2YXIgJGluZGV4T2YgPSBTdHJpbmcucHJvdG90eXBlLmluZGV4T2Y7XG4gIHZhciAkbGFzdEluZGV4T2YgPSBTdHJpbmcucHJvdG90eXBlLmxhc3RJbmRleE9mO1xuICBmdW5jdGlvbiBzdGFydHNXaXRoKHNlYXJjaCkge1xuICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgaWYgKHRoaXMgPT0gbnVsbCB8fCAkdG9TdHJpbmcuY2FsbChzZWFyY2gpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHNlYXJjaFN0cmluZyA9IFN0cmluZyhzZWFyY2gpO1xuICAgIHZhciBzZWFyY2hMZW5ndGggPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgIHZhciBwb3NpdGlvbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHZhciBwb3MgPSBwb3NpdGlvbiA/IE51bWJlcihwb3NpdGlvbikgOiAwO1xuICAgIGlmIChpc05hTihwb3MpKSB7XG4gICAgICBwb3MgPSAwO1xuICAgIH1cbiAgICB2YXIgc3RhcnQgPSBNYXRoLm1pbihNYXRoLm1heChwb3MsIDApLCBzdHJpbmdMZW5ndGgpO1xuICAgIHJldHVybiAkaW5kZXhPZi5jYWxsKHN0cmluZywgc2VhcmNoU3RyaW5nLCBwb3MpID09IHN0YXJ0O1xuICB9XG4gIGZ1bmN0aW9uIGVuZHNXaXRoKHNlYXJjaCkge1xuICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgaWYgKHRoaXMgPT0gbnVsbCB8fCAkdG9TdHJpbmcuY2FsbChzZWFyY2gpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHNlYXJjaFN0cmluZyA9IFN0cmluZyhzZWFyY2gpO1xuICAgIHZhciBzZWFyY2hMZW5ndGggPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgIHZhciBwb3MgPSBzdHJpbmdMZW5ndGg7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAocG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwb3MgPSBwb3NpdGlvbiA/IE51bWJlcihwb3NpdGlvbikgOiAwO1xuICAgICAgICBpZiAoaXNOYU4ocG9zKSkge1xuICAgICAgICAgIHBvcyA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGVuZCA9IE1hdGgubWluKE1hdGgubWF4KHBvcywgMCksIHN0cmluZ0xlbmd0aCk7XG4gICAgdmFyIHN0YXJ0ID0gZW5kIC0gc2VhcmNoTGVuZ3RoO1xuICAgIGlmIChzdGFydCA8IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuICRsYXN0SW5kZXhPZi5jYWxsKHN0cmluZywgc2VhcmNoU3RyaW5nLCBzdGFydCkgPT0gc3RhcnQ7XG4gIH1cbiAgZnVuY3Rpb24gaW5jbHVkZXMoc2VhcmNoKSB7XG4gICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgaWYgKHNlYXJjaCAmJiAkdG9TdHJpbmcuY2FsbChzZWFyY2gpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgdmFyIHNlYXJjaFN0cmluZyA9IFN0cmluZyhzZWFyY2gpO1xuICAgIHZhciBzZWFyY2hMZW5ndGggPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgIHZhciBwb3NpdGlvbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHZhciBwb3MgPSBwb3NpdGlvbiA/IE51bWJlcihwb3NpdGlvbikgOiAwO1xuICAgIGlmIChwb3MgIT0gcG9zKSB7XG4gICAgICBwb3MgPSAwO1xuICAgIH1cbiAgICB2YXIgc3RhcnQgPSBNYXRoLm1pbihNYXRoLm1heChwb3MsIDApLCBzdHJpbmdMZW5ndGgpO1xuICAgIGlmIChzZWFyY2hMZW5ndGggKyBzdGFydCA+IHN0cmluZ0xlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gJGluZGV4T2YuY2FsbChzdHJpbmcsIHNlYXJjaFN0cmluZywgcG9zKSAhPSAtMTtcbiAgfVxuICBmdW5jdGlvbiByZXBlYXQoY291bnQpIHtcbiAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIHN0cmluZyA9IFN0cmluZyh0aGlzKTtcbiAgICB2YXIgbiA9IGNvdW50ID8gTnVtYmVyKGNvdW50KSA6IDA7XG4gICAgaWYgKGlzTmFOKG4pKSB7XG4gICAgICBuID0gMDtcbiAgICB9XG4gICAgaWYgKG4gPCAwIHx8IG4gPT0gSW5maW5pdHkpIHtcbiAgICAgIHRocm93IFJhbmdlRXJyb3IoKTtcbiAgICB9XG4gICAgaWYgKG4gPT0gMCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgd2hpbGUgKG4tLSkge1xuICAgICAgcmVzdWx0ICs9IHN0cmluZztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBjb2RlUG9pbnRBdChwb3NpdGlvbikge1xuICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgIH1cbiAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgIHZhciBzaXplID0gc3RyaW5nLmxlbmd0aDtcbiAgICB2YXIgaW5kZXggPSBwb3NpdGlvbiA/IE51bWJlcihwb3NpdGlvbikgOiAwO1xuICAgIGlmIChpc05hTihpbmRleCkpIHtcbiAgICAgIGluZGV4ID0gMDtcbiAgICB9XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSBzaXplKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgZmlyc3QgPSBzdHJpbmcuY2hhckNvZGVBdChpbmRleCk7XG4gICAgdmFyIHNlY29uZDtcbiAgICBpZiAoZmlyc3QgPj0gMHhEODAwICYmIGZpcnN0IDw9IDB4REJGRiAmJiBzaXplID4gaW5kZXggKyAxKSB7XG4gICAgICBzZWNvbmQgPSBzdHJpbmcuY2hhckNvZGVBdChpbmRleCArIDEpO1xuICAgICAgaWYgKHNlY29uZCA+PSAweERDMDAgJiYgc2Vjb25kIDw9IDB4REZGRikge1xuICAgICAgICByZXR1cm4gKGZpcnN0IC0gMHhEODAwKSAqIDB4NDAwICsgc2Vjb25kIC0gMHhEQzAwICsgMHgxMDAwMDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpcnN0O1xuICB9XG4gIGZ1bmN0aW9uIHJhdyhjYWxsc2l0ZSkge1xuICAgIHZhciByYXcgPSBjYWxsc2l0ZS5yYXc7XG4gICAgdmFyIGxlbiA9IHJhdy5sZW5ndGggPj4+IDA7XG4gICAgaWYgKGxlbiA9PT0gMClcbiAgICAgIHJldHVybiAnJztcbiAgICB2YXIgcyA9ICcnO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcyArPSByYXdbaV07XG4gICAgICBpZiAoaSArIDEgPT09IGxlbilcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgICBzICs9IGFyZ3VtZW50c1srK2ldO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBmcm9tQ29kZVBvaW50KCkge1xuICAgIHZhciBjb2RlVW5pdHMgPSBbXTtcbiAgICB2YXIgZmxvb3IgPSBNYXRoLmZsb29yO1xuICAgIHZhciBoaWdoU3Vycm9nYXRlO1xuICAgIHZhciBsb3dTdXJyb2dhdGU7XG4gICAgdmFyIGluZGV4ID0gLTE7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBOdW1iZXIoYXJndW1lbnRzW2luZGV4XSk7XG4gICAgICBpZiAoIWlzRmluaXRlKGNvZGVQb2ludCkgfHwgY29kZVBvaW50IDwgMCB8fCBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCkge1xuICAgICAgICB0aHJvdyBSYW5nZUVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQ6ICcgKyBjb2RlUG9pbnQpO1xuICAgICAgfVxuICAgICAgaWYgKGNvZGVQb2ludCA8PSAweEZGRkYpIHtcbiAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwO1xuICAgICAgICBoaWdoU3Vycm9nYXRlID0gKGNvZGVQb2ludCA+PiAxMCkgKyAweEQ4MDA7XG4gICAgICAgIGxvd1N1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgJSAweDQwMCkgKyAweERDMDA7XG4gICAgICAgIGNvZGVVbml0cy5wdXNoKGhpZ2hTdXJyb2dhdGUsIGxvd1N1cnJvZ2F0ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNvZGVVbml0cyk7XG4gIH1cbiAgZnVuY3Rpb24gc3RyaW5nUHJvdG90eXBlSXRlcmF0b3IoKSB7XG4gICAgdmFyIG8gPSAkdHJhY2V1clJ1bnRpbWUuY2hlY2tPYmplY3RDb2VyY2libGUodGhpcyk7XG4gICAgdmFyIHMgPSBTdHJpbmcobyk7XG4gICAgcmV0dXJuIGNyZWF0ZVN0cmluZ0l0ZXJhdG9yKHMpO1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsU3RyaW5nKGdsb2JhbCkge1xuICAgIHZhciBTdHJpbmcgPSBnbG9iYWwuU3RyaW5nO1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKFN0cmluZy5wcm90b3R5cGUsIFsnY29kZVBvaW50QXQnLCBjb2RlUG9pbnRBdCwgJ2VuZHNXaXRoJywgZW5kc1dpdGgsICdpbmNsdWRlcycsIGluY2x1ZGVzLCAncmVwZWF0JywgcmVwZWF0LCAnc3RhcnRzV2l0aCcsIHN0YXJ0c1dpdGhdKTtcbiAgICBtYXliZUFkZEZ1bmN0aW9ucyhTdHJpbmcsIFsnZnJvbUNvZGVQb2ludCcsIGZyb21Db2RlUG9pbnQsICdyYXcnLCByYXddKTtcbiAgICBtYXliZUFkZEl0ZXJhdG9yKFN0cmluZy5wcm90b3R5cGUsIHN0cmluZ1Byb3RvdHlwZUl0ZXJhdG9yLCBTeW1ib2wpO1xuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxTdHJpbmcpO1xuICByZXR1cm4ge1xuICAgIGdldCBzdGFydHNXaXRoKCkge1xuICAgICAgcmV0dXJuIHN0YXJ0c1dpdGg7XG4gICAgfSxcbiAgICBnZXQgZW5kc1dpdGgoKSB7XG4gICAgICByZXR1cm4gZW5kc1dpdGg7XG4gICAgfSxcbiAgICBnZXQgaW5jbHVkZXMoKSB7XG4gICAgICByZXR1cm4gaW5jbHVkZXM7XG4gICAgfSxcbiAgICBnZXQgcmVwZWF0KCkge1xuICAgICAgcmV0dXJuIHJlcGVhdDtcbiAgICB9LFxuICAgIGdldCBjb2RlUG9pbnRBdCgpIHtcbiAgICAgIHJldHVybiBjb2RlUG9pbnRBdDtcbiAgICB9LFxuICAgIGdldCByYXcoKSB7XG4gICAgICByZXR1cm4gcmF3O1xuICAgIH0sXG4gICAgZ2V0IGZyb21Db2RlUG9pbnQoKSB7XG4gICAgICByZXR1cm4gZnJvbUNvZGVQb2ludDtcbiAgICB9LFxuICAgIGdldCBzdHJpbmdQcm90b3R5cGVJdGVyYXRvcigpIHtcbiAgICAgIHJldHVybiBzdHJpbmdQcm90b3R5cGVJdGVyYXRvcjtcbiAgICB9LFxuICAgIGdldCBwb2x5ZmlsbFN0cmluZygpIHtcbiAgICAgIHJldHVybiBwb2x5ZmlsbFN0cmluZztcbiAgICB9XG4gIH07XG59KTtcblN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9TdHJpbmcuanNcIiArICcnKTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5SXRlcmF0b3IuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyICRfXzI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5SXRlcmF0b3IuanNcIjtcbiAgdmFyICRfXzAgPSBTeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvdXRpbHMuanNcIiksXG4gICAgICB0b09iamVjdCA9ICRfXzAudG9PYmplY3QsXG4gICAgICB0b1VpbnQzMiA9ICRfXzAudG9VaW50MzIsXG4gICAgICBjcmVhdGVJdGVyYXRvclJlc3VsdE9iamVjdCA9ICRfXzAuY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3Q7XG4gIHZhciBBUlJBWV9JVEVSQVRPUl9LSU5EX0tFWVMgPSAxO1xuICB2YXIgQVJSQVlfSVRFUkFUT1JfS0lORF9WQUxVRVMgPSAyO1xuICB2YXIgQVJSQVlfSVRFUkFUT1JfS0lORF9FTlRSSUVTID0gMztcbiAgdmFyIEFycmF5SXRlcmF0b3IgPSBmdW5jdGlvbiBBcnJheUl0ZXJhdG9yKCkge307XG4gICgkdHJhY2V1clJ1bnRpbWUuY3JlYXRlQ2xhc3MpKEFycmF5SXRlcmF0b3IsICgkX18yID0ge30sIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgkX18yLCBcIm5leHRcIiwge1xuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgdmFyIGFycmF5ID0gaXRlcmF0b3IuaXRlcmF0b3JPYmplY3RfO1xuICAgICAgaWYgKCFhcnJheSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QgaXMgbm90IGFuIEFycmF5SXRlcmF0b3InKTtcbiAgICAgIH1cbiAgICAgIHZhciBpbmRleCA9IGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfO1xuICAgICAgdmFyIGl0ZW1LaW5kID0gaXRlcmF0b3IuYXJyYXlJdGVyYXRpb25LaW5kXztcbiAgICAgIHZhciBsZW5ndGggPSB0b1VpbnQzMihhcnJheS5sZW5ndGgpO1xuICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICBpdGVyYXRvci5hcnJheUl0ZXJhdG9yTmV4dEluZGV4XyA9IEluZmluaXR5O1xuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfID0gaW5kZXggKyAxO1xuICAgICAgaWYgKGl0ZW1LaW5kID09IEFSUkFZX0lURVJBVE9SX0tJTkRfVkFMVUVTKVxuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoYXJyYXlbaW5kZXhdLCBmYWxzZSk7XG4gICAgICBpZiAoaXRlbUtpbmQgPT0gQVJSQVlfSVRFUkFUT1JfS0lORF9FTlRSSUVTKVxuICAgICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoW2luZGV4LCBhcnJheVtpbmRleF1dLCBmYWxzZSk7XG4gICAgICByZXR1cm4gY3JlYXRlSXRlcmF0b3JSZXN1bHRPYmplY3QoaW5kZXgsIGZhbHNlKTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoJF9fMiwgU3ltYm9sLml0ZXJhdG9yLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KSwgJF9fMiksIHt9KTtcbiAgZnVuY3Rpb24gY3JlYXRlQXJyYXlJdGVyYXRvcihhcnJheSwga2luZCkge1xuICAgIHZhciBvYmplY3QgPSB0b09iamVjdChhcnJheSk7XG4gICAgdmFyIGl0ZXJhdG9yID0gbmV3IEFycmF5SXRlcmF0b3I7XG4gICAgaXRlcmF0b3IuaXRlcmF0b3JPYmplY3RfID0gb2JqZWN0O1xuICAgIGl0ZXJhdG9yLmFycmF5SXRlcmF0b3JOZXh0SW5kZXhfID0gMDtcbiAgICBpdGVyYXRvci5hcnJheUl0ZXJhdGlvbktpbmRfID0ga2luZDtcbiAgICByZXR1cm4gaXRlcmF0b3I7XG4gIH1cbiAgZnVuY3Rpb24gZW50cmllcygpIHtcbiAgICByZXR1cm4gY3JlYXRlQXJyYXlJdGVyYXRvcih0aGlzLCBBUlJBWV9JVEVSQVRPUl9LSU5EX0VOVFJJRVMpO1xuICB9XG4gIGZ1bmN0aW9uIGtleXMoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUFycmF5SXRlcmF0b3IodGhpcywgQVJSQVlfSVRFUkFUT1JfS0lORF9LRVlTKTtcbiAgfVxuICBmdW5jdGlvbiB2YWx1ZXMoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUFycmF5SXRlcmF0b3IodGhpcywgQVJSQVlfSVRFUkFUT1JfS0lORF9WQUxVRVMpO1xuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0IGVudHJpZXMoKSB7XG4gICAgICByZXR1cm4gZW50cmllcztcbiAgICB9LFxuICAgIGdldCBrZXlzKCkge1xuICAgICAgcmV0dXJuIGtleXM7XG4gICAgfSxcbiAgICBnZXQgdmFsdWVzKCkge1xuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG4gIH07XG59KTtcblN5c3RlbS5yZWdpc3Rlck1vZHVsZShcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5LmpzXCI7XG4gIHZhciAkX18wID0gU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL0FycmF5SXRlcmF0b3IuanNcIiksXG4gICAgICBlbnRyaWVzID0gJF9fMC5lbnRyaWVzLFxuICAgICAga2V5cyA9ICRfXzAua2V5cyxcbiAgICAgIHZhbHVlcyA9ICRfXzAudmFsdWVzO1xuICB2YXIgJF9fMSA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiKSxcbiAgICAgIGNoZWNrSXRlcmFibGUgPSAkX18xLmNoZWNrSXRlcmFibGUsXG4gICAgICBpc0NhbGxhYmxlID0gJF9fMS5pc0NhbGxhYmxlLFxuICAgICAgaXNDb25zdHJ1Y3RvciA9ICRfXzEuaXNDb25zdHJ1Y3RvcixcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMS5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIG1heWJlQWRkSXRlcmF0b3IgPSAkX18xLm1heWJlQWRkSXRlcmF0b3IsXG4gICAgICByZWdpc3RlclBvbHlmaWxsID0gJF9fMS5yZWdpc3RlclBvbHlmaWxsLFxuICAgICAgdG9JbnRlZ2VyID0gJF9fMS50b0ludGVnZXIsXG4gICAgICB0b0xlbmd0aCA9ICRfXzEudG9MZW5ndGgsXG4gICAgICB0b09iamVjdCA9ICRfXzEudG9PYmplY3Q7XG4gIGZ1bmN0aW9uIGZyb20oYXJyTGlrZSkge1xuICAgIHZhciBtYXBGbiA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1syXTtcbiAgICB2YXIgQyA9IHRoaXM7XG4gICAgdmFyIGl0ZW1zID0gdG9PYmplY3QoYXJyTGlrZSk7XG4gICAgdmFyIG1hcHBpbmcgPSBtYXBGbiAhPT0gdW5kZWZpbmVkO1xuICAgIHZhciBrID0gMDtcbiAgICB2YXIgYXJyLFxuICAgICAgICBsZW47XG4gICAgaWYgKG1hcHBpbmcgJiYgIWlzQ2FsbGFibGUobWFwRm4pKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgaWYgKGNoZWNrSXRlcmFibGUoaXRlbXMpKSB7XG4gICAgICBhcnIgPSBpc0NvbnN0cnVjdG9yKEMpID8gbmV3IEMoKSA6IFtdO1xuICAgICAgZm9yICh2YXIgJF9fMiA9IGl0ZW1zWyR0cmFjZXVyUnVudGltZS50b1Byb3BlcnR5KFN5bWJvbC5pdGVyYXRvcildKCksXG4gICAgICAgICAgJF9fMzsgISgkX18zID0gJF9fMi5uZXh0KCkpLmRvbmU7ICkge1xuICAgICAgICB2YXIgaXRlbSA9ICRfXzMudmFsdWU7XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAobWFwcGluZykge1xuICAgICAgICAgICAgYXJyW2tdID0gbWFwRm4uY2FsbCh0aGlzQXJnLCBpdGVtLCBrKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyW2tdID0gaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaysrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhcnIubGVuZ3RoID0gaztcbiAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuICAgIGxlbiA9IHRvTGVuZ3RoKGl0ZW1zLmxlbmd0aCk7XG4gICAgYXJyID0gaXNDb25zdHJ1Y3RvcihDKSA/IG5ldyBDKGxlbikgOiBuZXcgQXJyYXkobGVuKTtcbiAgICBmb3IgKDsgayA8IGxlbjsgaysrKSB7XG4gICAgICBpZiAobWFwcGluZykge1xuICAgICAgICBhcnJba10gPSB0eXBlb2YgdGhpc0FyZyA9PT0gJ3VuZGVmaW5lZCcgPyBtYXBGbihpdGVtc1trXSwgaykgOiBtYXBGbi5jYWxsKHRoaXNBcmcsIGl0ZW1zW2tdLCBrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycltrXSA9IGl0ZW1zW2tdO1xuICAgICAgfVxuICAgIH1cbiAgICBhcnIubGVuZ3RoID0gbGVuO1xuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgZnVuY3Rpb24gb2YoKSB7XG4gICAgZm9yICh2YXIgaXRlbXMgPSBbXSxcbiAgICAgICAgJF9fNCA9IDA7ICRfXzQgPCBhcmd1bWVudHMubGVuZ3RoOyAkX180KyspXG4gICAgICBpdGVtc1skX180XSA9IGFyZ3VtZW50c1skX180XTtcbiAgICB2YXIgQyA9IHRoaXM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgYXJyID0gaXNDb25zdHJ1Y3RvcihDKSA/IG5ldyBDKGxlbikgOiBuZXcgQXJyYXkobGVuKTtcbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGxlbjsgaysrKSB7XG4gICAgICBhcnJba10gPSBpdGVtc1trXTtcbiAgICB9XG4gICAgYXJyLmxlbmd0aCA9IGxlbjtcbiAgICByZXR1cm4gYXJyO1xuICB9XG4gIGZ1bmN0aW9uIGZpbGwodmFsdWUpIHtcbiAgICB2YXIgc3RhcnQgPSBhcmd1bWVudHNbMV0gIT09ICh2b2lkIDApID8gYXJndW1lbnRzWzFdIDogMDtcbiAgICB2YXIgZW5kID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciBvYmplY3QgPSB0b09iamVjdCh0aGlzKTtcbiAgICB2YXIgbGVuID0gdG9MZW5ndGgob2JqZWN0Lmxlbmd0aCk7XG4gICAgdmFyIGZpbGxTdGFydCA9IHRvSW50ZWdlcihzdGFydCk7XG4gICAgdmFyIGZpbGxFbmQgPSBlbmQgIT09IHVuZGVmaW5lZCA/IHRvSW50ZWdlcihlbmQpIDogbGVuO1xuICAgIGZpbGxTdGFydCA9IGZpbGxTdGFydCA8IDAgPyBNYXRoLm1heChsZW4gKyBmaWxsU3RhcnQsIDApIDogTWF0aC5taW4oZmlsbFN0YXJ0LCBsZW4pO1xuICAgIGZpbGxFbmQgPSBmaWxsRW5kIDwgMCA/IE1hdGgubWF4KGxlbiArIGZpbGxFbmQsIDApIDogTWF0aC5taW4oZmlsbEVuZCwgbGVuKTtcbiAgICB3aGlsZSAoZmlsbFN0YXJ0IDwgZmlsbEVuZCkge1xuICAgICAgb2JqZWN0W2ZpbGxTdGFydF0gPSB2YWx1ZTtcbiAgICAgIGZpbGxTdGFydCsrO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIGZpbmQocHJlZGljYXRlKSB7XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgcmV0dXJuIGZpbmRIZWxwZXIodGhpcywgcHJlZGljYXRlLCB0aGlzQXJnKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kSW5kZXgocHJlZGljYXRlKSB7XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgcmV0dXJuIGZpbmRIZWxwZXIodGhpcywgcHJlZGljYXRlLCB0aGlzQXJnLCB0cnVlKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kSGVscGVyKHNlbGYsIHByZWRpY2F0ZSkge1xuICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciByZXR1cm5JbmRleCA9IGFyZ3VtZW50c1szXSAhPT0gKHZvaWQgMCkgPyBhcmd1bWVudHNbM10gOiBmYWxzZTtcbiAgICB2YXIgb2JqZWN0ID0gdG9PYmplY3Qoc2VsZik7XG4gICAgdmFyIGxlbiA9IHRvTGVuZ3RoKG9iamVjdC5sZW5ndGgpO1xuICAgIGlmICghaXNDYWxsYWJsZShwcmVkaWNhdGUpKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gb2JqZWN0W2ldO1xuICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBvYmplY3QpKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5JbmRleCA/IGkgOiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldHVybkluZGV4ID8gLTEgOiB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gcG9seWZpbGxBcnJheShnbG9iYWwpIHtcbiAgICB2YXIgJF9fNSA9IGdsb2JhbCxcbiAgICAgICAgQXJyYXkgPSAkX181LkFycmF5LFxuICAgICAgICBPYmplY3QgPSAkX181Lk9iamVjdCxcbiAgICAgICAgU3ltYm9sID0gJF9fNS5TeW1ib2w7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoQXJyYXkucHJvdG90eXBlLCBbJ2VudHJpZXMnLCBlbnRyaWVzLCAna2V5cycsIGtleXMsICd2YWx1ZXMnLCB2YWx1ZXMsICdmaWxsJywgZmlsbCwgJ2ZpbmQnLCBmaW5kLCAnZmluZEluZGV4JywgZmluZEluZGV4XSk7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoQXJyYXksIFsnZnJvbScsIGZyb20sICdvZicsIG9mXSk7XG4gICAgbWF5YmVBZGRJdGVyYXRvcihBcnJheS5wcm90b3R5cGUsIHZhbHVlcywgU3ltYm9sKTtcbiAgICBtYXliZUFkZEl0ZXJhdG9yKE9iamVjdC5nZXRQcm90b3R5cGVPZihbXS52YWx1ZXMoKSksIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgU3ltYm9sKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsQXJyYXkpO1xuICByZXR1cm4ge1xuICAgIGdldCBmcm9tKCkge1xuICAgICAgcmV0dXJuIGZyb207XG4gICAgfSxcbiAgICBnZXQgb2YoKSB7XG4gICAgICByZXR1cm4gb2Y7XG4gICAgfSxcbiAgICBnZXQgZmlsbCgpIHtcbiAgICAgIHJldHVybiBmaWxsO1xuICAgIH0sXG4gICAgZ2V0IGZpbmQoKSB7XG4gICAgICByZXR1cm4gZmluZDtcbiAgICB9LFxuICAgIGdldCBmaW5kSW5kZXgoKSB7XG4gICAgICByZXR1cm4gZmluZEluZGV4O1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsQXJyYXkoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxBcnJheTtcbiAgICB9XG4gIH07XG59KTtcblN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9BcnJheS5qc1wiICsgJycpO1xuU3lzdGVtLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvT2JqZWN0LmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiO1xuICB2YXIgJF9fMCA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiKSxcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMC5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18wLnJlZ2lzdGVyUG9seWZpbGw7XG4gIHZhciAkX18xID0gJHRyYWNldXJSdW50aW1lLFxuICAgICAgZGVmaW5lUHJvcGVydHkgPSAkX18xLmRlZmluZVByb3BlcnR5LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gJF9fMS5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzID0gJF9fMS5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgICAgaXNQcml2YXRlTmFtZSA9ICRfXzEuaXNQcml2YXRlTmFtZSxcbiAgICAgIGtleXMgPSAkX18xLmtleXM7XG4gIGZ1bmN0aW9uIGlzKGxlZnQsIHJpZ2h0KSB7XG4gICAgaWYgKGxlZnQgPT09IHJpZ2h0KVxuICAgICAgcmV0dXJuIGxlZnQgIT09IDAgfHwgMSAvIGxlZnQgPT09IDEgLyByaWdodDtcbiAgICByZXR1cm4gbGVmdCAhPT0gbGVmdCAmJiByaWdodCAhPT0gcmlnaHQ7XG4gIH1cbiAgZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgICAgdmFyIHByb3BzID0gc291cmNlID09IG51bGwgPyBbXSA6IGtleXMoc291cmNlKTtcbiAgICAgIHZhciBwLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICB2YXIgbmFtZSA9IHByb3BzW3BdO1xuICAgICAgICBpZiAoaXNQcml2YXRlTmFtZShuYW1lKSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdGFyZ2V0W25hbWVdID0gc291cmNlW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIGZ1bmN0aW9uIG1peGluKHRhcmdldCwgc291cmNlKSB7XG4gICAgdmFyIHByb3BzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgIHZhciBwLFxuICAgICAgICBkZXNjcmlwdG9yLFxuICAgICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgZm9yIChwID0gMDsgcCA8IGxlbmd0aDsgcCsrKSB7XG4gICAgICB2YXIgbmFtZSA9IHByb3BzW3BdO1xuICAgICAgaWYgKGlzUHJpdmF0ZU5hbWUobmFtZSkpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgZGVzY3JpcHRvciA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIHByb3BzW3BdKTtcbiAgICAgIGRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcHNbcF0sIGRlc2NyaXB0b3IpO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIGZ1bmN0aW9uIHBvbHlmaWxsT2JqZWN0KGdsb2JhbCkge1xuICAgIHZhciBPYmplY3QgPSBnbG9iYWwuT2JqZWN0O1xuICAgIG1heWJlQWRkRnVuY3Rpb25zKE9iamVjdCwgWydhc3NpZ24nLCBhc3NpZ24sICdpcycsIGlzLCAnbWl4aW4nLCBtaXhpbl0pO1xuICB9XG4gIHJlZ2lzdGVyUG9seWZpbGwocG9seWZpbGxPYmplY3QpO1xuICByZXR1cm4ge1xuICAgIGdldCBpcygpIHtcbiAgICAgIHJldHVybiBpcztcbiAgICB9LFxuICAgIGdldCBhc3NpZ24oKSB7XG4gICAgICByZXR1cm4gYXNzaWduO1xuICAgIH0sXG4gICAgZ2V0IG1peGluKCkge1xuICAgICAgcmV0dXJuIG1peGluO1xuICAgIH0sXG4gICAgZ2V0IHBvbHlmaWxsT2JqZWN0KCkge1xuICAgICAgcmV0dXJuIHBvbHlmaWxsT2JqZWN0O1xuICAgIH1cbiAgfTtcbn0pO1xuU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL09iamVjdC5qc1wiICsgJycpO1xuU3lzdGVtLnJlZ2lzdGVyTW9kdWxlKFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCIsIFtdLCBmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX21vZHVsZU5hbWUgPSBcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL051bWJlci5qc1wiO1xuICB2YXIgJF9fMCA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiKSxcbiAgICAgIGlzTnVtYmVyID0gJF9fMC5pc051bWJlcixcbiAgICAgIG1heWJlQWRkQ29uc3RzID0gJF9fMC5tYXliZUFkZENvbnN0cyxcbiAgICAgIG1heWJlQWRkRnVuY3Rpb25zID0gJF9fMC5tYXliZUFkZEZ1bmN0aW9ucyxcbiAgICAgIHJlZ2lzdGVyUG9seWZpbGwgPSAkX18wLnJlZ2lzdGVyUG9seWZpbGwsXG4gICAgICB0b0ludGVnZXIgPSAkX18wLnRvSW50ZWdlcjtcbiAgdmFyICRhYnMgPSBNYXRoLmFicztcbiAgdmFyICRpc0Zpbml0ZSA9IGlzRmluaXRlO1xuICB2YXIgJGlzTmFOID0gaXNOYU47XG4gIHZhciBNQVhfU0FGRV9JTlRFR0VSID0gTWF0aC5wb3coMiwgNTMpIC0gMTtcbiAgdmFyIE1JTl9TQUZFX0lOVEVHRVIgPSAtTWF0aC5wb3coMiwgNTMpICsgMTtcbiAgdmFyIEVQU0lMT04gPSBNYXRoLnBvdygyLCAtNTIpO1xuICBmdW5jdGlvbiBOdW1iZXJJc0Zpbml0ZShudW1iZXIpIHtcbiAgICByZXR1cm4gaXNOdW1iZXIobnVtYmVyKSAmJiAkaXNGaW5pdGUobnVtYmVyKTtcbiAgfVxuICA7XG4gIGZ1bmN0aW9uIGlzSW50ZWdlcihudW1iZXIpIHtcbiAgICByZXR1cm4gTnVtYmVySXNGaW5pdGUobnVtYmVyKSAmJiB0b0ludGVnZXIobnVtYmVyKSA9PT0gbnVtYmVyO1xuICB9XG4gIGZ1bmN0aW9uIE51bWJlcklzTmFOKG51bWJlcikge1xuICAgIHJldHVybiBpc051bWJlcihudW1iZXIpICYmICRpc05hTihudW1iZXIpO1xuICB9XG4gIDtcbiAgZnVuY3Rpb24gaXNTYWZlSW50ZWdlcihudW1iZXIpIHtcbiAgICBpZiAoTnVtYmVySXNGaW5pdGUobnVtYmVyKSkge1xuICAgICAgdmFyIGludGVncmFsID0gdG9JbnRlZ2VyKG51bWJlcik7XG4gICAgICBpZiAoaW50ZWdyYWwgPT09IG51bWJlcilcbiAgICAgICAgcmV0dXJuICRhYnMoaW50ZWdyYWwpIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBwb2x5ZmlsbE51bWJlcihnbG9iYWwpIHtcbiAgICB2YXIgTnVtYmVyID0gZ2xvYmFsLk51bWJlcjtcbiAgICBtYXliZUFkZENvbnN0cyhOdW1iZXIsIFsnTUFYX1NBRkVfSU5URUdFUicsIE1BWF9TQUZFX0lOVEVHRVIsICdNSU5fU0FGRV9JTlRFR0VSJywgTUlOX1NBRkVfSU5URUdFUiwgJ0VQU0lMT04nLCBFUFNJTE9OXSk7XG4gICAgbWF5YmVBZGRGdW5jdGlvbnMoTnVtYmVyLCBbJ2lzRmluaXRlJywgTnVtYmVySXNGaW5pdGUsICdpc0ludGVnZXInLCBpc0ludGVnZXIsICdpc05hTicsIE51bWJlcklzTmFOLCAnaXNTYWZlSW50ZWdlcicsIGlzU2FmZUludGVnZXJdKTtcbiAgfVxuICByZWdpc3RlclBvbHlmaWxsKHBvbHlmaWxsTnVtYmVyKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgTUFYX1NBRkVfSU5URUdFUigpIHtcbiAgICAgIHJldHVybiBNQVhfU0FGRV9JTlRFR0VSO1xuICAgIH0sXG4gICAgZ2V0IE1JTl9TQUZFX0lOVEVHRVIoKSB7XG4gICAgICByZXR1cm4gTUlOX1NBRkVfSU5URUdFUjtcbiAgICB9LFxuICAgIGdldCBFUFNJTE9OKCkge1xuICAgICAgcmV0dXJuIEVQU0lMT047XG4gICAgfSxcbiAgICBnZXQgaXNGaW5pdGUoKSB7XG4gICAgICByZXR1cm4gTnVtYmVySXNGaW5pdGU7XG4gICAgfSxcbiAgICBnZXQgaXNJbnRlZ2VyKCkge1xuICAgICAgcmV0dXJuIGlzSW50ZWdlcjtcbiAgICB9LFxuICAgIGdldCBpc05hTigpIHtcbiAgICAgIHJldHVybiBOdW1iZXJJc05hTjtcbiAgICB9LFxuICAgIGdldCBpc1NhZmVJbnRlZ2VyKCkge1xuICAgICAgcmV0dXJuIGlzU2FmZUludGVnZXI7XG4gICAgfSxcbiAgICBnZXQgcG9seWZpbGxOdW1iZXIoKSB7XG4gICAgICByZXR1cm4gcG9seWZpbGxOdW1iZXI7XG4gICAgfVxuICB9O1xufSk7XG5TeXN0ZW0uZ2V0KFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvTnVtYmVyLmpzXCIgKyAnJyk7XG5TeXN0ZW0ucmVnaXN0ZXJNb2R1bGUoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy9wb2x5ZmlsbHMuanNcIiwgW10sIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fbW9kdWxlTmFtZSA9IFwidHJhY2V1ci1ydW50aW1lQDAuMC43OS9zcmMvcnVudGltZS9wb2x5ZmlsbHMvcG9seWZpbGxzLmpzXCI7XG4gIHZhciBwb2x5ZmlsbEFsbCA9IFN5c3RlbS5nZXQoXCJ0cmFjZXVyLXJ1bnRpbWVAMC4wLjc5L3NyYy9ydW50aW1lL3BvbHlmaWxscy91dGlscy5qc1wiKS5wb2x5ZmlsbEFsbDtcbiAgcG9seWZpbGxBbGwoUmVmbGVjdC5nbG9iYWwpO1xuICB2YXIgc2V0dXBHbG9iYWxzID0gJHRyYWNldXJSdW50aW1lLnNldHVwR2xvYmFscztcbiAgJHRyYWNldXJSdW50aW1lLnNldHVwR2xvYmFscyA9IGZ1bmN0aW9uKGdsb2JhbCkge1xuICAgIHNldHVwR2xvYmFscyhnbG9iYWwpO1xuICAgIHBvbHlmaWxsQWxsKGdsb2JhbCk7XG4gIH07XG4gIHJldHVybiB7fTtcbn0pO1xuU3lzdGVtLmdldChcInRyYWNldXItcnVudGltZUAwLjAuNzkvc3JjL3J1bnRpbWUvcG9seWZpbGxzL3BvbHlmaWxscy5qc1wiICsgJycpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRfX3BsYWNlaG9sZGVyX18wXG4gICAgICAgICAgfS5jYWxsKCRfX3BsYWNlaG9sZGVyX18xKTsiLCIvLyBSZXR1cm5zIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB3cmFwcGVkIGNhbGxiYWNrXG4vLyBUaGUgd3JhcHBlciBmdW5jdGlvbiBzaG91bGQgZG8gc29tZSBzdHVmZiwgYW5kIHJldHVybiBhXG4vLyBwcmVzdW1hYmx5IGRpZmZlcmVudCBjYWxsYmFjayBmdW5jdGlvbi5cbi8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IG93biBwcm9wZXJ0aWVzIGFyZSByZXRhaW5lZCwgc28gdGhhdFxuLy8gZGVjb3JhdGlvbnMgYW5kIHN1Y2ggYXJlIG5vdCBsb3N0IGFsb25nIHRoZSB3YXkuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBweVxuZnVuY3Rpb24gd3JhcHB5IChmbiwgY2IpIHtcbiAgaWYgKGZuICYmIGNiKSByZXR1cm4gd3JhcHB5KGZuKShjYilcblxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25lZWQgd3JhcHBlciBmdW5jdGlvbicpXG5cbiAgT2JqZWN0LmtleXMoZm4pLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICB3cmFwcGVyW2tdID0gZm5ba11cbiAgfSlcblxuICByZXR1cm4gd3JhcHBlclxuXG4gIGZ1bmN0aW9uIHdyYXBwZXIoKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV1cbiAgICB9XG4gICAgdmFyIHJldCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgdmFyIGNiID0gYXJnc1thcmdzLmxlbmd0aC0xXVxuICAgIGlmICh0eXBlb2YgcmV0ID09PSAnZnVuY3Rpb24nICYmIHJldCAhPT0gY2IpIHtcbiAgICAgIE9iamVjdC5rZXlzKGNiKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldFtrXSA9IGNiW2tdXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cbn1cbiIsInZhciB3cmFwcHkgPSByZXF1aXJlKCd3cmFwcHknKVxubW9kdWxlLmV4cG9ydHMgPSB3cmFwcHkob25jZSlcblxub25jZS5wcm90byA9IG9uY2UoZnVuY3Rpb24gKCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRnVuY3Rpb24ucHJvdG90eXBlLCAnb25jZScsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG9uY2UodGhpcylcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxufSlcblxuZnVuY3Rpb24gb25jZSAoZm4pIHtcbiAgdmFyIGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGYuY2FsbGVkKSByZXR1cm4gZi52YWx1ZVxuICAgIGYuY2FsbGVkID0gdHJ1ZVxuICAgIHJldHVybiBmLnZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4gIGYuY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZcbn1cbiIsImV4cG9ydHMuQXNzZXRzTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL2Fzc2V0c21hbmFnZXInKTtcbiIsInZhciBjb252ZXJ0ID0gcmVxdWlyZSgnY29sb3ItY29udmVydCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFJlc291cmNlTG9hZGVyID0gcmVxdWlyZSgnLi9yZXNvdXJjZWxvYWRlcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzZXRzTWFuYWdlcjtcblxuXG5mdW5jdGlvbiBBc3NldHNNYW5hZ2VyKG9wdF9vcHRpb25zKSB7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHZhciBvcHRpb25zID0ge1xuICAgIHdvcmtlclBhdGg6IF9fZGlybmFtZSArICcvLi4vd29ya2VyLmpzJyxcbiAgICB3b3JrZXJzOiAxXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIC8vIENyZWF0ZSB0aGUgbnVtYmVyIG9mIHdvcmtlcnMgc3BlY2lmaWVkIGluIG9wdGlvbnMuXG4gIHZhciB3b3JrZXJzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy53b3JrZXJzOyBpKyspIHtcbiAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihvcHRpb25zLndvcmtlclBhdGgpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb3h5IHdoaWNoIHdpbGwgaGFuZGxlIGRlbGVnYXRpb24gdG8gdGhlIHdvcmtlcnMuXG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2Vycyk7XG5cbiAgdGhpcy5fZW1pdHRpbmcgPSB7fTtcbiAgdGhpcy5fYmxvYkNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgLy8gVE9ETzogTWFrZSBhIG1vcmUgZ2VuZXJpYyBjYWNoZT9cbiAgdGhpcy5fZnJhbWVzQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB0aGlzLl9pbWFnZUNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbnV0aWwuaW5oZXJpdHMoQXNzZXRzTWFuYWdlciwgRXZlbnRFbWl0dGVyKTtcblxuLyoqXG4gKiBJbmRleGVzIGEgZGlyZWN0b3J5LiBBbGwgZmlsZXMgaW4gdGhlIGRpcmVjdG9yeSB3aWxsIGJlIHJlYWNoYWJsZSB0aHJvdWdoXG4gKiB0aGUgYXNzZXRzIGRhdGFiYXNlIGFmdGVyIHRoaXMgY29tcGxldGVzLiBBbGwgLnBhay8ubW9kcGFrIGZpbGVzIHdpbGwgYWxzb1xuICogYmUgbG9hZGVkIGludG8gdGhlIGluZGV4LlxuICpcbiAqIFRoZSB2aXJ0dWFsIHBhdGggYXJndW1lbnQgaXMgYSBwcmVmaXggZm9yIHRoZSBlbnRyaWVzIGluIHRoZSBkaXJlY3RvcnkuXG4gKi9cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmFkZERpcmVjdG9yeSA9IGZ1bmN0aW9uIChwYXRoLCBkaXJFbnRyeSwgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBwZW5kaW5nID0gMTtcbiAgdmFyIGRlY3JlbWVudFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcGVuZGluZy0tO1xuICAgIGlmICghcGVuZGluZykge1xuICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgfVxuICB9O1xuXG4gIHZhciByZWFkZXIgPSBkaXJFbnRyeS5jcmVhdGVSZWFkZXIoKTtcbiAgdmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVhZGVyLnJlYWRFbnRyaWVzKGZ1bmN0aW9uIChlbnRyaWVzKSB7XG4gICAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZW50cmllcy5mb3JFYWNoKGZ1bmN0aW9uIChlbnRyeSkge1xuICAgICAgICBpZiAoZW50cnkubmFtZVswXSA9PSAnLicpIHJldHVybjtcblxuICAgICAgICB2YXIgZW50cnlQYXRoID0gcGF0aCArICcvJyArIGVudHJ5Lm5hbWU7XG5cbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgcGVuZGluZysrO1xuICAgICAgICAgIHNlbGYuYWRkRGlyZWN0b3J5KGVudHJ5UGF0aCwgZW50cnksIGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICBzZWxmLmFkZEZpbGUoZW50cnlQYXRoLCBmaWxlLCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgICB9LCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG4gIH07XG4gIG5leHQoKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmFkZEZpbGUgPSBmdW5jdGlvbiAocGF0aCwgZmlsZSwgY2FsbGJhY2spIHtcbiAgLy8gVE9ETzogV2hhdCB0byBkbyBhYm91dCB0aGUgY2FsbGJhY2sgYmVpbmcgY2FsbGVkIG9uY2UgZm9yIGVhY2ggd29ya2VyP1xuICB0aGlzLmFwaS5hZGRGaWxlLmJyb2FkY2FzdChwYXRoLCBmaWxlLCBjYWxsYmFjayk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGRSb290ID0gZnVuY3Rpb24gKGRpckVudHJ5LCBjYWxsYmFjaykge1xuICB0aGlzLmFkZERpcmVjdG9yeSgnJywgZGlyRW50cnksIGNhbGxiYWNrKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmVtaXRPbmNlUGVyVGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAodGhpcy5fZW1pdHRpbmdbZXZlbnRdKSByZXR1cm47XG4gIHRoaXMuX2VtaXR0aW5nW2V2ZW50XSA9IHRydWU7XG5cbiAgdmFyIHNlbGYgPSB0aGlzLCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5lbWl0LmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIGRlbGV0ZSBzZWxmLl9lbWl0dGluZ1tldmVudF07XG4gIH0pO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0QmxvYlVSTCA9IGZ1bmN0aW9uIChwYXRoLCBjYWxsYmFjaykge1xuICBpZiAocGF0aCBpbiB0aGlzLl9ibG9iQ2FjaGUpIHtcbiAgICBjYWxsYmFjayhudWxsLCB0aGlzLl9ibG9iQ2FjaGVbcGF0aF0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hcGkuZ2V0QmxvYlVSTChwYXRoLCBmdW5jdGlvbiAoZXJyLCB1cmwpIHtcbiAgICBpZiAoIWVycikgc2VsZi5fYmxvYkNhY2hlW3BhdGhdID0gdXJsO1xuICAgIGNhbGxiYWNrKGVyciwgdXJsKTtcbiAgfSk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRGcmFtZXMgPSBmdW5jdGlvbiAoaW1hZ2VQYXRoLCBvcHRfY2FjaGVQYXRoKSB7XG4gIHZhciBkb3RPZmZzZXQgPSBpbWFnZVBhdGgubGFzdEluZGV4T2YoJy4nKTtcbiAgdmFyIHBhdGggPSBpbWFnZVBhdGguc3Vic3RyKDAsIGRvdE9mZnNldCkgKyAnLmZyYW1lcyc7XG5cbiAgaWYgKHBhdGggaW4gdGhpcy5fZnJhbWVzQ2FjaGUpIHJldHVybiB0aGlzLl9mcmFtZXNDYWNoZVtwYXRoXTtcbiAgdGhpcy5fZnJhbWVzQ2FjaGVbcGF0aF0gPSBudWxsO1xuXG4gIHRoaXMuYXBpLmdldEpTT04ocGF0aCwgKGVyciwgZnJhbWVzKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgdmFyIHNsYXNoT2Zmc2V0ID0gcGF0aC5sYXN0SW5kZXhPZignLycpO1xuXG4gICAgICB2YXIgZGVmYXVsdFBhdGggPSBwYXRoLnN1YnN0cigwLCBzbGFzaE9mZnNldCArIDEpICsgJ2RlZmF1bHQuZnJhbWVzJztcbiAgICAgIGlmIChwYXRoICE9IGRlZmF1bHRQYXRoKSB7XG4gICAgICAgIHRoaXMuZ2V0RnJhbWVzKGRlZmF1bHRQYXRoLCBwYXRoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9wdF9jYWNoZVBhdGgpIHRoaXMuX2ZyYW1lc0NhY2hlW29wdF9jYWNoZVBhdGhdID0gZnJhbWVzO1xuICAgIHRoaXMuX2ZyYW1lc0NhY2hlW3BhdGhdID0gZnJhbWVzO1xuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgaW1hZ2UgZm9yIHRoZSBzcGVjaWZpZWQgcGF0aC4gVGhpcyBmdW5jdGlvbiBpcyBzeW5jaHJvbm91cywgYnV0IG1heVxuICogZGVwZW5kIG9uIGFzeW5jaHJvbm91cyBvcGVyYXRpb25zLiBJZiB0aGUgaW1hZ2UgaXMgbm90IGltbWVkaWF0ZWx5IGF2YWlsYWJsZVxuICogdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiBudWxsLiBPbmNlIG1vcmUgaW1hZ2VzIGFyZSBhdmFpbGFibGUsIGFuIFwiaW1hZ2VzXCJcbiAqIGV2ZW50IHdpbGwgYmUgZW1pdHRlZC5cbiAqL1xuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0SW1hZ2UgPSBmdW5jdGlvbiAocGF0aCkge1xuICAvLyBFeGFtcGxlIHBhdGg6IFwiL2RpcmVjdG9yeS9pbWFnZS5wbmc/aHVlc2hpZnQ9NjA/ZmFkZT1mZmZmZmY9MC4xXCJcbiAgaWYgKHBhdGggaW4gdGhpcy5faW1hZ2VDYWNoZSkgcmV0dXJuIHRoaXMuX2ltYWdlQ2FjaGVbcGF0aF07XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIEV4dHJhY3QgaW1hZ2Ugb3BlcmF0aW9ucy5cbiAgdmFyIG9wcyA9IHBhdGguc3BsaXQoJz8nKTtcbiAgLy8gR2V0IHRoZSBwbGFpbiBwYXRoIHRvIHRoZSBpbWFnZSBmaWxlLlxuICB2YXIgZmlsZVBhdGggPSBvcHMuc2hpZnQoKTtcblxuICAvLyBJZiB0aGUgaW1hZ2UgaXMgbm90IGluIHRoZSBjYWNoZSwgbG9hZCBpdCBhbmQgdHJpZ2dlciBhbiBcImltYWdlc1wiIGV2ZW50XG4gIC8vIHdoZW4gaXQncyBkb25lLlxuICBpZiAoIShmaWxlUGF0aCBpbiB0aGlzLl9pbWFnZUNhY2hlKSkge1xuICAgIHRoaXMuX2ltYWdlQ2FjaGVbZmlsZVBhdGhdID0gbnVsbDtcblxuICAgIHRoaXMuZ2V0QmxvYlVSTChmaWxlUGF0aCwgZnVuY3Rpb24gKGVyciwgdXJsKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGxvYWQgJXMgKCVzKScsIGZpbGVQYXRoLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5zcmMgPSB1cmw7XG4gICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuX2ltYWdlQ2FjaGVbZmlsZVBhdGhdID0gaW1hZ2U7XG4gICAgICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdpbWFnZXMnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICB2YXIgaW1hZ2UgPSB0aGlzLl9pbWFnZUNhY2hlW2ZpbGVQYXRoXTtcbiAgaWYgKCFpbWFnZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gQXBwbHkgb3BlcmF0aW9ucyAoc3VjaCBhcyBodWUgc2hpZnQpIG9uIHRoZSBpbWFnZS5cbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAvLyBQYXJzZSBhbGwgdGhlIG9wZXJhdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgaW1hZ2UuXG4gIC8vIFRPRE86IGFkZG1hc2ssIGJyaWdodG5lc3MsIGZhZGUsIHJlcGxhY2UsIHNhdHVyYXRpb25cbiAgdmFyIGh1ZSA9IDAsIGZsaXBFdmVyeVggPSAwLCByZXBsYWNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvcCA9IG9wc1tpXS5zcGxpdCgvWz07XS8pO1xuICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgIC8vIFRoaXMgb3BlcmF0aW9uIGRvZXNuJ3QgZXhpc3QgaW4gU3RhcmJvdW5kLCBidXQgaXMgaGVscGZ1bCBmb3IgdXMuXG4gICAgICBjYXNlICdmbGlwZ3JpZHgnOlxuICAgICAgICBmbGlwRXZlcnlYID0gcGFyc2VJbnQob3BbMV0pO1xuICAgICAgICBpZiAoaW1hZ2Uud2lkdGggJSBmbGlwRXZlcnlYKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGltYWdlLndpZHRoICsgJyBub3QgZGl2aXNpYmxlIGJ5ICcgKyBmbGlwRXZlcnlYICsgJyAoJyArIHBhdGggKyAnKScpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaHVlc2hpZnQnOlxuICAgICAgICBodWUgPSBwYXJzZUZsb2F0KG9wWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyZXBsYWNlJzpcbiAgICAgICAgaWYgKCFyZXBsYWNlKSByZXBsYWNlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgb3AubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICB2YXIgZnJvbSA9IFtcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2ldLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQob3BbaV0uc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpXS5zdWJzdHIoNCwgMiksIDE2KVxuICAgICAgICAgIF07XG5cbiAgICAgICAgICB2YXIgdG8gPSBbXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDQsIDIpLCAxNilcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmVwbGFjZVtmcm9tXSA9IHRvO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKCdVbnN1cHBvcnRlZCBpbWFnZSBvcGVyYXRpb246Jywgb3ApO1xuICAgIH1cbiAgfVxuXG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgaWYgKGZsaXBFdmVyeVgpIHtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LnNjYWxlKC0xLCAxKTtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCArIGZsaXBFdmVyeVggPD0gaW1hZ2Uud2lkdGg7IHggKz0gZmxpcEV2ZXJ5WCkge1xuICAgICAgdmFyIGZsaXBwZWRYID0gLSh4ICsgZmxpcEV2ZXJ5WCksIGR3ID0gZmxpcEV2ZXJ5WCwgZGggPSBpbWFnZS5oZWlnaHQ7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgeCwgMCwgZHcsIGRoLCBmbGlwcGVkWCwgMCwgZHcsIGRoKTtcbiAgICB9XG4gICAgY29udGV4dC5yZXN0b3JlKCk7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApO1xuICB9XG5cbiAgaWYgKGh1ZSB8fCByZXBsYWNlKSB7XG4gICAgdmFyIGltYWdlRGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpLFxuICAgICAgICBkYXRhID0gaW1hZ2VEYXRhLmRhdGE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArPSA0KSB7XG4gICAgICBpZiAocmVwbGFjZSkge1xuICAgICAgICB2YXIgY29sb3IgPSByZXBsYWNlW2RhdGFbaV0gKyAnLCcgKyBkYXRhW2kgKyAxXSArICcsJyArIGRhdGFbaSArIDJdXTtcbiAgICAgICAgaWYgKGNvbG9yKSB7XG4gICAgICAgICAgZGF0YVtpXSA9IGNvbG9yWzBdO1xuICAgICAgICAgIGRhdGFbaSArIDFdID0gY29sb3JbMV07XG4gICAgICAgICAgZGF0YVtpICsgMl0gPSBjb2xvclsyXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaHVlKSB7XG4gICAgICAgIHZhciBoc3YgPSBjb252ZXJ0LnJnYjJoc3YoZGF0YVtpXSwgZGF0YVtpICsgMV0sIGRhdGFbaSArIDJdKTtcblxuICAgICAgICBoc3ZbMF0gKz0gaHVlO1xuICAgICAgICBpZiAoaHN2WzBdIDwgMCkgaHN2WzBdICs9IDM2MFxuICAgICAgICBlbHNlIGlmIChoc3ZbMF0gPj0gMzYwKSBoc3ZbMF0gLT0gMzYwO1xuXG4gICAgICAgIHZhciByZ2IgPSBjb252ZXJ0LmhzdjJyZ2IoaHN2KTtcblxuICAgICAgICBkYXRhW2ldID0gcmdiWzBdO1xuICAgICAgICBkYXRhW2kgKyAxXSA9IHJnYlsxXTtcbiAgICAgICAgZGF0YVtpICsgMl0gPSByZ2JbMl07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gIH1cblxuICBzZWxmLl9pbWFnZUNhY2hlW3BhdGhdID0gbnVsbDtcblxuICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IGZvciB0aGUgbW9kaWZpZWQgaW1hZ2UgYW5kIGNhY2hlIGl0LlxuICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5faW1hZ2VDYWNoZVtwYXRoXSA9IGltYWdlO1xuICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdpbWFnZXMnKTtcbiAgfTtcbiAgaW1hZ2Uuc3JjID0gY2FudmFzLnRvRGF0YVVSTCgpO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0UmVzb3VyY2VMb2FkZXIgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG4gIHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIodGhpcywgZXh0ZW5zaW9uKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldFJlc291cmNlUGF0aCA9IGZ1bmN0aW9uIChyZXNvdXJjZSwgcGF0aCkge1xuICBpZiAocGF0aFswXSA9PSAnLycpIHJldHVybiBwYXRoO1xuICB2YXIgYmFzZSA9IHJlc291cmNlLl9fcGF0aF9fO1xuICByZXR1cm4gYmFzZS5zdWJzdHIoMCwgYmFzZS5sYXN0SW5kZXhPZignLycpICsgMSkgKyBwYXRoO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0VGlsZUltYWdlID0gZnVuY3Rpb24gKHJlc291cmNlLCBvcHRfaHVlU2hpZnQpIHtcbiAgdmFyIHRleHR1cmUgPSByZXNvdXJjZS5yZW5kZXJQYXJhbWV0ZXJzICYmIHJlc291cmNlLnJlbmRlclBhcmFtZXRlcnMudGV4dHVyZTtcbiAgaWYgKCF0ZXh0dXJlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGaWVsZCBcInJlbmRlclBhcmFtZXRlcnMudGV4dHVyZVwiIG5vdCBpbiByZXNvdXJjZTogJyArIEpTT04uc3RyaW5naWZ5KHJlc291cmNlKSk7XG4gIH1cblxuICB2YXIgcGF0aCA9IHRoaXMuZ2V0UmVzb3VyY2VQYXRoKHJlc291cmNlLCB0ZXh0dXJlKTtcblxuICAvLyBBZGQgaHVlc2hpZnQgaW1hZ2Ugb3BlcmF0aW9uIGlmIG5lZWRlZC5cbiAgaWYgKG9wdF9odWVTaGlmdCkge1xuICAgIHBhdGggKz0gJz9odWVzaGlmdD0nICsgKG9wdF9odWVTaGlmdCAvIDI1NSAqIDM2MCk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5nZXRJbWFnZShwYXRoKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmxvYWRSZXNvdXJjZXMgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uLCBjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXBpLmxvYWRSZXNvdXJjZXMoZXh0ZW5zaW9uLCBmdW5jdGlvbiAoZXJyLCByZXNvdXJjZXMpIHtcbiAgICBjYWxsYmFjayhlcnIsIHJlc291cmNlcyk7XG4gICAgaWYgKCFlcnIpIHtcbiAgICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdyZXNvdXJjZXMnKTtcbiAgICB9XG4gIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2VMb2FkZXI7XG5cblxuZnVuY3Rpb24gUmVzb3VyY2VMb2FkZXIoYXNzZXRzTWFuYWdlciwgZXh0ZW5zaW9uKSB7XG4gIHRoaXMuYXNzZXRzID0gYXNzZXRzTWFuYWdlcjtcbiAgdGhpcy5leHRlbnNpb24gPSBleHRlbnNpb247XG5cbiAgdGhpcy5pbmRleCA9IG51bGw7XG5cbiAgdGhpcy5fbG9hZGluZ0luZGV4ID0gZmFsc2U7XG59XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgaWYgKCF0aGlzLmluZGV4KSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRoaXMuaW5kZXhbaWRdIHx8IG51bGw7XG59O1xuXG5SZXNvdXJjZUxvYWRlci5wcm90b3R5cGUubG9hZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fbG9hZGluZ0luZGV4KSByZXR1cm47XG4gIHRoaXMuX2xvYWRpbmdJbmRleCA9IHRydWU7XG5cbiAgLy8gVE9ETzogRmF0IGFycm93cy5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmFzc2V0cy5sb2FkUmVzb3VyY2VzKHRoaXMuZXh0ZW5zaW9uLCBmdW5jdGlvbiAoZXJyLCBpbmRleCkge1xuICAgIHNlbGYuX2xvYWRpbmdJbmRleCA9IGZhbHNlO1xuICAgIHNlbGYuaW5kZXggPSBpbmRleDtcbiAgfSk7XG59O1xuIiwiLyogTUlUIGxpY2Vuc2UgKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJnYjJoc2w6IHJnYjJoc2wsXG4gIHJnYjJoc3Y6IHJnYjJoc3YsXG4gIHJnYjJod2I6IHJnYjJod2IsXG4gIHJnYjJjbXlrOiByZ2IyY215ayxcbiAgcmdiMmtleXdvcmQ6IHJnYjJrZXl3b3JkLFxuICByZ2IyeHl6OiByZ2IyeHl6LFxuICByZ2IybGFiOiByZ2IybGFiLFxuICByZ2IybGNoOiByZ2IybGNoLFxuXG4gIGhzbDJyZ2I6IGhzbDJyZ2IsXG4gIGhzbDJoc3Y6IGhzbDJoc3YsXG4gIGhzbDJod2I6IGhzbDJod2IsXG4gIGhzbDJjbXlrOiBoc2wyY215ayxcbiAgaHNsMmtleXdvcmQ6IGhzbDJrZXl3b3JkLFxuXG4gIGhzdjJyZ2I6IGhzdjJyZ2IsXG4gIGhzdjJoc2w6IGhzdjJoc2wsXG4gIGhzdjJod2I6IGhzdjJod2IsXG4gIGhzdjJjbXlrOiBoc3YyY215ayxcbiAgaHN2MmtleXdvcmQ6IGhzdjJrZXl3b3JkLFxuXG4gIGh3YjJyZ2I6IGh3YjJyZ2IsXG4gIGh3YjJoc2w6IGh3YjJoc2wsXG4gIGh3YjJoc3Y6IGh3YjJoc3YsXG4gIGh3YjJjbXlrOiBod2IyY215ayxcbiAgaHdiMmtleXdvcmQ6IGh3YjJrZXl3b3JkLFxuXG4gIGNteWsycmdiOiBjbXlrMnJnYixcbiAgY215azJoc2w6IGNteWsyaHNsLFxuICBjbXlrMmhzdjogY215azJoc3YsXG4gIGNteWsyaHdiOiBjbXlrMmh3YixcbiAgY215azJrZXl3b3JkOiBjbXlrMmtleXdvcmQsXG5cbiAga2V5d29yZDJyZ2I6IGtleXdvcmQycmdiLFxuICBrZXl3b3JkMmhzbDoga2V5d29yZDJoc2wsXG4gIGtleXdvcmQyaHN2OiBrZXl3b3JkMmhzdixcbiAga2V5d29yZDJod2I6IGtleXdvcmQyaHdiLFxuICBrZXl3b3JkMmNteWs6IGtleXdvcmQyY215ayxcbiAga2V5d29yZDJsYWI6IGtleXdvcmQybGFiLFxuICBrZXl3b3JkMnh5ejoga2V5d29yZDJ4eXosXG5cbiAgeHl6MnJnYjogeHl6MnJnYixcbiAgeHl6MmxhYjogeHl6MmxhYixcbiAgeHl6MmxjaDogeHl6MmxjaCxcblxuICBsYWIyeHl6OiBsYWIyeHl6LFxuICBsYWIycmdiOiBsYWIycmdiLFxuICBsYWIybGNoOiBsYWIybGNoLFxuXG4gIGxjaDJsYWI6IGxjaDJsYWIsXG4gIGxjaDJ4eXo6IGxjaDJ4eXosXG4gIGxjaDJyZ2I6IGxjaDJyZ2Jcbn1cblxuXG5mdW5jdGlvbiByZ2IyaHNsKHJnYikge1xuICB2YXIgciA9IHJnYlswXS8yNTUsXG4gICAgICBnID0gcmdiWzFdLzI1NSxcbiAgICAgIGIgPSByZ2JbMl0vMjU1LFxuICAgICAgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICBtYXggPSBNYXRoLm1heChyLCBnLCBiKSxcbiAgICAgIGRlbHRhID0gbWF4IC0gbWluLFxuICAgICAgaCwgcywgbDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpXG4gICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgZWxzZSBpZiAoZyA9PSBtYXgpXG4gICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKS8gZGVsdGE7XG5cbiAgaCA9IE1hdGgubWluKGggKiA2MCwgMzYwKTtcblxuICBpZiAoaCA8IDApXG4gICAgaCArPSAzNjA7XG5cbiAgbCA9IChtaW4gKyBtYXgpIC8gMjtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBzID0gMDtcbiAgZWxzZSBpZiAobCA8PSAwLjUpXG4gICAgcyA9IGRlbHRhIC8gKG1heCArIG1pbik7XG4gIGVsc2VcbiAgICBzID0gZGVsdGEgLyAoMiAtIG1heCAtIG1pbik7XG5cbiAgcmV0dXJuIFtoLCBzICogMTAwLCBsICogMTAwXTtcbn1cblxuZnVuY3Rpb24gcmdiMmhzdihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0sXG4gICAgICBnID0gcmdiWzFdLFxuICAgICAgYiA9IHJnYlsyXSxcbiAgICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpLFxuICAgICAgbWF4ID0gTWF0aC5tYXgociwgZywgYiksXG4gICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgIGgsIHMsIHY7XG5cbiAgaWYgKG1heCA9PSAwKVxuICAgIHMgPSAwO1xuICBlbHNlXG4gICAgcyA9IChkZWx0YS9tYXggKiAxMDAwKS8xMDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpXG4gICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgZWxzZSBpZiAoZyA9PSBtYXgpXG4gICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKSAvIGRlbHRhO1xuXG4gIGggPSBNYXRoLm1pbihoICogNjAsIDM2MCk7XG5cbiAgaWYgKGggPCAwKVxuICAgIGggKz0gMzYwO1xuXG4gIHYgPSAoKG1heCAvIDI1NSkgKiAxMDAwKSAvIDEwO1xuXG4gIHJldHVybiBbaCwgcywgdl07XG59XG5cbmZ1bmN0aW9uIHJnYjJod2IocmdiKSB7XG4gIHZhciByID0gcmdiWzBdLFxuICAgICAgZyA9IHJnYlsxXSxcbiAgICAgIGIgPSByZ2JbMl0sXG4gICAgICBoID0gcmdiMmhzbChyZ2IpWzBdLFxuICAgICAgdyA9IDEvMjU1ICogTWF0aC5taW4ociwgTWF0aC5taW4oZywgYikpLFxuICAgICAgYiA9IDEgLSAxLzI1NSAqIE1hdGgubWF4KHIsIE1hdGgubWF4KGcsIGIpKTtcblxuICByZXR1cm4gW2gsIHcgKiAxMDAsIGIgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2IyY215ayhyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NSxcbiAgICAgIGMsIG0sIHksIGs7XG5cbiAgayA9IE1hdGgubWluKDEgLSByLCAxIC0gZywgMSAtIGIpO1xuICBjID0gKDEgLSByIC0gaykgLyAoMSAtIGspIHx8IDA7XG4gIG0gPSAoMSAtIGcgLSBrKSAvICgxIC0gaykgfHwgMDtcbiAgeSA9ICgxIC0gYiAtIGspIC8gKDEgLSBrKSB8fCAwO1xuICByZXR1cm4gW2MgKiAxMDAsIG0gKiAxMDAsIHkgKiAxMDAsIGsgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2Iya2V5d29yZChyZ2IpIHtcbiAgcmV0dXJuIHJldmVyc2VLZXl3b3Jkc1tKU09OLnN0cmluZ2lmeShyZ2IpXTtcbn1cblxuZnVuY3Rpb24gcmdiMnh5eihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NTtcblxuICAvLyBhc3N1bWUgc1JHQlxuICByID0gciA+IDAuMDQwNDUgPyBNYXRoLnBvdygoKHIgKyAwLjA1NSkgLyAxLjA1NSksIDIuNCkgOiAociAvIDEyLjkyKTtcbiAgZyA9IGcgPiAwLjA0MDQ1ID8gTWF0aC5wb3coKChnICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpIDogKGcgLyAxMi45Mik7XG4gIGIgPSBiID4gMC4wNDA0NSA/IE1hdGgucG93KCgoYiArIDAuMDU1KSAvIDEuMDU1KSwgMi40KSA6IChiIC8gMTIuOTIpO1xuXG4gIHZhciB4ID0gKHIgKiAwLjQxMjQpICsgKGcgKiAwLjM1NzYpICsgKGIgKiAwLjE4MDUpO1xuICB2YXIgeSA9IChyICogMC4yMTI2KSArIChnICogMC43MTUyKSArIChiICogMC4wNzIyKTtcbiAgdmFyIHogPSAociAqIDAuMDE5MykgKyAoZyAqIDAuMTE5MikgKyAoYiAqIDAuOTUwNSk7XG5cbiAgcmV0dXJuIFt4ICogMTAwLCB5ICoxMDAsIHogKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2IybGFiKHJnYikge1xuICB2YXIgeHl6ID0gcmdiMnh5eihyZ2IpLFxuICAgICAgICB4ID0geHl6WzBdLFxuICAgICAgICB5ID0geHl6WzFdLFxuICAgICAgICB6ID0geHl6WzJdLFxuICAgICAgICBsLCBhLCBiO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxLzMpIDogKDcuNzg3ICogeCkgKyAoMTYgLyAxMTYpO1xuICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMS8zKSA6ICg3Ljc4NyAqIHkpICsgKDE2IC8gMTE2KTtcbiAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEvMykgOiAoNy43ODcgKiB6KSArICgxNiAvIDExNik7XG5cbiAgbCA9ICgxMTYgKiB5KSAtIDE2O1xuICBhID0gNTAwICogKHggLSB5KTtcbiAgYiA9IDIwMCAqICh5IC0geik7XG5cbiAgcmV0dXJuIFtsLCBhLCBiXTtcbn1cblxuZnVuY3Rpb24gcmdiMmxjaChhcmdzKSB7XG4gIHJldHVybiBsYWIybGNoKHJnYjJsYWIoYXJncykpO1xufVxuXG5mdW5jdGlvbiBoc2wycmdiKGhzbCkge1xuICB2YXIgaCA9IGhzbFswXSAvIDM2MCxcbiAgICAgIHMgPSBoc2xbMV0gLyAxMDAsXG4gICAgICBsID0gaHNsWzJdIC8gMTAwLFxuICAgICAgdDEsIHQyLCB0MywgcmdiLCB2YWw7XG5cbiAgaWYgKHMgPT0gMCkge1xuICAgIHZhbCA9IGwgKiAyNTU7XG4gICAgcmV0dXJuIFt2YWwsIHZhbCwgdmFsXTtcbiAgfVxuXG4gIGlmIChsIDwgMC41KVxuICAgIHQyID0gbCAqICgxICsgcyk7XG4gIGVsc2VcbiAgICB0MiA9IGwgKyBzIC0gbCAqIHM7XG4gIHQxID0gMiAqIGwgLSB0MjtcblxuICByZ2IgPSBbMCwgMCwgMF07XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgdDMgPSBoICsgMSAvIDMgKiAtIChpIC0gMSk7XG4gICAgdDMgPCAwICYmIHQzKys7XG4gICAgdDMgPiAxICYmIHQzLS07XG5cbiAgICBpZiAoNiAqIHQzIDwgMSlcbiAgICAgIHZhbCA9IHQxICsgKHQyIC0gdDEpICogNiAqIHQzO1xuICAgIGVsc2UgaWYgKDIgKiB0MyA8IDEpXG4gICAgICB2YWwgPSB0MjtcbiAgICBlbHNlIGlmICgzICogdDMgPCAyKVxuICAgICAgdmFsID0gdDEgKyAodDIgLSB0MSkgKiAoMiAvIDMgLSB0MykgKiA2O1xuICAgIGVsc2VcbiAgICAgIHZhbCA9IHQxO1xuXG4gICAgcmdiW2ldID0gdmFsICogMjU1O1xuICB9XG5cbiAgcmV0dXJuIHJnYjtcbn1cblxuZnVuY3Rpb24gaHNsMmhzdihoc2wpIHtcbiAgdmFyIGggPSBoc2xbMF0sXG4gICAgICBzID0gaHNsWzFdIC8gMTAwLFxuICAgICAgbCA9IGhzbFsyXSAvIDEwMCxcbiAgICAgIHN2LCB2O1xuICBsICo9IDI7XG4gIHMgKj0gKGwgPD0gMSkgPyBsIDogMiAtIGw7XG4gIHYgPSAobCArIHMpIC8gMjtcbiAgc3YgPSAoMiAqIHMpIC8gKGwgKyBzKTtcbiAgcmV0dXJuIFtoLCBzdiAqIDEwMCwgdiAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIGhzbDJod2IoYXJncykge1xuICByZXR1cm4gcmdiMmh3Yihoc2wycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gaHNsMmNteWsoYXJncykge1xuICByZXR1cm4gcmdiMmNteWsoaHNsMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGhzbDJrZXl3b3JkKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJrZXl3b3JkKGhzbDJyZ2IoYXJncykpO1xufVxuXG5cbmZ1bmN0aW9uIGhzdjJyZ2IoaHN2KSB7XG4gIHZhciBoID0gaHN2WzBdIC8gNjAsXG4gICAgICBzID0gaHN2WzFdIC8gMTAwLFxuICAgICAgdiA9IGhzdlsyXSAvIDEwMCxcbiAgICAgIGhpID0gTWF0aC5mbG9vcihoKSAlIDY7XG5cbiAgdmFyIGYgPSBoIC0gTWF0aC5mbG9vcihoKSxcbiAgICAgIHAgPSAyNTUgKiB2ICogKDEgLSBzKSxcbiAgICAgIHEgPSAyNTUgKiB2ICogKDEgLSAocyAqIGYpKSxcbiAgICAgIHQgPSAyNTUgKiB2ICogKDEgLSAocyAqICgxIC0gZikpKSxcbiAgICAgIHYgPSAyNTUgKiB2O1xuXG4gIHN3aXRjaChoaSkge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBbdiwgdCwgcF07XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIFtxLCB2LCBwXTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gW3AsIHYsIHRdO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBbcCwgcSwgdl07XG4gICAgY2FzZSA0OlxuICAgICAgcmV0dXJuIFt0LCBwLCB2XTtcbiAgICBjYXNlIDU6XG4gICAgICByZXR1cm4gW3YsIHAsIHFdO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhzdjJoc2woaHN2KSB7XG4gIHZhciBoID0gaHN2WzBdLFxuICAgICAgcyA9IGhzdlsxXSAvIDEwMCxcbiAgICAgIHYgPSBoc3ZbMl0gLyAxMDAsXG4gICAgICBzbCwgbDtcblxuICBsID0gKDIgLSBzKSAqIHY7XG4gIHNsID0gcyAqIHY7XG4gIHNsIC89IChsIDw9IDEpID8gbCA6IDIgLSBsO1xuICBzbCA9IHNsIHx8IDA7XG4gIGwgLz0gMjtcbiAgcmV0dXJuIFtoLCBzbCAqIDEwMCwgbCAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIGhzdjJod2IoYXJncykge1xuICByZXR1cm4gcmdiMmh3Yihoc3YycmdiKGFyZ3MpKVxufVxuXG5mdW5jdGlvbiBoc3YyY215ayhhcmdzKSB7XG4gIHJldHVybiByZ2IyY215ayhoc3YycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gaHN2MmtleXdvcmQoYXJncykge1xuICByZXR1cm4gcmdiMmtleXdvcmQoaHN2MnJnYihhcmdzKSk7XG59XG5cbi8vIGh0dHA6Ly9kZXYudzMub3JnL2Nzc3dnL2Nzcy1jb2xvci8jaHdiLXRvLXJnYlxuZnVuY3Rpb24gaHdiMnJnYihod2IpIHtcbiAgdmFyIGggPSBod2JbMF0gLyAzNjAsXG4gICAgICB3aCA9IGh3YlsxXSAvIDEwMCxcbiAgICAgIGJsID0gaHdiWzJdIC8gMTAwLFxuICAgICAgcmF0aW8gPSB3aCArIGJsLFxuICAgICAgaSwgdiwgZiwgbjtcblxuICAvLyB3aCArIGJsIGNhbnQgYmUgPiAxXG4gIGlmIChyYXRpbyA+IDEpIHtcbiAgICB3aCAvPSByYXRpbztcbiAgICBibCAvPSByYXRpbztcbiAgfVxuXG4gIGkgPSBNYXRoLmZsb29yKDYgKiBoKTtcbiAgdiA9IDEgLSBibDtcbiAgZiA9IDYgKiBoIC0gaTtcbiAgaWYgKChpICYgMHgwMSkgIT0gMCkge1xuICAgIGYgPSAxIC0gZjtcbiAgfVxuICBuID0gd2ggKyBmICogKHYgLSB3aCk7ICAvLyBsaW5lYXIgaW50ZXJwb2xhdGlvblxuXG4gIHN3aXRjaCAoaSkge1xuICAgIGRlZmF1bHQ6XG4gICAgY2FzZSA2OlxuICAgIGNhc2UgMDogciA9IHY7IGcgPSBuOyBiID0gd2g7IGJyZWFrO1xuICAgIGNhc2UgMTogciA9IG47IGcgPSB2OyBiID0gd2g7IGJyZWFrO1xuICAgIGNhc2UgMjogciA9IHdoOyBnID0gdjsgYiA9IG47IGJyZWFrO1xuICAgIGNhc2UgMzogciA9IHdoOyBnID0gbjsgYiA9IHY7IGJyZWFrO1xuICAgIGNhc2UgNDogciA9IG47IGcgPSB3aDsgYiA9IHY7IGJyZWFrO1xuICAgIGNhc2UgNTogciA9IHY7IGcgPSB3aDsgYiA9IG47IGJyZWFrO1xuICB9XG5cbiAgcmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn1cblxuZnVuY3Rpb24gaHdiMmhzbChhcmdzKSB7XG4gIHJldHVybiByZ2IyaHNsKGh3YjJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBod2IyaHN2KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc3YoaHdiMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGh3YjJjbXlrKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJjbXlrKGh3YjJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBod2Iya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChod2IycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gY215azJyZ2IoY215aykge1xuICB2YXIgYyA9IGNteWtbMF0gLyAxMDAsXG4gICAgICBtID0gY215a1sxXSAvIDEwMCxcbiAgICAgIHkgPSBjbXlrWzJdIC8gMTAwLFxuICAgICAgayA9IGNteWtbM10gLyAxMDAsXG4gICAgICByLCBnLCBiO1xuXG4gIHIgPSAxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKTtcbiAgZyA9IDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspO1xuICBiID0gMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgayk7XG4gIHJldHVybiBbciAqIDI1NSwgZyAqIDI1NSwgYiAqIDI1NV07XG59XG5cbmZ1bmN0aW9uIGNteWsyaHNsKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc2woY215azJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBjbXlrMmhzdihhcmdzKSB7XG4gIHJldHVybiByZ2IyaHN2KGNteWsycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gY215azJod2IoYXJncykge1xuICByZXR1cm4gcmdiMmh3YihjbXlrMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChjbXlrMnJnYihhcmdzKSk7XG59XG5cblxuZnVuY3Rpb24geHl6MnJnYih4eXopIHtcbiAgdmFyIHggPSB4eXpbMF0gLyAxMDAsXG4gICAgICB5ID0geHl6WzFdIC8gMTAwLFxuICAgICAgeiA9IHh5elsyXSAvIDEwMCxcbiAgICAgIHIsIGcsIGI7XG5cbiAgciA9ICh4ICogMy4yNDA2KSArICh5ICogLTEuNTM3MikgKyAoeiAqIC0wLjQ5ODYpO1xuICBnID0gKHggKiAtMC45Njg5KSArICh5ICogMS44NzU4KSArICh6ICogMC4wNDE1KTtcbiAgYiA9ICh4ICogMC4wNTU3KSArICh5ICogLTAuMjA0MCkgKyAoeiAqIDEuMDU3MCk7XG5cbiAgLy8gYXNzdW1lIHNSR0JcbiAgciA9IHIgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3cociwgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IHIgPSAociAqIDEyLjkyKTtcblxuICBnID0gZyA+IDAuMDAzMTMwOCA/ICgoMS4wNTUgKiBNYXRoLnBvdyhnLCAxLjAgLyAyLjQpKSAtIDAuMDU1KVxuICAgIDogZyA9IChnICogMTIuOTIpO1xuXG4gIGIgPSBiID4gMC4wMDMxMzA4ID8gKCgxLjA1NSAqIE1hdGgucG93KGIsIDEuMCAvIDIuNCkpIC0gMC4wNTUpXG4gICAgOiBiID0gKGIgKiAxMi45Mik7XG5cbiAgciA9IE1hdGgubWluKE1hdGgubWF4KDAsIHIpLCAxKTtcbiAgZyA9IE1hdGgubWluKE1hdGgubWF4KDAsIGcpLCAxKTtcbiAgYiA9IE1hdGgubWluKE1hdGgubWF4KDAsIGIpLCAxKTtcblxuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufVxuXG5mdW5jdGlvbiB4eXoybGFiKHh5eikge1xuICB2YXIgeCA9IHh5elswXSxcbiAgICAgIHkgPSB4eXpbMV0sXG4gICAgICB6ID0geHl6WzJdLFxuICAgICAgbCwgYSwgYjtcblxuICB4IC89IDk1LjA0NztcbiAgeSAvPSAxMDA7XG4gIHogLz0gMTA4Ljg4MztcblxuICB4ID0geCA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeCwgMS8zKSA6ICg3Ljc4NyAqIHgpICsgKDE2IC8gMTE2KTtcbiAgeSA9IHkgPiAwLjAwODg1NiA/IE1hdGgucG93KHksIDEvMykgOiAoNy43ODcgKiB5KSArICgxNiAvIDExNik7XG4gIHogPSB6ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh6LCAxLzMpIDogKDcuNzg3ICogeikgKyAoMTYgLyAxMTYpO1xuXG4gIGwgPSAoMTE2ICogeSkgLSAxNjtcbiAgYSA9IDUwMCAqICh4IC0geSk7XG4gIGIgPSAyMDAgKiAoeSAtIHopO1xuXG4gIHJldHVybiBbbCwgYSwgYl07XG59XG5cbmZ1bmN0aW9uIHh5ejJsY2goYXJncykge1xuICByZXR1cm4gbGFiMmxjaCh4eXoybGFiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gbGFiMnh5eihsYWIpIHtcbiAgdmFyIGwgPSBsYWJbMF0sXG4gICAgICBhID0gbGFiWzFdLFxuICAgICAgYiA9IGxhYlsyXSxcbiAgICAgIHgsIHksIHosIHkyO1xuXG4gIGlmIChsIDw9IDgpIHtcbiAgICB5ID0gKGwgKiAxMDApIC8gOTAzLjM7XG4gICAgeTIgPSAoNy43ODcgKiAoeSAvIDEwMCkpICsgKDE2IC8gMTE2KTtcbiAgfSBlbHNlIHtcbiAgICB5ID0gMTAwICogTWF0aC5wb3coKGwgKyAxNikgLyAxMTYsIDMpO1xuICAgIHkyID0gTWF0aC5wb3coeSAvIDEwMCwgMS8zKTtcbiAgfVxuXG4gIHggPSB4IC8gOTUuMDQ3IDw9IDAuMDA4ODU2ID8geCA9ICg5NS4wNDcgKiAoKGEgLyA1MDApICsgeTIgLSAoMTYgLyAxMTYpKSkgLyA3Ljc4NyA6IDk1LjA0NyAqIE1hdGgucG93KChhIC8gNTAwKSArIHkyLCAzKTtcblxuICB6ID0geiAvIDEwOC44ODMgPD0gMC4wMDg4NTkgPyB6ID0gKDEwOC44ODMgKiAoeTIgLSAoYiAvIDIwMCkgLSAoMTYgLyAxMTYpKSkgLyA3Ljc4NyA6IDEwOC44ODMgKiBNYXRoLnBvdyh5MiAtIChiIC8gMjAwKSwgMyk7XG5cbiAgcmV0dXJuIFt4LCB5LCB6XTtcbn1cblxuZnVuY3Rpb24gbGFiMmxjaChsYWIpIHtcbiAgdmFyIGwgPSBsYWJbMF0sXG4gICAgICBhID0gbGFiWzFdLFxuICAgICAgYiA9IGxhYlsyXSxcbiAgICAgIGhyLCBoLCBjO1xuXG4gIGhyID0gTWF0aC5hdGFuMihiLCBhKTtcbiAgaCA9IGhyICogMzYwIC8gMiAvIE1hdGguUEk7XG4gIGlmIChoIDwgMCkge1xuICAgIGggKz0gMzYwO1xuICB9XG4gIGMgPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XG4gIHJldHVybiBbbCwgYywgaF07XG59XG5cbmZ1bmN0aW9uIGxhYjJyZ2IoYXJncykge1xuICByZXR1cm4geHl6MnJnYihsYWIyeHl6KGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gbGNoMmxhYihsY2gpIHtcbiAgdmFyIGwgPSBsY2hbMF0sXG4gICAgICBjID0gbGNoWzFdLFxuICAgICAgaCA9IGxjaFsyXSxcbiAgICAgIGEsIGIsIGhyO1xuXG4gIGhyID0gaCAvIDM2MCAqIDIgKiBNYXRoLlBJO1xuICBhID0gYyAqIE1hdGguY29zKGhyKTtcbiAgYiA9IGMgKiBNYXRoLnNpbihocik7XG4gIHJldHVybiBbbCwgYSwgYl07XG59XG5cbmZ1bmN0aW9uIGxjaDJ4eXooYXJncykge1xuICByZXR1cm4gbGFiMnh5eihsY2gybGFiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gbGNoMnJnYihhcmdzKSB7XG4gIHJldHVybiBsYWIycmdiKGxjaDJsYWIoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMnJnYihrZXl3b3JkKSB7XG4gIHJldHVybiBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJoc2woYXJncykge1xuICByZXR1cm4gcmdiMmhzbChrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyaHN2KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc3Yoa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmh3YihhcmdzKSB7XG4gIHJldHVybiByZ2IyaHdiKGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJjbXlrKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJjbXlrKGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJsYWIoYXJncykge1xuICByZXR1cm4gcmdiMmxhYihrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyeHl6KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJ4eXooa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG52YXIgY3NzS2V5d29yZHMgPSB7XG4gIGFsaWNlYmx1ZTogIFsyNDAsMjQ4LDI1NV0sXG4gIGFudGlxdWV3aGl0ZTogWzI1MCwyMzUsMjE1XSxcbiAgYXF1YTogWzAsMjU1LDI1NV0sXG4gIGFxdWFtYXJpbmU6IFsxMjcsMjU1LDIxMl0sXG4gIGF6dXJlOiAgWzI0MCwyNTUsMjU1XSxcbiAgYmVpZ2U6ICBbMjQ1LDI0NSwyMjBdLFxuICBiaXNxdWU6IFsyNTUsMjI4LDE5Nl0sXG4gIGJsYWNrOiAgWzAsMCwwXSxcbiAgYmxhbmNoZWRhbG1vbmQ6IFsyNTUsMjM1LDIwNV0sXG4gIGJsdWU6IFswLDAsMjU1XSxcbiAgYmx1ZXZpb2xldDogWzEzOCw0MywyMjZdLFxuICBicm93bjogIFsxNjUsNDIsNDJdLFxuICBidXJseXdvb2Q6ICBbMjIyLDE4NCwxMzVdLFxuICBjYWRldGJsdWU6ICBbOTUsMTU4LDE2MF0sXG4gIGNoYXJ0cmV1c2U6IFsxMjcsMjU1LDBdLFxuICBjaG9jb2xhdGU6ICBbMjEwLDEwNSwzMF0sXG4gIGNvcmFsOiAgWzI1NSwxMjcsODBdLFxuICBjb3JuZmxvd2VyYmx1ZTogWzEwMCwxNDksMjM3XSxcbiAgY29ybnNpbGs6IFsyNTUsMjQ4LDIyMF0sXG4gIGNyaW1zb246ICBbMjIwLDIwLDYwXSxcbiAgY3lhbjogWzAsMjU1LDI1NV0sXG4gIGRhcmtibHVlOiBbMCwwLDEzOV0sXG4gIGRhcmtjeWFuOiBbMCwxMzksMTM5XSxcbiAgZGFya2dvbGRlbnJvZDogIFsxODQsMTM0LDExXSxcbiAgZGFya2dyYXk6IFsxNjksMTY5LDE2OV0sXG4gIGRhcmtncmVlbjogIFswLDEwMCwwXSxcbiAgZGFya2dyZXk6IFsxNjksMTY5LDE2OV0sXG4gIGRhcmtraGFraTogIFsxODksMTgzLDEwN10sXG4gIGRhcmttYWdlbnRhOiAgWzEzOSwwLDEzOV0sXG4gIGRhcmtvbGl2ZWdyZWVuOiBbODUsMTA3LDQ3XSxcbiAgZGFya29yYW5nZTogWzI1NSwxNDAsMF0sXG4gIGRhcmtvcmNoaWQ6IFsxNTMsNTAsMjA0XSxcbiAgZGFya3JlZDogIFsxMzksMCwwXSxcbiAgZGFya3NhbG1vbjogWzIzMywxNTAsMTIyXSxcbiAgZGFya3NlYWdyZWVuOiBbMTQzLDE4OCwxNDNdLFxuICBkYXJrc2xhdGVibHVlOiAgWzcyLDYxLDEzOV0sXG4gIGRhcmtzbGF0ZWdyYXk6ICBbNDcsNzksNzldLFxuICBkYXJrc2xhdGVncmV5OiAgWzQ3LDc5LDc5XSxcbiAgZGFya3R1cnF1b2lzZTogIFswLDIwNiwyMDldLFxuICBkYXJrdmlvbGV0OiBbMTQ4LDAsMjExXSxcbiAgZGVlcHBpbms6IFsyNTUsMjAsMTQ3XSxcbiAgZGVlcHNreWJsdWU6ICBbMCwxOTEsMjU1XSxcbiAgZGltZ3JheTogIFsxMDUsMTA1LDEwNV0sXG4gIGRpbWdyZXk6ICBbMTA1LDEwNSwxMDVdLFxuICBkb2RnZXJibHVlOiBbMzAsMTQ0LDI1NV0sXG4gIGZpcmVicmljazogIFsxNzgsMzQsMzRdLFxuICBmbG9yYWx3aGl0ZTogIFsyNTUsMjUwLDI0MF0sXG4gIGZvcmVzdGdyZWVuOiAgWzM0LDEzOSwzNF0sXG4gIGZ1Y2hzaWE6ICBbMjU1LDAsMjU1XSxcbiAgZ2FpbnNib3JvOiAgWzIyMCwyMjAsMjIwXSxcbiAgZ2hvc3R3aGl0ZTogWzI0OCwyNDgsMjU1XSxcbiAgZ29sZDogWzI1NSwyMTUsMF0sXG4gIGdvbGRlbnJvZDogIFsyMTgsMTY1LDMyXSxcbiAgZ3JheTogWzEyOCwxMjgsMTI4XSxcbiAgZ3JlZW46ICBbMCwxMjgsMF0sXG4gIGdyZWVueWVsbG93OiAgWzE3MywyNTUsNDddLFxuICBncmV5OiBbMTI4LDEyOCwxMjhdLFxuICBob25leWRldzogWzI0MCwyNTUsMjQwXSxcbiAgaG90cGluazogIFsyNTUsMTA1LDE4MF0sXG4gIGluZGlhbnJlZDogIFsyMDUsOTIsOTJdLFxuICBpbmRpZ286IFs3NSwwLDEzMF0sXG4gIGl2b3J5OiAgWzI1NSwyNTUsMjQwXSxcbiAga2hha2k6ICBbMjQwLDIzMCwxNDBdLFxuICBsYXZlbmRlcjogWzIzMCwyMzAsMjUwXSxcbiAgbGF2ZW5kZXJibHVzaDogIFsyNTUsMjQwLDI0NV0sXG4gIGxhd25ncmVlbjogIFsxMjQsMjUyLDBdLFxuICBsZW1vbmNoaWZmb246IFsyNTUsMjUwLDIwNV0sXG4gIGxpZ2h0Ymx1ZTogIFsxNzMsMjE2LDIzMF0sXG4gIGxpZ2h0Y29yYWw6IFsyNDAsMTI4LDEyOF0sXG4gIGxpZ2h0Y3lhbjogIFsyMjQsMjU1LDI1NV0sXG4gIGxpZ2h0Z29sZGVucm9keWVsbG93OiBbMjUwLDI1MCwyMTBdLFxuICBsaWdodGdyYXk6ICBbMjExLDIxMSwyMTFdLFxuICBsaWdodGdyZWVuOiBbMTQ0LDIzOCwxNDRdLFxuICBsaWdodGdyZXk6ICBbMjExLDIxMSwyMTFdLFxuICBsaWdodHBpbms6ICBbMjU1LDE4MiwxOTNdLFxuICBsaWdodHNhbG1vbjogIFsyNTUsMTYwLDEyMl0sXG4gIGxpZ2h0c2VhZ3JlZW46ICBbMzIsMTc4LDE3MF0sXG4gIGxpZ2h0c2t5Ymx1ZTogWzEzNSwyMDYsMjUwXSxcbiAgbGlnaHRzbGF0ZWdyYXk6IFsxMTksMTM2LDE1M10sXG4gIGxpZ2h0c2xhdGVncmV5OiBbMTE5LDEzNiwxNTNdLFxuICBsaWdodHN0ZWVsYmx1ZTogWzE3NiwxOTYsMjIyXSxcbiAgbGlnaHR5ZWxsb3c6ICBbMjU1LDI1NSwyMjRdLFxuICBsaW1lOiBbMCwyNTUsMF0sXG4gIGxpbWVncmVlbjogIFs1MCwyMDUsNTBdLFxuICBsaW5lbjogIFsyNTAsMjQwLDIzMF0sXG4gIG1hZ2VudGE6ICBbMjU1LDAsMjU1XSxcbiAgbWFyb29uOiBbMTI4LDAsMF0sXG4gIG1lZGl1bWFxdWFtYXJpbmU6IFsxMDIsMjA1LDE3MF0sXG4gIG1lZGl1bWJsdWU6IFswLDAsMjA1XSxcbiAgbWVkaXVtb3JjaGlkOiBbMTg2LDg1LDIxMV0sXG4gIG1lZGl1bXB1cnBsZTogWzE0NywxMTIsMjE5XSxcbiAgbWVkaXVtc2VhZ3JlZW46IFs2MCwxNzksMTEzXSxcbiAgbWVkaXVtc2xhdGVibHVlOiAgWzEyMywxMDQsMjM4XSxcbiAgbWVkaXVtc3ByaW5nZ3JlZW46ICBbMCwyNTAsMTU0XSxcbiAgbWVkaXVtdHVycXVvaXNlOiAgWzcyLDIwOSwyMDRdLFxuICBtZWRpdW12aW9sZXRyZWQ6ICBbMTk5LDIxLDEzM10sXG4gIG1pZG5pZ2h0Ymx1ZTogWzI1LDI1LDExMl0sXG4gIG1pbnRjcmVhbTogIFsyNDUsMjU1LDI1MF0sXG4gIG1pc3R5cm9zZTogIFsyNTUsMjI4LDIyNV0sXG4gIG1vY2Nhc2luOiBbMjU1LDIyOCwxODFdLFxuICBuYXZham93aGl0ZTogIFsyNTUsMjIyLDE3M10sXG4gIG5hdnk6IFswLDAsMTI4XSxcbiAgb2xkbGFjZTogIFsyNTMsMjQ1LDIzMF0sXG4gIG9saXZlOiAgWzEyOCwxMjgsMF0sXG4gIG9saXZlZHJhYjogIFsxMDcsMTQyLDM1XSxcbiAgb3JhbmdlOiBbMjU1LDE2NSwwXSxcbiAgb3JhbmdlcmVkOiAgWzI1NSw2OSwwXSxcbiAgb3JjaGlkOiBbMjE4LDExMiwyMTRdLFxuICBwYWxlZ29sZGVucm9kOiAgWzIzOCwyMzIsMTcwXSxcbiAgcGFsZWdyZWVuOiAgWzE1MiwyNTEsMTUyXSxcbiAgcGFsZXR1cnF1b2lzZTogIFsxNzUsMjM4LDIzOF0sXG4gIHBhbGV2aW9sZXRyZWQ6ICBbMjE5LDExMiwxNDddLFxuICBwYXBheWF3aGlwOiBbMjU1LDIzOSwyMTNdLFxuICBwZWFjaHB1ZmY6ICBbMjU1LDIxOCwxODVdLFxuICBwZXJ1OiBbMjA1LDEzMyw2M10sXG4gIHBpbms6IFsyNTUsMTkyLDIwM10sXG4gIHBsdW06IFsyMjEsMTYwLDIyMV0sXG4gIHBvd2RlcmJsdWU6IFsxNzYsMjI0LDIzMF0sXG4gIHB1cnBsZTogWzEyOCwwLDEyOF0sXG4gIHJlYmVjY2FwdXJwbGU6IFsxMDIsIDUxLCAxNTNdLFxuICByZWQ6ICBbMjU1LDAsMF0sXG4gIHJvc3licm93bjogIFsxODgsMTQzLDE0M10sXG4gIHJveWFsYmx1ZTogIFs2NSwxMDUsMjI1XSxcbiAgc2FkZGxlYnJvd246ICBbMTM5LDY5LDE5XSxcbiAgc2FsbW9uOiBbMjUwLDEyOCwxMTRdLFxuICBzYW5keWJyb3duOiBbMjQ0LDE2NCw5Nl0sXG4gIHNlYWdyZWVuOiBbNDYsMTM5LDg3XSxcbiAgc2Vhc2hlbGw6IFsyNTUsMjQ1LDIzOF0sXG4gIHNpZW5uYTogWzE2MCw4Miw0NV0sXG4gIHNpbHZlcjogWzE5MiwxOTIsMTkyXSxcbiAgc2t5Ymx1ZTogIFsxMzUsMjA2LDIzNV0sXG4gIHNsYXRlYmx1ZTogIFsxMDYsOTAsMjA1XSxcbiAgc2xhdGVncmF5OiAgWzExMiwxMjgsMTQ0XSxcbiAgc2xhdGVncmV5OiAgWzExMiwxMjgsMTQ0XSxcbiAgc25vdzogWzI1NSwyNTAsMjUwXSxcbiAgc3ByaW5nZ3JlZW46ICBbMCwyNTUsMTI3XSxcbiAgc3RlZWxibHVlOiAgWzcwLDEzMCwxODBdLFxuICB0YW46ICBbMjEwLDE4MCwxNDBdLFxuICB0ZWFsOiBbMCwxMjgsMTI4XSxcbiAgdGhpc3RsZTogIFsyMTYsMTkxLDIxNl0sXG4gIHRvbWF0bzogWzI1NSw5OSw3MV0sXG4gIHR1cnF1b2lzZTogIFs2NCwyMjQsMjA4XSxcbiAgdmlvbGV0OiBbMjM4LDEzMCwyMzhdLFxuICB3aGVhdDogIFsyNDUsMjIyLDE3OV0sXG4gIHdoaXRlOiAgWzI1NSwyNTUsMjU1XSxcbiAgd2hpdGVzbW9rZTogWzI0NSwyNDUsMjQ1XSxcbiAgeWVsbG93OiBbMjU1LDI1NSwwXSxcbiAgeWVsbG93Z3JlZW46ICBbMTU0LDIwNSw1MF1cbn07XG5cbnZhciByZXZlcnNlS2V5d29yZHMgPSB7fTtcbmZvciAodmFyIGtleSBpbiBjc3NLZXl3b3Jkcykge1xuICByZXZlcnNlS2V5d29yZHNbSlNPTi5zdHJpbmdpZnkoY3NzS2V5d29yZHNba2V5XSldID0ga2V5O1xufVxuIiwidmFyIGNvbnZlcnNpb25zID0gcmVxdWlyZShcIi4vY29udmVyc2lvbnNcIik7XG5cbnZhciBjb252ZXJ0ID0gZnVuY3Rpb24oKSB7XG4gICByZXR1cm4gbmV3IENvbnZlcnRlcigpO1xufVxuXG5mb3IgKHZhciBmdW5jIGluIGNvbnZlcnNpb25zKSB7XG4gIC8vIGV4cG9ydCBSYXcgdmVyc2lvbnNcbiAgY29udmVydFtmdW5jICsgXCJSYXdcIl0gPSAgKGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAvLyBhY2NlcHQgYXJyYXkgb3IgcGxhaW4gYXJnc1xuICAgIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnID09IFwibnVtYmVyXCIpXG4gICAgICAgIGFyZyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gY29udmVyc2lvbnNbZnVuY10oYXJnKTtcbiAgICB9XG4gIH0pKGZ1bmMpO1xuXG4gIHZhciBwYWlyID0gLyhcXHcrKTIoXFx3KykvLmV4ZWMoZnVuYyksXG4gICAgICBmcm9tID0gcGFpclsxXSxcbiAgICAgIHRvID0gcGFpclsyXTtcblxuICAvLyBleHBvcnQgcmdiMmhzbCBhbmQgW1wicmdiXCJdW1wiaHNsXCJdXG4gIGNvbnZlcnRbZnJvbV0gPSBjb252ZXJ0W2Zyb21dIHx8IHt9O1xuXG4gIGNvbnZlcnRbZnJvbV1bdG9dID0gY29udmVydFtmdW5jXSA9IChmdW5jdGlvbihmdW5jKSB7IFxuICAgIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnID09IFwibnVtYmVyXCIpXG4gICAgICAgIGFyZyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBcbiAgICAgIHZhciB2YWwgPSBjb252ZXJzaW9uc1tmdW5jXShhcmcpO1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gXCJzdHJpbmdcIiB8fCB2YWwgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHZhbDsgLy8ga2V5d29yZFxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKylcbiAgICAgICAgdmFsW2ldID0gTWF0aC5yb3VuZCh2YWxbaV0pO1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gIH0pKGZ1bmMpO1xufVxuXG5cbi8qIENvbnZlcnRlciBkb2VzIGxhenkgY29udmVyc2lvbiBhbmQgY2FjaGluZyAqL1xudmFyIENvbnZlcnRlciA9IGZ1bmN0aW9uKCkge1xuICAgdGhpcy5jb252cyA9IHt9O1xufTtcblxuLyogRWl0aGVyIGdldCB0aGUgdmFsdWVzIGZvciBhIHNwYWNlIG9yXG4gIHNldCB0aGUgdmFsdWVzIGZvciBhIHNwYWNlLCBkZXBlbmRpbmcgb24gYXJncyAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5yb3V0ZVNwYWNlID0gZnVuY3Rpb24oc3BhY2UsIGFyZ3MpIHtcbiAgIHZhciB2YWx1ZXMgPSBhcmdzWzBdO1xuICAgaWYgKHZhbHVlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb2xvci5yZ2IoKVxuICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVzKHNwYWNlKTtcbiAgIH1cbiAgIC8vIGNvbG9yLnJnYigxMCwgMTAsIDEwKVxuICAgaWYgKHR5cGVvZiB2YWx1ZXMgPT0gXCJudW1iZXJcIikge1xuICAgICAgdmFsdWVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncyk7ICAgICAgICBcbiAgIH1cblxuICAgcmV0dXJuIHRoaXMuc2V0VmFsdWVzKHNwYWNlLCB2YWx1ZXMpO1xufTtcbiAgXG4vKiBTZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZSwgaW52YWxpZGF0aW5nIGNhY2hlICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLnNldFZhbHVlcyA9IGZ1bmN0aW9uKHNwYWNlLCB2YWx1ZXMpIHtcbiAgIHRoaXMuc3BhY2UgPSBzcGFjZTtcbiAgIHRoaXMuY29udnMgPSB7fTtcbiAgIHRoaXMuY29udnNbc3BhY2VdID0gdmFsdWVzO1xuICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKiBHZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZS4gSWYgdGhlcmUncyBhbHJlYWR5XG4gIGEgY29udmVyc2lvbiBmb3IgdGhlIHNwYWNlLCBmZXRjaCBpdCwgb3RoZXJ3aXNlXG4gIGNvbXB1dGUgaXQgKi9cbkNvbnZlcnRlci5wcm90b3R5cGUuZ2V0VmFsdWVzID0gZnVuY3Rpb24oc3BhY2UpIHtcbiAgIHZhciB2YWxzID0gdGhpcy5jb252c1tzcGFjZV07XG4gICBpZiAoIXZhbHMpIHtcbiAgICAgIHZhciBmc3BhY2UgPSB0aGlzLnNwYWNlLFxuICAgICAgICAgIGZyb20gPSB0aGlzLmNvbnZzW2ZzcGFjZV07XG4gICAgICB2YWxzID0gY29udmVydFtmc3BhY2VdW3NwYWNlXShmcm9tKTtcblxuICAgICAgdGhpcy5jb252c1tzcGFjZV0gPSB2YWxzO1xuICAgfVxuICByZXR1cm4gdmFscztcbn07XG5cbltcInJnYlwiLCBcImhzbFwiLCBcImhzdlwiLCBcImNteWtcIiwgXCJrZXl3b3JkXCJdLmZvckVhY2goZnVuY3Rpb24oc3BhY2UpIHtcbiAgIENvbnZlcnRlci5wcm90b3R5cGVbc3BhY2VdID0gZnVuY3Rpb24odmFscykge1xuICAgICAgcmV0dXJuIHRoaXMucm91dGVTcGFjZShzcGFjZSwgYXJndW1lbnRzKTtcbiAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnZlcnQ7IiwiLyohXHJcbiAqIEBuYW1lIEphdmFTY3JpcHQvTm9kZUpTIE1lcmdlIHYxLjIuMFxyXG4gKiBAYXV0aG9yIHllaWtvc1xyXG4gKiBAcmVwb3NpdG9yeSBodHRwczovL2dpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlXHJcblxyXG4gKiBDb3B5cmlnaHQgMjAxNCB5ZWlrb3MgLSBNSVQgbGljZW5zZVxyXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZS9tYXN0ZXIvTElDRU5TRVxyXG4gKi9cclxuXHJcbjsoZnVuY3Rpb24oaXNOb2RlKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIG9uZSBvciBtb3JlIG9iamVjdHMgXHJcblx0ICogQHBhcmFtIGJvb2w/IGNsb25lXHJcblx0ICogQHBhcmFtIG1peGVkLC4uLiBhcmd1bWVudHNcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHR2YXIgUHVibGljID0gZnVuY3Rpb24oY2xvbmUpIHtcclxuXHJcblx0XHRyZXR1cm4gbWVyZ2UoY2xvbmUgPT09IHRydWUsIGZhbHNlLCBhcmd1bWVudHMpO1xyXG5cclxuXHR9LCBwdWJsaWNOYW1lID0gJ21lcmdlJztcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9yIG1vcmUgb2JqZWN0cyByZWN1cnNpdmVseSBcclxuXHQgKiBAcGFyYW0gYm9vbD8gY2xvbmVcclxuXHQgKiBAcGFyYW0gbWl4ZWQsLi4uIGFyZ3VtZW50c1xyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdFB1YmxpYy5yZWN1cnNpdmUgPSBmdW5jdGlvbihjbG9uZSkge1xyXG5cclxuXHRcdHJldHVybiBtZXJnZShjbG9uZSA9PT0gdHJ1ZSwgdHJ1ZSwgYXJndW1lbnRzKTtcclxuXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogQ2xvbmUgdGhlIGlucHV0IHJlbW92aW5nIGFueSByZWZlcmVuY2VcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcmV0dXJuIG1peGVkXHJcblx0ICovXHJcblxyXG5cdFB1YmxpYy5jbG9uZSA9IGZ1bmN0aW9uKGlucHV0KSB7XHJcblxyXG5cdFx0dmFyIG91dHB1dCA9IGlucHV0LFxyXG5cdFx0XHR0eXBlID0gdHlwZU9mKGlucHV0KSxcclxuXHRcdFx0aW5kZXgsIHNpemU7XHJcblxyXG5cdFx0aWYgKHR5cGUgPT09ICdhcnJheScpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IFtdO1xyXG5cdFx0XHRzaXplID0gaW5wdXQubGVuZ3RoO1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleD0wO2luZGV4PHNpemU7KytpbmRleClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IFB1YmxpYy5jbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IHt9O1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleCBpbiBpbnB1dClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IFB1YmxpYy5jbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb2JqZWN0cyByZWN1cnNpdmVseVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEBwYXJhbSBtaXhlZCBleHRlbmRcclxuXHQgKiBAcmV0dXJuIG1peGVkXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIG1lcmdlX3JlY3Vyc2l2ZShiYXNlLCBleHRlbmQpIHtcclxuXHJcblx0XHRpZiAodHlwZU9mKGJhc2UpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJldHVybiBleHRlbmQ7XHJcblxyXG5cdFx0Zm9yICh2YXIga2V5IGluIGV4dGVuZCkge1xyXG5cclxuXHRcdFx0aWYgKHR5cGVPZihiYXNlW2tleV0pID09PSAnb2JqZWN0JyAmJiB0eXBlT2YoZXh0ZW5kW2tleV0pID09PSAnb2JqZWN0Jykge1xyXG5cclxuXHRcdFx0XHRiYXNlW2tleV0gPSBtZXJnZV9yZWN1cnNpdmUoYmFzZVtrZXldLCBleHRlbmRba2V5XSk7XHJcblxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRiYXNlW2tleV0gPSBleHRlbmRba2V5XTtcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGJhc2U7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9yIG1vcmUgb2JqZWN0c1xyXG5cdCAqIEBwYXJhbSBib29sIGNsb25lXHJcblx0ICogQHBhcmFtIGJvb2wgcmVjdXJzaXZlXHJcblx0ICogQHBhcmFtIGFycmF5IGFyZ3ZcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZShjbG9uZSwgcmVjdXJzaXZlLCBhcmd2KSB7XHJcblxyXG5cdFx0dmFyIHJlc3VsdCA9IGFyZ3ZbMF0sXHJcblx0XHRcdHNpemUgPSBhcmd2Lmxlbmd0aDtcclxuXHJcblx0XHRpZiAoY2xvbmUgfHwgdHlwZU9mKHJlc3VsdCkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmVzdWx0ID0ge307XHJcblxyXG5cdFx0Zm9yICh2YXIgaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpIHtcclxuXHJcblx0XHRcdHZhciBpdGVtID0gYXJndltpbmRleF0sXHJcblxyXG5cdFx0XHRcdHR5cGUgPSB0eXBlT2YoaXRlbSk7XHJcblxyXG5cdFx0XHRpZiAodHlwZSAhPT0gJ29iamVjdCcpIGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIga2V5IGluIGl0ZW0pIHtcclxuXHJcblx0XHRcdFx0dmFyIHNpdGVtID0gY2xvbmUgPyBQdWJsaWMuY2xvbmUoaXRlbVtrZXldKSA6IGl0ZW1ba2V5XTtcclxuXHJcblx0XHRcdFx0aWYgKHJlY3Vyc2l2ZSkge1xyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gbWVyZ2VfcmVjdXJzaXZlKHJlc3VsdFtrZXldLCBzaXRlbSk7XHJcblxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0cmVzdWx0W2tleV0gPSBzaXRlbTtcclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldCB0eXBlIG9mIHZhcmlhYmxlXHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHJldHVybiBzdHJpbmdcclxuXHQgKlxyXG5cdCAqIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vdHlwZW9mdmFyXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIHR5cGVPZihpbnB1dCkge1xyXG5cclxuXHRcdHJldHVybiAoe30pLnRvU3RyaW5nLmNhbGwoaW5wdXQpLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHR9XHJcblxyXG5cdGlmIChpc05vZGUpIHtcclxuXHJcblx0XHRtb2R1bGUuZXhwb3J0cyA9IFB1YmxpYztcclxuXHJcblx0fSBlbHNlIHtcclxuXHJcblx0XHR3aW5kb3dbcHVibGljTmFtZV0gPSBQdWJsaWM7XHJcblxyXG5cdH1cclxuXHJcbn0pKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKTsiLCI7KGZ1bmN0aW9uIChjb21tb25qcykge1xuICBmdW5jdGlvbiBlcnJvck9iamVjdChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQ2FsbHNGcm9tT3duZXIoZnVuY3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTGV0IHRoZSBvdGhlciBzaWRlIGtub3cgYWJvdXQgb3VyIGZ1bmN0aW9ucyBpZiB0aGV5IGNhbid0IHVzZSBQcm94eS5cbiAgICAgIHZhciBuYW1lcyA9IFtdO1xuICAgICAgZm9yICh2YXIgbmFtZSBpbiBmdW5jdGlvbnMpIG5hbWVzLnB1c2gobmFtZSk7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKHtmdW5jdGlvbk5hbWVzOiBuYW1lc30pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGlkKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9KTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2suZGlzYWJsZUF1dG8gPSBmdW5jdGlvbiAoKSB7IGNhbGxiYWNrLl9hdXRvRGlzYWJsZWQgPSB0cnVlOyB9O1xuXG4gICAgICBjYWxsYmFjay50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9LCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrO1xuICAgIH1cblxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbCkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsSWQ7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLlxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnNbbWVzc2FnZS5jYWxsXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsbFJlc3BvbnNlOiBjYWxsSWQsXG4gICAgICAgICAgICBhcmd1bWVudHM6IFtlcnJvck9iamVjdChuZXcgRXJyb3IoJ1RoYXQgZnVuY3Rpb24gZG9lcyBub3QgZXhpc3QnKSldXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBtZXNzYWdlLmFyZ3VtZW50cyB8fCBbXTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY3JlYXRlQ2FsbGJhY2soY2FsbElkKTtcbiAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgICAgIGlmIChvcHRpb25zLmNhdGNoRXJyb3JzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvck9iamVjdChlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBvcHRpb24gZm9yIGl0IGlzIGVuYWJsZWQsIGF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2suXG4gICAgICAgIGlmIChvcHRpb25zLmF1dG9DYWxsYmFjayAmJiAhY2FsbGJhY2suX2F1dG9EaXNhYmxlZCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldHVyblZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vycywgb3B0aW9ucykge1xuICAgIHZhciBjYWNoZSA9IHt9LFxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcbiAgICAgICAgdGltZXJzLFxuICAgICAgICBuZXh0Q2FsbElkID0gMSxcbiAgICAgICAgZmFrZVByb3h5LFxuICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGFycmF5IG9mIG51bWJlciBvZiBwZW5kaW5nIHRhc2tzIGZvciBlYWNoIHdvcmtlci5cbiAgICB2YXIgcGVuZGluZyA9IHdvcmtlcnMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDA7IH0pO1xuXG4gICAgLy8gRWFjaCBpbmRpdmlkdWFsIGNhbGwgZ2V0cyBhIHRpbWVyIGlmIHRpbWluZyBjYWxscy5cbiAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHRpbWVycyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBQcm94eSBzdXBwb3J0LCB3ZSBoYXZlIHRvIHByZS1kZWZpbmUgYWxsIHRoZSBmdW5jdGlvbnMuXG4gICAgICBmYWtlUHJveHkgPSB7cGVuZGluZ0NhbGxzOiAwfTtcbiAgICAgIG9wdGlvbnMuZnVuY3Rpb25OYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROdW1QZW5kaW5nQ2FsbHMoKSB7XG4gICAgICByZXR1cm4gcXVldWUubGVuZ3RoICsgcGVuZGluZy5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKF8sIG5hbWUpIHtcbiAgICAgIGlmIChuYW1lID09ICdwZW5kaW5nQ2FsbHMnKSByZXR1cm4gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXTtcblxuICAgICAgdmFyIGZuID0gY2FjaGVbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MpO1xuICAgICAgfTtcblxuICAgICAgLy8gU2VuZHMgdGhlIHNhbWUgY2FsbCB0byBhbGwgd29ya2Vycy5cbiAgICAgIGZuLmJyb2FkY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzZW5kQ2FsbChpLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBNYXJrcyB0aGUgb2JqZWN0cyBpbiB0aGUgZmlyc3QgYXJndW1lbnQgKGFycmF5KSBhcyB0cmFuc2ZlcmFibGUuXG4gICAgICBmbi50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncywgdHJhbnNmZXJMaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlKCkge1xuICAgICAgLy8gS2VlcCB0aGUgZmFrZSBwcm94eSBwZW5kaW5nIGNvdW50IHVwLXRvLWRhdGUuXG4gICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG5cbiAgICAgIGlmICghcXVldWUubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGVuZGluZ1tpXSkgY29udGludWU7XG5cbiAgICAgICAgLy8gQSB3b3JrZXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICB2YXIgcGFyYW1zID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgc2VuZENhbGwoaSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSk7XG5cbiAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUNhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgcXVldWUucHVzaChbbmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdF0pO1xuICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRDYWxsKHdvcmtlckluZGV4LCBuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICAvLyBHZXQgdGhlIHdvcmtlciBhbmQgaW5kaWNhdGUgdGhhdCBpdCBoYXMgYSBwZW5kaW5nIHRhc2suXG4gICAgICBwZW5kaW5nW3dvcmtlckluZGV4XSsrO1xuICAgICAgdmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySW5kZXhdO1xuXG4gICAgICB2YXIgaWQgPSBuZXh0Q2FsbElkKys7XG5cbiAgICAgIC8vIElmIHRoZSBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGFzc3VtZSBpdCdzIHRoZSBjYWxsYmFjay5cbiAgICAgIHZhciBtYXliZUNiID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHR5cGVvZiBtYXliZUNiID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2tzW2lkXSA9IG1heWJlQ2I7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgc3BlY2lmaWVkLCB0aW1lIGNhbGxzIHVzaW5nIHRoZSBjb25zb2xlLnRpbWUgaW50ZXJmYWNlLlxuICAgICAgaWYgKG9wdGlvbnMudGltZUNhbGxzKSB7XG4gICAgICAgIHZhciB0aW1lcklkID0gbmFtZSArICcoJyArIGFyZ3Muam9pbignLCAnKSArICcpJztcbiAgICAgICAgdGltZXJzW2lkXSA9IHRpbWVySWQ7XG4gICAgICAgIGNvbnNvbGUudGltZSh0aW1lcklkKTtcbiAgICAgIH1cblxuICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtjYWxsSWQ6IGlkLCBjYWxsOiBuYW1lLCBhcmd1bWVudHM6IGFyZ3N9LCBvcHRfdHJhbnNmZXJMaXN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcihlKSB7XG4gICAgICB2YXIgd29ya2VySW5kZXggPSB3b3JrZXJzLmluZGV4T2YodGhpcyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbFJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxSZXNwb25zZTtcblxuICAgICAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayByZWdpc3RlcmVkIGZvciB0aGlzIGNhbGwgKGlmIGFueSkuXG4gICAgICAgIGlmIChjYWxsYmFja3NbY2FsbElkXSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tjYWxsSWRdLmFwcGx5KG51bGwsIG1lc3NhZ2UuYXJndW1lbnRzKTtcbiAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxJZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBvcnQgdGltaW5nLCBpZiB0aGF0IG9wdGlvbiBpcyBlbmFibGVkLlxuICAgICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMgJiYgdGltZXJzW2NhbGxJZF0pIHtcbiAgICAgICAgICBjb25zb2xlLnRpbWVFbmQodGltZXJzW2NhbGxJZF0pO1xuICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyB0YXNrIGlzIG5vIGxvbmdlciBwZW5kaW5nIG9uIHRoZSB3b3JrZXIuXG4gICAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdLS07XG4gICAgICAgIGZsdXNoUXVldWUoKTtcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5mdW5jdGlvbk5hbWVzKSB7XG4gICAgICAgIC8vIFJlY2VpdmVkIGEgbGlzdCBvZiBhdmFpbGFibGUgZnVuY3Rpb25zLiBPbmx5IHVzZWZ1bCBmb3IgZmFrZSBwcm94eS5cbiAgICAgICAgbWVzc2FnZS5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICBmYWtlUHJveHlbbmFtZV0gPSBnZXRIYW5kbGVyKG51bGwsIG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gbWVzc2FnZXMgZnJvbSBhbGwgdGhlIHdvcmtlcnMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3b3JrZXJzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZha2VQcm94eTtcbiAgICB9IGVsc2UgaWYgKFByb3h5LmNyZWF0ZSkge1xuICAgICAgcmV0dXJuIFByb3h5LmNyZWF0ZSh7Z2V0OiBnZXRIYW5kbGVyfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoe30sIHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggZWl0aGVyIGEgV29ya2VyIGluc3RhbmNlLCBhIGxpc3Qgb2YgdGhlbSwgb3IgYSBtYXBcbiAgICogb2YgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCBpbnNpZGUgdGhlIHdvcmtlci5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZVdvcmtlclByb3h5KHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0X29wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2sgYWZ0ZXIgYSBjYWxsIGlmIHRoZSByZXR1cm4gdmFsdWUgaXMgbm90XG4gICAgICAvLyB1bmRlZmluZWQuXG4gICAgICBhdXRvQ2FsbGJhY2s6IGZhbHNlLFxuICAgICAgLy8gQ2F0Y2ggZXJyb3JzIGFuZCBhdXRvbWF0aWNhbGx5IHJlc3BvbmQgd2l0aCBhbiBlcnJvciBjYWxsYmFjay4gT2ZmIGJ5XG4gICAgICAvLyBkZWZhdWx0IHNpbmNlIGl0IGJyZWFrcyBzdGFuZGFyZCBiZWhhdmlvci5cbiAgICAgIGNhdGNoRXJyb3JzOiBmYWxzZSxcbiAgICAgIC8vIEEgbGlzdCBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkLiBUaGlzIGxpc3Qgd2lsbCBiZSB1c2VkIHRvIG1ha2VcbiAgICAgIC8vIHRoZSBwcm94eSBmdW5jdGlvbnMgYXZhaWxhYmxlIHdoZW4gUHJveHkgaXMgbm90IHN1cHBvcnRlZC4gTm90ZSB0aGF0XG4gICAgICAvLyB0aGlzIGlzIGdlbmVyYWxseSBub3QgbmVlZGVkIHNpbmNlIHRoZSB3b3JrZXIgd2lsbCBhbHNvIHB1Ymxpc2ggaXRzXG4gICAgICAvLyBrbm93biBmdW5jdGlvbnMuXG4gICAgICBmdW5jdGlvbk5hbWVzOiBbXSxcbiAgICAgIC8vIENhbGwgY29uc29sZS50aW1lIGFuZCBjb25zb2xlLnRpbWVFbmQgZm9yIGNhbGxzIHNlbnQgdGhvdWdoIHRoZSBwcm94eS5cbiAgICAgIHRpbWVDYWxsczogZmFsc2VcbiAgICB9O1xuXG4gICAgaWYgKG9wdF9vcHRpb25zKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb3B0X29wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG9wdGlvbnMpKSBjb250aW51ZTtcbiAgICAgICAgb3B0aW9uc1trZXldID0gb3B0X29wdGlvbnNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYW4gYXJyYXkgb2Ygd29ya2VycyAoZXZlbiBpZiBvbmx5IHVzaW5nIG9uZSB3b3JrZXIpLlxuICAgIGlmICh0eXBlb2YgV29ya2VyICE9ICd1bmRlZmluZWQnICYmICh3b3JrZXJzT3JGdW5jdGlvbnMgaW5zdGFuY2VvZiBXb3JrZXIpKSB7XG4gICAgICB3b3JrZXJzT3JGdW5jdGlvbnMgPSBbd29ya2Vyc09yRnVuY3Rpb25zXTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3b3JrZXJzT3JGdW5jdGlvbnMpKSB7XG4gICAgICByZXR1cm4gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjZWl2ZUNhbGxzRnJvbU93bmVyKHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbW1vbmpzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcGU7XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gZ2xvYmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSB3aW5kb3c7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBzZWxmO1xuICAgIH1cblxuICAgIHNjb3BlLmNyZWF0ZVdvcmtlclByb3h5ID0gY3JlYXRlV29ya2VyUHJveHk7XG4gIH1cbn0pKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuIiwiZXhwb3J0cy5Xb3JsZCA9IHJlcXVpcmUoJy4vbGliL3dvcmxkJyk7XG5leHBvcnRzLldvcmxkTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL3dvcmxkbWFuYWdlcicpO1xuZXhwb3J0cy5Xb3JsZFJlbmRlcmVyID0gcmVxdWlyZSgnLi9saWIvd29ybGRyZW5kZXJlcicpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWdpb25SZW5kZXJlcjtcblxuXG52YXIgVElMRVNfWCA9IDMyO1xudmFyIFRJTEVTX1kgPSAzMjtcbnZhciBUSUxFU19QRVJfUkVHSU9OID0gVElMRVNfWCAqIFRJTEVTX1k7XG5cbnZhciBIRUFERVJfQllURVMgPSAzO1xudmFyIEJZVEVTX1BFUl9USUxFID0gMzA7XG52YXIgQllURVNfUEVSX1JPVyA9IEJZVEVTX1BFUl9USUxFICogVElMRVNfWDtcbnZhciBCWVRFU19QRVJfUkVHSU9OID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1RJTEUgKiBUSUxFU19QRVJfUkVHSU9OO1xuXG52YXIgVElMRV9XSURUSCA9IDg7XG52YXIgVElMRV9IRUlHSFQgPSA4O1xuXG52YXIgUkVHSU9OX1dJRFRIID0gVElMRV9XSURUSCAqIFRJTEVTX1g7XG52YXIgUkVHSU9OX0hFSUdIVCA9IFRJTEVfSEVJR0hUICogVElMRVNfWTtcblxuXG5mdW5jdGlvbiBnZXRJbnQxNihyZWdpb24sIG9mZnNldCkge1xuICBpZiAocmVnaW9uICYmIHJlZ2lvbi52aWV3KSByZXR1cm4gcmVnaW9uLnZpZXcuZ2V0SW50MTYob2Zmc2V0KTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZW50YXRpb24ob3JpZW50YXRpb25zLCBpbmRleCkge1xuICB2YXIgY3VySW5kZXggPSAwLCBpbWFnZSwgZGlyZWN0aW9uO1xuXG4gIC8vIFRoaXMgaXMgYSB0cmVtZW5kb3VzIGFtb3VudCBvZiBsb2dpYyBmb3IgZGVjaWRpbmcgd2hpY2ggaW1hZ2UgdG8gdXNlLi4uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZW50YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG8gPSBvcmllbnRhdGlvbnNbaV07XG4gICAgaWYgKGN1ckluZGV4ID09IGluZGV4KSB7XG4gICAgICBpZiAoby5pbWFnZUxheWVycykge1xuICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IG11bHRpcGxlIGxheWVycy5cbiAgICAgICAgaW1hZ2UgPSBvLmltYWdlTGF5ZXJzWzBdLmltYWdlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UgPSBvLmltYWdlIHx8IG8ubGVmdEltYWdlIHx8IG8uZHVhbEltYWdlO1xuICAgICAgfVxuICAgICAgZGlyZWN0aW9uID0gby5kaXJlY3Rpb24gfHwgJ2xlZnQnO1xuICAgICAgaWYgKCFpbWFnZSkgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZ2V0IGltYWdlIGZvciBvcmllbnRhdGlvbicpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY3VySW5kZXgrKztcblxuICAgIGlmIChvLmR1YWxJbWFnZSB8fCBvLnJpZ2h0SW1hZ2UpIHtcbiAgICAgIGlmIChjdXJJbmRleCA9PSBpbmRleCkge1xuICAgICAgICBpbWFnZSA9IG8ucmlnaHRJbWFnZSB8fCBvLmR1YWxJbWFnZTtcbiAgICAgICAgZGlyZWN0aW9uID0gJ3JpZ2h0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGN1ckluZGV4Kys7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbWFnZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCBvcmllbnRhdGlvbicpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbWFnZTogaW1hZ2UsXG4gICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgZmxpcDogby5mbGlwSW1hZ2VzIHx8ICEhKG8uZHVhbEltYWdlICYmIGRpcmVjdGlvbiA9PSAnbGVmdCcpLFxuICAgIGluZm86IG9cbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VWludDgocmVnaW9uLCBvZmZzZXQpIHtcbiAgaWYgKHJlZ2lvbiAmJiByZWdpb24udmlldykgcmV0dXJuIHJlZ2lvbi52aWV3LmdldFVpbnQ4KG9mZnNldCk7XG59XG5cblxuZnVuY3Rpb24gUmVnaW9uUmVuZGVyZXIoeCwgeSkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuICB0aGlzLnRpbGVYID0geCAqIFRJTEVTX1g7XG4gIHRoaXMudGlsZVkgPSB5ICogVElMRVNfWTtcblxuICB0aGlzLmVudGl0aWVzID0gbnVsbDtcbiAgdGhpcy52aWV3ID0gbnVsbDtcblxuICB0aGlzLm5laWdoYm9ycyA9IG51bGw7XG4gIHRoaXMuc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9VTklOSVRJQUxJWkVEO1xuXG4gIC8vIFdoZXRoZXIgYSBsYXllciBuZWVkcyB0byBiZSByZXJlbmRlcmVkLlxuICB0aGlzLmRpcnR5ID0ge2JhY2tncm91bmQ6IGZhbHNlLCBmb3JlZ3JvdW5kOiBmYWxzZSwgc3ByaXRlczogZmFsc2V9O1xuXG4gIHRoaXMuX3Nwcml0ZXNNaW5YID0gMDtcbiAgdGhpcy5fc3ByaXRlc01pblkgPSAwO1xufVxuXG5SZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUiA9IC0xO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JVElBTElaRUQgPSAwO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORyA9IDE7XG5SZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSA9IDI7XG5cbi8vIFRPRE86IEltcGxlbWVudCBzdXBwb3J0IGZvciByZW5kZXJpbmcgb25seSBhIHBhcnQgb2YgdGhlIHJlZ2lvbi5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgaWYgKHRoaXMuc3RhdGUgIT0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfUkVBRFkpIHJldHVybjtcblxuICB0aGlzLl9yZW5kZXJFbnRpdGllcyhyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSk7XG4gIHRoaXMuX3JlbmRlclRpbGVzKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS51bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZW50aXRpZXMgPSBudWxsO1xuICB0aGlzLnZpZXcgPSBudWxsO1xuXG4gIHRoaXMubmVpZ2hib3JzID0gbnVsbDtcbiAgdGhpcy5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1VOSU5JVElBTElaRUQ7XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlckVudGl0aWVzID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKSB7XG4gIHZhciBjYW52YXMgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMik7XG4gIGlmICghdGhpcy5kaXJ0eS5zcHJpdGVzKSB7XG4gICAgY2FudmFzLnN0eWxlLmxlZnQgPSAob2Zmc2V0WCArIHRoaXMuX3Nwcml0ZXNNaW5YICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5ib3R0b20gPSAob2Zmc2V0WSArIChSRUdJT05fSEVJR0hUIC0gdGhpcy5fc3ByaXRlc01heFkpICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICB9XG5cbiAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gZmFsc2U7XG5cbiAgdmFyIG1pblggPSAwLCBtYXhYID0gMCwgbWluWSA9IDAsIG1heFkgPSAwLFxuICAgICAgb3JpZ2luWCA9IHRoaXMueCAqIFRJTEVTX1gsIG9yaWdpblkgPSB0aGlzLnkgKiBUSUxFU19ZLFxuICAgICAgYWxsU3ByaXRlcyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldLFxuICAgICAgICBzcHJpdGVzID0gbnVsbDtcblxuICAgIHN3aXRjaCAoZW50aXR5Ll9fbmFtZV9fICsgZW50aXR5Ll9fdmVyc2lvbl9fKSB7XG4gICAgICBjYXNlICdJdGVtRHJvcEVudGl0eTEnOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVySXRlbShyZW5kZXJlciwgZW50aXR5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNb25zdGVyRW50aXR5MSc6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJNb25zdGVyKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ05wY0VudGl0eTEnOlxuICAgICAgICAvLyBUT0RPOiBDb252ZXJ0IHRvIHZlcnNpb24gMiBiZWZvcmUgcmVuZGVyaW5nLlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ05wY0VudGl0eTInOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVyTlBDKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ09iamVjdEVudGl0eTEnOlxuICAgICAgICAvLyBUT0RPOiBQb3RlbnRpYWwgY29udmVyc2lvbiBjb2RlLlxuICAgICAgY2FzZSAnT2JqZWN0RW50aXR5Mic6XG4gICAgICAgIC8vIFRPRE86IFBvdGVudGlhbCBjb252ZXJzaW9uIGNvZGUuXG4gICAgICBjYXNlICdPYmplY3RFbnRpdHkzJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlck9iamVjdChyZW5kZXJlciwgZW50aXR5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdQbGFudEVudGl0eTEnOlxuICAgICAgY2FzZSAnUGxhbnRFbnRpdHkyJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlclBsYW50KHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybignVW5zdXBwb3J0ZWQgZW50aXR5L3ZlcnNpb246JywgZW50aXR5KTtcbiAgICB9XG5cbiAgICBpZiAoc3ByaXRlcykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzcHJpdGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBzcHJpdGUgPSBzcHJpdGVzW2pdO1xuICAgICAgICBpZiAoIXNwcml0ZSB8fCAhc3ByaXRlLmltYWdlKSB7XG4gICAgICAgICAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3ByaXRlLnN4KSBzcHJpdGUuc3ggPSAwO1xuICAgICAgICBpZiAoIXNwcml0ZS5zeSkgc3ByaXRlLnN5ID0gMDtcbiAgICAgICAgaWYgKCFzcHJpdGUud2lkdGgpIHNwcml0ZS53aWR0aCA9IHNwcml0ZS5pbWFnZS53aWR0aDtcbiAgICAgICAgaWYgKCFzcHJpdGUuaGVpZ2h0KSBzcHJpdGUuaGVpZ2h0ID0gc3ByaXRlLmltYWdlLmhlaWdodDtcblxuICAgICAgICBzcHJpdGUuY2FudmFzWCA9IChzcHJpdGUueCAtIG9yaWdpblgpICogVElMRV9XSURUSDtcbiAgICAgICAgc3ByaXRlLmNhbnZhc1kgPSBSRUdJT05fSEVJR0hUIC0gKHNwcml0ZS55IC0gb3JpZ2luWSkgKiBUSUxFX0hFSUdIVCAtIHNwcml0ZS5oZWlnaHQ7XG5cbiAgICAgICAgbWluWCA9IE1hdGgubWluKHNwcml0ZS5jYW52YXNYLCBtaW5YKTtcbiAgICAgICAgbWF4WCA9IE1hdGgubWF4KHNwcml0ZS5jYW52YXNYICsgc3ByaXRlLndpZHRoLCBtYXhYKTtcbiAgICAgICAgbWluWSA9IE1hdGgubWluKHNwcml0ZS5jYW52YXNZLCBtaW5ZKTtcbiAgICAgICAgbWF4WSA9IE1hdGgubWF4KHNwcml0ZS5jYW52YXNZICsgc3ByaXRlLmhlaWdodCwgbWF4WSk7XG5cbiAgICAgICAgYWxsU3ByaXRlcy5wdXNoKHNwcml0ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlydHkuc3ByaXRlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhpcyB3aWxsIHJlc2l6ZSB0aGUgY2FudmFzIGlmIG5lY2Vzc2FyeS5cbiAgY2FudmFzID0gcmVuZGVyZXIuZ2V0Q2FudmFzKHRoaXMsIDIsIG1heFggLSBtaW5YLCBtYXhZIC0gbWluWSk7XG4gIHRoaXMuX3Nwcml0ZXNNaW5YID0gbWluWDtcbiAgdGhpcy5fc3ByaXRlc01pblkgPSBtaW5ZO1xuXG4gIGlmIChhbGxTcHJpdGVzLmxlbmd0aCkge1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbFNwcml0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzcHJpdGUgPSBhbGxTcHJpdGVzW2ldO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2Uoc3ByaXRlLmltYWdlLCBzcHJpdGUuc3gsIHNwcml0ZS5zeSwgc3ByaXRlLndpZHRoLCBzcHJpdGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLW1pblggKyBzcHJpdGUuY2FudmFzWCwgLW1pblkgKyBzcHJpdGUuY2FudmFzWSwgc3ByaXRlLndpZHRoLCBzcHJpdGUuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBjYW52YXMuc3R5bGUubGVmdCA9IChvZmZzZXRYICsgbWluWCAqIHJlbmRlcmVyLnpvb20pICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuYm90dG9tID0gKG9mZnNldFkgKyAoUkVHSU9OX0hFSUdIVCAtIG1heFkpICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICB9IGVsc2Uge1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIH1cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVySXRlbSA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgaXRlbXMuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck1vbnN0ZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICAvLyBUT0RPOiBOb3Qgc3VyZSB3aGF0IHRvIGRvIGFib3V0IG1vbnN0ZXJzLlxufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJOUEMgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICAvLyBUT0RPOiBOb3Qgc3VyZSB3aGF0IHRvIGRvIGFib3V0IE5QQ3MuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck9iamVjdCA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIHZhciBvYmplY3RzID0gcmVuZGVyZXIub2JqZWN0cy5pbmRleDtcbiAgaWYgKCFvYmplY3RzKSByZXR1cm47XG5cbiAgdmFyIGFzc2V0cyA9IHJlbmRlcmVyLmFzc2V0cztcbiAgdmFyIGRlZiA9IG9iamVjdHNbZW50aXR5Lm5hbWVdO1xuICBpZiAoIWRlZikge1xuICAgIGNvbnNvbGUud2FybignT2JqZWN0IG5vdCBpbiBpbmRleDogJyArIGVudGl0eS5uYW1lKTtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoZGVmLmFuaW1hdGlvbikge1xuICAgIHZhciBhbmltYXRpb25QYXRoID0gYXNzZXRzLmdldFJlc291cmNlUGF0aChkZWYsIGRlZi5hbmltYXRpb24pO1xuICAgIC8vIFRPRE86IGFzc2V0cy5nZXRBbmltYXRpb24oYW5pbWF0aW9uUGF0aCk7XG4gIH1cblxuICB2YXIgb3JpZW50YXRpb24gPSBnZXRPcmllbnRhdGlvbihkZWYub3JpZW50YXRpb25zLCBlbnRpdHkub3JpZW50YXRpb25JbmRleCk7XG5cbiAgdmFyIHBhdGhBbmRGcmFtZSA9IG9yaWVudGF0aW9uLmltYWdlLnNwbGl0KCc6Jyk7XG4gIHZhciBpbWFnZVBhdGggPSBhc3NldHMuZ2V0UmVzb3VyY2VQYXRoKGRlZiwgcGF0aEFuZEZyYW1lWzBdKTtcbiAgdmFyIGZyYW1lcyA9IGFzc2V0cy5nZXRGcmFtZXMoaW1hZ2VQYXRoKTtcblxuICAvLyBGbGlwIGFsbCB0aGUgZnJhbWVzIGhvcml6b250YWxseSBpZiB0aGUgc3ByaXRlIGlzIHVzaW5nIGEgZHVhbCBpbWFnZS5cbiAgaWYgKG9yaWVudGF0aW9uLmZsaXApIHtcbiAgICBpZiAoIWZyYW1lcykgcmV0dXJuO1xuICAgIGltYWdlUGF0aCArPSAnP2ZsaXBncmlkeD0nICsgZnJhbWVzLmZyYW1lR3JpZC5zaXplWzBdO1xuICB9XG5cbiAgdmFyIGltYWdlID0gYXNzZXRzLmdldEltYWdlKGltYWdlUGF0aCk7XG4gIGlmICghZnJhbWVzIHx8ICFpbWFnZSkgcmV0dXJuO1xuXG4gIC8vIFRPRE86IEdldCB0aGUgY29ycmVjdCBmcmFtZSBpbiB0aGUgZnJhbWUgZ3JpZC5cblxuICB2YXIgc3ByaXRlID0ge1xuICAgIGltYWdlOiBpbWFnZSxcbiAgICB4OiBlbnRpdHkudGlsZVBvc2l0aW9uWzBdICsgb3JpZW50YXRpb24uaW5mby5pbWFnZVBvc2l0aW9uWzBdIC8gVElMRV9XSURUSCxcbiAgICB5OiBlbnRpdHkudGlsZVBvc2l0aW9uWzFdICsgb3JpZW50YXRpb24uaW5mby5pbWFnZVBvc2l0aW9uWzFdIC8gVElMRV9IRUlHSFQsXG4gICAgc3g6IDAsXG4gICAgc3k6IDAsXG4gICAgd2lkdGg6IGZyYW1lcy5mcmFtZUdyaWQuc2l6ZVswXSxcbiAgICBoZWlnaHQ6IGZyYW1lcy5mcmFtZUdyaWQuc2l6ZVsxXVxuICB9O1xuXG4gIHJldHVybiBbc3ByaXRlXTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyUGxhbnQgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICB2YXIgYXNzZXRzID0gcmVuZGVyZXIuYXNzZXRzLFxuICAgICAgcG9zaXRpb24gPSBlbnRpdHkudGlsZVBvc2l0aW9uLFxuICAgICAgeCA9IHBvc2l0aW9uWzBdLFxuICAgICAgeSA9IHBvc2l0aW9uWzFdO1xuXG4gIHJldHVybiBlbnRpdHkucGllY2VzLm1hcChmdW5jdGlvbiAocGllY2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaW1hZ2U6IGFzc2V0cy5nZXRJbWFnZShwaWVjZS5pbWFnZSksXG4gICAgICB4OiB4ICsgcGllY2Uub2Zmc2V0WzBdLFxuICAgICAgeTogeSArIHBpZWNlLm9mZnNldFsxXVxuICAgIH07XG4gIH0pO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJUaWxlcyA9IGZ1bmN0aW9uIChyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuICB2YXIgYmcgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMSwgUkVHSU9OX1dJRFRILCBSRUdJT05fSEVJR0hUKTtcbiAgYmcuc3R5bGUubGVmdCA9IG9mZnNldFggKyAncHgnO1xuICBiZy5zdHlsZS5ib3R0b20gPSBvZmZzZXRZICsgJ3B4JztcbiAgYmcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICB2YXIgZmcgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgNCwgUkVHSU9OX1dJRFRILCBSRUdJT05fSEVJR0hUKTtcbiAgZmcuc3R5bGUubGVmdCA9IG9mZnNldFggKyAncHgnO1xuICBmZy5zdHlsZS5ib3R0b20gPSBvZmZzZXRZICsgJ3B4JztcbiAgZmcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICBpZiAoIXRoaXMuZGlydHkuYmFja2dyb3VuZCAmJiAhdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kKSByZXR1cm47XG5cbiAgdmFyIGFzc2V0cyA9IHJlbmRlcmVyLmFzc2V0cyxcbiAgICAgIG1hdGVyaWFscyA9IHJlbmRlcmVyLm1hdGVyaWFscy5pbmRleCxcbiAgICAgIG1hdG1vZHMgPSByZW5kZXJlci5tYXRtb2RzLmluZGV4O1xuXG4gIC8vIERvbid0IGFsbG93IHJlbmRlcmluZyB1bnRpbCByZXNvdXJjZXMgYXJlIGluZGV4ZWQuXG4gIGlmICghbWF0ZXJpYWxzIHx8ICFtYXRtb2RzKSB7XG4gICAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFN0b3JlIGZsYWdzIGZvciBjaG9vc2luZyB3aGV0aGVyIHRvIHJlbmRlciBiYWNrZ3JvdW5kL2ZvcmVncm91bmQgdGlsZXMuXG4gIHZhciBkcmF3QmFja2dyb3VuZCA9IHRoaXMuZGlydHkuYmFja2dyb3VuZCB8fCB0aGlzLmRpcnR5LmZvcmVncm91bmQsXG4gICAgICBkcmF3Rm9yZWdyb3VuZCA9IHRoaXMuZGlydHkuZm9yZWdyb3VuZDtcblxuICAvLyBQcmVwYXJlIHRoZSByZW5kZXJpbmcgc3RlcC5cbiAgdmFyIGJnQ29udGV4dCA9IGJnLmdldENvbnRleHQoJzJkJyksIGZnQ29udGV4dCA9IGZnLmdldENvbnRleHQoJzJkJyk7XG4gIGlmIChkcmF3QmFja2dyb3VuZCkgYmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBiZy53aWR0aCwgYmcuaGVpZ2h0KTtcbiAgaWYgKGRyYXdGb3JlZ3JvdW5kKSBmZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGZnLndpZHRoLCBmZy5oZWlnaHQpO1xuXG4gIC8vIFJlc2V0IGRpcnR5IGZsYWdzIG5vdyBzbyB0aGF0IHRoZSBjb2RlIGJlbG93IGNhbiByZXNldCB0aGVtIGlmIG5lZWRlZC5cbiAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gZmFsc2U7XG4gIHRoaXMuZGlydHkuZm9yZWdyb3VuZCA9IGZhbHNlO1xuXG4gIHZhciB2aWV3ID0gdGhpcy52aWV3LFxuICAgICAgYmFja2dyb3VuZElkLCBmb3JlZ3JvdW5kSWQsIGZvcmVncm91bmQ7XG5cbiAgLy8gVXNlZCB0byBkYXJrZW4gYmFja2dyb3VuZCB0aWxlcy5cbiAgYmdDb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsIDAsIDAsIC41KSc7XG5cbiAgdmFyIG5laWdoYm9ycyA9IFtcbiAgICB0aGlzLCBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfUk9XLFxuICAgIHRoaXMsIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfVElMRSxcbiAgICBudWxsLCBudWxsLFxuICAgIHRoaXMubmVpZ2hib3JzWzRdLCBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFLFxuICAgIHRoaXMubmVpZ2hib3JzWzRdLCBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVyxcbiAgICB0aGlzLm5laWdoYm9yc1s1XSwgQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9USUxFLFxuICAgIG51bGwsIG51bGwsXG4gICAgdGhpcy5uZWlnaGJvcnNbNl0sIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEVcbiAgXTtcblxuICB2YXIgeCA9IDAsIHkgPSAwLCBzeCA9IDAsIHN5ID0gUkVHSU9OX0hFSUdIVCAtIFRJTEVfSEVJR0hUO1xuICBmb3IgKHZhciBvZmZzZXQgPSBIRUFERVJfQllURVM7IG9mZnNldCA8IEJZVEVTX1BFUl9SRUdJT047IG9mZnNldCArPSBCWVRFU19QRVJfVElMRSkge1xuICAgIGlmICh4ID09IDApIHtcbiAgICAgIG5laWdoYm9yc1s0XSA9IHRoaXM7XG4gICAgICBuZWlnaGJvcnNbNV0gPSBvZmZzZXQgKyBCWVRFU19QRVJfVElMRTtcblxuICAgICAgaWYgKHkgPT0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbOF0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbOV0gPSBIRUFERVJfQllURVM7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1sxMl0gPSB0aGlzLm5laWdoYm9yc1s2XTtcbiAgICAgIG5laWdoYm9yc1sxM10gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRSArIEJZVEVTX1BFUl9ST1c7XG5cbiAgICAgIGlmICh5ID09IFRJTEVTX1kgLSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1swXSA9IHRoaXMubmVpZ2hib3JzWzBdO1xuICAgICAgICBuZWlnaGJvcnNbMV0gPSBIRUFERVJfQllURVM7XG4gICAgICAgIG5laWdoYm9yc1syXSA9IHRoaXMubmVpZ2hib3JzWzBdO1xuICAgICAgICBuZWlnaGJvcnNbM10gPSBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfVElMRTtcbiAgICAgICAgbmVpZ2hib3JzWzE0XSA9IHRoaXMubmVpZ2hib3JzWzddO1xuICAgICAgICBuZWlnaGJvcnNbMTVdID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JPVyAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfSBlbHNlIGlmICh5ID4gMCkge1xuICAgICAgICBuZWlnaGJvcnNbNl0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBvZmZzZXQgLSBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1RJTEU7XG4gICAgICAgIG5laWdoYm9yc1sxMF0gPSB0aGlzLm5laWdoYm9yc1s2XTtcbiAgICAgICAgbmVpZ2hib3JzWzExXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcy5uZWlnaGJvcnNbNl07XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRSArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfUk9XO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeCA9PSAxKSB7XG4gICAgICBpZiAoeSA9PSAwKSB7XG4gICAgICAgIG5laWdoYm9yc1sxMF0gPSB0aGlzLm5laWdoYm9yc1s0XTtcbiAgICAgICAgbmVpZ2hib3JzWzExXSA9IEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3JzWzEwXSA9IHRoaXM7XG4gICAgICAgIG5laWdoYm9yc1sxMV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1sxMl0gPSB0aGlzO1xuICAgICAgbmVpZ2hib3JzWzEzXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFO1xuXG4gICAgICBpZiAoeSA9PSBUSUxFU19ZIC0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcy5uZWlnaGJvcnNbMF07XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBIRUFERVJfQllURVM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcztcbiAgICAgICAgbmVpZ2hib3JzWzE1XSA9IG9mZnNldCArIEJZVEVTX1BFUl9ST1cgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHggPT0gVElMRVNfWCAtIDEpIHtcbiAgICAgIGlmICh5ID09IFRJTEVTX1kgLSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1syXSA9IHRoaXMubmVpZ2hib3JzWzFdO1xuICAgICAgICBuZWlnaGJvcnNbM10gPSBIRUFERVJfQllURVM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbMl0gPSB0aGlzLm5laWdoYm9yc1syXTtcbiAgICAgICAgbmVpZ2hib3JzWzNdID0gb2Zmc2V0ICsgQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1s0XSA9IHRoaXMubmVpZ2hib3JzWzJdO1xuICAgICAgbmVpZ2hib3JzWzVdID0gb2Zmc2V0IC0gQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFO1xuXG4gICAgICBpZiAoeSA9PSAwKSB7XG4gICAgICAgIG5laWdoYm9yc1s2XSA9IHRoaXMubmVpZ2hib3JzWzNdO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5laWdoYm9yc1s2XSA9IHRoaXMubmVpZ2hib3JzWzJdO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3JlZ3JvdW5kSWQgPSB2aWV3LmdldEludDE2KG9mZnNldCk7XG4gICAgZm9yZWdyb3VuZCA9IG1hdGVyaWFsc1tmb3JlZ3JvdW5kSWRdO1xuXG4gICAgLy8gT25seSByZW5kZXIgdGhlIGJhY2tncm91bmQgaWYgdGhlIGZvcmVncm91bmQgZG9lc24ndCBjb3ZlciBpdC5cbiAgICBpZiAoZHJhd0JhY2tncm91bmQgJiYgKCFmb3JlZ3JvdW5kIHx8IGZvcmVncm91bmQudHJhbnNwYXJlbnQpKSB7XG4gICAgICB2YXIgdmFyaWFudCA9IHJlbmRlcmVyLmdldFZhcmlhbnQodGhpcy50aWxlWCArIHgsIHRoaXMudGlsZVkgKyB5LCB0cnVlKTtcbiAgICAgIGlmICghdGhpcy5fcmVuZGVyVGlsZShiZ0NvbnRleHQsIHN4LCBzeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgNywgdmFyaWFudCwgbmVpZ2hib3JzKSkge1xuICAgICAgICB0aGlzLmRpcnR5LmJhY2tncm91bmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBEYXJrZW4gYmFja2dyb3VuZCB0aWxlcy5cbiAgICAgIGJnQ29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWF0b3AnO1xuICAgICAgYmdDb250ZXh0LmZpbGxSZWN0KHN4LCBzeSwgOCwgOCk7XG4gICAgICBiZ0NvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdGhlIGZvcmVncm91bmQgdGlsZSBhbmQvb3IgZWRnZXMuXG4gICAgaWYgKGRyYXdGb3JlZ3JvdW5kKSB7XG4gICAgICB2YXIgdmFyaWFudCA9IHJlbmRlcmVyLmdldFZhcmlhbnQodGhpcy50aWxlWCArIHgsIHRoaXMudGlsZVkgKyB5KTtcbiAgICAgIGlmICghdGhpcy5fcmVuZGVyVGlsZShmZ0NvbnRleHQsIHN4LCBzeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgMCwgdmFyaWFudCwgbmVpZ2hib3JzKSkge1xuICAgICAgICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IE9ubHkgaW5jcmVtZW50IHRoZSBvZmZzZXRzIHRoYXQgYWN0dWFsbHkgbmVlZCBpdC5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IDE2OyBpICs9IDIpIHtcbiAgICAgIG5laWdoYm9yc1tpXSArPSBCWVRFU19QRVJfVElMRTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIG5leHQgc2V0IG9mIFgsIFkgY29vcmRpbmF0ZXMuXG4gICAgaWYgKCsreCA9PSAzMikge1xuICAgICAgeCA9IDA7IHkrKztcbiAgICAgIHN4ID0gMDsgc3kgLT0gVElMRV9IRUlHSFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN4ICs9IFRJTEVfV0lEVEg7XG4gICAgfVxuICB9XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlclRpbGUgPSBmdW5jdGlvbiAoY29udGV4dCwgeCwgeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgZGVsdGEsIHZhcmlhbnQsIG5laWdoYm9ycykge1xuICB2YXIgbWNlbnRlciA9IHZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgZGVsdGEpLFxuICAgICAgbXRvcCA9IGdldEludDE2KG5laWdoYm9yc1swXSwgbmVpZ2hib3JzWzFdICsgZGVsdGEpLFxuICAgICAgbXJpZ2h0ID0gZ2V0SW50MTYobmVpZ2hib3JzWzRdLCBuZWlnaGJvcnNbNV0gKyBkZWx0YSksXG4gICAgICBtYm90dG9tID0gZ2V0SW50MTYobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSksXG4gICAgICBtbGVmdCA9IGdldEludDE2KG5laWdoYm9yc1sxMl0sIG5laWdoYm9yc1sxM10gKyBkZWx0YSksXG4gICAgICBpY2VudGVyLCBpdG9wLCBpcmlnaHQsIGlib3R0b20sIGlsZWZ0LFxuICAgICAgb2NlbnRlciwgb3RvcCwgb3JpZ2h0LCBvYm90dG9tLCBvbGVmdCxcbiAgICAgIHZjZW50ZXIsIHZ0b3AsIHZyaWdodCwgdmJvdHRvbSwgdmxlZnQ7XG5cbiAgdmFyIGR0b3AgPSBtdG9wID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG10b3ApLFxuICAgICAgZHJpZ2h0ID0gbXJpZ2h0ID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG1yaWdodCksXG4gICAgICBkYm90dG9tID0gbWJvdHRvbSA+IDAgJiYgKG1jZW50ZXIgPCAxIHx8IG1jZW50ZXIgPiBtYm90dG9tKSxcbiAgICAgIGRsZWZ0ID0gbWxlZnQgPiAwICYmIChtY2VudGVyIDwgMSB8fCBtY2VudGVyID4gbWxlZnQpO1xuXG4gIGlmIChkdG9wKSB7XG4gICAgb3RvcCA9IG1hdGVyaWFsc1ttdG9wXTtcbiAgICBpZiAoIW90b3ApIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvdG9wLnBsYXRmb3JtKSB7XG4gICAgICBkdG9wID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0b3AgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG90b3AsIGdldFVpbnQ4KG5laWdoYm9yc1swXSwgbmVpZ2hib3JzWzFdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWl0b3ApIHJldHVybiBmYWxzZTtcbiAgICAgIHZ0b3AgPSB2YXJpYW50ICUgb3RvcC5yZW5kZXJQYXJhbWV0ZXJzLnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRyaWdodCkge1xuICAgIG9yaWdodCA9IG1hdGVyaWFsc1ttcmlnaHRdO1xuICAgIGlmICghb3JpZ2h0KSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob3JpZ2h0LnBsYXRmb3JtKSB7XG4gICAgICBkcmlnaHQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXJpZ2h0ID0gYXNzZXRzLmdldFRpbGVJbWFnZShvcmlnaHQsIGdldFVpbnQ4KG5laWdoYm9yc1s0XSwgbmVpZ2hib3JzWzVdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWlyaWdodCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdnJpZ2h0ID0gdmFyaWFudCAlIG9yaWdodC5yZW5kZXJQYXJhbWV0ZXJzLnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRsZWZ0KSB7XG4gICAgb2xlZnQgPSBtYXRlcmlhbHNbbWxlZnRdO1xuICAgIGlmICghb2xlZnQpIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvbGVmdC5wbGF0Zm9ybSkge1xuICAgICAgZGxlZnQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWxlZnQgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9sZWZ0LCBnZXRVaW50OChuZWlnaGJvcnNbMTJdLCBuZWlnaGJvcnNbMTNdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWlsZWZ0KSByZXR1cm4gZmFsc2U7XG4gICAgICB2bGVmdCA9IHZhcmlhbnQgJSBvbGVmdC5yZW5kZXJQYXJhbWV0ZXJzLnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBvYm90dG9tID0gbWF0ZXJpYWxzW21ib3R0b21dO1xuICAgIGlmICghb2JvdHRvbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG9ib3R0b20ucGxhdGZvcm0pIHtcbiAgICAgIGRib3R0b20gPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWJvdHRvbSA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob2JvdHRvbSwgZ2V0VWludDgobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDIpKTtcbiAgICAgIGlmICghaWJvdHRvbSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmJvdHRvbSA9IHZhcmlhbnQgJSBvYm90dG9tLnJlbmRlclBhcmFtZXRlcnMudmFyaWFudHMgKiAxNjtcbiAgICB9XG4gIH1cblxuICBpZiAobWNlbnRlciA+IDApIHtcbiAgICBvY2VudGVyID0gbWF0ZXJpYWxzW21jZW50ZXJdO1xuICAgIGlmICghb2NlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgdmFyIGh1ZVNoaWZ0ID0gdmlldy5nZXRVaW50OChvZmZzZXQgKyBkZWx0YSArIDIpO1xuXG4gICAgaWYgKG9jZW50ZXIucGxhdGZvcm0pIHtcbiAgICAgIGljZW50ZXIgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9jZW50ZXIsIGh1ZVNoaWZ0KTtcbiAgICAgIGlmICghaWNlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2Y2VudGVyID0gdmFyaWFudCAlIG9jZW50ZXIucmVuZGVyUGFyYW1ldGVycy52YXJpYW50cyAqIDg7XG4gICAgICBpZiAobWxlZnQgPiAwICYmIG1sZWZ0ICE9IG1jZW50ZXIgJiYgbXJpZ2h0ID4gMCAmJiBtcmlnaHQgIT0gbWNlbnRlcikge1xuICAgICAgICB2Y2VudGVyICs9IDI0ICogb2NlbnRlci5yZW5kZXJQYXJhbWV0ZXJzLnZhcmlhbnRzO1xuICAgICAgfSBlbHNlIGlmIChtcmlnaHQgPiAwICYmIG1yaWdodCAhPSBtY2VudGVyKSB7XG4gICAgICAgIHZjZW50ZXIgKz0gMTYgKiBvY2VudGVyLnJlbmRlclBhcmFtZXRlcnMudmFyaWFudHM7XG4gICAgICB9IGVsc2UgaWYgKG1sZWZ0IDwgMSB8fCBtbGVmdCA9PSBtY2VudGVyKSB7XG4gICAgICAgIHZjZW50ZXIgKz0gOCAqIG9jZW50ZXIucmVuZGVyUGFyYW1ldGVycy52YXJpYW50cztcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWNlbnRlciwgdmNlbnRlciwgMCwgOCwgOCwgeCwgeSwgOCwgOCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGljZW50ZXIgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9jZW50ZXIsIGh1ZVNoaWZ0KTtcbiAgICAgIGlmICghaWNlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2Y2VudGVyID0gdmFyaWFudCAlIG9jZW50ZXIucmVuZGVyUGFyYW1ldGVycy52YXJpYW50cyAqIDE2O1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWNlbnRlciwgdmNlbnRlciArIDQsIDEyLCA4LCA4LCB4LCB5LCA4LCA4KTtcbiAgICB9XG4gIH1cblxuICBpZiAoZHRvcCkge1xuICAgIGlmIChtdG9wID09IG1sZWZ0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wLCAwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG10b3AgPCBtbGVmdCkge1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDQsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDQsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGxlZnQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgeCArPSA0O1xuXG4gIGlmIChkdG9wKSB7XG4gICAgaWYgKG10b3AgPT0gbXJpZ2h0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgNCwgMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtdG9wIDwgbXJpZ2h0KSB7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDgsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDgsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRyaWdodCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICB5ICs9IDQ7XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBpZiAobWJvdHRvbSA9PSBtcmlnaHQpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA0LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG1ib3R0b20gPCBtcmlnaHQpIHtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgOCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA4LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRyaWdodCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICB4IC09IDQ7XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBpZiAobWJvdHRvbSA9PSBtbGVmdCkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSwgNCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtYm90dG9tIDwgbWxlZnQpIHtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDQsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkbGVmdCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICAvLyBUT0RPOiBGaWd1cmUgb3V0IGhvdyBtYXRtb2RzIHdvcmsuXG4gIC8vIFJlbmRlciB0aGUgbWF0bW9kIGZvciB0aGlzIHRpbGUuXG4gIHZhciBtb2RJZCA9IHZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgZGVsdGEgKyA0KSwgbW9kLCBtb2RJbWFnZTtcbiAgaWYgKG1vZElkID4gMCkge1xuICAgIG1vZCA9IG1hdG1vZHNbbW9kSWRdO1xuICAgIGlmICghbW9kKSByZXR1cm4gZmFsc2U7XG5cbiAgICBtb2RJbWFnZSA9IGFzc2V0cy5nZXRUaWxlSW1hZ2UobW9kLCB2aWV3LmdldFVpbnQ4KG9mZnNldCArIGRlbHRhICsgNikpO1xuICAgIGlmICghbW9kSW1hZ2UpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnRleHQuZHJhd0ltYWdlKG1vZEltYWdlLCA0ICsgdmFyaWFudCAlIG1vZC5yZW5kZXJQYXJhbWV0ZXJzLnZhcmlhbnRzICogMTYsIDEyLCA4LCA4LCB4LCB5IC0gNCwgOCwgOCk7XG4gIH1cblxuICAvLyBSZW5kZXIgdGhlIG1hdG1vZCBvZiB0aGUgdGlsZSBiZWxvdyB0aGlzIG9uZSAoaWYgaXQgb3ZlcmZsb3dzKS5cbiAgaWYgKCFvY2VudGVyICYmIG5laWdoYm9yc1s4XSkge1xuICAgIG1vZElkID0gZ2V0SW50MTYobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDQpO1xuICAgIGlmIChtb2RJZCA+IDApIHtcbiAgICAgIG1vZCA9IG1hdG1vZHNbbW9kSWRdO1xuICAgICAgaWYgKCFtb2QpIHJldHVybiBmYWxzZTtcblxuICAgICAgbW9kSW1hZ2UgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG1vZCwgZ2V0VWludDgobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDYpKTtcbiAgICAgIGlmICghbW9kSW1hZ2UpIHJldHVybiBmYWxzZTtcblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UobW9kSW1hZ2UsIDQgKyB2YXJpYW50ICUgbW9kLnJlbmRlclBhcmFtZXRlcnMudmFyaWFudHMgKiAxNiwgOCwgOCwgNCwgeCwgeSwgOCwgNCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBXb3JsZDtcblxuZnVuY3Rpb24gV29ybGQobWFuYWdlciwgZmlsZSwgaW5mbykge1xuICB0aGlzLl9oYW5kbGUgPSBpbmZvLmhhbmRsZTtcbiAgdGhpcy5fbWFuYWdlciA9IG1hbmFnZXI7XG5cbiAgdGhpcy5sYXN0TW9kaWZpZWQgPSBmaWxlLmxhc3RNb2RpZmllZERhdGU7XG4gIHRoaXMubWV0YWRhdGEgPSBpbmZvLm1ldGFkYXRhO1xuXG4gIC8vIFRPRE86IFJlbW92ZSB0aGlzIGxvZ2ljIG9uY2Ugd29ybGQgbWV0YWRhdGEgaXMgYXV0b21hdGljYWxseSB1cGdyYWRlZC5cbiAgdmFyIGxvY2F0aW9uLCBkYXRhLCBwYXJhbXM7XG4gIHN3aXRjaCAoaW5mby5tZXRhZGF0YS5fX3ZlcnNpb25fXykge1xuICAgIGNhc2UgMTpcbiAgICAgIGRhdGEgPSBpbmZvLm1ldGFkYXRhLnBsYW5ldDtcbiAgICAgIHBhcmFtcyA9IGRhdGEuY29uZmlnLmNlbGVzdGlhbFBhcmFtZXRlcnM7XG5cbiAgICAgIHZhciBjb29yZCA9IGRhdGEuY29uZmlnLnNreVBhcmFtZXRlcnMuY29vcmRpbmF0ZTtcbiAgICAgIGlmIChjb29yZCkge1xuICAgICAgICBsb2NhdGlvbiA9IGNvb3JkLnBhcmVudFN5c3RlbS5sb2NhdGlvbjtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgIGNhc2UgMzpcbiAgICBjYXNlIDQ6XG4gICAgY2FzZSA1OlxuICAgIGNhc2UgNjpcbiAgICAgIGRhdGEgPSBpbmZvLm1ldGFkYXRhLndvcmxkVGVtcGxhdGU7XG4gICAgICBwYXJhbXMgPSBkYXRhLmNlbGVzdGlhbFBhcmFtZXRlcnM7XG5cbiAgICAgIGlmIChwYXJhbXMpIHtcbiAgICAgICAgbG9jYXRpb24gPSBwYXJhbXMuY29vcmRpbmF0ZS5sb2NhdGlvbjtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgbWV0YWRhdGEgdmVyc2lvbiAnICsgbWV0YWRhdGEuX192ZXJzaW9uX18pO1xuICB9XG5cbiAgdGhpcy50aWxlc1ggPSBkYXRhLnNpemVbMF07XG4gIHRoaXMudGlsZXNZID0gZGF0YS5zaXplWzFdO1xuXG4gIHRoaXMuc3Bhd25YID0gaW5mby5tZXRhZGF0YS5wbGF5ZXJTdGFydFswXTtcbiAgdGhpcy5zcGF3blkgPSBpbmZvLm1ldGFkYXRhLnBsYXllclN0YXJ0WzFdO1xuXG4gIC8vIFNoaXBzIGRvbid0IGhhdmUgbmFtZSBvciBsb2NhdGlvbi5cbiAgaWYgKHBhcmFtcykge1xuICAgIHRoaXMubmFtZSA9IHBhcmFtcy5uYW1lO1xuICAgIGlmIChwYXJhbXMucGFyYW1ldGVycykge1xuICAgICAgdGhpcy5iaW9tZSA9IHBhcmFtcy5wYXJhbWV0ZXJzLndvcmxkVHlwZTtcbiAgICB9IGVsc2UgaWYgKHBhcmFtcy5wcmltYXJ5QmlvbWVOYW1lKSB7XG4gICAgICB0aGlzLmJpb21lID0gcGFyYW1zLnByaW1hcnlCaW9tZU5hbWU7XG4gICAgfSBlbHNlIGlmIChwYXJhbXMuc2NhbkRhdGEpIHtcbiAgICAgIHRoaXMuYmlvbWUgPSBwYXJhbXMuc2NhbkRhdGEucHJpbWFyeUJpb21lTmFtZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGZpbGUubmFtZS5tYXRjaCgvXFwuc2hpcHdvcmxkJC8pKSB7XG4gICAgICB0aGlzLm5hbWUgPSAnU2hpcCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubmFtZSA9ICdVbmtub3duJztcbiAgICB9XG4gICAgdGhpcy5iaW9tZSA9IG51bGw7XG4gIH1cblxuICBpZiAobG9jYXRpb24pIHtcbiAgICB0aGlzLnggPSBsb2NhdGlvblswXTtcbiAgICB0aGlzLnkgPSBsb2NhdGlvblsxXTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnggPSBudWxsO1xuICAgIHRoaXMueSA9IG51bGw7XG4gIH1cblxuICB0aGlzLnNlZWQgPSBpbmZvLm1ldGFkYXRhLndvcmxkVGVtcGxhdGUuc2VlZDtcbn1cblxuV29ybGQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHRoaXMuX21hbmFnZXIuYXBpLmNsb3NlKHRoaXMuX2hhbmRsZSwgY2FsbGJhY2spO1xuICB0aGlzLl9tYW5hZ2VyID0gbnVsbDtcbiAgdGhpcy5faGFuZGxlID0gLTE7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuZ2V0UmVnaW9uID0gZnVuY3Rpb24gKHgsIHksIGNhbGxiYWNrKSB7XG4gIGlmICghdGhpcy5fbWFuYWdlcikgdGhyb3cgbmV3IEVycm9yKCdUaGUgd29ybGQgZmlsZSBpcyBjbG9zZWQnKTtcbiAgdGhpcy5fbWFuYWdlci5hcGkuZ2V0UmVnaW9uKHRoaXMuX2hhbmRsZSwgeCwgeSwgY2FsbGJhY2spO1xufTtcblxuV29ybGQucHJvdG90eXBlLmlzT3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICEhdGhpcy5fbWFuYWdlcjtcbn07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgd29ya2VycHJveHkgPSByZXF1aXJlKCd3b3JrZXJwcm94eScpO1xuXG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRNYW5hZ2VyO1xuXG5mdW5jdGlvbiBXb3JsZE1hbmFnZXIob3B0X29wdGlvbnMpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgd29ya2VyUGF0aDogX19kaXJuYW1lICsgJy93b3JrZXIuanMnXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCk7XG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2VyKTtcbn1cbnV0aWwuaW5oZXJpdHMoV29ybGRNYW5hZ2VyLCBFdmVudEVtaXR0ZXIpO1xuXG5Xb3JsZE1hbmFnZXIucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAoZmlsZSwgb3B0X2NhbGxiYWNrKSB7XG4gIHRoaXMuYXBpLm9wZW4oZmlsZSwgKGVyciwgaW5mbykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGlmIChvcHRfY2FsbGJhY2spIG9wdF9jYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IENvbnZlcnQgbWV0YWRhdGEgdG8gbGF0ZXN0IHZlcnNpb24uXG4gICAgdmFyIHdvcmxkID0gbmV3IFdvcmxkKHRoaXMsIGZpbGUsIGluZm8pO1xuICAgIHRoaXMuZW1pdCgnbG9hZCcsIHt3b3JsZDogd29ybGR9KTtcbiAgICBpZiAob3B0X2NhbGxiYWNrKSBvcHRfY2FsbGJhY2soZXJyLCB3b3JsZCk7XG4gIH0pO1xufTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG52YXIgUmVnaW9uUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlZ2lvbnJlbmRlcmVyJyk7XG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRSZW5kZXJlcjtcblxuXG52YXIgVElMRVNfWCA9IDMyO1xudmFyIFRJTEVTX1kgPSAzMjtcbnZhciBUSUxFU19QRVJfUkVHSU9OID0gVElMRVNfWCAqIFRJTEVTX1k7XG5cbnZhciBIRUFERVJfQllURVMgPSAzO1xudmFyIEJZVEVTX1BFUl9USUxFID0gMzA7XG52YXIgQllURVNfUEVSX1JPVyA9IEJZVEVTX1BFUl9USUxFICogVElMRVNfWDtcbnZhciBCWVRFU19QRVJfUkVHSU9OID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1RJTEUgKiBUSUxFU19QRVJfUkVHSU9OO1xuXG52YXIgVElMRV9XSURUSCA9IDg7XG52YXIgVElMRV9IRUlHSFQgPSA4O1xuXG52YXIgUkVHSU9OX1dJRFRIID0gVElMRV9XSURUSCAqIFRJTEVTX1g7XG52YXIgUkVHSU9OX0hFSUdIVCA9IFRJTEVfSEVJR0hUICogVElMRVNfWTtcblxudmFyIE1JTl9aT09NID0gLjE7XG52YXIgTUFYX1pPT00gPSAzO1xuXG52YXIgRk5WX09GRlNFVF9CQVNJUyA9IDIxNjYxMzYyNzk7XG52YXIgRk5WX1BSSU1FID0gMTY3Nzc2MTk7XG52YXIgRk5WX1NFRUQgPSAyOTM4NzI4MzQ5O1xuXG52YXIgQkFDS0dST1VORF9WQVJJQU5UX1NFRUQgPSA0NTU5MzQyNzE7XG52YXIgRk9SRUdST1VORF9WQVJJQU5UX1NFRUQgPSA3ODY1NzE1NDE7XG5cblxuLy8gUmV1c2FibGUgYnVmZmVyIGZvciBjYWxjdWxhdGluZyB0aGUgYnl0ZXMgdG8gRk5WLWhhc2guXG52YXIgZm52VmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoMTIpKTtcbmZudlZpZXcuc2V0VWludDMyKDgsIEZOVl9TRUVEKTtcblxuZnVuY3Rpb24gZm52SGFzaFZpZXcoaGFzaCwgdmlldykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgaGFzaCA9ICgoaGFzaCBeIHZpZXcuZ2V0VWludDgoaSkpID4+PiAwKSAqIEZOVl9QUklNRTtcbiAgfVxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBXb3JsZFJlbmRlcmVyKHZpZXdwb3J0LCBhc3NldHNNYW5hZ2VyLCBvcHRfd29ybGQpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgLy8gRW5zdXJlIHRoYXQgY2FudmFzZXMgY2FuIGJlIGFuY2hvcmVkIHRvIHRoZSB2aWV3cG9ydC5cbiAgdmFyIHBvc2l0aW9uID0gZ2V0Q29tcHV0ZWRTdHlsZSh2aWV3cG9ydCkuZ2V0UHJvcGVydHlWYWx1ZSgncG9zaXRpb24nKTtcbiAgaWYgKHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJykge1xuICAgIHZpZXdwb3J0LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgfVxuXG4gIHRoaXMudmlld3BvcnQgPSB2aWV3cG9ydDtcbiAgdGhpcy5hc3NldHMgPSBhc3NldHNNYW5hZ2VyO1xuICB0aGlzLndvcmxkID0gb3B0X3dvcmxkIHx8IG51bGw7XG5cbiAgdGhpcy5jZW50ZXJYID0gMDtcbiAgdGhpcy5jZW50ZXJZID0gMDtcbiAgdGhpcy56b29tID0gMTtcblxuICB0aGlzLnZpZXdwb3J0WCA9IDA7XG4gIHRoaXMudmlld3BvcnRZID0gMDtcbiAgdGhpcy5zY3JlZW5SZWdpb25XaWR0aCA9IFJFR0lPTl9XSURUSDtcbiAgdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgPSBSRUdJT05fSEVJR0hUO1xuXG4gIHRoaXMubWF0ZXJpYWxzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm1hdGVyaWFsJyk7XG4gIHRoaXMubWF0bW9kcyA9IGFzc2V0c01hbmFnZXIuZ2V0UmVzb3VyY2VMb2FkZXIoJy5tYXRtb2QnKTtcbiAgdGhpcy5vYmplY3RzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm9iamVjdCcpO1xuXG4gIHRoaXMuYXNzZXRzLm9uKCdpbWFnZXMnLCAoKSA9PiB0aGlzLnJlcXVlc3RSZW5kZXIoKSk7XG4gIHRoaXMuYXNzZXRzLm9uKCdyZXNvdXJjZXMnLCAoKSA9PiB0aGlzLnJlcXVlc3RSZW5kZXIoKSk7XG5cbiAgdGhpcy5fY2FudmFzUG9vbCA9IFtdO1xuICB0aGlzLl9mcmVlUG9vbCA9IG51bGw7XG4gIHRoaXMuX3Bvb2xMb29rdXAgPSBudWxsO1xuXG4gIHRoaXMuX2JhY2tncm91bmRzID0gW107XG4gIHRoaXMuX3JlZ2lvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHRoaXMuX2JvdW5kcyA9IHZpZXdwb3J0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB0aGlzLl9yZWdpb25zWCA9IDA7XG4gIHRoaXMuX3JlZ2lvbnNZID0gMDtcbiAgdGhpcy5fdGlsZXNYID0gMDtcbiAgdGhpcy5fdGlsZXNZID0gMDtcbiAgdGhpcy5fZnJvbVJlZ2lvblggPSAwO1xuICB0aGlzLl9mcm9tUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWCA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWSA9IDA7XG5cbiAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICB0aGlzLl9iZ1ZhcmlhbnRIYXNoQmFzZSA9IE5hTjtcbiAgdGhpcy5fZmdWYXJpYW50SGFzaEJhc2UgPSBOYU47XG5cbiAgLy8gU2V0IHVwIGluZm9ybWF0aW9uIGFib3V0IHRoZSB3b3JsZCBpZiBpdCdzIGF2YWlsYWJsZS5cbiAgaWYgKHRoaXMud29ybGQpIHtcbiAgICB0aGlzLl9sb2FkTWV0YWRhdGEoKTtcbiAgfVxufVxudXRpbC5pbmhlcml0cyhXb3JsZFJlbmRlcmVyLCBFdmVudEVtaXR0ZXIpO1xuXG4vKipcbiAqIENlbnRlcnMgdGhlIHJlbmRlcmVyIHZpZXdwb3J0IG9uIHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMuXG4gKiBAcGFyYW0ge251bWJlcn0gdGlsZVggVGhlIFggaW4tZ2FtZSBjb29yZGluYXRlIHRvIGNlbnRlciBvbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0aWxlWSBUaGUgWSBpbi1nYW1lIGNvb3JkaW5hdGUgdG8gY2VudGVyIG9uLlxuICovXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbiAodGlsZVgsIHRpbGVZKSB7XG4gIHRoaXMuY2VudGVyWCA9IHRpbGVYO1xuICB0aGlzLmNlbnRlclkgPSB0aWxlWTtcbiAgdGhpcy5fY2FsY3VsYXRlVmlld3BvcnQoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmdldENhbnZhcyA9IGZ1bmN0aW9uIChyZWdpb24sIHosIG9wdF93aWR0aCwgb3B0X2hlaWdodCkge1xuICB2YXIga2V5ID0gcmVnaW9uLnggKyAnOicgKyByZWdpb24ueSArICc6JyArIHo7XG5cbiAgdmFyIGl0ZW0gPSB0aGlzLl9wb29sTG9va3VwW2tleV0sIGNhbnZhcztcblxuICBpZiAoaXRlbSkge1xuICAgIGNhbnZhcyA9IGl0ZW0uY2FudmFzO1xuICB9IGVsc2Uge1xuICAgIGlmICh0aGlzLl9mcmVlUG9vbC5sZW5ndGgpIHtcbiAgICAgIGl0ZW0gPSB0aGlzLl9mcmVlUG9vbC5wb3AoKTtcbiAgICAgIGNhbnZhcyA9IGl0ZW0uY2FudmFzO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDcmVhdGUgbmV3IDxjYW52YXM+IGVsZW1lbnRzIGFzIHRoZXkgYXJlIG5lZWRlZC5cbiAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICB0aGlzLnZpZXdwb3J0LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIHRoZSBuZXcgY2FudmFzIGluIHRoZSBwb29sLlxuICAgICAgaXRlbSA9IHtjYW52YXM6IGNhbnZhcywgcmVnaW9uOiByZWdpb24sIHo6IHp9O1xuICAgICAgdGhpcy5fY2FudmFzUG9vbC5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIGl0ZW0ueiA9IHo7XG4gICAgaXRlbS5yZWdpb24gPSByZWdpb247XG4gICAgdGhpcy5fcG9vbExvb2t1cFtrZXldID0gaXRlbTtcblxuICAgIC8vIE1hcmsgdGhlIHJlZ2lvbiBhcyBkaXJ0eSBzaW5jZSBpdCdzIG5vdCByZXVzaW5nIGEgY2FudmFzLlxuICAgIHJlZ2lvbi5zZXREaXJ0eSgpO1xuICB9XG5cbiAgLy8gT25seSByZXNpemUgdGhlIGNhbnZhcyBpZiBuZWNlc3NhcnksIHNpbmNlIHJlc2l6aW5nIGNsZWFycyB0aGUgY2FudmFzLlxuICB2YXIgd2lkdGggPSB0eXBlb2Ygb3B0X3dpZHRoID09ICdudW1iZXInID8gb3B0X3dpZHRoIDogY2FudmFzLndpZHRoLFxuICAgICAgaGVpZ2h0ID0gdHlwZW9mIG9wdF9oZWlnaHQgPT0gJ251bWJlcicgPyBvcHRfaGVpZ2h0IDogY2FudmFzLmhlaWdodDtcblxuICBpZiAoY2FudmFzLndpZHRoICE9IHdpZHRoIHx8IGNhbnZhcy5oZWlnaHQgIT0gaGVpZ2h0KSB7XG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgfVxuXG4gIGNhbnZhcy5zdHlsZS53aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiB0aGlzLnpvb20pICsgJ3B4JztcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQoaGVpZ2h0ICogdGhpcy56b29tKSArICdweCc7XG4gIGNhbnZhcy5zdHlsZS56SW5kZXggPSB6O1xuXG4gIHJldHVybiBjYW52YXM7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5nZXRSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uWCwgcmVnaW9uWSwgb3B0X3NraXBOZWlnaGJvcnMpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQpIHJldHVybiBudWxsO1xuXG4gIC8vIFdyYXAgdGhlIFggYXhpcy5cbiAgaWYgKHJlZ2lvblggPj0gdGhpcy5fcmVnaW9uc1gpIHtcbiAgICByZWdpb25YIC09IHRoaXMuX3JlZ2lvbnNYO1xuICB9IGVsc2UgaWYgKHJlZ2lvblggPCAwKSB7XG4gICAgcmVnaW9uWCArPSB0aGlzLl9yZWdpb25zWDtcbiAgfVxuXG4gIC8vIFRoZSBZIGF4aXMgZG9lc24ndCB3cmFwLlxuICBpZiAocmVnaW9uWSA8IDAgfHwgcmVnaW9uWSA+PSB0aGlzLl9yZWdpb25zWSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGtleSA9IHJlZ2lvblggKyAnOicgKyByZWdpb25ZO1xuXG4gIC8vIEdldCBvciBjcmVhdGUgdGhlIHJlZ2lvbi5cbiAgdmFyIHJlZ2lvbjtcbiAgaWYgKGtleSBpbiB0aGlzLl9yZWdpb25zKSB7XG4gICAgcmVnaW9uID0gdGhpcy5fcmVnaW9uc1trZXldO1xuICB9IGVsc2Uge1xuICAgIHJlZ2lvbiA9IG5ldyBSZWdpb25SZW5kZXJlcihyZWdpb25YLCByZWdpb25ZKTtcbiAgICB0aGlzLl9yZWdpb25zW2tleV0gPSByZWdpb247XG4gIH1cblxuICAvLyBMb2FkIHRoZSByZWdpb24gZGF0YSBpZiBpdCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LlxuICBpZiAocmVnaW9uLnN0YXRlID09IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1VOSU5JVElBTElaRUQpIHtcbiAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9MT0FESU5HO1xuXG4gICAgdGhpcy53b3JsZC5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSwgKGVyciwgcmVnaW9uRGF0YSkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUjtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlICE9ICdLZXkgbm90IGZvdW5kJykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKHJlZ2lvbkRhdGEuYnVmZmVyLmJ5dGVMZW5ndGggIT0gQllURVNfUEVSX1JFR0lPTikge1xuICAgICAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUjtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29ycnVwdGVkIHJlZ2lvbiAnICsgcmVnaW9uWCArICcsICcgKyByZWdpb25ZKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZWdpb24uZW50aXRpZXMgPSByZWdpb25EYXRhLmVudGl0aWVzO1xuICAgICAgcmVnaW9uLnZpZXcgPSBuZXcgRGF0YVZpZXcocmVnaW9uRGF0YS5idWZmZXIpO1xuICAgICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfUkVBRFk7XG5cbiAgICAgIHJlZ2lvbi5zZXREaXJ0eSgpO1xuICAgICAgdGhpcy5yZXF1ZXN0UmVuZGVyKCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBJZiB0aGUgcmVnaW9uIHNob3VsZCBub3QgZ2V0IG5laWdoYm9ycywgcmV0dXJuIG5vdy5cbiAgaWYgKG9wdF9za2lwTmVpZ2hib3JzKSByZXR1cm4gcmVnaW9uO1xuXG4gIC8vIEFkZCByZWZlcmVuY2VzIHRvIHN1cnJvdW5kaW5nIHJlZ2lvbnMuXG4gIGlmICghcmVnaW9uLm5laWdoYm9ycykge1xuICAgIHJlZ2lvbi5uZWlnaGJvcnMgPSBbXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZICsgMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YICsgMSwgcmVnaW9uWSArIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCArIDEsIHJlZ2lvblksIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCArIDEsIHJlZ2lvblkgLSAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblkgLSAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggLSAxLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YIC0gMSwgcmVnaW9uWSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YIC0gMSwgcmVnaW9uWSArIDEsIHRydWUpXG4gICAgXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICB2YXIgbmVpZ2hib3IgPSByZWdpb24ubmVpZ2hib3JzW2ldO1xuICAgICAgaWYgKCFuZWlnaGJvcikgY29udGludWU7XG4gICAgICBuZWlnaGJvci5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHJlZ2lvbi5zZXREaXJ0eSgpO1xuICAgIHRoaXMucmVxdWVzdFJlbmRlcigpO1xuICB9XG5cbiAgcmV0dXJuIHJlZ2lvbjtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmdldFZhcmlhbnQgPSBmdW5jdGlvbiAoeCwgeSwgb3B0X2JhY2tncm91bmQpIHtcbiAgdmFyIGhhc2ggPSBvcHRfYmFja2dyb3VuZCA/IHRoaXMuX2JnVmFyaWFudEhhc2hCYXNlIDogdGhpcy5fZmdWYXJpYW50SGFzaEJhc2U7XG5cbiAgZm52Vmlldy5zZXRVaW50MzIoMCwgeCk7XG4gIGZudlZpZXcuc2V0VWludDMyKDQsIHkpO1xuXG4gIHJldHVybiBmbnZIYXNoVmlldyhoYXNoLCBmbnZWaWV3KTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmlzUmVnaW9uVmlzaWJsZSA9IGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgaWYgKCFyZWdpb24pIHJldHVybiBmYWxzZTtcblxuICB2YXIgZnJvbVggPSB0aGlzLl9mcm9tUmVnaW9uWCwgdG9YID0gdGhpcy5fdG9SZWdpb25YLFxuICAgICAgZnJvbVkgPSB0aGlzLl9mcm9tUmVnaW9uWSwgdG9ZID0gdGhpcy5fdG9SZWdpb25ZO1xuXG4gIHZhciB2aXNpYmxlWSA9IHJlZ2lvbi55ID49IGZyb21ZICYmIHJlZ2lvbi55IDwgdG9ZO1xuICB2YXIgdmlzaWJsZVggPSAocmVnaW9uLnggPj0gZnJvbVggJiYgcmVnaW9uLnggPCB0b1gpIHx8XG4gICAgKHJlZ2lvbi54ID49IGZyb21YIC0gdGhpcy5fcmVnaW9uc1ggJiYgcmVnaW9uLnggPCB0b1ggLSB0aGlzLl9yZWdpb25zWCkgfHxcbiAgICAocmVnaW9uLnggPj0gZnJvbVggKyB0aGlzLl9yZWdpb25zWCAmJiByZWdpb24ueCA8IHRvWCArIHRoaXMuX3JlZ2lvbnNYKTtcblxuICByZXR1cm4gdmlzaWJsZVggJiYgdmlzaWJsZVk7XG59O1xuXG4vLyBTdGFydCBsb2FkaW5nIHRoZSByZXNvdXJjZSBpbmRleGVzLlxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5tYXRlcmlhbHMubG9hZEluZGV4KCk7XG4gIHRoaXMubWF0bW9kcy5sb2FkSW5kZXgoKTtcbiAgdGhpcy5vYmplY3RzLmxvYWRJbmRleCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fY2FsY3VsYXRlVmlld3BvcnQoKTtcbn07XG5cbi8vIFRPRE86IFdoZW4gQ2hyb21lIGFuZCBGaXJlZm94IHN1cHBvcnQgQ2FudmFzUHJveHkgb2ZmbG9hZCByZW5kZXJpbmcgdG8gdGhlXG4vLyAgICAgICB3b3JrZXIuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm47XG5cbiAgaWYgKCF0aGlzLl9zZXR1cCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gUHJlY2FsY3VsYXRlIGZyZWUgY2FudmFzZXMgYW5kIGEgY2FudmFzIGxvb2t1cCBtYXAuXG4gIHRoaXMuX3ByZXBhcmVDYW52YXNQb29sKCk7XG5cbiAgLy8gUmVuZGVyIGJhY2tncm91bmQgb3ZlcmxheXMuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYmFja2dyb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYmcgPSB0aGlzLl9iYWNrZ3JvdW5kc1tpXTtcblxuICAgIHZhciBpbWFnZSA9IHRoaXMuYXNzZXRzLmdldEltYWdlKGJnLmltYWdlKTtcbiAgICBpZiAoIWltYWdlKSBjb250aW51ZTtcblxuICAgIHZhciB3aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aCAqIHRoaXMuem9vbSxcbiAgICAgICAgaGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodCAqIHRoaXMuem9vbTtcblxuICAgIHZhciB4ID0gYmcubWluWzBdICogdGhpcy5fc2NyZWVuVGlsZVdpZHRoIC0gdGhpcy52aWV3cG9ydFgsXG4gICAgICAgIHkgPSBiZy5taW5bMV0gKiB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0IC0gdGhpcy52aWV3cG9ydFk7XG5cbiAgICBpbWFnZS5zdHlsZS5sZWZ0ID0geCArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUuYm90dG9tID0geSArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuICAgIGlmICghaW1hZ2UucGFyZW50Tm9kZSkge1xuICAgICAgaW1hZ2Uuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgaW1hZ2Uuc3R5bGUuekluZGV4ID0gMDtcbiAgICAgIHRoaXMudmlld3BvcnQuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbmRlciByZWdpb25zIGFuZCB0aGVpciBvYmplY3RzLlxuICBmb3IgKHZhciByZWdpb25ZID0gdGhpcy5fZnJvbVJlZ2lvblk7IHJlZ2lvblkgPCB0aGlzLl90b1JlZ2lvblk7IHJlZ2lvblkrKykge1xuICAgIGZvciAodmFyIHJlZ2lvblggPSB0aGlzLl9mcm9tUmVnaW9uWDsgcmVnaW9uWCA8IHRoaXMuX3RvUmVnaW9uWDsgcmVnaW9uWCsrKSB7XG4gICAgICB2YXIgcmVnaW9uID0gdGhpcy5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSk7XG4gICAgICBpZiAoIXJlZ2lvbikgY29udGludWU7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgcmVnaW9uJ3MgcG9zaXRpb24gaW4gdGhlIHZpZXdwb3J0IGFuZCByZW5kZXIgaXQuXG4gICAgICB2YXIgb2Zmc2V0WCA9IHJlZ2lvblggKiB0aGlzLnNjcmVlblJlZ2lvbldpZHRoIC0gdGhpcy52aWV3cG9ydFgsXG4gICAgICAgICAgb2Zmc2V0WSA9IHJlZ2lvblkgKiB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCAtIHRoaXMudmlld3BvcnRZO1xuICAgICAgcmVnaW9uLnJlbmRlcih0aGlzLCBvZmZzZXRYLCBvZmZzZXRZKTtcbiAgICB9XG4gIH1cbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnJlcXVlc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkIHx8IHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIpIHJldHVybjtcbiAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IHRydWU7XG5cbiAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IGZhbHNlO1xuICB9KTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnNjcm9sbCA9IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSwgb3B0X3NjcmVlblBpeGVscykge1xuICBpZiAob3B0X3NjcmVlblBpeGVscykge1xuICAgIGRlbHRhWCAvPSB0aGlzLl9zY3JlZW5UaWxlV2lkdGg7XG4gICAgZGVsdGFZIC89IHRoaXMuX3NjcmVlblRpbGVIZWlnaHQ7XG4gIH1cblxuICB0aGlzLmNlbnRlclggKz0gZGVsdGFYO1xuICB0aGlzLmNlbnRlclkgKz0gZGVsdGFZO1xuXG4gIGlmICh0aGlzLmNlbnRlclggPCAwKSB7XG4gICAgdGhpcy5jZW50ZXJYICs9IHRoaXMuX3RpbGVzWDtcbiAgfSBlbHNlIGlmICh0aGlzLmNlbnRlclggPj0gdGhpcy5fdGlsZXNYKSB7XG4gICAgdGhpcy5jZW50ZXJYIC09IHRoaXMuX3RpbGVzWDtcbiAgfVxuXG4gIHRoaXMuX2NhbGN1bGF0ZVJlZ2lvbnMoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnNldFdvcmxkID0gZnVuY3Rpb24gKHdvcmxkKSB7XG4gIGlmICghd29ybGQgfHwgISh3b3JsZCBpbnN0YW5jZW9mIFdvcmxkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB3b3JsZCcpO1xuICB9XG5cbiAgdGhpcy51bmxvYWQoKTtcblxuICB0aGlzLndvcmxkID0gd29ybGQ7XG4gIHRoaXMuX2xvYWRNZXRhZGF0YSgpO1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuc2V0Wm9vbSA9IGZ1bmN0aW9uICh6b29tKSB7XG4gIGlmICh6b29tIDwgTUlOX1pPT00pIHpvb20gPSBNSU5fWk9PTTtcbiAgaWYgKHpvb20gPiBNQVhfWk9PTSkgem9vbSA9IE1BWF9aT09NO1xuICBpZiAoem9vbSA9PSB0aGlzLnpvb20pIHJldHVybjtcblxuICB0aGlzLnpvb20gPSB6b29tO1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUudW5sb2FkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuem9vbSA9IDE7XG4gIHRoaXMuY2VudGVyWCA9IDA7XG4gIHRoaXMuY2VudGVyWSA9IDA7XG5cbiAgdGhpcy5fdGlsZXNYID0gMDtcbiAgdGhpcy5fdGlsZXNZID0gMDtcbiAgdGhpcy5fcmVnaW9uc1ggPSAwO1xuICB0aGlzLl9yZWdpb25zWSA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9jYW52YXNQb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvb2xJdGVtID0gdGhpcy5fY2FudmFzUG9vbFtpXTtcbiAgICBwb29sSXRlbS5yZWdpb24gPSBudWxsO1xuICAgIHBvb2xJdGVtLmNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIH1cblxuICAvLyBVbmxvYWQgcmVnaW9ucyB0byByZW1vdmUgY3ljbGljIHJlZmVyZW5jZXMuXG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl9yZWdpb25zKSB7XG4gICAgdGhpcy5fcmVnaW9uc1trZXldLnVubG9hZCgpO1xuICB9XG4gIHRoaXMuX3JlZ2lvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYmFja2dyb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaW1hZ2UgPSB0aGlzLmFzc2V0cy5nZXRJbWFnZSh0aGlzLl9iYWNrZ3JvdW5kc1tpXS5pbWFnZSk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICB0aGlzLnZpZXdwb3J0LnJlbW92ZUNoaWxkKGltYWdlKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5fYmFja2dyb3VuZHMgPSBbXTtcblxuICB0aGlzLndvcmxkID0gbnVsbDtcblxuICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICB0aGlzLmVtaXQoJ3VubG9hZCcpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuem9vbUluID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNldFpvb20odGhpcy56b29tICsgdGhpcy56b29tICogLjEpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuem9vbU91dCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zZXRab29tKHRoaXMuem9vbSAtIHRoaXMuem9vbSAqIC4xKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLl9jYWxjdWxhdGVSZWdpb25zID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuX2Zyb21SZWdpb25YID0gTWF0aC5mbG9vcih0aGlzLmNlbnRlclggLyBUSUxFU19YIC0gdGhpcy5fYm91bmRzLndpZHRoIC8gMiAvIHRoaXMuc2NyZWVuUmVnaW9uV2lkdGgpIC0gMTtcbiAgdGhpcy5fZnJvbVJlZ2lvblkgPSBNYXRoLmZsb29yKHRoaXMuY2VudGVyWSAvIFRJTEVTX1kgLSB0aGlzLl9ib3VuZHMuaGVpZ2h0IC8gMiAvIHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0KSAtIDI7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IHRoaXMuX2Zyb21SZWdpb25YICsgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYO1xuICB0aGlzLl90b1JlZ2lvblkgPSB0aGlzLl9mcm9tUmVnaW9uWSArIHRoaXMuX3Zpc2libGVSZWdpb25zWTtcblxuICB0aGlzLnZpZXdwb3J0WCA9IHRoaXMuY2VudGVyWCAqIHRoaXMuX3NjcmVlblRpbGVXaWR0aCAtIHRoaXMuX2JvdW5kcy53aWR0aCAvIDIsXG4gIHRoaXMudmlld3BvcnRZID0gdGhpcy5jZW50ZXJZICogdGhpcy5fc2NyZWVuVGlsZUhlaWdodCAtIHRoaXMuX2JvdW5kcy5oZWlnaHQgLyAyO1xuXG4gIHRoaXMucmVxdWVzdFJlbmRlcigpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2NhbGN1bGF0ZVZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuX3NldHVwID0gdHJ1ZTtcblxuICB0aGlzLnNjcmVlblJlZ2lvbldpZHRoID0gTWF0aC5yb3VuZChSRUdJT05fV0lEVEggKiB0aGlzLnpvb20pO1xuICB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCA9IE1hdGgucm91bmQoUkVHSU9OX0hFSUdIVCAqIHRoaXMuem9vbSk7XG4gIHRoaXMuX3NjcmVlblRpbGVXaWR0aCA9IHRoaXMuc2NyZWVuUmVnaW9uV2lkdGggLyBUSUxFU19YO1xuICB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0ID0gdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgLyBUSUxFU19ZO1xuXG4gIHRoaXMuX2JvdW5kcyA9IHRoaXMudmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWCA9IE1hdGguY2VpbCh0aGlzLl9ib3VuZHMud2lkdGggLyB0aGlzLnNjcmVlblJlZ2lvbldpZHRoICsgMyk7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWSA9IE1hdGguY2VpbCh0aGlzLl9ib3VuZHMuaGVpZ2h0IC8gdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgKyAzKTtcblxuICB0aGlzLl9jYWxjdWxhdGVSZWdpb25zKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fbG9hZE1ldGFkYXRhID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3Bhd24sIHNpemU7XG5cbiAgdGhpcy5jZW50ZXJYID0gdGhpcy53b3JsZC5zcGF3blg7XG4gIHRoaXMuY2VudGVyWSA9IHRoaXMud29ybGQuc3Bhd25ZO1xuXG4gIHRoaXMuX3RpbGVzWCA9IHRoaXMud29ybGQudGlsZXNYO1xuICB0aGlzLl90aWxlc1kgPSB0aGlzLndvcmxkLnRpbGVzWTtcblxuICAvLyBUT0RPOiBGaWd1cmUgb3V0IHdoeSBzb21lIHdvcmxkIHNpemVzIGFyZW4ndCBkaXZpc2libGUgYnkgMzIuXG4gIHRoaXMuX3JlZ2lvbnNYID0gTWF0aC5jZWlsKHRoaXMuX3RpbGVzWCAvIFRJTEVTX1gpO1xuICB0aGlzLl9yZWdpb25zWSA9IE1hdGguY2VpbCh0aGlzLl90aWxlc1kgLyBUSUxFU19ZKTtcblxuICBpZiAodGhpcy53b3JsZC5tZXRhZGF0YS5jZW50cmFsU3RydWN0dXJlKSB7XG4gICAgdGhpcy5fYmFja2dyb3VuZHMgPSB0aGlzLndvcmxkLm1ldGFkYXRhLmNlbnRyYWxTdHJ1Y3R1cmUuYmFja2dyb3VuZE92ZXJsYXlzO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIEZOViBoYXNoIGJhc2VzIGZvciB0aGUgdmFyaWFudCBhbGdvcml0aG0uXG4gIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcig0KSk7XG5cbiAgdmlldy5zZXRVaW50MzIoMCwgdGhpcy53b3JsZC5zZWVkICsgQkFDS0dST1VORF9WQVJJQU5UX1NFRUQpO1xuICB0aGlzLl9iZ1ZhcmlhbnRIYXNoQmFzZSA9IGZudkhhc2hWaWV3KEZOVl9PRkZTRVRfQkFTSVMsIHZpZXcpO1xuXG4gIHZpZXcuc2V0VWludDMyKDAsIHRoaXMud29ybGQuc2VlZCArIEZPUkVHUk9VTkRfVkFSSUFOVF9TRUVEKTtcbiAgdGhpcy5fZmdWYXJpYW50SGFzaEJhc2UgPSBmbnZIYXNoVmlldyhGTlZfT0ZGU0VUX0JBU0lTLCB2aWV3KTtcblxuICAvLyBOb3RpZnkgbGlzdGVuZXJzIHRoYXQgYSB3b3JsZCBoYXMgYmVlbiBsb2FkZWQuXG4gIHRoaXMuX2xvYWRlZCA9IHRydWU7XG4gIHRoaXMuZW1pdCgnbG9hZCcpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX3ByZXBhcmVDYW52YXNQb29sID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZnJlZVBvb2wgPSBbXSwgcG9vbExvb2t1cCA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NhbnZhc1Bvb2wubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9vbEl0ZW0gPSB0aGlzLl9jYW52YXNQb29sW2ldLFxuICAgICAgICByZWdpb24gPSBwb29sSXRlbS5yZWdpb247XG5cbiAgICBpZiAocmVnaW9uICYmIHRoaXMuaXNSZWdpb25WaXNpYmxlKHJlZ2lvbikpIHtcbiAgICAgIHBvb2xMb29rdXBbcmVnaW9uLnggKyAnOicgKyByZWdpb24ueSArICc6JyArIHBvb2xJdGVtLnpdID0gcG9vbEl0ZW07XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvb2xJdGVtLmNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICBmcmVlUG9vbC5wdXNoKHBvb2xJdGVtKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9mcmVlUG9vbCA9IGZyZWVQb29sO1xuICB0aGlzLl9wb29sTG9va3VwID0gcG9vbExvb2t1cDtcbn07XG4iLCI7KGZ1bmN0aW9uIChjb21tb25qcykge1xuICBmdW5jdGlvbiBlcnJvck9iamVjdChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQ2FsbHNGcm9tT3duZXIoZnVuY3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTGV0IHRoZSBvdGhlciBzaWRlIGtub3cgYWJvdXQgb3VyIGZ1bmN0aW9ucyBpZiB0aGV5IGNhbid0IHVzZSBQcm94eS5cbiAgICAgIHZhciBuYW1lcyA9IFtdO1xuICAgICAgZm9yICh2YXIgbmFtZSBpbiBmdW5jdGlvbnMpIG5hbWVzLnB1c2gobmFtZSk7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKHtmdW5jdGlvbk5hbWVzOiBuYW1lc30pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGlkKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9KTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2suZGlzYWJsZUF1dG8gPSBmdW5jdGlvbiAoKSB7IGNhbGxiYWNrLl9hdXRvRGlzYWJsZWQgPSB0cnVlOyB9O1xuXG4gICAgICBjYWxsYmFjay50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9LCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrO1xuICAgIH1cblxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbCkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsSWQ7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLlxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnNbbWVzc2FnZS5jYWxsXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsbFJlc3BvbnNlOiBjYWxsSWQsXG4gICAgICAgICAgICBhcmd1bWVudHM6IFtlcnJvck9iamVjdChuZXcgRXJyb3IoJ1RoYXQgZnVuY3Rpb24gZG9lcyBub3QgZXhpc3QnKSldXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBtZXNzYWdlLmFyZ3VtZW50cyB8fCBbXTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY3JlYXRlQ2FsbGJhY2soY2FsbElkKTtcbiAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgICAgIGlmIChvcHRpb25zLmNhdGNoRXJyb3JzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvck9iamVjdChlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBvcHRpb24gZm9yIGl0IGlzIGVuYWJsZWQsIGF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2suXG4gICAgICAgIGlmIChvcHRpb25zLmF1dG9DYWxsYmFjayAmJiAhY2FsbGJhY2suX2F1dG9EaXNhYmxlZCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldHVyblZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vycywgb3B0aW9ucykge1xuICAgIHZhciBjYWNoZSA9IHt9LFxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcbiAgICAgICAgdGltZXJzLFxuICAgICAgICBuZXh0Q2FsbElkID0gMSxcbiAgICAgICAgZmFrZVByb3h5LFxuICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGFycmF5IG9mIG51bWJlciBvZiBwZW5kaW5nIHRhc2tzIGZvciBlYWNoIHdvcmtlci5cbiAgICB2YXIgcGVuZGluZyA9IHdvcmtlcnMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDA7IH0pO1xuXG4gICAgLy8gRWFjaCBpbmRpdmlkdWFsIGNhbGwgZ2V0cyBhIHRpbWVyIGlmIHRpbWluZyBjYWxscy5cbiAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHRpbWVycyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBQcm94eSBzdXBwb3J0LCB3ZSBoYXZlIHRvIHByZS1kZWZpbmUgYWxsIHRoZSBmdW5jdGlvbnMuXG4gICAgICBmYWtlUHJveHkgPSB7cGVuZGluZ0NhbGxzOiAwfTtcbiAgICAgIG9wdGlvbnMuZnVuY3Rpb25OYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROdW1QZW5kaW5nQ2FsbHMoKSB7XG4gICAgICByZXR1cm4gcXVldWUubGVuZ3RoICsgcGVuZGluZy5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKF8sIG5hbWUpIHtcbiAgICAgIGlmIChuYW1lID09ICdwZW5kaW5nQ2FsbHMnKSByZXR1cm4gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXTtcblxuICAgICAgdmFyIGZuID0gY2FjaGVbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MpO1xuICAgICAgfTtcblxuICAgICAgLy8gU2VuZHMgdGhlIHNhbWUgY2FsbCB0byBhbGwgd29ya2Vycy5cbiAgICAgIGZuLmJyb2FkY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzZW5kQ2FsbChpLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBNYXJrcyB0aGUgb2JqZWN0cyBpbiB0aGUgZmlyc3QgYXJndW1lbnQgKGFycmF5KSBhcyB0cmFuc2ZlcmFibGUuXG4gICAgICBmbi50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncywgdHJhbnNmZXJMaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlKCkge1xuICAgICAgLy8gS2VlcCB0aGUgZmFrZSBwcm94eSBwZW5kaW5nIGNvdW50IHVwLXRvLWRhdGUuXG4gICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG5cbiAgICAgIGlmICghcXVldWUubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGVuZGluZ1tpXSkgY29udGludWU7XG5cbiAgICAgICAgLy8gQSB3b3JrZXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICB2YXIgcGFyYW1zID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgc2VuZENhbGwoaSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSk7XG5cbiAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUNhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgcXVldWUucHVzaChbbmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdF0pO1xuICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRDYWxsKHdvcmtlckluZGV4LCBuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICAvLyBHZXQgdGhlIHdvcmtlciBhbmQgaW5kaWNhdGUgdGhhdCBpdCBoYXMgYSBwZW5kaW5nIHRhc2suXG4gICAgICBwZW5kaW5nW3dvcmtlckluZGV4XSsrO1xuICAgICAgdmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySW5kZXhdO1xuXG4gICAgICB2YXIgaWQgPSBuZXh0Q2FsbElkKys7XG5cbiAgICAgIC8vIElmIHRoZSBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGFzc3VtZSBpdCdzIHRoZSBjYWxsYmFjay5cbiAgICAgIHZhciBtYXliZUNiID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHR5cGVvZiBtYXliZUNiID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2tzW2lkXSA9IG1heWJlQ2I7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgc3BlY2lmaWVkLCB0aW1lIGNhbGxzIHVzaW5nIHRoZSBjb25zb2xlLnRpbWUgaW50ZXJmYWNlLlxuICAgICAgaWYgKG9wdGlvbnMudGltZUNhbGxzKSB7XG4gICAgICAgIHZhciB0aW1lcklkID0gbmFtZSArICcoJyArIGFyZ3Muam9pbignLCAnKSArICcpJztcbiAgICAgICAgdGltZXJzW2lkXSA9IHRpbWVySWQ7XG4gICAgICAgIGNvbnNvbGUudGltZSh0aW1lcklkKTtcbiAgICAgIH1cblxuICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtjYWxsSWQ6IGlkLCBjYWxsOiBuYW1lLCBhcmd1bWVudHM6IGFyZ3N9LCBvcHRfdHJhbnNmZXJMaXN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcihlKSB7XG4gICAgICB2YXIgd29ya2VySW5kZXggPSB3b3JrZXJzLmluZGV4T2YodGhpcyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbFJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxSZXNwb25zZTtcblxuICAgICAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayByZWdpc3RlcmVkIGZvciB0aGlzIGNhbGwgKGlmIGFueSkuXG4gICAgICAgIGlmIChjYWxsYmFja3NbY2FsbElkXSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tjYWxsSWRdLmFwcGx5KG51bGwsIG1lc3NhZ2UuYXJndW1lbnRzKTtcbiAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxJZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBvcnQgdGltaW5nLCBpZiB0aGF0IG9wdGlvbiBpcyBlbmFibGVkLlxuICAgICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMgJiYgdGltZXJzW2NhbGxJZF0pIHtcbiAgICAgICAgICBjb25zb2xlLnRpbWVFbmQodGltZXJzW2NhbGxJZF0pO1xuICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyB0YXNrIGlzIG5vIGxvbmdlciBwZW5kaW5nIG9uIHRoZSB3b3JrZXIuXG4gICAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdLS07XG4gICAgICAgIGZsdXNoUXVldWUoKTtcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5mdW5jdGlvbk5hbWVzKSB7XG4gICAgICAgIC8vIFJlY2VpdmVkIGEgbGlzdCBvZiBhdmFpbGFibGUgZnVuY3Rpb25zLiBPbmx5IHVzZWZ1bCBmb3IgZmFrZSBwcm94eS5cbiAgICAgICAgbWVzc2FnZS5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICBmYWtlUHJveHlbbmFtZV0gPSBnZXRIYW5kbGVyKG51bGwsIG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gbWVzc2FnZXMgZnJvbSBhbGwgdGhlIHdvcmtlcnMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3b3JrZXJzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZha2VQcm94eTtcbiAgICB9IGVsc2UgaWYgKFByb3h5LmNyZWF0ZSkge1xuICAgICAgcmV0dXJuIFByb3h5LmNyZWF0ZSh7Z2V0OiBnZXRIYW5kbGVyfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoe30sIHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggZWl0aGVyIGEgV29ya2VyIGluc3RhbmNlLCBhIGxpc3Qgb2YgdGhlbSwgb3IgYSBtYXBcbiAgICogb2YgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCBpbnNpZGUgdGhlIHdvcmtlci5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZVdvcmtlclByb3h5KHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0X29wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2sgYWZ0ZXIgYSBjYWxsIGlmIHRoZSByZXR1cm4gdmFsdWUgaXMgbm90XG4gICAgICAvLyB1bmRlZmluZWQuXG4gICAgICBhdXRvQ2FsbGJhY2s6IGZhbHNlLFxuICAgICAgLy8gQ2F0Y2ggZXJyb3JzIGFuZCBhdXRvbWF0aWNhbGx5IHJlc3BvbmQgd2l0aCBhbiBlcnJvciBjYWxsYmFjay4gT2ZmIGJ5XG4gICAgICAvLyBkZWZhdWx0IHNpbmNlIGl0IGJyZWFrcyBzdGFuZGFyZCBiZWhhdmlvci5cbiAgICAgIGNhdGNoRXJyb3JzOiBmYWxzZSxcbiAgICAgIC8vIEEgbGlzdCBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkLiBUaGlzIGxpc3Qgd2lsbCBiZSB1c2VkIHRvIG1ha2VcbiAgICAgIC8vIHRoZSBwcm94eSBmdW5jdGlvbnMgYXZhaWxhYmxlIHdoZW4gUHJveHkgaXMgbm90IHN1cHBvcnRlZC4gTm90ZSB0aGF0XG4gICAgICAvLyB0aGlzIGlzIGdlbmVyYWxseSBub3QgbmVlZGVkIHNpbmNlIHRoZSB3b3JrZXIgd2lsbCBhbHNvIHB1Ymxpc2ggaXRzXG4gICAgICAvLyBrbm93biBmdW5jdGlvbnMuXG4gICAgICBmdW5jdGlvbk5hbWVzOiBbXSxcbiAgICAgIC8vIENhbGwgY29uc29sZS50aW1lIGFuZCBjb25zb2xlLnRpbWVFbmQgZm9yIGNhbGxzIHNlbnQgdGhvdWdoIHRoZSBwcm94eS5cbiAgICAgIHRpbWVDYWxsczogZmFsc2VcbiAgICB9O1xuXG4gICAgaWYgKG9wdF9vcHRpb25zKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb3B0X29wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG9wdGlvbnMpKSBjb250aW51ZTtcbiAgICAgICAgb3B0aW9uc1trZXldID0gb3B0X29wdGlvbnNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYW4gYXJyYXkgb2Ygd29ya2VycyAoZXZlbiBpZiBvbmx5IHVzaW5nIG9uZSB3b3JrZXIpLlxuICAgIGlmICh0eXBlb2YgV29ya2VyICE9ICd1bmRlZmluZWQnICYmICh3b3JrZXJzT3JGdW5jdGlvbnMgaW5zdGFuY2VvZiBXb3JrZXIpKSB7XG4gICAgICB3b3JrZXJzT3JGdW5jdGlvbnMgPSBbd29ya2Vyc09yRnVuY3Rpb25zXTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3b3JrZXJzT3JGdW5jdGlvbnMpKSB7XG4gICAgICByZXR1cm4gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjZWl2ZUNhbGxzRnJvbU93bmVyKHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbW1vbmpzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcGU7XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gZ2xvYmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSB3aW5kb3c7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBzZWxmO1xuICAgIH1cblxuICAgIHNjb3BlLmNyZWF0ZVdvcmtlclByb3h5ID0gY3JlYXRlV29ya2VyUHJveHk7XG4gIH1cbn0pKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuIiwiXG50cnkge1xuICB2YXIgdWEgPSByZXF1aXJlKCd1YV9wYXJzZXIvc3JjL2pzL3VzZXJBZ2VudCcpLnV0aWwudXNlckFnZW50KClcbiAgdmFyIGIgPSB1YS5icm93c2VyXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJyb3dzZXI6IGIubmFtZSxcbiAgICBvczogdWEub3MubmFtZSxcbiAgICBwbGF0Zm9ybTogdWEucGxhdGZvcm0sXG4gICAgdmVyc2lvbjogYi52ZXJzaW9uXG4gIH1cbn0gY2F0Y2ggKGVycikge1xuICBpZihjb25zb2xlKSBjb25zb2xlLmVycm9yKGVycilcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYnJvd3NlcjogJ3Vua25vd24nLFxuICAgIG9zOiAndW5rbm93bicsXG4gICAgcGxhdGZvcm06ICd1bmtub3duJyxcbiAgICB2ZXJzaW9uOiB7aW5mbzogJz8uPy4/J31cbiAgfVxufVxuXG4iLCIvKmpzaGludCBicm93c2VyOiB0cnVlLCBub2RlOiB0cnVlXHJcbiovXHJcblxyXG4oZnVuY3Rpb24gKGV4cG9ydHMpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgdXNlckFnZW50ID0gZXhwb3J0cy51c2VyQWdlbnQgPSBmdW5jdGlvbiAodWEpIHtcclxuICAgICAgICB1YSA9ICh1YSB8fCB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrVXNlckFnZW50KHVhKSB7XHJcbiAgICAgICAgICAgIHZhciBicm93c2VyID0ge307XHJcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IC8oZG9sZmluKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8oY2hyb21lKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8ob3BlcmEpKD86Lip2ZXJzaW9uKT9bIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAvKHdlYmtpdCkoPzouKnZlcnNpb24pP1sgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8obXNpZSkgKFtcXHcuXSspLy5leGVjKCB1YSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdWEuaW5kZXhPZihcImNvbXBhdGlibGVcIikgPCAwICYmIC8obW96aWxsYSkoPzouKj8gcnY6KFtcXHcuXSspKT8vLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICBbXCJcIixcInVua25vd25cIl07XHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXSA9PT0gXCJ3ZWJraXRcIikge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSAvKGlwaG9uZXxpcGFkfGlwb2QpW1xcU1xcc10qb3MgKFtcXHcuX1xcLV0rKSBsaWtlLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8oYW5kcm9pZClbIFxcL10oW1xcdy5fXFwtXSspOy8uZXhlYyh1YSkgfHwgW21hdGNoWzBdLCBcInNhZmFyaVwiLCBtYXRjaFsyXV07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwibW96aWxsYVwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoL3RyaWRlbnQvLnRlc3QodWEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMV0gPSBcIm1zaWVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMV0gPSBcImZpcmVmb3hcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvcG9sYXJpc3xuYXRlYnJvd3NlcnwoWzAxMHwwMTF8MDE2fDAxN3wwMTh8MDE5XXszfVxcZHszLDR9XFxkezR9JCkvLnRlc3QodWEpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsxXSA9IFwicG9sYXJpc1wiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicm93c2VyW21hdGNoWzFdXSA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyb3dzZXIubmFtZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBicm93c2VyLnZlcnNpb24gPSBzZXRWZXJzaW9uKG1hdGNoWzJdKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBicm93c2VyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2V0VmVyc2lvbih2ZXJzaW9uU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0ge307XHJcblxyXG4gICAgICAgICAgICB2YXIgdmVyc2lvbnMgPSB2ZXJzaW9uU3RyaW5nID8gdmVyc2lvblN0cmluZy5zcGxpdCgvXFwufC18Xy8pIDogW1wiMFwiLFwiMFwiLFwiMFwiXTtcclxuICAgICAgICAgICAgdmVyc2lvbi5pbmZvID0gdmVyc2lvbnMuam9pbihcIi5cIik7XHJcbiAgICAgICAgICAgIHZlcnNpb24ubWFqb3IgPSB2ZXJzaW9uc1swXSB8fCBcIjBcIjtcclxuICAgICAgICAgICAgdmVyc2lvbi5taW5vciA9IHZlcnNpb25zWzFdIHx8IFwiMFwiO1xyXG4gICAgICAgICAgICB2ZXJzaW9uLnBhdGNoID0gdmVyc2lvbnNbMl0gfHwgXCIwXCI7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmVyc2lvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrUGxhdGZvcm0gKHVhKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1BjKHVhKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicGNcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1RhYmxldCh1YSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxldFwiO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTW9iaWxlKHVhKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibW9iaWxlXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc1BjICh1YSkge1xyXG4gICAgICAgICAgICBpZiAodWEubWF0Y2goL2xpbnV4fHdpbmRvd3MgKG50fDk4KXxtYWNpbnRvc2gvKSAmJiAhdWEubWF0Y2goL2FuZHJvaWR8bW9iaWxlfHBvbGFyaXN8bGd0ZWxlY29tfHV6YXJkfG5hdGVicm93c2VyfGt0Zjt8c2t0Oy8pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzVGFibGV0ICh1YSkge1xyXG4gICAgICAgICAgICBpZiAodWEubWF0Y2goL2lwYWQvKSB8fCAodWEubWF0Y2goL2FuZHJvaWQvKSAmJiAhdWEubWF0Y2goL21vYml8bWluaXxmZW5uZWMvKSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaXNNb2JpbGUgKHVhKSB7XHJcbiAgICAgICAgICAgIGlmICghIXVhLm1hdGNoKC9pcChob25lfG9kKXxhbmRyb2lkLittb2JpbGV8d2luZG93cyAoY2V8cGhvbmUpfGJsYWNrYmVycnl8YmIxMHxzeW1iaWFufHdlYm9zfGZpcmVmb3guK2Zlbm5lY3xvcGVyYSBtKG9ifGluKWl8cG9sYXJpc3xpZW1vYmlsZXxsZ3RlbGVjb218bm9raWF8c29ueWVyaWNzc29ufGRvbGZpbnx1emFyZHxuYXRlYnJvd3NlcnxrdGY7fHNrdDsvKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrT3MgKHVhKSB7XHJcbiAgICAgICAgICAgIHZhciBvcyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSAvKGlwaG9uZXxpcGFkfGlwb2QpW1xcU1xcc10qb3MgKFtcXHcuX1xcLV0rKSBsaWtlLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKGFuZHJvaWQpWyBcXC9dKFtcXHcuX1xcLV0rKTsvLmV4ZWModWEpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvYW5kcm9pZC8udGVzdCh1YSk/IFtcIlwiLCBcImFuZHJvaWRcIiwgXCIwLjAuMFwiXSA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoL3BvbGFyaXN8bmF0ZWJyb3dzZXJ8KFswMTB8MDExfDAxNnwwMTd8MDE4fDAxOV17M31cXGR7Myw0fVxcZHs0fSQpLy50ZXN0KHVhKT8gW1wiXCIsIFwicG9sYXJpc1wiLCBcIjAuMC4wXCJdIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8od2luZG93cykoPzogbnQgfCBwaG9uZSg/OiBvcyl7MCwxfSB8ICkoW1xcdy5fXFwtXSspLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoLyh3aW5kb3dzKS8udGVzdCh1YSk/IFtcIlwiLCBcIndpbmRvd3NcIiwgXCIwLjAuMFwiXSA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKG1hYykgb3MgeCAoW1xcdy5fXFwtXSspLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoLyhsaW51eCkvLnRlc3QodWEpPyBbXCJcIiwgXCJsaW51eFwiLCBcIjAuMC4wXCJdIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvd2Vib3MvLnRlc3QodWEpPyBbXCJcIiwgXCJ3ZWJvc1wiLCBcIjAuMC4wXCJdIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8oYmFkYSlbIFxcL10oW1xcdy5fXFwtXSspLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoL2JhZGEvLnRlc3QodWEpPyBbXCJcIiwgXCJiYWRhXCIsIFwiMC4wLjBcIl0gOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC8ocmltfGJsYWNrYmVycnl8YmIxMCkvLnRlc3QodWEpPyBbXCJcIiwgXCJibGFja2JlcnJ5XCIsIFwiMC4wLjBcIl0gOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiXCIsIFwidW5rbm93blwiLCBcIjAuMC4wXCJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdID09PSBcImlwaG9uZVwiIHx8IG1hdGNoWzFdID09PSBcImlwYWRcIiB8fCBtYXRjaFsxXSA9PT0gXCJpcG9kXCIpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzFdID0gXCJpb3NcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCJ3aW5kb3dzXCIgJiYgbWF0Y2hbMl0gPT09IFwiOThcIikge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBcIjAuOTguMFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9zW21hdGNoWzFdXSA9IHRydWU7XHJcbiAgICAgICAgICAgIG9zLm5hbWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgb3MudmVyc2lvbiA9IHNldFZlcnNpb24obWF0Y2hbMl0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjaGVja0FwcCAodWEpIHtcclxuICAgICAgICAgICAgdmFyIGFwcCA9IHt9LFxyXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSAvKGNyaW9zKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKGRhdW1hcHBzKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJcIixcIlwiXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXSkge1xyXG4gICAgICAgICAgICAgICAgYXBwLmlzQXBwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGFwcC5uYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgICAgICBhcHAudmVyc2lvbiA9IHNldFZlcnNpb24obWF0Y2hbMl0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXBwLmlzQXBwID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhcHA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1YTogdWEsXHJcbiAgICAgICAgICAgIGJyb3dzZXI6IGNoZWNrVXNlckFnZW50KHVhKSxcclxuICAgICAgICAgICAgcGxhdGZvcm06IGNoZWNrUGxhdGZvcm0odWEpLFxyXG4gICAgICAgICAgICBvczogY2hlY2tPcyh1YSksXHJcbiAgICAgICAgICAgIGFwcDogY2hlY2tBcHAodWEpXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KSB7XHJcbiAgICAgICAgd2luZG93LnVhX3Jlc3VsdCA9IHVzZXJBZ2VudCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbn0pKChmdW5jdGlvbiAoKXtcclxuICAgIC8vIE1ha2UgdXNlckFnZW50IGEgTm9kZSBtb2R1bGUsIGlmIHBvc3NpYmxlLlxyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGV4cG9ydHMuZGF1bXRvb2xzID0gZXhwb3J0cztcclxuICAgICAgICBleHBvcnRzLnV0aWwgPSBleHBvcnRzO1xyXG4gICAgICAgIHJldHVybiBleHBvcnRzO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHdpbmRvdy5kYXVtdG9vbHMgPSAodHlwZW9mIHdpbmRvdy5kYXVtdG9vbHMgPT09ICd1bmRlZmluZWQnKSA/IHt9IDogd2luZG93LmRhdW10b29scztcclxuICAgICAgICB3aW5kb3cudXRpbCA9ICh0eXBlb2Ygd2luZG93LnV0aWwgPT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdy5kYXVtdG9vbHMgOiB3aW5kb3cudXRpbDtcclxuICAgICAgICByZXR1cm4gd2luZG93LmRhdW10b29scztcclxuICAgIH1cclxufSkoKSk7IiwidmFyIHN0YXJib3VuZCA9IHJlcXVpcmUoJy4vbGliL3N0YXJib3VuZCcpLnNldHVwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3cG9ydCcpKTtcblxuLy8gU2V0IHVwIFVJIGNvbXBvbmVudHMuXG5yZXF1aXJlKCcuL2xpYi91aS9vcycpKCk7XG5yZXF1aXJlKCcuL2xpYi91aS9wcm9ncmVzcycpKHN0YXJib3VuZCk7XG5yZXF1aXJlKCcuL2xpYi91aS93b3JsZC1zZWxlY3RvcicpKHN0YXJib3VuZCk7XG5cbnJlcXVpcmUoJy4vbGliL3VpL3dlYi1zZWxlY3RvcicpKHN0YXJib3VuZCwgKGVycm9yLCBpbmZvKSA9PiB7XG4gIC8vIEZpbmQgdGhlIG1vc3QgcmVjZW50IHdvcmxkLCBsb2FkIGl0LCBhbmQgcmVuZGVyIGl0LlxuICB2YXIgbW9zdFJlY2VudFdvcmxkID0gbnVsbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmZvLndvcmxkRmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgd29ybGQgPSBpbmZvLndvcmxkRmlsZXNbaV07XG5cbiAgICB2YXIgaXNNb3JlUmVjZW50ID0gIW1vc3RSZWNlbnRXb3JsZCB8fCB3b3JsZC5sYXN0TW9kaWZpZWREYXRlID4gbW9zdFJlY2VudFdvcmxkLmxhc3RNb2RpZmllZERhdGU7XG5cbiAgICBpZiAod29ybGQubmFtZS5tYXRjaCgvXFwud29ybGQkLykgJiYgaXNNb3JlUmVjZW50KSB7XG4gICAgICBtb3N0UmVjZW50V29ybGQgPSB3b3JsZDtcbiAgICB9XG4gIH1cblxuICBpZiAobW9zdFJlY2VudFdvcmxkKSB7XG4gICAgc3RhcmJvdW5kLndvcmxkcy5vcGVuKG1vc3RSZWNlbnRXb3JsZCwgZnVuY3Rpb24gKGVycm9yLCB3b3JsZCkge1xuICAgICAgaWYgKCFlcnJvcikgc3RhcmJvdW5kLnJlbmRlcmVyLnNldFdvcmxkKHdvcmxkKTtcbiAgICB9KTtcbiAgfVxufSk7XG5cbnN0YXJib3VuZC5yZW5kZXJlci5vbignbG9hZCcsICgpID0+IHtcbiAgJCgnI3dvcmxkLXN0YXR1cycpLnRleHQoc3RhcmJvdW5kLnJlbmRlcmVyLndvcmxkLm5hbWUpO1xufSk7XG5cbnN0YXJib3VuZC5yZW5kZXJlci5vbigndW5sb2FkJywgKCkgPT4ge1xuICAkKCcjd29ybGQtc3RhdHVzJykudGV4dCgnTm8gd29ybGQgbG9hZGVkJyk7XG59KTtcbiJdfQ==

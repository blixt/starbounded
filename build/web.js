(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;
var WorldRenderer = require('starbound-world').WorldRenderer;

// Create an assets manager which will deal with package files etc.
var assets = new AssetsManager({workerPath: 'build/worker-assets.js'});

// Create a world manager that handles loading the world and its regions.
var world = new WorldManager({workerPath: 'build/worker-world.js'});

// Set up a renderer that will render the graphics onto screen.
var renderer = new WorldRenderer(document.getElementById('viewport'), world, assets);

document.starbounded.assets.onchange = function () {
  assets.addFile('/', this.files[0], function (err) {
    // TODO: Verify that packed.pak was chosen.
    renderer.preload();
  });
};

document.starbounded.world.onchange = function () {
  world.open(this.files[0], function (err, metadata) {
    renderer.render();
  });
};

document.onkeydown = function (event) {
  switch (event.keyCode) {
    case 37:
      renderer.scroll(-1, 0);
      break;
    case 38:
      renderer.scroll(0, 1);
      break;
    case 39:
      renderer.scroll(1, 0);
      break;
    case 40:
      renderer.scroll(0, -1);
      break;
    default:
      return;
  }

  event.preventDefault();
};

},{"starbound-assets":7,"starbound-world":12}],2:[function(require,module,exports){
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
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
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
      console.trace();
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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
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

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":4,"inherits":3}],7:[function(require,module,exports){
exports.AssetsManager = require('./lib/assetsmanager');

},{"./lib/assetsmanager":8}],8:[function(require,module,exports){
(function (process,__dirname){
var merge = require('merge');
var workerproxy = require('workerproxy');

var ResourceLoader = require('./resourceloader');

module.exports = AssetsManager;

function AssetsManager(opt_options) {
  var options = {
    workerPath: __dirname + '/../worker.js'
  };

  Object.seal(options);
  merge(options, opt_options);
  Object.freeze(options);

  this.options = options;

  var worker = new Worker(options.workerPath);
  this.api = workerproxy(worker);

  // Reroute some functions to the worker.
  this.addFile = this.api.addFile;
  this.getBlobURL = this.api.getBlobURL;
  this.getJSON = this.api.getJSON;
  this.loadResources = this.api.loadResources;
}

/**
 * Indexes a directory. All files in the directory will be reachable through
 * the assets database after this completes. All .pak/.modpak files will also
 * be loaded into the index.
 *
 * The virtual path argument is a prefix for the entries in the directory.
 */
AssetsManager.prototype.addDirectory = function (path, dirEntry, callback) {
  var self = this;

  var pending = 1;
  var decrementPending = function () {
    pending--;
    if (!pending) {
      callback(null);
    }
  };

  var reader = dirEntry.createReader();
  var next = function () {
    reader.readEntries(function (entries) {
      if (!entries.length) {
        process.nextTick(decrementPending);
        return;
      }

      entries.forEach(function (entry) {
        if (entry.name[0] == '.') return;

        var entryPath = path + '/' + entry.name;

        if (entry.isDirectory) {
          pending++;
          self.addDirectory(entryPath, entry, decrementPending);
        } else {
          pending++;
          entry.file(function (file) {
            self.addFile(entryPath, file, decrementPending);
          }, decrementPending);
        }
      });
      next();
    });
  };
  next();
};

AssetsManager.prototype.addRoot = function (dirEntry, callback) {
  this.addDirectory('', dirEntry, callback);
};

AssetsManager.prototype.getResourceLoader = function (extension) {
  return new ResourceLoader(this, extension);
};

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),"/node_modules/starbound-assets/lib")
},{"./resourceloader":9,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":4,"merge":10,"workerproxy":11}],9:[function(require,module,exports){
(function (process){
var EventEmitter = require('events');
var util = require('util');

module.exports = ResourceLoader;

// TODO: Implement custom class for objects as they are much more complex.
var IMAGE_FIELDS = {
  '.material': ['frames', 'platformImage', 'stairImage'],
  '.matmod': ['frames']
};

var IMAGE_FIELD_SUFFIX = '__image';

function ResourceLoader(assetsManager, extension) {
  EventEmitter.call(this);

  this.assets = assetsManager;
  this.extension = extension;

  this.index = null;
  this.images = null;

  this._loadingIndex = false;
  this._pending = [];
  this._emitting = false;
}
util.inherits(ResourceLoader, EventEmitter);

ResourceLoader.prototype.get = function (id) {
  if (!this.index) return null;
  return this.index[id] || null;
};

ResourceLoader.prototype.getImage = function (idOrResource, fieldName) {
  var resource = typeof idOrResource == 'string' ? this.get(idOrResource) : idOrResource;
  if (!resource) return null;

  return resource[fieldName + IMAGE_FIELD_SUFFIX] || null;
};

ResourceLoader.prototype.loadImages = function (ids) {
  var fields = IMAGE_FIELDS[this.extension];
  if (!fields) return;

  if (this._pending) {
    // Ensure that we're loading the index.
    this.loadIndex();

    // Queue the requested ids for later.
    Array.prototype.push.apply(this._pending, ids);

    return;
  }

  for (var i = 0; i < ids.length; i++) {
    var resource = this.index[ids[i]];
    for (var j = 0; j < fields.length; j++) {
      this._loadImage(resource, fields[j]);
    }
  }
};

ResourceLoader.prototype.loadIndex = function () {
  if (this._loadingIndex) return;
  this._loadingIndex = true;

  // TODO: Fat arrows.
  var self = this;
  this.assets.loadResources(this.extension, function (err, index) {
    self._loadingIndex = false;
    self.index = index;

    var pending = self._pending;
    self._pending = null;
    self.loadImages(pending);
  });
};

ResourceLoader.prototype._loadImage = function (resource, field) {
  if (!(field in resource)) return;

  var imageField = field + IMAGE_FIELD_SUFFIX;

  // If the image is already loading, do nothing.
  if (imageField in resource) return;
  resource[imageField] = null;

  // Get an absolute path to the image.
  var path = resource[field];
  if (path[0] != '/') {
    var base = resource.__path__;
    path = base.substr(0, base.lastIndexOf('/') + 1) + path;
  }

  var self = this;
  this.assets.getBlobURL(path, function (err, url) {
    var image = new Image();
    image.src = url;
    image.onload = function () {
      resource[imageField] = image;
      if (!self._emitting) {
        self._emitting = true;
        process.nextTick(function () {
          self.emit('images');
          self._emitting = false;
        });
      }
    };
  });
};

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":4,"events":2,"util":6}],10:[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.1.2
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2013 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	function merge() {

		var items = Array.prototype.slice.call(arguments),
			result = items.shift(),
			deep = (result === true),
			size = items.length,
			item, index, key;

		if (deep || typeOf(result) !== 'object')

			result = {};

		for (index=0;index<size;++index)

			if (typeOf(item = items[index]) === 'object')

				for (key in item)

					result[key] = deep ? clone(item[key]) : item[key];

		return result;

	}

	function clone(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = clone(input[index]);

		}

		return output;

	}

	function typeOf(input) {

		return ({}).toString.call(input).match(/\s([\w]+)/)[1].toLowerCase();

	}

	if (isNode) {

		module.exports = merge;

	} else {

		window.merge = merge;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],11:[function(require,module,exports){
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
    function createCallback(id) {
      var fn = function () {
        var args = Array.prototype.slice.call(arguments);
        self.postMessage({callResponse: id, arguments: args});
      };

      fn.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        self.postMessage({callResponse: id, arguments: args}, transferList);
      };

      return fn;
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
        var callback = createCallback(callId)
        args.push(callback);

        if (options.catchErrors) {
          try {
            fn.apply(functions, args);
          } catch (e) {
            callback(errorObject(e));
          }
        } else {
          fn.apply(functions, args);
        }
      }
    });
  }

  function sendCallsToWorker(worker, options) {
    var cache = {},
        callbacks = {},
        nextCallId = 1;

    function getHandler(_, name) {
      if (cache[name]) return cache[name];

      var fn = cache[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        sendCall(name, args);
      };

      fn.transfer = function () {
        var args = Array.prototype.slice.call(arguments),
            transferList = args.shift();
        sendCall(name, args, transferList);
      };

      return fn;
    }

    function sendCall(name, args, opt_transferList) {
      console.log(name, args);
      var id = nextCallId++;

      if (typeof args[args.length - 1] == 'function') {
        callbacks[id] = args.pop();
      }

      worker.postMessage({callId: id, call: name, arguments: args}, opt_transferList);
    }

    worker.addEventListener('message', function (e) {
      var message = e.data;

      if (message.callResponse) {
        var callId = message.callResponse;
        if (callbacks[callId]) {
          callbacks[callId].apply(null, message.arguments);
          delete callbacks[callId];
        }
      }
    });

    if (Proxy.create) {
      return Proxy.create({get: getHandler});
    } else if (Proxy) {
      return new Proxy({}, {get: getHandler});
    } else {
      throw new Error('Proxy support required');
    }
  }

  /**
   * Call this function with either a Worker instance or a map of functions that
   * can be called inside the worker.
   */
  function createWorkerProxy(workerOrFunctions, opt_options) {
    var options = {
      // Catch errors and automatically respond with an error callback. Off by
      // default since it breaks standard behavior.
      catchErrors: false
    };

    if (opt_options) {
      for (var key in opt_options) {
        if (!(key in options)) continue;
        options[key] = opt_options[key];
      }
    }
    Object.freeze(options);

    if (typeof Worker != 'undefined' && (workerOrFunctions instanceof Worker)) {
      return sendCallsToWorker(workerOrFunctions, options);
    } else {
      receiveCallsFromOwner(workerOrFunctions, options);
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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
exports.WorldManager = require('./lib/worldmanager');
exports.WorldRenderer = require('./lib/worldrenderer');

},{"./lib/worldmanager":15,"./lib/worldrenderer":16}],13:[function(require,module,exports){
var TILES_X = 32;
var TILES_Y = 32;
var TILES_PER_REGION = TILES_X * TILES_Y;

var HEADER_BYTES = 3;
var BYTES_PER_TILE = 23;
var BYTES_PER_ROW = BYTES_PER_TILE * TILES_X;
var BYTES_PER_REGION = BYTES_PER_TILE * TILES_PER_REGION;

module.exports = Region;

function Region(data) {
  this.buffer = data.buffer;
  this.entities = data.entities;
  this.tileView = new DataView(data.buffer);
}

Region.TILES_X = TILES_X;
Region.TILES_Y = TILES_Y;
Region.TILES_PER_REGION = TILES_PER_REGION;

/**
 * Returns material ids and material mod ids used within the region.
 */
Region.prototype.getResourceIds = function () {
  var materialIds = [], matModIds = [], id;
  for (var offset = HEADER_BYTES; offset < HEADER_BYTES + BYTES_PER_REGION; offset += BYTES_PER_TILE) {
    id = this.tileView.getInt16(offset);
    if (id > 0 && materialIds.indexOf(id) == -1) materialIds.push(id);
    id = this.tileView.getInt16(offset + 7);
    if (id > 0 && materialIds.indexOf(id) == -1) materialIds.push(id);

    id = this.tileView.getInt16(offset + 4);
    if (id > 0 && matModIds.indexOf(id) == -1) matModIds.push(id);
    id = this.tileView.getInt16(offset + 11);
    if (id > 0 && matModIds.indexOf(id) == -1) matModIds.push(id);
  }

  return {materials: materialIds, matmods: matModIds};
};

Region.prototype.getMetadata = function (x, y) {
  var offset = this.getTileOffset(x, y);
  return [
    // Liquid
    this.tileView.getUint8(offset + 14),
    // Liquid pressure
    this.tileView.getUint16(offset + 15),
    // Collision map
    this.tileView.getUint8(offset + 17),
    // ?
    this.tileView.getInt16(offset + 18),
    // Biome?
    this.tileView.getUint8(offset + 20),
    // Biome?
    this.tileView.getUint8(offset + 21),
    // Indestructible
    !!this.tileView.getUint8(offset + 22)
  ];
};

Region.prototype.getNeighbors = function (x, y, opt_background) {
  var center = this.getTileOffset(x, y) + (opt_background ? 7 : 0);
  return [
    !!y && this.tileView.getInt16(center + BYTES_PER_ROW),
    (x < TILES_X - 1) && this.tileView.getInt16(center + BYTES_PER_TILE),
    (y < TILES_Y - 1) && this.tileView.getInt16(center - BYTES_PER_ROW),
    !!x && this.tileView.getInt16(center - BYTES_PER_TILE)
  ];
};

Region.prototype.getTile = function (x, y) {
  var offset = this.getTileOffset(x, y);
  return [
    // Material id
    this.tileView.getInt16(offset),
    // Hue shift
    this.tileView.getUint8(offset + 2),
    // Variant?
    this.tileView.getUint8(offset + 3),
    // Mod
    this.tileView.getInt16(offset + 4),
    // Mod hue shift
    this.tileView.getUint8(offset + 6),

    // Material id
    this.tileView.getInt16(offset + 7),
    // Hue shift
    this.tileView.getUint8(offset + 9),
    // Variant?
    this.tileView.getUint8(offset + 10),
    // Mod
    this.tileView.getInt16(offset + 11),
    // Mod hue shift
    this.tileView.getUint8(offset + 13)
  ];
};

Region.prototype.getTileOffset = function (x, y) {
  return HEADER_BYTES + BYTES_PER_REGION - BYTES_PER_ROW * (y + 1) + BYTES_PER_TILE * x;
};

},{}],14:[function(require,module,exports){
module.exports = RegionRenderer;


function RegionRenderer(x, y) {
  this.x = x;
  this.y = y;

  this.data = null;
  this.neighbors = null;

  this.state = RegionRenderer.STATE_UNINITIALIZED;

  // This flag will be true if this region successfully rendered completely.
  this.complete = false;
}

RegionRenderer.STATE_ERROR = -1;
RegionRenderer.STATE_UNITIALIZED = 0;
RegionRenderer.STATE_LOADING = 1;
RegionRenderer.STATE_READY = 2;

// TODO: Implement support for rendering only a part of the region.
RegionRenderer.prototype.render = function (renderer, canvas) {
  if (this.state != RegionRenderer.STATE_READY) return;

  var complete = true;

  var context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // TODO: Optimize to use buffer directly, and reuse neighbors.
  for (var y = 0; y < 32; y++) {
    for (var x = 0; x < 32; x++) {
      var tile = this.data.getTile(x, y);

      // TODO: Figure out the real variant algorithm.
      var variant = Math.round(Math.random() * 255);

      // TODO: The right way to do this is to darken the pixel values.
      // TODO: The background doesn't need to be rendered if the foreground
      //       tile is opaque (see "transparent" property).
      context.globalAlpha = .5;
      complete = complete && this._renderTile(renderer, context, tile[5], x * 8, y * 8, variant, this.data.getNeighbors(x, y, true));
      context.globalAlpha = 1;
      complete = complete && this._renderTile(renderer, context, tile[0], x * 8, y * 8, variant, this.data.getNeighbors(x, y));
    }
  }

  this.complete = complete;
};

RegionRenderer.prototype._renderTile = function (renderer, context, material, x, y, variant, neighbors) {
  var dtop = neighbors[0] > 0 && neighbors[0] != 39,
      dright = neighbors[1] > 0 && neighbors[1] != 39,
      dbottom = neighbors[2] > 0 && neighbors[2] != 39,
      dleft = neighbors[3] > 0 && neighbors[3] != 39;

  if (material > 0 && material != 39) {
    var ocenter = renderer.materials.get(material),
        icenter = renderer.materials.getImage(ocenter, 'frames');
    if (!icenter) return false;

    context.drawImage(icenter, variant % ocenter.variants * 16 + 4, 12, 8, 8, x, y, 8, 8);

    dtop = dtop && material > neighbors[0];
    dright = dright && material > neighbors[1];
    dbottom = dbottom && material > neighbors[2];
    dleft = dleft && material > neighbors[3];
  }

  var itop, iright, ibottom, ileft,
      otop, oright, obottom, oleft,
      vtop, vright, vbottom, vleft;

  if (dright) {
    oright = renderer.materials.get(neighbors[1]);
    iright = renderer.materials.getImage(oright, 'frames');
    if (!iright) return false;
    vright = variant % oright.variants * 16;
  }

  if (dleft) {
    oleft = renderer.materials.get(neighbors[3]);
    ileft = renderer.materials.getImage(oleft, 'frames');
    if (!ileft) return false;
    vleft = variant % oleft.variants * 16;
  }

  if (dtop) {
    otop = renderer.materials.get(neighbors[0]);
    itop = renderer.materials.getImage(otop, 'frames');
    if (!itop) return false;
    vtop = variant % otop.variants * 16;

    if (neighbors[0] == neighbors[3]) {
      context.drawImage(itop, vtop, 0, 4, 4, x, y, 4, 4);
    } else if (neighbors[0] < neighbors[3]) {
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
    if (neighbors[0] == neighbors[1]) {
      context.drawImage(itop, vtop + 4, 0, 4, 4, x, y, 4, 4);
    } else if (neighbors[0] < neighbors[1]) {
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
    obottom = renderer.materials.get(neighbors[2]);
    ibottom = renderer.materials.getImage(obottom, 'frames');
    if (!ibottom) return false;
    vbottom = variant % obottom.variants * 16;

    if (neighbors[2] == neighbors[1]) {
      context.drawImage(ibottom, vbottom + 4, 4, 4, 4, x, y, 4, 4);
    } else if (neighbors[2] < neighbors[1]) {
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
    if (neighbors[2] == neighbors[3]) {
      context.drawImage(ibottom, vbottom, 4, 4, 4, x, y, 4, 4);
    } else if (neighbors[2] < neighbors[3]) {
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

  return true;
};

},{}],15:[function(require,module,exports){
(function (__dirname){
var EventEmitter = require('events');
var merge = require('merge');
var util = require('util');
var workerproxy = require('workerproxy');

var Region = require('./region');

module.exports = WorldManager;

function WorldManager(opt_options) {
  EventEmitter.call(this);

  var options = {
    workerPath: __dirname + '/worker.js'
  };

  Object.seal(options);
  merge(options, opt_options);
  Object.freeze(options);

  this.options = options;

  var worker = new Worker(options.workerPath);
  this.api = workerproxy(worker);

  this.metadata = null;
}
util.inherits(WorldManager, EventEmitter);

WorldManager.prototype.getRegion = function (x, y, callback) {
  this.api.getRegion(x, y, function (err, regionData) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Region(regionData));
    }
  });
};

WorldManager.prototype.open = function (file, callback) {
  var self = this;
  this.api.open(file, function (err, metadata) {
    self.metadata = metadata;
    self.emit('load', {metadata: metadata});
    callback(err, metadata);
  });
};

}).call(this,"/node_modules/starbound-world/lib")
},{"./region":13,"events":2,"merge":17,"util":6,"workerproxy":18}],16:[function(require,module,exports){
(function (process){
var Region = require('./region');
var RegionRenderer = require('./regionrenderer');

module.exports = WorldRenderer;

var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;

var REGION_WIDTH = TILE_WIDTH * Region.TILES_X;
var REGION_HEIGHT = TILE_HEIGHT * Region.TILES_Y;


function WorldRenderer(viewport, worldManager, assetsManager) {
  // Ensure that canvases can be anchored to the viewport.
  var position = getComputedStyle(viewport).getPropertyValue('position');
  if (position != 'absolute' && position != 'relative') {
    viewport.style.position = 'relative';
  }

  this.viewport = viewport;
  this.world = worldManager;
  this.assets = assetsManager;

  this.centerX = 0;
  this.centerY = 0;

  this.materials = assetsManager.getResourceLoader('.material');
  this.matmods = assetsManager.getResourceLoader('.matmod');
  this.objects = assetsManager.getResourceLoader('.object');

  // TODO: Fat arrows.
  var self = this;
  this.materials.on('images', function () { self.requestRender(); });
  this.matmods.on('images', function () { self.requestRender(); });

  this._canvasPool = [];
  this._regions = {};

  this._bounds = viewport.getBoundingClientRect();
  this._regionsX = 0;
  this._regionsY = 0;
  this._fromRegionX = 0;
  this._fromRegionY = 0;
  this._toRegionX = 0;
  this._toRegionY = 0;
  this._originX = 0;
  this._originY = 0;
  this._visibleRegionsX = 0;
  this._visibleRegionsY = 0;

  this._requestingRender = false;
  this._setup = false;

  // Set up information about the world when it's available.
  if (worldManager.metadata) {
    this._loadMetadata(worldManager.metadata);
  }

  worldManager.on('load', function (event) {
    self._loadMetadata(worldManager.metadata);
  });
}

/**
 * Centers the renderer viewport on the specified coordinates.
 * @param {number} tileX The X in-game coordinate to center on.
 * @param {number} tileY The Y in-game coordinate to center on.
 */
WorldRenderer.prototype.center = function (tileX, tileY) {
  this.centerX = tileX;
  this.centerY = tileY;
  this._calculateViewport();
};

WorldRenderer.prototype.getRegion = function (regionX, regionY, opt_skipNeighbors) {
  // Wrap the X axis.
  if (regionX >= this._regionsX) {
    regionX -= this._regionsX;
  } else if (regionX < 0) {
    regionX += this._regionsX;
  }

  // The Y axis doesn't wrap.
  if (regionY < 0 || regionY >= this._regionsY) {
    return null;
  }

  var key = regionX + ':' + regionY;

  // Get or create the region.
  var region;
  if (key in this._regions) {
    region = this._regions[key];
  } else {
    region = new RegionRenderer(regionX, regionY);
    this._regions[key] = region;
  }

  // Load the region data if it has not been initialized yet.
  if (region.state == RegionRenderer.STATE_UNINITIALIZED) {
    region.state = RegionRenderer.STATE_LOADING;

    // TODO: Switch to fat arrows when Chrome supports it.
    var self = this;
    this.world.getRegion(regionX, regionY, function (err, regionData) {
      if (err) {
        region.state = RegionRenderer.STATE_ERROR;
        return;
      }

      region.data = regionData;
      region.state = RegionRenderer.STATE_READY;

      // Ensure that the graphics for all the tiles in this region are loaded.
      var ids = regionData.getResourceIds();
      self.materials.loadImages(ids.materials);
      self.matmods.loadImages(ids.matmods);

      self.requestRender();
    });
  }

  // If the region should not get neighbors, return now.
  if (opt_skipNeighbors) return region;

  // Add references to surrounding regions.
  if (!region.neighbors) {
    region.neighbors = [
      this.getRegion(regionX, regionY + 1, true),
      this.getRegion(regionX + 1, regionY, true),
      this.getRegion(regionX, regionY - 1, true),
      this.getRegion(regionX - 1, regionY, true)
    ];
  }

  return region;
};

WorldRenderer.prototype.isRegionVisible = function (region) {
  if (!region) return false;

  var fromX = this._fromRegionX, toX = this._toRegionX,
      fromY = this._fromRegionY, toY = this._toRegionY;

  var visibleY = region.y >= fromY && region.y < toY;
  var visibleX = (region.x >= fromX && region.x < toX) ||
    (region.x >= fromX - this._regionsX && region.x < toX - this._regionsX) ||
    (region.x >= fromX + this._regionsX && region.x < toX + this._regionsX);

  return visibleX && visibleY;
};

// Start loading the resource indexes.
WorldRenderer.prototype.preload = function () {
  this.materials.loadIndex();
  this.matmods.loadIndex();
  this.objects.loadIndex();
};

// TODO: When Chrome and Firefox support CanvasProxy offload rendering to the
//       worker.
WorldRenderer.prototype.render = function () {
  if (!this._setup) {
    this._calculateViewport();
    return;
  }

  // TODO: Create a more intelligent render loop.
  for (var regionY = this._fromRegionY; regionY < this._toRegionY; regionY++) {
    for (var regionX = this._fromRegionX; regionX < this._toRegionX; regionX++) {
      var region = this.getRegion(regionX, regionY);

      // Attempt to find a canvas that is already assigned to the current region.
      var canvas = null, freeItem = null, rerender = false;
      for (var i = 0; i < this._canvasPool.length; i++) {
        var poolItem = this._canvasPool[i];

        var poolRegion = poolItem.region;
        if (poolRegion == region) {
          canvas = poolItem.canvas;
          break;
        }

        // Remember one item in the pool that is free in case we need it.
        if (!freeItem && (!poolRegion || !this.isRegionVisible(poolRegion))) {
          freeItem = poolItem;
        }
      }

      // If the loop didn't break, no canvas was found. Claim one that is free.
      if (i == this._canvasPool.length) {
        freeItem.region = region;
        canvas = freeItem.canvas;

        // Indicate that we need to force rerender.
        rerender = true;
      }

      // Position the canvas correctly.
      var screenX = regionX * REGION_WIDTH,
          screenY = (this._regionsY - regionY) * REGION_HEIGHT - this._bounds.height;
      canvas.style.left = (screenX - this._originX) + 'px';
      canvas.style.top = (screenY - this._originY) + 'px';
      canvas.style.visibility = (region.state == RegionRenderer.STATE_READY ? 'visible' : 'hidden');

      // Render to the canvas if necessary.
      if (!region.complete || rerender) {
        region.render(this, canvas);
      }
    }
  }
};

WorldRenderer.prototype.requestRender = function () {
  if (this._requestingRender) return;
  this._requestingRender = true;

  var self = this;
  process.nextTick(function () {
    self.render();
    self._requestingRender = false;
  });
};

WorldRenderer.prototype.scroll = function (deltaX, deltaY) {
  this.centerX += deltaX;
  this.centerY += deltaY;

  if (this.centerX < 0) {
    this.centerX += this._regionsX * Region.TILES_X;
  } else if (this.centerX >= this._regionsX * Region.TILES_X) {
    this.centerX -= this._regionsX * Region.TILES_X;
  }

  this._calculateRegions();
};

WorldRenderer.prototype._calculateRegions = function () {
  this._fromRegionX = Math.floor(this.centerX / Region.TILES_X - this._bounds.width / 2 / REGION_WIDTH);
  this._fromRegionY = Math.floor(this.centerY / Region.TILES_Y - this._bounds.height / 2 / REGION_HEIGHT);
  this._toRegionX = this._fromRegionX + this._visibleRegionsX;
  this._toRegionY = this._fromRegionY + this._visibleRegionsY;

  this._originX = this.centerX * TILE_WIDTH - this._bounds.width / 2,
  this._originY = ((this._regionsY - 1) * Region.TILES_Y - this.centerY) * TILE_HEIGHT - this._bounds.height / 2;

  this.requestRender();
};

WorldRenderer.prototype._calculateViewport = function () {
  this._setup = true;

  this._bounds = this.viewport.getBoundingClientRect();
  this._visibleRegionsX = Math.ceil(this._bounds.width / REGION_WIDTH + 1);
  this._visibleRegionsY = Math.ceil(this._bounds.height / REGION_HEIGHT + 1);

  // Ensure that there are enough canvas elements to render the screen.
  var requiredCanvases = this._visibleRegionsX * this._visibleRegionsY;
  for (var i = this._canvasPool.length; i < requiredCanvases; i++) {
    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.visibility = 'hidden';
    canvas.width = REGION_WIDTH;
    canvas.height = REGION_HEIGHT;

    this._canvasPool.push({canvas: canvas, region: null});
    this.viewport.appendChild(canvas);
  }

  this._calculateRegions();
};

WorldRenderer.prototype._loadMetadata = function (metadata) {
  var spawn = metadata.playerStart;
  this.centerX = spawn[0];
  this.centerY = spawn[1];

  var size = metadata.planet.size;
  this._regionsX = size[0] / Region.TILES_X;
  this._regionsY = size[1] / Region.TILES_Y;
};

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"./region":13,"./regionrenderer":14,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":4}],17:[function(require,module,exports){
module.exports=require(10)
},{}],18:[function(require,module,exports){
module.exports=require(11)
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvZmFrZV9jNDY5ZTMzMS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL2xpYi9hc3NldHNtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9saWIvcmVzb3VyY2Vsb2FkZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL25vZGVfbW9kdWxlcy9tZXJnZS9tZXJnZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbm9kZV9tb2R1bGVzL3dvcmtlcnByb3h5L2luZGV4LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2luZGV4LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi9yZWdpb24uanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3JlZ2lvbnJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZG1hbmFnZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3dvcmxkcmVuZGVyZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEFzc2V0c01hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtYXNzZXRzJykuQXNzZXRzTWFuYWdlcjtcbnZhciBXb3JsZE1hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtd29ybGQnKS5Xb3JsZE1hbmFnZXI7XG52YXIgV29ybGRSZW5kZXJlciA9IHJlcXVpcmUoJ3N0YXJib3VuZC13b3JsZCcpLldvcmxkUmVuZGVyZXI7XG5cbi8vIENyZWF0ZSBhbiBhc3NldHMgbWFuYWdlciB3aGljaCB3aWxsIGRlYWwgd2l0aCBwYWNrYWdlIGZpbGVzIGV0Yy5cbnZhciBhc3NldHMgPSBuZXcgQXNzZXRzTWFuYWdlcih7d29ya2VyUGF0aDogJ2J1aWxkL3dvcmtlci1hc3NldHMuanMnfSk7XG5cbi8vIENyZWF0ZSBhIHdvcmxkIG1hbmFnZXIgdGhhdCBoYW5kbGVzIGxvYWRpbmcgdGhlIHdvcmxkIGFuZCBpdHMgcmVnaW9ucy5cbnZhciB3b3JsZCA9IG5ldyBXb3JsZE1hbmFnZXIoe3dvcmtlclBhdGg6ICdidWlsZC93b3JrZXItd29ybGQuanMnfSk7XG5cbi8vIFNldCB1cCBhIHJlbmRlcmVyIHRoYXQgd2lsbCByZW5kZXIgdGhlIGdyYXBoaWNzIG9udG8gc2NyZWVuLlxudmFyIHJlbmRlcmVyID0gbmV3IFdvcmxkUmVuZGVyZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdwb3J0JyksIHdvcmxkLCBhc3NldHMpO1xuXG5kb2N1bWVudC5zdGFyYm91bmRlZC5hc3NldHMub25jaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gIGFzc2V0cy5hZGRGaWxlKCcvJywgdGhpcy5maWxlc1swXSwgZnVuY3Rpb24gKGVycikge1xuICAgIC8vIFRPRE86IFZlcmlmeSB0aGF0IHBhY2tlZC5wYWsgd2FzIGNob3Nlbi5cbiAgICByZW5kZXJlci5wcmVsb2FkKCk7XG4gIH0pO1xufTtcblxuZG9jdW1lbnQuc3RhcmJvdW5kZWQud29ybGQub25jaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gIHdvcmxkLm9wZW4odGhpcy5maWxlc1swXSwgZnVuY3Rpb24gKGVyciwgbWV0YWRhdGEpIHtcbiAgICByZW5kZXJlci5yZW5kZXIoKTtcbiAgfSk7XG59O1xuXG5kb2N1bWVudC5vbmtleWRvd24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgY2FzZSAzNzpcbiAgICAgIHJlbmRlcmVyLnNjcm9sbCgtMSwgMCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM4OlxuICAgICAgcmVuZGVyZXIuc2Nyb2xsKDAsIDEpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOTpcbiAgICAgIHJlbmRlcmVyLnNjcm9sbCgxLCAwKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDA6XG4gICAgICByZW5kZXJlci5zY3JvbGwoMCwgLTEpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiZXhwb3J0cy5Bc3NldHNNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvYXNzZXRzbWFuYWdlcicpO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLF9fZGlybmFtZSl7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFJlc291cmNlTG9hZGVyID0gcmVxdWlyZSgnLi9yZXNvdXJjZWxvYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2V0c01hbmFnZXI7XG5cbmZ1bmN0aW9uIEFzc2V0c01hbmFnZXIob3B0X29wdGlvbnMpIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgd29ya2VyUGF0aDogX19kaXJuYW1lICsgJy8uLi93b3JrZXIuanMnXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCk7XG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2VyKTtcblxuICAvLyBSZXJvdXRlIHNvbWUgZnVuY3Rpb25zIHRvIHRoZSB3b3JrZXIuXG4gIHRoaXMuYWRkRmlsZSA9IHRoaXMuYXBpLmFkZEZpbGU7XG4gIHRoaXMuZ2V0QmxvYlVSTCA9IHRoaXMuYXBpLmdldEJsb2JVUkw7XG4gIHRoaXMuZ2V0SlNPTiA9IHRoaXMuYXBpLmdldEpTT047XG4gIHRoaXMubG9hZFJlc291cmNlcyA9IHRoaXMuYXBpLmxvYWRSZXNvdXJjZXM7XG59XG5cbi8qKlxuICogSW5kZXhlcyBhIGRpcmVjdG9yeS4gQWxsIGZpbGVzIGluIHRoZSBkaXJlY3Rvcnkgd2lsbCBiZSByZWFjaGFibGUgdGhyb3VnaFxuICogdGhlIGFzc2V0cyBkYXRhYmFzZSBhZnRlciB0aGlzIGNvbXBsZXRlcy4gQWxsIC5wYWsvLm1vZHBhayBmaWxlcyB3aWxsIGFsc29cbiAqIGJlIGxvYWRlZCBpbnRvIHRoZSBpbmRleC5cbiAqXG4gKiBUaGUgdmlydHVhbCBwYXRoIGFyZ3VtZW50IGlzIGEgcHJlZml4IGZvciB0aGUgZW50cmllcyBpbiB0aGUgZGlyZWN0b3J5LlxuICovXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGREaXJlY3RvcnkgPSBmdW5jdGlvbiAocGF0aCwgZGlyRW50cnksIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgcGVuZGluZyA9IDE7XG4gIHZhciBkZWNyZW1lbnRQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHBlbmRpbmctLTtcbiAgICBpZiAoIXBlbmRpbmcpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcmVhZGVyID0gZGlyRW50cnkuY3JlYXRlUmVhZGVyKCk7XG4gIHZhciBuZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJlYWRlci5yZWFkRW50cmllcyhmdW5jdGlvbiAoZW50cmllcykge1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgaWYgKGVudHJ5Lm5hbWVbMF0gPT0gJy4nKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGVudHJ5UGF0aCA9IHBhdGggKyAnLycgKyBlbnRyeS5uYW1lO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICBzZWxmLmFkZERpcmVjdG9yeShlbnRyeVBhdGgsIGVudHJ5LCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgICAgZW50cnkuZmlsZShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgc2VsZi5hZGRGaWxlKGVudHJ5UGF0aCwgZmlsZSwgZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgICAgfSwgZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuICB9O1xuICBuZXh0KCk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGRSb290ID0gZnVuY3Rpb24gKGRpckVudHJ5LCBjYWxsYmFjaykge1xuICB0aGlzLmFkZERpcmVjdG9yeSgnJywgZGlyRW50cnksIGNhbGxiYWNrKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldFJlc291cmNlTG9hZGVyID0gZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuICByZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKHRoaXMsIGV4dGVuc2lvbik7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIiksXCIvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc291cmNlTG9hZGVyO1xuXG4vLyBUT0RPOiBJbXBsZW1lbnQgY3VzdG9tIGNsYXNzIGZvciBvYmplY3RzIGFzIHRoZXkgYXJlIG11Y2ggbW9yZSBjb21wbGV4LlxudmFyIElNQUdFX0ZJRUxEUyA9IHtcbiAgJy5tYXRlcmlhbCc6IFsnZnJhbWVzJywgJ3BsYXRmb3JtSW1hZ2UnLCAnc3RhaXJJbWFnZSddLFxuICAnLm1hdG1vZCc6IFsnZnJhbWVzJ11cbn07XG5cbnZhciBJTUFHRV9GSUVMRF9TVUZGSVggPSAnX19pbWFnZSc7XG5cbmZ1bmN0aW9uIFJlc291cmNlTG9hZGVyKGFzc2V0c01hbmFnZXIsIGV4dGVuc2lvbikge1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICB0aGlzLmFzc2V0cyA9IGFzc2V0c01hbmFnZXI7XG4gIHRoaXMuZXh0ZW5zaW9uID0gZXh0ZW5zaW9uO1xuXG4gIHRoaXMuaW5kZXggPSBudWxsO1xuICB0aGlzLmltYWdlcyA9IG51bGw7XG5cbiAgdGhpcy5fbG9hZGluZ0luZGV4ID0gZmFsc2U7XG4gIHRoaXMuX3BlbmRpbmcgPSBbXTtcbiAgdGhpcy5fZW1pdHRpbmcgPSBmYWxzZTtcbn1cbnV0aWwuaW5oZXJpdHMoUmVzb3VyY2VMb2FkZXIsIEV2ZW50RW1pdHRlcik7XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgaWYgKCF0aGlzLmluZGV4KSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRoaXMuaW5kZXhbaWRdIHx8IG51bGw7XG59O1xuXG5SZXNvdXJjZUxvYWRlci5wcm90b3R5cGUuZ2V0SW1hZ2UgPSBmdW5jdGlvbiAoaWRPclJlc291cmNlLCBmaWVsZE5hbWUpIHtcbiAgdmFyIHJlc291cmNlID0gdHlwZW9mIGlkT3JSZXNvdXJjZSA9PSAnc3RyaW5nJyA/IHRoaXMuZ2V0KGlkT3JSZXNvdXJjZSkgOiBpZE9yUmVzb3VyY2U7XG4gIGlmICghcmVzb3VyY2UpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiByZXNvdXJjZVtmaWVsZE5hbWUgKyBJTUFHRV9GSUVMRF9TVUZGSVhdIHx8IG51bGw7XG59O1xuXG5SZXNvdXJjZUxvYWRlci5wcm90b3R5cGUubG9hZEltYWdlcyA9IGZ1bmN0aW9uIChpZHMpIHtcbiAgdmFyIGZpZWxkcyA9IElNQUdFX0ZJRUxEU1t0aGlzLmV4dGVuc2lvbl07XG4gIGlmICghZmllbGRzKSByZXR1cm47XG5cbiAgaWYgKHRoaXMuX3BlbmRpbmcpIHtcbiAgICAvLyBFbnN1cmUgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBpbmRleC5cbiAgICB0aGlzLmxvYWRJbmRleCgpO1xuXG4gICAgLy8gUXVldWUgdGhlIHJlcXVlc3RlZCBpZHMgZm9yIGxhdGVyLlxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuX3BlbmRpbmcsIGlkcyk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciByZXNvdXJjZSA9IHRoaXMuaW5kZXhbaWRzW2ldXTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykge1xuICAgICAgdGhpcy5fbG9hZEltYWdlKHJlc291cmNlLCBmaWVsZHNbal0pO1xuICAgIH1cbiAgfVxufTtcblxuUmVzb3VyY2VMb2FkZXIucHJvdG90eXBlLmxvYWRJbmRleCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX2xvYWRpbmdJbmRleCkgcmV0dXJuO1xuICB0aGlzLl9sb2FkaW5nSW5kZXggPSB0cnVlO1xuXG4gIC8vIFRPRE86IEZhdCBhcnJvd3MuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hc3NldHMubG9hZFJlc291cmNlcyh0aGlzLmV4dGVuc2lvbiwgZnVuY3Rpb24gKGVyciwgaW5kZXgpIHtcbiAgICBzZWxmLl9sb2FkaW5nSW5kZXggPSBmYWxzZTtcbiAgICBzZWxmLmluZGV4ID0gaW5kZXg7XG5cbiAgICB2YXIgcGVuZGluZyA9IHNlbGYuX3BlbmRpbmc7XG4gICAgc2VsZi5fcGVuZGluZyA9IG51bGw7XG4gICAgc2VsZi5sb2FkSW1hZ2VzKHBlbmRpbmcpO1xuICB9KTtcbn07XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5fbG9hZEltYWdlID0gZnVuY3Rpb24gKHJlc291cmNlLCBmaWVsZCkge1xuICBpZiAoIShmaWVsZCBpbiByZXNvdXJjZSkpIHJldHVybjtcblxuICB2YXIgaW1hZ2VGaWVsZCA9IGZpZWxkICsgSU1BR0VfRklFTERfU1VGRklYO1xuXG4gIC8vIElmIHRoZSBpbWFnZSBpcyBhbHJlYWR5IGxvYWRpbmcsIGRvIG5vdGhpbmcuXG4gIGlmIChpbWFnZUZpZWxkIGluIHJlc291cmNlKSByZXR1cm47XG4gIHJlc291cmNlW2ltYWdlRmllbGRdID0gbnVsbDtcblxuICAvLyBHZXQgYW4gYWJzb2x1dGUgcGF0aCB0byB0aGUgaW1hZ2UuXG4gIHZhciBwYXRoID0gcmVzb3VyY2VbZmllbGRdO1xuICBpZiAocGF0aFswXSAhPSAnLycpIHtcbiAgICB2YXIgYmFzZSA9IHJlc291cmNlLl9fcGF0aF9fO1xuICAgIHBhdGggPSBiYXNlLnN1YnN0cigwLCBiYXNlLmxhc3RJbmRleE9mKCcvJykgKyAxKSArIHBhdGg7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXNzZXRzLmdldEJsb2JVUkwocGF0aCwgZnVuY3Rpb24gKGVyciwgdXJsKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJlc291cmNlW2ltYWdlRmllbGRdID0gaW1hZ2U7XG4gICAgICBpZiAoIXNlbGYuX2VtaXR0aW5nKSB7XG4gICAgICAgIHNlbGYuX2VtaXR0aW5nID0gdHJ1ZTtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2VsZi5lbWl0KCdpbWFnZXMnKTtcbiAgICAgICAgICBzZWxmLl9lbWl0dGluZyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSkiLCIvKiFcclxuICogQG5hbWUgSmF2YVNjcmlwdC9Ob2RlSlMgTWVyZ2UgdjEuMS4yXHJcbiAqIEBhdXRob3IgeWVpa29zXHJcbiAqIEByZXBvc2l0b3J5IGh0dHBzOi8vZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2VcclxuXHJcbiAqIENvcHlyaWdodCAyMDEzIHllaWtvcyAtIE1JVCBsaWNlbnNlXHJcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlL21hc3Rlci9MSUNFTlNFXHJcbiAqL1xyXG5cclxuOyhmdW5jdGlvbihpc05vZGUpIHtcclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2UoKSB7XHJcblxyXG5cdFx0dmFyIGl0ZW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuXHRcdFx0cmVzdWx0ID0gaXRlbXMuc2hpZnQoKSxcclxuXHRcdFx0ZGVlcCA9IChyZXN1bHQgPT09IHRydWUpLFxyXG5cdFx0XHRzaXplID0gaXRlbXMubGVuZ3RoLFxyXG5cdFx0XHRpdGVtLCBpbmRleCwga2V5O1xyXG5cclxuXHRcdGlmIChkZWVwIHx8IHR5cGVPZihyZXN1bHQpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJlc3VsdCA9IHt9O1xyXG5cclxuXHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRpZiAodHlwZU9mKGl0ZW0gPSBpdGVtc1tpbmRleF0pID09PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdFx0Zm9yIChrZXkgaW4gaXRlbSlcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IGRlZXAgPyBjbG9uZShpdGVtW2tleV0pIDogaXRlbVtrZXldO1xyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xvbmUoaW5wdXQpIHtcclxuXHJcblx0XHR2YXIgb3V0cHV0ID0gaW5wdXQsXHJcblx0XHRcdHR5cGUgPSB0eXBlT2YoaW5wdXQpLFxyXG5cdFx0XHRpbmRleCwgc2l6ZTtcclxuXHJcblx0XHRpZiAodHlwZSA9PT0gJ2FycmF5Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0gW107XHJcblx0XHRcdHNpemUgPSBpbnB1dC5sZW5ndGg7XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSB7fTtcclxuXHJcblx0XHRcdGZvciAoaW5kZXggaW4gaW5wdXQpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBjbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHR5cGVPZihpbnB1dCkge1xyXG5cclxuXHRcdHJldHVybiAoe30pLnRvU3RyaW5nLmNhbGwoaW5wdXQpLm1hdGNoKC9cXHMoW1xcd10rKS8pWzFdLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdH1cclxuXHJcblx0aWYgKGlzTm9kZSkge1xyXG5cclxuXHRcdG1vZHVsZS5leHBvcnRzID0gbWVyZ2U7XHJcblxyXG5cdH0gZWxzZSB7XHJcblxyXG5cdFx0d2luZG93Lm1lcmdlID0gbWVyZ2U7XHJcblxyXG5cdH1cclxuXHJcbn0pKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47KGZ1bmN0aW9uIChjb21tb25qcykge1xuICBmdW5jdGlvbiBlcnJvck9iamVjdChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQ2FsbHNGcm9tT3duZXIoZnVuY3Rpb25zLCBvcHRpb25zKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2soaWQpIHtcbiAgICAgIHZhciBmbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9KTtcbiAgICAgIH07XG5cbiAgICAgIGZuLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2NhbGxSZXNwb25zZTogaWQsIGFyZ3VtZW50czogYXJnc30sIHRyYW5zZmVyTGlzdCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gZm47XG4gICAgfVxuXG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgICBpZiAobWVzc2FnZS5jYWxsKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxJZDtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQuXG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uc1ttZXNzYWdlLmNhbGxdO1xuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBjYWxsUmVzcG9uc2U6IGNhbGxJZCxcbiAgICAgICAgICAgIGFyZ3VtZW50czogW2Vycm9yT2JqZWN0KG5ldyBFcnJvcignVGhhdCBmdW5jdGlvbiBkb2VzIG5vdCBleGlzdCcpKV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IG1lc3NhZ2UuYXJndW1lbnRzIHx8IFtdO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjcmVhdGVDYWxsYmFjayhjYWxsSWQpXG4gICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuY2F0Y2hFcnJvcnMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvck9iamVjdChlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZuLmFwcGx5KGZ1bmN0aW9ucywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRDYWxsc1RvV29ya2VyKHdvcmtlciwgb3B0aW9ucykge1xuICAgIHZhciBjYWNoZSA9IHt9LFxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcbiAgICAgICAgbmV4dENhbGxJZCA9IDE7XG5cbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKF8sIG5hbWUpIHtcbiAgICAgIGlmIChjYWNoZVtuYW1lXSkgcmV0dXJuIGNhY2hlW25hbWVdO1xuXG4gICAgICB2YXIgZm4gPSBjYWNoZVtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZW5kQ2FsbChuYW1lLCBhcmdzKTtcbiAgICAgIH07XG5cbiAgICAgIGZuLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHNlbmRDYWxsKG5hbWUsIGFyZ3MsIHRyYW5zZmVyTGlzdCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gZm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VuZENhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgY29uc29sZS5sb2cobmFtZSwgYXJncyk7XG4gICAgICB2YXIgaWQgPSBuZXh0Q2FsbElkKys7XG5cbiAgICAgIGlmICh0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2tzW2lkXSA9IGFyZ3MucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7Y2FsbElkOiBpZCwgY2FsbDogbmFtZSwgYXJndW1lbnRzOiBhcmdzfSwgb3B0X3RyYW5zZmVyTGlzdCk7XG4gICAgfVxuXG4gICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIG1lc3NhZ2UgPSBlLmRhdGE7XG5cbiAgICAgIGlmIChtZXNzYWdlLmNhbGxSZXNwb25zZSkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsUmVzcG9uc2U7XG4gICAgICAgIGlmIChjYWxsYmFja3NbY2FsbElkXSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tjYWxsSWRdLmFwcGx5KG51bGwsIG1lc3NhZ2UuYXJndW1lbnRzKTtcbiAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxJZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChQcm94eS5jcmVhdGUpIHtcbiAgICAgIHJldHVybiBQcm94eS5jcmVhdGUoe2dldDogZ2V0SGFuZGxlcn0pO1xuICAgIH0gZWxzZSBpZiAoUHJveHkpIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoe30sIHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm94eSBzdXBwb3J0IHJlcXVpcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGwgdGhpcyBmdW5jdGlvbiB3aXRoIGVpdGhlciBhIFdvcmtlciBpbnN0YW5jZSBvciBhIG1hcCBvZiBmdW5jdGlvbnMgdGhhdFxuICAgKiBjYW4gYmUgY2FsbGVkIGluc2lkZSB0aGUgd29ya2VyLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlV29ya2VyUHJveHkod29ya2VyT3JGdW5jdGlvbnMsIG9wdF9vcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAvLyBDYXRjaCBlcnJvcnMgYW5kIGF1dG9tYXRpY2FsbHkgcmVzcG9uZCB3aXRoIGFuIGVycm9yIGNhbGxiYWNrLiBPZmYgYnlcbiAgICAgIC8vIGRlZmF1bHQgc2luY2UgaXQgYnJlYWtzIHN0YW5kYXJkIGJlaGF2aW9yLlxuICAgICAgY2F0Y2hFcnJvcnM6IGZhbHNlXG4gICAgfTtcblxuICAgIGlmIChvcHRfb3B0aW9ucykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9wdF9vcHRpb25zKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBvcHRpb25zKSkgY29udGludWU7XG4gICAgICAgIG9wdGlvbnNba2V5XSA9IG9wdF9vcHRpb25zW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5mcmVlemUob3B0aW9ucyk7XG5cbiAgICBpZiAodHlwZW9mIFdvcmtlciAhPSAndW5kZWZpbmVkJyAmJiAod29ya2VyT3JGdW5jdGlvbnMgaW5zdGFuY2VvZiBXb3JrZXIpKSB7XG4gICAgICByZXR1cm4gc2VuZENhbGxzVG9Xb3JrZXIod29ya2VyT3JGdW5jdGlvbnMsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlQ2FsbHNGcm9tT3duZXIod29ya2VyT3JGdW5jdGlvbnMsIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb21tb25qcykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlV29ya2VyUHJveHk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNjb3BlO1xuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IGdsb2JhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gd2luZG93O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gc2VsZjtcbiAgICB9XG5cbiAgICBzY29wZS5jcmVhdGVXb3JrZXJQcm94eSA9IGNyZWF0ZVdvcmtlclByb3h5O1xuICB9XG59KSh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJleHBvcnRzLldvcmxkTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL3dvcmxkbWFuYWdlcicpO1xuZXhwb3J0cy5Xb3JsZFJlbmRlcmVyID0gcmVxdWlyZSgnLi9saWIvd29ybGRyZW5kZXJlcicpO1xuIiwidmFyIFRJTEVTX1ggPSAzMjtcbnZhciBUSUxFU19ZID0gMzI7XG52YXIgVElMRVNfUEVSX1JFR0lPTiA9IFRJTEVTX1ggKiBUSUxFU19ZO1xuXG52YXIgSEVBREVSX0JZVEVTID0gMztcbnZhciBCWVRFU19QRVJfVElMRSA9IDIzO1xudmFyIEJZVEVTX1BFUl9ST1cgPSBCWVRFU19QRVJfVElMRSAqIFRJTEVTX1g7XG52YXIgQllURVNfUEVSX1JFR0lPTiA9IEJZVEVTX1BFUl9USUxFICogVElMRVNfUEVSX1JFR0lPTjtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWdpb247XG5cbmZ1bmN0aW9uIFJlZ2lvbihkYXRhKSB7XG4gIHRoaXMuYnVmZmVyID0gZGF0YS5idWZmZXI7XG4gIHRoaXMuZW50aXRpZXMgPSBkYXRhLmVudGl0aWVzO1xuICB0aGlzLnRpbGVWaWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyKTtcbn1cblxuUmVnaW9uLlRJTEVTX1ggPSBUSUxFU19YO1xuUmVnaW9uLlRJTEVTX1kgPSBUSUxFU19ZO1xuUmVnaW9uLlRJTEVTX1BFUl9SRUdJT04gPSBUSUxFU19QRVJfUkVHSU9OO1xuXG4vKipcbiAqIFJldHVybnMgbWF0ZXJpYWwgaWRzIGFuZCBtYXRlcmlhbCBtb2QgaWRzIHVzZWQgd2l0aGluIHRoZSByZWdpb24uXG4gKi9cblJlZ2lvbi5wcm90b3R5cGUuZ2V0UmVzb3VyY2VJZHMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtYXRlcmlhbElkcyA9IFtdLCBtYXRNb2RJZHMgPSBbXSwgaWQ7XG4gIGZvciAodmFyIG9mZnNldCA9IEhFQURFUl9CWVRFUzsgb2Zmc2V0IDwgSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JFR0lPTjsgb2Zmc2V0ICs9IEJZVEVTX1BFUl9USUxFKSB7XG4gICAgaWQgPSB0aGlzLnRpbGVWaWV3LmdldEludDE2KG9mZnNldCk7XG4gICAgaWYgKGlkID4gMCAmJiBtYXRlcmlhbElkcy5pbmRleE9mKGlkKSA9PSAtMSkgbWF0ZXJpYWxJZHMucHVzaChpZCk7XG4gICAgaWQgPSB0aGlzLnRpbGVWaWV3LmdldEludDE2KG9mZnNldCArIDcpO1xuICAgIGlmIChpZCA+IDAgJiYgbWF0ZXJpYWxJZHMuaW5kZXhPZihpZCkgPT0gLTEpIG1hdGVyaWFsSWRzLnB1c2goaWQpO1xuXG4gICAgaWQgPSB0aGlzLnRpbGVWaWV3LmdldEludDE2KG9mZnNldCArIDQpO1xuICAgIGlmIChpZCA+IDAgJiYgbWF0TW9kSWRzLmluZGV4T2YoaWQpID09IC0xKSBtYXRNb2RJZHMucHVzaChpZCk7XG4gICAgaWQgPSB0aGlzLnRpbGVWaWV3LmdldEludDE2KG9mZnNldCArIDExKTtcbiAgICBpZiAoaWQgPiAwICYmIG1hdE1vZElkcy5pbmRleE9mKGlkKSA9PSAtMSkgbWF0TW9kSWRzLnB1c2goaWQpO1xuICB9XG5cbiAgcmV0dXJuIHttYXRlcmlhbHM6IG1hdGVyaWFsSWRzLCBtYXRtb2RzOiBtYXRNb2RJZHN9O1xufTtcblxuUmVnaW9uLnByb3RvdHlwZS5nZXRNZXRhZGF0YSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gIHZhciBvZmZzZXQgPSB0aGlzLmdldFRpbGVPZmZzZXQoeCwgeSk7XG4gIHJldHVybiBbXG4gICAgLy8gTGlxdWlkXG4gICAgdGhpcy50aWxlVmlldy5nZXRVaW50OChvZmZzZXQgKyAxNCksXG4gICAgLy8gTGlxdWlkIHByZXNzdXJlXG4gICAgdGhpcy50aWxlVmlldy5nZXRVaW50MTYob2Zmc2V0ICsgMTUpLFxuICAgIC8vIENvbGxpc2lvbiBtYXBcbiAgICB0aGlzLnRpbGVWaWV3LmdldFVpbnQ4KG9mZnNldCArIDE3KSxcbiAgICAvLyA/XG4gICAgdGhpcy50aWxlVmlldy5nZXRJbnQxNihvZmZzZXQgKyAxOCksXG4gICAgLy8gQmlvbWU/XG4gICAgdGhpcy50aWxlVmlldy5nZXRVaW50OChvZmZzZXQgKyAyMCksXG4gICAgLy8gQmlvbWU/XG4gICAgdGhpcy50aWxlVmlldy5nZXRVaW50OChvZmZzZXQgKyAyMSksXG4gICAgLy8gSW5kZXN0cnVjdGlibGVcbiAgICAhIXRoaXMudGlsZVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgMjIpXG4gIF07XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLmdldE5laWdoYm9ycyA9IGZ1bmN0aW9uICh4LCB5LCBvcHRfYmFja2dyb3VuZCkge1xuICB2YXIgY2VudGVyID0gdGhpcy5nZXRUaWxlT2Zmc2V0KHgsIHkpICsgKG9wdF9iYWNrZ3JvdW5kID8gNyA6IDApO1xuICByZXR1cm4gW1xuICAgICEheSAmJiB0aGlzLnRpbGVWaWV3LmdldEludDE2KGNlbnRlciArIEJZVEVTX1BFUl9ST1cpLFxuICAgICh4IDwgVElMRVNfWCAtIDEpICYmIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYoY2VudGVyICsgQllURVNfUEVSX1RJTEUpLFxuICAgICh5IDwgVElMRVNfWSAtIDEpICYmIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYoY2VudGVyIC0gQllURVNfUEVSX1JPVyksXG4gICAgISF4ICYmIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYoY2VudGVyIC0gQllURVNfUEVSX1RJTEUpXG4gIF07XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLmdldFRpbGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICB2YXIgb2Zmc2V0ID0gdGhpcy5nZXRUaWxlT2Zmc2V0KHgsIHkpO1xuICByZXR1cm4gW1xuICAgIC8vIE1hdGVyaWFsIGlkXG4gICAgdGhpcy50aWxlVmlldy5nZXRJbnQxNihvZmZzZXQpLFxuICAgIC8vIEh1ZSBzaGlmdFxuICAgIHRoaXMudGlsZVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgMiksXG4gICAgLy8gVmFyaWFudD9cbiAgICB0aGlzLnRpbGVWaWV3LmdldFVpbnQ4KG9mZnNldCArIDMpLFxuICAgIC8vIE1vZFxuICAgIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgNCksXG4gICAgLy8gTW9kIGh1ZSBzaGlmdFxuICAgIHRoaXMudGlsZVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgNiksXG5cbiAgICAvLyBNYXRlcmlhbCBpZFxuICAgIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgNyksXG4gICAgLy8gSHVlIHNoaWZ0XG4gICAgdGhpcy50aWxlVmlldy5nZXRVaW50OChvZmZzZXQgKyA5KSxcbiAgICAvLyBWYXJpYW50P1xuICAgIHRoaXMudGlsZVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgMTApLFxuICAgIC8vIE1vZFxuICAgIHRoaXMudGlsZVZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgMTEpLFxuICAgIC8vIE1vZCBodWUgc2hpZnRcbiAgICB0aGlzLnRpbGVWaWV3LmdldFVpbnQ4KG9mZnNldCArIDEzKVxuICBdO1xufTtcblxuUmVnaW9uLnByb3RvdHlwZS5nZXRUaWxlT2Zmc2V0ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgcmV0dXJuIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XICogKHkgKyAxKSArIEJZVEVTX1BFUl9USUxFICogeDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlZ2lvblJlbmRlcmVyO1xuXG5cbmZ1bmN0aW9uIFJlZ2lvblJlbmRlcmVyKHgsIHkpIHtcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcblxuICB0aGlzLmRhdGEgPSBudWxsO1xuICB0aGlzLm5laWdoYm9ycyA9IG51bGw7XG5cbiAgdGhpcy5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1VOSU5JVElBTElaRUQ7XG5cbiAgLy8gVGhpcyBmbGFnIHdpbGwgYmUgdHJ1ZSBpZiB0aGlzIHJlZ2lvbiBzdWNjZXNzZnVsbHkgcmVuZGVyZWQgY29tcGxldGVseS5cbiAgdGhpcy5jb21wbGV0ZSA9IGZhbHNlO1xufVxuXG5SZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUiA9IC0xO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JVElBTElaRUQgPSAwO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORyA9IDE7XG5SZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSA9IDI7XG5cbi8vIFRPRE86IEltcGxlbWVudCBzdXBwb3J0IGZvciByZW5kZXJpbmcgb25seSBhIHBhcnQgb2YgdGhlIHJlZ2lvbi5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGNhbnZhcykge1xuICBpZiAodGhpcy5zdGF0ZSAhPSBSZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSkgcmV0dXJuO1xuXG4gIHZhciBjb21wbGV0ZSA9IHRydWU7XG5cbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSAnIzAwMCc7XG4gIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICAvLyBUT0RPOiBPcHRpbWl6ZSB0byB1c2UgYnVmZmVyIGRpcmVjdGx5LCBhbmQgcmV1c2UgbmVpZ2hib3JzLlxuICBmb3IgKHZhciB5ID0gMDsgeSA8IDMyOyB5KyspIHtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDMyOyB4KyspIHtcbiAgICAgIHZhciB0aWxlID0gdGhpcy5kYXRhLmdldFRpbGUoeCwgeSk7XG5cbiAgICAgIC8vIFRPRE86IEZpZ3VyZSBvdXQgdGhlIHJlYWwgdmFyaWFudCBhbGdvcml0aG0uXG4gICAgICB2YXIgdmFyaWFudCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NSk7XG5cbiAgICAgIC8vIFRPRE86IFRoZSByaWdodCB3YXkgdG8gZG8gdGhpcyBpcyB0byBkYXJrZW4gdGhlIHBpeGVsIHZhbHVlcy5cbiAgICAgIC8vIFRPRE86IFRoZSBiYWNrZ3JvdW5kIGRvZXNuJ3QgbmVlZCB0byBiZSByZW5kZXJlZCBpZiB0aGUgZm9yZWdyb3VuZFxuICAgICAgLy8gICAgICAgdGlsZSBpcyBvcGFxdWUgKHNlZSBcInRyYW5zcGFyZW50XCIgcHJvcGVydHkpLlxuICAgICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IC41O1xuICAgICAgY29tcGxldGUgPSBjb21wbGV0ZSAmJiB0aGlzLl9yZW5kZXJUaWxlKHJlbmRlcmVyLCBjb250ZXh0LCB0aWxlWzVdLCB4ICogOCwgeSAqIDgsIHZhcmlhbnQsIHRoaXMuZGF0YS5nZXROZWlnaGJvcnMoeCwgeSwgdHJ1ZSkpO1xuICAgICAgY29udGV4dC5nbG9iYWxBbHBoYSA9IDE7XG4gICAgICBjb21wbGV0ZSA9IGNvbXBsZXRlICYmIHRoaXMuX3JlbmRlclRpbGUocmVuZGVyZXIsIGNvbnRleHQsIHRpbGVbMF0sIHggKiA4LCB5ICogOCwgdmFyaWFudCwgdGhpcy5kYXRhLmdldE5laWdoYm9ycyh4LCB5KSk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5jb21wbGV0ZSA9IGNvbXBsZXRlO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJUaWxlID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBjb250ZXh0LCBtYXRlcmlhbCwgeCwgeSwgdmFyaWFudCwgbmVpZ2hib3JzKSB7XG4gIHZhciBkdG9wID0gbmVpZ2hib3JzWzBdID4gMCAmJiBuZWlnaGJvcnNbMF0gIT0gMzksXG4gICAgICBkcmlnaHQgPSBuZWlnaGJvcnNbMV0gPiAwICYmIG5laWdoYm9yc1sxXSAhPSAzOSxcbiAgICAgIGRib3R0b20gPSBuZWlnaGJvcnNbMl0gPiAwICYmIG5laWdoYm9yc1syXSAhPSAzOSxcbiAgICAgIGRsZWZ0ID0gbmVpZ2hib3JzWzNdID4gMCAmJiBuZWlnaGJvcnNbM10gIT0gMzk7XG5cbiAgaWYgKG1hdGVyaWFsID4gMCAmJiBtYXRlcmlhbCAhPSAzOSkge1xuICAgIHZhciBvY2VudGVyID0gcmVuZGVyZXIubWF0ZXJpYWxzLmdldChtYXRlcmlhbCksXG4gICAgICAgIGljZW50ZXIgPSByZW5kZXJlci5tYXRlcmlhbHMuZ2V0SW1hZ2Uob2NlbnRlciwgJ2ZyYW1lcycpO1xuICAgIGlmICghaWNlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaWNlbnRlciwgdmFyaWFudCAlIG9jZW50ZXIudmFyaWFudHMgKiAxNiArIDQsIDEyLCA4LCA4LCB4LCB5LCA4LCA4KTtcblxuICAgIGR0b3AgPSBkdG9wICYmIG1hdGVyaWFsID4gbmVpZ2hib3JzWzBdO1xuICAgIGRyaWdodCA9IGRyaWdodCAmJiBtYXRlcmlhbCA+IG5laWdoYm9yc1sxXTtcbiAgICBkYm90dG9tID0gZGJvdHRvbSAmJiBtYXRlcmlhbCA+IG5laWdoYm9yc1syXTtcbiAgICBkbGVmdCA9IGRsZWZ0ICYmIG1hdGVyaWFsID4gbmVpZ2hib3JzWzNdO1xuICB9XG5cbiAgdmFyIGl0b3AsIGlyaWdodCwgaWJvdHRvbSwgaWxlZnQsXG4gICAgICBvdG9wLCBvcmlnaHQsIG9ib3R0b20sIG9sZWZ0LFxuICAgICAgdnRvcCwgdnJpZ2h0LCB2Ym90dG9tLCB2bGVmdDtcblxuICBpZiAoZHJpZ2h0KSB7XG4gICAgb3JpZ2h0ID0gcmVuZGVyZXIubWF0ZXJpYWxzLmdldChuZWlnaGJvcnNbMV0pO1xuICAgIGlyaWdodCA9IHJlbmRlcmVyLm1hdGVyaWFscy5nZXRJbWFnZShvcmlnaHQsICdmcmFtZXMnKTtcbiAgICBpZiAoIWlyaWdodCkgcmV0dXJuIGZhbHNlO1xuICAgIHZyaWdodCA9IHZhcmlhbnQgJSBvcmlnaHQudmFyaWFudHMgKiAxNjtcbiAgfVxuXG4gIGlmIChkbGVmdCkge1xuICAgIG9sZWZ0ID0gcmVuZGVyZXIubWF0ZXJpYWxzLmdldChuZWlnaGJvcnNbM10pO1xuICAgIGlsZWZ0ID0gcmVuZGVyZXIubWF0ZXJpYWxzLmdldEltYWdlKG9sZWZ0LCAnZnJhbWVzJyk7XG4gICAgaWYgKCFpbGVmdCkgcmV0dXJuIGZhbHNlO1xuICAgIHZsZWZ0ID0gdmFyaWFudCAlIG9sZWZ0LnZhcmlhbnRzICogMTY7XG4gIH1cblxuICBpZiAoZHRvcCkge1xuICAgIG90b3AgPSByZW5kZXJlci5tYXRlcmlhbHMuZ2V0KG5laWdoYm9yc1swXSk7XG4gICAgaXRvcCA9IHJlbmRlcmVyLm1hdGVyaWFscy5nZXRJbWFnZShvdG9wLCAnZnJhbWVzJyk7XG4gICAgaWYgKCFpdG9wKSByZXR1cm4gZmFsc2U7XG4gICAgdnRvcCA9IHZhcmlhbnQgJSBvdG9wLnZhcmlhbnRzICogMTY7XG5cbiAgICBpZiAobmVpZ2hib3JzWzBdID09IG5laWdoYm9yc1szXSkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCwgMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChuZWlnaGJvcnNbMF0gPCBuZWlnaGJvcnNbM10pIHtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA0LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA0LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRsZWZ0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIHggKz0gNDtcblxuICBpZiAoZHRvcCkge1xuICAgIGlmIChuZWlnaGJvcnNbMF0gPT0gbmVpZ2hib3JzWzFdKSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgNCwgMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChuZWlnaGJvcnNbMF0gPCBuZWlnaGJvcnNbMV0pIHtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgOCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgOCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRyaWdodClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZHJpZ2h0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIHkgKz0gNDtcblxuICBpZiAoZGJvdHRvbSkge1xuICAgIG9ib3R0b20gPSByZW5kZXJlci5tYXRlcmlhbHMuZ2V0KG5laWdoYm9yc1syXSk7XG4gICAgaWJvdHRvbSA9IHJlbmRlcmVyLm1hdGVyaWFscy5nZXRJbWFnZShvYm90dG9tLCAnZnJhbWVzJyk7XG4gICAgaWYgKCFpYm90dG9tKSByZXR1cm4gZmFsc2U7XG4gICAgdmJvdHRvbSA9IHZhcmlhbnQgJSBvYm90dG9tLnZhcmlhbnRzICogMTY7XG5cbiAgICBpZiAobmVpZ2hib3JzWzJdID09IG5laWdoYm9yc1sxXSkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDQsIDQsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobmVpZ2hib3JzWzJdIDwgbmVpZ2hib3JzWzFdKSB7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDgsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgOCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkcmlnaHQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgeCAtPSA0O1xuXG4gIGlmIChkYm90dG9tKSB7XG4gICAgaWYgKG5laWdoYm9yc1syXSA9PSBuZWlnaGJvcnNbM10pIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20sIDQsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobmVpZ2hib3JzWzJdIDwgbmVpZ2hib3JzWzNdKSB7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgNCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGxlZnQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiKGZ1bmN0aW9uIChfX2Rpcm5hbWUpe1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vcmVnaW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRNYW5hZ2VyO1xuXG5mdW5jdGlvbiBXb3JsZE1hbmFnZXIob3B0X29wdGlvbnMpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgd29ya2VyUGF0aDogX19kaXJuYW1lICsgJy93b3JrZXIuanMnXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCk7XG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2VyKTtcblxuICB0aGlzLm1ldGFkYXRhID0gbnVsbDtcbn1cbnV0aWwuaW5oZXJpdHMoV29ybGRNYW5hZ2VyLCBFdmVudEVtaXR0ZXIpO1xuXG5Xb3JsZE1hbmFnZXIucHJvdG90eXBlLmdldFJlZ2lvbiA9IGZ1bmN0aW9uICh4LCB5LCBjYWxsYmFjaykge1xuICB0aGlzLmFwaS5nZXRSZWdpb24oeCwgeSwgZnVuY3Rpb24gKGVyciwgcmVnaW9uRGF0YSkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIG5ldyBSZWdpb24ocmVnaW9uRGF0YSkpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Xb3JsZE1hbmFnZXIucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAoZmlsZSwgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmFwaS5vcGVuKGZpbGUsIGZ1bmN0aW9uIChlcnIsIG1ldGFkYXRhKSB7XG4gICAgc2VsZi5tZXRhZGF0YSA9IG1ldGFkYXRhO1xuICAgIHNlbGYuZW1pdCgnbG9hZCcsIHttZXRhZGF0YTogbWV0YWRhdGF9KTtcbiAgICBjYWxsYmFjayhlcnIsIG1ldGFkYXRhKTtcbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsXCIvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vcmVnaW9uJyk7XG52YXIgUmVnaW9uUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlZ2lvbnJlbmRlcmVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRSZW5kZXJlcjtcblxudmFyIFRJTEVfV0lEVEggPSA4O1xudmFyIFRJTEVfSEVJR0hUID0gODtcblxudmFyIFJFR0lPTl9XSURUSCA9IFRJTEVfV0lEVEggKiBSZWdpb24uVElMRVNfWDtcbnZhciBSRUdJT05fSEVJR0hUID0gVElMRV9IRUlHSFQgKiBSZWdpb24uVElMRVNfWTtcblxuXG5mdW5jdGlvbiBXb3JsZFJlbmRlcmVyKHZpZXdwb3J0LCB3b3JsZE1hbmFnZXIsIGFzc2V0c01hbmFnZXIpIHtcbiAgLy8gRW5zdXJlIHRoYXQgY2FudmFzZXMgY2FuIGJlIGFuY2hvcmVkIHRvIHRoZSB2aWV3cG9ydC5cbiAgdmFyIHBvc2l0aW9uID0gZ2V0Q29tcHV0ZWRTdHlsZSh2aWV3cG9ydCkuZ2V0UHJvcGVydHlWYWx1ZSgncG9zaXRpb24nKTtcbiAgaWYgKHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJykge1xuICAgIHZpZXdwb3J0LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgfVxuXG4gIHRoaXMudmlld3BvcnQgPSB2aWV3cG9ydDtcbiAgdGhpcy53b3JsZCA9IHdvcmxkTWFuYWdlcjtcbiAgdGhpcy5hc3NldHMgPSBhc3NldHNNYW5hZ2VyO1xuXG4gIHRoaXMuY2VudGVyWCA9IDA7XG4gIHRoaXMuY2VudGVyWSA9IDA7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcubWF0ZXJpYWwnKTtcbiAgdGhpcy5tYXRtb2RzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm1hdG1vZCcpO1xuICB0aGlzLm9iamVjdHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcub2JqZWN0Jyk7XG5cbiAgLy8gVE9ETzogRmF0IGFycm93cy5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLm1hdGVyaWFscy5vbignaW1hZ2VzJywgZnVuY3Rpb24gKCkgeyBzZWxmLnJlcXVlc3RSZW5kZXIoKTsgfSk7XG4gIHRoaXMubWF0bW9kcy5vbignaW1hZ2VzJywgZnVuY3Rpb24gKCkgeyBzZWxmLnJlcXVlc3RSZW5kZXIoKTsgfSk7XG5cbiAgdGhpcy5fY2FudmFzUG9vbCA9IFtdO1xuICB0aGlzLl9yZWdpb25zID0ge307XG5cbiAgdGhpcy5fYm91bmRzID0gdmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHRoaXMuX3JlZ2lvbnNYID0gMDtcbiAgdGhpcy5fcmVnaW9uc1kgPSAwO1xuICB0aGlzLl9mcm9tUmVnaW9uWCA9IDA7XG4gIHRoaXMuX2Zyb21SZWdpb25ZID0gMDtcbiAgdGhpcy5fdG9SZWdpb25YID0gMDtcbiAgdGhpcy5fdG9SZWdpb25ZID0gMDtcbiAgdGhpcy5fb3JpZ2luWCA9IDA7XG4gIHRoaXMuX29yaWdpblkgPSAwO1xuICB0aGlzLl92aXNpYmxlUmVnaW9uc1ggPSAwO1xuICB0aGlzLl92aXNpYmxlUmVnaW9uc1kgPSAwO1xuXG4gIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHdvcmxkIHdoZW4gaXQncyBhdmFpbGFibGUuXG4gIGlmICh3b3JsZE1hbmFnZXIubWV0YWRhdGEpIHtcbiAgICB0aGlzLl9sb2FkTWV0YWRhdGEod29ybGRNYW5hZ2VyLm1ldGFkYXRhKTtcbiAgfVxuXG4gIHdvcmxkTWFuYWdlci5vbignbG9hZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHNlbGYuX2xvYWRNZXRhZGF0YSh3b3JsZE1hbmFnZXIubWV0YWRhdGEpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDZW50ZXJzIHRoZSByZW5kZXJlciB2aWV3cG9ydCBvbiB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbGVYIFRoZSBYIGluLWdhbWUgY29vcmRpbmF0ZSB0byBjZW50ZXIgb24uXG4gKiBAcGFyYW0ge251bWJlcn0gdGlsZVkgVGhlIFkgaW4tZ2FtZSBjb29yZGluYXRlIHRvIGNlbnRlciBvbi5cbiAqL1xuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24gKHRpbGVYLCB0aWxlWSkge1xuICB0aGlzLmNlbnRlclggPSB0aWxlWDtcbiAgdGhpcy5jZW50ZXJZID0gdGlsZVk7XG4gIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5nZXRSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uWCwgcmVnaW9uWSwgb3B0X3NraXBOZWlnaGJvcnMpIHtcbiAgLy8gV3JhcCB0aGUgWCBheGlzLlxuICBpZiAocmVnaW9uWCA+PSB0aGlzLl9yZWdpb25zWCkge1xuICAgIHJlZ2lvblggLT0gdGhpcy5fcmVnaW9uc1g7XG4gIH0gZWxzZSBpZiAocmVnaW9uWCA8IDApIHtcbiAgICByZWdpb25YICs9IHRoaXMuX3JlZ2lvbnNYO1xuICB9XG5cbiAgLy8gVGhlIFkgYXhpcyBkb2Vzbid0IHdyYXAuXG4gIGlmIChyZWdpb25ZIDwgMCB8fCByZWdpb25ZID49IHRoaXMuX3JlZ2lvbnNZKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIga2V5ID0gcmVnaW9uWCArICc6JyArIHJlZ2lvblk7XG5cbiAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgcmVnaW9uLlxuICB2YXIgcmVnaW9uO1xuICBpZiAoa2V5IGluIHRoaXMuX3JlZ2lvbnMpIHtcbiAgICByZWdpb24gPSB0aGlzLl9yZWdpb25zW2tleV07XG4gIH0gZWxzZSB7XG4gICAgcmVnaW9uID0gbmV3IFJlZ2lvblJlbmRlcmVyKHJlZ2lvblgsIHJlZ2lvblkpO1xuICAgIHRoaXMuX3JlZ2lvbnNba2V5XSA9IHJlZ2lvbjtcbiAgfVxuXG4gIC8vIExvYWQgdGhlIHJlZ2lvbiBkYXRhIGlmIGl0IGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCB5ZXQuXG4gIGlmIChyZWdpb24uc3RhdGUgPT0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JTklUSUFMSVpFRCkge1xuICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX0xPQURJTkc7XG5cbiAgICAvLyBUT0RPOiBTd2l0Y2ggdG8gZmF0IGFycm93cyB3aGVuIENocm9tZSBzdXBwb3J0cyBpdC5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy53b3JsZC5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSwgZnVuY3Rpb24gKGVyciwgcmVnaW9uRGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUjtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZWdpb24uZGF0YSA9IHJlZ2lvbkRhdGE7XG4gICAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGdyYXBoaWNzIGZvciBhbGwgdGhlIHRpbGVzIGluIHRoaXMgcmVnaW9uIGFyZSBsb2FkZWQuXG4gICAgICB2YXIgaWRzID0gcmVnaW9uRGF0YS5nZXRSZXNvdXJjZUlkcygpO1xuICAgICAgc2VsZi5tYXRlcmlhbHMubG9hZEltYWdlcyhpZHMubWF0ZXJpYWxzKTtcbiAgICAgIHNlbGYubWF0bW9kcy5sb2FkSW1hZ2VzKGlkcy5tYXRtb2RzKTtcblxuICAgICAgc2VsZi5yZXF1ZXN0UmVuZGVyKCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBJZiB0aGUgcmVnaW9uIHNob3VsZCBub3QgZ2V0IG5laWdoYm9ycywgcmV0dXJuIG5vdy5cbiAgaWYgKG9wdF9za2lwTmVpZ2hib3JzKSByZXR1cm4gcmVnaW9uO1xuXG4gIC8vIEFkZCByZWZlcmVuY2VzIHRvIHN1cnJvdW5kaW5nIHJlZ2lvbnMuXG4gIGlmICghcmVnaW9uLm5laWdoYm9ycykge1xuICAgIHJlZ2lvbi5uZWlnaGJvcnMgPSBbXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZICsgMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YICsgMSwgcmVnaW9uWSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YIC0gMSwgcmVnaW9uWSwgdHJ1ZSlcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHJlZ2lvbjtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmlzUmVnaW9uVmlzaWJsZSA9IGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgaWYgKCFyZWdpb24pIHJldHVybiBmYWxzZTtcblxuICB2YXIgZnJvbVggPSB0aGlzLl9mcm9tUmVnaW9uWCwgdG9YID0gdGhpcy5fdG9SZWdpb25YLFxuICAgICAgZnJvbVkgPSB0aGlzLl9mcm9tUmVnaW9uWSwgdG9ZID0gdGhpcy5fdG9SZWdpb25ZO1xuXG4gIHZhciB2aXNpYmxlWSA9IHJlZ2lvbi55ID49IGZyb21ZICYmIHJlZ2lvbi55IDwgdG9ZO1xuICB2YXIgdmlzaWJsZVggPSAocmVnaW9uLnggPj0gZnJvbVggJiYgcmVnaW9uLnggPCB0b1gpIHx8XG4gICAgKHJlZ2lvbi54ID49IGZyb21YIC0gdGhpcy5fcmVnaW9uc1ggJiYgcmVnaW9uLnggPCB0b1ggLSB0aGlzLl9yZWdpb25zWCkgfHxcbiAgICAocmVnaW9uLnggPj0gZnJvbVggKyB0aGlzLl9yZWdpb25zWCAmJiByZWdpb24ueCA8IHRvWCArIHRoaXMuX3JlZ2lvbnNYKTtcblxuICByZXR1cm4gdmlzaWJsZVggJiYgdmlzaWJsZVk7XG59O1xuXG4vLyBTdGFydCBsb2FkaW5nIHRoZSByZXNvdXJjZSBpbmRleGVzLlxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5tYXRlcmlhbHMubG9hZEluZGV4KCk7XG4gIHRoaXMubWF0bW9kcy5sb2FkSW5kZXgoKTtcbiAgdGhpcy5vYmplY3RzLmxvYWRJbmRleCgpO1xufTtcblxuLy8gVE9ETzogV2hlbiBDaHJvbWUgYW5kIEZpcmVmb3ggc3VwcG9ydCBDYW52YXNQcm94eSBvZmZsb2FkIHJlbmRlcmluZyB0byB0aGVcbi8vICAgICAgIHdvcmtlci5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9zZXR1cCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVE9ETzogQ3JlYXRlIGEgbW9yZSBpbnRlbGxpZ2VudCByZW5kZXIgbG9vcC5cbiAgZm9yICh2YXIgcmVnaW9uWSA9IHRoaXMuX2Zyb21SZWdpb25ZOyByZWdpb25ZIDwgdGhpcy5fdG9SZWdpb25ZOyByZWdpb25ZKyspIHtcbiAgICBmb3IgKHZhciByZWdpb25YID0gdGhpcy5fZnJvbVJlZ2lvblg7IHJlZ2lvblggPCB0aGlzLl90b1JlZ2lvblg7IHJlZ2lvblgrKykge1xuICAgICAgdmFyIHJlZ2lvbiA9IHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblkpO1xuXG4gICAgICAvLyBBdHRlbXB0IHRvIGZpbmQgYSBjYW52YXMgdGhhdCBpcyBhbHJlYWR5IGFzc2lnbmVkIHRvIHRoZSBjdXJyZW50IHJlZ2lvbi5cbiAgICAgIHZhciBjYW52YXMgPSBudWxsLCBmcmVlSXRlbSA9IG51bGwsIHJlcmVuZGVyID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NhbnZhc1Bvb2wubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBvb2xJdGVtID0gdGhpcy5fY2FudmFzUG9vbFtpXTtcblxuICAgICAgICB2YXIgcG9vbFJlZ2lvbiA9IHBvb2xJdGVtLnJlZ2lvbjtcbiAgICAgICAgaWYgKHBvb2xSZWdpb24gPT0gcmVnaW9uKSB7XG4gICAgICAgICAgY2FudmFzID0gcG9vbEl0ZW0uY2FudmFzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtZW1iZXIgb25lIGl0ZW0gaW4gdGhlIHBvb2wgdGhhdCBpcyBmcmVlIGluIGNhc2Ugd2UgbmVlZCBpdC5cbiAgICAgICAgaWYgKCFmcmVlSXRlbSAmJiAoIXBvb2xSZWdpb24gfHwgIXRoaXMuaXNSZWdpb25WaXNpYmxlKHBvb2xSZWdpb24pKSkge1xuICAgICAgICAgIGZyZWVJdGVtID0gcG9vbEl0ZW07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGxvb3AgZGlkbid0IGJyZWFrLCBubyBjYW52YXMgd2FzIGZvdW5kLiBDbGFpbSBvbmUgdGhhdCBpcyBmcmVlLlxuICAgICAgaWYgKGkgPT0gdGhpcy5fY2FudmFzUG9vbC5sZW5ndGgpIHtcbiAgICAgICAgZnJlZUl0ZW0ucmVnaW9uID0gcmVnaW9uO1xuICAgICAgICBjYW52YXMgPSBmcmVlSXRlbS5jYW52YXM7XG5cbiAgICAgICAgLy8gSW5kaWNhdGUgdGhhdCB3ZSBuZWVkIHRvIGZvcmNlIHJlcmVuZGVyLlxuICAgICAgICByZXJlbmRlciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFBvc2l0aW9uIHRoZSBjYW52YXMgY29ycmVjdGx5LlxuICAgICAgdmFyIHNjcmVlblggPSByZWdpb25YICogUkVHSU9OX1dJRFRILFxuICAgICAgICAgIHNjcmVlblkgPSAodGhpcy5fcmVnaW9uc1kgLSByZWdpb25ZKSAqIFJFR0lPTl9IRUlHSFQgLSB0aGlzLl9ib3VuZHMuaGVpZ2h0O1xuICAgICAgY2FudmFzLnN0eWxlLmxlZnQgPSAoc2NyZWVuWCAtIHRoaXMuX29yaWdpblgpICsgJ3B4JztcbiAgICAgIGNhbnZhcy5zdHlsZS50b3AgPSAoc2NyZWVuWSAtIHRoaXMuX29yaWdpblkpICsgJ3B4JztcbiAgICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gKHJlZ2lvbi5zdGF0ZSA9PSBSZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nKTtcblxuICAgICAgLy8gUmVuZGVyIHRvIHRoZSBjYW52YXMgaWYgbmVjZXNzYXJ5LlxuICAgICAgaWYgKCFyZWdpb24uY29tcGxldGUgfHwgcmVyZW5kZXIpIHtcbiAgICAgICAgcmVnaW9uLnJlbmRlcih0aGlzLCBjYW52YXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucmVxdWVzdFJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIpIHJldHVybjtcbiAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IHRydWU7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLnJlbmRlcigpO1xuICAgIHNlbGYuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgfSk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5zY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgdGhpcy5jZW50ZXJYICs9IGRlbHRhWDtcbiAgdGhpcy5jZW50ZXJZICs9IGRlbHRhWTtcblxuICBpZiAodGhpcy5jZW50ZXJYIDwgMCkge1xuICAgIHRoaXMuY2VudGVyWCArPSB0aGlzLl9yZWdpb25zWCAqIFJlZ2lvbi5USUxFU19YO1xuICB9IGVsc2UgaWYgKHRoaXMuY2VudGVyWCA+PSB0aGlzLl9yZWdpb25zWCAqIFJlZ2lvbi5USUxFU19YKSB7XG4gICAgdGhpcy5jZW50ZXJYIC09IHRoaXMuX3JlZ2lvbnNYICogUmVnaW9uLlRJTEVTX1g7XG4gIH1cblxuICB0aGlzLl9jYWxjdWxhdGVSZWdpb25zKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fY2FsY3VsYXRlUmVnaW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fZnJvbVJlZ2lvblggPSBNYXRoLmZsb29yKHRoaXMuY2VudGVyWCAvIFJlZ2lvbi5USUxFU19YIC0gdGhpcy5fYm91bmRzLndpZHRoIC8gMiAvIFJFR0lPTl9XSURUSCk7XG4gIHRoaXMuX2Zyb21SZWdpb25ZID0gTWF0aC5mbG9vcih0aGlzLmNlbnRlclkgLyBSZWdpb24uVElMRVNfWSAtIHRoaXMuX2JvdW5kcy5oZWlnaHQgLyAyIC8gUkVHSU9OX0hFSUdIVCk7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IHRoaXMuX2Zyb21SZWdpb25YICsgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYO1xuICB0aGlzLl90b1JlZ2lvblkgPSB0aGlzLl9mcm9tUmVnaW9uWSArIHRoaXMuX3Zpc2libGVSZWdpb25zWTtcblxuICB0aGlzLl9vcmlnaW5YID0gdGhpcy5jZW50ZXJYICogVElMRV9XSURUSCAtIHRoaXMuX2JvdW5kcy53aWR0aCAvIDIsXG4gIHRoaXMuX29yaWdpblkgPSAoKHRoaXMuX3JlZ2lvbnNZIC0gMSkgKiBSZWdpb24uVElMRVNfWSAtIHRoaXMuY2VudGVyWSkgKiBUSUxFX0hFSUdIVCAtIHRoaXMuX2JvdW5kcy5oZWlnaHQgLyAyO1xuXG4gIHRoaXMucmVxdWVzdFJlbmRlcigpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2NhbGN1bGF0ZVZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9zZXR1cCA9IHRydWU7XG5cbiAgdGhpcy5fYm91bmRzID0gdGhpcy52aWV3cG9ydC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYID0gTWF0aC5jZWlsKHRoaXMuX2JvdW5kcy53aWR0aCAvIFJFR0lPTl9XSURUSCArIDEpO1xuICB0aGlzLl92aXNpYmxlUmVnaW9uc1kgPSBNYXRoLmNlaWwodGhpcy5fYm91bmRzLmhlaWdodCAvIFJFR0lPTl9IRUlHSFQgKyAxKTtcblxuICAvLyBFbnN1cmUgdGhhdCB0aGVyZSBhcmUgZW5vdWdoIGNhbnZhcyBlbGVtZW50cyB0byByZW5kZXIgdGhlIHNjcmVlbi5cbiAgdmFyIHJlcXVpcmVkQ2FudmFzZXMgPSB0aGlzLl92aXNpYmxlUmVnaW9uc1ggKiB0aGlzLl92aXNpYmxlUmVnaW9uc1k7XG4gIGZvciAodmFyIGkgPSB0aGlzLl9jYW52YXNQb29sLmxlbmd0aDsgaSA8IHJlcXVpcmVkQ2FudmFzZXM7IGkrKykge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgY2FudmFzLndpZHRoID0gUkVHSU9OX1dJRFRIO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBSRUdJT05fSEVJR0hUO1xuXG4gICAgdGhpcy5fY2FudmFzUG9vbC5wdXNoKHtjYW52YXM6IGNhbnZhcywgcmVnaW9uOiBudWxsfSk7XG4gICAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZChjYW52YXMpO1xuICB9XG5cbiAgdGhpcy5fY2FsY3VsYXRlUmVnaW9ucygpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2xvYWRNZXRhZGF0YSA9IGZ1bmN0aW9uIChtZXRhZGF0YSkge1xuICB2YXIgc3Bhd24gPSBtZXRhZGF0YS5wbGF5ZXJTdGFydDtcbiAgdGhpcy5jZW50ZXJYID0gc3Bhd25bMF07XG4gIHRoaXMuY2VudGVyWSA9IHNwYXduWzFdO1xuXG4gIHZhciBzaXplID0gbWV0YWRhdGEucGxhbmV0LnNpemU7XG4gIHRoaXMuX3JlZ2lvbnNYID0gc2l6ZVswXSAvIFJlZ2lvbi5USUxFU19YO1xuICB0aGlzLl9yZWdpb25zWSA9IHNpemVbMV0gLyBSZWdpb24uVElMRVNfWTtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSkiXX0=

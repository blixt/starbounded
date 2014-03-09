(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var moment = require('moment');
var common = require('./lib/common');
var viewport = document.getElementById('viewport');
var starbound = common.setup(viewport);
starbound.world.on('load', function(world) {
  if (world.metadata.__version__ != 2) return;
  try {
    var tracks = world.metadata.worldTemplate.templateData.biomes[0].musicTrack.day.tracks;
  } catch (e) {
    return;
  }
  var trackIndex = Math.round(Math.random() * (tracks.length - 1));
  starbound.assets.getBlobURL(tracks[trackIndex], function(err, url) {
    if (err) return;
    var audio = document.createElement('audio');
    audio.autoplay = true;
    audio.controls = true;
    audio.src = url;
    document.getElementById('audio').appendChild(audio);
  });
});
function loadAssets(file) {
  starbound.assets.addFile('/', file, function(err) {
    starbound.renderer.preload();
  });
}
function loadWorld(file) {
  starbound.world.open(file, function(err, metadata) {
    starbound.renderer.render();
  });
}
var worldsAdded,
    groups = {};
function addWorld(file) {
  var reader = new FileReader();
  reader.onloadend = function() {
    if (reader.result != 'SBBF02') return;
    var list = document.starbounded.worldList;
    if (!worldsAdded) {
      list.remove(0);
      list.removeAttribute('disabled');
      document.starbounded.loadWorld.removeAttribute('disabled');
      worldsAdded = {};
    }
    worldsAdded[file.name] = file;
    var groupName,
        label;
    if (file.name.substr(- 10) == '.shipworld') {
      groupName = 'ships';
      label = 'Ship for ' + file.name.substr(0, file.name.length - 10);
    } else {
      var pieces = file.name.replace('.world', '').split('_');
      groupName = pieces[0];
      label = 'planet ' + pieces[4];
      if (pieces[5]) label += ' moon ' + pieces[5];
      label += ' @ (' + pieces[1] + ', ' + pieces[2] + ')';
      label += ', played ' + moment(file.lastModifiedDate).fromNow();
    }
    var group = groups[groupName];
    if (!group) {
      group = document.createElement('optgroup');
      group.setAttribute('label', groupName);
      groups[groupName] = group;
      list.appendChild(group);
    }
    for (var i = 0; i < group.childNodes.length; i++) {
      var other = worldsAdded[group.childNodes[i].value];
      if (other.lastModifiedDate < file.lastModifiedDate) break;
    }
    var option = new Option(label, file.name);
    group.insertBefore(option, group.childNodes[i]);
  };
  reader.readAsText(file.slice(0, 6));
}
if (document.starbounded.root.webkitdirectory) {
  document.body.classList.add('directory-support');
  document.starbounded.root.onchange = function() {
    var pendingFiles = 0;
    for (var i = 0; i < this.files.length; i++) {
      var file = this.files[i],
          path = file.webkitRelativePath,
          match;
      if (file.name[0] == '.') continue;
      if (file.name.match(/\.(ship)?world$/)) {
        addWorld(file);
      } else if (match = path.match(/^Starbound\/assets(\/.*)/)) {
        if (match[1].substr(0, 13) == '/music/music/') {
          match[1] = match[1].substr(6);
        }
        pendingFiles++;
        starbound.assets.addFile(match[1], file, function(err) {
          pendingFiles--;
          if (!pendingFiles) {
            starbound.renderer.preload();
          }
        });
      }
    }
  };
  document.starbounded.loadWorld.onclick = function() {
    var file = worldsAdded && worldsAdded[document.starbounded.worldList.value];
    if (!file) return;
    loadWorld(file);
    document.starbounded.loadWorld.setAttribute('disabled', '');
    document.starbounded.worldList.setAttribute('disabled', '');
  };
} else {
  document.starbounded.assets.onchange = function() {
    loadAssets(this.files[0]);
  };
  document.starbounded.world.onchange = function() {
    loadWorld(this.files[0]);
  };
}


},{"./lib/common":2,"moment":9}],2:[function(require,module,exports){
var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;
var WorldRenderer = require('starbound-world').WorldRenderer;
exports.setup = function(viewport) {
  var assets = new AssetsManager({
    workerPath: 'build/worker-assets.js',
    workers: 4
  });
  var world = new WorldManager({workerPath: 'build/worker-world.js'});
  var renderer = new WorldRenderer(viewport, world, assets);
  document.body.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
      case 37:
        renderer.scroll(- 10, 0, true);
        break;
      case 38:
        renderer.scroll(0, 10, true);
        break;
      case 39:
        renderer.scroll(10, 0, true);
        break;
      case 40:
        renderer.scroll(0, - 10, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  });
  var dragging = null;
  viewport.addEventListener('mousedown', function(e) {
    dragging = [e.clientX, e.clientY];
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    renderer.scroll(dragging[0] - e.clientX, e.clientY - dragging[1], true);
    dragging[0] = e.clientX;
    dragging[1] = e.clientY;
  });
  document.addEventListener('mouseup', function() {
    dragging = null;
  });
  viewport.addEventListener('wheel', function(e) {
    if (e.deltaY > 0) renderer.zoomOut();
    if (e.deltaY < 0) renderer.zoomIn();
    e.preventDefault();
  });
  return {
    assets: assets,
    renderer: renderer,
    world: world
  };
};


},{"starbound-assets":10,"starbound-world":17}],3:[function(require,module,exports){
(function (global){
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $create = Object.create;
  var $defineProperty = Object.defineProperty;
  var $defineProperties = Object.defineProperties;
  var $freeze = Object.freeze;
  var $getOwnPropertyNames = Object.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var method = nonEnum;
  function polyfillString(String) {
    $defineProperties(String.prototype, {
      startsWith: method(function(s) {
        return this.lastIndexOf(s, 0) === 0;
      }),
      endsWith: method(function(s) {
        var t = String(s);
        var l = this.length - t.length;
        return l >= 0 && this.indexOf(t, l) === l;
      }),
      contains: method(function(s) {
        return this.indexOf(s) !== - 1;
      }),
      toArray: method(function() {
        return this.split('');
      }),
      codePointAt: method(function(position) {
        var string = String(this);
        var size = string.length;
        var index = position ? Number(position): 0;
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
      })
    });
    $defineProperties(String, {
      raw: method(function(callsite) {
        var raw = callsite.raw;
        var len = raw.length >>> 0;
        if (len === 0) return '';
        var s = '';
        var i = 0;
        while (true) {
          s += raw[i];
          if (i + 1 === len) return s;
          s += arguments[++i];
        }
      }),
      fromCodePoint: method(function() {
        var codeUnits = [];
        var floor = Math.floor;
        var highSurrogate;
        var lowSurrogate;
        var index = - 1;
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
      })
    });
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var symbolInternalProperty = newUniqueString();
  var symbolDescriptionProperty = newUniqueString();
  var symbolDataProperty = newUniqueString();
  var symbolValues = Object.create(null);
  function isSymbol(symbol) {
    return typeof symbol === 'object' && symbol instanceof SymbolValue;
  }
  function typeOf(v) {
    if (isSymbol(v)) return 'symbol';
    return typeof v;
  }
  function Symbol(description) {
    var value = new SymbolValue(description);
    if (!(this instanceof Symbol)) return value;
    throw new TypeError('Symbol cannot be new\'ed');
  }
  $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
  $defineProperty(Symbol.prototype, 'toString', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!getOption('symbols')) return symbolValue[symbolInternalProperty];
    if (!symbolValue) throw TypeError('Conversion from symbol to string');
    var desc = symbolValue[symbolDescriptionProperty];
    if (desc === undefined) desc = '';
    return 'Symbol(' + desc + ')';
  }));
  $defineProperty(Symbol.prototype, 'valueOf', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!symbolValue) throw TypeError('Conversion from symbol to string');
    if (!getOption('symbols')) return symbolValue[symbolInternalProperty];
    return symbolValue;
  }));
  function SymbolValue(description) {
    var key = newUniqueString();
    $defineProperty(this, symbolDataProperty, {value: this});
    $defineProperty(this, symbolInternalProperty, {value: key});
    $defineProperty(this, symbolDescriptionProperty, {value: description});
    $freeze(this);
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
  $freeze(SymbolValue.prototype);
  Symbol.iterator = Symbol();
  function toProperty(name) {
    if (isSymbol(name)) return name[symbolInternalProperty];
    return name;
  }
  function getOwnPropertyNames(object) {
    var rv = [];
    var names = $getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (!symbolValues[name]) rv.push(name);
    }
    return rv;
  }
  function getOwnPropertyDescriptor(object, name) {
    return $getOwnPropertyDescriptor(object, toProperty(name));
  }
  function getOwnPropertySymbols(object) {
    var rv = [];
    var names = $getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var symbol = symbolValues[names[i]];
      if (symbol) rv.push(symbol);
    }
    return rv;
  }
  function hasOwnProperty(name) {
    return $hasOwnProperty.call(this, toProperty(name));
  }
  function getOption(name) {
    return global.traceur && global.traceur.options[name];
  }
  function setProperty(object, name, value) {
    var sym,
        desc;
    if (isSymbol(name)) {
      sym = name;
      name = name[symbolInternalProperty];
    }
    object[name] = value;
    if (sym && (desc = $getOwnPropertyDescriptor(object, name))) $defineProperty(object, name, {enumerable: false});
    return value;
  }
  function defineProperty(object, name, descriptor) {
    if (isSymbol(name)) {
      if (descriptor.enumerable) {
        descriptor = Object.create(descriptor, {enumerable: {value: false}});
      }
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
    Object.getOwnPropertySymbols = getOwnPropertySymbols;
    function is(left, right) {
      if (left === right) return left !== 0 || 1 / left === 1 / right;
      return left !== left && right !== right;
    }
    $defineProperty(Object, 'is', method(is));
    function assign(target, source) {
      var props = $getOwnPropertyNames(source);
      var p,
          length = props.length;
      for (p = 0; p < length; p++) {
        target[props[p]] = source[props[p]];
      }
      return target;
    }
    $defineProperty(Object, 'assign', method(assign));
    function mixin(target, source) {
      var props = $getOwnPropertyNames(source);
      var p,
          descriptor,
          length = props.length;
      for (p = 0; p < length; p++) {
        descriptor = $getOwnPropertyDescriptor(source, props[p]);
        $defineProperty(target, props[p], descriptor);
      }
      return target;
    }
    $defineProperty(Object, 'mixin', method(mixin));
  }
  function polyfillArray(Array) {
    defineProperty(Array.prototype, Symbol.iterator, method(function() {
      var index = 0;
      var array = this;
      return {next: function() {
          if (index < array.length) {
            return {
              value: array[index++],
              done: false
            };
          }
          return {
            value: undefined,
            done: true
          };
        }};
    }));
  }
  function Deferred(canceller) {
    this.canceller_ = canceller;
    this.listeners_ = [];
  }
  function notify(self) {
    while (self.listeners_.length > 0) {
      var current = self.listeners_.shift();
      var currentResult = undefined;
      try {
        try {
          if (self.result_[1]) {
            if (current.errback) currentResult = current.errback.call(undefined, self.result_[0]);
          } else {
            if (current.callback) currentResult = current.callback.call(undefined, self.result_[0]);
          }
          current.deferred.callback(currentResult);
        } catch (err) {
          current.deferred.errback(err);
        }
      } catch (unused) {}
    }
  }
  function fire(self, value, isError) {
    if (self.fired_) throw new Error('already fired');
    self.fired_ = true;
    self.result_ = [value, isError];
    notify(self);
  }
  Deferred.prototype = {
    constructor: Deferred,
    fired_: false,
    result_: undefined,
    createPromise: function() {
      return {
        then: this.then.bind(this),
        cancel: this.cancel.bind(this)
      };
    },
    callback: function(value) {
      fire(this, value, false);
    },
    errback: function(err) {
      fire(this, err, true);
    },
    then: function(callback, errback) {
      var result = new Deferred(this.cancel.bind(this));
      this.listeners_.push({
        deferred: result,
        callback: callback,
        errback: errback
      });
      if (this.fired_) notify(this);
      return result.createPromise();
    },
    cancel: function() {
      if (this.fired_) throw new Error('already finished');
      var result;
      if (this.canceller_) {
        result = this.canceller_(this);
        if (!result instanceof Error) result = new Error(result);
      } else {
        result = new Error('cancelled');
      }
      if (!this.fired_) {
        this.result_ = [result, true];
        notify(this);
      }
    }
  };
  function ModuleImpl(url, func, self) {
    this.url = url;
    this.func = func;
    this.self = self;
    this.value_ = null;
  }
  ModuleImpl.prototype = {get value() {
      if (this.value_) return this.value_;
      return this.value_ = this.func.call(this.self);
    }};
  var modules = {'@traceur/module': {
      ModuleImpl: ModuleImpl,
      registerModule: function(url, func, self) {
        modules[url] = new ModuleImpl(url, func, self);
      },
      getModuleImpl: function(url) {
        return modules[url].value;
      }
    }};
  var System = {
    get: function(name) {
      var module = modules[name];
      if (module instanceof ModuleImpl) return modules[name] = module.value;
      return module;
    },
    set: function(name, object) {
      modules[name] = object;
    }
  };
  function setupGlobals(global) {
    if (!global.Symbol) global.Symbol = Symbol;
    if (!global.Symbol.iterator) global.Symbol.iterator = Symbol();
    polyfillString(global.String);
    polyfillObject(global.Object);
    polyfillArray(global.Array);
    global.System = System;
    global.Deferred = Deferred;
  }
  setupGlobals(global);
  global.$traceurRuntime = {
    Deferred: Deferred,
    setProperty: setProperty,
    setupGlobals: setupGlobals,
    toProperty: toProperty,
    typeof: typeOf
  };
})(typeof global !== 'undefined' ? global: this);


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],8:[function(require,module,exports){
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
},{"./support/isBuffer":7,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":6,"inherits":5}],9:[function(require,module,exports){
(function(undefined) {
  var moment,
      VERSION = "2.5.1",
      global = this,
      round = Math.round,
      i,
      YEAR = 0,
      MONTH = 1,
      DATE = 2,
      HOUR = 3,
      MINUTE = 4,
      SECOND = 5,
      MILLISECOND = 6,
      languages = {},
      momentProperties = {
        _isAMomentObject: null,
        _i: null,
        _f: null,
        _l: null,
        _strict: null,
        _isUTC: null,
        _offset: null,
        _pf: null,
        _lang: null
      },
      hasModule = (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'),
      aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
      aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,
      isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,
      formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
      localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,
      parseTokenOneOrTwoDigits = /\d\d?/,
      parseTokenOneToThreeDigits = /\d{1,3}/,
      parseTokenOneToFourDigits = /\d{1,4}/,
      parseTokenOneToSixDigits = /[+\-]?\d{1,6}/,
      parseTokenDigits = /\d+/,
      parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
      parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi,
      parseTokenT = /T/i,
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
      isoTimes = [['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/], ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/], ['HH:mm', /(T| )\d\d:\d\d/], ['HH', /(T| )\d\d/]],
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
      ordinalizeTokens = 'DDD w W M D d'.split(' '),
      paddedTokens = 'M D H h m s w W'.split(' '),
      formatTokenFunctions = {
        M: function() {
          return this.month() + 1;
        },
        MMM: function(format) {
          return this.lang().monthsShort(this, format);
        },
        MMMM: function(format) {
          return this.lang().months(this, format);
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
          return this.lang().weekdaysMin(this, format);
        },
        ddd: function(format) {
          return this.lang().weekdaysShort(this, format);
        },
        dddd: function(format) {
          return this.lang().weekdays(this, format);
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
              sign = y >= 0 ? '+': '-';
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
          return this.lang().meridiem(this.hours(), this.minutes(), true);
        },
        A: function() {
          return this.lang().meridiem(this.hours(), this.minutes(), false);
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
          var a = - this.zone(),
              b = "+";
          if (a < 0) {
            a = - a;
            b = "-";
          }
          return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
        },
        ZZ: function() {
          var a = - this.zone(),
              b = "+";
          if (a < 0) {
            a = - a;
            b = "-";
          }
          return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
        },
        z: function() {
          return this.zoneAbbr();
        },
        zz: function() {
          return this.zoneName();
        },
        X: function() {
          return this.unix();
        },
        Q: function() {
          return this.quarter();
        }
      },
      lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];
  function defaultParsingFlags() {
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: - 2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    };
  }
  function padToken(func, count) {
    return function(a) {
      return leftZeroFill(func.call(this, a), count);
    };
  }
  function ordinalizeToken(func, period) {
    return function(a) {
      return this.lang().ordinal(func.call(this, a), period);
    };
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
  function Language() {}
  function Moment(config) {
    checkOverflow(config);
    extend(this, config);
  }
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;
    this._milliseconds = + milliseconds + seconds * 1e3 + minutes * 6e4 + hours * 36e5;
    this._days = + days + weeks * 7;
    this._months = + months + years * 12;
    this._data = {};
    this._bubble();
  }
  function extend(a, b) {
    for (var i in b) {
      if (b.hasOwnProperty(i)) {
        a[i] = b[i];
      }
    }
    if (b.hasOwnProperty("toString")) {
      a.toString = b.toString;
    }
    if (b.hasOwnProperty("valueOf")) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function cloneMoment(m) {
    var result = {},
        i;
    for (i in m) {
      if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
        result[i] = m[i];
      }
    }
    return result;
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
    return (sign ? (forceSign ? '+': ''): '-') + output;
  }
  function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
    var milliseconds = duration._milliseconds,
        days = duration._days,
        months = duration._months,
        minutes,
        hours;
    if (milliseconds) {
      mom._d.setTime(+ mom._d + milliseconds * isAdding);
    }
    if (days || months) {
      minutes = mom.minute();
      hours = mom.hour();
    }
    if (days) {
      mom.date(mom.date() + days * isAdding);
    }
    if (months) {
      mom.month(mom.month() + months * isAdding);
    }
    if (milliseconds && !ignoreUpdateOffset) {
      moment.updateOffset(mom);
    }
    if (days || months) {
      mom.minute(minutes);
      mom.hour(hours);
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
      if (inputObject.hasOwnProperty(prop)) {
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
          method = moment.fn._lang[field],
          results = [];
      if (typeof format === 'number') {
        index = format;
        format = undefined;
      }
      getter = function(i) {
        var m = moment().utc().set(setter, i);
        return method.call(moment.fn._lang, m, format || '');
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
    var coercedNumber = + argumentForCoercion,
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
  function daysInYear(year) {
    return isLeapYear(year) ? 366: 365;
  }
  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
  function checkOverflow(m) {
    var overflow;
    if (m._a && m._pf.overflow === - 2) {
      overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH: m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE: m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR: m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE: m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND: m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND: - 1;
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
        m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0;
      }
    }
    return m._isValid;
  }
  function normalizeLanguage(key) {
    return key ? key.toLowerCase().replace('_', '-'): key;
  }
  function makeAs(input, model) {
    return model._isUTC ? moment(input).zone(model._offset || 0): moment(input).local();
  }
  extend(Language.prototype, {
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
    },
    _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
    months: function(m) {
      return this._months[m.month()];
    },
    _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
    monthsShort: function(m) {
      return this._monthsShort[m.month()];
    },
    monthsParse: function(monthName) {
      var i,
          mom,
          regex;
      if (!this._monthsParse) {
        this._monthsParse = [];
      }
      for (i = 0; i < 12; i++) {
        if (!this._monthsParse[i]) {
          mom = moment.utc([2000, i]);
          regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
          this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        if (this._monthsParse[i].test(monthName)) {
          return i;
        }
      }
    },
    _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
    weekdays: function(m) {
      return this._weekdays[m.day()];
    },
    _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
    weekdaysShort: function(m) {
      return this._weekdaysShort[m.day()];
    },
    _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
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
      LT: "h:mm A",
      L: "MM/DD/YYYY",
      LL: "MMMM D YYYY",
      LLL: "MMMM D YYYY LT",
      LLLL: "dddd, MMMM D YYYY LT"
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
        return isLower ? 'pm': 'PM';
      } else {
        return isLower ? 'am': 'AM';
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
    calendar: function(key, mom) {
      var output = this._calendar[key];
      return typeof output === 'function' ? output.apply(mom): output;
    },
    _relativeTime: {
      future: "in %s",
      past: "%s ago",
      s: "a few seconds",
      m: "a minute",
      mm: "%d minutes",
      h: "an hour",
      hh: "%d hours",
      d: "a day",
      dd: "%d days",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years"
    },
    relativeTime: function(number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return (typeof output === 'function') ? output(number, withoutSuffix, string, isFuture): output.replace(/%d/i, number);
    },
    pastFuture: function(diff, output) {
      var format = this._relativeTime[diff > 0 ? 'future': 'past'];
      return typeof format === 'function' ? format(output): format.replace(/%s/i, output);
    },
    ordinal: function(number) {
      return this._ordinal.replace("%d", number);
    },
    _ordinal: "%d",
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
    _invalidDate: 'Invalid date',
    invalidDate: function() {
      return this._invalidDate;
    }
  });
  function loadLang(key, values) {
    values.abbr = key;
    if (!languages[key]) {
      languages[key] = new Language();
    }
    languages[key].set(values);
    return languages[key];
  }
  function unloadLang(key) {
    delete languages[key];
  }
  function getLangDefinition(key) {
    var i = 0,
        j,
        lang,
        next,
        split,
        get = function(k) {
          if (!languages[k] && hasModule) {
            try {
              require('./lang/' + k);
            } catch (e) {}
          }
          return languages[k];
        };
    if (!key) {
      return moment.fn._lang;
    }
    if (!isArray(key)) {
      lang = get(key);
      if (lang) {
        return lang;
      }
      key = [key];
    }
    while (i < key.length) {
      split = normalizeLanguage(key[i]).split('-');
      j = split.length;
      next = normalizeLanguage(key[i + 1]);
      next = next ? next.split('-'): null;
      while (j > 0) {
        lang = get(split.slice(0, j).join('-'));
        if (lang) {
          return lang;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          break;
        }
        j--;
      }
      i++;
    }
    return moment.fn._lang;
  }
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, "");
    }
    return input.replace(/\\/g, "");
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
      var output = "";
      for (i = 0; i < length; i++) {
        output += array[i]instanceof Function ? array[i].call(mom, format): array[i];
      }
      return output;
    };
  }
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.lang().invalidDate();
    }
    format = expandFormat(format, m.lang());
    if (!formatFunctions[format]) {
      formatFunctions[format] = makeFormatFunction(format);
    }
    return formatFunctions[format](m);
  }
  function expandFormat(format, lang) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return lang.longDateFormat(input) || input;
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
      case 'DDDD':
        return parseTokenThreeDigits;
      case 'YYYY':
      case 'GGGG':
      case 'gggg':
        return strict ? parseTokenFourDigits: parseTokenOneToFourDigits;
      case 'Y':
      case 'G':
      case 'g':
        return parseTokenSignedNumber;
      case 'YYYYYY':
      case 'YYYYY':
      case 'GGGGG':
      case 'ggggg':
        return strict ? parseTokenSixDigits: parseTokenOneToSixDigits;
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
        return getLangDefinition(config._l)._meridiemParse;
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
        return strict ? parseTokenTwoDigits: parseTokenOneOrTwoDigits;
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
      default:
        a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
        return a;
    }
  }
  function timezoneMinutesFromString(string) {
    string = string || "";
    var possibleTzMatches = (string.match(parseTokenTimezone) || []),
        tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
        parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
        minutes = + (parts[1] * 60) + toInt(parts[2]);
    return parts[0] === '+' ? - minutes: minutes;
  }
  function addTimeToArrayFromToken(token, input, config) {
    var a,
        datePartArray = config._a;
    switch (token) {
      case 'M':
      case 'MM':
        if (input != null) {
          datePartArray[MONTH] = toInt(input) - 1;
        }
        break;
      case 'MMM':
      case 'MMMM':
        a = getLangDefinition(config._l).monthsParse(input);
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
      case 'DDD':
      case 'DDDD':
        if (input != null) {
          config._dayOfYear = toInt(input);
        }
        break;
      case 'YY':
        datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900: 2000);
        break;
      case 'YYYY':
      case 'YYYYY':
      case 'YYYYYY':
        datePartArray[YEAR] = toInt(input);
        break;
      case 'a':
      case 'A':
        config._isPm = getLangDefinition(config._l).isPM(input);
        break;
      case 'H':
      case 'HH':
      case 'h':
      case 'hh':
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
      case 'X':
        config._d = new Date(parseFloat(input) * 1000);
        break;
      case 'Z':
      case 'ZZ':
        config._useUTC = true;
        config._tzm = timezoneMinutesFromString(input);
        break;
      case 'w':
      case 'ww':
      case 'W':
      case 'WW':
      case 'd':
      case 'dd':
      case 'ddd':
      case 'dddd':
      case 'e':
      case 'E':
        token = token.substr(0, 1);
      case 'gg':
      case 'gggg':
      case 'GG':
      case 'GGGG':
      case 'GGGGG':
        token = token.substr(0, 2);
        if (input) {
          config._w = config._w || {};
          config._w[token] = input;
        }
        break;
    }
  }
  function dateFromConfig(config) {
    var i,
        date,
        input = [],
        currentDate,
        yearToUse,
        fixYear,
        w,
        temp,
        lang,
        weekday,
        week;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      fixYear = function(val) {
        var int_val = parseInt(val, 10);
        return val ? (val.length < 3 ? (int_val > 68 ? 1900 + int_val: 2000 + int_val): int_val): (config._a[YEAR] == null ? moment().weekYear(): config._a[YEAR]);
      };
      w = config._w;
      if (w.GG != null || w.W != null || w.E != null) {
        temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
      } else {
        lang = getLangDefinition(config._l);
        weekday = w.d != null ? parseWeekday(w.d, lang): (w.e != null ? parseInt(w.e, 10) + lang._week.dow: 0);
        week = parseInt(w.w, 10) || 1;
        if (w.d != null && weekday < lang._week.dow) {
          week++;
        }
        temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
      }
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
    if (config._dayOfYear) {
      yearToUse = config._a[YEAR] == null ? currentDate[YEAR]: config._a[YEAR];
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
      config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1: 0): config._a[i];
    }
    input[HOUR] += toInt((config._tzm || 0) / 60);
    input[MINUTE] += toInt((config._tzm || 0) % 60);
    config._d = (config._useUTC ? makeUTCDate: makeDate).apply(null, input);
  }
  function dateFromObject(config) {
    var normalizedInput;
    if (config._d) {
      return;
    }
    normalizedInput = normalizeObjectUnits(config._i);
    config._a = [normalizedInput.year, normalizedInput.month, normalizedInput.day, normalizedInput.hour, normalizedInput.minute, normalizedInput.second, normalizedInput.millisecond];
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
    config._a = [];
    config._pf.empty = true;
    var lang = getLangDefinition(config._l),
        string = '' + config._i,
        i,
        parsedInput,
        tokens,
        token,
        skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;
    tokens = expandFormat(config._f, lang).match(formattingTokens) || [];
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
    if (config._isPm && config._a[HOUR] < 12) {
      config._a[HOUR] += 12;
    }
    if (config._isPm === false && config._a[HOUR] === 12) {
      config._a[HOUR] = 0;
    }
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
      tempConfig = extend({}, config);
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
  function makeDateFromString(config) {
    var i,
        l,
        string = config._i,
        match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(string)) {
          config._f = isoDates[i][0] + (match[6] || " ");
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
        config._f += "Z";
      }
      makeDateFromStringAndFormat(config);
    } else {
      config._d = new Date(string);
    }
  }
  function makeDateFromInput(config) {
    var input = config._i,
        matched = aspNetJsonRegex.exec(input);
    if (input === undefined) {
      config._d = new Date();
    } else if (matched) {
      config._d = new Date(+ matched[1]);
    } else if (typeof input === 'string') {
      makeDateFromString(config);
    } else if (isArray(input)) {
      config._a = input.slice(0);
      dateFromConfig(config);
    } else if (isDate(input)) {
      config._d = new Date(+ input);
    } else if (typeof (input) === 'object') {
      dateFromObject(config);
    } else {
      config._d = new Date(input);
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
  function parseWeekday(input, language) {
    if (typeof input === 'string') {
      if (!isNaN(input)) {
        input = parseInt(input, 10);
      } else {
        input = language.weekdaysParse(input);
        if (typeof input !== 'number') {
          return null;
        }
      }
    }
    return input;
  }
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
    return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime(milliseconds, withoutSuffix, lang) {
    var seconds = round(Math.abs(milliseconds) / 1000),
        minutes = round(seconds / 60),
        hours = round(minutes / 60),
        days = round(hours / 24),
        years = round(days / 365),
        args = seconds < 45 && ['s', seconds] || minutes === 1 && ['m'] || minutes < 45 && ['mm', minutes] || hours === 1 && ['h'] || hours < 22 && ['hh', hours] || days === 1 && ['d'] || days <= 25 && ['dd', days] || days <= 45 && ['M'] || days < 345 && ['MM', round(days / 30)] || years === 1 && ['y'] || ['yy', years];
    args[2] = withoutSuffix;
    args[3] = milliseconds > 0;
    args[4] = lang;
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
    adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
    return {
      week: Math.ceil(adjustedMoment.dayOfYear() / 7),
      year: adjustedMoment.year()
    };
  }
  function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
    var d = makeUTCDate(year, 0, 1).getUTCDay(),
        daysToAdd,
        dayOfYear;
    weekday = weekday != null ? weekday: firstDayOfWeek;
    daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7: 0) - (d < firstDayOfWeek ? 7: 0);
    dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
    return {
      year: dayOfYear > 0 ? year: year - 1,
      dayOfYear: dayOfYear > 0 ? dayOfYear: daysInYear(year - 1) + dayOfYear
    };
  }
  function makeMoment(config) {
    var input = config._i,
        format = config._f;
    if (input === null) {
      return moment.invalid({nullInput: true});
    }
    if (typeof input === 'string') {
      config._i = input = getLangDefinition().preparse(input);
    }
    if (moment.isMoment(input)) {
      config = cloneMoment(input);
      config._d = new Date(+ input._d);
    } else if (format) {
      if (isArray(format)) {
        makeDateFromStringAndArray(config);
      } else {
        makeDateFromStringAndFormat(config);
      }
    } else {
      makeDateFromInput(config);
    }
    return new Moment(config);
  }
  moment = function(input, format, lang, strict) {
    var c;
    if (typeof (lang) === "boolean") {
      strict = lang;
      lang = undefined;
    }
    c = {};
    c._isAMomentObject = true;
    c._i = input;
    c._f = format;
    c._l = lang;
    c._strict = strict;
    c._isUTC = false;
    c._pf = defaultParsingFlags();
    return makeMoment(c);
  };
  moment.utc = function(input, format, lang, strict) {
    var c;
    if (typeof (lang) === "boolean") {
      strict = lang;
      lang = undefined;
    }
    c = {};
    c._isAMomentObject = true;
    c._useUTC = true;
    c._isUTC = true;
    c._l = lang;
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
        parseIso;
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
      sign = (match[1] === "-") ? - 1: 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      };
    } else if (!!(match = isoDurationRegex.exec(input))) {
      sign = (match[1] === "-") ? - 1: 1;
      parseIso = function(inp) {
        var res = inp && parseFloat(inp.replace(',', '.'));
        return (isNaN(res) ? 0: res) * sign;
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
    }
    ret = new Duration(duration);
    if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
      ret._lang = input._lang;
    }
    return ret;
  };
  moment.version = VERSION;
  moment.defaultFormat = isoFormat;
  moment.updateOffset = function() {};
  moment.lang = function(key, values) {
    var r;
    if (!key) {
      return moment.fn._lang._abbr;
    }
    if (values) {
      loadLang(normalizeLanguage(key), values);
    } else if (values === null) {
      unloadLang(key);
      key = 'en';
    } else if (!languages[key]) {
      getLangDefinition(key);
    }
    r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    return r._abbr;
  };
  moment.langData = function(key) {
    if (key && key._lang && key._lang._abbr) {
      key = key._lang._abbr;
    }
    return getLangDefinition(key);
  };
  moment.isMoment = function(obj) {
    return obj instanceof Moment || (obj != null && obj.hasOwnProperty('_isAMomentObject'));
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
  moment.parseZone = function(input) {
    return moment(input).parseZone();
  };
  extend(moment.fn = Moment.prototype, {
    clone: function() {
      return moment(this);
    },
    valueOf: function() {
      return + this._d + ((this._offset || 0) * 60000);
    },
    unix: function() {
      return Math.floor(+ this / 1000);
    },
    toString: function() {
      return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
    },
    toDate: function() {
      return this._offset ? new Date(+ this): this._d;
    },
    toISOString: function() {
      var m = moment(this).utc();
      if (0 < m.year() && m.year() <= 9999) {
        return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
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
        return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a): moment(this._a)).toArray()) > 0;
      }
      return false;
    },
    parsingFlags: function() {
      return extend({}, this._pf);
    },
    invalidAt: function() {
      return this._pf.overflow;
    },
    utc: function() {
      return this.zone(0);
    },
    local: function() {
      this.zone(0);
      this._isUTC = false;
      return this;
    },
    format: function(inputString) {
      var output = formatMoment(this, inputString || moment.defaultFormat);
      return this.lang().postformat(output);
    },
    add: function(input, val) {
      var dur;
      if (typeof input === 'string') {
        dur = moment.duration(+ val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, 1);
      return this;
    },
    subtract: function(input, val) {
      var dur;
      if (typeof input === 'string') {
        dur = moment.duration(+ val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, - 1);
      return this;
    },
    diff: function(input, units, asFloat) {
      var that = makeAs(input, this),
          zoneDiff = (this.zone() - that.zone()) * 6e4,
          diff,
          output;
      units = normalizeUnits(units);
      if (units === 'year' || units === 'month') {
        diff = (this.daysInMonth() + that.daysInMonth()) * 432e5;
        output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
        output += ((this - moment(this).startOf('month')) - (that - moment(that).startOf('month'))) / diff;
        output -= ((this.zone() - moment(this).startOf('month').zone()) - (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
        if (units === 'year') {
          output = output / 12;
        }
      } else {
        diff = (this - that);
        output = units === 'second' ? diff / 1e3: units === 'minute' ? diff / 6e4: units === 'hour' ? diff / 36e5: units === 'day' ? (diff - zoneDiff) / 864e5: units === 'week' ? (diff - zoneDiff) / 6048e5: diff;
      }
      return asFloat ? output: absRound(output);
    },
    from: function(time, withoutSuffix) {
      return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
    },
    fromNow: function(withoutSuffix) {
      return this.from (moment(), withoutSuffix);
    },
    calendar: function() {
      var sod = makeAs(moment(), this).startOf('day'),
          diff = this.diff(sod, 'days', true),
          format = diff < - 6 ? 'sameElse': diff < - 1 ? 'lastWeek': diff < 0 ? 'lastDay': diff < 1 ? 'sameDay': diff < 2 ? 'nextDay': diff < 7 ? 'nextWeek': 'sameElse';
      return this.format(this.lang().calendar(format, this));
    },
    isLeapYear: function() {
      return isLeapYear(this.year());
    },
    isDST: function() {
      return (this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone());
    },
    day: function(input) {
      var day = this._isUTC ? this._d.getUTCDay(): this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.lang());
        return this.add({d: input - day});
      } else {
        return day;
      }
    },
    month: function(input) {
      var utc = this._isUTC ? 'UTC': '',
          dayOfMonth;
      if (input != null) {
        if (typeof input === 'string') {
          input = this.lang().monthsParse(input);
          if (typeof input !== 'number') {
            return this;
          }
        }
        dayOfMonth = this.date();
        this.date(1);
        this._d['set' + utc + 'Month'](input);
        this.date(Math.min(dayOfMonth, this.daysInMonth()));
        moment.updateOffset(this);
        return this;
      } else {
        return this._d['get' + utc + 'Month']();
      }
    },
    startOf: function(units) {
      units = normalizeUnits(units);
      switch (units) {
        case 'year':
          this.month(0);
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
      return this;
    },
    endOf: function(units) {
      units = normalizeUnits(units);
      return this.startOf(units).add((units === 'isoWeek' ? 'week': units), 1).subtract('ms', 1);
    },
    isAfter: function(input, units) {
      units = typeof units !== 'undefined' ? units: 'millisecond';
      return + this.clone().startOf(units) > + moment(input).startOf(units);
    },
    isBefore: function(input, units) {
      units = typeof units !== 'undefined' ? units: 'millisecond';
      return + this.clone().startOf(units) < + moment(input).startOf(units);
    },
    isSame: function(input, units) {
      units = units || 'ms';
      return + this.clone().startOf(units) === + makeAs(input, this).startOf(units);
    },
    min: function(other) {
      other = moment.apply(null, arguments);
      return other < this ? this: other;
    },
    max: function(other) {
      other = moment.apply(null, arguments);
      return other > this ? this: other;
    },
    zone: function(input) {
      var offset = this._offset || 0;
      if (input != null) {
        if (typeof input === "string") {
          input = timezoneMinutesFromString(input);
        }
        if (Math.abs(input) < 16) {
          input = input * 60;
        }
        this._offset = input;
        this._isUTC = true;
        if (offset !== input) {
          addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
        }
      } else {
        return this._isUTC ? offset: this._d.getTimezoneOffset();
      }
      return this;
    },
    zoneAbbr: function() {
      return this._isUTC ? "UTC": "";
    },
    zoneName: function() {
      return this._isUTC ? "Coordinated Universal Time": "";
    },
    parseZone: function() {
      if (this._tzm) {
        this.zone(this._tzm);
      } else if (typeof this._i === 'string') {
        this.zone(this._i);
      }
      return this;
    },
    hasAlignedHourOffset: function(input) {
      if (!input) {
        input = 0;
      } else {
        input = moment(input).zone();
      }
      return (this.zone() - input) % 60 === 0;
    },
    daysInMonth: function() {
      return daysInMonth(this.year(), this.month());
    },
    dayOfYear: function(input) {
      var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
      return input == null ? dayOfYear: this.add("d", (input - dayOfYear));
    },
    quarter: function() {
      return Math.ceil((this.month() + 1.0) / 3.0);
    },
    weekYear: function(input) {
      var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
      return input == null ? year: this.add("y", (input - year));
    },
    isoWeekYear: function(input) {
      var year = weekOfYear(this, 1, 4).year;
      return input == null ? year: this.add("y", (input - year));
    },
    week: function(input) {
      var week = this.lang().week(this);
      return input == null ? week: this.add("d", (input - week) * 7);
    },
    isoWeek: function(input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week: this.add("d", (input - week) * 7);
    },
    weekday: function(input) {
      var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
      return input == null ? weekday: this.add("d", input - weekday);
    },
    isoWeekday: function(input) {
      return input == null ? this.day() || 7: this.day(this.day() % 7 ? input: input - 7);
    },
    get: function(units) {
      units = normalizeUnits(units);
      return this[units]();
    },
    set: function(units, value) {
      units = normalizeUnits(units);
      if (typeof this[units] === 'function') {
        this[units](value);
      }
      return this;
    },
    lang: function(key) {
      if (key === undefined) {
        return this._lang;
      } else {
        this._lang = getLangDefinition(key);
        return this;
      }
    }
  });
  function makeGetterAndSetter(name, key) {
    moment.fn[name] = moment.fn[name + 's'] = function(input) {
      var utc = this._isUTC ? 'UTC': '';
      if (input != null) {
        this._d['set' + utc + key](input);
        moment.updateOffset(this);
        return this;
      } else {
        return this._d['get' + utc + key]();
      }
    };
  }
  for (i = 0; i < proxyGettersAndSetters.length; i++) {
    makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
  }
  makeGetterAndSetter('year', 'FullYear');
  moment.fn.days = moment.fn.day;
  moment.fn.months = moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  moment.fn.toJSON = moment.fn.toISOString;
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function() {
      var milliseconds = this._milliseconds,
          days = this._days,
          months = this._months,
          data = this._data,
          seconds,
          minutes,
          hours,
          years;
      data.milliseconds = milliseconds % 1000;
      seconds = absRound(milliseconds / 1000);
      data.seconds = seconds % 60;
      minutes = absRound(seconds / 60);
      data.minutes = minutes % 60;
      hours = absRound(minutes / 60);
      data.hours = hours % 24;
      days += absRound(hours / 24);
      data.days = days % 30;
      months += absRound(days / 30);
      data.months = months % 12;
      years = absRound(months / 12);
      data.years = years;
    },
    weeks: function() {
      return absRound(this.days() / 7);
    },
    valueOf: function() {
      return this._milliseconds + this._days * 864e5 + (this._months % 12) * 2592e6 + toInt(this._months / 12) * 31536e6;
    },
    humanize: function(withSuffix) {
      var difference = + this,
          output = relativeTime(difference, !withSuffix, this.lang());
      if (withSuffix) {
        output = this.lang().pastFuture(difference, output);
      }
      return this.lang().postformat(output);
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
      units = normalizeUnits(units);
      return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
    },
    lang: moment.fn.lang,
    toIsoString: function() {
      var years = Math.abs(this.years()),
          months = Math.abs(this.months()),
          days = Math.abs(this.days()),
          hours = Math.abs(this.hours()),
          minutes = Math.abs(this.minutes()),
          seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);
      if (!this.asSeconds()) {
        return 'P0D';
      }
      return (this.asSeconds() < 0 ? '-': '') + 'P' + (years ? years + 'Y': '') + (months ? months + 'M': '') + (days ? days + 'D': '') + ((hours || minutes || seconds) ? 'T': '') + (hours ? hours + 'H': '') + (minutes ? minutes + 'M': '') + (seconds ? seconds + 'S': '');
    }
  });
  function makeDurationGetter(name) {
    moment.duration.fn[name] = function() {
      return this._data[name];
    };
  }
  function makeDurationAsGetter(name, factor) {
    moment.duration.fn['as' + name] = function() {
      return + this / factor;
    };
  }
  for (i in unitMillisecondFactors) {
    if (unitMillisecondFactors.hasOwnProperty(i)) {
      makeDurationAsGetter(i, unitMillisecondFactors[i]);
      makeDurationGetter(i.toLowerCase());
    }
  }
  makeDurationAsGetter('Weeks', 6048e5);
  moment.duration.fn.asMonths = function() {
    return (+ this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
  };
  moment.lang('en', {ordinal: function(number) {
      var b = number % 10,
          output = (toInt(number % 100 / 10) === 1) ? 'th': (b === 1) ? 'st': (b === 2) ? 'nd': (b === 3) ? 'rd': 'th';
      return number + output;
    }});
  function makeGlobal(deprecate) {
    var warned = false,
        local_moment = moment;
    if (typeof ender !== 'undefined') {
      return;
    }
    if (deprecate) {
      global.moment = function() {
        if (!warned && console && console.warn) {
          warned = true;
          console.warn("Accessing Moment through the global scope is " + "deprecated, and will be removed in an upcoming " + "release.");
        }
        return local_moment.apply(null, arguments);
      };
      extend(global.moment, local_moment);
    } else {
      global['moment'] = moment;
    }
  }
  if (hasModule) {
    module.exports = moment;
    makeGlobal(true);
  } else if (typeof define === "function" && define.amd) {
    define("moment", function(require, exports, module) {
      if (module.config && module.config() && module.config().noGlobal !== true) {
        makeGlobal(module.config().noGlobal === undefined);
      }
      return moment;
    });
  } else {
    makeGlobal();
  }
}).call(this);


},{}],10:[function(require,module,exports){
exports.AssetsManager = require('./lib/assetsmanager');


},{"./lib/assetsmanager":11}],11:[function(require,module,exports){
(function (process,__dirname){
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
  this.api = workerproxy(workers, {timeCalls: true});
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
        if (entry.name[0] == '.') return;
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
  if (this._emitting[event]) return;
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
    if (!err) self._blobCache[path] = url;
    callback(err, url);
  });
};
AssetsManager.prototype.getFrames = function(imagePath) {
  var dotOffset = imagePath.lastIndexOf('.');
  var path = imagePath.substr(0, dotOffset) + '.frames';
  if (path in this._framesCache) return this._framesCache[path];
  this._framesCache[path] = null;
  var self = this;
  this.api.getJSON(path, function(err, frames) {
    if (err) {
      console.error(err.stack);
      return;
    }
    self._framesCache[path] = frames;
  });
  return null;
};
AssetsManager.prototype.getImage = function(path) {
  if (path in this._imageCache) return this._imageCache[path];
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
  if (!image) return null;
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
          throw new Error(image.width + ' not divisible by ' + flipEveryX + ' (' + path + ')');
        }
        break;
      case 'hueshift':
        hue = parseFloat(op[1]);
        break;
      case 'replace':
        if (!replace) replace = {};
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
    context.scale(- 1, 1);
    for (var x = 0; x < image.width; x += flipEveryX) {
      var flippedX = - (x + flipEveryX),
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
        hsv = convert.rgb2hsv(data[i], data[i + 1], data[i + 2]);
        hsv[0] += hue;
        if (hsv[0] < 0) hsv[0] += 360; else if (hsv[0] >= 360) hsv[0] -= 360;
        rgb = convert.hsv2rgb(hsv);
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
  if (path[0] == '/') return path;
  var base = resource.__path__;
  return base.substr(0, base.lastIndexOf('/') + 1) + path;
};
AssetsManager.prototype.getTileImage = function(resource, field, opt_hueShift) {
  path = this.getResourcePath(resource, resource[field]);
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


}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),"/node_modules/starbound-assets/lib")
},{"./resourceloader":12,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":6,"color-convert":14,"events":4,"merge":15,"util":8,"workerproxy":16}],12:[function(require,module,exports){
module.exports = ResourceLoader;
function ResourceLoader(assetsManager, extension) {
  this.assets = assetsManager;
  this.extension = extension;
  this.index = null;
  this._loadingIndex = false;
}
ResourceLoader.prototype.get = function(id) {
  if (!this.index) return null;
  return this.index[id] || null;
};
ResourceLoader.prototype.loadIndex = function() {
  if (this._loadingIndex) return;
  this._loadingIndex = true;
  var self = this;
  this.assets.loadResources(this.extension, function(err, index) {
    self._loadingIndex = false;
    self.index = index;
  });
};


},{}],13:[function(require,module,exports){
/* MIT license */

module.exports = {
  rgb2hsl: rgb2hsl,
  rgb2hsv: rgb2hsv,
  rgb2cmyk: rgb2cmyk,
  rgb2keyword: rgb2keyword,
  rgb2xyz: rgb2xyz,
  rgb2lab: rgb2lab,

  hsl2rgb: hsl2rgb,
  hsl2hsv: hsl2hsv,
  hsl2cmyk: hsl2cmyk,
  hsl2keyword: hsl2keyword,

  hsv2rgb: hsv2rgb,
  hsv2hsl: hsv2hsl,
  hsv2cmyk: hsv2cmyk,
  hsv2keyword: hsv2keyword,

  cmyk2rgb: cmyk2rgb,
  cmyk2hsl: cmyk2hsl,
  cmyk2hsv: cmyk2hsv,
  cmyk2keyword: cmyk2keyword,
  
  keyword2rgb: keyword2rgb,
  keyword2hsl: keyword2hsl,
  keyword2hsv: keyword2hsv,
  keyword2cmyk: keyword2cmyk,
  keyword2lab: keyword2lab,
  keyword2xyz: keyword2xyz,
  
  xyz2rgb: xyz2rgb,
  xyz2lab: xyz2lab,
  
  lab2xyz: lab2xyz,
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

function rgb2cmyk(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      c, m, y, k;
      
  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k);
  m = (1 - g - k) / (1 - k);
  y = (1 - b - k) / (1 - k);
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
  l /= 2;
  return [h, sl * 100, l * 100];
}

function hsv2cmyk(args) {
  return rgb2cmyk(hsv2rgb(args));
}

function hsv2keyword(args) {
  return rgb2keyword(hsv2rgb(args));
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

  r = (r < 0) ? 0 : r;
  g = (g < 0) ? 0 : g;
  b = (b < 0) ? 0 : b;

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

function keyword2rgb(keyword) {
  return cssKeywords[keyword];
}

function keyword2hsl(args) {
  return rgb2hsl(keyword2rgb(args));
}

function keyword2hsv(args) {
  return rgb2hsv(keyword2rgb(args));
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

},{}],14:[function(require,module,exports){
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
},{"./conversions":13}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
exports.WorldManager = require('./lib/worldmanager');
exports.WorldRenderer = require('./lib/worldrenderer');


},{"./lib/worldmanager":19,"./lib/worldrenderer":20}],18:[function(require,module,exports){
module.exports = RegionRenderer;
var TILES_X = 32;
var TILES_Y = 32;
var TILES_PER_REGION = TILES_X * TILES_Y;
var HEADER_BYTES = 3;
var BYTES_PER_TILE = 23;
var BYTES_PER_ROW = BYTES_PER_TILE * TILES_X;
var BYTES_PER_REGION = HEADER_BYTES + BYTES_PER_TILE * TILES_PER_REGION;
var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;
var REGION_WIDTH = TILE_WIDTH * TILES_X;
var REGION_HEIGHT = TILE_HEIGHT * TILES_Y;
function getInt16(region, offset) {
  if (region && region.view) return region.view.getInt16(offset);
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
      if (!image) throw new Error('Could not get image for orientation');
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
  if (region && region.view) return region.view.getUint8(offset);
}
function RegionRenderer(x, y) {
  this.x = x;
  this.y = y;
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
RegionRenderer.STATE_ERROR = - 1;
RegionRenderer.STATE_UNITIALIZED = 0;
RegionRenderer.STATE_LOADING = 1;
RegionRenderer.STATE_READY = 2;
RegionRenderer.prototype.render = function(renderer, offsetX, offsetY) {
  if (this.state != RegionRenderer.STATE_READY) return;
  this._renderEntities(renderer, offsetX, offsetY);
  this._renderTiles(renderer, offsetX, offsetY);
};
RegionRenderer.prototype.setDirty = function() {
  this.dirty.background = true;
  this.dirty.foreground = true;
  this.dirty.sprites = true;
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
        sprites = this._renderObject(renderer, entity);
        break;
      case 'PlantEntity1':
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
        if (!sprite.sx) sprite.sx = 0;
        if (!sprite.sy) sprite.sy = 0;
        if (!sprite.width) sprite.width = sprite.image.width;
        if (!sprite.height) sprite.height = sprite.image.height;
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
      context.drawImage(sprite.image, sprite.sx, sprite.sy, sprite.width, sprite.height, - minX + sprite.canvasX, - minY + sprite.canvasY, sprite.width, sprite.height);
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
  if (!objects) return;
  var assets = renderer.assets;
  var def = objects[entity.name];
  if (!def) throw new Error('Object not in index: ' + entity.name);
  if (def.animation) {
    var animationPath = assets.getResourcePath(def, def.animation);
  }
  var orientation = getOrientation(def.orientations, entity.orientationIndex);
  var pathAndFrame = orientation.image.split(':');
  var imagePath = assets.getResourcePath(def, pathAndFrame[0]);
  var frames = assets.getFrames(imagePath);
  if (orientation.flip) {
    if (!frames) return;
    imagePath += '?flipgridx=' + frames.frameGrid.size[0];
  }
  var image = assets.getImage(imagePath);
  if (!frames || !image) return;
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
  if (!this.dirty.background && !this.dirty.foreground) return;
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
  if (drawBackground) bgContext.clearRect(0, 0, bg.width, bg.height);
  if (drawForeground) fgContext.clearRect(0, 0, fg.width, fg.height);
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
    var variant = Math.round(Math.random() * 255);
    foregroundId = view.getInt16(offset);
    foreground = materials[foregroundId];
    if (drawBackground && (!foreground || foreground.transparent)) {
      if (!this._renderTile(bgContext, sx, sy, assets, materials, matmods, view, offset, 7, variant, neighbors)) {
        this.dirty.background = true;
      }
      bgContext.globalCompositeOperation = 'source-atop';
      bgContext.fillRect(sx, sy, 8, 8);
      bgContext.globalCompositeOperation = 'source-over';
    }
    if (drawForeground) {
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
    if (!otop) return false;
    if (otop.platform) {
      dtop = false;
    } else {
      itop = assets.getTileImage(otop, 'frames', getUint8(neighbors[0], neighbors[1] + delta + 2));
      if (!itop) return false;
      vtop = variant % otop.variants * 16;
    }
  }
  if (dright) {
    oright = materials[mright];
    if (!oright) return false;
    if (oright.platform) {
      dright = false;
    } else {
      iright = assets.getTileImage(oright, 'frames', getUint8(neighbors[4], neighbors[5] + delta + 2));
      if (!iright) return false;
      vright = variant % oright.variants * 16;
    }
  }
  if (dleft) {
    oleft = materials[mleft];
    if (!oleft) return false;
    if (oleft.platform) {
      dleft = false;
    } else {
      ileft = assets.getTileImage(oleft, 'frames', getUint8(neighbors[12], neighbors[13] + delta + 2));
      if (!ileft) return false;
      vleft = variant % oleft.variants * 16;
    }
  }
  if (dbottom) {
    obottom = materials[mbottom];
    if (!obottom) return false;
    if (obottom.platform) {
      dbottom = false;
    } else {
      ibottom = assets.getTileImage(obottom, 'frames', getUint8(neighbors[8], neighbors[9] + delta + 2));
      if (!ibottom) return false;
      vbottom = variant % obottom.variants * 16;
    }
  }
  if (mcenter > 0) {
    ocenter = materials[mcenter];
    if (!ocenter) return false;
    var hueShift = view.getUint8(offset + delta + 2);
    if (ocenter.platform) {
      icenter = assets.getTileImage(ocenter, 'platformImage', hueShift);
      if (!icenter) return false;
      vcenter = variant % ocenter.platformVariants * 8;
      if (mleft > 0 && mleft != mcenter && mright > 0 && mright != mcenter) {
        vcenter += 24 * ocenter.platformVariants;
      } else if (mright > 0 && mright != mcenter) {
        vcenter += 16 * ocenter.platformVariants;
      } else if (mleft < 1 || mleft == mcenter) {
        vcenter += 8 * ocenter.platformVariants;
      }
      context.drawImage(icenter, vcenter, 0, 8, 8, x, y, 8, 8);
    } else {
      icenter = assets.getTileImage(ocenter, 'frames', hueShift);
      if (!icenter) return false;
      vcenter = variant % ocenter.variants * 16;
      context.drawImage(icenter, vcenter + 4, 12, 8, 8, x, y, 8, 8);
    }
  }
  if (dtop) {
    if (mtop == mleft) {
      context.drawImage(itop, vtop, 0, 4, 4, x, y, 4, 4);
    } else if (mtop < mleft) {
      if (dleft) context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
      if (dleft) context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
  }
  x += 4;
  if (dtop) {
    if (mtop == mright) {
      context.drawImage(itop, vtop + 4, 0, 4, 4, x, y, 4, 4);
    } else if (mtop < mright) {
      if (dright) context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
      if (dright) context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
  }
  y += 4;
  if (dbottom) {
    if (mbottom == mright) {
      context.drawImage(ibottom, vbottom + 4, 4, 4, 4, x, y, 4, 4);
    } else if (mbottom < mright) {
      if (dright) context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
      if (dright) context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
  }
  x -= 4;
  if (dbottom) {
    if (mbottom == mleft) {
      context.drawImage(ibottom, vbottom, 4, 4, 4, x, y, 4, 4);
    } else if (mbottom < mleft) {
      if (dleft) context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
      if (dleft) context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
  }
  var modId = view.getInt16(offset + delta + 4),
      mod,
      modImage;
  if (modId > 0) {
    mod = matmods[modId];
    if (!mod) return false;
    modImage = assets.getTileImage(mod, 'frames', view.getUint8(offset + delta + 6));
    if (!modImage) return false;
    context.drawImage(modImage, 4 + variant % mod.variants * 16, 12, 8, 8, x, y - 4, 8, 8);
  }
  if (!ocenter && neighbors[8]) {
    modId = getInt16(neighbors[8], neighbors[9] + delta + 4);
    if (modId > 0) {
      mod = matmods[modId];
      if (!mod) return false;
      modImage = assets.getTileImage(mod, 'frames', getUint8(neighbors[8], neighbors[9] + delta + 6));
      if (!modImage) return false;
      context.drawImage(modImage, 4 + variant % mod.variants * 16, 8, 8, 4, x, y, 8, 4);
    }
  }
  return true;
};


},{}],19:[function(require,module,exports){
(function (__dirname){
var EventEmitter = require('events');
var merge = require('merge');
var util = require('util');
var workerproxy = require('workerproxy');
module.exports = WorldManager;
function WorldManager(opt_options) {
  EventEmitter.call(this);
  var options = {workerPath: __dirname + '/worker.js'};
  Object.seal(options);
  merge(options, opt_options);
  Object.freeze(options);
  this.options = options;
  this.metadata = null;
  var worker = new Worker(options.workerPath);
  this.api = workerproxy(worker, {timeCalls: true});
}
util.inherits(WorldManager, EventEmitter);
WorldManager.prototype.getRegion = function(x, y, callback) {
  this.api.getRegion(x, y, callback);
};
WorldManager.prototype.open = function(file, callback) {
  var $__0 = this;
  this.api.open(file, (function(err, metadata) {
    if (err) {
      console.error(err.stack);
      return;
    }
    $__0.metadata = metadata;
    $__0.emit('load', {metadata: metadata});
    callback(err, metadata);
  }));
};


}).call(this,"/node_modules/starbound-world/lib")
},{"events":4,"merge":21,"util":8,"workerproxy":22}],20:[function(require,module,exports){
var RegionRenderer = require('./regionrenderer');
module.exports = WorldRenderer;
var TILES_X = 32;
var TILES_Y = 32;
var TILES_PER_REGION = TILES_X * TILES_Y;
var HEADER_BYTES = 3;
var BYTES_PER_TILE = 23;
var BYTES_PER_ROW = BYTES_PER_TILE * TILES_X;
var BYTES_PER_REGION = HEADER_BYTES + BYTES_PER_TILE * TILES_PER_REGION;
var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;
var REGION_WIDTH = TILE_WIDTH * TILES_X;
var REGION_HEIGHT = TILE_HEIGHT * TILES_Y;
var MIN_ZOOM = .1;
var MAX_ZOOM = 3;
function WorldRenderer(viewport, worldManager, assetsManager) {
  var $__0 = this;
  var position = getComputedStyle(viewport).getPropertyValue('position');
  if (position != 'absolute' && position != 'relative') {
    viewport.style.position = 'relative';
  }
  this.viewport = viewport;
  this.world = worldManager;
  this.assets = assetsManager;
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
  this._regions = {};
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
  if (worldManager.metadata) {
    this._loadMetadata(worldManager.metadata);
  }
  worldManager.on('load', (function() {
    return $__0._loadMetadata(worldManager.metadata);
  }));
}
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
  var width = typeof opt_width == 'number' ? opt_width: canvas.width,
      height = typeof opt_height == 'number' ? opt_height: canvas.height;
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
  if (!this._loaded) return null;
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
  if (opt_skipNeighbors) return region;
  if (!region.neighbors) {
    region.neighbors = [this.getRegion(regionX, regionY + 1, true), this.getRegion(regionX + 1, regionY + 1, true), this.getRegion(regionX + 1, regionY, true), this.getRegion(regionX + 1, regionY - 1, true), this.getRegion(regionX, regionY - 1, true), this.getRegion(regionX - 1, regionY - 1, true), this.getRegion(regionX - 1, regionY, true), this.getRegion(regionX - 1, regionY + 1, true)];
    for (var i = 0; i < 8; i++) {
      var neighbor = region.neighbors[i];
      if (!neighbor) continue;
      neighbor.setDirty();
    }
    region.setDirty();
    this.requestRender();
  }
  return region;
};
WorldRenderer.prototype.isRegionVisible = function(region) {
  if (!region) return false;
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
WorldRenderer.prototype.render = function() {
  if (!this._loaded) return;
  if (!this._setup) {
    this._calculateViewport();
    return;
  }
  this._prepareCanvasPool();
  for (var i = 0; i < this._backgrounds.length; i++) {
    var bg = this._backgrounds[i];
    var image = this.assets.getImage(bg.image);
    if (!image) continue;
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
      if (!region) continue;
      var offsetX = regionX * this.screenRegionWidth - this.viewportX,
          offsetY = regionY * this.screenRegionHeight - this.viewportY;
      region.render(this, offsetX, offsetY);
    }
  }
};
WorldRenderer.prototype.requestRender = function() {
  var $__0 = this;
  if (!this._loaded || this._requestingRender) return;
  this._requestingRender = true;
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
WorldRenderer.prototype.setZoom = function(zoom) {
  if (zoom < MIN_ZOOM) zoom = MIN_ZOOM;
  if (zoom > MAX_ZOOM) zoom = MAX_ZOOM;
  if (zoom == this.zoom) return;
  this.zoom = zoom;
  this._calculateViewport();
};
WorldRenderer.prototype.zoomIn = function() {
  this.setZoom(this.zoom + this.zoom * .1);
};
WorldRenderer.prototype.zoomOut = function() {
  this.setZoom(this.zoom - this.zoom * .1);
};
WorldRenderer.prototype._calculateRegions = function() {
  if (!this._loaded) return;
  this._fromRegionX = Math.floor(this.centerX / TILES_X - this._bounds.width / 2 / this.screenRegionWidth) - 1;
  this._fromRegionY = Math.floor(this.centerY / TILES_Y - this._bounds.height / 2 / this.screenRegionHeight) - 2;
  this._toRegionX = this._fromRegionX + this._visibleRegionsX;
  this._toRegionY = this._fromRegionY + this._visibleRegionsY;
  this.viewportX = this.centerX * this._screenTileWidth - this._bounds.width / 2, this.viewportY = this.centerY * this._screenTileHeight - this._bounds.height / 2;
  this.requestRender();
};
WorldRenderer.prototype._calculateViewport = function() {
  if (!this._loaded) return;
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
WorldRenderer.prototype._loadMetadata = function(metadata) {
  var spawn,
      size;
  switch (metadata.__version__) {
    case 1:
      spawn = metadata.playerStart;
      size = metadata.planet.size;
      break;
    case 2:
    case 3:
      spawn = metadata.playerStart;
      size = metadata.worldTemplate.size;
      break;
    default:
      throw new Error('Unsupported metadata version ' + metadata.__version__);
  }
  this.centerX = spawn[0];
  this.centerY = spawn[1];
  this._tilesX = size[0];
  this._tilesY = size[1];
  this._regionsX = Math.ceil(this._tilesX / TILES_X);
  this._regionsY = Math.ceil(this._tilesY / TILES_Y);
  if (metadata.centralStructure) {
    this._backgrounds = metadata.centralStructure.backgroundOverlays;
  }
  this._loaded = true;
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


},{"./regionrenderer":18}],21:[function(require,module,exports){
module.exports=require(15)
},{}],22:[function(require,module,exports){
module.exports=require(16)
},{}]},{},[1,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvZmFrZV9iZmMwZGU3Mi5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL2NvbW1vbi5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2VzNmlmeS9ub2RlX21vZHVsZXMvdHJhY2V1ci9zcmMvcnVudGltZS9ydW50aW1lLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL2xpYi9hc3NldHNtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9saWIvcmVzb3VyY2Vsb2FkZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L2NvbnZlcnNpb25zLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvd29ya2VycHJveHkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3JlZ2lvbnJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZG1hbmFnZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3dvcmxkcmVuZGVyZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBSSxHQUFBLE9BQUEsRUFBUyxRQUFPLENBQUMsUUFBQSxDQUFBO0FBRWpCLEdBQUEsT0FBQSxFQUFTLFFBQU8sQ0FBQyxjQUFBLENBQUE7QUFFakIsR0FBQSxTQUFBLEVBQVcsU0FBQSxDQUFBLGNBQXVCLENBQUMsVUFBQSxDQUFBO0FBQ25DLEdBQUEsVUFBQSxFQUFZLE9BQUEsQ0FBQSxLQUFZLENBQUMsUUFBQSxDQUFBO0FBSTdCLFNBQUEsQ0FBQSxLQUFBLENBQUEsRUFBa0IsQ0FBQyxNQUFBLENBQVEsU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUUxQyxJQUFBLEVBQUksS0FBQSxDQUFBLFFBQUEsQ0FBQSxXQUFBLEdBQThCLEVBQUEsQ0FBRyxPQUFBO0FBRXJDLEtBQUk7QUFDRSxPQUFBLE9BQUEsRUFBUyxNQUFBLENBQUEsUUFBQSxDQUFBLGFBQUEsQ0FBQSxZQUFBLENBQUEsTUFBQSxDQUFpRCxDQUFBLENBQUEsQ0FBQSxVQUFBLENBQUEsR0FBQSxDQUFBLE1BQUE7QUFBQSxHQUM5RCxNQUFBLEVBQU8sQ0FBQSxDQUFHO0FBQ1YsVUFBQTtBQUFBO0FBR0UsS0FBQSxXQUFBLEVBQWEsS0FBQSxDQUFBLEtBQVUsQ0FBQyxJQUFBLENBQUEsTUFBVyxDQUFBLENBQUEsRUFBSyxFQUFDLE1BQUEsQ0FBQSxNQUFBLEVBQWdCLEVBQUEsQ0FBQSxDQUFBO0FBRTdELFdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBMkIsQ0FBQyxNQUFBLENBQU8sVUFBQSxDQUFBLENBQWEsU0FBQSxDQUFVLEdBQUEsQ0FBSyxJQUFBLENBQUs7QUFDbEUsTUFBQSxFQUFJLEdBQUEsQ0FBSyxPQUFBO0FBRUwsT0FBQSxNQUFBLEVBQVEsU0FBQSxDQUFBLGFBQXNCLENBQUMsT0FBQSxDQUFBO0FBQ25DLFNBQUEsQ0FBQSxRQUFBLEVBQWlCLEtBQUE7QUFDakIsU0FBQSxDQUFBLFFBQUEsRUFBaUIsS0FBQTtBQUNqQixTQUFBLENBQUEsR0FBQSxFQUFZLElBQUE7QUFDWixZQUFBLENBQUEsY0FBdUIsQ0FBQyxPQUFBLENBQUEsQ0FBQSxXQUFvQixDQUFDLEtBQUEsQ0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUFBLENBQUEsQ0FBQTtBQUtqRCxRQUFTLFdBQUEsQ0FBVyxJQUFBLENBQU07QUFDeEIsV0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUF3QixDQUFDLEdBQUEsQ0FBSyxLQUFBLENBQU0sU0FBQSxDQUFVLEdBQUEsQ0FBSztBQUNqRCxhQUFBLENBQUEsUUFBQSxDQUFBLE9BQTBCLENBQUEsQ0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUFBO0FBSTlCLFFBQVMsVUFBQSxDQUFVLElBQUEsQ0FBTTtBQUN2QixXQUFBLENBQUEsS0FBQSxDQUFBLElBQW9CLENBQUMsSUFBQSxDQUFNLFNBQUEsQ0FBVSxHQUFBLENBQUssU0FBQSxDQUFVO0FBQ2xELGFBQUEsQ0FBQSxRQUFBLENBQUEsTUFBeUIsQ0FBQSxDQUFBO0FBQUEsR0FBQSxDQUFBO0FBQUE7QUFJekIsR0FBQSxZQUFBO0FBQWEsVUFBQSxFQUFTLEVBQUEsQ0FBQTtBQUMxQixRQUFTLFNBQUEsQ0FBUyxJQUFBLENBQU07QUFFbEIsS0FBQSxPQUFBLEVBQVMsSUFBSSxXQUFVLENBQUEsQ0FBQTtBQUMzQixRQUFBLENBQUEsU0FBQSxFQUFtQixTQUFBLENBQVUsQ0FBRTtBQUM3QixNQUFBLEVBQUksTUFBQSxDQUFBLE1BQUEsR0FBaUIsU0FBQSxDQUFVLE9BQUE7QUFFM0IsT0FBQSxLQUFBLEVBQU8sU0FBQSxDQUFBLFdBQUEsQ0FBQSxTQUFBO0FBRVgsTUFBQSxFQUFJLENBQUMsV0FBQSxDQUFhO0FBRWhCLFVBQUEsQ0FBQSxNQUFXLENBQUMsQ0FBQSxDQUFBO0FBQ1osVUFBQSxDQUFBLGVBQW9CLENBQUMsVUFBQSxDQUFBO0FBQ3JCLGNBQUEsQ0FBQSxXQUFBLENBQUEsU0FBQSxDQUFBLGVBQThDLENBQUMsVUFBQSxDQUFBO0FBQy9DLGlCQUFBLEVBQWMsRUFBQSxDQUFBO0FBQUE7QUFHaEIsZUFBQSxDQUFZLElBQUEsQ0FBQSxJQUFBLENBQUEsRUFBYSxLQUFBO0FBRXJCLE9BQUEsVUFBQTtBQUFXLGFBQUE7QUFDZixNQUFBLEVBQUksSUFBQSxDQUFBLElBQUEsQ0FBQSxNQUFnQixDQUFDLENBQUMsR0FBQSxDQUFBLEdBQU8sYUFBQSxDQUFjO0FBQ3pDLGVBQUEsRUFBWSxRQUFBO0FBQ1osV0FBQSxFQUFRLFlBQUEsRUFBYyxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQWdCLENBQUMsQ0FBQSxDQUFHLEtBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxFQUFtQixHQUFBLENBQUE7QUFBQSxLQUFBLEtBQ3hEO0FBQ0QsU0FBQSxPQUFBLEVBQVMsS0FBQSxDQUFBLElBQUEsQ0FBQSxPQUFpQixDQUFDLFFBQUEsQ0FBVSxHQUFBLENBQUEsQ0FBQSxLQUFTLENBQUMsR0FBQSxDQUFBO0FBRW5ELGVBQUEsRUFBWSxPQUFBLENBQU8sQ0FBQSxDQUFBO0FBRW5CLFdBQUEsRUFBUSxVQUFBLEVBQVksT0FBQSxDQUFPLENBQUEsQ0FBQTtBQUMzQixRQUFBLEVBQUksTUFBQSxDQUFPLENBQUEsQ0FBQSxDQUFJLE1BQUEsR0FBUyxTQUFBLEVBQVcsT0FBQSxDQUFPLENBQUEsQ0FBQTtBQUMxQyxXQUFBLEdBQVMsT0FBQSxFQUFTLE9BQUEsQ0FBTyxDQUFBLENBQUEsRUFBSyxLQUFBLEVBQU8sT0FBQSxDQUFPLENBQUEsQ0FBQSxFQUFLLElBQUE7QUFDakQsV0FBQSxHQUFTLFlBQUEsRUFBYyxPQUFNLENBQUMsSUFBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQSxPQUE4QixDQUFBLENBQUE7QUFBQTtBQUcxRCxPQUFBLE1BQUEsRUFBUSxPQUFBLENBQU8sU0FBQSxDQUFBO0FBQ25CLE1BQUEsRUFBSSxDQUFDLEtBQUEsQ0FBTztBQUNWLFdBQUEsRUFBUSxTQUFBLENBQUEsYUFBc0IsQ0FBQyxVQUFBLENBQUE7QUFDL0IsV0FBQSxDQUFBLFlBQWtCLENBQUMsT0FBQSxDQUFTLFVBQUEsQ0FBQTtBQUM1QixZQUFBLENBQU8sU0FBQSxDQUFBLEVBQWEsTUFBQTtBQUNwQixVQUFBLENBQUEsV0FBZ0IsQ0FBQyxLQUFBLENBQUE7QUFBQTtBQUluQixPQUFBLEVBQVMsR0FBQSxFQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBSSxNQUFBLENBQUEsVUFBQSxDQUFBLE1BQUEsQ0FBeUIsRUFBQSxFQUFBLENBQUs7QUFDNUMsU0FBQSxNQUFBLEVBQVEsWUFBQSxDQUFZLEtBQUEsQ0FBQSxVQUFBLENBQWlCLENBQUEsQ0FBQSxDQUFBLEtBQUEsQ0FBQTtBQUN6QyxRQUFBLEVBQUksS0FBQSxDQUFBLGdCQUFBLEVBQXlCLEtBQUEsQ0FBQSxnQkFBQSxDQUF1QixNQUFBO0FBQUE7QUFHbEQsT0FBQSxPQUFBLEVBQVMsSUFBSSxPQUFNLENBQUMsS0FBQSxDQUFPLEtBQUEsQ0FBQSxJQUFBLENBQUE7QUFDL0IsU0FBQSxDQUFBLFlBQWtCLENBQUMsTUFBQSxDQUFRLE1BQUEsQ0FBQSxVQUFBLENBQWlCLENBQUEsQ0FBQSxDQUFBO0FBQUEsR0FBQTtBQUU5QyxRQUFBLENBQUEsVUFBaUIsQ0FBQyxJQUFBLENBQUEsS0FBVSxDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUEsQ0FBQTtBQUFBO0FBR2xDLEVBQUEsRUFBSSxRQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxlQUFBLENBQTJDO0FBRTdDLFVBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQSxDQUFBLEdBQTJCLENBQUMsbUJBQUEsQ0FBQTtBQUU1QixVQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxRQUFBLEVBQXFDLFNBQUEsQ0FBVSxDQUFFO0FBQzNDLE9BQUEsYUFBQSxFQUFlLEVBQUE7QUFFbkIsT0FBQSxFQUFTLEdBQUEsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksS0FBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQW1CLEVBQUEsRUFBQSxDQUFLO0FBQ3RDLFNBQUEsS0FBQSxFQUFPLEtBQUEsQ0FBQSxLQUFBLENBQVcsQ0FBQSxDQUFBO0FBQ2xCLGNBQUEsRUFBTyxLQUFBLENBQUEsa0JBQUE7QUFDUCxlQUFBO0FBR0osUUFBQSxFQUFJLElBQUEsQ0FBQSxJQUFBLENBQVUsQ0FBQSxDQUFBLEdBQU0sSUFBQSxDQUFLLFNBQUE7QUFFekIsUUFBQSxFQUFJLElBQUEsQ0FBQSxJQUFBLENBQUEsS0FBZSxDQUFDLGlCQUFBLENBQUEsQ0FBb0I7QUFDdEMsZ0JBQVEsQ0FBQyxJQUFBLENBQUE7QUFBQSxPQUFBLEtBQ0osR0FBQSxFQUFJLEtBQUEsRUFBUSxLQUFBLENBQUEsS0FBVSxDQUFDLDBCQUFBLENBQUEsQ0FBNkI7QUFFekQsVUFBQSxFQUFJLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBQSxNQUFTLENBQUMsQ0FBQSxDQUFHLEdBQUEsQ0FBQSxHQUFPLGdCQUFBLENBQWlCO0FBQzdDLGVBQUEsQ0FBTSxDQUFBLENBQUEsRUFBSyxNQUFBLENBQU0sQ0FBQSxDQUFBLENBQUEsTUFBUyxDQUFDLENBQUEsQ0FBQTtBQUFBO0FBSzdCLG9CQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxPQUF3QixDQUFDLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBSSxLQUFBLENBQU0sU0FBQSxDQUFVLEdBQUEsQ0FBSztBQUN0RCxzQkFBQSxFQUFBO0FBQ0EsWUFBQSxFQUFJLENBQUMsWUFBQSxDQUFjO0FBQ2pCLHFCQUFBLENBQUEsUUFBQSxDQUFBLE9BQTBCLENBQUEsQ0FBQTtBQUFBO0FBQUEsU0FBQSxDQUFBO0FBQUE7QUFBQTtBQUFBLEdBQUE7QUFPcEMsVUFBQSxDQUFBLFdBQUEsQ0FBQSxTQUFBLENBQUEsT0FBQSxFQUF5QyxTQUFBLENBQVUsQ0FBRTtBQUMvQyxPQUFBLEtBQUEsRUFBTyxZQUFBLEdBQWUsWUFBQSxDQUFZLFFBQUEsQ0FBQSxXQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsQ0FBQTtBQUN0QyxNQUFBLEVBQUksQ0FBQyxJQUFBLENBQU0sT0FBQTtBQUNYLGFBQVMsQ0FBQyxJQUFBLENBQUE7QUFFVixZQUFBLENBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUEyQyxDQUFDLFVBQUEsQ0FBWSxHQUFBLENBQUE7QUFDeEQsWUFBQSxDQUFBLFdBQUEsQ0FBQSxTQUFBLENBQUEsWUFBMkMsQ0FBQyxVQUFBLENBQVksR0FBQSxDQUFBO0FBQUEsR0FBQTtBQUFBLENBQUEsS0FFckQ7QUFFTCxVQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLEVBQXVDLFNBQUEsQ0FBVSxDQUFFO0FBQ2pELGNBQVUsQ0FBQyxJQUFBLENBQUEsS0FBQSxDQUFXLENBQUEsQ0FBQSxDQUFBO0FBQUEsR0FBQTtBQUd4QixVQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQXNDLFNBQUEsQ0FBVSxDQUFFO0FBQ2hELGFBQVMsQ0FBQyxJQUFBLENBQUEsS0FBQSxDQUFXLENBQUEsQ0FBQSxDQUFBO0FBQUEsR0FBQTtBQUFBOzs7O0FDdEpyQixHQUFBLGNBQUEsRUFBZ0IsUUFBTyxDQUFDLGtCQUFBLENBQUEsQ0FBQSxhQUFBO0FBQ3hCLEdBQUEsYUFBQSxFQUFlLFFBQU8sQ0FBQyxpQkFBQSxDQUFBLENBQUEsWUFBQTtBQUN2QixHQUFBLGNBQUEsRUFBZ0IsUUFBTyxDQUFDLGlCQUFBLENBQUEsQ0FBQSxhQUFBO0FBRTVCLE9BQUEsQ0FBQSxLQUFBLEVBQWdCLFNBQUEsQ0FBVSxRQUFBLENBQVU7QUFFOUIsS0FBQSxPQUFBLEVBQVMsSUFBSSxjQUFhLENBQUM7QUFDN0IsY0FBQSxDQUFZLHlCQUFBO0FBQ1osV0FBQSxDQUFTO0FBQUEsR0FBQSxDQUFBO0FBSVAsS0FBQSxNQUFBLEVBQVEsSUFBSSxhQUFZLENBQUMsQ0FBQyxVQUFBLENBQVksd0JBQUEsQ0FBQSxDQUFBO0FBR3RDLEtBQUEsU0FBQSxFQUFXLElBQUksY0FBYSxDQUFDLFFBQUEsQ0FBVSxNQUFBLENBQU8sT0FBQSxDQUFBO0FBR2xELFVBQUEsQ0FBQSxJQUFBLENBQUEsZ0JBQThCLENBQUMsU0FBQSxDQUFXLFNBQUEsQ0FBVSxLQUFBLENBQU87QUFDekQsVUFBQSxFQUFRLEtBQUEsQ0FBQSxPQUFBLENBQUE7QUFDTixVQUFLLEdBQUE7QUFDSCxnQkFBQSxDQUFBLE1BQWUsQ0FBQyxDQUFDLEdBQUEsQ0FBSSxFQUFBLENBQUcsS0FBQSxDQUFBO0FBQ3hCLGFBQUE7QUFDRixVQUFLLEdBQUE7QUFDSCxnQkFBQSxDQUFBLE1BQWUsQ0FBQyxDQUFBLENBQUcsR0FBQSxDQUFJLEtBQUEsQ0FBQTtBQUN2QixhQUFBO0FBQ0YsVUFBSyxHQUFBO0FBQ0gsZ0JBQUEsQ0FBQSxNQUFlLENBQUMsRUFBQSxDQUFJLEVBQUEsQ0FBRyxLQUFBLENBQUE7QUFDdkIsYUFBQTtBQUNGLFVBQUssR0FBQTtBQUNILGdCQUFBLENBQUEsTUFBZSxDQUFDLENBQUEsQ0FBRyxFQUFDLEdBQUEsQ0FBSSxLQUFBLENBQUE7QUFDeEIsYUFBQTtBQUNGLGFBQUE7QUFDRSxjQUFBO0FBQUE7QUFHSixTQUFBLENBQUEsY0FBb0IsQ0FBQSxDQUFBO0FBQUEsR0FBQSxDQUFBO0FBSWxCLEtBQUEsU0FBQSxFQUFXLEtBQUE7QUFDZixVQUFBLENBQUEsZ0JBQXlCLENBQUMsV0FBQSxDQUFhLFNBQUEsQ0FBVSxDQUFBLENBQUc7QUFDbEQsWUFBQSxFQUFXLEVBQUMsQ0FBQSxDQUFBLE9BQUEsQ0FBVyxFQUFBLENBQUEsT0FBQSxDQUFBO0FBQUEsR0FBQSxDQUFBO0FBR3pCLFVBQUEsQ0FBQSxnQkFBeUIsQ0FBQyxXQUFBLENBQWEsU0FBQSxDQUFVLENBQUEsQ0FBRztBQUNsRCxNQUFBLEVBQUksQ0FBQyxRQUFBLENBQVUsT0FBQTtBQUNmLFlBQUEsQ0FBQSxNQUFlLENBQUMsUUFBQSxDQUFTLENBQUEsQ0FBQSxFQUFLLEVBQUEsQ0FBQSxPQUFBLENBQVcsRUFBQSxDQUFBLE9BQUEsRUFBWSxTQUFBLENBQVMsQ0FBQSxDQUFBLENBQUksS0FBQSxDQUFBO0FBQ2xFLFlBQUEsQ0FBUyxDQUFBLENBQUEsRUFBSyxFQUFBLENBQUEsT0FBQTtBQUNkLFlBQUEsQ0FBUyxDQUFBLENBQUEsRUFBSyxFQUFBLENBQUEsT0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUdoQixVQUFBLENBQUEsZ0JBQXlCLENBQUMsU0FBQSxDQUFXLFNBQUEsQ0FBVSxDQUFFO0FBQy9DLFlBQUEsRUFBVyxLQUFBO0FBQUEsR0FBQSxDQUFBO0FBSWIsVUFBQSxDQUFBLGdCQUF5QixDQUFDLE9BQUEsQ0FBUyxTQUFBLENBQVUsQ0FBQSxDQUFHO0FBQzlDLE1BQUEsRUFBSSxDQUFBLENBQUEsTUFBQSxFQUFXLEVBQUEsQ0FBRyxTQUFBLENBQUEsT0FBZ0IsQ0FBQSxDQUFBO0FBQ2xDLE1BQUEsRUFBSSxDQUFBLENBQUEsTUFBQSxFQUFXLEVBQUEsQ0FBRyxTQUFBLENBQUEsTUFBZSxDQUFBLENBQUE7QUFDakMsS0FBQSxDQUFBLGNBQWdCLENBQUEsQ0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUdsQixRQUFPO0FBQ0wsVUFBQSxDQUFRLE9BQUE7QUFDUixZQUFBLENBQVUsU0FBQTtBQUNWLFNBQUEsQ0FBTztBQUFBLEdBQUE7QUFBQSxDQUFBOzs7O0FDakRYLENBQUMsUUFBQSxDQUFTLE1BQUEsQ0FBUTtBQUNoQixjQUFBO0FBRUEsSUFBQSxFQUFJLE1BQUEsQ0FBQSxlQUFBLENBQXdCO0FBRTFCLFVBQUE7QUFBQTtBQUdFLEtBQUEsUUFBQSxFQUFVLE9BQUEsQ0FBQSxNQUFBO0FBQ1YsS0FBQSxnQkFBQSxFQUFrQixPQUFBLENBQUEsY0FBQTtBQUNsQixLQUFBLGtCQUFBLEVBQW9CLE9BQUEsQ0FBQSxnQkFBQTtBQUNwQixLQUFBLFFBQUEsRUFBVSxPQUFBLENBQUEsTUFBQTtBQUNWLEtBQUEscUJBQUEsRUFBdUIsT0FBQSxDQUFBLG1CQUFBO0FBQ3ZCLEtBQUEsZ0JBQUEsRUFBa0IsT0FBQSxDQUFBLGNBQUE7QUFDbEIsS0FBQSxnQkFBQSxFQUFrQixPQUFBLENBQUEsU0FBQSxDQUFBLGNBQUE7QUFDbEIsS0FBQSwwQkFBQSxFQUE0QixPQUFBLENBQUEsd0JBQUE7QUFFaEMsVUFBUyxRQUFBLENBQVEsS0FBQSxDQUFPO0FBQ3RCLFVBQU87QUFDTCxrQkFBQSxDQUFjLEtBQUE7QUFDZCxnQkFBQSxDQUFZLE1BQUE7QUFDWixXQUFBLENBQU8sTUFBQTtBQUNQLGNBQUEsQ0FBVTtBQUFBLEtBQUE7QUFBQTtBQUlWLEtBQUEsT0FBQSxFQUFTLFFBQUE7QUFFYixVQUFTLGVBQUEsQ0FBZSxNQUFBLENBQVE7QUFHOUIscUJBQWlCLENBQUMsTUFBQSxDQUFBLFNBQUEsQ0FBa0I7QUFDbEMsZ0JBQUEsQ0FBWSxPQUFNLENBQUMsUUFBQSxDQUFTLENBQUEsQ0FBRztBQUM5QixjQUFPLEtBQUEsQ0FBQSxXQUFnQixDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUEsSUFBTyxFQUFBO0FBQUEsT0FBQSxDQUFBO0FBRW5DLGNBQUEsQ0FBVSxPQUFNLENBQUMsUUFBQSxDQUFTLENBQUEsQ0FBRztBQUN2QixXQUFBLEVBQUEsRUFBSSxPQUFNLENBQUMsQ0FBQSxDQUFBO0FBQ1gsV0FBQSxFQUFBLEVBQUksS0FBQSxDQUFBLE1BQUEsRUFBYyxFQUFBLENBQUEsTUFBQTtBQUN0QixjQUFPLEVBQUEsR0FBSyxFQUFBLEdBQUssS0FBQSxDQUFBLE9BQVksQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBLElBQU8sRUFBQTtBQUFBLE9BQUEsQ0FBQTtBQUUxQyxjQUFBLENBQVUsT0FBTSxDQUFDLFFBQUEsQ0FBUyxDQUFBLENBQUc7QUFDM0IsY0FBTyxLQUFBLENBQUEsT0FBWSxDQUFDLENBQUEsQ0FBQSxJQUFPLEVBQUMsRUFBQTtBQUFBLE9BQUEsQ0FBQTtBQUU5QixhQUFBLENBQVMsT0FBTSxDQUFDLFFBQUEsQ0FBUyxDQUFFO0FBQ3pCLGNBQU8sS0FBQSxDQUFBLEtBQVUsQ0FBQyxFQUFBLENBQUE7QUFBQSxPQUFBLENBQUE7QUFFcEIsaUJBQUEsQ0FBYSxPQUFNLENBQUMsUUFBQSxDQUFTLFFBQUEsQ0FBVTtBQUVqQyxXQUFBLE9BQUEsRUFBUyxPQUFNLENBQUMsSUFBQSxDQUFBO0FBQ2hCLFdBQUEsS0FBQSxFQUFPLE9BQUEsQ0FBQSxNQUFBO0FBRVAsV0FBQSxNQUFBLEVBQVEsU0FBQSxFQUFXLE9BQU0sQ0FBQyxRQUFBLENBQUEsQ0FBWSxFQUFBO0FBQzFDLFVBQUEsRUFBSSxLQUFLLENBQUMsS0FBQSxDQUFBLENBQVE7QUFDaEIsZUFBQSxFQUFRLEVBQUE7QUFBQTtBQUdWLFVBQUEsRUFBSSxLQUFBLEVBQVEsRUFBQSxHQUFLLE1BQUEsR0FBUyxLQUFBLENBQU07QUFDOUIsZ0JBQU8sVUFBQTtBQUFBO0FBR0wsV0FBQSxNQUFBLEVBQVEsT0FBQSxDQUFBLFVBQWlCLENBQUMsS0FBQSxDQUFBO0FBQzFCLFdBQUEsT0FBQTtBQUNKLFVBQUEsRUFDRSxLQUFBLEdBQVMsT0FBQSxHQUFVLE1BQUEsR0FBUyxPQUFBLEdBQzVCLEtBQUEsRUFBTyxNQUFBLEVBQVEsRUFBQSxDQUNmO0FBQ0EsZ0JBQUEsRUFBUyxPQUFBLENBQUEsVUFBaUIsQ0FBQyxLQUFBLEVBQVEsRUFBQSxDQUFBO0FBQ25DLFlBQUEsRUFBSSxNQUFBLEdBQVUsT0FBQSxHQUFVLE9BQUEsR0FBVSxPQUFBLENBQVE7QUFFeEMsa0JBQU8sRUFBQyxLQUFBLEVBQVEsT0FBQSxDQUFBLEVBQVUsTUFBQSxFQUFRLE9BQUEsRUFBUyxPQUFBLEVBQVMsUUFBQTtBQUFBO0FBQUE7QUFHeEQsY0FBTyxNQUFBO0FBQUEsT0FBQTtBQUFBLEtBQUEsQ0FBQTtBQUlYLHFCQUFpQixDQUFDLE1BQUEsQ0FBUTtBQUV4QixTQUFBLENBQUssT0FBTSxDQUFDLFFBQUEsQ0FBUyxRQUFBLENBQVU7QUFDekIsV0FBQSxJQUFBLEVBQU0sU0FBQSxDQUFBLEdBQUE7QUFDTixXQUFBLElBQUEsRUFBTSxJQUFBLENBQUEsTUFBQSxJQUFlLEVBQUE7QUFDekIsVUFBQSxFQUFJLEdBQUEsSUFBUSxFQUFBLENBQ1YsT0FBTyxHQUFBO0FBQ0wsV0FBQSxFQUFBLEVBQUksR0FBQTtBQUNKLFdBQUEsRUFBQSxFQUFJLEVBQUE7QUFDUixhQUFBLEVBQU8sSUFBQSxDQUFNO0FBQ1gsV0FBQSxHQUFLLElBQUEsQ0FBSSxDQUFBLENBQUE7QUFDVCxZQUFBLEVBQUksQ0FBQSxFQUFJLEVBQUEsSUFBTSxJQUFBLENBQ1osT0FBTyxFQUFBO0FBQ1QsV0FBQSxHQUFLLFVBQUEsQ0FBVSxFQUFFLENBQUEsQ0FBQTtBQUFBO0FBQUEsT0FBQSxDQUFBO0FBSXJCLG1CQUFBLENBQWUsT0FBTSxDQUFDLFFBQUEsQ0FBUyxDQUFFO0FBRTNCLFdBQUEsVUFBQSxFQUFZLEVBQUEsQ0FBQTtBQUNaLFdBQUEsTUFBQSxFQUFRLEtBQUEsQ0FBQSxLQUFBO0FBQ1IsV0FBQSxjQUFBO0FBQ0EsV0FBQSxhQUFBO0FBQ0EsV0FBQSxNQUFBLEVBQVEsRUFBQyxFQUFBO0FBQ1QsV0FBQSxPQUFBLEVBQVMsVUFBQSxDQUFBLE1BQUE7QUFDYixVQUFBLEVBQUksQ0FBQyxNQUFBLENBQVE7QUFDWCxnQkFBTyxHQUFBO0FBQUE7QUFFVCxhQUFBLEVBQU8sRUFBRSxLQUFBLEVBQVEsT0FBQSxDQUFRO0FBQ25CLGFBQUEsVUFBQSxFQUFZLE9BQU0sQ0FBQyxTQUFBLENBQVUsS0FBQSxDQUFBLENBQUE7QUFDakMsWUFBQSxFQUNFLENBQUMsUUFBUSxDQUFDLFNBQUEsQ0FBQSxHQUNWLFVBQUEsRUFBWSxFQUFBLEdBQ1osVUFBQSxFQUFZLFNBQUEsR0FDWixNQUFLLENBQUMsU0FBQSxDQUFBLEdBQWMsVUFBQSxDQUNwQjtBQUNBLGlCQUFNLFdBQVUsQ0FBQyxzQkFBQSxFQUF5QixVQUFBLENBQUE7QUFBQTtBQUU1QyxZQUFBLEVBQUksU0FBQSxHQUFhLE9BQUEsQ0FBUTtBQUN2QixxQkFBQSxDQUFBLElBQWMsQ0FBQyxTQUFBLENBQUE7QUFBQSxXQUFBLEtBQ1Y7QUFFTCxxQkFBQSxHQUFhLFFBQUE7QUFDYix5QkFBQSxFQUFnQixFQUFDLFNBQUEsR0FBYSxHQUFBLENBQUEsRUFBTSxPQUFBO0FBQ3BDLHdCQUFBLEVBQWUsRUFBQyxTQUFBLEVBQVksTUFBQSxDQUFBLEVBQVMsT0FBQTtBQUNyQyxxQkFBQSxDQUFBLElBQWMsQ0FBQyxhQUFBLENBQWUsYUFBQSxDQUFBO0FBQUE7QUFBQTtBQUdsQyxjQUFPLE9BQUEsQ0FBQSxZQUFBLENBQUEsS0FBeUIsQ0FBQyxJQUFBLENBQU0sVUFBQSxDQUFBO0FBQUEsT0FBQTtBQUFBLEtBQUEsQ0FBQTtBQUFBO0FBaUJ6QyxLQUFBLFFBQUEsRUFBVSxFQUFBO0FBTWQsVUFBUyxnQkFBQSxDQUFnQixDQUFFO0FBQ3pCLFVBQU8sTUFBQSxFQUFRLEtBQUEsQ0FBQSxLQUFVLENBQUMsSUFBQSxDQUFBLE1BQVcsQ0FBQSxDQUFBLEVBQUssSUFBQSxDQUFBLEVBQU8sSUFBQSxFQUFNLEdBQUUsT0FBQSxFQUFVLE1BQUE7QUFBQTtBQUlqRSxLQUFBLHVCQUFBLEVBQXlCLGdCQUFlLENBQUEsQ0FBQTtBQUN4QyxLQUFBLDBCQUFBLEVBQTRCLGdCQUFlLENBQUEsQ0FBQTtBQUczQyxLQUFBLG1CQUFBLEVBQXFCLGdCQUFlLENBQUEsQ0FBQTtBQUlwQyxLQUFBLGFBQUEsRUFBZSxPQUFBLENBQUEsTUFBYSxDQUFDLElBQUEsQ0FBQTtBQUVqQyxVQUFTLFNBQUEsQ0FBUyxNQUFBLENBQVE7QUFDeEIsVUFBTyxPQUFPLE9BQUEsSUFBVyxTQUFBLEdBQVksT0FBQSxXQUFrQixZQUFBO0FBQUE7QUFHekQsVUFBUyxPQUFBLENBQU8sQ0FBQSxDQUFHO0FBQ2pCLE1BQUEsRUFBSSxRQUFRLENBQUMsQ0FBQSxDQUFBLENBQ1gsT0FBTyxTQUFBO0FBQ1QsVUFBTyxPQUFPLEVBQUE7QUFBQTtBQVFoQixVQUFTLE9BQUEsQ0FBTyxXQUFBLENBQWE7QUFDdkIsT0FBQSxNQUFBLEVBQVEsSUFBSSxZQUFXLENBQUMsV0FBQSxDQUFBO0FBQzVCLE1BQUEsRUFBSSxDQUFDLENBQUMsSUFBQSxXQUFnQixPQUFBLENBQUEsQ0FDcEIsT0FBTyxNQUFBO0FBUVQsU0FBTSxJQUFJLFVBQVMsQ0FBQywwQkFBQSxDQUFBO0FBQUE7QUFHdEIsaUJBQWUsQ0FBQyxNQUFBLENBQUEsU0FBQSxDQUFrQixjQUFBLENBQWUsUUFBTyxDQUFDLE1BQUEsQ0FBQSxDQUFBO0FBQ3pELGlCQUFlLENBQUMsTUFBQSxDQUFBLFNBQUEsQ0FBa0IsV0FBQSxDQUFZLE9BQU0sQ0FBQyxRQUFBLENBQVMsQ0FBRTtBQUMxRCxPQUFBLFlBQUEsRUFBYyxLQUFBLENBQUssa0JBQUEsQ0FBQTtBQUN2QixNQUFBLEVBQUksQ0FBQyxTQUFTLENBQUMsU0FBQSxDQUFBLENBQ2IsT0FBTyxZQUFBLENBQVksc0JBQUEsQ0FBQTtBQUNyQixNQUFBLEVBQUksQ0FBQyxXQUFBLENBQ0gsTUFBTSxVQUFTLENBQUMsa0NBQUEsQ0FBQTtBQUNkLE9BQUEsS0FBQSxFQUFPLFlBQUEsQ0FBWSx5QkFBQSxDQUFBO0FBQ3ZCLE1BQUEsRUFBSSxJQUFBLElBQVMsVUFBQSxDQUNYLEtBQUEsRUFBTyxHQUFBO0FBQ1QsVUFBTyxVQUFBLEVBQVksS0FBQSxFQUFPLElBQUE7QUFBQSxHQUFBLENBQUEsQ0FBQTtBQUU1QixpQkFBZSxDQUFDLE1BQUEsQ0FBQSxTQUFBLENBQWtCLFVBQUEsQ0FBVyxPQUFNLENBQUMsUUFBQSxDQUFTLENBQUU7QUFDekQsT0FBQSxZQUFBLEVBQWMsS0FBQSxDQUFLLGtCQUFBLENBQUE7QUFDdkIsTUFBQSxFQUFJLENBQUMsV0FBQSxDQUNILE1BQU0sVUFBUyxDQUFDLGtDQUFBLENBQUE7QUFDbEIsTUFBQSxFQUFJLENBQUMsU0FBUyxDQUFDLFNBQUEsQ0FBQSxDQUNiLE9BQU8sWUFBQSxDQUFZLHNCQUFBLENBQUE7QUFDckIsVUFBTyxZQUFBO0FBQUEsR0FBQSxDQUFBLENBQUE7QUFHVCxVQUFTLFlBQUEsQ0FBWSxXQUFBLENBQWE7QUFDNUIsT0FBQSxJQUFBLEVBQU0sZ0JBQWUsQ0FBQSxDQUFBO0FBQ3pCLG1CQUFlLENBQUMsSUFBQSxDQUFNLG1CQUFBLENBQW9CLEVBQUMsS0FBQSxDQUFPLEtBQUEsQ0FBQSxDQUFBO0FBQ2xELG1CQUFlLENBQUMsSUFBQSxDQUFNLHVCQUFBLENBQXdCLEVBQUMsS0FBQSxDQUFPLElBQUEsQ0FBQSxDQUFBO0FBQ3RELG1CQUFlLENBQUMsSUFBQSxDQUFNLDBCQUFBLENBQTJCLEVBQUMsS0FBQSxDQUFPLFlBQUEsQ0FBQSxDQUFBO0FBQ3pELFdBQU8sQ0FBQyxJQUFBLENBQUE7QUFDUixnQkFBQSxDQUFhLEdBQUEsQ0FBQSxFQUFPLEtBQUE7QUFBQTtBQUV0QixpQkFBZSxDQUFDLFdBQUEsQ0FBQSxTQUFBLENBQXVCLGNBQUEsQ0FBZSxRQUFPLENBQUMsTUFBQSxDQUFBLENBQUE7QUFDOUQsaUJBQWUsQ0FBQyxXQUFBLENBQUEsU0FBQSxDQUF1QixXQUFBLENBQVk7QUFDakQsU0FBQSxDQUFPLE9BQUEsQ0FBQSxTQUFBLENBQUEsUUFBQTtBQUNQLGNBQUEsQ0FBWTtBQUFBLEdBQUEsQ0FBQTtBQUVkLGlCQUFlLENBQUMsV0FBQSxDQUFBLFNBQUEsQ0FBdUIsVUFBQSxDQUFXO0FBQ2hELFNBQUEsQ0FBTyxPQUFBLENBQUEsU0FBQSxDQUFBLE9BQUE7QUFDUCxjQUFBLENBQVk7QUFBQSxHQUFBLENBQUE7QUFFZCxTQUFPLENBQUMsV0FBQSxDQUFBLFNBQUEsQ0FBQTtBQUVSLFFBQUEsQ0FBQSxRQUFBLEVBQWtCLE9BQU0sQ0FBQSxDQUFBO0FBRXhCLFVBQVMsV0FBQSxDQUFXLElBQUEsQ0FBTTtBQUN4QixNQUFBLEVBQUksUUFBUSxDQUFDLElBQUEsQ0FBQSxDQUNYLE9BQU8sS0FBQSxDQUFLLHNCQUFBLENBQUE7QUFDZCxVQUFPLEtBQUE7QUFBQTtBQUlULFVBQVMsb0JBQUEsQ0FBb0IsTUFBQSxDQUFRO0FBQy9CLE9BQUEsR0FBQSxFQUFLLEVBQUEsQ0FBQTtBQUNMLE9BQUEsTUFBQSxFQUFRLHFCQUFvQixDQUFDLE1BQUEsQ0FBQTtBQUNqQyxPQUFBLEVBQVMsR0FBQSxFQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBSSxNQUFBLENBQUEsTUFBQSxDQUFjLEVBQUEsRUFBQSxDQUFLO0FBQ2pDLFNBQUEsS0FBQSxFQUFPLE1BQUEsQ0FBTSxDQUFBLENBQUE7QUFDakIsUUFBQSxFQUFJLENBQUMsWUFBQSxDQUFhLElBQUEsQ0FBQSxDQUNoQixHQUFBLENBQUEsSUFBTyxDQUFDLElBQUEsQ0FBQTtBQUFBO0FBRVosVUFBTyxHQUFBO0FBQUE7QUFHVCxVQUFTLHlCQUFBLENBQXlCLE1BQUEsQ0FBUSxLQUFBLENBQU07QUFDOUMsVUFBTywwQkFBeUIsQ0FBQyxNQUFBLENBQVEsV0FBVSxDQUFDLElBQUEsQ0FBQSxDQUFBO0FBQUE7QUFHdEQsVUFBUyxzQkFBQSxDQUFzQixNQUFBLENBQVE7QUFDakMsT0FBQSxHQUFBLEVBQUssRUFBQSxDQUFBO0FBQ0wsT0FBQSxNQUFBLEVBQVEscUJBQW9CLENBQUMsTUFBQSxDQUFBO0FBQ2pDLE9BQUEsRUFBUyxHQUFBLEVBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLE1BQUEsQ0FBQSxNQUFBLENBQWMsRUFBQSxFQUFBLENBQUs7QUFDakMsU0FBQSxPQUFBLEVBQVMsYUFBQSxDQUFhLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBQTtBQUNoQyxRQUFBLEVBQUksTUFBQSxDQUNGLEdBQUEsQ0FBQSxJQUFPLENBQUMsTUFBQSxDQUFBO0FBQUE7QUFFWixVQUFPLEdBQUE7QUFBQTtBQUtULFVBQVMsZUFBQSxDQUFlLElBQUEsQ0FBTTtBQUM1QixVQUFPLGdCQUFBLENBQUEsSUFBb0IsQ0FBQyxJQUFBLENBQU0sV0FBVSxDQUFDLElBQUEsQ0FBQSxDQUFBO0FBQUE7QUFHL0MsVUFBUyxVQUFBLENBQVUsSUFBQSxDQUFNO0FBQ3ZCLFVBQU8sT0FBQSxDQUFBLE9BQUEsR0FBa0IsT0FBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLENBQXVCLElBQUEsQ0FBQTtBQUFBO0FBR2xELFVBQVMsWUFBQSxDQUFZLE1BQUEsQ0FBUSxLQUFBLENBQU0sTUFBQSxDQUFPO0FBQ3BDLE9BQUEsSUFBQTtBQUFLLFlBQUE7QUFDVCxNQUFBLEVBQUksUUFBUSxDQUFDLElBQUEsQ0FBQSxDQUFPO0FBQ2xCLFNBQUEsRUFBTSxLQUFBO0FBQ04sVUFBQSxFQUFPLEtBQUEsQ0FBSyxzQkFBQSxDQUFBO0FBQUE7QUFFZCxVQUFBLENBQU8sSUFBQSxDQUFBLEVBQVEsTUFBQTtBQUNmLE1BQUEsRUFBSSxHQUFBLEdBQU8sRUFBQyxJQUFBLEVBQU8sMEJBQXlCLENBQUMsTUFBQSxDQUFRLEtBQUEsQ0FBQSxDQUFBLENBQ25ELGdCQUFlLENBQUMsTUFBQSxDQUFRLEtBQUEsQ0FBTSxFQUFDLFVBQUEsQ0FBWSxNQUFBLENBQUEsQ0FBQTtBQUM3QyxVQUFPLE1BQUE7QUFBQTtBQUdULFVBQVMsZUFBQSxDQUFlLE1BQUEsQ0FBUSxLQUFBLENBQU0sV0FBQSxDQUFZO0FBQ2hELE1BQUEsRUFBSSxRQUFRLENBQUMsSUFBQSxDQUFBLENBQU87QUFJbEIsUUFBQSxFQUFJLFVBQUEsQ0FBQSxVQUFBLENBQXVCO0FBQ3pCLGtCQUFBLEVBQWEsT0FBQSxDQUFBLE1BQWEsQ0FBQyxVQUFBLENBQVksRUFDckMsVUFBQSxDQUFZLEVBQUMsS0FBQSxDQUFPLE1BQUEsQ0FBQSxDQUFBLENBQUE7QUFBQTtBQUd4QixVQUFBLEVBQU8sS0FBQSxDQUFLLHNCQUFBLENBQUE7QUFBQTtBQUVkLG1CQUFlLENBQUMsTUFBQSxDQUFRLEtBQUEsQ0FBTSxXQUFBLENBQUE7QUFFOUIsVUFBTyxPQUFBO0FBQUE7QUFHVCxVQUFTLGVBQUEsQ0FBZSxNQUFBLENBQVE7QUFDOUIsbUJBQWUsQ0FBQyxNQUFBLENBQVEsaUJBQUEsQ0FBa0IsRUFBQyxLQUFBLENBQU8sZUFBQSxDQUFBLENBQUE7QUFDbEQsbUJBQWUsQ0FBQyxNQUFBLENBQVEsc0JBQUEsQ0FDUixFQUFDLEtBQUEsQ0FBTyxvQkFBQSxDQUFBLENBQUE7QUFDeEIsbUJBQWUsQ0FBQyxNQUFBLENBQVEsMkJBQUEsQ0FDUixFQUFDLEtBQUEsQ0FBTyx5QkFBQSxDQUFBLENBQUE7QUFDeEIsbUJBQWUsQ0FBQyxNQUFBLENBQUEsU0FBQSxDQUFrQixpQkFBQSxDQUNsQixFQUFDLEtBQUEsQ0FBTyxlQUFBLENBQUEsQ0FBQTtBQUV4QixVQUFBLENBQUEscUJBQUEsRUFBK0Isc0JBQUE7QUFLL0IsWUFBUyxHQUFBLENBQUcsSUFBQSxDQUFNLE1BQUEsQ0FBTztBQUN2QixRQUFBLEVBQUksSUFBQSxJQUFTLE1BQUEsQ0FDWCxPQUFPLEtBQUEsSUFBUyxFQUFBLEdBQUssRUFBQSxFQUFJLEtBQUEsSUFBUyxFQUFBLEVBQUksTUFBQTtBQUN4QyxZQUFPLEtBQUEsSUFBUyxLQUFBLEdBQVEsTUFBQSxJQUFVLE1BQUE7QUFBQTtBQUdwQyxtQkFBZSxDQUFDLE1BQUEsQ0FBUSxLQUFBLENBQU0sT0FBTSxDQUFDLEVBQUEsQ0FBQSxDQUFBO0FBR3JDLFlBQVMsT0FBQSxDQUFPLE1BQUEsQ0FBUSxPQUFBLENBQVE7QUFDMUIsU0FBQSxNQUFBLEVBQVEscUJBQW9CLENBQUMsTUFBQSxDQUFBO0FBQzdCLFNBQUEsRUFBQTtBQUFHLGdCQUFBLEVBQVMsTUFBQSxDQUFBLE1BQUE7QUFDaEIsU0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLE9BQUEsQ0FBUSxFQUFBLEVBQUEsQ0FBSztBQUMzQixjQUFBLENBQU8sS0FBQSxDQUFNLENBQUEsQ0FBQSxDQUFBLEVBQU0sT0FBQSxDQUFPLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBQTtBQUFBO0FBRWxDLFlBQU8sT0FBQTtBQUFBO0FBR1QsbUJBQWUsQ0FBQyxNQUFBLENBQVEsU0FBQSxDQUFVLE9BQU0sQ0FBQyxNQUFBLENBQUEsQ0FBQTtBQUd6QyxZQUFTLE1BQUEsQ0FBTSxNQUFBLENBQVEsT0FBQSxDQUFRO0FBQ3pCLFNBQUEsTUFBQSxFQUFRLHFCQUFvQixDQUFDLE1BQUEsQ0FBQTtBQUM3QixTQUFBLEVBQUE7QUFBRyxvQkFBQTtBQUFZLGdCQUFBLEVBQVMsTUFBQSxDQUFBLE1BQUE7QUFDNUIsU0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLE9BQUEsQ0FBUSxFQUFBLEVBQUEsQ0FBSztBQUMzQixrQkFBQSxFQUFhLDBCQUF5QixDQUFDLE1BQUEsQ0FBUSxNQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDckQsdUJBQWUsQ0FBQyxNQUFBLENBQVEsTUFBQSxDQUFNLENBQUEsQ0FBQSxDQUFJLFdBQUEsQ0FBQTtBQUFBO0FBRXBDLFlBQU8sT0FBQTtBQUFBO0FBR1QsbUJBQWUsQ0FBQyxNQUFBLENBQVEsUUFBQSxDQUFTLE9BQU0sQ0FBQyxLQUFBLENBQUEsQ0FBQTtBQUFBO0FBRzFDLFVBQVMsY0FBQSxDQUFjLEtBQUEsQ0FBTztBQUs1QixrQkFBYyxDQUFDLEtBQUEsQ0FBQSxTQUFBLENBQWlCLE9BQUEsQ0FBQSxRQUFBLENBQWlCLE9BQU0sQ0FBQyxRQUFBLENBQVMsQ0FBRTtBQUM3RCxTQUFBLE1BQUEsRUFBUSxFQUFBO0FBQ1IsU0FBQSxNQUFBLEVBQVEsS0FBQTtBQUNaLFlBQU8sRUFDTCxJQUFBLENBQU0sU0FBQSxDQUFTLENBQUU7QUFDZixZQUFBLEVBQUksS0FBQSxFQUFRLE1BQUEsQ0FBQSxNQUFBLENBQWM7QUFDeEIsa0JBQU87QUFBQyxtQkFBQSxDQUFPLE1BQUEsQ0FBTSxLQUFBLEVBQUEsQ0FBQTtBQUFVLGtCQUFBLENBQU07QUFBQSxhQUFBO0FBQUE7QUFFdkMsZ0JBQU87QUFBQyxpQkFBQSxDQUFPLFVBQUE7QUFBVyxnQkFBQSxDQUFNO0FBQUEsV0FBQTtBQUFBLFNBQUEsQ0FBQTtBQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQUE7QUFVeEMsVUFBUyxTQUFBLENBQVMsU0FBQSxDQUFXO0FBQzNCLFFBQUEsQ0FBQSxVQUFBLEVBQWtCLFVBQUE7QUFDbEIsUUFBQSxDQUFBLFVBQUEsRUFBa0IsRUFBQSxDQUFBO0FBQUE7QUFHcEIsVUFBUyxPQUFBLENBQU8sSUFBQSxDQUFNO0FBQ3BCLFNBQUEsRUFBTyxJQUFBLENBQUEsVUFBQSxDQUFBLE1BQUEsRUFBeUIsRUFBQSxDQUFHO0FBQzdCLFNBQUEsUUFBQSxFQUFVLEtBQUEsQ0FBQSxVQUFBLENBQUEsS0FBcUIsQ0FBQSxDQUFBO0FBQy9CLFNBQUEsY0FBQSxFQUFnQixVQUFBO0FBQ3BCLFNBQUk7QUFDRixXQUFJO0FBQ0YsWUFBQSxFQUFJLElBQUEsQ0FBQSxPQUFBLENBQWEsQ0FBQSxDQUFBLENBQUk7QUFDbkIsY0FBQSxFQUFJLE9BQUEsQ0FBQSxPQUFBLENBQ0YsY0FBQSxFQUFnQixRQUFBLENBQUEsT0FBQSxDQUFBLElBQW9CLENBQUMsU0FBQSxDQUFXLEtBQUEsQ0FBQSxPQUFBLENBQWEsQ0FBQSxDQUFBLENBQUE7QUFBQSxXQUFBLEtBQzFEO0FBQ0wsY0FBQSxFQUFJLE9BQUEsQ0FBQSxRQUFBLENBQ0YsY0FBQSxFQUFnQixRQUFBLENBQUEsUUFBQSxDQUFBLElBQXFCLENBQUMsU0FBQSxDQUFXLEtBQUEsQ0FBQSxPQUFBLENBQWEsQ0FBQSxDQUFBLENBQUE7QUFBQTtBQUVsRSxpQkFBQSxDQUFBLFFBQUEsQ0FBQSxRQUF5QixDQUFDLGFBQUEsQ0FBQTtBQUFBLFNBQzFCLE1BQUEsRUFBTyxHQUFBLENBQUs7QUFDWixpQkFBQSxDQUFBLFFBQUEsQ0FBQSxPQUF3QixDQUFDLEdBQUEsQ0FBQTtBQUFBO0FBQUEsT0FFM0IsTUFBQSxFQUFPLE1BQUEsQ0FBUSxFQUFBO0FBQUE7QUFBQTtBQUlyQixVQUFTLEtBQUEsQ0FBSyxJQUFBLENBQU0sTUFBQSxDQUFPLFFBQUEsQ0FBUztBQUNsQyxNQUFBLEVBQUksSUFBQSxDQUFBLE1BQUEsQ0FDRixNQUFNLElBQUksTUFBSyxDQUFDLGVBQUEsQ0FBQTtBQUVsQixRQUFBLENBQUEsTUFBQSxFQUFjLEtBQUE7QUFDZCxRQUFBLENBQUEsT0FBQSxFQUFlLEVBQUMsS0FBQSxDQUFPLFFBQUEsQ0FBQTtBQUN2QixVQUFNLENBQUMsSUFBQSxDQUFBO0FBQUE7QUFHVCxVQUFBLENBQUEsU0FBQSxFQUFxQjtBQUNuQixlQUFBLENBQWEsU0FBQTtBQUViLFVBQUEsQ0FBUSxNQUFBO0FBQ1IsV0FBQSxDQUFTLFVBQUE7QUFFVCxpQkFBQSxDQUFlLFNBQUEsQ0FBUyxDQUFFO0FBQ3hCLFlBQU87QUFBQyxZQUFBLENBQU0sS0FBQSxDQUFBLElBQUEsQ0FBQSxJQUFjLENBQUMsSUFBQSxDQUFBO0FBQU8sY0FBQSxDQUFRLEtBQUEsQ0FBQSxNQUFBLENBQUEsSUFBZ0IsQ0FBQyxJQUFBO0FBQUEsT0FBQTtBQUFBLEtBQUE7QUFHL0QsWUFBQSxDQUFVLFNBQUEsQ0FBUyxLQUFBLENBQU87QUFDeEIsVUFBSSxDQUFDLElBQUEsQ0FBTSxNQUFBLENBQU8sTUFBQSxDQUFBO0FBQUEsS0FBQTtBQUdwQixXQUFBLENBQVMsU0FBQSxDQUFTLEdBQUEsQ0FBSztBQUNyQixVQUFJLENBQUMsSUFBQSxDQUFNLElBQUEsQ0FBSyxLQUFBLENBQUE7QUFBQSxLQUFBO0FBR2xCLFFBQUEsQ0FBTSxTQUFBLENBQVMsUUFBQSxDQUFVLFFBQUEsQ0FBUztBQUM1QixTQUFBLE9BQUEsRUFBUyxJQUFJLFNBQVEsQ0FBQyxJQUFBLENBQUEsTUFBQSxDQUFBLElBQWdCLENBQUMsSUFBQSxDQUFBLENBQUE7QUFDM0MsVUFBQSxDQUFBLFVBQUEsQ0FBQSxJQUFvQixDQUFDO0FBQ25CLGdCQUFBLENBQVUsT0FBQTtBQUNWLGdCQUFBLENBQVUsU0FBQTtBQUNWLGVBQUEsQ0FBUztBQUFBLE9BQUEsQ0FBQTtBQUVYLFFBQUEsRUFBSSxJQUFBLENBQUEsTUFBQSxDQUNGLE9BQU0sQ0FBQyxJQUFBLENBQUE7QUFDVCxZQUFPLE9BQUEsQ0FBQSxhQUFvQixDQUFBLENBQUE7QUFBQSxLQUFBO0FBRzdCLFVBQUEsQ0FBUSxTQUFBLENBQVMsQ0FBRTtBQUNqQixRQUFBLEVBQUksSUFBQSxDQUFBLE1BQUEsQ0FDRixNQUFNLElBQUksTUFBSyxDQUFDLGtCQUFBLENBQUE7QUFDZCxTQUFBLE9BQUE7QUFDSixRQUFBLEVBQUksSUFBQSxDQUFBLFVBQUEsQ0FBaUI7QUFDbkIsY0FBQSxFQUFTLEtBQUEsQ0FBQSxVQUFlLENBQUMsSUFBQSxDQUFBO0FBQ3pCLFVBQUEsRUFBSSxDQUFDLE1BQUEsV0FBa0IsTUFBQSxDQUNyQixPQUFBLEVBQVMsSUFBSSxNQUFLLENBQUMsTUFBQSxDQUFBO0FBQUEsT0FBQSxLQUNoQjtBQUNMLGNBQUEsRUFBUyxJQUFJLE1BQUssQ0FBQyxXQUFBLENBQUE7QUFBQTtBQUVyQixRQUFBLEVBQUksQ0FBQyxJQUFBLENBQUEsTUFBQSxDQUFhO0FBQ2hCLFlBQUEsQ0FBQSxPQUFBLEVBQWUsRUFBQyxNQUFBLENBQVEsS0FBQSxDQUFBO0FBQ3hCLGNBQU0sQ0FBQyxJQUFBLENBQUE7QUFBQTtBQUFBO0FBQUEsR0FBQTtBQVFiLFVBQVMsV0FBQSxDQUFXLEdBQUEsQ0FBSyxLQUFBLENBQU0sS0FBQSxDQUFNO0FBQ25DLFFBQUEsQ0FBQSxHQUFBLEVBQVcsSUFBQTtBQUNYLFFBQUEsQ0FBQSxJQUFBLEVBQVksS0FBQTtBQUNaLFFBQUEsQ0FBQSxJQUFBLEVBQVksS0FBQTtBQUNaLFFBQUEsQ0FBQSxNQUFBLEVBQWMsS0FBQTtBQUFBO0FBRWhCLFlBQUEsQ0FBQSxTQUFBLEVBQXVCLEVBQ3JCLEdBQUksTUFBQSxDQUFBLENBQVE7QUFDVixRQUFBLEVBQUksSUFBQSxDQUFBLE1BQUEsQ0FDRixPQUFPLEtBQUEsQ0FBQSxNQUFBO0FBQ1QsWUFBTyxLQUFBLENBQUEsTUFBQSxFQUFjLEtBQUEsQ0FBQSxJQUFBLENBQUEsSUFBYyxDQUFDLElBQUEsQ0FBQSxJQUFBLENBQUE7QUFBQSxLQUFBLENBQUE7QUFJcEMsS0FBQSxRQUFBLEVBQVUsRUFDWixpQkFBQSxDQUFtQjtBQUNqQixnQkFBQSxDQUFZLFdBQUE7QUFDWixvQkFBQSxDQUFnQixTQUFBLENBQVMsR0FBQSxDQUFLLEtBQUEsQ0FBTSxLQUFBLENBQU07QUFDeEMsZUFBQSxDQUFRLEdBQUEsQ0FBQSxFQUFPLElBQUksV0FBVSxDQUFDLEdBQUEsQ0FBSyxLQUFBLENBQU0sS0FBQSxDQUFBO0FBQUEsT0FBQTtBQUUzQyxtQkFBQSxDQUFlLFNBQUEsQ0FBUyxHQUFBLENBQUs7QUFDM0IsY0FBTyxRQUFBLENBQVEsR0FBQSxDQUFBLENBQUEsS0FBQTtBQUFBO0FBQUEsS0FBQSxDQUFBO0FBS2pCLEtBQUEsT0FBQSxFQUFTO0FBQ1gsT0FBQSxDQUFLLFNBQUEsQ0FBUyxJQUFBLENBQU07QUFDZCxTQUFBLE9BQUEsRUFBUyxRQUFBLENBQVEsSUFBQSxDQUFBO0FBQ3JCLFFBQUEsRUFBSSxNQUFBLFdBQWtCLFdBQUEsQ0FDcEIsT0FBTyxRQUFBLENBQVEsSUFBQSxDQUFBLEVBQVEsT0FBQSxDQUFBLEtBQUE7QUFDekIsWUFBTyxPQUFBO0FBQUEsS0FBQTtBQUVULE9BQUEsQ0FBSyxTQUFBLENBQVMsSUFBQSxDQUFNLE9BQUEsQ0FBUTtBQUMxQixhQUFBLENBQVEsSUFBQSxDQUFBLEVBQVEsT0FBQTtBQUFBO0FBQUEsR0FBQTtBQUlwQixVQUFTLGFBQUEsQ0FBYSxNQUFBLENBQVE7QUFDNUIsTUFBQSxFQUFJLENBQUMsTUFBQSxDQUFBLE1BQUEsQ0FDSCxPQUFBLENBQUEsTUFBQSxFQUFnQixPQUFBO0FBQ2xCLE1BQUEsRUFBSSxDQUFDLE1BQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUNILE9BQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxFQUF5QixPQUFNLENBQUEsQ0FBQTtBQUVqQyxrQkFBYyxDQUFDLE1BQUEsQ0FBQSxNQUFBLENBQUE7QUFDZixrQkFBYyxDQUFDLE1BQUEsQ0FBQSxNQUFBLENBQUE7QUFDZixpQkFBYSxDQUFDLE1BQUEsQ0FBQSxLQUFBLENBQUE7QUFDZCxVQUFBLENBQUEsTUFBQSxFQUFnQixPQUFBO0FBRWhCLFVBQUEsQ0FBQSxRQUFBLEVBQWtCLFNBQUE7QUFBQTtBQUdwQixjQUFZLENBQUMsTUFBQSxDQUFBO0FBR2IsUUFBQSxDQUFBLGVBQUEsRUFBeUI7QUFDdkIsWUFBQSxDQUFVLFNBQUE7QUFDVixlQUFBLENBQWEsWUFBQTtBQUNiLGdCQUFBLENBQWMsYUFBQTtBQUNkLGNBQUEsQ0FBWSxXQUFBO0FBQ1osVUFBQSxDQUFRO0FBQUEsR0FBQTtBQUFBLENBQUEsQ0FHVixDQUFDLE1BQU8sT0FBQSxJQUFXLFlBQUEsRUFBYyxPQUFBLENBQVMsS0FBQSxDQUFBOzs7Ozs7QUM5aEI1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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LENBQUMsSUFBQSxDQUFBLFNBQUEsQ0FBZ0IsU0FBQSxDQUFVLEdBQUEsQ0FBSyxNQUFBLENBQU87QUFDOUQsUUFBQSxDQUFBLGFBQUEsRUFBcUIsTUFBQTtBQUNyQixRQUFBLENBQUEsS0FBQSxFQUFhLE1BQUE7QUFBQSxHQUFBLENBQUE7QUFBQSxDQUFBOzs7O0FDekJqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuL2xpYi9jb21tb24nKTtcblxudmFyIHZpZXdwb3J0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdwb3J0Jyk7XG52YXIgc3RhcmJvdW5kID0gY29tbW9uLnNldHVwKHZpZXdwb3J0KTtcblxuXG4vLyBBdHRlbXB0IHRvIHBsYXkgdGhlIG11c2ljIGZvciB0aGUgd29ybGQuXG5zdGFyYm91bmQud29ybGQub24oJ2xvYWQnLCBmdW5jdGlvbiAod29ybGQpIHtcbiAgLy8gSSdtIHRvbyBsYXp5IHRvIHN1cHBvcnQgQW5ncnkgS29hbGEgd29ybGRzLiA6KVxuICBpZiAod29ybGQubWV0YWRhdGEuX192ZXJzaW9uX18gIT0gMikgcmV0dXJuO1xuXG4gIHRyeSB7XG4gICAgdmFyIHRyYWNrcyA9IHdvcmxkLm1ldGFkYXRhLndvcmxkVGVtcGxhdGUudGVtcGxhdGVEYXRhLmJpb21lc1swXS5tdXNpY1RyYWNrLmRheS50cmFja3M7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgdHJhY2tJbmRleCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqICh0cmFja3MubGVuZ3RoIC0gMSkpO1xuXG4gIHN0YXJib3VuZC5hc3NldHMuZ2V0QmxvYlVSTCh0cmFja3NbdHJhY2tJbmRleF0sIGZ1bmN0aW9uIChlcnIsIHVybCkge1xuICAgIGlmIChlcnIpIHJldHVybjtcblxuICAgIHZhciBhdWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgYXVkaW8uYXV0b3BsYXkgPSB0cnVlO1xuICAgIGF1ZGlvLmNvbnRyb2xzID0gdHJ1ZTtcbiAgICBhdWRpby5zcmMgPSB1cmw7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1ZGlvJykuYXBwZW5kQ2hpbGQoYXVkaW8pO1xuICB9KTtcbn0pO1xuXG5cbmZ1bmN0aW9uIGxvYWRBc3NldHMoZmlsZSkge1xuICBzdGFyYm91bmQuYXNzZXRzLmFkZEZpbGUoJy8nLCBmaWxlLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgc3RhcmJvdW5kLnJlbmRlcmVyLnByZWxvYWQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRXb3JsZChmaWxlKSB7XG4gIHN0YXJib3VuZC53b3JsZC5vcGVuKGZpbGUsIGZ1bmN0aW9uIChlcnIsIG1ldGFkYXRhKSB7XG4gICAgc3RhcmJvdW5kLnJlbmRlcmVyLnJlbmRlcigpO1xuICB9KTtcbn1cblxudmFyIHdvcmxkc0FkZGVkLCBncm91cHMgPSB7fTtcbmZ1bmN0aW9uIGFkZFdvcmxkKGZpbGUpIHtcbiAgLy8gVmVyaWZ5IHRoYXQgdGhlIHdvcmxkIGZpbGUgaXMgdmFsaWQuXG4gIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICByZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyZWFkZXIucmVzdWx0ICE9ICdTQkJGMDInKSByZXR1cm47XG5cbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnN0YXJib3VuZGVkLndvcmxkTGlzdDtcblxuICAgIGlmICghd29ybGRzQWRkZWQpIHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgXCJTZWxlY3QgZGlyZWN0b3J5XCIgbWVzc2FnZS5cbiAgICAgIGxpc3QucmVtb3ZlKDApO1xuICAgICAgbGlzdC5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICBkb2N1bWVudC5zdGFyYm91bmRlZC5sb2FkV29ybGQucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgd29ybGRzQWRkZWQgPSB7fTtcbiAgICB9XG5cbiAgICB3b3JsZHNBZGRlZFtmaWxlLm5hbWVdID0gZmlsZTtcblxuICAgIHZhciBncm91cE5hbWUsIGxhYmVsO1xuICAgIGlmIChmaWxlLm5hbWUuc3Vic3RyKC0xMCkgPT0gJy5zaGlwd29ybGQnKSB7XG4gICAgICBncm91cE5hbWUgPSAnc2hpcHMnO1xuICAgICAgbGFiZWwgPSAnU2hpcCBmb3IgJyArIGZpbGUubmFtZS5zdWJzdHIoMCwgZmlsZS5uYW1lLmxlbmd0aCAtIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHBpZWNlcyA9IGZpbGUubmFtZS5yZXBsYWNlKCcud29ybGQnLCAnJykuc3BsaXQoJ18nKTtcblxuICAgICAgZ3JvdXBOYW1lID0gcGllY2VzWzBdO1xuXG4gICAgICBsYWJlbCA9ICdwbGFuZXQgJyArIHBpZWNlc1s0XTtcbiAgICAgIGlmIChwaWVjZXNbNV0pIGxhYmVsICs9ICcgbW9vbiAnICsgcGllY2VzWzVdO1xuICAgICAgbGFiZWwgKz0gJyBAICgnICsgcGllY2VzWzFdICsgJywgJyArIHBpZWNlc1syXSArICcpJztcbiAgICAgIGxhYmVsICs9ICcsIHBsYXllZCAnICsgbW9tZW50KGZpbGUubGFzdE1vZGlmaWVkRGF0ZSkuZnJvbU5vdygpO1xuICAgIH1cblxuICAgIHZhciBncm91cCA9IGdyb3Vwc1tncm91cE5hbWVdO1xuICAgIGlmICghZ3JvdXApIHtcbiAgICAgIGdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0Z3JvdXAnKTtcbiAgICAgIGdyb3VwLnNldEF0dHJpYnV0ZSgnbGFiZWwnLCBncm91cE5hbWUpO1xuICAgICAgZ3JvdXBzW2dyb3VwTmFtZV0gPSBncm91cDtcbiAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgd29ybGQgaW4gdGhlIHJpZ2h0IHBsYWNlIGFjY29yZGluZyB0byB0aW1lIG1vZGlmaWVkLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG90aGVyID0gd29ybGRzQWRkZWRbZ3JvdXAuY2hpbGROb2Rlc1tpXS52YWx1ZV07XG4gICAgICBpZiAob3RoZXIubGFzdE1vZGlmaWVkRGF0ZSA8IGZpbGUubGFzdE1vZGlmaWVkRGF0ZSkgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIG9wdGlvbiA9IG5ldyBPcHRpb24obGFiZWwsIGZpbGUubmFtZSk7XG4gICAgZ3JvdXAuaW5zZXJ0QmVmb3JlKG9wdGlvbiwgZ3JvdXAuY2hpbGROb2Rlc1tpXSk7XG4gIH07XG4gIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUuc2xpY2UoMCwgNikpO1xufVxuXG5pZiAoZG9jdW1lbnQuc3RhcmJvdW5kZWQucm9vdC53ZWJraXRkaXJlY3RvcnkpIHtcbiAgLy8gVGhlIGJyb3dzZXIgc3VwcG9ydHMgc2VsZWN0aW5nIHRoZSBkaXJlY3RvcnkuXG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnZGlyZWN0b3J5LXN1cHBvcnQnKTtcblxuICBkb2N1bWVudC5zdGFyYm91bmRlZC5yb290Lm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwZW5kaW5nRmlsZXMgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZmlsZSA9IHRoaXMuZmlsZXNbaV0sXG4gICAgICAgICAgcGF0aCA9IGZpbGUud2Via2l0UmVsYXRpdmVQYXRoLFxuICAgICAgICAgIG1hdGNoO1xuXG4gICAgICAvLyBTa2lwIGhpZGRlbiBmaWxlcy9kaXJlY3Rvcmllcy5cbiAgICAgIGlmIChmaWxlLm5hbWVbMF0gPT0gJy4nKSBjb250aW51ZTtcblxuICAgICAgaWYgKGZpbGUubmFtZS5tYXRjaCgvXFwuKHNoaXApP3dvcmxkJC8pKSB7XG4gICAgICAgIGFkZFdvcmxkKGZpbGUpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCA9IHBhdGgubWF0Y2goL15TdGFyYm91bmRcXC9hc3NldHMoXFwvLiopLykpIHtcbiAgICAgICAgLy8gTm90IHN1cmUgd2h5IG11c2ljIGZpbGVzIGFyZSBzdG9yZWQgaW5jb3JyZWN0bHkgbGlrZSB0aGlzLlxuICAgICAgICBpZiAobWF0Y2hbMV0uc3Vic3RyKDAsIDEzKSA9PSAnL211c2ljL211c2ljLycpIHtcbiAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnN1YnN0cig2KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGUgZmlsZSBhbmQgdGhlbiBwcmVsb2FkIHRoZSByZW5kZXJlciBvbmNlIGFsbCBhc3NldHMgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGFkZGVkLlxuICAgICAgICBwZW5kaW5nRmlsZXMrKztcbiAgICAgICAgc3RhcmJvdW5kLmFzc2V0cy5hZGRGaWxlKG1hdGNoWzFdLCBmaWxlLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgcGVuZGluZ0ZpbGVzLS07XG4gICAgICAgICAgaWYgKCFwZW5kaW5nRmlsZXMpIHtcbiAgICAgICAgICAgIHN0YXJib3VuZC5yZW5kZXJlci5wcmVsb2FkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuc3RhcmJvdW5kZWQubG9hZFdvcmxkLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZpbGUgPSB3b3JsZHNBZGRlZCAmJiB3b3JsZHNBZGRlZFtkb2N1bWVudC5zdGFyYm91bmRlZC53b3JsZExpc3QudmFsdWVdO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGxvYWRXb3JsZChmaWxlKTtcblxuICAgIGRvY3VtZW50LnN0YXJib3VuZGVkLmxvYWRXb3JsZC5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJycpO1xuICAgIGRvY3VtZW50LnN0YXJib3VuZGVkLndvcmxkTGlzdC5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJycpO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gU2VwYXJhdGUgZmlsZXMgc29sdXRpb24uXG4gIGRvY3VtZW50LnN0YXJib3VuZGVkLmFzc2V0cy5vbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBsb2FkQXNzZXRzKHRoaXMuZmlsZXNbMF0pO1xuICB9O1xuXG4gIGRvY3VtZW50LnN0YXJib3VuZGVkLndvcmxkLm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgIGxvYWRXb3JsZCh0aGlzLmZpbGVzWzBdKTtcbiAgfTtcbn1cbiIsInZhciBBc3NldHNNYW5hZ2VyID0gcmVxdWlyZSgnc3RhcmJvdW5kLWFzc2V0cycpLkFzc2V0c01hbmFnZXI7XG52YXIgV29ybGRNYW5hZ2VyID0gcmVxdWlyZSgnc3RhcmJvdW5kLXdvcmxkJykuV29ybGRNYW5hZ2VyO1xudmFyIFdvcmxkUmVuZGVyZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtd29ybGQnKS5Xb3JsZFJlbmRlcmVyO1xuXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gKHZpZXdwb3J0KSB7XG4gIC8vIENyZWF0ZSBhbiBhc3NldHMgbWFuYWdlciB3aGljaCB3aWxsIGRlYWwgd2l0aCBwYWNrYWdlIGZpbGVzIGV0Yy5cbiAgdmFyIGFzc2V0cyA9IG5ldyBBc3NldHNNYW5hZ2VyKHtcbiAgICB3b3JrZXJQYXRoOiAnYnVpbGQvd29ya2VyLWFzc2V0cy5qcycsXG4gICAgd29ya2VyczogNFxuICB9KTtcblxuICAvLyBDcmVhdGUgYSB3b3JsZCBtYW5hZ2VyIHRoYXQgaGFuZGxlcyBsb2FkaW5nIHRoZSB3b3JsZCBhbmQgaXRzIHJlZ2lvbnMuXG4gIHZhciB3b3JsZCA9IG5ldyBXb3JsZE1hbmFnZXIoe3dvcmtlclBhdGg6ICdidWlsZC93b3JrZXItd29ybGQuanMnfSk7XG5cbiAgLy8gU2V0IHVwIGEgcmVuZGVyZXIgdGhhdCB3aWxsIHJlbmRlciB0aGUgZ3JhcGhpY3Mgb250byBzY3JlZW4uXG4gIHZhciByZW5kZXJlciA9IG5ldyBXb3JsZFJlbmRlcmVyKHZpZXdwb3J0LCB3b3JsZCwgYXNzZXRzKTtcblxuICAvLyBFbmFibGUga2V5Ym9hcmQgc2Nyb2xsaW5nLlxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzc6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgtMTAsIDAsIHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzg6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgwLCAxMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOTpcbiAgICAgICAgcmVuZGVyZXIuc2Nyb2xsKDEwLCAwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwOlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoMCwgLTEwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIGRyYWdnaW5nIHRvIHNjcm9sbC5cbiAgdmFyIGRyYWdnaW5nID0gbnVsbDtcbiAgdmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBkcmFnZ2luZyA9IFtlLmNsaWVudFgsIGUuY2xpZW50WV07XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCFkcmFnZ2luZykgcmV0dXJuO1xuICAgIHJlbmRlcmVyLnNjcm9sbChkcmFnZ2luZ1swXSAtIGUuY2xpZW50WCwgZS5jbGllbnRZIC0gZHJhZ2dpbmdbMV0sIHRydWUpO1xuICAgIGRyYWdnaW5nWzBdID0gZS5jbGllbnRYO1xuICAgIGRyYWdnaW5nWzFdID0gZS5jbGllbnRZO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuICAgIGRyYWdnaW5nID0gbnVsbDtcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIHpvb21pbmcgd2l0aCB0aGUgbW91c2Ugd2hlZWwuXG4gIHZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS5kZWx0YVkgPiAwKSByZW5kZXJlci56b29tT3V0KCk7XG4gICAgaWYgKGUuZGVsdGFZIDwgMCkgcmVuZGVyZXIuem9vbUluKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGFzc2V0czogYXNzZXRzLFxuICAgIHJlbmRlcmVyOiByZW5kZXJlcixcbiAgICB3b3JsZDogd29ybGQsXG4gIH07XG59O1xuIiwiLy8gQ29weXJpZ2h0IDIwMTIgVHJhY2V1ciBBdXRob3JzLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8qKlxuICogVGhlIHRyYWNldXIgcnVudGltZS5cbiAqL1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKGdsb2JhbC4kdHJhY2V1clJ1bnRpbWUpIHtcbiAgICAvLyBQcmV2ZW50cyBmcm9tIGJlaW5nIGV4ZWN1dGVkIG11bHRpcGxlIHRpbWVzLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciAkY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXM7XG4gIHZhciAkZnJlZXplID0gT2JqZWN0LmZyZWV6ZTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gIHZhciAkZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG4gIHZhciAkaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgJGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG5cbiAgZnVuY3Rpb24gbm9uRW51bSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIHZhciBtZXRob2QgPSBub25FbnVtO1xuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsU3RyaW5nKFN0cmluZykge1xuICAgIC8vIEhhcm1vbnkgU3RyaW5nIEV4dHJhc1xuICAgIC8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6c3RyaW5nX2V4dHJhc1xuICAgICRkZWZpbmVQcm9wZXJ0aWVzKFN0cmluZy5wcm90b3R5cGUsIHtcbiAgICAgIHN0YXJ0c1dpdGg6IG1ldGhvZChmdW5jdGlvbihzKSB7XG4gICAgICAgcmV0dXJuIHRoaXMubGFzdEluZGV4T2YocywgMCkgPT09IDA7XG4gICAgICB9KSxcbiAgICAgIGVuZHNXaXRoOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgICB2YXIgdCA9IFN0cmluZyhzKTtcbiAgICAgICAgdmFyIGwgPSB0aGlzLmxlbmd0aCAtIHQubGVuZ3RoO1xuICAgICAgICByZXR1cm4gbCA+PSAwICYmIHRoaXMuaW5kZXhPZih0LCBsKSA9PT0gbDtcbiAgICAgIH0pLFxuICAgICAgY29udGFpbnM6IG1ldGhvZChmdW5jdGlvbihzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZGV4T2YocykgIT09IC0xO1xuICAgICAgfSksXG4gICAgICB0b0FycmF5OiBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwbGl0KCcnKTtcbiAgICAgIH0pLFxuICAgICAgY29kZVBvaW50QXQ6IG1ldGhvZChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgICAvKiEgaHR0cDovL210aHMuYmUvY29kZXBvaW50YXQgdjAuMS4wIGJ5IEBtYXRoaWFzICovXG4gICAgICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgICAgIHZhciBzaXplID0gc3RyaW5nLmxlbmd0aDtcbiAgICAgICAgLy8gYFRvSW50ZWdlcmBcbiAgICAgICAgdmFyIGluZGV4ID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICAgICAgaWYgKGlzTmFOKGluZGV4KSkge1xuICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBBY2NvdW50IGZvciBvdXQtb2YtYm91bmRzIGluZGljZXM6XG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gc2l6ZSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBjb2RlIHVuaXRcbiAgICAgICAgdmFyIGZpcnN0ID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICB2YXIgc2Vjb25kO1xuICAgICAgICBpZiAoIC8vIGNoZWNrIGlmIGl04oCZcyB0aGUgc3RhcnQgb2YgYSBzdXJyb2dhdGUgcGFpclxuICAgICAgICAgIGZpcnN0ID49IDB4RDgwMCAmJiBmaXJzdCA8PSAweERCRkYgJiYgLy8gaGlnaCBzdXJyb2dhdGVcbiAgICAgICAgICBzaXplID4gaW5kZXggKyAxIC8vIHRoZXJlIGlzIGEgbmV4dCBjb2RlIHVuaXRcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2Vjb25kID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcbiAgICAgICAgICBpZiAoc2Vjb25kID49IDB4REMwMCAmJiBzZWNvbmQgPD0gMHhERkZGKSB7IC8vIGxvdyBzdXJyb2dhdGVcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmcjc3Vycm9nYXRlLWZvcm11bGFlXG4gICAgICAgICAgICByZXR1cm4gKGZpcnN0IC0gMHhEODAwKSAqIDB4NDAwICsgc2Vjb25kIC0gMHhEQzAwICsgMHgxMDAwMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgfSlcbiAgICB9KTtcblxuICAgICRkZWZpbmVQcm9wZXJ0aWVzKFN0cmluZywge1xuICAgICAgLy8gMjEuMS4yLjQgU3RyaW5nLnJhdyhjYWxsU2l0ZSwgLi4uc3Vic3RpdHV0aW9ucylcbiAgICAgIHJhdzogbWV0aG9kKGZ1bmN0aW9uKGNhbGxzaXRlKSB7XG4gICAgICAgIHZhciByYXcgPSBjYWxsc2l0ZS5yYXc7XG4gICAgICAgIHZhciBsZW4gPSByYXcubGVuZ3RoID4+PiAwOyAgLy8gVG9VaW50XG4gICAgICAgIGlmIChsZW4gPT09IDApXG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB2YXIgcyA9ICcnO1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgcyArPSByYXdbaV07XG4gICAgICAgICAgaWYgKGkgKyAxID09PSBsZW4pXG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICBzICs9IGFyZ3VtZW50c1srK2ldO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIC8vIDIxLjEuMi4yIFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLmNvZGVQb2ludHMpXG4gICAgICBmcm9tQ29kZVBvaW50OiBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9tdGhzLmJlL2Zyb21jb2RlcG9pbnQgdjAuMS4wIGJ5IEBtYXRoaWFzXG4gICAgICAgIHZhciBjb2RlVW5pdHMgPSBbXTtcbiAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgdmFyIGhpZ2hTdXJyb2dhdGU7XG4gICAgICAgIHZhciBsb3dTdXJyb2dhdGU7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgY29kZVBvaW50ID0gTnVtYmVyKGFyZ3VtZW50c1tpbmRleF0pO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc0Zpbml0ZShjb2RlUG9pbnQpIHx8ICAvLyBgTmFOYCwgYCtJbmZpbml0eWAsIG9yIGAtSW5maW5pdHlgXG4gICAgICAgICAgICBjb2RlUG9pbnQgPCAwIHx8ICAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgIGNvZGVQb2ludCA+IDB4MTBGRkZGIHx8ICAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgIGZsb29yKGNvZGVQb2ludCkgIT0gY29kZVBvaW50ICAvLyBub3QgYW4gaW50ZWdlclxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgUmFuZ2VFcnJvcignSW52YWxpZCBjb2RlIHBvaW50OiAnICsgY29kZVBvaW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvZGVQb2ludCA8PSAweEZGRkYpIHsgIC8vIEJNUCBjb2RlIHBvaW50XG4gICAgICAgICAgICBjb2RlVW5pdHMucHVzaChjb2RlUG9pbnQpO1xuICAgICAgICAgIH0gZWxzZSB7ICAvLyBBc3RyYWwgY29kZSBwb2ludDsgc3BsaXQgaW4gc3Vycm9nYXRlIGhhbHZlc1xuICAgICAgICAgICAgLy8gaHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZyNzdXJyb2dhdGUtZm9ybXVsYWVcbiAgICAgICAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwO1xuICAgICAgICAgICAgaGlnaFN1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgPj4gMTApICsgMHhEODAwO1xuICAgICAgICAgICAgbG93U3Vycm9nYXRlID0gKGNvZGVQb2ludCAlIDB4NDAwKSArIDB4REMwMDtcbiAgICAgICAgICAgIGNvZGVVbml0cy5wdXNoKGhpZ2hTdXJyb2dhdGUsIGxvd1N1cnJvZ2F0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNvZGVVbml0cyk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgLy8gIyMjIFN5bWJvbHNcbiAgLy9cbiAgLy8gU3ltYm9scyBhcmUgZW11bGF0ZWQgdXNpbmcgYW4gb2JqZWN0IHdoaWNoIGlzIGFuIGluc3RhbmNlIG9mIFN5bWJvbFZhbHVlLlxuICAvLyBDYWxsaW5nIFN5bWJvbCBhcyBhIGZ1bmN0aW9uIHJldHVybnMgYSBzeW1ib2wgdmFsdWUgb2JqZWN0LlxuICAvL1xuICAvLyBJZiBvcHRpb25zLnN5bWJvbHMgaXMgZW5hYmxlZCB0aGVuIGFsbCBwcm9wZXJ0eSBhY2Nlc3NlcyBhcmUgdHJhbnNmb3JtZWRcbiAgLy8gaW50byBydW50aW1lIGNhbGxzIHdoaWNoIHVzZXMgdGhlIGludGVybmFsIHN0cmluZyBhcyB0aGUgcmVhbCBwcm9wZXJ0eVxuICAvLyBuYW1lLlxuICAvL1xuICAvLyBJZiBvcHRpb25zLnN5bWJvbHMgaXMgZGlzYWJsZWQgc3ltYm9scyBqdXN0IHRvU3RyaW5nIGFzIHRoZWlyIGludGVybmFsXG4gIC8vIHJlcHJlc2VudGF0aW9uLCBtYWtpbmcgdGhlbSB3b3JrIGJ1dCBsZWFrIGFzIGVudW1lcmFibGUgcHJvcGVydGllcy5cblxuICB2YXIgY291bnRlciA9IDA7XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIG5ldyB1bmlxdWUgc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICBmdW5jdGlvbiBuZXdVbmlxdWVTdHJpbmcoKSB7XG4gICAgcmV0dXJuICdfXyQnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWU5KSArICckJyArICsrY291bnRlciArICckX18nO1xuICB9XG5cbiAgLy8gVGhlIHN0cmluZyB1c2VkIGZvciB0aGUgcmVhbCBwcm9wZXJ0eS5cbiAgdmFyIHN5bWJvbEludGVybmFsUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgdmFyIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcblxuICAvLyBVc2VkIGZvciB0aGUgU3ltYm9sIHdyYXBwZXJcbiAgdmFyIHN5bWJvbERhdGFQcm9wZXJ0eSA9IG5ld1VuaXF1ZVN0cmluZygpO1xuXG4gIC8vIEFsbCBzeW1ib2wgdmFsdWVzIGFyZSBrZXB0IGluIHRoaXMgbWFwLiBUaGlzIGlzIHNvIHRoYXQgd2UgY2FuIGdldCBiYWNrIHRvXG4gIC8vIHRoZSBzeW1ib2wgb2JqZWN0IGlmIGFsbCB3ZSBoYXZlIGlzIHRoZSBzdHJpbmcga2V5IHJlcHJlc2VudGluZyB0aGUgc3ltYm9sLlxuICB2YXIgc3ltYm9sVmFsdWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmdW5jdGlvbiBpc1N5bWJvbChzeW1ib2wpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN5bWJvbCA9PT0gJ29iamVjdCcgJiYgc3ltYm9sIGluc3RhbmNlb2YgU3ltYm9sVmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiB0eXBlT2Yodikge1xuICAgIGlmIChpc1N5bWJvbCh2KSlcbiAgICAgIHJldHVybiAnc3ltYm9sJztcbiAgICByZXR1cm4gdHlwZW9mIHY7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB1bmlxdWUgc3ltYm9sIG9iamVjdC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzdHJpbmcgT3B0aW9uYWwgc3RyaW5nIHVzZWQgZm9yIHRvU3RyaW5nLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuICAgIHZhciB2YWx1ZSA9IG5ldyBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbik7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN5bWJvbCkpXG4gICAgICByZXR1cm4gdmFsdWU7XG5cbiAgICAvLyBuZXcgU3ltYm9sIHNob3VsZCB0aHJvdy5cbiAgICAvL1xuICAgIC8vIFRoZXJlIGFyZSB0d28gd2F5cyB0byBnZXQgYSB3cmFwcGVyIHRvIGEgc3ltYm9sLiBFaXRoZXIgYnkgZG9pbmdcbiAgICAvLyBPYmplY3Qoc3ltYm9sKSBvciBjYWxsIGEgbm9uIHN0cmljdCBmdW5jdGlvbiB1c2luZyBhIHN5bWJvbCB2YWx1ZSBhc1xuICAgIC8vIHRoaXMuIFRvIGNvcnJlY3RseSBoYW5kbGUgdGhlc2UgdHdvIHdvdWxkIHJlcXVpcmUgYSBsb3Qgb2Ygd29yayBmb3IgdmVyeVxuICAgIC8vIGxpdHRsZSBnYWluIHNvIHdlIGFyZSBub3QgZG9pbmcgdGhvc2UgYXQgdGhlIG1vbWVudC5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTeW1ib2wgY2Fubm90IGJlIG5ld1xcJ2VkJyk7XG4gIH1cblxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sLnByb3RvdHlwZSwgJ2NvbnN0cnVjdG9yJywgbm9uRW51bShTeW1ib2wpKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd0b1N0cmluZycsIG1ldGhvZChmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ltYm9sVmFsdWUgPSB0aGlzW3N5bWJvbERhdGFQcm9wZXJ0eV07XG4gICAgaWYgKCFnZXRPcHRpb24oJ3N5bWJvbHMnKSlcbiAgICAgIHJldHVybiBzeW1ib2xWYWx1ZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIHZhciBkZXNjID0gc3ltYm9sVmFsdWVbc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eV07XG4gICAgaWYgKGRlc2MgPT09IHVuZGVmaW5lZClcbiAgICAgIGRlc2MgPSAnJztcbiAgICByZXR1cm4gJ1N5bWJvbCgnICsgZGVzYyArICcpJztcbiAgfSkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghc3ltYm9sVmFsdWUpXG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ0NvbnZlcnNpb24gZnJvbSBzeW1ib2wgdG8gc3RyaW5nJyk7XG4gICAgaWYgKCFnZXRPcHRpb24oJ3N5bWJvbHMnKSlcbiAgICAgIHJldHVybiBzeW1ib2xWYWx1ZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICByZXR1cm4gc3ltYm9sVmFsdWU7XG4gIH0pKTtcblxuICBmdW5jdGlvbiBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbikge1xuICAgIHZhciBrZXkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGF0YVByb3BlcnR5LCB7dmFsdWU6IHRoaXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eSwge3ZhbHVlOiBrZXl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eSwge3ZhbHVlOiBkZXNjcmlwdGlvbn0pO1xuICAgICRmcmVlemUodGhpcyk7XG4gICAgc3ltYm9sVmFsdWVzW2tleV0gPSB0aGlzO1xuICB9XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd0b1N0cmluZycsIHtcbiAgICB2YWx1ZTogU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbFZhbHVlLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudmFsdWVPZixcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGZyZWV6ZShTeW1ib2xWYWx1ZS5wcm90b3R5cGUpO1xuXG4gIFN5bWJvbC5pdGVyYXRvciA9IFN5bWJvbCgpO1xuXG4gIGZ1bmN0aW9uIHRvUHJvcGVydHkobmFtZSkge1xuICAgIGlmIChpc1N5bWJvbChuYW1lKSlcbiAgICAgIHJldHVybiBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgZ2V0T3duUHJvcGVydHlOYW1lcyB0byBmaWx0ZXIgb3V0IHByaXZhdGUgbmFtZSBrZXlzLlxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIHZhciBuYW1lcyA9ICRnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgIGlmICghc3ltYm9sVmFsdWVzW25hbWVdKVxuICAgICAgICBydi5wdXNoKG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBuYW1lKSB7XG4gICAgcmV0dXJuICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCB0b1Byb3BlcnR5KG5hbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xWYWx1ZXNbbmFtZXNbaV1dO1xuICAgICAgaWYgKHN5bWJvbClcbiAgICAgICAgcnYucHVzaChzeW1ib2wpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICAvLyBPdmVycmlkZSBPYmplY3QucHJvdG90cGUuaGFzT3duUHJvcGVydHkgdG8gYWx3YXlzIHJldHVybiBmYWxzZSBmb3JcbiAgLy8gcHJpdmF0ZSBuYW1lcy5cbiAgZnVuY3Rpb24gaGFzT3duUHJvcGVydHkobmFtZSkge1xuICAgIHJldHVybiAkaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCB0b1Byb3BlcnR5KG5hbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE9wdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGdsb2JhbC50cmFjZXVyICYmIGdsb2JhbC50cmFjZXVyLm9wdGlvbnNbbmFtZV07XG4gIH1cblxuICBmdW5jdGlvbiBzZXRQcm9wZXJ0eShvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHN5bSwgZGVzYztcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpIHtcbiAgICAgIHN5bSA9IG5hbWU7XG4gICAgICBuYW1lID0gbmFtZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICB9XG4gICAgb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgaWYgKHN5bSAmJiAoZGVzYyA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBuYW1lKSkpXG4gICAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCB7ZW51bWVyYWJsZTogZmFsc2V9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpIHtcbiAgICAgIC8vIFN5bWJvbHMgc2hvdWxkIG5vdCBiZSBlbnVtZXJhYmxlLiBXZSBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBkZXNjcmlwdG9yXG4gICAgICAvLyBiZWZvcmUgY2FsbGluZyB0aGUgb3JpZ2luYWwgZGVmaW5lUHJvcGVydHkgYmVjYXVzZSB0aGUgcHJvcGVydHkgbWlnaHRcbiAgICAgIC8vIGJlIG1hZGUgbm9uIGNvbmZpZ3VyYWJsZS5cbiAgICAgIGlmIChkZXNjcmlwdG9yLmVudW1lcmFibGUpIHtcbiAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5jcmVhdGUoZGVzY3JpcHRvciwge1xuICAgICAgICAgIGVudW1lcmFibGU6IHt2YWx1ZTogZmFsc2V9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbmFtZSA9IG5hbWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgfVxuICAgICRkZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIGRlc2NyaXB0b3IpO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsT2JqZWN0KE9iamVjdCkge1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdkZWZpbmVQcm9wZXJ0eScsIHt2YWx1ZTogZGVmaW5lUHJvcGVydHl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlOYW1lcycsXG4gICAgICAgICAgICAgICAgICAgIHt2YWx1ZTogZ2V0T3duUHJvcGVydHlOYW1lc30pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3InLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGdldE93blByb3BlcnR5RGVzY3JpcHRvcn0pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnaGFzT3duUHJvcGVydHknLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGhhc093blByb3BlcnR5fSk7XG5cbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuXG4gICAgLy8gT2JqZWN0LmlzXG5cbiAgICAvLyBVbmxpa2UgPT09IHRoaXMgcmV0dXJucyB0cnVlIGZvciAoTmFOLCBOYU4pIGFuZCBmYWxzZSBmb3IgKDAsIC0wKS5cbiAgICBmdW5jdGlvbiBpcyhsZWZ0LCByaWdodCkge1xuICAgICAgaWYgKGxlZnQgPT09IHJpZ2h0KVxuICAgICAgICByZXR1cm4gbGVmdCAhPT0gMCB8fCAxIC8gbGVmdCA9PT0gMSAvIHJpZ2h0O1xuICAgICAgcmV0dXJuIGxlZnQgIT09IGxlZnQgJiYgcmlnaHQgIT09IHJpZ2h0O1xuICAgIH1cblxuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdpcycsIG1ldGhvZChpcykpO1xuXG4gICAgLy8gT2JqZWN0LmFzc2lnbiAoMTkuMS4zLjEpXG4gICAgZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgc291cmNlKSB7XG4gICAgICB2YXIgcHJvcHMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgICAgdmFyIHAsIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICB0YXJnZXRbcHJvcHNbcF1dID0gc291cmNlW3Byb3BzW3BdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2Fzc2lnbicsIG1ldGhvZChhc3NpZ24pKTtcblxuICAgIC8vIE9iamVjdC5taXhpbiAoMTkuMS4zLjE1KVxuICAgIGZ1bmN0aW9uIG1peGluKHRhcmdldCwgc291cmNlKSB7XG4gICAgICB2YXIgcHJvcHMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgICAgdmFyIHAsIGRlc2NyaXB0b3IsIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICBkZXNjcmlwdG9yID0gJGdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIHByb3BzW3BdKTtcbiAgICAgICAgJGRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcHNbcF0sIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnbWl4aW4nLCBtZXRob2QobWl4aW4pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsQXJyYXkoQXJyYXkpIHtcbiAgICAvLyBNYWtlIGFycmF5cyBpdGVyYWJsZS5cbiAgICAvLyBUT0RPKGFydik6IFRoaXMgaXMgbm90IHZlcnkgcm9idXN0IHRvIGNoYW5nZXMgaW4gdGhlIHByaXZhdGUgbmFtZXNcbiAgICAvLyBvcHRpb24gYnV0IGZvcnR1bmF0ZWx5IHRoaXMgaXMgbm90IHNvbWV0aGluZyB0aGF0IGlzIGV4cGVjdGVkIHRvIGNoYW5nZVxuICAgIC8vIGF0IHJ1bnRpbWUgb3V0c2lkZSBvZiB0ZXN0cy5cbiAgICBkZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgIHZhciBhcnJheSA9IHRoaXM7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7dmFsdWU6IGFycmF5W2luZGV4KytdLCBkb25lOiBmYWxzZX07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7dmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZX07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbmNlbGxlclxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIERlZmVycmVkKGNhbmNlbGxlcikge1xuICAgIHRoaXMuY2FuY2VsbGVyXyA9IGNhbmNlbGxlcjtcbiAgICB0aGlzLmxpc3RlbmVyc18gPSBbXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vdGlmeShzZWxmKSB7XG4gICAgd2hpbGUgKHNlbGYubGlzdGVuZXJzXy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgY3VycmVudCA9IHNlbGYubGlzdGVuZXJzXy5zaGlmdCgpO1xuICAgICAgdmFyIGN1cnJlbnRSZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzZWxmLnJlc3VsdF9bMV0pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50LmVycmJhY2spXG4gICAgICAgICAgICAgIGN1cnJlbnRSZXN1bHQgPSBjdXJyZW50LmVycmJhY2suY2FsbCh1bmRlZmluZWQsIHNlbGYucmVzdWx0X1swXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50LmNhbGxiYWNrKVxuICAgICAgICAgICAgICBjdXJyZW50UmVzdWx0ID0gY3VycmVudC5jYWxsYmFjay5jYWxsKHVuZGVmaW5lZCwgc2VsZi5yZXN1bHRfWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudC5kZWZlcnJlZC5jYWxsYmFjayhjdXJyZW50UmVzdWx0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY3VycmVudC5kZWZlcnJlZC5lcnJiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKHVudXNlZCkge31cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaXJlKHNlbGYsIHZhbHVlLCBpc0Vycm9yKSB7XG4gICAgaWYgKHNlbGYuZmlyZWRfKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbHJlYWR5IGZpcmVkJyk7XG5cbiAgICBzZWxmLmZpcmVkXyA9IHRydWU7XG4gICAgc2VsZi5yZXN1bHRfID0gW3ZhbHVlLCBpc0Vycm9yXTtcbiAgICBub3RpZnkoc2VsZik7XG4gIH1cblxuICBEZWZlcnJlZC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IERlZmVycmVkLFxuXG4gICAgZmlyZWRfOiBmYWxzZSxcbiAgICByZXN1bHRfOiB1bmRlZmluZWQsXG5cbiAgICBjcmVhdGVQcm9taXNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7dGhlbjogdGhpcy50aGVuLmJpbmQodGhpcyksIGNhbmNlbDogdGhpcy5jYW5jZWwuYmluZCh0aGlzKX07XG4gICAgfSxcblxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZmlyZSh0aGlzLCB2YWx1ZSwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICBlcnJiYWNrOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGZpcmUodGhpcywgZXJyLCB0cnVlKTtcbiAgICB9LFxuXG4gICAgdGhlbjogZnVuY3Rpb24oY2FsbGJhY2ssIGVycmJhY2spIHtcbiAgICAgIHZhciByZXN1bHQgPSBuZXcgRGVmZXJyZWQodGhpcy5jYW5jZWwuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmxpc3RlbmVyc18ucHVzaCh7XG4gICAgICAgIGRlZmVycmVkOiByZXN1bHQsXG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgZXJyYmFjazogZXJyYmFja1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5maXJlZF8pXG4gICAgICAgIG5vdGlmeSh0aGlzKTtcbiAgICAgIHJldHVybiByZXN1bHQuY3JlYXRlUHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuZmlyZWRfKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FscmVhZHkgZmluaXNoZWQnKTtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBpZiAodGhpcy5jYW5jZWxsZXJfKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2FuY2VsbGVyXyh0aGlzKTtcbiAgICAgICAgaWYgKCFyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgICByZXN1bHQgPSBuZXcgRXJyb3IocmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBFcnJvcignY2FuY2VsbGVkJyk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZmlyZWRfKSB7XG4gICAgICAgIHRoaXMucmVzdWx0XyA9IFtyZXN1bHQsIHRydWVdO1xuICAgICAgICBub3RpZnkodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFN5c3RlbS5nZXQvc2V0IGFuZCBAdHJhY2V1ci9tb2R1bGUgZ2V0cyBvdmVycmlkZGVuIGluIEB0cmFjZXVyL21vZHVsZXMgdG9cbiAgLy8gYmUgbW9yZSBjb3JyZWN0LlxuXG4gIGZ1bmN0aW9uIE1vZHVsZUltcGwodXJsLCBmdW5jLCBzZWxmKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5mdW5jID0gZnVuYztcbiAgICB0aGlzLnNlbGYgPSBzZWxmO1xuICAgIHRoaXMudmFsdWVfID0gbnVsbDtcbiAgfVxuICBNb2R1bGVJbXBsLnByb3RvdHlwZSA9IHtcbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZV8pXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlXztcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlXyA9IHRoaXMuZnVuYy5jYWxsKHRoaXMuc2VsZik7XG4gICAgfVxuICB9O1xuXG4gIHZhciBtb2R1bGVzID0ge1xuICAgICdAdHJhY2V1ci9tb2R1bGUnOiB7XG4gICAgICBNb2R1bGVJbXBsOiBNb2R1bGVJbXBsLFxuICAgICAgcmVnaXN0ZXJNb2R1bGU6IGZ1bmN0aW9uKHVybCwgZnVuYywgc2VsZikge1xuICAgICAgICBtb2R1bGVzW3VybF0gPSBuZXcgTW9kdWxlSW1wbCh1cmwsIGZ1bmMsIHNlbGYpO1xuICAgICAgfSxcbiAgICAgIGdldE1vZHVsZUltcGw6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlc1t1cmxdLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgU3lzdGVtID0ge1xuICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbbmFtZV07XG4gICAgICBpZiAobW9kdWxlIGluc3RhbmNlb2YgTW9kdWxlSW1wbClcbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbbmFtZV0gPSBtb2R1bGUudmFsdWU7XG4gICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihuYW1lLCBvYmplY3QpIHtcbiAgICAgIG1vZHVsZXNbbmFtZV0gPSBvYmplY3Q7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNldHVwR2xvYmFscyhnbG9iYWwpIHtcbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wpXG4gICAgICBnbG9iYWwuU3ltYm9sID0gU3ltYm9sO1xuICAgIGlmICghZ2xvYmFsLlN5bWJvbC5pdGVyYXRvcilcbiAgICAgIGdsb2JhbC5TeW1ib2wuaXRlcmF0b3IgPSBTeW1ib2woKTtcblxuICAgIHBvbHlmaWxsU3RyaW5nKGdsb2JhbC5TdHJpbmcpO1xuICAgIHBvbHlmaWxsT2JqZWN0KGdsb2JhbC5PYmplY3QpO1xuICAgIHBvbHlmaWxsQXJyYXkoZ2xvYmFsLkFycmF5KTtcbiAgICBnbG9iYWwuU3lzdGVtID0gU3lzdGVtO1xuICAgIC8vIFRPRE8oYXJ2KTogRG9uJ3QgZXhwb3J0IHRoaXMuXG4gICAgZ2xvYmFsLkRlZmVycmVkID0gRGVmZXJyZWQ7XG4gIH1cblxuICBzZXR1cEdsb2JhbHMoZ2xvYmFsKTtcblxuICAvLyBUaGlzIGZpbGUgaXMgc29tZXRpbWVzIHVzZWQgd2l0aG91dCB0cmFjZXVyLmpzIHNvIG1ha2UgaXQgYSBuZXcgZ2xvYmFsLlxuICBnbG9iYWwuJHRyYWNldXJSdW50aW1lID0ge1xuICAgIERlZmVycmVkOiBEZWZlcnJlZCxcbiAgICBzZXRQcm9wZXJ0eTogc2V0UHJvcGVydHksXG4gICAgc2V0dXBHbG9iYWxzOiBzZXR1cEdsb2JhbHMsXG4gICAgdG9Qcm9wZXJ0eTogdG9Qcm9wZXJ0eSxcbiAgICB0eXBlb2Y6IHR5cGVPZixcbiAgfTtcblxufSkodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi41LjFcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG4oZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbW9tZW50LFxuICAgICAgICBWRVJTSU9OID0gXCIyLjUuMVwiLFxuICAgICAgICBnbG9iYWwgPSB0aGlzLFxuICAgICAgICByb3VuZCA9IE1hdGgucm91bmQsXG4gICAgICAgIGksXG5cbiAgICAgICAgWUVBUiA9IDAsXG4gICAgICAgIE1PTlRIID0gMSxcbiAgICAgICAgREFURSA9IDIsXG4gICAgICAgIEhPVVIgPSAzLFxuICAgICAgICBNSU5VVEUgPSA0LFxuICAgICAgICBTRUNPTkQgPSA1LFxuICAgICAgICBNSUxMSVNFQ09ORCA9IDYsXG5cbiAgICAgICAgLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbGFuZ3VhZ2UgY29uZmlnIGZpbGVzXG4gICAgICAgIGxhbmd1YWdlcyA9IHt9LFxuXG4gICAgICAgIC8vIG1vbWVudCBpbnRlcm5hbCBwcm9wZXJ0aWVzXG4gICAgICAgIG1vbWVudFByb3BlcnRpZXMgPSB7XG4gICAgICAgICAgICBfaXNBTW9tZW50T2JqZWN0OiBudWxsLFxuICAgICAgICAgICAgX2kgOiBudWxsLFxuICAgICAgICAgICAgX2YgOiBudWxsLFxuICAgICAgICAgICAgX2wgOiBudWxsLFxuICAgICAgICAgICAgX3N0cmljdCA6IG51bGwsXG4gICAgICAgICAgICBfaXNVVEMgOiBudWxsLFxuICAgICAgICAgICAgX29mZnNldCA6IG51bGwsICAvLyBvcHRpb25hbC4gQ29tYmluZSB3aXRoIF9pc1VUQ1xuICAgICAgICAgICAgX3BmIDogbnVsbCxcbiAgICAgICAgICAgIF9sYW5nIDogbnVsbCAgLy8gb3B0aW9uYWxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyAmJiB0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcpLFxuXG4gICAgICAgIC8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxuICAgICAgICBhc3BOZXRKc29uUmVnZXggPSAvXlxcLz9EYXRlXFwoKFxcLT9cXGQrKS9pLFxuICAgICAgICBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleCA9IC8oXFwtKT8oPzooXFxkKilcXC4pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKVxcLj8oXFxkezN9KT8pPy8sXG5cbiAgICAgICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAgICAgLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxuICAgICAgICBpc29EdXJhdGlvblJlZ2V4ID0gL14oLSk/UCg/Oig/OihbMC05LC5dKilZKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKUQpPyg/OlQoPzooWzAtOSwuXSopSCk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilTKT8pP3woWzAtOSwuXSopVykkLyxcblxuICAgICAgICAvLyBmb3JtYXQgdG9rZW5zXG4gICAgICAgIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98bW0/fHNzP3xTezEsNH18WHx6ej98Wlo/fC4pL2csXG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhMVHxMTD9MP0w/fGx7MSw0fSkvZyxcblxuICAgICAgICAvLyBwYXJzaW5nIHRva2VuIHJlZ2V4ZXNcbiAgICAgICAgcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzID0gL1xcZFxcZD8vLCAvLyAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHMgPSAvXFxkezEsM30vLCAvLyAwIC0gOTk5XG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHMgPSAvXFxkezEsNH0vLCAvLyAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuT25lVG9TaXhEaWdpdHMgPSAvWytcXC1dP1xcZHsxLDZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5EaWdpdHMgPSAvXFxkKy8sIC8vIG5vbnplcm8gbnVtYmVyIG9mIGRpZ2l0c1xuICAgICAgICBwYXJzZVRva2VuV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pLCAvLyBhbnkgd29yZCAob3IgdHdvKSBjaGFyYWN0ZXJzIG9yIG51bWJlcnMgaW5jbHVkaW5nIHR3by90aHJlZSB3b3JkIG1vbnRoIGluIGFyYWJpYy5cbiAgICAgICAgcGFyc2VUb2tlblRpbWV6b25lID0gL1p8W1xcK1xcLV1cXGRcXGQ6P1xcZFxcZC9naSwgLy8gKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG4gICAgICAgIHBhcnNlVG9rZW5UID0gL1QvaSwgLy8gVCAoSVNPIHNlcGFyYXRvcilcbiAgICAgICAgcGFyc2VUb2tlblRpbWVzdGFtcE1zID0gL1tcXCtcXC1dP1xcZCsoXFwuXFxkezEsM30pPy8sIC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbiAgICAgICAgLy9zdHJpY3QgcGFyc2luZyByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVEaWdpdCA9IC9cXGQvLCAvLyAwIC0gOVxuICAgICAgICBwYXJzZVRva2VuVHdvRGlnaXRzID0gL1xcZFxcZC8sIC8vIDAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlblRocmVlRGlnaXRzID0gL1xcZHszfS8sIC8vIDAwMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuRm91ckRpZ2l0cyA9IC9cXGR7NH0vLCAvLyAwMDAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuU2l4RGlnaXRzID0gL1srLV0/XFxkezZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5TaWduZWROdW1iZXIgPSAvWystXT9cXGQrLywgLy8gLWluZiAtIGluZlxuXG4gICAgICAgIC8vIGlzbyA4NjAxIHJlZ2V4XG4gICAgICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgICAgICBpc29SZWdleCA9IC9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sXG5cbiAgICAgICAgaXNvRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJyxcblxuICAgICAgICBpc29EYXRlcyA9IFtcbiAgICAgICAgICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkezJ9LVxcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLURERCcsIC9cXGR7NH0tXFxkezN9L11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgICAgIGlzb1RpbWVzID0gW1xuICAgICAgICAgICAgWydISDptbTpzcy5TU1NTJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGR7MSwzfS9dLFxuICAgICAgICAgICAgWydISDptbTpzcycsIC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgICAgICBbJ0hIOm1tJywgLyhUfCApXFxkXFxkOlxcZFxcZC9dLFxuICAgICAgICAgICAgWydISCcsIC8oVHwgKVxcZFxcZC9dXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gdGltZXpvbmUgY2h1bmtlciBcIisxMDowMFwiID4gW1wiMTBcIiwgXCIwMFwiXSBvciBcIi0xNTMwXCIgPiBbXCItMTVcIiwgXCIzMFwiXVxuICAgICAgICBwYXJzZVRpbWV6b25lQ2h1bmtlciA9IC8oW1xcK1xcLV18XFxkXFxkKS9naSxcblxuICAgICAgICAvLyBnZXR0ZXIgYW5kIHNldHRlciBuYW1lc1xuICAgICAgICBwcm94eUdldHRlcnNBbmRTZXR0ZXJzID0gJ0RhdGV8SG91cnN8TWludXRlc3xTZWNvbmRzfE1pbGxpc2Vjb25kcycuc3BsaXQoJ3wnKSxcbiAgICAgICAgdW5pdE1pbGxpc2Vjb25kRmFjdG9ycyA9IHtcbiAgICAgICAgICAgICdNaWxsaXNlY29uZHMnIDogMSxcbiAgICAgICAgICAgICdTZWNvbmRzJyA6IDFlMyxcbiAgICAgICAgICAgICdNaW51dGVzJyA6IDZlNCxcbiAgICAgICAgICAgICdIb3VycycgOiAzNmU1LFxuICAgICAgICAgICAgJ0RheXMnIDogODY0ZTUsXG4gICAgICAgICAgICAnTW9udGhzJyA6IDI1OTJlNixcbiAgICAgICAgICAgICdZZWFycycgOiAzMTUzNmU2XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5pdEFsaWFzZXMgPSB7XG4gICAgICAgICAgICBtcyA6ICdtaWxsaXNlY29uZCcsXG4gICAgICAgICAgICBzIDogJ3NlY29uZCcsXG4gICAgICAgICAgICBtIDogJ21pbnV0ZScsXG4gICAgICAgICAgICBoIDogJ2hvdXInLFxuICAgICAgICAgICAgZCA6ICdkYXknLFxuICAgICAgICAgICAgRCA6ICdkYXRlJyxcbiAgICAgICAgICAgIHcgOiAnd2VlaycsXG4gICAgICAgICAgICBXIDogJ2lzb1dlZWsnLFxuICAgICAgICAgICAgTSA6ICdtb250aCcsXG4gICAgICAgICAgICB5IDogJ3llYXInLFxuICAgICAgICAgICAgREREIDogJ2RheU9mWWVhcicsXG4gICAgICAgICAgICBlIDogJ3dlZWtkYXknLFxuICAgICAgICAgICAgRSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGdnOiAnd2Vla1llYXInLFxuICAgICAgICAgICAgR0c6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICBjYW1lbEZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIGRheW9meWVhciA6ICdkYXlPZlllYXInLFxuICAgICAgICAgICAgaXNvd2Vla2RheSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGlzb3dlZWsgOiAnaXNvV2VlaycsXG4gICAgICAgICAgICB3ZWVreWVhciA6ICd3ZWVrWWVhcicsXG4gICAgICAgICAgICBpc293ZWVreWVhciA6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBmb3JtYXQgZnVuY3Rpb24gc3RyaW5nc1xuICAgICAgICBmb3JtYXRGdW5jdGlvbnMgPSB7fSxcblxuICAgICAgICAvLyB0b2tlbnMgdG8gb3JkaW5hbGl6ZSBhbmQgcGFkXG4gICAgICAgIG9yZGluYWxpemVUb2tlbnMgPSAnREREIHcgVyBNIEQgZCcuc3BsaXQoJyAnKSxcbiAgICAgICAgcGFkZGVkVG9rZW5zID0gJ00gRCBIIGggbSBzIHcgVycuc3BsaXQoJyAnKSxcblxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIE0gICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTU1NICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBNTU1NIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tb250aHModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEREQgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheU9mWWVhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGQgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGQgICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNNaW4odGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZGQgIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5c1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGRkZCA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3ICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBXICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZWSAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy55ZWFyKCksIHNpZ24gPSB5ID49IDAgPyAnKycgOiAnLSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyBsZWZ0WmVyb0ZpbGwoTWF0aC5hYnMoeSksIDYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCksIDQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2dnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA1KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHRyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpLCA0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHRyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgdHJ1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEggICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1pbnV0ZXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlY29uZHMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b0ludCh0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTUyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwKSwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU1NTICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMubWlsbGlzZWNvbmRzKCksIDMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNTU1MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBaICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxuICAgICAgICAgICAgICAgICAgICBiID0gXCIrXCI7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiLVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYiArIGxlZnRaZXJvRmlsbCh0b0ludChhIC8gNjApLCAyKSArIFwiOlwiICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFpaICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSAtdGhpcy56b25lKCksXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIitcIjtcbiAgICAgICAgICAgICAgICBpZiAoYSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xuICAgICAgICAgICAgICAgICAgICBiID0gXCItXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBiICsgbGVmdFplcm9GaWxsKHRvSW50KGEgLyA2MCksIDIpICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHogOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZUFiYnIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB6eiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lTmFtZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFggICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5peCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFEgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVhcnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGxpc3RzID0gWydtb250aHMnLCAnbW9udGhzU2hvcnQnLCAnd2Vla2RheXMnLCAnd2Vla2RheXNTaG9ydCcsICd3ZWVrZGF5c01pbiddO1xuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LCBhbmQgZXM1IHN0YW5kYXJkIGlzIG5vdCB2ZXJ5XG4gICAgICAgIC8vIGhlbHBmdWwuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbXB0eSA6IGZhbHNlLFxuICAgICAgICAgICAgdW51c2VkVG9rZW5zIDogW10sXG4gICAgICAgICAgICB1bnVzZWRJbnB1dCA6IFtdLFxuICAgICAgICAgICAgb3ZlcmZsb3cgOiAtMixcbiAgICAgICAgICAgIGNoYXJzTGVmdE92ZXIgOiAwLFxuICAgICAgICAgICAgbnVsbElucHV0IDogZmFsc2UsXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggOiBudWxsLFxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCA6IGZhbHNlLFxuICAgICAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXG4gICAgICAgICAgICBpc286IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFkVG9rZW4oZnVuYywgY291bnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgY291bnQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBvcmRpbmFsaXplVG9rZW4oZnVuYywgcGVyaW9kKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm9yZGluYWwoZnVuYy5jYWxsKHRoaXMsIGEpLCBwZXJpb2QpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHdoaWxlIChvcmRpbmFsaXplVG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBpID0gb3JkaW5hbGl6ZVRva2Vucy5wb3AoKTtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArICdvJ10gPSBvcmRpbmFsaXplVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIGkpO1xuICAgIH1cbiAgICB3aGlsZSAocGFkZGVkVG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBpID0gcGFkZGVkVG9rZW5zLnBvcCgpO1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpICsgaV0gPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpXSwgMik7XG4gICAgfVxuICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zLkREREQgPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREQsIDMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIExhbmd1YWdlKCkge1xuXG4gICAgfVxuXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcbiAgICAgICAgZXh0ZW5kKHRoaXMsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gRHVyYXRpb24gQ29uc3RydWN0b3JcbiAgICBmdW5jdGlvbiBEdXJhdGlvbihkdXJhdGlvbikge1xuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoZHVyYXRpb24pLFxuICAgICAgICAgICAgeWVhcnMgPSBub3JtYWxpemVkSW5wdXQueWVhciB8fCAwLFxuICAgICAgICAgICAgbW9udGhzID0gbm9ybWFsaXplZElucHV0Lm1vbnRoIHx8IDAsXG4gICAgICAgICAgICB3ZWVrcyA9IG5vcm1hbGl6ZWRJbnB1dC53ZWVrIHx8IDAsXG4gICAgICAgICAgICBkYXlzID0gbm9ybWFsaXplZElucHV0LmRheSB8fCAwLFxuICAgICAgICAgICAgaG91cnMgPSBub3JtYWxpemVkSW5wdXQuaG91ciB8fCAwLFxuICAgICAgICAgICAgbWludXRlcyA9IG5vcm1hbGl6ZWRJbnB1dC5taW51dGUgfHwgMCxcbiAgICAgICAgICAgIHNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQuc2Vjb25kIHx8IDAsXG4gICAgICAgICAgICBtaWxsaXNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmQgfHwgMDtcblxuICAgICAgICAvLyByZXByZXNlbnRhdGlvbiBmb3IgZGF0ZUFkZFJlbW92ZVxuICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgPSArbWlsbGlzZWNvbmRzICtcbiAgICAgICAgICAgIHNlY29uZHMgKiAxZTMgKyAvLyAxMDAwXG4gICAgICAgICAgICBtaW51dGVzICogNmU0ICsgLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICBob3VycyAqIDM2ZTU7IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxuICAgICAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgICAgICB3ZWVrcyAqIDc7XG4gICAgICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgICAgIC8vIGl0IHNlcGFyYXRlbHkuXG4gICAgICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgdGhpcy5fYnViYmxlKCk7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBmdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICAgICAgICBmb3IgKHZhciBpIGluIGIpIHtcbiAgICAgICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShcInRvU3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KFwidmFsdWVPZlwiKSkge1xuICAgICAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvbmVNb21lbnQobSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge30sIGk7XG4gICAgICAgIGZvciAoaSBpbiBtKSB7XG4gICAgICAgICAgICBpZiAobS5oYXNPd25Qcm9wZXJ0eShpKSAmJiBtb21lbnRQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gbVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWJzUm91bmQobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbGVmdCB6ZXJvIGZpbGwgYSBudW1iZXJcbiAgICAvLyBzZWUgaHR0cDovL2pzcGVyZi5jb20vbGVmdC16ZXJvLWZpbGxpbmcgZm9yIHBlcmZvcm1hbmNlIGNvbXBhcmlzb25cbiAgICBmdW5jdGlvbiBsZWZ0WmVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xuICAgICAgICB2YXIgb3V0cHV0ID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xuXG4gICAgICAgIHdoaWxlIChvdXRwdXQubGVuZ3RoIDwgdGFyZ2V0TGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSAnMCcgKyBvdXRwdXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChzaWduID8gKGZvcmNlU2lnbiA/ICcrJyA6ICcnKSA6ICctJykgKyBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBfLmFkZFRpbWUgYW5kIF8uc3VidHJhY3RUaW1lXG4gICAgZnVuY3Rpb24gYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudChtb20sIGR1cmF0aW9uLCBpc0FkZGluZywgaWdub3JlVXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICAgICAgZGF5cyA9IGR1cmF0aW9uLl9kYXlzLFxuICAgICAgICAgICAgbW9udGhzID0gZHVyYXRpb24uX21vbnRocyxcbiAgICAgICAgICAgIG1pbnV0ZXMsXG4gICAgICAgICAgICBob3VycztcblxuICAgICAgICBpZiAobWlsbGlzZWNvbmRzKSB7XG4gICAgICAgICAgICBtb20uX2Quc2V0VGltZSgrbW9tLl9kICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0b3JlIHRoZSBtaW51dGVzIGFuZCBob3VycyBzbyB3ZSBjYW4gcmVzdG9yZSB0aGVtXG4gICAgICAgIGlmIChkYXlzIHx8IG1vbnRocykge1xuICAgICAgICAgICAgbWludXRlcyA9IG1vbS5taW51dGUoKTtcbiAgICAgICAgICAgIGhvdXJzID0gbW9tLmhvdXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF5cykge1xuICAgICAgICAgICAgbW9tLmRhdGUobW9tLmRhdGUoKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vbnRocykge1xuICAgICAgICAgICAgbW9tLm1vbnRoKG1vbS5tb250aCgpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaWxsaXNlY29uZHMgJiYgIWlnbm9yZVVwZGF0ZU9mZnNldCkge1xuICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldChtb20pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlc3RvcmUgdGhlIG1pbnV0ZXMgYW5kIGhvdXJzIGFmdGVyIHBvc3NpYmx5IGNoYW5naW5nIGRzdFxuICAgICAgICBpZiAoZGF5cyB8fCBtb250aHMpIHtcbiAgICAgICAgICAgIG1vbS5taW51dGUobWludXRlcyk7XG4gICAgICAgICAgICBtb20uaG91cihob3Vycyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiBpcyBhbiBhcnJheVxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgICAgIHJldHVybiAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRGF0ZV0nIHx8XG4gICAgICAgICAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiBEYXRlO1xuICAgIH1cblxuICAgIC8vIGNvbXBhcmUgdHdvIGFycmF5cywgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXNcbiAgICBmdW5jdGlvbiBjb21wYXJlQXJyYXlzKGFycmF5MSwgYXJyYXkyLCBkb250Q29udmVydCkge1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oYXJyYXkxLmxlbmd0aCwgYXJyYXkyLmxlbmd0aCksXG4gICAgICAgICAgICBsZW5ndGhEaWZmID0gTWF0aC5hYnMoYXJyYXkxLmxlbmd0aCAtIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgZGlmZnMgPSAwLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGRvbnRDb252ZXJ0ICYmIGFycmF5MVtpXSAhPT0gYXJyYXkyW2ldKSB8fFxuICAgICAgICAgICAgICAgICghZG9udENvbnZlcnQgJiYgdG9JbnQoYXJyYXkxW2ldKSAhPT0gdG9JbnQoYXJyYXkyW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBkaWZmcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaWZmcyArIGxlbmd0aERpZmY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICAgICAgaWYgKHVuaXRzKSB7XG4gICAgICAgICAgICB2YXIgbG93ZXJlZCA9IHVuaXRzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvKC4pcyQvLCAnJDEnKTtcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdEFsaWFzZXNbdW5pdHNdIHx8IGNhbWVsRnVuY3Rpb25zW2xvd2VyZWRdIHx8IGxvd2VyZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuaXRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICAgICAgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dE9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VMaXN0KGZpZWxkKSB7XG4gICAgICAgIHZhciBjb3VudCwgc2V0dGVyO1xuXG4gICAgICAgIGlmIChmaWVsZC5pbmRleE9mKCd3ZWVrJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gNztcbiAgICAgICAgICAgIHNldHRlciA9ICdkYXknO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJ21vbnRoJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gMTI7XG4gICAgICAgICAgICBzZXR0ZXIgPSAnbW9udGgnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbW9tZW50W2ZpZWxkXSA9IGZ1bmN0aW9uIChmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgaSwgZ2V0dGVyLFxuICAgICAgICAgICAgICAgIG1ldGhvZCA9IG1vbWVudC5mbi5fbGFuZ1tmaWVsZF0sXG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldHRlciA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQoKS51dGMoKS5zZXQoc2V0dGVyLCBpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwobW9tZW50LmZuLl9sYW5nLCBtLCBmb3JtYXQgfHwgJycpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0dGVyKGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXR0ZXIoaSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XG4gICAgICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXG4gICAgICAgICAgICB2YWx1ZSA9IDA7XG5cbiAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcbiAgICAgICAgICAgIGlmIChjb2VyY2VkTnVtYmVyID49IDApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IE1hdGguZmxvb3IoY29lcmNlZE51bWJlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5jZWlsKGNvZXJjZWROdW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCArIDEsIDApKS5nZXRVVENEYXRlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5c0luWWVhcih5ZWFyKSB7XG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHllYXIpID8gMzY2IDogMzY1O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTGVhcFllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDApIHx8IHllYXIgJSA0MDAgPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyhtKSB7XG4gICAgICAgIHZhciBvdmVyZmxvdztcbiAgICAgICAgaWYgKG0uX2EgJiYgbS5fcGYub3ZlcmZsb3cgPT09IC0yKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9XG4gICAgICAgICAgICAgICAgbS5fYVtNT05USF0gPCAwIHx8IG0uX2FbTU9OVEhdID4gMTEgPyBNT05USCA6XG4gICAgICAgICAgICAgICAgbS5fYVtEQVRFXSA8IDEgfHwgbS5fYVtEQVRFXSA+IGRheXNJbk1vbnRoKG0uX2FbWUVBUl0sIG0uX2FbTU9OVEhdKSA/IERBVEUgOlxuICAgICAgICAgICAgICAgIG0uX2FbSE9VUl0gPCAwIHx8IG0uX2FbSE9VUl0gPiAyMyA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlOVVRFXSA8IDAgfHwgbS5fYVtNSU5VVEVdID4gNTkgPyBNSU5VVEUgOlxuICAgICAgICAgICAgICAgIG0uX2FbU0VDT05EXSA8IDAgfHwgbS5fYVtTRUNPTkRdID4gNTkgPyBTRUNPTkQgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlMTElTRUNPTkRdIDwgMCB8fCBtLl9hW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcbiAgICAgICAgICAgICAgICAtMTtcblxuICAgICAgICAgICAgaWYgKG0uX3BmLl9vdmVyZmxvd0RheU9mWWVhciAmJiAob3ZlcmZsb3cgPCBZRUFSIHx8IG92ZXJmbG93ID4gREFURSkpIHtcbiAgICAgICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICAgICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgbS5faXNWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA8IDAgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuZW1wdHkgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLnVzZXJJbnZhbGlkYXRlZDtcblxuICAgICAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBtLl9pc1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS5faXNWYWxpZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVMYW5ndWFnZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xuICAgIH1cblxuICAgIC8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXG4gICAgZnVuY3Rpb24gbWFrZUFzKGlucHV0LCBtb2RlbCkge1xuICAgICAgICByZXR1cm4gbW9kZWwuX2lzVVRDID8gbW9tZW50KGlucHV0KS56b25lKG1vZGVsLl9vZmZzZXQgfHwgMCkgOlxuICAgICAgICAgICAgbW9tZW50KGlucHV0KS5sb2NhbCgpO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTGFuZ3VhZ2VzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQoTGFuZ3VhZ2UucHJvdG90eXBlLCB7XG5cbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHByb3AsIGk7XG4gICAgICAgICAgICBmb3IgKGkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1snXycgKyBpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9tb250aHMgOiBcIkphbnVhcnlfRmVicnVhcnlfTWFyY2hfQXByaWxfTWF5X0p1bmVfSnVseV9BdWd1c3RfU2VwdGVtYmVyX09jdG9iZXJfTm92ZW1iZXJfRGVjZW1iZXJcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIG1vbnRocyA6IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzW20ubW9udGgoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX21vbnRoc1Nob3J0IDogXCJKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlY1wiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgbW9udGhzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGhzUGFyc2UgOiBmdW5jdGlvbiAobW9udGhOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQudXRjKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykgKyAnfF4nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWtkYXlzIDogXCJTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheVwiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgd2Vla2RheXMgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzW20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5c1Nob3J0IDogXCJTdW5fTW9uX1R1ZV9XZWRfVGh1X0ZyaV9TYXRcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIHdlZWtkYXlzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWtkYXlzTWluIDogXCJTdV9Nb19UdV9XZV9UaF9Gcl9TYVwiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgd2Vla2RheXNNaW4gOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtkYXlzUGFyc2UgOiBmdW5jdGlvbiAod2Vla2RheU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBpLCBtb20sIHJlZ2V4O1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50KFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9sb25nRGF0ZUZvcm1hdCA6IHtcbiAgICAgICAgICAgIExUIDogXCJoOm1tIEFcIixcbiAgICAgICAgICAgIEwgOiBcIk1NL0REL1lZWVlcIixcbiAgICAgICAgICAgIExMIDogXCJNTU1NIEQgWVlZWVwiLFxuICAgICAgICAgICAgTExMIDogXCJNTU1NIEQgWVlZWSBMVFwiLFxuICAgICAgICAgICAgTExMTCA6IFwiZGRkZCwgTU1NTSBEIFlZWVkgTFRcIlxuICAgICAgICB9LFxuICAgICAgICBsb25nRGF0ZUZvcm1hdCA6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgICAgICAgICAgaWYgKCFvdXRwdXQgJiYgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQTSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAgICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXG4gICAgICAgICAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP20/XFwuPy9pLFxuICAgICAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgICAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYWxlbmRhciA6IHtcbiAgICAgICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXG4gICAgICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgICAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCBbYXRdIExUJyxcbiAgICAgICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxuICAgICAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgICAgICAgICBzYW1lRWxzZSA6ICdMJ1xuICAgICAgICB9LFxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uIChrZXksIG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJyA/IG91dHB1dC5hcHBseShtb20pIDogb3V0cHV0O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWxhdGl2ZVRpbWUgOiB7XG4gICAgICAgICAgICBmdXR1cmUgOiBcImluICVzXCIsXG4gICAgICAgICAgICBwYXN0IDogXCIlcyBhZ29cIixcbiAgICAgICAgICAgIHMgOiBcImEgZmV3IHNlY29uZHNcIixcbiAgICAgICAgICAgIG0gOiBcImEgbWludXRlXCIsXG4gICAgICAgICAgICBtbSA6IFwiJWQgbWludXRlc1wiLFxuICAgICAgICAgICAgaCA6IFwiYW4gaG91clwiLFxuICAgICAgICAgICAgaGggOiBcIiVkIGhvdXJzXCIsXG4gICAgICAgICAgICBkIDogXCJhIGRheVwiLFxuICAgICAgICAgICAgZGQgOiBcIiVkIGRheXNcIixcbiAgICAgICAgICAgIE0gOiBcImEgbW9udGhcIixcbiAgICAgICAgICAgIE1NIDogXCIlZCBtb250aHNcIixcbiAgICAgICAgICAgIHkgOiBcImEgeWVhclwiLFxuICAgICAgICAgICAgeXkgOiBcIiVkIHllYXJzXCJcbiAgICAgICAgfSxcbiAgICAgICAgcmVsYXRpdmVUaW1lIDogZnVuY3Rpb24gKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygb3V0cHV0ID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICAgICAgICAgICAgb3V0cHV0KG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkgOlxuICAgICAgICAgICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBwYXN0RnV0dXJlIDogZnVuY3Rpb24gKGRpZmYsIG91dHB1dCkge1xuICAgICAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZm9ybWF0ID09PSAnZnVuY3Rpb24nID8gZm9ybWF0KG91dHB1dCkgOiBmb3JtYXQucmVwbGFjZSgvJXMvaSwgb3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZShcIiVkXCIsIG51bWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIF9vcmRpbmFsIDogXCIlZFwiLFxuXG4gICAgICAgIHByZXBhcnNlIDogZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgICAgfSxcblxuICAgICAgICBwb3N0Zm9ybWF0IDogZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIobW9tLCB0aGlzLl93ZWVrLmRvdywgdGhpcy5fd2Vlay5kb3kpLndlZWs7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWsgOiB7XG4gICAgICAgICAgICBkb3cgOiAwLCAvLyBTdW5kYXkgaXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cbiAgICAgICAgICAgIGRveSA6IDYgIC8vIFRoZSB3ZWVrIHRoYXQgY29udGFpbnMgSmFuIDFzdCBpcyB0aGUgZmlyc3Qgd2VlayBvZiB0aGUgeWVhci5cbiAgICAgICAgfSxcblxuICAgICAgICBfaW52YWxpZERhdGU6ICdJbnZhbGlkIGRhdGUnLFxuICAgICAgICBpbnZhbGlkRGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBMb2FkcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gaW50byB0aGUgYGxhbmd1YWdlc2AgY2FjaGUuICBUaGUgZnVuY3Rpb25cbiAgICAvLyB0YWtlcyBhIGtleSBhbmQgb3B0aW9uYWxseSB2YWx1ZXMuICBJZiBub3QgaW4gdGhlIGJyb3dzZXIgYW5kIG5vIHZhbHVlc1xuICAgIC8vIGFyZSBwcm92aWRlZCwgaXQgd2lsbCBsb2FkIHRoZSBsYW5ndWFnZSBmaWxlIG1vZHVsZS4gIEFzIGEgY29udmVuaWVuY2UsXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBhbHNvIHJldHVybnMgdGhlIGxhbmd1YWdlIHZhbHVlcy5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZyhrZXksIHZhbHVlcykge1xuICAgICAgICB2YWx1ZXMuYWJiciA9IGtleTtcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSBuZXcgTGFuZ3VhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBsYW5ndWFnZXNba2V5XS5zZXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhIGxhbmd1YWdlIGZyb20gdGhlIGBsYW5ndWFnZXNgIGNhY2hlLiBNb3N0bHkgdXNlZnVsIGluIHRlc3RzLlxuICAgIGZ1bmN0aW9uIHVubG9hZExhbmcoa2V5KSB7XG4gICAgICAgIGRlbGV0ZSBsYW5ndWFnZXNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmVzIHdoaWNoIGxhbmd1YWdlIGRlZmluaXRpb24gdG8gdXNlIGFuZCByZXR1cm5zIGl0LlxuICAgIC8vXG4gICAgLy8gV2l0aCBubyBwYXJhbWV0ZXJzLCBpdCB3aWxsIHJldHVybiB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWYgeW91XG4gICAgLy8gcGFzcyBpbiBhIGxhbmd1YWdlIGtleSwgc3VjaCBhcyAnZW4nLCBpdCB3aWxsIHJldHVybiB0aGVcbiAgICAvLyBkZWZpbml0aW9uIGZvciAnZW4nLCBzbyBsb25nIGFzICdlbicgaGFzIGFscmVhZHkgYmVlbiBsb2FkZWQgdXNpbmdcbiAgICAvLyBtb21lbnQubGFuZy5cbiAgICBmdW5jdGlvbiBnZXRMYW5nRGVmaW5pdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGkgPSAwLCBqLCBsYW5nLCBuZXh0LCBzcGxpdCxcbiAgICAgICAgICAgIGdldCA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsYW5ndWFnZXNba10gJiYgaGFzTW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlKCcuL2xhbmcvJyArIGspO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICAgICAgbGFuZyA9IGdldChrZXkpO1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtleSA9IFtrZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9waWNrIHRoZSBsYW5ndWFnZSBmcm9tIHRoZSBhcnJheVxuICAgICAgICAvL3RyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4gICAgICAgIC8vc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxuICAgICAgICB3aGlsZSAoaSA8IGtleS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNwbGl0ID0gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5W2ldKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgICAgIG5leHQgPSBub3JtYWxpemVMYW5ndWFnZShrZXlbaSArIDFdKTtcbiAgICAgICAgICAgIG5leHQgPSBuZXh0ID8gbmV4dC5zcGxpdCgnLScpIDogbnVsbDtcbiAgICAgICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgICAgIGxhbmcgPSBnZXQoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcbiAgICAgICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZvcm1hdHRpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hdGNoKC9cXFtbXFxzXFxTXS8pKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXlxcW3xcXF0kL2csIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dHB1dCArPSBhcnJheVtpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gYXJyYXlbaV0uY2FsbChtb20sIGZvcm1hdCkgOiBhcnJheVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZm9ybWF0IGRhdGUgdXNpbmcgbmF0aXZlIGRhdGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gZm9ybWF0TW9tZW50KG0sIGZvcm1hdCkge1xuXG4gICAgICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtLmxhbmcoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sYW5nKCkpO1xuXG4gICAgICAgIGlmICghZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0pIHtcbiAgICAgICAgICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0obSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbGFuZykge1xuICAgICAgICB2YXIgaSA9IDU7XG5cbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZy5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFBhcnNpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGdldCB0aGUgcmVnZXggdG8gZmluZCB0aGUgbmV4dCB0b2tlblxuICAgIGZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBzdHJpY3QgPSBjb25maWcuX3N0cmljdDtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICBjYXNlICdEREREJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGhyZWVEaWdpdHM7XG4gICAgICAgIGNhc2UgJ1lZWVknOlxuICAgICAgICBjYXNlICdHR0dHJzpcbiAgICAgICAgY2FzZSAnZ2dnZyc6XG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlbkZvdXJEaWdpdHMgOiBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzO1xuICAgICAgICBjYXNlICdZJzpcbiAgICAgICAgY2FzZSAnRyc6XG4gICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5TaWduZWROdW1iZXI7XG4gICAgICAgIGNhc2UgJ1lZWVlZWSc6XG4gICAgICAgIGNhc2UgJ1lZWVlZJzpcbiAgICAgICAgY2FzZSAnR0dHR0cnOlxuICAgICAgICBjYXNlICdnZ2dnZyc6XG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlblNpeERpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb1NpeERpZ2l0cztcbiAgICAgICAgY2FzZSAnUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7IHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7IH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnU1MnOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblR3b0RpZ2l0czsgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdTU1MnOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblRocmVlRGlnaXRzOyB9XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ0RERCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHM7XG4gICAgICAgIGNhc2UgJ01NTSc6XG4gICAgICAgIGNhc2UgJ01NTU0nOlxuICAgICAgICBjYXNlICdkZCc6XG4gICAgICAgIGNhc2UgJ2RkZCc6XG4gICAgICAgIGNhc2UgJ2RkZGQnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5Xb3JkO1xuICAgICAgICBjYXNlICdhJzpcbiAgICAgICAgY2FzZSAnQSc6XG4gICAgICAgICAgICByZXR1cm4gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5fbWVyaWRpZW1QYXJzZTtcbiAgICAgICAgY2FzZSAnWCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWVzdGFtcE1zO1xuICAgICAgICBjYXNlICdaJzpcbiAgICAgICAgY2FzZSAnWlonOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lem9uZTtcbiAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblQ7XG4gICAgICAgIGNhc2UgJ1NTU1MnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5EaWdpdHM7XG4gICAgICAgIGNhc2UgJ01NJzpcbiAgICAgICAgY2FzZSAnREQnOlxuICAgICAgICBjYXNlICdZWSc6XG4gICAgICAgIGNhc2UgJ0dHJzpcbiAgICAgICAgY2FzZSAnZ2cnOlxuICAgICAgICBjYXNlICdISCc6XG4gICAgICAgIGNhc2UgJ2hoJzpcbiAgICAgICAgY2FzZSAnbW0nOlxuICAgICAgICBjYXNlICdzcyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnV1cnOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Ud29EaWdpdHMgOiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGNhc2UgJ00nOlxuICAgICAgICBjYXNlICdEJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ0gnOlxuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGRlZmF1bHQgOlxuICAgICAgICAgICAgYSA9IG5ldyBSZWdFeHAocmVnZXhwRXNjYXBlKHVuZXNjYXBlRm9ybWF0KHRva2VuLnJlcGxhY2UoJ1xcXFwnLCAnJykpLCBcImlcIikpO1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKHN0cmluZykge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgdmFyIHBvc3NpYmxlVHpNYXRjaGVzID0gKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpIHx8IFtdKSxcbiAgICAgICAgICAgIHR6Q2h1bmsgPSBwb3NzaWJsZVR6TWF0Y2hlc1twb3NzaWJsZVR6TWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXSxcbiAgICAgICAgICAgIHBhcnRzID0gKHR6Q2h1bmsgKyAnJykubWF0Y2gocGFyc2VUaW1lem9uZUNodW5rZXIpIHx8IFsnLScsIDAsIDBdLFxuICAgICAgICAgICAgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdID09PSAnKycgPyAtbWludXRlcyA6IG1pbnV0ZXM7XG4gICAgfVxuXG4gICAgLy8gZnVuY3Rpb24gdG8gY29udmVydCBzdHJpbmcgaW5wdXQgdG8gZGF0ZVxuICAgIGZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBkYXRlUGFydEFycmF5ID0gY29uZmlnLl9hO1xuXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgLy8gTU9OVEhcbiAgICAgICAgY2FzZSAnTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1cbiAgICAgICAgY2FzZSAnTU0nIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSB0b0ludChpbnB1dCkgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ01NTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1NTVxuICAgICAgICBjYXNlICdNTU1NJyA6XG4gICAgICAgICAgICBhID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5tb250aHNQYXJzZShpbnB1dCk7XG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cbiAgICAgICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIE1PTlRIXG4gICAgICAgIGNhc2UgJ0QnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEREXG4gICAgICAgIGNhc2UgJ0REJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbREFURV0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIFlFQVJcbiAgICAgICAgY2FzZSAnREREJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBEREREXG4gICAgICAgIGNhc2UgJ0REREQnIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBZRUFSXG4gICAgICAgIGNhc2UgJ1lZJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1lZWVknIDpcbiAgICAgICAgY2FzZSAnWVlZWVknIDpcbiAgICAgICAgY2FzZSAnWVlZWVlZJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIEFNIC8gUE1cbiAgICAgICAgY2FzZSAnYScgOiAvLyBmYWxsIHRocm91Z2ggdG8gQVxuICAgICAgICBjYXNlICdBJyA6XG4gICAgICAgICAgICBjb25maWcuX2lzUG0gPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLmlzUE0oaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIDI0IEhPVVJcbiAgICAgICAgY2FzZSAnSCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcbiAgICAgICAgY2FzZSAnSEgnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2hoJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTlVURVxuICAgICAgICBjYXNlICdtJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBtbVxuICAgICAgICBjYXNlICdtbScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFNFQ09ORFxuICAgICAgICBjYXNlICdzJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBzc1xuICAgICAgICBjYXNlICdzcycgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTExJU0VDT05EXG4gICAgICAgIGNhc2UgJ1MnIDpcbiAgICAgICAgY2FzZSAnU1MnIDpcbiAgICAgICAgY2FzZSAnU1NTJyA6XG4gICAgICAgIGNhc2UgJ1NTU1MnIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVTklYIFRJTUVTVEFNUCBXSVRIIE1TXG4gICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBUSU1FWk9ORVxuICAgICAgICBjYXNlICdaJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBaWlxuICAgICAgICBjYXNlICdaWicgOlxuICAgICAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl90em0gPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgY2FzZSAnd3cnOlxuICAgICAgICBjYXNlICdXJzpcbiAgICAgICAgY2FzZSAnV1cnOlxuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgY2FzZSAnZGQnOlxuICAgICAgICBjYXNlICdkZGQnOlxuICAgICAgICBjYXNlICdkZGRkJzpcbiAgICAgICAgY2FzZSAnZSc6XG4gICAgICAgIGNhc2UgJ0UnOlxuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbi5zdWJzdHIoMCwgMSk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ2dnJzpcbiAgICAgICAgY2FzZSAnZ2dnZyc6XG4gICAgICAgIGNhc2UgJ0dHJzpcbiAgICAgICAgY2FzZSAnR0dHRyc6XG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDIpO1xuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4gICAgLy8gdGhlIGFycmF5IHNob3VsZCBtaXJyb3IgdGhlIHBhcmFtZXRlcnMgYmVsb3dcbiAgICAvLyBub3RlOiBhbGwgdmFsdWVzIHBhc3QgdGhlIHllYXIgYXJlIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIGxvd2VzdCBwb3NzaWJsZSB2YWx1ZS5cbiAgICAvLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbiAgICBmdW5jdGlvbiBkYXRlRnJvbUNvbmZpZyhjb25maWcpIHtcbiAgICAgICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLFxuICAgICAgICAgICAgeWVhclRvVXNlLCBmaXhZZWFyLCB3LCB0ZW1wLCBsYW5nLCB3ZWVrZGF5LCB3ZWVrO1xuXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xuXG4gICAgICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICAgICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcbiAgICAgICAgICAgIGZpeFllYXIgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludF92YWwgPSBwYXJzZUludCh2YWwsIDEwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID9cbiAgICAgICAgICAgICAgICAgICh2YWwubGVuZ3RoIDwgMyA/IChpbnRfdmFsID4gNjggPyAxOTAwICsgaW50X3ZhbCA6IDIwMDAgKyBpbnRfdmFsKSA6IGludF92YWwpIDpcbiAgICAgICAgICAgICAgICAgIChjb25maWcuX2FbWUVBUl0gPT0gbnVsbCA/IG1vbWVudCgpLndlZWtZZWFyKCkgOiBjb25maWcuX2FbWUVBUl0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdyA9IGNvbmZpZy5fdztcbiAgICAgICAgICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKGZpeFllYXIody5HRyksIHcuVyB8fCAxLCB3LkUsIDQsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCk7XG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZCAhPSBudWxsID8gIHBhcnNlV2Vla2RheSh3LmQsIGxhbmcpIDpcbiAgICAgICAgICAgICAgICAgICh3LmUgIT0gbnVsbCA/ICBwYXJzZUludCh3LmUsIDEwKSArIGxhbmcuX3dlZWsuZG93IDogMCk7XG5cbiAgICAgICAgICAgICAgICB3ZWVrID0gcGFyc2VJbnQody53LCAxMCkgfHwgMTtcblxuICAgICAgICAgICAgICAgIC8vaWYgd2UncmUgcGFyc2luZyAnZCcsIHRoZW4gdGhlIGxvdyBkYXkgbnVtYmVycyBtYXkgYmUgbmV4dCB3ZWVrXG4gICAgICAgICAgICAgICAgaWYgKHcuZCAhPSBudWxsICYmIHdlZWtkYXkgPCBsYW5nLl93ZWVrLmRvdykge1xuICAgICAgICAgICAgICAgICAgICB3ZWVrKys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyhmaXhZZWFyKHcuZ2cpLCB3ZWVrLCB3ZWVrZGF5LCBsYW5nLl93ZWVrLmRveSwgbGFuZy5fd2Vlay5kb3cpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XG4gICAgICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhcikge1xuICAgICAgICAgICAgeWVhclRvVXNlID0gY29uZmlnLl9hW1lFQVJdID09IG51bGwgPyBjdXJyZW50RGF0ZVtZRUFSXSA6IGNvbmZpZy5fYVtZRUFSXTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRlID0gbWFrZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XG4gICAgICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgICAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxuICAgICAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgICAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxuICAgICAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgdGhlIG9mZnNldHMgdG8gdGhlIHRpbWUgdG8gYmUgcGFyc2VkIHNvIHRoYXQgd2UgY2FuIGhhdmUgYSBjbGVhbiBhcnJheSBmb3IgY2hlY2tpbmcgaXNWYWxpZFxuICAgICAgICBpbnB1dFtIT1VSXSArPSB0b0ludCgoY29uZmlnLl90em0gfHwgMCkgLyA2MCk7XG4gICAgICAgIGlucHV0W01JTlVURV0gKz0gdG9JbnQoKGNvbmZpZy5fdHptIHx8IDApICUgNjApO1xuXG4gICAgICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IG1ha2VVVENEYXRlIDogbWFrZURhdGUpLmFwcGx5KG51bGwsIGlucHV0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXRlRnJvbU9iamVjdChjb25maWcpIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dDtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgICAgICBjb25maWcuX2EgPSBbXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQueWVhcixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5tb250aCxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5kYXksXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuaG91cixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taW51dGUsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuc2Vjb25kLFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kXG4gICAgICAgIF07XG5cbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENEYXRlKClcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW25vdy5nZXRGdWxsWWVhcigpLCBub3cuZ2V0TW9udGgoKSwgbm93LmdldERhdGUoKV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuXG4gICAgICAgIGNvbmZpZy5fYSA9IFtdO1xuICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gdHJ1ZTtcblxuICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxuICAgICAgICB2YXIgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCksXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyArIGNvbmZpZy5faSxcbiAgICAgICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICAgICAgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggPSAwO1xuXG4gICAgICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGxhbmcpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICAgICAgY29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyID0gc3RyaW5nTGVuZ3RoIC0gdG90YWxQYXJzZWRJbnB1dExlbmd0aDtcbiAgICAgICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhbmRsZSBhbSBwbVxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtICYmIGNvbmZpZy5fYVtIT1VSXSA8IDEyKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gKz0gMTI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgaXMgMTIgYW0sIGNoYW5nZSBob3VycyB0byAwXG4gICAgICAgIGlmIChjb25maWcuX2lzUG0gPT09IGZhbHNlICYmIGNvbmZpZy5fYVtIT1VSXSA9PT0gMTIpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gcmVnZXhwRXNjYXBlKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIHRlbXBDb25maWcsXG4gICAgICAgICAgICBiZXN0TW9tZW50LFxuXG4gICAgICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBleHRlbmQoe30sIGNvbmZpZyk7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQodGVtcENvbmZpZyk7XG5cbiAgICAgICAgICAgIGlmICghaXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZi5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcbiAgICAgICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcbiAgICAgICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmcoY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBsLFxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2ggPSBpc29SZWdleC5leGVjKHN0cmluZyk7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLmlzbyA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMoc3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaFs1XSBzaG91bGQgYmUgXCJUXCIgb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiA9IGlzb0RhdGVzW2ldWzBdICsgKG1hdGNoWzZdIHx8IFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKHN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyaW5nLm1hdGNoKHBhcnNlVG9rZW5UaW1lem9uZSkpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2YgKz0gXCJaXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHN0cmluZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2hlZCA9IGFzcE5ldEpzb25SZWdleC5leGVjKGlucHV0KTtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IGlucHV0LnNsaWNlKDApO1xuICAgICAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkYXRlRnJvbU9iamVjdChjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZURhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpIHtcbiAgICAgICAgLy9jYW4ndCBqdXN0IGFwcGx5KCkgdG8gY3JlYXRlIGEgZGF0ZTpcbiAgICAgICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE4MTM0OC9pbnN0YW50aWF0aW5nLWEtamF2YXNjcmlwdC1vYmplY3QtYnktY2FsbGluZy1wcm90b3R5cGUtY29uc3RydWN0b3ItYXBwbHlcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcyk7XG5cbiAgICAgICAgLy90aGUgZGF0ZSBjb25zdHJ1Y3RvciBkb2Vzbid0IGFjY2VwdCB5ZWFycyA8IDE5NzBcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VVVENEYXRlKHkpIHtcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbGFuZ3VhZ2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBsYW5ndWFnZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgUmVsYXRpdmUgVGltZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxhbmcpIHtcbiAgICAgICAgcmV0dXJuIGxhbmcucmVsYXRpdmVUaW1lKG51bWJlciB8fCAxLCAhIXdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlVGltZShtaWxsaXNlY29uZHMsIHdpdGhvdXRTdWZmaXgsIGxhbmcpIHtcbiAgICAgICAgdmFyIHNlY29uZHMgPSByb3VuZChNYXRoLmFicyhtaWxsaXNlY29uZHMpIC8gMTAwMCksXG4gICAgICAgICAgICBtaW51dGVzID0gcm91bmQoc2Vjb25kcyAvIDYwKSxcbiAgICAgICAgICAgIGhvdXJzID0gcm91bmQobWludXRlcyAvIDYwKSxcbiAgICAgICAgICAgIGRheXMgPSByb3VuZChob3VycyAvIDI0KSxcbiAgICAgICAgICAgIHllYXJzID0gcm91bmQoZGF5cyAvIDM2NSksXG4gICAgICAgICAgICBhcmdzID0gc2Vjb25kcyA8IDQ1ICYmIFsncycsIHNlY29uZHNdIHx8XG4gICAgICAgICAgICAgICAgbWludXRlcyA9PT0gMSAmJiBbJ20nXSB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPCA0NSAmJiBbJ21tJywgbWludXRlc10gfHxcbiAgICAgICAgICAgICAgICBob3VycyA9PT0gMSAmJiBbJ2gnXSB8fFxuICAgICAgICAgICAgICAgIGhvdXJzIDwgMjIgJiYgWydoaCcsIGhvdXJzXSB8fFxuICAgICAgICAgICAgICAgIGRheXMgPT09IDEgJiYgWydkJ10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDw9IDI1ICYmIFsnZGQnLCBkYXlzXSB8fFxuICAgICAgICAgICAgICAgIGRheXMgPD0gNDUgJiYgWydNJ10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDwgMzQ1ICYmIFsnTU0nLCByb3VuZChkYXlzIC8gMzApXSB8fFxuICAgICAgICAgICAgICAgIHllYXJzID09PSAxICYmIFsneSddIHx8IFsneXknLCB5ZWFyc107XG4gICAgICAgIGFyZ3NbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgICAgICBhcmdzWzNdID0gbWlsbGlzZWNvbmRzID4gMDtcbiAgICAgICAgYXJnc1s0XSA9IGxhbmc7XG4gICAgICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseSh7fSwgYXJncyk7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFdlZWsgb2YgWWVhclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gZmlyc3REYXlPZldlZWsgICAgICAgMCA9IHN1biwgNiA9IHNhdFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIHRoZSBkYXkgb2YgdGhlIHdlZWsgdGhhdCBzdGFydHMgdGhlIHdlZWtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAodXN1YWxseSBzdW5kYXkgb3IgbW9uZGF5KVxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIDAgPSBzdW4sIDYgPSBzYXRcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZmlyc3Qgd2VlayBpcyB0aGUgd2VlayB0aGF0IGNvbnRhaW5zIHRoZSBmaXJzdFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIG9mIHRoaXMgZGF5IG9mIHRoZSB3ZWVrXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKGVnLiBJU08gd2Vla3MgdXNlIHRodXJzZGF5ICg0KSlcbiAgICBmdW5jdGlvbiB3ZWVrT2ZZZWFyKG1vbSwgZmlyc3REYXlPZldlZWssIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyKSB7XG4gICAgICAgIHZhciBlbmQgPSBmaXJzdERheU9mV2Vla09mWWVhciAtIGZpcnN0RGF5T2ZXZWVrLFxuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBtb20uZGF5KCksXG4gICAgICAgICAgICBhZGp1c3RlZE1vbWVudDtcblxuXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPiBlbmQpIHtcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayAtPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRheXNUb0RheU9mV2VlayA8IGVuZCAtIDcpIHtcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayArPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgYWRqdXN0ZWRNb21lbnQgPSBtb21lbnQobW9tKS5hZGQoJ2QnLCBkYXlzVG9EYXlPZldlZWspO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2VlazogTWF0aC5jZWlsKGFkanVzdGVkTW9tZW50LmRheU9mWWVhcigpIC8gNyksXG4gICAgICAgICAgICB5ZWFyOiBhZGp1c3RlZE1vbWVudC55ZWFyKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvL2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZSNDYWxjdWxhdGluZ19hX2RhdGVfZ2l2ZW5fdGhlX3llYXIuMkNfd2Vla19udW1iZXJfYW5kX3dlZWtkYXlcbiAgICBmdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla3MoeWVhciwgd2Vlaywgd2Vla2RheSwgZmlyc3REYXlPZldlZWtPZlllYXIsIGZpcnN0RGF5T2ZXZWVrKSB7XG4gICAgICAgIHZhciBkID0gbWFrZVVUQ0RhdGUoeWVhciwgMCwgMSkuZ2V0VVRDRGF5KCksIGRheXNUb0FkZCwgZGF5T2ZZZWFyO1xuXG4gICAgICAgIHdlZWtkYXkgPSB3ZWVrZGF5ICE9IG51bGwgPyB3ZWVrZGF5IDogZmlyc3REYXlPZldlZWs7XG4gICAgICAgIGRheXNUb0FkZCA9IGZpcnN0RGF5T2ZXZWVrIC0gZCArIChkID4gZmlyc3REYXlPZldlZWtPZlllYXIgPyA3IDogMCkgLSAoZCA8IGZpcnN0RGF5T2ZXZWVrID8gNyA6IDApO1xuICAgICAgICBkYXlPZlllYXIgPSA3ICogKHdlZWsgLSAxKSArICh3ZWVrZGF5IC0gZmlyc3REYXlPZldlZWspICsgZGF5c1RvQWRkICsgMTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeWVhcjogZGF5T2ZZZWFyID4gMCA/IHllYXIgOiB5ZWFyIC0gMSxcbiAgICAgICAgICAgIGRheU9mWWVhcjogZGF5T2ZZZWFyID4gMCA/ICBkYXlPZlllYXIgOiBkYXlzSW5ZZWFyKHllYXIgLSAxKSArIGRheU9mWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIG1ha2VNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGNvbmZpZy5fZjtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuaW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBnZXRMYW5nRGVmaW5pdGlvbigpLnByZXBhcnNlKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb21lbnQuaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcgPSBjbG9uZU1vbWVudChpbnB1dCk7XG5cbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCtpbnB1dC5fZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0KSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheShmb3JtYXQpKSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBNb21lbnQoY29uZmlnKTtcbiAgICB9XG5cbiAgICBtb21lbnQgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl9pID0gaW5wdXQ7XG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XG4gICAgICAgIGMuX2wgPSBsYW5nO1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpO1xuICAgIH07XG5cbiAgICAvLyBjcmVhdGluZyB3aXRoIHV0Y1xuICAgIG1vbWVudC51dGMgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICBjLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGMuX2wgPSBsYW5nO1xuICAgICAgICBjLl9pID0gaW5wdXQ7XG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XG4gICAgICAgIGMuX3N0cmljdCA9IHN0cmljdDtcbiAgICAgICAgYy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XG5cbiAgICAgICAgcmV0dXJuIG1ha2VNb21lbnQoYykudXRjKCk7XG4gICAgfTtcblxuICAgIC8vIGNyZWF0aW5nIHdpdGggdW5peCB0aW1lc3RhbXAgKGluIHNlY29uZHMpXG4gICAgbW9tZW50LnVuaXggPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCAqIDEwMDApO1xuICAgIH07XG5cbiAgICAvLyBkdXJhdGlvblxuICAgIG1vbWVudC5kdXJhdGlvbiA9IGZ1bmN0aW9uIChpbnB1dCwga2V5KSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxuICAgICAgICAgICAgLy8gbWF0Y2hpbmcgYWdhaW5zdCByZWdleHAgaXMgZXhwZW5zaXZlLCBkbyBpdCBvbiBkZW1hbmRcbiAgICAgICAgICAgIG1hdGNoID0gbnVsbCxcbiAgICAgICAgICAgIHNpZ24sXG4gICAgICAgICAgICByZXQsXG4gICAgICAgICAgICBwYXJzZUlzbztcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtczogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNOiBpbnB1dC5fbW9udGhzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkOiB0b0ludChtYXRjaFtEQVRFXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIGg6IHRvSW50KG1hdGNoW0hPVVJdKSAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbTogdG9JbnQobWF0Y2hbTUlOVVRFXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIHM6IHRvSW50KG1hdGNoW1NFQ09ORF0pICogc2lnbixcbiAgICAgICAgICAgICAgICBtczogdG9JbnQobWF0Y2hbTUlMTElTRUNPTkRdKSAqIHNpZ25cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBpc29EdXJhdGlvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xuICAgICAgICAgICAgcGFyc2VJc28gPSBmdW5jdGlvbiAoaW5wKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cbiAgICAgICAgICAgICAgICAvLyBjb252ZXJ0cyBmbG9hdHMgdG8gaW50cy5cbiAgICAgICAgICAgICAgICAvLyBpbnAgbWF5IGJlIHVuZGVmaW5lZCwgc28gY2FyZWZ1bCBjYWxsaW5nIHJlcGxhY2Ugb24gaXQuXG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgICAgICAgICAgICAgLy8gYXBwbHkgc2lnbiB3aGlsZSB3ZSdyZSBhdCBpdFxuICAgICAgICAgICAgICAgIHJldHVybiAoaXNOYU4ocmVzKSA/IDAgOiByZXMpICogc2lnbjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB5OiBwYXJzZUlzbyhtYXRjaFsyXSksXG4gICAgICAgICAgICAgICAgTTogcGFyc2VJc28obWF0Y2hbM10pLFxuICAgICAgICAgICAgICAgIGQ6IHBhcnNlSXNvKG1hdGNoWzRdKSxcbiAgICAgICAgICAgICAgICBoOiBwYXJzZUlzbyhtYXRjaFs1XSksXG4gICAgICAgICAgICAgICAgbTogcGFyc2VJc28obWF0Y2hbNl0pLFxuICAgICAgICAgICAgICAgIHM6IHBhcnNlSXNvKG1hdGNoWzddKSxcbiAgICAgICAgICAgICAgICB3OiBwYXJzZUlzbyhtYXRjaFs4XSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xuXG4gICAgICAgIGlmIChtb21lbnQuaXNEdXJhdGlvbihpbnB1dCkgJiYgaW5wdXQuaGFzT3duUHJvcGVydHkoJ19sYW5nJykpIHtcbiAgICAgICAgICAgIHJldC5fbGFuZyA9IGlucHV0Ll9sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBtb21lbnQudmVyc2lvbiA9IFZFUlNJT047XG5cbiAgICAvLyBkZWZhdWx0IGZvcm1hdFxuICAgIG1vbWVudC5kZWZhdWx0Rm9ybWF0ID0gaXNvRm9ybWF0O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuICAgIC8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxuICAgIG1vbWVudC51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbW9tZW50LmxhbmcgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIHI7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nLl9hYmJyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIGxvYWRMYW5nKG5vcm1hbGl6ZUxhbmd1YWdlKGtleSksIHZhbHVlcyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICB1bmxvYWRMYW5nKGtleSk7XG4gICAgICAgICAgICBrZXkgPSAnZW4nO1xuICAgICAgICB9IGVsc2UgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByID0gbW9tZW50LmR1cmF0aW9uLmZuLl9sYW5nID0gbW9tZW50LmZuLl9sYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcbiAgICAgICAgcmV0dXJuIHIuX2FiYnI7XG4gICAgfTtcblxuICAgIC8vIHJldHVybnMgbGFuZ3VhZ2UgZGF0YVxuICAgIG1vbWVudC5sYW5nRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSAmJiBrZXkuX2xhbmcgJiYga2V5Ll9sYW5nLl9hYmJyKSB7XG4gICAgICAgICAgICBrZXkgPSBrZXkuX2xhbmcuX2FiYnI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgfTtcblxuICAgIC8vIGNvbXBhcmUgbW9tZW50IG9iamVjdFxuICAgIG1vbWVudC5pc01vbWVudCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fFxuICAgICAgICAgICAgKG9iaiAhPSBudWxsICYmICBvYmouaGFzT3duUHJvcGVydHkoJ19pc0FNb21lbnRPYmplY3QnKSk7XG4gICAgfTtcblxuICAgIC8vIGZvciB0eXBlY2hlY2tpbmcgRHVyYXRpb24gb2JqZWN0c1xuICAgIG1vbWVudC5pc0R1cmF0aW9uID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRHVyYXRpb247XG4gICAgfTtcblxuICAgIGZvciAoaSA9IGxpc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIG1ha2VMaXN0KGxpc3RzW2ldKTtcbiAgICB9XG5cbiAgICBtb21lbnQubm9ybWFsaXplVW5pdHMgPSBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICB9O1xuXG4gICAgbW9tZW50LmludmFsaWQgPSBmdW5jdGlvbiAoZmxhZ3MpIHtcbiAgICAgICAgdmFyIG0gPSBtb21lbnQudXRjKE5hTik7XG4gICAgICAgIGlmIChmbGFncyAhPSBudWxsKSB7XG4gICAgICAgICAgICBleHRlbmQobS5fcGYsIGZsYWdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG0uX3BmLnVzZXJJbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgbW9tZW50LnBhcnNlWm9uZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0KS5wYXJzZVpvbmUoKTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBNb21lbnQgUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQobW9tZW50LmZuID0gTW9tZW50LnByb3RvdHlwZSwge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLl9kICsgKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5peCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCt0aGlzIC8gMTAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxhbmcoJ2VuJykuZm9ybWF0KFwiZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlpcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9EYXRlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZnNldCA/IG5ldyBEYXRlKCt0aGlzKSA6IHRoaXMuX2Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbSA9IG1vbWVudCh0aGlzKS51dGMoKTtcbiAgICAgICAgICAgIGlmICgwIDwgbS55ZWFyKCkgJiYgbS55ZWFyKCkgPD0gOTk5OSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgbS55ZWFyKCksXG4gICAgICAgICAgICAgICAgbS5tb250aCgpLFxuICAgICAgICAgICAgICAgIG0uZGF0ZSgpLFxuICAgICAgICAgICAgICAgIG0uaG91cnMoKSxcbiAgICAgICAgICAgICAgICBtLm1pbnV0ZXMoKSxcbiAgICAgICAgICAgICAgICBtLnNlY29uZHMoKSxcbiAgICAgICAgICAgICAgICBtLm1pbGxpc2Vjb25kcygpXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVmFsaWQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0RTVFNoaWZ0ZWQgOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpICYmIGNvbXBhcmVBcnJheXModGhpcy5fYSwgKHRoaXMuX2lzVVRDID8gbW9tZW50LnV0Yyh0aGlzLl9hKSA6IG1vbWVudCh0aGlzLl9hKSkudG9BcnJheSgpKSA+IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzaW5nRmxhZ3MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCB0aGlzLl9wZik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZEF0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGYub3ZlcmZsb3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXRjIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZSgwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsb2NhbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuem9uZSgwKTtcbiAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRNb21lbnQodGhpcywgaW5wdXRTdHJpbmcgfHwgbW9tZW50LmRlZmF1bHRGb3JtYXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1cjtcbiAgICAgICAgICAgIC8vIHN3aXRjaCBhcmdzIHRvIHN1cHBvcnQgYWRkKCdzJywgMSkgYW5kIGFkZCgxLCAncycpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbigrdmFsLCBpbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgZHVyLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcbiAgICAgICAgICAgIHZhciBkdXI7XG4gICAgICAgICAgICAvLyBzd2l0Y2ggYXJncyB0byBzdXBwb3J0IHN1YnRyYWN0KCdzJywgMSkgYW5kIHN1YnRyYWN0KDEsICdzJylcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKCt2YWwsIGlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIC0xKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmYgOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IG1ha2VBcyhpbnB1dCwgdGhpcyksXG4gICAgICAgICAgICAgICAgem9uZURpZmYgPSAodGhpcy56b25lKCkgLSB0aGF0LnpvbmUoKSkgKiA2ZTQsXG4gICAgICAgICAgICAgICAgZGlmZiwgb3V0cHV0O1xuXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcpIHtcbiAgICAgICAgICAgICAgICAvLyBhdmVyYWdlIG51bWJlciBvZiBkYXlzIGluIHRoZSBtb250aHMgaW4gdGhlIGdpdmVuIGRhdGVzXG4gICAgICAgICAgICAgICAgZGlmZiA9ICh0aGlzLmRheXNJbk1vbnRoKCkgKyB0aGF0LmRheXNJbk1vbnRoKCkpICogNDMyZTU7IC8vIDI0ICogNjAgKiA2MCAqIDEwMDAgLyAyXG4gICAgICAgICAgICAgICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAoKHRoaXMueWVhcigpIC0gdGhhdC55ZWFyKCkpICogMTIpICsgKHRoaXMubW9udGgoKSAtIHRoYXQubW9udGgoKSk7XG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IGJ5IHRha2luZyBkaWZmZXJlbmNlIGluIGRheXMsIGF2ZXJhZ2UgbnVtYmVyIG9mIGRheXNcbiAgICAgICAgICAgICAgICAvLyBhbmQgZHN0IGluIHRoZSBnaXZlbiBtb250aHMuXG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9ICgodGhpcyAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCdtb250aCcpKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhhdCAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpKSkgLyBkaWZmO1xuICAgICAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdpdGggem9uZXMsIHRvIG5lZ2F0ZSBhbGwgZHN0XG4gICAgICAgICAgICAgICAgb3V0cHV0IC09ICgodGhpcy56b25lKCkgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKS56b25lKCkpIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGF0LnpvbmUoKSAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpLnpvbmUoKSkpICogNmU0IC8gZGlmZjtcbiAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZmYgPSAodGhpcyAtIHRoYXQpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHVuaXRzID09PSAnc2Vjb25kJyA/IGRpZmYgLyAxZTMgOiAvLyAxMDAwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnbWludXRlJyA/IGRpZmYgLyA2ZTQgOiAvLyAxMDAwICogNjBcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdob3VyJyA/IGRpZmYgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdkYXknID8gKGRpZmYgLSB6b25lRGlmZikgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICd3ZWVrJyA/IChkaWZmIC0gem9uZURpZmYpIC8gNjA0OGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDcsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICAgICAgZGlmZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc0Zsb2F0ID8gb3V0cHV0IDogYWJzUm91bmQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmcm9tIDogZnVuY3Rpb24gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24odGhpcy5kaWZmKHRpbWUpKS5sYW5nKHRoaXMubGFuZygpLl9hYmJyKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnJvbU5vdyA6IGZ1bmN0aW9uICh3aXRob3V0U3VmZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcm9tKG1vbWVudCgpLCB3aXRob3V0U3VmZml4KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgICAgICAgICAvLyBHZXR0aW5nIHN0YXJ0LW9mLXRvZGF5IGRlcGVuZHMgb24gd2hldGhlciB3ZSdyZSB6b25lJ2Qgb3Igbm90LlxuICAgICAgICAgICAgdmFyIHNvZCA9IG1ha2VBcyhtb21lbnQoKSwgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgICAgICAgICAgZGlmZiA9IHRoaXMuZGlmZihzb2QsICdkYXlzJywgdHJ1ZSksXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KHRoaXMubGFuZygpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzTGVhcFllYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih0aGlzLnllYXIoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNEU1QgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDApLnpvbmUoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDUpLnpvbmUoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubGFuZygpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoeyBkIDogaW5wdXQgLSBkYXkgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGggOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciB1dGMgPSB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJycsXG4gICAgICAgICAgICAgICAgZGF5T2ZNb250aDtcblxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHRoaXMubGFuZygpLm1vbnRoc1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGF5T2ZNb250aCA9IHRoaXMuZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kWydzZXQnICsgdXRjICsgJ01vbnRoJ10oaW5wdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZShNYXRoLm1pbihkYXlPZk1vbnRoLCB0aGlzLmRheXNJbk1vbnRoKCkpKTtcblxuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kWydnZXQnICsgdXRjICsgJ01vbnRoJ10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydE9mOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgICAgICAgICAgLy8gdG8gdXRpbGl6ZSBmYWxsaW5nIHRocm91Z2ggdGhlIGNhc2VzLlxuICAgICAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgY2FzZSAneWVhcic6XG4gICAgICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBlbmRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0T2YodW5pdHMpLmFkZCgodW5pdHMgPT09ICdpc29XZWVrJyA/ICd3ZWVrJyA6IHVuaXRzKSwgMSkuc3VidHJhY3QoJ21zJywgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNBZnRlcjogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPiArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0JlZm9yZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPCArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1NhbWU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdHMgfHwgJ21zJztcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID09PSArbWFrZUFzKGlucHV0LCB0aGlzKS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtaW46IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWF4OiBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPiB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIHpvbmUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLl9vZmZzZXQgfHwgMDtcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHRpbWV6b25lTWludXRlc0Zyb21TdHJpbmcoaW5wdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoaW5wdXQpIDwgMTYpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dCAqIDYwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBtb21lbnQuZHVyYXRpb24ob2Zmc2V0IC0gaW5wdXQsICdtJyksIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogdGhpcy5fZC5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgem9uZUFiYnIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBcIlVUQ1wiIDogXCJcIjtcbiAgICAgICAgfSxcblxuICAgICAgICB6b25lTmFtZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IFwiQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWVcIiA6IFwiXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2Vab25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3R6bSkge1xuICAgICAgICAgICAgICAgIHRoaXMuem9uZSh0aGlzLl90em0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUodGhpcy5faSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBoYXNBbGlnbmVkSG91ck9mZnNldCA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbW9tZW50KGlucHV0KS56b25lKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy56b25lKCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcbiAgICAgICAgfSxcblxuICAgICAgICBkYXlzSW5Nb250aCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXlzSW5Nb250aCh0aGlzLnllYXIoKSwgdGhpcy5tb250aCgpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkYXlPZlllYXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBkYXlPZlllYXIgPSByb3VuZCgobW9tZW50KHRoaXMpLnN0YXJ0T2YoJ2RheScpIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gZGF5T2ZZZWFyKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcXVhcnRlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEuMCkgLyAzLjApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgdGhpcy5sYW5nKCkuX3dlZWsuZG93LCB0aGlzLmxhbmcoKS5fd2Vlay5kb3kpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZChcInlcIiwgKGlucHV0IC0geWVhcikpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzb1dlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgMSwgNCkueWVhcjtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8geWVhciA6IHRoaXMuYWRkKFwieVwiLCAoaW5wdXQgLSB5ZWFyKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB0aGlzLmxhbmcoKS53ZWVrKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIHdlZWspICogNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gd2VlaykgKiA3KTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgd2Vla2RheSA9ICh0aGlzLmRheSgpICsgNyAtIHRoaXMubGFuZygpLl93ZWVrLmRvdykgJSA3O1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoXCJkXCIsIGlucHV0IC0gd2Vla2RheSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgICAgICAgICAgLy8gYXMgYSBnZXR0ZXIsIHJldHVybnMgNyBpbnN0ZWFkIG9mIDAgKDEtNyByYW5nZSBpbnN0ZWFkIG9mIDAtNilcbiAgICAgICAgICAgIC8vIGFzIGEgc2V0dGVyLCBzdW5kYXkgc2hvdWxkIGJlbG9uZyB0byB0aGUgcHJldmlvdXMgd2Vlay5cbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gdGhpcy5kYXkoKSB8fCA3IDogdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyBpbnB1dCA6IGlucHV0IC0gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0IDogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh1bml0cywgdmFsdWUpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzW3VuaXRzXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIElmIHBhc3NlZCBhIGxhbmd1YWdlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxhbmd1YWdlIGZvciB0aGlzXG4gICAgICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvblxuICAgICAgICAvLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAgICAgIGxhbmcgOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbGFuZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGhlbHBlciBmb3IgYWRkaW5nIHNob3J0Y3V0c1xuICAgIGZ1bmN0aW9uIG1ha2VHZXR0ZXJBbmRTZXR0ZXIobmFtZSwga2V5KSB7XG4gICAgICAgIG1vbWVudC5mbltuYW1lXSA9IG1vbWVudC5mbltuYW1lICsgJ3MnXSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHV0YyA9IHRoaXMuX2lzVVRDID8gJ1VUQycgOiAnJztcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZFsnc2V0JyArIHV0YyArIGtleV0oaW5wdXQpO1xuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kWydnZXQnICsgdXRjICsga2V5XSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGxvb3AgdGhyb3VnaCBhbmQgYWRkIHNob3J0Y3V0cyAoTW9udGgsIERhdGUsIEhvdXJzLCBNaW51dGVzLCBTZWNvbmRzLCBNaWxsaXNlY29uZHMpXG4gICAgZm9yIChpID0gMDsgaSA8IHByb3h5R2V0dGVyc0FuZFNldHRlcnMubGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIG1ha2VHZXR0ZXJBbmRTZXR0ZXIocHJveHlHZXR0ZXJzQW5kU2V0dGVyc1tpXS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL3MkLywgJycpLCBwcm94eUdldHRlcnNBbmRTZXR0ZXJzW2ldKTtcbiAgICB9XG5cbiAgICAvLyBhZGQgc2hvcnRjdXQgZm9yIHllYXIgKHVzZXMgZGlmZmVyZW50IHN5bnRheCB0aGFuIHRoZSBnZXR0ZXIvc2V0dGVyICd5ZWFyJyA9PSAnRnVsbFllYXInKVxuICAgIG1ha2VHZXR0ZXJBbmRTZXR0ZXIoJ3llYXInLCAnRnVsbFllYXInKTtcblxuICAgIC8vIGFkZCBwbHVyYWwgbWV0aG9kc1xuICAgIG1vbWVudC5mbi5kYXlzID0gbW9tZW50LmZuLmRheTtcbiAgICBtb21lbnQuZm4ubW9udGhzID0gbW9tZW50LmZuLm1vbnRoO1xuICAgIG1vbWVudC5mbi53ZWVrcyA9IG1vbWVudC5mbi53ZWVrO1xuICAgIG1vbWVudC5mbi5pc29XZWVrcyA9IG1vbWVudC5mbi5pc29XZWVrO1xuXG4gICAgLy8gYWRkIGFsaWFzZWQgZm9ybWF0IG1ldGhvZHNcbiAgICBtb21lbnQuZm4udG9KU09OID0gbW9tZW50LmZuLnRvSVNPU3RyaW5nO1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBEdXJhdGlvbiBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGV4dGVuZChtb21lbnQuZHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGUsIHtcblxuICAgICAgICBfYnViYmxlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyxcbiAgICAgICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2RhdGEsXG4gICAgICAgICAgICAgICAgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzO1xuXG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGNvZGUgYnViYmxlcyB1cCB2YWx1ZXMsIHNlZSB0aGUgdGVzdHMgZm9yXG4gICAgICAgICAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXG4gICAgICAgICAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG5cbiAgICAgICAgICAgIHNlY29uZHMgPSBhYnNSb3VuZChtaWxsaXNlY29uZHMgLyAxMDAwKTtcbiAgICAgICAgICAgIGRhdGEuc2Vjb25kcyA9IHNlY29uZHMgJSA2MDtcblxuICAgICAgICAgICAgbWludXRlcyA9IGFic1JvdW5kKHNlY29uZHMgLyA2MCk7XG4gICAgICAgICAgICBkYXRhLm1pbnV0ZXMgPSBtaW51dGVzICUgNjA7XG5cbiAgICAgICAgICAgIGhvdXJzID0gYWJzUm91bmQobWludXRlcyAvIDYwKTtcbiAgICAgICAgICAgIGRhdGEuaG91cnMgPSBob3VycyAlIDI0O1xuXG4gICAgICAgICAgICBkYXlzICs9IGFic1JvdW5kKGhvdXJzIC8gMjQpO1xuICAgICAgICAgICAgZGF0YS5kYXlzID0gZGF5cyAlIDMwO1xuXG4gICAgICAgICAgICBtb250aHMgKz0gYWJzUm91bmQoZGF5cyAvIDMwKTtcbiAgICAgICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzICUgMTI7XG5cbiAgICAgICAgICAgIHllYXJzID0gYWJzUm91bmQobW9udGhzIC8gMTIpO1xuICAgICAgICAgICAgZGF0YS55ZWFycyA9IHllYXJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFic1JvdW5kKHRoaXMuZGF5cygpIC8gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9taWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNjtcbiAgICAgICAgfSxcblxuICAgICAgICBodW1hbml6ZSA6IGZ1bmN0aW9uICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICB2YXIgZGlmZmVyZW5jZSA9ICt0aGlzLFxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlbGF0aXZlVGltZShkaWZmZXJlbmNlLCAhd2l0aFN1ZmZpeCwgdGhpcy5sYW5nKCkpO1xuXG4gICAgICAgICAgICBpZiAod2l0aFN1ZmZpeCkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHRoaXMubGFuZygpLnBhc3RGdXR1cmUoZGlmZmVyZW5jZSwgb3V0cHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKG1vbWVudClcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArPSBkdXIuX21pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKz0gZHVyLl9kYXlzO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzICs9IGR1ci5fbW9udGhzO1xuXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcblxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzIC09IGR1ci5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgdGhpcy5fZGF5cyAtPSBkdXIuX2RheXM7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgLT0gZHVyLl9tb250aHM7XG5cbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMudG9Mb3dlckNhc2UoKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcyA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1snYXMnICsgdW5pdHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB1bml0cy5zbGljZSgxKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogbW9tZW50LmZuLmxhbmcsXG5cbiAgICAgICAgdG9Jc29TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICAgICAgdmFyIHllYXJzID0gTWF0aC5hYnModGhpcy55ZWFycygpKSxcbiAgICAgICAgICAgICAgICBtb250aHMgPSBNYXRoLmFicyh0aGlzLm1vbnRocygpKSxcbiAgICAgICAgICAgICAgICBkYXlzID0gTWF0aC5hYnModGhpcy5kYXlzKCkpLFxuICAgICAgICAgICAgICAgIGhvdXJzID0gTWF0aC5hYnModGhpcy5ob3VycygpKSxcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gTWF0aC5hYnModGhpcy5taW51dGVzKCkpLFxuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLmFicyh0aGlzLnNlY29uZHMoKSArIHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFzU2Vjb25kcygpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAgICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy5hc1NlY29uZHMoKSA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAgICAgICAgICdQJyArXG4gICAgICAgICAgICAgICAgKHllYXJzID8geWVhcnMgKyAnWScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChtb250aHMgPyBtb250aHMgKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChkYXlzID8gZGF5cyArICdEJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKChob3VycyB8fCBtaW51dGVzIHx8IHNlY29uZHMpID8gJ1QnIDogJycpICtcbiAgICAgICAgICAgICAgICAoaG91cnMgPyBob3VycyArICdIJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKG1pbnV0ZXMgPyBtaW51dGVzICsgJ00nIDogJycpICtcbiAgICAgICAgICAgICAgICAoc2Vjb25kcyA/IHNlY29uZHMgKyAnUycgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkdldHRlcihuYW1lKSB7XG4gICAgICAgIG1vbWVudC5kdXJhdGlvbi5mbltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkFzR2V0dGVyKG5hbWUsIGZhY3Rvcikge1xuICAgICAgICBtb21lbnQuZHVyYXRpb24uZm5bJ2FzJyArIG5hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzIC8gZmFjdG9yO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZvciAoaSBpbiB1bml0TWlsbGlzZWNvbmRGYWN0b3JzKSB7XG4gICAgICAgIGlmICh1bml0TWlsbGlzZWNvbmRGYWN0b3JzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBtYWtlRHVyYXRpb25Bc0dldHRlcihpLCB1bml0TWlsbGlzZWNvbmRGYWN0b3JzW2ldKTtcbiAgICAgICAgICAgIG1ha2VEdXJhdGlvbkdldHRlcihpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWFrZUR1cmF0aW9uQXNHZXR0ZXIoJ1dlZWtzJywgNjA0OGU1KTtcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNNb250aHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAoK3RoaXMgLSB0aGlzLnllYXJzKCkgKiAzMTUzNmU2KSAvIDI1OTJlNiArIHRoaXMueWVhcnMoKSAqIDEyO1xuICAgIH07XG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBMYW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBTZXQgZGVmYXVsdCBsYW5ndWFnZSwgb3RoZXIgbGFuZ3VhZ2VzIHdpbGwgaW5oZXJpdCBmcm9tIEVuZ2xpc2guXG4gICAgbW9tZW50LmxhbmcoJ2VuJywge1xuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyogRU1CRURfTEFOR1VBR0VTICovXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE1vbWVudFxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIG1ha2VHbG9iYWwoZGVwcmVjYXRlKSB7XG4gICAgICAgIHZhciB3YXJuZWQgPSBmYWxzZSwgbG9jYWxfbW9tZW50ID0gbW9tZW50O1xuICAgICAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgICAgICBpZiAodHlwZW9mIGVuZGVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG1vbWVudGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZVxuICAgICAgICBpZiAoZGVwcmVjYXRlKSB7XG4gICAgICAgICAgICBnbG9iYWwubW9tZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghd2FybmVkICYmIGNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkFjY2Vzc2luZyBNb21lbnQgdGhyb3VnaCB0aGUgZ2xvYmFsIHNjb3BlIGlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRlcHJlY2F0ZWQsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVsZWFzZS5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbF9tb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBleHRlbmQoZ2xvYmFsLm1vbWVudCwgbG9jYWxfbW9tZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsb2JhbFsnbW9tZW50J10gPSBtb21lbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtb21lbnQ7XG4gICAgICAgIG1ha2VHbG9iYWwodHJ1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoXCJtb21lbnRcIiwgZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuICAgICAgICAgICAgaWYgKG1vZHVsZS5jb25maWcgJiYgbW9kdWxlLmNvbmZpZygpICYmIG1vZHVsZS5jb25maWcoKS5ub0dsb2JhbCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHVzZXIgcHJvdmlkZWQgbm9HbG9iYWwsIGhlIGlzIGF3YXJlIG9mIGdsb2JhbFxuICAgICAgICAgICAgICAgIG1ha2VHbG9iYWwobW9kdWxlLmNvbmZpZygpLm5vR2xvYmFsID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50O1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtYWtlR2xvYmFsKCk7XG4gICAgfVxufSkuY2FsbCh0aGlzKTtcbiIsImV4cG9ydHMuQXNzZXRzTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL2Fzc2V0c21hbmFnZXInKTtcbiIsInZhciBjb252ZXJ0ID0gcmVxdWlyZSgnY29sb3ItY29udmVydCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFJlc291cmNlTG9hZGVyID0gcmVxdWlyZSgnLi9yZXNvdXJjZWxvYWRlcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzZXRzTWFuYWdlcjtcblxuXG5mdW5jdGlvbiBBc3NldHNNYW5hZ2VyKG9wdF9vcHRpb25zKSB7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHZhciBvcHRpb25zID0ge1xuICAgIHdvcmtlclBhdGg6IF9fZGlybmFtZSArICcvLi4vd29ya2VyLmpzJyxcbiAgICB3b3JrZXJzOiAxXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIC8vIENyZWF0ZSB0aGUgbnVtYmVyIG9mIHdvcmtlcnMgc3BlY2lmaWVkIGluIG9wdGlvbnMuXG4gIHZhciB3b3JrZXJzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy53b3JrZXJzOyBpKyspIHtcbiAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihvcHRpb25zLndvcmtlclBhdGgpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb3h5IHdoaWNoIHdpbGwgaGFuZGxlIGRlbGVnYXRpb24gdG8gdGhlIHdvcmtlcnMuXG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2Vycywge3RpbWVDYWxsczogdHJ1ZX0pO1xuXG4gIHRoaXMuX2VtaXR0aW5nID0ge307XG4gIHRoaXMuX2Jsb2JDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIC8vIFRPRE86IE1ha2UgYSBtb3JlIGdlbmVyaWMgY2FjaGU/XG4gIHRoaXMuX2ZyYW1lc0NhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdGhpcy5faW1hZ2VDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG51dGlsLmluaGVyaXRzKEFzc2V0c01hbmFnZXIsIEV2ZW50RW1pdHRlcik7XG5cbi8qKlxuICogSW5kZXhlcyBhIGRpcmVjdG9yeS4gQWxsIGZpbGVzIGluIHRoZSBkaXJlY3Rvcnkgd2lsbCBiZSByZWFjaGFibGUgdGhyb3VnaFxuICogdGhlIGFzc2V0cyBkYXRhYmFzZSBhZnRlciB0aGlzIGNvbXBsZXRlcy4gQWxsIC5wYWsvLm1vZHBhayBmaWxlcyB3aWxsIGFsc29cbiAqIGJlIGxvYWRlZCBpbnRvIHRoZSBpbmRleC5cbiAqXG4gKiBUaGUgdmlydHVhbCBwYXRoIGFyZ3VtZW50IGlzIGEgcHJlZml4IGZvciB0aGUgZW50cmllcyBpbiB0aGUgZGlyZWN0b3J5LlxuICovXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGREaXJlY3RvcnkgPSBmdW5jdGlvbiAocGF0aCwgZGlyRW50cnksIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgcGVuZGluZyA9IDE7XG4gIHZhciBkZWNyZW1lbnRQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHBlbmRpbmctLTtcbiAgICBpZiAoIXBlbmRpbmcpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcmVhZGVyID0gZGlyRW50cnkuY3JlYXRlUmVhZGVyKCk7XG4gIHZhciBuZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJlYWRlci5yZWFkRW50cmllcyhmdW5jdGlvbiAoZW50cmllcykge1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgaWYgKGVudHJ5Lm5hbWVbMF0gPT0gJy4nKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGVudHJ5UGF0aCA9IHBhdGggKyAnLycgKyBlbnRyeS5uYW1lO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICBzZWxmLmFkZERpcmVjdG9yeShlbnRyeVBhdGgsIGVudHJ5LCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgICAgZW50cnkuZmlsZShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgc2VsZi5hZGRGaWxlKGVudHJ5UGF0aCwgZmlsZSwgZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgICAgfSwgZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuICB9O1xuICBuZXh0KCk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGRGaWxlID0gZnVuY3Rpb24gKHBhdGgsIGZpbGUsIGNhbGxiYWNrKSB7XG4gIC8vIFRPRE86IFdoYXQgdG8gZG8gYWJvdXQgdGhlIGNhbGxiYWNrIGJlaW5nIGNhbGxlZCBvbmNlIGZvciBlYWNoIHdvcmtlcj9cbiAgdGhpcy5hcGkuYWRkRmlsZS5icm9hZGNhc3QocGF0aCwgZmlsZSwgY2FsbGJhY2spO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuYWRkUm9vdCA9IGZ1bmN0aW9uIChkaXJFbnRyeSwgY2FsbGJhY2spIHtcbiAgdGhpcy5hZGREaXJlY3RvcnkoJycsIGRpckVudHJ5LCBjYWxsYmFjayk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5lbWl0T25jZVBlclRpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKHRoaXMuX2VtaXR0aW5nW2V2ZW50XSkgcmV0dXJuO1xuICB0aGlzLl9lbWl0dGluZ1tldmVudF0gPSB0cnVlO1xuXG4gIHZhciBzZWxmID0gdGhpcywgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuZW1pdC5hcHBseShzZWxmLCBhcmdzKTtcbiAgICBkZWxldGUgc2VsZi5fZW1pdHRpbmdbZXZlbnRdO1xuICB9KTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldEJsb2JVUkwgPSBmdW5jdGlvbiAocGF0aCwgY2FsbGJhY2spIHtcbiAgaWYgKHBhdGggaW4gdGhpcy5fYmxvYkNhY2hlKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgdGhpcy5fYmxvYkNhY2hlW3BhdGhdKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXBpLmdldEJsb2JVUkwocGF0aCwgZnVuY3Rpb24gKGVyciwgdXJsKSB7XG4gICAgaWYgKCFlcnIpIHNlbGYuX2Jsb2JDYWNoZVtwYXRoXSA9IHVybDtcbiAgICBjYWxsYmFjayhlcnIsIHVybCk7XG4gIH0pO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0RnJhbWVzID0gZnVuY3Rpb24gKGltYWdlUGF0aCkge1xuICB2YXIgZG90T2Zmc2V0ID0gaW1hZ2VQYXRoLmxhc3RJbmRleE9mKCcuJyk7XG4gIHZhciBwYXRoID0gaW1hZ2VQYXRoLnN1YnN0cigwLCBkb3RPZmZzZXQpICsgJy5mcmFtZXMnO1xuXG4gIGlmIChwYXRoIGluIHRoaXMuX2ZyYW1lc0NhY2hlKSByZXR1cm4gdGhpcy5fZnJhbWVzQ2FjaGVbcGF0aF07XG4gIHRoaXMuX2ZyYW1lc0NhY2hlW3BhdGhdID0gbnVsbDtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXBpLmdldEpTT04ocGF0aCwgZnVuY3Rpb24gKGVyciwgZnJhbWVzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuX2ZyYW1lc0NhY2hlW3BhdGhdID0gZnJhbWVzO1xuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgaW1hZ2UgZm9yIHRoZSBzcGVjaWZpZWQgcGF0aC4gVGhpcyBmdW5jdGlvbiBpcyBzeW5jaHJvbm91cywgYnV0IG1heVxuICogZGVwZW5kIG9uIGFzeW5jaHJvbm91cyBvcGVyYXRpb25zLiBJZiB0aGUgaW1hZ2UgaXMgbm90IGltbWVkaWF0ZWx5IGF2YWlsYWJsZVxuICogdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiBudWxsLiBPbmNlIG1vcmUgaW1hZ2VzIGFyZSBhdmFpbGFibGUsIGFuIFwiaW1hZ2VzXCJcbiAqIGV2ZW50IHdpbGwgYmUgZW1pdHRlZC5cbiAqL1xuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0SW1hZ2UgPSBmdW5jdGlvbiAocGF0aCkge1xuICAvLyBFeGFtcGxlIHBhdGg6IFwiL2RpcmVjdG9yeS9pbWFnZS5wbmc/aHVlc2hpZnQ9NjA/ZmFkZT1mZmZmZmY9MC4xXCJcbiAgaWYgKHBhdGggaW4gdGhpcy5faW1hZ2VDYWNoZSkgcmV0dXJuIHRoaXMuX2ltYWdlQ2FjaGVbcGF0aF07XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIEV4dHJhY3QgaW1hZ2Ugb3BlcmF0aW9ucy5cbiAgdmFyIG9wcyA9IHBhdGguc3BsaXQoJz8nKTtcbiAgLy8gR2V0IHRoZSBwbGFpbiBwYXRoIHRvIHRoZSBpbWFnZSBmaWxlLlxuICB2YXIgZmlsZVBhdGggPSBvcHMuc2hpZnQoKTtcblxuICAvLyBJZiB0aGUgaW1hZ2UgaXMgbm90IGluIHRoZSBjYWNoZSwgbG9hZCBpdCBhbmQgdHJpZ2dlciBhbiBcImltYWdlc1wiIGV2ZW50XG4gIC8vIHdoZW4gaXQncyBkb25lLlxuICBpZiAoIShmaWxlUGF0aCBpbiB0aGlzLl9pbWFnZUNhY2hlKSkge1xuICAgIHRoaXMuX2ltYWdlQ2FjaGVbZmlsZVBhdGhdID0gbnVsbDtcblxuICAgIHRoaXMuZ2V0QmxvYlVSTChmaWxlUGF0aCwgZnVuY3Rpb24gKGVyciwgdXJsKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGxvYWQgJXMgKCVzKScsIGZpbGVQYXRoLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5zcmMgPSB1cmw7XG4gICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuX2ltYWdlQ2FjaGVbZmlsZVBhdGhdID0gaW1hZ2U7XG4gICAgICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdpbWFnZXMnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICB2YXIgaW1hZ2UgPSB0aGlzLl9pbWFnZUNhY2hlW2ZpbGVQYXRoXTtcbiAgaWYgKCFpbWFnZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gQXBwbHkgb3BlcmF0aW9ucyAoc3VjaCBhcyBodWUgc2hpZnQpIG9uIHRoZSBpbWFnZS5cbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAvLyBQYXJzZSBhbGwgdGhlIG9wZXJhdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgaW1hZ2UuXG4gIC8vIFRPRE86IGFkZG1hc2ssIGJyaWdodG5lc3MsIGZhZGUsIHJlcGxhY2UsIHNhdHVyYXRpb25cbiAgdmFyIGh1ZSA9IDAsIGZsaXBFdmVyeVggPSAwLCByZXBsYWNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvcCA9IG9wc1tpXS5zcGxpdCgvWz07XS8pO1xuICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgIC8vIFRoaXMgb3BlcmF0aW9uIGRvZXNuJ3QgZXhpc3QgaW4gU3RhcmJvdW5kLCBidXQgaXMgaGVscGZ1bCBmb3IgdXMuXG4gICAgICBjYXNlICdmbGlwZ3JpZHgnOlxuICAgICAgICBmbGlwRXZlcnlYID0gcGFyc2VJbnQob3BbMV0pO1xuICAgICAgICBpZiAoaW1hZ2Uud2lkdGggJSBmbGlwRXZlcnlYKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGltYWdlLndpZHRoICsgJyBub3QgZGl2aXNpYmxlIGJ5ICcgKyBmbGlwRXZlcnlYICsgJyAoJyArIHBhdGggKyAnKScpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaHVlc2hpZnQnOlxuICAgICAgICBodWUgPSBwYXJzZUZsb2F0KG9wWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyZXBsYWNlJzpcbiAgICAgICAgaWYgKCFyZXBsYWNlKSByZXBsYWNlID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgb3AubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICB2YXIgZnJvbSA9IFtcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2ldLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQob3BbaV0uc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpXS5zdWJzdHIoNCwgMiksIDE2KVxuICAgICAgICAgIF07XG5cbiAgICAgICAgICB2YXIgdG8gPSBbXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpICsgMV0uc3Vic3RyKDQsIDIpLCAxNilcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmVwbGFjZVtmcm9tXSA9IHRvO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKCdVbnN1cHBvcnRlZCBpbWFnZSBvcGVyYXRpb246Jywgb3ApO1xuICAgIH1cbiAgfVxuXG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgaWYgKGZsaXBFdmVyeVgpIHtcbiAgICBjb250ZXh0LnNhdmUoKTtcbiAgICBjb250ZXh0LnNjYWxlKC0xLCAxKTtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4ICs9IGZsaXBFdmVyeVgpIHtcbiAgICAgIHZhciBmbGlwcGVkWCA9IC0oeCArIGZsaXBFdmVyeVgpLCBkdyA9IGZsaXBFdmVyeVgsIGRoID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIHgsIDAsIGR3LCBkaCwgZmxpcHBlZFgsIDAsIGR3LCBkaCk7XG4gICAgfVxuICAgIGNvbnRleHQucmVzdG9yZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcbiAgfVxuXG4gIGlmIChodWUgfHwgcmVwbGFjZSkge1xuICAgIHZhciBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KSxcbiAgICAgICAgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgaWYgKHJlcGxhY2UpIHtcbiAgICAgICAgdmFyIGNvbG9yID0gcmVwbGFjZVtkYXRhW2ldICsgJywnICsgZGF0YVtpICsgMV0gKyAnLCcgKyBkYXRhW2kgKyAyXV07XG4gICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgIGRhdGFbaV0gPSBjb2xvclswXTtcbiAgICAgICAgICBkYXRhW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgICAgIGRhdGFbaSArIDJdID0gY29sb3JbMl07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGh1ZSkge1xuICAgICAgICBoc3YgPSBjb252ZXJ0LnJnYjJoc3YoZGF0YVtpXSwgZGF0YVtpICsgMV0sIGRhdGFbaSArIDJdKTtcblxuICAgICAgICBoc3ZbMF0gKz0gaHVlO1xuICAgICAgICBpZiAoaHN2WzBdIDwgMCkgaHN2WzBdICs9IDM2MFxuICAgICAgICBlbHNlIGlmIChoc3ZbMF0gPj0gMzYwKSBoc3ZbMF0gLT0gMzYwO1xuXG4gICAgICAgIHJnYiA9IGNvbnZlcnQuaHN2MnJnYihoc3YpO1xuXG4gICAgICAgIGRhdGFbaV0gPSByZ2JbMF07XG4gICAgICAgIGRhdGFbaSArIDFdID0gcmdiWzFdO1xuICAgICAgICBkYXRhW2kgKyAyXSA9IHJnYlsyXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgfVxuXG4gIHNlbGYuX2ltYWdlQ2FjaGVbcGF0aF0gPSBudWxsO1xuXG4gIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgZm9yIHRoZSBtb2RpZmllZCBpbWFnZSBhbmQgY2FjaGUgaXQuXG4gIGltYWdlID0gbmV3IEltYWdlKCk7XG4gIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9pbWFnZUNhY2hlW3BhdGhdID0gaW1hZ2U7XG4gICAgc2VsZi5lbWl0T25jZVBlclRpY2soJ2ltYWdlcycpO1xuICB9O1xuICBpbWFnZS5zcmMgPSBjYW52YXMudG9EYXRhVVJMKCk7XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRSZXNvdXJjZUxvYWRlciA9IGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgcmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcih0aGlzLCBleHRlbnNpb24pO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0UmVzb3VyY2VQYXRoID0gZnVuY3Rpb24gKHJlc291cmNlLCBwYXRoKSB7XG4gIGlmIChwYXRoWzBdID09ICcvJykgcmV0dXJuIHBhdGg7XG4gIHZhciBiYXNlID0gcmVzb3VyY2UuX19wYXRoX187XG4gIHJldHVybiBiYXNlLnN1YnN0cigwLCBiYXNlLmxhc3RJbmRleE9mKCcvJykgKyAxKSArIHBhdGg7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRUaWxlSW1hZ2UgPSBmdW5jdGlvbiAocmVzb3VyY2UsIGZpZWxkLCBvcHRfaHVlU2hpZnQpIHtcbiAgcGF0aCA9IHRoaXMuZ2V0UmVzb3VyY2VQYXRoKHJlc291cmNlLCByZXNvdXJjZVtmaWVsZF0pO1xuXG4gIC8vIEFkZCBodWVzaGlmdCBpbWFnZSBvcGVyYXRpb24gaWYgbmVlZGVkLlxuICBpZiAob3B0X2h1ZVNoaWZ0KSB7XG4gICAgcGF0aCArPSAnP2h1ZXNoaWZ0PScgKyAob3B0X2h1ZVNoaWZ0IC8gMjU1ICogMzYwKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmdldEltYWdlKHBhdGgpO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUubG9hZFJlc291cmNlcyA9IGZ1bmN0aW9uIChleHRlbnNpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hcGkubG9hZFJlc291cmNlcyhleHRlbnNpb24sIGZ1bmN0aW9uIChlcnIsIHJlc291cmNlcykge1xuICAgIGNhbGxiYWNrKGVyciwgcmVzb3VyY2VzKTtcbiAgICBpZiAoIWVycikge1xuICAgICAgc2VsZi5lbWl0T25jZVBlclRpY2soJ3Jlc291cmNlcycpO1xuICAgIH1cbiAgfSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZUxvYWRlcjtcblxuXG5mdW5jdGlvbiBSZXNvdXJjZUxvYWRlcihhc3NldHNNYW5hZ2VyLCBleHRlbnNpb24pIHtcbiAgdGhpcy5hc3NldHMgPSBhc3NldHNNYW5hZ2VyO1xuICB0aGlzLmV4dGVuc2lvbiA9IGV4dGVuc2lvbjtcblxuICB0aGlzLmluZGV4ID0gbnVsbDtcblxuICB0aGlzLl9sb2FkaW5nSW5kZXggPSBmYWxzZTtcbn1cblxuUmVzb3VyY2VMb2FkZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChpZCkge1xuICBpZiAoIXRoaXMuaW5kZXgpIHJldHVybiBudWxsO1xuICByZXR1cm4gdGhpcy5pbmRleFtpZF0gfHwgbnVsbDtcbn07XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5sb2FkSW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9sb2FkaW5nSW5kZXgpIHJldHVybjtcbiAgdGhpcy5fbG9hZGluZ0luZGV4ID0gdHJ1ZTtcblxuICAvLyBUT0RPOiBGYXQgYXJyb3dzLlxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXNzZXRzLmxvYWRSZXNvdXJjZXModGhpcy5leHRlbnNpb24sIGZ1bmN0aW9uIChlcnIsIGluZGV4KSB7XG4gICAgc2VsZi5fbG9hZGluZ0luZGV4ID0gZmFsc2U7XG4gICAgc2VsZi5pbmRleCA9IGluZGV4O1xuICB9KTtcbn07XG4iLCIvKiBNSVQgbGljZW5zZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmdiMmhzbDogcmdiMmhzbCxcbiAgcmdiMmhzdjogcmdiMmhzdixcbiAgcmdiMmNteWs6IHJnYjJjbXlrLFxuICByZ2Iya2V5d29yZDogcmdiMmtleXdvcmQsXG4gIHJnYjJ4eXo6IHJnYjJ4eXosXG4gIHJnYjJsYWI6IHJnYjJsYWIsXG5cbiAgaHNsMnJnYjogaHNsMnJnYixcbiAgaHNsMmhzdjogaHNsMmhzdixcbiAgaHNsMmNteWs6IGhzbDJjbXlrLFxuICBoc2wya2V5d29yZDogaHNsMmtleXdvcmQsXG5cbiAgaHN2MnJnYjogaHN2MnJnYixcbiAgaHN2MmhzbDogaHN2MmhzbCxcbiAgaHN2MmNteWs6IGhzdjJjbXlrLFxuICBoc3Yya2V5d29yZDogaHN2MmtleXdvcmQsXG5cbiAgY215azJyZ2I6IGNteWsycmdiLFxuICBjbXlrMmhzbDogY215azJoc2wsXG4gIGNteWsyaHN2OiBjbXlrMmhzdixcbiAgY215azJrZXl3b3JkOiBjbXlrMmtleXdvcmQsXG4gIFxuICBrZXl3b3JkMnJnYjoga2V5d29yZDJyZ2IsXG4gIGtleXdvcmQyaHNsOiBrZXl3b3JkMmhzbCxcbiAga2V5d29yZDJoc3Y6IGtleXdvcmQyaHN2LFxuICBrZXl3b3JkMmNteWs6IGtleXdvcmQyY215ayxcbiAga2V5d29yZDJsYWI6IGtleXdvcmQybGFiLFxuICBrZXl3b3JkMnh5ejoga2V5d29yZDJ4eXosXG4gIFxuICB4eXoycmdiOiB4eXoycmdiLFxuICB4eXoybGFiOiB4eXoybGFiLFxuICBcbiAgbGFiMnh5ejogbGFiMnh5eixcbn1cblxuXG5mdW5jdGlvbiByZ2IyaHNsKHJnYikge1xuICB2YXIgciA9IHJnYlswXS8yNTUsXG4gICAgICBnID0gcmdiWzFdLzI1NSxcbiAgICAgIGIgPSByZ2JbMl0vMjU1LFxuICAgICAgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICBtYXggPSBNYXRoLm1heChyLCBnLCBiKSxcbiAgICAgIGRlbHRhID0gbWF4IC0gbWluLFxuICAgICAgaCwgcywgbDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpIFxuICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChnID09IG1heClcbiAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTsgXG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKS8gZGVsdGE7XG5cbiAgaCA9IE1hdGgubWluKGggKiA2MCwgMzYwKTtcblxuICBpZiAoaCA8IDApXG4gICAgaCArPSAzNjA7XG5cbiAgbCA9IChtaW4gKyBtYXgpIC8gMjtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBzID0gMDtcbiAgZWxzZSBpZiAobCA8PSAwLjUpXG4gICAgcyA9IGRlbHRhIC8gKG1heCArIG1pbik7XG4gIGVsc2VcbiAgICBzID0gZGVsdGEgLyAoMiAtIG1heCAtIG1pbik7XG5cbiAgcmV0dXJuIFtoLCBzICogMTAwLCBsICogMTAwXTtcbn1cblxuZnVuY3Rpb24gcmdiMmhzdihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0sXG4gICAgICBnID0gcmdiWzFdLFxuICAgICAgYiA9IHJnYlsyXSxcbiAgICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpLFxuICAgICAgbWF4ID0gTWF0aC5tYXgociwgZywgYiksXG4gICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgIGgsIHMsIHY7XG5cbiAgaWYgKG1heCA9PSAwKVxuICAgIHMgPSAwO1xuICBlbHNlXG4gICAgcyA9IChkZWx0YS9tYXggKiAxMDAwKS8xMDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpIFxuICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChnID09IG1heClcbiAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTsgXG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKSAvIGRlbHRhO1xuXG4gIGggPSBNYXRoLm1pbihoICogNjAsIDM2MCk7XG5cbiAgaWYgKGggPCAwKSBcbiAgICBoICs9IDM2MDtcblxuICB2ID0gKChtYXggLyAyNTUpICogMTAwMCkgLyAxMDtcblxuICByZXR1cm4gW2gsIHMsIHZdO1xufVxuXG5mdW5jdGlvbiByZ2IyY215ayhyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NSxcbiAgICAgIGMsIG0sIHksIGs7XG4gICAgICBcbiAgayA9IE1hdGgubWluKDEgLSByLCAxIC0gZywgMSAtIGIpO1xuICBjID0gKDEgLSByIC0gaykgLyAoMSAtIGspO1xuICBtID0gKDEgLSBnIC0gaykgLyAoMSAtIGspO1xuICB5ID0gKDEgLSBiIC0gaykgLyAoMSAtIGspO1xuICByZXR1cm4gW2MgKiAxMDAsIG0gKiAxMDAsIHkgKiAxMDAsIGsgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2Iya2V5d29yZChyZ2IpIHtcbiAgcmV0dXJuIHJldmVyc2VLZXl3b3Jkc1tKU09OLnN0cmluZ2lmeShyZ2IpXTtcbn1cblxuZnVuY3Rpb24gcmdiMnh5eihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NTtcblxuICAvLyBhc3N1bWUgc1JHQlxuICByID0gciA+IDAuMDQwNDUgPyBNYXRoLnBvdygoKHIgKyAwLjA1NSkgLyAxLjA1NSksIDIuNCkgOiAociAvIDEyLjkyKTtcbiAgZyA9IGcgPiAwLjA0MDQ1ID8gTWF0aC5wb3coKChnICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpIDogKGcgLyAxMi45Mik7XG4gIGIgPSBiID4gMC4wNDA0NSA/IE1hdGgucG93KCgoYiArIDAuMDU1KSAvIDEuMDU1KSwgMi40KSA6IChiIC8gMTIuOTIpO1xuICBcbiAgdmFyIHggPSAociAqIDAuNDEyNCkgKyAoZyAqIDAuMzU3NikgKyAoYiAqIDAuMTgwNSk7XG4gIHZhciB5ID0gKHIgKiAwLjIxMjYpICsgKGcgKiAwLjcxNTIpICsgKGIgKiAwLjA3MjIpO1xuICB2YXIgeiA9IChyICogMC4wMTkzKSArIChnICogMC4xMTkyKSArIChiICogMC45NTA1KTtcblxuICByZXR1cm4gW3ggKiAxMDAsIHkgKjEwMCwgeiAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIHJnYjJsYWIocmdiKSB7XG4gIHZhciB4eXogPSByZ2IyeHl6KHJnYiksXG4gICAgICAgIHggPSB4eXpbMF0sXG4gICAgICAgIHkgPSB4eXpbMV0sXG4gICAgICAgIHogPSB4eXpbMl0sXG4gICAgICAgIGwsIGEsIGI7XG5cbiAgeCAvPSA5NS4wNDc7XG4gIHkgLz0gMTAwO1xuICB6IC89IDEwOC44ODM7XG5cbiAgeCA9IHggPiAwLjAwODg1NiA/IE1hdGgucG93KHgsIDEvMykgOiAoNy43ODcgKiB4KSArICgxNiAvIDExNik7XG4gIHkgPSB5ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh5LCAxLzMpIDogKDcuNzg3ICogeSkgKyAoMTYgLyAxMTYpO1xuICB6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMS8zKSA6ICg3Ljc4NyAqIHopICsgKDE2IC8gMTE2KTtcblxuICBsID0gKDExNiAqIHkpIC0gMTY7XG4gIGEgPSA1MDAgKiAoeCAtIHkpO1xuICBiID0gMjAwICogKHkgLSB6KTtcbiAgXG4gIHJldHVybiBbbCwgYSwgYl07XG59XG5cblxuZnVuY3Rpb24gaHNsMnJnYihoc2wpIHtcbiAgdmFyIGggPSBoc2xbMF0gLyAzNjAsXG4gICAgICBzID0gaHNsWzFdIC8gMTAwLFxuICAgICAgbCA9IGhzbFsyXSAvIDEwMCxcbiAgICAgIHQxLCB0MiwgdDMsIHJnYiwgdmFsO1xuXG4gIGlmIChzID09IDApIHtcbiAgICB2YWwgPSBsICogMjU1O1xuICAgIHJldHVybiBbdmFsLCB2YWwsIHZhbF07XG4gIH1cblxuICBpZiAobCA8IDAuNSlcbiAgICB0MiA9IGwgKiAoMSArIHMpO1xuICBlbHNlXG4gICAgdDIgPSBsICsgcyAtIGwgKiBzO1xuICB0MSA9IDIgKiBsIC0gdDI7XG5cbiAgcmdiID0gWzAsIDAsIDBdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIHQzID0gaCArIDEgLyAzICogLSAoaSAtIDEpO1xuICAgIHQzIDwgMCAmJiB0MysrO1xuICAgIHQzID4gMSAmJiB0My0tO1xuXG4gICAgaWYgKDYgKiB0MyA8IDEpXG4gICAgICB2YWwgPSB0MSArICh0MiAtIHQxKSAqIDYgKiB0MztcbiAgICBlbHNlIGlmICgyICogdDMgPCAxKVxuICAgICAgdmFsID0gdDI7XG4gICAgZWxzZSBpZiAoMyAqIHQzIDwgMilcbiAgICAgIHZhbCA9IHQxICsgKHQyIC0gdDEpICogKDIgLyAzIC0gdDMpICogNjtcbiAgICBlbHNlXG4gICAgICB2YWwgPSB0MTtcblxuICAgIHJnYltpXSA9IHZhbCAqIDI1NTtcbiAgfVxuICBcbiAgcmV0dXJuIHJnYjtcbn1cblxuZnVuY3Rpb24gaHNsMmhzdihoc2wpIHtcbiAgdmFyIGggPSBoc2xbMF0sXG4gICAgICBzID0gaHNsWzFdIC8gMTAwLFxuICAgICAgbCA9IGhzbFsyXSAvIDEwMCxcbiAgICAgIHN2LCB2O1xuICBsICo9IDI7XG4gIHMgKj0gKGwgPD0gMSkgPyBsIDogMiAtIGw7XG4gIHYgPSAobCArIHMpIC8gMjtcbiAgc3YgPSAoMiAqIHMpIC8gKGwgKyBzKTtcbiAgcmV0dXJuIFtoLCBzdiAqIDEwMCwgdiAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIGhzbDJjbXlrKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJjbXlrKGhzbDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBoc2wya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChoc2wycmdiKGFyZ3MpKTtcbn1cblxuXG5mdW5jdGlvbiBoc3YycmdiKGhzdikge1xuICB2YXIgaCA9IGhzdlswXSAvIDYwLFxuICAgICAgcyA9IGhzdlsxXSAvIDEwMCxcbiAgICAgIHYgPSBoc3ZbMl0gLyAxMDAsXG4gICAgICBoaSA9IE1hdGguZmxvb3IoaCkgJSA2O1xuXG4gIHZhciBmID0gaCAtIE1hdGguZmxvb3IoaCksXG4gICAgICBwID0gMjU1ICogdiAqICgxIC0gcyksXG4gICAgICBxID0gMjU1ICogdiAqICgxIC0gKHMgKiBmKSksXG4gICAgICB0ID0gMjU1ICogdiAqICgxIC0gKHMgKiAoMSAtIGYpKSksXG4gICAgICB2ID0gMjU1ICogdjtcblxuICBzd2l0Y2goaGkpIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gW3YsIHQsIHBdO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBbcSwgdiwgcF07XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIFtwLCB2LCB0XTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gW3AsIHEsIHZdO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBbdCwgcCwgdl07XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIFt2LCBwLCBxXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoc3YyaHNsKGhzdikge1xuICB2YXIgaCA9IGhzdlswXSxcbiAgICAgIHMgPSBoc3ZbMV0gLyAxMDAsXG4gICAgICB2ID0gaHN2WzJdIC8gMTAwLFxuICAgICAgc2wsIGw7XG5cbiAgbCA9ICgyIC0gcykgKiB2OyAgXG4gIHNsID0gcyAqIHY7XG4gIHNsIC89IChsIDw9IDEpID8gbCA6IDIgLSBsO1xuICBsIC89IDI7XG4gIHJldHVybiBbaCwgc2wgKiAxMDAsIGwgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiBoc3YyY215ayhhcmdzKSB7XG4gIHJldHVybiByZ2IyY215ayhoc3YycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gaHN2MmtleXdvcmQoYXJncykge1xuICByZXR1cm4gcmdiMmtleXdvcmQoaHN2MnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsycmdiKGNteWspIHtcbiAgdmFyIGMgPSBjbXlrWzBdIC8gMTAwLFxuICAgICAgbSA9IGNteWtbMV0gLyAxMDAsXG4gICAgICB5ID0gY215a1syXSAvIDEwMCxcbiAgICAgIGsgPSBjbXlrWzNdIC8gMTAwLFxuICAgICAgciwgZywgYjtcblxuICByID0gMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgayk7XG4gIGcgPSAxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKTtcbiAgYiA9IDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspO1xuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufVxuXG5mdW5jdGlvbiBjbXlrMmhzbChhcmdzKSB7XG4gIHJldHVybiByZ2IyaHNsKGNteWsycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gY215azJoc3YoYXJncykge1xuICByZXR1cm4gcmdiMmhzdihjbXlrMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChjbXlrMnJnYihhcmdzKSk7XG59XG5cblxuZnVuY3Rpb24geHl6MnJnYih4eXopIHtcbiAgdmFyIHggPSB4eXpbMF0gLyAxMDAsXG4gICAgICB5ID0geHl6WzFdIC8gMTAwLFxuICAgICAgeiA9IHh5elsyXSAvIDEwMCxcbiAgICAgIHIsIGcsIGI7XG5cbiAgciA9ICh4ICogMy4yNDA2KSArICh5ICogLTEuNTM3MikgKyAoeiAqIC0wLjQ5ODYpO1xuICBnID0gKHggKiAtMC45Njg5KSArICh5ICogMS44NzU4KSArICh6ICogMC4wNDE1KTtcbiAgYiA9ICh4ICogMC4wNTU3KSArICh5ICogLTAuMjA0MCkgKyAoeiAqIDEuMDU3MCk7XG5cbiAgLy8gYXNzdW1lIHNSR0JcbiAgciA9IHIgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3cociwgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IHIgPSAociAqIDEyLjkyKTtcblxuICBnID0gZyA+IDAuMDAzMTMwOCA/ICgoMS4wNTUgKiBNYXRoLnBvdyhnLCAxLjAgLyAyLjQpKSAtIDAuMDU1KVxuICAgIDogZyA9IChnICogMTIuOTIpO1xuICAgICAgICBcbiAgYiA9IGIgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3coYiwgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IGIgPSAoYiAqIDEyLjkyKTtcblxuICByID0gKHIgPCAwKSA/IDAgOiByO1xuICBnID0gKGcgPCAwKSA/IDAgOiBnO1xuICBiID0gKGIgPCAwKSA/IDAgOiBiO1xuXG4gIHJldHVybiBbciAqIDI1NSwgZyAqIDI1NSwgYiAqIDI1NV07XG59XG5cbmZ1bmN0aW9uIHh5ejJsYWIoeHl6KSB7XG4gIHZhciB4ID0geHl6WzBdLFxuICAgICAgeSA9IHh5elsxXSxcbiAgICAgIHogPSB4eXpbMl0sXG4gICAgICBsLCBhLCBiO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxLzMpIDogKDcuNzg3ICogeCkgKyAoMTYgLyAxMTYpO1xuICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMS8zKSA6ICg3Ljc4NyAqIHkpICsgKDE2IC8gMTE2KTtcbiAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEvMykgOiAoNy43ODcgKiB6KSArICgxNiAvIDExNik7XG5cbiAgbCA9ICgxMTYgKiB5KSAtIDE2O1xuICBhID0gNTAwICogKHggLSB5KTtcbiAgYiA9IDIwMCAqICh5IC0geik7XG4gIFxuICByZXR1cm4gW2wsIGEsIGJdO1xufVxuXG5mdW5jdGlvbiBsYWIyeHl6KGxhYikge1xuICB2YXIgbCA9IGxhYlswXSxcbiAgICAgIGEgPSBsYWJbMV0sXG4gICAgICBiID0gbGFiWzJdLFxuICAgICAgeCwgeSwgeiwgeTI7XG5cbiAgaWYgKGwgPD0gOCkge1xuICAgIHkgPSAobCAqIDEwMCkgLyA5MDMuMztcbiAgICB5MiA9ICg3Ljc4NyAqICh5IC8gMTAwKSkgKyAoMTYgLyAxMTYpO1xuICB9IGVsc2Uge1xuICAgIHkgPSAxMDAgKiBNYXRoLnBvdygobCArIDE2KSAvIDExNiwgMyk7XG4gICAgeTIgPSBNYXRoLnBvdyh5IC8gMTAwLCAxLzMpO1xuICB9XG5cbiAgeCA9IHggLyA5NS4wNDcgPD0gMC4wMDg4NTYgPyB4ID0gKDk1LjA0NyAqICgoYSAvIDUwMCkgKyB5MiAtICgxNiAvIDExNikpKSAvIDcuNzg3IDogOTUuMDQ3ICogTWF0aC5wb3coKGEgLyA1MDApICsgeTIsIDMpO1xuXG4gIHogPSB6IC8gMTA4Ljg4MyA8PSAwLjAwODg1OSA/IHogPSAoMTA4Ljg4MyAqICh5MiAtIChiIC8gMjAwKSAtICgxNiAvIDExNikpKSAvIDcuNzg3IDogMTA4Ljg4MyAqIE1hdGgucG93KHkyIC0gKGIgLyAyMDApLCAzKTtcblxuICByZXR1cm4gW3gsIHksIHpdO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMnJnYihrZXl3b3JkKSB7XG4gIHJldHVybiBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJoc2woYXJncykge1xuICByZXR1cm4gcmdiMmhzbChrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyaHN2KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc3Yoa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmNteWsoYXJncykge1xuICByZXR1cm4gcmdiMmNteWsoa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmxhYihhcmdzKSB7XG4gIHJldHVybiByZ2IybGFiKGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJ4eXooYXJncykge1xuICByZXR1cm4gcmdiMnh5eihrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbnZhciBjc3NLZXl3b3JkcyA9IHtcbiAgYWxpY2VibHVlOiAgWzI0MCwyNDgsMjU1XSxcbiAgYW50aXF1ZXdoaXRlOiBbMjUwLDIzNSwyMTVdLFxuICBhcXVhOiBbMCwyNTUsMjU1XSxcbiAgYXF1YW1hcmluZTogWzEyNywyNTUsMjEyXSxcbiAgYXp1cmU6ICBbMjQwLDI1NSwyNTVdLFxuICBiZWlnZTogIFsyNDUsMjQ1LDIyMF0sXG4gIGJpc3F1ZTogWzI1NSwyMjgsMTk2XSxcbiAgYmxhY2s6ICBbMCwwLDBdLFxuICBibGFuY2hlZGFsbW9uZDogWzI1NSwyMzUsMjA1XSxcbiAgYmx1ZTogWzAsMCwyNTVdLFxuICBibHVldmlvbGV0OiBbMTM4LDQzLDIyNl0sXG4gIGJyb3duOiAgWzE2NSw0Miw0Ml0sXG4gIGJ1cmx5d29vZDogIFsyMjIsMTg0LDEzNV0sXG4gIGNhZGV0Ymx1ZTogIFs5NSwxNTgsMTYwXSxcbiAgY2hhcnRyZXVzZTogWzEyNywyNTUsMF0sXG4gIGNob2NvbGF0ZTogIFsyMTAsMTA1LDMwXSxcbiAgY29yYWw6ICBbMjU1LDEyNyw4MF0sXG4gIGNvcm5mbG93ZXJibHVlOiBbMTAwLDE0OSwyMzddLFxuICBjb3Juc2lsazogWzI1NSwyNDgsMjIwXSxcbiAgY3JpbXNvbjogIFsyMjAsMjAsNjBdLFxuICBjeWFuOiBbMCwyNTUsMjU1XSxcbiAgZGFya2JsdWU6IFswLDAsMTM5XSxcbiAgZGFya2N5YW46IFswLDEzOSwxMzldLFxuICBkYXJrZ29sZGVucm9kOiAgWzE4NCwxMzQsMTFdLFxuICBkYXJrZ3JheTogWzE2OSwxNjksMTY5XSxcbiAgZGFya2dyZWVuOiAgWzAsMTAwLDBdLFxuICBkYXJrZ3JleTogWzE2OSwxNjksMTY5XSxcbiAgZGFya2toYWtpOiAgWzE4OSwxODMsMTA3XSxcbiAgZGFya21hZ2VudGE6ICBbMTM5LDAsMTM5XSxcbiAgZGFya29saXZlZ3JlZW46IFs4NSwxMDcsNDddLFxuICBkYXJrb3JhbmdlOiBbMjU1LDE0MCwwXSxcbiAgZGFya29yY2hpZDogWzE1Myw1MCwyMDRdLFxuICBkYXJrcmVkOiAgWzEzOSwwLDBdLFxuICBkYXJrc2FsbW9uOiBbMjMzLDE1MCwxMjJdLFxuICBkYXJrc2VhZ3JlZW46IFsxNDMsMTg4LDE0M10sXG4gIGRhcmtzbGF0ZWJsdWU6ICBbNzIsNjEsMTM5XSxcbiAgZGFya3NsYXRlZ3JheTogIFs0Nyw3OSw3OV0sXG4gIGRhcmtzbGF0ZWdyZXk6ICBbNDcsNzksNzldLFxuICBkYXJrdHVycXVvaXNlOiAgWzAsMjA2LDIwOV0sXG4gIGRhcmt2aW9sZXQ6IFsxNDgsMCwyMTFdLFxuICBkZWVwcGluazogWzI1NSwyMCwxNDddLFxuICBkZWVwc2t5Ymx1ZTogIFswLDE5MSwyNTVdLFxuICBkaW1ncmF5OiAgWzEwNSwxMDUsMTA1XSxcbiAgZGltZ3JleTogIFsxMDUsMTA1LDEwNV0sXG4gIGRvZGdlcmJsdWU6IFszMCwxNDQsMjU1XSxcbiAgZmlyZWJyaWNrOiAgWzE3OCwzNCwzNF0sXG4gIGZsb3JhbHdoaXRlOiAgWzI1NSwyNTAsMjQwXSxcbiAgZm9yZXN0Z3JlZW46ICBbMzQsMTM5LDM0XSxcbiAgZnVjaHNpYTogIFsyNTUsMCwyNTVdLFxuICBnYWluc2Jvcm86ICBbMjIwLDIyMCwyMjBdLFxuICBnaG9zdHdoaXRlOiBbMjQ4LDI0OCwyNTVdLFxuICBnb2xkOiBbMjU1LDIxNSwwXSxcbiAgZ29sZGVucm9kOiAgWzIxOCwxNjUsMzJdLFxuICBncmF5OiBbMTI4LDEyOCwxMjhdLFxuICBncmVlbjogIFswLDEyOCwwXSxcbiAgZ3JlZW55ZWxsb3c6ICBbMTczLDI1NSw0N10sXG4gIGdyZXk6IFsxMjgsMTI4LDEyOF0sXG4gIGhvbmV5ZGV3OiBbMjQwLDI1NSwyNDBdLFxuICBob3RwaW5rOiAgWzI1NSwxMDUsMTgwXSxcbiAgaW5kaWFucmVkOiAgWzIwNSw5Miw5Ml0sXG4gIGluZGlnbzogWzc1LDAsMTMwXSxcbiAgaXZvcnk6ICBbMjU1LDI1NSwyNDBdLFxuICBraGFraTogIFsyNDAsMjMwLDE0MF0sXG4gIGxhdmVuZGVyOiBbMjMwLDIzMCwyNTBdLFxuICBsYXZlbmRlcmJsdXNoOiAgWzI1NSwyNDAsMjQ1XSxcbiAgbGF3bmdyZWVuOiAgWzEyNCwyNTIsMF0sXG4gIGxlbW9uY2hpZmZvbjogWzI1NSwyNTAsMjA1XSxcbiAgbGlnaHRibHVlOiAgWzE3MywyMTYsMjMwXSxcbiAgbGlnaHRjb3JhbDogWzI0MCwxMjgsMTI4XSxcbiAgbGlnaHRjeWFuOiAgWzIyNCwyNTUsMjU1XSxcbiAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IFsyNTAsMjUwLDIxMF0sXG4gIGxpZ2h0Z3JheTogIFsyMTEsMjExLDIxMV0sXG4gIGxpZ2h0Z3JlZW46IFsxNDQsMjM4LDE0NF0sXG4gIGxpZ2h0Z3JleTogIFsyMTEsMjExLDIxMV0sXG4gIGxpZ2h0cGluazogIFsyNTUsMTgyLDE5M10sXG4gIGxpZ2h0c2FsbW9uOiAgWzI1NSwxNjAsMTIyXSxcbiAgbGlnaHRzZWFncmVlbjogIFszMiwxNzgsMTcwXSxcbiAgbGlnaHRza3libHVlOiBbMTM1LDIwNiwyNTBdLFxuICBsaWdodHNsYXRlZ3JheTogWzExOSwxMzYsMTUzXSxcbiAgbGlnaHRzbGF0ZWdyZXk6IFsxMTksMTM2LDE1M10sXG4gIGxpZ2h0c3RlZWxibHVlOiBbMTc2LDE5NiwyMjJdLFxuICBsaWdodHllbGxvdzogIFsyNTUsMjU1LDIyNF0sXG4gIGxpbWU6IFswLDI1NSwwXSxcbiAgbGltZWdyZWVuOiAgWzUwLDIwNSw1MF0sXG4gIGxpbmVuOiAgWzI1MCwyNDAsMjMwXSxcbiAgbWFnZW50YTogIFsyNTUsMCwyNTVdLFxuICBtYXJvb246IFsxMjgsMCwwXSxcbiAgbWVkaXVtYXF1YW1hcmluZTogWzEwMiwyMDUsMTcwXSxcbiAgbWVkaXVtYmx1ZTogWzAsMCwyMDVdLFxuICBtZWRpdW1vcmNoaWQ6IFsxODYsODUsMjExXSxcbiAgbWVkaXVtcHVycGxlOiBbMTQ3LDExMiwyMTldLFxuICBtZWRpdW1zZWFncmVlbjogWzYwLDE3OSwxMTNdLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICBbMTIzLDEwNCwyMzhdLFxuICBtZWRpdW1zcHJpbmdncmVlbjogIFswLDI1MCwxNTRdLFxuICBtZWRpdW10dXJxdW9pc2U6ICBbNzIsMjA5LDIwNF0sXG4gIG1lZGl1bXZpb2xldHJlZDogIFsxOTksMjEsMTMzXSxcbiAgbWlkbmlnaHRibHVlOiBbMjUsMjUsMTEyXSxcbiAgbWludGNyZWFtOiAgWzI0NSwyNTUsMjUwXSxcbiAgbWlzdHlyb3NlOiAgWzI1NSwyMjgsMjI1XSxcbiAgbW9jY2FzaW46IFsyNTUsMjI4LDE4MV0sXG4gIG5hdmFqb3doaXRlOiAgWzI1NSwyMjIsMTczXSxcbiAgbmF2eTogWzAsMCwxMjhdLFxuICBvbGRsYWNlOiAgWzI1MywyNDUsMjMwXSxcbiAgb2xpdmU6ICBbMTI4LDEyOCwwXSxcbiAgb2xpdmVkcmFiOiAgWzEwNywxNDIsMzVdLFxuICBvcmFuZ2U6IFsyNTUsMTY1LDBdLFxuICBvcmFuZ2VyZWQ6ICBbMjU1LDY5LDBdLFxuICBvcmNoaWQ6IFsyMTgsMTEyLDIxNF0sXG4gIHBhbGVnb2xkZW5yb2Q6ICBbMjM4LDIzMiwxNzBdLFxuICBwYWxlZ3JlZW46ICBbMTUyLDI1MSwxNTJdLFxuICBwYWxldHVycXVvaXNlOiAgWzE3NSwyMzgsMjM4XSxcbiAgcGFsZXZpb2xldHJlZDogIFsyMTksMTEyLDE0N10sXG4gIHBhcGF5YXdoaXA6IFsyNTUsMjM5LDIxM10sXG4gIHBlYWNocHVmZjogIFsyNTUsMjE4LDE4NV0sXG4gIHBlcnU6IFsyMDUsMTMzLDYzXSxcbiAgcGluazogWzI1NSwxOTIsMjAzXSxcbiAgcGx1bTogWzIyMSwxNjAsMjIxXSxcbiAgcG93ZGVyYmx1ZTogWzE3NiwyMjQsMjMwXSxcbiAgcHVycGxlOiBbMTI4LDAsMTI4XSxcbiAgcmVkOiAgWzI1NSwwLDBdLFxuICByb3N5YnJvd246ICBbMTg4LDE0MywxNDNdLFxuICByb3lhbGJsdWU6ICBbNjUsMTA1LDIyNV0sXG4gIHNhZGRsZWJyb3duOiAgWzEzOSw2OSwxOV0sXG4gIHNhbG1vbjogWzI1MCwxMjgsMTE0XSxcbiAgc2FuZHlicm93bjogWzI0NCwxNjQsOTZdLFxuICBzZWFncmVlbjogWzQ2LDEzOSw4N10sXG4gIHNlYXNoZWxsOiBbMjU1LDI0NSwyMzhdLFxuICBzaWVubmE6IFsxNjAsODIsNDVdLFxuICBzaWx2ZXI6IFsxOTIsMTkyLDE5Ml0sXG4gIHNreWJsdWU6ICBbMTM1LDIwNiwyMzVdLFxuICBzbGF0ZWJsdWU6ICBbMTA2LDkwLDIwNV0sXG4gIHNsYXRlZ3JheTogIFsxMTIsMTI4LDE0NF0sXG4gIHNsYXRlZ3JleTogIFsxMTIsMTI4LDE0NF0sXG4gIHNub3c6IFsyNTUsMjUwLDI1MF0sXG4gIHNwcmluZ2dyZWVuOiAgWzAsMjU1LDEyN10sXG4gIHN0ZWVsYmx1ZTogIFs3MCwxMzAsMTgwXSxcbiAgdGFuOiAgWzIxMCwxODAsMTQwXSxcbiAgdGVhbDogWzAsMTI4LDEyOF0sXG4gIHRoaXN0bGU6ICBbMjE2LDE5MSwyMTZdLFxuICB0b21hdG86IFsyNTUsOTksNzFdLFxuICB0dXJxdW9pc2U6ICBbNjQsMjI0LDIwOF0sXG4gIHZpb2xldDogWzIzOCwxMzAsMjM4XSxcbiAgd2hlYXQ6ICBbMjQ1LDIyMiwxNzldLFxuICB3aGl0ZTogIFsyNTUsMjU1LDI1NV0sXG4gIHdoaXRlc21va2U6IFsyNDUsMjQ1LDI0NV0sXG4gIHllbGxvdzogWzI1NSwyNTUsMF0sXG4gIHllbGxvd2dyZWVuOiAgWzE1NCwyMDUsNTBdXG59O1xuXG52YXIgcmV2ZXJzZUtleXdvcmRzID0ge307XG5mb3IgKHZhciBrZXkgaW4gY3NzS2V5d29yZHMpIHtcbiAgcmV2ZXJzZUtleXdvcmRzW0pTT04uc3RyaW5naWZ5KGNzc0tleXdvcmRzW2tleV0pXSA9IGtleTtcbn1cbiIsInZhciBjb252ZXJzaW9ucyA9IHJlcXVpcmUoXCIuL2NvbnZlcnNpb25zXCIpO1xuXG52YXIgY29udmVydCA9IGZ1bmN0aW9uKCkge1xuICAgcmV0dXJuIG5ldyBDb252ZXJ0ZXIoKTtcbn1cblxuZm9yICh2YXIgZnVuYyBpbiBjb252ZXJzaW9ucykge1xuICAvLyBleHBvcnQgUmF3IHZlcnNpb25zXG4gIGNvbnZlcnRbZnVuYyArIFwiUmF3XCJdID0gIChmdW5jdGlvbihmdW5jKSB7XG4gICAgLy8gYWNjZXB0IGFycmF5IG9yIHBsYWluIGFyZ3NcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PSBcIm51bWJlclwiKVxuICAgICAgICBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGNvbnZlcnNpb25zW2Z1bmNdKGFyZyk7XG4gICAgfVxuICB9KShmdW5jKTtcblxuICB2YXIgcGFpciA9IC8oXFx3KykyKFxcdyspLy5leGVjKGZ1bmMpLFxuICAgICAgZnJvbSA9IHBhaXJbMV0sXG4gICAgICB0byA9IHBhaXJbMl07XG5cbiAgLy8gZXhwb3J0IHJnYjJoc2wgYW5kIFtcInJnYlwiXVtcImhzbFwiXVxuICBjb252ZXJ0W2Zyb21dID0gY29udmVydFtmcm9tXSB8fCB7fTtcblxuICBjb252ZXJ0W2Zyb21dW3RvXSA9IGNvbnZlcnRbZnVuY10gPSAoZnVuY3Rpb24oZnVuYykgeyBcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PSBcIm51bWJlclwiKVxuICAgICAgICBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgXG4gICAgICB2YXIgdmFsID0gY29udmVyc2lvbnNbZnVuY10oYXJnKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsID09IFwic3RyaW5nXCIgfHwgdmFsID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB2YWw7IC8vIGtleXdvcmRcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspXG4gICAgICAgIHZhbFtpXSA9IE1hdGgucm91bmQodmFsW2ldKTtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICB9KShmdW5jKTtcbn1cblxuXG4vKiBDb252ZXJ0ZXIgZG9lcyBsYXp5IGNvbnZlcnNpb24gYW5kIGNhY2hpbmcgKi9cbnZhciBDb252ZXJ0ZXIgPSBmdW5jdGlvbigpIHtcbiAgIHRoaXMuY29udnMgPSB7fTtcbn07XG5cbi8qIEVpdGhlciBnZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZSBvclxuICBzZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZSwgZGVwZW5kaW5nIG9uIGFyZ3MgKi9cbkNvbnZlcnRlci5wcm90b3R5cGUucm91dGVTcGFjZSA9IGZ1bmN0aW9uKHNwYWNlLCBhcmdzKSB7XG4gICB2YXIgdmFsdWVzID0gYXJnc1swXTtcbiAgIGlmICh2YWx1ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gY29sb3IucmdiKClcbiAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlcyhzcGFjZSk7XG4gICB9XG4gICAvLyBjb2xvci5yZ2IoMTAsIDEwLCAxMClcbiAgIGlmICh0eXBlb2YgdmFsdWVzID09IFwibnVtYmVyXCIpIHtcbiAgICAgIHZhbHVlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpOyAgICAgICAgXG4gICB9XG5cbiAgIHJldHVybiB0aGlzLnNldFZhbHVlcyhzcGFjZSwgdmFsdWVzKTtcbn07XG4gIFxuLyogU2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2UsIGludmFsaWRhdGluZyBjYWNoZSAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5zZXRWYWx1ZXMgPSBmdW5jdGlvbihzcGFjZSwgdmFsdWVzKSB7XG4gICB0aGlzLnNwYWNlID0gc3BhY2U7XG4gICB0aGlzLmNvbnZzID0ge307XG4gICB0aGlzLmNvbnZzW3NwYWNlXSA9IHZhbHVlcztcbiAgIHJldHVybiB0aGlzO1xufTtcblxuLyogR2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2UuIElmIHRoZXJlJ3MgYWxyZWFkeVxuICBhIGNvbnZlcnNpb24gZm9yIHRoZSBzcGFjZSwgZmV0Y2ggaXQsIG90aGVyd2lzZVxuICBjb21wdXRlIGl0ICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLmdldFZhbHVlcyA9IGZ1bmN0aW9uKHNwYWNlKSB7XG4gICB2YXIgdmFscyA9IHRoaXMuY29udnNbc3BhY2VdO1xuICAgaWYgKCF2YWxzKSB7XG4gICAgICB2YXIgZnNwYWNlID0gdGhpcy5zcGFjZSxcbiAgICAgICAgICBmcm9tID0gdGhpcy5jb252c1tmc3BhY2VdO1xuICAgICAgdmFscyA9IGNvbnZlcnRbZnNwYWNlXVtzcGFjZV0oZnJvbSk7XG5cbiAgICAgIHRoaXMuY29udnNbc3BhY2VdID0gdmFscztcbiAgIH1cbiAgcmV0dXJuIHZhbHM7XG59O1xuXG5bXCJyZ2JcIiwgXCJoc2xcIiwgXCJoc3ZcIiwgXCJjbXlrXCIsIFwia2V5d29yZFwiXS5mb3JFYWNoKGZ1bmN0aW9uKHNwYWNlKSB7XG4gICBDb252ZXJ0ZXIucHJvdG90eXBlW3NwYWNlXSA9IGZ1bmN0aW9uKHZhbHMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJvdXRlU3BhY2Uoc3BhY2UsIGFyZ3VtZW50cyk7XG4gICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb252ZXJ0OyIsIi8qIVxyXG4gKiBAbmFtZSBKYXZhU2NyaXB0L05vZGVKUyBNZXJnZSB2MS4xLjJcclxuICogQGF1dGhvciB5ZWlrb3NcclxuICogQHJlcG9zaXRvcnkgaHR0cHM6Ly9naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZVxyXG5cclxuICogQ29weXJpZ2h0IDIwMTMgeWVpa29zIC0gTUlUIGxpY2Vuc2VcclxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2UvbWFzdGVyL0xJQ0VOU0VcclxuICovXHJcblxyXG47KGZ1bmN0aW9uKGlzTm9kZSkge1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZSgpIHtcclxuXHJcblx0XHR2YXIgaXRlbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG5cdFx0XHRyZXN1bHQgPSBpdGVtcy5zaGlmdCgpLFxyXG5cdFx0XHRkZWVwID0gKHJlc3VsdCA9PT0gdHJ1ZSksXHJcblx0XHRcdHNpemUgPSBpdGVtcy5sZW5ndGgsXHJcblx0XHRcdGl0ZW0sIGluZGV4LCBrZXk7XHJcblxyXG5cdFx0aWYgKGRlZXAgfHwgdHlwZU9mKHJlc3VsdCkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmVzdWx0ID0ge307XHJcblxyXG5cdFx0Zm9yIChpbmRleD0wO2luZGV4PHNpemU7KytpbmRleClcclxuXHJcblx0XHRcdGlmICh0eXBlT2YoaXRlbSA9IGl0ZW1zW2luZGV4XSkgPT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0XHRmb3IgKGtleSBpbiBpdGVtKVxyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gZGVlcCA/IGNsb25lKGl0ZW1ba2V5XSkgOiBpdGVtW2tleV07XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbG9uZShpbnB1dCkge1xyXG5cclxuXHRcdHZhciBvdXRwdXQgPSBpbnB1dCxcclxuXHRcdFx0dHlwZSA9IHR5cGVPZihpbnB1dCksXHJcblx0XHRcdGluZGV4LCBzaXplO1xyXG5cclxuXHRcdGlmICh0eXBlID09PSAnYXJyYXknKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSBbXTtcclxuXHRcdFx0c2l6ZSA9IGlucHV0Lmxlbmd0aDtcclxuXHJcblx0XHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBjbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IHt9O1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleCBpbiBpbnB1dClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IGNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdHlwZU9mKGlucHV0KSB7XHJcblxyXG5cdFx0cmV0dXJuICh7fSkudG9TdHJpbmcuY2FsbChpbnB1dCkubWF0Y2goL1xccyhbXFx3XSspLylbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcblx0fVxyXG5cclxuXHRpZiAoaXNOb2RlKSB7XHJcblxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBtZXJnZTtcclxuXHJcblx0fSBlbHNlIHtcclxuXHJcblx0XHR3aW5kb3cubWVyZ2UgPSBtZXJnZTtcclxuXHJcblx0fVxyXG5cclxufSkodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbjsoZnVuY3Rpb24gKGNvbW1vbmpzKSB7XG4gIGZ1bmN0aW9uIGVycm9yT2JqZWN0KGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGVycm9yLm5hbWUsXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVDYWxsc0Zyb21Pd25lcihmdW5jdGlvbnMsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBMZXQgdGhlIG90aGVyIHNpZGUga25vdyBhYm91dCBvdXIgZnVuY3Rpb25zIGlmIHRoZXkgY2FuJ3QgdXNlIFByb3h5LlxuICAgICAgdmFyIG5hbWVzID0gW107XG4gICAgICBmb3IgKHZhciBuYW1lIGluIGZ1bmN0aW9ucykgbmFtZXMucHVzaChuYW1lKTtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2Z1bmN0aW9uTmFtZXM6IG5hbWVzfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2soaWQpIHtcbiAgICAgIGZ1bmN0aW9uIGNhbGxiYWNrKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2NhbGxSZXNwb25zZTogaWQsIGFyZ3VtZW50czogYXJnc30pO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjay5fYXV0b0Rpc2FibGVkID0gZmFsc2U7XG4gICAgICBjYWxsYmFjay5kaXNhYmxlQXV0byA9IGZ1bmN0aW9uICgpIHsgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IHRydWU7IH07XG5cbiAgICAgIGNhbGxiYWNrLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2NhbGxSZXNwb25zZTogaWQsIGFyZ3VtZW50czogYXJnc30sIHRyYW5zZmVyTGlzdCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgICBpZiAobWVzc2FnZS5jYWxsKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxJZDtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQuXG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uc1ttZXNzYWdlLmNhbGxdO1xuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBjYWxsUmVzcG9uc2U6IGNhbGxJZCxcbiAgICAgICAgICAgIGFyZ3VtZW50czogW2Vycm9yT2JqZWN0KG5ldyBFcnJvcignVGhhdCBmdW5jdGlvbiBkb2VzIG5vdCBleGlzdCcpKV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IG1lc3NhZ2UuYXJndW1lbnRzIHx8IFtdO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjcmVhdGVDYWxsYmFjayhjYWxsSWQpO1xuICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2F0Y2hFcnJvcnMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBmbi5hcHBseShmdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yT2JqZWN0KGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuVmFsdWUgPSBmbi5hcHBseShmdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIG9wdGlvbiBmb3IgaXQgaXMgZW5hYmxlZCwgYXV0b21hdGljYWxseSBjYWxsIHRoZSBjYWxsYmFjay5cbiAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0NhbGxiYWNrICYmICFjYWxsYmFjay5fYXV0b0Rpc2FibGVkKSB7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV0dXJuVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kQ2FsbHNUb1dvcmtlcih3b3JrZXJzLCBvcHRpb25zKSB7XG4gICAgdmFyIGNhY2hlID0ge30sXG4gICAgICAgIGNhbGxiYWNrcyA9IHt9LFxuICAgICAgICB0aW1lcnMsXG4gICAgICAgIG5leHRDYWxsSWQgPSAxLFxuICAgICAgICBmYWtlUHJveHksXG4gICAgICAgIHF1ZXVlID0gW107XG5cbiAgICAvLyBDcmVhdGUgYW4gYXJyYXkgb2YgbnVtYmVyIG9mIHBlbmRpbmcgdGFza3MgZm9yIGVhY2ggd29ya2VyLlxuICAgIHZhciBwZW5kaW5nID0gd29ya2Vycy5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gMDsgfSk7XG5cbiAgICAvLyBFYWNoIGluZGl2aWR1YWwgY2FsbCBnZXRzIGEgdGltZXIgaWYgdGltaW5nIGNhbGxzLlxuICAgIGlmIChvcHRpb25zLnRpbWVDYWxscykgdGltZXJzID0ge307XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIG5vIFByb3h5IHN1cHBvcnQsIHdlIGhhdmUgdG8gcHJlLWRlZmluZSBhbGwgdGhlIGZ1bmN0aW9ucy5cbiAgICAgIGZha2VQcm94eSA9IHtwZW5kaW5nQ2FsbHM6IDB9O1xuICAgICAgb3B0aW9ucy5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgZmFrZVByb3h5W25hbWVdID0gZ2V0SGFuZGxlcihudWxsLCBuYW1lKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE51bVBlbmRpbmdDYWxscygpIHtcbiAgICAgIHJldHVybiBxdWV1ZS5sZW5ndGggKyBwZW5kaW5nLnJlZHVjZShmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCArIHk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEhhbmRsZXIoXywgbmFtZSkge1xuICAgICAgaWYgKG5hbWUgPT0gJ3BlbmRpbmdDYWxscycpIHJldHVybiBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcbiAgICAgIGlmIChjYWNoZVtuYW1lXSkgcmV0dXJuIGNhY2hlW25hbWVdO1xuXG4gICAgICB2YXIgZm4gPSBjYWNoZVtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBTZW5kcyB0aGUgc2FtZSBjYWxsIHRvIGFsbCB3b3JrZXJzLlxuICAgICAgZm4uYnJvYWRjYXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHNlbmRDYWxsKGksIG5hbWUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmYWtlUHJveHkpIGZha2VQcm94eS5wZW5kaW5nQ2FsbHMgPSBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIE1hcmtzIHRoZSBvYmplY3RzIGluIHRoZSBmaXJzdCBhcmd1bWVudCAoYXJyYXkpIGFzIHRyYW5zZmVyYWJsZS5cbiAgICAgIGZuLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHF1ZXVlQ2FsbChuYW1lLCBhcmdzLCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGZuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZsdXNoUXVldWUoKSB7XG4gICAgICAvLyBLZWVwIHRoZSBmYWtlIHByb3h5IHBlbmRpbmcgY291bnQgdXAtdG8tZGF0ZS5cbiAgICAgIGlmIChmYWtlUHJveHkpIGZha2VQcm94eS5wZW5kaW5nQ2FsbHMgPSBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcblxuICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwZW5kaW5nW2ldKSBjb250aW51ZTtcblxuICAgICAgICAvLyBBIHdvcmtlciBpcyBhdmFpbGFibGUuXG4gICAgICAgIHZhciBwYXJhbXMgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBzZW5kQ2FsbChpLCBwYXJhbXNbMF0sIHBhcmFtc1sxXSwgcGFyYW1zWzJdKTtcblxuICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHF1ZXVlQ2FsbChuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICBxdWV1ZS5wdXNoKFtuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0XSk7XG4gICAgICBmbHVzaFF1ZXVlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VuZENhbGwod29ya2VySW5kZXgsIG5hbWUsIGFyZ3MsIG9wdF90cmFuc2Zlckxpc3QpIHtcbiAgICAgIC8vIEdldCB0aGUgd29ya2VyIGFuZCBpbmRpY2F0ZSB0aGF0IGl0IGhhcyBhIHBlbmRpbmcgdGFzay5cbiAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdKys7XG4gICAgICB2YXIgd29ya2VyID0gd29ya2Vyc1t3b3JrZXJJbmRleF07XG5cbiAgICAgIHZhciBpZCA9IG5leHRDYWxsSWQrKztcblxuICAgICAgLy8gSWYgdGhlIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgYXNzdW1lIGl0J3MgdGhlIGNhbGxiYWNrLlxuICAgICAgdmFyIG1heWJlQ2IgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICBpZiAodHlwZW9mIG1heWJlQ2IgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFja3NbaWRdID0gbWF5YmVDYjtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBzcGVjaWZpZWQsIHRpbWUgY2FsbHMgdXNpbmcgdGhlIGNvbnNvbGUudGltZSBpbnRlcmZhY2UuXG4gICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHtcbiAgICAgICAgdmFyIHRpbWVySWQgPSBuYW1lICsgJygnICsgYXJncy5qb2luKCcsICcpICsgJyknO1xuICAgICAgICB0aW1lcnNbaWRdID0gdGltZXJJZDtcbiAgICAgICAgY29uc29sZS50aW1lKHRpbWVySWQpO1xuICAgICAgfVxuXG4gICAgICB3b3JrZXIucG9zdE1lc3NhZ2Uoe2NhbGxJZDogaWQsIGNhbGw6IG5hbWUsIGFyZ3VtZW50czogYXJnc30sIG9wdF90cmFuc2Zlckxpc3QpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RlbmVyKGUpIHtcbiAgICAgIHZhciB3b3JrZXJJbmRleCA9IHdvcmtlcnMuaW5kZXhPZih0aGlzKTtcbiAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgICBpZiAobWVzc2FnZS5jYWxsUmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGNhbGxJZCA9IG1lc3NhZ2UuY2FsbFJlc3BvbnNlO1xuXG4gICAgICAgIC8vIENhbGwgdGhlIGNhbGxiYWNrIHJlZ2lzdGVyZWQgZm9yIHRoaXMgY2FsbCAoaWYgYW55KS5cbiAgICAgICAgaWYgKGNhbGxiYWNrc1tjYWxsSWRdKSB7XG4gICAgICAgICAgY2FsbGJhY2tzW2NhbGxJZF0uYXBwbHkobnVsbCwgbWVzc2FnZS5hcmd1bWVudHMpO1xuICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlcG9ydCB0aW1pbmcsIGlmIHRoYXQgb3B0aW9uIGlzIGVuYWJsZWQuXG4gICAgICAgIGlmIChvcHRpb25zLnRpbWVDYWxscyAmJiB0aW1lcnNbY2FsbElkXSkge1xuICAgICAgICAgIGNvbnNvbGUudGltZUVuZCh0aW1lcnNbY2FsbElkXSk7XG4gICAgICAgICAgZGVsZXRlIHRpbWVyc1tjYWxsSWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIHRhc2sgaXMgbm8gbG9uZ2VyIHBlbmRpbmcgb24gdGhlIHdvcmtlci5cbiAgICAgICAgcGVuZGluZ1t3b3JrZXJJbmRleF0tLTtcbiAgICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmZ1bmN0aW9uTmFtZXMpIHtcbiAgICAgICAgLy8gUmVjZWl2ZWQgYSBsaXN0IG9mIGF2YWlsYWJsZSBmdW5jdGlvbnMuIE9ubHkgdXNlZnVsIGZvciBmYWtlIHByb3h5LlxuICAgICAgICBtZXNzYWdlLmZ1bmN0aW9uTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExpc3RlbiB0byBtZXNzYWdlcyBmcm9tIGFsbCB0aGUgd29ya2Vycy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHdvcmtlcnNbaV0uYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFrZVByb3h5O1xuICAgIH0gZWxzZSBpZiAoUHJveHkuY3JlYXRlKSB7XG4gICAgICByZXR1cm4gUHJveHkuY3JlYXRlKHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm94eSh7fSwge2dldDogZ2V0SGFuZGxlcn0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBlaXRoZXIgYSBXb3JrZXIgaW5zdGFuY2UsIGEgbGlzdCBvZiB0aGVtLCBvciBhIG1hcFxuICAgKiBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkIGluc2lkZSB0aGUgd29ya2VyLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlV29ya2VyUHJveHkod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRfb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgLy8gQXV0b21hdGljYWxseSBjYWxsIHRoZSBjYWxsYmFjayBhZnRlciBhIGNhbGwgaWYgdGhlIHJldHVybiB2YWx1ZSBpcyBub3RcbiAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgIGF1dG9DYWxsYmFjazogZmFsc2UsXG4gICAgICAvLyBDYXRjaCBlcnJvcnMgYW5kIGF1dG9tYXRpY2FsbHkgcmVzcG9uZCB3aXRoIGFuIGVycm9yIGNhbGxiYWNrLiBPZmYgYnlcbiAgICAgIC8vIGRlZmF1bHQgc2luY2UgaXQgYnJlYWtzIHN0YW5kYXJkIGJlaGF2aW9yLlxuICAgICAgY2F0Y2hFcnJvcnM6IGZhbHNlLFxuICAgICAgLy8gQSBsaXN0IG9mIGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSBjYWxsZWQuIFRoaXMgbGlzdCB3aWxsIGJlIHVzZWQgdG8gbWFrZVxuICAgICAgLy8gdGhlIHByb3h5IGZ1bmN0aW9ucyBhdmFpbGFibGUgd2hlbiBQcm94eSBpcyBub3Qgc3VwcG9ydGVkLiBOb3RlIHRoYXRcbiAgICAgIC8vIHRoaXMgaXMgZ2VuZXJhbGx5IG5vdCBuZWVkZWQgc2luY2UgdGhlIHdvcmtlciB3aWxsIGFsc28gcHVibGlzaCBpdHNcbiAgICAgIC8vIGtub3duIGZ1bmN0aW9ucy5cbiAgICAgIGZ1bmN0aW9uTmFtZXM6IFtdLFxuICAgICAgLy8gQ2FsbCBjb25zb2xlLnRpbWUgYW5kIGNvbnNvbGUudGltZUVuZCBmb3IgY2FsbHMgc2VudCB0aG91Z2ggdGhlIHByb3h5LlxuICAgICAgdGltZUNhbGxzOiBmYWxzZVxuICAgIH07XG5cbiAgICBpZiAob3B0X29wdGlvbnMpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvcHRfb3B0aW9ucykge1xuICAgICAgICBpZiAoIShrZXkgaW4gb3B0aW9ucykpIGNvbnRpbnVlO1xuICAgICAgICBvcHRpb25zW2tleV0gPSBvcHRfb3B0aW9uc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZnJlZXplKG9wdGlvbnMpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhbiBhcnJheSBvZiB3b3JrZXJzIChldmVuIGlmIG9ubHkgdXNpbmcgb25lIHdvcmtlcikuXG4gICAgaWYgKHR5cGVvZiBXb3JrZXIgIT0gJ3VuZGVmaW5lZCcgJiYgKHdvcmtlcnNPckZ1bmN0aW9ucyBpbnN0YW5jZW9mIFdvcmtlcikpIHtcbiAgICAgIHdvcmtlcnNPckZ1bmN0aW9ucyA9IFt3b3JrZXJzT3JGdW5jdGlvbnNdO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHdvcmtlcnNPckZ1bmN0aW9ucykpIHtcbiAgICAgIHJldHVybiBzZW5kQ2FsbHNUb1dvcmtlcih3b3JrZXJzT3JGdW5jdGlvbnMsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlQ2FsbHNGcm9tT3duZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tbW9uanMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVdvcmtlclByb3h5O1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29wZTtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBnbG9iYWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHdpbmRvdztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHNlbGY7XG4gICAgfVxuXG4gICAgc2NvcGUuY3JlYXRlV29ya2VyUHJveHkgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfVxufSkodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiZXhwb3J0cy5Xb3JsZE1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi93b3JsZG1hbmFnZXInKTtcbmV4cG9ydHMuV29ybGRSZW5kZXJlciA9IHJlcXVpcmUoJy4vbGliL3dvcmxkcmVuZGVyZXInKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVnaW9uUmVuZGVyZXI7XG5cblxudmFyIFRJTEVTX1ggPSAzMjtcbnZhciBUSUxFU19ZID0gMzI7XG52YXIgVElMRVNfUEVSX1JFR0lPTiA9IFRJTEVTX1ggKiBUSUxFU19ZO1xuXG52YXIgSEVBREVSX0JZVEVTID0gMztcbnZhciBCWVRFU19QRVJfVElMRSA9IDIzO1xudmFyIEJZVEVTX1BFUl9ST1cgPSBCWVRFU19QRVJfVElMRSAqIFRJTEVTX1g7XG52YXIgQllURVNfUEVSX1JFR0lPTiA9IEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9USUxFICogVElMRVNfUEVSX1JFR0lPTjtcblxudmFyIFRJTEVfV0lEVEggPSA4O1xudmFyIFRJTEVfSEVJR0hUID0gODtcblxudmFyIFJFR0lPTl9XSURUSCA9IFRJTEVfV0lEVEggKiBUSUxFU19YO1xudmFyIFJFR0lPTl9IRUlHSFQgPSBUSUxFX0hFSUdIVCAqIFRJTEVTX1k7XG5cblxuZnVuY3Rpb24gZ2V0SW50MTYocmVnaW9uLCBvZmZzZXQpIHtcbiAgaWYgKHJlZ2lvbiAmJiByZWdpb24udmlldykgcmV0dXJuIHJlZ2lvbi52aWV3LmdldEludDE2KG9mZnNldCk7XG59XG5cbmZ1bmN0aW9uIGdldE9yaWVudGF0aW9uKG9yaWVudGF0aW9ucywgaW5kZXgpIHtcbiAgdmFyIGN1ckluZGV4ID0gMCwgaW1hZ2UsIGRpcmVjdGlvbjtcblxuICAvLyBUaGlzIGlzIGEgdHJlbWVuZG91cyBhbW91bnQgb2YgbG9naWMgZm9yIGRlY2lkaW5nIHdoaWNoIGltYWdlIHRvIHVzZS4uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWVudGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvID0gb3JpZW50YXRpb25zW2ldO1xuICAgIGlmIChjdXJJbmRleCA9PSBpbmRleCkge1xuICAgICAgaWYgKG8uaW1hZ2VMYXllcnMpIHtcbiAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBtdWx0aXBsZSBsYXllcnMuXG4gICAgICAgIGltYWdlID0gby5pbWFnZUxheWVyc1swXS5pbWFnZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlID0gby5pbWFnZSB8fCBvLmxlZnRJbWFnZSB8fCBvLmR1YWxJbWFnZTtcbiAgICAgIH1cbiAgICAgIGRpcmVjdGlvbiA9IG8uZGlyZWN0aW9uIHx8ICdsZWZ0JztcbiAgICAgIGlmICghaW1hZ2UpIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCBpbWFnZSBmb3Igb3JpZW50YXRpb24nKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGN1ckluZGV4Kys7XG5cbiAgICBpZiAoby5kdWFsSW1hZ2UgfHwgby5yaWdodEltYWdlKSB7XG4gICAgICBpZiAoY3VySW5kZXggPT0gaW5kZXgpIHtcbiAgICAgICAgaW1hZ2UgPSBvLnJpZ2h0SW1hZ2UgfHwgby5kdWFsSW1hZ2U7XG4gICAgICAgIGRpcmVjdGlvbiA9ICdyaWdodCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjdXJJbmRleCsrO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaW1hZ2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBnZXQgb3JpZW50YXRpb24nKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW1hZ2U6IGltYWdlLFxuICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLFxuICAgIGZsaXA6IG8uZmxpcEltYWdlcyB8fCAhIShvLmR1YWxJbWFnZSAmJiBkaXJlY3Rpb24gPT0gJ2xlZnQnKSxcbiAgICBpbmZvOiBvXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFVpbnQ4KHJlZ2lvbiwgb2Zmc2V0KSB7XG4gIGlmIChyZWdpb24gJiYgcmVnaW9uLnZpZXcpIHJldHVybiByZWdpb24udmlldy5nZXRVaW50OChvZmZzZXQpO1xufVxuXG5cbmZ1bmN0aW9uIFJlZ2lvblJlbmRlcmVyKHgsIHkpIHtcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcblxuICB0aGlzLmVudGl0aWVzID0gbnVsbDtcbiAgdGhpcy52aWV3ID0gbnVsbDtcblxuICB0aGlzLm5laWdoYm9ycyA9IG51bGw7XG4gIHRoaXMuc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9VTklOSVRJQUxJWkVEO1xuXG4gIC8vIFdoZXRoZXIgYSBsYXllciBuZWVkcyB0byBiZSByZXJlbmRlcmVkLlxuICB0aGlzLmRpcnR5ID0ge2JhY2tncm91bmQ6IGZhbHNlLCBmb3JlZ3JvdW5kOiBmYWxzZSwgc3ByaXRlczogZmFsc2V9O1xuXG4gIHRoaXMuX3Nwcml0ZXNNaW5YID0gMDtcbiAgdGhpcy5fc3ByaXRlc01pblkgPSAwO1xufVxuXG5SZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUiA9IC0xO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JVElBTElaRUQgPSAwO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORyA9IDE7XG5SZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSA9IDI7XG5cbi8vIFRPRE86IEltcGxlbWVudCBzdXBwb3J0IGZvciByZW5kZXJpbmcgb25seSBhIHBhcnQgb2YgdGhlIHJlZ2lvbi5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgaWYgKHRoaXMuc3RhdGUgIT0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfUkVBRFkpIHJldHVybjtcblxuICB0aGlzLl9yZW5kZXJFbnRpdGllcyhyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSk7XG4gIHRoaXMuX3JlbmRlclRpbGVzKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyRW50aXRpZXMgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgdmFyIGNhbnZhcyA9IHJlbmRlcmVyLmdldENhbnZhcyh0aGlzLCAyKTtcbiAgaWYgKCF0aGlzLmRpcnR5LnNwcml0ZXMpIHtcbiAgICBjYW52YXMuc3R5bGUubGVmdCA9IChvZmZzZXRYICsgdGhpcy5fc3ByaXRlc01pblggKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmJvdHRvbSA9IChvZmZzZXRZICsgKFJFR0lPTl9IRUlHSFQgLSB0aGlzLl9zcHJpdGVzTWF4WSkgKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gIH1cblxuICB0aGlzLmRpcnR5LnNwcml0ZXMgPSBmYWxzZTtcblxuICB2YXIgbWluWCA9IDAsIG1heFggPSAwLCBtaW5ZID0gMCwgbWF4WSA9IDAsXG4gICAgICBvcmlnaW5YID0gdGhpcy54ICogVElMRVNfWCwgb3JpZ2luWSA9IHRoaXMueSAqIFRJTEVTX1ksXG4gICAgICBhbGxTcHJpdGVzID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV0sXG4gICAgICAgIHNwcml0ZXMgPSBudWxsO1xuXG4gICAgc3dpdGNoIChlbnRpdHkuX19uYW1lX18gKyBlbnRpdHkuX192ZXJzaW9uX18pIHtcbiAgICAgIGNhc2UgJ0l0ZW1Ecm9wRW50aXR5MSc6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJJdGVtKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ01vbnN0ZXJFbnRpdHkxJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlck1vbnN0ZXIocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTnBjRW50aXR5MSc6XG4gICAgICAgIC8vIFRPRE86IENvbnZlcnQgdG8gdmVyc2lvbiAyIGJlZm9yZSByZW5kZXJpbmcuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTnBjRW50aXR5Mic6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJOUEMocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnT2JqZWN0RW50aXR5MSc6XG4gICAgICAgIC8vIFRPRE86IFBvdGVudGlhbCBjb252ZXJzaW9uIGNvZGUuXG4gICAgICBjYXNlICdPYmplY3RFbnRpdHkyJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlck9iamVjdChyZW5kZXJlciwgZW50aXR5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdQbGFudEVudGl0eTEnOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVyUGxhbnQocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKCdVbnN1cHBvcnRlZCBlbnRpdHkvdmVyc2lvbjonLCBlbnRpdHkpO1xuICAgIH1cblxuICAgIGlmIChzcHJpdGVzKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNwcml0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIHNwcml0ZSA9IHNwcml0ZXNbal07XG4gICAgICAgIGlmICghc3ByaXRlIHx8ICFzcHJpdGUuaW1hZ2UpIHtcbiAgICAgICAgICB0aGlzLmRpcnR5LnNwcml0ZXMgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzcHJpdGUuc3gpIHNwcml0ZS5zeCA9IDA7XG4gICAgICAgIGlmICghc3ByaXRlLnN5KSBzcHJpdGUuc3kgPSAwO1xuICAgICAgICBpZiAoIXNwcml0ZS53aWR0aCkgc3ByaXRlLndpZHRoID0gc3ByaXRlLmltYWdlLndpZHRoO1xuICAgICAgICBpZiAoIXNwcml0ZS5oZWlnaHQpIHNwcml0ZS5oZWlnaHQgPSBzcHJpdGUuaW1hZ2UuaGVpZ2h0O1xuXG4gICAgICAgIHNwcml0ZS5jYW52YXNYID0gKHNwcml0ZS54IC0gb3JpZ2luWCkgKiBUSUxFX1dJRFRIO1xuICAgICAgICBzcHJpdGUuY2FudmFzWSA9IFJFR0lPTl9IRUlHSFQgLSAoc3ByaXRlLnkgLSBvcmlnaW5ZKSAqIFRJTEVfSEVJR0hUIC0gc3ByaXRlLmhlaWdodDtcblxuICAgICAgICBtaW5YID0gTWF0aC5taW4oc3ByaXRlLmNhbnZhc1gsIG1pblgpO1xuICAgICAgICBtYXhYID0gTWF0aC5tYXgoc3ByaXRlLmNhbnZhc1ggKyBzcHJpdGUud2lkdGgsIG1heFgpO1xuICAgICAgICBtaW5ZID0gTWF0aC5taW4oc3ByaXRlLmNhbnZhc1ksIG1pblkpO1xuICAgICAgICBtYXhZID0gTWF0aC5tYXgoc3ByaXRlLmNhbnZhc1kgKyBzcHJpdGUuaGVpZ2h0LCBtYXhZKTtcblxuICAgICAgICBhbGxTcHJpdGVzLnB1c2goc3ByaXRlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIHdpbGwgcmVzaXplIHRoZSBjYW52YXMgaWYgbmVjZXNzYXJ5LlxuICBjYW52YXMgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMiwgbWF4WCAtIG1pblgsIG1heFkgLSBtaW5ZKTtcbiAgdGhpcy5fc3ByaXRlc01pblggPSBtaW5YO1xuICB0aGlzLl9zcHJpdGVzTWluWSA9IG1pblk7XG5cbiAgaWYgKGFsbFNwcml0ZXMubGVuZ3RoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsU3ByaXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNwcml0ZSA9IGFsbFNwcml0ZXNbaV07XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShzcHJpdGUuaW1hZ2UsIHNwcml0ZS5zeCwgc3ByaXRlLnN5LCBzcHJpdGUud2lkdGgsIHNwcml0ZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAtbWluWCArIHNwcml0ZS5jYW52YXNYLCAtbWluWSArIHNwcml0ZS5jYW52YXNZLCBzcHJpdGUud2lkdGgsIHNwcml0ZS5oZWlnaHQpO1xuICAgIH1cblxuICAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gKG9mZnNldFggKyBtaW5YICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5ib3R0b20gPSAob2Zmc2V0WSArIChSRUdJT05fSEVJR0hUIC0gbWF4WSkgKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gIH0gZWxzZSB7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgfVxufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJJdGVtID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgLy8gVE9ETzogTm90IHN1cmUgd2hhdCB0byBkbyBhYm91dCBpdGVtcy5cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyTW9uc3RlciA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgbW9uc3RlcnMuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck5QQyA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgTlBDcy5cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyT2JqZWN0ID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgdmFyIG9iamVjdHMgPSByZW5kZXJlci5vYmplY3RzLmluZGV4O1xuICBpZiAoIW9iamVjdHMpIHJldHVybjtcblxuICB2YXIgYXNzZXRzID0gcmVuZGVyZXIuYXNzZXRzO1xuICB2YXIgZGVmID0gb2JqZWN0c1tlbnRpdHkubmFtZV07XG4gIGlmICghZGVmKSB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBub3QgaW4gaW5kZXg6ICcgKyBlbnRpdHkubmFtZSk7XG5cbiAgaWYgKGRlZi5hbmltYXRpb24pIHtcbiAgICB2YXIgYW5pbWF0aW9uUGF0aCA9IGFzc2V0cy5nZXRSZXNvdXJjZVBhdGgoZGVmLCBkZWYuYW5pbWF0aW9uKTtcbiAgICAvLyBUT0RPOiBhc3NldHMuZ2V0QW5pbWF0aW9uKGFuaW1hdGlvblBhdGgpO1xuICB9XG5cbiAgdmFyIG9yaWVudGF0aW9uID0gZ2V0T3JpZW50YXRpb24oZGVmLm9yaWVudGF0aW9ucywgZW50aXR5Lm9yaWVudGF0aW9uSW5kZXgpO1xuXG4gIHZhciBwYXRoQW5kRnJhbWUgPSBvcmllbnRhdGlvbi5pbWFnZS5zcGxpdCgnOicpO1xuICB2YXIgaW1hZ2VQYXRoID0gYXNzZXRzLmdldFJlc291cmNlUGF0aChkZWYsIHBhdGhBbmRGcmFtZVswXSk7XG4gIHZhciBmcmFtZXMgPSBhc3NldHMuZ2V0RnJhbWVzKGltYWdlUGF0aCk7XG5cbiAgLy8gRmxpcCBhbGwgdGhlIGZyYW1lcyBob3Jpem9udGFsbHkgaWYgdGhlIHNwcml0ZSBpcyB1c2luZyBhIGR1YWwgaW1hZ2UuXG4gIGlmIChvcmllbnRhdGlvbi5mbGlwKSB7XG4gICAgaWYgKCFmcmFtZXMpIHJldHVybjtcbiAgICBpbWFnZVBhdGggKz0gJz9mbGlwZ3JpZHg9JyArIGZyYW1lcy5mcmFtZUdyaWQuc2l6ZVswXTtcbiAgfVxuXG4gIHZhciBpbWFnZSA9IGFzc2V0cy5nZXRJbWFnZShpbWFnZVBhdGgpO1xuICBpZiAoIWZyYW1lcyB8fCAhaW1hZ2UpIHJldHVybjtcblxuICAvLyBUT0RPOiBHZXQgdGhlIGNvcnJlY3QgZnJhbWUgaW4gdGhlIGZyYW1lIGdyaWQuXG5cbiAgdmFyIHNwcml0ZSA9IHtcbiAgICBpbWFnZTogaW1hZ2UsXG4gICAgeDogZW50aXR5LnRpbGVQb3NpdGlvblswXSArIG9yaWVudGF0aW9uLmluZm8uaW1hZ2VQb3NpdGlvblswXSAvIFRJTEVfV0lEVEgsXG4gICAgeTogZW50aXR5LnRpbGVQb3NpdGlvblsxXSArIG9yaWVudGF0aW9uLmluZm8uaW1hZ2VQb3NpdGlvblsxXSAvIFRJTEVfSEVJR0hULFxuICAgIHN4OiAwLFxuICAgIHN5OiAwLFxuICAgIHdpZHRoOiBmcmFtZXMuZnJhbWVHcmlkLnNpemVbMF0sXG4gICAgaGVpZ2h0OiBmcmFtZXMuZnJhbWVHcmlkLnNpemVbMV1cbiAgfTtcblxuICByZXR1cm4gW3Nwcml0ZV07XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlclBsYW50ID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgdmFyIGFzc2V0cyA9IHJlbmRlcmVyLmFzc2V0cyxcbiAgICAgIHBvc2l0aW9uID0gZW50aXR5LnRpbGVQb3NpdGlvbixcbiAgICAgIHggPSBwb3NpdGlvblswXSxcbiAgICAgIHkgPSBwb3NpdGlvblsxXTtcblxuICByZXR1cm4gZW50aXR5LnBpZWNlcy5tYXAoZnVuY3Rpb24gKHBpZWNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGltYWdlOiBhc3NldHMuZ2V0SW1hZ2UocGllY2UuaW1hZ2UpLFxuICAgICAgeDogeCArIHBpZWNlLm9mZnNldFswXSxcbiAgICAgIHk6IHkgKyBwaWVjZS5vZmZzZXRbMV1cbiAgICB9O1xuICB9KTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyVGlsZXMgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgdmFyIGJnID0gcmVuZGVyZXIuZ2V0Q2FudmFzKHRoaXMsIDEsIFJFR0lPTl9XSURUSCwgUkVHSU9OX0hFSUdIVCk7XG4gIGJnLnN0eWxlLmxlZnQgPSBvZmZzZXRYICsgJ3B4JztcbiAgYmcuc3R5bGUuYm90dG9tID0gb2Zmc2V0WSArICdweCc7XG4gIGJnLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG5cbiAgdmFyIGZnID0gcmVuZGVyZXIuZ2V0Q2FudmFzKHRoaXMsIDQsIFJFR0lPTl9XSURUSCwgUkVHSU9OX0hFSUdIVCk7XG4gIGZnLnN0eWxlLmxlZnQgPSBvZmZzZXRYICsgJ3B4JztcbiAgZmcuc3R5bGUuYm90dG9tID0gb2Zmc2V0WSArICdweCc7XG4gIGZnLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG5cbiAgaWYgKCF0aGlzLmRpcnR5LmJhY2tncm91bmQgJiYgIXRoaXMuZGlydHkuZm9yZWdyb3VuZCkgcmV0dXJuO1xuXG4gIHZhciBhc3NldHMgPSByZW5kZXJlci5hc3NldHMsXG4gICAgICBtYXRlcmlhbHMgPSByZW5kZXJlci5tYXRlcmlhbHMuaW5kZXgsXG4gICAgICBtYXRtb2RzID0gcmVuZGVyZXIubWF0bW9kcy5pbmRleDtcblxuICAvLyBEb24ndCBhbGxvdyByZW5kZXJpbmcgdW50aWwgcmVzb3VyY2VzIGFyZSBpbmRleGVkLlxuICBpZiAoIW1hdGVyaWFscyB8fCAhbWF0bW9kcykge1xuICAgIHRoaXMuZGlydHkuYmFja2dyb3VuZCA9IHRydWU7XG4gICAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBTdG9yZSBmbGFncyBmb3IgY2hvb3Npbmcgd2hldGhlciB0byByZW5kZXIgYmFja2dyb3VuZC9mb3JlZ3JvdW5kIHRpbGVzLlxuICB2YXIgZHJhd0JhY2tncm91bmQgPSB0aGlzLmRpcnR5LmJhY2tncm91bmQgfHwgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kLFxuICAgICAgZHJhd0ZvcmVncm91bmQgPSB0aGlzLmRpcnR5LmZvcmVncm91bmQ7XG5cbiAgLy8gUHJlcGFyZSB0aGUgcmVuZGVyaW5nIHN0ZXAuXG4gIHZhciBiZ0NvbnRleHQgPSBiZy5nZXRDb250ZXh0KCcyZCcpLCBmZ0NvbnRleHQgPSBmZy5nZXRDb250ZXh0KCcyZCcpO1xuICBpZiAoZHJhd0JhY2tncm91bmQpIGJnQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgYmcud2lkdGgsIGJnLmhlaWdodCk7XG4gIGlmIChkcmF3Rm9yZWdyb3VuZCkgZmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBmZy53aWR0aCwgZmcuaGVpZ2h0KTtcblxuICAvLyBSZXNldCBkaXJ0eSBmbGFncyBub3cgc28gdGhhdCB0aGUgY29kZSBiZWxvdyBjYW4gcmVzZXQgdGhlbSBpZiBuZWVkZWQuXG4gIHRoaXMuZGlydHkuYmFja2dyb3VuZCA9IGZhbHNlO1xuICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSBmYWxzZTtcblxuICB2YXIgdmlldyA9IHRoaXMudmlldyxcbiAgICAgIGJhY2tncm91bmRJZCwgZm9yZWdyb3VuZElkLCBmb3JlZ3JvdW5kO1xuXG4gIC8vIFVzZWQgdG8gZGFya2VuIGJhY2tncm91bmQgdGlsZXMuXG4gIGJnQ29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLCAwLCAwLCAuNSknO1xuXG4gIHZhciBuZWlnaGJvcnMgPSBbXG4gICAgdGhpcywgSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JPVyxcbiAgICB0aGlzLCBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1RJTEUsXG4gICAgbnVsbCwgbnVsbCxcbiAgICB0aGlzLm5laWdoYm9yc1s0XSwgQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfVElMRSxcbiAgICB0aGlzLm5laWdoYm9yc1s0XSwgQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9ST1csXG4gICAgdGhpcy5uZWlnaGJvcnNbNV0sIEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfVElMRSxcbiAgICBudWxsLCBudWxsLFxuICAgIHRoaXMubmVpZ2hib3JzWzZdLCBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1JPVyAtIEJZVEVTX1BFUl9USUxFXG4gIF07XG5cbiAgdmFyIHggPSAwLCB5ID0gMCwgc3ggPSAwLCBzeSA9IFJFR0lPTl9IRUlHSFQgLSBUSUxFX0hFSUdIVDtcbiAgZm9yICh2YXIgb2Zmc2V0ID0gSEVBREVSX0JZVEVTOyBvZmZzZXQgPCBCWVRFU19QRVJfUkVHSU9OOyBvZmZzZXQgKz0gQllURVNfUEVSX1RJTEUpIHtcbiAgICBpZiAoeCA9PSAwKSB7XG4gICAgICBuZWlnaGJvcnNbNF0gPSB0aGlzO1xuICAgICAgbmVpZ2hib3JzWzVdID0gb2Zmc2V0ICsgQllURVNfUEVSX1RJTEU7XG5cbiAgICAgIGlmICh5ID09IDEpIHtcbiAgICAgICAgbmVpZ2hib3JzWzhdID0gdGhpcztcbiAgICAgICAgbmVpZ2hib3JzWzldID0gSEVBREVSX0JZVEVTO1xuICAgICAgfVxuXG4gICAgICBuZWlnaGJvcnNbMTJdID0gdGhpcy5uZWlnaGJvcnNbNl07XG4gICAgICBuZWlnaGJvcnNbMTNdID0gb2Zmc2V0IC0gQllURVNfUEVSX1RJTEUgKyBCWVRFU19QRVJfUk9XO1xuXG4gICAgICBpZiAoeSA9PSBUSUxFU19ZIC0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbMF0gPSB0aGlzLm5laWdoYm9yc1swXTtcbiAgICAgICAgbmVpZ2hib3JzWzFdID0gSEVBREVSX0JZVEVTO1xuICAgICAgICBuZWlnaGJvcnNbMl0gPSB0aGlzLm5laWdoYm9yc1swXTtcbiAgICAgICAgbmVpZ2hib3JzWzNdID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1RJTEU7XG4gICAgICAgIG5laWdoYm9yc1sxNF0gPSB0aGlzLm5laWdoYm9yc1s3XTtcbiAgICAgICAgbmVpZ2hib3JzWzE1XSA9IEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1cgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH0gZWxzZSBpZiAoeSA+IDApIHtcbiAgICAgICAgbmVpZ2hib3JzWzZdID0gdGhpcztcbiAgICAgICAgbmVpZ2hib3JzWzddID0gb2Zmc2V0IC0gQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFO1xuICAgICAgICBuZWlnaGJvcnNbMTBdID0gdGhpcy5uZWlnaGJvcnNbNl07XG4gICAgICAgIG5laWdoYm9yc1sxMV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgICAgbmVpZ2hib3JzWzE0XSA9IHRoaXMubmVpZ2hib3JzWzZdO1xuICAgICAgICBuZWlnaGJvcnNbMTVdID0gb2Zmc2V0IC0gQllURVNfUEVSX1RJTEUgKyBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1JPVztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHggPT0gMSkge1xuICAgICAgaWYgKHkgPT0gMCkge1xuICAgICAgICBuZWlnaGJvcnNbMTBdID0gdGhpcy5uZWlnaGJvcnNbNF07XG4gICAgICAgIG5laWdoYm9yc1sxMV0gPSBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5laWdoYm9yc1sxMF0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbMTFdID0gb2Zmc2V0IC0gQllURVNfUEVSX1JPVyAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfVxuXG4gICAgICBuZWlnaGJvcnNbMTJdID0gdGhpcztcbiAgICAgIG5laWdoYm9yc1sxM10gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRTtcblxuICAgICAgaWYgKHkgPT0gVElMRVNfWSAtIDEpIHtcbiAgICAgICAgbmVpZ2hib3JzWzE0XSA9IHRoaXMubmVpZ2hib3JzWzBdO1xuICAgICAgICBuZWlnaGJvcnNbMTVdID0gSEVBREVSX0JZVEVTO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3JzWzE0XSA9IHRoaXM7XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBvZmZzZXQgKyBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh4ID09IFRJTEVTX1ggLSAxKSB7XG4gICAgICBpZiAoeSA9PSBUSUxFU19ZIC0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbMl0gPSB0aGlzLm5laWdoYm9yc1sxXTtcbiAgICAgICAgbmVpZ2hib3JzWzNdID0gSEVBREVSX0JZVEVTO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3JzWzJdID0gdGhpcy5uZWlnaGJvcnNbMl07XG4gICAgICAgIG5laWdoYm9yc1szXSA9IG9mZnNldCArIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfVxuXG4gICAgICBuZWlnaGJvcnNbNF0gPSB0aGlzLm5laWdoYm9yc1syXTtcbiAgICAgIG5laWdoYm9yc1s1XSA9IG9mZnNldCAtIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfVElMRTtcblxuICAgICAgaWYgKHkgPT0gMCkge1xuICAgICAgICBuZWlnaGJvcnNbNl0gPSB0aGlzLm5laWdoYm9yc1szXTtcbiAgICAgICAgbmVpZ2hib3JzWzddID0gQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9ST1c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbNl0gPSB0aGlzLm5laWdoYm9yc1syXTtcbiAgICAgICAgbmVpZ2hib3JzWzddID0gb2Zmc2V0IC0gQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzogRmlndXJlIG91dCB0aGUgcmVhbCB2YXJpYW50IGFsZ29yaXRobS5cbiAgICB2YXIgdmFyaWFudCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NSk7XG5cbiAgICBmb3JlZ3JvdW5kSWQgPSB2aWV3LmdldEludDE2KG9mZnNldCk7XG4gICAgZm9yZWdyb3VuZCA9IG1hdGVyaWFsc1tmb3JlZ3JvdW5kSWRdO1xuXG4gICAgLy8gT25seSByZW5kZXIgdGhlIGJhY2tncm91bmQgaWYgdGhlIGZvcmVncm91bmQgZG9lc24ndCBjb3ZlciBpdC5cbiAgICBpZiAoZHJhd0JhY2tncm91bmQgJiYgKCFmb3JlZ3JvdW5kIHx8IGZvcmVncm91bmQudHJhbnNwYXJlbnQpKSB7XG4gICAgICBpZiAoIXRoaXMuX3JlbmRlclRpbGUoYmdDb250ZXh0LCBzeCwgc3ksIGFzc2V0cywgbWF0ZXJpYWxzLCBtYXRtb2RzLCB2aWV3LCBvZmZzZXQsIDcsIHZhcmlhbnQsIG5laWdoYm9ycykpIHtcbiAgICAgICAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRGFya2VuIGJhY2tncm91bmQgdGlsZXMuXG4gICAgICBiZ0NvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1hdG9wJztcbiAgICAgIGJnQ29udGV4dC5maWxsUmVjdChzeCwgc3ksIDgsIDgpO1xuICAgICAgYmdDb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIHRoZSBmb3JlZ3JvdW5kIHRpbGUgYW5kL29yIGVkZ2VzLlxuICAgIGlmIChkcmF3Rm9yZWdyb3VuZCkge1xuICAgICAgaWYgKCF0aGlzLl9yZW5kZXJUaWxlKGZnQ29udGV4dCwgc3gsIHN5LCBhc3NldHMsIG1hdGVyaWFscywgbWF0bW9kcywgdmlldywgb2Zmc2V0LCAwLCB2YXJpYW50LCBuZWlnaGJvcnMpKSB7XG4gICAgICAgIHRoaXMuZGlydHkuZm9yZWdyb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzogT25seSBpbmNyZW1lbnQgdGhlIG9mZnNldHMgdGhhdCBhY3R1YWxseSBuZWVkIGl0LlxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgMTY7IGkgKz0gMikge1xuICAgICAgbmVpZ2hib3JzW2ldICs9IEJZVEVTX1BFUl9USUxFO1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgbmV4dCBzZXQgb2YgWCwgWSBjb29yZGluYXRlcy5cbiAgICBpZiAoKyt4ID09IDMyKSB7XG4gICAgICB4ID0gMDsgeSsrO1xuICAgICAgc3ggPSAwOyBzeSAtPSBUSUxFX0hFSUdIVDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3ggKz0gVElMRV9XSURUSDtcbiAgICB9XG4gIH1cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyVGlsZSA9IGZ1bmN0aW9uIChjb250ZXh0LCB4LCB5LCBhc3NldHMsIG1hdGVyaWFscywgbWF0bW9kcywgdmlldywgb2Zmc2V0LCBkZWx0YSwgdmFyaWFudCwgbmVpZ2hib3JzKSB7XG4gIHZhciBtY2VudGVyID0gdmlldy5nZXRJbnQxNihvZmZzZXQgKyBkZWx0YSksXG4gICAgICBtdG9wID0gZ2V0SW50MTYobmVpZ2hib3JzWzBdLCBuZWlnaGJvcnNbMV0gKyBkZWx0YSksXG4gICAgICBtcmlnaHQgPSBnZXRJbnQxNihuZWlnaGJvcnNbNF0sIG5laWdoYm9yc1s1XSArIGRlbHRhKSxcbiAgICAgIG1ib3R0b20gPSBnZXRJbnQxNihuZWlnaGJvcnNbOF0sIG5laWdoYm9yc1s5XSArIGRlbHRhKSxcbiAgICAgIG1sZWZ0ID0gZ2V0SW50MTYobmVpZ2hib3JzWzEyXSwgbmVpZ2hib3JzWzEzXSArIGRlbHRhKSxcbiAgICAgIGljZW50ZXIsIGl0b3AsIGlyaWdodCwgaWJvdHRvbSwgaWxlZnQsXG4gICAgICBvY2VudGVyLCBvdG9wLCBvcmlnaHQsIG9ib3R0b20sIG9sZWZ0LFxuICAgICAgdmNlbnRlciwgdnRvcCwgdnJpZ2h0LCB2Ym90dG9tLCB2bGVmdDtcblxuICB2YXIgZHRvcCA9IG10b3AgPiAwICYmIChtY2VudGVyIDwgMSB8fCBtY2VudGVyID4gbXRvcCksXG4gICAgICBkcmlnaHQgPSBtcmlnaHQgPiAwICYmIChtY2VudGVyIDwgMSB8fCBtY2VudGVyID4gbXJpZ2h0KSxcbiAgICAgIGRib3R0b20gPSBtYm90dG9tID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG1ib3R0b20pLFxuICAgICAgZGxlZnQgPSBtbGVmdCA+IDAgJiYgKG1jZW50ZXIgPCAxIHx8IG1jZW50ZXIgPiBtbGVmdCk7XG5cbiAgaWYgKGR0b3ApIHtcbiAgICBvdG9wID0gbWF0ZXJpYWxzW210b3BdO1xuICAgIGlmICghb3RvcCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG90b3AucGxhdGZvcm0pIHtcbiAgICAgIGR0b3AgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXRvcCA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob3RvcCwgJ2ZyYW1lcycsIGdldFVpbnQ4KG5laWdoYm9yc1swXSwgbmVpZ2hib3JzWzFdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWl0b3ApIHJldHVybiBmYWxzZTtcbiAgICAgIHZ0b3AgPSB2YXJpYW50ICUgb3RvcC52YXJpYW50cyAqIDE2O1xuICAgIH1cbiAgfVxuXG4gIGlmIChkcmlnaHQpIHtcbiAgICBvcmlnaHQgPSBtYXRlcmlhbHNbbXJpZ2h0XTtcbiAgICBpZiAoIW9yaWdodCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG9yaWdodC5wbGF0Zm9ybSkge1xuICAgICAgZHJpZ2h0ID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlyaWdodCA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob3JpZ2h0LCAnZnJhbWVzJywgZ2V0VWludDgobmVpZ2hib3JzWzRdLCBuZWlnaGJvcnNbNV0gKyBkZWx0YSArIDIpKTtcbiAgICAgIGlmICghaXJpZ2h0KSByZXR1cm4gZmFsc2U7XG4gICAgICB2cmlnaHQgPSB2YXJpYW50ICUgb3JpZ2h0LnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRsZWZ0KSB7XG4gICAgb2xlZnQgPSBtYXRlcmlhbHNbbWxlZnRdO1xuICAgIGlmICghb2xlZnQpIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvbGVmdC5wbGF0Zm9ybSkge1xuICAgICAgZGxlZnQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWxlZnQgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9sZWZ0LCAnZnJhbWVzJywgZ2V0VWludDgobmVpZ2hib3JzWzEyXSwgbmVpZ2hib3JzWzEzXSArIGRlbHRhICsgMikpO1xuICAgICAgaWYgKCFpbGVmdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmxlZnQgPSB2YXJpYW50ICUgb2xlZnQudmFyaWFudHMgKiAxNjtcbiAgICB9XG4gIH1cblxuICBpZiAoZGJvdHRvbSkge1xuICAgIG9ib3R0b20gPSBtYXRlcmlhbHNbbWJvdHRvbV07XG4gICAgaWYgKCFvYm90dG9tKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob2JvdHRvbS5wbGF0Zm9ybSkge1xuICAgICAgZGJvdHRvbSA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpYm90dG9tID0gYXNzZXRzLmdldFRpbGVJbWFnZShvYm90dG9tLCAnZnJhbWVzJywgZ2V0VWludDgobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDIpKTtcbiAgICAgIGlmICghaWJvdHRvbSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmJvdHRvbSA9IHZhcmlhbnQgJSBvYm90dG9tLnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1jZW50ZXIgPiAwKSB7XG4gICAgb2NlbnRlciA9IG1hdGVyaWFsc1ttY2VudGVyXTtcbiAgICBpZiAoIW9jZW50ZXIpIHJldHVybiBmYWxzZTtcblxuICAgIHZhciBodWVTaGlmdCA9IHZpZXcuZ2V0VWludDgob2Zmc2V0ICsgZGVsdGEgKyAyKTtcblxuICAgIGlmIChvY2VudGVyLnBsYXRmb3JtKSB7XG4gICAgICBpY2VudGVyID0gYXNzZXRzLmdldFRpbGVJbWFnZShvY2VudGVyLCAncGxhdGZvcm1JbWFnZScsIGh1ZVNoaWZ0KTtcbiAgICAgIGlmICghaWNlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2Y2VudGVyID0gdmFyaWFudCAlIG9jZW50ZXIucGxhdGZvcm1WYXJpYW50cyAqIDg7XG4gICAgICBpZiAobWxlZnQgPiAwICYmIG1sZWZ0ICE9IG1jZW50ZXIgJiYgbXJpZ2h0ID4gMCAmJiBtcmlnaHQgIT0gbWNlbnRlcikge1xuICAgICAgICB2Y2VudGVyICs9IDI0ICogb2NlbnRlci5wbGF0Zm9ybVZhcmlhbnRzO1xuICAgICAgfSBlbHNlIGlmIChtcmlnaHQgPiAwICYmIG1yaWdodCAhPSBtY2VudGVyKSB7XG4gICAgICAgIHZjZW50ZXIgKz0gMTYgKiBvY2VudGVyLnBsYXRmb3JtVmFyaWFudHM7XG4gICAgICB9IGVsc2UgaWYgKG1sZWZ0IDwgMSB8fCBtbGVmdCA9PSBtY2VudGVyKSB7XG4gICAgICAgIHZjZW50ZXIgKz0gOCAqIG9jZW50ZXIucGxhdGZvcm1WYXJpYW50cztcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWNlbnRlciwgdmNlbnRlciwgMCwgOCwgOCwgeCwgeSwgOCwgOCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGljZW50ZXIgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9jZW50ZXIsICdmcmFtZXMnLCBodWVTaGlmdCk7XG4gICAgICBpZiAoIWljZW50ZXIpIHJldHVybiBmYWxzZTtcblxuICAgICAgdmNlbnRlciA9IHZhcmlhbnQgJSBvY2VudGVyLnZhcmlhbnRzICogMTY7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpY2VudGVyLCB2Y2VudGVyICsgNCwgMTIsIDgsIDgsIHgsIHksIDgsIDgpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkdG9wKSB7XG4gICAgaWYgKG10b3AgPT0gbWxlZnQpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AsIDAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobXRvcCA8IG1sZWZ0KSB7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgNCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgNCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkbGVmdCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICB4ICs9IDQ7XG5cbiAgaWYgKGR0b3ApIHtcbiAgICBpZiAobXRvcCA9PSBtcmlnaHQpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA0LCAwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG10b3AgPCBtcmlnaHQpIHtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgOCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgOCwgMjAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRyaWdodClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZHJpZ2h0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIHkgKz0gNDtcblxuICBpZiAoZGJvdHRvbSkge1xuICAgIGlmIChtYm90dG9tID09IG1yaWdodCkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDQsIDQsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobWJvdHRvbSA8IG1yaWdodCkge1xuICAgICAgaWYgKGRyaWdodClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA4LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDgsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRyaWdodClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZHJpZ2h0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIHggLT0gNDtcblxuICBpZiAoZGJvdHRvbSkge1xuICAgIGlmIChtYm90dG9tID09IG1sZWZ0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tLCA0LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG1ib3R0b20gPCBtbGVmdCkge1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDQsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgNCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRsZWZ0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIC8vIFRPRE86IEZpZ3VyZSBvdXQgaG93IG1hdG1vZHMgd29yay5cbiAgLy8gUmVuZGVyIHRoZSBtYXRtb2QgZm9yIHRoaXMgdGlsZS5cbiAgdmFyIG1vZElkID0gdmlldy5nZXRJbnQxNihvZmZzZXQgKyBkZWx0YSArIDQpLCBtb2QsIG1vZEltYWdlO1xuICBpZiAobW9kSWQgPiAwKSB7XG4gICAgbW9kID0gbWF0bW9kc1ttb2RJZF07XG4gICAgaWYgKCFtb2QpIHJldHVybiBmYWxzZTtcblxuICAgIG1vZEltYWdlID0gYXNzZXRzLmdldFRpbGVJbWFnZShtb2QsICdmcmFtZXMnLCB2aWV3LmdldFVpbnQ4KG9mZnNldCArIGRlbHRhICsgNikpO1xuICAgIGlmICghbW9kSW1hZ2UpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnRleHQuZHJhd0ltYWdlKG1vZEltYWdlLCA0ICsgdmFyaWFudCAlIG1vZC52YXJpYW50cyAqIDE2LCAxMiwgOCwgOCwgeCwgeSAtIDQsIDgsIDgpO1xuICB9XG5cbiAgLy8gUmVuZGVyIHRoZSBtYXRtb2Qgb2YgdGhlIHRpbGUgYmVsb3cgdGhpcyBvbmUgKGlmIGl0IG92ZXJmbG93cykuXG4gIGlmICghb2NlbnRlciAmJiBuZWlnaGJvcnNbOF0pIHtcbiAgICBtb2RJZCA9IGdldEludDE2KG5laWdoYm9yc1s4XSwgbmVpZ2hib3JzWzldICsgZGVsdGEgKyA0KTtcbiAgICBpZiAobW9kSWQgPiAwKSB7XG4gICAgICBtb2QgPSBtYXRtb2RzW21vZElkXTtcbiAgICAgIGlmICghbW9kKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIG1vZEltYWdlID0gYXNzZXRzLmdldFRpbGVJbWFnZShtb2QsICdmcmFtZXMnLCBnZXRVaW50OChuZWlnaGJvcnNbOF0sIG5laWdoYm9yc1s5XSArIGRlbHRhICsgNikpO1xuICAgICAgaWYgKCFtb2RJbWFnZSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShtb2RJbWFnZSwgNCArIHZhcmlhbnQgJSBtb2QudmFyaWFudHMgKiAxNiwgOCwgOCwgNCwgeCwgeSwgOCwgNCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBXb3JsZE1hbmFnZXI7XG5cbmZ1bmN0aW9uIFdvcmxkTWFuYWdlcihvcHRfb3B0aW9ucykge1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICB2YXIgb3B0aW9ucyA9IHtcbiAgICB3b3JrZXJQYXRoOiBfX2Rpcm5hbWUgKyAnL3dvcmtlci5qcydcbiAgfTtcblxuICBPYmplY3Quc2VhbChvcHRpb25zKTtcbiAgbWVyZ2Uob3B0aW9ucywgb3B0X29wdGlvbnMpO1xuICBPYmplY3QuZnJlZXplKG9wdGlvbnMpO1xuXG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIHRoaXMubWV0YWRhdGEgPSBudWxsO1xuXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCk7XG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2VyLCB7dGltZUNhbGxzOiB0cnVlfSk7XG59XG51dGlsLmluaGVyaXRzKFdvcmxkTWFuYWdlciwgRXZlbnRFbWl0dGVyKTtcblxuV29ybGRNYW5hZ2VyLnByb3RvdHlwZS5nZXRSZWdpb24gPSBmdW5jdGlvbiAoeCwgeSwgY2FsbGJhY2spIHtcbiAgdGhpcy5hcGkuZ2V0UmVnaW9uKHgsIHksIGNhbGxiYWNrKTtcbn07XG5cbldvcmxkTWFuYWdlci5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xuICB0aGlzLmFwaS5vcGVuKGZpbGUsIChlcnIsIG1ldGFkYXRhKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMubWV0YWRhdGEgPSBtZXRhZGF0YTtcbiAgICB0aGlzLmVtaXQoJ2xvYWQnLCB7bWV0YWRhdGE6IG1ldGFkYXRhfSk7XG4gICAgY2FsbGJhY2soZXJyLCBtZXRhZGF0YSk7XG4gIH0pO1xufTtcbiIsInZhciBSZWdpb25SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVnaW9ucmVuZGVyZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBXb3JsZFJlbmRlcmVyO1xuXG5cbnZhciBUSUxFU19YID0gMzI7XG52YXIgVElMRVNfWSA9IDMyO1xudmFyIFRJTEVTX1BFUl9SRUdJT04gPSBUSUxFU19YICogVElMRVNfWTtcblxudmFyIEhFQURFUl9CWVRFUyA9IDM7XG52YXIgQllURVNfUEVSX1RJTEUgPSAyMztcbnZhciBCWVRFU19QRVJfUk9XID0gQllURVNfUEVSX1RJTEUgKiBUSUxFU19YO1xudmFyIEJZVEVTX1BFUl9SRUdJT04gPSBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfVElMRSAqIFRJTEVTX1BFUl9SRUdJT047XG5cbnZhciBUSUxFX1dJRFRIID0gODtcbnZhciBUSUxFX0hFSUdIVCA9IDg7XG5cbnZhciBSRUdJT05fV0lEVEggPSBUSUxFX1dJRFRIICogVElMRVNfWDtcbnZhciBSRUdJT05fSEVJR0hUID0gVElMRV9IRUlHSFQgKiBUSUxFU19ZO1xuXG52YXIgTUlOX1pPT00gPSAuMTtcbnZhciBNQVhfWk9PTSA9IDM7XG5cblxuZnVuY3Rpb24gV29ybGRSZW5kZXJlcih2aWV3cG9ydCwgd29ybGRNYW5hZ2VyLCBhc3NldHNNYW5hZ2VyKSB7XG4gIC8vIEVuc3VyZSB0aGF0IGNhbnZhc2VzIGNhbiBiZSBhbmNob3JlZCB0byB0aGUgdmlld3BvcnQuXG4gIHZhciBwb3NpdGlvbiA9IGdldENvbXB1dGVkU3R5bGUodmlld3BvcnQpLmdldFByb3BlcnR5VmFsdWUoJ3Bvc2l0aW9uJyk7XG4gIGlmIChwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZScpIHtcbiAgICB2aWV3cG9ydC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gIH1cblxuICB0aGlzLnZpZXdwb3J0ID0gdmlld3BvcnQ7XG4gIHRoaXMud29ybGQgPSB3b3JsZE1hbmFnZXI7XG4gIHRoaXMuYXNzZXRzID0gYXNzZXRzTWFuYWdlcjtcblxuICB0aGlzLmNlbnRlclggPSAwO1xuICB0aGlzLmNlbnRlclkgPSAwO1xuICB0aGlzLnpvb20gPSAxO1xuXG4gIHRoaXMudmlld3BvcnRYID0gMDtcbiAgdGhpcy52aWV3cG9ydFkgPSAwO1xuICB0aGlzLnNjcmVlblJlZ2lvbldpZHRoID0gUkVHSU9OX1dJRFRIO1xuICB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCA9IFJFR0lPTl9IRUlHSFQ7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcubWF0ZXJpYWwnKTtcbiAgdGhpcy5tYXRtb2RzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm1hdG1vZCcpO1xuICB0aGlzLm9iamVjdHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcub2JqZWN0Jyk7XG5cbiAgdGhpcy5hc3NldHMub24oJ2ltYWdlcycsICgpID0+IHRoaXMucmVxdWVzdFJlbmRlcigpKTtcbiAgdGhpcy5hc3NldHMub24oJ3Jlc291cmNlcycsICgpID0+IHRoaXMucmVxdWVzdFJlbmRlcigpKTtcblxuICB0aGlzLl9jYW52YXNQb29sID0gW107XG4gIHRoaXMuX2ZyZWVQb29sID0gbnVsbDtcbiAgdGhpcy5fcG9vbExvb2t1cCA9IG51bGw7XG5cbiAgdGhpcy5fYmFja2dyb3VuZHMgPSBbXTtcbiAgdGhpcy5fcmVnaW9ucyA9IHt9O1xuXG4gIHRoaXMuX2JvdW5kcyA9IHZpZXdwb3J0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB0aGlzLl9yZWdpb25zWCA9IDA7XG4gIHRoaXMuX3JlZ2lvbnNZID0gMDtcbiAgdGhpcy5fdGlsZXNYID0gMDtcbiAgdGhpcy5fdGlsZXNZID0gMDtcbiAgdGhpcy5fZnJvbVJlZ2lvblggPSAwO1xuICB0aGlzLl9mcm9tUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWCA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWSA9IDA7XG5cbiAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHdvcmxkIHdoZW4gaXQncyBhdmFpbGFibGUuXG4gIGlmICh3b3JsZE1hbmFnZXIubWV0YWRhdGEpIHtcbiAgICB0aGlzLl9sb2FkTWV0YWRhdGEod29ybGRNYW5hZ2VyLm1ldGFkYXRhKTtcbiAgfVxuXG4gIHdvcmxkTWFuYWdlci5vbignbG9hZCcsICgpID0+IHRoaXMuX2xvYWRNZXRhZGF0YSh3b3JsZE1hbmFnZXIubWV0YWRhdGEpKTtcbn1cblxuLyoqXG4gKiBDZW50ZXJzIHRoZSByZW5kZXJlciB2aWV3cG9ydCBvbiB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbGVYIFRoZSBYIGluLWdhbWUgY29vcmRpbmF0ZSB0byBjZW50ZXIgb24uXG4gKiBAcGFyYW0ge251bWJlcn0gdGlsZVkgVGhlIFkgaW4tZ2FtZSBjb29yZGluYXRlIHRvIGNlbnRlciBvbi5cbiAqL1xuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24gKHRpbGVYLCB0aWxlWSkge1xuICB0aGlzLmNlbnRlclggPSB0aWxlWDtcbiAgdGhpcy5jZW50ZXJZID0gdGlsZVk7XG4gIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5nZXRDYW52YXMgPSBmdW5jdGlvbiAocmVnaW9uLCB6LCBvcHRfd2lkdGgsIG9wdF9oZWlnaHQpIHtcbiAgdmFyIGtleSA9IHJlZ2lvbi54ICsgJzonICsgcmVnaW9uLnkgKyAnOicgKyB6O1xuXG4gIHZhciBpdGVtID0gdGhpcy5fcG9vbExvb2t1cFtrZXldLCBjYW52YXM7XG5cbiAgaWYgKGl0ZW0pIHtcbiAgICBjYW52YXMgPSBpdGVtLmNhbnZhcztcbiAgfSBlbHNlIHtcbiAgICBpZiAodGhpcy5fZnJlZVBvb2wubGVuZ3RoKSB7XG4gICAgICBpdGVtID0gdGhpcy5fZnJlZVBvb2wucG9wKCk7XG4gICAgICBjYW52YXMgPSBpdGVtLmNhbnZhcztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ3JlYXRlIG5ldyA8Y2FudmFzPiBlbGVtZW50cyBhcyB0aGV5IGFyZSBuZWVkZWQuXG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICBjYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgICAvLyBSZWdpc3RlciB0aGUgbmV3IGNhbnZhcyBpbiB0aGUgcG9vbC5cbiAgICAgIGl0ZW0gPSB7Y2FudmFzOiBjYW52YXMsIHJlZ2lvbjogcmVnaW9uLCB6OiB6fTtcbiAgICAgIHRoaXMuX2NhbnZhc1Bvb2wucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICBpdGVtLnogPSB6O1xuICAgIGl0ZW0ucmVnaW9uID0gcmVnaW9uO1xuICAgIHRoaXMuX3Bvb2xMb29rdXBba2V5XSA9IGl0ZW07XG5cbiAgICAvLyBNYXJrIHRoZSByZWdpb24gYXMgZGlydHkgc2luY2UgaXQncyBub3QgcmV1c2luZyBhIGNhbnZhcy5cbiAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgfVxuXG4gIC8vIE9ubHkgcmVzaXplIHRoZSBjYW52YXMgaWYgbmVjZXNzYXJ5LCBzaW5jZSByZXNpemluZyBjbGVhcnMgdGhlIGNhbnZhcy5cbiAgdmFyIHdpZHRoID0gdHlwZW9mIG9wdF93aWR0aCA9PSAnbnVtYmVyJyA/IG9wdF93aWR0aCA6IGNhbnZhcy53aWR0aCxcbiAgICAgIGhlaWdodCA9IHR5cGVvZiBvcHRfaGVpZ2h0ID09ICdudW1iZXInID8gb3B0X2hlaWdodCA6IGNhbnZhcy5oZWlnaHQ7XG5cbiAgaWYgKGNhbnZhcy53aWR0aCAhPSB3aWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9IGhlaWdodCkge1xuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgcmVnaW9uLnNldERpcnR5KCk7XG4gIH1cblxuICBjYW52YXMuc3R5bGUud2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy56b29tKSArICdweCc7XG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBNYXRoLnJvdW5kKGhlaWdodCAqIHRoaXMuem9vbSkgKyAncHgnO1xuICBjYW52YXMuc3R5bGUuekluZGV4ID0gejtcblxuICByZXR1cm4gY2FudmFzO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuZ2V0UmVnaW9uID0gZnVuY3Rpb24gKHJlZ2lvblgsIHJlZ2lvblksIG9wdF9za2lwTmVpZ2hib3JzKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm4gbnVsbDtcblxuICAvLyBXcmFwIHRoZSBYIGF4aXMuXG4gIGlmIChyZWdpb25YID49IHRoaXMuX3JlZ2lvbnNYKSB7XG4gICAgcmVnaW9uWCAtPSB0aGlzLl9yZWdpb25zWDtcbiAgfSBlbHNlIGlmIChyZWdpb25YIDwgMCkge1xuICAgIHJlZ2lvblggKz0gdGhpcy5fcmVnaW9uc1g7XG4gIH1cblxuICAvLyBUaGUgWSBheGlzIGRvZXNuJ3Qgd3JhcC5cbiAgaWYgKHJlZ2lvblkgPCAwIHx8IHJlZ2lvblkgPj0gdGhpcy5fcmVnaW9uc1kpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBrZXkgPSByZWdpb25YICsgJzonICsgcmVnaW9uWTtcblxuICAvLyBHZXQgb3IgY3JlYXRlIHRoZSByZWdpb24uXG4gIHZhciByZWdpb247XG4gIGlmIChrZXkgaW4gdGhpcy5fcmVnaW9ucykge1xuICAgIHJlZ2lvbiA9IHRoaXMuX3JlZ2lvbnNba2V5XTtcbiAgfSBlbHNlIHtcbiAgICByZWdpb24gPSBuZXcgUmVnaW9uUmVuZGVyZXIocmVnaW9uWCwgcmVnaW9uWSk7XG4gICAgdGhpcy5fcmVnaW9uc1trZXldID0gcmVnaW9uO1xuICB9XG5cbiAgLy8gTG9hZCB0aGUgcmVnaW9uIGRhdGEgaWYgaXQgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldC5cbiAgaWYgKHJlZ2lvbi5zdGF0ZSA9PSBSZWdpb25SZW5kZXJlci5TVEFURV9VTklOSVRJQUxJWkVEKSB7XG4gICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORztcblxuICAgIHRoaXMud29ybGQuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblksIChlcnIsIHJlZ2lvbkRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfRVJST1I7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZSAhPSAnS2V5IG5vdCBmb3VuZCcpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChyZWdpb25EYXRhLmJ1ZmZlci5ieXRlTGVuZ3RoICE9IEJZVEVTX1BFUl9SRUdJT04pIHtcbiAgICAgICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfRVJST1I7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvcnJ1cHRlZCByZWdpb24gJyArIHJlZ2lvblggKyAnLCAnICsgcmVnaW9uWSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVnaW9uLmVudGl0aWVzID0gcmVnaW9uRGF0YS5lbnRpdGllcztcbiAgICAgIHJlZ2lvbi52aWV3ID0gbmV3IERhdGFWaWV3KHJlZ2lvbkRhdGEuYnVmZmVyKTtcbiAgICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1JFQURZO1xuXG4gICAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgICAgIHRoaXMucmVxdWVzdFJlbmRlcigpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIHJlZ2lvbiBzaG91bGQgbm90IGdldCBuZWlnaGJvcnMsIHJldHVybiBub3cuXG4gIGlmIChvcHRfc2tpcE5laWdoYm9ycykgcmV0dXJuIHJlZ2lvbjtcblxuICAvLyBBZGQgcmVmZXJlbmNlcyB0byBzdXJyb3VuZGluZyByZWdpb25zLlxuICBpZiAoIXJlZ2lvbi5uZWlnaGJvcnMpIHtcbiAgICByZWdpb24ubmVpZ2hib3JzID0gW1xuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSArIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCArIDEsIHJlZ2lvblkgKyAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggKyAxLCByZWdpb25ZLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggKyAxLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YIC0gMSwgcmVnaW9uWSAtIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCAtIDEsIHJlZ2lvblksIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCAtIDEsIHJlZ2lvblkgKyAxLCB0cnVlKVxuICAgIF07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgdmFyIG5laWdoYm9yID0gcmVnaW9uLm5laWdoYm9yc1tpXTtcbiAgICAgIGlmICghbmVpZ2hib3IpIGNvbnRpbnVlO1xuICAgICAgbmVpZ2hib3Iuc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgICB0aGlzLnJlcXVlc3RSZW5kZXIoKTtcbiAgfVxuXG4gIHJldHVybiByZWdpb247XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5pc1JlZ2lvblZpc2libGUgPSBmdW5jdGlvbiAocmVnaW9uKSB7XG4gIGlmICghcmVnaW9uKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGZyb21YID0gdGhpcy5fZnJvbVJlZ2lvblgsIHRvWCA9IHRoaXMuX3RvUmVnaW9uWCxcbiAgICAgIGZyb21ZID0gdGhpcy5fZnJvbVJlZ2lvblksIHRvWSA9IHRoaXMuX3RvUmVnaW9uWTtcblxuICB2YXIgdmlzaWJsZVkgPSByZWdpb24ueSA+PSBmcm9tWSAmJiByZWdpb24ueSA8IHRvWTtcbiAgdmFyIHZpc2libGVYID0gKHJlZ2lvbi54ID49IGZyb21YICYmIHJlZ2lvbi54IDwgdG9YKSB8fFxuICAgIChyZWdpb24ueCA+PSBmcm9tWCAtIHRoaXMuX3JlZ2lvbnNYICYmIHJlZ2lvbi54IDwgdG9YIC0gdGhpcy5fcmVnaW9uc1gpIHx8XG4gICAgKHJlZ2lvbi54ID49IGZyb21YICsgdGhpcy5fcmVnaW9uc1ggJiYgcmVnaW9uLnggPCB0b1ggKyB0aGlzLl9yZWdpb25zWCk7XG5cbiAgcmV0dXJuIHZpc2libGVYICYmIHZpc2libGVZO1xufTtcblxuLy8gU3RhcnQgbG9hZGluZyB0aGUgcmVzb3VyY2UgaW5kZXhlcy5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMubWF0ZXJpYWxzLmxvYWRJbmRleCgpO1xuICB0aGlzLm1hdG1vZHMubG9hZEluZGV4KCk7XG4gIHRoaXMub2JqZWN0cy5sb2FkSW5kZXgoKTtcbn07XG5cbi8vIFRPRE86IFdoZW4gQ2hyb21lIGFuZCBGaXJlZm94IHN1cHBvcnQgQ2FudmFzUHJveHkgb2ZmbG9hZCByZW5kZXJpbmcgdG8gdGhlXG4vLyAgICAgICB3b3JrZXIuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm47XG5cbiAgaWYgKCF0aGlzLl9zZXR1cCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gUHJlY2FsY3VsYXRlIGZyZWUgY2FudmFzZXMgYW5kIGEgY2FudmFzIGxvb2t1cCBtYXAuXG4gIHRoaXMuX3ByZXBhcmVDYW52YXNQb29sKCk7XG5cbiAgLy8gUmVuZGVyIGJhY2tncm91bmQgb3ZlcmxheXMuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYmFja2dyb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYmcgPSB0aGlzLl9iYWNrZ3JvdW5kc1tpXTtcblxuICAgIHZhciBpbWFnZSA9IHRoaXMuYXNzZXRzLmdldEltYWdlKGJnLmltYWdlKTtcbiAgICBpZiAoIWltYWdlKSBjb250aW51ZTtcblxuICAgIHZhciB3aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aCAqIHRoaXMuem9vbSxcbiAgICAgICAgaGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodCAqIHRoaXMuem9vbTtcblxuICAgIHZhciB4ID0gYmcubWluWzBdICogdGhpcy5fc2NyZWVuVGlsZVdpZHRoIC0gdGhpcy52aWV3cG9ydFgsXG4gICAgICAgIHkgPSBiZy5taW5bMV0gKiB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0IC0gdGhpcy52aWV3cG9ydFk7XG5cbiAgICBpbWFnZS5zdHlsZS5sZWZ0ID0geCArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUuYm90dG9tID0geSArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgaW1hZ2Uuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuICAgIGlmICghaW1hZ2UucGFyZW50Tm9kZSkge1xuICAgICAgaW1hZ2Uuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgaW1hZ2Uuc3R5bGUuekluZGV4ID0gMDtcbiAgICAgIHRoaXMudmlld3BvcnQuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbmRlciByZWdpb25zIGFuZCB0aGVpciBvYmplY3RzLlxuICBmb3IgKHZhciByZWdpb25ZID0gdGhpcy5fZnJvbVJlZ2lvblk7IHJlZ2lvblkgPCB0aGlzLl90b1JlZ2lvblk7IHJlZ2lvblkrKykge1xuICAgIGZvciAodmFyIHJlZ2lvblggPSB0aGlzLl9mcm9tUmVnaW9uWDsgcmVnaW9uWCA8IHRoaXMuX3RvUmVnaW9uWDsgcmVnaW9uWCsrKSB7XG4gICAgICB2YXIgcmVnaW9uID0gdGhpcy5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSk7XG4gICAgICBpZiAoIXJlZ2lvbikgY29udGludWU7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgcmVnaW9uJ3MgcG9zaXRpb24gaW4gdGhlIHZpZXdwb3J0IGFuZCByZW5kZXIgaXQuXG4gICAgICB2YXIgb2Zmc2V0WCA9IHJlZ2lvblggKiB0aGlzLnNjcmVlblJlZ2lvbldpZHRoIC0gdGhpcy52aWV3cG9ydFgsXG4gICAgICAgICAgb2Zmc2V0WSA9IHJlZ2lvblkgKiB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCAtIHRoaXMudmlld3BvcnRZO1xuICAgICAgcmVnaW9uLnJlbmRlcih0aGlzLCBvZmZzZXRYLCBvZmZzZXRZKTtcbiAgICB9XG4gIH1cbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnJlcXVlc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkIHx8IHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIpIHJldHVybjtcbiAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IHRydWU7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgfSk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5zY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVksIG9wdF9zY3JlZW5QaXhlbHMpIHtcbiAgaWYgKG9wdF9zY3JlZW5QaXhlbHMpIHtcbiAgICBkZWx0YVggLz0gdGhpcy5fc2NyZWVuVGlsZVdpZHRoO1xuICAgIGRlbHRhWSAvPSB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0O1xuICB9XG5cbiAgdGhpcy5jZW50ZXJYICs9IGRlbHRhWDtcbiAgdGhpcy5jZW50ZXJZICs9IGRlbHRhWTtcblxuICBpZiAodGhpcy5jZW50ZXJYIDwgMCkge1xuICAgIHRoaXMuY2VudGVyWCArPSB0aGlzLl90aWxlc1g7XG4gIH0gZWxzZSBpZiAodGhpcy5jZW50ZXJYID49IHRoaXMuX3RpbGVzWCkge1xuICAgIHRoaXMuY2VudGVyWCAtPSB0aGlzLl90aWxlc1g7XG4gIH1cblxuICB0aGlzLl9jYWxjdWxhdGVSZWdpb25zKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5zZXRab29tID0gZnVuY3Rpb24gKHpvb20pIHtcbiAgaWYgKHpvb20gPCBNSU5fWk9PTSkgem9vbSA9IE1JTl9aT09NO1xuICBpZiAoem9vbSA+IE1BWF9aT09NKSB6b29tID0gTUFYX1pPT007XG4gIGlmICh6b29tID09IHRoaXMuem9vbSkgcmV0dXJuO1xuXG4gIHRoaXMuem9vbSA9IHpvb207XG4gIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS56b29tSW4gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKyB0aGlzLnpvb20gKiAuMSk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS56b29tT3V0ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNldFpvb20odGhpcy56b29tIC0gdGhpcy56b29tICogLjEpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2NhbGN1bGF0ZVJlZ2lvbnMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm47XG5cbiAgdGhpcy5fZnJvbVJlZ2lvblggPSBNYXRoLmZsb29yKHRoaXMuY2VudGVyWCAvIFRJTEVTX1ggLSB0aGlzLl9ib3VuZHMud2lkdGggLyAyIC8gdGhpcy5zY3JlZW5SZWdpb25XaWR0aCkgLSAxO1xuICB0aGlzLl9mcm9tUmVnaW9uWSA9IE1hdGguZmxvb3IodGhpcy5jZW50ZXJZIC8gVElMRVNfWSAtIHRoaXMuX2JvdW5kcy5oZWlnaHQgLyAyIC8gdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQpIC0gMjtcbiAgdGhpcy5fdG9SZWdpb25YID0gdGhpcy5fZnJvbVJlZ2lvblggKyB0aGlzLl92aXNpYmxlUmVnaW9uc1g7XG4gIHRoaXMuX3RvUmVnaW9uWSA9IHRoaXMuX2Zyb21SZWdpb25ZICsgdGhpcy5fdmlzaWJsZVJlZ2lvbnNZO1xuXG4gIHRoaXMudmlld3BvcnRYID0gdGhpcy5jZW50ZXJYICogdGhpcy5fc2NyZWVuVGlsZVdpZHRoIC0gdGhpcy5fYm91bmRzLndpZHRoIC8gMixcbiAgdGhpcy52aWV3cG9ydFkgPSB0aGlzLmNlbnRlclkgKiB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0IC0gdGhpcy5fYm91bmRzLmhlaWdodCAvIDI7XG5cbiAgdGhpcy5yZXF1ZXN0UmVuZGVyKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fY2FsY3VsYXRlVmlld3BvcnQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm47XG5cbiAgdGhpcy5fc2V0dXAgPSB0cnVlO1xuXG4gIHRoaXMuc2NyZWVuUmVnaW9uV2lkdGggPSBNYXRoLnJvdW5kKFJFR0lPTl9XSURUSCAqIHRoaXMuem9vbSk7XG4gIHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0ID0gTWF0aC5yb3VuZChSRUdJT05fSEVJR0hUICogdGhpcy56b29tKTtcbiAgdGhpcy5fc2NyZWVuVGlsZVdpZHRoID0gdGhpcy5zY3JlZW5SZWdpb25XaWR0aCAvIFRJTEVTX1g7XG4gIHRoaXMuX3NjcmVlblRpbGVIZWlnaHQgPSB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCAvIFRJTEVTX1k7XG5cbiAgdGhpcy5fYm91bmRzID0gdGhpcy52aWV3cG9ydC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYID0gTWF0aC5jZWlsKHRoaXMuX2JvdW5kcy53aWR0aCAvIHRoaXMuc2NyZWVuUmVnaW9uV2lkdGggKyAzKTtcbiAgdGhpcy5fdmlzaWJsZVJlZ2lvbnNZID0gTWF0aC5jZWlsKHRoaXMuX2JvdW5kcy5oZWlnaHQgLyB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCArIDMpO1xuXG4gIHRoaXMuX2NhbGN1bGF0ZVJlZ2lvbnMoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLl9sb2FkTWV0YWRhdGEgPSBmdW5jdGlvbiAobWV0YWRhdGEpIHtcbiAgdmFyIHNwYXduLCBzaXplO1xuICBzd2l0Y2ggKG1ldGFkYXRhLl9fdmVyc2lvbl9fKSB7XG4gICAgY2FzZSAxOlxuICAgICAgc3Bhd24gPSBtZXRhZGF0YS5wbGF5ZXJTdGFydDtcbiAgICAgIHNpemUgPSBtZXRhZGF0YS5wbGFuZXQuc2l6ZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICBjYXNlIDM6XG4gICAgICBzcGF3biA9IG1ldGFkYXRhLnBsYXllclN0YXJ0O1xuICAgICAgc2l6ZSA9IG1ldGFkYXRhLndvcmxkVGVtcGxhdGUuc2l6ZTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIG1ldGFkYXRhIHZlcnNpb24gJyArIG1ldGFkYXRhLl9fdmVyc2lvbl9fKTtcbiAgfVxuXG4gIHRoaXMuY2VudGVyWCA9IHNwYXduWzBdO1xuICB0aGlzLmNlbnRlclkgPSBzcGF3blsxXTtcblxuICB0aGlzLl90aWxlc1ggPSBzaXplWzBdO1xuICB0aGlzLl90aWxlc1kgPSBzaXplWzFdO1xuXG4gIC8vIFRPRE86IEZpZ3VyZSBvdXQgd2h5IHNvbWUgd29ybGQgc2l6ZXMgYXJlbid0IGRpdmlzaWJsZSBieSAzMi5cbiAgdGhpcy5fcmVnaW9uc1ggPSBNYXRoLmNlaWwodGhpcy5fdGlsZXNYIC8gVElMRVNfWCk7XG4gIHRoaXMuX3JlZ2lvbnNZID0gTWF0aC5jZWlsKHRoaXMuX3RpbGVzWSAvIFRJTEVTX1kpO1xuXG4gIGlmIChtZXRhZGF0YS5jZW50cmFsU3RydWN0dXJlKSB7XG4gICAgdGhpcy5fYmFja2dyb3VuZHMgPSBtZXRhZGF0YS5jZW50cmFsU3RydWN0dXJlLmJhY2tncm91bmRPdmVybGF5cztcbiAgfVxuXG4gIHRoaXMuX2xvYWRlZCA9IHRydWU7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fcHJlcGFyZUNhbnZhc1Bvb2wgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmcmVlUG9vbCA9IFtdLCBwb29sTG9va3VwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2FudmFzUG9vbC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb29sSXRlbSA9IHRoaXMuX2NhbnZhc1Bvb2xbaV0sXG4gICAgICAgIHJlZ2lvbiA9IHBvb2xJdGVtLnJlZ2lvbjtcblxuICAgIGlmIChyZWdpb24gJiYgdGhpcy5pc1JlZ2lvblZpc2libGUocmVnaW9uKSkge1xuICAgICAgcG9vbExvb2t1cFtyZWdpb24ueCArICc6JyArIHJlZ2lvbi55ICsgJzonICsgcG9vbEl0ZW0uel0gPSBwb29sSXRlbTtcbiAgICB9IGVsc2Uge1xuICAgICAgcG9vbEl0ZW0uY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIGZyZWVQb29sLnB1c2gocG9vbEl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuX2ZyZWVQb29sID0gZnJlZVBvb2w7XG4gIHRoaXMuX3Bvb2xMb29rdXAgPSBwb29sTG9va3VwO1xufTtcbiJdfQ==

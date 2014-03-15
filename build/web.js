(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      if (!error) starbound.renderer.setWorld(world);
    });
  }
}));
starbound.renderer.on('load', (function() {
  $('#world-status').text(starbound.renderer.world.name);
}));
starbound.renderer.on('unload', (function() {
  $('#world-status').text('No world loaded');
}));


},{"./lib/starbound":2,"./lib/ui/os":3,"./lib/ui/progress":4,"./lib/ui/web-selector":5,"./lib/ui/world-selector":6}],2:[function(require,module,exports){
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
    e.preventDefault();
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
    worlds: worlds
  };
};


},{"starbound-assets":15,"starbound-world":22}],3:[function(require,module,exports){
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


},{"useragent-wtf":29}],4:[function(require,module,exports){
module.exports = function(starbound) {
  var maxTasks = 0,
      progress = $('#progress');
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


},{}],5:[function(require,module,exports){
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
      if (file.name[0] == '.') continue;
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


},{"once":14}],6:[function(require,module,exports){
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
    var item = $('<a href="#" class="list-group-item">').attr('data-index', index).append($('<h4 class="list-group-item-heading">').text(world.name), $('<p class="list-group-item-text">').text('Played ' + moment(world.lastModified).fromNow()));
    worldList.append(item);
  }));
};


},{"moment":13}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],12:[function(require,module,exports){
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
},{"./support/isBuffer":11,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":10,"inherits":9}],13:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){
module.exports = once;
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
    if (f.called) return f.value;
    f.called = true;
    return f.value = fn.apply(this, arguments);
  };
  f.called = false;
  return f;
}


},{}],15:[function(require,module,exports){
exports.AssetsManager = require('./lib/assetsmanager');


},{"./lib/assetsmanager":16}],16:[function(require,module,exports){
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
          console.warn(image.width + ' not divisible by ' + flipEveryX + ' (' + path + ')');
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
    for (var x = 0; x + flipEveryX <= image.width; x += flipEveryX) {
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
  if (!(field in resource)) {
    throw new Error('Field "' + field + '" not in resource: ' + JSON.stringify(resource));
  }
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
},{"./resourceloader":17,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":10,"color-convert":19,"events":8,"merge":20,"util":12,"workerproxy":21}],17:[function(require,module,exports){
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


},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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
},{"./conversions":18}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
exports.World = require('./lib/world');
exports.WorldManager = require('./lib/worldmanager');
exports.WorldRenderer = require('./lib/worldrenderer');


},{"./lib/world":24,"./lib/worldmanager":25,"./lib/worldrenderer":26}],23:[function(require,module,exports){
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


},{}],24:[function(require,module,exports){
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
    this.biome = params.primaryBiomeName || params.scanData.primaryBiomeName;
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
}
World.prototype.close = function(callback) {
  this._manager.api.close(this._handle, callback);
  this._manager = null;
  this._handle = - 1;
};
World.prototype.getRegion = function(x, y, callback) {
  if (!this._manager) throw new Error('The world file is closed');
  this._manager.api.getRegion(this._handle, x, y, callback);
};
World.prototype.isOpen = function() {
  return !!this._manager;
};


},{}],25:[function(require,module,exports){
(function (__dirname){
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
      if (opt_callback) opt_callback(err, null);
      return;
    }
    var world = new World($__0, file, info);
    $__0.emit('load', {world: world});
    if (opt_callback) opt_callback(err, world);
  }));
};


}).call(this,"/node_modules/starbound-world/lib")
},{"./world":24,"events":8,"merge":27,"util":12,"workerproxy":28}],26:[function(require,module,exports){
var EventEmitter = require('events');
var util = require('util');
var RegionRenderer = require('./regionrenderer');
var World = require('./world');
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
WorldRenderer.prototype.refresh = function() {
  this._calculateViewport();
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
  if (zoom < MIN_ZOOM) zoom = MIN_ZOOM;
  if (zoom > MAX_ZOOM) zoom = MAX_ZOOM;
  if (zoom == this.zoom) return;
  this.zoom = zoom;
  this._calculateViewport();
};
WorldRenderer.prototype.unload = function() {
  if (!this._loaded) return;
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


},{"./regionrenderer":23,"./world":24,"events":8,"util":12}],27:[function(require,module,exports){
module.exports=require(20)
},{}],28:[function(require,module,exports){
module.exports=require(21)
},{}],29:[function(require,module,exports){
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
  if (console) console.error(err);
  module.exports = {
    browser: 'unknown',
    os: 'unknown',
    platform: 'unknown',
    version: {info: '?.?.?'}
  };
}


},{"ua_parser/src/js/userAgent":30}],30:[function(require,module,exports){
/*jshint browser: true
*/
/*global slide, Class, gesture*/

(function (exports) {
    'use strict';

    var userAgent = exports.userAgent = function (ua) {
        ua = (ua || window.navigator.userAgent).toString().toLowerCase();
        function checkUserAgent(ua) {
            var browser = {};
            var match = /(dolfin)[ \/]([\w.]+)/.exec( ua ) ||
                    /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                    /(webkit)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(msie) ([\w.]+)/.exec( ua ) ||
                    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
                    ["","unknown"];
            if (match[1] === "webkit") {
                match = /(iphone|ipad|ipod)[\S\s]*os ([\w._\-]+) like/.exec(ua) ||
                    /(android)[ \/]([\w._\-]+);/.exec(ua) || [match[0], "safari", match[2]];
            } else if (match[1] === "mozilla") {
                match[1] = "firefox";
            } else if (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)) {
                match[1] = "polaris";
            }

            browser[match[1]] = true;
            browser.name = match[1];
            browser.version = {};

            var versions = match[2] ? match[2].split(/\.|-|_/) : ["0","0","0"];
            browser.version.info = versions.join(".");
            browser.version.major = versions[0] || "0";
            browser.version.minor = versions[1] || "0";
            browser.version.patch = versions[2] || "0";

            return browser;
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
            if (!!ua.match(/ip(hone|od)|android.+mobile|windows (ce|phone)|blackberry|symbian|webos|firefox.+fennec|opera m(ob|in)i|polaris|iemobile|lgtelecom|nokia|sonyericsson|dolfin|uzard|natebrowser|ktf;|skt;/)) {
                return true;
            } else {
                return false;
            }
        }
        
        function checkOs (ua) {
            var os = {},
                match = (/android/.test(ua)? "android" : false) ||
                        (/like mac os x./.test(ua)? "ios" : false)||
                        (/(mac os)/.test(ua)? "mac" : false) ||
                        (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)? "polaris" : false) ||
                        (/(windows)/.test(ua)? "windows" : false) ||
                        (/(linux)/.test(ua)? "linux" : false) ||
                        (/webos/.test(ua)? "webos" : false) ||
                        (/bada/.test(ua)? "bada" : false) ||
                        (/(rim|blackberry)/.test(ua)? "blackberry" : false) || "unknown";
            os[match] = true;
            os.name = match;
            return os;
        }

        return {
            ua: ua,
            browser: checkUserAgent(ua),
            platform: checkPlatform(ua),
            os: checkOs(ua)
        };
    };

})((function (){
    // Make userAgent a Node module, if possible.
    if (typeof exports === 'object') {
        exports.util = (typeof exports.util === 'undefined') ? {} : exports.util;
        return exports.util;
    } else if (typeof window === 'object') {
        window.util = (typeof window.util === 'undefined') ? {} : window.util;
        return window.util;
    }
})());

},{}]},{},[1,7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvZmFrZV80YzE4MjNiNC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL3N0YXJib3VuZC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL3VpL29zLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9saWIvdWkvcHJvZ3Jlc3MuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi91aS93ZWItc2VsZWN0b3IuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi91aS93b3JsZC1zZWxlY3Rvci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2VzNmlmeS9ub2RlX21vZHVsZXMvdHJhY2V1ci9zcmMvcnVudGltZS9ydW50aW1lLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL29uY2Uvb25jZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL2xpYi9hc3NldHNtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9saWIvcmVzb3VyY2Vsb2FkZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L2NvbnZlcnNpb25zLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvd29ya2VycHJveHkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3JlZ2lvbnJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9saWIvd29ybGRtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZHJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvdXNlcmFnZW50LXd0Zi9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3VzZXJhZ2VudC13dGYvbm9kZV9tb2R1bGVzL3VhX3BhcnNlci9zcmMvanMvdXNlckFnZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUksR0FBQSxVQUFBLEVBQVksUUFBTyxDQUFDLGlCQUFBLENBQUEsQ0FBQSxLQUF3QixDQUFDLFFBQUEsQ0FBQSxjQUF1QixDQUFDLFVBQUEsQ0FBQSxDQUFBO0FBR3pFLE9BQU8sQ0FBQyxhQUFBLENBQWMsQ0FBQSxDQUFBO0FBQ3RCLE9BQU8sQ0FBQyxtQkFBQSxDQUFvQixDQUFDLFNBQUEsQ0FBQTtBQUM3QixPQUFPLENBQUMs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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0a0JBLENBQUMsUUFBQSxDQUFVLFNBQUEsQ0FBVztBQU1kLEtBQUEsT0FBQTtBQUNBLGFBQUEsRUFBVSxRQUFBO0FBQ1YsWUFBQSxFQUFTLEtBQUE7QUFDVCxXQUFB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ppQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkEsT0FBQSxDQUFBLEtBQUEsRUFBZ0IsUUFBTyxDQUFDLGFBQUEsQ0FBQTtBQUN4QixPQUFBLENBQUEsWUFBQSxF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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgc3RhcmJvdW5kID0gcmVxdWlyZSgnLi9saWIvc3RhcmJvdW5kJykuc2V0dXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdwb3J0JykpO1xuXG4vLyBTZXQgdXAgVUkgY29tcG9uZW50cy5cbnJlcXVpcmUoJy4vbGliL3VpL29zJykoKTtcbnJlcXVpcmUoJy4vbGliL3VpL3Byb2dyZXNzJykoc3RhcmJvdW5kKTtcbnJlcXVpcmUoJy4vbGliL3VpL3dvcmxkLXNlbGVjdG9yJykoc3RhcmJvdW5kKTtcblxucmVxdWlyZSgnLi9saWIvdWkvd2ViLXNlbGVjdG9yJykoc3RhcmJvdW5kLCAoZXJyb3IsIGluZm8pID0+IHtcbiAgLy8gRmluZCB0aGUgbW9zdCByZWNlbnQgd29ybGQsIGxvYWQgaXQsIGFuZCByZW5kZXIgaXQuXG4gIHZhciBtb3N0UmVjZW50V29ybGQgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGluZm8ud29ybGRGaWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB3b3JsZCA9IGluZm8ud29ybGRGaWxlc1tpXTtcblxuICAgIHZhciBpc01vcmVSZWNlbnQgPSAhbW9zdFJlY2VudFdvcmxkIHx8IHdvcmxkLmxhc3RNb2RpZmllZERhdGUgPiBtb3N0UmVjZW50V29ybGQubGFzdE1vZGlmaWVkRGF0ZTtcblxuICAgIGlmICh3b3JsZC5uYW1lLm1hdGNoKC9cXC53b3JsZCQvKSAmJiBpc01vcmVSZWNlbnQpIHtcbiAgICAgIG1vc3RSZWNlbnRXb3JsZCA9IHdvcmxkO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtb3N0UmVjZW50V29ybGQpIHtcbiAgICBzdGFyYm91bmQud29ybGRzLm9wZW4obW9zdFJlY2VudFdvcmxkLCBmdW5jdGlvbiAoZXJyb3IsIHdvcmxkKSB7XG4gICAgICBpZiAoIWVycm9yKSBzdGFyYm91bmQucmVuZGVyZXIuc2V0V29ybGQod29ybGQpO1xuICAgIH0pO1xuICB9XG59KTtcblxuc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCdsb2FkJywgKCkgPT4ge1xuICAkKCcjd29ybGQtc3RhdHVzJykudGV4dChzdGFyYm91bmQucmVuZGVyZXIud29ybGQubmFtZSk7XG59KTtcblxuc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCd1bmxvYWQnLCAoKSA9PiB7XG4gICQoJyN3b3JsZC1zdGF0dXMnKS50ZXh0KCdObyB3b3JsZCBsb2FkZWQnKTtcbn0pO1xuIiwidmFyIEFzc2V0c01hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtYXNzZXRzJykuQXNzZXRzTWFuYWdlcjtcbnZhciBXb3JsZE1hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtd29ybGQnKS5Xb3JsZE1hbmFnZXI7XG52YXIgV29ybGRSZW5kZXJlciA9IHJlcXVpcmUoJ3N0YXJib3VuZC13b3JsZCcpLldvcmxkUmVuZGVyZXI7XG5cbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiAodmlld3BvcnQpIHtcbiAgLy8gQ3JlYXRlIGFuIGFzc2V0cyBtYW5hZ2VyIHdoaWNoIHdpbGwgZGVhbCB3aXRoIHBhY2thZ2UgZmlsZXMgZXRjLlxuICB2YXIgYXNzZXRzID0gbmV3IEFzc2V0c01hbmFnZXIoe1xuICAgIHdvcmtlclBhdGg6ICdidWlsZC93b3JrZXItYXNzZXRzLmpzJyxcbiAgICB3b3JrZXJzOiA0XG4gIH0pO1xuXG4gIC8vIENyZWF0ZSBhIHdvcmxkIG1hbmFnZXIgdGhhdCBoYW5kbGVzIGxvYWRpbmcgd29ybGRzLlxuICB2YXIgd29ybGRzID0gbmV3IFdvcmxkTWFuYWdlcih7d29ya2VyUGF0aDogJ2J1aWxkL3dvcmtlci13b3JsZC5qcyd9KTtcblxuICAvLyBTZXQgdXAgYSByZW5kZXJlciB0aGF0IHdpbGwgcmVuZGVyIHRoZSBncmFwaGljcyBvbnRvIHNjcmVlbi5cbiAgdmFyIHJlbmRlcmVyID0gbmV3IFdvcmxkUmVuZGVyZXIodmlld3BvcnQsIGFzc2V0cyk7XG5cbiAgLy8gVXBkYXRlIHRoZSB2aWV3cG9ydCB3aGVuIHRoZSBwYWdlIGlzIHJlc2l6ZWQuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVmcmVzaCgpO1xuICB9KTtcblxuICAvLyBFbmFibGUga2V5Ym9hcmQgc2Nyb2xsaW5nLlxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM3OlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoLTEwLCAwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM4OlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoMCwgMTAsIHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzk6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgxMCwgMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDpcbiAgICAgICAgcmVuZGVyZXIuc2Nyb2xsKDAsIC0xMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIEVuYWJsZSBkcmFnZ2luZyB0byBzY3JvbGwuXG4gIHZhciBkcmFnZ2luZyA9IG51bGw7XG4gIHZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgZHJhZ2dpbmcgPSBbZS5jbGllbnRYLCBlLmNsaWVudFldO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XG4gICAgcmVuZGVyZXIuc2Nyb2xsKGRyYWdnaW5nWzBdIC0gZS5jbGllbnRYLCBlLmNsaWVudFkgLSBkcmFnZ2luZ1sxXSwgdHJ1ZSk7XG4gICAgZHJhZ2dpbmdbMF0gPSBlLmNsaWVudFg7XG4gICAgZHJhZ2dpbmdbMV0gPSBlLmNsaWVudFk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgZHJhZ2dpbmcgPSBudWxsO1xuICB9KTtcblxuICAvLyBFbmFibGUgem9vbWluZyB3aXRoIHRoZSBtb3VzZSB3aGVlbC5cbiAgdmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLmRlbHRhWSA+IDApIHJlbmRlcmVyLnpvb21PdXQoKTtcbiAgICBpZiAoZS5kZWx0YVkgPCAwKSByZW5kZXJlci56b29tSW4oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgYXNzZXRzOiBhc3NldHMsXG4gICAgcmVuZGVyZXI6IHJlbmRlcmVyLFxuICAgIHdvcmxkczogd29ybGRzLFxuICB9O1xufTtcbiIsInZhciB1YSA9IHJlcXVpcmUoJ3VzZXJhZ2VudC13dGYnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHN3aXRjaCAodWEub3MpIHtcbiAgICBjYXNlICdtYWMnOlxuICAgICAgJCgnLm1hYycpLnNob3coKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3dpbmRvd3MnOlxuICAgICAgJCgnLndpbmRvd3MnKS5zaG93KCk7XG4gICAgICBicmVhaztcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0YXJib3VuZCkge1xuICB2YXIgbWF4VGFza3MgPSAwLFxuICAgICAgcHJvZ3Jlc3MgPSAkKCcjcHJvZ3Jlc3MnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gbG9vcCgpIHtcbiAgICB2YXIgcGVuZGluZ1Rhc2tzID0gc3RhcmJvdW5kLmFzc2V0cy5hcGkucGVuZGluZ0NhbGxzICtcbiAgICAgICAgICAgICAgICAgICAgICAgc3RhcmJvdW5kLndvcmxkcy5hcGkucGVuZGluZ0NhbGxzO1xuXG4gICAgaWYgKHBlbmRpbmdUYXNrcykge1xuICAgICAgaWYgKG1heFRhc2tzIDwgcGVuZGluZ1Rhc2tzKSB7XG4gICAgICAgIG1heFRhc2tzID0gcGVuZGluZ1Rhc2tzO1xuICAgICAgfVxuXG4gICAgICB2YXIgcGVyY2VudGFnZSA9IChtYXhUYXNrcyAqIDEuMSAtIHBlbmRpbmdUYXNrcykgLyAobWF4VGFza3MgKiAxLjEpICogMTAwO1xuICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsIHBlcmNlbnRhZ2UgKyAnJScpO1xuICAgICAgcHJvZ3Jlc3Muc2hvdygpO1xuICAgIH0gZWxzZSBpZiAobWF4VGFza3MpIHtcbiAgICAgIG1heFRhc2tzID0gMDtcbiAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAnMTAwJScpO1xuICAgICAgcHJvZ3Jlc3MuZmFkZU91dCgpO1xuICAgIH1cblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAgfSk7XG59O1xuIiwidmFyIG9uY2UgPSByZXF1aXJlKCdvbmNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0YXJib3VuZCwgY2FsbGJhY2spIHtcbiAgdmFyIGRpcmVjdG9yeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaXJlY3RvcnknKSxcbiAgICAgIGZpbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZScpO1xuXG4gIGlmIChkaXJlY3Rvcnkud2Via2l0ZGlyZWN0b3J5KSB7XG4gICAgJCgnI2RpcmVjdG9yeS1zZWxlY3RvcicpLm1vZGFsKHtiYWNrZHJvcDogJ3N0YXRpYycsIGtleWJvYXJkOiBmYWxzZX0pO1xuICAgIGRpcmVjdG9yeS5vbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFZlcmlmeSB0aGF0IGEgU3RhcmJvdW5kIGRpcmVjdG9yeSBpcyBzZWxlY3RlZC5cbiAgICAgIHZhciB2ZXJpZmllZCA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlc1tpXTtcbiAgICAgICAgaWYgKGZpbGUud2Via2l0UmVsYXRpdmVQYXRoID09ICdTdGFyYm91bmQvYXNzZXRzL3BhY2tlZC5wYWsnKSB7XG4gICAgICAgICAgdmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBzdGF0dXMgPSAkKCcjZGlyZWN0b3J5LXN0YXR1cycpO1xuICAgICAgaWYgKHZlcmlmaWVkKSB7XG4gICAgICAgIHN0YXR1cy5hdHRyKCdjbGFzcycsICd0ZXh0LXN1Y2Nlc3MnKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3NwYW4nKS5hdHRyKCdjbGFzcycsICdnbHlwaGljb24gZ2x5cGhpY29uLW9rJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzdHJvbmcnKS50ZXh0KCdDbGljayBMb2FkIGFzc2V0cyB0byBjb250aW51ZScpXG4gICAgICAgICQoJyNsb2FkLWRpcmVjdG9yeScpLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdHVzLmF0dHIoJ2NsYXNzJywgJ3RleHQtZGFuZ2VyJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzcGFuJykuYXR0cignY2xhc3MnLCAnZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmUnKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3N0cm9uZycpLnRleHQoJ1RoYXQgZG9lcyBub3QgYXBwZWFyIHRvIGJlIHRoZSBTdGFyYm91bmQgZGlyZWN0b3J5JylcbiAgICAgICAgJCgnI2xvYWQtZGlyZWN0b3J5JykuYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgICQoJyNmaWxlLXNlbGVjdG9yJykubW9kYWwoe2JhY2tkcm9wOiAnc3RhdGljJywga2V5Ym9hcmQ6IGZhbHNlfSk7XG4gICAgZmlsZS5vbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFZlcmlmeSB0aGF0IHBhY2tlZC5wYWsgaXMgc2VsZWN0ZWQuXG4gICAgICB2YXIgc3RhdHVzID0gJCgnI2ZpbGUtc3RhdHVzJyk7XG4gICAgICBpZiAodGhpcy5maWxlc1swXS5uYW1lID09ICdwYWNrZWQucGFrJykge1xuICAgICAgICBzdGF0dXMuYXR0cignY2xhc3MnLCAndGV4dC1zdWNjZXNzJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzcGFuJykuYXR0cignY2xhc3MnLCAnZ2x5cGhpY29uIGdseXBoaWNvbi1vaycpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3Ryb25nJykudGV4dCgnQ2xpY2sgTG9hZCBhc3NldHMgdG8gY29udGludWUnKVxuICAgICAgICAkKCcjbG9hZC1maWxlJykuYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0dXMuYXR0cignY2xhc3MnLCAndGV4dC1kYW5nZXInKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3NwYW4nKS5hdHRyKCdjbGFzcycsICdnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZScpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3Ryb25nJykudGV4dCgnVGhhdCBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgdGhlIHBhY2tlZC5wYWsgZmlsZScpXG4gICAgICAgICQoJyNsb2FkLWZpbGUnKS5hdHRyKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAkKCcjbG9hZC1kaXJlY3RvcnknKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBlbmRpbmdGaWxlcyA9IDA7XG5cbiAgICB2YXIgd29ybGRGaWxlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlyZWN0b3J5LmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZmlsZSA9IGRpcmVjdG9yeS5maWxlc1tpXSxcbiAgICAgICAgICBwYXRoID0gZmlsZS53ZWJraXRSZWxhdGl2ZVBhdGgsXG4gICAgICAgICAgbWF0Y2g7XG5cbiAgICAgIC8vIFNraXAgaGlkZGVuIGZpbGVzL2RpcmVjdG9yaWVzLlxuICAgICAgaWYgKGZpbGUubmFtZVswXSA9PSAnLicpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoZmlsZS5uYW1lLm1hdGNoKC9cXC4oc2hpcCk/d29ybGQkLykpIHtcbiAgICAgICAgd29ybGRGaWxlcy5wdXNoKGZpbGUpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCA9IHBhdGgubWF0Y2goL15TdGFyYm91bmRcXC8oPzphc3NldHN8bW9kcykoXFwvLiopLykpIHtcbiAgICAgICAgLy8gTm90IHN1cmUgd2h5IG11c2ljIGZpbGVzIGFyZSBzdG9yZWQgaW5jb3JyZWN0bHkgbGlrZSB0aGlzLlxuICAgICAgICBpZiAobWF0Y2hbMV0uc3Vic3RyKDAsIDEzKSA9PSAnL211c2ljL211c2ljLycpIHtcbiAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnN1YnN0cig2KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGUgZmlsZSBhbmQgdGhlbiBwcmVsb2FkIHRoZSByZW5kZXJlciBvbmNlIGFsbCBhc3NldHMgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGFkZGVkLlxuICAgICAgICBwZW5kaW5nRmlsZXMrKztcbiAgICAgICAgc3RhcmJvdW5kLmFzc2V0cy5hZGRGaWxlKG1hdGNoWzFdLCBmaWxlLCBvbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBwZW5kaW5nRmlsZXMtLTtcbiAgICAgICAgICBpZiAoIXBlbmRpbmdGaWxlcykge1xuICAgICAgICAgICAgc3RhcmJvdW5kLnJlbmRlcmVyLnByZWxvYWQoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHt3b3JsZEZpbGVzOiB3b3JsZEZpbGVzfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgJCgnI2RpcmVjdG9yeS1zZWxlY3RvcicpLm1vZGFsKCdoaWRlJyk7XG4gIH0pO1xuXG4gICQoJyNsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETzogQWxsb3cgYWRkaW5nIG1vZHM/XG4gICAgc3RhcmJvdW5kLmFzc2V0cy5hZGRGaWxlKCcvJywgZmlsZS5maWxlc1swXSwgb25jZShmdW5jdGlvbiAoKSB7XG4gICAgICBzdGFyYm91bmQucmVuZGVyZXIucHJlbG9hZCgpO1xuICAgICAgY2FsbGJhY2sobnVsbCwge3dvcmxkRmlsZXM6IFtdfSk7XG4gICAgfSkpO1xuXG4gICAgJCgnI2ZpbGUtc2VsZWN0b3InKS5tb2RhbCgnaGlkZScpO1xuICB9KTtcbn07XG4iLCJ2YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0YXJib3VuZCkge1xuICB2YXIgYWRkV29ybGRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZC13b3JsZC1maWxlcycpO1xuICBhZGRXb3JsZHMub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkZFdvcmxkcy5maWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgc3RhcmJvdW5kLndvcmxkcy5vcGVuKGFkZFdvcmxkcy5maWxlc1tpXSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciB3b3JsZExpc3QgPSAkKCcjd29ybGRzJyk7XG5cbiAgdmFyIHdvcmxkcyA9IFtdO1xuXG4gIHdvcmxkTGlzdC5vbignY2xpY2snLCAnLmxpc3QtZ3JvdXAtaXRlbScsIChldmVudCkgPT4ge1xuICAgIHZhciBpdGVtID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5saXN0LWdyb3VwLWl0ZW0nKTtcblxuICAgIHZhciBpbmRleCA9IGl0ZW0uZGF0YSgnaW5kZXgnKTtcbiAgICBzdGFyYm91bmQucmVuZGVyZXIuc2V0V29ybGQod29ybGRzW2luZGV4XSk7XG4gICAgc3RhcmJvdW5kLnJlbmRlcmVyLnJlcXVlc3RSZW5kZXIoKTtcbiAgfSk7XG5cbiAgc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCdsb2FkJywgKCkgPT4ge1xuICAgIHdvcmxkTGlzdC5maW5kKCcubGlzdC1ncm91cC1pdGVtJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ybGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAod29ybGRzW2ldID09IHN0YXJib3VuZC5yZW5kZXJlci53b3JsZCkge1xuICAgICAgICB3b3JsZExpc3QuZmluZCgnW2RhdGEtaW5kZXg9JyArIGkgKyAnXScpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBzdGFyYm91bmQucmVuZGVyZXIub24oJ3VubG9hZCcsICgpID0+IHtcbiAgICB3b3JsZExpc3QuZmluZCgnLmxpc3QtZ3JvdXAtaXRlbScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgfSk7XG5cbiAgc3RhcmJvdW5kLndvcmxkcy5vbignbG9hZCcsIChldmVudCkgPT4ge1xuICAgIHZhciB3b3JsZCA9IGV2ZW50LndvcmxkO1xuXG4gICAgdmFyIGluZGV4ID0gd29ybGRzLmxlbmd0aDtcbiAgICB3b3JsZHMucHVzaCh3b3JsZCk7XG5cbiAgICB2YXIgaXRlbSA9ICQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj4nKVxuICAgICAgLmF0dHIoJ2RhdGEtaW5kZXgnLCBpbmRleClcbiAgICAgIC5hcHBlbmQoXG4gICAgICAgICQoJzxoNCBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbS1oZWFkaW5nXCI+JykudGV4dCh3b3JsZC5uYW1lKSxcbiAgICAgICAgJCgnPHAgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW0tdGV4dFwiPicpLnRleHQoJ1BsYXllZCAnICsgbW9tZW50KHdvcmxkLmxhc3RNb2RpZmllZCkuZnJvbU5vdygpKVxuICAgICAgKTtcblxuICAgIHdvcmxkTGlzdC5hcHBlbmQoaXRlbSk7XG4gIH0pO1xufTtcbiIsIi8vIENvcHlyaWdodCAyMDEyIFRyYWNldXIgQXV0aG9ycy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vKipcbiAqIFRoZSB0cmFjZXVyIHJ1bnRpbWUuXG4gKi9cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChnbG9iYWwuJHRyYWNldXJSdW50aW1lKSB7XG4gICAgLy8gUHJldmVudHMgZnJvbSBiZWluZyBleGVjdXRlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgJGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xuICB2YXIgJGZyZWV6ZSA9IE9iamVjdC5mcmVlemU7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICB2YXIgJGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuICB2YXIgJGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuXG4gIGZ1bmN0aW9uIG5vbkVudW0odmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gIH1cblxuICB2YXIgbWV0aG9kID0gbm9uRW51bTtcblxuICBmdW5jdGlvbiBwb2x5ZmlsbFN0cmluZyhTdHJpbmcpIHtcbiAgICAvLyBIYXJtb255IFN0cmluZyBFeHRyYXNcbiAgICAvLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OnN0cmluZ19leHRyYXNcbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcucHJvdG90eXBlLCB7XG4gICAgICBzdGFydHNXaXRoOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgIHJldHVybiB0aGlzLmxhc3RJbmRleE9mKHMsIDApID09PSAwO1xuICAgICAgfSksXG4gICAgICBlbmRzV2l0aDogbWV0aG9kKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgdmFyIHQgPSBTdHJpbmcocyk7XG4gICAgICAgIHZhciBsID0gdGhpcy5sZW5ndGggLSB0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGwgPj0gMCAmJiB0aGlzLmluZGV4T2YodCwgbCkgPT09IGw7XG4gICAgICB9KSxcbiAgICAgIGNvbnRhaW5zOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHMpICE9PSAtMTtcbiAgICAgIH0pLFxuICAgICAgdG9BcnJheTogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGxpdCgnJyk7XG4gICAgICB9KSxcbiAgICAgIGNvZGVQb2ludEF0OiBtZXRob2QoZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgICAgLyohIGh0dHA6Ly9tdGhzLmJlL2NvZGVwb2ludGF0IHYwLjEuMCBieSBAbWF0aGlhcyAqL1xuICAgICAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgICAgICB2YXIgc2l6ZSA9IHN0cmluZy5sZW5ndGg7XG4gICAgICAgIC8vIGBUb0ludGVnZXJgXG4gICAgICAgIHZhciBpbmRleCA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgICAgIGlmIChpc05hTihpbmRleCkpIHtcbiAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWNjb3VudCBmb3Igb3V0LW9mLWJvdW5kcyBpbmRpY2VzOlxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3QgY29kZSB1bml0XG4gICAgICAgIHZhciBmaXJzdCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgdmFyIHNlY29uZDtcbiAgICAgICAgaWYgKCAvLyBjaGVjayBpZiBpdOKAmXMgdGhlIHN0YXJ0IG9mIGEgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICBmaXJzdCA+PSAweEQ4MDAgJiYgZmlyc3QgPD0gMHhEQkZGICYmIC8vIGhpZ2ggc3Vycm9nYXRlXG4gICAgICAgICAgc2l6ZSA+IGluZGV4ICsgMSAvLyB0aGVyZSBpcyBhIG5leHQgY29kZSB1bml0XG4gICAgICAgICkge1xuICAgICAgICAgIHNlY29uZCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG4gICAgICAgICAgaWYgKHNlY29uZCA+PSAweERDMDAgJiYgc2Vjb25kIDw9IDB4REZGRikgeyAvLyBsb3cgc3Vycm9nYXRlXG4gICAgICAgICAgICAvLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nI3N1cnJvZ2F0ZS1mb3JtdWxhZVxuICAgICAgICAgICAgcmV0dXJuIChmaXJzdCAtIDB4RDgwMCkgKiAweDQwMCArIHNlY29uZCAtIDB4REMwMCArIDB4MTAwMDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcsIHtcbiAgICAgIC8vIDIxLjEuMi40IFN0cmluZy5yYXcoY2FsbFNpdGUsIC4uLnN1YnN0aXR1dGlvbnMpXG4gICAgICByYXc6IG1ldGhvZChmdW5jdGlvbihjYWxsc2l0ZSkge1xuICAgICAgICB2YXIgcmF3ID0gY2FsbHNpdGUucmF3O1xuICAgICAgICB2YXIgbGVuID0gcmF3Lmxlbmd0aCA+Pj4gMDsgIC8vIFRvVWludFxuICAgICAgICBpZiAobGVuID09PSAwKVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHMgKz0gcmF3W2ldO1xuICAgICAgICAgIGlmIChpICsgMSA9PT0gbGVuKVxuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgcyArPSBhcmd1bWVudHNbKytpXTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICAvLyAyMS4xLjIuMiBTdHJpbmcuZnJvbUNvZGVQb2ludCguLi5jb2RlUG9pbnRzKVxuICAgICAgZnJvbUNvZGVQb2ludDogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBodHRwOi8vbXRocy5iZS9mcm9tY29kZXBvaW50IHYwLjEuMCBieSBAbWF0aGlhc1xuICAgICAgICB2YXIgY29kZVVuaXRzID0gW107XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIHZhciBoaWdoU3Vycm9nYXRlO1xuICAgICAgICB2YXIgbG93U3Vycm9nYXRlO1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGNvZGVQb2ludCA9IE51bWJlcihhcmd1bWVudHNbaW5kZXhdKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhaXNGaW5pdGUoY29kZVBvaW50KSB8fCAgLy8gYE5hTmAsIGArSW5maW5pdHlgLCBvciBgLUluZmluaXR5YFxuICAgICAgICAgICAgY29kZVBvaW50IDwgMCB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCAgLy8gbm90IGFuIGludGVnZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IFJhbmdlRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludDogJyArIGNvZGVQb2ludCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb2RlUG9pbnQgPD0gMHhGRkZGKSB7ICAvLyBCTVAgY29kZSBwb2ludFxuICAgICAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgICAgICB9IGVsc2UgeyAgLy8gQXN0cmFsIGNvZGUgcG9pbnQ7IHNwbGl0IGluIHN1cnJvZ2F0ZSBoYWx2ZXNcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmcjc3Vycm9nYXRlLWZvcm11bGFlXG4gICAgICAgICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIGhpZ2hTdXJyb2dhdGUgPSAoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMDtcbiAgICAgICAgICAgIGxvd1N1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgJSAweDQwMCkgKyAweERDMDA7XG4gICAgICAgICAgICBjb2RlVW5pdHMucHVzaChoaWdoU3Vycm9nYXRlLCBsb3dTdXJyb2dhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBjb2RlVW5pdHMpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIC8vICMjIyBTeW1ib2xzXG4gIC8vXG4gIC8vIFN5bWJvbHMgYXJlIGVtdWxhdGVkIHVzaW5nIGFuIG9iamVjdCB3aGljaCBpcyBhbiBpbnN0YW5jZSBvZiBTeW1ib2xWYWx1ZS5cbiAgLy8gQ2FsbGluZyBTeW1ib2wgYXMgYSBmdW5jdGlvbiByZXR1cm5zIGEgc3ltYm9sIHZhbHVlIG9iamVjdC5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGVuYWJsZWQgdGhlbiBhbGwgcHJvcGVydHkgYWNjZXNzZXMgYXJlIHRyYW5zZm9ybWVkXG4gIC8vIGludG8gcnVudGltZSBjYWxscyB3aGljaCB1c2VzIHRoZSBpbnRlcm5hbCBzdHJpbmcgYXMgdGhlIHJlYWwgcHJvcGVydHlcbiAgLy8gbmFtZS5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGRpc2FibGVkIHN5bWJvbHMganVzdCB0b1N0cmluZyBhcyB0aGVpciBpbnRlcm5hbFxuICAvLyByZXByZXNlbnRhdGlvbiwgbWFraW5nIHRoZW0gd29yayBidXQgbGVhayBhcyBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG5cbiAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgdW5pcXVlIHN0cmluZy5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgZnVuY3Rpb24gbmV3VW5pcXVlU3RyaW5nKCkge1xuICAgIHJldHVybiAnX18kJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDFlOSkgKyAnJCcgKyArK2NvdW50ZXIgKyAnJF9fJztcbiAgfVxuXG4gIC8vIFRoZSBzdHJpbmcgdXNlZCBmb3IgdGhlIHJlYWwgcHJvcGVydHkuXG4gIHZhciBzeW1ib2xJbnRlcm5hbFByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG5cbiAgLy8gVXNlZCBmb3IgdGhlIFN5bWJvbCB3cmFwcGVyXG4gIHZhciBzeW1ib2xEYXRhUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcblxuICAvLyBBbGwgc3ltYm9sIHZhbHVlcyBhcmUga2VwdCBpbiB0aGlzIG1hcC4gVGhpcyBpcyBzbyB0aGF0IHdlIGNhbiBnZXQgYmFjayB0b1xuICAvLyB0aGUgc3ltYm9sIG9iamVjdCBpZiBhbGwgd2UgaGF2ZSBpcyB0aGUgc3RyaW5nIGtleSByZXByZXNlbnRpbmcgdGhlIHN5bWJvbC5cbiAgdmFyIHN5bWJvbFZhbHVlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgZnVuY3Rpb24gaXNTeW1ib2woc3ltYm9sKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzeW1ib2wgPT09ICdvYmplY3QnICYmIHN5bWJvbCBpbnN0YW5jZW9mIFN5bWJvbFZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gdHlwZU9mKHYpIHtcbiAgICBpZiAoaXNTeW1ib2wodikpXG4gICAgICByZXR1cm4gJ3N5bWJvbCc7XG4gICAgcmV0dXJuIHR5cGVvZiB2O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdW5pcXVlIHN5bWJvbCBvYmplY3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc3RyaW5nIE9wdGlvbmFsIHN0cmluZyB1c2VkIGZvciB0b1N0cmluZy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcbiAgICB2YXIgdmFsdWUgPSBuZXcgU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTeW1ib2wpKVxuICAgICAgcmV0dXJuIHZhbHVlO1xuXG4gICAgLy8gbmV3IFN5bWJvbCBzaG91bGQgdGhyb3cuXG4gICAgLy9cbiAgICAvLyBUaGVyZSBhcmUgdHdvIHdheXMgdG8gZ2V0IGEgd3JhcHBlciB0byBhIHN5bWJvbC4gRWl0aGVyIGJ5IGRvaW5nXG4gICAgLy8gT2JqZWN0KHN5bWJvbCkgb3IgY2FsbCBhIG5vbiBzdHJpY3QgZnVuY3Rpb24gdXNpbmcgYSBzeW1ib2wgdmFsdWUgYXNcbiAgICAvLyB0aGlzLiBUbyBjb3JyZWN0bHkgaGFuZGxlIHRoZXNlIHR3byB3b3VsZCByZXF1aXJlIGEgbG90IG9mIHdvcmsgZm9yIHZlcnlcbiAgICAvLyBsaXR0bGUgZ2FpbiBzbyB3ZSBhcmUgbm90IGRvaW5nIHRob3NlIGF0IHRoZSBtb21lbnQuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGNhbm5vdCBiZSBuZXdcXCdlZCcpO1xuICB9XG5cbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2wucHJvdG90eXBlLCAndG9TdHJpbmcnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgaWYgKCFzeW1ib2xWYWx1ZSlcbiAgICAgIHRocm93IFR5cGVFcnJvcignQ29udmVyc2lvbiBmcm9tIHN5bWJvbCB0byBzdHJpbmcnKTtcbiAgICB2YXIgZGVzYyA9IHN5bWJvbFZhbHVlW3N5bWJvbERlc2NyaXB0aW9uUHJvcGVydHldO1xuICAgIGlmIChkZXNjID09PSB1bmRlZmluZWQpXG4gICAgICBkZXNjID0gJyc7XG4gICAgcmV0dXJuICdTeW1ib2woJyArIGRlc2MgKyAnKSc7XG4gIH0pKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd2YWx1ZU9mJywgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlO1xuICB9KSk7XG5cbiAgZnVuY3Rpb24gU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pIHtcbiAgICB2YXIga2V5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERhdGFQcm9wZXJ0eSwge3ZhbHVlOiB0aGlzfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbEludGVybmFsUHJvcGVydHksIHt2YWx1ZToga2V5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHksIHt2YWx1ZTogZGVzY3JpcHRpb259KTtcbiAgICAkZnJlZXplKHRoaXMpO1xuICAgIHN5bWJvbFZhbHVlc1trZXldID0gdGhpcztcbiAgfVxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbCkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndG9TdHJpbmcnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd2YWx1ZU9mJywge1xuICAgIHZhbHVlOiBTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRmcmVlemUoU3ltYm9sVmFsdWUucHJvdG90eXBlKTtcblxuICBTeW1ib2wuaXRlcmF0b3IgPSBTeW1ib2woKTtcblxuICBmdW5jdGlvbiB0b1Byb3BlcnR5KG5hbWUpIHtcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpXG4gICAgICByZXR1cm4gbmFtZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGdldE93blByb3BlcnR5TmFtZXMgdG8gZmlsdGVyIG91dCBwcml2YXRlIG5hbWUga2V5cy5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICBpZiAoIXN5bWJvbFZhbHVlc1tuYW1lXSlcbiAgICAgICAgcnYucHVzaChuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkge1xuICAgIHJldHVybiAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgdmFyIG5hbWVzID0gJGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3ltYm9sID0gc3ltYm9sVmFsdWVzW25hbWVzW2ldXTtcbiAgICAgIGlmIChzeW1ib2wpXG4gICAgICAgIHJ2LnB1c2goc3ltYm9sKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgT2JqZWN0LnByb3RvdHBlLmhhc093blByb3BlcnR5IHRvIGFsd2F5cyByZXR1cm4gZmFsc2UgZm9yXG4gIC8vIHByaXZhdGUgbmFtZXMuXG4gIGZ1bmN0aW9uIGhhc093blByb3BlcnR5KG5hbWUpIHtcbiAgICByZXR1cm4gJGhhc093blByb3BlcnR5LmNhbGwodGhpcywgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPcHRpb24obmFtZSkge1xuICAgIHJldHVybiBnbG9iYWwudHJhY2V1ciAmJiBnbG9iYWwudHJhY2V1ci5vcHRpb25zW25hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJvcGVydHkob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBzeW0sIGRlc2M7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICBzeW0gPSBuYW1lO1xuICAgICAgbmFtZSA9IG5hbWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgfVxuICAgIG9iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgIGlmIChzeW0gJiYgKGRlc2MgPSAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkpKVxuICAgICAgJGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwge2VudW1lcmFibGU6IGZhbHNlfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKSB7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICAvLyBTeW1ib2xzIHNob3VsZCBub3QgYmUgZW51bWVyYWJsZS4gV2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgZGVzY3JpcHRvclxuICAgICAgLy8gYmVmb3JlIGNhbGxpbmcgdGhlIG9yaWdpbmFsIGRlZmluZVByb3BlcnR5IGJlY2F1c2UgdGhlIHByb3BlcnR5IG1pZ2h0XG4gICAgICAvLyBiZSBtYWRlIG5vbiBjb25maWd1cmFibGUuXG4gICAgICBpZiAoZGVzY3JpcHRvci5lbnVtZXJhYmxlKSB7XG4gICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuY3JlYXRlKGRlc2NyaXB0b3IsIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB7dmFsdWU6IGZhbHNlfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG5hbWUgPSBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIH1cbiAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKTtcblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbE9iamVjdChPYmplY3QpIHtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZGVmaW5lUHJvcGVydHknLCB7dmFsdWU6IGRlZmluZVByb3BlcnR5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2dldE93blByb3BlcnR5TmFtZXMnLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGdldE93blByb3BlcnR5TmFtZXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yJyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3J9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ2hhc093blByb3BlcnR5JyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBoYXNPd25Qcm9wZXJ0eX0pO1xuXG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scztcblxuICAgIC8vIE9iamVjdC5pc1xuXG4gICAgLy8gVW5saWtlID09PSB0aGlzIHJldHVybnMgdHJ1ZSBmb3IgKE5hTiwgTmFOKSBhbmQgZmFsc2UgZm9yICgwLCAtMCkuXG4gICAgZnVuY3Rpb24gaXMobGVmdCwgcmlnaHQpIHtcbiAgICAgIGlmIChsZWZ0ID09PSByaWdodClcbiAgICAgICAgcmV0dXJuIGxlZnQgIT09IDAgfHwgMSAvIGxlZnQgPT09IDEgLyByaWdodDtcbiAgICAgIHJldHVybiBsZWZ0ICE9PSBsZWZ0ICYmIHJpZ2h0ICE9PSByaWdodDtcbiAgICB9XG5cbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnaXMnLCBtZXRob2QoaXMpKTtcblxuICAgIC8vIE9iamVjdC5hc3NpZ24gKDE5LjEuMy4xKVxuICAgIGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BzW3BdXSA9IHNvdXJjZVtwcm9wc1twXV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdhc3NpZ24nLCBtZXRob2QoYXNzaWduKSk7XG5cbiAgICAvLyBPYmplY3QubWl4aW4gKDE5LjEuMy4xNSlcbiAgICBmdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBkZXNjcmlwdG9yLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgZGVzY3JpcHRvciA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBwcm9wc1twXSk7XG4gICAgICAgICRkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BzW3BdLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ21peGluJywgbWV0aG9kKG1peGluKSk7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbEFycmF5KEFycmF5KSB7XG4gICAgLy8gTWFrZSBhcnJheXMgaXRlcmFibGUuXG4gICAgLy8gVE9ETyhhcnYpOiBUaGlzIGlzIG5vdCB2ZXJ5IHJvYnVzdCB0byBjaGFuZ2VzIGluIHRoZSBwcml2YXRlIG5hbWVzXG4gICAgLy8gb3B0aW9uIGJ1dCBmb3J0dW5hdGVseSB0aGlzIGlzIG5vdCBzb21ldGhpbmcgdGhhdCBpcyBleHBlY3RlZCB0byBjaGFuZ2VcbiAgICAvLyBhdCBydW50aW1lIG91dHNpZGUgb2YgdGVzdHMuXG4gICAgZGVmaW5lUHJvcGVydHkoQXJyYXkucHJvdG90eXBlLCBTeW1ib2wuaXRlcmF0b3IsIG1ldGhvZChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgYXJyYXkgPSB0aGlzO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOiBhcnJheVtpbmRleCsrXSwgZG9uZTogZmFsc2V9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWV9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYW5jZWxsZXJcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBEZWZlcnJlZChjYW5jZWxsZXIpIHtcbiAgICB0aGlzLmNhbmNlbGxlcl8gPSBjYW5jZWxsZXI7XG4gICAgdGhpcy5saXN0ZW5lcnNfID0gW107XG4gIH1cblxuICBmdW5jdGlvbiBub3RpZnkoc2VsZikge1xuICAgIHdoaWxlIChzZWxmLmxpc3RlbmVyc18ubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGN1cnJlbnQgPSBzZWxmLmxpc3RlbmVyc18uc2hpZnQoKTtcbiAgICAgIHZhciBjdXJyZW50UmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2VsZi5yZXN1bHRfWzFdKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5lcnJiYWNrKVxuICAgICAgICAgICAgICBjdXJyZW50UmVzdWx0ID0gY3VycmVudC5lcnJiYWNrLmNhbGwodW5kZWZpbmVkLCBzZWxmLnJlc3VsdF9bMF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5jYWxsYmFjaylcbiAgICAgICAgICAgICAgY3VycmVudFJlc3VsdCA9IGN1cnJlbnQuY2FsbGJhY2suY2FsbCh1bmRlZmluZWQsIHNlbGYucmVzdWx0X1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuY2FsbGJhY2soY3VycmVudFJlc3VsdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuZXJyYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoICh1bnVzZWQpIHt9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmlyZShzZWxmLCB2YWx1ZSwgaXNFcnJvcikge1xuICAgIGlmIChzZWxmLmZpcmVkXylcbiAgICAgIHRocm93IG5ldyBFcnJvcignYWxyZWFkeSBmaXJlZCcpO1xuXG4gICAgc2VsZi5maXJlZF8gPSB0cnVlO1xuICAgIHNlbGYucmVzdWx0XyA9IFt2YWx1ZSwgaXNFcnJvcl07XG4gICAgbm90aWZ5KHNlbGYpO1xuICB9XG5cbiAgRGVmZXJyZWQucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBEZWZlcnJlZCxcblxuICAgIGZpcmVkXzogZmFsc2UsXG4gICAgcmVzdWx0XzogdW5kZWZpbmVkLFxuXG4gICAgY3JlYXRlUHJvbWlzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge3RoZW46IHRoaXMudGhlbi5iaW5kKHRoaXMpLCBjYW5jZWw6IHRoaXMuY2FuY2VsLmJpbmQodGhpcyl9O1xuICAgIH0sXG5cbiAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZpcmUodGhpcywgdmFsdWUsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgZXJyYmFjazogZnVuY3Rpb24oZXJyKSB7XG4gICAgICBmaXJlKHRoaXMsIGVyciwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHRoZW46IGZ1bmN0aW9uKGNhbGxiYWNrLCBlcnJiYWNrKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IERlZmVycmVkKHRoaXMuY2FuY2VsLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5saXN0ZW5lcnNfLnB1c2goe1xuICAgICAgICBkZWZlcnJlZDogcmVzdWx0LFxuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgIGVycmJhY2s6IGVycmJhY2tcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuZmlyZWRfKVxuICAgICAgICBub3RpZnkodGhpcyk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNyZWF0ZVByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmZpcmVkXylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbHJlYWR5IGZpbmlzaGVkJyk7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgaWYgKHRoaXMuY2FuY2VsbGVyXykge1xuICAgICAgICByZXN1bHQgPSB0aGlzLmNhbmNlbGxlcl8odGhpcyk7XG4gICAgICAgIGlmICghcmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEVycm9yKHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBuZXcgRXJyb3IoJ2NhbmNlbGxlZCcpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmZpcmVkXykge1xuICAgICAgICB0aGlzLnJlc3VsdF8gPSBbcmVzdWx0LCB0cnVlXTtcbiAgICAgICAgbm90aWZ5KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBTeXN0ZW0uZ2V0L3NldCBhbmQgQHRyYWNldXIvbW9kdWxlIGdldHMgb3ZlcnJpZGRlbiBpbiBAdHJhY2V1ci9tb2R1bGVzIHRvXG4gIC8vIGJlIG1vcmUgY29ycmVjdC5cblxuICBmdW5jdGlvbiBNb2R1bGVJbXBsKHVybCwgZnVuYywgc2VsZikge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZnVuYyA9IGZ1bmM7XG4gICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICB0aGlzLnZhbHVlXyA9IG51bGw7XG4gIH1cbiAgTW9kdWxlSW1wbC5wcm90b3R5cGUgPSB7XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgaWYgKHRoaXMudmFsdWVfKVxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZV87XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZV8gPSB0aGlzLmZ1bmMuY2FsbCh0aGlzLnNlbGYpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbW9kdWxlcyA9IHtcbiAgICAnQHRyYWNldXIvbW9kdWxlJzoge1xuICAgICAgTW9kdWxlSW1wbDogTW9kdWxlSW1wbCxcbiAgICAgIHJlZ2lzdGVyTW9kdWxlOiBmdW5jdGlvbih1cmwsIGZ1bmMsIHNlbGYpIHtcbiAgICAgICAgbW9kdWxlc1t1cmxdID0gbmV3IE1vZHVsZUltcGwodXJsLCBmdW5jLCBzZWxmKTtcbiAgICAgIH0sXG4gICAgICBnZXRNb2R1bGVJbXBsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbdXJsXS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIFN5c3RlbSA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBtb2R1bGUgPSBtb2R1bGVzW25hbWVdO1xuICAgICAgaWYgKG1vZHVsZSBpbnN0YW5jZW9mIE1vZHVsZUltcGwpXG4gICAgICAgIHJldHVybiBtb2R1bGVzW25hbWVdID0gbW9kdWxlLnZhbHVlO1xuICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24obmFtZSwgb2JqZWN0KSB7XG4gICAgICBtb2R1bGVzW25hbWVdID0gb2JqZWN0O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBzZXR1cEdsb2JhbHMoZ2xvYmFsKSB7XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sKVxuICAgICAgZ2xvYmFsLlN5bWJvbCA9IFN5bWJvbDtcbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wuaXRlcmF0b3IpXG4gICAgICBnbG9iYWwuU3ltYm9sLml0ZXJhdG9yID0gU3ltYm9sKCk7XG5cbiAgICBwb2x5ZmlsbFN0cmluZyhnbG9iYWwuU3RyaW5nKTtcbiAgICBwb2x5ZmlsbE9iamVjdChnbG9iYWwuT2JqZWN0KTtcbiAgICBwb2x5ZmlsbEFycmF5KGdsb2JhbC5BcnJheSk7XG4gICAgZ2xvYmFsLlN5c3RlbSA9IFN5c3RlbTtcbiAgICAvLyBUT0RPKGFydik6IERvbid0IGV4cG9ydCB0aGlzLlxuICAgIGdsb2JhbC5EZWZlcnJlZCA9IERlZmVycmVkO1xuICB9XG5cbiAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG5cbiAgLy8gVGhpcyBmaWxlIGlzIHNvbWV0aW1lcyB1c2VkIHdpdGhvdXQgdHJhY2V1ci5qcyBzbyBtYWtlIGl0IGEgbmV3IGdsb2JhbC5cbiAgZ2xvYmFsLiR0cmFjZXVyUnVudGltZSA9IHtcbiAgICBEZWZlcnJlZDogRGVmZXJyZWQsXG4gICAgc2V0UHJvcGVydHk6IHNldFByb3BlcnR5LFxuICAgIHNldHVwR2xvYmFsczogc2V0dXBHbG9iYWxzLFxuICAgIHRvUHJvcGVydHk6IHRvUHJvcGVydHksXG4gICAgdHlwZW9mOiB0eXBlT2YsXG4gIH07XG5cbn0pKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcyk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvLyEgbW9tZW50LmpzXG4vLyEgdmVyc2lvbiA6IDIuNS4xXG4vLyEgYXV0aG9ycyA6IFRpbSBXb29kLCBJc2tyZW4gQ2hlcm5ldiwgTW9tZW50LmpzIGNvbnRyaWJ1dG9yc1xuLy8hIGxpY2Vuc2UgOiBNSVRcbi8vISBtb21lbnRqcy5jb21cblxuKGZ1bmN0aW9uICh1bmRlZmluZWQpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG1vbWVudCxcbiAgICAgICAgVkVSU0lPTiA9IFwiMi41LjFcIixcbiAgICAgICAgZ2xvYmFsID0gdGhpcyxcbiAgICAgICAgcm91bmQgPSBNYXRoLnJvdW5kLFxuICAgICAgICBpLFxuXG4gICAgICAgIFlFQVIgPSAwLFxuICAgICAgICBNT05USCA9IDEsXG4gICAgICAgIERBVEUgPSAyLFxuICAgICAgICBIT1VSID0gMyxcbiAgICAgICAgTUlOVVRFID0gNCxcbiAgICAgICAgU0VDT05EID0gNSxcbiAgICAgICAgTUlMTElTRUNPTkQgPSA2LFxuXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcblxuICAgICAgICAvLyBtb21lbnQgaW50ZXJuYWwgcHJvcGVydGllc1xuICAgICAgICBtb21lbnRQcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgX2lzQU1vbWVudE9iamVjdDogbnVsbCxcbiAgICAgICAgICAgIF9pIDogbnVsbCxcbiAgICAgICAgICAgIF9mIDogbnVsbCxcbiAgICAgICAgICAgIF9sIDogbnVsbCxcbiAgICAgICAgICAgIF9zdHJpY3QgOiBudWxsLFxuICAgICAgICAgICAgX2lzVVRDIDogbnVsbCxcbiAgICAgICAgICAgIF9vZmZzZXQgOiBudWxsLCAgLy8gb3B0aW9uYWwuIENvbWJpbmUgd2l0aCBfaXNVVENcbiAgICAgICAgICAgIF9wZiA6IG51bGwsXG4gICAgICAgICAgICBfbGFuZyA6IG51bGwgIC8vIG9wdGlvbmFsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgJiYgdHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnKSxcblxuICAgICAgICAvLyBBU1AuTkVUIGpzb24gZGF0ZSBmb3JtYXQgcmVnZXhcbiAgICAgICAgYXNwTmV0SnNvblJlZ2V4ID0gL15cXC8/RGF0ZVxcKChcXC0/XFxkKykvaSxcbiAgICAgICAgYXNwTmV0VGltZVNwYW5Kc29uUmVnZXggPSAvKFxcLSk/KD86KFxcZCopXFwuKT8oXFxkKylcXDooXFxkKykoPzpcXDooXFxkKylcXC4/KFxcZHszfSk/KT8vLFxuXG4gICAgICAgIC8vIGZyb20gaHR0cDovL2RvY3MuY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL2dpdC9jbG9zdXJlX2dvb2dfZGF0ZV9kYXRlLmpzLnNvdXJjZS5odG1sXG4gICAgICAgIC8vIHNvbWV3aGF0IG1vcmUgaW4gbGluZSB3aXRoIDQuNC4zLjIgMjAwNCBzcGVjLCBidXQgYWxsb3dzIGRlY2ltYWwgYW55d2hlcmVcbiAgICAgICAgaXNvRHVyYXRpb25SZWdleCA9IC9eKC0pP1AoPzooPzooWzAtOSwuXSopWSk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilEKT8oPzpUKD86KFswLTksLl0qKUgpPyg/OihbMC05LC5dKilNKT8oPzooWzAtOSwuXSopUyk/KT98KFswLTksLl0qKVcpJC8sXG5cbiAgICAgICAgLy8gZm9ybWF0IHRva2Vuc1xuICAgICAgICBmb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KE1vfE1NP00/TT98RG98REREb3xERD9EP0Q/fGRkZD9kP3xkbz98d1tvfHddP3xXW298V10/fFlZWVlZWXxZWVlZWXxZWVlZfFlZfGdnKGdnZz8pP3xHRyhHR0c/KT98ZXxFfGF8QXxoaD98SEg/fG1tP3xzcz98U3sxLDR9fFh8eno/fFpaP3wuKS9nLFxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFR8TEw/TD9MP3xsezEsNH0pL2csXG5cbiAgICAgICAgLy8gcGFyc2luZyB0b2tlbiByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cyA9IC9cXGRcXGQ/LywgLy8gMCAtIDk5XG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb1RocmVlRGlnaXRzID0gL1xcZHsxLDN9LywgLy8gMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzID0gL1xcZHsxLDR9LywgLy8gMCAtIDk5OTlcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzID0gL1srXFwtXT9cXGR7MSw2fS8sIC8vIC05OTksOTk5IC0gOTk5LDk5OVxuICAgICAgICBwYXJzZVRva2VuRGlnaXRzID0gL1xcZCsvLCAvLyBub256ZXJvIG51bWJlciBvZiBkaWdpdHNcbiAgICAgICAgcGFyc2VUb2tlbldvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaSwgLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lem9uZSA9IC9afFtcXCtcXC1dXFxkXFxkOj9cXGRcXGQvZ2ksIC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxuICAgICAgICBwYXJzZVRva2VuVCA9IC9UL2ksIC8vIFQgKElTTyBzZXBhcmF0b3IpXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lc3RhbXBNcyA9IC9bXFwrXFwtXT9cXGQrKFxcLlxcZHsxLDN9KT8vLCAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xuXG4gICAgICAgIC8vc3RyaWN0IHBhcnNpbmcgcmVnZXhlc1xuICAgICAgICBwYXJzZVRva2VuT25lRGlnaXQgPSAvXFxkLywgLy8gMCAtIDlcbiAgICAgICAgcGFyc2VUb2tlblR3b0RpZ2l0cyA9IC9cXGRcXGQvLCAvLyAwMCAtIDk5XG4gICAgICAgIHBhcnNlVG9rZW5UaHJlZURpZ2l0cyA9IC9cXGR7M30vLCAvLyAwMDAgLSA5OTlcbiAgICAgICAgcGFyc2VUb2tlbkZvdXJEaWdpdHMgPSAvXFxkezR9LywgLy8gMDAwMCAtIDk5OTlcbiAgICAgICAgcGFyc2VUb2tlblNpeERpZ2l0cyA9IC9bKy1dP1xcZHs2fS8sIC8vIC05OTksOTk5IC0gOTk5LDk5OVxuICAgICAgICBwYXJzZVRva2VuU2lnbmVkTnVtYmVyID0gL1srLV0/XFxkKy8sIC8vIC1pbmYgLSBpbmZcblxuICAgICAgICAvLyBpc28gODYwMSByZWdleFxuICAgICAgICAvLyAwMDAwLTAwLTAwIDAwMDAtVzAwIG9yIDAwMDAtVzAwLTAgKyBUICsgMDAgb3IgMDA6MDAgb3IgMDA6MDA6MDAgb3IgMDA6MDA6MDAuMDAwICsgKzAwOjAwIG9yICswMDAwIG9yICswMClcbiAgICAgICAgaXNvUmVnZXggPSAvXlxccyooPzpbKy1dXFxkezZ9fFxcZHs0fSktKD86KFxcZFxcZC1cXGRcXGQpfChXXFxkXFxkJCl8KFdcXGRcXGQtXFxkKXwoXFxkXFxkXFxkKSkoKFR8ICkoXFxkXFxkKDpcXGRcXGQoOlxcZFxcZChcXC5cXGQrKT8pPyk/KT8oW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvLFxuXG4gICAgICAgIGlzb0Zvcm1hdCA9ICdZWVlZLU1NLUREVEhIOm1tOnNzWicsXG5cbiAgICAgICAgaXNvRGF0ZXMgPSBbXG4gICAgICAgICAgICBbJ1lZWVlZWS1NTS1ERCcsIC9bKy1dXFxkezZ9LVxcZHsyfS1cXGR7Mn0vXSxcbiAgICAgICAgICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkezJ9LVxcZHsyfS9dLFxuICAgICAgICAgICAgWydHR0dHLVtXXVdXLUUnLCAvXFxkezR9LVdcXGR7Mn0tXFxkL10sXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1cnLCAvXFxkezR9LVdcXGR7Mn0vXSxcbiAgICAgICAgICAgIFsnWVlZWS1EREQnLCAvXFxkezR9LVxcZHszfS9dXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gaXNvIHRpbWUgZm9ybWF0cyBhbmQgcmVnZXhlc1xuICAgICAgICBpc29UaW1lcyA9IFtcbiAgICAgICAgICAgIFsnSEg6bW06c3MuU1NTUycsIC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkXFwuXFxkezEsM30vXSxcbiAgICAgICAgICAgIFsnSEg6bW06c3MnLCAvKFR8IClcXGRcXGQ6XFxkXFxkOlxcZFxcZC9dLFxuICAgICAgICAgICAgWydISDptbScsIC8oVHwgKVxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgICAgIFsnSEgnLCAvKFR8IClcXGRcXGQvXVxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIHRpbWV6b25lIGNodW5rZXIgXCIrMTA6MDBcIiA+IFtcIjEwXCIsIFwiMDBcIl0gb3IgXCItMTUzMFwiID4gW1wiLTE1XCIsIFwiMzBcIl1cbiAgICAgICAgcGFyc2VUaW1lem9uZUNodW5rZXIgPSAvKFtcXCtcXC1dfFxcZFxcZCkvZ2ksXG5cbiAgICAgICAgLy8gZ2V0dGVyIGFuZCBzZXR0ZXIgbmFtZXNcbiAgICAgICAgcHJveHlHZXR0ZXJzQW5kU2V0dGVycyA9ICdEYXRlfEhvdXJzfE1pbnV0ZXN8U2Vjb25kc3xNaWxsaXNlY29uZHMnLnNwbGl0KCd8JyksXG4gICAgICAgIHVuaXRNaWxsaXNlY29uZEZhY3RvcnMgPSB7XG4gICAgICAgICAgICAnTWlsbGlzZWNvbmRzJyA6IDEsXG4gICAgICAgICAgICAnU2Vjb25kcycgOiAxZTMsXG4gICAgICAgICAgICAnTWludXRlcycgOiA2ZTQsXG4gICAgICAgICAgICAnSG91cnMnIDogMzZlNSxcbiAgICAgICAgICAgICdEYXlzJyA6IDg2NGU1LFxuICAgICAgICAgICAgJ01vbnRocycgOiAyNTkyZTYsXG4gICAgICAgICAgICAnWWVhcnMnIDogMzE1MzZlNlxuICAgICAgICB9LFxuXG4gICAgICAgIHVuaXRBbGlhc2VzID0ge1xuICAgICAgICAgICAgbXMgOiAnbWlsbGlzZWNvbmQnLFxuICAgICAgICAgICAgcyA6ICdzZWNvbmQnLFxuICAgICAgICAgICAgbSA6ICdtaW51dGUnLFxuICAgICAgICAgICAgaCA6ICdob3VyJyxcbiAgICAgICAgICAgIGQgOiAnZGF5JyxcbiAgICAgICAgICAgIEQgOiAnZGF0ZScsXG4gICAgICAgICAgICB3IDogJ3dlZWsnLFxuICAgICAgICAgICAgVyA6ICdpc29XZWVrJyxcbiAgICAgICAgICAgIE0gOiAnbW9udGgnLFxuICAgICAgICAgICAgeSA6ICd5ZWFyJyxcbiAgICAgICAgICAgIERERCA6ICdkYXlPZlllYXInLFxuICAgICAgICAgICAgZSA6ICd3ZWVrZGF5JyxcbiAgICAgICAgICAgIEUgOiAnaXNvV2Vla2RheScsXG4gICAgICAgICAgICBnZzogJ3dlZWtZZWFyJyxcbiAgICAgICAgICAgIEdHOiAnaXNvV2Vla1llYXInXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FtZWxGdW5jdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXlvZnllYXIgOiAnZGF5T2ZZZWFyJyxcbiAgICAgICAgICAgIGlzb3dlZWtkYXkgOiAnaXNvV2Vla2RheScsXG4gICAgICAgICAgICBpc293ZWVrIDogJ2lzb1dlZWsnLFxuICAgICAgICAgICAgd2Vla3llYXIgOiAnd2Vla1llYXInLFxuICAgICAgICAgICAgaXNvd2Vla3llYXIgOiAnaXNvV2Vla1llYXInXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gZm9ybWF0IGZ1bmN0aW9uIHN0cmluZ3NcbiAgICAgICAgZm9ybWF0RnVuY3Rpb25zID0ge30sXG5cbiAgICAgICAgLy8gdG9rZW5zIHRvIG9yZGluYWxpemUgYW5kIHBhZFxuICAgICAgICBvcmRpbmFsaXplVG9rZW5zID0gJ0RERCB3IFcgTSBEIGQnLnNwbGl0KCcgJyksXG4gICAgICAgIHBhZGRlZFRva2VucyA9ICdNIEQgSCBoIG0gcyB3IFcnLnNwbGl0KCcgJyksXG5cbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnMgPSB7XG4gICAgICAgICAgICBNICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIE1NTSAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTU1NTSA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgREREICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXlPZlllYXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRkICAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzTWluKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGRkICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNTaG9ydCh0aGlzLCBmb3JtYXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRkZGQgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgVyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVkgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMueWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVlZWSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpLCBzaWduID0geSA+PSAwID8gJysnIDogJy0nO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaWduICsgbGVmdFplcm9GaWxsKE1hdGguYWJzKHkpLCA2KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZ2dnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZ2dnZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMud2Vla1llYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0cgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMCwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0dHRyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0dHR0cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLmlzb1dlZWtZZWFyKCksIDUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2Vla2RheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2Vla2RheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGEgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEEgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBIICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5taW51dGVzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWNvbmRzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwMCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU1MgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRvSW50KHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMCksIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNTUyAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTU1NTIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5taWxsaXNlY29uZHMoKSwgMyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWiAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IC10aGlzLnpvbmUoKSxcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiK1wiO1xuICAgICAgICAgICAgICAgIGlmIChhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIi1cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyBcIjpcIiArIGxlZnRaZXJvRmlsbCh0b0ludChhKSAlIDYwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBaWiAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxuICAgICAgICAgICAgICAgICAgICBiID0gXCIrXCI7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiLVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYiArIGxlZnRaZXJvRmlsbCh0b0ludChhIC8gNjApLCAyKSArIGxlZnRaZXJvRmlsbCh0b0ludChhKSAlIDYwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB6IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmVBYmJyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgenogOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZU5hbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBYICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVuaXgoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBRIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1YXJ0ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsaXN0cyA9IFsnbW9udGhzJywgJ21vbnRoc1Nob3J0JywgJ3dlZWtkYXlzJywgJ3dlZWtkYXlzU2hvcnQnLCAnd2Vla2RheXNNaW4nXTtcblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRQYXJzaW5nRmxhZ3MoKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdCwgYW5kIGVzNSBzdGFuZGFyZCBpcyBub3QgdmVyeVxuICAgICAgICAvLyBoZWxwZnVsLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW1wdHkgOiBmYWxzZSxcbiAgICAgICAgICAgIHVudXNlZFRva2VucyA6IFtdLFxuICAgICAgICAgICAgdW51c2VkSW5wdXQgOiBbXSxcbiAgICAgICAgICAgIG92ZXJmbG93IDogLTIsXG4gICAgICAgICAgICBjaGFyc0xlZnRPdmVyIDogMCxcbiAgICAgICAgICAgIG51bGxJbnB1dCA6IGZhbHNlLFxuICAgICAgICAgICAgaW52YWxpZE1vbnRoIDogbnVsbCxcbiAgICAgICAgICAgIGludmFsaWRGb3JtYXQgOiBmYWxzZSxcbiAgICAgICAgICAgIHVzZXJJbnZhbGlkYXRlZCA6IGZhbHNlLFxuICAgICAgICAgICAgaXNvOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhZFRva2VuKGZ1bmMsIGNvdW50KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbChmdW5jLmNhbGwodGhpcywgYSksIGNvdW50KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb3JkaW5hbGl6ZVRva2VuKGZ1bmMsIHBlcmlvZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5vcmRpbmFsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgcGVyaW9kKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB3aGlsZSAob3JkaW5hbGl6ZVRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IG9yZGluYWxpemVUb2tlbnMucG9wKCk7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW2kgKyAnbyddID0gb3JkaW5hbGl6ZVRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zW2ldLCBpKTtcbiAgICB9XG4gICAgd2hpbGUgKHBhZGRlZFRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IHBhZGRlZFRva2Vucy5wb3AoKTtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArIGldID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIDIpO1xuICAgIH1cbiAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREREID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnMuRERELCAzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBMYW5ndWFnZSgpIHtcblxuICAgIH1cblxuICAgIC8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTW9tZW50KGNvbmZpZykge1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgICAgIGV4dGVuZCh0aGlzLCBjb25maWcpO1xuICAgIH1cblxuICAgIC8vIER1cmF0aW9uIENvbnN0cnVjdG9yXG4gICAgZnVuY3Rpb24gRHVyYXRpb24oZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGR1cmF0aW9uKSxcbiAgICAgICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcbiAgICAgICAgICAgIG1vbnRocyA9IG5vcm1hbGl6ZWRJbnB1dC5tb250aCB8fCAwLFxuICAgICAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxuICAgICAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcbiAgICAgICAgICAgIGhvdXJzID0gbm9ybWFsaXplZElucHV0LmhvdXIgfHwgMCxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXG4gICAgICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kIHx8IDA7XG5cbiAgICAgICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcbiAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXG4gICAgICAgICAgICBzZWNvbmRzICogMWUzICsgLy8gMTAwMFxuICAgICAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgaG91cnMgKiAzNmU1OyAvLyAxMDAwICogNjAgKiA2MFxuICAgICAgICAvLyBCZWNhdXNlIG9mIGRhdGVBZGRSZW1vdmUgdHJlYXRzIDI0IGhvdXJzIGFzIGRpZmZlcmVudCBmcm9tIGFcbiAgICAgICAgLy8gZGF5IHdoZW4gd29ya2luZyBhcm91bmQgRFNULCB3ZSBuZWVkIHRvIHN0b3JlIHRoZW0gc2VwYXJhdGVseVxuICAgICAgICB0aGlzLl9kYXlzID0gK2RheXMgK1xuICAgICAgICAgICAgd2Vla3MgKiA3O1xuICAgICAgICAvLyBJdCBpcyBpbXBvc3NpYmxlIHRyYW5zbGF0ZSBtb250aHMgaW50byBkYXlzIHdpdGhvdXQga25vd2luZ1xuICAgICAgICAvLyB3aGljaCBtb250aHMgeW91IGFyZSBhcmUgdGFsa2luZyBhYm91dCwgc28gd2UgaGF2ZSB0byBzdG9yZVxuICAgICAgICAvLyBpdCBzZXBhcmF0ZWx5LlxuICAgICAgICB0aGlzLl9tb250aHMgPSArbW9udGhzICtcbiAgICAgICAgICAgIHllYXJzICogMTI7XG5cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIHRoaXMuX2J1YmJsZSgpO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgSGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGFbaV0gPSBiW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGIuaGFzT3duUHJvcGVydHkoXCJ0b1N0cmluZ1wiKSkge1xuICAgICAgICAgICAgYS50b1N0cmluZyA9IGIudG9TdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShcInZhbHVlT2ZcIikpIHtcbiAgICAgICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb25lTW9tZW50KG0pIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9LCBpO1xuICAgICAgICBmb3IgKGkgaW4gbSkge1xuICAgICAgICAgICAgaWYgKG0uaGFzT3duUHJvcGVydHkoaSkgJiYgbW9tZW50UHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IG1baV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic1JvdW5kKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGxlZnQgemVybyBmaWxsIGEgbnVtYmVyXG4gICAgLy8gc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2xlZnQtemVyby1maWxsaW5nIGZvciBwZXJmb3JtYW5jZSBjb21wYXJpc29uXG4gICAgZnVuY3Rpb24gbGVmdFplcm9GaWxsKG51bWJlciwgdGFyZ2V0TGVuZ3RoLCBmb3JjZVNpZ24pIHtcbiAgICAgICAgdmFyIG91dHB1dCA9ICcnICsgTWF0aC5hYnMobnVtYmVyKSxcbiAgICAgICAgICAgIHNpZ24gPSBudW1iZXIgPj0gMDtcblxuICAgICAgICB3aGlsZSAob3V0cHV0Lmxlbmd0aCA8IHRhcmdldExlbmd0aCkge1xuICAgICAgICAgICAgb3V0cHV0ID0gJzAnICsgb3V0cHV0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoc2lnbiA/IChmb3JjZVNpZ24gPyAnKycgOiAnJykgOiAnLScpICsgb3V0cHV0O1xuICAgIH1cblxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgXy5hZGRUaW1lIGFuZCBfLnN1YnRyYWN0VGltZVxuICAgIGZ1bmN0aW9uIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQobW9tLCBkdXJhdGlvbiwgaXNBZGRpbmcsIGlnbm9yZVVwZGF0ZU9mZnNldCkge1xuICAgICAgICB2YXIgbWlsbGlzZWNvbmRzID0gZHVyYXRpb24uX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgIGRheXMgPSBkdXJhdGlvbi5fZGF5cyxcbiAgICAgICAgICAgIG1vbnRocyA9IGR1cmF0aW9uLl9tb250aHMsXG4gICAgICAgICAgICBtaW51dGVzLFxuICAgICAgICAgICAgaG91cnM7XG5cbiAgICAgICAgaWYgKG1pbGxpc2Vjb25kcykge1xuICAgICAgICAgICAgbW9tLl9kLnNldFRpbWUoK21vbS5fZCArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSB0aGUgbWludXRlcyBhbmQgaG91cnMgc28gd2UgY2FuIHJlc3RvcmUgdGhlbVxuICAgICAgICBpZiAoZGF5cyB8fCBtb250aHMpIHtcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBtb20ubWludXRlKCk7XG4gICAgICAgICAgICBob3VycyA9IG1vbS5ob3VyKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRheXMpIHtcbiAgICAgICAgICAgIG1vbS5kYXRlKG1vbS5kYXRlKCkgKyBkYXlzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb250aHMpIHtcbiAgICAgICAgICAgIG1vbS5tb250aChtb20ubW9udGgoKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWlsbGlzZWNvbmRzICYmICFpZ25vcmVVcGRhdGVPZmZzZXQpIHtcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQobW9tKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXN0b3JlIHRoZSBtaW51dGVzIGFuZCBob3VycyBhZnRlciBwb3NzaWJseSBjaGFuZ2luZyBkc3RcbiAgICAgICAgaWYgKGRheXMgfHwgbW9udGhzKSB7XG4gICAgICAgICAgICBtb20ubWludXRlKG1pbnV0ZXMpO1xuICAgICAgICAgICAgbW9tLmhvdXIoaG91cnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgaXMgYW4gYXJyYXlcbiAgICBmdW5jdGlvbiBpc0FycmF5KGlucHV0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRGF0ZShpbnB1dCkge1xuICAgICAgICByZXR1cm4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJyB8fFxuICAgICAgICAgICAgICAgIGlucHV0IGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKSB7XG4gICAgICAgIGlmICh1bml0cykge1xuICAgICAgICAgICAgdmFyIGxvd2VyZWQgPSB1bml0cy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyguKXMkLywgJyQxJyk7XG4gICAgICAgICAgICB1bml0cyA9IHVuaXRBbGlhc2VzW3VuaXRzXSB8fCBjYW1lbEZ1bmN0aW9uc1tsb3dlcmVkXSB8fCBsb3dlcmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bml0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVPYmplY3RVbml0cyhpbnB1dE9iamVjdCkge1xuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXG4gICAgICAgICAgICBub3JtYWxpemVkUHJvcCxcbiAgICAgICAgICAgIHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXRPYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcCA9IG5vcm1hbGl6ZVVuaXRzKHByb3ApO1xuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTGlzdChmaWVsZCkge1xuICAgICAgICB2YXIgY291bnQsIHNldHRlcjtcblxuICAgICAgICBpZiAoZmllbGQuaW5kZXhPZignd2VlaycpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDc7XG4gICAgICAgICAgICBzZXR0ZXIgPSAnZGF5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdtb250aCcpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDEyO1xuICAgICAgICAgICAgc2V0dGVyID0gJ21vbnRoJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vbWVudFtmaWVsZF0gPSBmdW5jdGlvbiAoZm9ybWF0LCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIGksIGdldHRlcixcbiAgICAgICAgICAgICAgICBtZXRob2QgPSBtb21lbnQuZm4uX2xhbmdbZmllbGRdLFxuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXR0ZXIgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgIHZhciBtID0gbW9tZW50KCkudXRjKCkuc2V0KHNldHRlciwgaSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKG1vbWVudC5mbi5fbGFuZywgbSwgZm9ybWF0IHx8ICcnKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldHRlcihpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0dGVyKGkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9JbnQoYXJndW1lbnRGb3JDb2VyY2lvbikge1xuICAgICAgICB2YXIgY29lcmNlZE51bWJlciA9ICthcmd1bWVudEZvckNvZXJjaW9uLFxuICAgICAgICAgICAgdmFsdWUgPSAwO1xuXG4gICAgICAgIGlmIChjb2VyY2VkTnVtYmVyICE9PSAwICYmIGlzRmluaXRlKGNvZXJjZWROdW1iZXIpKSB7XG4gICAgICAgICAgICBpZiAoY29lcmNlZE51bWJlciA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmZsb29yKGNvZXJjZWROdW1iZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IE1hdGguY2VpbChjb2VyY2VkTnVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cobSkge1xuICAgICAgICB2YXIgb3ZlcmZsb3c7XG4gICAgICAgIGlmIChtLl9hICYmIG0uX3BmLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPVxuICAgICAgICAgICAgICAgIG0uX2FbTU9OVEhdIDwgMCB8fCBtLl9hW01PTlRIXSA+IDExID8gTU9OVEggOlxuICAgICAgICAgICAgICAgIG0uX2FbREFURV0gPCAxIHx8IG0uX2FbREFURV0gPiBkYXlzSW5Nb250aChtLl9hW1lFQVJdLCBtLl9hW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgICAgICBtLl9hW0hPVVJdIDwgMCB8fCBtLl9hW0hPVVJdID4gMjMgPyBIT1VSIDpcbiAgICAgICAgICAgICAgICBtLl9hW01JTlVURV0gPCAwIHx8IG0uX2FbTUlOVVRFXSA+IDU5ID8gTUlOVVRFIDpcbiAgICAgICAgICAgICAgICBtLl9hW1NFQ09ORF0gPCAwIHx8IG0uX2FbU0VDT05EXSA+IDU5ID8gU0VDT05EIDpcbiAgICAgICAgICAgICAgICBtLl9hW01JTExJU0VDT05EXSA8IDAgfHwgbS5fYVtNSUxMSVNFQ09ORF0gPiA5OTkgPyBNSUxMSVNFQ09ORCA6XG4gICAgICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgICAgIGlmIChtLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgJiYgKG92ZXJmbG93IDwgWUVBUiB8fCBvdmVyZmxvdyA+IERBVEUpKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBEQVRFO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA9IG92ZXJmbG93O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZChtKSB7XG4gICAgICAgIGlmIChtLl9pc1ZhbGlkID09IG51bGwpIHtcbiAgICAgICAgICAgIG0uX2lzVmFsaWQgPSAhaXNOYU4obS5fZC5nZXRUaW1lKCkpICYmXG4gICAgICAgICAgICAgICAgbS5fcGYub3ZlcmZsb3cgPCAwICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLmVtcHR5ICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLmludmFsaWRNb250aCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5udWxsSW5wdXQgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZEZvcm1hdCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi51c2VySW52YWxpZGF0ZWQ7XG5cbiAgICAgICAgICAgIGlmIChtLl9zdHJpY3QpIHtcbiAgICAgICAgICAgICAgICBtLl9pc1ZhbGlkID0gbS5faXNWYWxpZCAmJlxuICAgICAgICAgICAgICAgICAgICBtLl9wZi5jaGFyc0xlZnRPdmVyID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLnVudXNlZFRva2Vucy5sZW5ndGggPT09IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0uX2lzVmFsaWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5KSB7XG4gICAgICAgIHJldHVybiBrZXkgPyBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdfJywgJy0nKSA6IGtleTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gYSBtb21lbnQgZnJvbSBpbnB1dCwgdGhhdCBpcyBsb2NhbC91dGMvem9uZSBlcXVpdmFsZW50IHRvIG1vZGVsLlxuICAgIGZ1bmN0aW9uIG1ha2VBcyhpbnB1dCwgbW9kZWwpIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsLl9pc1VUQyA/IG1vbWVudChpbnB1dCkuem9uZShtb2RlbC5fb2Zmc2V0IHx8IDApIDpcbiAgICAgICAgICAgIG1vbWVudChpbnB1dCkubG9jYWwoKTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIExhbmd1YWdlc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgZXh0ZW5kKExhbmd1YWdlLnByb3RvdHlwZSwge1xuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciBwcm9wLCBpO1xuICAgICAgICAgICAgZm9yIChpIGluIGNvbmZpZykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfbW9udGhzIDogXCJKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyXCIuc3BsaXQoXCJfXCIpLFxuICAgICAgICBtb250aHMgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1ttLm1vbnRoKCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9tb250aHNTaG9ydCA6IFwiSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWNcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIG1vbnRoc1Nob3J0IDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFttLm1vbnRoKCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vbnRoc1BhcnNlIDogZnVuY3Rpb24gKG1vbnRoTmFtZSkge1xuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50LnV0YyhbMjAwMCwgaV0pO1xuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5cyA6IFwiU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXlcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIHdlZWtkYXlzIDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1ttLmRheSgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfd2Vla2RheXNTaG9ydCA6IFwiU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0XCIuc3BsaXQoXCJfXCIpLFxuICAgICAgICB3ZWVrZGF5c1Nob3J0IDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0W20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5c01pbiA6IFwiU3VfTW9fVHVfV2VfVGhfRnJfU2FcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIHdlZWtkYXlzTWluIDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblttLmRheSgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrZGF5c1BhcnNlIDogZnVuY3Rpb24gKHdlZWtkYXlOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vbSA9IG1vbWVudChbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfbG9uZ0RhdGVGb3JtYXQgOiB7XG4gICAgICAgICAgICBMVCA6IFwiaDptbSBBXCIsXG4gICAgICAgICAgICBMIDogXCJNTS9ERC9ZWVlZXCIsXG4gICAgICAgICAgICBMTCA6IFwiTU1NTSBEIFlZWVlcIixcbiAgICAgICAgICAgIExMTCA6IFwiTU1NTSBEIFlZWVkgTFRcIixcbiAgICAgICAgICAgIExMTEwgOiBcImRkZGQsIE1NTU0gRCBZWVlZIExUXCJcbiAgICAgICAgfSxcbiAgICAgICAgbG9uZ0RhdGVGb3JtYXQgOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XTtcbiAgICAgICAgICAgIGlmICghb3V0cHV0ICYmIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXSkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXS5yZXBsYWNlKC9NTU1NfE1NfEREfGRkZGQvZywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0gPSBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzUE0gOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIC8vIElFOCBRdWlya3MgTW9kZSAmIElFNyBTdGFuZGFyZHMgTW9kZSBkbyBub3QgYWxsb3cgYWNjZXNzaW5nIHN0cmluZ3MgbGlrZSBhcnJheXNcbiAgICAgICAgICAgIC8vIFVzaW5nIGNoYXJBdCBzaG91bGQgYmUgbW9yZSBjb21wYXRpYmxlLlxuICAgICAgICAgICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX21lcmlkaWVtUGFyc2UgOiAvW2FwXVxcLj9tP1xcLj8vaSxcbiAgICAgICAgbWVyaWRpZW0gOiBmdW5jdGlvbiAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcbiAgICAgICAgICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncG0nIDogJ1BNJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfY2FsZW5kYXIgOiB7XG4gICAgICAgICAgICBzYW1lRGF5IDogJ1tUb2RheSBhdF0gTFQnLFxuICAgICAgICAgICAgbmV4dERheSA6ICdbVG9tb3Jyb3cgYXRdIExUJyxcbiAgICAgICAgICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXG4gICAgICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXkgYXRdIExUJyxcbiAgICAgICAgICAgIGxhc3RXZWVrIDogJ1tMYXN0XSBkZGRkIFthdF0gTFQnLFxuICAgICAgICAgICAgc2FtZUVsc2UgOiAnTCdcbiAgICAgICAgfSxcbiAgICAgICAgY2FsZW5kYXIgOiBmdW5jdGlvbiAoa2V5LCBtb20pIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9jYWxlbmRhcltrZXldO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBvdXRwdXQgPT09ICdmdW5jdGlvbicgPyBvdXRwdXQuYXBwbHkobW9tKSA6IG91dHB1dDtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVsYXRpdmVUaW1lIDoge1xuICAgICAgICAgICAgZnV0dXJlIDogXCJpbiAlc1wiLFxuICAgICAgICAgICAgcGFzdCA6IFwiJXMgYWdvXCIsXG4gICAgICAgICAgICBzIDogXCJhIGZldyBzZWNvbmRzXCIsXG4gICAgICAgICAgICBtIDogXCJhIG1pbnV0ZVwiLFxuICAgICAgICAgICAgbW0gOiBcIiVkIG1pbnV0ZXNcIixcbiAgICAgICAgICAgIGggOiBcImFuIGhvdXJcIixcbiAgICAgICAgICAgIGhoIDogXCIlZCBob3Vyc1wiLFxuICAgICAgICAgICAgZCA6IFwiYSBkYXlcIixcbiAgICAgICAgICAgIGRkIDogXCIlZCBkYXlzXCIsXG4gICAgICAgICAgICBNIDogXCJhIG1vbnRoXCIsXG4gICAgICAgICAgICBNTSA6IFwiJWQgbW9udGhzXCIsXG4gICAgICAgICAgICB5IDogXCJhIHllYXJcIixcbiAgICAgICAgICAgIHl5IDogXCIlZCB5ZWFyc1wiXG4gICAgICAgIH0sXG4gICAgICAgIHJlbGF0aXZlVGltZSA6IGZ1bmN0aW9uIChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbc3RyaW5nXTtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJykgP1xuICAgICAgICAgICAgICAgIG91dHB1dChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIDpcbiAgICAgICAgICAgICAgICBvdXRwdXQucmVwbGFjZSgvJWQvaSwgbnVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFzdEZ1dHVyZSA6IGZ1bmN0aW9uIChkaWZmLCBvdXRwdXQpIHtcbiAgICAgICAgICAgIHZhciBmb3JtYXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbZGlmZiA+IDAgPyAnZnV0dXJlJyA6ICdwYXN0J107XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZvcm1hdCA9PT0gJ2Z1bmN0aW9uJyA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoXCIlZFwiLCBudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBfb3JkaW5hbCA6IFwiJWRcIixcblxuICAgICAgICBwcmVwYXJzZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcG9zdGZvcm1hdCA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChtb20pIHtcbiAgICAgICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrIDoge1xuICAgICAgICAgICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXG4gICAgICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ludmFsaWREYXRlOiAnSW52YWxpZCBkYXRlJyxcbiAgICAgICAgaW52YWxpZERhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnZhbGlkRGF0ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTG9hZHMgYSBsYW5ndWFnZSBkZWZpbml0aW9uIGludG8gdGhlIGBsYW5ndWFnZXNgIGNhY2hlLiAgVGhlIGZ1bmN0aW9uXG4gICAgLy8gdGFrZXMgYSBrZXkgYW5kIG9wdGlvbmFsbHkgdmFsdWVzLiAgSWYgbm90IGluIHRoZSBicm93c2VyIGFuZCBubyB2YWx1ZXNcbiAgICAvLyBhcmUgcHJvdmlkZWQsIGl0IHdpbGwgbG9hZCB0aGUgbGFuZ3VhZ2UgZmlsZSBtb2R1bGUuICBBcyBhIGNvbnZlbmllbmNlLFxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYWxzbyByZXR1cm5zIHRoZSBsYW5ndWFnZSB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gbG9hZExhbmcoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFsdWVzLmFiYnIgPSBrZXk7XG4gICAgICAgIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIGxhbmd1YWdlc1trZXldID0gbmV3IExhbmd1YWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0uc2V0KHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYSBsYW5ndWFnZSBmcm9tIHRoZSBgbGFuZ3VhZ2VzYCBjYWNoZS4gTW9zdGx5IHVzZWZ1bCBpbiB0ZXN0cy5cbiAgICBmdW5jdGlvbiB1bmxvYWRMYW5nKGtleSkge1xuICAgICAgICBkZWxldGUgbGFuZ3VhZ2VzW2tleV07XG4gICAgfVxuXG4gICAgLy8gRGV0ZXJtaW5lcyB3aGljaCBsYW5ndWFnZSBkZWZpbml0aW9uIHRvIHVzZSBhbmQgcmV0dXJucyBpdC5cbiAgICAvL1xuICAgIC8vIFdpdGggbm8gcGFyYW1ldGVycywgaXQgd2lsbCByZXR1cm4gdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmIHlvdVxuICAgIC8vIHBhc3MgaW4gYSBsYW5ndWFnZSBrZXksIHN1Y2ggYXMgJ2VuJywgaXQgd2lsbCByZXR1cm4gdGhlXG4gICAgLy8gZGVmaW5pdGlvbiBmb3IgJ2VuJywgc28gbG9uZyBhcyAnZW4nIGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkIHVzaW5nXG4gICAgLy8gbW9tZW50LmxhbmcuXG4gICAgZnVuY3Rpb24gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KSB7XG4gICAgICAgIHZhciBpID0gMCwgaiwgbGFuZywgbmV4dCwgc3BsaXQsXG4gICAgICAgICAgICBnZXQgPSBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmICghbGFuZ3VhZ2VzW2tdICYmIGhhc01vZHVsZSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sYW5nLycgKyBrKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNba107XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0FycmF5KGtleSkpIHtcbiAgICAgICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgICAgIGxhbmcgPSBnZXQoa2V5KTtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXkgPSBba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcGljayB0aGUgbGFuZ3VhZ2UgZnJvbSB0aGUgYXJyYXlcbiAgICAgICAgLy90cnkgWydlbi1hdScsICdlbi1nYiddIGFzICdlbi1hdScsICdlbi1nYicsICdlbicsIGFzIGluIG1vdmUgdGhyb3VnaCB0aGUgbGlzdCB0cnlpbmcgZWFjaFxuICAgICAgICAvL3N1YnN0cmluZyBmcm9tIG1vc3Qgc3BlY2lmaWMgdG8gbGVhc3QsIGJ1dCBtb3ZlIHRvIHRoZSBuZXh0IGFycmF5IGl0ZW0gaWYgaXQncyBhIG1vcmUgc3BlY2lmaWMgdmFyaWFudCB0aGFuIHRoZSBjdXJyZW50IHJvb3RcbiAgICAgICAgd2hpbGUgKGkgPCBrZXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBzcGxpdCA9IG5vcm1hbGl6ZUxhbmd1YWdlKGtleVtpXSkuc3BsaXQoJy0nKTtcbiAgICAgICAgICAgIGogPSBzcGxpdC5sZW5ndGg7XG4gICAgICAgICAgICBuZXh0ID0gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5W2kgKyAxXSk7XG4gICAgICAgICAgICBuZXh0ID0gbmV4dCA/IG5leHQuc3BsaXQoJy0nKSA6IG51bGw7XG4gICAgICAgICAgICB3aGlsZSAoaiA+IDApIHtcbiAgICAgICAgICAgICAgICBsYW5nID0gZ2V0KHNwbGl0LnNsaWNlKDAsIGopLmpvaW4oJy0nKSk7XG4gICAgICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZXh0ICYmIG5leHQubGVuZ3RoID49IGogJiYgY29tcGFyZUFycmF5cyhzcGxpdCwgbmV4dCwgdHJ1ZSkgPj0gaiAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmc7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBmdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxcXC9nLCBcIlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dKSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhhcnJheVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFwiXCI7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuICAgIGZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcblxuICAgICAgICBpZiAoIW0uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5sYW5nKCkuaW52YWxpZERhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdCA9IGV4cGFuZEZvcm1hdChmb3JtYXQsIG0ubGFuZygpKTtcblxuICAgICAgICBpZiAoIWZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKSB7XG4gICAgICAgICAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKG0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4cGFuZEZvcm1hdChmb3JtYXQsIGxhbmcpIHtcbiAgICAgICAgdmFyIGkgPSA1O1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmcubG9uZ0RhdGVGb3JtYXQoaW5wdXQpIHx8IGlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHdoaWxlIChpID49IDAgJiYgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLnRlc3QoZm9ybWF0KSkge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UobG9jYWxGb3JtYXR0aW5nVG9rZW5zLCByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMpO1xuICAgICAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgICAgICAgICBpIC09IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ybWF0O1xuICAgIH1cblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBQYXJzaW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBnZXQgdGhlIHJlZ2V4IHRvIGZpbmQgdGhlIG5leHQgdG9rZW5cbiAgICBmdW5jdGlvbiBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykge1xuICAgICAgICB2YXIgYSwgc3RyaWN0ID0gY29uZmlnLl9zdHJpY3Q7XG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgY2FzZSAnRERERCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRocmVlRGlnaXRzO1xuICAgICAgICBjYXNlICdZWVlZJzpcbiAgICAgICAgY2FzZSAnR0dHRyc6XG4gICAgICAgIGNhc2UgJ2dnZ2cnOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Gb3VyRGlnaXRzIDogcGFyc2VUb2tlbk9uZVRvRm91ckRpZ2l0cztcbiAgICAgICAgY2FzZSAnWSc6XG4gICAgICAgIGNhc2UgJ0cnOlxuICAgICAgICBjYXNlICdnJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuU2lnbmVkTnVtYmVyO1xuICAgICAgICBjYXNlICdZWVlZWVknOlxuICAgICAgICBjYXNlICdZWVlZWSc6XG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcbiAgICAgICAgY2FzZSAnZ2dnZ2cnOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5TaXhEaWdpdHMgOiBwYXJzZVRva2VuT25lVG9TaXhEaWdpdHM7XG4gICAgICAgIGNhc2UgJ1MnOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlbk9uZURpZ2l0OyB9XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ1NTJzpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHsgcmV0dXJuIHBhcnNlVG9rZW5Ud29EaWdpdHM7IH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnU1NTJzpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHsgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0czsgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdEREQnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PbmVUb1RocmVlRGlnaXRzO1xuICAgICAgICBjYXNlICdNTU0nOlxuICAgICAgICBjYXNlICdNTU1NJzpcbiAgICAgICAgY2FzZSAnZGQnOlxuICAgICAgICBjYXNlICdkZGQnOlxuICAgICAgICBjYXNlICdkZGRkJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuV29yZDtcbiAgICAgICAgY2FzZSAnYSc6XG4gICAgICAgIGNhc2UgJ0EnOlxuICAgICAgICAgICAgcmV0dXJuIGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkuX21lcmlkaWVtUGFyc2U7XG4gICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lc3RhbXBNcztcbiAgICAgICAgY2FzZSAnWic6XG4gICAgICAgIGNhc2UgJ1paJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGltZXpvbmU7XG4gICAgICAgIGNhc2UgJ1QnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UO1xuICAgICAgICBjYXNlICdTU1NTJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuRGlnaXRzO1xuICAgICAgICBjYXNlICdNTSc6XG4gICAgICAgIGNhc2UgJ0REJzpcbiAgICAgICAgY2FzZSAnWVknOlxuICAgICAgICBjYXNlICdHRyc6XG4gICAgICAgIGNhc2UgJ2dnJzpcbiAgICAgICAgY2FzZSAnSEgnOlxuICAgICAgICBjYXNlICdoaCc6XG4gICAgICAgIGNhc2UgJ21tJzpcbiAgICAgICAgY2FzZSAnc3MnOlxuICAgICAgICBjYXNlICd3dyc6XG4gICAgICAgIGNhc2UgJ1dXJzpcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuVHdvRGlnaXRzIDogcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzO1xuICAgICAgICBjYXNlICdNJzpcbiAgICAgICAgY2FzZSAnRCc6XG4gICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICBjYXNlICdIJzpcbiAgICAgICAgY2FzZSAnaCc6XG4gICAgICAgIGNhc2UgJ20nOlxuICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgIGNhc2UgJ1cnOlxuICAgICAgICBjYXNlICdlJzpcbiAgICAgICAgY2FzZSAnRSc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzO1xuICAgICAgICBkZWZhdWx0IDpcbiAgICAgICAgICAgIGEgPSBuZXcgUmVnRXhwKHJlZ2V4cEVzY2FwZSh1bmVzY2FwZUZvcm1hdCh0b2tlbi5yZXBsYWNlKCdcXFxcJywgJycpKSwgXCJpXCIpKTtcbiAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhzdHJpbmcpIHtcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIHZhciBwb3NzaWJsZVR6TWF0Y2hlcyA9IChzdHJpbmcubWF0Y2gocGFyc2VUb2tlblRpbWV6b25lKSB8fCBbXSksXG4gICAgICAgICAgICB0ekNodW5rID0gcG9zc2libGVUek1hdGNoZXNbcG9zc2libGVUek1hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW10sXG4gICAgICAgICAgICBwYXJ0cyA9ICh0ekNodW5rICsgJycpLm1hdGNoKHBhcnNlVGltZXpvbmVDaHVua2VyKSB8fCBbJy0nLCAwLCAwXSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgICAgIHJldHVybiBwYXJ0c1swXSA9PT0gJysnID8gLW1pbnV0ZXMgOiBtaW51dGVzO1xuICAgIH1cblxuICAgIC8vIGZ1bmN0aW9uIHRvIGNvbnZlcnQgc3RyaW5nIGlucHV0IHRvIGRhdGVcbiAgICBmdW5jdGlvbiBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgaW5wdXQsIGNvbmZpZykge1xuICAgICAgICB2YXIgYSwgZGF0ZVBhcnRBcnJheSA9IGNvbmZpZy5fYTtcblxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgIC8vIE1PTlRIXG4gICAgICAgIGNhc2UgJ00nIDogLy8gZmFsbCB0aHJvdWdoIHRvIE1NXG4gICAgICAgIGNhc2UgJ01NJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gdG9JbnQoaW5wdXQpIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdNTU0nIDogLy8gZmFsbCB0aHJvdWdoIHRvIE1NTU1cbiAgICAgICAgY2FzZSAnTU1NTScgOlxuICAgICAgICAgICAgYSA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCkubW9udGhzUGFyc2UoaW5wdXQpO1xuICAgICAgICAgICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXG4gICAgICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSBhO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRNb250aCA9IGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERBWSBPRiBNT05USFxuICAgICAgICBjYXNlICdEJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBERFxuICAgICAgICBjYXNlICdERCcgOlxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W0RBVEVdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERBWSBPRiBZRUFSXG4gICAgICAgIGNhc2UgJ0RERCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gRERERFxuICAgICAgICBjYXNlICdEREREJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fZGF5T2ZZZWFyID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gWUVBUlxuICAgICAgICBjYXNlICdZWScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdZWVlZJyA6XG4gICAgICAgIGNhc2UgJ1lZWVlZJyA6XG4gICAgICAgIGNhc2UgJ1lZWVlZWScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBTSAvIFBNXG4gICAgICAgIGNhc2UgJ2EnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEFcbiAgICAgICAgY2FzZSAnQScgOlxuICAgICAgICAgICAgY29uZmlnLl9pc1BtID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5pc1BNKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyAyNCBIT1VSXG4gICAgICAgIGNhc2UgJ0gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ0hIJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxuICAgICAgICBjYXNlICdoJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxuICAgICAgICBjYXNlICdoaCcgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtIT1VSXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBNSU5VVEVcbiAgICAgICAgY2FzZSAnbScgOiAvLyBmYWxsIHRocm91Z2ggdG8gbW1cbiAgICAgICAgY2FzZSAnbW0nIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBTRUNPTkRcbiAgICAgICAgY2FzZSAncycgOiAvLyBmYWxsIHRocm91Z2ggdG8gc3NcbiAgICAgICAgY2FzZSAnc3MnIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBNSUxMSVNFQ09ORFxuICAgICAgICBjYXNlICdTJyA6XG4gICAgICAgIGNhc2UgJ1NTJyA6XG4gICAgICAgIGNhc2UgJ1NTUycgOlxuICAgICAgICBjYXNlICdTU1NTJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W01JTExJU0VDT05EXSA9IHRvSW50KCgnMC4nICsgaW5wdXQpICogMTAwMCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVU5JWCBUSU1FU1RBTVAgV0lUSCBNU1xuICAgICAgICBjYXNlICdYJzpcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQpICogMTAwMCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVElNRVpPTkVcbiAgICAgICAgY2FzZSAnWicgOiAvLyBmYWxsIHRocm91Z2ggdG8gWlpcbiAgICAgICAgY2FzZSAnWlonIDpcbiAgICAgICAgICAgIGNvbmZpZy5fdXNlVVRDID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbmZpZy5fdHptID0gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ1dXJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ2RkJzpcbiAgICAgICAgY2FzZSAnZGRkJzpcbiAgICAgICAgY2FzZSAnZGRkZCc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDEpO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdnZyc6XG4gICAgICAgIGNhc2UgJ2dnZ2cnOlxuICAgICAgICBjYXNlICdHRyc6XG4gICAgICAgIGNhc2UgJ0dHR0cnOlxuICAgICAgICBjYXNlICdHR0dHRyc6XG4gICAgICAgICAgICB0b2tlbiA9IHRva2VuLnN1YnN0cigwLCAyKTtcbiAgICAgICAgICAgIGlmIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25maWcuX3dbdG9rZW5dID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnZlcnQgYW4gYXJyYXkgdG8gYSBkYXRlLlxuICAgIC8vIHRoZSBhcnJheSBzaG91bGQgbWlycm9yIHRoZSBwYXJhbWV0ZXJzIGJlbG93XG4gICAgLy8gbm90ZTogYWxsIHZhbHVlcyBwYXN0IHRoZSB5ZWFyIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBkZWZhdWx0IHRvIHRoZSBsb3dlc3QgcG9zc2libGUgdmFsdWUuXG4gICAgLy8gW3llYXIsIG1vbnRoLCBkYXkgLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbWlsbGlzZWNvbmRdXG4gICAgZnVuY3Rpb24gZGF0ZUZyb21Db25maWcoY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBkYXRlLCBpbnB1dCA9IFtdLCBjdXJyZW50RGF0ZSxcbiAgICAgICAgICAgIHllYXJUb1VzZSwgZml4WWVhciwgdywgdGVtcCwgbGFuZywgd2Vla2RheSwgd2VlaztcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgICAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXG4gICAgICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBmaXhZZWFyID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgIHZhciBpbnRfdmFsID0gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbCA/XG4gICAgICAgICAgICAgICAgICAodmFsLmxlbmd0aCA8IDMgPyAoaW50X3ZhbCA+IDY4ID8gMTkwMCArIGludF92YWwgOiAyMDAwICsgaW50X3ZhbCkgOiBpbnRfdmFsKSA6XG4gICAgICAgICAgICAgICAgICAoY29uZmlnLl9hW1lFQVJdID09IG51bGwgPyBtb21lbnQoKS53ZWVrWWVhcigpIDogY29uZmlnLl9hW1lFQVJdKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHcgPSBjb25maWcuX3c7XG4gICAgICAgICAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyhmaXhZZWFyKHcuR0cpLCB3LlcgfHwgMSwgdy5FLCA0LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpO1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmQgIT0gbnVsbCA/ICBwYXJzZVdlZWtkYXkody5kLCBsYW5nKSA6XG4gICAgICAgICAgICAgICAgICAody5lICE9IG51bGwgPyAgcGFyc2VJbnQody5lLCAxMCkgKyBsYW5nLl93ZWVrLmRvdyA6IDApO1xuXG4gICAgICAgICAgICAgICAgd2VlayA9IHBhcnNlSW50KHcudywgMTApIHx8IDE7XG5cbiAgICAgICAgICAgICAgICAvL2lmIHdlJ3JlIHBhcnNpbmcgJ2QnLCB0aGVuIHRoZSBsb3cgZGF5IG51bWJlcnMgbWF5IGJlIG5leHQgd2Vla1xuICAgICAgICAgICAgICAgIGlmICh3LmQgIT0gbnVsbCAmJiB3ZWVrZGF5IDwgbGFuZy5fd2Vlay5kb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgd2VlaysrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRlbXAgPSBkYXlPZlllYXJGcm9tV2Vla3MoZml4WWVhcih3LmdnKSwgd2Vlaywgd2Vla2RheSwgbGFuZy5fd2Vlay5kb3ksIGxhbmcuX3dlZWsuZG93KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xuICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcbiAgICAgICAgICAgIHllYXJUb1VzZSA9IGNvbmZpZy5fYVtZRUFSXSA9PSBudWxsID8gY3VycmVudERhdGVbWUVBUl0gOiBjb25maWcuX2FbWUVBUl07XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuX292ZXJmbG93RGF5T2ZZZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGF0ZSA9IG1ha2VVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xuICAgICAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtEQVRFXSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXG4gICAgICAgIC8vICogaWYgbm8geWVhciwgbW9udGgsIGRheSBvZiBtb250aCBhcmUgZ2l2ZW4sIGRlZmF1bHQgdG8gdG9kYXlcbiAgICAgICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcbiAgICAgICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcbiAgICAgICAgLy8gKiBpZiB5ZWFyIGlzIGdpdmVuLCBkb24ndCBkZWZhdWx0IGFueXRoaW5nXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcbiAgICAgICAgZm9yICg7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gKGNvbmZpZy5fYVtpXSA9PSBudWxsKSA/IChpID09PSAyID8gMSA6IDApIDogY29uZmlnLl9hW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHRoZSBvZmZzZXRzIHRvIHRoZSB0aW1lIHRvIGJlIHBhcnNlZCBzbyB0aGF0IHdlIGNhbiBoYXZlIGEgY2xlYW4gYXJyYXkgZm9yIGNoZWNraW5nIGlzVmFsaWRcbiAgICAgICAgaW5wdXRbSE9VUl0gKz0gdG9JbnQoKGNvbmZpZy5fdHptIHx8IDApIC8gNjApO1xuICAgICAgICBpbnB1dFtNSU5VVEVdICs9IHRvSW50KChjb25maWcuX3R6bSB8fCAwKSAlIDYwKTtcblxuICAgICAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBtYWtlVVRDRGF0ZSA6IG1ha2VEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF0ZUZyb21PYmplY3QoY29uZmlnKSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQ7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoY29uZmlnLl9pKTtcbiAgICAgICAgY29uZmlnLl9hID0gW1xuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnllYXIsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubW9udGgsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuZGF5LFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LmhvdXIsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubWludXRlLFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnNlY29uZCxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZFxuICAgICAgICBdO1xuXG4gICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VycmVudERhdGVBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRGF0ZSgpXG4gICAgICAgICAgICBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIG5vdy5nZXREYXRlKCldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpIHtcblxuICAgICAgICBjb25maWcuX2EgPSBbXTtcbiAgICAgICAgY29uZmlnLl9wZi5lbXB0eSA9IHRydWU7XG5cbiAgICAgICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICAgICAgdmFyIGxhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLFxuICAgICAgICAgICAgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgICAgICBpLCBwYXJzZWRJbnB1dCwgdG9rZW5zLCB0b2tlbiwgc2tpcHBlZCxcbiAgICAgICAgICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgICAgICB0b2tlbnMgPSBleHBhbmRGb3JtYXQoY29uZmlnLl9mLCBsYW5nKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIHNraXBwZWQgPSBzdHJpbmcuc3Vic3RyKDAsIHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSk7XG4gICAgICAgICAgICAgICAgaWYgKHNraXBwZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc2tpcHBlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkgKyBwYXJzZWRJbnB1dC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggKz0gcGFyc2VkSW5wdXQubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZG9uJ3QgcGFyc2UgaWYgaXQncyBub3QgYSBrbm93biB0b2tlblxuICAgICAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIHBhcnNlZElucHV0LCBjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgICAgIGNvbmZpZy5fcGYuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRJbnB1dC5wdXNoKHN0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYW5kbGUgYW0gcG1cbiAgICAgICAgaWYgKGNvbmZpZy5faXNQbSAmJiBjb25maWcuX2FbSE9VUl0gPCAxMikge1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdICs9IDEyO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIGlzIDEyIGFtLCBjaGFuZ2UgaG91cnMgdG8gMFxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtID09PSBmYWxzZSAmJiBjb25maWcuX2FbSE9VUl0gPT09IDEyKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZXNjYXBlRm9ybWF0KHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgICAgIHJldHVybiBwMSB8fCBwMiB8fCBwMyB8fCBwNDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2MTQ5My9pcy10aGVyZS1hLXJlZ2V4cC1lc2NhcGUtZnVuY3Rpb24taW4tamF2YXNjcmlwdFxuICAgIGZ1bmN0aW9uIHJlZ2V4cEVzY2FwZShzKSB7XG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKSB7XG4gICAgICAgIHZhciB0ZW1wQ29uZmlnLFxuICAgICAgICAgICAgYmVzdE1vbWVudCxcblxuICAgICAgICAgICAgc2NvcmVUb0JlYXQsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgY3VycmVudFNjb3JlO1xuXG4gICAgICAgIGlmIChjb25maWcuX2YubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoTmFOKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb25maWcuX2YubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnID0gZXh0ZW5kKHt9LCBjb25maWcpO1xuICAgICAgICAgICAgdGVtcENvbmZpZy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9mID0gY29uZmlnLl9mW2ldO1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KHRlbXBDb25maWcpO1xuXG4gICAgICAgICAgICBpZiAoIWlzVmFsaWQodGVtcENvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgYW55IGlucHV0IHRoYXQgd2FzIG5vdCBwYXJzZWQgYWRkIGEgcGVuYWx0eSBmb3IgdGhhdCBmb3JtYXRcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSArPSB0ZW1wQ29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyO1xuXG4gICAgICAgICAgICAvL29yIHRva2Vuc1xuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLnVudXNlZFRva2Vucy5sZW5ndGggKiAxMDtcblxuICAgICAgICAgICAgdGVtcENvbmZpZy5fcGYuc2NvcmUgPSBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgICAgIGlmIChzY29yZVRvQmVhdCA9PSBudWxsIHx8IGN1cnJlbnRTY29yZSA8IHNjb3JlVG9CZWF0KSB7XG4gICAgICAgICAgICAgICAgc2NvcmVUb0JlYXQgPSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgICAgICAgYmVzdE1vbWVudCA9IHRlbXBDb25maWc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoY29uZmlnLCBiZXN0TW9tZW50IHx8IHRlbXBDb25maWcpO1xuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0XG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZykge1xuICAgICAgICB2YXIgaSwgbCxcbiAgICAgICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIG1hdGNoID0gaXNvUmVnZXguZXhlYyhzdHJpbmcpO1xuXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uZmlnLl9wZi5pc28gPSB0cnVlO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb0RhdGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKHN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWF0Y2hbNV0gc2hvdWxkIGJlIFwiVFwiIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2YgPSBpc29EYXRlc1tpXVswXSArIChtYXRjaFs2XSB8fCBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29UaW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhzdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiArPSBpc29UaW1lc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IFwiWlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShzdHJpbmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tSW5wdXQoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhpbnB1dCk7XG5cbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK21hdGNoZWRbMV0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZyhjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2EgPSBpbnB1dC5zbGljZSgwKTtcbiAgICAgICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK2lucHV0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZGF0ZUZyb21PYmplY3QoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XG4gICAgICAgIC8vY2FuJ3QganVzdCBhcHBseSgpIHRvIGNyZWF0ZSBhIGRhdGU6XG4gICAgICAgIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODEzNDgvaW5zdGFudGlhdGluZy1hLWphdmFzY3JpcHQtb2JqZWN0LWJ5LWNhbGxpbmctcHJvdG90eXBlLWNvbnN0cnVjdG9yLWFwcGx5XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xuXG4gICAgICAgIC8vdGhlIGRhdGUgY29uc3RydWN0b3IgZG9lc24ndCBhY2NlcHQgeWVhcnMgPCAxOTcwXG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlVVRDRGF0ZSh5KSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xuICAgICAgICAgICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVdlZWtkYXkoaW5wdXQsIGxhbmd1YWdlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbGFuZ3VhZ2Uud2Vla2RheXNQYXJzZShpbnB1dCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFJlbGF0aXZlIFRpbWVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbW9tZW50LmZuLmZyb20sIG1vbWVudC5mbi5mcm9tTm93LCBhbmQgbW9tZW50LmR1cmF0aW9uLmZuLmh1bWFuaXplXG4gICAgZnVuY3Rpb24gc3Vic3RpdHV0ZVRpbWVBZ28oc3RyaW5nLCBudW1iZXIsIHdpdGhvdXRTdWZmaXgsIGlzRnV0dXJlLCBsYW5nKSB7XG4gICAgICAgIHJldHVybiBsYW5nLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWxhdGl2ZVRpbWUobWlsbGlzZWNvbmRzLCB3aXRob3V0U3VmZml4LCBsYW5nKSB7XG4gICAgICAgIHZhciBzZWNvbmRzID0gcm91bmQoTWF0aC5hYnMobWlsbGlzZWNvbmRzKSAvIDEwMDApLFxuICAgICAgICAgICAgbWludXRlcyA9IHJvdW5kKHNlY29uZHMgLyA2MCksXG4gICAgICAgICAgICBob3VycyA9IHJvdW5kKG1pbnV0ZXMgLyA2MCksXG4gICAgICAgICAgICBkYXlzID0gcm91bmQoaG91cnMgLyAyNCksXG4gICAgICAgICAgICB5ZWFycyA9IHJvdW5kKGRheXMgLyAzNjUpLFxuICAgICAgICAgICAgYXJncyA9IHNlY29uZHMgPCA0NSAmJiBbJ3MnLCBzZWNvbmRzXSB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPT09IDEgJiYgWydtJ10gfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzIDwgNDUgJiYgWydtbScsIG1pbnV0ZXNdIHx8XG4gICAgICAgICAgICAgICAgaG91cnMgPT09IDEgJiYgWydoJ10gfHxcbiAgICAgICAgICAgICAgICBob3VycyA8IDIyICYmIFsnaGgnLCBob3Vyc10gfHxcbiAgICAgICAgICAgICAgICBkYXlzID09PSAxICYmIFsnZCddIHx8XG4gICAgICAgICAgICAgICAgZGF5cyA8PSAyNSAmJiBbJ2RkJywgZGF5c10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDw9IDQ1ICYmIFsnTSddIHx8XG4gICAgICAgICAgICAgICAgZGF5cyA8IDM0NSAmJiBbJ01NJywgcm91bmQoZGF5cyAvIDMwKV0gfHxcbiAgICAgICAgICAgICAgICB5ZWFycyA9PT0gMSAmJiBbJ3knXSB8fCBbJ3l5JywgeWVhcnNdO1xuICAgICAgICBhcmdzWzJdID0gd2l0aG91dFN1ZmZpeDtcbiAgICAgICAgYXJnc1szXSA9IG1pbGxpc2Vjb25kcyA+IDA7XG4gICAgICAgIGFyZ3NbNF0gPSBsYW5nO1xuICAgICAgICByZXR1cm4gc3Vic3RpdHV0ZVRpbWVBZ28uYXBwbHkoe30sIGFyZ3MpO1xuICAgIH1cblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBXZWVrIG9mIFllYXJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrICAgICAgIDAgPSBzdW4sIDYgPSBzYXRcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZGF5IG9mIHRoZSB3ZWVrIHRoYXQgc3RhcnRzIHRoZSB3ZWVrXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKHVzdWFsbHkgc3VuZGF5IG9yIG1vbmRheSlcbiAgICAvLyBmaXJzdERheU9mV2Vla09mWWVhciAwID0gc3VuLCA2ID0gc2F0XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgdGhlIGZpcnN0IHdlZWsgaXMgdGhlIHdlZWsgdGhhdCBjb250YWlucyB0aGUgZmlyc3RcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIGRheSBvZiB0aGUgd2Vla1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIChlZy4gSVNPIHdlZWtzIHVzZSB0aHVyc2RheSAoNCkpXG4gICAgZnVuY3Rpb24gd2Vla09mWWVhcihtb20sIGZpcnN0RGF5T2ZXZWVrLCBmaXJzdERheU9mV2Vla09mWWVhcikge1xuICAgICAgICB2YXIgZW5kID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBmaXJzdERheU9mV2VlayxcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayA9IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIC0gbW9tLmRheSgpLFxuICAgICAgICAgICAgYWRqdXN0ZWRNb21lbnQ7XG5cblxuICAgICAgICBpZiAoZGF5c1RvRGF5T2ZXZWVrID4gZW5kKSB7XG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgLT0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPCBlbmQgLSA3KSB7XG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgKz0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkanVzdGVkTW9tZW50ID0gbW9tZW50KG1vbSkuYWRkKCdkJywgZGF5c1RvRGF5T2ZXZWVrKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdlZWs6IE1hdGguY2VpbChhZGp1c3RlZE1vbWVudC5kYXlPZlllYXIoKSAvIDcpLFxuICAgICAgICAgICAgeWVhcjogYWRqdXN0ZWRNb21lbnQueWVhcigpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyLCBmaXJzdERheU9mV2Vlaykge1xuICAgICAgICB2YXIgZCA9IG1ha2VVVENEYXRlKHllYXIsIDAsIDEpLmdldFVUQ0RheSgpLCBkYXlzVG9BZGQsIGRheU9mWWVhcjtcblxuICAgICAgICB3ZWVrZGF5ID0gd2Vla2RheSAhPSBudWxsID8gd2Vla2RheSA6IGZpcnN0RGF5T2ZXZWVrO1xuICAgICAgICBkYXlzVG9BZGQgPSBmaXJzdERheU9mV2VlayAtIGQgKyAoZCA+IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyID8gNyA6IDApIC0gKGQgPCBmaXJzdERheU9mV2VlayA/IDcgOiAwKTtcbiAgICAgICAgZGF5T2ZZZWFyID0gNyAqICh3ZWVrIC0gMSkgKyAod2Vla2RheSAtIGZpcnN0RGF5T2ZXZWVrKSArIGRheXNUb0FkZCArIDE7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IGRheU9mWWVhciA+IDAgPyB5ZWFyIDogeWVhciAtIDEsXG4gICAgICAgICAgICBkYXlPZlllYXI6IGRheU9mWWVhciA+IDAgPyAgZGF5T2ZZZWFyIDogZGF5c0luWWVhcih5ZWFyIC0gMSkgKyBkYXlPZlllYXJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBtYWtlTW9tZW50KGNvbmZpZykge1xuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksXG4gICAgICAgICAgICBmb3JtYXQgPSBjb25maWcuX2Y7XG5cbiAgICAgICAgaWYgKGlucHV0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmludmFsaWQoe251bGxJbnB1dDogdHJ1ZX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbmZpZy5faSA9IGlucHV0ID0gZ2V0TGFuZ0RlZmluaXRpb24oKS5wcmVwYXJzZShpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50LmlzTW9tZW50KGlucHV0KSkge1xuICAgICAgICAgICAgY29uZmlnID0gY2xvbmVNb21lbnQoaW5wdXQpO1xuXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQuX2QpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkoZm9ybWF0KSkge1xuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tSW5wdXQoY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgbW9tZW50ID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxhbmcsIHN0cmljdCkge1xuICAgICAgICB2YXIgYztcblxuICAgICAgICBpZiAodHlwZW9mKGxhbmcpID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgc3RyaWN0ID0gbGFuZztcbiAgICAgICAgICAgIGxhbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgICAgIGMgPSB7fTtcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9sID0gbGFuZztcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBjLl9pc1VUQyA9IGZhbHNlO1xuICAgICAgICBjLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcblxuICAgICAgICByZXR1cm4gbWFrZU1vbWVudChjKTtcbiAgICB9O1xuXG4gICAgLy8gY3JlYXRpbmcgd2l0aCB1dGNcbiAgICBtb21lbnQudXRjID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxhbmcsIHN0cmljdCkge1xuICAgICAgICB2YXIgYztcblxuICAgICAgICBpZiAodHlwZW9mKGxhbmcpID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgc3RyaWN0ID0gbGFuZztcbiAgICAgICAgICAgIGxhbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgICAgIGMgPSB7fTtcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5fdXNlVVRDID0gdHJ1ZTtcbiAgICAgICAgYy5faXNVVEMgPSB0cnVlO1xuICAgICAgICBjLl9sID0gbGFuZztcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpLnV0YygpO1xuICAgIH07XG5cbiAgICAvLyBjcmVhdGluZyB3aXRoIHVuaXggdGltZXN0YW1wIChpbiBzZWNvbmRzKVxuICAgIG1vbWVudC51bml4ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQgKiAxMDAwKTtcbiAgICB9O1xuXG4gICAgLy8gZHVyYXRpb25cbiAgICBtb21lbnQuZHVyYXRpb24gPSBmdW5jdGlvbiAoaW5wdXQsIGtleSkge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBpbnB1dCxcbiAgICAgICAgICAgIC8vIG1hdGNoaW5nIGFnYWluc3QgcmVnZXhwIGlzIGV4cGVuc2l2ZSwgZG8gaXQgb24gZGVtYW5kXG4gICAgICAgICAgICBtYXRjaCA9IG51bGwsXG4gICAgICAgICAgICBzaWduLFxuICAgICAgICAgICAgcmV0LFxuICAgICAgICAgICAgcGFyc2VJc287XG5cbiAgICAgICAgaWYgKG1vbWVudC5pc0R1cmF0aW9uKGlucHV0KSkge1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgbXM6IGlucHV0Ll9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICAgICAgZDogaW5wdXQuX2RheXMsXG4gICAgICAgICAgICAgICAgTTogaW5wdXQuX21vbnRoc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uW2tleV0gPSBpbnB1dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb24ubWlsbGlzZWNvbmRzID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09IFwiLVwiKSA/IC0xIDogMTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZDogdG9JbnQobWF0Y2hbREFURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBoOiB0b0ludChtYXRjaFtIT1VSXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIG06IHRvSW50KG1hdGNoW01JTlVURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBzOiB0b0ludChtYXRjaFtTRUNPTkRdKSAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbXM6IHRvSW50KG1hdGNoW01JTExJU0VDT05EXSkgKiBzaWduXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvRHVyYXRpb25SZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09IFwiLVwiKSA/IC0xIDogMTtcbiAgICAgICAgICAgIHBhcnNlSXNvID0gZnVuY3Rpb24gKGlucCkge1xuICAgICAgICAgICAgICAgIC8vIFdlJ2Qgbm9ybWFsbHkgdXNlIH5+aW5wIGZvciB0aGlzLCBidXQgdW5mb3J0dW5hdGVseSBpdCBhbHNvXG4gICAgICAgICAgICAgICAgLy8gY29udmVydHMgZmxvYXRzIHRvIGludHMuXG4gICAgICAgICAgICAgICAgLy8gaW5wIG1heSBiZSB1bmRlZmluZWQsIHNvIGNhcmVmdWwgY2FsbGluZyByZXBsYWNlIG9uIGl0LlxuICAgICAgICAgICAgICAgIHZhciByZXMgPSBpbnAgJiYgcGFyc2VGbG9hdChpbnAucmVwbGFjZSgnLCcsICcuJykpO1xuICAgICAgICAgICAgICAgIC8vIGFwcGx5IHNpZ24gd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgICAgICAgICByZXR1cm4gKGlzTmFOKHJlcykgPyAwIDogcmVzKSAqIHNpZ247XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeTogcGFyc2VJc28obWF0Y2hbMl0pLFxuICAgICAgICAgICAgICAgIE06IHBhcnNlSXNvKG1hdGNoWzNdKSxcbiAgICAgICAgICAgICAgICBkOiBwYXJzZUlzbyhtYXRjaFs0XSksXG4gICAgICAgICAgICAgICAgaDogcGFyc2VJc28obWF0Y2hbNV0pLFxuICAgICAgICAgICAgICAgIG06IHBhcnNlSXNvKG1hdGNoWzZdKSxcbiAgICAgICAgICAgICAgICBzOiBwYXJzZUlzbyhtYXRjaFs3XSksXG4gICAgICAgICAgICAgICAgdzogcGFyc2VJc28obWF0Y2hbOF0pXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpICYmIGlucHV0Lmhhc093blByb3BlcnR5KCdfbGFuZycpKSB7XG4gICAgICAgICAgICByZXQuX2xhbmcgPSBpbnB1dC5fbGFuZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbW9tZW50LnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gZGVmYXVsdCBmb3JtYXRcbiAgICBtb21lbnQuZGVmYXVsdEZvcm1hdCA9IGlzb0Zvcm1hdDtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cbiAgICAvLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbiAgICBtb21lbnQudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsYW5ndWFnZXMgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbGFuZ3VhZ2UuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4gICAgLy8gbGFuZ3VhZ2Uga2V5LlxuICAgIG1vbWVudC5sYW5nID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIHZhciByO1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZy5fYWJicjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgICAgICBsb2FkTGFuZyhub3JtYWxpemVMYW5ndWFnZShrZXkpLCB2YWx1ZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdW5sb2FkTGFuZyhrZXkpO1xuICAgICAgICAgICAga2V5ID0gJ2VuJztcbiAgICAgICAgfSBlbHNlIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgciA9IG1vbWVudC5kdXJhdGlvbi5mbi5fbGFuZyA9IG1vbWVudC5mbi5fbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgICAgIHJldHVybiByLl9hYmJyO1xuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIGxhbmd1YWdlIGRhdGFcbiAgICBtb21lbnQubGFuZ0RhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChrZXkgJiYga2V5Ll9sYW5nICYmIGtleS5fbGFuZy5fYWJicikge1xuICAgICAgICAgICAga2V5ID0ga2V5Ll9sYW5nLl9hYmJyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xuICAgIH07XG5cbiAgICAvLyBjb21wYXJlIG1vbWVudCBvYmplY3RcbiAgICBtb21lbnQuaXNNb21lbnQgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHxcbiAgICAgICAgICAgIChvYmogIT0gbnVsbCAmJiAgb2JqLmhhc093blByb3BlcnR5KCdfaXNBTW9tZW50T2JqZWN0JykpO1xuICAgIH07XG5cbiAgICAvLyBmb3IgdHlwZWNoZWNraW5nIER1cmF0aW9uIG9iamVjdHNcbiAgICBtb21lbnQuaXNEdXJhdGlvbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xuICAgIH07XG5cbiAgICBmb3IgKGkgPSBsaXN0cy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBtYWtlTGlzdChsaXN0c1tpXSk7XG4gICAgfVxuXG4gICAgbW9tZW50Lm5vcm1hbGl6ZVVuaXRzID0gZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgfTtcblxuICAgIG1vbWVudC5pbnZhbGlkID0gZnVuY3Rpb24gKGZsYWdzKSB7XG4gICAgICAgIHZhciBtID0gbW9tZW50LnV0YyhOYU4pO1xuICAgICAgICBpZiAoZmxhZ3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgZXh0ZW5kKG0uX3BmLCBmbGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBtLl9wZi51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcblxuICAgIG1vbWVudC5wYXJzZVpvbmUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCkucGFyc2Vab25lKCk7XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTW9tZW50IFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgZXh0ZW5kKG1vbWVudC5mbiA9IE1vbWVudC5wcm90b3R5cGUsIHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5fZCArICgodGhpcy5fb2Zmc2V0IHx8IDApICogNjAwMDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuaXggOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigrdGhpcyAvIDEwMDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5sYW5nKCdlbicpLmZvcm1hdChcImRkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaXCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvRGF0ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vZmZzZXQgPyBuZXcgRGF0ZSgrdGhpcykgOiB0aGlzLl9kO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvSVNPU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQodGhpcykudXRjKCk7XG4gICAgICAgICAgICBpZiAoMCA8IG0ueWVhcigpICYmIG0ueWVhcigpIDw9IDk5OTkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHRvQXJyYXkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbSA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG0ueWVhcigpLFxuICAgICAgICAgICAgICAgIG0ubW9udGgoKSxcbiAgICAgICAgICAgICAgICBtLmRhdGUoKSxcbiAgICAgICAgICAgICAgICBtLmhvdXJzKCksXG4gICAgICAgICAgICAgICAgbS5taW51dGVzKCksXG4gICAgICAgICAgICAgICAgbS5zZWNvbmRzKCksXG4gICAgICAgICAgICAgICAgbS5taWxsaXNlY29uZHMoKVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1ZhbGlkIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNEU1RTaGlmdGVkIDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSAmJiBjb21wYXJlQXJyYXlzKHRoaXMuX2EsICh0aGlzLl9pc1VUQyA/IG1vbWVudC51dGModGhpcy5fYSkgOiBtb21lbnQodGhpcy5fYSkpLnRvQXJyYXkoKSkgPiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2luZ0ZsYWdzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4dGVuZCh7fSwgdGhpcy5fcGYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGludmFsaWRBdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BmLm92ZXJmbG93O1xuICAgICAgICB9LFxuXG4gICAgICAgIHV0YyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmUoMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9jYWwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnpvbmUoMCk7XG4gICAgICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nIHx8IG1vbWVudC5kZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcbiAgICAgICAgICAgIHZhciBkdXI7XG4gICAgICAgICAgICAvLyBzd2l0Y2ggYXJncyB0byBzdXBwb3J0IGFkZCgncycsIDEpIGFuZCBhZGQoMSwgJ3MnKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oK3ZhbCwgaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KHRoaXMsIGR1ciwgMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzdWJ0cmFjdCA6IGZ1bmN0aW9uIChpbnB1dCwgdmFsKSB7XG4gICAgICAgICAgICB2YXIgZHVyO1xuICAgICAgICAgICAgLy8gc3dpdGNoIGFyZ3MgdG8gc3VwcG9ydCBzdWJ0cmFjdCgncycsIDEpIGFuZCBzdWJ0cmFjdCgxLCAncycpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbigrdmFsLCBpbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgZHVyLCAtMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmIDogZnVuY3Rpb24gKGlucHV0LCB1bml0cywgYXNGbG9hdCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSBtYWtlQXMoaW5wdXQsIHRoaXMpLFxuICAgICAgICAgICAgICAgIHpvbmVEaWZmID0gKHRoaXMuem9uZSgpIC0gdGhhdC56b25lKCkpICogNmU0LFxuICAgICAgICAgICAgICAgIGRpZmYsIG91dHB1dDtcblxuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3llYXInIHx8IHVuaXRzID09PSAnbW9udGgnKSB7XG4gICAgICAgICAgICAgICAgLy8gYXZlcmFnZSBudW1iZXIgb2YgZGF5cyBpbiB0aGUgbW9udGhzIGluIHRoZSBnaXZlbiBkYXRlc1xuICAgICAgICAgICAgICAgIGRpZmYgPSAodGhpcy5kYXlzSW5Nb250aCgpICsgdGhhdC5kYXlzSW5Nb250aCgpKSAqIDQzMmU1OyAvLyAyNCAqIDYwICogNjAgKiAxMDAwIC8gMlxuICAgICAgICAgICAgICAgIC8vIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gKCh0aGlzLnllYXIoKSAtIHRoYXQueWVhcigpKSAqIDEyKSArICh0aGlzLm1vbnRoKCkgLSB0aGF0Lm1vbnRoKCkpO1xuICAgICAgICAgICAgICAgIC8vIGFkanVzdCBieSB0YWtpbmcgZGlmZmVyZW5jZSBpbiBkYXlzLCBhdmVyYWdlIG51bWJlciBvZiBkYXlzXG4gICAgICAgICAgICAgICAgLy8gYW5kIGRzdCBpbiB0aGUgZ2l2ZW4gbW9udGhzLlxuICAgICAgICAgICAgICAgIG91dHB1dCArPSAoKHRoaXMgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKSkgLVxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoYXQgLSBtb21lbnQodGhhdCkuc3RhcnRPZignbW9udGgnKSkpIC8gZGlmZjtcbiAgICAgICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aXRoIHpvbmVzLCB0byBuZWdhdGUgYWxsIGRzdFxuICAgICAgICAgICAgICAgIG91dHB1dCAtPSAoKHRoaXMuem9uZSgpIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ21vbnRoJykuem9uZSgpKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhhdC56b25lKCkgLSBtb21lbnQodGhhdCkuc3RhcnRPZignbW9udGgnKS56b25lKCkpKSAqIDZlNCAvIGRpZmY7XG4gICAgICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMTI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWZmID0gKHRoaXMgLSB0aGF0KTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkaWZmIC8gMWUzIDogLy8gMTAwMFxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkaWZmIC8gNmU0IDogLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkaWZmIC8gMzZlNSA6IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkaWZmIC0gem9uZURpZmYpIC8gODY0ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnd2VlaycgPyAoZGlmZiAtIHpvbmVEaWZmKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgICAgIGRpZmY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic1JvdW5kKG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnJvbSA6IGZ1bmN0aW9uICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKHRoaXMuZGlmZih0aW1lKSkubGFuZyh0aGlzLmxhbmcoKS5fYWJicikuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZyb21Ob3cgOiBmdW5jdGlvbiAod2l0aG91dFN1ZmZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJvbShtb21lbnQoKSwgd2l0aG91dFN1ZmZpeCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsZW5kYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBXZSB3YW50IHRvIGNvbXBhcmUgdGhlIHN0YXJ0IG9mIHRvZGF5LCB2cyB0aGlzLlxuICAgICAgICAgICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgem9uZSdkIG9yIG5vdC5cbiAgICAgICAgICAgIHZhciBzb2QgPSBtYWtlQXMobW9tZW50KCksIHRoaXMpLnN0YXJ0T2YoJ2RheScpLFxuICAgICAgICAgICAgICAgIGRpZmYgPSB0aGlzLmRpZmYoc29kLCAnZGF5cycsIHRydWUpLFxuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGRpZmYgPCAtNiA/ICdzYW1lRWxzZScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgLTEgPyAnbGFzdFdlZWsnIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMSA/ICdzYW1lRGF5JyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAyID8gJ25leHREYXknIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvcm1hdCh0aGlzLmxhbmcoKS5jYWxlbmRhcihmb3JtYXQsIHRoaXMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0xlYXBZZWFyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRFNUIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnpvbmUoKSA8IHRoaXMuY2xvbmUoKS5tb250aCgwKS56b25lKCkgfHxcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUoKSA8IHRoaXMuY2xvbmUoKS5tb250aCg1KS56b25lKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIGRheSA9IHRoaXMuX2lzVVRDID8gdGhpcy5fZC5nZXRVVENEYXkoKSA6IHRoaXMuX2QuZ2V0RGF5KCk7XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxhbmcoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHsgZCA6IGlucHV0IC0gZGF5IH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG1vbnRoIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgdXRjID0gdGhpcy5faXNVVEMgPyAnVVRDJyA6ICcnLFxuICAgICAgICAgICAgICAgIGRheU9mTW9udGg7XG5cbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSB0aGlzLmxhbmcoKS5tb250aHNQYXJzZShpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRheU9mTW9udGggPSB0aGlzLmRhdGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGUoMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZFsnc2V0JyArIHV0YyArICdNb250aCddKGlucHV0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGUoTWF0aC5taW4oZGF5T2ZNb250aCwgdGhpcy5kYXlzSW5Nb250aCgpKSk7XG5cbiAgICAgICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZFsnZ2V0JyArIHV0YyArICdNb250aCddKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgc3dpdGNoIGludGVudGlvbmFsbHkgb21pdHMgYnJlYWsga2V5d29yZHNcbiAgICAgICAgICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cbiAgICAgICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgICAgICAgICB0aGlzLmhvdXJzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgICAgIHRoaXMubWludXRlcygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuc2Vjb25kcygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xuICAgICAgICAgICAgICAgIHRoaXMud2Vla2RheSgwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNvV2Vla2RheSgxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5kT2Y6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydE9mKHVuaXRzKS5hZGQoKHVuaXRzID09PSAnaXNvV2VlaycgPyAnd2VlaycgOiB1bml0cyksIDEpLnN1YnRyYWN0KCdtcycsIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzQWZ0ZXI6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gdHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJztcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID4gK21vbWVudChpbnB1dCkuc3RhcnRPZih1bml0cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNCZWZvcmU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gdHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJztcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpIDwgK21vbWVudChpbnB1dCkuc3RhcnRPZih1bml0cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNTYW1lOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IHVuaXRzIHx8ICdtcyc7XG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKSA9PT0gK21ha2VBcyhpbnB1dCwgdGhpcykuc3RhcnRPZih1bml0cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWluOiBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1heDogZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgICAgICBvdGhlciA9IG1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIG90aGVyID4gdGhpcyA/IHRoaXMgOiBvdGhlcjtcbiAgICAgICAgfSxcblxuICAgICAgICB6b25lIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0IHx8IDA7XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGlucHV0KSA8IDE2KSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fb2Zmc2V0ID0gaW5wdXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IGlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgbW9tZW50LmR1cmF0aW9uKG9mZnNldCAtIGlucHV0LCAnbScpLCAxLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IG9mZnNldCA6IHRoaXMuX2QuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHpvbmVBYmJyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gXCJVVENcIiA6IFwiXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgem9uZU5hbWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBcIkNvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lXCIgOiBcIlwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlWm9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl90em0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUodGhpcy5fdHptKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuX2kgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy56b25lKHRoaXMuX2kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFzQWxpZ25lZEhvdXJPZmZzZXQgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG1vbWVudChpbnB1dCkuem9uZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuem9uZSgpIC0gaW5wdXQpICUgNjAgPT09IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF5c0luTW9udGggOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF5T2ZZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgZGF5T2ZZZWFyID0gcm91bmQoKG1vbWVudCh0aGlzKS5zdGFydE9mKCdkYXknKSAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCd5ZWFyJykpIC8gODY0ZTUpICsgMTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIGRheU9mWWVhcikpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHF1YXJ0ZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKCh0aGlzLm1vbnRoKCkgKyAxLjApIC8gMy4wKTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIHRoaXMubGFuZygpLl93ZWVrLmRvdywgdGhpcy5sYW5nKCkuX3dlZWsuZG95KS55ZWFyO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB5ZWFyIDogdGhpcy5hZGQoXCJ5XCIsIChpbnB1dCAtIHllYXIpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZChcInlcIiwgKGlucHV0IC0geWVhcikpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWsgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciB3ZWVrID0gdGhpcy5sYW5nKCkud2Vlayh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKFwiZFwiLCAoaW5wdXQgLSB3ZWVrKSAqIDcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzb1dlZWsgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIHdlZWspICogNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxhbmcoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKFwiZFwiLCBpbnB1dCAtIHdlZWtkYXkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzb1dlZWtkYXkgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIC8vIGJlaGF2ZXMgdGhlIHNhbWUgYXMgbW9tZW50I2RheSBleGNlcHRcbiAgICAgICAgICAgIC8vIGFzIGEgZ2V0dGVyLCByZXR1cm5zIDcgaW5zdGVhZCBvZiAwICgxLTcgcmFuZ2UgaW5zdGVhZCBvZiAwLTYpXG4gICAgICAgICAgICAvLyBhcyBhIHNldHRlciwgc3VuZGF5IHNob3VsZCBiZWxvbmcgdG8gdGhlIHByZXZpb3VzIHdlZWsuXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHRoaXMuZGF5KCkgfHwgNyA6IHRoaXMuZGF5KHRoaXMuZGF5KCkgJSA3ID8gaW5wdXQgOiBpbnB1dCAtIDcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldCA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodW5pdHMsIHZhbHVlKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1t1bml0c10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJZiBwYXNzZWQgYSBsYW5ndWFnZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsYW5ndWFnZSBmb3IgdGhpc1xuICAgICAgICAvLyBpbnN0YW5jZS4gIE90aGVyd2lzZSwgaXQgd2lsbCByZXR1cm4gdGhlIGxhbmd1YWdlIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxuICAgICAgICBsYW5nIDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xhbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhbmcgPSBnZXRMYW5nRGVmaW5pdGlvbihrZXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBoZWxwZXIgZm9yIGFkZGluZyBzaG9ydGN1dHNcbiAgICBmdW5jdGlvbiBtYWtlR2V0dGVyQW5kU2V0dGVyKG5hbWUsIGtleSkge1xuICAgICAgICBtb21lbnQuZm5bbmFtZV0gPSBtb21lbnQuZm5bbmFtZSArICdzJ10gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciB1dGMgPSB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJyc7XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RbJ3NldCcgKyB1dGMgKyBrZXldKGlucHV0KTtcbiAgICAgICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZFsnZ2V0JyArIHV0YyArIGtleV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBsb29wIHRocm91Z2ggYW5kIGFkZCBzaG9ydGN1dHMgKE1vbnRoLCBEYXRlLCBIb3VycywgTWludXRlcywgU2Vjb25kcywgTWlsbGlzZWNvbmRzKVxuICAgIGZvciAoaSA9IDA7IGkgPCBwcm94eUdldHRlcnNBbmRTZXR0ZXJzLmxlbmd0aDsgaSArKykge1xuICAgICAgICBtYWtlR2V0dGVyQW5kU2V0dGVyKHByb3h5R2V0dGVyc0FuZFNldHRlcnNbaV0udG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9zJC8sICcnKSwgcHJveHlHZXR0ZXJzQW5kU2V0dGVyc1tpXSk7XG4gICAgfVxuXG4gICAgLy8gYWRkIHNob3J0Y3V0IGZvciB5ZWFyICh1c2VzIGRpZmZlcmVudCBzeW50YXggdGhhbiB0aGUgZ2V0dGVyL3NldHRlciAneWVhcicgPT0gJ0Z1bGxZZWFyJylcbiAgICBtYWtlR2V0dGVyQW5kU2V0dGVyKCd5ZWFyJywgJ0Z1bGxZZWFyJyk7XG5cbiAgICAvLyBhZGQgcGx1cmFsIG1ldGhvZHNcbiAgICBtb21lbnQuZm4uZGF5cyA9IG1vbWVudC5mbi5kYXk7XG4gICAgbW9tZW50LmZuLm1vbnRocyA9IG1vbWVudC5mbi5tb250aDtcbiAgICBtb21lbnQuZm4ud2Vla3MgPSBtb21lbnQuZm4ud2VlaztcbiAgICBtb21lbnQuZm4uaXNvV2Vla3MgPSBtb21lbnQuZm4uaXNvV2VlaztcblxuICAgIC8vIGFkZCBhbGlhc2VkIGZvcm1hdCBtZXRob2RzXG4gICAgbW9tZW50LmZuLnRvSlNPTiA9IG1vbWVudC5mbi50b0lTT1N0cmluZztcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRHVyYXRpb24gUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQobW9tZW50LmR1cmF0aW9uLmZuID0gRHVyYXRpb24ucHJvdG90eXBlLCB7XG5cbiAgICAgICAgX2J1YmJsZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICAgICAgZGF5cyA9IHRoaXMuX2RheXMsXG4gICAgICAgICAgICAgICAgbW9udGhzID0gdGhpcy5fbW9udGhzLFxuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9kYXRhLFxuICAgICAgICAgICAgICAgIHNlY29uZHMsIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycztcblxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgICAgICAgICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgICAgICAgICAgZGF0YS5taWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHMgJSAxMDAwO1xuXG4gICAgICAgICAgICBzZWNvbmRzID0gYWJzUm91bmQobWlsbGlzZWNvbmRzIC8gMTAwMCk7XG4gICAgICAgICAgICBkYXRhLnNlY29uZHMgPSBzZWNvbmRzICUgNjA7XG5cbiAgICAgICAgICAgIG1pbnV0ZXMgPSBhYnNSb3VuZChzZWNvbmRzIC8gNjApO1xuICAgICAgICAgICAgZGF0YS5taW51dGVzID0gbWludXRlcyAlIDYwO1xuXG4gICAgICAgICAgICBob3VycyA9IGFic1JvdW5kKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgICAgICBkYXRhLmhvdXJzID0gaG91cnMgJSAyNDtcblxuICAgICAgICAgICAgZGF5cyArPSBhYnNSb3VuZChob3VycyAvIDI0KTtcbiAgICAgICAgICAgIGRhdGEuZGF5cyA9IGRheXMgJSAzMDtcblxuICAgICAgICAgICAgbW9udGhzICs9IGFic1JvdW5kKGRheXMgLyAzMCk7XG4gICAgICAgICAgICBkYXRhLm1vbnRocyA9IG1vbnRocyAlIDEyO1xuXG4gICAgICAgICAgICB5ZWFycyA9IGFic1JvdW5kKG1vbnRocyAvIDEyKTtcbiAgICAgICAgICAgIGRhdGEueWVhcnMgPSB5ZWFycztcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrcyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhYnNSb3VuZCh0aGlzLmRheXMoKSAvIDcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWlsbGlzZWNvbmRzICtcbiAgICAgICAgICAgICAgdGhpcy5fZGF5cyAqIDg2NGU1ICtcbiAgICAgICAgICAgICAgKHRoaXMuX21vbnRocyAlIDEyKSAqIDI1OTJlNiArXG4gICAgICAgICAgICAgIHRvSW50KHRoaXMuX21vbnRocyAvIDEyKSAqIDMxNTM2ZTY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaHVtYW5pemUgOiBmdW5jdGlvbiAod2l0aFN1ZmZpeCkge1xuICAgICAgICAgICAgdmFyIGRpZmZlcmVuY2UgPSArdGhpcyxcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZWxhdGl2ZVRpbWUoZGlmZmVyZW5jZSwgIXdpdGhTdWZmaXgsIHRoaXMubGFuZygpKTtcblxuICAgICAgICAgICAgaWYgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB0aGlzLmxhbmcoKS5wYXN0RnV0dXJlKGRpZmZlcmVuY2UsIG91dHB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcbiAgICAgICAgICAgIC8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIGFkZCgxLCAncycpIG9yIGFkZChtb21lbnQpXG4gICAgICAgICAgICB2YXIgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xuXG4gICAgICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgKz0gZHVyLl9taWxsaXNlY29uZHM7XG4gICAgICAgICAgICB0aGlzLl9kYXlzICs9IGR1ci5fZGF5cztcbiAgICAgICAgICAgIHRoaXMuX21vbnRocyArPSBkdXIuX21vbnRocztcblxuICAgICAgICAgICAgdGhpcy5fYnViYmxlKCk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyAtPSBkdXIuX21pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHRoaXMuX2RheXMgLT0gZHVyLl9kYXlzO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzIC09IGR1ci5fbW9udGhzO1xuXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0IDogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzLnRvTG93ZXJDYXNlKCkgKyAncyddKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXMgOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ2FzJyArIHVuaXRzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdW5pdHMuc2xpY2UoMSkgKyAncyddKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbGFuZyA6IG1vbWVudC5mbi5sYW5nLFxuXG4gICAgICAgIHRvSXNvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gaW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2RvcmRpbGxlL21vbWVudC1pc29kdXJhdGlvbi9ibG9iL21hc3Rlci9tb21lbnQuaXNvZHVyYXRpb24uanNcbiAgICAgICAgICAgIHZhciB5ZWFycyA9IE1hdGguYWJzKHRoaXMueWVhcnMoKSksXG4gICAgICAgICAgICAgICAgbW9udGhzID0gTWF0aC5hYnModGhpcy5tb250aHMoKSksXG4gICAgICAgICAgICAgICAgZGF5cyA9IE1hdGguYWJzKHRoaXMuZGF5cygpKSxcbiAgICAgICAgICAgICAgICBob3VycyA9IE1hdGguYWJzKHRoaXMuaG91cnMoKSksXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IE1hdGguYWJzKHRoaXMubWludXRlcygpKSxcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5hYnModGhpcy5zZWNvbmRzKCkgKyB0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5hc1NlY29uZHMoKSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIHNhbWUgYXMgQyMncyAoTm9kYSkgYW5kIHB5dGhvbiAoaXNvZGF0ZSkuLi5cbiAgICAgICAgICAgICAgICAvLyBidXQgbm90IG90aGVyIEpTIChnb29nLmRhdGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuICdQMEQnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuYXNTZWNvbmRzKCkgPCAwID8gJy0nIDogJycpICtcbiAgICAgICAgICAgICAgICAnUCcgK1xuICAgICAgICAgICAgICAgICh5ZWFycyA/IHllYXJzICsgJ1knIDogJycpICtcbiAgICAgICAgICAgICAgICAobW9udGhzID8gbW9udGhzICsgJ00nIDogJycpICtcbiAgICAgICAgICAgICAgICAoZGF5cyA/IGRheXMgKyAnRCcgOiAnJykgK1xuICAgICAgICAgICAgICAgICgoaG91cnMgfHwgbWludXRlcyB8fCBzZWNvbmRzKSA/ICdUJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKGhvdXJzID8gaG91cnMgKyAnSCcgOiAnJykgK1xuICAgICAgICAgICAgICAgIChtaW51dGVzID8gbWludXRlcyArICdNJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKHNlY29uZHMgPyBzZWNvbmRzICsgJ1MnIDogJycpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtYWtlRHVyYXRpb25HZXR0ZXIobmFtZSkge1xuICAgICAgICBtb21lbnQuZHVyYXRpb24uZm5bbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRHVyYXRpb25Bc0dldHRlcihuYW1lLCBmYWN0b3IpIHtcbiAgICAgICAgbW9tZW50LmR1cmF0aW9uLmZuWydhcycgKyBuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiArdGhpcyAvIGZhY3RvcjtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmb3IgKGkgaW4gdW5pdE1pbGxpc2Vjb25kRmFjdG9ycykge1xuICAgICAgICBpZiAodW5pdE1pbGxpc2Vjb25kRmFjdG9ycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgbWFrZUR1cmF0aW9uQXNHZXR0ZXIoaSwgdW5pdE1pbGxpc2Vjb25kRmFjdG9yc1tpXSk7XG4gICAgICAgICAgICBtYWtlRHVyYXRpb25HZXR0ZXIoaS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1ha2VEdXJhdGlvbkFzR2V0dGVyKCdXZWVrcycsIDYwNDhlNSk7XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzTW9udGhzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKCt0aGlzIC0gdGhpcy55ZWFycygpICogMzE1MzZlNikgLyAyNTkyZTYgKyB0aGlzLnllYXJzKCkgKiAxMjtcbiAgICB9O1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgTGFuZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gU2V0IGRlZmF1bHQgbGFuZ3VhZ2UsIG90aGVyIGxhbmd1YWdlcyB3aWxsIGluaGVyaXQgZnJvbSBFbmdsaXNoLlxuICAgIG1vbWVudC5sYW5nKCdlbicsIHtcbiAgICAgICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTAsXG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gKHRvSW50KG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgKyBvdXRwdXQ7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qIEVNQkVEX0xBTkdVQUdFUyAqL1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBNb21lbnRcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBtYWtlR2xvYmFsKGRlcHJlY2F0ZSkge1xuICAgICAgICB2YXIgd2FybmVkID0gZmFsc2UsIGxvY2FsX21vbWVudCA9IG1vbWVudDtcbiAgICAgICAgLypnbG9iYWwgZW5kZXI6ZmFsc2UgKi9cbiAgICAgICAgaWYgKHR5cGVvZiBlbmRlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBoZXJlLCBgdGhpc2AgbWVhbnMgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBnbG9iYWxgIG9uIHRoZSBzZXJ2ZXJcbiAgICAgICAgLy8gYWRkIGBtb21lbnRgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgXCJhZHZhbmNlZFwiIG1vZGVcbiAgICAgICAgaWYgKGRlcHJlY2F0ZSkge1xuICAgICAgICAgICAgZ2xvYmFsLm1vbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdhcm5lZCAmJiBjb25zb2xlICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICAgICAgICAgICAgICB3YXJuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJBY2Nlc3NpbmcgTW9tZW50IHRocm91Z2ggdGhlIGdsb2JhbCBzY29wZSBpcyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkZXByZWNhdGVkLCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlbGVhc2UuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxfbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZXh0ZW5kKGdsb2JhbC5tb21lbnQsIGxvY2FsX21vbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnbG9iYWxbJ21vbWVudCddID0gbW9tZW50O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbW9tZW50O1xuICAgICAgICBtYWtlR2xvYmFsKHRydWUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFwibW9tZW50XCIsIGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcbiAgICAgICAgICAgIGlmIChtb2R1bGUuY29uZmlnICYmIG1vZHVsZS5jb25maWcoKSAmJiBtb2R1bGUuY29uZmlnKCkubm9HbG9iYWwgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB1c2VyIHByb3ZpZGVkIG5vR2xvYmFsLCBoZSBpcyBhd2FyZSBvZiBnbG9iYWxcbiAgICAgICAgICAgICAgICBtYWtlR2xvYmFsKG1vZHVsZS5jb25maWcoKS5ub0dsb2JhbCA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudDtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWFrZUdsb2JhbCgpO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG9uY2Vcblxub25jZS5wcm90byA9IG9uY2UoZnVuY3Rpb24gKCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRnVuY3Rpb24ucHJvdG90eXBlLCAnb25jZScsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG9uY2UodGhpcylcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxufSlcblxuZnVuY3Rpb24gb25jZSAoZm4pIHtcbiAgdmFyIGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGYuY2FsbGVkKSByZXR1cm4gZi52YWx1ZVxuICAgIGYuY2FsbGVkID0gdHJ1ZVxuICAgIHJldHVybiBmLnZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4gIGYuY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZcbn1cbiIsImV4cG9ydHMuQXNzZXRzTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL2Fzc2V0c21hbmFnZXInKTtcbiIsInZhciBjb252ZXJ0ID0gcmVxdWlyZSgnY29sb3ItY29udmVydCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFJlc291cmNlTG9hZGVyID0gcmVxdWlyZSgnLi9yZXNvdXJjZWxvYWRlcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzZXRzTWFuYWdlcjtcblxuXG5mdW5jdGlvbiBBc3NldHNNYW5hZ2VyKG9wdF9vcHRpb25zKSB7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHZhciBvcHRpb25zID0ge1xuICAgIHdvcmtlclBhdGg6IF9fZGlybmFtZSArICcvLi4vd29ya2VyLmpzJyxcbiAgICB3b3JrZXJzOiAxXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIC8vIENyZWF0ZSB0aGUgbnVtYmVyIG9mIHdvcmtlcnMgc3BlY2lmaWVkIGluIG9wdGlvbnMuXG4gIHZhciB3b3JrZXJzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy53b3JrZXJzOyBpKyspIHtcbiAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihvcHRpb25zLndvcmtlclBhdGgpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb3h5IHdoaWNoIHdpbGwgaGFuZGxlIGRlbGVnYXRpb24gdG8gdGhlIHdvcmtlcnMuXG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2Vycyk7XG5cbiAgdGhpcy5fZW1pdHRpbmcgPSB7fTtcbiAgdGhpcy5fYmxvYkNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgLy8gVE9ETzogTWFrZSBhIG1vcmUgZ2VuZXJpYyBjYWNoZT9cbiAgdGhpcy5fZnJhbWVzQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB0aGlzLl9pbWFnZUNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbnV0aWwuaW5oZXJpdHMoQXNzZXRzTWFuYWdlciwgRXZlbnRFbWl0dGVyKTtcblxuLyoqXG4gKiBJbmRleGVzIGEgZGlyZWN0b3J5LiBBbGwgZmlsZXMgaW4gdGhlIGRpcmVjdG9yeSB3aWxsIGJlIHJlYWNoYWJsZSB0aHJvdWdoXG4gKiB0aGUgYXNzZXRzIGRhdGFiYXNlIGFmdGVyIHRoaXMgY29tcGxldGVzLiBBbGwgLnBhay8ubW9kcGFrIGZpbGVzIHdpbGwgYWxzb1xuICogYmUgbG9hZGVkIGludG8gdGhlIGluZGV4LlxuICpcbiAqIFRoZSB2aXJ0dWFsIHBhdGggYXJndW1lbnQgaXMgYSBwcmVmaXggZm9yIHRoZSBlbnRyaWVzIGluIHRoZSBkaXJlY3RvcnkuXG4gKi9cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmFkZERpcmVjdG9yeSA9IGZ1bmN0aW9uIChwYXRoLCBkaXJFbnRyeSwgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBwZW5kaW5nID0gMTtcbiAgdmFyIGRlY3JlbWVudFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcGVuZGluZy0tO1xuICAgIGlmICghcGVuZGluZykge1xuICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgfVxuICB9O1xuXG4gIHZhciByZWFkZXIgPSBkaXJFbnRyeS5jcmVhdGVSZWFkZXIoKTtcbiAgdmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVhZGVyLnJlYWRFbnRyaWVzKGZ1bmN0aW9uIChlbnRyaWVzKSB7XG4gICAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZW50cmllcy5mb3JFYWNoKGZ1bmN0aW9uIChlbnRyeSkge1xuICAgICAgICBpZiAoZW50cnkubmFtZVswXSA9PSAnLicpIHJldHVybjtcblxuICAgICAgICB2YXIgZW50cnlQYXRoID0gcGF0aCArICcvJyArIGVudHJ5Lm5hbWU7XG5cbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgcGVuZGluZysrO1xuICAgICAgICAgIHNlbGYuYWRkRGlyZWN0b3J5KGVudHJ5UGF0aCwgZW50cnksIGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICBzZWxmLmFkZEZpbGUoZW50cnlQYXRoLCBmaWxlLCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgICB9LCBkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG4gIH07XG4gIG5leHQoKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmFkZEZpbGUgPSBmdW5jdGlvbiAocGF0aCwgZmlsZSwgY2FsbGJhY2spIHtcbiAgLy8gVE9ETzogV2hhdCB0byBkbyBhYm91dCB0aGUgY2FsbGJhY2sgYmVpbmcgY2FsbGVkIG9uY2UgZm9yIGVhY2ggd29ya2VyP1xuICB0aGlzLmFwaS5hZGRGaWxlLmJyb2FkY2FzdChwYXRoLCBmaWxlLCBjYWxsYmFjayk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5hZGRSb290ID0gZnVuY3Rpb24gKGRpckVudHJ5LCBjYWxsYmFjaykge1xuICB0aGlzLmFkZERpcmVjdG9yeSgnJywgZGlyRW50cnksIGNhbGxiYWNrKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmVtaXRPbmNlUGVyVGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAodGhpcy5fZW1pdHRpbmdbZXZlbnRdKSByZXR1cm47XG4gIHRoaXMuX2VtaXR0aW5nW2V2ZW50XSA9IHRydWU7XG5cbiAgdmFyIHNlbGYgPSB0aGlzLCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5lbWl0LmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIGRlbGV0ZSBzZWxmLl9lbWl0dGluZ1tldmVudF07XG4gIH0pO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0QmxvYlVSTCA9IGZ1bmN0aW9uIChwYXRoLCBjYWxsYmFjaykge1xuICBpZiAocGF0aCBpbiB0aGlzLl9ibG9iQ2FjaGUpIHtcbiAgICBjYWxsYmFjayhudWxsLCB0aGlzLl9ibG9iQ2FjaGVbcGF0aF0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hcGkuZ2V0QmxvYlVSTChwYXRoLCBmdW5jdGlvbiAoZXJyLCB1cmwpIHtcbiAgICBpZiAoIWVycikgc2VsZi5fYmxvYkNhY2hlW3BhdGhdID0gdXJsO1xuICAgIGNhbGxiYWNrKGVyciwgdXJsKTtcbiAgfSk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRGcmFtZXMgPSBmdW5jdGlvbiAoaW1hZ2VQYXRoKSB7XG4gIHZhciBkb3RPZmZzZXQgPSBpbWFnZVBhdGgubGFzdEluZGV4T2YoJy4nKTtcbiAgdmFyIHBhdGggPSBpbWFnZVBhdGguc3Vic3RyKDAsIGRvdE9mZnNldCkgKyAnLmZyYW1lcyc7XG5cbiAgaWYgKHBhdGggaW4gdGhpcy5fZnJhbWVzQ2FjaGUpIHJldHVybiB0aGlzLl9mcmFtZXNDYWNoZVtwYXRoXTtcbiAgdGhpcy5fZnJhbWVzQ2FjaGVbcGF0aF0gPSBudWxsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hcGkuZ2V0SlNPTihwYXRoLCBmdW5jdGlvbiAoZXJyLCBmcmFtZXMpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5fZnJhbWVzQ2FjaGVbcGF0aF0gPSBmcmFtZXM7XG4gIH0pO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBpbWFnZSBmb3IgdGhlIHNwZWNpZmllZCBwYXRoLiBUaGlzIGZ1bmN0aW9uIGlzIHN5bmNocm9ub3VzLCBidXQgbWF5XG4gKiBkZXBlbmQgb24gYXN5bmNocm9ub3VzIG9wZXJhdGlvbnMuIElmIHRoZSBpbWFnZSBpcyBub3QgaW1tZWRpYXRlbHkgYXZhaWxhYmxlXG4gKiB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIG51bGwuIE9uY2UgbW9yZSBpbWFnZXMgYXJlIGF2YWlsYWJsZSwgYW4gXCJpbWFnZXNcIlxuICogZXZlbnQgd2lsbCBiZSBlbWl0dGVkLlxuICovXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRJbWFnZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIC8vIEV4YW1wbGUgcGF0aDogXCIvZGlyZWN0b3J5L2ltYWdlLnBuZz9odWVzaGlmdD02MD9mYWRlPWZmZmZmZj0wLjFcIlxuICBpZiAocGF0aCBpbiB0aGlzLl9pbWFnZUNhY2hlKSByZXR1cm4gdGhpcy5faW1hZ2VDYWNoZVtwYXRoXTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gRXh0cmFjdCBpbWFnZSBvcGVyYXRpb25zLlxuICB2YXIgb3BzID0gcGF0aC5zcGxpdCgnPycpO1xuICAvLyBHZXQgdGhlIHBsYWluIHBhdGggdG8gdGhlIGltYWdlIGZpbGUuXG4gIHZhciBmaWxlUGF0aCA9IG9wcy5zaGlmdCgpO1xuXG4gIC8vIElmIHRoZSBpbWFnZSBpcyBub3QgaW4gdGhlIGNhY2hlLCBsb2FkIGl0IGFuZCB0cmlnZ2VyIGFuIFwiaW1hZ2VzXCIgZXZlbnRcbiAgLy8gd2hlbiBpdCdzIGRvbmUuXG4gIGlmICghKGZpbGVQYXRoIGluIHRoaXMuX2ltYWdlQ2FjaGUpKSB7XG4gICAgdGhpcy5faW1hZ2VDYWNoZVtmaWxlUGF0aF0gPSBudWxsO1xuXG4gICAgdGhpcy5nZXRCbG9iVVJMKGZpbGVQYXRoLCBmdW5jdGlvbiAoZXJyLCB1cmwpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gbG9hZCAlcyAoJXMpJywgZmlsZVBhdGgsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5faW1hZ2VDYWNoZVtmaWxlUGF0aF0gPSBpbWFnZTtcbiAgICAgICAgc2VsZi5lbWl0T25jZVBlclRpY2soJ2ltYWdlcycpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHZhciBpbWFnZSA9IHRoaXMuX2ltYWdlQ2FjaGVbZmlsZVBhdGhdO1xuICBpZiAoIWltYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBBcHBseSBvcGVyYXRpb25zIChzdWNoIGFzIGh1ZSBzaGlmdCkgb24gdGhlIGltYWdlLlxuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuXG4gIC8vIFBhcnNlIGFsbCB0aGUgb3BlcmF0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBpbWFnZS5cbiAgLy8gVE9ETzogYWRkbWFzaywgYnJpZ2h0bmVzcywgZmFkZSwgcmVwbGFjZSwgc2F0dXJhdGlvblxuICB2YXIgaHVlID0gMCwgZmxpcEV2ZXJ5WCA9IDAsIHJlcGxhY2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG9wID0gb3BzW2ldLnNwbGl0KC9bPTtdLyk7XG4gICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgLy8gVGhpcyBvcGVyYXRpb24gZG9lc24ndCBleGlzdCBpbiBTdGFyYm91bmQsIGJ1dCBpcyBoZWxwZnVsIGZvciB1cy5cbiAgICAgIGNhc2UgJ2ZsaXBncmlkeCc6XG4gICAgICAgIGZsaXBFdmVyeVggPSBwYXJzZUludChvcFsxXSk7XG4gICAgICAgIGlmIChpbWFnZS53aWR0aCAlIGZsaXBFdmVyeVgpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oaW1hZ2Uud2lkdGggKyAnIG5vdCBkaXZpc2libGUgYnkgJyArIGZsaXBFdmVyeVggKyAnICgnICsgcGF0aCArICcpJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdodWVzaGlmdCc6XG4gICAgICAgIGh1ZSA9IHBhcnNlRmxvYXQob3BbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JlcGxhY2UnOlxuICAgICAgICBpZiAoIXJlcGxhY2UpIHJlcGxhY2UgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBvcC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgIHZhciBmcm9tID0gW1xuICAgICAgICAgICAgcGFyc2VJbnQob3BbaV0uc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChvcFtpXS5zdWJzdHIoMiwgMiksIDE2KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2ldLnN1YnN0cig0LCAyKSwgMTYpXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHZhciB0byA9IFtcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2kgKyAxXS5zdWJzdHIoMCwgMiksIDE2KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2kgKyAxXS5zdWJzdHIoMiwgMiksIDE2KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2kgKyAxXS5zdWJzdHIoNCwgMiksIDE2KVxuICAgICAgICAgIF07XG5cbiAgICAgICAgICByZXBsYWNlW2Zyb21dID0gdG87XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLndhcm4oJ1Vuc3VwcG9ydGVkIGltYWdlIG9wZXJhdGlvbjonLCBvcCk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICBpZiAoZmxpcEV2ZXJ5WCkge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQuc2NhbGUoLTEsIDEpO1xuICAgIGZvciAodmFyIHggPSAwOyB4ICsgZmxpcEV2ZXJ5WCA8PSBpbWFnZS53aWR0aDsgeCArPSBmbGlwRXZlcnlYKSB7XG4gICAgICB2YXIgZmxpcHBlZFggPSAtKHggKyBmbGlwRXZlcnlYKSwgZHcgPSBmbGlwRXZlcnlYLCBkaCA9IGltYWdlLmhlaWdodDtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCB4LCAwLCBkdywgZGgsIGZsaXBwZWRYLCAwLCBkdywgZGgpO1xuICAgIH1cbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbiAgfSBlbHNlIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG4gIH1cblxuICBpZiAoaHVlIHx8IHJlcGxhY2UpIHtcbiAgICB2YXIgaW1hZ2VEYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCksXG4gICAgICAgIGRhdGEgPSBpbWFnZURhdGEuZGF0YTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgIGlmIChyZXBsYWNlKSB7XG4gICAgICAgIHZhciBjb2xvciA9IHJlcGxhY2VbZGF0YVtpXSArICcsJyArIGRhdGFbaSArIDFdICsgJywnICsgZGF0YVtpICsgMl1dO1xuICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICBkYXRhW2ldID0gY29sb3JbMF07XG4gICAgICAgICAgZGF0YVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgICAgICBkYXRhW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChodWUpIHtcbiAgICAgICAgaHN2ID0gY29udmVydC5yZ2IyaHN2KGRhdGFbaV0sIGRhdGFbaSArIDFdLCBkYXRhW2kgKyAyXSk7XG5cbiAgICAgICAgaHN2WzBdICs9IGh1ZTtcbiAgICAgICAgaWYgKGhzdlswXSA8IDApIGhzdlswXSArPSAzNjBcbiAgICAgICAgZWxzZSBpZiAoaHN2WzBdID49IDM2MCkgaHN2WzBdIC09IDM2MDtcblxuICAgICAgICByZ2IgPSBjb252ZXJ0LmhzdjJyZ2IoaHN2KTtcblxuICAgICAgICBkYXRhW2ldID0gcmdiWzBdO1xuICAgICAgICBkYXRhW2kgKyAxXSA9IHJnYlsxXTtcbiAgICAgICAgZGF0YVtpICsgMl0gPSByZ2JbMl07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gIH1cblxuICBzZWxmLl9pbWFnZUNhY2hlW3BhdGhdID0gbnVsbDtcblxuICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IGZvciB0aGUgbW9kaWZpZWQgaW1hZ2UgYW5kIGNhY2hlIGl0LlxuICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5faW1hZ2VDYWNoZVtwYXRoXSA9IGltYWdlO1xuICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdpbWFnZXMnKTtcbiAgfTtcbiAgaW1hZ2Uuc3JjID0gY2FudmFzLnRvRGF0YVVSTCgpO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0UmVzb3VyY2VMb2FkZXIgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG4gIHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIodGhpcywgZXh0ZW5zaW9uKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldFJlc291cmNlUGF0aCA9IGZ1bmN0aW9uIChyZXNvdXJjZSwgcGF0aCkge1xuICBpZiAocGF0aFswXSA9PSAnLycpIHJldHVybiBwYXRoO1xuICB2YXIgYmFzZSA9IHJlc291cmNlLl9fcGF0aF9fO1xuICByZXR1cm4gYmFzZS5zdWJzdHIoMCwgYmFzZS5sYXN0SW5kZXhPZignLycpICsgMSkgKyBwYXRoO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0VGlsZUltYWdlID0gZnVuY3Rpb24gKHJlc291cmNlLCBmaWVsZCwgb3B0X2h1ZVNoaWZ0KSB7XG4gIGlmICghKGZpZWxkIGluIHJlc291cmNlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRmllbGQgXCInICsgZmllbGQgKyAnXCIgbm90IGluIHJlc291cmNlOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzb3VyY2UpKTtcbiAgfVxuXG4gIHBhdGggPSB0aGlzLmdldFJlc291cmNlUGF0aChyZXNvdXJjZSwgcmVzb3VyY2VbZmllbGRdKTtcblxuICAvLyBBZGQgaHVlc2hpZnQgaW1hZ2Ugb3BlcmF0aW9uIGlmIG5lZWRlZC5cbiAgaWYgKG9wdF9odWVTaGlmdCkge1xuICAgIHBhdGggKz0gJz9odWVzaGlmdD0nICsgKG9wdF9odWVTaGlmdCAvIDI1NSAqIDM2MCk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5nZXRJbWFnZShwYXRoKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmxvYWRSZXNvdXJjZXMgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uLCBjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXBpLmxvYWRSZXNvdXJjZXMoZXh0ZW5zaW9uLCBmdW5jdGlvbiAoZXJyLCByZXNvdXJjZXMpIHtcbiAgICBjYWxsYmFjayhlcnIsIHJlc291cmNlcyk7XG4gICAgaWYgKCFlcnIpIHtcbiAgICAgIHNlbGYuZW1pdE9uY2VQZXJUaWNrKCdyZXNvdXJjZXMnKTtcbiAgICB9XG4gIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2VMb2FkZXI7XG5cblxuZnVuY3Rpb24gUmVzb3VyY2VMb2FkZXIoYXNzZXRzTWFuYWdlciwgZXh0ZW5zaW9uKSB7XG4gIHRoaXMuYXNzZXRzID0gYXNzZXRzTWFuYWdlcjtcbiAgdGhpcy5leHRlbnNpb24gPSBleHRlbnNpb247XG5cbiAgdGhpcy5pbmRleCA9IG51bGw7XG5cbiAgdGhpcy5fbG9hZGluZ0luZGV4ID0gZmFsc2U7XG59XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgaWYgKCF0aGlzLmluZGV4KSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRoaXMuaW5kZXhbaWRdIHx8IG51bGw7XG59O1xuXG5SZXNvdXJjZUxvYWRlci5wcm90b3R5cGUubG9hZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fbG9hZGluZ0luZGV4KSByZXR1cm47XG4gIHRoaXMuX2xvYWRpbmdJbmRleCA9IHRydWU7XG5cbiAgLy8gVE9ETzogRmF0IGFycm93cy5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmFzc2V0cy5sb2FkUmVzb3VyY2VzKHRoaXMuZXh0ZW5zaW9uLCBmdW5jdGlvbiAoZXJyLCBpbmRleCkge1xuICAgIHNlbGYuX2xvYWRpbmdJbmRleCA9IGZhbHNlO1xuICAgIHNlbGYuaW5kZXggPSBpbmRleDtcbiAgfSk7XG59O1xuIiwiLyogTUlUIGxpY2Vuc2UgKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJnYjJoc2w6IHJnYjJoc2wsXG4gIHJnYjJoc3Y6IHJnYjJoc3YsXG4gIHJnYjJjbXlrOiByZ2IyY215ayxcbiAgcmdiMmtleXdvcmQ6IHJnYjJrZXl3b3JkLFxuICByZ2IyeHl6OiByZ2IyeHl6LFxuICByZ2IybGFiOiByZ2IybGFiLFxuXG4gIGhzbDJyZ2I6IGhzbDJyZ2IsXG4gIGhzbDJoc3Y6IGhzbDJoc3YsXG4gIGhzbDJjbXlrOiBoc2wyY215ayxcbiAgaHNsMmtleXdvcmQ6IGhzbDJrZXl3b3JkLFxuXG4gIGhzdjJyZ2I6IGhzdjJyZ2IsXG4gIGhzdjJoc2w6IGhzdjJoc2wsXG4gIGhzdjJjbXlrOiBoc3YyY215ayxcbiAgaHN2MmtleXdvcmQ6IGhzdjJrZXl3b3JkLFxuXG4gIGNteWsycmdiOiBjbXlrMnJnYixcbiAgY215azJoc2w6IGNteWsyaHNsLFxuICBjbXlrMmhzdjogY215azJoc3YsXG4gIGNteWsya2V5d29yZDogY215azJrZXl3b3JkLFxuICBcbiAga2V5d29yZDJyZ2I6IGtleXdvcmQycmdiLFxuICBrZXl3b3JkMmhzbDoga2V5d29yZDJoc2wsXG4gIGtleXdvcmQyaHN2OiBrZXl3b3JkMmhzdixcbiAga2V5d29yZDJjbXlrOiBrZXl3b3JkMmNteWssXG4gIGtleXdvcmQybGFiOiBrZXl3b3JkMmxhYixcbiAga2V5d29yZDJ4eXo6IGtleXdvcmQyeHl6LFxuICBcbiAgeHl6MnJnYjogeHl6MnJnYixcbiAgeHl6MmxhYjogeHl6MmxhYixcbiAgXG4gIGxhYjJ4eXo6IGxhYjJ4eXosXG59XG5cblxuZnVuY3Rpb24gcmdiMmhzbChyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0vMjU1LFxuICAgICAgZyA9IHJnYlsxXS8yNTUsXG4gICAgICBiID0gcmdiWzJdLzI1NSxcbiAgICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpLFxuICAgICAgbWF4ID0gTWF0aC5tYXgociwgZywgYiksXG4gICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgIGgsIHMsIGw7XG5cbiAgaWYgKG1heCA9PSBtaW4pXG4gICAgaCA9IDA7XG4gIGVsc2UgaWYgKHIgPT0gbWF4KSBcbiAgICBoID0gKGcgLSBiKSAvIGRlbHRhOyBcbiAgZWxzZSBpZiAoZyA9PSBtYXgpXG4gICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChiID09IG1heClcbiAgICBoID0gNCArIChyIC0gZykvIGRlbHRhO1xuXG4gIGggPSBNYXRoLm1pbihoICogNjAsIDM2MCk7XG5cbiAgaWYgKGggPCAwKVxuICAgIGggKz0gMzYwO1xuXG4gIGwgPSAobWluICsgbWF4KSAvIDI7XG5cbiAgaWYgKG1heCA9PSBtaW4pXG4gICAgcyA9IDA7XG4gIGVsc2UgaWYgKGwgPD0gMC41KVxuICAgIHMgPSBkZWx0YSAvIChtYXggKyBtaW4pO1xuICBlbHNlXG4gICAgcyA9IGRlbHRhIC8gKDIgLSBtYXggLSBtaW4pO1xuXG4gIHJldHVybiBbaCwgcyAqIDEwMCwgbCAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIHJnYjJoc3YocmdiKSB7XG4gIHZhciByID0gcmdiWzBdLFxuICAgICAgZyA9IHJnYlsxXSxcbiAgICAgIGIgPSByZ2JbMl0sXG4gICAgICBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKSxcbiAgICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLFxuICAgICAgZGVsdGEgPSBtYXggLSBtaW4sXG4gICAgICBoLCBzLCB2O1xuXG4gIGlmIChtYXggPT0gMClcbiAgICBzID0gMDtcbiAgZWxzZVxuICAgIHMgPSAoZGVsdGEvbWF4ICogMTAwMCkvMTA7XG5cbiAgaWYgKG1heCA9PSBtaW4pXG4gICAgaCA9IDA7XG4gIGVsc2UgaWYgKHIgPT0gbWF4KSBcbiAgICBoID0gKGcgLSBiKSAvIGRlbHRhOyBcbiAgZWxzZSBpZiAoZyA9PSBtYXgpXG4gICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChiID09IG1heClcbiAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcblxuICBoID0gTWF0aC5taW4oaCAqIDYwLCAzNjApO1xuXG4gIGlmIChoIDwgMCkgXG4gICAgaCArPSAzNjA7XG5cbiAgdiA9ICgobWF4IC8gMjU1KSAqIDEwMDApIC8gMTA7XG5cbiAgcmV0dXJuIFtoLCBzLCB2XTtcbn1cblxuZnVuY3Rpb24gcmdiMmNteWsocmdiKSB7XG4gIHZhciByID0gcmdiWzBdIC8gMjU1LFxuICAgICAgZyA9IHJnYlsxXSAvIDI1NSxcbiAgICAgIGIgPSByZ2JbMl0gLyAyNTUsXG4gICAgICBjLCBtLCB5LCBrO1xuICAgICAgXG4gIGsgPSBNYXRoLm1pbigxIC0gciwgMSAtIGcsIDEgLSBiKTtcbiAgYyA9ICgxIC0gciAtIGspIC8gKDEgLSBrKTtcbiAgbSA9ICgxIC0gZyAtIGspIC8gKDEgLSBrKTtcbiAgeSA9ICgxIC0gYiAtIGspIC8gKDEgLSBrKTtcbiAgcmV0dXJuIFtjICogMTAwLCBtICogMTAwLCB5ICogMTAwLCBrICogMTAwXTtcbn1cblxuZnVuY3Rpb24gcmdiMmtleXdvcmQocmdiKSB7XG4gIHJldHVybiByZXZlcnNlS2V5d29yZHNbSlNPTi5zdHJpbmdpZnkocmdiKV07XG59XG5cbmZ1bmN0aW9uIHJnYjJ4eXoocmdiKSB7XG4gIHZhciByID0gcmdiWzBdIC8gMjU1LFxuICAgICAgZyA9IHJnYlsxXSAvIDI1NSxcbiAgICAgIGIgPSByZ2JbMl0gLyAyNTU7XG5cbiAgLy8gYXNzdW1lIHNSR0JcbiAgciA9IHIgPiAwLjA0MDQ1ID8gTWF0aC5wb3coKChyICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpIDogKHIgLyAxMi45Mik7XG4gIGcgPSBnID4gMC4wNDA0NSA/IE1hdGgucG93KCgoZyArIDAuMDU1KSAvIDEuMDU1KSwgMi40KSA6IChnIC8gMTIuOTIpO1xuICBiID0gYiA+IDAuMDQwNDUgPyBNYXRoLnBvdygoKGIgKyAwLjA1NSkgLyAxLjA1NSksIDIuNCkgOiAoYiAvIDEyLjkyKTtcbiAgXG4gIHZhciB4ID0gKHIgKiAwLjQxMjQpICsgKGcgKiAwLjM1NzYpICsgKGIgKiAwLjE4MDUpO1xuICB2YXIgeSA9IChyICogMC4yMTI2KSArIChnICogMC43MTUyKSArIChiICogMC4wNzIyKTtcbiAgdmFyIHogPSAociAqIDAuMDE5MykgKyAoZyAqIDAuMTE5MikgKyAoYiAqIDAuOTUwNSk7XG5cbiAgcmV0dXJuIFt4ICogMTAwLCB5ICoxMDAsIHogKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2IybGFiKHJnYikge1xuICB2YXIgeHl6ID0gcmdiMnh5eihyZ2IpLFxuICAgICAgICB4ID0geHl6WzBdLFxuICAgICAgICB5ID0geHl6WzFdLFxuICAgICAgICB6ID0geHl6WzJdLFxuICAgICAgICBsLCBhLCBiO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxLzMpIDogKDcuNzg3ICogeCkgKyAoMTYgLyAxMTYpO1xuICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMS8zKSA6ICg3Ljc4NyAqIHkpICsgKDE2IC8gMTE2KTtcbiAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEvMykgOiAoNy43ODcgKiB6KSArICgxNiAvIDExNik7XG5cbiAgbCA9ICgxMTYgKiB5KSAtIDE2O1xuICBhID0gNTAwICogKHggLSB5KTtcbiAgYiA9IDIwMCAqICh5IC0geik7XG4gIFxuICByZXR1cm4gW2wsIGEsIGJdO1xufVxuXG5cbmZ1bmN0aW9uIGhzbDJyZ2IoaHNsKSB7XG4gIHZhciBoID0gaHNsWzBdIC8gMzYwLFxuICAgICAgcyA9IGhzbFsxXSAvIDEwMCxcbiAgICAgIGwgPSBoc2xbMl0gLyAxMDAsXG4gICAgICB0MSwgdDIsIHQzLCByZ2IsIHZhbDtcblxuICBpZiAocyA9PSAwKSB7XG4gICAgdmFsID0gbCAqIDI1NTtcbiAgICByZXR1cm4gW3ZhbCwgdmFsLCB2YWxdO1xuICB9XG5cbiAgaWYgKGwgPCAwLjUpXG4gICAgdDIgPSBsICogKDEgKyBzKTtcbiAgZWxzZVxuICAgIHQyID0gbCArIHMgLSBsICogcztcbiAgdDEgPSAyICogbCAtIHQyO1xuXG4gIHJnYiA9IFswLCAwLCAwXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICB0MyA9IGggKyAxIC8gMyAqIC0gKGkgLSAxKTtcbiAgICB0MyA8IDAgJiYgdDMrKztcbiAgICB0MyA+IDEgJiYgdDMtLTtcblxuICAgIGlmICg2ICogdDMgPCAxKVxuICAgICAgdmFsID0gdDEgKyAodDIgLSB0MSkgKiA2ICogdDM7XG4gICAgZWxzZSBpZiAoMiAqIHQzIDwgMSlcbiAgICAgIHZhbCA9IHQyO1xuICAgIGVsc2UgaWYgKDMgKiB0MyA8IDIpXG4gICAgICB2YWwgPSB0MSArICh0MiAtIHQxKSAqICgyIC8gMyAtIHQzKSAqIDY7XG4gICAgZWxzZVxuICAgICAgdmFsID0gdDE7XG5cbiAgICByZ2JbaV0gPSB2YWwgKiAyNTU7XG4gIH1cbiAgXG4gIHJldHVybiByZ2I7XG59XG5cbmZ1bmN0aW9uIGhzbDJoc3YoaHNsKSB7XG4gIHZhciBoID0gaHNsWzBdLFxuICAgICAgcyA9IGhzbFsxXSAvIDEwMCxcbiAgICAgIGwgPSBoc2xbMl0gLyAxMDAsXG4gICAgICBzdiwgdjtcbiAgbCAqPSAyO1xuICBzICo9IChsIDw9IDEpID8gbCA6IDIgLSBsO1xuICB2ID0gKGwgKyBzKSAvIDI7XG4gIHN2ID0gKDIgKiBzKSAvIChsICsgcyk7XG4gIHJldHVybiBbaCwgc3YgKiAxMDAsIHYgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiBoc2wyY215ayhhcmdzKSB7XG4gIHJldHVybiByZ2IyY215ayhoc2wycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gaHNsMmtleXdvcmQoYXJncykge1xuICByZXR1cm4gcmdiMmtleXdvcmQoaHNsMnJnYihhcmdzKSk7XG59XG5cblxuZnVuY3Rpb24gaHN2MnJnYihoc3YpIHtcbiAgdmFyIGggPSBoc3ZbMF0gLyA2MCxcbiAgICAgIHMgPSBoc3ZbMV0gLyAxMDAsXG4gICAgICB2ID0gaHN2WzJdIC8gMTAwLFxuICAgICAgaGkgPSBNYXRoLmZsb29yKGgpICUgNjtcblxuICB2YXIgZiA9IGggLSBNYXRoLmZsb29yKGgpLFxuICAgICAgcCA9IDI1NSAqIHYgKiAoMSAtIHMpLFxuICAgICAgcSA9IDI1NSAqIHYgKiAoMSAtIChzICogZikpLFxuICAgICAgdCA9IDI1NSAqIHYgKiAoMSAtIChzICogKDEgLSBmKSkpLFxuICAgICAgdiA9IDI1NSAqIHY7XG5cbiAgc3dpdGNoKGhpKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIFt2LCB0LCBwXTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gW3EsIHYsIHBdO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBbcCwgdiwgdF07XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIFtwLCBxLCB2XTtcbiAgICBjYXNlIDQ6XG4gICAgICByZXR1cm4gW3QsIHAsIHZdO1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBbdiwgcCwgcV07XG4gIH1cbn1cblxuZnVuY3Rpb24gaHN2MmhzbChoc3YpIHtcbiAgdmFyIGggPSBoc3ZbMF0sXG4gICAgICBzID0gaHN2WzFdIC8gMTAwLFxuICAgICAgdiA9IGhzdlsyXSAvIDEwMCxcbiAgICAgIHNsLCBsO1xuXG4gIGwgPSAoMiAtIHMpICogdjsgIFxuICBzbCA9IHMgKiB2O1xuICBzbCAvPSAobCA8PSAxKSA/IGwgOiAyIC0gbDtcbiAgbCAvPSAyO1xuICByZXR1cm4gW2gsIHNsICogMTAwLCBsICogMTAwXTtcbn1cblxuZnVuY3Rpb24gaHN2MmNteWsoYXJncykge1xuICByZXR1cm4gcmdiMmNteWsoaHN2MnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGhzdjJrZXl3b3JkKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJrZXl3b3JkKGhzdjJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBjbXlrMnJnYihjbXlrKSB7XG4gIHZhciBjID0gY215a1swXSAvIDEwMCxcbiAgICAgIG0gPSBjbXlrWzFdIC8gMTAwLFxuICAgICAgeSA9IGNteWtbMl0gLyAxMDAsXG4gICAgICBrID0gY215a1szXSAvIDEwMCxcbiAgICAgIHIsIGcsIGI7XG5cbiAgciA9IDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspO1xuICBnID0gMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgayk7XG4gIGIgPSAxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKTtcbiAgcmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn1cblxuZnVuY3Rpb24gY215azJoc2woYXJncykge1xuICByZXR1cm4gcmdiMmhzbChjbXlrMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsyaHN2KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc3YoY215azJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBjbXlrMmtleXdvcmQoYXJncykge1xuICByZXR1cm4gcmdiMmtleXdvcmQoY215azJyZ2IoYXJncykpO1xufVxuXG5cbmZ1bmN0aW9uIHh5ejJyZ2IoeHl6KSB7XG4gIHZhciB4ID0geHl6WzBdIC8gMTAwLFxuICAgICAgeSA9IHh5elsxXSAvIDEwMCxcbiAgICAgIHogPSB4eXpbMl0gLyAxMDAsXG4gICAgICByLCBnLCBiO1xuXG4gIHIgPSAoeCAqIDMuMjQwNikgKyAoeSAqIC0xLjUzNzIpICsgKHogKiAtMC40OTg2KTtcbiAgZyA9ICh4ICogLTAuOTY4OSkgKyAoeSAqIDEuODc1OCkgKyAoeiAqIDAuMDQxNSk7XG4gIGIgPSAoeCAqIDAuMDU1NykgKyAoeSAqIC0wLjIwNDApICsgKHogKiAxLjA1NzApO1xuXG4gIC8vIGFzc3VtZSBzUkdCXG4gIHIgPSByID4gMC4wMDMxMzA4ID8gKCgxLjA1NSAqIE1hdGgucG93KHIsIDEuMCAvIDIuNCkpIC0gMC4wNTUpXG4gICAgOiByID0gKHIgKiAxMi45Mik7XG5cbiAgZyA9IGcgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3coZywgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IGcgPSAoZyAqIDEyLjkyKTtcbiAgICAgICAgXG4gIGIgPSBiID4gMC4wMDMxMzA4ID8gKCgxLjA1NSAqIE1hdGgucG93KGIsIDEuMCAvIDIuNCkpIC0gMC4wNTUpXG4gICAgOiBiID0gKGIgKiAxMi45Mik7XG5cbiAgciA9IChyIDwgMCkgPyAwIDogcjtcbiAgZyA9IChnIDwgMCkgPyAwIDogZztcbiAgYiA9IChiIDwgMCkgPyAwIDogYjtcblxuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufVxuXG5mdW5jdGlvbiB4eXoybGFiKHh5eikge1xuICB2YXIgeCA9IHh5elswXSxcbiAgICAgIHkgPSB4eXpbMV0sXG4gICAgICB6ID0geHl6WzJdLFxuICAgICAgbCwgYSwgYjtcblxuICB4IC89IDk1LjA0NztcbiAgeSAvPSAxMDA7XG4gIHogLz0gMTA4Ljg4MztcblxuICB4ID0geCA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeCwgMS8zKSA6ICg3Ljc4NyAqIHgpICsgKDE2IC8gMTE2KTtcbiAgeSA9IHkgPiAwLjAwODg1NiA/IE1hdGgucG93KHksIDEvMykgOiAoNy43ODcgKiB5KSArICgxNiAvIDExNik7XG4gIHogPSB6ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh6LCAxLzMpIDogKDcuNzg3ICogeikgKyAoMTYgLyAxMTYpO1xuXG4gIGwgPSAoMTE2ICogeSkgLSAxNjtcbiAgYSA9IDUwMCAqICh4IC0geSk7XG4gIGIgPSAyMDAgKiAoeSAtIHopO1xuICBcbiAgcmV0dXJuIFtsLCBhLCBiXTtcbn1cblxuZnVuY3Rpb24gbGFiMnh5eihsYWIpIHtcbiAgdmFyIGwgPSBsYWJbMF0sXG4gICAgICBhID0gbGFiWzFdLFxuICAgICAgYiA9IGxhYlsyXSxcbiAgICAgIHgsIHksIHosIHkyO1xuXG4gIGlmIChsIDw9IDgpIHtcbiAgICB5ID0gKGwgKiAxMDApIC8gOTAzLjM7XG4gICAgeTIgPSAoNy43ODcgKiAoeSAvIDEwMCkpICsgKDE2IC8gMTE2KTtcbiAgfSBlbHNlIHtcbiAgICB5ID0gMTAwICogTWF0aC5wb3coKGwgKyAxNikgLyAxMTYsIDMpO1xuICAgIHkyID0gTWF0aC5wb3coeSAvIDEwMCwgMS8zKTtcbiAgfVxuXG4gIHggPSB4IC8gOTUuMDQ3IDw9IDAuMDA4ODU2ID8geCA9ICg5NS4wNDcgKiAoKGEgLyA1MDApICsgeTIgLSAoMTYgLyAxMTYpKSkgLyA3Ljc4NyA6IDk1LjA0NyAqIE1hdGgucG93KChhIC8gNTAwKSArIHkyLCAzKTtcblxuICB6ID0geiAvIDEwOC44ODMgPD0gMC4wMDg4NTkgPyB6ID0gKDEwOC44ODMgKiAoeTIgLSAoYiAvIDIwMCkgLSAoMTYgLyAxMTYpKSkgLyA3Ljc4NyA6IDEwOC44ODMgKiBNYXRoLnBvdyh5MiAtIChiIC8gMjAwKSwgMyk7XG5cbiAgcmV0dXJuIFt4LCB5LCB6XTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJyZ2Ioa2V5d29yZCkge1xuICByZXR1cm4gY3NzS2V5d29yZHNba2V5d29yZF07XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyaHNsKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc2woa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmhzdihhcmdzKSB7XG4gIHJldHVybiByZ2IyaHN2KGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJjbXlrKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJjbXlrKGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJsYWIoYXJncykge1xuICByZXR1cm4gcmdiMmxhYihrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyeHl6KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJ4eXooa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG52YXIgY3NzS2V5d29yZHMgPSB7XG4gIGFsaWNlYmx1ZTogIFsyNDAsMjQ4LDI1NV0sXG4gIGFudGlxdWV3aGl0ZTogWzI1MCwyMzUsMjE1XSxcbiAgYXF1YTogWzAsMjU1LDI1NV0sXG4gIGFxdWFtYXJpbmU6IFsxMjcsMjU1LDIxMl0sXG4gIGF6dXJlOiAgWzI0MCwyNTUsMjU1XSxcbiAgYmVpZ2U6ICBbMjQ1LDI0NSwyMjBdLFxuICBiaXNxdWU6IFsyNTUsMjI4LDE5Nl0sXG4gIGJsYWNrOiAgWzAsMCwwXSxcbiAgYmxhbmNoZWRhbG1vbmQ6IFsyNTUsMjM1LDIwNV0sXG4gIGJsdWU6IFswLDAsMjU1XSxcbiAgYmx1ZXZpb2xldDogWzEzOCw0MywyMjZdLFxuICBicm93bjogIFsxNjUsNDIsNDJdLFxuICBidXJseXdvb2Q6ICBbMjIyLDE4NCwxMzVdLFxuICBjYWRldGJsdWU6ICBbOTUsMTU4LDE2MF0sXG4gIGNoYXJ0cmV1c2U6IFsxMjcsMjU1LDBdLFxuICBjaG9jb2xhdGU6ICBbMjEwLDEwNSwzMF0sXG4gIGNvcmFsOiAgWzI1NSwxMjcsODBdLFxuICBjb3JuZmxvd2VyYmx1ZTogWzEwMCwxNDksMjM3XSxcbiAgY29ybnNpbGs6IFsyNTUsMjQ4LDIyMF0sXG4gIGNyaW1zb246ICBbMjIwLDIwLDYwXSxcbiAgY3lhbjogWzAsMjU1LDI1NV0sXG4gIGRhcmtibHVlOiBbMCwwLDEzOV0sXG4gIGRhcmtjeWFuOiBbMCwxMzksMTM5XSxcbiAgZGFya2dvbGRlbnJvZDogIFsxODQsMTM0LDExXSxcbiAgZGFya2dyYXk6IFsxNjksMTY5LDE2OV0sXG4gIGRhcmtncmVlbjogIFswLDEwMCwwXSxcbiAgZGFya2dyZXk6IFsxNjksMTY5LDE2OV0sXG4gIGRhcmtraGFraTogIFsxODksMTgzLDEwN10sXG4gIGRhcmttYWdlbnRhOiAgWzEzOSwwLDEzOV0sXG4gIGRhcmtvbGl2ZWdyZWVuOiBbODUsMTA3LDQ3XSxcbiAgZGFya29yYW5nZTogWzI1NSwxNDAsMF0sXG4gIGRhcmtvcmNoaWQ6IFsxNTMsNTAsMjA0XSxcbiAgZGFya3JlZDogIFsxMzksMCwwXSxcbiAgZGFya3NhbG1vbjogWzIzMywxNTAsMTIyXSxcbiAgZGFya3NlYWdyZWVuOiBbMTQzLDE4OCwxNDNdLFxuICBkYXJrc2xhdGVibHVlOiAgWzcyLDYxLDEzOV0sXG4gIGRhcmtzbGF0ZWdyYXk6ICBbNDcsNzksNzldLFxuICBkYXJrc2xhdGVncmV5OiAgWzQ3LDc5LDc5XSxcbiAgZGFya3R1cnF1b2lzZTogIFswLDIwNiwyMDldLFxuICBkYXJrdmlvbGV0OiBbMTQ4LDAsMjExXSxcbiAgZGVlcHBpbms6IFsyNTUsMjAsMTQ3XSxcbiAgZGVlcHNreWJsdWU6ICBbMCwxOTEsMjU1XSxcbiAgZGltZ3JheTogIFsxMDUsMTA1LDEwNV0sXG4gIGRpbWdyZXk6ICBbMTA1LDEwNSwxMDVdLFxuICBkb2RnZXJibHVlOiBbMzAsMTQ0LDI1NV0sXG4gIGZpcmVicmljazogIFsxNzgsMzQsMzRdLFxuICBmbG9yYWx3aGl0ZTogIFsyNTUsMjUwLDI0MF0sXG4gIGZvcmVzdGdyZWVuOiAgWzM0LDEzOSwzNF0sXG4gIGZ1Y2hzaWE6ICBbMjU1LDAsMjU1XSxcbiAgZ2FpbnNib3JvOiAgWzIyMCwyMjAsMjIwXSxcbiAgZ2hvc3R3aGl0ZTogWzI0OCwyNDgsMjU1XSxcbiAgZ29sZDogWzI1NSwyMTUsMF0sXG4gIGdvbGRlbnJvZDogIFsyMTgsMTY1LDMyXSxcbiAgZ3JheTogWzEyOCwxMjgsMTI4XSxcbiAgZ3JlZW46ICBbMCwxMjgsMF0sXG4gIGdyZWVueWVsbG93OiAgWzE3MywyNTUsNDddLFxuICBncmV5OiBbMTI4LDEyOCwxMjhdLFxuICBob25leWRldzogWzI0MCwyNTUsMjQwXSxcbiAgaG90cGluazogIFsyNTUsMTA1LDE4MF0sXG4gIGluZGlhbnJlZDogIFsyMDUsOTIsOTJdLFxuICBpbmRpZ286IFs3NSwwLDEzMF0sXG4gIGl2b3J5OiAgWzI1NSwyNTUsMjQwXSxcbiAga2hha2k6ICBbMjQwLDIzMCwxNDBdLFxuICBsYXZlbmRlcjogWzIzMCwyMzAsMjUwXSxcbiAgbGF2ZW5kZXJibHVzaDogIFsyNTUsMjQwLDI0NV0sXG4gIGxhd25ncmVlbjogIFsxMjQsMjUyLDBdLFxuICBsZW1vbmNoaWZmb246IFsyNTUsMjUwLDIwNV0sXG4gIGxpZ2h0Ymx1ZTogIFsxNzMsMjE2LDIzMF0sXG4gIGxpZ2h0Y29yYWw6IFsyNDAsMTI4LDEyOF0sXG4gIGxpZ2h0Y3lhbjogIFsyMjQsMjU1LDI1NV0sXG4gIGxpZ2h0Z29sZGVucm9keWVsbG93OiBbMjUwLDI1MCwyMTBdLFxuICBsaWdodGdyYXk6ICBbMjExLDIxMSwyMTFdLFxuICBsaWdodGdyZWVuOiBbMTQ0LDIzOCwxNDRdLFxuICBsaWdodGdyZXk6ICBbMjExLDIxMSwyMTFdLFxuICBsaWdodHBpbms6ICBbMjU1LDE4MiwxOTNdLFxuICBsaWdodHNhbG1vbjogIFsyNTUsMTYwLDEyMl0sXG4gIGxpZ2h0c2VhZ3JlZW46ICBbMzIsMTc4LDE3MF0sXG4gIGxpZ2h0c2t5Ymx1ZTogWzEzNSwyMDYsMjUwXSxcbiAgbGlnaHRzbGF0ZWdyYXk6IFsxMTksMTM2LDE1M10sXG4gIGxpZ2h0c2xhdGVncmV5OiBbMTE5LDEzNiwxNTNdLFxuICBsaWdodHN0ZWVsYmx1ZTogWzE3NiwxOTYsMjIyXSxcbiAgbGlnaHR5ZWxsb3c6ICBbMjU1LDI1NSwyMjRdLFxuICBsaW1lOiBbMCwyNTUsMF0sXG4gIGxpbWVncmVlbjogIFs1MCwyMDUsNTBdLFxuICBsaW5lbjogIFsyNTAsMjQwLDIzMF0sXG4gIG1hZ2VudGE6ICBbMjU1LDAsMjU1XSxcbiAgbWFyb29uOiBbMTI4LDAsMF0sXG4gIG1lZGl1bWFxdWFtYXJpbmU6IFsxMDIsMjA1LDE3MF0sXG4gIG1lZGl1bWJsdWU6IFswLDAsMjA1XSxcbiAgbWVkaXVtb3JjaGlkOiBbMTg2LDg1LDIxMV0sXG4gIG1lZGl1bXB1cnBsZTogWzE0NywxMTIsMjE5XSxcbiAgbWVkaXVtc2VhZ3JlZW46IFs2MCwxNzksMTEzXSxcbiAgbWVkaXVtc2xhdGVibHVlOiAgWzEyMywxMDQsMjM4XSxcbiAgbWVkaXVtc3ByaW5nZ3JlZW46ICBbMCwyNTAsMTU0XSxcbiAgbWVkaXVtdHVycXVvaXNlOiAgWzcyLDIwOSwyMDRdLFxuICBtZWRpdW12aW9sZXRyZWQ6ICBbMTk5LDIxLDEzM10sXG4gIG1pZG5pZ2h0Ymx1ZTogWzI1LDI1LDExMl0sXG4gIG1pbnRjcmVhbTogIFsyNDUsMjU1LDI1MF0sXG4gIG1pc3R5cm9zZTogIFsyNTUsMjI4LDIyNV0sXG4gIG1vY2Nhc2luOiBbMjU1LDIyOCwxODFdLFxuICBuYXZham93aGl0ZTogIFsyNTUsMjIyLDE3M10sXG4gIG5hdnk6IFswLDAsMTI4XSxcbiAgb2xkbGFjZTogIFsyNTMsMjQ1LDIzMF0sXG4gIG9saXZlOiAgWzEyOCwxMjgsMF0sXG4gIG9saXZlZHJhYjogIFsxMDcsMTQyLDM1XSxcbiAgb3JhbmdlOiBbMjU1LDE2NSwwXSxcbiAgb3JhbmdlcmVkOiAgWzI1NSw2OSwwXSxcbiAgb3JjaGlkOiBbMjE4LDExMiwyMTRdLFxuICBwYWxlZ29sZGVucm9kOiAgWzIzOCwyMzIsMTcwXSxcbiAgcGFsZWdyZWVuOiAgWzE1MiwyNTEsMTUyXSxcbiAgcGFsZXR1cnF1b2lzZTogIFsxNzUsMjM4LDIzOF0sXG4gIHBhbGV2aW9sZXRyZWQ6ICBbMjE5LDExMiwxNDddLFxuICBwYXBheWF3aGlwOiBbMjU1LDIzOSwyMTNdLFxuICBwZWFjaHB1ZmY6ICBbMjU1LDIxOCwxODVdLFxuICBwZXJ1OiBbMjA1LDEzMyw2M10sXG4gIHBpbms6IFsyNTUsMTkyLDIwM10sXG4gIHBsdW06IFsyMjEsMTYwLDIyMV0sXG4gIHBvd2RlcmJsdWU6IFsxNzYsMjI0LDIzMF0sXG4gIHB1cnBsZTogWzEyOCwwLDEyOF0sXG4gIHJlZDogIFsyNTUsMCwwXSxcbiAgcm9zeWJyb3duOiAgWzE4OCwxNDMsMTQzXSxcbiAgcm95YWxibHVlOiAgWzY1LDEwNSwyMjVdLFxuICBzYWRkbGVicm93bjogIFsxMzksNjksMTldLFxuICBzYWxtb246IFsyNTAsMTI4LDExNF0sXG4gIHNhbmR5YnJvd246IFsyNDQsMTY0LDk2XSxcbiAgc2VhZ3JlZW46IFs0NiwxMzksODddLFxuICBzZWFzaGVsbDogWzI1NSwyNDUsMjM4XSxcbiAgc2llbm5hOiBbMTYwLDgyLDQ1XSxcbiAgc2lsdmVyOiBbMTkyLDE5MiwxOTJdLFxuICBza3libHVlOiAgWzEzNSwyMDYsMjM1XSxcbiAgc2xhdGVibHVlOiAgWzEwNiw5MCwyMDVdLFxuICBzbGF0ZWdyYXk6ICBbMTEyLDEyOCwxNDRdLFxuICBzbGF0ZWdyZXk6ICBbMTEyLDEyOCwxNDRdLFxuICBzbm93OiBbMjU1LDI1MCwyNTBdLFxuICBzcHJpbmdncmVlbjogIFswLDI1NSwxMjddLFxuICBzdGVlbGJsdWU6ICBbNzAsMTMwLDE4MF0sXG4gIHRhbjogIFsyMTAsMTgwLDE0MF0sXG4gIHRlYWw6IFswLDEyOCwxMjhdLFxuICB0aGlzdGxlOiAgWzIxNiwxOTEsMjE2XSxcbiAgdG9tYXRvOiBbMjU1LDk5LDcxXSxcbiAgdHVycXVvaXNlOiAgWzY0LDIyNCwyMDhdLFxuICB2aW9sZXQ6IFsyMzgsMTMwLDIzOF0sXG4gIHdoZWF0OiAgWzI0NSwyMjIsMTc5XSxcbiAgd2hpdGU6ICBbMjU1LDI1NSwyNTVdLFxuICB3aGl0ZXNtb2tlOiBbMjQ1LDI0NSwyNDVdLFxuICB5ZWxsb3c6IFsyNTUsMjU1LDBdLFxuICB5ZWxsb3dncmVlbjogIFsxNTQsMjA1LDUwXVxufTtcblxudmFyIHJldmVyc2VLZXl3b3JkcyA9IHt9O1xuZm9yICh2YXIga2V5IGluIGNzc0tleXdvcmRzKSB7XG4gIHJldmVyc2VLZXl3b3Jkc1tKU09OLnN0cmluZ2lmeShjc3NLZXl3b3Jkc1trZXldKV0gPSBrZXk7XG59XG4iLCJ2YXIgY29udmVyc2lvbnMgPSByZXF1aXJlKFwiLi9jb252ZXJzaW9uc1wiKTtcblxudmFyIGNvbnZlcnQgPSBmdW5jdGlvbigpIHtcbiAgIHJldHVybiBuZXcgQ29udmVydGVyKCk7XG59XG5cbmZvciAodmFyIGZ1bmMgaW4gY29udmVyc2lvbnMpIHtcbiAgLy8gZXhwb3J0IFJhdyB2ZXJzaW9uc1xuICBjb252ZXJ0W2Z1bmMgKyBcIlJhd1wiXSA9ICAoZnVuY3Rpb24oZnVuYykge1xuICAgIC8vIGFjY2VwdCBhcnJheSBvciBwbGFpbiBhcmdzXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT0gXCJudW1iZXJcIilcbiAgICAgICAgYXJnID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBjb252ZXJzaW9uc1tmdW5jXShhcmcpO1xuICAgIH1cbiAgfSkoZnVuYyk7XG5cbiAgdmFyIHBhaXIgPSAvKFxcdyspMihcXHcrKS8uZXhlYyhmdW5jKSxcbiAgICAgIGZyb20gPSBwYWlyWzFdLFxuICAgICAgdG8gPSBwYWlyWzJdO1xuXG4gIC8vIGV4cG9ydCByZ2IyaHNsIGFuZCBbXCJyZ2JcIl1bXCJoc2xcIl1cbiAgY29udmVydFtmcm9tXSA9IGNvbnZlcnRbZnJvbV0gfHwge307XG5cbiAgY29udmVydFtmcm9tXVt0b10gPSBjb252ZXJ0W2Z1bmNdID0gKGZ1bmN0aW9uKGZ1bmMpIHsgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT0gXCJudW1iZXJcIilcbiAgICAgICAgYXJnID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIFxuICAgICAgdmFyIHZhbCA9IGNvbnZlcnNpb25zW2Z1bmNdKGFyZyk7XG4gICAgICBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiIHx8IHZhbCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdmFsOyAvLyBrZXl3b3JkXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKVxuICAgICAgICB2YWxbaV0gPSBNYXRoLnJvdW5kKHZhbFtpXSk7XG4gICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgfSkoZnVuYyk7XG59XG5cblxuLyogQ29udmVydGVyIGRvZXMgbGF6eSBjb252ZXJzaW9uIGFuZCBjYWNoaW5nICovXG52YXIgQ29udmVydGVyID0gZnVuY3Rpb24oKSB7XG4gICB0aGlzLmNvbnZzID0ge307XG59O1xuXG4vKiBFaXRoZXIgZ2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2Ugb3JcbiAgc2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2UsIGRlcGVuZGluZyBvbiBhcmdzICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLnJvdXRlU3BhY2UgPSBmdW5jdGlvbihzcGFjZSwgYXJncykge1xuICAgdmFyIHZhbHVlcyA9IGFyZ3NbMF07XG4gICBpZiAodmFsdWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGNvbG9yLnJnYigpXG4gICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZXMoc3BhY2UpO1xuICAgfVxuICAgLy8gY29sb3IucmdiKDEwLCAxMCwgMTApXG4gICBpZiAodHlwZW9mIHZhbHVlcyA9PSBcIm51bWJlclwiKSB7XG4gICAgICB2YWx1ZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKTsgICAgICAgIFxuICAgfVxuXG4gICByZXR1cm4gdGhpcy5zZXRWYWx1ZXMoc3BhY2UsIHZhbHVlcyk7XG59O1xuICBcbi8qIFNldCB0aGUgdmFsdWVzIGZvciBhIHNwYWNlLCBpbnZhbGlkYXRpbmcgY2FjaGUgKi9cbkNvbnZlcnRlci5wcm90b3R5cGUuc2V0VmFsdWVzID0gZnVuY3Rpb24oc3BhY2UsIHZhbHVlcykge1xuICAgdGhpcy5zcGFjZSA9IHNwYWNlO1xuICAgdGhpcy5jb252cyA9IHt9O1xuICAgdGhpcy5jb252c1tzcGFjZV0gPSB2YWx1ZXM7XG4gICByZXR1cm4gdGhpcztcbn07XG5cbi8qIEdldCB0aGUgdmFsdWVzIGZvciBhIHNwYWNlLiBJZiB0aGVyZSdzIGFscmVhZHlcbiAgYSBjb252ZXJzaW9uIGZvciB0aGUgc3BhY2UsIGZldGNoIGl0LCBvdGhlcndpc2VcbiAgY29tcHV0ZSBpdCAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5nZXRWYWx1ZXMgPSBmdW5jdGlvbihzcGFjZSkge1xuICAgdmFyIHZhbHMgPSB0aGlzLmNvbnZzW3NwYWNlXTtcbiAgIGlmICghdmFscykge1xuICAgICAgdmFyIGZzcGFjZSA9IHRoaXMuc3BhY2UsXG4gICAgICAgICAgZnJvbSA9IHRoaXMuY29udnNbZnNwYWNlXTtcbiAgICAgIHZhbHMgPSBjb252ZXJ0W2ZzcGFjZV1bc3BhY2VdKGZyb20pO1xuXG4gICAgICB0aGlzLmNvbnZzW3NwYWNlXSA9IHZhbHM7XG4gICB9XG4gIHJldHVybiB2YWxzO1xufTtcblxuW1wicmdiXCIsIFwiaHNsXCIsIFwiaHN2XCIsIFwiY215a1wiLCBcImtleXdvcmRcIl0uZm9yRWFjaChmdW5jdGlvbihzcGFjZSkge1xuICAgQ29udmVydGVyLnByb3RvdHlwZVtzcGFjZV0gPSBmdW5jdGlvbih2YWxzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yb3V0ZVNwYWNlKHNwYWNlLCBhcmd1bWVudHMpO1xuICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gY29udmVydDsiLCIvKiFcclxuICogQG5hbWUgSmF2YVNjcmlwdC9Ob2RlSlMgTWVyZ2UgdjEuMS4yXHJcbiAqIEBhdXRob3IgeWVpa29zXHJcbiAqIEByZXBvc2l0b3J5IGh0dHBzOi8vZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2VcclxuXHJcbiAqIENvcHlyaWdodCAyMDEzIHllaWtvcyAtIE1JVCBsaWNlbnNlXHJcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlL21hc3Rlci9MSUNFTlNFXHJcbiAqL1xyXG5cclxuOyhmdW5jdGlvbihpc05vZGUpIHtcclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2UoKSB7XHJcblxyXG5cdFx0dmFyIGl0ZW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuXHRcdFx0cmVzdWx0ID0gaXRlbXMuc2hpZnQoKSxcclxuXHRcdFx0ZGVlcCA9IChyZXN1bHQgPT09IHRydWUpLFxyXG5cdFx0XHRzaXplID0gaXRlbXMubGVuZ3RoLFxyXG5cdFx0XHRpdGVtLCBpbmRleCwga2V5O1xyXG5cclxuXHRcdGlmIChkZWVwIHx8IHR5cGVPZihyZXN1bHQpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJlc3VsdCA9IHt9O1xyXG5cclxuXHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRpZiAodHlwZU9mKGl0ZW0gPSBpdGVtc1tpbmRleF0pID09PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdFx0Zm9yIChrZXkgaW4gaXRlbSlcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IGRlZXAgPyBjbG9uZShpdGVtW2tleV0pIDogaXRlbVtrZXldO1xyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xvbmUoaW5wdXQpIHtcclxuXHJcblx0XHR2YXIgb3V0cHV0ID0gaW5wdXQsXHJcblx0XHRcdHR5cGUgPSB0eXBlT2YoaW5wdXQpLFxyXG5cdFx0XHRpbmRleCwgc2l6ZTtcclxuXHJcblx0XHRpZiAodHlwZSA9PT0gJ2FycmF5Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0gW107XHJcblx0XHRcdHNpemUgPSBpbnB1dC5sZW5ndGg7XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSB7fTtcclxuXHJcblx0XHRcdGZvciAoaW5kZXggaW4gaW5wdXQpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBjbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHR5cGVPZihpbnB1dCkge1xyXG5cclxuXHRcdHJldHVybiAoe30pLnRvU3RyaW5nLmNhbGwoaW5wdXQpLm1hdGNoKC9cXHMoW1xcd10rKS8pWzFdLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdH1cclxuXHJcblx0aWYgKGlzTm9kZSkge1xyXG5cclxuXHRcdG1vZHVsZS5leHBvcnRzID0gbWVyZ2U7XHJcblxyXG5cdH0gZWxzZSB7XHJcblxyXG5cdFx0d2luZG93Lm1lcmdlID0gbWVyZ2U7XHJcblxyXG5cdH1cclxuXHJcbn0pKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47KGZ1bmN0aW9uIChjb21tb25qcykge1xuICBmdW5jdGlvbiBlcnJvck9iamVjdChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQ2FsbHNGcm9tT3duZXIoZnVuY3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTGV0IHRoZSBvdGhlciBzaWRlIGtub3cgYWJvdXQgb3VyIGZ1bmN0aW9ucyBpZiB0aGV5IGNhbid0IHVzZSBQcm94eS5cbiAgICAgIHZhciBuYW1lcyA9IFtdO1xuICAgICAgZm9yICh2YXIgbmFtZSBpbiBmdW5jdGlvbnMpIG5hbWVzLnB1c2gobmFtZSk7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKHtmdW5jdGlvbk5hbWVzOiBuYW1lc30pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGlkKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9KTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2suZGlzYWJsZUF1dG8gPSBmdW5jdGlvbiAoKSB7IGNhbGxiYWNrLl9hdXRvRGlzYWJsZWQgPSB0cnVlOyB9O1xuXG4gICAgICBjYWxsYmFjay50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9LCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrO1xuICAgIH1cblxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbCkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsSWQ7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLlxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnNbbWVzc2FnZS5jYWxsXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsbFJlc3BvbnNlOiBjYWxsSWQsXG4gICAgICAgICAgICBhcmd1bWVudHM6IFtlcnJvck9iamVjdChuZXcgRXJyb3IoJ1RoYXQgZnVuY3Rpb24gZG9lcyBub3QgZXhpc3QnKSldXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBtZXNzYWdlLmFyZ3VtZW50cyB8fCBbXTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY3JlYXRlQ2FsbGJhY2soY2FsbElkKTtcbiAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgICAgIGlmIChvcHRpb25zLmNhdGNoRXJyb3JzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvck9iamVjdChlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBvcHRpb24gZm9yIGl0IGlzIGVuYWJsZWQsIGF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2suXG4gICAgICAgIGlmIChvcHRpb25zLmF1dG9DYWxsYmFjayAmJiAhY2FsbGJhY2suX2F1dG9EaXNhYmxlZCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldHVyblZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vycywgb3B0aW9ucykge1xuICAgIHZhciBjYWNoZSA9IHt9LFxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcbiAgICAgICAgdGltZXJzLFxuICAgICAgICBuZXh0Q2FsbElkID0gMSxcbiAgICAgICAgZmFrZVByb3h5LFxuICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGFycmF5IG9mIG51bWJlciBvZiBwZW5kaW5nIHRhc2tzIGZvciBlYWNoIHdvcmtlci5cbiAgICB2YXIgcGVuZGluZyA9IHdvcmtlcnMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDA7IH0pO1xuXG4gICAgLy8gRWFjaCBpbmRpdmlkdWFsIGNhbGwgZ2V0cyBhIHRpbWVyIGlmIHRpbWluZyBjYWxscy5cbiAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHRpbWVycyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBQcm94eSBzdXBwb3J0LCB3ZSBoYXZlIHRvIHByZS1kZWZpbmUgYWxsIHRoZSBmdW5jdGlvbnMuXG4gICAgICBmYWtlUHJveHkgPSB7cGVuZGluZ0NhbGxzOiAwfTtcbiAgICAgIG9wdGlvbnMuZnVuY3Rpb25OYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROdW1QZW5kaW5nQ2FsbHMoKSB7XG4gICAgICByZXR1cm4gcXVldWUubGVuZ3RoICsgcGVuZGluZy5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKF8sIG5hbWUpIHtcbiAgICAgIGlmIChuYW1lID09ICdwZW5kaW5nQ2FsbHMnKSByZXR1cm4gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXTtcblxuICAgICAgdmFyIGZuID0gY2FjaGVbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MpO1xuICAgICAgfTtcblxuICAgICAgLy8gU2VuZHMgdGhlIHNhbWUgY2FsbCB0byBhbGwgd29ya2Vycy5cbiAgICAgIGZuLmJyb2FkY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzZW5kQ2FsbChpLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBNYXJrcyB0aGUgb2JqZWN0cyBpbiB0aGUgZmlyc3QgYXJndW1lbnQgKGFycmF5KSBhcyB0cmFuc2ZlcmFibGUuXG4gICAgICBmbi50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncywgdHJhbnNmZXJMaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlKCkge1xuICAgICAgLy8gS2VlcCB0aGUgZmFrZSBwcm94eSBwZW5kaW5nIGNvdW50IHVwLXRvLWRhdGUuXG4gICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG5cbiAgICAgIGlmICghcXVldWUubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGVuZGluZ1tpXSkgY29udGludWU7XG5cbiAgICAgICAgLy8gQSB3b3JrZXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICB2YXIgcGFyYW1zID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgc2VuZENhbGwoaSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSk7XG5cbiAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUNhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgcXVldWUucHVzaChbbmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdF0pO1xuICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRDYWxsKHdvcmtlckluZGV4LCBuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICAvLyBHZXQgdGhlIHdvcmtlciBhbmQgaW5kaWNhdGUgdGhhdCBpdCBoYXMgYSBwZW5kaW5nIHRhc2suXG4gICAgICBwZW5kaW5nW3dvcmtlckluZGV4XSsrO1xuICAgICAgdmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySW5kZXhdO1xuXG4gICAgICB2YXIgaWQgPSBuZXh0Q2FsbElkKys7XG5cbiAgICAgIC8vIElmIHRoZSBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGFzc3VtZSBpdCdzIHRoZSBjYWxsYmFjay5cbiAgICAgIHZhciBtYXliZUNiID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHR5cGVvZiBtYXliZUNiID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2tzW2lkXSA9IG1heWJlQ2I7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgc3BlY2lmaWVkLCB0aW1lIGNhbGxzIHVzaW5nIHRoZSBjb25zb2xlLnRpbWUgaW50ZXJmYWNlLlxuICAgICAgaWYgKG9wdGlvbnMudGltZUNhbGxzKSB7XG4gICAgICAgIHZhciB0aW1lcklkID0gbmFtZSArICcoJyArIGFyZ3Muam9pbignLCAnKSArICcpJztcbiAgICAgICAgdGltZXJzW2lkXSA9IHRpbWVySWQ7XG4gICAgICAgIGNvbnNvbGUudGltZSh0aW1lcklkKTtcbiAgICAgIH1cblxuICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtjYWxsSWQ6IGlkLCBjYWxsOiBuYW1lLCBhcmd1bWVudHM6IGFyZ3N9LCBvcHRfdHJhbnNmZXJMaXN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcihlKSB7XG4gICAgICB2YXIgd29ya2VySW5kZXggPSB3b3JrZXJzLmluZGV4T2YodGhpcyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbFJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxSZXNwb25zZTtcblxuICAgICAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayByZWdpc3RlcmVkIGZvciB0aGlzIGNhbGwgKGlmIGFueSkuXG4gICAgICAgIGlmIChjYWxsYmFja3NbY2FsbElkXSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tjYWxsSWRdLmFwcGx5KG51bGwsIG1lc3NhZ2UuYXJndW1lbnRzKTtcbiAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxJZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBvcnQgdGltaW5nLCBpZiB0aGF0IG9wdGlvbiBpcyBlbmFibGVkLlxuICAgICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMgJiYgdGltZXJzW2NhbGxJZF0pIHtcbiAgICAgICAgICBjb25zb2xlLnRpbWVFbmQodGltZXJzW2NhbGxJZF0pO1xuICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyB0YXNrIGlzIG5vIGxvbmdlciBwZW5kaW5nIG9uIHRoZSB3b3JrZXIuXG4gICAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdLS07XG4gICAgICAgIGZsdXNoUXVldWUoKTtcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5mdW5jdGlvbk5hbWVzKSB7XG4gICAgICAgIC8vIFJlY2VpdmVkIGEgbGlzdCBvZiBhdmFpbGFibGUgZnVuY3Rpb25zLiBPbmx5IHVzZWZ1bCBmb3IgZmFrZSBwcm94eS5cbiAgICAgICAgbWVzc2FnZS5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICBmYWtlUHJveHlbbmFtZV0gPSBnZXRIYW5kbGVyKG51bGwsIG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gbWVzc2FnZXMgZnJvbSBhbGwgdGhlIHdvcmtlcnMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3b3JrZXJzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZha2VQcm94eTtcbiAgICB9IGVsc2UgaWYgKFByb3h5LmNyZWF0ZSkge1xuICAgICAgcmV0dXJuIFByb3h5LmNyZWF0ZSh7Z2V0OiBnZXRIYW5kbGVyfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoe30sIHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggZWl0aGVyIGEgV29ya2VyIGluc3RhbmNlLCBhIGxpc3Qgb2YgdGhlbSwgb3IgYSBtYXBcbiAgICogb2YgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCBpbnNpZGUgdGhlIHdvcmtlci5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZVdvcmtlclByb3h5KHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0X29wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2sgYWZ0ZXIgYSBjYWxsIGlmIHRoZSByZXR1cm4gdmFsdWUgaXMgbm90XG4gICAgICAvLyB1bmRlZmluZWQuXG4gICAgICBhdXRvQ2FsbGJhY2s6IGZhbHNlLFxuICAgICAgLy8gQ2F0Y2ggZXJyb3JzIGFuZCBhdXRvbWF0aWNhbGx5IHJlc3BvbmQgd2l0aCBhbiBlcnJvciBjYWxsYmFjay4gT2ZmIGJ5XG4gICAgICAvLyBkZWZhdWx0IHNpbmNlIGl0IGJyZWFrcyBzdGFuZGFyZCBiZWhhdmlvci5cbiAgICAgIGNhdGNoRXJyb3JzOiBmYWxzZSxcbiAgICAgIC8vIEEgbGlzdCBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkLiBUaGlzIGxpc3Qgd2lsbCBiZSB1c2VkIHRvIG1ha2VcbiAgICAgIC8vIHRoZSBwcm94eSBmdW5jdGlvbnMgYXZhaWxhYmxlIHdoZW4gUHJveHkgaXMgbm90IHN1cHBvcnRlZC4gTm90ZSB0aGF0XG4gICAgICAvLyB0aGlzIGlzIGdlbmVyYWxseSBub3QgbmVlZGVkIHNpbmNlIHRoZSB3b3JrZXIgd2lsbCBhbHNvIHB1Ymxpc2ggaXRzXG4gICAgICAvLyBrbm93biBmdW5jdGlvbnMuXG4gICAgICBmdW5jdGlvbk5hbWVzOiBbXSxcbiAgICAgIC8vIENhbGwgY29uc29sZS50aW1lIGFuZCBjb25zb2xlLnRpbWVFbmQgZm9yIGNhbGxzIHNlbnQgdGhvdWdoIHRoZSBwcm94eS5cbiAgICAgIHRpbWVDYWxsczogZmFsc2VcbiAgICB9O1xuXG4gICAgaWYgKG9wdF9vcHRpb25zKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb3B0X29wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG9wdGlvbnMpKSBjb250aW51ZTtcbiAgICAgICAgb3B0aW9uc1trZXldID0gb3B0X29wdGlvbnNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYW4gYXJyYXkgb2Ygd29ya2VycyAoZXZlbiBpZiBvbmx5IHVzaW5nIG9uZSB3b3JrZXIpLlxuICAgIGlmICh0eXBlb2YgV29ya2VyICE9ICd1bmRlZmluZWQnICYmICh3b3JrZXJzT3JGdW5jdGlvbnMgaW5zdGFuY2VvZiBXb3JrZXIpKSB7XG4gICAgICB3b3JrZXJzT3JGdW5jdGlvbnMgPSBbd29ya2Vyc09yRnVuY3Rpb25zXTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3b3JrZXJzT3JGdW5jdGlvbnMpKSB7XG4gICAgICByZXR1cm4gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjZWl2ZUNhbGxzRnJvbU93bmVyKHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbW1vbmpzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcGU7XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gZ2xvYmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSB3aW5kb3c7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBzZWxmO1xuICAgIH1cblxuICAgIHNjb3BlLmNyZWF0ZVdvcmtlclByb3h5ID0gY3JlYXRlV29ya2VyUHJveHk7XG4gIH1cbn0pKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImV4cG9ydHMuV29ybGQgPSByZXF1aXJlKCcuL2xpYi93b3JsZCcpO1xuZXhwb3J0cy5Xb3JsZE1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi93b3JsZG1hbmFnZXInKTtcbmV4cG9ydHMuV29ybGRSZW5kZXJlciA9IHJlcXVpcmUoJy4vbGliL3dvcmxkcmVuZGVyZXInKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVnaW9uUmVuZGVyZXI7XG5cblxudmFyIFRJTEVTX1ggPSAzMjtcbnZhciBUSUxFU19ZID0gMzI7XG52YXIgVElMRVNfUEVSX1JFR0lPTiA9IFRJTEVTX1ggKiBUSUxFU19ZO1xuXG52YXIgSEVBREVSX0JZVEVTID0gMztcbnZhciBCWVRFU19QRVJfVElMRSA9IDIzO1xudmFyIEJZVEVTX1BFUl9ST1cgPSBCWVRFU19QRVJfVElMRSAqIFRJTEVTX1g7XG52YXIgQllURVNfUEVSX1JFR0lPTiA9IEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9USUxFICogVElMRVNfUEVSX1JFR0lPTjtcblxudmFyIFRJTEVfV0lEVEggPSA4O1xudmFyIFRJTEVfSEVJR0hUID0gODtcblxudmFyIFJFR0lPTl9XSURUSCA9IFRJTEVfV0lEVEggKiBUSUxFU19YO1xudmFyIFJFR0lPTl9IRUlHSFQgPSBUSUxFX0hFSUdIVCAqIFRJTEVTX1k7XG5cblxuZnVuY3Rpb24gZ2V0SW50MTYocmVnaW9uLCBvZmZzZXQpIHtcbiAgaWYgKHJlZ2lvbiAmJiByZWdpb24udmlldykgcmV0dXJuIHJlZ2lvbi52aWV3LmdldEludDE2KG9mZnNldCk7XG59XG5cbmZ1bmN0aW9uIGdldE9yaWVudGF0aW9uKG9yaWVudGF0aW9ucywgaW5kZXgpIHtcbiAgdmFyIGN1ckluZGV4ID0gMCwgaW1hZ2UsIGRpcmVjdGlvbjtcblxuICAvLyBUaGlzIGlzIGEgdHJlbWVuZG91cyBhbW91bnQgb2YgbG9naWMgZm9yIGRlY2lkaW5nIHdoaWNoIGltYWdlIHRvIHVzZS4uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWVudGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvID0gb3JpZW50YXRpb25zW2ldO1xuICAgIGlmIChjdXJJbmRleCA9PSBpbmRleCkge1xuICAgICAgaWYgKG8uaW1hZ2VMYXllcnMpIHtcbiAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBtdWx0aXBsZSBsYXllcnMuXG4gICAgICAgIGltYWdlID0gby5pbWFnZUxheWVyc1swXS5pbWFnZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlID0gby5pbWFnZSB8fCBvLmxlZnRJbWFnZSB8fCBvLmR1YWxJbWFnZTtcbiAgICAgIH1cbiAgICAgIGRpcmVjdGlvbiA9IG8uZGlyZWN0aW9uIHx8ICdsZWZ0JztcbiAgICAgIGlmICghaW1hZ2UpIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCBpbWFnZSBmb3Igb3JpZW50YXRpb24nKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGN1ckluZGV4Kys7XG5cbiAgICBpZiAoby5kdWFsSW1hZ2UgfHwgby5yaWdodEltYWdlKSB7XG4gICAgICBpZiAoY3VySW5kZXggPT0gaW5kZXgpIHtcbiAgICAgICAgaW1hZ2UgPSBvLnJpZ2h0SW1hZ2UgfHwgby5kdWFsSW1hZ2U7XG4gICAgICAgIGRpcmVjdGlvbiA9ICdyaWdodCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjdXJJbmRleCsrO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaW1hZ2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBnZXQgb3JpZW50YXRpb24nKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW1hZ2U6IGltYWdlLFxuICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLFxuICAgIGZsaXA6IG8uZmxpcEltYWdlcyB8fCAhIShvLmR1YWxJbWFnZSAmJiBkaXJlY3Rpb24gPT0gJ2xlZnQnKSxcbiAgICBpbmZvOiBvXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFVpbnQ4KHJlZ2lvbiwgb2Zmc2V0KSB7XG4gIGlmIChyZWdpb24gJiYgcmVnaW9uLnZpZXcpIHJldHVybiByZWdpb24udmlldy5nZXRVaW50OChvZmZzZXQpO1xufVxuXG5cbmZ1bmN0aW9uIFJlZ2lvblJlbmRlcmVyKHgsIHkpIHtcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcblxuICB0aGlzLmVudGl0aWVzID0gbnVsbDtcbiAgdGhpcy52aWV3ID0gbnVsbDtcblxuICB0aGlzLm5laWdoYm9ycyA9IG51bGw7XG4gIHRoaXMuc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9VTklOSVRJQUxJWkVEO1xuXG4gIC8vIFdoZXRoZXIgYSBsYXllciBuZWVkcyB0byBiZSByZXJlbmRlcmVkLlxuICB0aGlzLmRpcnR5ID0ge2JhY2tncm91bmQ6IGZhbHNlLCBmb3JlZ3JvdW5kOiBmYWxzZSwgc3ByaXRlczogZmFsc2V9O1xuXG4gIHRoaXMuX3Nwcml0ZXNNaW5YID0gMDtcbiAgdGhpcy5fc3ByaXRlc01pblkgPSAwO1xufVxuXG5SZWdpb25SZW5kZXJlci5TVEFURV9FUlJPUiA9IC0xO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JVElBTElaRUQgPSAwO1xuUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORyA9IDE7XG5SZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSA9IDI7XG5cbi8vIFRPRE86IEltcGxlbWVudCBzdXBwb3J0IGZvciByZW5kZXJpbmcgb25seSBhIHBhcnQgb2YgdGhlIHJlZ2lvbi5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgaWYgKHRoaXMuc3RhdGUgIT0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfUkVBRFkpIHJldHVybjtcblxuICB0aGlzLl9yZW5kZXJFbnRpdGllcyhyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSk7XG4gIHRoaXMuX3JlbmRlclRpbGVzKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS51bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZW50aXRpZXMgPSBudWxsO1xuICB0aGlzLnZpZXcgPSBudWxsO1xuXG4gIHRoaXMubmVpZ2hib3JzID0gbnVsbDtcbiAgdGhpcy5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1VOSU5JVElBTElaRUQ7XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlckVudGl0aWVzID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKSB7XG4gIHZhciBjYW52YXMgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMik7XG4gIGlmICghdGhpcy5kaXJ0eS5zcHJpdGVzKSB7XG4gICAgY2FudmFzLnN0eWxlLmxlZnQgPSAob2Zmc2V0WCArIHRoaXMuX3Nwcml0ZXNNaW5YICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5ib3R0b20gPSAob2Zmc2V0WSArIChSRUdJT05fSEVJR0hUIC0gdGhpcy5fc3ByaXRlc01heFkpICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICB9XG5cbiAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gZmFsc2U7XG5cbiAgdmFyIG1pblggPSAwLCBtYXhYID0gMCwgbWluWSA9IDAsIG1heFkgPSAwLFxuICAgICAgb3JpZ2luWCA9IHRoaXMueCAqIFRJTEVTX1gsIG9yaWdpblkgPSB0aGlzLnkgKiBUSUxFU19ZLFxuICAgICAgYWxsU3ByaXRlcyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldLFxuICAgICAgICBzcHJpdGVzID0gbnVsbDtcblxuICAgIHN3aXRjaCAoZW50aXR5Ll9fbmFtZV9fICsgZW50aXR5Ll9fdmVyc2lvbl9fKSB7XG4gICAgICBjYXNlICdJdGVtRHJvcEVudGl0eTEnOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVySXRlbShyZW5kZXJlciwgZW50aXR5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNb25zdGVyRW50aXR5MSc6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJNb25zdGVyKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ05wY0VudGl0eTEnOlxuICAgICAgICAvLyBUT0RPOiBDb252ZXJ0IHRvIHZlcnNpb24gMiBiZWZvcmUgcmVuZGVyaW5nLlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ05wY0VudGl0eTInOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVyTlBDKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ09iamVjdEVudGl0eTEnOlxuICAgICAgICAvLyBUT0RPOiBQb3RlbnRpYWwgY29udmVyc2lvbiBjb2RlLlxuICAgICAgY2FzZSAnT2JqZWN0RW50aXR5Mic6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJPYmplY3QocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUGxhbnRFbnRpdHkxJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlclBsYW50KHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybignVW5zdXBwb3J0ZWQgZW50aXR5L3ZlcnNpb246JywgZW50aXR5KTtcbiAgICB9XG5cbiAgICBpZiAoc3ByaXRlcykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzcHJpdGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBzcHJpdGUgPSBzcHJpdGVzW2pdO1xuICAgICAgICBpZiAoIXNwcml0ZSB8fCAhc3ByaXRlLmltYWdlKSB7XG4gICAgICAgICAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3ByaXRlLnN4KSBzcHJpdGUuc3ggPSAwO1xuICAgICAgICBpZiAoIXNwcml0ZS5zeSkgc3ByaXRlLnN5ID0gMDtcbiAgICAgICAgaWYgKCFzcHJpdGUud2lkdGgpIHNwcml0ZS53aWR0aCA9IHNwcml0ZS5pbWFnZS53aWR0aDtcbiAgICAgICAgaWYgKCFzcHJpdGUuaGVpZ2h0KSBzcHJpdGUuaGVpZ2h0ID0gc3ByaXRlLmltYWdlLmhlaWdodDtcblxuICAgICAgICBzcHJpdGUuY2FudmFzWCA9IChzcHJpdGUueCAtIG9yaWdpblgpICogVElMRV9XSURUSDtcbiAgICAgICAgc3ByaXRlLmNhbnZhc1kgPSBSRUdJT05fSEVJR0hUIC0gKHNwcml0ZS55IC0gb3JpZ2luWSkgKiBUSUxFX0hFSUdIVCAtIHNwcml0ZS5oZWlnaHQ7XG5cbiAgICAgICAgbWluWCA9IE1hdGgubWluKHNwcml0ZS5jYW52YXNYLCBtaW5YKTtcbiAgICAgICAgbWF4WCA9IE1hdGgubWF4KHNwcml0ZS5jYW52YXNYICsgc3ByaXRlLndpZHRoLCBtYXhYKTtcbiAgICAgICAgbWluWSA9IE1hdGgubWluKHNwcml0ZS5jYW52YXNZLCBtaW5ZKTtcbiAgICAgICAgbWF4WSA9IE1hdGgubWF4KHNwcml0ZS5jYW52YXNZICsgc3ByaXRlLmhlaWdodCwgbWF4WSk7XG5cbiAgICAgICAgYWxsU3ByaXRlcy5wdXNoKHNwcml0ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlydHkuc3ByaXRlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhpcyB3aWxsIHJlc2l6ZSB0aGUgY2FudmFzIGlmIG5lY2Vzc2FyeS5cbiAgY2FudmFzID0gcmVuZGVyZXIuZ2V0Q2FudmFzKHRoaXMsIDIsIG1heFggLSBtaW5YLCBtYXhZIC0gbWluWSk7XG4gIHRoaXMuX3Nwcml0ZXNNaW5YID0gbWluWDtcbiAgdGhpcy5fc3ByaXRlc01pblkgPSBtaW5ZO1xuXG4gIGlmIChhbGxTcHJpdGVzLmxlbmd0aCkge1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbFNwcml0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzcHJpdGUgPSBhbGxTcHJpdGVzW2ldO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2Uoc3ByaXRlLmltYWdlLCBzcHJpdGUuc3gsIHNwcml0ZS5zeSwgc3ByaXRlLndpZHRoLCBzcHJpdGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLW1pblggKyBzcHJpdGUuY2FudmFzWCwgLW1pblkgKyBzcHJpdGUuY2FudmFzWSwgc3ByaXRlLndpZHRoLCBzcHJpdGUuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBjYW52YXMuc3R5bGUubGVmdCA9IChvZmZzZXRYICsgbWluWCAqIHJlbmRlcmVyLnpvb20pICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuYm90dG9tID0gKG9mZnNldFkgKyAoUkVHSU9OX0hFSUdIVCAtIG1heFkpICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICB9IGVsc2Uge1xuICAgIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIH1cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVySXRlbSA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgaXRlbXMuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck1vbnN0ZXIgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICAvLyBUT0RPOiBOb3Qgc3VyZSB3aGF0IHRvIGRvIGFib3V0IG1vbnN0ZXJzLlxufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJOUEMgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICAvLyBUT0RPOiBOb3Qgc3VyZSB3aGF0IHRvIGRvIGFib3V0IE5QQ3MuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck9iamVjdCA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIHZhciBvYmplY3RzID0gcmVuZGVyZXIub2JqZWN0cy5pbmRleDtcbiAgaWYgKCFvYmplY3RzKSByZXR1cm47XG5cbiAgdmFyIGFzc2V0cyA9IHJlbmRlcmVyLmFzc2V0cztcbiAgdmFyIGRlZiA9IG9iamVjdHNbZW50aXR5Lm5hbWVdO1xuICBpZiAoIWRlZikge1xuICAgIGNvbnNvbGUud2FybignT2JqZWN0IG5vdCBpbiBpbmRleDogJyArIGVudGl0eS5uYW1lKTtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoZGVmLmFuaW1hdGlvbikge1xuICAgIHZhciBhbmltYXRpb25QYXRoID0gYXNzZXRzLmdldFJlc291cmNlUGF0aChkZWYsIGRlZi5hbmltYXRpb24pO1xuICAgIC8vIFRPRE86IGFzc2V0cy5nZXRBbmltYXRpb24oYW5pbWF0aW9uUGF0aCk7XG4gIH1cblxuICB2YXIgb3JpZW50YXRpb24gPSBnZXRPcmllbnRhdGlvbihkZWYub3JpZW50YXRpb25zLCBlbnRpdHkub3JpZW50YXRpb25JbmRleCk7XG5cbiAgdmFyIHBhdGhBbmRGcmFtZSA9IG9yaWVudGF0aW9uLmltYWdlLnNwbGl0KCc6Jyk7XG4gIHZhciBpbWFnZVBhdGggPSBhc3NldHMuZ2V0UmVzb3VyY2VQYXRoKGRlZiwgcGF0aEFuZEZyYW1lWzBdKTtcbiAgdmFyIGZyYW1lcyA9IGFzc2V0cy5nZXRGcmFtZXMoaW1hZ2VQYXRoKTtcblxuICAvLyBGbGlwIGFsbCB0aGUgZnJhbWVzIGhvcml6b250YWxseSBpZiB0aGUgc3ByaXRlIGlzIHVzaW5nIGEgZHVhbCBpbWFnZS5cbiAgaWYgKG9yaWVudGF0aW9uLmZsaXApIHtcbiAgICBpZiAoIWZyYW1lcykgcmV0dXJuO1xuICAgIGltYWdlUGF0aCArPSAnP2ZsaXBncmlkeD0nICsgZnJhbWVzLmZyYW1lR3JpZC5zaXplWzBdO1xuICB9XG5cbiAgdmFyIGltYWdlID0gYXNzZXRzLmdldEltYWdlKGltYWdlUGF0aCk7XG4gIGlmICghZnJhbWVzIHx8ICFpbWFnZSkgcmV0dXJuO1xuXG4gIC8vIFRPRE86IEdldCB0aGUgY29ycmVjdCBmcmFtZSBpbiB0aGUgZnJhbWUgZ3JpZC5cblxuICB2YXIgc3ByaXRlID0ge1xuICAgIGltYWdlOiBpbWFnZSxcbiAgICB4OiBlbnRpdHkudGlsZVBvc2l0aW9uWzBdICsgb3JpZW50YXRpb24uaW5mby5pbWFnZVBvc2l0aW9uWzBdIC8gVElMRV9XSURUSCxcbiAgICB5OiBlbnRpdHkudGlsZVBvc2l0aW9uWzFdICsgb3JpZW50YXRpb24uaW5mby5pbWFnZVBvc2l0aW9uWzFdIC8gVElMRV9IRUlHSFQsXG4gICAgc3g6IDAsXG4gICAgc3k6IDAsXG4gICAgd2lkdGg6IGZyYW1lcy5mcmFtZUdyaWQuc2l6ZVswXSxcbiAgICBoZWlnaHQ6IGZyYW1lcy5mcmFtZUdyaWQuc2l6ZVsxXVxuICB9O1xuXG4gIHJldHVybiBbc3ByaXRlXTtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyUGxhbnQgPSBmdW5jdGlvbiAocmVuZGVyZXIsIGVudGl0eSkge1xuICB2YXIgYXNzZXRzID0gcmVuZGVyZXIuYXNzZXRzLFxuICAgICAgcG9zaXRpb24gPSBlbnRpdHkudGlsZVBvc2l0aW9uLFxuICAgICAgeCA9IHBvc2l0aW9uWzBdLFxuICAgICAgeSA9IHBvc2l0aW9uWzFdO1xuXG4gIHJldHVybiBlbnRpdHkucGllY2VzLm1hcChmdW5jdGlvbiAocGllY2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaW1hZ2U6IGFzc2V0cy5nZXRJbWFnZShwaWVjZS5pbWFnZSksXG4gICAgICB4OiB4ICsgcGllY2Uub2Zmc2V0WzBdLFxuICAgICAgeTogeSArIHBpZWNlLm9mZnNldFsxXVxuICAgIH07XG4gIH0pO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJUaWxlcyA9IGZ1bmN0aW9uIChyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuICB2YXIgYmcgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMSwgUkVHSU9OX1dJRFRILCBSRUdJT05fSEVJR0hUKTtcbiAgYmcuc3R5bGUubGVmdCA9IG9mZnNldFggKyAncHgnO1xuICBiZy5zdHlsZS5ib3R0b20gPSBvZmZzZXRZICsgJ3B4JztcbiAgYmcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICB2YXIgZmcgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgNCwgUkVHSU9OX1dJRFRILCBSRUdJT05fSEVJR0hUKTtcbiAgZmcuc3R5bGUubGVmdCA9IG9mZnNldFggKyAncHgnO1xuICBmZy5zdHlsZS5ib3R0b20gPSBvZmZzZXRZICsgJ3B4JztcbiAgZmcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICBpZiAoIXRoaXMuZGlydHkuYmFja2dyb3VuZCAmJiAhdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kKSByZXR1cm47XG5cbiAgdmFyIGFzc2V0cyA9IHJlbmRlcmVyLmFzc2V0cyxcbiAgICAgIG1hdGVyaWFscyA9IHJlbmRlcmVyLm1hdGVyaWFscy5pbmRleCxcbiAgICAgIG1hdG1vZHMgPSByZW5kZXJlci5tYXRtb2RzLmluZGV4O1xuXG4gIC8vIERvbid0IGFsbG93IHJlbmRlcmluZyB1bnRpbCByZXNvdXJjZXMgYXJlIGluZGV4ZWQuXG4gIGlmICghbWF0ZXJpYWxzIHx8ICFtYXRtb2RzKSB7XG4gICAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gdHJ1ZTtcbiAgICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFN0b3JlIGZsYWdzIGZvciBjaG9vc2luZyB3aGV0aGVyIHRvIHJlbmRlciBiYWNrZ3JvdW5kL2ZvcmVncm91bmQgdGlsZXMuXG4gIHZhciBkcmF3QmFja2dyb3VuZCA9IHRoaXMuZGlydHkuYmFja2dyb3VuZCB8fCB0aGlzLmRpcnR5LmZvcmVncm91bmQsXG4gICAgICBkcmF3Rm9yZWdyb3VuZCA9IHRoaXMuZGlydHkuZm9yZWdyb3VuZDtcblxuICAvLyBQcmVwYXJlIHRoZSByZW5kZXJpbmcgc3RlcC5cbiAgdmFyIGJnQ29udGV4dCA9IGJnLmdldENvbnRleHQoJzJkJyksIGZnQ29udGV4dCA9IGZnLmdldENvbnRleHQoJzJkJyk7XG4gIGlmIChkcmF3QmFja2dyb3VuZCkgYmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBiZy53aWR0aCwgYmcuaGVpZ2h0KTtcbiAgaWYgKGRyYXdGb3JlZ3JvdW5kKSBmZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGZnLndpZHRoLCBmZy5oZWlnaHQpO1xuXG4gIC8vIFJlc2V0IGRpcnR5IGZsYWdzIG5vdyBzbyB0aGF0IHRoZSBjb2RlIGJlbG93IGNhbiByZXNldCB0aGVtIGlmIG5lZWRlZC5cbiAgdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kID0gZmFsc2U7XG4gIHRoaXMuZGlydHkuZm9yZWdyb3VuZCA9IGZhbHNlO1xuXG4gIHZhciB2aWV3ID0gdGhpcy52aWV3LFxuICAgICAgYmFja2dyb3VuZElkLCBmb3JlZ3JvdW5kSWQsIGZvcmVncm91bmQ7XG5cbiAgLy8gVXNlZCB0byBkYXJrZW4gYmFja2dyb3VuZCB0aWxlcy5cbiAgYmdDb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsIDAsIDAsIC41KSc7XG5cbiAgdmFyIG5laWdoYm9ycyA9IFtcbiAgICB0aGlzLCBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfUk9XLFxuICAgIHRoaXMsIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfVElMRSxcbiAgICBudWxsLCBudWxsLFxuICAgIHRoaXMubmVpZ2hib3JzWzRdLCBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFLFxuICAgIHRoaXMubmVpZ2hib3JzWzRdLCBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVyxcbiAgICB0aGlzLm5laWdoYm9yc1s1XSwgQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9USUxFLFxuICAgIG51bGwsIG51bGwsXG4gICAgdGhpcy5uZWlnaGJvcnNbNl0sIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEVcbiAgXTtcblxuICB2YXIgeCA9IDAsIHkgPSAwLCBzeCA9IDAsIHN5ID0gUkVHSU9OX0hFSUdIVCAtIFRJTEVfSEVJR0hUO1xuICBmb3IgKHZhciBvZmZzZXQgPSBIRUFERVJfQllURVM7IG9mZnNldCA8IEJZVEVTX1BFUl9SRUdJT047IG9mZnNldCArPSBCWVRFU19QRVJfVElMRSkge1xuICAgIGlmICh4ID09IDApIHtcbiAgICAgIG5laWdoYm9yc1s0XSA9IHRoaXM7XG4gICAgICBuZWlnaGJvcnNbNV0gPSBvZmZzZXQgKyBCWVRFU19QRVJfVElMRTtcblxuICAgICAgaWYgKHkgPT0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbOF0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbOV0gPSBIRUFERVJfQllURVM7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1sxMl0gPSB0aGlzLm5laWdoYm9yc1s2XTtcbiAgICAgIG5laWdoYm9yc1sxM10gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRSArIEJZVEVTX1BFUl9ST1c7XG5cbiAgICAgIGlmICh5ID09IFRJTEVTX1kgLSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1swXSA9IHRoaXMubmVpZ2hib3JzWzBdO1xuICAgICAgICBuZWlnaGJvcnNbMV0gPSBIRUFERVJfQllURVM7XG4gICAgICAgIG5laWdoYm9yc1syXSA9IHRoaXMubmVpZ2hib3JzWzBdO1xuICAgICAgICBuZWlnaGJvcnNbM10gPSBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfVElMRTtcbiAgICAgICAgbmVpZ2hib3JzWzE0XSA9IHRoaXMubmVpZ2hib3JzWzddO1xuICAgICAgICBuZWlnaGJvcnNbMTVdID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JPVyAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfSBlbHNlIGlmICh5ID4gMCkge1xuICAgICAgICBuZWlnaGJvcnNbNl0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBvZmZzZXQgLSBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1RJTEU7XG4gICAgICAgIG5laWdoYm9yc1sxMF0gPSB0aGlzLm5laWdoYm9yc1s2XTtcbiAgICAgICAgbmVpZ2hib3JzWzExXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcy5uZWlnaGJvcnNbNl07XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRSArIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfUk9XO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeCA9PSAxKSB7XG4gICAgICBpZiAoeSA9PSAwKSB7XG4gICAgICAgIG5laWdoYm9yc1sxMF0gPSB0aGlzLm5laWdoYm9yc1s0XTtcbiAgICAgICAgbmVpZ2hib3JzWzExXSA9IEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3JzWzEwXSA9IHRoaXM7XG4gICAgICAgIG5laWdoYm9yc1sxMV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1sxMl0gPSB0aGlzO1xuICAgICAgbmVpZ2hib3JzWzEzXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFO1xuXG4gICAgICBpZiAoeSA9PSBUSUxFU19ZIC0gMSkge1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcy5uZWlnaGJvcnNbMF07XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBIRUFERVJfQllURVM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcztcbiAgICAgICAgbmVpZ2hib3JzWzE1XSA9IG9mZnNldCArIEJZVEVTX1BFUl9ST1cgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHggPT0gVElMRVNfWCAtIDEpIHtcbiAgICAgIGlmICh5ID09IFRJTEVTX1kgLSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1syXSA9IHRoaXMubmVpZ2hib3JzWzFdO1xuICAgICAgICBuZWlnaGJvcnNbM10gPSBIRUFERVJfQllURVM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbMl0gPSB0aGlzLm5laWdoYm9yc1syXTtcbiAgICAgICAgbmVpZ2hib3JzWzNdID0gb2Zmc2V0ICsgQllURVNfUEVSX1RJTEU7XG4gICAgICB9XG5cbiAgICAgIG5laWdoYm9yc1s0XSA9IHRoaXMubmVpZ2hib3JzWzJdO1xuICAgICAgbmVpZ2hib3JzWzVdID0gb2Zmc2V0IC0gQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFO1xuXG4gICAgICBpZiAoeSA9PSAwKSB7XG4gICAgICAgIG5laWdoYm9yc1s2XSA9IHRoaXMubmVpZ2hib3JzWzNdO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1JPVztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5laWdoYm9yc1s2XSA9IHRoaXMubmVpZ2hib3JzWzJdO1xuICAgICAgICBuZWlnaGJvcnNbN10gPSBvZmZzZXQgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPOiBGaWd1cmUgb3V0IHRoZSByZWFsIHZhcmlhbnQgYWxnb3JpdGhtLlxuICAgIHZhciB2YXJpYW50ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMjU1KTtcblxuICAgIGZvcmVncm91bmRJZCA9IHZpZXcuZ2V0SW50MTYob2Zmc2V0KTtcbiAgICBmb3JlZ3JvdW5kID0gbWF0ZXJpYWxzW2ZvcmVncm91bmRJZF07XG5cbiAgICAvLyBPbmx5IHJlbmRlciB0aGUgYmFja2dyb3VuZCBpZiB0aGUgZm9yZWdyb3VuZCBkb2Vzbid0IGNvdmVyIGl0LlxuICAgIGlmIChkcmF3QmFja2dyb3VuZCAmJiAoIWZvcmVncm91bmQgfHwgZm9yZWdyb3VuZC50cmFuc3BhcmVudCkpIHtcbiAgICAgIGlmICghdGhpcy5fcmVuZGVyVGlsZShiZ0NvbnRleHQsIHN4LCBzeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgNywgdmFyaWFudCwgbmVpZ2hib3JzKSkge1xuICAgICAgICB0aGlzLmRpcnR5LmJhY2tncm91bmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBEYXJrZW4gYmFja2dyb3VuZCB0aWxlcy5cbiAgICAgIGJnQ29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWF0b3AnO1xuICAgICAgYmdDb250ZXh0LmZpbGxSZWN0KHN4LCBzeSwgOCwgOCk7XG4gICAgICBiZ0NvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdGhlIGZvcmVncm91bmQgdGlsZSBhbmQvb3IgZWRnZXMuXG4gICAgaWYgKGRyYXdGb3JlZ3JvdW5kKSB7XG4gICAgICBpZiAoIXRoaXMuX3JlbmRlclRpbGUoZmdDb250ZXh0LCBzeCwgc3ksIGFzc2V0cywgbWF0ZXJpYWxzLCBtYXRtb2RzLCB2aWV3LCBvZmZzZXQsIDAsIHZhcmlhbnQsIG5laWdoYm9ycykpIHtcbiAgICAgICAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPOiBPbmx5IGluY3JlbWVudCB0aGUgb2Zmc2V0cyB0aGF0IGFjdHVhbGx5IG5lZWQgaXQuXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCAxNjsgaSArPSAyKSB7XG4gICAgICBuZWlnaGJvcnNbaV0gKz0gQllURVNfUEVSX1RJTEU7XG4gICAgfVxuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBuZXh0IHNldCBvZiBYLCBZIGNvb3JkaW5hdGVzLlxuICAgIGlmICgrK3ggPT0gMzIpIHtcbiAgICAgIHggPSAwOyB5Kys7XG4gICAgICBzeCA9IDA7IHN5IC09IFRJTEVfSEVJR0hUO1xuICAgIH0gZWxzZSB7XG4gICAgICBzeCArPSBUSUxFX1dJRFRIO1xuICAgIH1cbiAgfVxufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJUaWxlID0gZnVuY3Rpb24gKGNvbnRleHQsIHgsIHksIGFzc2V0cywgbWF0ZXJpYWxzLCBtYXRtb2RzLCB2aWV3LCBvZmZzZXQsIGRlbHRhLCB2YXJpYW50LCBuZWlnaGJvcnMpIHtcbiAgdmFyIG1jZW50ZXIgPSB2aWV3LmdldEludDE2KG9mZnNldCArIGRlbHRhKSxcbiAgICAgIG10b3AgPSBnZXRJbnQxNihuZWlnaGJvcnNbMF0sIG5laWdoYm9yc1sxXSArIGRlbHRhKSxcbiAgICAgIG1yaWdodCA9IGdldEludDE2KG5laWdoYm9yc1s0XSwgbmVpZ2hib3JzWzVdICsgZGVsdGEpLFxuICAgICAgbWJvdHRvbSA9IGdldEludDE2KG5laWdoYm9yc1s4XSwgbmVpZ2hib3JzWzldICsgZGVsdGEpLFxuICAgICAgbWxlZnQgPSBnZXRJbnQxNihuZWlnaGJvcnNbMTJdLCBuZWlnaGJvcnNbMTNdICsgZGVsdGEpLFxuICAgICAgaWNlbnRlciwgaXRvcCwgaXJpZ2h0LCBpYm90dG9tLCBpbGVmdCxcbiAgICAgIG9jZW50ZXIsIG90b3AsIG9yaWdodCwgb2JvdHRvbSwgb2xlZnQsXG4gICAgICB2Y2VudGVyLCB2dG9wLCB2cmlnaHQsIHZib3R0b20sIHZsZWZ0O1xuXG4gIHZhciBkdG9wID0gbXRvcCA+IDAgJiYgKG1jZW50ZXIgPCAxIHx8IG1jZW50ZXIgPiBtdG9wKSxcbiAgICAgIGRyaWdodCA9IG1yaWdodCA+IDAgJiYgKG1jZW50ZXIgPCAxIHx8IG1jZW50ZXIgPiBtcmlnaHQpLFxuICAgICAgZGJvdHRvbSA9IG1ib3R0b20gPiAwICYmIChtY2VudGVyIDwgMSB8fCBtY2VudGVyID4gbWJvdHRvbSksXG4gICAgICBkbGVmdCA9IG1sZWZ0ID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG1sZWZ0KTtcblxuICBpZiAoZHRvcCkge1xuICAgIG90b3AgPSBtYXRlcmlhbHNbbXRvcF07XG4gICAgaWYgKCFvdG9wKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob3RvcC5wbGF0Zm9ybSkge1xuICAgICAgZHRvcCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpdG9wID0gYXNzZXRzLmdldFRpbGVJbWFnZShvdG9wLCAnZnJhbWVzJywgZ2V0VWludDgobmVpZ2hib3JzWzBdLCBuZWlnaGJvcnNbMV0gKyBkZWx0YSArIDIpKTtcbiAgICAgIGlmICghaXRvcCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdnRvcCA9IHZhcmlhbnQgJSBvdG9wLnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRyaWdodCkge1xuICAgIG9yaWdodCA9IG1hdGVyaWFsc1ttcmlnaHRdO1xuICAgIGlmICghb3JpZ2h0KSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob3JpZ2h0LnBsYXRmb3JtKSB7XG4gICAgICBkcmlnaHQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXJpZ2h0ID0gYXNzZXRzLmdldFRpbGVJbWFnZShvcmlnaHQsICdmcmFtZXMnLCBnZXRVaW50OChuZWlnaGJvcnNbNF0sIG5laWdoYm9yc1s1XSArIGRlbHRhICsgMikpO1xuICAgICAgaWYgKCFpcmlnaHQpIHJldHVybiBmYWxzZTtcbiAgICAgIHZyaWdodCA9IHZhcmlhbnQgJSBvcmlnaHQudmFyaWFudHMgKiAxNjtcbiAgICB9XG4gIH1cblxuICBpZiAoZGxlZnQpIHtcbiAgICBvbGVmdCA9IG1hdGVyaWFsc1ttbGVmdF07XG4gICAgaWYgKCFvbGVmdCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG9sZWZ0LnBsYXRmb3JtKSB7XG4gICAgICBkbGVmdCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbGVmdCA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob2xlZnQsICdmcmFtZXMnLCBnZXRVaW50OChuZWlnaGJvcnNbMTJdLCBuZWlnaGJvcnNbMTNdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWlsZWZ0KSByZXR1cm4gZmFsc2U7XG4gICAgICB2bGVmdCA9IHZhcmlhbnQgJSBvbGVmdC52YXJpYW50cyAqIDE2O1xuICAgIH1cbiAgfVxuXG4gIGlmIChkYm90dG9tKSB7XG4gICAgb2JvdHRvbSA9IG1hdGVyaWFsc1ttYm90dG9tXTtcbiAgICBpZiAoIW9ib3R0b20pIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvYm90dG9tLnBsYXRmb3JtKSB7XG4gICAgICBkYm90dG9tID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlib3R0b20gPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9ib3R0b20sICdmcmFtZXMnLCBnZXRVaW50OChuZWlnaGJvcnNbOF0sIG5laWdoYm9yc1s5XSArIGRlbHRhICsgMikpO1xuICAgICAgaWYgKCFpYm90dG9tKSByZXR1cm4gZmFsc2U7XG4gICAgICB2Ym90dG9tID0gdmFyaWFudCAlIG9ib3R0b20udmFyaWFudHMgKiAxNjtcbiAgICB9XG4gIH1cblxuICBpZiAobWNlbnRlciA+IDApIHtcbiAgICBvY2VudGVyID0gbWF0ZXJpYWxzW21jZW50ZXJdO1xuICAgIGlmICghb2NlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgdmFyIGh1ZVNoaWZ0ID0gdmlldy5nZXRVaW50OChvZmZzZXQgKyBkZWx0YSArIDIpO1xuXG4gICAgaWYgKG9jZW50ZXIucGxhdGZvcm0pIHtcbiAgICAgIGljZW50ZXIgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9jZW50ZXIsICdwbGF0Zm9ybUltYWdlJywgaHVlU2hpZnQpO1xuICAgICAgaWYgKCFpY2VudGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHZjZW50ZXIgPSB2YXJpYW50ICUgb2NlbnRlci5wbGF0Zm9ybVZhcmlhbnRzICogODtcbiAgICAgIGlmIChtbGVmdCA+IDAgJiYgbWxlZnQgIT0gbWNlbnRlciAmJiBtcmlnaHQgPiAwICYmIG1yaWdodCAhPSBtY2VudGVyKSB7XG4gICAgICAgIHZjZW50ZXIgKz0gMjQgKiBvY2VudGVyLnBsYXRmb3JtVmFyaWFudHM7XG4gICAgICB9IGVsc2UgaWYgKG1yaWdodCA+IDAgJiYgbXJpZ2h0ICE9IG1jZW50ZXIpIHtcbiAgICAgICAgdmNlbnRlciArPSAxNiAqIG9jZW50ZXIucGxhdGZvcm1WYXJpYW50cztcbiAgICAgIH0gZWxzZSBpZiAobWxlZnQgPCAxIHx8IG1sZWZ0ID09IG1jZW50ZXIpIHtcbiAgICAgICAgdmNlbnRlciArPSA4ICogb2NlbnRlci5wbGF0Zm9ybVZhcmlhbnRzO1xuICAgICAgfVxuXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpY2VudGVyLCB2Y2VudGVyLCAwLCA4LCA4LCB4LCB5LCA4LCA4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWNlbnRlciA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob2NlbnRlciwgJ2ZyYW1lcycsIGh1ZVNoaWZ0KTtcbiAgICAgIGlmICghaWNlbnRlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2Y2VudGVyID0gdmFyaWFudCAlIG9jZW50ZXIudmFyaWFudHMgKiAxNjtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGljZW50ZXIsIHZjZW50ZXIgKyA0LCAxMiwgOCwgOCwgeCwgeSwgOCwgOCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGR0b3ApIHtcbiAgICBpZiAobXRvcCA9PSBtbGVmdCkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCwgMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtdG9wIDwgbWxlZnQpIHtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA0LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA0LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRsZWZ0KSB7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgfVxuXG4gIHggKz0gNDtcblxuICBpZiAoZHRvcCkge1xuICAgIGlmIChtdG9wID09IG1yaWdodCkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDQsIDAsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobXRvcCA8IG1yaWdodCkge1xuICAgICAgaWYgKGRyaWdodClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXJpZ2h0LCB2cmlnaHQsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA4LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGl0b3AsIHZ0b3AgKyA4LCAyMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkcmlnaHQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgeSArPSA0O1xuXG4gIGlmIChkYm90dG9tKSB7XG4gICAgaWYgKG1ib3R0b20gPT0gbXJpZ2h0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgNCwgNCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtYm90dG9tIDwgbXJpZ2h0KSB7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDgsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgOCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkcmlnaHQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgeCAtPSA0O1xuXG4gIGlmIChkYm90dG9tKSB7XG4gICAgaWYgKG1ib3R0b20gPT0gbWxlZnQpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20sIDQsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH0gZWxzZSBpZiAobWJvdHRvbSA8IG1sZWZ0KSB7XG4gICAgICBpZiAoZGxlZnQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgNCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGxlZnQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWF0bW9kcyB3b3JrLlxuICAvLyBSZW5kZXIgdGhlIG1hdG1vZCBmb3IgdGhpcyB0aWxlLlxuICB2YXIgbW9kSWQgPSB2aWV3LmdldEludDE2KG9mZnNldCArIGRlbHRhICsgNCksIG1vZCwgbW9kSW1hZ2U7XG4gIGlmIChtb2RJZCA+IDApIHtcbiAgICBtb2QgPSBtYXRtb2RzW21vZElkXTtcbiAgICBpZiAoIW1vZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgbW9kSW1hZ2UgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG1vZCwgJ2ZyYW1lcycsIHZpZXcuZ2V0VWludDgob2Zmc2V0ICsgZGVsdGEgKyA2KSk7XG4gICAgaWYgKCFtb2RJbWFnZSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29udGV4dC5kcmF3SW1hZ2UobW9kSW1hZ2UsIDQgKyB2YXJpYW50ICUgbW9kLnZhcmlhbnRzICogMTYsIDEyLCA4LCA4LCB4LCB5IC0gNCwgOCwgOCk7XG4gIH1cblxuICAvLyBSZW5kZXIgdGhlIG1hdG1vZCBvZiB0aGUgdGlsZSBiZWxvdyB0aGlzIG9uZSAoaWYgaXQgb3ZlcmZsb3dzKS5cbiAgaWYgKCFvY2VudGVyICYmIG5laWdoYm9yc1s4XSkge1xuICAgIG1vZElkID0gZ2V0SW50MTYobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDQpO1xuICAgIGlmIChtb2RJZCA+IDApIHtcbiAgICAgIG1vZCA9IG1hdG1vZHNbbW9kSWRdO1xuICAgICAgaWYgKCFtb2QpIHJldHVybiBmYWxzZTtcblxuICAgICAgbW9kSW1hZ2UgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG1vZCwgJ2ZyYW1lcycsIGdldFVpbnQ4KG5laWdoYm9yc1s4XSwgbmVpZ2hib3JzWzldICsgZGVsdGEgKyA2KSk7XG4gICAgICBpZiAoIW1vZEltYWdlKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKG1vZEltYWdlLCA0ICsgdmFyaWFudCAlIG1vZC52YXJpYW50cyAqIDE2LCA4LCA4LCA0LCB4LCB5LCA4LCA0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFdvcmxkO1xuXG5mdW5jdGlvbiBXb3JsZChtYW5hZ2VyLCBmaWxlLCBpbmZvKSB7XG4gIHRoaXMuX2hhbmRsZSA9IGluZm8uaGFuZGxlO1xuICB0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcblxuICB0aGlzLmxhc3RNb2RpZmllZCA9IGZpbGUubGFzdE1vZGlmaWVkRGF0ZTtcbiAgdGhpcy5tZXRhZGF0YSA9IGluZm8ubWV0YWRhdGE7XG5cbiAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgbG9naWMgb25jZSB3b3JsZCBtZXRhZGF0YSBpcyBhdXRvbWF0aWNhbGx5IHVwZ3JhZGVkLlxuICB2YXIgbG9jYXRpb24sIGRhdGEsIHBhcmFtcztcbiAgc3dpdGNoIChpbmZvLm1ldGFkYXRhLl9fdmVyc2lvbl9fKSB7XG4gICAgY2FzZSAxOlxuICAgICAgZGF0YSA9IGluZm8ubWV0YWRhdGEucGxhbmV0O1xuICAgICAgcGFyYW1zID0gZGF0YS5jb25maWcuY2VsZXN0aWFsUGFyYW1ldGVycztcblxuICAgICAgdmFyIGNvb3JkID0gZGF0YS5jb25maWcuc2t5UGFyYW1ldGVycy5jb29yZGluYXRlO1xuICAgICAgaWYgKGNvb3JkKSB7XG4gICAgICAgIGxvY2F0aW9uID0gY29vcmQucGFyZW50U3lzdGVtLmxvY2F0aW9uO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgY2FzZSAzOlxuICAgICAgZGF0YSA9IGluZm8ubWV0YWRhdGEud29ybGRUZW1wbGF0ZTtcbiAgICAgIHBhcmFtcyA9IGRhdGEuY2VsZXN0aWFsUGFyYW1ldGVycztcblxuICAgICAgaWYgKHBhcmFtcykge1xuICAgICAgICBsb2NhdGlvbiA9IHBhcmFtcy5jb29yZGluYXRlLmxvY2F0aW9uO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBtZXRhZGF0YSB2ZXJzaW9uICcgKyBtZXRhZGF0YS5fX3ZlcnNpb25fXyk7XG4gIH1cblxuICB0aGlzLnRpbGVzWCA9IGRhdGEuc2l6ZVswXTtcbiAgdGhpcy50aWxlc1kgPSBkYXRhLnNpemVbMV07XG5cbiAgdGhpcy5zcGF3blggPSBpbmZvLm1ldGFkYXRhLnBsYXllclN0YXJ0WzBdO1xuICB0aGlzLnNwYXduWSA9IGluZm8ubWV0YWRhdGEucGxheWVyU3RhcnRbMV07XG5cbiAgLy8gU2hpcHMgZG9uJ3QgaGF2ZSBuYW1lIG9yIGxvY2F0aW9uLlxuICBpZiAocGFyYW1zKSB7XG4gICAgdGhpcy5uYW1lID0gcGFyYW1zLm5hbWU7XG4gICAgdGhpcy5iaW9tZSA9IHBhcmFtcy5wcmltYXJ5QmlvbWVOYW1lIHx8IHBhcmFtcy5zY2FuRGF0YS5wcmltYXJ5QmlvbWVOYW1lO1xuICB9IGVsc2Uge1xuICAgIGlmIChmaWxlLm5hbWUubWF0Y2goL1xcLnNoaXB3b3JsZCQvKSkge1xuICAgICAgdGhpcy5uYW1lID0gJ1NoaXAnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5hbWUgPSAnVW5rbm93bic7XG4gICAgfVxuICAgIHRoaXMuYmlvbWUgPSBudWxsO1xuICB9XG5cbiAgaWYgKGxvY2F0aW9uKSB7XG4gICAgdGhpcy54ID0gbG9jYXRpb25bMF07XG4gICAgdGhpcy55ID0gbG9jYXRpb25bMV07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy54ID0gbnVsbDtcbiAgICB0aGlzLnkgPSBudWxsO1xuICB9XG59XG5cbldvcmxkLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB0aGlzLl9tYW5hZ2VyLmFwaS5jbG9zZSh0aGlzLl9oYW5kbGUsIGNhbGxiYWNrKTtcbiAgdGhpcy5fbWFuYWdlciA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZSA9IC0xO1xufTtcblxuV29ybGQucHJvdG90eXBlLmdldFJlZ2lvbiA9IGZ1bmN0aW9uICh4LCB5LCBjYWxsYmFjaykge1xuICBpZiAoIXRoaXMuX21hbmFnZXIpIHRocm93IG5ldyBFcnJvcignVGhlIHdvcmxkIGZpbGUgaXMgY2xvc2VkJyk7XG4gIHRoaXMuX21hbmFnZXIuYXBpLmdldFJlZ2lvbih0aGlzLl9oYW5kbGUsIHgsIHksIGNhbGxiYWNrKTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5pc09wZW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAhIXRoaXMuX21hbmFnZXI7XG59O1xuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIFdvcmxkID0gcmVxdWlyZSgnLi93b3JsZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmxkTWFuYWdlcjtcblxuZnVuY3Rpb24gV29ybGRNYW5hZ2VyKG9wdF9vcHRpb25zKSB7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHZhciBvcHRpb25zID0ge1xuICAgIHdvcmtlclBhdGg6IF9fZGlybmFtZSArICcvd29ya2VyLmpzJ1xuICB9O1xuXG4gIE9iamVjdC5zZWFsKG9wdGlvbnMpO1xuICBtZXJnZShvcHRpb25zLCBvcHRfb3B0aW9ucyk7XG4gIE9iamVjdC5mcmVlemUob3B0aW9ucyk7XG5cbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICB2YXIgd29ya2VyID0gbmV3IFdvcmtlcihvcHRpb25zLndvcmtlclBhdGgpO1xuICB0aGlzLmFwaSA9IHdvcmtlcnByb3h5KHdvcmtlcik7XG59XG51dGlsLmluaGVyaXRzKFdvcmxkTWFuYWdlciwgRXZlbnRFbWl0dGVyKTtcblxuV29ybGRNYW5hZ2VyLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKGZpbGUsIG9wdF9jYWxsYmFjaykge1xuICB0aGlzLmFwaS5vcGVuKGZpbGUsIChlcnIsIGluZm8pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBpZiAob3B0X2NhbGxiYWNrKSBvcHRfY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBDb252ZXJ0IG1ldGFkYXRhIHRvIGxhdGVzdCB2ZXJzaW9uLlxuICAgIHZhciB3b3JsZCA9IG5ldyBXb3JsZCh0aGlzLCBmaWxlLCBpbmZvKTtcbiAgICB0aGlzLmVtaXQoJ2xvYWQnLCB7d29ybGQ6IHdvcmxkfSk7XG4gICAgaWYgKG9wdF9jYWxsYmFjaykgb3B0X2NhbGxiYWNrKGVyciwgd29ybGQpO1xuICB9KTtcbn07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIFJlZ2lvblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZWdpb25yZW5kZXJlcicpO1xudmFyIFdvcmxkID0gcmVxdWlyZSgnLi93b3JsZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmxkUmVuZGVyZXI7XG5cblxudmFyIFRJTEVTX1ggPSAzMjtcbnZhciBUSUxFU19ZID0gMzI7XG52YXIgVElMRVNfUEVSX1JFR0lPTiA9IFRJTEVTX1ggKiBUSUxFU19ZO1xuXG52YXIgSEVBREVSX0JZVEVTID0gMztcbnZhciBCWVRFU19QRVJfVElMRSA9IDIzO1xudmFyIEJZVEVTX1BFUl9ST1cgPSBCWVRFU19QRVJfVElMRSAqIFRJTEVTX1g7XG52YXIgQllURVNfUEVSX1JFR0lPTiA9IEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9USUxFICogVElMRVNfUEVSX1JFR0lPTjtcblxudmFyIFRJTEVfV0lEVEggPSA4O1xudmFyIFRJTEVfSEVJR0hUID0gODtcblxudmFyIFJFR0lPTl9XSURUSCA9IFRJTEVfV0lEVEggKiBUSUxFU19YO1xudmFyIFJFR0lPTl9IRUlHSFQgPSBUSUxFX0hFSUdIVCAqIFRJTEVTX1k7XG5cbnZhciBNSU5fWk9PTSA9IC4xO1xudmFyIE1BWF9aT09NID0gMztcblxuXG5mdW5jdGlvbiBXb3JsZFJlbmRlcmVyKHZpZXdwb3J0LCBhc3NldHNNYW5hZ2VyLCBvcHRfd29ybGQpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgLy8gRW5zdXJlIHRoYXQgY2FudmFzZXMgY2FuIGJlIGFuY2hvcmVkIHRvIHRoZSB2aWV3cG9ydC5cbiAgdmFyIHBvc2l0aW9uID0gZ2V0Q29tcHV0ZWRTdHlsZSh2aWV3cG9ydCkuZ2V0UHJvcGVydHlWYWx1ZSgncG9zaXRpb24nKTtcbiAgaWYgKHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJykge1xuICAgIHZpZXdwb3J0LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgfVxuXG4gIHRoaXMudmlld3BvcnQgPSB2aWV3cG9ydDtcbiAgdGhpcy5hc3NldHMgPSBhc3NldHNNYW5hZ2VyO1xuICB0aGlzLndvcmxkID0gb3B0X3dvcmxkIHx8IG51bGw7XG5cbiAgdGhpcy5jZW50ZXJYID0gMDtcbiAgdGhpcy5jZW50ZXJZID0gMDtcbiAgdGhpcy56b29tID0gMTtcblxuICB0aGlzLnZpZXdwb3J0WCA9IDA7XG4gIHRoaXMudmlld3BvcnRZID0gMDtcbiAgdGhpcy5zY3JlZW5SZWdpb25XaWR0aCA9IFJFR0lPTl9XSURUSDtcbiAgdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgPSBSRUdJT05fSEVJR0hUO1xuXG4gIHRoaXMubWF0ZXJpYWxzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm1hdGVyaWFsJyk7XG4gIHRoaXMubWF0bW9kcyA9IGFzc2V0c01hbmFnZXIuZ2V0UmVzb3VyY2VMb2FkZXIoJy5tYXRtb2QnKTtcbiAgdGhpcy5vYmplY3RzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm9iamVjdCcpO1xuXG4gIHRoaXMuYXNzZXRzLm9uKCdpbWFnZXMnLCAoKSA9PiB0aGlzLnJlcXVlc3RSZW5kZXIoKSk7XG4gIHRoaXMuYXNzZXRzLm9uKCdyZXNvdXJjZXMnLCAoKSA9PiB0aGlzLnJlcXVlc3RSZW5kZXIoKSk7XG5cbiAgdGhpcy5fY2FudmFzUG9vbCA9IFtdO1xuICB0aGlzLl9mcmVlUG9vbCA9IG51bGw7XG4gIHRoaXMuX3Bvb2xMb29rdXAgPSBudWxsO1xuXG4gIHRoaXMuX2JhY2tncm91bmRzID0gW107XG4gIHRoaXMuX3JlZ2lvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHRoaXMuX2JvdW5kcyA9IHZpZXdwb3J0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB0aGlzLl9yZWdpb25zWCA9IDA7XG4gIHRoaXMuX3JlZ2lvbnNZID0gMDtcbiAgdGhpcy5fdGlsZXNYID0gMDtcbiAgdGhpcy5fdGlsZXNZID0gMDtcbiAgdGhpcy5fZnJvbVJlZ2lvblggPSAwO1xuICB0aGlzLl9mcm9tUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IDA7XG4gIHRoaXMuX3RvUmVnaW9uWSA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWCA9IDA7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWSA9IDA7XG5cbiAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHdvcmxkIGlmIGl0J3MgYXZhaWxhYmxlLlxuICBpZiAodGhpcy53b3JsZCkge1xuICAgIHRoaXMuX2xvYWRNZXRhZGF0YSgpO1xuICB9XG59XG51dGlsLmluaGVyaXRzKFdvcmxkUmVuZGVyZXIsIEV2ZW50RW1pdHRlcik7XG5cbi8qKlxuICogQ2VudGVycyB0aGUgcmVuZGVyZXIgdmlld3BvcnQgb24gdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0aWxlWCBUaGUgWCBpbi1nYW1lIGNvb3JkaW5hdGUgdG8gY2VudGVyIG9uLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbGVZIFRoZSBZIGluLWdhbWUgY29vcmRpbmF0ZSB0byBjZW50ZXIgb24uXG4gKi9cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmNlbnRlciA9IGZ1bmN0aW9uICh0aWxlWCwgdGlsZVkpIHtcbiAgdGhpcy5jZW50ZXJYID0gdGlsZVg7XG4gIHRoaXMuY2VudGVyWSA9IHRpbGVZO1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuZ2V0Q2FudmFzID0gZnVuY3Rpb24gKHJlZ2lvbiwgeiwgb3B0X3dpZHRoLCBvcHRfaGVpZ2h0KSB7XG4gIHZhciBrZXkgPSByZWdpb24ueCArICc6JyArIHJlZ2lvbi55ICsgJzonICsgejtcblxuICB2YXIgaXRlbSA9IHRoaXMuX3Bvb2xMb29rdXBba2V5XSwgY2FudmFzO1xuXG4gIGlmIChpdGVtKSB7XG4gICAgY2FudmFzID0gaXRlbS5jYW52YXM7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoaXMuX2ZyZWVQb29sLmxlbmd0aCkge1xuICAgICAgaXRlbSA9IHRoaXMuX2ZyZWVQb29sLnBvcCgpO1xuICAgICAgY2FudmFzID0gaXRlbS5jYW52YXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENyZWF0ZSBuZXcgPGNhbnZhcz4gZWxlbWVudHMgYXMgdGhleSBhcmUgbmVlZGVkLlxuICAgICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBjYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIHRoaXMudmlld3BvcnQuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgICAgLy8gUmVnaXN0ZXIgdGhlIG5ldyBjYW52YXMgaW4gdGhlIHBvb2wuXG4gICAgICBpdGVtID0ge2NhbnZhczogY2FudmFzLCByZWdpb246IHJlZ2lvbiwgejogen07XG4gICAgICB0aGlzLl9jYW52YXNQb29sLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgaXRlbS56ID0gejtcbiAgICBpdGVtLnJlZ2lvbiA9IHJlZ2lvbjtcbiAgICB0aGlzLl9wb29sTG9va3VwW2tleV0gPSBpdGVtO1xuXG4gICAgLy8gTWFyayB0aGUgcmVnaW9uIGFzIGRpcnR5IHNpbmNlIGl0J3Mgbm90IHJldXNpbmcgYSBjYW52YXMuXG4gICAgcmVnaW9uLnNldERpcnR5KCk7XG4gIH1cblxuICAvLyBPbmx5IHJlc2l6ZSB0aGUgY2FudmFzIGlmIG5lY2Vzc2FyeSwgc2luY2UgcmVzaXppbmcgY2xlYXJzIHRoZSBjYW52YXMuXG4gIHZhciB3aWR0aCA9IHR5cGVvZiBvcHRfd2lkdGggPT0gJ251bWJlcicgPyBvcHRfd2lkdGggOiBjYW52YXMud2lkdGgsXG4gICAgICBoZWlnaHQgPSB0eXBlb2Ygb3B0X2hlaWdodCA9PSAnbnVtYmVyJyA/IG9wdF9oZWlnaHQgOiBjYW52YXMuaGVpZ2h0O1xuXG4gIGlmIChjYW52YXMud2lkdGggIT0gd2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSBoZWlnaHQpIHtcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHJlZ2lvbi5zZXREaXJ0eSgpO1xuICB9XG5cbiAgY2FudmFzLnN0eWxlLndpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMuem9vbSkgKyAncHgnO1xuICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gTWF0aC5yb3VuZChoZWlnaHQgKiB0aGlzLnpvb20pICsgJ3B4JztcbiAgY2FudmFzLnN0eWxlLnpJbmRleCA9IHo7XG5cbiAgcmV0dXJuIGNhbnZhcztcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLmdldFJlZ2lvbiA9IGZ1bmN0aW9uIChyZWdpb25YLCByZWdpb25ZLCBvcHRfc2tpcE5laWdoYm9ycykge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gV3JhcCB0aGUgWCBheGlzLlxuICBpZiAocmVnaW9uWCA+PSB0aGlzLl9yZWdpb25zWCkge1xuICAgIHJlZ2lvblggLT0gdGhpcy5fcmVnaW9uc1g7XG4gIH0gZWxzZSBpZiAocmVnaW9uWCA8IDApIHtcbiAgICByZWdpb25YICs9IHRoaXMuX3JlZ2lvbnNYO1xuICB9XG5cbiAgLy8gVGhlIFkgYXhpcyBkb2Vzbid0IHdyYXAuXG4gIGlmIChyZWdpb25ZIDwgMCB8fCByZWdpb25ZID49IHRoaXMuX3JlZ2lvbnNZKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIga2V5ID0gcmVnaW9uWCArICc6JyArIHJlZ2lvblk7XG5cbiAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgcmVnaW9uLlxuICB2YXIgcmVnaW9uO1xuICBpZiAoa2V5IGluIHRoaXMuX3JlZ2lvbnMpIHtcbiAgICByZWdpb24gPSB0aGlzLl9yZWdpb25zW2tleV07XG4gIH0gZWxzZSB7XG4gICAgcmVnaW9uID0gbmV3IFJlZ2lvblJlbmRlcmVyKHJlZ2lvblgsIHJlZ2lvblkpO1xuICAgIHRoaXMuX3JlZ2lvbnNba2V5XSA9IHJlZ2lvbjtcbiAgfVxuXG4gIC8vIExvYWQgdGhlIHJlZ2lvbiBkYXRhIGlmIGl0IGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCB5ZXQuXG4gIGlmIChyZWdpb24uc3RhdGUgPT0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JTklUSUFMSVpFRCkge1xuICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX0xPQURJTkc7XG5cbiAgICB0aGlzLndvcmxkLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZLCAoZXJyLCByZWdpb25EYXRhKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX0VSUk9SO1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UgIT0gJ0tleSBub3QgZm91bmQnKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAocmVnaW9uRGF0YS5idWZmZXIuYnl0ZUxlbmd0aCAhPSBCWVRFU19QRVJfUkVHSU9OKSB7XG4gICAgICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX0VSUk9SO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb3JydXB0ZWQgcmVnaW9uICcgKyByZWdpb25YICsgJywgJyArIHJlZ2lvblkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlZ2lvbi5lbnRpdGllcyA9IHJlZ2lvbkRhdGEuZW50aXRpZXM7XG4gICAgICByZWdpb24udmlldyA9IG5ldyBEYXRhVmlldyhyZWdpb25EYXRhLmJ1ZmZlcik7XG4gICAgICByZWdpb24uc3RhdGUgPSBSZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWTtcblxuICAgICAgcmVnaW9uLnNldERpcnR5KCk7XG4gICAgICB0aGlzLnJlcXVlc3RSZW5kZXIoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIElmIHRoZSByZWdpb24gc2hvdWxkIG5vdCBnZXQgbmVpZ2hib3JzLCByZXR1cm4gbm93LlxuICBpZiAob3B0X3NraXBOZWlnaGJvcnMpIHJldHVybiByZWdpb247XG5cbiAgLy8gQWRkIHJlZmVyZW5jZXMgdG8gc3Vycm91bmRpbmcgcmVnaW9ucy5cbiAgaWYgKCFyZWdpb24ubmVpZ2hib3JzKSB7XG4gICAgcmVnaW9uLm5laWdoYm9ycyA9IFtcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblkgKyAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggKyAxLCByZWdpb25ZICsgMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YICsgMSwgcmVnaW9uWSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YICsgMSwgcmVnaW9uWSAtIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSAtIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCAtIDEsIHJlZ2lvblkgLSAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggLSAxLCByZWdpb25ZLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggLSAxLCByZWdpb25ZICsgMSwgdHJ1ZSlcbiAgICBdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgIHZhciBuZWlnaGJvciA9IHJlZ2lvbi5uZWlnaGJvcnNbaV07XG4gICAgICBpZiAoIW5laWdoYm9yKSBjb250aW51ZTtcbiAgICAgIG5laWdoYm9yLnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcmVnaW9uLnNldERpcnR5KCk7XG4gICAgdGhpcy5yZXF1ZXN0UmVuZGVyKCk7XG4gIH1cblxuICByZXR1cm4gcmVnaW9uO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuaXNSZWdpb25WaXNpYmxlID0gZnVuY3Rpb24gKHJlZ2lvbikge1xuICBpZiAoIXJlZ2lvbikgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBmcm9tWCA9IHRoaXMuX2Zyb21SZWdpb25YLCB0b1ggPSB0aGlzLl90b1JlZ2lvblgsXG4gICAgICBmcm9tWSA9IHRoaXMuX2Zyb21SZWdpb25ZLCB0b1kgPSB0aGlzLl90b1JlZ2lvblk7XG5cbiAgdmFyIHZpc2libGVZID0gcmVnaW9uLnkgPj0gZnJvbVkgJiYgcmVnaW9uLnkgPCB0b1k7XG4gIHZhciB2aXNpYmxlWCA9IChyZWdpb24ueCA+PSBmcm9tWCAmJiByZWdpb24ueCA8IHRvWCkgfHxcbiAgICAocmVnaW9uLnggPj0gZnJvbVggLSB0aGlzLl9yZWdpb25zWCAmJiByZWdpb24ueCA8IHRvWCAtIHRoaXMuX3JlZ2lvbnNYKSB8fFxuICAgIChyZWdpb24ueCA+PSBmcm9tWCArIHRoaXMuX3JlZ2lvbnNYICYmIHJlZ2lvbi54IDwgdG9YICsgdGhpcy5fcmVnaW9uc1gpO1xuXG4gIHJldHVybiB2aXNpYmxlWCAmJiB2aXNpYmxlWTtcbn07XG5cbi8vIFN0YXJ0IGxvYWRpbmcgdGhlIHJlc291cmNlIGluZGV4ZXMuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLm1hdGVyaWFscy5sb2FkSW5kZXgoKTtcbiAgdGhpcy5tYXRtb2RzLmxvYWRJbmRleCgpO1xuICB0aGlzLm9iamVjdHMubG9hZEluZGV4KCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuLy8gVE9ETzogV2hlbiBDaHJvbWUgYW5kIEZpcmVmb3ggc3VwcG9ydCBDYW52YXNQcm94eSBvZmZsb2FkIHJlbmRlcmluZyB0byB0aGVcbi8vICAgICAgIHdvcmtlci5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQpIHJldHVybjtcblxuICBpZiAoIXRoaXMuX3NldHVwKSB7XG4gICAgdGhpcy5fY2FsY3VsYXRlVmlld3BvcnQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBQcmVjYWxjdWxhdGUgZnJlZSBjYW52YXNlcyBhbmQgYSBjYW52YXMgbG9va3VwIG1hcC5cbiAgdGhpcy5fcHJlcGFyZUNhbnZhc1Bvb2woKTtcblxuICAvLyBSZW5kZXIgYmFja2dyb3VuZCBvdmVybGF5cy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9iYWNrZ3JvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiZyA9IHRoaXMuX2JhY2tncm91bmRzW2ldO1xuXG4gICAgdmFyIGltYWdlID0gdGhpcy5hc3NldHMuZ2V0SW1hZ2UoYmcuaW1hZ2UpO1xuICAgIGlmICghaW1hZ2UpIGNvbnRpbnVlO1xuXG4gICAgdmFyIHdpZHRoID0gaW1hZ2UubmF0dXJhbFdpZHRoICogdGhpcy56b29tLFxuICAgICAgICBoZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0ICogdGhpcy56b29tO1xuXG4gICAgdmFyIHggPSBiZy5taW5bMF0gKiB0aGlzLl9zY3JlZW5UaWxlV2lkdGggLSB0aGlzLnZpZXdwb3J0WCxcbiAgICAgICAgeSA9IGJnLm1pblsxXSAqIHRoaXMuX3NjcmVlblRpbGVIZWlnaHQgLSB0aGlzLnZpZXdwb3J0WTtcblxuICAgIGltYWdlLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcbiAgICBpbWFnZS5zdHlsZS5ib3R0b20gPSB5ICsgJ3B4JztcbiAgICBpbWFnZS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICBpbWFnZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG4gICAgaWYgKCFpbWFnZS5wYXJlbnROb2RlKSB7XG4gICAgICBpbWFnZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICBpbWFnZS5zdHlsZS56SW5kZXggPSAwO1xuICAgICAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZChpbWFnZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVuZGVyIHJlZ2lvbnMgYW5kIHRoZWlyIG9iamVjdHMuXG4gIGZvciAodmFyIHJlZ2lvblkgPSB0aGlzLl9mcm9tUmVnaW9uWTsgcmVnaW9uWSA8IHRoaXMuX3RvUmVnaW9uWTsgcmVnaW9uWSsrKSB7XG4gICAgZm9yICh2YXIgcmVnaW9uWCA9IHRoaXMuX2Zyb21SZWdpb25YOyByZWdpb25YIDwgdGhpcy5fdG9SZWdpb25YOyByZWdpb25YKyspIHtcbiAgICAgIHZhciByZWdpb24gPSB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZKTtcbiAgICAgIGlmICghcmVnaW9uKSBjb250aW51ZTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSByZWdpb24ncyBwb3NpdGlvbiBpbiB0aGUgdmlld3BvcnQgYW5kIHJlbmRlciBpdC5cbiAgICAgIHZhciBvZmZzZXRYID0gcmVnaW9uWCAqIHRoaXMuc2NyZWVuUmVnaW9uV2lkdGggLSB0aGlzLnZpZXdwb3J0WCxcbiAgICAgICAgICBvZmZzZXRZID0gcmVnaW9uWSAqIHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0IC0gdGhpcy52aWV3cG9ydFk7XG4gICAgICByZWdpb24ucmVuZGVyKHRoaXMsIG9mZnNldFgsIG9mZnNldFkpO1xuICAgIH1cbiAgfVxufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucmVxdWVzdFJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQgfHwgdGhpcy5fcmVxdWVzdGluZ1JlbmRlcikgcmV0dXJuO1xuICB0aGlzLl9yZXF1ZXN0aW5nUmVuZGVyID0gdHJ1ZTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IGZhbHNlO1xuICB9KTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnNjcm9sbCA9IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSwgb3B0X3NjcmVlblBpeGVscykge1xuICBpZiAob3B0X3NjcmVlblBpeGVscykge1xuICAgIGRlbHRhWCAvPSB0aGlzLl9zY3JlZW5UaWxlV2lkdGg7XG4gICAgZGVsdGFZIC89IHRoaXMuX3NjcmVlblRpbGVIZWlnaHQ7XG4gIH1cblxuICB0aGlzLmNlbnRlclggKz0gZGVsdGFYO1xuICB0aGlzLmNlbnRlclkgKz0gZGVsdGFZO1xuXG4gIGlmICh0aGlzLmNlbnRlclggPCAwKSB7XG4gICAgdGhpcy5jZW50ZXJYICs9IHRoaXMuX3RpbGVzWDtcbiAgfSBlbHNlIGlmICh0aGlzLmNlbnRlclggPj0gdGhpcy5fdGlsZXNYKSB7XG4gICAgdGhpcy5jZW50ZXJYIC09IHRoaXMuX3RpbGVzWDtcbiAgfVxuXG4gIHRoaXMuX2NhbGN1bGF0ZVJlZ2lvbnMoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnNldFdvcmxkID0gZnVuY3Rpb24gKHdvcmxkKSB7XG4gIGlmICghd29ybGQgfHwgISh3b3JsZCBpbnN0YW5jZW9mIFdvcmxkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB3b3JsZCcpO1xuICB9XG5cbiAgdGhpcy51bmxvYWQoKTtcblxuICB0aGlzLndvcmxkID0gd29ybGQ7XG4gIHRoaXMuX2xvYWRNZXRhZGF0YSgpO1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuc2V0Wm9vbSA9IGZ1bmN0aW9uICh6b29tKSB7XG4gIGlmICh6b29tIDwgTUlOX1pPT00pIHpvb20gPSBNSU5fWk9PTTtcbiAgaWYgKHpvb20gPiBNQVhfWk9PTSkgem9vbSA9IE1BWF9aT09NO1xuICBpZiAoem9vbSA9PSB0aGlzLnpvb20pIHJldHVybjtcblxuICB0aGlzLnpvb20gPSB6b29tO1xuICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUudW5sb2FkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuem9vbSA9IDE7XG4gIHRoaXMuY2VudGVyWCA9IDA7XG4gIHRoaXMuY2VudGVyWSA9IDA7XG5cbiAgdGhpcy5fdGlsZXNYID0gMDtcbiAgdGhpcy5fdGlsZXNZID0gMDtcbiAgdGhpcy5fcmVnaW9uc1ggPSAwO1xuICB0aGlzLl9yZWdpb25zWSA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9jYW52YXNQb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvb2xJdGVtID0gdGhpcy5fY2FudmFzUG9vbFtpXTtcbiAgICBwb29sSXRlbS5yZWdpb24gPSBudWxsO1xuICAgIHBvb2xJdGVtLmNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIH1cblxuICAvLyBVbmxvYWQgcmVnaW9ucyB0byByZW1vdmUgY3ljbGljIHJlZmVyZW5jZXMuXG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl9yZWdpb25zKSB7XG4gICAgdGhpcy5fcmVnaW9uc1trZXldLnVubG9hZCgpO1xuICB9XG4gIHRoaXMuX3JlZ2lvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYmFja2dyb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaW1hZ2UgPSB0aGlzLmFzc2V0cy5nZXRJbWFnZSh0aGlzLl9iYWNrZ3JvdW5kc1tpXS5pbWFnZSk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICB0aGlzLnZpZXdwb3J0LnJlbW92ZUNoaWxkKGltYWdlKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5fYmFja2dyb3VuZHMgPSBbXTtcblxuICB0aGlzLndvcmxkID0gbnVsbDtcblxuICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcblxuICB0aGlzLmVtaXQoJ3VubG9hZCcpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuem9vbUluID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNldFpvb20odGhpcy56b29tICsgdGhpcy56b29tICogLjEpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuem9vbU91dCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zZXRab29tKHRoaXMuem9vbSAtIHRoaXMuem9vbSAqIC4xKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLl9jYWxjdWxhdGVSZWdpb25zID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuX2Zyb21SZWdpb25YID0gTWF0aC5mbG9vcih0aGlzLmNlbnRlclggLyBUSUxFU19YIC0gdGhpcy5fYm91bmRzLndpZHRoIC8gMiAvIHRoaXMuc2NyZWVuUmVnaW9uV2lkdGgpIC0gMTtcbiAgdGhpcy5fZnJvbVJlZ2lvblkgPSBNYXRoLmZsb29yKHRoaXMuY2VudGVyWSAvIFRJTEVTX1kgLSB0aGlzLl9ib3VuZHMuaGVpZ2h0IC8gMiAvIHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0KSAtIDI7XG4gIHRoaXMuX3RvUmVnaW9uWCA9IHRoaXMuX2Zyb21SZWdpb25YICsgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYO1xuICB0aGlzLl90b1JlZ2lvblkgPSB0aGlzLl9mcm9tUmVnaW9uWSArIHRoaXMuX3Zpc2libGVSZWdpb25zWTtcblxuICB0aGlzLnZpZXdwb3J0WCA9IHRoaXMuY2VudGVyWCAqIHRoaXMuX3NjcmVlblRpbGVXaWR0aCAtIHRoaXMuX2JvdW5kcy53aWR0aCAvIDIsXG4gIHRoaXMudmlld3BvcnRZID0gdGhpcy5jZW50ZXJZICogdGhpcy5fc2NyZWVuVGlsZUhlaWdodCAtIHRoaXMuX2JvdW5kcy5oZWlnaHQgLyAyO1xuXG4gIHRoaXMucmVxdWVzdFJlbmRlcigpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2NhbGN1bGF0ZVZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIHRoaXMuX3NldHVwID0gdHJ1ZTtcblxuICB0aGlzLnNjcmVlblJlZ2lvbldpZHRoID0gTWF0aC5yb3VuZChSRUdJT05fV0lEVEggKiB0aGlzLnpvb20pO1xuICB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCA9IE1hdGgucm91bmQoUkVHSU9OX0hFSUdIVCAqIHRoaXMuem9vbSk7XG4gIHRoaXMuX3NjcmVlblRpbGVXaWR0aCA9IHRoaXMuc2NyZWVuUmVnaW9uV2lkdGggLyBUSUxFU19YO1xuICB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0ID0gdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgLyBUSUxFU19ZO1xuXG4gIHRoaXMuX2JvdW5kcyA9IHRoaXMudmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWCA9IE1hdGguY2VpbCh0aGlzLl9ib3VuZHMud2lkdGggLyB0aGlzLnNjcmVlblJlZ2lvbldpZHRoICsgMyk7XG4gIHRoaXMuX3Zpc2libGVSZWdpb25zWSA9IE1hdGguY2VpbCh0aGlzLl9ib3VuZHMuaGVpZ2h0IC8gdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgKyAzKTtcblxuICB0aGlzLl9jYWxjdWxhdGVSZWdpb25zKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fbG9hZE1ldGFkYXRhID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3Bhd24sIHNpemU7XG5cbiAgdGhpcy5jZW50ZXJYID0gdGhpcy53b3JsZC5zcGF3blg7XG4gIHRoaXMuY2VudGVyWSA9IHRoaXMud29ybGQuc3Bhd25ZO1xuXG4gIHRoaXMuX3RpbGVzWCA9IHRoaXMud29ybGQudGlsZXNYO1xuICB0aGlzLl90aWxlc1kgPSB0aGlzLndvcmxkLnRpbGVzWTtcblxuICAvLyBUT0RPOiBGaWd1cmUgb3V0IHdoeSBzb21lIHdvcmxkIHNpemVzIGFyZW4ndCBkaXZpc2libGUgYnkgMzIuXG4gIHRoaXMuX3JlZ2lvbnNYID0gTWF0aC5jZWlsKHRoaXMuX3RpbGVzWCAvIFRJTEVTX1gpO1xuICB0aGlzLl9yZWdpb25zWSA9IE1hdGguY2VpbCh0aGlzLl90aWxlc1kgLyBUSUxFU19ZKTtcblxuICBpZiAodGhpcy53b3JsZC5tZXRhZGF0YS5jZW50cmFsU3RydWN0dXJlKSB7XG4gICAgdGhpcy5fYmFja2dyb3VuZHMgPSB0aGlzLndvcmxkLm1ldGFkYXRhLmNlbnRyYWxTdHJ1Y3R1cmUuYmFja2dyb3VuZE92ZXJsYXlzO1xuICB9XG5cbiAgdGhpcy5fbG9hZGVkID0gdHJ1ZTtcblxuICB0aGlzLmVtaXQoJ2xvYWQnKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLl9wcmVwYXJlQ2FudmFzUG9vbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGZyZWVQb29sID0gW10sIHBvb2xMb29rdXAgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9jYW52YXNQb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvb2xJdGVtID0gdGhpcy5fY2FudmFzUG9vbFtpXSxcbiAgICAgICAgcmVnaW9uID0gcG9vbEl0ZW0ucmVnaW9uO1xuXG4gICAgaWYgKHJlZ2lvbiAmJiB0aGlzLmlzUmVnaW9uVmlzaWJsZShyZWdpb24pKSB7XG4gICAgICBwb29sTG9va3VwW3JlZ2lvbi54ICsgJzonICsgcmVnaW9uLnkgKyAnOicgKyBwb29sSXRlbS56XSA9IHBvb2xJdGVtO1xuICAgIH0gZWxzZSB7XG4gICAgICBwb29sSXRlbS5jYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgZnJlZVBvb2wucHVzaChwb29sSXRlbSk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5fZnJlZVBvb2wgPSBmcmVlUG9vbDtcbiAgdGhpcy5fcG9vbExvb2t1cCA9IHBvb2xMb29rdXA7XG59O1xuIiwiXG50cnkge1xuICB2YXIgdWEgPSByZXF1aXJlKCd1YV9wYXJzZXIvc3JjL2pzL3VzZXJBZ2VudCcpLnV0aWwudXNlckFnZW50KClcbiAgdmFyIGIgPSB1YS5icm93c2VyXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJyb3dzZXI6IGIubmFtZSxcbiAgICBvczogdWEub3MubmFtZSxcbiAgICBwbGF0Zm9ybTogdWEucGxhdGZvcm0sXG4gICAgdmVyc2lvbjogYi52ZXJzaW9uXG4gIH1cbn0gY2F0Y2ggKGVycikge1xuICBpZihjb25zb2xlKSBjb25zb2xlLmVycm9yKGVycilcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYnJvd3NlcjogJ3Vua25vd24nLFxuICAgIG9zOiAndW5rbm93bicsXG4gICAgcGxhdGZvcm06ICd1bmtub3duJyxcbiAgICB2ZXJzaW9uOiB7aW5mbzogJz8uPy4/J31cbiAgfVxufVxuXG4iLCIvKmpzaGludCBicm93c2VyOiB0cnVlXHJcbiovXHJcbi8qZ2xvYmFsIHNsaWRlLCBDbGFzcywgZ2VzdHVyZSovXHJcblxyXG4oZnVuY3Rpb24gKGV4cG9ydHMpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgdXNlckFnZW50ID0gZXhwb3J0cy51c2VyQWdlbnQgPSBmdW5jdGlvbiAodWEpIHtcclxuICAgICAgICB1YSA9ICh1YSB8fCB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrVXNlckFnZW50KHVhKSB7XHJcbiAgICAgICAgICAgIHZhciBicm93c2VyID0ge307XHJcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IC8oZG9sZmluKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8oY2hyb21lKVsgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8od2Via2l0KSg/Oi4qdmVyc2lvbik/WyBcXC9dKFtcXHcuXSspLy5leGVjKCB1YSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgLyhvcGVyYSkoPzouKnZlcnNpb24pP1sgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8obXNpZSkgKFtcXHcuXSspLy5leGVjKCB1YSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdWEuaW5kZXhPZihcImNvbXBhdGlibGVcIikgPCAwICYmIC8obW96aWxsYSkoPzouKj8gcnY6KFtcXHcuXSspKT8vLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICBbXCJcIixcInVua25vd25cIl07XHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXSA9PT0gXCJ3ZWJraXRcIikge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSAvKGlwaG9uZXxpcGFkfGlwb2QpW1xcU1xcc10qb3MgKFtcXHcuX1xcLV0rKSBsaWtlLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8oYW5kcm9pZClbIFxcL10oW1xcdy5fXFwtXSspOy8uZXhlYyh1YSkgfHwgW21hdGNoWzBdLCBcInNhZmFyaVwiLCBtYXRjaFsyXV07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwibW96aWxsYVwiKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsxXSA9IFwiZmlyZWZveFwiO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9wb2xhcmlzfG5hdGVicm93c2VyfChbMDEwfDAxMXwwMTZ8MDE3fDAxOHwwMTldezN9XFxkezMsNH1cXGR7NH0kKS8udGVzdCh1YSkpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzFdID0gXCJwb2xhcmlzXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJyb3dzZXJbbWF0Y2hbMV1dID0gdHJ1ZTtcclxuICAgICAgICAgICAgYnJvd3Nlci5uYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGJyb3dzZXIudmVyc2lvbiA9IHt9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHZlcnNpb25zID0gbWF0Y2hbMl0gPyBtYXRjaFsyXS5zcGxpdCgvXFwufC18Xy8pIDogW1wiMFwiLFwiMFwiLFwiMFwiXTtcclxuICAgICAgICAgICAgYnJvd3Nlci52ZXJzaW9uLmluZm8gPSB2ZXJzaW9ucy5qb2luKFwiLlwiKTtcclxuICAgICAgICAgICAgYnJvd3Nlci52ZXJzaW9uLm1ham9yID0gdmVyc2lvbnNbMF0gfHwgXCIwXCI7XHJcbiAgICAgICAgICAgIGJyb3dzZXIudmVyc2lvbi5taW5vciA9IHZlcnNpb25zWzFdIHx8IFwiMFwiO1xyXG4gICAgICAgICAgICBicm93c2VyLnZlcnNpb24ucGF0Y2ggPSB2ZXJzaW9uc1syXSB8fCBcIjBcIjtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBicm93c2VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjaGVja1BsYXRmb3JtICh1YSkge1xyXG4gICAgICAgICAgICBpZiAoaXNQYyh1YSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInBjXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNUYWJsZXQodWEpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZXRcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc01vYmlsZSh1YSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIm1vYmlsZVwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaXNQYyAodWEpIHtcclxuICAgICAgICAgICAgaWYgKHVhLm1hdGNoKC9saW51eHx3aW5kb3dzIChudHw5OCl8bWFjaW50b3NoLykgJiYgIXVhLm1hdGNoKC9hbmRyb2lkfG1vYmlsZXxwb2xhcmlzfGxndGVsZWNvbXx1emFyZHxuYXRlYnJvd3NlcnxrdGY7fHNrdDsvKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc1RhYmxldCAodWEpIHtcclxuICAgICAgICAgICAgaWYgKHVhLm1hdGNoKC9pcGFkLykgfHwgKHVhLm1hdGNoKC9hbmRyb2lkLykgJiYgIXVhLm1hdGNoKC9tb2JpfG1pbml8ZmVubmVjLykpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzTW9iaWxlICh1YSkge1xyXG4gICAgICAgICAgICBpZiAoISF1YS5tYXRjaCgvaXAoaG9uZXxvZCl8YW5kcm9pZC4rbW9iaWxlfHdpbmRvd3MgKGNlfHBob25lKXxibGFja2JlcnJ5fHN5bWJpYW58d2Vib3N8ZmlyZWZveC4rZmVubmVjfG9wZXJhIG0ob2J8aW4paXxwb2xhcmlzfGllbW9iaWxlfGxndGVsZWNvbXxub2tpYXxzb255ZXJpY3Nzb258ZG9sZmlufHV6YXJkfG5hdGVicm93c2VyfGt0Zjt8c2t0Oy8pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBmdW5jdGlvbiBjaGVja09zICh1YSkge1xyXG4gICAgICAgICAgICB2YXIgb3MgPSB7fSxcclxuICAgICAgICAgICAgICAgIG1hdGNoID0gKC9hbmRyb2lkLy50ZXN0KHVhKT8gXCJhbmRyb2lkXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC9saWtlIG1hYyBvcyB4Li8udGVzdCh1YSk/IFwiaW9zXCIgOiBmYWxzZSl8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoLyhtYWMgb3MpLy50ZXN0KHVhKT8gXCJtYWNcIiA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoL3BvbGFyaXN8bmF0ZWJyb3dzZXJ8KFswMTB8MDExfDAxNnwwMTd8MDE4fDAxOV17M31cXGR7Myw0fVxcZHs0fSQpLy50ZXN0KHVhKT8gXCJwb2xhcmlzXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC8od2luZG93cykvLnRlc3QodWEpPyBcIndpbmRvd3NcIiA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoLyhsaW51eCkvLnRlc3QodWEpPyBcImxpbnV4XCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC93ZWJvcy8udGVzdCh1YSk/IFwid2Vib3NcIiA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoL2JhZGEvLnRlc3QodWEpPyBcImJhZGFcIiA6IGZhbHNlKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoLyhyaW18YmxhY2tiZXJyeSkvLnRlc3QodWEpPyBcImJsYWNrYmVycnlcIiA6IGZhbHNlKSB8fCBcInVua25vd25cIjtcclxuICAgICAgICAgICAgb3NbbWF0Y2hdID0gdHJ1ZTtcclxuICAgICAgICAgICAgb3MubmFtZSA9IG1hdGNoO1xyXG4gICAgICAgICAgICByZXR1cm4gb3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1YTogdWEsXHJcbiAgICAgICAgICAgIGJyb3dzZXI6IGNoZWNrVXNlckFnZW50KHVhKSxcclxuICAgICAgICAgICAgcGxhdGZvcm06IGNoZWNrUGxhdGZvcm0odWEpLFxyXG4gICAgICAgICAgICBvczogY2hlY2tPcyh1YSlcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbn0pKChmdW5jdGlvbiAoKXtcclxuICAgIC8vIE1ha2UgdXNlckFnZW50IGEgTm9kZSBtb2R1bGUsIGlmIHBvc3NpYmxlLlxyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGV4cG9ydHMudXRpbCA9ICh0eXBlb2YgZXhwb3J0cy51dGlsID09PSAndW5kZWZpbmVkJykgPyB7fSA6IGV4cG9ydHMudXRpbDtcclxuICAgICAgICByZXR1cm4gZXhwb3J0cy51dGlsO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHdpbmRvdy51dGlsID0gKHR5cGVvZiB3aW5kb3cudXRpbCA9PT0gJ3VuZGVmaW5lZCcpID8ge30gOiB3aW5kb3cudXRpbDtcclxuICAgICAgICByZXR1cm4gd2luZG93LnV0aWw7XHJcbiAgICB9XHJcbn0pKCkpO1xyXG4iXX0=

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvZmFrZV82MjlhNDI0Mi5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL3N0YXJib3VuZC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbGliL3VpL29zLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9saWIvdWkvcHJvZ3Jlc3MuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi91aS93ZWItc2VsZWN0b3IuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL2xpYi91aS93b3JsZC1zZWxlY3Rvci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2VzNmlmeS9ub2RlX21vZHVsZXMvdHJhY2V1ci9zcmMvcnVudGltZS9ydW50aW1lLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL29uY2Uvb25jZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL2xpYi9hc3NldHNtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9saWIvcmVzb3VyY2Vsb2FkZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtYXNzZXRzL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L2NvbnZlcnNpb25zLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1hc3NldHMvbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWFzc2V0cy9ub2RlX21vZHVsZXMvd29ya2VycHJveHkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbGliL3JlZ2lvbnJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9saWIvd29ybGRtYW5hZ2VyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL2xpYi93b3JsZHJlbmRlcmVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvdXNlcmFnZW50LXd0Zi9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3VzZXJhZ2VudC13dGYvbm9kZV9tb2R1bGVzL3VhX3BhcnNlci9zcmMvanMvdXNlckFnZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUksR0FBQSxVQUFBLEVBQVksUUFBTyxDQUFDLGlCQUFBLENBQUEsQ0FBQSxLQUF3QixDQUFDLFFBQUEsQ0FBQSxjQUF1QixDQUFDLFVBQUEsQ0FBQSxDQUFBO0FBR3pFLE9BQU8sQ0FBQyxhQUFBLENBQWMsQ0FBQSxDQUFBO0FBQ3RCLE9BQU8sQ0FBQyxtQkFBQSxDQUFvQixDQUFDLFNBQUEsQ0FBQTtBQUM3QixPQUFPLENBQUMs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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGtCQSxDQUFDLFFBQUEsQ0FBVSxTQUFBLENBQVc7QUFNZCxLQUFBLE9BQUE7QUFDQSxhQUFBLEVBQVUsUUFBQTtBQUNWLFlBQUEsRUFBUyxLQUFBO0FBQ1QsV0FBQSxFQUFRLEtBQUEsQ0FBQSxLQUFBO0FBQ1IsT0FBQTtBQUVBLFVBQUEsRUFBTyxFQUFBO0FBQ1AsV0FBQSxFQUFRLEVBQUE7QUFDUixVQUFBLEVBQU8sRUFBQTtBQUNQLFVBQUEsRUFBTyxFQUFBO0FBQ1AsWUFBQSxFQUFTLEVBQUE7QUFDVCxZQUFBLEVBQVMsRUFBQTtBQUNULGlCQUFBLEVBQWMsRUFBQTtBQUdkLGVBQUEsRUFBWSxFQUFBLENBQUE7QUFHWixzQkFBQSxFQUFtQjtBQUNmLHdCQUFBLENBQWtCLEtBQUE7QUFDbEIsVUFBQSxDQUFLLEtBQUE7QUFDTCxVQUFBLENBQUssS0FBQTtBQUNMLFVBQUEsQ0FBSyxLQUFBO0FBQ0wsZUFBQSxDQUFVLEtBQUE7QUFDVixjQUFBLENBQVMsS0FBQTtBQUNULGVBQUEsQ0FBVSxLQUFBO0FBQ1YsV0FBQSxDQUFNLEtBQUE7QUFDTixhQUFBLENBQVE7QUFBQSxPQUFBO0FBSVosZUFBQSxFQUFZLEVBQUMsTUFBTyxPQUFBLElBQVcsWUFBQSxHQUFlLE9BQUEsQ0FBQSxPQUFBLEdBQWtCLE9BQU8sUUFBQSxJQUFZLFlBQUEsQ0FBQTtBQUduRixxQkFBQSxFQUFrQixzQkFBQTtBQUNsQiw2QkFBQSxFQUEwQix1REFBQTtBQUkxQixzQkFBQSxFQUFtQixnSUFBQTtBQUduQixzQkFBQSxFQUFtQixpS0FBQTtBQUNuQiwyQkFBQSxFQUF3Qix5Q0FBQTtBQUd4Qiw4QkFBQSxFQUEyQixRQUFBO0FBQzNCLGdDQUFBLEVBQTZCLFVBQUE7QUFDN0IsK0JBQUEsRUFBNEIsVUFBQTtBQUM1Qiw4QkFBQSxFQUEyQixnQkFBQTtBQUMzQixzQkFBQSxFQUFtQixNQUFBO0FBQ25CLG9CQUFBLEVBQWlCLG1IQUFBO0FBQ2pCLHdCQUFBLEVBQXFCLHVCQUFBO0FBQ3JCLGlCQUFBLEVBQWMsS0FBQTtBQUNkLDJCQUFBLEVBQXdCLHlCQUFBO0FBR3hCLHdCQUFBLEVBQXFCLEtBQUE7QUFDckIseUJBQUEsRUFBc0IsT0FBQTtBQUN0QiwyQkFBQSxFQUF3QixRQUFBO0FBQ3hCLDBCQUFBLEVBQXVCLFFBQUE7QUFDdkIseUJBQUEsRUFBc0IsYUFBQTtBQUN0Qiw0QkFBQSxFQUF5QixXQUFBO0FBSXpCLGNBQUEsRUFBVyw0SUFBQTtBQUVYLGVBQUEsRUFBWSx1QkFBQTtBQUVaLGNBQUEsRUFBVyxFQUNQLENBQUMsY0FBQSxDQUFnQix3QkFBQSxDQUFBLENBQ2pCLEVBQUMsWUFBQSxDQUFjLG9CQUFBLENBQUEsQ0FDZixFQUFDLGNBQUEsQ0FBZ0Isa0JBQUEsQ0FBQSxDQUNqQixFQUFDLFlBQUEsQ0FBYyxlQUFBLENBQUEsQ0FDZixFQUFDLFVBQUEsQ0FBWSxjQUFBLENBQUEsQ0FBQTtBQUlqQixjQUFBLEVBQVcsRUFDUCxDQUFDLGVBQUEsQ0FBaUIsK0JBQUEsQ0FBQSxDQUNsQixFQUFDLFVBQUEsQ0FBWSxzQkFBQSxDQUFBLENBQ2IsRUFBQyxPQUFBLENBQVMsaUJBQUEsQ0FBQSxDQUNWLEVBQUMsSUFBQSxDQUFNLFlBQUEsQ0FBQSxDQUFBO0FBSVgsMEJBQUEsRUFBdUIsa0JBQUE7QUFHdkIsNEJBQUEsRUFBeUIsMENBQUEsQ0FBQSxLQUErQyxDQUFDLEdBQUEsQ0FBQTtBQUN6RSw0QkFBQSxFQUF5QjtBQUNyQixzQkFBQSxDQUFpQixFQUFBO0FBQ2pCLGlCQUFBLENBQVksSUFBQTtBQUNaLGlCQUFBLENBQVksSUFBQTtBQUNaLGVBQUEsQ0FBVSxLQUFBO0FBQ1YsY0FBQSxDQUFTLE1BQUE7QUFDVCxnQkFBQSxDQUFXLE9BQUE7QUFDWCxlQUFBLENBQVU7QUFBQSxPQUFBO0FBR2QsaUJBQUEsRUFBYztBQUNWLFVBQUEsQ0FBSyxjQUFBO0FBQ0wsU0FBQSxDQUFJLFNBQUE7QUFDSixTQUFBLENBQUksU0FBQTtBQUNKLFNBQUEsQ0FBSSxPQUFBO0FBQ0osU0FBQSxDQUFJLE1BQUE7QUFDSixTQUFBLENBQUksT0FBQTtBQUNKLFNBQUEsQ0FBSSxPQUFBO0FBQ0osU0FBQSxDQUFJLFVBQUE7QUFDSixTQUFBLENBQUksUUFBQTtBQUNKLFNBQUEsQ0FBSSxPQUFBO0FBQ0osV0FBQSxDQUFNLFlBQUE7QUFDTixTQUFBLENBQUksVUFBQTtBQUNKLFNBQUEsQ0FBSSxhQUFBO0FBQ0osVUFBQSxDQUFJLFdBQUE7QUFDSixVQUFBLENBQUk7QUFBQSxPQUFBO0FBR1Isb0JBQUEsRUFBaUI7QUFDYixpQkFBQSxDQUFZLFlBQUE7QUFDWixrQkFBQSxDQUFhLGFBQUE7QUFDYixlQUFBLENBQVUsVUFBQTtBQUNWLGdCQUFBLENBQVcsV0FBQTtBQUNYLG1CQUFBLENBQWM7QUFBQSxPQUFBO0FBSWxCLHFCQUFBLEVBQWtCLEVBQUEsQ0FBQTtBQUdsQixzQkFBQSxFQUFtQixnQkFBQSxDQUFBLEtBQXFCLENBQUMsR0FBQSxDQUFBO0FBQ3pDLGtCQUFBLEVBQWUsa0JBQUEsQ0FBQSxLQUF1QixDQUFDLEdBQUEsQ0FBQTtBQUV2QywwQkFBQSxFQUF1QjtBQUNuQixTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsRUFBSyxFQUFBO0FBQUEsU0FBQTtBQUUxQixXQUFBLENBQU8sU0FBQSxDQUFVLE1BQUEsQ0FBUTtBQUNyQixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxXQUFjLENBQUMsSUFBQSxDQUFNLE9BQUEsQ0FBQTtBQUFBLFNBQUE7QUFFekMsWUFBQSxDQUFPLFNBQUEsQ0FBVSxNQUFBLENBQVE7QUFDckIsZ0JBQU8sS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUEsTUFBUyxDQUFDLElBQUEsQ0FBTSxPQUFBLENBQUE7QUFBQSxTQUFBO0FBRXBDLFNBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFcEIsV0FBQSxDQUFPLFNBQUEsQ0FBVSxDQUFFO0FBQ2YsZ0JBQU8sS0FBQSxDQUFBLFNBQWMsQ0FBQSxDQUFBO0FBQUEsU0FBQTtBQUV6QixTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsR0FBUSxDQUFBLENBQUE7QUFBQSxTQUFBO0FBRW5CLFVBQUEsQ0FBTyxTQUFBLENBQVUsTUFBQSxDQUFRO0FBQ3JCLGdCQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLFdBQWMsQ0FBQyxJQUFBLENBQU0sT0FBQSxDQUFBO0FBQUEsU0FBQTtBQUV6QyxXQUFBLENBQU8sU0FBQSxDQUFVLE1BQUEsQ0FBUTtBQUNyQixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxhQUFnQixDQUFDLElBQUEsQ0FBTSxPQUFBLENBQUE7QUFBQSxTQUFBO0FBRTNDLFlBQUEsQ0FBTyxTQUFBLENBQVUsTUFBQSxDQUFRO0FBQ3JCLGdCQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLFFBQVcsQ0FBQyxJQUFBLENBQU0sT0FBQSxDQUFBO0FBQUEsU0FBQTtBQUV0QyxTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUE7QUFBQSxTQUFBO0FBRXBCLFNBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFdkIsVUFBQSxDQUFPLFNBQUEsQ0FBVSxDQUFFO0FBQ2YsZ0JBQU8sYUFBWSxDQUFDLElBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxFQUFLLElBQUEsQ0FBSyxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRTNDLFlBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBSSxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRXJDLGFBQUEsQ0FBUSxTQUFBLENBQVUsQ0FBRTtBQUNoQixnQkFBTyxhQUFZLENBQUMsSUFBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUEsU0FBQTtBQUVyQyxjQUFBLENBQVMsU0FBQSxDQUFVLENBQUU7QUFDYixhQUFBLEVBQUEsRUFBSSxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUE7QUFBSSxrQkFBQSxFQUFPLEVBQUEsR0FBSyxFQUFBLEVBQUksSUFBQSxDQUFNLElBQUE7QUFDM0MsZ0JBQU8sS0FBQSxFQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsR0FBUSxDQUFDLENBQUEsQ0FBQSxDQUFJLEVBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFNUMsVUFBQSxDQUFPLFNBQUEsQ0FBVSxDQUFFO0FBQ2YsZ0JBQU8sYUFBWSxDQUFDLElBQUEsQ0FBQSxRQUFhLENBQUEsQ0FBQSxFQUFLLElBQUEsQ0FBSyxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRS9DLFlBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsUUFBYSxDQUFBLENBQUEsQ0FBSSxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRXpDLGFBQUEsQ0FBUSxTQUFBLENBQVUsQ0FBRTtBQUNoQixnQkFBTyxhQUFZLENBQUMsSUFBQSxDQUFBLFFBQWEsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUEsU0FBQTtBQUV6QyxVQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxhQUFZLENBQUMsSUFBQSxDQUFBLFdBQWdCLENBQUEsQ0FBQSxFQUFLLElBQUEsQ0FBSyxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRWxELFlBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsV0FBZ0IsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUEsU0FBQTtBQUU1QyxhQUFBLENBQVEsU0FBQSxDQUFVLENBQUU7QUFDaEIsZ0JBQU8sYUFBWSxDQUFDLElBQUEsQ0FBQSxXQUFnQixDQUFBLENBQUEsQ0FBSSxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRTVDLFNBQUEsQ0FBSSxTQUFBLENBQVUsQ0FBRTtBQUNaLGdCQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFdkIsU0FBQSxDQUFJLFNBQUEsQ0FBVSxDQUFFO0FBQ1osZ0JBQU8sS0FBQSxDQUFBLFVBQWUsQ0FBQSxDQUFBO0FBQUEsU0FBQTtBQUUxQixTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxRQUFXLENBQUMsSUFBQSxDQUFBLEtBQVUsQ0FBQSxDQUFBLENBQUksS0FBQSxDQUFBLE9BQVksQ0FBQSxDQUFBLENBQUksS0FBQSxDQUFBO0FBQUEsU0FBQTtBQUU5RCxTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxRQUFXLENBQUMsSUFBQSxDQUFBLEtBQVUsQ0FBQSxDQUFBLENBQUksS0FBQSxDQUFBLE9BQVksQ0FBQSxDQUFBLENBQUksTUFBQSxDQUFBO0FBQUEsU0FBQTtBQUU5RCxTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUE7QUFBQSxTQUFBO0FBRXJCLFNBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLEtBQUEsQ0FBQSxLQUFVLENBQUEsQ0FBQSxFQUFLLEdBQUEsR0FBTSxHQUFBO0FBQUEsU0FBQTtBQUVoQyxTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsT0FBWSxDQUFBLENBQUE7QUFBQSxTQUFBO0FBRXZCLFNBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFdkIsU0FBQSxDQUFPLFNBQUEsQ0FBVSxDQUFFO0FBQ2YsZ0JBQU8sTUFBSyxDQUFDLElBQUEsQ0FBQSxZQUFpQixDQUFBLENBQUEsRUFBSyxJQUFBLENBQUE7QUFBQSxTQUFBO0FBRXZDLFVBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLGFBQVksQ0FBQyxLQUFLLENBQUMsSUFBQSxDQUFBLFlBQWlCLENBQUEsQ0FBQSxFQUFLLEdBQUEsQ0FBQSxDQUFLLEVBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFekQsV0FBQSxDQUFPLFNBQUEsQ0FBVSxDQUFFO0FBQ2YsZ0JBQU8sYUFBWSxDQUFDLElBQUEsQ0FBQSxZQUFpQixDQUFBLENBQUEsQ0FBSSxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRTdDLFlBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLGdCQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsWUFBaUIsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUEsU0FBQTtBQUU3QyxTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDWCxhQUFBLEVBQUEsRUFBSSxFQUFDLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQTtBQUNkLGVBQUEsRUFBSSxJQUFBO0FBQ1IsWUFBQSxFQUFJLENBQUEsRUFBSSxFQUFBLENBQUc7QUFDUCxhQUFBLEVBQUksRUFBQyxFQUFBO0FBQ0wsYUFBQSxFQUFJLElBQUE7QUFBQTtBQUVSLGdCQUFPLEVBQUEsRUFBSSxhQUFZLENBQUMsS0FBSyxDQUFDLENBQUEsRUFBSSxHQUFBLENBQUEsQ0FBSyxFQUFBLENBQUEsRUFBSyxJQUFBLEVBQU0sYUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBLENBQUEsRUFBSyxHQUFBLENBQUksRUFBQSxDQUFBO0FBQUEsU0FBQTtBQUVsRixVQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDWCxhQUFBLEVBQUEsRUFBSSxFQUFDLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQTtBQUNkLGVBQUEsRUFBSSxJQUFBO0FBQ1IsWUFBQSxFQUFJLENBQUEsRUFBSSxFQUFBLENBQUc7QUFDUCxhQUFBLEVBQUksRUFBQyxFQUFBO0FBQ0wsYUFBQSxFQUFJLElBQUE7QUFBQTtBQUVSLGdCQUFPLEVBQUEsRUFBSSxhQUFZLENBQUMsS0FBSyxDQUFDLENBQUEsRUFBSSxHQUFBLENBQUEsQ0FBSyxFQUFBLENBQUEsRUFBSyxhQUFZLENBQUMsS0FBSyxDQUFDLENBQUEsQ0FBQSxFQUFLLEdBQUEsQ0FBSSxFQUFBLENBQUE7QUFBQSxTQUFBO0FBRTVFLFNBQUEsQ0FBSSxTQUFBLENBQVUsQ0FBRTtBQUNaLGdCQUFPLEtBQUEsQ0FBQSxRQUFhLENBQUEsQ0FBQTtBQUFBLFNBQUE7QUFFeEIsVUFBQSxDQUFLLFNBQUEsQ0FBVSxDQUFFO0FBQ2IsZ0JBQU8sS0FBQSxDQUFBLFFBQWEsQ0FBQSxDQUFBO0FBQUEsU0FBQTtBQUV4QixTQUFBLENBQU8sU0FBQSxDQUFVLENBQUU7QUFDZixnQkFBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUE7QUFBQSxTQUFBO0FBRXBCLFNBQUEsQ0FBSSxTQUFBLENBQVUsQ0FBRTtBQUNaLGdCQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUFBO0FBQUEsT0FBQTtBQUkzQixXQUFBLEVBQVEsRUFBQyxRQUFBLENBQVUsY0FBQSxDQUFlLFdBQUEsQ0FBWSxnQkFBQSxDQUFpQixjQUFBLENBQUE7QUFFbkUsVUFBUyxvQkFBQSxDQUFvQixDQUFFO0FBRzNCLFVBQU87QUFDSCxXQUFBLENBQVEsTUFBQTtBQUNSLGtCQUFBLENBQWUsRUFBQSxDQUFBO0FBQ2YsaUJBQUEsQ0FBYyxFQUFBLENBQUE7QUFDZCxjQUFBLENBQVcsRUFBQyxFQUFBO0FBQ1osbUJBQUEsQ0FBZ0IsRUFBQTtBQUNoQixlQUFBLENBQVksTUFBQTtBQUNaLGtCQUFBLENBQWUsS0FBQTtBQUNmLG1CQUFBLENBQWdCLE1BQUE7QUFDaEIscUJBQUEsQ0FBa0IsTUFBQTtBQUNsQixTQUFBLENBQUs7QUFBQSxLQUFBO0FBQUE7QUFJYixVQUFTLFNBQUEsQ0FBUyxJQUFBLENBQU0sTUFBQSxDQUFPO0FBQzNCLFVBQU8sU0FBQSxDQUFVLENBQUEsQ0FBRztBQUNoQixZQUFPLGFBQVksQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFDLElBQUEsQ0FBTSxFQUFBLENBQUEsQ0FBSSxNQUFBLENBQUE7QUFBQSxLQUFBO0FBQUE7QUFHaEQsVUFBUyxnQkFBQSxDQUFnQixJQUFBLENBQU0sT0FBQSxDQUFRO0FBQ25DLFVBQU8sU0FBQSxDQUFVLENBQUEsQ0FBRztBQUNoQixZQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLE9BQVUsQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFDLElBQUEsQ0FBTSxFQUFBLENBQUEsQ0FBSSxPQUFBLENBQUE7QUFBQSxLQUFBO0FBQUE7QUFJdkQsT0FBQSxFQUFPLGdCQUFBLENBQUEsTUFBQSxDQUF5QjtBQUM1QixLQUFBLEVBQUksaUJBQUEsQ0FBQSxHQUFvQixDQUFBLENBQUE7QUFDeEIsd0JBQUEsQ0FBcUIsQ0FBQSxFQUFJLElBQUEsQ0FBQSxFQUFPLGdCQUFlLENBQUMsb0JBQUEsQ0FBcUIsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUE7QUFFN0UsT0FBQSxFQUFPLFlBQUEsQ0FBQSxNQUFBLENBQXFCO0FBQ3hCLEtBQUEsRUFBSSxhQUFBLENBQUEsR0FBZ0IsQ0FBQSxDQUFBO0FBQ3BCLHdCQUFBLENBQXFCLENBQUEsRUFBSSxFQUFBLENBQUEsRUFBSyxTQUFRLENBQUMsb0JBQUEsQ0FBcUIsQ0FBQSxDQUFBLENBQUksRUFBQSxDQUFBO0FBQUE7QUFFcEUsc0JBQUEsQ0FBQSxJQUFBLEVBQTRCLFNBQVEsQ0FBQyxvQkFBQSxDQUFBLEdBQUEsQ0FBMEIsRUFBQSxDQUFBO0FBTy9ELFVBQVMsU0FBQSxDQUFTLENBQUUsRUFBQTtBQUtwQixVQUFTLE9BQUEsQ0FBTyxNQUFBLENBQVE7QUFDcEIsaUJBQWEsQ0FBQyxNQUFBLENBQUE7QUFDZCxVQUFNLENBQUMsSUFBQSxDQUFNLE9BQUEsQ0FBQTtBQUFBO0FBSWpCLFVBQVMsU0FBQSxDQUFTLFFBQUEsQ0FBVTtBQUNwQixPQUFBLGdCQUFBLEVBQWtCLHFCQUFvQixDQUFDLFFBQUEsQ0FBQTtBQUN2QyxhQUFBLEVBQVEsZ0JBQUEsQ0FBQSxJQUFBLEdBQXdCLEVBQUE7QUFDaEMsY0FBQSxFQUFTLGdCQUFBLENBQUEsS0FBQSxHQUF5QixFQUFBO0FBQ2xDLGFBQUEsRUFBUSxnQkFBQSxDQUFBLElBQUEsR0FBd0IsRUFBQTtBQUNoQyxZQUFBLEVBQU8sZ0JBQUEsQ0FBQSxHQUFBLEdBQXVCLEVBQUE7QUFDOUIsYUFBQSxFQUFRLGdCQUFBLENBQUEsSUFBQSxHQUF3QixFQUFBO0FBQ2hDLGVBQUEsRUFBVSxnQkFBQSxDQUFBLE1BQUEsR0FBMEIsRUFBQTtBQUNwQyxlQUFBLEVBQVUsZ0JBQUEsQ0FBQSxNQUFBLEdBQTBCLEVBQUE7QUFDcEMsb0JBQUEsRUFBZSxnQkFBQSxDQUFBLFdBQUEsR0FBK0IsRUFBQTtBQUdsRCxRQUFBLENBQUEsYUFBQSxFQUFxQixFQUFDLGFBQUEsRUFDbEIsUUFBQSxFQUFVLElBQUEsRUFDVixRQUFBLEVBQVUsSUFBQSxFQUNWLE1BQUEsRUFBUSxLQUFBO0FBR1osUUFBQSxDQUFBLEtBQUEsRUFBYSxFQUFDLEtBQUEsRUFDVixNQUFBLEVBQVEsRUFBQTtBQUlaLFFBQUEsQ0FBQSxPQUFBLEVBQWUsRUFBQyxPQUFBLEVBQ1osTUFBQSxFQUFRLEdBQUE7QUFFWixRQUFBLENBQUEsS0FBQSxFQUFhLEVBQUEsQ0FBQTtBQUViLFFBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUFBO0FBUWhCLFVBQVMsT0FBQSxDQUFPLENBQUEsQ0FBRyxFQUFBLENBQUc7QUFDbEIsT0FBQSxFQUFTLEdBQUEsRUFBQSxHQUFLLEVBQUEsQ0FBRztBQUNiLFFBQUEsRUFBSSxDQUFBLENBQUEsY0FBZ0IsQ0FBQyxDQUFBLENBQUEsQ0FBSTtBQUNyQixTQUFBLENBQUUsQ0FBQSxDQUFBLEVBQUssRUFBQSxDQUFFLENBQUEsQ0FBQTtBQUFBO0FBQUE7QUFJakIsTUFBQSxFQUFJLENBQUEsQ0FBQSxjQUFnQixDQUFDLFVBQUEsQ0FBQSxDQUFhO0FBQzlCLE9BQUEsQ0FBQSxRQUFBLEVBQWEsRUFBQSxDQUFBLFFBQUE7QUFBQTtBQUdqQixNQUFBLEVBQUksQ0FBQSxDQUFBLGNBQWdCLENBQUMsU0FBQSxDQUFBLENBQVk7QUFDN0IsT0FBQSxDQUFBLE9BQUEsRUFBWSxFQUFBLENBQUEsT0FBQTtBQUFBO0FBR2hCLFVBQU8sRUFBQTtBQUFBO0FBR1gsVUFBUyxZQUFBLENBQVksQ0FBQSxDQUFHO0FBQ2hCLE9BQUEsT0FBQSxFQUFTLEVBQUEsQ0FBQTtBQUFJLFNBQUE7QUFDakIsT0FBQSxFQUFLLENBQUEsR0FBSyxFQUFBLENBQUc7QUFDVCxRQUFBLEVBQUksQ0FBQSxDQUFBLGNBQWdCLENBQUMsQ0FBQSxDQUFBLEdBQU0saUJBQUEsQ0FBQSxjQUErQixDQUFDLENBQUEsQ0FBQSxDQUFJO0FBQzNELGNBQUEsQ0FBTyxDQUFBLENBQUEsRUFBSyxFQUFBLENBQUUsQ0FBQSxDQUFBO0FBQUE7QUFBQTtBQUl0QixVQUFPLE9BQUE7QUFBQTtBQUdYLFVBQVMsU0FBQSxDQUFTLE1BQUEsQ0FBUTtBQUN0QixNQUFBLEVBQUksTUFBQSxFQUFTLEVBQUEsQ0FBRztBQUNaLFlBQU8sS0FBQSxDQUFBLElBQVMsQ0FBQyxNQUFBLENBQUE7QUFBQSxLQUFBLEtBQ2Q7QUFDSCxZQUFPLEtBQUEsQ0FBQSxLQUFVLENBQUMsTUFBQSxDQUFBO0FBQUE7QUFBQTtBQU0xQixVQUFTLGFBQUEsQ0FBYSxNQUFBLENBQVEsYUFBQSxDQUFjLFVBQUEsQ0FBVztBQUMvQyxPQUFBLE9BQUEsRUFBUyxHQUFBLEVBQUssS0FBQSxDQUFBLEdBQVEsQ0FBQyxNQUFBLENBQUE7QUFDdkIsWUFBQSxFQUFPLE9BQUEsR0FBVSxFQUFBO0FBRXJCLFNBQUEsRUFBTyxNQUFBLENBQUEsTUFBQSxFQUFnQixhQUFBLENBQWM7QUFDakMsWUFBQSxFQUFTLElBQUEsRUFBTSxPQUFBO0FBQUE7QUFFbkIsVUFBTyxFQUFDLElBQUEsRUFBTyxFQUFDLFNBQUEsRUFBWSxJQUFBLENBQU0sR0FBQSxDQUFBLENBQU0sSUFBQSxDQUFBLEVBQU8sT0FBQTtBQUFBO0FBSW5ELFVBQVMsZ0NBQUEsQ0FBZ0MsR0FBQSxDQUFLLFNBQUEsQ0FBVSxTQUFBLENBQVUsbUJBQUEsQ0FBb0I7QUFDOUUsT0FBQSxhQUFBLEVBQWUsU0FBQSxDQUFBLGFBQUE7QUFDZixZQUFBLEVBQU8sU0FBQSxDQUFBLEtBQUE7QUFDUCxjQUFBLEVBQVMsU0FBQSxDQUFBLE9BQUE7QUFDVCxlQUFBO0FBQ0EsYUFBQTtBQUVKLE1BQUEsRUFBSSxZQUFBLENBQWM7QUFDZCxTQUFBLENBQUEsRUFBQSxDQUFBLE9BQWMsQ0FBQyxDQUFDLElBQUEsQ0FBQSxFQUFBLEVBQVMsYUFBQSxFQUFlLFNBQUEsQ0FBQTtBQUFBO0FBRzVDLE1BQUEsRUFBSSxJQUFBLEdBQVEsT0FBQSxDQUFRO0FBQ2hCLGFBQUEsRUFBVSxJQUFBLENBQUEsTUFBVSxDQUFBLENBQUE7QUFDcEIsV0FBQSxFQUFRLElBQUEsQ0FBQSxJQUFRLENBQUEsQ0FBQTtBQUFBO0FBRXBCLE1BQUEsRUFBSSxJQUFBLENBQU07QUFDTixTQUFBLENBQUEsSUFBUSxDQUFDLEdBQUEsQ0FBQSxJQUFRLENBQUEsQ0FBQSxFQUFLLEtBQUEsRUFBTyxTQUFBLENBQUE7QUFBQTtBQUVqQyxNQUFBLEVBQUksTUFBQSxDQUFRO0FBQ1IsU0FBQSxDQUFBLEtBQVMsQ0FBQyxHQUFBLENBQUEsS0FBUyxDQUFBLENBQUEsRUFBSyxPQUFBLEVBQVMsU0FBQSxDQUFBO0FBQUE7QUFFckMsTUFBQSxFQUFJLFlBQUEsR0FBZ0IsRUFBQyxrQkFBQSxDQUFvQjtBQUNyQyxZQUFBLENBQUEsWUFBbUIsQ0FBQyxHQUFBLENBQUE7QUFBQTtBQUd4QixNQUFBLEVBQUksSUFBQSxHQUFRLE9BQUEsQ0FBUTtBQUNoQixTQUFBLENBQUEsTUFBVSxDQUFDLE9BQUEsQ0FBQTtBQUNYLFNBQUEsQ0FBQSxJQUFRLENBQUMsS0FBQSxDQUFBO0FBQUE7QUFBQTtBQUtqQixVQUFTLFFBQUEsQ0FBUSxLQUFBLENBQU87QUFDcEIsVUFBTyxPQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUE4QixDQUFDLEtBQUEsQ0FBQSxJQUFXLGlCQUFBO0FBQUE7QUFHckQsVUFBUyxPQUFBLENBQU8sS0FBQSxDQUFPO0FBQ25CLFVBQVEsT0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUEsSUFBOEIsQ0FBQyxLQUFBLENBQUEsSUFBVyxnQkFBQSxHQUMxQyxNQUFBLFdBQWlCLEtBQUE7QUFBQTtBQUk3QixVQUFTLGNBQUEsQ0FBYyxNQUFBLENBQVEsT0FBQSxDQUFRLFlBQUEsQ0FBYTtBQUM1QyxPQUFBLElBQUEsRUFBTSxLQUFBLENBQUEsR0FBUSxDQUFDLE1BQUEsQ0FBQSxNQUFBLENBQWUsT0FBQSxDQUFBLE1BQUEsQ0FBQTtBQUM5QixrQkFBQSxFQUFhLEtBQUEsQ0FBQSxHQUFRLENBQUMsTUFBQSxDQUFBLE1BQUEsRUFBZ0IsT0FBQSxDQUFBLE1BQUEsQ0FBQTtBQUN0QyxhQUFBLEVBQVEsRUFBQTtBQUNSLFNBQUE7QUFDSixPQUFBLEVBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksSUFBQSxDQUFLLEVBQUEsRUFBQSxDQUFLO0FBQ3RCLFFBQUEsRUFBSSxDQUFDLFdBQUEsR0FBZSxPQUFBLENBQU8sQ0FBQSxDQUFBLElBQU8sT0FBQSxDQUFPLENBQUEsQ0FBQSxDQUFBLEdBQ3JDLEVBQUMsQ0FBQyxXQUFBLEdBQWUsTUFBSyxDQUFDLE1BQUEsQ0FBTyxDQUFBLENBQUEsQ0FBQSxJQUFRLE1BQUssQ0FBQyxNQUFBLENBQU8sQ0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFNO0FBQ3pELGFBQUEsRUFBQTtBQUFBO0FBQUE7QUFHUixVQUFPLE1BQUEsRUFBUSxXQUFBO0FBQUE7QUFHbkIsVUFBUyxlQUFBLENBQWUsS0FBQSxDQUFPO0FBQzNCLE1BQUEsRUFBSSxLQUFBLENBQU87QUFDSCxTQUFBLFFBQUEsRUFBVSxNQUFBLENBQUEsV0FBaUIsQ0FBQSxDQUFBLENBQUEsT0FBVSxDQUFDLE9BQUEsQ0FBUyxLQUFBLENBQUE7QUFDbkQsV0FBQSxFQUFRLFlBQUEsQ0FBWSxLQUFBLENBQUEsR0FBVSxlQUFBLENBQWUsT0FBQSxDQUFBLEdBQVksUUFBQTtBQUFBO0FBRTdELFVBQU8sTUFBQTtBQUFBO0FBR1gsVUFBUyxxQkFBQSxDQUFxQixXQUFBLENBQWE7QUFDbkMsT0FBQSxnQkFBQSxFQUFrQixFQUFBLENBQUE7QUFDbEIsc0JBQUE7QUFDQSxZQUFBO0FBRUosT0FBQSxFQUFLLElBQUEsR0FBUSxZQUFBLENBQWE7QUFDdEIsUUFBQSxFQUFJLFdBQUEsQ0FBQSxjQUEwQixDQUFDLElBQUEsQ0FBQSxDQUFPO0FBQ2xDLHNCQUFBLEVBQWlCLGVBQWMsQ0FBQyxJQUFBLENBQUE7QUFDaEMsVUFBQSxFQUFJLGNBQUEsQ0FBZ0I7QUFDaEIseUJBQUEsQ0FBZ0IsY0FBQSxDQUFBLEVBQWtCLFlBQUEsQ0FBWSxJQUFBLENBQUE7QUFBQTtBQUFBO0FBQUE7QUFLMUQsVUFBTyxnQkFBQTtBQUFBO0FBR1gsVUFBUyxTQUFBLENBQVMsS0FBQSxDQUFPO0FBQ2pCLE9BQUEsTUFBQTtBQUFPLGNBQUE7QUFFWCxNQUFBLEVBQUksS0FBQSxDQUFBLE9BQWEsQ0FBQyxNQUFBLENBQUEsSUFBWSxFQUFBLENBQUc7QUFDN0IsV0FBQSxFQUFRLEVBQUE7QUFDUixZQUFBLEVBQVMsTUFBQTtBQUFBLEtBQUEsS0FFUixHQUFBLEVBQUksS0FBQSxDQUFBLE9BQWEsQ0FBQyxPQUFBLENBQUEsSUFBYSxFQUFBLENBQUc7QUFDbkMsV0FBQSxFQUFRLEdBQUE7QUFDUixZQUFBLEVBQVMsUUFBQTtBQUFBLEtBQUEsS0FFUjtBQUNELFlBQUE7QUFBQTtBQUdKLFVBQUEsQ0FBTyxLQUFBLENBQUEsRUFBUyxTQUFBLENBQVUsTUFBQSxDQUFRLE1BQUEsQ0FBTztBQUNqQyxTQUFBLEVBQUE7QUFBRyxnQkFBQTtBQUNILGdCQUFBLEVBQVMsT0FBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLENBQWdCLEtBQUEsQ0FBQTtBQUN6QixpQkFBQSxFQUFVLEVBQUEsQ0FBQTtBQUVkLFFBQUEsRUFBSSxNQUFPLE9BQUEsSUFBVyxTQUFBLENBQVU7QUFDNUIsYUFBQSxFQUFRLE9BQUE7QUFDUixjQUFBLEVBQVMsVUFBQTtBQUFBO0FBR2IsWUFBQSxFQUFTLFNBQUEsQ0FBVSxDQUFBLENBQUc7QUFDZCxXQUFBLEVBQUEsRUFBSSxPQUFNLENBQUEsQ0FBQSxDQUFBLEdBQU0sQ0FBQSxDQUFBLENBQUEsR0FBTSxDQUFDLE1BQUEsQ0FBUSxFQUFBLENBQUE7QUFDbkMsY0FBTyxPQUFBLENBQUEsSUFBVyxDQUFDLE1BQUEsQ0FBQSxFQUFBLENBQUEsS0FBQSxDQUFpQixFQUFBLENBQUcsT0FBQSxHQUFVLEdBQUEsQ0FBQTtBQUFBLE9BQUE7QUFHckQsUUFBQSxFQUFJLEtBQUEsR0FBUyxLQUFBLENBQU07QUFDZixjQUFPLE9BQU0sQ0FBQyxLQUFBLENBQUE7QUFBQSxPQUFBLEtBRWI7QUFDRCxXQUFBLEVBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksTUFBQSxDQUFPLEVBQUEsRUFBQSxDQUFLO0FBQ3hCLGlCQUFBLENBQUEsSUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUEsQ0FBQTtBQUFBO0FBRXhCLGNBQU8sUUFBQTtBQUFBO0FBQUEsS0FBQTtBQUFBO0FBS25CLFVBQVMsTUFBQSxDQUFNLG1CQUFBLENBQXFCO0FBQzVCLE9BQUEsY0FBQSxFQUFnQixFQUFDLG9CQUFBO0FBQ2pCLGFBQUEsRUFBUSxFQUFBO0FBRVosTUFBQSxFQUFJLGFBQUEsSUFBa0IsRUFBQSxHQUFLLFNBQVEsQ0FBQyxhQUFBLENBQUEsQ0FBZ0I7QUFDaEQsUUFBQSxFQUFJLGFBQUEsR0FBaUIsRUFBQSxDQUFHO0FBQ3BCLGFBQUEsRUFBUSxLQUFBLENBQUEsS0FBVSxDQUFDLGFBQUEsQ0FBQTtBQUFBLE9BQUEsS0FDaEI7QUFDSCxhQUFBLEVBQVEsS0FBQSxDQUFBLElBQVMsQ0FBQyxhQUFBLENBQUE7QUFBQTtBQUFBO0FBSTFCLFVBQU8sTUFBQTtBQUFBO0FBR1gsVUFBUyxZQUFBLENBQVksSUFBQSxDQUFNLE1BQUEsQ0FBTztBQUM5QixVQUFPLElBQUksS0FBSSxDQUFDLElBQUEsQ0FBQSxHQUFRLENBQUMsSUFBQSxDQUFNLE1BQUEsRUFBUSxFQUFBLENBQUcsRUFBQSxDQUFBLENBQUEsQ0FBQSxVQUFjLENBQUEsQ0FBQTtBQUFBO0FBRzVELFVBQVMsV0FBQSxDQUFXLElBQUEsQ0FBTTtBQUN0QixVQUFPLFdBQVUsQ0FBQyxJQUFBLENBQUEsRUFBUSxJQUFBLENBQU0sSUFBQTtBQUFBO0FBR3BDLFVBQVMsV0FBQSxDQUFXLElBQUEsQ0FBTTtBQUN0QixVQUFPLEVBQUMsSUFBQSxFQUFPLEVBQUEsSUFBTSxFQUFBLEdBQUssS0FBQSxFQUFPLElBQUEsSUFBUSxFQUFBLENBQUEsR0FBTSxLQUFBLEVBQU8sSUFBQSxJQUFRLEVBQUE7QUFBQTtBQUdsRSxVQUFTLGNBQUEsQ0FBYyxDQUFBLENBQUc7QUFDbEIsT0FBQSxTQUFBO0FBQ0osTUFBQSxFQUFJLENBQUEsQ0FBQSxFQUFBLEdBQVEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLElBQW1CLEVBQUMsRUFBQSxDQUFHO0FBQy9CLGNBQUEsRUFDSSxFQUFBLENBQUEsRUFBQSxDQUFLLEtBQUEsQ0FBQSxFQUFTLEVBQUEsR0FBSyxFQUFBLENBQUEsRUFBQSxDQUFLLEtBQUEsQ0FBQSxFQUFTLEdBQUEsRUFBSyxNQUFBLENBQ3RDLEVBQUEsQ0FBQSxFQUFBLENBQUssSUFBQSxDQUFBLEVBQVEsRUFBQSxHQUFLLEVBQUEsQ0FBQSxFQUFBLENBQUssSUFBQSxDQUFBLEVBQVEsWUFBVyxDQUFDLENBQUEsQ0FBQSxFQUFBLENBQUssSUFBQSxDQUFBLENBQU8sRUFBQSxDQUFBLEVBQUEsQ0FBSyxLQUFBLENBQUEsQ0FBQSxFQUFVLEtBQUEsQ0FDdEUsRUFBQSxDQUFBLEVBQUEsQ0FBSyxJQUFBLENBQUEsRUFBUSxFQUFBLEdBQUssRUFBQSxDQUFBLEVBQUEsQ0FBSyxJQUFBLENBQUEsRUFBUSxHQUFBLEVBQUssS0FBQSxDQUNwQyxFQUFBLENBQUEsRUFBQSxDQUFLLE1BQUEsQ0FBQSxFQUFVLEVBQUEsR0FBSyxFQUFBLENBQUEsRUFBQSxDQUFLLE1BQUEsQ0FBQSxFQUFVLEdBQUEsRUFBSyxPQUFBLENBQ3hDLEVBQUEsQ0FBQSxFQUFBLENBQUssTUFBQSxDQUFBLEVBQVUsRUFBQSxHQUFLLEVBQUEsQ0FBQSxFQUFBLENBQUssTUFBQSxDQUFBLEVBQVUsR0FBQSxFQUFLLE9BQUEsQ0FDeEMsRUFBQSxDQUFBLEVBQUEsQ0FBSyxXQUFBLENBQUEsRUFBZSxFQUFBLEdBQUssRUFBQSxDQUFBLEVBQUEsQ0FBSyxXQUFBLENBQUEsRUFBZSxJQUFBLEVBQU0sWUFBQSxDQUNuRCxFQUFDLEVBQUE7QUFFTCxRQUFBLEVBQUksQ0FBQSxDQUFBLEdBQUEsQ0FBQSxrQkFBQSxHQUE0QixFQUFDLFFBQUEsRUFBVyxLQUFBLEdBQVEsU0FBQSxFQUFXLEtBQUEsQ0FBQSxDQUFPO0FBQ2xFLGdCQUFBLEVBQVcsS0FBQTtBQUFBO0FBR2YsT0FBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLEVBQWlCLFNBQUE7QUFBQTtBQUFBO0FBSXpCLFVBQVMsUUFBQSxDQUFRLENBQUEsQ0FBRztBQUNoQixNQUFBLEVBQUksQ0FBQSxDQUFBLFFBQUEsR0FBYyxLQUFBLENBQU07QUFDcEIsT0FBQSxDQUFBLFFBQUEsRUFBYSxFQUFDLEtBQUssQ0FBQyxDQUFBLENBQUEsRUFBQSxDQUFBLE9BQVksQ0FBQSxDQUFBLENBQUEsR0FDNUIsRUFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLEVBQWlCLEVBQUEsR0FDakIsRUFBQyxDQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsR0FDRCxFQUFDLENBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxHQUNELEVBQUMsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEdBQ0QsRUFBQyxDQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsR0FDRCxFQUFDLENBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQTtBQUVMLFFBQUEsRUFBSSxDQUFBLENBQUEsT0FBQSxDQUFXO0FBQ1gsU0FBQSxDQUFBLFFBQUEsRUFBYSxFQUFBLENBQUEsUUFBQSxHQUNULEVBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxJQUF3QixFQUFBLEdBQ3hCLEVBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsSUFBOEIsRUFBQTtBQUFBO0FBQUE7QUFHMUMsVUFBTyxFQUFBLENBQUEsUUFBQTtBQUFBO0FBR1gsVUFBUyxrQkFBQSxDQUFrQixHQUFBLENBQUs7QUFDNUIsVUFBTyxJQUFBLEVBQU0sSUFBQSxDQUFBLFdBQWUsQ0FBQSxDQUFBLENBQUEsT0FBVSxDQUFDLEdBQUEsQ0FBSyxJQUFBLENBQUEsQ0FBTyxJQUFBO0FBQUE7QUFJdkQsVUFBUyxPQUFBLENBQU8sS0FBQSxDQUFPLE1BQUEsQ0FBTztBQUMxQixVQUFPLE1BQUEsQ0FBQSxNQUFBLEVBQWUsT0FBTSxDQUFDLEtBQUEsQ0FBQSxDQUFBLElBQVcsQ0FBQyxLQUFBLENBQUEsT0FBQSxHQUFpQixFQUFBLENBQUEsQ0FDdEQsT0FBTSxDQUFDLEtBQUEsQ0FBQSxDQUFBLEtBQVksQ0FBQSxDQUFBO0FBQUE7QUFRM0IsUUFBTSxDQUFDLFFBQUEsQ0FBQSxTQUFBLENBQW9CO0FBRXZCLE9BQUEsQ0FBTSxTQUFBLENBQVUsTUFBQSxDQUFRO0FBQ2hCLFNBQUEsS0FBQTtBQUFNLFdBQUE7QUFDVixTQUFBLEVBQUssQ0FBQSxHQUFLLE9BQUEsQ0FBUTtBQUNkLFlBQUEsRUFBTyxPQUFBLENBQU8sQ0FBQSxDQUFBO0FBQ2QsVUFBQSxFQUFJLE1BQU8sS0FBQSxJQUFTLFdBQUEsQ0FBWTtBQUM1QixjQUFBLENBQUssQ0FBQSxDQUFBLEVBQUssS0FBQTtBQUFBLFNBQUEsS0FDUDtBQUNILGNBQUEsQ0FBSyxHQUFBLEVBQU0sRUFBQSxDQUFBLEVBQUssS0FBQTtBQUFBO0FBQUE7QUFBQSxLQUFBO0FBSzVCLFdBQUEsQ0FBVSx3RkFBQSxDQUFBLEtBQTZGLENBQUMsR0FBQSxDQUFBO0FBQ3hHLFVBQUEsQ0FBUyxTQUFBLENBQVUsQ0FBQSxDQUFHO0FBQ2xCLFlBQU8sS0FBQSxDQUFBLE9BQUEsQ0FBYSxDQUFBLENBQUEsS0FBTyxDQUFBLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHL0IsZ0JBQUEsQ0FBZSxrREFBQSxDQUFBLEtBQXVELENBQUMsR0FBQSxDQUFBO0FBQ3ZFLGVBQUEsQ0FBYyxTQUFBLENBQVUsQ0FBQSxDQUFHO0FBQ3ZCLFlBQU8sS0FBQSxDQUFBLFlBQUEsQ0FBa0IsQ0FBQSxDQUFBLEtBQU8sQ0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3BDLGVBQUEsQ0FBYyxTQUFBLENBQVUsU0FBQSxDQUFXO0FBQzNCLFNBQUEsRUFBQTtBQUFHLGFBQUE7QUFBSyxlQUFBO0FBRVosUUFBQSxFQUFJLENBQUMsSUFBQSxDQUFBLFlBQUEsQ0FBbUI7QUFDcEIsWUFBQSxDQUFBLFlBQUEsRUFBb0IsRUFBQSxDQUFBO0FBQUE7QUFHeEIsU0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLEdBQUEsQ0FBSSxFQUFBLEVBQUEsQ0FBSztBQUVyQixVQUFBLEVBQUksQ0FBQyxJQUFBLENBQUEsWUFBQSxDQUFrQixDQUFBLENBQUEsQ0FBSTtBQUN2QixhQUFBLEVBQU0sT0FBQSxDQUFBLEdBQVUsQ0FBQyxDQUFDLElBQUEsQ0FBTSxFQUFBLENBQUEsQ0FBQTtBQUN4QixlQUFBLEVBQVEsSUFBQSxFQUFNLEtBQUEsQ0FBQSxNQUFXLENBQUMsR0FBQSxDQUFLLEdBQUEsQ0FBQSxFQUFNLEtBQUEsRUFBTyxLQUFBLENBQUEsV0FBZ0IsQ0FBQyxHQUFBLENBQUssR0FBQSxDQUFBO0FBQ2xFLGNBQUEsQ0FBQSxZQUFBLENBQWtCLENBQUEsQ0FBQSxFQUFLLElBQUksT0FBTSxDQUFDLEtBQUEsQ0FBQSxPQUFhLENBQUMsR0FBQSxDQUFLLEdBQUEsQ0FBQSxDQUFLLElBQUEsQ0FBQTtBQUFBO0FBRzlELFVBQUEsRUFBSSxJQUFBLENBQUEsWUFBQSxDQUFrQixDQUFBLENBQUEsQ0FBQSxJQUFPLENBQUMsU0FBQSxDQUFBLENBQVk7QUFDdEMsZ0JBQU8sRUFBQTtBQUFBO0FBQUE7QUFBQSxLQUFBO0FBS25CLGFBQUEsQ0FBWSwyREFBQSxDQUFBLEtBQWdFLENBQUMsR0FBQSxDQUFBO0FBQzdFLFlBQUEsQ0FBVyxTQUFBLENBQVUsQ0FBQSxDQUFHO0FBQ3BCLFlBQU8sS0FBQSxDQUFBLFNBQUEsQ0FBZSxDQUFBLENBQUEsR0FBSyxDQUFBLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHL0Isa0JBQUEsQ0FBaUIsOEJBQUEsQ0FBQSxLQUFtQyxDQUFDLEdBQUEsQ0FBQTtBQUNyRCxpQkFBQSxDQUFnQixTQUFBLENBQVUsQ0FBQSxDQUFHO0FBQ3pCLFlBQU8sS0FBQSxDQUFBLGNBQUEsQ0FBb0IsQ0FBQSxDQUFBLEdBQUssQ0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3BDLGdCQUFBLENBQWUsdUJBQUEsQ0FBQSxLQUE0QixDQUFDLEdBQUEsQ0FBQTtBQUM1QyxlQUFBLENBQWMsU0FBQSxDQUFVLENBQUEsQ0FBRztBQUN2QixZQUFPLEtBQUEsQ0FBQSxZQUFBLENBQWtCLENBQUEsQ0FBQSxHQUFLLENBQUEsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUdsQyxpQkFBQSxDQUFnQixTQUFBLENBQVUsV0FBQSxDQUFhO0FBQy9CLFNBQUEsRUFBQTtBQUFHLGFBQUE7QUFBSyxlQUFBO0FBRVosUUFBQSxFQUFJLENBQUMsSUFBQSxDQUFBLGNBQUEsQ0FBcUI7QUFDdEIsWUFBQSxDQUFBLGNBQUEsRUFBc0IsRUFBQSxDQUFBO0FBQUE7QUFHMUIsU0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUEsQ0FBSztBQUVwQixVQUFBLEVBQUksQ0FBQyxJQUFBLENBQUEsY0FBQSxDQUFvQixDQUFBLENBQUEsQ0FBSTtBQUN6QixhQUFBLEVBQU0sT0FBTSxDQUFDLENBQUMsSUFBQSxDQUFNLEVBQUEsQ0FBQSxDQUFBLENBQUEsR0FBTyxDQUFDLENBQUEsQ0FBQTtBQUM1QixlQUFBLEVBQVEsSUFBQSxFQUFNLEtBQUEsQ0FBQSxRQUFhLENBQUMsR0FBQSxDQUFLLEdBQUEsQ0FBQSxFQUFNLEtBQUEsRUFBTyxLQUFBLENBQUEsYUFBa0IsQ0FBQyxHQUFBLENBQUssR0FBQSxDQUFBLEVBQU0sS0FBQSxFQUFPLEtBQUEsQ0FBQSxXQUFnQixDQUFDLEdBQUEsQ0FBSyxHQUFBLENBQUE7QUFDekcsY0FBQSxDQUFBLGNBQUEsQ0FBb0IsQ0FBQSxDQUFBLEVBQUssSUFBSSxPQUFNLENBQUMsS0FBQSxDQUFBLE9BQWEsQ0FBQyxHQUFBLENBQUssR0FBQSxDQUFBLENBQUssSUFBQSxDQUFBO0FBQUE7QUFHaEUsVUFBQSxFQUFJLElBQUEsQ0FBQSxjQUFBLENBQW9CLENBQUEsQ0FBQSxDQUFBLElBQU8sQ0FBQyxXQUFBLENBQUEsQ0FBYztBQUMxQyxnQkFBTyxFQUFBO0FBQUE7QUFBQTtBQUFBLEtBQUE7QUFLbkIsbUJBQUEsQ0FBa0I7QUFDZCxRQUFBLENBQUssU0FBQTtBQUNMLE9BQUEsQ0FBSSxhQUFBO0FBQ0osUUFBQSxDQUFLLGNBQUE7QUFDTCxTQUFBLENBQU0saUJBQUE7QUFDTixVQUFBLENBQU87QUFBQSxLQUFBO0FBRVgsa0JBQUEsQ0FBaUIsU0FBQSxDQUFVLEdBQUEsQ0FBSztBQUN4QixTQUFBLE9BQUEsRUFBUyxLQUFBLENBQUEsZUFBQSxDQUFxQixHQUFBLENBQUE7QUFDbEMsUUFBQSxFQUFJLENBQUMsTUFBQSxHQUFVLEtBQUEsQ0FBQSxlQUFBLENBQXFCLEdBQUEsQ0FBQSxXQUFlLENBQUEsQ0FBQSxDQUFBLENBQUs7QUFDcEQsY0FBQSxFQUFTLEtBQUEsQ0FBQSxlQUFBLENBQXFCLEdBQUEsQ0FBQSxXQUFlLENBQUEsQ0FBQSxDQUFBLENBQUEsT0FBVyxDQUFDLGtCQUFBLENBQW9CLFNBQUEsQ0FBVSxHQUFBLENBQUs7QUFDeEYsZ0JBQU8sSUFBQSxDQUFBLEtBQVMsQ0FBQyxDQUFBLENBQUE7QUFBQSxTQUFBLENBQUE7QUFFckIsWUFBQSxDQUFBLGVBQUEsQ0FBcUIsR0FBQSxDQUFBLEVBQU8sT0FBQTtBQUFBO0FBRWhDLFlBQU8sT0FBQTtBQUFBLEtBQUE7QUFHWCxRQUFBLENBQU8sU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUdwQixZQUFPLEVBQUMsQ0FBQyxLQUFBLEVBQVEsR0FBQSxDQUFBLENBQUEsV0FBZSxDQUFBLENBQUEsQ0FBQSxNQUFTLENBQUMsQ0FBQSxDQUFBLElBQU8sSUFBQSxDQUFBO0FBQUEsS0FBQTtBQUdyRCxrQkFBQSxDQUFpQixnQkFBQTtBQUNqQixZQUFBLENBQVcsU0FBQSxDQUFVLEtBQUEsQ0FBTyxRQUFBLENBQVMsUUFBQSxDQUFTO0FBQzFDLFFBQUEsRUFBSSxLQUFBLEVBQVEsR0FBQSxDQUFJO0FBQ1osY0FBTyxRQUFBLEVBQVUsS0FBQSxDQUFPLEtBQUE7QUFBQSxPQUFBLEtBQ3JCO0FBQ0gsY0FBTyxRQUFBLEVBQVUsS0FBQSxDQUFPLEtBQUE7QUFBQTtBQUFBLEtBQUE7QUFJaEMsYUFBQSxDQUFZO0FBQ1IsYUFBQSxDQUFVLGdCQUFBO0FBQ1YsYUFBQSxDQUFVLG1CQUFBO0FBQ1YsY0FBQSxDQUFXLGVBQUE7QUFDWCxhQUFBLENBQVUsb0JBQUE7QUFDVixjQUFBLENBQVcsc0JBQUE7QUFDWCxjQUFBLENBQVc7QUFBQSxLQUFBO0FBRWYsWUFBQSxDQUFXLFNBQUEsQ0FBVSxHQUFBLENBQUssSUFBQSxDQUFLO0FBQ3ZCLFNBQUEsT0FBQSxFQUFTLEtBQUEsQ0FBQSxTQUFBLENBQWUsR0FBQSxDQUFBO0FBQzVCLFlBQU8sT0FBTyxPQUFBLElBQVcsV0FBQSxFQUFhLE9BQUEsQ0FBQSxLQUFZLENBQUMsR0FBQSxDQUFBLENBQU8sT0FBQTtBQUFBLEtBQUE7QUFHOUQsaUJBQUEsQ0FBZ0I7QUFDWixZQUFBLENBQVMsUUFBQTtBQUNULFVBQUEsQ0FBTyxTQUFBO0FBQ1AsT0FBQSxDQUFJLGdCQUFBO0FBQ0osT0FBQSxDQUFJLFdBQUE7QUFDSixRQUFBLENBQUssYUFBQTtBQUNMLE9BQUEsQ0FBSSxVQUFBO0FBQ0osUUFBQSxDQUFLLFdBQUE7QUFDTCxPQUFBLENBQUksUUFBQTtBQUNKLFFBQUEsQ0FBSyxVQUFBO0FBQ0wsT0FBQSxDQUFJLFVBQUE7QUFDSixRQUFBLENBQUssWUFBQTtBQUNMLE9BQUEsQ0FBSSxTQUFBO0FBQ0osUUFBQSxDQUFLO0FBQUEsS0FBQTtBQUVULGdCQUFBLENBQWUsU0FBQSxDQUFVLE1BQUEsQ0FBUSxjQUFBLENBQWUsT0FBQSxDQUFRLFNBQUEsQ0FBVTtBQUMxRCxTQUFBLE9BQUEsRUFBUyxLQUFBLENBQUEsYUFBQSxDQUFtQixNQUFBLENBQUE7QUFDaEMsWUFBTyxFQUFDLE1BQU8sT0FBQSxJQUFXLFdBQUEsQ0FBQSxFQUN0QixPQUFNLENBQUMsTUFBQSxDQUFRLGNBQUEsQ0FBZSxPQUFBLENBQVEsU0FBQSxDQUFBLENBQ3RDLE9BQUEsQ0FBQSxPQUFjLENBQUMsS0FBQSxDQUFPLE9BQUEsQ0FBQTtBQUFBLEtBQUE7QUFFOUIsY0FBQSxDQUFhLFNBQUEsQ0FBVSxJQUFBLENBQU0sT0FBQSxDQUFRO0FBQzdCLFNBQUEsT0FBQSxFQUFTLEtBQUEsQ0FBQSxhQUFBLENBQW1CLElBQUEsRUFBTyxFQUFBLEVBQUksU0FBQSxDQUFXLE9BQUEsQ0FBQTtBQUN0RCxZQUFPLE9BQU8sT0FBQSxJQUFXLFdBQUEsRUFBYSxPQUFNLENBQUMsTUFBQSxDQUFBLENBQVUsT0FBQSxDQUFBLE9BQWMsQ0FBQyxLQUFBLENBQU8sT0FBQSxDQUFBO0FBQUEsS0FBQTtBQUdqRixXQUFBLENBQVUsU0FBQSxDQUFVLE1BQUEsQ0FBUTtBQUN4QixZQUFPLEtBQUEsQ0FBQSxRQUFBLENBQUEsT0FBcUIsQ0FBQyxJQUFBLENBQU0sT0FBQSxDQUFBO0FBQUEsS0FBQTtBQUV2QyxZQUFBLENBQVcsS0FBQTtBQUVYLFlBQUEsQ0FBVyxTQUFBLENBQVUsTUFBQSxDQUFRO0FBQ3pCLFlBQU8sT0FBQTtBQUFBLEtBQUE7QUFHWCxjQUFBLENBQWEsU0FBQSxDQUFVLE1BQUEsQ0FBUTtBQUMzQixZQUFPLE9BQUE7QUFBQSxLQUFBO0FBR1gsUUFBQSxDQUFPLFNBQUEsQ0FBVSxHQUFBLENBQUs7QUFDbEIsWUFBTyxXQUFVLENBQUMsR0FBQSxDQUFLLEtBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFnQixLQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLElBQUE7QUFBQSxLQUFBO0FBRzNDLFNBQUEsQ0FBUTtBQUNKLFNBQUEsQ0FBTSxFQUFBO0FBQ04sU0FBQSxDQUFNO0FBQUEsS0FBQTtBQUdWLGdCQUFBLENBQWMsZUFBQTtBQUNkLGVBQUEsQ0FBYSxTQUFBLENBQVUsQ0FBRTtBQUNyQixZQUFPLEtBQUEsQ0FBQSxZQUFBO0FBQUE7QUFBQSxHQUFBLENBQUE7QUFRZixVQUFTLFNBQUEsQ0FBUyxHQUFBLENBQUssT0FBQSxDQUFRO0FBQzNCLFVBQUEsQ0FBQSxJQUFBLEVBQWMsSUFBQTtBQUNkLE1BQUEsRUFBSSxDQUFDLFNBQUEsQ0FBVSxHQUFBLENBQUEsQ0FBTTtBQUNqQixlQUFBLENBQVUsR0FBQSxDQUFBLEVBQU8sSUFBSSxTQUFRLENBQUEsQ0FBQTtBQUFBO0FBRWpDLGFBQUEsQ0FBVSxHQUFBLENBQUEsQ0FBQSxHQUFRLENBQUMsTUFBQSxDQUFBO0FBQ25CLFVBQU8sVUFBQSxDQUFVLEdBQUEsQ0FBQTtBQUFBO0FBSXJCLFVBQVMsV0FBQSxDQUFXLEdBQUEsQ0FBSztBQUNyQixVQUFPLFVBQUEsQ0FBVSxHQUFBLENBQUE7QUFBQTtBQVNyQixVQUFTLGtCQUFBLENBQWtCLEdBQUEsQ0FBSztBQUN4QixPQUFBLEVBQUEsRUFBSSxFQUFBO0FBQUcsU0FBQTtBQUFHLFlBQUE7QUFBTSxZQUFBO0FBQU0sYUFBQTtBQUN0QixXQUFBLEVBQU0sU0FBQSxDQUFVLENBQUEsQ0FBRztBQUNmLFlBQUEsRUFBSSxDQUFDLFNBQUEsQ0FBVSxDQUFBLENBQUEsR0FBTSxVQUFBLENBQVc7QUFDNUIsZUFBSTtBQUNBLHFCQUFPLENBQUMsU0FBQSxFQUFZLEVBQUEsQ0FBQTtBQUFBLGFBQ3RCLE1BQUEsRUFBTyxDQUFBLENBQUcsRUFBQTtBQUFBO0FBRWhCLGdCQUFPLFVBQUEsQ0FBVSxDQUFBLENBQUE7QUFBQSxTQUFBO0FBR3pCLE1BQUEsRUFBSSxDQUFDLEdBQUEsQ0FBSztBQUNOLFlBQU8sT0FBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBO0FBQUE7QUFHWCxNQUFBLEVBQUksQ0FBQyxPQUFPLENBQUMsR0FBQSxDQUFBLENBQU07QUFFZixVQUFBLEVBQU8sSUFBRyxDQUFDLEdBQUEsQ0FBQTtBQUNYLFFBQUEsRUFBSSxJQUFBLENBQU07QUFDTixjQUFPLEtBQUE7QUFBQTtBQUVYLFNBQUEsRUFBTSxFQUFDLEdBQUEsQ0FBQTtBQUFBO0FBTVgsU0FBQSxFQUFPLENBQUEsRUFBSSxJQUFBLENBQUEsTUFBQSxDQUFZO0FBQ25CLFdBQUEsRUFBUSxrQkFBaUIsQ0FBQyxHQUFBLENBQUksQ0FBQSxDQUFBLENBQUEsQ0FBQSxLQUFTLENBQUMsR0FBQSxDQUFBO0FBQ3hDLE9BQUEsRUFBSSxNQUFBLENBQUEsTUFBQTtBQUNKLFVBQUEsRUFBTyxrQkFBaUIsQ0FBQyxHQUFBLENBQUksQ0FBQSxFQUFJLEVBQUEsQ0FBQSxDQUFBO0FBQ2pDLFVBQUEsRUFBTyxLQUFBLEVBQU8sS0FBQSxDQUFBLEtBQVUsQ0FBQyxHQUFBLENBQUEsQ0FBTyxLQUFBO0FBQ2hDLFdBQUEsRUFBTyxDQUFBLEVBQUksRUFBQSxDQUFHO0FBQ1YsWUFBQSxFQUFPLElBQUcsQ0FBQyxLQUFBLENBQUEsS0FBVyxDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUEsQ0FBQSxJQUFPLENBQUMsR0FBQSxDQUFBLENBQUE7QUFDbEMsVUFBQSxFQUFJLElBQUEsQ0FBTTtBQUNOLGdCQUFPLEtBQUE7QUFBQTtBQUVYLFVBQUEsRUFBSSxJQUFBLEdBQVEsS0FBQSxDQUFBLE1BQUEsR0FBZSxFQUFBLEdBQUssY0FBYSxDQUFDLEtBQUEsQ0FBTyxLQUFBLENBQU0sS0FBQSxDQUFBLEdBQVMsRUFBQSxFQUFJLEVBQUEsQ0FBRztBQUV2RSxlQUFBO0FBQUE7QUFFSixTQUFBLEVBQUE7QUFBQTtBQUVKLE9BQUEsRUFBQTtBQUFBO0FBRUosVUFBTyxPQUFBLENBQUEsRUFBQSxDQUFBLEtBQUE7QUFBQTtBQVFYLFVBQVMsdUJBQUEsQ0FBdUIsS0FBQSxDQUFPO0FBQ25DLE1BQUEsRUFBSSxLQUFBLENBQUEsS0FBVyxDQUFDLFVBQUEsQ0FBQSxDQUFhO0FBQ3pCLFlBQU8sTUFBQSxDQUFBLE9BQWEsQ0FBQyxVQUFBLENBQVksR0FBQSxDQUFBO0FBQUE7QUFFckMsVUFBTyxNQUFBLENBQUEsT0FBYSxDQUFDLEtBQUEsQ0FBTyxHQUFBLENBQUE7QUFBQTtBQUdoQyxVQUFTLG1CQUFBLENBQW1CLE1BQUEsQ0FBUTtBQUM1QixPQUFBLE1BQUEsRUFBUSxPQUFBLENBQUEsS0FBWSxDQUFDLGdCQUFBLENBQUE7QUFBbUIsU0FBQTtBQUFHLGNBQUE7QUFFL0MsT0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsT0FBQSxFQUFTLE1BQUEsQ0FBQSxNQUFBLENBQWMsRUFBQSxFQUFJLE9BQUEsQ0FBUSxFQUFBLEVBQUEsQ0FBSztBQUNoRCxRQUFBLEVBQUksb0JBQUEsQ0FBcUIsS0FBQSxDQUFNLENBQUEsQ0FBQSxDQUFBLENBQUs7QUFDaEMsYUFBQSxDQUFNLENBQUEsQ0FBQSxFQUFLLHFCQUFBLENBQXFCLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBQTtBQUFBLE9BQUEsS0FDbkM7QUFDSCxhQUFBLENBQU0sQ0FBQSxDQUFBLEVBQUssdUJBQXNCLENBQUMsS0FBQSxDQUFNLENBQUEsQ0FBQSxDQUFBO0FBQUE7QUFBQTtBQUloRCxVQUFPLFNBQUEsQ0FBVSxHQUFBLENBQUs7QUFDZCxTQUFBLE9BQUEsRUFBUyxHQUFBO0FBQ2IsU0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLE9BQUEsQ0FBUSxFQUFBLEVBQUEsQ0FBSztBQUN6QixjQUFBLEdBQVUsTUFBQSxDQUFNLENBQUEsQ0FBQSxVQUFjLFNBQUEsRUFBVyxNQUFBLENBQU0sQ0FBQSxDQUFBLENBQUEsSUFBTyxDQUFDLEdBQUEsQ0FBSyxPQUFBLENBQUEsQ0FBVSxNQUFBLENBQU0sQ0FBQSxDQUFBO0FBQUE7QUFFaEYsWUFBTyxPQUFBO0FBQUEsS0FBQTtBQUFBO0FBS2YsVUFBUyxhQUFBLENBQWEsQ0FBQSxDQUFHLE9BQUEsQ0FBUTtBQUU3QixNQUFBLEVBQUksQ0FBQyxDQUFBLENBQUEsT0FBUyxDQUFBLENBQUEsQ0FBSTtBQUNkLFlBQU8sRUFBQSxDQUFBLElBQU0sQ0FBQSxDQUFBLENBQUEsV0FBYyxDQUFBLENBQUE7QUFBQTtBQUcvQixVQUFBLEVBQVMsYUFBWSxDQUFDLE1BQUEsQ0FBUSxFQUFBLENBQUEsSUFBTSxDQUFBLENBQUEsQ0FBQTtBQUVwQyxNQUFBLEVBQUksQ0FBQyxlQUFBLENBQWdCLE1BQUEsQ0FBQSxDQUFTO0FBQzFCLHFCQUFBLENBQWdCLE1BQUEsQ0FBQSxFQUFVLG1CQUFrQixDQUFDLE1BQUEsQ0FBQTtBQUFBO0FBR2pELFVBQU8sZ0JBQUEsQ0FBZ0IsTUFBQSxDQUFPLENBQUMsQ0FBQSxDQUFBO0FBQUE7QUFHbkMsVUFBUyxhQUFBLENBQWEsTUFBQSxDQUFRLEtBQUEsQ0FBTTtBQUM1QixPQUFBLEVBQUEsRUFBSSxFQUFBO0FBRVIsWUFBUyw0QkFBQSxDQUE0QixLQUFBLENBQU87QUFDeEMsWUFBTyxLQUFBLENBQUEsY0FBbUIsQ0FBQyxLQUFBLENBQUEsR0FBVSxNQUFBO0FBQUE7QUFHekMseUJBQUEsQ0FBQSxTQUFBLEVBQWtDLEVBQUE7QUFDbEMsU0FBQSxFQUFPLENBQUEsR0FBSyxFQUFBLEdBQUssc0JBQUEsQ0FBQSxJQUEwQixDQUFDLE1BQUEsQ0FBQSxDQUFTO0FBQ2pELFlBQUEsRUFBUyxPQUFBLENBQUEsT0FBYyxDQUFDLHFCQUFBLENBQXVCLDRCQUFBLENBQUE7QUFDL0MsMkJBQUEsQ0FBQSxTQUFBLEVBQWtDLEVBQUE7QUFDbEMsT0FBQSxHQUFLLEVBQUE7QUFBQTtBQUdULFVBQU8sT0FBQTtBQUFBO0FBVVgsVUFBUyxzQkFBQSxDQUFzQixLQUFBLENBQU8sT0FBQSxDQUFRO0FBQ3RDLE9BQUEsRUFBQTtBQUFHLGNBQUEsRUFBUyxPQUFBLENBQUEsT0FBQTtBQUNoQixVQUFBLEVBQVEsS0FBQSxDQUFBO0FBQ1IsVUFBSyxPQUFBO0FBQ0QsY0FBTyxzQkFBQTtBQUNYLFVBQUssT0FBQTtBQUNMLFVBQUssT0FBQTtBQUNMLFVBQUssT0FBQTtBQUNELGNBQU8sT0FBQSxFQUFTLHFCQUFBLENBQXVCLDBCQUFBO0FBQzNDLFVBQUssSUFBQTtBQUNMLFVBQUssSUFBQTtBQUNMLFVBQUssSUFBQTtBQUNELGNBQU8sdUJBQUE7QUFDWCxVQUFLLFNBQUE7QUFDTCxVQUFLLFFBQUE7QUFDTCxVQUFLLFFBQUE7QUFDTCxVQUFLLFFBQUE7QUFDRCxjQUFPLE9BQUEsRUFBUyxvQkFBQSxDQUFzQix5QkFBQTtBQUMxQyxVQUFLLElBQUE7QUFDRCxVQUFBLEVBQUksTUFBQSxDQUFRO0FBQUUsZ0JBQU8sbUJBQUE7QUFBQTtBQUV6QixVQUFLLEtBQUE7QUFDRCxVQUFBLEVBQUksTUFBQSxDQUFRO0FBQUUsZ0JBQU8sb0JBQUE7QUFBQTtBQUV6QixVQUFLLE1BQUE7QUFDRCxVQUFBLEVBQUksTUFBQSxDQUFRO0FBQUUsZ0JBQU8sc0JBQUE7QUFBQTtBQUV6QixVQUFLLE1BQUE7QUFDRCxjQUFPLDJCQUFBO0FBQ1gsVUFBSyxNQUFBO0FBQ0wsVUFBSyxPQUFBO0FBQ0wsVUFBSyxLQUFBO0FBQ0wsVUFBSyxNQUFBO0FBQ0wsVUFBSyxPQUFBO0FBQ0QsY0FBTyxlQUFBO0FBQ1gsVUFBSyxJQUFBO0FBQ0wsVUFBSyxJQUFBO0FBQ0QsY0FBTyxrQkFBaUIsQ0FBQyxNQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsY0FBQTtBQUM3QixVQUFLLElBQUE7QUFDRCxjQUFPLHNCQUFBO0FBQ1gsVUFBSyxJQUFBO0FBQ0wsVUFBSyxLQUFBO0FBQ0QsY0FBTyxtQkFBQTtBQUNYLFVBQUssSUFBQTtBQUNELGNBQU8sWUFBQTtBQUNYLFVBQUssT0FBQTtBQUNELGNBQU8saUJBQUE7QUFDWCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLEtBQUE7QUFDRCxjQUFPLE9BQUEsRUFBUyxvQkFBQSxDQUFzQix5QkFBQTtBQUMxQyxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDRCxjQUFPLHlCQUFBO0FBQ1gsYUFBQTtBQUNJLFNBQUEsRUFBSSxJQUFJLE9BQU0sQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLEtBQUEsQ0FBQSxPQUFhLENBQUMsSUFBQSxDQUFNLEdBQUEsQ0FBQSxDQUFBLENBQU0sSUFBQSxDQUFBLENBQUE7QUFDckUsY0FBTyxFQUFBO0FBQUE7QUFBQTtBQUlmLFVBQVMsMEJBQUEsQ0FBMEIsTUFBQSxDQUFRO0FBQ3ZDLFVBQUEsRUFBUyxPQUFBLEdBQVUsR0FBQTtBQUNmLE9BQUEsa0JBQUEsRUFBb0IsRUFBQyxNQUFBLENBQUEsS0FBWSxDQUFDLGtCQUFBLENBQUEsR0FBdUIsRUFBQSxDQUFBLENBQUE7QUFDekQsZUFBQSxFQUFVLGtCQUFBLENBQWtCLGlCQUFBLENBQUEsTUFBQSxFQUEyQixFQUFBLENBQUEsR0FBTSxFQUFBLENBQUE7QUFDN0QsYUFBQSxFQUFRLEVBQUMsT0FBQSxFQUFVLEdBQUEsQ0FBQSxDQUFBLEtBQVMsQ0FBQyxvQkFBQSxDQUFBLEdBQXlCLEVBQUMsR0FBQSxDQUFLLEVBQUEsQ0FBRyxFQUFBLENBQUE7QUFDL0QsZUFBQSxFQUFVLEVBQUMsRUFBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLEVBQUssR0FBQSxDQUFBLEVBQU0sTUFBSyxDQUFDLEtBQUEsQ0FBTSxDQUFBLENBQUEsQ0FBQTtBQUU3QyxVQUFPLE1BQUEsQ0FBTSxDQUFBLENBQUEsSUFBTyxJQUFBLEVBQU0sRUFBQyxRQUFBLENBQVUsUUFBQTtBQUFBO0FBSXpDLFVBQVMsd0JBQUEsQ0FBd0IsS0FBQSxDQUFPLE1BQUEsQ0FBTyxPQUFBLENBQVE7QUFDL0MsT0FBQSxFQUFBO0FBQUcscUJBQUEsRUFBZ0IsT0FBQSxDQUFBLEVBQUE7QUFFdkIsVUFBQSxFQUFRLEtBQUEsQ0FBQTtBQUVSLFVBQUssSUFBQTtBQUNMLFVBQUssS0FBQTtBQUNELFVBQUEsRUFBSSxLQUFBLEdBQVMsS0FBQSxDQUFNO0FBQ2YsdUJBQUEsQ0FBYyxLQUFBLENBQUEsRUFBUyxNQUFLLENBQUMsS0FBQSxDQUFBLEVBQVMsRUFBQTtBQUFBO0FBRTFDLGFBQUE7QUFDSixVQUFLLE1BQUE7QUFDTCxVQUFLLE9BQUE7QUFDRCxTQUFBLEVBQUksa0JBQWlCLENBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLFdBQXNCLENBQUMsS0FBQSxDQUFBO0FBRTdDLFVBQUEsRUFBSSxDQUFBLEdBQUssS0FBQSxDQUFNO0FBQ1gsdUJBQUEsQ0FBYyxLQUFBLENBQUEsRUFBUyxFQUFBO0FBQUEsU0FBQSxLQUNwQjtBQUNILGdCQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBMEIsTUFBQTtBQUFBO0FBRTlCLGFBQUE7QUFFSixVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDRCxVQUFBLEVBQUksS0FBQSxHQUFTLEtBQUEsQ0FBTTtBQUNmLHVCQUFBLENBQWMsSUFBQSxDQUFBLEVBQVEsTUFBSyxDQUFDLEtBQUEsQ0FBQTtBQUFBO0FBRWhDLGFBQUE7QUFFSixVQUFLLE1BQUE7QUFDTCxVQUFLLE9BQUE7QUFDRCxVQUFBLEVBQUksS0FBQSxHQUFTLEtBQUEsQ0FBTTtBQUNmLGdCQUFBLENBQUEsVUFBQSxFQUFvQixNQUFLLENBQUMsS0FBQSxDQUFBO0FBQUE7QUFHOUIsYUFBQTtBQUVKLFVBQUssS0FBQTtBQUNELHFCQUFBLENBQWMsSUFBQSxDQUFBLEVBQVEsTUFBSyxDQUFDLEtBQUEsQ0FBQSxFQUFTLEVBQUMsS0FBSyxDQUFDLEtBQUEsQ0FBQSxFQUFTLEdBQUEsRUFBSyxLQUFBLENBQU8sS0FBQSxDQUFBO0FBQ2pFLGFBQUE7QUFDSixVQUFLLE9BQUE7QUFDTCxVQUFLLFFBQUE7QUFDTCxVQUFLLFNBQUE7QUFDRCxxQkFBQSxDQUFjLElBQUEsQ0FBQSxFQUFRLE1BQUssQ0FBQyxLQUFBLENBQUE7QUFDNUIsYUFBQTtBQUVKLFVBQUssSUFBQTtBQUNMLFVBQUssSUFBQTtBQUNELGNBQUEsQ0FBQSxLQUFBLEVBQWUsa0JBQWlCLENBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLElBQWUsQ0FBQyxLQUFBLENBQUE7QUFDakQsYUFBQTtBQUVKLFVBQUssSUFBQTtBQUNMLFVBQUssS0FBQTtBQUNMLFVBQUssSUFBQTtBQUNMLFVBQUssS0FBQTtBQUNELHFCQUFBLENBQWMsSUFBQSxDQUFBLEVBQVEsTUFBSyxDQUFDLEtBQUEsQ0FBQTtBQUM1QixhQUFBO0FBRUosVUFBSyxJQUFBO0FBQ0wsVUFBSyxLQUFBO0FBQ0QscUJBQUEsQ0FBYyxNQUFBLENBQUEsRUFBVSxNQUFLLENBQUMsS0FBQSxDQUFBO0FBQzlCLGFBQUE7QUFFSixVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDRCxxQkFBQSxDQUFjLE1BQUEsQ0FBQSxFQUFVLE1BQUssQ0FBQyxLQUFBLENBQUE7QUFDOUIsYUFBQTtBQUVKLFVBQUssSUFBQTtBQUNMLFVBQUssS0FBQTtBQUNMLFVBQUssTUFBQTtBQUNMLFVBQUssT0FBQTtBQUNELHFCQUFBLENBQWMsV0FBQSxDQUFBLEVBQWUsTUFBSyxDQUFDLENBQUMsSUFBQSxFQUFPLE1BQUEsQ0FBQSxFQUFTLEtBQUEsQ0FBQTtBQUNwRCxhQUFBO0FBRUosVUFBSyxJQUFBO0FBQ0QsY0FBQSxDQUFBLEVBQUEsRUFBWSxJQUFJLEtBQUksQ0FBQyxVQUFVLENBQUMsS0FBQSxDQUFBLEVBQVMsS0FBQSxDQUFBO0FBQ3pDLGFBQUE7QUFFSixVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDRCxjQUFBLENBQUEsT0FBQSxFQUFpQixLQUFBO0FBQ2pCLGNBQUEsQ0FBQSxJQUFBLEVBQWMsMEJBQXlCLENBQUMsS0FBQSxDQUFBO0FBQ3hDLGFBQUE7QUFDSixVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLEtBQUE7QUFDTCxVQUFLLE1BQUE7QUFDTCxVQUFLLE9BQUE7QUFDTCxVQUFLLElBQUE7QUFDTCxVQUFLLElBQUE7QUFDRCxhQUFBLEVBQVEsTUFBQSxDQUFBLE1BQVksQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBO0FBRTVCLFVBQUssS0FBQTtBQUNMLFVBQUssT0FBQTtBQUNMLFVBQUssS0FBQTtBQUNMLFVBQUssT0FBQTtBQUNMLFVBQUssUUFBQTtBQUNELGFBQUEsRUFBUSxNQUFBLENBQUEsTUFBWSxDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUE7QUFDeEIsVUFBQSxFQUFJLEtBQUEsQ0FBTztBQUNQLGdCQUFBLENBQUEsRUFBQSxFQUFZLE9BQUEsQ0FBQSxFQUFBLEdBQWEsRUFBQSxDQUFBO0FBQ3pCLGdCQUFBLENBQUEsRUFBQSxDQUFVLEtBQUEsQ0FBQSxFQUFTLE1BQUE7QUFBQTtBQUV2QixhQUFBO0FBQUE7QUFBQTtBQVFSLFVBQVMsZUFBQSxDQUFlLE1BQUEsQ0FBUTtBQUN4QixPQUFBLEVBQUE7QUFBRyxZQUFBO0FBQU0sYUFBQSxFQUFRLEVBQUEsQ0FBQTtBQUFJLG1CQUFBO0FBQ3JCLGlCQUFBO0FBQVcsZUFBQTtBQUFTLFNBQUE7QUFBRyxZQUFBO0FBQU0sWUFBQTtBQUFNLGVBQUE7QUFBUyxZQUFBO0FBRWhELE1BQUEsRUFBSSxNQUFBLENBQUEsRUFBQSxDQUFXO0FBQ1gsWUFBQTtBQUFBO0FBR0osZUFBQSxFQUFjLGlCQUFnQixDQUFDLE1BQUEsQ0FBQTtBQUcvQixNQUFBLEVBQUksTUFBQSxDQUFBLEVBQUEsR0FBYSxPQUFBLENBQUEsRUFBQSxDQUFVLElBQUEsQ0FBQSxHQUFTLEtBQUEsR0FBUSxPQUFBLENBQUEsRUFBQSxDQUFVLEtBQUEsQ0FBQSxHQUFVLEtBQUEsQ0FBTTtBQUNsRSxhQUFBLEVBQVUsU0FBQSxDQUFVLEdBQUEsQ0FBSztBQUNqQixXQUFBLFFBQUEsRUFBVSxTQUFRLENBQUMsR0FBQSxDQUFLLEdBQUEsQ0FBQTtBQUM1QixjQUFPLElBQUEsRUFDTCxFQUFDLEdBQUEsQ0FBQSxNQUFBLEVBQWEsRUFBQSxFQUFJLEVBQUMsT0FBQSxFQUFVLEdBQUEsRUFBSyxLQUFBLEVBQU8sUUFBQSxDQUFVLEtBQUEsRUFBTyxRQUFBLENBQUEsQ0FBVyxRQUFBLENBQUEsQ0FDckUsRUFBQyxNQUFBLENBQUEsRUFBQSxDQUFVLElBQUEsQ0FBQSxHQUFTLEtBQUEsRUFBTyxPQUFNLENBQUEsQ0FBQSxDQUFBLFFBQVcsQ0FBQSxDQUFBLENBQUssT0FBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLENBQUEsQ0FBQTtBQUFBLE9BQUE7QUFHakUsT0FBQSxFQUFJLE9BQUEsQ0FBQSxFQUFBO0FBQ0osUUFBQSxFQUFJLENBQUEsQ0FBQSxFQUFBLEdBQVEsS0FBQSxHQUFRLEVBQUEsQ0FBQSxDQUFBLEdBQU8sS0FBQSxHQUFRLEVBQUEsQ0FBQSxDQUFBLEdBQU8sS0FBQSxDQUFNO0FBQzVDLFlBQUEsRUFBTyxtQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFPLEVBQUEsQ0FBQSxDQUFBLEdBQU8sRUFBQSxDQUFHLEVBQUEsQ0FBQSxDQUFBLENBQUssRUFBQSxDQUFHLEVBQUEsQ0FBQTtBQUFBLE9BQUEsS0FFMUQ7QUFDRCxZQUFBLEVBQU8sa0JBQWlCLENBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUN6QixlQUFBLEVBQVUsRUFBQSxDQUFBLENBQUEsR0FBTyxLQUFBLEVBQVEsYUFBWSxDQUFDLENBQUEsQ0FBQSxDQUFBLENBQUssS0FBQSxDQUFBLENBQ3pDLEVBQUMsQ0FBQSxDQUFBLENBQUEsR0FBTyxLQUFBLEVBQVEsU0FBUSxDQUFDLENBQUEsQ0FBQSxDQUFBLENBQUssR0FBQSxDQUFBLEVBQU0sS0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQWlCLEVBQUEsQ0FBQTtBQUV2RCxZQUFBLEVBQU8sU0FBUSxDQUFDLENBQUEsQ0FBQSxDQUFBLENBQUssR0FBQSxDQUFBLEdBQU8sRUFBQTtBQUc1QixVQUFBLEVBQUksQ0FBQSxDQUFBLENBQUEsR0FBTyxLQUFBLEdBQVEsUUFBQSxFQUFVLEtBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFnQjtBQUN6QyxjQUFBLEVBQUE7QUFBQTtBQUdKLFlBQUEsRUFBTyxtQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFPLEtBQUEsQ0FBTSxRQUFBLENBQVMsS0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQWdCLEtBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFHNUUsWUFBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLENBQUEsRUFBUSxLQUFBLENBQUEsSUFBQTtBQUNsQixZQUFBLENBQUEsVUFBQSxFQUFvQixLQUFBLENBQUEsU0FBQTtBQUFBO0FBSXhCLE1BQUEsRUFBSSxNQUFBLENBQUEsVUFBQSxDQUFtQjtBQUNuQixlQUFBLEVBQVksT0FBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLENBQUEsR0FBUyxLQUFBLEVBQU8sWUFBQSxDQUFZLElBQUEsQ0FBQSxDQUFRLE9BQUEsQ0FBQSxFQUFBLENBQVUsSUFBQSxDQUFBO0FBRXBFLFFBQUEsRUFBSSxNQUFBLENBQUEsVUFBQSxFQUFvQixXQUFVLENBQUMsU0FBQSxDQUFBLENBQVk7QUFDM0MsY0FBQSxDQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFnQyxLQUFBO0FBQUE7QUFHcEMsVUFBQSxFQUFPLFlBQVcsQ0FBQyxTQUFBLENBQVcsRUFBQSxDQUFHLE9BQUEsQ0FBQSxVQUFBLENBQUE7QUFDakMsWUFBQSxDQUFBLEVBQUEsQ0FBVSxLQUFBLENBQUEsRUFBUyxLQUFBLENBQUEsV0FBZ0IsQ0FBQSxDQUFBO0FBQ25DLFlBQUEsQ0FBQSxFQUFBLENBQVUsSUFBQSxDQUFBLEVBQVEsS0FBQSxDQUFBLFVBQWUsQ0FBQSxDQUFBO0FBQUE7QUFRckMsT0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLEVBQUEsR0FBSyxPQUFBLENBQUEsRUFBQSxDQUFVLENBQUEsQ0FBQSxHQUFNLEtBQUEsQ0FBTSxHQUFFLENBQUEsQ0FBRztBQUM1QyxZQUFBLENBQUEsRUFBQSxDQUFVLENBQUEsQ0FBQSxFQUFLLE1BQUEsQ0FBTSxDQUFBLENBQUEsRUFBSyxZQUFBLENBQVksQ0FBQSxDQUFBO0FBQUE7QUFJMUMsT0FBQSxFQUFBLENBQU8sRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUEsQ0FBSztBQUNmLFlBQUEsQ0FBQSxFQUFBLENBQVUsQ0FBQSxDQUFBLEVBQUssTUFBQSxDQUFNLENBQUEsQ0FBQSxFQUFLLEVBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBVSxDQUFBLENBQUEsR0FBTSxLQUFBLENBQUEsRUFBUSxFQUFDLENBQUEsSUFBTSxFQUFBLEVBQUksRUFBQSxDQUFJLEVBQUEsQ0FBQSxDQUFLLE9BQUEsQ0FBQSxFQUFBLENBQVUsQ0FBQSxDQUFBO0FBQUE7QUFJckYsU0FBQSxDQUFNLElBQUEsQ0FBQSxHQUFTLE1BQUssQ0FBQyxDQUFDLE1BQUEsQ0FBQSxJQUFBLEdBQWUsRUFBQSxDQUFBLEVBQUssR0FBQSxDQUFBO0FBQzFDLFNBQUEsQ0FBTSxNQUFBLENBQUEsR0FBVyxNQUFLLENBQUMsQ0FBQyxNQUFBLENBQUEsSUFBQSxHQUFlLEVBQUEsQ0FBQSxFQUFLLEdBQUEsQ0FBQTtBQUU1QyxVQUFBLENBQUEsRUFBQSxFQUFZLEVBQUMsTUFBQSxDQUFBLE9BQUEsRUFBaUIsWUFBQSxDQUFjLFNBQUEsQ0FBQSxDQUFBLEtBQWUsQ0FBQyxJQUFBLENBQU0sTUFBQSxDQUFBO0FBQUE7QUFHdEUsVUFBUyxlQUFBLENBQWUsTUFBQSxDQUFRO0FBQ3hCLE9BQUEsZ0JBQUE7QUFFSixNQUFBLEVBQUksTUFBQSxDQUFBLEVBQUEsQ0FBVztBQUNYLFlBQUE7QUFBQTtBQUdKLG1CQUFBLEVBQWtCLHFCQUFvQixDQUFDLE1BQUEsQ0FBQSxFQUFBLENBQUE7QUFDdkMsVUFBQSxDQUFBLEVBQUEsRUFBWSxFQUNSLGVBQUEsQ0FBQSxJQUFBLENBQ0EsZ0JBQUEsQ0FBQSxLQUFBLENBQ0EsZ0JBQUEsQ0FBQSxHQUFBLENBQ0EsZ0JBQUEsQ0FBQSxJQUFBLENBQ0EsZ0JBQUEsQ0FBQSxNQUFBLENBQ0EsZ0JBQUEsQ0FBQSxNQUFBLENBQ0EsZ0JBQUEsQ0FBQSxXQUFBLENBQUE7QUFHSixrQkFBYyxDQUFDLE1BQUEsQ0FBQTtBQUFBO0FBR25CLFVBQVMsaUJBQUEsQ0FBaUIsTUFBQSxDQUFRO0FBQzFCLE9BQUEsSUFBQSxFQUFNLElBQUksS0FBSSxDQUFBLENBQUE7QUFDbEIsTUFBQSxFQUFJLE1BQUEsQ0FBQSxPQUFBLENBQWdCO0FBQ2hCLFlBQU8sRUFDSCxHQUFBLENBQUEsY0FBa0IsQ0FBQSxDQUFBLENBQ2xCLElBQUEsQ0FBQSxXQUFlLENBQUEsQ0FBQSxDQUNmLElBQUEsQ0FBQSxVQUFjLENBQUEsQ0FBQSxDQUFBO0FBQUEsS0FBQSxLQUVmO0FBQ0gsWUFBTyxFQUFDLEdBQUEsQ0FBQSxXQUFlLENBQUEsQ0FBQSxDQUFJLElBQUEsQ0FBQSxRQUFZLENBQUEsQ0FBQSxDQUFJLElBQUEsQ0FBQSxPQUFXLENBQUEsQ0FBQSxDQUFBO0FBQUE7QUFBQTtBQUs5RCxVQUFTLDRCQUFBLENBQTRCLE1BQUEsQ0FBUTtBQUV6QyxVQUFBLENBQUEsRUFBQSxFQUFZLEVBQUEsQ0FBQTtBQUNaLFVBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxFQUFtQixLQUFBO0FBR2YsT0FBQSxLQUFBLEVBQU8sa0JBQWlCLENBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUN6QixjQUFBLEVBQVMsR0FBQSxFQUFLLE9BQUEsQ0FBQSxFQUFBO0FBQ2QsU0FBQTtBQUFHLG1CQUFBO0FBQWEsY0FBQTtBQUFRLGFBQUE7QUFBTyxlQUFBO0FBQy9CLG9CQUFBLEVBQWUsT0FBQSxDQUFBLE1BQUE7QUFDZiw4QkFBQSxFQUF5QixFQUFBO0FBRTdCLFVBQUEsRUFBUyxhQUFZLENBQUMsTUFBQSxDQUFBLEVBQUEsQ0FBVyxLQUFBLENBQUEsQ0FBQSxLQUFXLENBQUMsZ0JBQUEsQ0FBQSxHQUFxQixFQUFBLENBQUE7QUFFbEUsT0FBQSxFQUFLLENBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLE9BQUEsQ0FBQSxNQUFBLENBQWUsRUFBQSxFQUFBLENBQUs7QUFDaEMsV0FBQSxFQUFRLE9BQUEsQ0FBTyxDQUFBLENBQUE7QUFDZixpQkFBQSxFQUFjLEVBQUMsTUFBQSxDQUFBLEtBQVksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFBLENBQU8sT0FBQSxDQUFBLENBQUEsR0FBWSxFQUFBLENBQUEsQ0FBQSxDQUFJLENBQUEsQ0FBQTtBQUN6RSxRQUFBLEVBQUksV0FBQSxDQUFhO0FBQ2IsZUFBQSxFQUFVLE9BQUEsQ0FBQSxNQUFhLENBQUMsQ0FBQSxDQUFHLE9BQUEsQ0FBQSxPQUFjLENBQUMsV0FBQSxDQUFBLENBQUE7QUFDMUMsVUFBQSxFQUFJLE9BQUEsQ0FBQSxNQUFBLEVBQWlCLEVBQUEsQ0FBRztBQUNwQixnQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsSUFBMkIsQ0FBQyxPQUFBLENBQUE7QUFBQTtBQUVoQyxjQUFBLEVBQVMsT0FBQSxDQUFBLEtBQVksQ0FBQyxNQUFBLENBQUEsT0FBYyxDQUFDLFdBQUEsQ0FBQSxFQUFlLFlBQUEsQ0FBQSxNQUFBLENBQUE7QUFDcEQsOEJBQUEsR0FBMEIsWUFBQSxDQUFBLE1BQUE7QUFBQTtBQUc5QixRQUFBLEVBQUksb0JBQUEsQ0FBcUIsS0FBQSxDQUFBLENBQVE7QUFDN0IsVUFBQSxFQUFJLFdBQUEsQ0FBYTtBQUNiLGdCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsRUFBbUIsTUFBQTtBQUFBLFNBQUEsS0FFbEI7QUFDRCxnQkFBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsSUFBNEIsQ0FBQyxLQUFBLENBQUE7QUFBQTtBQUVqQywrQkFBdUIsQ0FBQyxLQUFBLENBQU8sWUFBQSxDQUFhLE9BQUEsQ0FBQTtBQUFBLE9BQUEsS0FFM0MsR0FBQSxFQUFJLE1BQUEsQ0FBQSxPQUFBLEdBQWtCLEVBQUMsV0FBQSxDQUFhO0FBQ3JDLGNBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxDQUFBLElBQTRCLENBQUMsS0FBQSxDQUFBO0FBQUE7QUFBQTtBQUtyQyxVQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsRUFBMkIsYUFBQSxFQUFlLHVCQUFBO0FBQzFDLE1BQUEsRUFBSSxNQUFBLENBQUEsTUFBQSxFQUFnQixFQUFBLENBQUc7QUFDbkIsWUFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsSUFBMkIsQ0FBQyxNQUFBLENBQUE7QUFBQTtBQUloQyxNQUFBLEVBQUksTUFBQSxDQUFBLEtBQUEsR0FBZ0IsT0FBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLENBQUEsRUFBUSxHQUFBLENBQUk7QUFDdEMsWUFBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLENBQUEsR0FBUyxHQUFBO0FBQUE7QUFHdkIsTUFBQSxFQUFJLE1BQUEsQ0FBQSxLQUFBLElBQWlCLE1BQUEsR0FBUyxPQUFBLENBQUEsRUFBQSxDQUFVLElBQUEsQ0FBQSxJQUFVLEdBQUEsQ0FBSTtBQUNsRCxZQUFBLENBQUEsRUFBQSxDQUFVLElBQUEsQ0FBQSxFQUFRLEVBQUE7QUFBQTtBQUd0QixrQkFBYyxDQUFDLE1BQUEsQ0FBQTtBQUNmLGlCQUFhLENBQUMsTUFBQSxDQUFBO0FBQUE7QUFHbEIsVUFBUyxlQUFBLENBQWUsQ0FBQSxDQUFHO0FBQ3ZCLFVBQU8sRUFBQSxDQUFBLE9BQVMsQ0FBQyxxQ0FBQSxDQUF1QyxTQUFBLENBQVUsT0FBQSxDQUFTLEdBQUEsQ0FBSSxHQUFBLENBQUksR0FBQSxDQUFJLEdBQUEsQ0FBSTtBQUN2RixZQUFPLEdBQUEsR0FBTSxHQUFBLEdBQU0sR0FBQSxHQUFNLEdBQUE7QUFBQSxLQUFBLENBQUE7QUFBQTtBQUtqQyxVQUFTLGFBQUEsQ0FBYSxDQUFBLENBQUc7QUFDckIsVUFBTyxFQUFBLENBQUEsT0FBUyxDQUFDLHdCQUFBLENBQTBCLE9BQUEsQ0FBQTtBQUFBO0FBSS9DLFVBQVMsMkJBQUEsQ0FBMkIsTUFBQSxDQUFRO0FBQ3BDLE9BQUEsV0FBQTtBQUNBLGtCQUFBO0FBRUEsbUJBQUE7QUFDQSxTQUFBO0FBQ0Esb0JBQUE7QUFFSixNQUFBLEVBQUksTUFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLElBQXFCLEVBQUEsQ0FBRztBQUN4QixZQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsRUFBMkIsS0FBQTtBQUMzQixZQUFBLENBQUEsRUFBQSxFQUFZLElBQUksS0FBSSxDQUFDLEdBQUEsQ0FBQTtBQUNyQixZQUFBO0FBQUE7QUFHSixPQUFBLEVBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksT0FBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQWtCLEVBQUEsRUFBQSxDQUFLO0FBQ25DLGtCQUFBLEVBQWUsRUFBQTtBQUNmLGdCQUFBLEVBQWEsT0FBTSxDQUFDLENBQUEsQ0FBQSxDQUFJLE9BQUEsQ0FBQTtBQUN4QixnQkFBQSxDQUFBLEdBQUEsRUFBaUIsb0JBQW1CLENBQUEsQ0FBQTtBQUNwQyxnQkFBQSxDQUFBLEVBQUEsRUFBZ0IsT0FBQSxDQUFBLEVBQUEsQ0FBVSxDQUFBLENBQUE7QUFDMUIsaUNBQTJCLENBQUMsVUFBQSxDQUFBO0FBRTVCLFFBQUEsRUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUEsQ0FBYTtBQUN0QixnQkFBQTtBQUFBO0FBSUosa0JBQUEsR0FBZ0IsV0FBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBO0FBR2hCLGtCQUFBLEdBQWdCLFdBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsRUFBcUMsR0FBQTtBQUVyRCxnQkFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLEVBQXVCLGFBQUE7QUFFdkIsUUFBQSxFQUFJLFdBQUEsR0FBZSxLQUFBLEdBQVEsYUFBQSxFQUFlLFlBQUEsQ0FBYTtBQUNuRCxtQkFBQSxFQUFjLGFBQUE7QUFDZCxrQkFBQSxFQUFhLFdBQUE7QUFBQTtBQUFBO0FBSXJCLFVBQU0sQ0FBQyxNQUFBLENBQVEsV0FBQSxHQUFjLFdBQUEsQ0FBQTtBQUFBO0FBSWpDLFVBQVMsbUJBQUEsQ0FBbUIsTUFBQSxDQUFRO0FBQzVCLE9BQUEsRUFBQTtBQUFHLFNBQUE7QUFDSCxjQUFBLEVBQVMsT0FBQSxDQUFBLEVBQUE7QUFDVCxhQUFBLEVBQVEsU0FBQSxDQUFBLElBQWEsQ0FBQyxNQUFBLENBQUE7QUFFMUIsTUFBQSxFQUFJLEtBQUEsQ0FBTztBQUNQLFlBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxFQUFpQixLQUFBO0FBQ2pCLFNBQUEsRUFBSyxDQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBSSxTQUFBLENBQUEsTUFBQSxDQUFpQixFQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBQSxDQUFLO0FBQ3pDLFVBQUEsRUFBSSxRQUFBLENBQVMsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUEsSUFBTyxDQUFDLE1BQUEsQ0FBQSxDQUFTO0FBRTdCLGdCQUFBLENBQUEsRUFBQSxFQUFZLFNBQUEsQ0FBUyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsRUFBSyxFQUFDLEtBQUEsQ0FBTSxDQUFBLENBQUEsR0FBTSxJQUFBLENBQUE7QUFDMUMsZUFBQTtBQUFBO0FBQUE7QUFHUixTQUFBLEVBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksU0FBQSxDQUFBLE1BQUEsQ0FBaUIsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUEsQ0FBSztBQUN6QyxVQUFBLEVBQUksUUFBQSxDQUFTLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFBLElBQU8sQ0FBQyxNQUFBLENBQUEsQ0FBUztBQUM3QixnQkFBQSxDQUFBLEVBQUEsR0FBYSxTQUFBLENBQVMsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBO0FBQ3pCLGVBQUE7QUFBQTtBQUFBO0FBR1IsUUFBQSxFQUFJLE1BQUEsQ0FBQSxLQUFZLENBQUMsa0JBQUEsQ0FBQSxDQUFxQjtBQUNsQyxjQUFBLENBQUEsRUFBQSxHQUFhLElBQUE7QUFBQTtBQUVqQixpQ0FBMkIsQ0FBQyxNQUFBLENBQUE7QUFBQSxLQUFBLEtBRTNCO0FBQ0QsWUFBQSxDQUFBLEVBQUEsRUFBWSxJQUFJLEtBQUksQ0FBQyxNQUFBLENBQUE7QUFBQTtBQUFBO0FBSTdCLFVBQVMsa0JBQUEsQ0FBa0IsTUFBQSxDQUFRO0FBQzNCLE9BQUEsTUFBQSxFQUFRLE9BQUEsQ0FBQSxFQUFBO0FBQ1IsZUFBQSxFQUFVLGdCQUFBLENBQUEsSUFBb0IsQ0FBQyxLQUFBLENBQUE7QUFFbkMsTUFBQSxFQUFJLEtBQUEsSUFBVSxVQUFBLENBQVc7QUFDckIsWUFBQSxDQUFBLEVBQUEsRUFBWSxJQUFJLEtBQUksQ0FBQSxDQUFBO0FBQUEsS0FBQSxLQUNqQixHQUFBLEVBQUksT0FBQSxDQUFTO0FBQ2hCLFlBQUEsQ0FBQSxFQUFBLEVBQVksSUFBSSxLQUFJLENBQUMsQ0FBQyxRQUFBLENBQVEsQ0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBLEtBQzNCLEdBQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDbEMsd0JBQWtCLENBQUMsTUFBQSxDQUFBO0FBQUEsS0FBQSxLQUNoQixHQUFBLEVBQUksT0FBTyxDQUFDLEtBQUEsQ0FBQSxDQUFRO0FBQ3ZCLFlBQUEsQ0FBQSxFQUFBLEVBQVksTUFBQSxDQUFBLEtBQVcsQ0FBQyxDQUFBLENBQUE7QUFDeEIsb0JBQWMsQ0FBQyxNQUFBLENBQUE7QUFBQSxLQUFBLEtBQ1osR0FBQSxFQUFJLE1BQU0sQ0FBQyxLQUFBLENBQUEsQ0FBUTtBQUN0QixZQUFBLENBQUEsRUFBQSxFQUFZLElBQUksS0FBSSxDQUFDLENBQUMsTUFBQSxDQUFBO0FBQUEsS0FBQSxLQUNuQixHQUFBLEVBQUksTUFBTSxFQUFDLEtBQUEsQ0FBQSxJQUFXLFNBQUEsQ0FBVTtBQUNuQyxvQkFBYyxDQUFDLE1BQUEsQ0FBQTtBQUFBLEtBQUEsS0FDWjtBQUNILFlBQUEsQ0FBQSxFQUFBLEVBQVksSUFBSSxLQUFJLENBQUMsS0FBQSxDQUFBO0FBQUE7QUFBQTtBQUk3QixVQUFTLFNBQUEsQ0FBUyxDQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxHQUFBLENBQUk7QUFHaEMsT0FBQSxLQUFBLEVBQU8sSUFBSSxLQUFJLENBQUMsQ0FBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUcsR0FBQSxDQUFBO0FBR3RDLE1BQUEsRUFBSSxDQUFBLEVBQUksS0FBQSxDQUFNO0FBQ1YsVUFBQSxDQUFBLFdBQWdCLENBQUMsQ0FBQSxDQUFBO0FBQUE7QUFFckIsVUFBTyxLQUFBO0FBQUE7QUFHWCxVQUFTLFlBQUEsQ0FBWSxDQUFBLENBQUc7QUFDaEIsT0FBQSxLQUFBLEVBQU8sSUFBSSxLQUFJLENBQUMsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFjLENBQUMsSUFBQSxDQUFNLFVBQUEsQ0FBQSxDQUFBO0FBQ3pDLE1BQUEsRUFBSSxDQUFBLEVBQUksS0FBQSxDQUFNO0FBQ1YsVUFBQSxDQUFBLGNBQW1CLENBQUMsQ0FBQSxDQUFBO0FBQUE7QUFFeEIsVUFBTyxLQUFBO0FBQUE7QUFHWCxVQUFTLGFBQUEsQ0FBYSxLQUFBLENBQU8sU0FBQSxDQUFVO0FBQ25DLE1BQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDM0IsUUFBQSxFQUFJLENBQUMsS0FBSyxDQUFDLEtBQUEsQ0FBQSxDQUFRO0FBQ2YsYUFBQSxFQUFRLFNBQVEsQ0FBQyxLQUFBLENBQU8sR0FBQSxDQUFBO0FBQUEsT0FBQSxLQUV2QjtBQUNELGFBQUEsRUFBUSxTQUFBLENBQUEsYUFBc0IsQ0FBQyxLQUFBLENBQUE7QUFDL0IsVUFBQSxFQUFJLE1BQU8sTUFBQSxJQUFVLFNBQUEsQ0FBVTtBQUMzQixnQkFBTyxLQUFBO0FBQUE7QUFBQTtBQUFBO0FBSW5CLFVBQU8sTUFBQTtBQUFBO0FBU1gsVUFBUyxrQkFBQSxDQUFrQixNQUFBLENBQVEsT0FBQSxDQUFRLGNBQUEsQ0FBZSxTQUFBLENBQVUsS0FBQSxDQUFNO0FBQ3RFLFVBQU8sS0FBQSxDQUFBLFlBQWlCLENBQUMsTUFBQSxHQUFVLEVBQUEsQ0FBRyxFQUFDLENBQUMsYUFBQSxDQUFlLE9BQUEsQ0FBUSxTQUFBLENBQUE7QUFBQTtBQUduRSxVQUFTLGFBQUEsQ0FBYSxZQUFBLENBQWMsY0FBQSxDQUFlLEtBQUEsQ0FBTTtBQUNqRCxPQUFBLFFBQUEsRUFBVSxNQUFLLENBQUMsSUFBQSxDQUFBLEdBQVEsQ0FBQyxZQUFBLENBQUEsRUFBZ0IsS0FBQSxDQUFBO0FBQ3pDLGVBQUEsRUFBVSxNQUFLLENBQUMsT0FBQSxFQUFVLEdBQUEsQ0FBQTtBQUMxQixhQUFBLEVBQVEsTUFBSyxDQUFDLE9BQUEsRUFBVSxHQUFBLENBQUE7QUFDeEIsWUFBQSxFQUFPLE1BQUssQ0FBQyxLQUFBLEVBQVEsR0FBQSxDQUFBO0FBQ3JCLGFBQUEsRUFBUSxNQUFLLENBQUMsSUFBQSxFQUFPLElBQUEsQ0FBQTtBQUNyQixZQUFBLEVBQU8sUUFBQSxFQUFVLEdBQUEsR0FBTSxFQUFDLEdBQUEsQ0FBSyxRQUFBLENBQUEsR0FDekIsUUFBQSxJQUFZLEVBQUEsR0FBSyxFQUFDLEdBQUEsQ0FBQSxHQUNsQixRQUFBLEVBQVUsR0FBQSxHQUFNLEVBQUMsSUFBQSxDQUFNLFFBQUEsQ0FBQSxHQUN2QixNQUFBLElBQVUsRUFBQSxHQUFLLEVBQUMsR0FBQSxDQUFBLEdBQ2hCLE1BQUEsRUFBUSxHQUFBLEdBQU0sRUFBQyxJQUFBLENBQU0sTUFBQSxDQUFBLEdBQ3JCLEtBQUEsSUFBUyxFQUFBLEdBQUssRUFBQyxHQUFBLENBQUEsR0FDZixLQUFBLEdBQVEsR0FBQSxHQUFNLEVBQUMsSUFBQSxDQUFNLEtBQUEsQ0FBQSxHQUNyQixLQUFBLEdBQVEsR0FBQSxHQUFNLEVBQUMsR0FBQSxDQUFBLEdBQ2YsS0FBQSxFQUFPLElBQUEsR0FBTyxFQUFDLElBQUEsQ0FBTSxNQUFLLENBQUMsSUFBQSxFQUFPLEdBQUEsQ0FBQSxDQUFBLEdBQ2xDLE1BQUEsSUFBVSxFQUFBLEdBQUssRUFBQyxHQUFBLENBQUEsR0FBUSxFQUFDLElBQUEsQ0FBTSxNQUFBLENBQUE7QUFDdkMsUUFBQSxDQUFLLENBQUEsQ0FBQSxFQUFLLGNBQUE7QUFDVixRQUFBLENBQUssQ0FBQSxDQUFBLEVBQUssYUFBQSxFQUFlLEVBQUE7QUFDekIsUUFBQSxDQUFLLENBQUEsQ0FBQSxFQUFLLEtBQUE7QUFDVixVQUFPLGtCQUFBLENBQUEsS0FBdUIsQ0FBQyxDQUFBLENBQUEsQ0FBSSxLQUFBLENBQUE7QUFBQTtBQWdCdkMsVUFBUyxXQUFBLENBQVcsR0FBQSxDQUFLLGVBQUEsQ0FBZ0IscUJBQUEsQ0FBc0I7QUFDdkQsT0FBQSxJQUFBLEVBQU0scUJBQUEsRUFBdUIsZUFBQTtBQUM3Qix1QkFBQSxFQUFrQixxQkFBQSxFQUF1QixJQUFBLENBQUEsR0FBTyxDQUFBLENBQUE7QUFDaEQsc0JBQUE7QUFHSixNQUFBLEVBQUksZUFBQSxFQUFrQixJQUFBLENBQUs7QUFDdkIscUJBQUEsR0FBbUIsRUFBQTtBQUFBO0FBR3ZCLE1BQUEsRUFBSSxlQUFBLEVBQWtCLElBQUEsRUFBTSxFQUFBLENBQUc7QUFDM0IscUJBQUEsR0FBbUIsRUFBQTtBQUFBO0FBR3ZCLGtCQUFBLEVBQWlCLE9BQU0sQ0FBQyxHQUFBLENBQUEsQ0FBQSxHQUFRLENBQUMsR0FBQSxDQUFLLGdCQUFBLENBQUE7QUFDdEMsVUFBTztBQUNILFVBQUEsQ0FBTSxLQUFBLENBQUEsSUFBUyxDQUFDLGNBQUEsQ0FBQSxTQUF3QixDQUFBLENBQUEsRUFBSyxFQUFBLENBQUE7QUFDN0MsVUFBQSxDQUFNLGVBQUEsQ0FBQSxJQUFtQixDQUFBO0FBQUEsS0FBQTtBQUFBO0FBS2pDLFVBQVMsbUJBQUEsQ0FBbUIsSUFBQSxDQUFNLEtBQUEsQ0FBTSxRQUFBLENBQVMscUJBQUEsQ0FBc0IsZUFBQSxDQUFnQjtBQUMvRSxPQUFBLEVBQUEsRUFBSSxZQUFXLENBQUMsSUFBQSxDQUFNLEVBQUEsQ0FBRyxFQUFBLENBQUEsQ0FBQSxTQUFZLENBQUEsQ0FBQTtBQUFJLGlCQUFBO0FBQVcsaUJBQUE7QUFFeEQsV0FBQSxFQUFVLFFBQUEsR0FBVyxLQUFBLEVBQU8sUUFBQSxDQUFVLGVBQUE7QUFDdEMsYUFBQSxFQUFZLGVBQUEsRUFBaUIsRUFBQSxFQUFJLEVBQUMsQ0FBQSxFQUFJLHFCQUFBLEVBQXVCLEVBQUEsQ0FBSSxFQUFBLENBQUEsRUFBSyxFQUFDLENBQUEsRUFBSSxlQUFBLEVBQWlCLEVBQUEsQ0FBSSxFQUFBLENBQUE7QUFDaEcsYUFBQSxFQUFZLEVBQUEsRUFBSSxFQUFDLElBQUEsRUFBTyxFQUFBLENBQUEsRUFBSyxFQUFDLE9BQUEsRUFBVSxlQUFBLENBQUEsRUFBa0IsVUFBQSxFQUFZLEVBQUE7QUFFdEUsVUFBTztBQUNILFVBQUEsQ0FBTSxVQUFBLEVBQVksRUFBQSxFQUFJLEtBQUEsQ0FBTyxLQUFBLEVBQU8sRUFBQTtBQUNwQyxlQUFBLENBQVcsVUFBQSxFQUFZLEVBQUEsRUFBSyxVQUFBLENBQVksV0FBVSxDQUFDLElBQUEsRUFBTyxFQUFBLENBQUEsRUFBSztBQUFBLEtBQUE7QUFBQTtBQVF2RSxVQUFTLFdBQUEsQ0FBVyxNQUFBLENBQVE7QUFDcEIsT0FBQSxNQUFBLEVBQVEsT0FBQSxDQUFBLEVBQUE7QUFDUixjQUFBLEVBQVMsT0FBQSxDQUFBLEVBQUE7QUFFYixNQUFBLEVBQUksS0FBQSxJQUFVLEtBQUEsQ0FBTTtBQUNoQixZQUFPLE9BQUEsQ0FBQSxPQUFjLENBQUMsQ0FBQyxTQUFBLENBQVcsS0FBQSxDQUFBLENBQUE7QUFBQTtBQUd0QyxNQUFBLEVBQUksTUFBTyxNQUFBLElBQVUsU0FBQSxDQUFVO0FBQzNCLFlBQUEsQ0FBQSxFQUFBLEVBQVksTUFBQSxFQUFRLGtCQUFpQixDQUFBLENBQUEsQ0FBQSxRQUFXLENBQUMsS0FBQSxDQUFBO0FBQUE7QUFHckQsTUFBQSxFQUFJLE1BQUEsQ0FBQSxRQUFlLENBQUMsS0FBQSxDQUFBLENBQVE7QUFDeEIsWUFBQSxFQUFTLFlBQVcsQ0FBQyxLQUFBLENBQUE7QUFFckIsWUFBQSxDQUFBLEVBQUEsRUFBWSxJQUFJLEtBQUksQ0FBQyxDQUFDLE1BQUEsQ0FBQSxFQUFBLENBQUE7QUFBQSxLQUFBLEtBQ25CLEdBQUEsRUFBSSxNQUFBLENBQVE7QUFDZixRQUFBLEVBQUksT0FBTyxDQUFDLE1BQUEsQ0FBQSxDQUFTO0FBQ2pCLGtDQUEwQixDQUFDLE1BQUEsQ0FBQTtBQUFBLE9BQUEsS0FDeEI7QUFDSCxtQ0FBMkIsQ0FBQyxNQUFBLENBQUE7QUFBQTtBQUFBLEtBQUEsS0FFN0I7QUFDSCx1QkFBaUIsQ0FBQyxNQUFBLENBQUE7QUFBQTtBQUd0QixVQUFPLElBQUksT0FBTSxDQUFDLE1BQUEsQ0FBQTtBQUFBO0FBR3RCLFFBQUEsRUFBUyxTQUFBLENBQVUsS0FBQSxDQUFPLE9BQUEsQ0FBUSxLQUFBLENBQU0sT0FBQSxDQUFRO0FBQ3hDLE9BQUEsRUFBQTtBQUVKLE1BQUEsRUFBSSxNQUFNLEVBQUMsSUFBQSxDQUFBLElBQVUsVUFBQSxDQUFXO0FBQzVCLFlBQUEsRUFBUyxLQUFBO0FBQ1QsVUFBQSxFQUFPLFVBQUE7QUFBQTtBQUlYLEtBQUEsRUFBSSxFQUFBLENBQUE7QUFDSixLQUFBLENBQUEsZ0JBQUEsRUFBcUIsS0FBQTtBQUNyQixLQUFBLENBQUEsRUFBQSxFQUFPLE1BQUE7QUFDUCxLQUFBLENBQUEsRUFBQSxFQUFPLE9BQUE7QUFDUCxLQUFBLENBQUEsRUFBQSxFQUFPLEtBQUE7QUFDUCxLQUFBLENBQUEsT0FBQSxFQUFZLE9BQUE7QUFDWixLQUFBLENBQUEsTUFBQSxFQUFXLE1BQUE7QUFDWCxLQUFBLENBQUEsR0FBQSxFQUFRLG9CQUFtQixDQUFBLENBQUE7QUFFM0IsVUFBTyxXQUFVLENBQUMsQ0FBQSxDQUFBO0FBQUEsR0FBQTtBQUl0QixRQUFBLENBQUEsR0FBQSxFQUFhLFNBQUEsQ0FBVSxLQUFBLENBQU8sT0FBQSxDQUFRLEtBQUEsQ0FBTSxPQUFBLENBQVE7QUFDNUMsT0FBQSxFQUFBO0FBRUosTUFBQSxFQUFJLE1BQU0sRUFBQyxJQUFBLENBQUEsSUFBVSxVQUFBLENBQVc7QUFDNUIsWUFBQSxFQUFTLEtBQUE7QUFDVCxVQUFBLEVBQU8sVUFBQTtBQUFBO0FBSVgsS0FBQSxFQUFJLEVBQUEsQ0FBQTtBQUNKLEtBQUEsQ0FBQSxnQkFBQSxFQUFxQixLQUFBO0FBQ3JCLEtBQUEsQ0FBQSxPQUFBLEVBQVksS0FBQTtBQUNaLEtBQUEsQ0FBQSxNQUFBLEVBQVcsS0FBQTtBQUNYLEtBQUEsQ0FBQSxFQUFBLEVBQU8sS0FBQTtBQUNQLEtBQUEsQ0FBQSxFQUFBLEVBQU8sTUFBQTtBQUNQLEtBQUEsQ0FBQSxFQUFBLEVBQU8sT0FBQTtBQUNQLEtBQUEsQ0FBQSxPQUFBLEVBQVksT0FBQTtBQUNaLEtBQUEsQ0FBQSxHQUFBLEVBQVEsb0JBQW1CLENBQUEsQ0FBQTtBQUUzQixVQUFPLFdBQVUsQ0FBQyxDQUFBLENBQUEsQ0FBQSxHQUFNLENBQUEsQ0FBQTtBQUFBLEdBQUE7QUFJNUIsUUFBQSxDQUFBLElBQUEsRUFBYyxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQzNCLFVBQU8sT0FBTSxDQUFDLEtBQUEsRUFBUSxLQUFBLENBQUE7QUFBQSxHQUFBO0FBSTFCLFFBQUEsQ0FBQSxRQUFBLEVBQWtCLFNBQUEsQ0FBVSxLQUFBLENBQU8sSUFBQSxDQUFLO0FBQ2hDLE9BQUEsU0FBQSxFQUFXLE1BQUE7QUFFWCxhQUFBLEVBQVEsS0FBQTtBQUNSLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUE7QUFFSixNQUFBLEVBQUksTUFBQSxDQUFBLFVBQWlCLENBQUMsS0FBQSxDQUFBLENBQVE7QUFDMUIsY0FBQSxFQUFXO0FBQ1AsVUFBQSxDQUFJLE1BQUEsQ0FBQSxhQUFBO0FBQ0osU0FBQSxDQUFHLE1BQUEsQ0FBQSxLQUFBO0FBQ0gsU0FBQSxDQUFHLE1BQUEsQ0FBQTtBQUFBLE9BQUE7QUFBQSxLQUFBLEtBRUosR0FBQSxFQUFJLE1BQU8sTUFBQSxJQUFVLFNBQUEsQ0FBVTtBQUNsQyxjQUFBLEVBQVcsRUFBQSxDQUFBO0FBQ1gsUUFBQSxFQUFJLEdBQUEsQ0FBSztBQUNMLGdCQUFBLENBQVMsR0FBQSxDQUFBLEVBQU8sTUFBQTtBQUFBLE9BQUEsS0FDYjtBQUNILGdCQUFBLENBQUEsWUFBQSxFQUF3QixNQUFBO0FBQUE7QUFBQSxLQUFBLEtBRXpCLEdBQUEsRUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFBLEVBQVEsd0JBQUEsQ0FBQSxJQUE0QixDQUFDLEtBQUEsQ0FBQSxDQUFBLENBQVM7QUFDeEQsVUFBQSxFQUFPLEVBQUMsS0FBQSxDQUFNLENBQUEsQ0FBQSxJQUFPLElBQUEsQ0FBQSxFQUFPLEVBQUMsRUFBQSxDQUFJLEVBQUE7QUFDakMsY0FBQSxFQUFXO0FBQ1AsU0FBQSxDQUFHLEVBQUE7QUFDSCxTQUFBLENBQUcsTUFBSyxDQUFDLEtBQUEsQ0FBTSxJQUFBLENBQUEsQ0FBQSxFQUFTLEtBQUE7QUFDeEIsU0FBQSxDQUFHLE1BQUssQ0FBQyxLQUFBLENBQU0sSUFBQSxDQUFBLENBQUEsRUFBUyxLQUFBO0FBQ3hCLFNBQUEsQ0FBRyxNQUFLLENBQUMsS0FBQSxDQUFNLE1BQUEsQ0FBQSxDQUFBLEVBQVcsS0FBQTtBQUMxQixTQUFBLENBQUcsTUFBSyxDQUFDLEtBQUEsQ0FBTSxNQUFBLENBQUEsQ0FBQSxFQUFXLEtBQUE7QUFDMUIsVUFBQSxDQUFJLE1BQUssQ0FBQyxLQUFBLENBQU0sV0FBQSxDQUFBLENBQUEsRUFBZ0I7QUFBQSxPQUFBO0FBQUEsS0FBQSxLQUVqQyxHQUFBLEVBQUksQ0FBQyxDQUFDLENBQUMsS0FBQSxFQUFRLGlCQUFBLENBQUEsSUFBcUIsQ0FBQyxLQUFBLENBQUEsQ0FBQSxDQUFTO0FBQ2pELFVBQUEsRUFBTyxFQUFDLEtBQUEsQ0FBTSxDQUFBLENBQUEsSUFBTyxJQUFBLENBQUEsRUFBTyxFQUFDLEVBQUEsQ0FBSSxFQUFBO0FBQ2pDLGNBQUEsRUFBVyxTQUFBLENBQVUsR0FBQSxDQUFLO0FBSWxCLFdBQUEsSUFBQSxFQUFNLElBQUEsR0FBTyxXQUFVLENBQUMsR0FBQSxDQUFBLE9BQVcsQ0FBQyxHQUFBLENBQUssSUFBQSxDQUFBLENBQUE7QUFFN0MsY0FBTyxFQUFDLEtBQUssQ0FBQyxHQUFBLENBQUEsRUFBTyxFQUFBLENBQUksSUFBQSxDQUFBLEVBQU8sS0FBQTtBQUFBLE9BQUE7QUFFcEMsY0FBQSxFQUFXO0FBQ1AsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBLENBQUE7QUFDbEIsU0FBQSxDQUFHLFNBQVEsQ0FBQyxLQUFBLENBQU0sQ0FBQSxDQUFBO0FBQUEsT0FBQTtBQUFBO0FBSTFCLE9BQUEsRUFBTSxJQUFJLFNBQVEsQ0FBQyxRQUFBLENBQUE7QUFFbkIsTUFBQSxFQUFJLE1BQUEsQ0FBQSxVQUFpQixDQUFDLEtBQUEsQ0FBQSxHQUFVLE1BQUEsQ0FBQSxjQUFvQixDQUFDLE9BQUEsQ0FBQSxDQUFVO0FBQzNELFNBQUEsQ0FBQSxLQUFBLEVBQVksTUFBQSxDQUFBLEtBQUE7QUFBQTtBQUdoQixVQUFPLElBQUE7QUFBQSxHQUFBO0FBSVgsUUFBQSxDQUFBLE9BQUEsRUFBaUIsUUFBQTtBQUdqQixRQUFBLENBQUEsYUFBQSxFQUF1QixVQUFBO0FBSXZCLFFBQUEsQ0FBQSxZQUFBLEVBQXNCLFNBQUEsQ0FBVSxDQUFFLEVBQUEsQ0FBQTtBQUtsQyxRQUFBLENBQUEsSUFBQSxFQUFjLFNBQUEsQ0FBVSxHQUFBLENBQUssT0FBQSxDQUFRO0FBQzdCLE9BQUEsRUFBQTtBQUNKLE1BQUEsRUFBSSxDQUFDLEdBQUEsQ0FBSztBQUNOLFlBQU8sT0FBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQTtBQUFBO0FBRVgsTUFBQSxFQUFJLE1BQUEsQ0FBUTtBQUNSLGNBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFBLENBQUEsQ0FBTSxPQUFBLENBQUE7QUFBQSxLQUFBLEtBQzlCLEdBQUEsRUFBSSxNQUFBLElBQVcsS0FBQSxDQUFNO0FBQ3hCLGdCQUFVLENBQUMsR0FBQSxDQUFBO0FBQ1gsU0FBQSxFQUFNLEtBQUE7QUFBQSxLQUFBLEtBQ0gsR0FBQSxFQUFJLENBQUMsU0FBQSxDQUFVLEdBQUEsQ0FBQSxDQUFNO0FBQ3hCLHVCQUFpQixDQUFDLEdBQUEsQ0FBQTtBQUFBO0FBRXRCLEtBQUEsRUFBSSxPQUFBLENBQUEsUUFBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLEVBQTJCLE9BQUEsQ0FBQSxFQUFBLENBQUEsS0FBQSxFQUFrQixrQkFBaUIsQ0FBQyxHQUFBLENBQUE7QUFDbkUsVUFBTyxFQUFBLENBQUEsS0FBQTtBQUFBLEdBQUE7QUFJWCxRQUFBLENBQUEsUUFBQSxFQUFrQixTQUFBLENBQVUsR0FBQSxDQUFLO0FBQzdCLE1BQUEsRUFBSSxHQUFBLEdBQU8sSUFBQSxDQUFBLEtBQUEsR0FBYSxJQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsQ0FBaUI7QUFDckMsU0FBQSxFQUFNLElBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQTtBQUFBO0FBRVYsVUFBTyxrQkFBaUIsQ0FBQyxHQUFBLENBQUE7QUFBQSxHQUFBO0FBSTdCLFFBQUEsQ0FBQSxRQUFBLEVBQWtCLFNBQUEsQ0FBVSxHQUFBLENBQUs7QUFDN0IsVUFBTyxJQUFBLFdBQWUsT0FBQSxHQUNsQixFQUFDLEdBQUEsR0FBTyxLQUFBLEdBQVMsSUFBQSxDQUFBLGNBQWtCLENBQUMsa0JBQUEsQ0FBQSxDQUFBO0FBQUEsR0FBQTtBQUk1QyxRQUFBLENBQUEsVUFBQSxFQUFvQixTQUFBLENBQVUsR0FBQSxDQUFLO0FBQy9CLFVBQU8sSUFBQSxXQUFlLFNBQUE7QUFBQSxHQUFBO0FBRzFCLEtBQUEsRUFBSyxDQUFBLEVBQUksTUFBQSxDQUFBLE1BQUEsRUFBZSxFQUFBLENBQUcsRUFBQSxHQUFLLEVBQUEsQ0FBRyxHQUFFLENBQUEsQ0FBRztBQUNwQyxZQUFRLENBQUMsS0FBQSxDQUFNLENBQUEsQ0FBQSxDQUFBO0FBQUE7QUFHbkIsUUFBQSxDQUFBLGNBQUEsRUFBd0IsU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNyQyxVQUFPLGVBQWMsQ0FBQyxLQUFBLENBQUE7QUFBQSxHQUFBO0FBRzFCLFFBQUEsQ0FBQSxPQUFBLEVBQWlCLFNBQUEsQ0FBVSxLQUFBLENBQU87QUFDMUIsT0FBQSxFQUFBLEVBQUksT0FBQSxDQUFBLEdBQVUsQ0FBQyxHQUFBLENBQUE7QUFDbkIsTUFBQSxFQUFJLEtBQUEsR0FBUyxLQUFBLENBQU07QUFDZixZQUFNLENBQUMsQ0FBQSxDQUFBLEdBQUEsQ0FBTyxNQUFBLENBQUE7QUFBQSxLQUFBLEtBRWI7QUFDRCxPQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsRUFBd0IsS0FBQTtBQUFBO0FBRzVCLFVBQU8sRUFBQTtBQUFBLEdBQUE7QUFHWCxRQUFBLENBQUEsU0FBQSxFQUFtQixTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ2hDLFVBQU8sT0FBTSxDQUFDLEtBQUEsQ0FBQSxDQUFBLFNBQWdCLENBQUEsQ0FBQTtBQUFBLEdBQUE7QUFRbEMsUUFBTSxDQUFDLE1BQUEsQ0FBQSxFQUFBLEVBQVksT0FBQSxDQUFBLFNBQUEsQ0FBa0I7QUFFakMsU0FBQSxDQUFRLFNBQUEsQ0FBVSxDQUFFO0FBQ2hCLFlBQU8sT0FBTSxDQUFDLElBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHbEIsV0FBQSxDQUFVLFNBQUEsQ0FBVSxDQUFFO0FBQ2xCLFlBQU8sRUFBQyxLQUFBLENBQUEsRUFBQSxFQUFVLEVBQUMsQ0FBQyxJQUFBLENBQUEsT0FBQSxHQUFnQixFQUFBLENBQUEsRUFBSyxNQUFBLENBQUE7QUFBQSxLQUFBO0FBRzdDLFFBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNmLFlBQU8sS0FBQSxDQUFBLEtBQVUsQ0FBQyxDQUFDLEtBQUEsRUFBTyxLQUFBLENBQUE7QUFBQSxLQUFBO0FBRzlCLFlBQUEsQ0FBVyxTQUFBLENBQVUsQ0FBRTtBQUNuQixZQUFPLEtBQUEsQ0FBQSxLQUFVLENBQUEsQ0FBQSxDQUFBLElBQU8sQ0FBQyxJQUFBLENBQUEsQ0FBQSxNQUFZLENBQUMsa0NBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHMUMsVUFBQSxDQUFTLFNBQUEsQ0FBVSxDQUFFO0FBQ2pCLFlBQU8sS0FBQSxDQUFBLE9BQUEsRUFBZSxJQUFJLEtBQUksQ0FBQyxDQUFDLEtBQUEsQ0FBQSxDQUFRLEtBQUEsQ0FBQSxFQUFBO0FBQUEsS0FBQTtBQUc1QyxlQUFBLENBQWMsU0FBQSxDQUFVLENBQUU7QUFDbEIsU0FBQSxFQUFBLEVBQUksT0FBTSxDQUFDLElBQUEsQ0FBQSxDQUFBLEdBQVMsQ0FBQSxDQUFBO0FBQ3hCLFFBQUEsRUFBSSxDQUFBLEVBQUksRUFBQSxDQUFBLElBQU0sQ0FBQSxDQUFBLEdBQU0sRUFBQSxDQUFBLElBQU0sQ0FBQSxDQUFBLEdBQU0sS0FBQSxDQUFNO0FBQ2xDLGNBQU8sYUFBWSxDQUFDLENBQUEsQ0FBRywrQkFBQSxDQUFBO0FBQUEsT0FBQSxLQUNwQjtBQUNILGNBQU8sYUFBWSxDQUFDLENBQUEsQ0FBRyxpQ0FBQSxDQUFBO0FBQUE7QUFBQSxLQUFBO0FBSS9CLFdBQUEsQ0FBVSxTQUFBLENBQVUsQ0FBRTtBQUNkLFNBQUEsRUFBQSxFQUFJLEtBQUE7QUFDUixZQUFPLEVBQ0gsQ0FBQSxDQUFBLElBQU0sQ0FBQSxDQUFBLENBQ04sRUFBQSxDQUFBLEtBQU8sQ0FBQSxDQUFBLENBQ1AsRUFBQSxDQUFBLElBQU0sQ0FBQSxDQUFBLENBQ04sRUFBQSxDQUFBLEtBQU8sQ0FBQSxDQUFBLENBQ1AsRUFBQSxDQUFBLE9BQVMsQ0FBQSxDQUFBLENBQ1QsRUFBQSxDQUFBLE9BQVMsQ0FBQSxDQUFBLENBQ1QsRUFBQSxDQUFBLFlBQWMsQ0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBSXRCLFdBQUEsQ0FBVSxTQUFBLENBQVUsQ0FBRTtBQUNsQixZQUFPLFFBQU8sQ0FBQyxJQUFBLENBQUE7QUFBQSxLQUFBO0FBR25CLGdCQUFBLENBQWUsU0FBQSxDQUFVLENBQUU7QUFFdkIsUUFBQSxFQUFJLElBQUEsQ0FBQSxFQUFBLENBQVM7QUFDVCxjQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQSxHQUFNLGNBQWEsQ0FBQyxJQUFBLENBQUEsRUFBQSxDQUFTLEVBQUMsSUFBQSxDQUFBLE1BQUEsRUFBYyxPQUFBLENBQUEsR0FBVSxDQUFDLElBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBVyxPQUFNLENBQUMsSUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUEsT0FBaUIsQ0FBQSxDQUFBLENBQUEsRUFBTSxFQUFBO0FBQUE7QUFHdkgsWUFBTyxNQUFBO0FBQUEsS0FBQTtBQUdYLGdCQUFBLENBQWUsU0FBQSxDQUFVLENBQUU7QUFDdkIsWUFBTyxPQUFNLENBQUMsQ0FBQSxDQUFBLENBQUksS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHdEIsYUFBQSxDQUFXLFNBQUEsQ0FBVSxDQUFFO0FBQ25CLFlBQU8sS0FBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBO0FBQUEsS0FBQTtBQUdYLE9BQUEsQ0FBTSxTQUFBLENBQVUsQ0FBRTtBQUNkLFlBQU8sS0FBQSxDQUFBLElBQVMsQ0FBQyxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3JCLFNBQUEsQ0FBUSxTQUFBLENBQVUsQ0FBRTtBQUNoQixVQUFBLENBQUEsSUFBUyxDQUFDLENBQUEsQ0FBQTtBQUNWLFVBQUEsQ0FBQSxNQUFBLEVBQWMsTUFBQTtBQUNkLFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCxVQUFBLENBQVMsU0FBQSxDQUFVLFdBQUEsQ0FBYTtBQUN4QixTQUFBLE9BQUEsRUFBUyxhQUFZLENBQUMsSUFBQSxDQUFNLFlBQUEsR0FBZSxPQUFBLENBQUEsYUFBQSxDQUFBO0FBQy9DLFlBQU8sS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUEsVUFBYSxDQUFDLE1BQUEsQ0FBQTtBQUFBLEtBQUE7QUFHbEMsT0FBQSxDQUFNLFNBQUEsQ0FBVSxLQUFBLENBQU8sSUFBQSxDQUFLO0FBQ3BCLFNBQUEsSUFBQTtBQUVKLFFBQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDM0IsV0FBQSxFQUFNLE9BQUEsQ0FBQSxRQUFlLENBQUMsQ0FBQyxJQUFBLENBQUssTUFBQSxDQUFBO0FBQUEsT0FBQSxLQUN6QjtBQUNILFdBQUEsRUFBTSxPQUFBLENBQUEsUUFBZSxDQUFDLEtBQUEsQ0FBTyxJQUFBLENBQUE7QUFBQTtBQUVqQyxxQ0FBK0IsQ0FBQyxJQUFBLENBQU0sSUFBQSxDQUFLLEVBQUEsQ0FBQTtBQUMzQyxZQUFPLEtBQUE7QUFBQSxLQUFBO0FBR1gsWUFBQSxDQUFXLFNBQUEsQ0FBVSxLQUFBLENBQU8sSUFBQSxDQUFLO0FBQ3pCLFNBQUEsSUFBQTtBQUVKLFFBQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDM0IsV0FBQSxFQUFNLE9BQUEsQ0FBQSxRQUFlLENBQUMsQ0FBQyxJQUFBLENBQUssTUFBQSxDQUFBO0FBQUEsT0FBQSxLQUN6QjtBQUNILFdBQUEsRUFBTSxPQUFBLENBQUEsUUFBZSxDQUFDLEtBQUEsQ0FBTyxJQUFBLENBQUE7QUFBQTtBQUVqQyxxQ0FBK0IsQ0FBQyxJQUFBLENBQU0sSUFBQSxDQUFLLEVBQUMsRUFBQSxDQUFBO0FBQzVDLFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCxRQUFBLENBQU8sU0FBQSxDQUFVLEtBQUEsQ0FBTyxNQUFBLENBQU8sUUFBQSxDQUFTO0FBQ2hDLFNBQUEsS0FBQSxFQUFPLE9BQU0sQ0FBQyxLQUFBLENBQU8sS0FBQSxDQUFBO0FBQ3JCLGtCQUFBLEVBQVcsRUFBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsRUFBSyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxFQUFNLElBQUE7QUFDekMsY0FBQTtBQUFNLGdCQUFBO0FBRVYsV0FBQSxFQUFRLGVBQWMsQ0FBQyxLQUFBLENBQUE7QUFFdkIsUUFBQSxFQUFJLEtBQUEsSUFBVSxPQUFBLEdBQVUsTUFBQSxJQUFVLFFBQUEsQ0FBUztBQUV2QyxZQUFBLEVBQU8sRUFBQyxJQUFBLENBQUEsV0FBZ0IsQ0FBQSxDQUFBLEVBQUssS0FBQSxDQUFBLFdBQWdCLENBQUEsQ0FBQSxDQUFBLEVBQU0sTUFBQTtBQUVuRCxjQUFBLEVBQVMsRUFBQyxDQUFDLElBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxFQUFLLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLEVBQU0sR0FBQSxDQUFBLEVBQU0sRUFBQyxJQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsRUFBSyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBQTtBQUd4RSxjQUFBLEdBQVUsRUFBQyxDQUFDLElBQUEsRUFBTyxPQUFNLENBQUMsSUFBQSxDQUFBLENBQUEsT0FBYSxDQUFDLE9BQUEsQ0FBQSxDQUFBLEVBQ2hDLEVBQUMsSUFBQSxFQUFPLE9BQU0sQ0FBQyxJQUFBLENBQUEsQ0FBQSxPQUFhLENBQUMsT0FBQSxDQUFBLENBQUEsQ0FBQSxFQUFhLEtBQUE7QUFFbEQsY0FBQSxHQUFVLEVBQUMsQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsRUFBSyxPQUFNLENBQUMsSUFBQSxDQUFBLENBQUEsT0FBYSxDQUFDLE9BQUEsQ0FBQSxDQUFBLElBQWEsQ0FBQSxDQUFBLENBQUEsRUFDcEQsRUFBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsRUFBSyxPQUFNLENBQUMsSUFBQSxDQUFBLENBQUEsT0FBYSxDQUFDLE9BQUEsQ0FBQSxDQUFBLElBQWEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxFQUFPLElBQUEsRUFBTSxLQUFBO0FBQ3RFLFVBQUEsRUFBSSxLQUFBLElBQVUsT0FBQSxDQUFRO0FBQ2xCLGdCQUFBLEVBQVMsT0FBQSxFQUFTLEdBQUE7QUFBQTtBQUFBLE9BQUEsS0FFbkI7QUFDSCxZQUFBLEVBQU8sRUFBQyxJQUFBLEVBQU8sS0FBQSxDQUFBO0FBQ2YsY0FBQSxFQUFTLE1BQUEsSUFBVSxTQUFBLEVBQVcsS0FBQSxFQUFPLElBQUEsQ0FDakMsTUFBQSxJQUFVLFNBQUEsRUFBVyxLQUFBLEVBQU8sSUFBQSxDQUM1QixNQUFBLElBQVUsT0FBQSxFQUFTLEtBQUEsRUFBTyxLQUFBLENBQzFCLE1BQUEsSUFBVSxNQUFBLEVBQVEsRUFBQyxJQUFBLEVBQU8sU0FBQSxDQUFBLEVBQVksTUFBQSxDQUN0QyxNQUFBLElBQVUsT0FBQSxFQUFTLEVBQUMsSUFBQSxFQUFPLFNBQUEsQ0FBQSxFQUFZLE9BQUEsQ0FDdkMsS0FBQTtBQUFBO0FBRVIsWUFBTyxRQUFBLEVBQVUsT0FBQSxDQUFTLFNBQVEsQ0FBQyxNQUFBLENBQUE7QUFBQSxLQUFBO0FBR3ZDLFFBQUEsQ0FBTyxTQUFBLENBQVUsSUFBQSxDQUFNLGNBQUEsQ0FBZTtBQUNsQyxZQUFPLE9BQUEsQ0FBQSxRQUFlLENBQUMsSUFBQSxDQUFBLElBQVMsQ0FBQyxJQUFBLENBQUEsQ0FBQSxDQUFBLElBQVcsQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxRQUFrQixDQUFDLENBQUMsYUFBQSxDQUFBO0FBQUEsS0FBQTtBQUc5RSxXQUFBLENBQVUsU0FBQSxDQUFVLGFBQUEsQ0FBZTtBQUMvQixZQUFPLEtBQUEsQ0FBQSxJQUFTLEVBQUMsTUFBTSxDQUFBLENBQUEsQ0FBSSxjQUFBLENBQUE7QUFBQSxLQUFBO0FBRy9CLFlBQUEsQ0FBVyxTQUFBLENBQVUsQ0FBRTtBQUdmLFNBQUEsSUFBQSxFQUFNLE9BQU0sQ0FBQyxNQUFNLENBQUEsQ0FBQSxDQUFJLEtBQUEsQ0FBQSxDQUFBLE9BQWEsQ0FBQyxLQUFBLENBQUE7QUFDckMsY0FBQSxFQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUMsR0FBQSxDQUFLLE9BQUEsQ0FBUSxLQUFBLENBQUE7QUFDOUIsZ0JBQUEsRUFBUyxLQUFBLEVBQU8sRUFBQyxFQUFBLEVBQUksV0FBQSxDQUNqQixLQUFBLEVBQU8sRUFBQyxFQUFBLEVBQUksV0FBQSxDQUNaLEtBQUEsRUFBTyxFQUFBLEVBQUksVUFBQSxDQUNYLEtBQUEsRUFBTyxFQUFBLEVBQUksVUFBQSxDQUNYLEtBQUEsRUFBTyxFQUFBLEVBQUksVUFBQSxDQUNYLEtBQUEsRUFBTyxFQUFBLEVBQUksV0FBQSxDQUFhLFdBQUE7QUFDaEMsWUFBTyxLQUFBLENBQUEsTUFBVyxDQUFDLElBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLFFBQVcsQ0FBQyxNQUFBLENBQVEsS0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3BELGNBQUEsQ0FBYSxTQUFBLENBQVUsQ0FBRTtBQUNyQixZQUFPLFdBQVUsQ0FBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHL0IsU0FBQSxDQUFRLFNBQUEsQ0FBVSxDQUFFO0FBQ2hCLFlBQU8sRUFBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsRUFBSyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBQSxLQUFRLENBQUMsQ0FBQSxDQUFBLENBQUEsSUFBTyxDQUFBLENBQUEsR0FDNUMsS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLEVBQUssS0FBQSxDQUFBLEtBQVUsQ0FBQSxDQUFBLENBQUEsS0FBUSxDQUFDLENBQUEsQ0FBQSxDQUFBLElBQU8sQ0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR2hELE9BQUEsQ0FBTSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ2YsU0FBQSxJQUFBLEVBQU0sS0FBQSxDQUFBLE1BQUEsRUFBYyxLQUFBLENBQUEsRUFBQSxDQUFBLFNBQWlCLENBQUEsQ0FBQSxDQUFLLEtBQUEsQ0FBQSxFQUFBLENBQUEsTUFBYyxDQUFBLENBQUE7QUFDNUQsUUFBQSxFQUFJLEtBQUEsR0FBUyxLQUFBLENBQU07QUFDZixhQUFBLEVBQVEsYUFBWSxDQUFDLEtBQUEsQ0FBTyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQTtBQUNyQyxjQUFPLEtBQUEsQ0FBQSxHQUFRLENBQUMsQ0FBRSxDQUFBLENBQUksTUFBQSxFQUFRLElBQUEsQ0FBQSxDQUFBO0FBQUEsT0FBQSxLQUMzQjtBQUNILGNBQU8sSUFBQTtBQUFBO0FBQUEsS0FBQTtBQUlmLFNBQUEsQ0FBUSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ2pCLFNBQUEsSUFBQSxFQUFNLEtBQUEsQ0FBQSxNQUFBLEVBQWMsTUFBQSxDQUFRLEdBQUE7QUFDNUIsb0JBQUE7QUFFSixRQUFBLEVBQUksS0FBQSxHQUFTLEtBQUEsQ0FBTTtBQUNmLFVBQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDM0IsZUFBQSxFQUFRLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLFdBQWMsQ0FBQyxLQUFBLENBQUE7QUFDaEMsWUFBQSxFQUFJLE1BQU8sTUFBQSxJQUFVLFNBQUEsQ0FBVTtBQUMzQixrQkFBTyxLQUFBO0FBQUE7QUFBQTtBQUlmLGtCQUFBLEVBQWEsS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBO0FBQ3RCLFlBQUEsQ0FBQSxJQUFTLENBQUMsQ0FBQSxDQUFBO0FBQ1YsWUFBQSxDQUFBLEVBQUEsQ0FBUSxLQUFBLEVBQVEsSUFBQSxFQUFNLFFBQUEsQ0FBUSxDQUFDLEtBQUEsQ0FBQTtBQUMvQixZQUFBLENBQUEsSUFBUyxDQUFDLElBQUEsQ0FBQSxHQUFRLENBQUMsVUFBQSxDQUFZLEtBQUEsQ0FBQSxXQUFnQixDQUFBLENBQUEsQ0FBQSxDQUFBO0FBRS9DLGNBQUEsQ0FBQSxZQUFtQixDQUFDLElBQUEsQ0FBQTtBQUNwQixjQUFPLEtBQUE7QUFBQSxPQUFBLEtBQ0o7QUFDSCxjQUFPLEtBQUEsQ0FBQSxFQUFBLENBQVEsS0FBQSxFQUFRLElBQUEsRUFBTSxRQUFBLENBQVEsQ0FBQSxDQUFBO0FBQUE7QUFBQSxLQUFBO0FBSTdDLFdBQUEsQ0FBUyxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ3RCLFdBQUEsRUFBUSxlQUFjLENBQUMsS0FBQSxDQUFBO0FBR3ZCLFlBQUEsRUFBUSxLQUFBLENBQUE7QUFDUixZQUFLLE9BQUE7QUFDRCxjQUFBLENBQUEsS0FBVSxDQUFDLENBQUEsQ0FBQTtBQUVmLFlBQUssUUFBQTtBQUNELGNBQUEsQ0FBQSxJQUFTLENBQUMsQ0FBQSxDQUFBO0FBRWQsWUFBSyxPQUFBO0FBQ0wsWUFBSyxVQUFBO0FBQ0wsWUFBSyxNQUFBO0FBQ0QsY0FBQSxDQUFBLEtBQVUsQ0FBQyxDQUFBLENBQUE7QUFFZixZQUFLLE9BQUE7QUFDRCxjQUFBLENBQUEsT0FBWSxDQUFDLENBQUEsQ0FBQTtBQUVqQixZQUFLLFNBQUE7QUFDRCxjQUFBLENBQUEsT0FBWSxDQUFDLENBQUEsQ0FBQTtBQUVqQixZQUFLLFNBQUE7QUFDRCxjQUFBLENBQUEsWUFBaUIsQ0FBQyxDQUFBLENBQUE7QUFBQTtBQUt0QixRQUFBLEVBQUksS0FBQSxJQUFVLE9BQUEsQ0FBUTtBQUNsQixZQUFBLENBQUEsT0FBWSxDQUFDLENBQUEsQ0FBQTtBQUFBLE9BQUEsS0FDVixHQUFBLEVBQUksS0FBQSxJQUFVLFVBQUEsQ0FBVztBQUM1QixZQUFBLENBQUEsVUFBZSxDQUFDLENBQUEsQ0FBQTtBQUFBO0FBR3BCLFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCxTQUFBLENBQU8sU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNwQixXQUFBLEVBQVEsZUFBYyxDQUFDLEtBQUEsQ0FBQTtBQUN2QixZQUFPLEtBQUEsQ0FBQSxPQUFZLENBQUMsS0FBQSxDQUFBLENBQUEsR0FBVSxDQUFDLENBQUMsS0FBQSxJQUFVLFVBQUEsRUFBWSxPQUFBLENBQVMsTUFBQSxDQUFBLENBQVEsRUFBQSxDQUFBLENBQUEsUUFBVyxDQUFDLElBQUEsQ0FBTSxFQUFBLENBQUE7QUFBQSxLQUFBO0FBRzdGLFdBQUEsQ0FBUyxTQUFBLENBQVUsS0FBQSxDQUFPLE1BQUEsQ0FBTztBQUM3QixXQUFBLEVBQVEsT0FBTyxNQUFBLElBQVUsWUFBQSxFQUFjLE1BQUEsQ0FBUSxjQUFBO0FBQy9DLFlBQU8sRUFBQyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBQSxPQUFVLENBQUMsS0FBQSxDQUFBLEVBQVMsRUFBQyxPQUFNLENBQUMsS0FBQSxDQUFBLENBQUEsT0FBYyxDQUFDLEtBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHakUsWUFBQSxDQUFVLFNBQUEsQ0FBVSxLQUFBLENBQU8sTUFBQSxDQUFPO0FBQzlCLFdBQUEsRUFBUSxPQUFPLE1BQUEsSUFBVSxZQUFBLEVBQWMsTUFBQSxDQUFRLGNBQUE7QUFDL0MsWUFBTyxFQUFDLEtBQUEsQ0FBQSxLQUFVLENBQUEsQ0FBQSxDQUFBLE9BQVUsQ0FBQyxLQUFBLENBQUEsRUFBUyxFQUFDLE9BQU0sQ0FBQyxLQUFBLENBQUEsQ0FBQSxPQUFjLENBQUMsS0FBQSxDQUFBO0FBQUEsS0FBQTtBQUdqRSxVQUFBLENBQVEsU0FBQSxDQUFVLEtBQUEsQ0FBTyxNQUFBLENBQU87QUFDNUIsV0FBQSxFQUFRLE1BQUEsR0FBUyxLQUFBO0FBQ2pCLFlBQU8sRUFBQyxLQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBQSxPQUFVLENBQUMsS0FBQSxDQUFBLElBQVcsRUFBQyxPQUFNLENBQUMsS0FBQSxDQUFPLEtBQUEsQ0FBQSxDQUFBLE9BQWEsQ0FBQyxLQUFBLENBQUE7QUFBQSxLQUFBO0FBR3pFLE9BQUEsQ0FBSyxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ2xCLFdBQUEsRUFBUSxPQUFBLENBQUEsS0FBWSxDQUFDLElBQUEsQ0FBTSxVQUFBLENBQUE7QUFDM0IsWUFBTyxNQUFBLEVBQVEsS0FBQSxFQUFPLEtBQUEsQ0FBTyxNQUFBO0FBQUEsS0FBQTtBQUdqQyxPQUFBLENBQUssU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNsQixXQUFBLEVBQVEsT0FBQSxDQUFBLEtBQVksQ0FBQyxJQUFBLENBQU0sVUFBQSxDQUFBO0FBQzNCLFlBQU8sTUFBQSxFQUFRLEtBQUEsRUFBTyxLQUFBLENBQU8sTUFBQTtBQUFBLEtBQUE7QUFHakMsUUFBQSxDQUFPLFNBQUEsQ0FBVSxLQUFBLENBQU87QUFDaEIsU0FBQSxPQUFBLEVBQVMsS0FBQSxDQUFBLE9BQUEsR0FBZ0IsRUFBQTtBQUM3QixRQUFBLEVBQUksS0FBQSxHQUFTLEtBQUEsQ0FBTTtBQUNmLFVBQUEsRUFBSSxNQUFPLE1BQUEsSUFBVSxTQUFBLENBQVU7QUFDM0IsZUFBQSxFQUFRLDBCQUF5QixDQUFDLEtBQUEsQ0FBQTtBQUFBO0FBRXRDLFVBQUEsRUFBSSxJQUFBLENBQUEsR0FBUSxDQUFDLEtBQUEsQ0FBQSxFQUFTLEdBQUEsQ0FBSTtBQUN0QixlQUFBLEVBQVEsTUFBQSxFQUFRLEdBQUE7QUFBQTtBQUVwQixZQUFBLENBQUEsT0FBQSxFQUFlLE1BQUE7QUFDZixZQUFBLENBQUEsTUFBQSxFQUFjLEtBQUE7QUFDZCxVQUFBLEVBQUksTUFBQSxJQUFXLE1BQUEsQ0FBTztBQUNsQix5Q0FBK0IsQ0FBQyxJQUFBLENBQU0sT0FBQSxDQUFBLFFBQWUsQ0FBQyxNQUFBLEVBQVMsTUFBQSxDQUFPLElBQUEsQ0FBQSxDQUFNLEVBQUEsQ0FBRyxLQUFBLENBQUE7QUFBQTtBQUFBLE9BQUEsS0FFaEY7QUFDSCxjQUFPLEtBQUEsQ0FBQSxNQUFBLEVBQWMsT0FBQSxDQUFTLEtBQUEsQ0FBQSxFQUFBLENBQUEsaUJBQXlCLENBQUEsQ0FBQTtBQUFBO0FBRTNELFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCxZQUFBLENBQVcsU0FBQSxDQUFVLENBQUU7QUFDbkIsWUFBTyxLQUFBLENBQUEsTUFBQSxFQUFjLE1BQUEsQ0FBUSxHQUFBO0FBQUEsS0FBQTtBQUdqQyxZQUFBLENBQVcsU0FBQSxDQUFVLENBQUU7QUFDbkIsWUFBTyxLQUFBLENBQUEsTUFBQSxFQUFjLDZCQUFBLENBQStCLEdBQUE7QUFBQSxLQUFBO0FBR3hELGFBQUEsQ0FBWSxTQUFBLENBQVUsQ0FBRTtBQUNwQixRQUFBLEVBQUksSUFBQSxDQUFBLElBQUEsQ0FBVztBQUNYLFlBQUEsQ0FBQSxJQUFTLENBQUMsSUFBQSxDQUFBLElBQUEsQ0FBQTtBQUFBLE9BQUEsS0FDUCxHQUFBLEVBQUksTUFBTyxLQUFBLENBQUEsRUFBQSxJQUFZLFNBQUEsQ0FBVTtBQUNwQyxZQUFBLENBQUEsSUFBUyxDQUFDLElBQUEsQ0FBQSxFQUFBLENBQUE7QUFBQTtBQUVkLFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCx3QkFBQSxDQUF1QixTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ3BDLFFBQUEsRUFBSSxDQUFDLEtBQUEsQ0FBTztBQUNSLGFBQUEsRUFBUSxFQUFBO0FBQUEsT0FBQSxLQUVQO0FBQ0QsYUFBQSxFQUFRLE9BQU0sQ0FBQyxLQUFBLENBQUEsQ0FBQSxJQUFXLENBQUEsQ0FBQTtBQUFBO0FBRzlCLFlBQU8sRUFBQyxJQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsRUFBSyxNQUFBLENBQUEsRUFBUyxHQUFBLElBQU8sRUFBQTtBQUFBLEtBQUE7QUFHMUMsZUFBQSxDQUFjLFNBQUEsQ0FBVSxDQUFFO0FBQ3RCLFlBQU8sWUFBVyxDQUFDLElBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFJLEtBQUEsQ0FBQSxLQUFVLENBQUEsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUc5QyxhQUFBLENBQVksU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNyQixTQUFBLFVBQUEsRUFBWSxNQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBQSxDQUFBLENBQUEsT0FBYSxDQUFDLEtBQUEsQ0FBQSxFQUFTLE9BQU0sQ0FBQyxJQUFBLENBQUEsQ0FBQSxPQUFhLENBQUMsTUFBQSxDQUFBLENBQUEsRUFBVyxNQUFBLENBQUEsRUFBUyxFQUFBO0FBQzlGLFlBQU8sTUFBQSxHQUFTLEtBQUEsRUFBTyxVQUFBLENBQVksS0FBQSxDQUFBLEdBQVEsQ0FBQyxHQUFBLENBQUssRUFBQyxLQUFBLEVBQVEsVUFBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBRzlELFdBQUEsQ0FBVSxTQUFBLENBQVUsQ0FBRTtBQUNsQixZQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUMsQ0FBQyxJQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsRUFBSyxJQUFBLENBQUEsRUFBTyxJQUFBLENBQUE7QUFBQSxLQUFBO0FBRzVDLFlBQUEsQ0FBVyxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ3BCLFNBQUEsS0FBQSxFQUFPLFdBQVUsQ0FBQyxJQUFBLENBQU0sS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBYyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQTtBQUM1RCxZQUFPLE1BQUEsR0FBUyxLQUFBLEVBQU8sS0FBQSxDQUFPLEtBQUEsQ0FBQSxHQUFRLENBQUMsR0FBQSxDQUFLLEVBQUMsS0FBQSxFQUFRLEtBQUEsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUd6RCxlQUFBLENBQWMsU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUN2QixTQUFBLEtBQUEsRUFBTyxXQUFVLENBQUMsSUFBQSxDQUFNLEVBQUEsQ0FBRyxFQUFBLENBQUEsQ0FBQSxJQUFBO0FBQy9CLFlBQU8sTUFBQSxHQUFTLEtBQUEsRUFBTyxLQUFBLENBQU8sS0FBQSxDQUFBLEdBQVEsQ0FBQyxHQUFBLENBQUssRUFBQyxLQUFBLEVBQVEsS0FBQSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3pELFFBQUEsQ0FBTyxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ2hCLFNBQUEsS0FBQSxFQUFPLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLElBQU8sQ0FBQyxJQUFBLENBQUE7QUFDNUIsWUFBTyxNQUFBLEdBQVMsS0FBQSxFQUFPLEtBQUEsQ0FBTyxLQUFBLENBQUEsR0FBUSxDQUFDLEdBQUEsQ0FBSyxFQUFDLEtBQUEsRUFBUSxLQUFBLENBQUEsRUFBUSxFQUFBLENBQUE7QUFBQSxLQUFBO0FBR2pFLFdBQUEsQ0FBVSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ25CLFNBQUEsS0FBQSxFQUFPLFdBQVUsQ0FBQyxJQUFBLENBQU0sRUFBQSxDQUFHLEVBQUEsQ0FBQSxDQUFBLElBQUE7QUFDL0IsWUFBTyxNQUFBLEdBQVMsS0FBQSxFQUFPLEtBQUEsQ0FBTyxLQUFBLENBQUEsR0FBUSxDQUFDLEdBQUEsQ0FBSyxFQUFDLEtBQUEsRUFBUSxLQUFBLENBQUEsRUFBUSxFQUFBLENBQUE7QUFBQSxLQUFBO0FBR2pFLFdBQUEsQ0FBVSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ25CLFNBQUEsUUFBQSxFQUFVLEVBQUMsSUFBQSxDQUFBLEdBQVEsQ0FBQSxDQUFBLEVBQUssRUFBQSxFQUFJLEtBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsRUFBZ0IsRUFBQTtBQUN6RCxZQUFPLE1BQUEsR0FBUyxLQUFBLEVBQU8sUUFBQSxDQUFVLEtBQUEsQ0FBQSxHQUFRLENBQUMsR0FBQSxDQUFLLE1BQUEsRUFBUSxRQUFBLENBQUE7QUFBQSxLQUFBO0FBRzNELGNBQUEsQ0FBYSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBSTFCLFlBQU8sTUFBQSxHQUFTLEtBQUEsRUFBTyxLQUFBLENBQUEsR0FBUSxDQUFBLENBQUEsR0FBTSxFQUFBLENBQUksS0FBQSxDQUFBLEdBQVEsQ0FBQyxJQUFBLENBQUEsR0FBUSxDQUFBLENBQUEsRUFBSyxFQUFBLEVBQUksTUFBQSxDQUFRLE1BQUEsRUFBUSxFQUFBLENBQUE7QUFBQSxLQUFBO0FBR3ZGLE9BQUEsQ0FBTSxTQUFBLENBQVUsS0FBQSxDQUFPO0FBQ25CLFdBQUEsRUFBUSxlQUFjLENBQUMsS0FBQSxDQUFBO0FBQ3ZCLFlBQU8sS0FBQSxDQUFLLEtBQUEsQ0FBTSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR3RCLE9BQUEsQ0FBTSxTQUFBLENBQVUsS0FBQSxDQUFPLE1BQUEsQ0FBTztBQUMxQixXQUFBLEVBQVEsZUFBYyxDQUFDLEtBQUEsQ0FBQTtBQUN2QixRQUFBLEVBQUksTUFBTyxLQUFBLENBQUssS0FBQSxDQUFBLElBQVcsV0FBQSxDQUFZO0FBQ25DLFlBQUEsQ0FBSyxLQUFBLENBQU0sQ0FBQyxLQUFBLENBQUE7QUFBQTtBQUVoQixZQUFPLEtBQUE7QUFBQSxLQUFBO0FBTVgsUUFBQSxDQUFPLFNBQUEsQ0FBVSxHQUFBLENBQUs7QUFDbEIsUUFBQSxFQUFJLEdBQUEsSUFBUSxVQUFBLENBQVc7QUFDbkIsY0FBTyxLQUFBLENBQUEsS0FBQTtBQUFBLE9BQUEsS0FDSjtBQUNILFlBQUEsQ0FBQSxLQUFBLEVBQWEsa0JBQWlCLENBQUMsR0FBQSxDQUFBO0FBQy9CLGNBQU8sS0FBQTtBQUFBO0FBQUE7QUFBQSxHQUFBLENBQUE7QUFNbkIsVUFBUyxvQkFBQSxDQUFvQixJQUFBLENBQU0sSUFBQSxDQUFLO0FBQ3BDLFVBQUEsQ0FBQSxFQUFBLENBQVUsSUFBQSxDQUFBLEVBQVEsT0FBQSxDQUFBLEVBQUEsQ0FBVSxJQUFBLEVBQU8sSUFBQSxDQUFBLEVBQU8sU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNuRCxTQUFBLElBQUEsRUFBTSxLQUFBLENBQUEsTUFBQSxFQUFjLE1BQUEsQ0FBUSxHQUFBO0FBQ2hDLFFBQUEsRUFBSSxLQUFBLEdBQVMsS0FBQSxDQUFNO0FBQ2YsWUFBQSxDQUFBLEVBQUEsQ0FBUSxLQUFBLEVBQVEsSUFBQSxFQUFNLElBQUEsQ0FBSSxDQUFDLEtBQUEsQ0FBQTtBQUMzQixjQUFBLENBQUEsWUFBbUIsQ0FBQyxJQUFBLENBQUE7QUFDcEIsY0FBTyxLQUFBO0FBQUEsT0FBQSxLQUNKO0FBQ0gsY0FBTyxLQUFBLENBQUEsRUFBQSxDQUFRLEtBQUEsRUFBUSxJQUFBLEVBQU0sSUFBQSxDQUFJLENBQUEsQ0FBQTtBQUFBO0FBQUEsS0FBQTtBQUFBO0FBTTdDLEtBQUEsRUFBSyxDQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBSSx1QkFBQSxDQUFBLE1BQUEsQ0FBK0IsRUFBQSxFQUFBLENBQU07QUFDakQsdUJBQW1CLENBQUMsc0JBQUEsQ0FBdUIsQ0FBQSxDQUFBLENBQUEsV0FBYyxDQUFBLENBQUEsQ0FBQSxPQUFVLENBQUMsSUFBQSxDQUFNLEdBQUEsQ0FBQSxDQUFLLHVCQUFBLENBQXVCLENBQUEsQ0FBQSxDQUFBO0FBQUE7QUFJMUcscUJBQW1CLENBQUMsTUFBQSxDQUFRLFdBQUEsQ0FBQTtBQUc1QixRQUFBLENBQUEsRUFBQSxDQUFBLElBQUEsRUFBaUIsT0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBO0FBQ2pCLFFBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxFQUFtQixPQUFBLENBQUEsRUFBQSxDQUFBLEtBQUE7QUFDbkIsUUFBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLEVBQWtCLE9BQUEsQ0FBQSxFQUFBLENBQUEsSUFBQTtBQUNsQixRQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsRUFBcUIsT0FBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBO0FBR3JCLFFBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxFQUFtQixPQUFBLENBQUEsRUFBQSxDQUFBLFdBQUE7QUFPbkIsUUFBTSxDQUFDLE1BQUEsQ0FBQSxRQUFBLENBQUEsRUFBQSxFQUFxQixTQUFBLENBQUEsU0FBQSxDQUFvQjtBQUU1QyxXQUFBLENBQVUsU0FBQSxDQUFVLENBQUU7QUFDZCxTQUFBLGFBQUEsRUFBZSxLQUFBLENBQUEsYUFBQTtBQUNmLGNBQUEsRUFBTyxLQUFBLENBQUEsS0FBQTtBQUNQLGdCQUFBLEVBQVMsS0FBQSxDQUFBLE9BQUE7QUFDVCxjQUFBLEVBQU8sS0FBQSxDQUFBLEtBQUE7QUFDUCxpQkFBQTtBQUFTLGlCQUFBO0FBQVMsZUFBQTtBQUFPLGVBQUE7QUFJN0IsVUFBQSxDQUFBLFlBQUEsRUFBb0IsYUFBQSxFQUFlLEtBQUE7QUFFbkMsYUFBQSxFQUFVLFNBQVEsQ0FBQyxZQUFBLEVBQWUsS0FBQSxDQUFBO0FBQ2xDLFVBQUEsQ0FBQSxPQUFBLEVBQWUsUUFBQSxFQUFVLEdBQUE7QUFFekIsYUFBQSxFQUFVLFNBQVEsQ0FBQyxPQUFBLEVBQVUsR0FBQSxDQUFBO0FBQzdCLFVBQUEsQ0FBQSxPQUFBLEVBQWUsUUFBQSxFQUFVLEdBQUE7QUFFekIsV0FBQSxFQUFRLFNBQVEsQ0FBQyxPQUFBLEVBQVUsR0FBQSxDQUFBO0FBQzNCLFVBQUEsQ0FBQSxLQUFBLEVBQWEsTUFBQSxFQUFRLEdBQUE7QUFFckIsVUFBQSxHQUFRLFNBQVEsQ0FBQyxLQUFBLEVBQVEsR0FBQSxDQUFBO0FBQ3pCLFVBQUEsQ0FBQSxJQUFBLEVBQVksS0FBQSxFQUFPLEdBQUE7QUFFbkIsWUFBQSxHQUFVLFNBQVEsQ0FBQyxJQUFBLEVBQU8sR0FBQSxDQUFBO0FBQzFCLFVBQUEsQ0FBQSxNQUFBLEVBQWMsT0FBQSxFQUFTLEdBQUE7QUFFdkIsV0FBQSxFQUFRLFNBQVEsQ0FBQyxNQUFBLEVBQVMsR0FBQSxDQUFBO0FBQzFCLFVBQUEsQ0FBQSxLQUFBLEVBQWEsTUFBQTtBQUFBLEtBQUE7QUFHakIsU0FBQSxDQUFRLFNBQUEsQ0FBVSxDQUFFO0FBQ2hCLFlBQU8sU0FBUSxDQUFDLElBQUEsQ0FBQSxJQUFTLENBQUEsQ0FBQSxFQUFLLEVBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHbEMsV0FBQSxDQUFVLFNBQUEsQ0FBVSxDQUFFO0FBQ2xCLFlBQU8sS0FBQSxDQUFBLGFBQUEsRUFDTCxLQUFBLENBQUEsS0FBQSxFQUFhLE1BQUEsRUFDYixFQUFDLElBQUEsQ0FBQSxPQUFBLEVBQWUsR0FBQSxDQUFBLEVBQU0sT0FBQSxFQUN0QixNQUFLLENBQUMsSUFBQSxDQUFBLE9BQUEsRUFBZSxHQUFBLENBQUEsRUFBTSxRQUFBO0FBQUEsS0FBQTtBQUdqQyxZQUFBLENBQVcsU0FBQSxDQUFVLFVBQUEsQ0FBWTtBQUN6QixTQUFBLFdBQUEsRUFBYSxFQUFDLEtBQUE7QUFDZCxnQkFBQSxFQUFTLGFBQVksQ0FBQyxVQUFBLENBQVksRUFBQyxVQUFBLENBQVksS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUE7QUFFNUQsUUFBQSxFQUFJLFVBQUEsQ0FBWTtBQUNaLGNBQUEsRUFBUyxLQUFBLENBQUEsSUFBUyxDQUFBLENBQUEsQ0FBQSxVQUFhLENBQUMsVUFBQSxDQUFZLE9BQUEsQ0FBQTtBQUFBO0FBR2hELFlBQU8sS0FBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUEsVUFBYSxDQUFDLE1BQUEsQ0FBQTtBQUFBLEtBQUE7QUFHbEMsT0FBQSxDQUFNLFNBQUEsQ0FBVSxLQUFBLENBQU8sSUFBQSxDQUFLO0FBRXBCLFNBQUEsSUFBQSxFQUFNLE9BQUEsQ0FBQSxRQUFlLENBQUMsS0FBQSxDQUFPLElBQUEsQ0FBQTtBQUVqQyxVQUFBLENBQUEsYUFBQSxHQUFzQixJQUFBLENBQUEsYUFBQTtBQUN0QixVQUFBLENBQUEsS0FBQSxHQUFjLElBQUEsQ0FBQSxLQUFBO0FBQ2QsVUFBQSxDQUFBLE9BQUEsR0FBZ0IsSUFBQSxDQUFBLE9BQUE7QUFFaEIsVUFBQSxDQUFBLE9BQVksQ0FBQSxDQUFBO0FBRVosWUFBTyxLQUFBO0FBQUEsS0FBQTtBQUdYLFlBQUEsQ0FBVyxTQUFBLENBQVUsS0FBQSxDQUFPLElBQUEsQ0FBSztBQUN6QixTQUFBLElBQUEsRUFBTSxPQUFBLENBQUEsUUFBZSxDQUFDLEtBQUEsQ0FBTyxJQUFBLENBQUE7QUFFakMsVUFBQSxDQUFBLGFBQUEsR0FBc0IsSUFBQSxDQUFBLGFBQUE7QUFDdEIsVUFBQSxDQUFBLEtBQUEsR0FBYyxJQUFBLENBQUEsS0FBQTtBQUNkLFVBQUEsQ0FBQSxPQUFBLEdBQWdCLElBQUEsQ0FBQSxPQUFBO0FBRWhCLFVBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQTtBQUVaLFlBQU8sS0FBQTtBQUFBLEtBQUE7QUFHWCxPQUFBLENBQU0sU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUNuQixXQUFBLEVBQVEsZUFBYyxDQUFDLEtBQUEsQ0FBQTtBQUN2QixZQUFPLEtBQUEsQ0FBSyxLQUFBLENBQUEsV0FBaUIsQ0FBQSxDQUFBLEVBQUssSUFBQSxDQUFJLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHMUMsTUFBQSxDQUFLLFNBQUEsQ0FBVSxLQUFBLENBQU87QUFDbEIsV0FBQSxFQUFRLGVBQWMsQ0FBQyxLQUFBLENBQUE7QUFDdkIsWUFBTyxLQUFBLENBQUssSUFBQSxFQUFPLE1BQUEsQ0FBQSxNQUFZLENBQUMsQ0FBQSxDQUFBLENBQUEsV0FBYyxDQUFBLENBQUEsRUFBSyxNQUFBLENBQUEsS0FBVyxDQUFDLENBQUEsQ0FBQSxFQUFLLElBQUEsQ0FBSSxDQUFBLENBQUE7QUFBQSxLQUFBO0FBRzVFLFFBQUEsQ0FBTyxPQUFBLENBQUEsRUFBQSxDQUFBLElBQUE7QUFFUCxlQUFBLENBQWMsU0FBQSxDQUFVLENBQUU7QUFFbEIsU0FBQSxNQUFBLEVBQVEsS0FBQSxDQUFBLEdBQVEsQ0FBQyxJQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBQTtBQUMzQixnQkFBQSxFQUFTLEtBQUEsQ0FBQSxHQUFRLENBQUMsSUFBQSxDQUFBLE1BQVcsQ0FBQSxDQUFBLENBQUE7QUFDN0IsY0FBQSxFQUFPLEtBQUEsQ0FBQSxHQUFRLENBQUMsSUFBQSxDQUFBLElBQVMsQ0FBQSxDQUFBLENBQUE7QUFDekIsZUFBQSxFQUFRLEtBQUEsQ0FBQSxHQUFRLENBQUMsSUFBQSxDQUFBLEtBQVUsQ0FBQSxDQUFBLENBQUE7QUFDM0IsaUJBQUEsRUFBVSxLQUFBLENBQUEsR0FBUSxDQUFDLElBQUEsQ0FBQSxPQUFZLENBQUEsQ0FBQSxDQUFBO0FBQy9CLGlCQUFBLEVBQVUsS0FBQSxDQUFBLEdBQVEsQ0FBQyxJQUFBLENBQUEsT0FBWSxDQUFBLENBQUEsRUFBSyxLQUFBLENBQUEsWUFBaUIsQ0FBQSxDQUFBLEVBQUssS0FBQSxDQUFBO0FBRTlELFFBQUEsRUFBSSxDQUFDLElBQUEsQ0FBQSxTQUFjLENBQUEsQ0FBQSxDQUFJO0FBR25CLGNBQU8sTUFBQTtBQUFBO0FBR1gsWUFBTyxFQUFDLElBQUEsQ0FBQSxTQUFjLENBQUEsQ0FBQSxFQUFLLEVBQUEsRUFBSSxJQUFBLENBQU0sR0FBQSxDQUFBLEVBQ2pDLElBQUEsRUFDQSxFQUFDLEtBQUEsRUFBUSxNQUFBLEVBQVEsSUFBQSxDQUFNLEdBQUEsQ0FBQSxFQUN2QixFQUFDLE1BQUEsRUFBUyxPQUFBLEVBQVMsSUFBQSxDQUFNLEdBQUEsQ0FBQSxFQUN6QixFQUFDLElBQUEsRUFBTyxLQUFBLEVBQU8sSUFBQSxDQUFNLEdBQUEsQ0FBQSxFQUNyQixFQUFDLENBQUMsS0FBQSxHQUFTLFFBQUEsR0FBVyxRQUFBLENBQUEsRUFBVyxJQUFBLENBQU0sR0FBQSxDQUFBLEVBQ3ZDLEVBQUMsS0FBQSxFQUFRLE1BQUEsRUFBUSxJQUFBLENBQU0sR0FBQSxDQUFBLEVBQ3ZCLEVBQUMsT0FBQSxFQUFVLFFBQUEsRUFBVSxJQUFBLENBQU0sR0FBQSxDQUFBLEVBQzNCLEVBQUMsT0FBQSxFQUFVLFFBQUEsRUFBVSxJQUFBLENBQU0sR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBLENBQUE7QUFJdkMsVUFBUyxtQkFBQSxDQUFtQixJQUFBLENBQU07QUFDOUIsVUFBQSxDQUFBLFFBQUEsQ0FBQSxFQUFBLENBQW1CLElBQUEsQ0FBQSxFQUFRLFNBQUEsQ0FBVSxDQUFFO0FBQ25DLFlBQU8sS0FBQSxDQUFBLEtBQUEsQ0FBVyxJQUFBLENBQUE7QUFBQSxLQUFBO0FBQUE7QUFJMUIsVUFBUyxxQkFBQSxDQUFxQixJQUFBLENBQU0sT0FBQSxDQUFRO0FBQ3hDLFVBQUEsQ0FBQSxRQUFBLENBQUEsRUFBQSxDQUFtQixJQUFBLEVBQU8sS0FBQSxDQUFBLEVBQVEsU0FBQSxDQUFVLENBQUU7QUFDMUMsWUFBTyxFQUFDLEtBQUEsRUFBTyxPQUFBO0FBQUEsS0FBQTtBQUFBO0FBSXZCLEtBQUEsRUFBSyxDQUFBLEdBQUssdUJBQUEsQ0FBd0I7QUFDOUIsTUFBQSxFQUFJLHNCQUFBLENBQUEsY0FBcUMsQ0FBQyxDQUFBLENBQUEsQ0FBSTtBQUMxQywwQkFBb0IsQ0FBQyxDQUFBLENBQUcsdUJBQUEsQ0FBdUIsQ0FBQSxDQUFBLENBQUE7QUFDL0Msd0JBQWtCLENBQUMsQ0FBQSxDQUFBLFdBQWEsQ0FBQSxDQUFBLENBQUE7QUFBQTtBQUFBO0FBSXhDLHNCQUFvQixDQUFDLE9BQUEsQ0FBUyxPQUFBLENBQUE7QUFDOUIsUUFBQSxDQUFBLFFBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxFQUE4QixTQUFBLENBQVUsQ0FBRTtBQUN0QyxVQUFPLEVBQUMsQ0FBQyxLQUFBLEVBQU8sS0FBQSxDQUFBLEtBQVUsQ0FBQSxDQUFBLEVBQUssUUFBQSxDQUFBLEVBQVcsT0FBQSxFQUFTLEtBQUEsQ0FBQSxLQUFVLENBQUEsQ0FBQSxFQUFLLEdBQUE7QUFBQSxHQUFBO0FBVXRFLFFBQUEsQ0FBQSxJQUFXLENBQUMsSUFBQSxDQUFNLEVBQ2QsT0FBQSxDQUFVLFNBQUEsQ0FBVSxNQUFBLENBQVE7QUFDcEIsU0FBQSxFQUFBLEVBQUksT0FBQSxFQUFTLEdBQUE7QUFDYixnQkFBQSxFQUFTLEVBQUMsS0FBSyxDQUFDLE1BQUEsRUFBUyxJQUFBLEVBQU0sR0FBQSxDQUFBLElBQVEsRUFBQSxDQUFBLEVBQUssS0FBQSxDQUM1QyxFQUFDLENBQUEsSUFBTSxFQUFBLENBQUEsRUFBSyxLQUFBLENBQ1osRUFBQyxDQUFBLElBQU0sRUFBQSxDQUFBLEVBQUssS0FBQSxDQUNaLEVBQUMsQ0FBQSxJQUFNLEVBQUEsQ0FBQSxFQUFLLEtBQUEsQ0FBTyxLQUFBO0FBQ3ZCLFlBQU8sT0FBQSxFQUFTLE9BQUE7QUFBQSxLQUFBLENBQUEsQ0FBQTtBQVV4QixVQUFTLFdBQUEsQ0FBVyxTQUFBLENBQVc7QUFDdkIsT0FBQSxPQUFBLEVBQVMsTUFBQTtBQUFPLG9CQUFBLEVBQWUsT0FBQTtBQUVuQyxNQUFBLEVBQUksTUFBTyxNQUFBLElBQVUsWUFBQSxDQUFhO0FBQzlCLFlBQUE7QUFBQTtBQUtKLE1BQUEsRUFBSSxTQUFBLENBQVc7QUFDWCxZQUFBLENBQUEsTUFBQSxFQUFnQixTQUFBLENBQVUsQ0FBRTtBQUN4QixVQUFBLEVBQUksQ0FBQyxNQUFBLEdBQVUsUUFBQSxHQUFXLFFBQUEsQ0FBQSxJQUFBLENBQWM7QUFDcEMsZ0JBQUEsRUFBUyxLQUFBO0FBQ1QsaUJBQUEsQ0FBQSxJQUFZLENBQ0osK0NBQUEsRUFDQSxrREFBQSxFQUNBLFdBQUEsQ0FBQTtBQUFBO0FBRVosY0FBTyxhQUFBLENBQUEsS0FBa0IsQ0FBQyxJQUFBLENBQU0sVUFBQSxDQUFBO0FBQUEsT0FBQTtBQUVwQyxZQUFNLENBQUMsTUFBQSxDQUFBLE1BQUEsQ0FBZSxhQUFBLENBQUE7QUFBQSxLQUFBLEtBQ25CO0FBQ0gsWUFBQSxDQUFPLFFBQUEsQ0FBQSxFQUFZLE9BQUE7QUFBQTtBQUFBO0FBSzNCLElBQUEsRUFBSSxTQUFBLENBQVc7QUFDWCxVQUFBLENBQUEsT0FBQSxFQUFpQixPQUFBO0FBQ2pCLGNBQVUsQ0FBQyxJQUFBLENBQUE7QUFBQSxHQUFBLEtBQ1IsR0FBQSxFQUFJLE1BQU8sT0FBQSxJQUFXLFdBQUEsR0FBYyxPQUFBLENBQUEsR0FBQSxDQUFZO0FBQ25ELFVBQU0sQ0FBQyxRQUFBLENBQVUsU0FBQSxDQUFVLE9BQUEsQ0FBUyxRQUFBLENBQVMsT0FBQSxDQUFRO0FBQ2pELFFBQUEsRUFBSSxNQUFBLENBQUEsTUFBQSxHQUFpQixPQUFBLENBQUEsTUFBYSxDQUFBLENBQUEsR0FBTSxPQUFBLENBQUEsTUFBYSxDQUFBLENBQUEsQ0FBQSxRQUFBLElBQWdCLEtBQUEsQ0FBTTtBQUV2RSxrQkFBVSxDQUFDLE1BQUEsQ0FBQSxNQUFhLENBQUEsQ0FBQSxDQUFBLFFBQUEsSUFBZ0IsVUFBQSxDQUFBO0FBQUE7QUFHNUMsWUFBTyxPQUFBO0FBQUEsS0FBQSxDQUFBO0FBQUEsR0FBQSxLQUVSO0FBQ0gsY0FBVSxDQUFBLENBQUE7QUFBQTtBQUFBLENBQUEsQ0FBQSxDQUFBLElBRVgsQ0FBQyxJQUFBLENBQUE7Ozs7QUMvMUVSLE1BQUEsQ0FBQSxPQUFBLEVBQWlCLEtBQUE7QUFFakIsSUFBQSxDQUFBLEtBQUEsRUFBYSxLQUFJLENBQUMsUUFBQSxDQUFVLENBQUU7QUFDNUIsUUFBQSxDQUFBLGNBQXFCLENBQUMsUUFBQSxDQUFBLFNBQUEsQ0FBb0IsT0FBQSxDQUFRO0FBQ2hELFNBQUEsQ0FBTyxTQUFBLENBQVUsQ0FBRTtBQUNqQixZQUFPLEtBQUksQ0FBQyxJQUFBLENBQUE7QUFBQSxLQUFBO0FBRWQsZ0JBQUEsQ0FBYztBQUFBLEdBQUEsQ0FBQTtBQUFBLENBQUEsQ0FBQTtBQUlsQixRQUFTLEtBQUEsQ0FBTSxFQUFBLENBQUk7QUFDYixLQUFBLEVBQUEsRUFBSSxTQUFBLENBQVUsQ0FBRTtBQUNsQixNQUFBLEVBQUksQ0FBQSxDQUFBLE1BQUEsQ0FBVSxPQUFPLEVBQUEsQ0FBQSxLQUFBO0FBQ3JCLEtBQUEsQ0FBQSxNQUFBLEVBQVcsS0FBQTtBQUNYLFVBQU8sRUFBQSxDQUFBLEtBQUEsRUFBVSxHQUFBLENBQUEsS0FBUSxDQUFDLElBQUEsQ0FBTSxVQUFBLENBQUE7QUFBQSxHQUFBO0FBRWxDLEdBQUEsQ0FBQSxNQUFBLEVBQVcsTUFBQTtBQUNYLFFBQU8sRUFBQTtBQUFBOzs7O0FDbEJULE9BQUEsQ0FBQSxhQUFBLEVBQXdCLFFBQU8sQ0FBQyxxQkFBQSxDQUFBOzs7O0FDQTVCLEdBQUEsUUFBQSxFQUFVLFFBQU8sQ0FBQyxlQUFBLENBQUE7QUFDbEIsR0FBQSxhQUFBLEVBQWUsUUFBTyxDQUFDLFFBQUEsQ0FBQTtBQUN2QixHQUFBLE1BQUEsRUFBUSxRQUFPLENBQUMsT0FBQSxDQUFBO0FBQ2hCLEdBQUEsS0FBQSxFQUFPLFFBQU8sQ0FBQyxNQUFBLENBQUE7QUFDZixHQUFBLFlBQUEsRUFBYyxRQUFPLENBQUMsYUFBQSxDQUFBO0FBRXRCLEdBQUEsZUFBQSxFQUFpQixRQUFPLENBQUMsa0JBQUEsQ0FBQTtBQUc3QixNQUFBLENBQUEsT0FBQSxFQUFpQixjQUFBO0FBR2pCLFFBQVMsY0FBQSxDQUFjLFdBQUEsQ0FBYTtBQUNsQyxjQUFBLENBQUEsSUFBaUIsQ0FBQyxJQUFBLENBQUE7QUFFZCxLQUFBLFFBQUEsRUFBVTtBQUNaLGNBQUEsQ0FBWSxVQUFBLEVBQVksZ0JBQUE7QUFDeEIsV0FBQSxDQUFTO0FBQUEsR0FBQTtBQUdYLFFBQUEsQ0FBQSxJQUFXLENBQUMsT0FBQSxDQUFBO0FBQ1osT0FBSyxDQUFDLE9BQUEsQ0FBUyxZQUFBLENBQUE7QUFDZixRQUFBLENBQUEsTUFBYSxDQUFDLE9BQUEsQ0FBQTtBQUVkLE1BQUEsQ0FBQSxPQUFBLEVBQWUsUUFBQTtBQUdYLEtBQUEsUUFBQSxFQUFVLEVBQUEsQ0FBQTtBQUNkLEtBQUEsRUFBUyxHQUFBLEVBQUEsRUFBSSxFQUFBLENBQUcsRUFBQSxFQUFJLFFBQUEsQ0FBQSxPQUFBLENBQWlCLEVBQUEsRUFBQSxDQUFLO0FBQ3hDLFdBQUEsQ0FBQSxJQUFZLENBQUMsR0FBSSxPQUFNLENBQUMsT0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQUE7QUFJMUIsTUFBQSxDQUFBLEdBQUEsRUFBVyxZQUFXLENBQUMsT0FBQSxDQUFBO0FBRXZCLE1BQUEsQ0FBQSxTQUFBLEVBQWlCLEVBQUEsQ0FBQTtBQUNqQixNQUFBLENBQUEsVUFBQSxFQUFrQixPQUFBLENBQUEsTUFBYSxDQUFDLElBQUEsQ0FBQTtBQUVoQyxNQUFBLENBQUEsWUFBQSxFQUFvQixPQUFBLENBQUEsTUFBYSxDQUFDLElBQUEsQ0FBQTtBQUNsQyxNQUFBLENBQUEsV0FBQSxFQUFtQixPQUFBLENBQUEsTUFBYSxDQUFDLElBQUEsQ0FBQTtBQUFBO0FBRW5DLElBQUEsQ0FBQSxRQUFhLENBQUMsYUFBQSxDQUFlLGFBQUEsQ0FBQTtBQVM3QixhQUFBLENBQUEsU0FBQSxDQUFBLFlBQUEsRUFBdUMsU0FBQSxDQUFVLElBQUEsQ0FBTSxTQUFBLENBQVUsU0FBQSxDQUFVO0FBQ3JFLEtBQUEsS0FBQSxFQUFPLEtBQUE7QUFFUCxLQUFBLFFBQUEsRUFBVSxFQUFBO0FBQ1YsS0FBQSxpQkFBQSxFQUFtQixTQUFBLENBQVUsQ0FBRTtBQUNqQyxXQUFBLEVBQUE7QUFDQSxNQUFBLEVBQUksQ0FBQyxPQUFBLENBQVM7QUFDWixjQUFRLENBQUMsSUFBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBSVQsS0FBQSxPQUFBLEVBQVMsU0FBQSxDQUFBLFlBQXFCLENBQUEsQ0FBQTtBQUM5QixLQUFBLEtBQUEsRUFBTyxTQUFBLENBQVUsQ0FBRTtBQUNyQixVQUFBLENBQUEsV0FBa0IsQ0FBQyxRQUFBLENBQVUsT0FBQSxDQUFTO0FBQ3BDLFFBQUEsRUFBSSxDQUFDLE9BQUEsQ0FBQSxNQUFBLENBQWdCO0FBQ25CLGVBQUEsQ0FBQSxRQUFnQixDQUFDLGdCQUFBLENBQUE7QUFDakIsY0FBQTtBQUFBO0FBR0YsYUFBQSxDQUFBLE9BQWUsQ0FBQyxRQUFBLENBQVUsS0FBQSxDQUFPO0FBQy9CLFVBQUEsRUFBSSxLQUFBLENBQUEsSUFBQSxDQUFXLENBQUEsQ0FBQSxHQUFNLElBQUEsQ0FBSyxPQUFBO0FBRXRCLFdBQUEsVUFBQSxFQUFZLEtBQUEsRUFBTyxJQUFBLEVBQU0sTUFBQSxDQUFBLElBQUE7QUFFN0IsVUFBQSxFQUFJLEtBQUEsQ0FBQSxXQUFBLENBQW1CO0FBQ3JCLGlCQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBaUIsQ0FBQyxTQUFBLENBQVcsTUFBQSxDQUFPLGlCQUFBLENBQUE7QUFBQSxTQUFBLEtBQy9CO0FBQ0wsaUJBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFVLENBQUMsUUFBQSxDQUFVLElBQUEsQ0FBTTtBQUN6QixnQkFBQSxDQUFBLE9BQVksQ0FBQyxTQUFBLENBQVcsS0FBQSxDQUFNLGlCQUFBLENBQUE7QUFBQSxXQUFBLENBQzdCLGlCQUFBLENBQUE7QUFBQTtBQUFBLE9BQUEsQ0FBQTtBQUdQLFVBQUksQ0FBQSxDQUFBO0FBQUEsS0FBQSxDQUFBO0FBQUEsR0FBQTtBQUdSLE1BQUksQ0FBQSxDQUFBO0FBQUEsQ0FBQTtBQUdOLGFBQUEsQ0FBQSxTQUFBLENBQUEsT0FBQSxFQUFrQyxTQUFBLENBQVUsSUFBQSxDQUFNLEtBQUEsQ0FBTSxTQUFBLENBQVU7QUFFaEUsTUFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsU0FBMEIsQ0FBQyxJQUFBLENBQU0sS0FBQSxDQUFNLFNBQUEsQ0FBQTtBQUFBLENBQUE7QUFHekMsYUFBQSxDQUFBLFNBQUEsQ0FBQSxPQUFBLEVBQWtDLFNBQUEsQ0FBVSxRQUFBLENBQVUsU0FBQSxDQUFVO0FBQzlELE1BQUEsQ0FBQSxZQUFpQixDQUFDLEVBQUEsQ0FBSSxTQUFBLENBQVUsU0FBQSxDQUFBO0FBQUEsQ0FBQTtBQUdsQyxhQUFBLENBQUEsU0FBQSxDQUFBLGVBQUEsRUFBMEMsU0FBQSxDQUFVLEtBQUEsQ0FBTztBQUN6RCxJQUFBLEVBQUksSUFBQSxDQUFBLFNBQUEsQ0FBZSxLQUFBLENBQUEsQ0FBUSxPQUFBO0FBQzNCLE1BQUEsQ0FBQSxTQUFBLENBQWUsS0FBQSxDQUFBLEVBQVMsS0FBQTtBQUVwQixLQUFBLEtBQUEsRUFBTyxLQUFBO0FBQU0sVUFBQSxFQUFPLE1BQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxDQUFBLElBQTBCLENBQUMsU0FBQSxDQUFBO0FBQ25ELFNBQUEsQ0FBQSxRQUFnQixDQUFDLFFBQUEsQ0FBVSxDQUFFO0FBQzNCLFFBQUEsQ0FBQSxJQUFBLENBQUEsS0FBZSxDQUFDLElBQUEsQ0FBTSxLQUFBLENBQUE7QUFDdEIsVUFBTyxLQUFBLENBQUEsU0FBQSxDQUFlLEtBQUEsQ0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUFBLENBQUE7QUFJMUIsYUFBQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEVBQXFDLFNBQUEsQ0FBVSxJQUFBLENBQU0sU0FBQSxDQUFVO0FBQzdELElBQUEsRUFBSSxJQUFBLEdBQVEsS0FBQSxDQUFBLFVBQUEsQ0FBaUI7QUFDM0IsWUFBUSxDQUFDLElBQUEsQ0FBTSxLQUFBLENBQUEsVUFBQSxDQUFnQixJQUFBLENBQUEsQ0FBQTtBQUMvQixVQUFBO0FBQUE7QUFHRSxLQUFBLEtBQUEsRUFBTyxLQUFBO0FBQ1gsTUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFtQixDQUFDLElBQUEsQ0FBTSxTQUFBLENBQVUsR0FBQSxDQUFLLElBQUEsQ0FBSztBQUM1QyxNQUFBLEVBQUksQ0FBQyxHQUFBLENBQUssS0FBQSxDQUFBLFVBQUEsQ0FBZ0IsSUFBQSxDQUFBLEVBQVEsSUFBQTtBQUNsQyxZQUFRLENBQUMsR0FBQSxDQUFLLElBQUEsQ0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUFBLENBQUE7QUFJbEIsYUFBQSxDQUFBLFNBQUEsQ0FBQSxTQUFBLEVBQW9DLFNBQUEsQ0FBVSxTQUFBLENBQVc7QUFDbkQsS0FBQSxVQUFBLEVBQVksVUFBQSxDQUFBLFdBQXFCLENBQUMsR0FBQSxDQUFBO0FBQ2xDLEtBQUEsS0FBQSxFQUFPLFVBQUEsQ0FBQSxNQUFnQixDQUFDLENBQUEsQ0FBRyxVQUFBLENBQUEsRUFBYSxVQUFBO0FBRTVDLElBQUEsRUFBSSxJQUFBLEdBQVEsS0FBQSxDQUFBLFlBQUEsQ0FBbUIsT0FBTyxLQUFBLENBQUEsWUFBQSxDQUFrQixJQUFBLENBQUE7QUFDeEQsTUFBQSxDQUFBLFlBQUEsQ0FBa0IsSUFBQSxDQUFBLEVBQVEsS0FBQTtBQUV0QixLQUFBLEtBQUEsRUFBTyxLQUFBO0FBQ1gsTUFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFnQixDQUFDLElBQUEsQ0FBTSxTQUFBLENBQVUsR0FBQSxDQUFLLE9BQUEsQ0FBUTtBQUM1QyxNQUFBLEVBQUksR0FBQSxDQUFLO0FBQ1AsYUFBQSxDQUFBLEtBQWEsQ0FBQyxHQUFBLENBQUEsS0FBQSxDQUFBO0FBQ2QsWUFBQTtBQUFBO0FBR0YsUUFBQSxDQUFBLFlBQUEsQ0FBa0IsSUFBQSxDQUFBLEVBQVEsT0FBQTtBQUFBLEdBQUEsQ0FBQTtBQUc1QixRQUFPLEtBQUE7QUFBQSxDQUFBO0FBU1QsYUFBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQW1DLFNBQUEsQ0FBVSxJQUFBLENBQU07QUFFakQsSUFBQSxFQUFJLElBQUEsR0FBUSxLQUFBLENBQUEsV0FBQSxDQUFrQixPQUFPLEtBQUEsQ0FBQSxXQUFBLENBQWlCLElBQUEsQ0FBQTtBQUVsRCxLQUFBLEtBQUEsRUFBTyxLQUFBO0FBR1AsS0FBQSxJQUFBLEVBQU0sS0FBQSxDQUFBLEtBQVUsQ0FBQyxHQUFBLENBQUE7QUFFakIsS0FBQSxTQUFBLEVBQVcsSUFBQSxDQUFBLEtBQVMsQ0FBQSxDQUFBO0FBSXhCLElBQUEsRUFBSSxDQUFDLENBQUMsUUFBQSxHQUFZLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBbUI7QUFDbkMsUUFBQSxDQUFBLFdBQUEsQ0FBaUIsUUFBQSxDQUFBLEVBQVksS0FBQTtBQUU3QixRQUFBLENBQUEsVUFBZSxDQUFDLFFBQUEsQ0FBVSxTQUFBLENBQVUsR0FBQSxDQUFLLElBQUEsQ0FBSztBQUM1QyxRQUFBLEVBQUksR0FBQSxDQUFLO0FBQ1AsZUFBQSxDQUFBLElBQVksQ0FBQyx3QkFBQSxDQUEwQixTQUFBLENBQVUsSUFBQSxDQUFBLE9BQUEsQ0FBQTtBQUNqRCxjQUFBO0FBQUE7QUFHRSxTQUFBLE1BQUEsRUFBUSxJQUFJLE1BQUssQ0FBQSxDQUFBO0FBQ3JCLFdBQUEsQ0FBQSxHQUFBLEVBQVksSUFBQTtBQUNaLFdBQUEsQ0FBQSxNQUFBLEVBQWUsU0FBQSxDQUFVLENBQUU7QUFDekIsWUFBQSxDQUFBLFdBQUEsQ0FBaUIsUUFBQSxDQUFBLEVBQVksTUFBQTtBQUM3QixZQUFBLENBQUEsZUFBb0IsQ0FBQyxRQUFBLENBQUE7QUFBQSxPQUFBO0FBQUEsS0FBQSxDQUFBO0FBQUE7QUFLdkIsS0FBQSxNQUFBLEVBQVEsS0FBQSxDQUFBLFdBQUEsQ0FBaUIsUUFBQSxDQUFBO0FBQzdCLElBQUEsRUFBSSxDQUFDLEtBQUEsQ0FBTyxPQUFPLEtBQUE7QUFHZixLQUFBLE9BQUEsRUFBUyxTQUFBLENBQUEsYUFBc0IsQ0FBQyxRQUFBLENBQUE7QUFDcEMsUUFBQSxDQUFBLEtBQUEsRUFBZSxNQUFBLENBQUEsS0FBQTtBQUNmLFFBQUEsQ0FBQSxNQUFBLEVBQWdCLE1BQUEsQ0FBQSxNQUFBO0FBSVosS0FBQSxJQUFBLEVBQU0sRUFBQTtBQUFHLGdCQUFBLEVBQWEsRUFBQTtBQUFHLGFBQUE7QUFDN0IsS0FBQSxFQUFTLEdBQUEsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksSUFBQSxDQUFBLE1BQUEsQ0FBWSxFQUFBLEVBQUEsQ0FBSztBQUMvQixPQUFBLEdBQUEsRUFBSyxJQUFBLENBQUksQ0FBQSxDQUFBLENBQUEsS0FBUSxDQUFDLE1BQUEsQ0FBQTtBQUN0QixVQUFBLEVBQVEsRUFBQSxDQUFHLENBQUEsQ0FBQSxDQUFBO0FBRVQsVUFBSyxZQUFBO0FBQ0gsa0JBQUEsRUFBYSxTQUFRLENBQUMsRUFBQSxDQUFHLENBQUEsQ0FBQSxDQUFBO0FBQ3pCLFVBQUEsRUFBSSxLQUFBLENBQUEsS0FBQSxFQUFjLFdBQUEsQ0FBWTtBQUM1QixpQkFBQSxDQUFBLElBQVksQ0FBQyxLQUFBLENBQUEsS0FBQSxFQUFjLHFCQUFBLEVBQXVCLFdBQUEsRUFBYSxLQUFBLEVBQU8sS0FBQSxFQUFPLElBQUEsQ0FBQTtBQUFBO0FBRS9FLGFBQUE7QUFDRixVQUFLLFdBQUE7QUFDSCxXQUFBLEVBQU0sV0FBVSxDQUFDLEVBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBQTtBQUNwQixhQUFBO0FBQ0YsVUFBSyxVQUFBO0FBQ0gsVUFBQSxFQUFJLENBQUMsT0FBQSxDQUFTLFFBQUEsRUFBVSxFQUFBLENBQUE7QUFDeEIsV0FBQSxFQUFTLEdBQUEsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksR0FBQSxDQUFBLE1BQUEsQ0FBVyxFQUFBLEdBQUssRUFBQSxDQUFHO0FBQ2pDLGFBQUEsS0FBQSxFQUFPLEVBQ1QsUUFBUSxDQUFDLEVBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBQSxNQUFTLENBQUMsQ0FBQSxDQUFHLEVBQUEsQ0FBQSxDQUFJLEdBQUEsQ0FBQSxDQUM3QixTQUFRLENBQUMsRUFBQSxDQUFHLENBQUEsQ0FBQSxDQUFBLE1BQVMsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBLENBQUksR0FBQSxDQUFBLENBQzdCLFNBQVEsQ0FBQyxFQUFBLENBQUcsQ0FBQSxDQUFBLENBQUEsTUFBUyxDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUEsQ0FBSSxHQUFBLENBQUEsQ0FBQTtBQUczQixhQUFBLEdBQUEsRUFBSyxFQUNQLFFBQVEsQ0FBQyxFQUFBLENBQUcsQ0FBQSxFQUFJLEVBQUEsQ0FBQSxDQUFBLE1BQVMsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBLENBQUksR0FBQSxDQUFBLENBQ2pDLFNBQVEsQ0FBQyxFQUFBLENBQUcsQ0FBQSxFQUFJLEVBQUEsQ0FBQSxDQUFBLE1BQVMsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBLENBQUksR0FBQSxDQUFBLENBQ2pDLFNBQVEsQ0FBQyxFQUFBLENBQUcsQ0FBQSxFQUFJLEVBQUEsQ0FBQSxDQUFBLE1BQVMsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBLENBQUksR0FBQSxDQUFBLENBQUE7QUFHbkMsaUJBQUEsQ0FBUSxJQUFBLENBQUEsRUFBUSxHQUFBO0FBQUE7QUFFbEIsYUFBQTtBQUNGLGFBQUE7QUFDRSxlQUFBLENBQUEsSUFBWSxDQUFDLDhCQUFBLENBQWdDLEdBQUEsQ0FBQTtBQUFBO0FBQUE7QUFJL0MsS0FBQSxRQUFBLEVBQVUsT0FBQSxDQUFBLFVBQWlCLENBQUMsSUFBQSxDQUFBO0FBRWhDLElBQUEsRUFBSSxVQUFBLENBQVk7QUFDZCxXQUFBLENBQUEsSUFBWSxDQUFBLENBQUE7QUFDWixXQUFBLENBQUEsS0FBYSxDQUFDLENBQUMsRUFBQSxDQUFHLEVBQUEsQ0FBQTtBQUNsQixPQUFBLEVBQVMsR0FBQSxFQUFBLEVBQUksRUFBQSxDQUFHLEVBQUEsRUFBSSxXQUFBLEdBQWMsTUFBQSxDQUFBLEtBQUEsQ0FBYSxFQUFBLEdBQUssV0FBQSxDQUFZO0FBQzFELFNBQUEsU0FBQSxFQUFXLEVBQUMsRUFBQyxDQUFBLEVBQUksV0FBQSxDQUFBO0FBQWEsWUFBQSxFQUFLLFdBQUE7QUFBWSxZQUFBLEVBQUssTUFBQSxDQUFBLE1BQUE7QUFDeEQsYUFBQSxDQUFBLFNBQWlCLENBQUMsS0FBQSxDQUFPLEVBQUEsQ0FBRyxFQUFBLENBQUcsR0FBQSxDQUFJLEdBQUEsQ0FBSSxTQUFBLENBQVUsRUFBQSxDQUFHLEdBQUEsQ0FBSSxHQUFBLENBQUE7QUFBQTtBQUUxRCxXQUFBLENBQUEsT0FBZSxDQUFBLENBQUE7QUFBQSxHQUFBLEtBQ1Y7QUFDTCxXQUFBLENBQUEsU0FBaUIsQ0FBQyxLQUFBLENBQU8sRUFBQSxDQUFHLEVBQUEsQ0FBQTtBQUFBO0FBRzlCLElBQUEsRUFBSSxHQUFBLEdBQU8sUUFBQSxDQUFTO0FBQ2QsT0FBQSxVQUFBLEVBQVksUUFBQSxDQUFBLFlBQW9CLENBQUMsQ0FBQSxDQUFHLEVBQUEsQ0FBRyxNQUFBLENBQUEsS0FBQSxDQUFhLE1BQUEsQ0FBQSxNQUFBLENBQUE7QUFDcEQsWUFBQSxFQUFPLFVBQUEsQ0FBQSxJQUFBO0FBQ1gsT0FBQSxFQUFTLEdBQUEsRUFBQSxFQUFJLEVBQUEsQ0FBRyxFQUFBLEVBQUksS0FBQSxDQUFBLE1BQUEsQ0FBYSxFQUFBLEdBQUssRUFBQSxDQUFHO0FBQ3ZDLFFBQUEsRUFBSSxPQUFBLENBQVM7QUFDUCxXQUFBLE1BQUEsRUFBUSxRQUFBLENBQVEsSUFBQSxDQUFLLENBQUEsQ0FBQSxFQUFLLElBQUEsRUFBTSxLQUFBLENBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBQSxFQUFLLElBQUEsRUFBTSxLQUFBLENBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBQSxDQUFBO0FBQ2pFLFVBQUEsRUFBSSxLQUFBLENBQU87QUFDVCxjQUFBLENBQUssQ0FBQSxDQUFBLEVBQUssTUFBQSxDQUFNLENBQUEsQ0FBQTtBQUNoQixjQUFBLENBQUssQ0FBQSxFQUFJLEVBQUEsQ0FBQSxFQUFLLE1BQUEsQ0FBTSxDQUFBLENBQUE7QUFDcEIsY0FBQSxDQUFLLENBQUEsRUFBSSxFQUFBLENBQUEsRUFBSyxNQUFBLENBQU0sQ0FBQSxDQUFBO0FBQUE7QUFBQTtBQUl4QixRQUFBLEVBQUksR0FBQSxDQUFLO0FBQ1AsV0FBQSxFQUFNLFFBQUEsQ0FBQSxPQUFlLENBQUMsSUFBQSxDQUFLLENBQUEsQ0FBQSxDQUFJLEtBQUEsQ0FBSyxDQUFBLEVBQUksRUFBQSxDQUFBLENBQUksS0FBQSxDQUFLLENBQUEsRUFBSSxFQUFBLENBQUEsQ0FBQTtBQUVyRCxXQUFBLENBQUksQ0FBQSxDQUFBLEdBQU0sSUFBQTtBQUNWLFVBQUEsRUFBSSxHQUFBLENBQUksQ0FBQSxDQUFBLEVBQUssRUFBQSxDQUFHLElBQUEsQ0FBSSxDQUFBLENBQUEsR0FBTSxJQUFBLENBQUEsS0FDckIsR0FBQSxFQUFJLEdBQUEsQ0FBSSxDQUFBLENBQUEsR0FBTSxJQUFBLENBQUssSUFBQSxDQUFJLENBQUEsQ0FBQSxHQUFNLElBQUE7QUFFbEMsV0FBQSxFQUFNLFFBQUEsQ0FBQSxPQUFlLENBQUMsR0FBQSxDQUFBO0FBRXRCLFlBQUEsQ0FBSyxDQUFBLENBQUEsRUFBSyxJQUFBLENBQUksQ0FBQSxDQUFBO0FBQ2QsWUFBQSxDQUFLLENBQUEsRUFBSSxFQUFBLENBQUEsRUFBSyxJQUFBLENBQUksQ0FBQSxDQUFBO0FBQ2xCLFlBQUEsQ0FBSyxDQUFBLEVBQUksRUFBQSxDQUFBLEVBQUssSUFBQSxDQUFJLENBQUEsQ0FBQTtBQUFBO0FBQUE7QUFHdEIsV0FBQSxDQUFBLFlBQW9CLENBQUMsU0FBQSxDQUFXLEVBQUEsQ0FBRyxFQUFBLENBQUE7QUFBQTtBQUdyQyxNQUFBLENBQUEsV0FBQSxDQUFpQixJQUFBLENBQUEsRUFBUSxLQUFBO0FBR3pCLE9BQUEsRUFBUSxJQUFJLE1BQUssQ0FBQSxDQUFBO0FBQ2pCLE9BQUEsQ0FBQSxNQUFBLEVBQWUsU0FBQSxDQUFVLENBQUU7QUFDekIsUUFBQSxDQUFBLFdBQUEsQ0FBaUIsSUFBQSxDQUFBLEVBQVEsTUFBQTtBQUN6QixRQUFBLENBQUEsZUFBb0IsQ0FBQyxRQUFBLENBQUE7QUFBQSxHQUFBO0FBRXZCLE9BQUEsQ0FBQSxHQUFBLEVBQVksT0FBQSxDQUFBLFNBQWdCLENBQUEsQ0FBQTtBQUU1QixRQUFPLEtBQUE7QUFBQSxDQUFBO0FBR1QsYUFBQSxDQUFBLFNBQUEsQ0FBQSxpQkFBQSxFQUE0QyxTQUFBLENBQVUsU0FBQSxDQUFXO0FBQy9ELFFBQU8sSUFBSSxlQUFjLENBQUMsSUFBQSxDQUFNLFVBQUEsQ0FBQTtBQUFBLENBQUE7QUFHbEMsYUFBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQTBDLFNBQUEsQ0FBVSxRQUFBLENBQVUsS0FBQSxDQUFNO0FBQ2xFLElBQUEsRUFBSSxJQUFBLENBQUssQ0FBQSxDQUFBLEdBQU0sSUFBQSxDQUFLLE9BQU8sS0FBQTtBQUN2QixLQUFBLEtBQUEsRUFBTyxTQUFBLENBQUEsUUFBQTtBQUNYLFFBQU8sS0FBQSxDQUFBLE1BQVcsQ0FBQyxDQUFBLENBQUcsS0FBQSxDQUFBLFdBQWdCLENBQUMsR0FBQSxDQUFBLEVBQU8sRUFBQSxDQUFBLEVBQUssS0FBQTtBQUFBLENBQUE7QUFHckQsYUFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQXVDLFNBQUEsQ0FBVSxRQUFBLENBQVUsTUFBQSxDQUFPLGFBQUEsQ0FBYztBQUM5RSxJQUFBLEVBQUksQ0FBQyxDQUFDLEtBQUEsR0FBUyxTQUFBLENBQUEsQ0FBVztBQUN4QixTQUFNLElBQUksTUFBSyxDQUFDLFNBQUEsRUFBWSxNQUFBLEVBQVEsc0JBQUEsRUFBd0IsS0FBQSxDQUFBLFNBQWMsQ0FBQyxRQUFBLENBQUEsQ0FBQTtBQUFBO0FBRzdFLE1BQUEsRUFBTyxLQUFBLENBQUEsZUFBb0IsQ0FBQyxRQUFBLENBQVUsU0FBQSxDQUFTLEtBQUEsQ0FBQSxDQUFBO0FBRy9DLElBQUEsRUFBSSxZQUFBLENBQWM7QUFDaEIsUUFBQSxHQUFRLGFBQUEsRUFBZSxFQUFDLFlBQUEsRUFBZSxJQUFBLEVBQU0sSUFBQSxDQUFBO0FBQUE7QUFHL0MsUUFBTyxLQUFBLENBQUEsUUFBYSxDQUFDLElBQUEsQ0FBQTtBQUFBLENBQUE7QUFHdkIsYUFBQSxDQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQXdDLFNBQUEsQ0FBVSxTQUFBLENBQVcsU0FBQSxDQUFVO0FBQ2pFLEtBQUEsS0FBQSxFQUFPLEtBQUE7QUFDWCxNQUFBLENBQUEsR0FBQSxDQUFBLGFBQXNCLENBQUMsU0FBQSxDQUFXLFNBQUEsQ0FBVSxHQUFBLENBQUssVUFBQSxDQUFXO0FBQzFELFlBQVEsQ0FBQyxHQUFBLENBQUssVUFBQSxDQUFBO0FBQ2QsTUFBQSxFQUFJLENBQUMsR0FBQSxDQUFLO0FBQ1IsVUFBQSxDQUFBLGVBQW9CLENBQUMsV0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBLENBQUE7QUFBQSxDQUFBOzs7Ozs7QUMxVDNCLE1BQUEsQ0FBQSxPQUFBLEVBQWlCLGVBQUE7QUFHakIsUUFBUyxlQUFBLENBQWUsYUFBQSxDQUFlLFVBQUEsQ0FBVztBQUNoRCxNQUFBLENBQUEsTUFBQSxFQUFjLGNBQUE7QUFDZCxNQUFBLENBQUEsU0FBQSxFQUFpQixVQUFBO0FBRWpCLE1BQUEsQ0FBQSxLQUFBLEVBQWEsS0FBQTtBQUViLE1BQUEsQ0FBQSxhQUFBLEVBQXFCLE1BQUE7QUFBQTtBQUd2QixjQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsRUFBK0IsU0FBQSxDQUFVLEVBQUEsQ0FBSTtBQUMzQyxJQUFBLEVBQUksQ0FBQyxJQUFBLENBQUEsS0FBQSxDQUFZLE9BQU8sS0FBQTtBQUN4QixRQUFPLEtBQUEsQ0FBQSxLQUFBLENBQVcsRUFBQSxDQUFBLEdBQU8sS0FBQTtBQUFBLENBQUE7QUFHM0IsY0FBQSxDQUFBLFNBQUEsQ0FBQSxTQUFBLEVBQXFDLFNBQUEsQ0FBVSxDQUFFO0FBQy9DLElBQUEsRUFBSSxJQUFBLENBQUEsYUFBQSxDQUFvQixPQUFBO0FBQ3hCLE1BQUEsQ0FBQSxhQUFBLEVBQXFCLEtBQUE7QUFHakIsS0FBQSxLQUFBLEVBQU8sS0FBQTtBQUNYLE1BQUEsQ0FBQSxNQUFBLENBQUEsYUFBeUIsQ0FBQyxJQUFBLENBQUEsU0FBQSxDQUFnQixTQUFBLENBQVUsR0FBQSxDQUFLLE1BQUEsQ0FBTztBQUM5RCxRQUFBLENBQUEsYUFBQSxFQUFxQixNQUFBO0FBQ3JCLFFBQUEsQ0FBQSxLQUFBLEVBQWEsTUFBQTtBQUFBLEdBQUEsQ0FBQTtBQUFBLENBQUE7Ozs7QUN6QmpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFBLENBQVMsVUFBQTtBQUNULE1BQUEsQ0FBSSxVQUFBO0FBQ0osWUFBQSxDQUFVLFVBQUE7QUFDVixXQUFBLENBQVMsRUFBQyxJQUFBLENBQU0sUUFBQTtBQUFBLEdBQUE7QUFBQTs7OztBQ2hCcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgc3RhcmJvdW5kID0gcmVxdWlyZSgnLi9saWIvc3RhcmJvdW5kJykuc2V0dXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdwb3J0JykpO1xuXG4vLyBTZXQgdXAgVUkgY29tcG9uZW50cy5cbnJlcXVpcmUoJy4vbGliL3VpL29zJykoKTtcbnJlcXVpcmUoJy4vbGliL3VpL3Byb2dyZXNzJykoc3RhcmJvdW5kKTtcbnJlcXVpcmUoJy4vbGliL3VpL3dvcmxkLXNlbGVjdG9yJykoc3RhcmJvdW5kKTtcblxucmVxdWlyZSgnLi9saWIvdWkvd2ViLXNlbGVjdG9yJykoc3RhcmJvdW5kLCAoZXJyb3IsIGluZm8pID0+IHtcbiAgLy8gRmluZCB0aGUgbW9zdCByZWNlbnQgd29ybGQsIGxvYWQgaXQsIGFuZCByZW5kZXIgaXQuXG4gIHZhciBtb3N0UmVjZW50V29ybGQgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGluZm8ud29ybGRGaWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB3b3JsZCA9IGluZm8ud29ybGRGaWxlc1tpXTtcblxuICAgIHZhciBpc01vcmVSZWNlbnQgPSAhbW9zdFJlY2VudFdvcmxkIHx8IHdvcmxkLmxhc3RNb2RpZmllZERhdGUgPiBtb3N0UmVjZW50V29ybGQubGFzdE1vZGlmaWVkRGF0ZTtcblxuICAgIGlmICh3b3JsZC5uYW1lLm1hdGNoKC9cXC53b3JsZCQvKSAmJiBpc01vcmVSZWNlbnQpIHtcbiAgICAgIG1vc3RSZWNlbnRXb3JsZCA9IHdvcmxkO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtb3N0UmVjZW50V29ybGQpIHtcbiAgICBzdGFyYm91bmQud29ybGRzLm9wZW4obW9zdFJlY2VudFdvcmxkLCBmdW5jdGlvbiAoZXJyb3IsIHdvcmxkKSB7XG4gICAgICBpZiAoIWVycm9yKSBzdGFyYm91bmQucmVuZGVyZXIuc2V0V29ybGQod29ybGQpO1xuICAgIH0pO1xuICB9XG59KTtcblxuc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCdsb2FkJywgKCkgPT4ge1xuICAkKCcjd29ybGQtc3RhdHVzJykudGV4dChzdGFyYm91bmQucmVuZGVyZXIud29ybGQubmFtZSk7XG59KTtcblxuc3RhcmJvdW5kLnJlbmRlcmVyLm9uKCd1bmxvYWQnLCAoKSA9PiB7XG4gICQoJyN3b3JsZC1zdGF0dXMnKS50ZXh0KCdObyB3b3JsZCBsb2FkZWQnKTtcbn0pO1xuIiwidmFyIEFzc2V0c01hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtYXNzZXRzJykuQXNzZXRzTWFuYWdlcjtcbnZhciBXb3JsZE1hbmFnZXIgPSByZXF1aXJlKCdzdGFyYm91bmQtd29ybGQnKS5Xb3JsZE1hbmFnZXI7XG52YXIgV29ybGRSZW5kZXJlciA9IHJlcXVpcmUoJ3N0YXJib3VuZC13b3JsZCcpLldvcmxkUmVuZGVyZXI7XG5cbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiAodmlld3BvcnQpIHtcbiAgLy8gQ3JlYXRlIGFuIGFzc2V0cyBtYW5hZ2VyIHdoaWNoIHdpbGwgZGVhbCB3aXRoIHBhY2thZ2UgZmlsZXMgZXRjLlxuICB2YXIgYXNzZXRzID0gbmV3IEFzc2V0c01hbmFnZXIoe1xuICAgIHdvcmtlclBhdGg6ICdidWlsZC93b3JrZXItYXNzZXRzLmpzJyxcbiAgICB3b3JrZXJzOiA0XG4gIH0pO1xuXG4gIC8vIENyZWF0ZSBhIHdvcmxkIG1hbmFnZXIgdGhhdCBoYW5kbGVzIGxvYWRpbmcgd29ybGRzLlxuICB2YXIgd29ybGRzID0gbmV3IFdvcmxkTWFuYWdlcih7d29ya2VyUGF0aDogJ2J1aWxkL3dvcmtlci13b3JsZC5qcyd9KTtcblxuICAvLyBTZXQgdXAgYSByZW5kZXJlciB0aGF0IHdpbGwgcmVuZGVyIHRoZSBncmFwaGljcyBvbnRvIHNjcmVlbi5cbiAgdmFyIHJlbmRlcmVyID0gbmV3IFdvcmxkUmVuZGVyZXIodmlld3BvcnQsIGFzc2V0cyk7XG5cbiAgLy8gVXBkYXRlIHRoZSB2aWV3cG9ydCB3aGVuIHRoZSBwYWdlIGlzIHJlc2l6ZWQuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVmcmVzaCgpO1xuICB9KTtcblxuICAvLyBFbmFibGUga2V5Ym9hcmQgc2Nyb2xsaW5nLlxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM3OlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoLTEwLCAwLCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM4OlxuICAgICAgICByZW5kZXJlci5zY3JvbGwoMCwgMTAsIHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzk6XG4gICAgICAgIHJlbmRlcmVyLnNjcm9sbCgxMCwgMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDpcbiAgICAgICAgcmVuZGVyZXIuc2Nyb2xsKDAsIC0xMCwgdHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIEVuYWJsZSBkcmFnZ2luZyB0byBzY3JvbGwuXG4gIHZhciBkcmFnZ2luZyA9IG51bGw7XG4gIHZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgZHJhZ2dpbmcgPSBbZS5jbGllbnRYLCBlLmNsaWVudFldO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XG4gICAgcmVuZGVyZXIuc2Nyb2xsKGRyYWdnaW5nWzBdIC0gZS5jbGllbnRYLCBlLmNsaWVudFkgLSBkcmFnZ2luZ1sxXSwgdHJ1ZSk7XG4gICAgZHJhZ2dpbmdbMF0gPSBlLmNsaWVudFg7XG4gICAgZHJhZ2dpbmdbMV0gPSBlLmNsaWVudFk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgZHJhZ2dpbmcgPSBudWxsO1xuICB9KTtcblxuICAvLyBFbmFibGUgem9vbWluZyB3aXRoIHRoZSBtb3VzZSB3aGVlbC5cbiAgdmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLmRlbHRhWSA+IDApIHJlbmRlcmVyLnpvb21PdXQoKTtcbiAgICBpZiAoZS5kZWx0YVkgPCAwKSByZW5kZXJlci56b29tSW4oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgYXNzZXRzOiBhc3NldHMsXG4gICAgcmVuZGVyZXI6IHJlbmRlcmVyLFxuICAgIHdvcmxkczogd29ybGRzLFxuICB9O1xufTtcbiIsInZhciB1YSA9IHJlcXVpcmUoJ3VzZXJhZ2VudC13dGYnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHN3aXRjaCAodWEub3MpIHtcbiAgICBjYXNlICdtYWMnOlxuICAgICAgJCgnLm1hYycpLnNob3coKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3dpbmRvd3MnOlxuICAgICAgJCgnLndpbmRvd3MnKS5zaG93KCk7XG4gICAgICBicmVhaztcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0YXJib3VuZCkge1xuICB2YXIgbWF4VGFza3MgPSAwLFxuICAgICAgcHJvZ3Jlc3MgPSAkKCcjcHJvZ3Jlc3MnKTtcblxuICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBsb29wKCkge1xuICAgIHZhciBwZW5kaW5nVGFza3MgPSBzdGFyYm91bmQuYXNzZXRzLmFwaS5wZW5kaW5nQ2FsbHMgK1xuICAgICAgICAgICAgICAgICAgICAgICBzdGFyYm91bmQud29ybGRzLmFwaS5wZW5kaW5nQ2FsbHM7XG5cbiAgICBpZiAocGVuZGluZ1Rhc2tzKSB7XG4gICAgICBpZiAobWF4VGFza3MgPCBwZW5kaW5nVGFza3MpIHtcbiAgICAgICAgbWF4VGFza3MgPSBwZW5kaW5nVGFza3M7XG4gICAgICB9XG5cbiAgICAgIHZhciBwZXJjZW50YWdlID0gKG1heFRhc2tzICogMS4xIC0gcGVuZGluZ1Rhc2tzKSAvIChtYXhUYXNrcyAqIDEuMSkgKiAxMDA7XG4gICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgcGVyY2VudGFnZSArICclJyk7XG4gICAgICBwcm9ncmVzcy5zaG93KCk7XG4gICAgfSBlbHNlIGlmIChtYXhUYXNrcykge1xuICAgICAgbWF4VGFza3MgPSAwO1xuICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsICcxMDAlJyk7XG4gICAgICBwcm9ncmVzcy5mYWRlT3V0KCk7XG4gICAgfVxuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xuICB9KTtcbn07XG4iLCJ2YXIgb25jZSA9IHJlcXVpcmUoJ29uY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RhcmJvdW5kLCBjYWxsYmFjaykge1xuICB2YXIgZGlyZWN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpcmVjdG9yeScpLFxuICAgICAgZmlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaWxlJyk7XG5cbiAgaWYgKGRpcmVjdG9yeS53ZWJraXRkaXJlY3RvcnkpIHtcbiAgICAkKCcjZGlyZWN0b3J5LXNlbGVjdG9yJykubW9kYWwoe2JhY2tkcm9wOiAnc3RhdGljJywga2V5Ym9hcmQ6IGZhbHNlfSk7XG4gICAgZGlyZWN0b3J5Lm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgYSBTdGFyYm91bmQgZGlyZWN0b3J5IGlzIHNlbGVjdGVkLlxuICAgICAgdmFyIHZlcmlmaWVkID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmZpbGVzW2ldO1xuICAgICAgICBpZiAoZmlsZS53ZWJraXRSZWxhdGl2ZVBhdGggPT0gJ1N0YXJib3VuZC9hc3NldHMvcGFja2VkLnBhaycpIHtcbiAgICAgICAgICB2ZXJpZmllZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHN0YXR1cyA9ICQoJyNkaXJlY3Rvcnktc3RhdHVzJyk7XG4gICAgICBpZiAodmVyaWZpZWQpIHtcbiAgICAgICAgc3RhdHVzLmF0dHIoJ2NsYXNzJywgJ3RleHQtc3VjY2VzcycpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3BhbicpLmF0dHIoJ2NsYXNzJywgJ2dseXBoaWNvbiBnbHlwaGljb24tb2snKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3N0cm9uZycpLnRleHQoJ0NsaWNrIExvYWQgYXNzZXRzIHRvIGNvbnRpbnVlJylcbiAgICAgICAgJCgnI2xvYWQtZGlyZWN0b3J5JykuYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0dXMuYXR0cignY2xhc3MnLCAndGV4dC1kYW5nZXInKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3NwYW4nKS5hdHRyKCdjbGFzcycsICdnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZScpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3Ryb25nJykudGV4dCgnVGhhdCBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgdGhlIFN0YXJib3VuZCBkaXJlY3RvcnknKVxuICAgICAgICAkKCcjbG9hZC1kaXJlY3RvcnknKS5hdHRyKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgJCgnI2ZpbGUtc2VsZWN0b3InKS5tb2RhbCh7YmFja2Ryb3A6ICdzdGF0aWMnLCBrZXlib2FyZDogZmFsc2V9KTtcbiAgICBmaWxlLm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgcGFja2VkLnBhayBpcyBzZWxlY3RlZC5cbiAgICAgIHZhciBzdGF0dXMgPSAkKCcjZmlsZS1zdGF0dXMnKTtcbiAgICAgIGlmICh0aGlzLmZpbGVzWzBdLm5hbWUgPT0gJ3BhY2tlZC5wYWsnKSB7XG4gICAgICAgIHN0YXR1cy5hdHRyKCdjbGFzcycsICd0ZXh0LXN1Y2Nlc3MnKTtcbiAgICAgICAgc3RhdHVzLmZpbmQoJ3NwYW4nKS5hdHRyKCdjbGFzcycsICdnbHlwaGljb24gZ2x5cGhpY29uLW9rJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzdHJvbmcnKS50ZXh0KCdDbGljayBMb2FkIGFzc2V0cyB0byBjb250aW51ZScpXG4gICAgICAgICQoJyNsb2FkLWZpbGUnKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXR1cy5hdHRyKCdjbGFzcycsICd0ZXh0LWRhbmdlcicpO1xuICAgICAgICBzdGF0dXMuZmluZCgnc3BhbicpLmF0dHIoJ2NsYXNzJywgJ2dseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlJyk7XG4gICAgICAgIHN0YXR1cy5maW5kKCdzdHJvbmcnKS50ZXh0KCdUaGF0IGRvZXMgbm90IGFwcGVhciB0byBiZSB0aGUgcGFja2VkLnBhayBmaWxlJylcbiAgICAgICAgJCgnI2xvYWQtZmlsZScpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gICQoJyNsb2FkLWRpcmVjdG9yeScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGVuZGluZ0ZpbGVzID0gMDtcblxuICAgIHZhciB3b3JsZEZpbGVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaXJlY3RvcnkuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBmaWxlID0gZGlyZWN0b3J5LmZpbGVzW2ldLFxuICAgICAgICAgIHBhdGggPSBmaWxlLndlYmtpdFJlbGF0aXZlUGF0aCxcbiAgICAgICAgICBtYXRjaDtcblxuICAgICAgLy8gU2tpcCBoaWRkZW4gZmlsZXMvZGlyZWN0b3JpZXMuXG4gICAgICBpZiAoZmlsZS5uYW1lWzBdID09ICcuJykgY29udGludWU7XG5cbiAgICAgIGlmIChmaWxlLm5hbWUubWF0Y2goL1xcLihzaGlwKT93b3JsZCQvKSkge1xuICAgICAgICB3b3JsZEZpbGVzLnB1c2goZmlsZSk7XG4gICAgICB9IGVsc2UgaWYgKG1hdGNoID0gcGF0aC5tYXRjaCgvXlN0YXJib3VuZFxcLyg/OmFzc2V0c3xtb2RzKShcXC8uKikvKSkge1xuICAgICAgICAvLyBOb3Qgc3VyZSB3aHkgbXVzaWMgZmlsZXMgYXJlIHN0b3JlZCBpbmNvcnJlY3RseSBsaWtlIHRoaXMuXG4gICAgICAgIGlmIChtYXRjaFsxXS5zdWJzdHIoMCwgMTMpID09ICcvbXVzaWMvbXVzaWMvJykge1xuICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0uc3Vic3RyKDYpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoZSBmaWxlIGFuZCB0aGVuIHByZWxvYWQgdGhlIHJlbmRlcmVyIG9uY2UgYWxsIGFzc2V0cyBoYXZlIGJlZW5cbiAgICAgICAgLy8gYWRkZWQuXG4gICAgICAgIHBlbmRpbmdGaWxlcysrO1xuICAgICAgICBzdGFyYm91bmQuYXNzZXRzLmFkZEZpbGUobWF0Y2hbMV0sIGZpbGUsIG9uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIHBlbmRpbmdGaWxlcy0tO1xuICAgICAgICAgIGlmICghcGVuZGluZ0ZpbGVzKSB7XG4gICAgICAgICAgICBzdGFyYm91bmQucmVuZGVyZXIucHJlbG9hZCgpO1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3dvcmxkRmlsZXM6IHdvcmxkRmlsZXN9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAkKCcjZGlyZWN0b3J5LXNlbGVjdG9yJykubW9kYWwoJ2hpZGUnKTtcbiAgfSk7XG5cbiAgJCgnI2xvYWQtZmlsZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBBbGxvdyBhZGRpbmcgbW9kcz9cbiAgICBzdGFyYm91bmQuYXNzZXRzLmFkZEZpbGUoJy8nLCBmaWxlLmZpbGVzWzBdLCBvbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0YXJib3VuZC5yZW5kZXJlci5wcmVsb2FkKCk7XG4gICAgICBjYWxsYmFjayhudWxsLCB7d29ybGRGaWxlczogW119KTtcbiAgICB9KSk7XG5cbiAgICAkKCcjZmlsZS1zZWxlY3RvcicpLm1vZGFsKCdoaWRlJyk7XG4gIH0pO1xufTtcbiIsInZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RhcmJvdW5kKSB7XG4gIHZhciBhZGRXb3JsZHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXdvcmxkLWZpbGVzJyk7XG4gIGFkZFdvcmxkcy5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWRkV29ybGRzLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzdGFyYm91bmQud29ybGRzLm9wZW4oYWRkV29ybGRzLmZpbGVzW2ldKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHdvcmxkTGlzdCA9ICQoJyN3b3JsZHMnKTtcblxuICB2YXIgd29ybGRzID0gW107XG5cbiAgd29ybGRMaXN0Lm9uKCdjbGljaycsICcubGlzdC1ncm91cC1pdGVtJywgKGV2ZW50KSA9PiB7XG4gICAgdmFyIGl0ZW0gPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmxpc3QtZ3JvdXAtaXRlbScpO1xuXG4gICAgdmFyIGluZGV4ID0gaXRlbS5kYXRhKCdpbmRleCcpO1xuICAgIHN0YXJib3VuZC5yZW5kZXJlci5zZXRXb3JsZCh3b3JsZHNbaW5kZXhdKTtcbiAgICBzdGFyYm91bmQucmVuZGVyZXIucmVxdWVzdFJlbmRlcigpO1xuICB9KTtcblxuICBzdGFyYm91bmQucmVuZGVyZXIub24oJ2xvYWQnLCAoKSA9PiB7XG4gICAgd29ybGRMaXN0LmZpbmQoJy5saXN0LWdyb3VwLWl0ZW0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JsZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh3b3JsZHNbaV0gPT0gc3RhcmJvdW5kLnJlbmRlcmVyLndvcmxkKSB7XG4gICAgICAgIHdvcmxkTGlzdC5maW5kKCdbZGF0YS1pbmRleD0nICsgaSArICddJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHN0YXJib3VuZC5yZW5kZXJlci5vbigndW5sb2FkJywgKCkgPT4ge1xuICAgIHdvcmxkTGlzdC5maW5kKCcubGlzdC1ncm91cC1pdGVtJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICB9KTtcblxuICBzdGFyYm91bmQud29ybGRzLm9uKCdsb2FkJywgKGV2ZW50KSA9PiB7XG4gICAgdmFyIHdvcmxkID0gZXZlbnQud29ybGQ7XG5cbiAgICB2YXIgaW5kZXggPSB3b3JsZHMubGVuZ3RoO1xuICAgIHdvcmxkcy5wdXNoKHdvcmxkKTtcblxuICAgIHZhciBpdGVtID0gJCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbVwiPicpXG4gICAgICAuYXR0cignZGF0YS1pbmRleCcsIGluZGV4KVxuICAgICAgLmFwcGVuZChcbiAgICAgICAgJCgnPGg0IGNsYXNzPVwibGlzdC1ncm91cC1pdGVtLWhlYWRpbmdcIj4nKS50ZXh0KHdvcmxkLm5hbWUpLFxuICAgICAgICAkKCc8cCBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbS10ZXh0XCI+JykudGV4dCgnUGxheWVkICcgKyBtb21lbnQod29ybGQubGFzdE1vZGlmaWVkKS5mcm9tTm93KCkpXG4gICAgICApO1xuXG4gICAgd29ybGRMaXN0LmFwcGVuZChpdGVtKTtcbiAgfSk7XG59O1xuIiwiLy8gQ29weXJpZ2h0IDIwMTIgVHJhY2V1ciBBdXRob3JzLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8qKlxuICogVGhlIHRyYWNldXIgcnVudGltZS5cbiAqL1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKGdsb2JhbC4kdHJhY2V1clJ1bnRpbWUpIHtcbiAgICAvLyBQcmV2ZW50cyBmcm9tIGJlaW5nIGV4ZWN1dGVkIG11bHRpcGxlIHRpbWVzLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciAkY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgdmFyICRkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXM7XG4gIHZhciAkZnJlZXplID0gT2JqZWN0LmZyZWV6ZTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gIHZhciAkZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG4gIHZhciAkaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgJGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG5cbiAgZnVuY3Rpb24gbm9uRW51bSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIHZhciBtZXRob2QgPSBub25FbnVtO1xuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsU3RyaW5nKFN0cmluZykge1xuICAgIC8vIEhhcm1vbnkgU3RyaW5nIEV4dHJhc1xuICAgIC8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6c3RyaW5nX2V4dHJhc1xuICAgICRkZWZpbmVQcm9wZXJ0aWVzKFN0cmluZy5wcm90b3R5cGUsIHtcbiAgICAgIHN0YXJ0c1dpdGg6IG1ldGhvZChmdW5jdGlvbihzKSB7XG4gICAgICAgcmV0dXJuIHRoaXMubGFzdEluZGV4T2YocywgMCkgPT09IDA7XG4gICAgICB9KSxcbiAgICAgIGVuZHNXaXRoOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgICB2YXIgdCA9IFN0cmluZyhzKTtcbiAgICAgICAgdmFyIGwgPSB0aGlzLmxlbmd0aCAtIHQubGVuZ3RoO1xuICAgICAgICByZXR1cm4gbCA+PSAwICYmIHRoaXMuaW5kZXhPZih0LCBsKSA9PT0gbDtcbiAgICAgIH0pLFxuICAgICAgY29udGFpbnM6IG1ldGhvZChmdW5jdGlvbihzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZGV4T2YocykgIT09IC0xO1xuICAgICAgfSksXG4gICAgICB0b0FycmF5OiBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwbGl0KCcnKTtcbiAgICAgIH0pLFxuICAgICAgY29kZVBvaW50QXQ6IG1ldGhvZChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgICAvKiEgaHR0cDovL210aHMuYmUvY29kZXBvaW50YXQgdjAuMS4wIGJ5IEBtYXRoaWFzICovXG4gICAgICAgIHZhciBzdHJpbmcgPSBTdHJpbmcodGhpcyk7XG4gICAgICAgIHZhciBzaXplID0gc3RyaW5nLmxlbmd0aDtcbiAgICAgICAgLy8gYFRvSW50ZWdlcmBcbiAgICAgICAgdmFyIGluZGV4ID0gcG9zaXRpb24gPyBOdW1iZXIocG9zaXRpb24pIDogMDtcbiAgICAgICAgaWYgKGlzTmFOKGluZGV4KSkge1xuICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBBY2NvdW50IGZvciBvdXQtb2YtYm91bmRzIGluZGljZXM6XG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gc2l6ZSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBjb2RlIHVuaXRcbiAgICAgICAgdmFyIGZpcnN0ID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICB2YXIgc2Vjb25kO1xuICAgICAgICBpZiAoIC8vIGNoZWNrIGlmIGl04oCZcyB0aGUgc3RhcnQgb2YgYSBzdXJyb2dhdGUgcGFpclxuICAgICAgICAgIGZpcnN0ID49IDB4RDgwMCAmJiBmaXJzdCA8PSAweERCRkYgJiYgLy8gaGlnaCBzdXJyb2dhdGVcbiAgICAgICAgICBzaXplID4gaW5kZXggKyAxIC8vIHRoZXJlIGlzIGEgbmV4dCBjb2RlIHVuaXRcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2Vjb25kID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcbiAgICAgICAgICBpZiAoc2Vjb25kID49IDB4REMwMCAmJiBzZWNvbmQgPD0gMHhERkZGKSB7IC8vIGxvdyBzdXJyb2dhdGVcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmcjc3Vycm9nYXRlLWZvcm11bGFlXG4gICAgICAgICAgICByZXR1cm4gKGZpcnN0IC0gMHhEODAwKSAqIDB4NDAwICsgc2Vjb25kIC0gMHhEQzAwICsgMHgxMDAwMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgfSlcbiAgICB9KTtcblxuICAgICRkZWZpbmVQcm9wZXJ0aWVzKFN0cmluZywge1xuICAgICAgLy8gMjEuMS4yLjQgU3RyaW5nLnJhdyhjYWxsU2l0ZSwgLi4uc3Vic3RpdHV0aW9ucylcbiAgICAgIHJhdzogbWV0aG9kKGZ1bmN0aW9uKGNhbGxzaXRlKSB7XG4gICAgICAgIHZhciByYXcgPSBjYWxsc2l0ZS5yYXc7XG4gICAgICAgIHZhciBsZW4gPSByYXcubGVuZ3RoID4+PiAwOyAgLy8gVG9VaW50XG4gICAgICAgIGlmIChsZW4gPT09IDApXG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB2YXIgcyA9ICcnO1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgcyArPSByYXdbaV07XG4gICAgICAgICAgaWYgKGkgKyAxID09PSBsZW4pXG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICBzICs9IGFyZ3VtZW50c1srK2ldO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIC8vIDIxLjEuMi4yIFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLmNvZGVQb2ludHMpXG4gICAgICBmcm9tQ29kZVBvaW50OiBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9tdGhzLmJlL2Zyb21jb2RlcG9pbnQgdjAuMS4wIGJ5IEBtYXRoaWFzXG4gICAgICAgIHZhciBjb2RlVW5pdHMgPSBbXTtcbiAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgdmFyIGhpZ2hTdXJyb2dhdGU7XG4gICAgICAgIHZhciBsb3dTdXJyb2dhdGU7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgY29kZVBvaW50ID0gTnVtYmVyKGFyZ3VtZW50c1tpbmRleF0pO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc0Zpbml0ZShjb2RlUG9pbnQpIHx8ICAvLyBgTmFOYCwgYCtJbmZpbml0eWAsIG9yIGAtSW5maW5pdHlgXG4gICAgICAgICAgICBjb2RlUG9pbnQgPCAwIHx8ICAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgIGNvZGVQb2ludCA+IDB4MTBGRkZGIHx8ICAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgIGZsb29yKGNvZGVQb2ludCkgIT0gY29kZVBvaW50ICAvLyBub3QgYW4gaW50ZWdlclxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgUmFuZ2VFcnJvcignSW52YWxpZCBjb2RlIHBvaW50OiAnICsgY29kZVBvaW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvZGVQb2ludCA8PSAweEZGRkYpIHsgIC8vIEJNUCBjb2RlIHBvaW50XG4gICAgICAgICAgICBjb2RlVW5pdHMucHVzaChjb2RlUG9pbnQpO1xuICAgICAgICAgIH0gZWxzZSB7ICAvLyBBc3RyYWwgY29kZSBwb2ludDsgc3BsaXQgaW4gc3Vycm9nYXRlIGhhbHZlc1xuICAgICAgICAgICAgLy8gaHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZyNzdXJyb2dhdGUtZm9ybXVsYWVcbiAgICAgICAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwO1xuICAgICAgICAgICAgaGlnaFN1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgPj4gMTApICsgMHhEODAwO1xuICAgICAgICAgICAgbG93U3Vycm9nYXRlID0gKGNvZGVQb2ludCAlIDB4NDAwKSArIDB4REMwMDtcbiAgICAgICAgICAgIGNvZGVVbml0cy5wdXNoKGhpZ2hTdXJyb2dhdGUsIGxvd1N1cnJvZ2F0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNvZGVVbml0cyk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgLy8gIyMjIFN5bWJvbHNcbiAgLy9cbiAgLy8gU3ltYm9scyBhcmUgZW11bGF0ZWQgdXNpbmcgYW4gb2JqZWN0IHdoaWNoIGlzIGFuIGluc3RhbmNlIG9mIFN5bWJvbFZhbHVlLlxuICAvLyBDYWxsaW5nIFN5bWJvbCBhcyBhIGZ1bmN0aW9uIHJldHVybnMgYSBzeW1ib2wgdmFsdWUgb2JqZWN0LlxuICAvL1xuICAvLyBJZiBvcHRpb25zLnN5bWJvbHMgaXMgZW5hYmxlZCB0aGVuIGFsbCBwcm9wZXJ0eSBhY2Nlc3NlcyBhcmUgdHJhbnNmb3JtZWRcbiAgLy8gaW50byBydW50aW1lIGNhbGxzIHdoaWNoIHVzZXMgdGhlIGludGVybmFsIHN0cmluZyBhcyB0aGUgcmVhbCBwcm9wZXJ0eVxuICAvLyBuYW1lLlxuICAvL1xuICAvLyBJZiBvcHRpb25zLnN5bWJvbHMgaXMgZGlzYWJsZWQgc3ltYm9scyBqdXN0IHRvU3RyaW5nIGFzIHRoZWlyIGludGVybmFsXG4gIC8vIHJlcHJlc2VudGF0aW9uLCBtYWtpbmcgdGhlbSB3b3JrIGJ1dCBsZWFrIGFzIGVudW1lcmFibGUgcHJvcGVydGllcy5cblxuICB2YXIgY291bnRlciA9IDA7XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIG5ldyB1bmlxdWUgc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICBmdW5jdGlvbiBuZXdVbmlxdWVTdHJpbmcoKSB7XG4gICAgcmV0dXJuICdfXyQnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWU5KSArICckJyArICsrY291bnRlciArICckX18nO1xuICB9XG5cbiAgLy8gVGhlIHN0cmluZyB1c2VkIGZvciB0aGUgcmVhbCBwcm9wZXJ0eS5cbiAgdmFyIHN5bWJvbEludGVybmFsUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgdmFyIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcblxuICAvLyBVc2VkIGZvciB0aGUgU3ltYm9sIHdyYXBwZXJcbiAgdmFyIHN5bWJvbERhdGFQcm9wZXJ0eSA9IG5ld1VuaXF1ZVN0cmluZygpO1xuXG4gIC8vIEFsbCBzeW1ib2wgdmFsdWVzIGFyZSBrZXB0IGluIHRoaXMgbWFwLiBUaGlzIGlzIHNvIHRoYXQgd2UgY2FuIGdldCBiYWNrIHRvXG4gIC8vIHRoZSBzeW1ib2wgb2JqZWN0IGlmIGFsbCB3ZSBoYXZlIGlzIHRoZSBzdHJpbmcga2V5IHJlcHJlc2VudGluZyB0aGUgc3ltYm9sLlxuICB2YXIgc3ltYm9sVmFsdWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmdW5jdGlvbiBpc1N5bWJvbChzeW1ib2wpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN5bWJvbCA9PT0gJ29iamVjdCcgJiYgc3ltYm9sIGluc3RhbmNlb2YgU3ltYm9sVmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiB0eXBlT2Yodikge1xuICAgIGlmIChpc1N5bWJvbCh2KSlcbiAgICAgIHJldHVybiAnc3ltYm9sJztcbiAgICByZXR1cm4gdHlwZW9mIHY7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB1bmlxdWUgc3ltYm9sIG9iamVjdC5cbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzdHJpbmcgT3B0aW9uYWwgc3RyaW5nIHVzZWQgZm9yIHRvU3RyaW5nLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuICAgIHZhciB2YWx1ZSA9IG5ldyBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbik7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN5bWJvbCkpXG4gICAgICByZXR1cm4gdmFsdWU7XG5cbiAgICAvLyBuZXcgU3ltYm9sIHNob3VsZCB0aHJvdy5cbiAgICAvL1xuICAgIC8vIFRoZXJlIGFyZSB0d28gd2F5cyB0byBnZXQgYSB3cmFwcGVyIHRvIGEgc3ltYm9sLiBFaXRoZXIgYnkgZG9pbmdcbiAgICAvLyBPYmplY3Qoc3ltYm9sKSBvciBjYWxsIGEgbm9uIHN0cmljdCBmdW5jdGlvbiB1c2luZyBhIHN5bWJvbCB2YWx1ZSBhc1xuICAgIC8vIHRoaXMuIFRvIGNvcnJlY3RseSBoYW5kbGUgdGhlc2UgdHdvIHdvdWxkIHJlcXVpcmUgYSBsb3Qgb2Ygd29yayBmb3IgdmVyeVxuICAgIC8vIGxpdHRsZSBnYWluIHNvIHdlIGFyZSBub3QgZG9pbmcgdGhvc2UgYXQgdGhlIG1vbWVudC5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTeW1ib2wgY2Fubm90IGJlIG5ld1xcJ2VkJyk7XG4gIH1cblxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sLnByb3RvdHlwZSwgJ2NvbnN0cnVjdG9yJywgbm9uRW51bShTeW1ib2wpKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd0b1N0cmluZycsIG1ldGhvZChmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ltYm9sVmFsdWUgPSB0aGlzW3N5bWJvbERhdGFQcm9wZXJ0eV07XG4gICAgaWYgKCFnZXRPcHRpb24oJ3N5bWJvbHMnKSlcbiAgICAgIHJldHVybiBzeW1ib2xWYWx1ZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIHZhciBkZXNjID0gc3ltYm9sVmFsdWVbc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eV07XG4gICAgaWYgKGRlc2MgPT09IHVuZGVmaW5lZClcbiAgICAgIGRlc2MgPSAnJztcbiAgICByZXR1cm4gJ1N5bWJvbCgnICsgZGVzYyArICcpJztcbiAgfSkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghc3ltYm9sVmFsdWUpXG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ0NvbnZlcnNpb24gZnJvbSBzeW1ib2wgdG8gc3RyaW5nJyk7XG4gICAgaWYgKCFnZXRPcHRpb24oJ3N5bWJvbHMnKSlcbiAgICAgIHJldHVybiBzeW1ib2xWYWx1ZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICByZXR1cm4gc3ltYm9sVmFsdWU7XG4gIH0pKTtcblxuICBmdW5jdGlvbiBTeW1ib2xWYWx1ZShkZXNjcmlwdGlvbikge1xuICAgIHZhciBrZXkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGF0YVByb3BlcnR5LCB7dmFsdWU6IHRoaXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eSwge3ZhbHVlOiBrZXl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkodGhpcywgc3ltYm9sRGVzY3JpcHRpb25Qcm9wZXJ0eSwge3ZhbHVlOiBkZXNjcmlwdGlvbn0pO1xuICAgICRmcmVlemUodGhpcyk7XG4gICAgc3ltYm9sVmFsdWVzW2tleV0gPSB0aGlzO1xuICB9XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd0b1N0cmluZycsIHtcbiAgICB2YWx1ZTogU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbFZhbHVlLnByb3RvdHlwZSwgJ3ZhbHVlT2YnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudmFsdWVPZixcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcbiAgJGZyZWV6ZShTeW1ib2xWYWx1ZS5wcm90b3R5cGUpO1xuXG4gIFN5bWJvbC5pdGVyYXRvciA9IFN5bWJvbCgpO1xuXG4gIGZ1bmN0aW9uIHRvUHJvcGVydHkobmFtZSkge1xuICAgIGlmIChpc1N5bWJvbChuYW1lKSlcbiAgICAgIHJldHVybiBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgZ2V0T3duUHJvcGVydHlOYW1lcyB0byBmaWx0ZXIgb3V0IHByaXZhdGUgbmFtZSBrZXlzLlxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIHZhciBuYW1lcyA9ICRnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgIGlmICghc3ltYm9sVmFsdWVzW25hbWVdKVxuICAgICAgICBydi5wdXNoKG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBuYW1lKSB7XG4gICAgcmV0dXJuICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCB0b1Byb3BlcnR5KG5hbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xWYWx1ZXNbbmFtZXNbaV1dO1xuICAgICAgaWYgKHN5bWJvbClcbiAgICAgICAgcnYucHVzaChzeW1ib2wpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICAvLyBPdmVycmlkZSBPYmplY3QucHJvdG90cGUuaGFzT3duUHJvcGVydHkgdG8gYWx3YXlzIHJldHVybiBmYWxzZSBmb3JcbiAgLy8gcHJpdmF0ZSBuYW1lcy5cbiAgZnVuY3Rpb24gaGFzT3duUHJvcGVydHkobmFtZSkge1xuICAgIHJldHVybiAkaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCB0b1Byb3BlcnR5KG5hbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE9wdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGdsb2JhbC50cmFjZXVyICYmIGdsb2JhbC50cmFjZXVyLm9wdGlvbnNbbmFtZV07XG4gIH1cblxuICBmdW5jdGlvbiBzZXRQcm9wZXJ0eShvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHN5bSwgZGVzYztcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpIHtcbiAgICAgIHN5bSA9IG5hbWU7XG4gICAgICBuYW1lID0gbmFtZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICB9XG4gICAgb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgaWYgKHN5bSAmJiAoZGVzYyA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBuYW1lKSkpXG4gICAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCB7ZW51bWVyYWJsZTogZmFsc2V9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpIHtcbiAgICAgIC8vIFN5bWJvbHMgc2hvdWxkIG5vdCBiZSBlbnVtZXJhYmxlLiBXZSBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBkZXNjcmlwdG9yXG4gICAgICAvLyBiZWZvcmUgY2FsbGluZyB0aGUgb3JpZ2luYWwgZGVmaW5lUHJvcGVydHkgYmVjYXVzZSB0aGUgcHJvcGVydHkgbWlnaHRcbiAgICAgIC8vIGJlIG1hZGUgbm9uIGNvbmZpZ3VyYWJsZS5cbiAgICAgIGlmIChkZXNjcmlwdG9yLmVudW1lcmFibGUpIHtcbiAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5jcmVhdGUoZGVzY3JpcHRvciwge1xuICAgICAgICAgIGVudW1lcmFibGU6IHt2YWx1ZTogZmFsc2V9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbmFtZSA9IG5hbWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgfVxuICAgICRkZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIGRlc2NyaXB0b3IpO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsT2JqZWN0KE9iamVjdCkge1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdkZWZpbmVQcm9wZXJ0eScsIHt2YWx1ZTogZGVmaW5lUHJvcGVydHl9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlOYW1lcycsXG4gICAgICAgICAgICAgICAgICAgIHt2YWx1ZTogZ2V0T3duUHJvcGVydHlOYW1lc30pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3InLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGdldE93blByb3BlcnR5RGVzY3JpcHRvcn0pO1xuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnaGFzT3duUHJvcGVydHknLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGhhc093blByb3BlcnR5fSk7XG5cbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuXG4gICAgLy8gT2JqZWN0LmlzXG5cbiAgICAvLyBVbmxpa2UgPT09IHRoaXMgcmV0dXJucyB0cnVlIGZvciAoTmFOLCBOYU4pIGFuZCBmYWxzZSBmb3IgKDAsIC0wKS5cbiAgICBmdW5jdGlvbiBpcyhsZWZ0LCByaWdodCkge1xuICAgICAgaWYgKGxlZnQgPT09IHJpZ2h0KVxuICAgICAgICByZXR1cm4gbGVmdCAhPT0gMCB8fCAxIC8gbGVmdCA9PT0gMSAvIHJpZ2h0O1xuICAgICAgcmV0dXJuIGxlZnQgIT09IGxlZnQgJiYgcmlnaHQgIT09IHJpZ2h0O1xuICAgIH1cblxuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdpcycsIG1ldGhvZChpcykpO1xuXG4gICAgLy8gT2JqZWN0LmFzc2lnbiAoMTkuMS4zLjEpXG4gICAgZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgc291cmNlKSB7XG4gICAgICB2YXIgcHJvcHMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgICAgdmFyIHAsIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICB0YXJnZXRbcHJvcHNbcF1dID0gc291cmNlW3Byb3BzW3BdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2Fzc2lnbicsIG1ldGhvZChhc3NpZ24pKTtcblxuICAgIC8vIE9iamVjdC5taXhpbiAoMTkuMS4zLjE1KVxuICAgIGZ1bmN0aW9uIG1peGluKHRhcmdldCwgc291cmNlKSB7XG4gICAgICB2YXIgcHJvcHMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgICAgdmFyIHAsIGRlc2NyaXB0b3IsIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgIGZvciAocCA9IDA7IHAgPCBsZW5ndGg7IHArKykge1xuICAgICAgICBkZXNjcmlwdG9yID0gJGdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIHByb3BzW3BdKTtcbiAgICAgICAgJGRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcHNbcF0sIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnbWl4aW4nLCBtZXRob2QobWl4aW4pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsQXJyYXkoQXJyYXkpIHtcbiAgICAvLyBNYWtlIGFycmF5cyBpdGVyYWJsZS5cbiAgICAvLyBUT0RPKGFydik6IFRoaXMgaXMgbm90IHZlcnkgcm9idXN0IHRvIGNoYW5nZXMgaW4gdGhlIHByaXZhdGUgbmFtZXNcbiAgICAvLyBvcHRpb24gYnV0IGZvcnR1bmF0ZWx5IHRoaXMgaXMgbm90IHNvbWV0aGluZyB0aGF0IGlzIGV4cGVjdGVkIHRvIGNoYW5nZVxuICAgIC8vIGF0IHJ1bnRpbWUgb3V0c2lkZSBvZiB0ZXN0cy5cbiAgICBkZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgIHZhciBhcnJheSA9IHRoaXM7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7dmFsdWU6IGFycmF5W2luZGV4KytdLCBkb25lOiBmYWxzZX07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7dmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZX07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbmNlbGxlclxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIERlZmVycmVkKGNhbmNlbGxlcikge1xuICAgIHRoaXMuY2FuY2VsbGVyXyA9IGNhbmNlbGxlcjtcbiAgICB0aGlzLmxpc3RlbmVyc18gPSBbXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vdGlmeShzZWxmKSB7XG4gICAgd2hpbGUgKHNlbGYubGlzdGVuZXJzXy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgY3VycmVudCA9IHNlbGYubGlzdGVuZXJzXy5zaGlmdCgpO1xuICAgICAgdmFyIGN1cnJlbnRSZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzZWxmLnJlc3VsdF9bMV0pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50LmVycmJhY2spXG4gICAgICAgICAgICAgIGN1cnJlbnRSZXN1bHQgPSBjdXJyZW50LmVycmJhY2suY2FsbCh1bmRlZmluZWQsIHNlbGYucmVzdWx0X1swXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50LmNhbGxiYWNrKVxuICAgICAgICAgICAgICBjdXJyZW50UmVzdWx0ID0gY3VycmVudC5jYWxsYmFjay5jYWxsKHVuZGVmaW5lZCwgc2VsZi5yZXN1bHRfWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudC5kZWZlcnJlZC5jYWxsYmFjayhjdXJyZW50UmVzdWx0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY3VycmVudC5kZWZlcnJlZC5lcnJiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKHVudXNlZCkge31cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaXJlKHNlbGYsIHZhbHVlLCBpc0Vycm9yKSB7XG4gICAgaWYgKHNlbGYuZmlyZWRfKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbHJlYWR5IGZpcmVkJyk7XG5cbiAgICBzZWxmLmZpcmVkXyA9IHRydWU7XG4gICAgc2VsZi5yZXN1bHRfID0gW3ZhbHVlLCBpc0Vycm9yXTtcbiAgICBub3RpZnkoc2VsZik7XG4gIH1cblxuICBEZWZlcnJlZC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IERlZmVycmVkLFxuXG4gICAgZmlyZWRfOiBmYWxzZSxcbiAgICByZXN1bHRfOiB1bmRlZmluZWQsXG5cbiAgICBjcmVhdGVQcm9taXNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7dGhlbjogdGhpcy50aGVuLmJpbmQodGhpcyksIGNhbmNlbDogdGhpcy5jYW5jZWwuYmluZCh0aGlzKX07XG4gICAgfSxcblxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZmlyZSh0aGlzLCB2YWx1ZSwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICBlcnJiYWNrOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGZpcmUodGhpcywgZXJyLCB0cnVlKTtcbiAgICB9LFxuXG4gICAgdGhlbjogZnVuY3Rpb24oY2FsbGJhY2ssIGVycmJhY2spIHtcbiAgICAgIHZhciByZXN1bHQgPSBuZXcgRGVmZXJyZWQodGhpcy5jYW5jZWwuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmxpc3RlbmVyc18ucHVzaCh7XG4gICAgICAgIGRlZmVycmVkOiByZXN1bHQsXG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgZXJyYmFjazogZXJyYmFja1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5maXJlZF8pXG4gICAgICAgIG5vdGlmeSh0aGlzKTtcbiAgICAgIHJldHVybiByZXN1bHQuY3JlYXRlUHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuZmlyZWRfKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FscmVhZHkgZmluaXNoZWQnKTtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBpZiAodGhpcy5jYW5jZWxsZXJfKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2FuY2VsbGVyXyh0aGlzKTtcbiAgICAgICAgaWYgKCFyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgICByZXN1bHQgPSBuZXcgRXJyb3IocmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBFcnJvcignY2FuY2VsbGVkJyk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZmlyZWRfKSB7XG4gICAgICAgIHRoaXMucmVzdWx0XyA9IFtyZXN1bHQsIHRydWVdO1xuICAgICAgICBub3RpZnkodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFN5c3RlbS5nZXQvc2V0IGFuZCBAdHJhY2V1ci9tb2R1bGUgZ2V0cyBvdmVycmlkZGVuIGluIEB0cmFjZXVyL21vZHVsZXMgdG9cbiAgLy8gYmUgbW9yZSBjb3JyZWN0LlxuXG4gIGZ1bmN0aW9uIE1vZHVsZUltcGwodXJsLCBmdW5jLCBzZWxmKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5mdW5jID0gZnVuYztcbiAgICB0aGlzLnNlbGYgPSBzZWxmO1xuICAgIHRoaXMudmFsdWVfID0gbnVsbDtcbiAgfVxuICBNb2R1bGVJbXBsLnByb3RvdHlwZSA9IHtcbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZV8pXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlXztcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlXyA9IHRoaXMuZnVuYy5jYWxsKHRoaXMuc2VsZik7XG4gICAgfVxuICB9O1xuXG4gIHZhciBtb2R1bGVzID0ge1xuICAgICdAdHJhY2V1ci9tb2R1bGUnOiB7XG4gICAgICBNb2R1bGVJbXBsOiBNb2R1bGVJbXBsLFxuICAgICAgcmVnaXN0ZXJNb2R1bGU6IGZ1bmN0aW9uKHVybCwgZnVuYywgc2VsZikge1xuICAgICAgICBtb2R1bGVzW3VybF0gPSBuZXcgTW9kdWxlSW1wbCh1cmwsIGZ1bmMsIHNlbGYpO1xuICAgICAgfSxcbiAgICAgIGdldE1vZHVsZUltcGw6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlc1t1cmxdLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgU3lzdGVtID0ge1xuICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbbmFtZV07XG4gICAgICBpZiAobW9kdWxlIGluc3RhbmNlb2YgTW9kdWxlSW1wbClcbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbbmFtZV0gPSBtb2R1bGUudmFsdWU7XG4gICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihuYW1lLCBvYmplY3QpIHtcbiAgICAgIG1vZHVsZXNbbmFtZV0gPSBvYmplY3Q7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNldHVwR2xvYmFscyhnbG9iYWwpIHtcbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wpXG4gICAgICBnbG9iYWwuU3ltYm9sID0gU3ltYm9sO1xuICAgIGlmICghZ2xvYmFsLlN5bWJvbC5pdGVyYXRvcilcbiAgICAgIGdsb2JhbC5TeW1ib2wuaXRlcmF0b3IgPSBTeW1ib2woKTtcblxuICAgIHBvbHlmaWxsU3RyaW5nKGdsb2JhbC5TdHJpbmcpO1xuICAgIHBvbHlmaWxsT2JqZWN0KGdsb2JhbC5PYmplY3QpO1xuICAgIHBvbHlmaWxsQXJyYXkoZ2xvYmFsLkFycmF5KTtcbiAgICBnbG9iYWwuU3lzdGVtID0gU3lzdGVtO1xuICAgIC8vIFRPRE8oYXJ2KTogRG9uJ3QgZXhwb3J0IHRoaXMuXG4gICAgZ2xvYmFsLkRlZmVycmVkID0gRGVmZXJyZWQ7XG4gIH1cblxuICBzZXR1cEdsb2JhbHMoZ2xvYmFsKTtcblxuICAvLyBUaGlzIGZpbGUgaXMgc29tZXRpbWVzIHVzZWQgd2l0aG91dCB0cmFjZXVyLmpzIHNvIG1ha2UgaXQgYSBuZXcgZ2xvYmFsLlxuICBnbG9iYWwuJHRyYWNldXJSdW50aW1lID0ge1xuICAgIERlZmVycmVkOiBEZWZlcnJlZCxcbiAgICBzZXRQcm9wZXJ0eTogc2V0UHJvcGVydHksXG4gICAgc2V0dXBHbG9iYWxzOiBzZXR1cEdsb2JhbHMsXG4gICAgdG9Qcm9wZXJ0eTogdG9Qcm9wZXJ0eSxcbiAgICB0eXBlb2Y6IHR5cGVPZixcbiAgfTtcblxufSkodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi41LjFcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG4oZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbW9tZW50LFxuICAgICAgICBWRVJTSU9OID0gXCIyLjUuMVwiLFxuICAgICAgICBnbG9iYWwgPSB0aGlzLFxuICAgICAgICByb3VuZCA9IE1hdGgucm91bmQsXG4gICAgICAgIGksXG5cbiAgICAgICAgWUVBUiA9IDAsXG4gICAgICAgIE1PTlRIID0gMSxcbiAgICAgICAgREFURSA9IDIsXG4gICAgICAgIEhPVVIgPSAzLFxuICAgICAgICBNSU5VVEUgPSA0LFxuICAgICAgICBTRUNPTkQgPSA1LFxuICAgICAgICBNSUxMSVNFQ09ORCA9IDYsXG5cbiAgICAgICAgLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbGFuZ3VhZ2UgY29uZmlnIGZpbGVzXG4gICAgICAgIGxhbmd1YWdlcyA9IHt9LFxuXG4gICAgICAgIC8vIG1vbWVudCBpbnRlcm5hbCBwcm9wZXJ0aWVzXG4gICAgICAgIG1vbWVudFByb3BlcnRpZXMgPSB7XG4gICAgICAgICAgICBfaXNBTW9tZW50T2JqZWN0OiBudWxsLFxuICAgICAgICAgICAgX2kgOiBudWxsLFxuICAgICAgICAgICAgX2YgOiBudWxsLFxuICAgICAgICAgICAgX2wgOiBudWxsLFxuICAgICAgICAgICAgX3N0cmljdCA6IG51bGwsXG4gICAgICAgICAgICBfaXNVVEMgOiBudWxsLFxuICAgICAgICAgICAgX29mZnNldCA6IG51bGwsICAvLyBvcHRpb25hbC4gQ29tYmluZSB3aXRoIF9pc1VUQ1xuICAgICAgICAgICAgX3BmIDogbnVsbCxcbiAgICAgICAgICAgIF9sYW5nIDogbnVsbCAgLy8gb3B0aW9uYWxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyAmJiB0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcpLFxuXG4gICAgICAgIC8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxuICAgICAgICBhc3BOZXRKc29uUmVnZXggPSAvXlxcLz9EYXRlXFwoKFxcLT9cXGQrKS9pLFxuICAgICAgICBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleCA9IC8oXFwtKT8oPzooXFxkKilcXC4pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKVxcLj8oXFxkezN9KT8pPy8sXG5cbiAgICAgICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAgICAgLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxuICAgICAgICBpc29EdXJhdGlvblJlZ2V4ID0gL14oLSk/UCg/Oig/OihbMC05LC5dKilZKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKUQpPyg/OlQoPzooWzAtOSwuXSopSCk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilTKT8pP3woWzAtOSwuXSopVykkLyxcblxuICAgICAgICAvLyBmb3JtYXQgdG9rZW5zXG4gICAgICAgIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98bW0/fHNzP3xTezEsNH18WHx6ej98Wlo/fC4pL2csXG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhMVHxMTD9MP0w/fGx7MSw0fSkvZyxcblxuICAgICAgICAvLyBwYXJzaW5nIHRva2VuIHJlZ2V4ZXNcbiAgICAgICAgcGFyc2VUb2tlbk9uZU9yVHdvRGlnaXRzID0gL1xcZFxcZD8vLCAvLyAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHMgPSAvXFxkezEsM30vLCAvLyAwIC0gOTk5XG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHMgPSAvXFxkezEsNH0vLCAvLyAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuT25lVG9TaXhEaWdpdHMgPSAvWytcXC1dP1xcZHsxLDZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5EaWdpdHMgPSAvXFxkKy8sIC8vIG5vbnplcm8gbnVtYmVyIG9mIGRpZ2l0c1xuICAgICAgICBwYXJzZVRva2VuV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pLCAvLyBhbnkgd29yZCAob3IgdHdvKSBjaGFyYWN0ZXJzIG9yIG51bWJlcnMgaW5jbHVkaW5nIHR3by90aHJlZSB3b3JkIG1vbnRoIGluIGFyYWJpYy5cbiAgICAgICAgcGFyc2VUb2tlblRpbWV6b25lID0gL1p8W1xcK1xcLV1cXGRcXGQ6P1xcZFxcZC9naSwgLy8gKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG4gICAgICAgIHBhcnNlVG9rZW5UID0gL1QvaSwgLy8gVCAoSVNPIHNlcGFyYXRvcilcbiAgICAgICAgcGFyc2VUb2tlblRpbWVzdGFtcE1zID0gL1tcXCtcXC1dP1xcZCsoXFwuXFxkezEsM30pPy8sIC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbiAgICAgICAgLy9zdHJpY3QgcGFyc2luZyByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVEaWdpdCA9IC9cXGQvLCAvLyAwIC0gOVxuICAgICAgICBwYXJzZVRva2VuVHdvRGlnaXRzID0gL1xcZFxcZC8sIC8vIDAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlblRocmVlRGlnaXRzID0gL1xcZHszfS8sIC8vIDAwMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuRm91ckRpZ2l0cyA9IC9cXGR7NH0vLCAvLyAwMDAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuU2l4RGlnaXRzID0gL1srLV0/XFxkezZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5TaWduZWROdW1iZXIgPSAvWystXT9cXGQrLywgLy8gLWluZiAtIGluZlxuXG4gICAgICAgIC8vIGlzbyA4NjAxIHJlZ2V4XG4gICAgICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgICAgICBpc29SZWdleCA9IC9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sXG5cbiAgICAgICAgaXNvRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJyxcblxuICAgICAgICBpc29EYXRlcyA9IFtcbiAgICAgICAgICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkezJ9LVxcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLURERCcsIC9cXGR7NH0tXFxkezN9L11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgICAgIGlzb1RpbWVzID0gW1xuICAgICAgICAgICAgWydISDptbTpzcy5TU1NTJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGR7MSwzfS9dLFxuICAgICAgICAgICAgWydISDptbTpzcycsIC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgICAgICBbJ0hIOm1tJywgLyhUfCApXFxkXFxkOlxcZFxcZC9dLFxuICAgICAgICAgICAgWydISCcsIC8oVHwgKVxcZFxcZC9dXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gdGltZXpvbmUgY2h1bmtlciBcIisxMDowMFwiID4gW1wiMTBcIiwgXCIwMFwiXSBvciBcIi0xNTMwXCIgPiBbXCItMTVcIiwgXCIzMFwiXVxuICAgICAgICBwYXJzZVRpbWV6b25lQ2h1bmtlciA9IC8oW1xcK1xcLV18XFxkXFxkKS9naSxcblxuICAgICAgICAvLyBnZXR0ZXIgYW5kIHNldHRlciBuYW1lc1xuICAgICAgICBwcm94eUdldHRlcnNBbmRTZXR0ZXJzID0gJ0RhdGV8SG91cnN8TWludXRlc3xTZWNvbmRzfE1pbGxpc2Vjb25kcycuc3BsaXQoJ3wnKSxcbiAgICAgICAgdW5pdE1pbGxpc2Vjb25kRmFjdG9ycyA9IHtcbiAgICAgICAgICAgICdNaWxsaXNlY29uZHMnIDogMSxcbiAgICAgICAgICAgICdTZWNvbmRzJyA6IDFlMyxcbiAgICAgICAgICAgICdNaW51dGVzJyA6IDZlNCxcbiAgICAgICAgICAgICdIb3VycycgOiAzNmU1LFxuICAgICAgICAgICAgJ0RheXMnIDogODY0ZTUsXG4gICAgICAgICAgICAnTW9udGhzJyA6IDI1OTJlNixcbiAgICAgICAgICAgICdZZWFycycgOiAzMTUzNmU2XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5pdEFsaWFzZXMgPSB7XG4gICAgICAgICAgICBtcyA6ICdtaWxsaXNlY29uZCcsXG4gICAgICAgICAgICBzIDogJ3NlY29uZCcsXG4gICAgICAgICAgICBtIDogJ21pbnV0ZScsXG4gICAgICAgICAgICBoIDogJ2hvdXInLFxuICAgICAgICAgICAgZCA6ICdkYXknLFxuICAgICAgICAgICAgRCA6ICdkYXRlJyxcbiAgICAgICAgICAgIHcgOiAnd2VlaycsXG4gICAgICAgICAgICBXIDogJ2lzb1dlZWsnLFxuICAgICAgICAgICAgTSA6ICdtb250aCcsXG4gICAgICAgICAgICB5IDogJ3llYXInLFxuICAgICAgICAgICAgREREIDogJ2RheU9mWWVhcicsXG4gICAgICAgICAgICBlIDogJ3dlZWtkYXknLFxuICAgICAgICAgICAgRSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGdnOiAnd2Vla1llYXInLFxuICAgICAgICAgICAgR0c6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICBjYW1lbEZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIGRheW9meWVhciA6ICdkYXlPZlllYXInLFxuICAgICAgICAgICAgaXNvd2Vla2RheSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGlzb3dlZWsgOiAnaXNvV2VlaycsXG4gICAgICAgICAgICB3ZWVreWVhciA6ICd3ZWVrWWVhcicsXG4gICAgICAgICAgICBpc293ZWVreWVhciA6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBmb3JtYXQgZnVuY3Rpb24gc3RyaW5nc1xuICAgICAgICBmb3JtYXRGdW5jdGlvbnMgPSB7fSxcblxuICAgICAgICAvLyB0b2tlbnMgdG8gb3JkaW5hbGl6ZSBhbmQgcGFkXG4gICAgICAgIG9yZGluYWxpemVUb2tlbnMgPSAnREREIHcgVyBNIEQgZCcuc3BsaXQoJyAnKSxcbiAgICAgICAgcGFkZGVkVG9rZW5zID0gJ00gRCBIIGggbSBzIHcgVycuc3BsaXQoJyAnKSxcblxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIE0gICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTU1NICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBNTU1NIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS5tb250aHModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEREQgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheU9mWWVhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGQgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGQgICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNNaW4odGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZGQgIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5c1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGRkZCA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3ICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBXICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZWSAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy55ZWFyKCksIHNpZ24gPSB5ID49IDAgPyAnKycgOiAnLSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyBsZWZ0WmVyb0ZpbGwoTWF0aC5hYnMoeSksIDYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCksIDQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2dnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA1KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHRyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpLCA0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHRyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgdHJ1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEggICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1pbnV0ZXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlY29uZHMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b0ludCh0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTUyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwKSwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU1NTICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMubWlsbGlzZWNvbmRzKCksIDMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNTU1MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBaICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxuICAgICAgICAgICAgICAgICAgICBiID0gXCIrXCI7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9IFwiLVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYiArIGxlZnRaZXJvRmlsbCh0b0ludChhIC8gNjApLCAyKSArIFwiOlwiICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFpaICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSAtdGhpcy56b25lKCksXG4gICAgICAgICAgICAgICAgICAgIGIgPSBcIitcIjtcbiAgICAgICAgICAgICAgICBpZiAoYSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xuICAgICAgICAgICAgICAgICAgICBiID0gXCItXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBiICsgbGVmdFplcm9GaWxsKHRvSW50KGEgLyA2MCksIDIpICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHogOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZUFiYnIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB6eiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lTmFtZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFggICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5peCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFEgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVhcnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGxpc3RzID0gWydtb250aHMnLCAnbW9udGhzU2hvcnQnLCAnd2Vla2RheXMnLCAnd2Vla2RheXNTaG9ydCcsICd3ZWVrZGF5c01pbiddO1xuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LCBhbmQgZXM1IHN0YW5kYXJkIGlzIG5vdCB2ZXJ5XG4gICAgICAgIC8vIGhlbHBmdWwuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbXB0eSA6IGZhbHNlLFxuICAgICAgICAgICAgdW51c2VkVG9rZW5zIDogW10sXG4gICAgICAgICAgICB1bnVzZWRJbnB1dCA6IFtdLFxuICAgICAgICAgICAgb3ZlcmZsb3cgOiAtMixcbiAgICAgICAgICAgIGNoYXJzTGVmdE92ZXIgOiAwLFxuICAgICAgICAgICAgbnVsbElucHV0IDogZmFsc2UsXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggOiBudWxsLFxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCA6IGZhbHNlLFxuICAgICAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXG4gICAgICAgICAgICBpc286IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFkVG9rZW4oZnVuYywgY291bnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgY291bnQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBvcmRpbmFsaXplVG9rZW4oZnVuYywgcGVyaW9kKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLm9yZGluYWwoZnVuYy5jYWxsKHRoaXMsIGEpLCBwZXJpb2QpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHdoaWxlIChvcmRpbmFsaXplVG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBpID0gb3JkaW5hbGl6ZVRva2Vucy5wb3AoKTtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArICdvJ10gPSBvcmRpbmFsaXplVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIGkpO1xuICAgIH1cbiAgICB3aGlsZSAocGFkZGVkVG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBpID0gcGFkZGVkVG9rZW5zLnBvcCgpO1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpICsgaV0gPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9uc1tpXSwgMik7XG4gICAgfVxuICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zLkREREQgPSBwYWRUb2tlbihmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREQsIDMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIExhbmd1YWdlKCkge1xuXG4gICAgfVxuXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcbiAgICAgICAgZXh0ZW5kKHRoaXMsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gRHVyYXRpb24gQ29uc3RydWN0b3JcbiAgICBmdW5jdGlvbiBEdXJhdGlvbihkdXJhdGlvbikge1xuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoZHVyYXRpb24pLFxuICAgICAgICAgICAgeWVhcnMgPSBub3JtYWxpemVkSW5wdXQueWVhciB8fCAwLFxuICAgICAgICAgICAgbW9udGhzID0gbm9ybWFsaXplZElucHV0Lm1vbnRoIHx8IDAsXG4gICAgICAgICAgICB3ZWVrcyA9IG5vcm1hbGl6ZWRJbnB1dC53ZWVrIHx8IDAsXG4gICAgICAgICAgICBkYXlzID0gbm9ybWFsaXplZElucHV0LmRheSB8fCAwLFxuICAgICAgICAgICAgaG91cnMgPSBub3JtYWxpemVkSW5wdXQuaG91ciB8fCAwLFxuICAgICAgICAgICAgbWludXRlcyA9IG5vcm1hbGl6ZWRJbnB1dC5taW51dGUgfHwgMCxcbiAgICAgICAgICAgIHNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQuc2Vjb25kIHx8IDAsXG4gICAgICAgICAgICBtaWxsaXNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmQgfHwgMDtcblxuICAgICAgICAvLyByZXByZXNlbnRhdGlvbiBmb3IgZGF0ZUFkZFJlbW92ZVxuICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgPSArbWlsbGlzZWNvbmRzICtcbiAgICAgICAgICAgIHNlY29uZHMgKiAxZTMgKyAvLyAxMDAwXG4gICAgICAgICAgICBtaW51dGVzICogNmU0ICsgLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICBob3VycyAqIDM2ZTU7IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxuICAgICAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgICAgICB3ZWVrcyAqIDc7XG4gICAgICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgICAgIC8vIGl0IHNlcGFyYXRlbHkuXG4gICAgICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgdGhpcy5fYnViYmxlKCk7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBmdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICAgICAgICBmb3IgKHZhciBpIGluIGIpIHtcbiAgICAgICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShcInRvU3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiLmhhc093blByb3BlcnR5KFwidmFsdWVPZlwiKSkge1xuICAgICAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvbmVNb21lbnQobSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge30sIGk7XG4gICAgICAgIGZvciAoaSBpbiBtKSB7XG4gICAgICAgICAgICBpZiAobS5oYXNPd25Qcm9wZXJ0eShpKSAmJiBtb21lbnRQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gbVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWJzUm91bmQobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbGVmdCB6ZXJvIGZpbGwgYSBudW1iZXJcbiAgICAvLyBzZWUgaHR0cDovL2pzcGVyZi5jb20vbGVmdC16ZXJvLWZpbGxpbmcgZm9yIHBlcmZvcm1hbmNlIGNvbXBhcmlzb25cbiAgICBmdW5jdGlvbiBsZWZ0WmVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xuICAgICAgICB2YXIgb3V0cHV0ID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xuXG4gICAgICAgIHdoaWxlIChvdXRwdXQubGVuZ3RoIDwgdGFyZ2V0TGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSAnMCcgKyBvdXRwdXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChzaWduID8gKGZvcmNlU2lnbiA/ICcrJyA6ICcnKSA6ICctJykgKyBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBfLmFkZFRpbWUgYW5kIF8uc3VidHJhY3RUaW1lXG4gICAgZnVuY3Rpb24gYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudChtb20sIGR1cmF0aW9uLCBpc0FkZGluZywgaWdub3JlVXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICAgICAgZGF5cyA9IGR1cmF0aW9uLl9kYXlzLFxuICAgICAgICAgICAgbW9udGhzID0gZHVyYXRpb24uX21vbnRocyxcbiAgICAgICAgICAgIG1pbnV0ZXMsXG4gICAgICAgICAgICBob3VycztcblxuICAgICAgICBpZiAobWlsbGlzZWNvbmRzKSB7XG4gICAgICAgICAgICBtb20uX2Quc2V0VGltZSgrbW9tLl9kICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0b3JlIHRoZSBtaW51dGVzIGFuZCBob3VycyBzbyB3ZSBjYW4gcmVzdG9yZSB0aGVtXG4gICAgICAgIGlmIChkYXlzIHx8IG1vbnRocykge1xuICAgICAgICAgICAgbWludXRlcyA9IG1vbS5taW51dGUoKTtcbiAgICAgICAgICAgIGhvdXJzID0gbW9tLmhvdXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF5cykge1xuICAgICAgICAgICAgbW9tLmRhdGUobW9tLmRhdGUoKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vbnRocykge1xuICAgICAgICAgICAgbW9tLm1vbnRoKG1vbS5tb250aCgpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaWxsaXNlY29uZHMgJiYgIWlnbm9yZVVwZGF0ZU9mZnNldCkge1xuICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldChtb20pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlc3RvcmUgdGhlIG1pbnV0ZXMgYW5kIGhvdXJzIGFmdGVyIHBvc3NpYmx5IGNoYW5naW5nIGRzdFxuICAgICAgICBpZiAoZGF5cyB8fCBtb250aHMpIHtcbiAgICAgICAgICAgIG1vbS5taW51dGUobWludXRlcyk7XG4gICAgICAgICAgICBtb20uaG91cihob3Vycyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiBpcyBhbiBhcnJheVxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgICAgIHJldHVybiAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRGF0ZV0nIHx8XG4gICAgICAgICAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiBEYXRlO1xuICAgIH1cblxuICAgIC8vIGNvbXBhcmUgdHdvIGFycmF5cywgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXNcbiAgICBmdW5jdGlvbiBjb21wYXJlQXJyYXlzKGFycmF5MSwgYXJyYXkyLCBkb250Q29udmVydCkge1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oYXJyYXkxLmxlbmd0aCwgYXJyYXkyLmxlbmd0aCksXG4gICAgICAgICAgICBsZW5ndGhEaWZmID0gTWF0aC5hYnMoYXJyYXkxLmxlbmd0aCAtIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgZGlmZnMgPSAwLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGRvbnRDb252ZXJ0ICYmIGFycmF5MVtpXSAhPT0gYXJyYXkyW2ldKSB8fFxuICAgICAgICAgICAgICAgICghZG9udENvbnZlcnQgJiYgdG9JbnQoYXJyYXkxW2ldKSAhPT0gdG9JbnQoYXJyYXkyW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBkaWZmcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaWZmcyArIGxlbmd0aERpZmY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICAgICAgaWYgKHVuaXRzKSB7XG4gICAgICAgICAgICB2YXIgbG93ZXJlZCA9IHVuaXRzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvKC4pcyQvLCAnJDEnKTtcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdEFsaWFzZXNbdW5pdHNdIHx8IGNhbWVsRnVuY3Rpb25zW2xvd2VyZWRdIHx8IGxvd2VyZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuaXRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICAgICAgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dE9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VMaXN0KGZpZWxkKSB7XG4gICAgICAgIHZhciBjb3VudCwgc2V0dGVyO1xuXG4gICAgICAgIGlmIChmaWVsZC5pbmRleE9mKCd3ZWVrJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gNztcbiAgICAgICAgICAgIHNldHRlciA9ICdkYXknO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJ21vbnRoJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gMTI7XG4gICAgICAgICAgICBzZXR0ZXIgPSAnbW9udGgnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbW9tZW50W2ZpZWxkXSA9IGZ1bmN0aW9uIChmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgaSwgZ2V0dGVyLFxuICAgICAgICAgICAgICAgIG1ldGhvZCA9IG1vbWVudC5mbi5fbGFuZ1tmaWVsZF0sXG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldHRlciA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQoKS51dGMoKS5zZXQoc2V0dGVyLCBpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwobW9tZW50LmZuLl9sYW5nLCBtLCBmb3JtYXQgfHwgJycpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0dGVyKGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXR0ZXIoaSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XG4gICAgICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXG4gICAgICAgICAgICB2YWx1ZSA9IDA7XG5cbiAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcbiAgICAgICAgICAgIGlmIChjb2VyY2VkTnVtYmVyID49IDApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IE1hdGguZmxvb3IoY29lcmNlZE51bWJlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5jZWlsKGNvZXJjZWROdW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCArIDEsIDApKS5nZXRVVENEYXRlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5c0luWWVhcih5ZWFyKSB7XG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHllYXIpID8gMzY2IDogMzY1O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTGVhcFllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDApIHx8IHllYXIgJSA0MDAgPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyhtKSB7XG4gICAgICAgIHZhciBvdmVyZmxvdztcbiAgICAgICAgaWYgKG0uX2EgJiYgbS5fcGYub3ZlcmZsb3cgPT09IC0yKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9XG4gICAgICAgICAgICAgICAgbS5fYVtNT05USF0gPCAwIHx8IG0uX2FbTU9OVEhdID4gMTEgPyBNT05USCA6XG4gICAgICAgICAgICAgICAgbS5fYVtEQVRFXSA8IDEgfHwgbS5fYVtEQVRFXSA+IGRheXNJbk1vbnRoKG0uX2FbWUVBUl0sIG0uX2FbTU9OVEhdKSA/IERBVEUgOlxuICAgICAgICAgICAgICAgIG0uX2FbSE9VUl0gPCAwIHx8IG0uX2FbSE9VUl0gPiAyMyA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlOVVRFXSA8IDAgfHwgbS5fYVtNSU5VVEVdID4gNTkgPyBNSU5VVEUgOlxuICAgICAgICAgICAgICAgIG0uX2FbU0VDT05EXSA8IDAgfHwgbS5fYVtTRUNPTkRdID4gNTkgPyBTRUNPTkQgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlMTElTRUNPTkRdIDwgMCB8fCBtLl9hW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcbiAgICAgICAgICAgICAgICAtMTtcblxuICAgICAgICAgICAgaWYgKG0uX3BmLl9vdmVyZmxvd0RheU9mWWVhciAmJiAob3ZlcmZsb3cgPCBZRUFSIHx8IG92ZXJmbG93ID4gREFURSkpIHtcbiAgICAgICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICAgICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgbS5faXNWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA8IDAgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuZW1wdHkgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLnVzZXJJbnZhbGlkYXRlZDtcblxuICAgICAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBtLl9pc1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS5faXNWYWxpZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVMYW5ndWFnZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xuICAgIH1cblxuICAgIC8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXG4gICAgZnVuY3Rpb24gbWFrZUFzKGlucHV0LCBtb2RlbCkge1xuICAgICAgICByZXR1cm4gbW9kZWwuX2lzVVRDID8gbW9tZW50KGlucHV0KS56b25lKG1vZGVsLl9vZmZzZXQgfHwgMCkgOlxuICAgICAgICAgICAgbW9tZW50KGlucHV0KS5sb2NhbCgpO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTGFuZ3VhZ2VzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQoTGFuZ3VhZ2UucHJvdG90eXBlLCB7XG5cbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHByb3AsIGk7XG4gICAgICAgICAgICBmb3IgKGkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1snXycgKyBpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9tb250aHMgOiBcIkphbnVhcnlfRmVicnVhcnlfTWFyY2hfQXByaWxfTWF5X0p1bmVfSnVseV9BdWd1c3RfU2VwdGVtYmVyX09jdG9iZXJfTm92ZW1iZXJfRGVjZW1iZXJcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIG1vbnRocyA6IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzW20ubW9udGgoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX21vbnRoc1Nob3J0IDogXCJKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlY1wiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgbW9udGhzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGhzUGFyc2UgOiBmdW5jdGlvbiAobW9udGhOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQudXRjKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykgKyAnfF4nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWtkYXlzIDogXCJTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheVwiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgd2Vla2RheXMgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzW20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5c1Nob3J0IDogXCJTdW5fTW9uX1R1ZV9XZWRfVGh1X0ZyaV9TYXRcIi5zcGxpdChcIl9cIiksXG4gICAgICAgIHdlZWtkYXlzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWtkYXlzTWluIDogXCJTdV9Nb19UdV9XZV9UaF9Gcl9TYVwiLnNwbGl0KFwiX1wiKSxcbiAgICAgICAgd2Vla2RheXNNaW4gOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtkYXlzUGFyc2UgOiBmdW5jdGlvbiAod2Vla2RheU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBpLCBtb20sIHJlZ2V4O1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50KFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9sb25nRGF0ZUZvcm1hdCA6IHtcbiAgICAgICAgICAgIExUIDogXCJoOm1tIEFcIixcbiAgICAgICAgICAgIEwgOiBcIk1NL0REL1lZWVlcIixcbiAgICAgICAgICAgIExMIDogXCJNTU1NIEQgWVlZWVwiLFxuICAgICAgICAgICAgTExMIDogXCJNTU1NIEQgWVlZWSBMVFwiLFxuICAgICAgICAgICAgTExMTCA6IFwiZGRkZCwgTU1NTSBEIFlZWVkgTFRcIlxuICAgICAgICB9LFxuICAgICAgICBsb25nRGF0ZUZvcm1hdCA6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgICAgICAgICAgaWYgKCFvdXRwdXQgJiYgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQTSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAgICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXG4gICAgICAgICAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP20/XFwuPy9pLFxuICAgICAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgICAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYWxlbmRhciA6IHtcbiAgICAgICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXG4gICAgICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgICAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCBbYXRdIExUJyxcbiAgICAgICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxuICAgICAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgICAgICAgICBzYW1lRWxzZSA6ICdMJ1xuICAgICAgICB9LFxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uIChrZXksIG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJyA/IG91dHB1dC5hcHBseShtb20pIDogb3V0cHV0O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWxhdGl2ZVRpbWUgOiB7XG4gICAgICAgICAgICBmdXR1cmUgOiBcImluICVzXCIsXG4gICAgICAgICAgICBwYXN0IDogXCIlcyBhZ29cIixcbiAgICAgICAgICAgIHMgOiBcImEgZmV3IHNlY29uZHNcIixcbiAgICAgICAgICAgIG0gOiBcImEgbWludXRlXCIsXG4gICAgICAgICAgICBtbSA6IFwiJWQgbWludXRlc1wiLFxuICAgICAgICAgICAgaCA6IFwiYW4gaG91clwiLFxuICAgICAgICAgICAgaGggOiBcIiVkIGhvdXJzXCIsXG4gICAgICAgICAgICBkIDogXCJhIGRheVwiLFxuICAgICAgICAgICAgZGQgOiBcIiVkIGRheXNcIixcbiAgICAgICAgICAgIE0gOiBcImEgbW9udGhcIixcbiAgICAgICAgICAgIE1NIDogXCIlZCBtb250aHNcIixcbiAgICAgICAgICAgIHkgOiBcImEgeWVhclwiLFxuICAgICAgICAgICAgeXkgOiBcIiVkIHllYXJzXCJcbiAgICAgICAgfSxcbiAgICAgICAgcmVsYXRpdmVUaW1lIDogZnVuY3Rpb24gKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygb3V0cHV0ID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICAgICAgICAgICAgb3V0cHV0KG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkgOlxuICAgICAgICAgICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICBwYXN0RnV0dXJlIDogZnVuY3Rpb24gKGRpZmYsIG91dHB1dCkge1xuICAgICAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZm9ybWF0ID09PSAnZnVuY3Rpb24nID8gZm9ybWF0KG91dHB1dCkgOiBmb3JtYXQucmVwbGFjZSgvJXMvaSwgb3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZShcIiVkXCIsIG51bWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIF9vcmRpbmFsIDogXCIlZFwiLFxuXG4gICAgICAgIHByZXBhcnNlIDogZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgICAgfSxcblxuICAgICAgICBwb3N0Zm9ybWF0IDogZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIobW9tLCB0aGlzLl93ZWVrLmRvdywgdGhpcy5fd2Vlay5kb3kpLndlZWs7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWsgOiB7XG4gICAgICAgICAgICBkb3cgOiAwLCAvLyBTdW5kYXkgaXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cbiAgICAgICAgICAgIGRveSA6IDYgIC8vIFRoZSB3ZWVrIHRoYXQgY29udGFpbnMgSmFuIDFzdCBpcyB0aGUgZmlyc3Qgd2VlayBvZiB0aGUgeWVhci5cbiAgICAgICAgfSxcblxuICAgICAgICBfaW52YWxpZERhdGU6ICdJbnZhbGlkIGRhdGUnLFxuICAgICAgICBpbnZhbGlkRGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBMb2FkcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gaW50byB0aGUgYGxhbmd1YWdlc2AgY2FjaGUuICBUaGUgZnVuY3Rpb25cbiAgICAvLyB0YWtlcyBhIGtleSBhbmQgb3B0aW9uYWxseSB2YWx1ZXMuICBJZiBub3QgaW4gdGhlIGJyb3dzZXIgYW5kIG5vIHZhbHVlc1xuICAgIC8vIGFyZSBwcm92aWRlZCwgaXQgd2lsbCBsb2FkIHRoZSBsYW5ndWFnZSBmaWxlIG1vZHVsZS4gIEFzIGEgY29udmVuaWVuY2UsXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBhbHNvIHJldHVybnMgdGhlIGxhbmd1YWdlIHZhbHVlcy5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZyhrZXksIHZhbHVlcykge1xuICAgICAgICB2YWx1ZXMuYWJiciA9IGtleTtcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSBuZXcgTGFuZ3VhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBsYW5ndWFnZXNba2V5XS5zZXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhIGxhbmd1YWdlIGZyb20gdGhlIGBsYW5ndWFnZXNgIGNhY2hlLiBNb3N0bHkgdXNlZnVsIGluIHRlc3RzLlxuICAgIGZ1bmN0aW9uIHVubG9hZExhbmcoa2V5KSB7XG4gICAgICAgIGRlbGV0ZSBsYW5ndWFnZXNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmVzIHdoaWNoIGxhbmd1YWdlIGRlZmluaXRpb24gdG8gdXNlIGFuZCByZXR1cm5zIGl0LlxuICAgIC8vXG4gICAgLy8gV2l0aCBubyBwYXJhbWV0ZXJzLCBpdCB3aWxsIHJldHVybiB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWYgeW91XG4gICAgLy8gcGFzcyBpbiBhIGxhbmd1YWdlIGtleSwgc3VjaCBhcyAnZW4nLCBpdCB3aWxsIHJldHVybiB0aGVcbiAgICAvLyBkZWZpbml0aW9uIGZvciAnZW4nLCBzbyBsb25nIGFzICdlbicgaGFzIGFscmVhZHkgYmVlbiBsb2FkZWQgdXNpbmdcbiAgICAvLyBtb21lbnQubGFuZy5cbiAgICBmdW5jdGlvbiBnZXRMYW5nRGVmaW5pdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGkgPSAwLCBqLCBsYW5nLCBuZXh0LCBzcGxpdCxcbiAgICAgICAgICAgIGdldCA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsYW5ndWFnZXNba10gJiYgaGFzTW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlKCcuL2xhbmcvJyArIGspO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZm4uX2xhbmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICAgICAgbGFuZyA9IGdldChrZXkpO1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtleSA9IFtrZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9waWNrIHRoZSBsYW5ndWFnZSBmcm9tIHRoZSBhcnJheVxuICAgICAgICAvL3RyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4gICAgICAgIC8vc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxuICAgICAgICB3aGlsZSAoaSA8IGtleS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNwbGl0ID0gbm9ybWFsaXplTGFuZ3VhZ2Uoa2V5W2ldKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgICAgIG5leHQgPSBub3JtYWxpemVMYW5ndWFnZShrZXlbaSArIDFdKTtcbiAgICAgICAgICAgIG5leHQgPSBuZXh0ID8gbmV4dC5zcGxpdCgnLScpIDogbnVsbDtcbiAgICAgICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgICAgIGxhbmcgPSBnZXQoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcbiAgICAgICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFuZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vbWVudC5mbi5fbGFuZztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZvcm1hdHRpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hdGNoKC9cXFtbXFxzXFxTXS8pKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXlxcW3xcXF0kL2csIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gXCJcIjtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dHB1dCArPSBhcnJheVtpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gYXJyYXlbaV0uY2FsbChtb20sIGZvcm1hdCkgOiBhcnJheVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZm9ybWF0IGRhdGUgdXNpbmcgbmF0aXZlIGRhdGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gZm9ybWF0TW9tZW50KG0sIGZvcm1hdCkge1xuXG4gICAgICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtLmxhbmcoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sYW5nKCkpO1xuXG4gICAgICAgIGlmICghZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0pIHtcbiAgICAgICAgICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0obSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbGFuZykge1xuICAgICAgICB2YXIgaSA9IDU7XG5cbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZy5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFBhcnNpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGdldCB0aGUgcmVnZXggdG8gZmluZCB0aGUgbmV4dCB0b2tlblxuICAgIGZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBzdHJpY3QgPSBjb25maWcuX3N0cmljdDtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICBjYXNlICdEREREJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGhyZWVEaWdpdHM7XG4gICAgICAgIGNhc2UgJ1lZWVknOlxuICAgICAgICBjYXNlICdHR0dHJzpcbiAgICAgICAgY2FzZSAnZ2dnZyc6XG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlbkZvdXJEaWdpdHMgOiBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzO1xuICAgICAgICBjYXNlICdZJzpcbiAgICAgICAgY2FzZSAnRyc6XG4gICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5TaWduZWROdW1iZXI7XG4gICAgICAgIGNhc2UgJ1lZWVlZWSc6XG4gICAgICAgIGNhc2UgJ1lZWVlZJzpcbiAgICAgICAgY2FzZSAnR0dHR0cnOlxuICAgICAgICBjYXNlICdnZ2dnZyc6XG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlblNpeERpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb1NpeERpZ2l0cztcbiAgICAgICAgY2FzZSAnUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7IHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7IH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnU1MnOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblR3b0RpZ2l0czsgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdTU1MnOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkgeyByZXR1cm4gcGFyc2VUb2tlblRocmVlRGlnaXRzOyB9XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ0RERCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZVRvVGhyZWVEaWdpdHM7XG4gICAgICAgIGNhc2UgJ01NTSc6XG4gICAgICAgIGNhc2UgJ01NTU0nOlxuICAgICAgICBjYXNlICdkZCc6XG4gICAgICAgIGNhc2UgJ2RkZCc6XG4gICAgICAgIGNhc2UgJ2RkZGQnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5Xb3JkO1xuICAgICAgICBjYXNlICdhJzpcbiAgICAgICAgY2FzZSAnQSc6XG4gICAgICAgICAgICByZXR1cm4gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5fbWVyaWRpZW1QYXJzZTtcbiAgICAgICAgY2FzZSAnWCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWVzdGFtcE1zO1xuICAgICAgICBjYXNlICdaJzpcbiAgICAgICAgY2FzZSAnWlonOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lem9uZTtcbiAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblQ7XG4gICAgICAgIGNhc2UgJ1NTU1MnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5EaWdpdHM7XG4gICAgICAgIGNhc2UgJ01NJzpcbiAgICAgICAgY2FzZSAnREQnOlxuICAgICAgICBjYXNlICdZWSc6XG4gICAgICAgIGNhc2UgJ0dHJzpcbiAgICAgICAgY2FzZSAnZ2cnOlxuICAgICAgICBjYXNlICdISCc6XG4gICAgICAgIGNhc2UgJ2hoJzpcbiAgICAgICAgY2FzZSAnbW0nOlxuICAgICAgICBjYXNlICdzcyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnV1cnOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Ud29EaWdpdHMgOiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGNhc2UgJ00nOlxuICAgICAgICBjYXNlICdEJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ0gnOlxuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGRlZmF1bHQgOlxuICAgICAgICAgICAgYSA9IG5ldyBSZWdFeHAocmVnZXhwRXNjYXBlKHVuZXNjYXBlRm9ybWF0KHRva2VuLnJlcGxhY2UoJ1xcXFwnLCAnJykpLCBcImlcIikpO1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKHN0cmluZykge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgdmFyIHBvc3NpYmxlVHpNYXRjaGVzID0gKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpIHx8IFtdKSxcbiAgICAgICAgICAgIHR6Q2h1bmsgPSBwb3NzaWJsZVR6TWF0Y2hlc1twb3NzaWJsZVR6TWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXSxcbiAgICAgICAgICAgIHBhcnRzID0gKHR6Q2h1bmsgKyAnJykubWF0Y2gocGFyc2VUaW1lem9uZUNodW5rZXIpIHx8IFsnLScsIDAsIDBdLFxuICAgICAgICAgICAgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdID09PSAnKycgPyAtbWludXRlcyA6IG1pbnV0ZXM7XG4gICAgfVxuXG4gICAgLy8gZnVuY3Rpb24gdG8gY29udmVydCBzdHJpbmcgaW5wdXQgdG8gZGF0ZVxuICAgIGZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBkYXRlUGFydEFycmF5ID0gY29uZmlnLl9hO1xuXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgLy8gTU9OVEhcbiAgICAgICAgY2FzZSAnTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1cbiAgICAgICAgY2FzZSAnTU0nIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNT05USF0gPSB0b0ludChpbnB1dCkgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ01NTScgOiAvLyBmYWxsIHRocm91Z2ggdG8gTU1NTVxuICAgICAgICBjYXNlICdNTU1NJyA6XG4gICAgICAgICAgICBhID0gZ2V0TGFuZ0RlZmluaXRpb24oY29uZmlnLl9sKS5tb250aHNQYXJzZShpbnB1dCk7XG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cbiAgICAgICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIE1PTlRIXG4gICAgICAgIGNhc2UgJ0QnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEREXG4gICAgICAgIGNhc2UgJ0REJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbREFURV0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIFlFQVJcbiAgICAgICAgY2FzZSAnREREJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBEREREXG4gICAgICAgIGNhc2UgJ0REREQnIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBZRUFSXG4gICAgICAgIGNhc2UgJ1lZJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1lZWVknIDpcbiAgICAgICAgY2FzZSAnWVlZWVknIDpcbiAgICAgICAgY2FzZSAnWVlZWVlZJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIEFNIC8gUE1cbiAgICAgICAgY2FzZSAnYScgOiAvLyBmYWxsIHRocm91Z2ggdG8gQVxuICAgICAgICBjYXNlICdBJyA6XG4gICAgICAgICAgICBjb25maWcuX2lzUG0gPSBnZXRMYW5nRGVmaW5pdGlvbihjb25maWcuX2wpLmlzUE0oaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIDI0IEhPVVJcbiAgICAgICAgY2FzZSAnSCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcbiAgICAgICAgY2FzZSAnSEgnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2hoJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTlVURVxuICAgICAgICBjYXNlICdtJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBtbVxuICAgICAgICBjYXNlICdtbScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFNFQ09ORFxuICAgICAgICBjYXNlICdzJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBzc1xuICAgICAgICBjYXNlICdzcycgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTExJU0VDT05EXG4gICAgICAgIGNhc2UgJ1MnIDpcbiAgICAgICAgY2FzZSAnU1MnIDpcbiAgICAgICAgY2FzZSAnU1NTJyA6XG4gICAgICAgIGNhc2UgJ1NTU1MnIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVTklYIFRJTUVTVEFNUCBXSVRIIE1TXG4gICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBUSU1FWk9ORVxuICAgICAgICBjYXNlICdaJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBaWlxuICAgICAgICBjYXNlICdaWicgOlxuICAgICAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl90em0gPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgY2FzZSAnd3cnOlxuICAgICAgICBjYXNlICdXJzpcbiAgICAgICAgY2FzZSAnV1cnOlxuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgY2FzZSAnZGQnOlxuICAgICAgICBjYXNlICdkZGQnOlxuICAgICAgICBjYXNlICdkZGRkJzpcbiAgICAgICAgY2FzZSAnZSc6XG4gICAgICAgIGNhc2UgJ0UnOlxuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbi5zdWJzdHIoMCwgMSk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ2dnJzpcbiAgICAgICAgY2FzZSAnZ2dnZyc6XG4gICAgICAgIGNhc2UgJ0dHJzpcbiAgICAgICAgY2FzZSAnR0dHRyc6XG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDIpO1xuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4gICAgLy8gdGhlIGFycmF5IHNob3VsZCBtaXJyb3IgdGhlIHBhcmFtZXRlcnMgYmVsb3dcbiAgICAvLyBub3RlOiBhbGwgdmFsdWVzIHBhc3QgdGhlIHllYXIgYXJlIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIGxvd2VzdCBwb3NzaWJsZSB2YWx1ZS5cbiAgICAvLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbiAgICBmdW5jdGlvbiBkYXRlRnJvbUNvbmZpZyhjb25maWcpIHtcbiAgICAgICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLFxuICAgICAgICAgICAgeWVhclRvVXNlLCBmaXhZZWFyLCB3LCB0ZW1wLCBsYW5nLCB3ZWVrZGF5LCB3ZWVrO1xuXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xuXG4gICAgICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICAgICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcbiAgICAgICAgICAgIGZpeFllYXIgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludF92YWwgPSBwYXJzZUludCh2YWwsIDEwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID9cbiAgICAgICAgICAgICAgICAgICh2YWwubGVuZ3RoIDwgMyA/IChpbnRfdmFsID4gNjggPyAxOTAwICsgaW50X3ZhbCA6IDIwMDAgKyBpbnRfdmFsKSA6IGludF92YWwpIDpcbiAgICAgICAgICAgICAgICAgIChjb25maWcuX2FbWUVBUl0gPT0gbnVsbCA/IG1vbWVudCgpLndlZWtZZWFyKCkgOiBjb25maWcuX2FbWUVBUl0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdyA9IGNvbmZpZy5fdztcbiAgICAgICAgICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKGZpeFllYXIody5HRyksIHcuVyB8fCAxLCB3LkUsIDQsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCk7XG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZCAhPSBudWxsID8gIHBhcnNlV2Vla2RheSh3LmQsIGxhbmcpIDpcbiAgICAgICAgICAgICAgICAgICh3LmUgIT0gbnVsbCA/ICBwYXJzZUludCh3LmUsIDEwKSArIGxhbmcuX3dlZWsuZG93IDogMCk7XG5cbiAgICAgICAgICAgICAgICB3ZWVrID0gcGFyc2VJbnQody53LCAxMCkgfHwgMTtcblxuICAgICAgICAgICAgICAgIC8vaWYgd2UncmUgcGFyc2luZyAnZCcsIHRoZW4gdGhlIGxvdyBkYXkgbnVtYmVycyBtYXkgYmUgbmV4dCB3ZWVrXG4gICAgICAgICAgICAgICAgaWYgKHcuZCAhPSBudWxsICYmIHdlZWtkYXkgPCBsYW5nLl93ZWVrLmRvdykge1xuICAgICAgICAgICAgICAgICAgICB3ZWVrKys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyhmaXhZZWFyKHcuZ2cpLCB3ZWVrLCB3ZWVrZGF5LCBsYW5nLl93ZWVrLmRveSwgbGFuZy5fd2Vlay5kb3cpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XG4gICAgICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhcikge1xuICAgICAgICAgICAgeWVhclRvVXNlID0gY29uZmlnLl9hW1lFQVJdID09IG51bGwgPyBjdXJyZW50RGF0ZVtZRUFSXSA6IGNvbmZpZy5fYVtZRUFSXTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRlID0gbWFrZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XG4gICAgICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgICAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxuICAgICAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgICAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxuICAgICAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgdGhlIG9mZnNldHMgdG8gdGhlIHRpbWUgdG8gYmUgcGFyc2VkIHNvIHRoYXQgd2UgY2FuIGhhdmUgYSBjbGVhbiBhcnJheSBmb3IgY2hlY2tpbmcgaXNWYWxpZFxuICAgICAgICBpbnB1dFtIT1VSXSArPSB0b0ludCgoY29uZmlnLl90em0gfHwgMCkgLyA2MCk7XG4gICAgICAgIGlucHV0W01JTlVURV0gKz0gdG9JbnQoKGNvbmZpZy5fdHptIHx8IDApICUgNjApO1xuXG4gICAgICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IG1ha2VVVENEYXRlIDogbWFrZURhdGUpLmFwcGx5KG51bGwsIGlucHV0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXRlRnJvbU9iamVjdChjb25maWcpIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dDtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgICAgICBjb25maWcuX2EgPSBbXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQueWVhcixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5tb250aCxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5kYXksXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuaG91cixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taW51dGUsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuc2Vjb25kLFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kXG4gICAgICAgIF07XG5cbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENEYXRlKClcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW25vdy5nZXRGdWxsWWVhcigpLCBub3cuZ2V0TW9udGgoKSwgbm93LmdldERhdGUoKV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuXG4gICAgICAgIGNvbmZpZy5fYSA9IFtdO1xuICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gdHJ1ZTtcblxuICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxuICAgICAgICB2YXIgbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGNvbmZpZy5fbCksXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyArIGNvbmZpZy5faSxcbiAgICAgICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICAgICAgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggPSAwO1xuXG4gICAgICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGxhbmcpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICAgICAgY29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyID0gc3RyaW5nTGVuZ3RoIC0gdG90YWxQYXJzZWRJbnB1dExlbmd0aDtcbiAgICAgICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhbmRsZSBhbSBwbVxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtICYmIGNvbmZpZy5fYVtIT1VSXSA8IDEyKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gKz0gMTI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgaXMgMTIgYW0sIGNoYW5nZSBob3VycyB0byAwXG4gICAgICAgIGlmIChjb25maWcuX2lzUG0gPT09IGZhbHNlICYmIGNvbmZpZy5fYVtIT1VSXSA9PT0gMTIpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gcmVnZXhwRXNjYXBlKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIHRlbXBDb25maWcsXG4gICAgICAgICAgICBiZXN0TW9tZW50LFxuXG4gICAgICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBleHRlbmQoe30sIGNvbmZpZyk7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQodGVtcENvbmZpZyk7XG5cbiAgICAgICAgICAgIGlmICghaXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZi5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcbiAgICAgICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcbiAgICAgICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmcoY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBsLFxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2ggPSBpc29SZWdleC5leGVjKHN0cmluZyk7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLmlzbyA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMoc3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaFs1XSBzaG91bGQgYmUgXCJUXCIgb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiA9IGlzb0RhdGVzW2ldWzBdICsgKG1hdGNoWzZdIHx8IFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKHN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyaW5nLm1hdGNoKHBhcnNlVG9rZW5UaW1lem9uZSkpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2YgKz0gXCJaXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHN0cmluZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2hlZCA9IGFzcE5ldEpzb25SZWdleC5leGVjKGlucHV0KTtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IGlucHV0LnNsaWNlKDApO1xuICAgICAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkYXRlRnJvbU9iamVjdChjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZURhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpIHtcbiAgICAgICAgLy9jYW4ndCBqdXN0IGFwcGx5KCkgdG8gY3JlYXRlIGEgZGF0ZTpcbiAgICAgICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE4MTM0OC9pbnN0YW50aWF0aW5nLWEtamF2YXNjcmlwdC1vYmplY3QtYnktY2FsbGluZy1wcm90b3R5cGUtY29uc3RydWN0b3ItYXBwbHlcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcyk7XG5cbiAgICAgICAgLy90aGUgZGF0ZSBjb25zdHJ1Y3RvciBkb2Vzbid0IGFjY2VwdCB5ZWFycyA8IDE5NzBcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VVVENEYXRlKHkpIHtcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbGFuZ3VhZ2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBsYW5ndWFnZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgUmVsYXRpdmUgVGltZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxhbmcpIHtcbiAgICAgICAgcmV0dXJuIGxhbmcucmVsYXRpdmVUaW1lKG51bWJlciB8fCAxLCAhIXdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlVGltZShtaWxsaXNlY29uZHMsIHdpdGhvdXRTdWZmaXgsIGxhbmcpIHtcbiAgICAgICAgdmFyIHNlY29uZHMgPSByb3VuZChNYXRoLmFicyhtaWxsaXNlY29uZHMpIC8gMTAwMCksXG4gICAgICAgICAgICBtaW51dGVzID0gcm91bmQoc2Vjb25kcyAvIDYwKSxcbiAgICAgICAgICAgIGhvdXJzID0gcm91bmQobWludXRlcyAvIDYwKSxcbiAgICAgICAgICAgIGRheXMgPSByb3VuZChob3VycyAvIDI0KSxcbiAgICAgICAgICAgIHllYXJzID0gcm91bmQoZGF5cyAvIDM2NSksXG4gICAgICAgICAgICBhcmdzID0gc2Vjb25kcyA8IDQ1ICYmIFsncycsIHNlY29uZHNdIHx8XG4gICAgICAgICAgICAgICAgbWludXRlcyA9PT0gMSAmJiBbJ20nXSB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPCA0NSAmJiBbJ21tJywgbWludXRlc10gfHxcbiAgICAgICAgICAgICAgICBob3VycyA9PT0gMSAmJiBbJ2gnXSB8fFxuICAgICAgICAgICAgICAgIGhvdXJzIDwgMjIgJiYgWydoaCcsIGhvdXJzXSB8fFxuICAgICAgICAgICAgICAgIGRheXMgPT09IDEgJiYgWydkJ10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDw9IDI1ICYmIFsnZGQnLCBkYXlzXSB8fFxuICAgICAgICAgICAgICAgIGRheXMgPD0gNDUgJiYgWydNJ10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDwgMzQ1ICYmIFsnTU0nLCByb3VuZChkYXlzIC8gMzApXSB8fFxuICAgICAgICAgICAgICAgIHllYXJzID09PSAxICYmIFsneSddIHx8IFsneXknLCB5ZWFyc107XG4gICAgICAgIGFyZ3NbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgICAgICBhcmdzWzNdID0gbWlsbGlzZWNvbmRzID4gMDtcbiAgICAgICAgYXJnc1s0XSA9IGxhbmc7XG4gICAgICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseSh7fSwgYXJncyk7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFdlZWsgb2YgWWVhclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gZmlyc3REYXlPZldlZWsgICAgICAgMCA9IHN1biwgNiA9IHNhdFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIHRoZSBkYXkgb2YgdGhlIHdlZWsgdGhhdCBzdGFydHMgdGhlIHdlZWtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAodXN1YWxseSBzdW5kYXkgb3IgbW9uZGF5KVxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIDAgPSBzdW4sIDYgPSBzYXRcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZmlyc3Qgd2VlayBpcyB0aGUgd2VlayB0aGF0IGNvbnRhaW5zIHRoZSBmaXJzdFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIG9mIHRoaXMgZGF5IG9mIHRoZSB3ZWVrXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKGVnLiBJU08gd2Vla3MgdXNlIHRodXJzZGF5ICg0KSlcbiAgICBmdW5jdGlvbiB3ZWVrT2ZZZWFyKG1vbSwgZmlyc3REYXlPZldlZWssIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyKSB7XG4gICAgICAgIHZhciBlbmQgPSBmaXJzdERheU9mV2Vla09mWWVhciAtIGZpcnN0RGF5T2ZXZWVrLFxuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBtb20uZGF5KCksXG4gICAgICAgICAgICBhZGp1c3RlZE1vbWVudDtcblxuXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPiBlbmQpIHtcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayAtPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRheXNUb0RheU9mV2VlayA8IGVuZCAtIDcpIHtcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayArPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgYWRqdXN0ZWRNb21lbnQgPSBtb21lbnQobW9tKS5hZGQoJ2QnLCBkYXlzVG9EYXlPZldlZWspO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2VlazogTWF0aC5jZWlsKGFkanVzdGVkTW9tZW50LmRheU9mWWVhcigpIC8gNyksXG4gICAgICAgICAgICB5ZWFyOiBhZGp1c3RlZE1vbWVudC55ZWFyKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvL2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZSNDYWxjdWxhdGluZ19hX2RhdGVfZ2l2ZW5fdGhlX3llYXIuMkNfd2Vla19udW1iZXJfYW5kX3dlZWtkYXlcbiAgICBmdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla3MoeWVhciwgd2Vlaywgd2Vla2RheSwgZmlyc3REYXlPZldlZWtPZlllYXIsIGZpcnN0RGF5T2ZXZWVrKSB7XG4gICAgICAgIHZhciBkID0gbWFrZVVUQ0RhdGUoeWVhciwgMCwgMSkuZ2V0VVRDRGF5KCksIGRheXNUb0FkZCwgZGF5T2ZZZWFyO1xuXG4gICAgICAgIHdlZWtkYXkgPSB3ZWVrZGF5ICE9IG51bGwgPyB3ZWVrZGF5IDogZmlyc3REYXlPZldlZWs7XG4gICAgICAgIGRheXNUb0FkZCA9IGZpcnN0RGF5T2ZXZWVrIC0gZCArIChkID4gZmlyc3REYXlPZldlZWtPZlllYXIgPyA3IDogMCkgLSAoZCA8IGZpcnN0RGF5T2ZXZWVrID8gNyA6IDApO1xuICAgICAgICBkYXlPZlllYXIgPSA3ICogKHdlZWsgLSAxKSArICh3ZWVrZGF5IC0gZmlyc3REYXlPZldlZWspICsgZGF5c1RvQWRkICsgMTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeWVhcjogZGF5T2ZZZWFyID4gMCA/IHllYXIgOiB5ZWFyIC0gMSxcbiAgICAgICAgICAgIGRheU9mWWVhcjogZGF5T2ZZZWFyID4gMCA/ICBkYXlPZlllYXIgOiBkYXlzSW5ZZWFyKHllYXIgLSAxKSArIGRheU9mWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIG1ha2VNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGNvbmZpZy5fZjtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuaW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBnZXRMYW5nRGVmaW5pdGlvbigpLnByZXBhcnNlKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb21lbnQuaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcgPSBjbG9uZU1vbWVudChpbnB1dCk7XG5cbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCtpbnB1dC5fZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0KSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheShmb3JtYXQpKSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBNb21lbnQoY29uZmlnKTtcbiAgICB9XG5cbiAgICBtb21lbnQgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl9pID0gaW5wdXQ7XG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XG4gICAgICAgIGMuX2wgPSBsYW5nO1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpO1xuICAgIH07XG5cbiAgICAvLyBjcmVhdGluZyB3aXRoIHV0Y1xuICAgIG1vbWVudC51dGMgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbGFuZywgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobGFuZykgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsYW5nO1xuICAgICAgICAgICAgbGFuZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICBjLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGMuX2wgPSBsYW5nO1xuICAgICAgICBjLl9pID0gaW5wdXQ7XG4gICAgICAgIGMuX2YgPSBmb3JtYXQ7XG4gICAgICAgIGMuX3N0cmljdCA9IHN0cmljdDtcbiAgICAgICAgYy5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XG5cbiAgICAgICAgcmV0dXJuIG1ha2VNb21lbnQoYykudXRjKCk7XG4gICAgfTtcblxuICAgIC8vIGNyZWF0aW5nIHdpdGggdW5peCB0aW1lc3RhbXAgKGluIHNlY29uZHMpXG4gICAgbW9tZW50LnVuaXggPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCAqIDEwMDApO1xuICAgIH07XG5cbiAgICAvLyBkdXJhdGlvblxuICAgIG1vbWVudC5kdXJhdGlvbiA9IGZ1bmN0aW9uIChpbnB1dCwga2V5KSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxuICAgICAgICAgICAgLy8gbWF0Y2hpbmcgYWdhaW5zdCByZWdleHAgaXMgZXhwZW5zaXZlLCBkbyBpdCBvbiBkZW1hbmRcbiAgICAgICAgICAgIG1hdGNoID0gbnVsbCxcbiAgICAgICAgICAgIHNpZ24sXG4gICAgICAgICAgICByZXQsXG4gICAgICAgICAgICBwYXJzZUlzbztcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtczogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNOiBpbnB1dC5fbW9udGhzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkOiB0b0ludChtYXRjaFtEQVRFXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIGg6IHRvSW50KG1hdGNoW0hPVVJdKSAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbTogdG9JbnQobWF0Y2hbTUlOVVRFXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIHM6IHRvSW50KG1hdGNoW1NFQ09ORF0pICogc2lnbixcbiAgICAgICAgICAgICAgICBtczogdG9JbnQobWF0Y2hbTUlMTElTRUNPTkRdKSAqIHNpZ25cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBpc29EdXJhdGlvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gXCItXCIpID8gLTEgOiAxO1xuICAgICAgICAgICAgcGFyc2VJc28gPSBmdW5jdGlvbiAoaW5wKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cbiAgICAgICAgICAgICAgICAvLyBjb252ZXJ0cyBmbG9hdHMgdG8gaW50cy5cbiAgICAgICAgICAgICAgICAvLyBpbnAgbWF5IGJlIHVuZGVmaW5lZCwgc28gY2FyZWZ1bCBjYWxsaW5nIHJlcGxhY2Ugb24gaXQuXG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgICAgICAgICAgICAgLy8gYXBwbHkgc2lnbiB3aGlsZSB3ZSdyZSBhdCBpdFxuICAgICAgICAgICAgICAgIHJldHVybiAoaXNOYU4ocmVzKSA/IDAgOiByZXMpICogc2lnbjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB5OiBwYXJzZUlzbyhtYXRjaFsyXSksXG4gICAgICAgICAgICAgICAgTTogcGFyc2VJc28obWF0Y2hbM10pLFxuICAgICAgICAgICAgICAgIGQ6IHBhcnNlSXNvKG1hdGNoWzRdKSxcbiAgICAgICAgICAgICAgICBoOiBwYXJzZUlzbyhtYXRjaFs1XSksXG4gICAgICAgICAgICAgICAgbTogcGFyc2VJc28obWF0Y2hbNl0pLFxuICAgICAgICAgICAgICAgIHM6IHBhcnNlSXNvKG1hdGNoWzddKSxcbiAgICAgICAgICAgICAgICB3OiBwYXJzZUlzbyhtYXRjaFs4XSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xuXG4gICAgICAgIGlmIChtb21lbnQuaXNEdXJhdGlvbihpbnB1dCkgJiYgaW5wdXQuaGFzT3duUHJvcGVydHkoJ19sYW5nJykpIHtcbiAgICAgICAgICAgIHJldC5fbGFuZyA9IGlucHV0Ll9sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBtb21lbnQudmVyc2lvbiA9IFZFUlNJT047XG5cbiAgICAvLyBkZWZhdWx0IGZvcm1hdFxuICAgIG1vbWVudC5kZWZhdWx0Rm9ybWF0ID0gaXNvRm9ybWF0O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuICAgIC8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxuICAgIG1vbWVudC51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbW9tZW50LmxhbmcgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIHI7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmZuLl9sYW5nLl9hYmJyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIGxvYWRMYW5nKG5vcm1hbGl6ZUxhbmd1YWdlKGtleSksIHZhbHVlcyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICB1bmxvYWRMYW5nKGtleSk7XG4gICAgICAgICAgICBrZXkgPSAnZW4nO1xuICAgICAgICB9IGVsc2UgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByID0gbW9tZW50LmR1cmF0aW9uLmZuLl9sYW5nID0gbW9tZW50LmZuLl9sYW5nID0gZ2V0TGFuZ0RlZmluaXRpb24oa2V5KTtcbiAgICAgICAgcmV0dXJuIHIuX2FiYnI7XG4gICAgfTtcblxuICAgIC8vIHJldHVybnMgbGFuZ3VhZ2UgZGF0YVxuICAgIG1vbWVudC5sYW5nRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSAmJiBrZXkuX2xhbmcgJiYga2V5Ll9sYW5nLl9hYmJyKSB7XG4gICAgICAgICAgICBrZXkgPSBrZXkuX2xhbmcuX2FiYnI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgfTtcblxuICAgIC8vIGNvbXBhcmUgbW9tZW50IG9iamVjdFxuICAgIG1vbWVudC5pc01vbWVudCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fFxuICAgICAgICAgICAgKG9iaiAhPSBudWxsICYmICBvYmouaGFzT3duUHJvcGVydHkoJ19pc0FNb21lbnRPYmplY3QnKSk7XG4gICAgfTtcblxuICAgIC8vIGZvciB0eXBlY2hlY2tpbmcgRHVyYXRpb24gb2JqZWN0c1xuICAgIG1vbWVudC5pc0R1cmF0aW9uID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRHVyYXRpb247XG4gICAgfTtcblxuICAgIGZvciAoaSA9IGxpc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIG1ha2VMaXN0KGxpc3RzW2ldKTtcbiAgICB9XG5cbiAgICBtb21lbnQubm9ybWFsaXplVW5pdHMgPSBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICB9O1xuXG4gICAgbW9tZW50LmludmFsaWQgPSBmdW5jdGlvbiAoZmxhZ3MpIHtcbiAgICAgICAgdmFyIG0gPSBtb21lbnQudXRjKE5hTik7XG4gICAgICAgIGlmIChmbGFncyAhPSBudWxsKSB7XG4gICAgICAgICAgICBleHRlbmQobS5fcGYsIGZsYWdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG0uX3BmLnVzZXJJbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgbW9tZW50LnBhcnNlWm9uZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0KS5wYXJzZVpvbmUoKTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBNb21lbnQgUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQobW9tZW50LmZuID0gTW9tZW50LnByb3RvdHlwZSwge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLl9kICsgKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5peCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCt0aGlzIC8gMTAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxhbmcoJ2VuJykuZm9ybWF0KFwiZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlpcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9EYXRlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZnNldCA/IG5ldyBEYXRlKCt0aGlzKSA6IHRoaXMuX2Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbSA9IG1vbWVudCh0aGlzKS51dGMoKTtcbiAgICAgICAgICAgIGlmICgwIDwgbS55ZWFyKCkgJiYgbS55ZWFyKCkgPD0gOTk5OSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgbS55ZWFyKCksXG4gICAgICAgICAgICAgICAgbS5tb250aCgpLFxuICAgICAgICAgICAgICAgIG0uZGF0ZSgpLFxuICAgICAgICAgICAgICAgIG0uaG91cnMoKSxcbiAgICAgICAgICAgICAgICBtLm1pbnV0ZXMoKSxcbiAgICAgICAgICAgICAgICBtLnNlY29uZHMoKSxcbiAgICAgICAgICAgICAgICBtLm1pbGxpc2Vjb25kcygpXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVmFsaWQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0RTVFNoaWZ0ZWQgOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpICYmIGNvbXBhcmVBcnJheXModGhpcy5fYSwgKHRoaXMuX2lzVVRDID8gbW9tZW50LnV0Yyh0aGlzLl9hKSA6IG1vbWVudCh0aGlzLl9hKSkudG9BcnJheSgpKSA+IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzaW5nRmxhZ3MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCB0aGlzLl9wZik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZEF0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGYub3ZlcmZsb3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXRjIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuem9uZSgwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsb2NhbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuem9uZSgwKTtcbiAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRNb21lbnQodGhpcywgaW5wdXRTdHJpbmcgfHwgbW9tZW50LmRlZmF1bHRGb3JtYXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1cjtcbiAgICAgICAgICAgIC8vIHN3aXRjaCBhcmdzIHRvIHN1cHBvcnQgYWRkKCdzJywgMSkgYW5kIGFkZCgxLCAncycpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbigrdmFsLCBpbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcywgZHVyLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKGlucHV0LCB2YWwpIHtcbiAgICAgICAgICAgIHZhciBkdXI7XG4gICAgICAgICAgICAvLyBzd2l0Y2ggYXJncyB0byBzdXBwb3J0IHN1YnRyYWN0KCdzJywgMSkgYW5kIHN1YnRyYWN0KDEsICdzJylcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKCt2YWwsIGlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHVyID0gbW9tZW50LmR1cmF0aW9uKGlucHV0LCB2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIC0xKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmYgOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IG1ha2VBcyhpbnB1dCwgdGhpcyksXG4gICAgICAgICAgICAgICAgem9uZURpZmYgPSAodGhpcy56b25lKCkgLSB0aGF0LnpvbmUoKSkgKiA2ZTQsXG4gICAgICAgICAgICAgICAgZGlmZiwgb3V0cHV0O1xuXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcpIHtcbiAgICAgICAgICAgICAgICAvLyBhdmVyYWdlIG51bWJlciBvZiBkYXlzIGluIHRoZSBtb250aHMgaW4gdGhlIGdpdmVuIGRhdGVzXG4gICAgICAgICAgICAgICAgZGlmZiA9ICh0aGlzLmRheXNJbk1vbnRoKCkgKyB0aGF0LmRheXNJbk1vbnRoKCkpICogNDMyZTU7IC8vIDI0ICogNjAgKiA2MCAqIDEwMDAgLyAyXG4gICAgICAgICAgICAgICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAoKHRoaXMueWVhcigpIC0gdGhhdC55ZWFyKCkpICogMTIpICsgKHRoaXMubW9udGgoKSAtIHRoYXQubW9udGgoKSk7XG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IGJ5IHRha2luZyBkaWZmZXJlbmNlIGluIGRheXMsIGF2ZXJhZ2UgbnVtYmVyIG9mIGRheXNcbiAgICAgICAgICAgICAgICAvLyBhbmQgZHN0IGluIHRoZSBnaXZlbiBtb250aHMuXG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9ICgodGhpcyAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCdtb250aCcpKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhhdCAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpKSkgLyBkaWZmO1xuICAgICAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdpdGggem9uZXMsIHRvIG5lZ2F0ZSBhbGwgZHN0XG4gICAgICAgICAgICAgICAgb3V0cHV0IC09ICgodGhpcy56b25lKCkgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKS56b25lKCkpIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGF0LnpvbmUoKSAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpLnpvbmUoKSkpICogNmU0IC8gZGlmZjtcbiAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZmYgPSAodGhpcyAtIHRoYXQpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHVuaXRzID09PSAnc2Vjb25kJyA/IGRpZmYgLyAxZTMgOiAvLyAxMDAwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnbWludXRlJyA/IGRpZmYgLyA2ZTQgOiAvLyAxMDAwICogNjBcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdob3VyJyA/IGRpZmYgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdkYXknID8gKGRpZmYgLSB6b25lRGlmZikgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICd3ZWVrJyA/IChkaWZmIC0gem9uZURpZmYpIC8gNjA0OGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDcsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICAgICAgZGlmZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc0Zsb2F0ID8gb3V0cHV0IDogYWJzUm91bmQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmcm9tIDogZnVuY3Rpb24gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24odGhpcy5kaWZmKHRpbWUpKS5sYW5nKHRoaXMubGFuZygpLl9hYmJyKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnJvbU5vdyA6IGZ1bmN0aW9uICh3aXRob3V0U3VmZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcm9tKG1vbWVudCgpLCB3aXRob3V0U3VmZml4KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgICAgICAgICAvLyBHZXR0aW5nIHN0YXJ0LW9mLXRvZGF5IGRlcGVuZHMgb24gd2hldGhlciB3ZSdyZSB6b25lJ2Qgb3Igbm90LlxuICAgICAgICAgICAgdmFyIHNvZCA9IG1ha2VBcyhtb21lbnQoKSwgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgICAgICAgICAgZGlmZiA9IHRoaXMuZGlmZihzb2QsICdkYXlzJywgdHJ1ZSksXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KHRoaXMubGFuZygpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzTGVhcFllYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih0aGlzLnllYXIoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNEU1QgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDApLnpvbmUoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuem9uZSgpIDwgdGhpcy5jbG9uZSgpLm1vbnRoKDUpLnpvbmUoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubGFuZygpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoeyBkIDogaW5wdXQgLSBkYXkgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGggOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciB1dGMgPSB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJycsXG4gICAgICAgICAgICAgICAgZGF5T2ZNb250aDtcblxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHRoaXMubGFuZygpLm1vbnRoc1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGF5T2ZNb250aCA9IHRoaXMuZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kWydzZXQnICsgdXRjICsgJ01vbnRoJ10oaW5wdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZShNYXRoLm1pbihkYXlPZk1vbnRoLCB0aGlzLmRheXNJbk1vbnRoKCkpKTtcblxuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kWydnZXQnICsgdXRjICsgJ01vbnRoJ10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydE9mOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgICAgICAgICAgLy8gdG8gdXRpbGl6ZSBmYWxsaW5nIHRocm91Z2ggdGhlIGNhc2VzLlxuICAgICAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgY2FzZSAneWVhcic6XG4gICAgICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBlbmRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0T2YodW5pdHMpLmFkZCgodW5pdHMgPT09ICdpc29XZWVrJyA/ICd3ZWVrJyA6IHVuaXRzKSwgMSkuc3VidHJhY3QoJ21zJywgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNBZnRlcjogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPiArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0JlZm9yZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSB0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnO1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPCArbW9tZW50KGlucHV0KS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1NhbWU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gdW5pdHMgfHwgJ21zJztcbiAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID09PSArbWFrZUFzKGlucHV0LCB0aGlzKS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtaW46IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWF4OiBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPiB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIHpvbmUgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLl9vZmZzZXQgfHwgMDtcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHRpbWV6b25lTWludXRlc0Zyb21TdHJpbmcoaW5wdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoaW5wdXQpIDwgMTYpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dCAqIDYwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBtb21lbnQuZHVyYXRpb24ob2Zmc2V0IC0gaW5wdXQsICdtJyksIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogdGhpcy5fZC5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgem9uZUFiYnIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBcIlVUQ1wiIDogXCJcIjtcbiAgICAgICAgfSxcblxuICAgICAgICB6b25lTmFtZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/IFwiQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWVcIiA6IFwiXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2Vab25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3R6bSkge1xuICAgICAgICAgICAgICAgIHRoaXMuem9uZSh0aGlzLl90em0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnpvbmUodGhpcy5faSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBoYXNBbGlnbmVkSG91ck9mZnNldCA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbW9tZW50KGlucHV0KS56b25lKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy56b25lKCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcbiAgICAgICAgfSxcblxuICAgICAgICBkYXlzSW5Nb250aCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXlzSW5Nb250aCh0aGlzLnllYXIoKSwgdGhpcy5tb250aCgpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkYXlPZlllYXIgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBkYXlPZlllYXIgPSByb3VuZCgobW9tZW50KHRoaXMpLnN0YXJ0T2YoJ2RheScpIC0gbW9tZW50KHRoaXMpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gZGF5T2ZZZWFyKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcXVhcnRlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEuMCkgLyAzLjApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgdGhpcy5sYW5nKCkuX3dlZWsuZG93LCB0aGlzLmxhbmcoKS5fd2Vlay5kb3kpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZChcInlcIiwgKGlucHV0IC0geWVhcikpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzb1dlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgMSwgNCkueWVhcjtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8geWVhciA6IHRoaXMuYWRkKFwieVwiLCAoaW5wdXQgLSB5ZWFyKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB0aGlzLmxhbmcoKS53ZWVrKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoXCJkXCIsIChpbnB1dCAtIHdlZWspICogNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZChcImRcIiwgKGlucHV0IC0gd2VlaykgKiA3KTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgd2Vla2RheSA9ICh0aGlzLmRheSgpICsgNyAtIHRoaXMubGFuZygpLl93ZWVrLmRvdykgJSA3O1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoXCJkXCIsIGlucHV0IC0gd2Vla2RheSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgICAgICAgICAgLy8gYXMgYSBnZXR0ZXIsIHJldHVybnMgNyBpbnN0ZWFkIG9mIDAgKDEtNyByYW5nZSBpbnN0ZWFkIG9mIDAtNilcbiAgICAgICAgICAgIC8vIGFzIGEgc2V0dGVyLCBzdW5kYXkgc2hvdWxkIGJlbG9uZyB0byB0aGUgcHJldmlvdXMgd2Vlay5cbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gdGhpcy5kYXkoKSB8fCA3IDogdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyBpbnB1dCA6IGlucHV0IC0gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0IDogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh1bml0cywgdmFsdWUpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzW3VuaXRzXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIElmIHBhc3NlZCBhIGxhbmd1YWdlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxhbmd1YWdlIGZvciB0aGlzXG4gICAgICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvblxuICAgICAgICAvLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAgICAgIGxhbmcgOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbGFuZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFuZyA9IGdldExhbmdEZWZpbml0aW9uKGtleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGhlbHBlciBmb3IgYWRkaW5nIHNob3J0Y3V0c1xuICAgIGZ1bmN0aW9uIG1ha2VHZXR0ZXJBbmRTZXR0ZXIobmFtZSwga2V5KSB7XG4gICAgICAgIG1vbWVudC5mbltuYW1lXSA9IG1vbWVudC5mbltuYW1lICsgJ3MnXSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHV0YyA9IHRoaXMuX2lzVVRDID8gJ1VUQycgOiAnJztcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZFsnc2V0JyArIHV0YyArIGtleV0oaW5wdXQpO1xuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kWydnZXQnICsgdXRjICsga2V5XSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGxvb3AgdGhyb3VnaCBhbmQgYWRkIHNob3J0Y3V0cyAoTW9udGgsIERhdGUsIEhvdXJzLCBNaW51dGVzLCBTZWNvbmRzLCBNaWxsaXNlY29uZHMpXG4gICAgZm9yIChpID0gMDsgaSA8IHByb3h5R2V0dGVyc0FuZFNldHRlcnMubGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIG1ha2VHZXR0ZXJBbmRTZXR0ZXIocHJveHlHZXR0ZXJzQW5kU2V0dGVyc1tpXS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL3MkLywgJycpLCBwcm94eUdldHRlcnNBbmRTZXR0ZXJzW2ldKTtcbiAgICB9XG5cbiAgICAvLyBhZGQgc2hvcnRjdXQgZm9yIHllYXIgKHVzZXMgZGlmZmVyZW50IHN5bnRheCB0aGFuIHRoZSBnZXR0ZXIvc2V0dGVyICd5ZWFyJyA9PSAnRnVsbFllYXInKVxuICAgIG1ha2VHZXR0ZXJBbmRTZXR0ZXIoJ3llYXInLCAnRnVsbFllYXInKTtcblxuICAgIC8vIGFkZCBwbHVyYWwgbWV0aG9kc1xuICAgIG1vbWVudC5mbi5kYXlzID0gbW9tZW50LmZuLmRheTtcbiAgICBtb21lbnQuZm4ubW9udGhzID0gbW9tZW50LmZuLm1vbnRoO1xuICAgIG1vbWVudC5mbi53ZWVrcyA9IG1vbWVudC5mbi53ZWVrO1xuICAgIG1vbWVudC5mbi5pc29XZWVrcyA9IG1vbWVudC5mbi5pc29XZWVrO1xuXG4gICAgLy8gYWRkIGFsaWFzZWQgZm9ybWF0IG1ldGhvZHNcbiAgICBtb21lbnQuZm4udG9KU09OID0gbW9tZW50LmZuLnRvSVNPU3RyaW5nO1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBEdXJhdGlvbiBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGV4dGVuZChtb21lbnQuZHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGUsIHtcblxuICAgICAgICBfYnViYmxlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyxcbiAgICAgICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2RhdGEsXG4gICAgICAgICAgICAgICAgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzO1xuXG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGNvZGUgYnViYmxlcyB1cCB2YWx1ZXMsIHNlZSB0aGUgdGVzdHMgZm9yXG4gICAgICAgICAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXG4gICAgICAgICAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG5cbiAgICAgICAgICAgIHNlY29uZHMgPSBhYnNSb3VuZChtaWxsaXNlY29uZHMgLyAxMDAwKTtcbiAgICAgICAgICAgIGRhdGEuc2Vjb25kcyA9IHNlY29uZHMgJSA2MDtcblxuICAgICAgICAgICAgbWludXRlcyA9IGFic1JvdW5kKHNlY29uZHMgLyA2MCk7XG4gICAgICAgICAgICBkYXRhLm1pbnV0ZXMgPSBtaW51dGVzICUgNjA7XG5cbiAgICAgICAgICAgIGhvdXJzID0gYWJzUm91bmQobWludXRlcyAvIDYwKTtcbiAgICAgICAgICAgIGRhdGEuaG91cnMgPSBob3VycyAlIDI0O1xuXG4gICAgICAgICAgICBkYXlzICs9IGFic1JvdW5kKGhvdXJzIC8gMjQpO1xuICAgICAgICAgICAgZGF0YS5kYXlzID0gZGF5cyAlIDMwO1xuXG4gICAgICAgICAgICBtb250aHMgKz0gYWJzUm91bmQoZGF5cyAvIDMwKTtcbiAgICAgICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzICUgMTI7XG5cbiAgICAgICAgICAgIHllYXJzID0gYWJzUm91bmQobW9udGhzIC8gMTIpO1xuICAgICAgICAgICAgZGF0YS55ZWFycyA9IHllYXJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFic1JvdW5kKHRoaXMuZGF5cygpIC8gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9taWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNjtcbiAgICAgICAgfSxcblxuICAgICAgICBodW1hbml6ZSA6IGZ1bmN0aW9uICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICB2YXIgZGlmZmVyZW5jZSA9ICt0aGlzLFxuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlbGF0aXZlVGltZShkaWZmZXJlbmNlLCAhd2l0aFN1ZmZpeCwgdGhpcy5sYW5nKCkpO1xuXG4gICAgICAgICAgICBpZiAod2l0aFN1ZmZpeCkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHRoaXMubGFuZygpLnBhc3RGdXR1cmUoZGlmZmVyZW5jZSwgb3V0cHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKG1vbWVudClcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArPSBkdXIuX21pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKz0gZHVyLl9kYXlzO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzICs9IGR1ci5fbW9udGhzO1xuXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcblxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzIC09IGR1ci5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgdGhpcy5fZGF5cyAtPSBkdXIuX2RheXM7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgLT0gZHVyLl9tb250aHM7XG5cbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMudG9Mb3dlckNhc2UoKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcyA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1snYXMnICsgdW5pdHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB1bml0cy5zbGljZSgxKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogbW9tZW50LmZuLmxhbmcsXG5cbiAgICAgICAgdG9Jc29TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICAgICAgdmFyIHllYXJzID0gTWF0aC5hYnModGhpcy55ZWFycygpKSxcbiAgICAgICAgICAgICAgICBtb250aHMgPSBNYXRoLmFicyh0aGlzLm1vbnRocygpKSxcbiAgICAgICAgICAgICAgICBkYXlzID0gTWF0aC5hYnModGhpcy5kYXlzKCkpLFxuICAgICAgICAgICAgICAgIGhvdXJzID0gTWF0aC5hYnModGhpcy5ob3VycygpKSxcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gTWF0aC5hYnModGhpcy5taW51dGVzKCkpLFxuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLmFicyh0aGlzLnNlY29uZHMoKSArIHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFzU2Vjb25kcygpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAgICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy5hc1NlY29uZHMoKSA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAgICAgICAgICdQJyArXG4gICAgICAgICAgICAgICAgKHllYXJzID8geWVhcnMgKyAnWScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChtb250aHMgPyBtb250aHMgKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChkYXlzID8gZGF5cyArICdEJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKChob3VycyB8fCBtaW51dGVzIHx8IHNlY29uZHMpID8gJ1QnIDogJycpICtcbiAgICAgICAgICAgICAgICAoaG91cnMgPyBob3VycyArICdIJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKG1pbnV0ZXMgPyBtaW51dGVzICsgJ00nIDogJycpICtcbiAgICAgICAgICAgICAgICAoc2Vjb25kcyA/IHNlY29uZHMgKyAnUycgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkdldHRlcihuYW1lKSB7XG4gICAgICAgIG1vbWVudC5kdXJhdGlvbi5mbltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkFzR2V0dGVyKG5hbWUsIGZhY3Rvcikge1xuICAgICAgICBtb21lbnQuZHVyYXRpb24uZm5bJ2FzJyArIG5hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzIC8gZmFjdG9yO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZvciAoaSBpbiB1bml0TWlsbGlzZWNvbmRGYWN0b3JzKSB7XG4gICAgICAgIGlmICh1bml0TWlsbGlzZWNvbmRGYWN0b3JzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBtYWtlRHVyYXRpb25Bc0dldHRlcihpLCB1bml0TWlsbGlzZWNvbmRGYWN0b3JzW2ldKTtcbiAgICAgICAgICAgIG1ha2VEdXJhdGlvbkdldHRlcihpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWFrZUR1cmF0aW9uQXNHZXR0ZXIoJ1dlZWtzJywgNjA0OGU1KTtcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNNb250aHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAoK3RoaXMgLSB0aGlzLnllYXJzKCkgKiAzMTUzNmU2KSAvIDI1OTJlNiArIHRoaXMueWVhcnMoKSAqIDEyO1xuICAgIH07XG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBMYW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBTZXQgZGVmYXVsdCBsYW5ndWFnZSwgb3RoZXIgbGFuZ3VhZ2VzIHdpbGwgaW5oZXJpdCBmcm9tIEVuZ2xpc2guXG4gICAgbW9tZW50LmxhbmcoJ2VuJywge1xuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyogRU1CRURfTEFOR1VBR0VTICovXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE1vbWVudFxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIG1ha2VHbG9iYWwoZGVwcmVjYXRlKSB7XG4gICAgICAgIHZhciB3YXJuZWQgPSBmYWxzZSwgbG9jYWxfbW9tZW50ID0gbW9tZW50O1xuICAgICAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgICAgICBpZiAodHlwZW9mIGVuZGVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG1vbWVudGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZVxuICAgICAgICBpZiAoZGVwcmVjYXRlKSB7XG4gICAgICAgICAgICBnbG9iYWwubW9tZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghd2FybmVkICYmIGNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkFjY2Vzc2luZyBNb21lbnQgdGhyb3VnaCB0aGUgZ2xvYmFsIHNjb3BlIGlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRlcHJlY2F0ZWQsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVsZWFzZS5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbF9tb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBleHRlbmQoZ2xvYmFsLm1vbWVudCwgbG9jYWxfbW9tZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsb2JhbFsnbW9tZW50J10gPSBtb21lbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtb21lbnQ7XG4gICAgICAgIG1ha2VHbG9iYWwodHJ1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoXCJtb21lbnRcIiwgZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuICAgICAgICAgICAgaWYgKG1vZHVsZS5jb25maWcgJiYgbW9kdWxlLmNvbmZpZygpICYmIG1vZHVsZS5jb25maWcoKS5ub0dsb2JhbCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHVzZXIgcHJvdmlkZWQgbm9HbG9iYWwsIGhlIGlzIGF3YXJlIG9mIGdsb2JhbFxuICAgICAgICAgICAgICAgIG1ha2VHbG9iYWwobW9kdWxlLmNvbmZpZygpLm5vR2xvYmFsID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50O1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtYWtlR2xvYmFsKCk7XG4gICAgfVxufSkuY2FsbCh0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gb25jZVxuXG5vbmNlLnByb3RvID0gb25jZShmdW5jdGlvbiAoKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGdW5jdGlvbi5wcm90b3R5cGUsICdvbmNlJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gb25jZSh0aGlzKVxuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59KVxuXG5mdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgZiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZi5jYWxsZWQpIHJldHVybiBmLnZhbHVlXG4gICAgZi5jYWxsZWQgPSB0cnVlXG4gICAgcmV0dXJuIGYudmFsdWUgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cbiAgZi5jYWxsZWQgPSBmYWxzZVxuICByZXR1cm4gZlxufVxuIiwiZXhwb3J0cy5Bc3NldHNNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvYXNzZXRzbWFuYWdlcicpO1xuIiwidmFyIGNvbnZlcnQgPSByZXF1aXJlKCdjb2xvci1jb252ZXJ0Jyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgd29ya2VycHJveHkgPSByZXF1aXJlKCd3b3JrZXJwcm94eScpO1xuXG52YXIgUmVzb3VyY2VMb2FkZXIgPSByZXF1aXJlKCcuL3Jlc291cmNlbG9hZGVyJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBBc3NldHNNYW5hZ2VyO1xuXG5cbmZ1bmN0aW9uIEFzc2V0c01hbmFnZXIob3B0X29wdGlvbnMpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgd29ya2VyUGF0aDogX19kaXJuYW1lICsgJy8uLi93b3JrZXIuanMnLFxuICAgIHdvcmtlcnM6IDFcbiAgfTtcblxuICBPYmplY3Quc2VhbChvcHRpb25zKTtcbiAgbWVyZ2Uob3B0aW9ucywgb3B0X29wdGlvbnMpO1xuICBPYmplY3QuZnJlZXplKG9wdGlvbnMpO1xuXG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgLy8gQ3JlYXRlIHRoZSBudW1iZXIgb2Ygd29ya2VycyBzcGVjaWZpZWQgaW4gb3B0aW9ucy5cbiAgdmFyIHdvcmtlcnMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLndvcmtlcnM7IGkrKykge1xuICAgIHdvcmtlcnMucHVzaChuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCkpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgcHJveHkgd2hpY2ggd2lsbCBoYW5kbGUgZGVsZWdhdGlvbiB0byB0aGUgd29ya2Vycy5cbiAgdGhpcy5hcGkgPSB3b3JrZXJwcm94eSh3b3JrZXJzKTtcblxuICB0aGlzLl9lbWl0dGluZyA9IHt9O1xuICB0aGlzLl9ibG9iQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvLyBUT0RPOiBNYWtlIGEgbW9yZSBnZW5lcmljIGNhY2hlP1xuICB0aGlzLl9mcmFtZXNDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHRoaXMuX2ltYWdlQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxudXRpbC5pbmhlcml0cyhBc3NldHNNYW5hZ2VyLCBFdmVudEVtaXR0ZXIpO1xuXG4vKipcbiAqIEluZGV4ZXMgYSBkaXJlY3RvcnkuIEFsbCBmaWxlcyBpbiB0aGUgZGlyZWN0b3J5IHdpbGwgYmUgcmVhY2hhYmxlIHRocm91Z2hcbiAqIHRoZSBhc3NldHMgZGF0YWJhc2UgYWZ0ZXIgdGhpcyBjb21wbGV0ZXMuIEFsbCAucGFrLy5tb2RwYWsgZmlsZXMgd2lsbCBhbHNvXG4gKiBiZSBsb2FkZWQgaW50byB0aGUgaW5kZXguXG4gKlxuICogVGhlIHZpcnR1YWwgcGF0aCBhcmd1bWVudCBpcyBhIHByZWZpeCBmb3IgdGhlIGVudHJpZXMgaW4gdGhlIGRpcmVjdG9yeS5cbiAqL1xuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuYWRkRGlyZWN0b3J5ID0gZnVuY3Rpb24gKHBhdGgsIGRpckVudHJ5LCBjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIHBlbmRpbmcgPSAxO1xuICB2YXIgZGVjcmVtZW50UGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBwZW5kaW5nLS07XG4gICAgaWYgKCFwZW5kaW5nKSB7XG4gICAgICBjYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHJlYWRlciA9IGRpckVudHJ5LmNyZWF0ZVJlYWRlcigpO1xuICB2YXIgbmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZWFkZXIucmVhZEVudHJpZXMoZnVuY3Rpb24gKGVudHJpZXMpIHtcbiAgICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhkZWNyZW1lbnRQZW5kaW5nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBlbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgIGlmIChlbnRyeS5uYW1lWzBdID09ICcuJykgcmV0dXJuO1xuXG4gICAgICAgIHZhciBlbnRyeVBhdGggPSBwYXRoICsgJy8nICsgZW50cnkubmFtZTtcblxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgICAgc2VsZi5hZGREaXJlY3RvcnkoZW50cnlQYXRoLCBlbnRyeSwgZGVjcmVtZW50UGVuZGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVuZGluZysrO1xuICAgICAgICAgIGVudHJ5LmZpbGUoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgIHNlbGYuYWRkRmlsZShlbnRyeVBhdGgsIGZpbGUsIGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICAgIH0sIGRlY3JlbWVudFBlbmRpbmcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5leHQoKTtcbiAgICB9KTtcbiAgfTtcbiAgbmV4dCgpO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuYWRkRmlsZSA9IGZ1bmN0aW9uIChwYXRoLCBmaWxlLCBjYWxsYmFjaykge1xuICAvLyBUT0RPOiBXaGF0IHRvIGRvIGFib3V0IHRoZSBjYWxsYmFjayBiZWluZyBjYWxsZWQgb25jZSBmb3IgZWFjaCB3b3JrZXI/XG4gIHRoaXMuYXBpLmFkZEZpbGUuYnJvYWRjYXN0KHBhdGgsIGZpbGUsIGNhbGxiYWNrKTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmFkZFJvb3QgPSBmdW5jdGlvbiAoZGlyRW50cnksIGNhbGxiYWNrKSB7XG4gIHRoaXMuYWRkRGlyZWN0b3J5KCcnLCBkaXJFbnRyeSwgY2FsbGJhY2spO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZW1pdE9uY2VQZXJUaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmICh0aGlzLl9lbWl0dGluZ1tldmVudF0pIHJldHVybjtcbiAgdGhpcy5fZW1pdHRpbmdbZXZlbnRdID0gdHJ1ZTtcblxuICB2YXIgc2VsZiA9IHRoaXMsIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLmVtaXQuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgZGVsZXRlIHNlbGYuX2VtaXR0aW5nW2V2ZW50XTtcbiAgfSk7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRCbG9iVVJMID0gZnVuY3Rpb24gKHBhdGgsIGNhbGxiYWNrKSB7XG4gIGlmIChwYXRoIGluIHRoaXMuX2Jsb2JDYWNoZSkge1xuICAgIGNhbGxiYWNrKG51bGwsIHRoaXMuX2Jsb2JDYWNoZVtwYXRoXSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmFwaS5nZXRCbG9iVVJMKHBhdGgsIGZ1bmN0aW9uIChlcnIsIHVybCkge1xuICAgIGlmICghZXJyKSBzZWxmLl9ibG9iQ2FjaGVbcGF0aF0gPSB1cmw7XG4gICAgY2FsbGJhY2soZXJyLCB1cmwpO1xuICB9KTtcbn07XG5cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldEZyYW1lcyA9IGZ1bmN0aW9uIChpbWFnZVBhdGgpIHtcbiAgdmFyIGRvdE9mZnNldCA9IGltYWdlUGF0aC5sYXN0SW5kZXhPZignLicpO1xuICB2YXIgcGF0aCA9IGltYWdlUGF0aC5zdWJzdHIoMCwgZG90T2Zmc2V0KSArICcuZnJhbWVzJztcblxuICBpZiAocGF0aCBpbiB0aGlzLl9mcmFtZXNDYWNoZSkgcmV0dXJuIHRoaXMuX2ZyYW1lc0NhY2hlW3BhdGhdO1xuICB0aGlzLl9mcmFtZXNDYWNoZVtwYXRoXSA9IG51bGw7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmFwaS5nZXRKU09OKHBhdGgsIGZ1bmN0aW9uIChlcnIsIGZyYW1lcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLl9mcmFtZXNDYWNoZVtwYXRoXSA9IGZyYW1lcztcbiAgfSk7XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGltYWdlIGZvciB0aGUgc3BlY2lmaWVkIHBhdGguIFRoaXMgZnVuY3Rpb24gaXMgc3luY2hyb25vdXMsIGJ1dCBtYXlcbiAqIGRlcGVuZCBvbiBhc3luY2hyb25vdXMgb3BlcmF0aW9ucy4gSWYgdGhlIGltYWdlIGlzIG5vdCBpbW1lZGlhdGVseSBhdmFpbGFibGVcbiAqIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gbnVsbC4gT25jZSBtb3JlIGltYWdlcyBhcmUgYXZhaWxhYmxlLCBhbiBcImltYWdlc1wiXG4gKiBldmVudCB3aWxsIGJlIGVtaXR0ZWQuXG4gKi9cbkFzc2V0c01hbmFnZXIucHJvdG90eXBlLmdldEltYWdlID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgLy8gRXhhbXBsZSBwYXRoOiBcIi9kaXJlY3RvcnkvaW1hZ2UucG5nP2h1ZXNoaWZ0PTYwP2ZhZGU9ZmZmZmZmPTAuMVwiXG4gIGlmIChwYXRoIGluIHRoaXMuX2ltYWdlQ2FjaGUpIHJldHVybiB0aGlzLl9pbWFnZUNhY2hlW3BhdGhdO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBFeHRyYWN0IGltYWdlIG9wZXJhdGlvbnMuXG4gIHZhciBvcHMgPSBwYXRoLnNwbGl0KCc/Jyk7XG4gIC8vIEdldCB0aGUgcGxhaW4gcGF0aCB0byB0aGUgaW1hZ2UgZmlsZS5cbiAgdmFyIGZpbGVQYXRoID0gb3BzLnNoaWZ0KCk7XG5cbiAgLy8gSWYgdGhlIGltYWdlIGlzIG5vdCBpbiB0aGUgY2FjaGUsIGxvYWQgaXQgYW5kIHRyaWdnZXIgYW4gXCJpbWFnZXNcIiBldmVudFxuICAvLyB3aGVuIGl0J3MgZG9uZS5cbiAgaWYgKCEoZmlsZVBhdGggaW4gdGhpcy5faW1hZ2VDYWNoZSkpIHtcbiAgICB0aGlzLl9pbWFnZUNhY2hlW2ZpbGVQYXRoXSA9IG51bGw7XG5cbiAgICB0aGlzLmdldEJsb2JVUkwoZmlsZVBhdGgsIGZ1bmN0aW9uIChlcnIsIHVybCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBsb2FkICVzICglcyknLCBmaWxlUGF0aCwgZXJyLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1hZ2Uuc3JjID0gdXJsO1xuICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLl9pbWFnZUNhY2hlW2ZpbGVQYXRoXSA9IGltYWdlO1xuICAgICAgICBzZWxmLmVtaXRPbmNlUGVyVGljaygnaW1hZ2VzJyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIGltYWdlID0gdGhpcy5faW1hZ2VDYWNoZVtmaWxlUGF0aF07XG4gIGlmICghaW1hZ2UpIHJldHVybiBudWxsO1xuXG4gIC8vIEFwcGx5IG9wZXJhdGlvbnMgKHN1Y2ggYXMgaHVlIHNoaWZ0KSBvbiB0aGUgaW1hZ2UuXG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG5cbiAgLy8gUGFyc2UgYWxsIHRoZSBvcGVyYXRpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGltYWdlLlxuICAvLyBUT0RPOiBhZGRtYXNrLCBicmlnaHRuZXNzLCBmYWRlLCByZXBsYWNlLCBzYXR1cmF0aW9uXG4gIHZhciBodWUgPSAwLCBmbGlwRXZlcnlYID0gMCwgcmVwbGFjZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgb3AgPSBvcHNbaV0uc3BsaXQoL1s9O10vKTtcbiAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAvLyBUaGlzIG9wZXJhdGlvbiBkb2Vzbid0IGV4aXN0IGluIFN0YXJib3VuZCwgYnV0IGlzIGhlbHBmdWwgZm9yIHVzLlxuICAgICAgY2FzZSAnZmxpcGdyaWR4JzpcbiAgICAgICAgZmxpcEV2ZXJ5WCA9IHBhcnNlSW50KG9wWzFdKTtcbiAgICAgICAgaWYgKGltYWdlLndpZHRoICUgZmxpcEV2ZXJ5WCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihpbWFnZS53aWR0aCArICcgbm90IGRpdmlzaWJsZSBieSAnICsgZmxpcEV2ZXJ5WCArICcgKCcgKyBwYXRoICsgJyknKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2h1ZXNoaWZ0JzpcbiAgICAgICAgaHVlID0gcGFyc2VGbG9hdChvcFsxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmVwbGFjZSc6XG4gICAgICAgIGlmICghcmVwbGFjZSkgcmVwbGFjZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG9wLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgdmFyIGZyb20gPSBbXG4gICAgICAgICAgICBwYXJzZUludChvcFtpXS5zdWJzdHIoMCwgMiksIDE2KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG9wW2ldLnN1YnN0cigyLCAyKSwgMTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQob3BbaV0uc3Vic3RyKDQsIDIpLCAxNilcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgdmFyIHRvID0gW1xuICAgICAgICAgICAgcGFyc2VJbnQob3BbaSArIDFdLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQob3BbaSArIDFdLnN1YnN0cigyLCAyKSwgMTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQob3BbaSArIDFdLnN1YnN0cig0LCAyKSwgMTYpXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHJlcGxhY2VbZnJvbV0gPSB0bztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybignVW5zdXBwb3J0ZWQgaW1hZ2Ugb3BlcmF0aW9uOicsIG9wKTtcbiAgICB9XG4gIH1cblxuICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIGlmIChmbGlwRXZlcnlYKSB7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5zY2FsZSgtMSwgMSk7XG4gICAgZm9yICh2YXIgeCA9IDA7IHggKyBmbGlwRXZlcnlYIDw9IGltYWdlLndpZHRoOyB4ICs9IGZsaXBFdmVyeVgpIHtcbiAgICAgIHZhciBmbGlwcGVkWCA9IC0oeCArIGZsaXBFdmVyeVgpLCBkdyA9IGZsaXBFdmVyeVgsIGRoID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIHgsIDAsIGR3LCBkaCwgZmxpcHBlZFgsIDAsIGR3LCBkaCk7XG4gICAgfVxuICAgIGNvbnRleHQucmVzdG9yZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcbiAgfVxuXG4gIGlmIChodWUgfHwgcmVwbGFjZSkge1xuICAgIHZhciBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KSxcbiAgICAgICAgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgaWYgKHJlcGxhY2UpIHtcbiAgICAgICAgdmFyIGNvbG9yID0gcmVwbGFjZVtkYXRhW2ldICsgJywnICsgZGF0YVtpICsgMV0gKyAnLCcgKyBkYXRhW2kgKyAyXV07XG4gICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgIGRhdGFbaV0gPSBjb2xvclswXTtcbiAgICAgICAgICBkYXRhW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgICAgIGRhdGFbaSArIDJdID0gY29sb3JbMl07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGh1ZSkge1xuICAgICAgICBoc3YgPSBjb252ZXJ0LnJnYjJoc3YoZGF0YVtpXSwgZGF0YVtpICsgMV0sIGRhdGFbaSArIDJdKTtcblxuICAgICAgICBoc3ZbMF0gKz0gaHVlO1xuICAgICAgICBpZiAoaHN2WzBdIDwgMCkgaHN2WzBdICs9IDM2MFxuICAgICAgICBlbHNlIGlmIChoc3ZbMF0gPj0gMzYwKSBoc3ZbMF0gLT0gMzYwO1xuXG4gICAgICAgIHJnYiA9IGNvbnZlcnQuaHN2MnJnYihoc3YpO1xuXG4gICAgICAgIGRhdGFbaV0gPSByZ2JbMF07XG4gICAgICAgIGRhdGFbaSArIDFdID0gcmdiWzFdO1xuICAgICAgICBkYXRhW2kgKyAyXSA9IHJnYlsyXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgfVxuXG4gIHNlbGYuX2ltYWdlQ2FjaGVbcGF0aF0gPSBudWxsO1xuXG4gIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgZm9yIHRoZSBtb2RpZmllZCBpbWFnZSBhbmQgY2FjaGUgaXQuXG4gIGltYWdlID0gbmV3IEltYWdlKCk7XG4gIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9pbWFnZUNhY2hlW3BhdGhdID0gaW1hZ2U7XG4gICAgc2VsZi5lbWl0T25jZVBlclRpY2soJ2ltYWdlcycpO1xuICB9O1xuICBpbWFnZS5zcmMgPSBjYW52YXMudG9EYXRhVVJMKCk7XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRSZXNvdXJjZUxvYWRlciA9IGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgcmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcih0aGlzLCBleHRlbnNpb24pO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUuZ2V0UmVzb3VyY2VQYXRoID0gZnVuY3Rpb24gKHJlc291cmNlLCBwYXRoKSB7XG4gIGlmIChwYXRoWzBdID09ICcvJykgcmV0dXJuIHBhdGg7XG4gIHZhciBiYXNlID0gcmVzb3VyY2UuX19wYXRoX187XG4gIHJldHVybiBiYXNlLnN1YnN0cigwLCBiYXNlLmxhc3RJbmRleE9mKCcvJykgKyAxKSArIHBhdGg7XG59O1xuXG5Bc3NldHNNYW5hZ2VyLnByb3RvdHlwZS5nZXRUaWxlSW1hZ2UgPSBmdW5jdGlvbiAocmVzb3VyY2UsIGZpZWxkLCBvcHRfaHVlU2hpZnQpIHtcbiAgaWYgKCEoZmllbGQgaW4gcmVzb3VyY2UpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGaWVsZCBcIicgKyBmaWVsZCArICdcIiBub3QgaW4gcmVzb3VyY2U6ICcgKyBKU09OLnN0cmluZ2lmeShyZXNvdXJjZSkpO1xuICB9XG5cbiAgcGF0aCA9IHRoaXMuZ2V0UmVzb3VyY2VQYXRoKHJlc291cmNlLCByZXNvdXJjZVtmaWVsZF0pO1xuXG4gIC8vIEFkZCBodWVzaGlmdCBpbWFnZSBvcGVyYXRpb24gaWYgbmVlZGVkLlxuICBpZiAob3B0X2h1ZVNoaWZ0KSB7XG4gICAgcGF0aCArPSAnP2h1ZXNoaWZ0PScgKyAob3B0X2h1ZVNoaWZ0IC8gMjU1ICogMzYwKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmdldEltYWdlKHBhdGgpO1xufTtcblxuQXNzZXRzTWFuYWdlci5wcm90b3R5cGUubG9hZFJlc291cmNlcyA9IGZ1bmN0aW9uIChleHRlbnNpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5hcGkubG9hZFJlc291cmNlcyhleHRlbnNpb24sIGZ1bmN0aW9uIChlcnIsIHJlc291cmNlcykge1xuICAgIGNhbGxiYWNrKGVyciwgcmVzb3VyY2VzKTtcbiAgICBpZiAoIWVycikge1xuICAgICAgc2VsZi5lbWl0T25jZVBlclRpY2soJ3Jlc291cmNlcycpO1xuICAgIH1cbiAgfSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZUxvYWRlcjtcblxuXG5mdW5jdGlvbiBSZXNvdXJjZUxvYWRlcihhc3NldHNNYW5hZ2VyLCBleHRlbnNpb24pIHtcbiAgdGhpcy5hc3NldHMgPSBhc3NldHNNYW5hZ2VyO1xuICB0aGlzLmV4dGVuc2lvbiA9IGV4dGVuc2lvbjtcblxuICB0aGlzLmluZGV4ID0gbnVsbDtcblxuICB0aGlzLl9sb2FkaW5nSW5kZXggPSBmYWxzZTtcbn1cblxuUmVzb3VyY2VMb2FkZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChpZCkge1xuICBpZiAoIXRoaXMuaW5kZXgpIHJldHVybiBudWxsO1xuICByZXR1cm4gdGhpcy5pbmRleFtpZF0gfHwgbnVsbDtcbn07XG5cblJlc291cmNlTG9hZGVyLnByb3RvdHlwZS5sb2FkSW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9sb2FkaW5nSW5kZXgpIHJldHVybjtcbiAgdGhpcy5fbG9hZGluZ0luZGV4ID0gdHJ1ZTtcblxuICAvLyBUT0RPOiBGYXQgYXJyb3dzLlxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuYXNzZXRzLmxvYWRSZXNvdXJjZXModGhpcy5leHRlbnNpb24sIGZ1bmN0aW9uIChlcnIsIGluZGV4KSB7XG4gICAgc2VsZi5fbG9hZGluZ0luZGV4ID0gZmFsc2U7XG4gICAgc2VsZi5pbmRleCA9IGluZGV4O1xuICB9KTtcbn07XG4iLCIvKiBNSVQgbGljZW5zZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmdiMmhzbDogcmdiMmhzbCxcbiAgcmdiMmhzdjogcmdiMmhzdixcbiAgcmdiMmNteWs6IHJnYjJjbXlrLFxuICByZ2Iya2V5d29yZDogcmdiMmtleXdvcmQsXG4gIHJnYjJ4eXo6IHJnYjJ4eXosXG4gIHJnYjJsYWI6IHJnYjJsYWIsXG5cbiAgaHNsMnJnYjogaHNsMnJnYixcbiAgaHNsMmhzdjogaHNsMmhzdixcbiAgaHNsMmNteWs6IGhzbDJjbXlrLFxuICBoc2wya2V5d29yZDogaHNsMmtleXdvcmQsXG5cbiAgaHN2MnJnYjogaHN2MnJnYixcbiAgaHN2MmhzbDogaHN2MmhzbCxcbiAgaHN2MmNteWs6IGhzdjJjbXlrLFxuICBoc3Yya2V5d29yZDogaHN2MmtleXdvcmQsXG5cbiAgY215azJyZ2I6IGNteWsycmdiLFxuICBjbXlrMmhzbDogY215azJoc2wsXG4gIGNteWsyaHN2OiBjbXlrMmhzdixcbiAgY215azJrZXl3b3JkOiBjbXlrMmtleXdvcmQsXG4gIFxuICBrZXl3b3JkMnJnYjoga2V5d29yZDJyZ2IsXG4gIGtleXdvcmQyaHNsOiBrZXl3b3JkMmhzbCxcbiAga2V5d29yZDJoc3Y6IGtleXdvcmQyaHN2LFxuICBrZXl3b3JkMmNteWs6IGtleXdvcmQyY215ayxcbiAga2V5d29yZDJsYWI6IGtleXdvcmQybGFiLFxuICBrZXl3b3JkMnh5ejoga2V5d29yZDJ4eXosXG4gIFxuICB4eXoycmdiOiB4eXoycmdiLFxuICB4eXoybGFiOiB4eXoybGFiLFxuICBcbiAgbGFiMnh5ejogbGFiMnh5eixcbn1cblxuXG5mdW5jdGlvbiByZ2IyaHNsKHJnYikge1xuICB2YXIgciA9IHJnYlswXS8yNTUsXG4gICAgICBnID0gcmdiWzFdLzI1NSxcbiAgICAgIGIgPSByZ2JbMl0vMjU1LFxuICAgICAgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICBtYXggPSBNYXRoLm1heChyLCBnLCBiKSxcbiAgICAgIGRlbHRhID0gbWF4IC0gbWluLFxuICAgICAgaCwgcywgbDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpIFxuICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChnID09IG1heClcbiAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTsgXG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKS8gZGVsdGE7XG5cbiAgaCA9IE1hdGgubWluKGggKiA2MCwgMzYwKTtcblxuICBpZiAoaCA8IDApXG4gICAgaCArPSAzNjA7XG5cbiAgbCA9IChtaW4gKyBtYXgpIC8gMjtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBzID0gMDtcbiAgZWxzZSBpZiAobCA8PSAwLjUpXG4gICAgcyA9IGRlbHRhIC8gKG1heCArIG1pbik7XG4gIGVsc2VcbiAgICBzID0gZGVsdGEgLyAoMiAtIG1heCAtIG1pbik7XG5cbiAgcmV0dXJuIFtoLCBzICogMTAwLCBsICogMTAwXTtcbn1cblxuZnVuY3Rpb24gcmdiMmhzdihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0sXG4gICAgICBnID0gcmdiWzFdLFxuICAgICAgYiA9IHJnYlsyXSxcbiAgICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpLFxuICAgICAgbWF4ID0gTWF0aC5tYXgociwgZywgYiksXG4gICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgIGgsIHMsIHY7XG5cbiAgaWYgKG1heCA9PSAwKVxuICAgIHMgPSAwO1xuICBlbHNlXG4gICAgcyA9IChkZWx0YS9tYXggKiAxMDAwKS8xMDtcblxuICBpZiAobWF4ID09IG1pbilcbiAgICBoID0gMDtcbiAgZWxzZSBpZiAociA9PSBtYXgpIFxuICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7IFxuICBlbHNlIGlmIChnID09IG1heClcbiAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTsgXG4gIGVsc2UgaWYgKGIgPT0gbWF4KVxuICAgIGggPSA0ICsgKHIgLSBnKSAvIGRlbHRhO1xuXG4gIGggPSBNYXRoLm1pbihoICogNjAsIDM2MCk7XG5cbiAgaWYgKGggPCAwKSBcbiAgICBoICs9IDM2MDtcblxuICB2ID0gKChtYXggLyAyNTUpICogMTAwMCkgLyAxMDtcblxuICByZXR1cm4gW2gsIHMsIHZdO1xufVxuXG5mdW5jdGlvbiByZ2IyY215ayhyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NSxcbiAgICAgIGMsIG0sIHksIGs7XG4gICAgICBcbiAgayA9IE1hdGgubWluKDEgLSByLCAxIC0gZywgMSAtIGIpO1xuICBjID0gKDEgLSByIC0gaykgLyAoMSAtIGspO1xuICBtID0gKDEgLSBnIC0gaykgLyAoMSAtIGspO1xuICB5ID0gKDEgLSBiIC0gaykgLyAoMSAtIGspO1xuICByZXR1cm4gW2MgKiAxMDAsIG0gKiAxMDAsIHkgKiAxMDAsIGsgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiByZ2Iya2V5d29yZChyZ2IpIHtcbiAgcmV0dXJuIHJldmVyc2VLZXl3b3Jkc1tKU09OLnN0cmluZ2lmeShyZ2IpXTtcbn1cblxuZnVuY3Rpb24gcmdiMnh5eihyZ2IpIHtcbiAgdmFyIHIgPSByZ2JbMF0gLyAyNTUsXG4gICAgICBnID0gcmdiWzFdIC8gMjU1LFxuICAgICAgYiA9IHJnYlsyXSAvIDI1NTtcblxuICAvLyBhc3N1bWUgc1JHQlxuICByID0gciA+IDAuMDQwNDUgPyBNYXRoLnBvdygoKHIgKyAwLjA1NSkgLyAxLjA1NSksIDIuNCkgOiAociAvIDEyLjkyKTtcbiAgZyA9IGcgPiAwLjA0MDQ1ID8gTWF0aC5wb3coKChnICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpIDogKGcgLyAxMi45Mik7XG4gIGIgPSBiID4gMC4wNDA0NSA/IE1hdGgucG93KCgoYiArIDAuMDU1KSAvIDEuMDU1KSwgMi40KSA6IChiIC8gMTIuOTIpO1xuICBcbiAgdmFyIHggPSAociAqIDAuNDEyNCkgKyAoZyAqIDAuMzU3NikgKyAoYiAqIDAuMTgwNSk7XG4gIHZhciB5ID0gKHIgKiAwLjIxMjYpICsgKGcgKiAwLjcxNTIpICsgKGIgKiAwLjA3MjIpO1xuICB2YXIgeiA9IChyICogMC4wMTkzKSArIChnICogMC4xMTkyKSArIChiICogMC45NTA1KTtcblxuICByZXR1cm4gW3ggKiAxMDAsIHkgKjEwMCwgeiAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIHJnYjJsYWIocmdiKSB7XG4gIHZhciB4eXogPSByZ2IyeHl6KHJnYiksXG4gICAgICAgIHggPSB4eXpbMF0sXG4gICAgICAgIHkgPSB4eXpbMV0sXG4gICAgICAgIHogPSB4eXpbMl0sXG4gICAgICAgIGwsIGEsIGI7XG5cbiAgeCAvPSA5NS4wNDc7XG4gIHkgLz0gMTAwO1xuICB6IC89IDEwOC44ODM7XG5cbiAgeCA9IHggPiAwLjAwODg1NiA/IE1hdGgucG93KHgsIDEvMykgOiAoNy43ODcgKiB4KSArICgxNiAvIDExNik7XG4gIHkgPSB5ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh5LCAxLzMpIDogKDcuNzg3ICogeSkgKyAoMTYgLyAxMTYpO1xuICB6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMS8zKSA6ICg3Ljc4NyAqIHopICsgKDE2IC8gMTE2KTtcblxuICBsID0gKDExNiAqIHkpIC0gMTY7XG4gIGEgPSA1MDAgKiAoeCAtIHkpO1xuICBiID0gMjAwICogKHkgLSB6KTtcbiAgXG4gIHJldHVybiBbbCwgYSwgYl07XG59XG5cblxuZnVuY3Rpb24gaHNsMnJnYihoc2wpIHtcbiAgdmFyIGggPSBoc2xbMF0gLyAzNjAsXG4gICAgICBzID0gaHNsWzFdIC8gMTAwLFxuICAgICAgbCA9IGhzbFsyXSAvIDEwMCxcbiAgICAgIHQxLCB0MiwgdDMsIHJnYiwgdmFsO1xuXG4gIGlmIChzID09IDApIHtcbiAgICB2YWwgPSBsICogMjU1O1xuICAgIHJldHVybiBbdmFsLCB2YWwsIHZhbF07XG4gIH1cblxuICBpZiAobCA8IDAuNSlcbiAgICB0MiA9IGwgKiAoMSArIHMpO1xuICBlbHNlXG4gICAgdDIgPSBsICsgcyAtIGwgKiBzO1xuICB0MSA9IDIgKiBsIC0gdDI7XG5cbiAgcmdiID0gWzAsIDAsIDBdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIHQzID0gaCArIDEgLyAzICogLSAoaSAtIDEpO1xuICAgIHQzIDwgMCAmJiB0MysrO1xuICAgIHQzID4gMSAmJiB0My0tO1xuXG4gICAgaWYgKDYgKiB0MyA8IDEpXG4gICAgICB2YWwgPSB0MSArICh0MiAtIHQxKSAqIDYgKiB0MztcbiAgICBlbHNlIGlmICgyICogdDMgPCAxKVxuICAgICAgdmFsID0gdDI7XG4gICAgZWxzZSBpZiAoMyAqIHQzIDwgMilcbiAgICAgIHZhbCA9IHQxICsgKHQyIC0gdDEpICogKDIgLyAzIC0gdDMpICogNjtcbiAgICBlbHNlXG4gICAgICB2YWwgPSB0MTtcblxuICAgIHJnYltpXSA9IHZhbCAqIDI1NTtcbiAgfVxuICBcbiAgcmV0dXJuIHJnYjtcbn1cblxuZnVuY3Rpb24gaHNsMmhzdihoc2wpIHtcbiAgdmFyIGggPSBoc2xbMF0sXG4gICAgICBzID0gaHNsWzFdIC8gMTAwLFxuICAgICAgbCA9IGhzbFsyXSAvIDEwMCxcbiAgICAgIHN2LCB2O1xuICBsICo9IDI7XG4gIHMgKj0gKGwgPD0gMSkgPyBsIDogMiAtIGw7XG4gIHYgPSAobCArIHMpIC8gMjtcbiAgc3YgPSAoMiAqIHMpIC8gKGwgKyBzKTtcbiAgcmV0dXJuIFtoLCBzdiAqIDEwMCwgdiAqIDEwMF07XG59XG5cbmZ1bmN0aW9uIGhzbDJjbXlrKGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJjbXlrKGhzbDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBoc2wya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChoc2wycmdiKGFyZ3MpKTtcbn1cblxuXG5mdW5jdGlvbiBoc3YycmdiKGhzdikge1xuICB2YXIgaCA9IGhzdlswXSAvIDYwLFxuICAgICAgcyA9IGhzdlsxXSAvIDEwMCxcbiAgICAgIHYgPSBoc3ZbMl0gLyAxMDAsXG4gICAgICBoaSA9IE1hdGguZmxvb3IoaCkgJSA2O1xuXG4gIHZhciBmID0gaCAtIE1hdGguZmxvb3IoaCksXG4gICAgICBwID0gMjU1ICogdiAqICgxIC0gcyksXG4gICAgICBxID0gMjU1ICogdiAqICgxIC0gKHMgKiBmKSksXG4gICAgICB0ID0gMjU1ICogdiAqICgxIC0gKHMgKiAoMSAtIGYpKSksXG4gICAgICB2ID0gMjU1ICogdjtcblxuICBzd2l0Y2goaGkpIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gW3YsIHQsIHBdO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBbcSwgdiwgcF07XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIFtwLCB2LCB0XTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gW3AsIHEsIHZdO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBbdCwgcCwgdl07XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIFt2LCBwLCBxXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoc3YyaHNsKGhzdikge1xuICB2YXIgaCA9IGhzdlswXSxcbiAgICAgIHMgPSBoc3ZbMV0gLyAxMDAsXG4gICAgICB2ID0gaHN2WzJdIC8gMTAwLFxuICAgICAgc2wsIGw7XG5cbiAgbCA9ICgyIC0gcykgKiB2OyAgXG4gIHNsID0gcyAqIHY7XG4gIHNsIC89IChsIDw9IDEpID8gbCA6IDIgLSBsO1xuICBsIC89IDI7XG4gIHJldHVybiBbaCwgc2wgKiAxMDAsIGwgKiAxMDBdO1xufVxuXG5mdW5jdGlvbiBoc3YyY215ayhhcmdzKSB7XG4gIHJldHVybiByZ2IyY215ayhoc3YycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gaHN2MmtleXdvcmQoYXJncykge1xuICByZXR1cm4gcmdiMmtleXdvcmQoaHN2MnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsycmdiKGNteWspIHtcbiAgdmFyIGMgPSBjbXlrWzBdIC8gMTAwLFxuICAgICAgbSA9IGNteWtbMV0gLyAxMDAsXG4gICAgICB5ID0gY215a1syXSAvIDEwMCxcbiAgICAgIGsgPSBjbXlrWzNdIC8gMTAwLFxuICAgICAgciwgZywgYjtcblxuICByID0gMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgayk7XG4gIGcgPSAxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKTtcbiAgYiA9IDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspO1xuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufVxuXG5mdW5jdGlvbiBjbXlrMmhzbChhcmdzKSB7XG4gIHJldHVybiByZ2IyaHNsKGNteWsycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24gY215azJoc3YoYXJncykge1xuICByZXR1cm4gcmdiMmhzdihjbXlrMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNteWsya2V5d29yZChhcmdzKSB7XG4gIHJldHVybiByZ2Iya2V5d29yZChjbXlrMnJnYihhcmdzKSk7XG59XG5cblxuZnVuY3Rpb24geHl6MnJnYih4eXopIHtcbiAgdmFyIHggPSB4eXpbMF0gLyAxMDAsXG4gICAgICB5ID0geHl6WzFdIC8gMTAwLFxuICAgICAgeiA9IHh5elsyXSAvIDEwMCxcbiAgICAgIHIsIGcsIGI7XG5cbiAgciA9ICh4ICogMy4yNDA2KSArICh5ICogLTEuNTM3MikgKyAoeiAqIC0wLjQ5ODYpO1xuICBnID0gKHggKiAtMC45Njg5KSArICh5ICogMS44NzU4KSArICh6ICogMC4wNDE1KTtcbiAgYiA9ICh4ICogMC4wNTU3KSArICh5ICogLTAuMjA0MCkgKyAoeiAqIDEuMDU3MCk7XG5cbiAgLy8gYXNzdW1lIHNSR0JcbiAgciA9IHIgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3cociwgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IHIgPSAociAqIDEyLjkyKTtcblxuICBnID0gZyA+IDAuMDAzMTMwOCA/ICgoMS4wNTUgKiBNYXRoLnBvdyhnLCAxLjAgLyAyLjQpKSAtIDAuMDU1KVxuICAgIDogZyA9IChnICogMTIuOTIpO1xuICAgICAgICBcbiAgYiA9IGIgPiAwLjAwMzEzMDggPyAoKDEuMDU1ICogTWF0aC5wb3coYiwgMS4wIC8gMi40KSkgLSAwLjA1NSlcbiAgICA6IGIgPSAoYiAqIDEyLjkyKTtcblxuICByID0gKHIgPCAwKSA/IDAgOiByO1xuICBnID0gKGcgPCAwKSA/IDAgOiBnO1xuICBiID0gKGIgPCAwKSA/IDAgOiBiO1xuXG4gIHJldHVybiBbciAqIDI1NSwgZyAqIDI1NSwgYiAqIDI1NV07XG59XG5cbmZ1bmN0aW9uIHh5ejJsYWIoeHl6KSB7XG4gIHZhciB4ID0geHl6WzBdLFxuICAgICAgeSA9IHh5elsxXSxcbiAgICAgIHogPSB4eXpbMl0sXG4gICAgICBsLCBhLCBiO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxLzMpIDogKDcuNzg3ICogeCkgKyAoMTYgLyAxMTYpO1xuICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMS8zKSA6ICg3Ljc4NyAqIHkpICsgKDE2IC8gMTE2KTtcbiAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEvMykgOiAoNy43ODcgKiB6KSArICgxNiAvIDExNik7XG5cbiAgbCA9ICgxMTYgKiB5KSAtIDE2O1xuICBhID0gNTAwICogKHggLSB5KTtcbiAgYiA9IDIwMCAqICh5IC0geik7XG4gIFxuICByZXR1cm4gW2wsIGEsIGJdO1xufVxuXG5mdW5jdGlvbiBsYWIyeHl6KGxhYikge1xuICB2YXIgbCA9IGxhYlswXSxcbiAgICAgIGEgPSBsYWJbMV0sXG4gICAgICBiID0gbGFiWzJdLFxuICAgICAgeCwgeSwgeiwgeTI7XG5cbiAgaWYgKGwgPD0gOCkge1xuICAgIHkgPSAobCAqIDEwMCkgLyA5MDMuMztcbiAgICB5MiA9ICg3Ljc4NyAqICh5IC8gMTAwKSkgKyAoMTYgLyAxMTYpO1xuICB9IGVsc2Uge1xuICAgIHkgPSAxMDAgKiBNYXRoLnBvdygobCArIDE2KSAvIDExNiwgMyk7XG4gICAgeTIgPSBNYXRoLnBvdyh5IC8gMTAwLCAxLzMpO1xuICB9XG5cbiAgeCA9IHggLyA5NS4wNDcgPD0gMC4wMDg4NTYgPyB4ID0gKDk1LjA0NyAqICgoYSAvIDUwMCkgKyB5MiAtICgxNiAvIDExNikpKSAvIDcuNzg3IDogOTUuMDQ3ICogTWF0aC5wb3coKGEgLyA1MDApICsgeTIsIDMpO1xuXG4gIHogPSB6IC8gMTA4Ljg4MyA8PSAwLjAwODg1OSA/IHogPSAoMTA4Ljg4MyAqICh5MiAtIChiIC8gMjAwKSAtICgxNiAvIDExNikpKSAvIDcuNzg3IDogMTA4Ljg4MyAqIE1hdGgucG93KHkyIC0gKGIgLyAyMDApLCAzKTtcblxuICByZXR1cm4gW3gsIHksIHpdO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMnJnYihrZXl3b3JkKSB7XG4gIHJldHVybiBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJoc2woYXJncykge1xuICByZXR1cm4gcmdiMmhzbChrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGtleXdvcmQyaHN2KGFyZ3MpIHtcbiAgcmV0dXJuIHJnYjJoc3Yoa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmNteWsoYXJncykge1xuICByZXR1cm4gcmdiMmNteWsoa2V5d29yZDJyZ2IoYXJncykpO1xufVxuXG5mdW5jdGlvbiBrZXl3b3JkMmxhYihhcmdzKSB7XG4gIHJldHVybiByZ2IybGFiKGtleXdvcmQycmdiKGFyZ3MpKTtcbn1cblxuZnVuY3Rpb24ga2V5d29yZDJ4eXooYXJncykge1xuICByZXR1cm4gcmdiMnh5eihrZXl3b3JkMnJnYihhcmdzKSk7XG59XG5cbnZhciBjc3NLZXl3b3JkcyA9IHtcbiAgYWxpY2VibHVlOiAgWzI0MCwyNDgsMjU1XSxcbiAgYW50aXF1ZXdoaXRlOiBbMjUwLDIzNSwyMTVdLFxuICBhcXVhOiBbMCwyNTUsMjU1XSxcbiAgYXF1YW1hcmluZTogWzEyNywyNTUsMjEyXSxcbiAgYXp1cmU6ICBbMjQwLDI1NSwyNTVdLFxuICBiZWlnZTogIFsyNDUsMjQ1LDIyMF0sXG4gIGJpc3F1ZTogWzI1NSwyMjgsMTk2XSxcbiAgYmxhY2s6ICBbMCwwLDBdLFxuICBibGFuY2hlZGFsbW9uZDogWzI1NSwyMzUsMjA1XSxcbiAgYmx1ZTogWzAsMCwyNTVdLFxuICBibHVldmlvbGV0OiBbMTM4LDQzLDIyNl0sXG4gIGJyb3duOiAgWzE2NSw0Miw0Ml0sXG4gIGJ1cmx5d29vZDogIFsyMjIsMTg0LDEzNV0sXG4gIGNhZGV0Ymx1ZTogIFs5NSwxNTgsMTYwXSxcbiAgY2hhcnRyZXVzZTogWzEyNywyNTUsMF0sXG4gIGNob2NvbGF0ZTogIFsyMTAsMTA1LDMwXSxcbiAgY29yYWw6ICBbMjU1LDEyNyw4MF0sXG4gIGNvcm5mbG93ZXJibHVlOiBbMTAwLDE0OSwyMzddLFxuICBjb3Juc2lsazogWzI1NSwyNDgsMjIwXSxcbiAgY3JpbXNvbjogIFsyMjAsMjAsNjBdLFxuICBjeWFuOiBbMCwyNTUsMjU1XSxcbiAgZGFya2JsdWU6IFswLDAsMTM5XSxcbiAgZGFya2N5YW46IFswLDEzOSwxMzldLFxuICBkYXJrZ29sZGVucm9kOiAgWzE4NCwxMzQsMTFdLFxuICBkYXJrZ3JheTogWzE2OSwxNjksMTY5XSxcbiAgZGFya2dyZWVuOiAgWzAsMTAwLDBdLFxuICBkYXJrZ3JleTogWzE2OSwxNjksMTY5XSxcbiAgZGFya2toYWtpOiAgWzE4OSwxODMsMTA3XSxcbiAgZGFya21hZ2VudGE6ICBbMTM5LDAsMTM5XSxcbiAgZGFya29saXZlZ3JlZW46IFs4NSwxMDcsNDddLFxuICBkYXJrb3JhbmdlOiBbMjU1LDE0MCwwXSxcbiAgZGFya29yY2hpZDogWzE1Myw1MCwyMDRdLFxuICBkYXJrcmVkOiAgWzEzOSwwLDBdLFxuICBkYXJrc2FsbW9uOiBbMjMzLDE1MCwxMjJdLFxuICBkYXJrc2VhZ3JlZW46IFsxNDMsMTg4LDE0M10sXG4gIGRhcmtzbGF0ZWJsdWU6ICBbNzIsNjEsMTM5XSxcbiAgZGFya3NsYXRlZ3JheTogIFs0Nyw3OSw3OV0sXG4gIGRhcmtzbGF0ZWdyZXk6ICBbNDcsNzksNzldLFxuICBkYXJrdHVycXVvaXNlOiAgWzAsMjA2LDIwOV0sXG4gIGRhcmt2aW9sZXQ6IFsxNDgsMCwyMTFdLFxuICBkZWVwcGluazogWzI1NSwyMCwxNDddLFxuICBkZWVwc2t5Ymx1ZTogIFswLDE5MSwyNTVdLFxuICBkaW1ncmF5OiAgWzEwNSwxMDUsMTA1XSxcbiAgZGltZ3JleTogIFsxMDUsMTA1LDEwNV0sXG4gIGRvZGdlcmJsdWU6IFszMCwxNDQsMjU1XSxcbiAgZmlyZWJyaWNrOiAgWzE3OCwzNCwzNF0sXG4gIGZsb3JhbHdoaXRlOiAgWzI1NSwyNTAsMjQwXSxcbiAgZm9yZXN0Z3JlZW46ICBbMzQsMTM5LDM0XSxcbiAgZnVjaHNpYTogIFsyNTUsMCwyNTVdLFxuICBnYWluc2Jvcm86ICBbMjIwLDIyMCwyMjBdLFxuICBnaG9zdHdoaXRlOiBbMjQ4LDI0OCwyNTVdLFxuICBnb2xkOiBbMjU1LDIxNSwwXSxcbiAgZ29sZGVucm9kOiAgWzIxOCwxNjUsMzJdLFxuICBncmF5OiBbMTI4LDEyOCwxMjhdLFxuICBncmVlbjogIFswLDEyOCwwXSxcbiAgZ3JlZW55ZWxsb3c6ICBbMTczLDI1NSw0N10sXG4gIGdyZXk6IFsxMjgsMTI4LDEyOF0sXG4gIGhvbmV5ZGV3OiBbMjQwLDI1NSwyNDBdLFxuICBob3RwaW5rOiAgWzI1NSwxMDUsMTgwXSxcbiAgaW5kaWFucmVkOiAgWzIwNSw5Miw5Ml0sXG4gIGluZGlnbzogWzc1LDAsMTMwXSxcbiAgaXZvcnk6ICBbMjU1LDI1NSwyNDBdLFxuICBraGFraTogIFsyNDAsMjMwLDE0MF0sXG4gIGxhdmVuZGVyOiBbMjMwLDIzMCwyNTBdLFxuICBsYXZlbmRlcmJsdXNoOiAgWzI1NSwyNDAsMjQ1XSxcbiAgbGF3bmdyZWVuOiAgWzEyNCwyNTIsMF0sXG4gIGxlbW9uY2hpZmZvbjogWzI1NSwyNTAsMjA1XSxcbiAgbGlnaHRibHVlOiAgWzE3MywyMTYsMjMwXSxcbiAgbGlnaHRjb3JhbDogWzI0MCwxMjgsMTI4XSxcbiAgbGlnaHRjeWFuOiAgWzIyNCwyNTUsMjU1XSxcbiAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IFsyNTAsMjUwLDIxMF0sXG4gIGxpZ2h0Z3JheTogIFsyMTEsMjExLDIxMV0sXG4gIGxpZ2h0Z3JlZW46IFsxNDQsMjM4LDE0NF0sXG4gIGxpZ2h0Z3JleTogIFsyMTEsMjExLDIxMV0sXG4gIGxpZ2h0cGluazogIFsyNTUsMTgyLDE5M10sXG4gIGxpZ2h0c2FsbW9uOiAgWzI1NSwxNjAsMTIyXSxcbiAgbGlnaHRzZWFncmVlbjogIFszMiwxNzgsMTcwXSxcbiAgbGlnaHRza3libHVlOiBbMTM1LDIwNiwyNTBdLFxuICBsaWdodHNsYXRlZ3JheTogWzExOSwxMzYsMTUzXSxcbiAgbGlnaHRzbGF0ZWdyZXk6IFsxMTksMTM2LDE1M10sXG4gIGxpZ2h0c3RlZWxibHVlOiBbMTc2LDE5NiwyMjJdLFxuICBsaWdodHllbGxvdzogIFsyNTUsMjU1LDIyNF0sXG4gIGxpbWU6IFswLDI1NSwwXSxcbiAgbGltZWdyZWVuOiAgWzUwLDIwNSw1MF0sXG4gIGxpbmVuOiAgWzI1MCwyNDAsMjMwXSxcbiAgbWFnZW50YTogIFsyNTUsMCwyNTVdLFxuICBtYXJvb246IFsxMjgsMCwwXSxcbiAgbWVkaXVtYXF1YW1hcmluZTogWzEwMiwyMDUsMTcwXSxcbiAgbWVkaXVtYmx1ZTogWzAsMCwyMDVdLFxuICBtZWRpdW1vcmNoaWQ6IFsxODYsODUsMjExXSxcbiAgbWVkaXVtcHVycGxlOiBbMTQ3LDExMiwyMTldLFxuICBtZWRpdW1zZWFncmVlbjogWzYwLDE3OSwxMTNdLFxuICBtZWRpdW1zbGF0ZWJsdWU6ICBbMTIzLDEwNCwyMzhdLFxuICBtZWRpdW1zcHJpbmdncmVlbjogIFswLDI1MCwxNTRdLFxuICBtZWRpdW10dXJxdW9pc2U6ICBbNzIsMjA5LDIwNF0sXG4gIG1lZGl1bXZpb2xldHJlZDogIFsxOTksMjEsMTMzXSxcbiAgbWlkbmlnaHRibHVlOiBbMjUsMjUsMTEyXSxcbiAgbWludGNyZWFtOiAgWzI0NSwyNTUsMjUwXSxcbiAgbWlzdHlyb3NlOiAgWzI1NSwyMjgsMjI1XSxcbiAgbW9jY2FzaW46IFsyNTUsMjI4LDE4MV0sXG4gIG5hdmFqb3doaXRlOiAgWzI1NSwyMjIsMTczXSxcbiAgbmF2eTogWzAsMCwxMjhdLFxuICBvbGRsYWNlOiAgWzI1MywyNDUsMjMwXSxcbiAgb2xpdmU6ICBbMTI4LDEyOCwwXSxcbiAgb2xpdmVkcmFiOiAgWzEwNywxNDIsMzVdLFxuICBvcmFuZ2U6IFsyNTUsMTY1LDBdLFxuICBvcmFuZ2VyZWQ6ICBbMjU1LDY5LDBdLFxuICBvcmNoaWQ6IFsyMTgsMTEyLDIxNF0sXG4gIHBhbGVnb2xkZW5yb2Q6ICBbMjM4LDIzMiwxNzBdLFxuICBwYWxlZ3JlZW46ICBbMTUyLDI1MSwxNTJdLFxuICBwYWxldHVycXVvaXNlOiAgWzE3NSwyMzgsMjM4XSxcbiAgcGFsZXZpb2xldHJlZDogIFsyMTksMTEyLDE0N10sXG4gIHBhcGF5YXdoaXA6IFsyNTUsMjM5LDIxM10sXG4gIHBlYWNocHVmZjogIFsyNTUsMjE4LDE4NV0sXG4gIHBlcnU6IFsyMDUsMTMzLDYzXSxcbiAgcGluazogWzI1NSwxOTIsMjAzXSxcbiAgcGx1bTogWzIyMSwxNjAsMjIxXSxcbiAgcG93ZGVyYmx1ZTogWzE3NiwyMjQsMjMwXSxcbiAgcHVycGxlOiBbMTI4LDAsMTI4XSxcbiAgcmVkOiAgWzI1NSwwLDBdLFxuICByb3N5YnJvd246ICBbMTg4LDE0MywxNDNdLFxuICByb3lhbGJsdWU6ICBbNjUsMTA1LDIyNV0sXG4gIHNhZGRsZWJyb3duOiAgWzEzOSw2OSwxOV0sXG4gIHNhbG1vbjogWzI1MCwxMjgsMTE0XSxcbiAgc2FuZHlicm93bjogWzI0NCwxNjQsOTZdLFxuICBzZWFncmVlbjogWzQ2LDEzOSw4N10sXG4gIHNlYXNoZWxsOiBbMjU1LDI0NSwyMzhdLFxuICBzaWVubmE6IFsxNjAsODIsNDVdLFxuICBzaWx2ZXI6IFsxOTIsMTkyLDE5Ml0sXG4gIHNreWJsdWU6ICBbMTM1LDIwNiwyMzVdLFxuICBzbGF0ZWJsdWU6ICBbMTA2LDkwLDIwNV0sXG4gIHNsYXRlZ3JheTogIFsxMTIsMTI4LDE0NF0sXG4gIHNsYXRlZ3JleTogIFsxMTIsMTI4LDE0NF0sXG4gIHNub3c6IFsyNTUsMjUwLDI1MF0sXG4gIHNwcmluZ2dyZWVuOiAgWzAsMjU1LDEyN10sXG4gIHN0ZWVsYmx1ZTogIFs3MCwxMzAsMTgwXSxcbiAgdGFuOiAgWzIxMCwxODAsMTQwXSxcbiAgdGVhbDogWzAsMTI4LDEyOF0sXG4gIHRoaXN0bGU6ICBbMjE2LDE5MSwyMTZdLFxuICB0b21hdG86IFsyNTUsOTksNzFdLFxuICB0dXJxdW9pc2U6ICBbNjQsMjI0LDIwOF0sXG4gIHZpb2xldDogWzIzOCwxMzAsMjM4XSxcbiAgd2hlYXQ6ICBbMjQ1LDIyMiwxNzldLFxuICB3aGl0ZTogIFsyNTUsMjU1LDI1NV0sXG4gIHdoaXRlc21va2U6IFsyNDUsMjQ1LDI0NV0sXG4gIHllbGxvdzogWzI1NSwyNTUsMF0sXG4gIHllbGxvd2dyZWVuOiAgWzE1NCwyMDUsNTBdXG59O1xuXG52YXIgcmV2ZXJzZUtleXdvcmRzID0ge307XG5mb3IgKHZhciBrZXkgaW4gY3NzS2V5d29yZHMpIHtcbiAgcmV2ZXJzZUtleXdvcmRzW0pTT04uc3RyaW5naWZ5KGNzc0tleXdvcmRzW2tleV0pXSA9IGtleTtcbn1cbiIsInZhciBjb252ZXJzaW9ucyA9IHJlcXVpcmUoXCIuL2NvbnZlcnNpb25zXCIpO1xuXG52YXIgY29udmVydCA9IGZ1bmN0aW9uKCkge1xuICAgcmV0dXJuIG5ldyBDb252ZXJ0ZXIoKTtcbn1cblxuZm9yICh2YXIgZnVuYyBpbiBjb252ZXJzaW9ucykge1xuICAvLyBleHBvcnQgUmF3IHZlcnNpb25zXG4gIGNvbnZlcnRbZnVuYyArIFwiUmF3XCJdID0gIChmdW5jdGlvbihmdW5jKSB7XG4gICAgLy8gYWNjZXB0IGFycmF5IG9yIHBsYWluIGFyZ3NcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PSBcIm51bWJlclwiKVxuICAgICAgICBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGNvbnZlcnNpb25zW2Z1bmNdKGFyZyk7XG4gICAgfVxuICB9KShmdW5jKTtcblxuICB2YXIgcGFpciA9IC8oXFx3KykyKFxcdyspLy5leGVjKGZ1bmMpLFxuICAgICAgZnJvbSA9IHBhaXJbMV0sXG4gICAgICB0byA9IHBhaXJbMl07XG5cbiAgLy8gZXhwb3J0IHJnYjJoc2wgYW5kIFtcInJnYlwiXVtcImhzbFwiXVxuICBjb252ZXJ0W2Zyb21dID0gY29udmVydFtmcm9tXSB8fCB7fTtcblxuICBjb252ZXJ0W2Zyb21dW3RvXSA9IGNvbnZlcnRbZnVuY10gPSAoZnVuY3Rpb24oZnVuYykgeyBcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PSBcIm51bWJlclwiKVxuICAgICAgICBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgXG4gICAgICB2YXIgdmFsID0gY29udmVyc2lvbnNbZnVuY10oYXJnKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsID09IFwic3RyaW5nXCIgfHwgdmFsID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB2YWw7IC8vIGtleXdvcmRcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspXG4gICAgICAgIHZhbFtpXSA9IE1hdGgucm91bmQodmFsW2ldKTtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICB9KShmdW5jKTtcbn1cblxuXG4vKiBDb252ZXJ0ZXIgZG9lcyBsYXp5IGNvbnZlcnNpb24gYW5kIGNhY2hpbmcgKi9cbnZhciBDb252ZXJ0ZXIgPSBmdW5jdGlvbigpIHtcbiAgIHRoaXMuY29udnMgPSB7fTtcbn07XG5cbi8qIEVpdGhlciBnZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZSBvclxuICBzZXQgdGhlIHZhbHVlcyBmb3IgYSBzcGFjZSwgZGVwZW5kaW5nIG9uIGFyZ3MgKi9cbkNvbnZlcnRlci5wcm90b3R5cGUucm91dGVTcGFjZSA9IGZ1bmN0aW9uKHNwYWNlLCBhcmdzKSB7XG4gICB2YXIgdmFsdWVzID0gYXJnc1swXTtcbiAgIGlmICh2YWx1ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gY29sb3IucmdiKClcbiAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlcyhzcGFjZSk7XG4gICB9XG4gICAvLyBjb2xvci5yZ2IoMTAsIDEwLCAxMClcbiAgIGlmICh0eXBlb2YgdmFsdWVzID09IFwibnVtYmVyXCIpIHtcbiAgICAgIHZhbHVlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpOyAgICAgICAgXG4gICB9XG5cbiAgIHJldHVybiB0aGlzLnNldFZhbHVlcyhzcGFjZSwgdmFsdWVzKTtcbn07XG4gIFxuLyogU2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2UsIGludmFsaWRhdGluZyBjYWNoZSAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5zZXRWYWx1ZXMgPSBmdW5jdGlvbihzcGFjZSwgdmFsdWVzKSB7XG4gICB0aGlzLnNwYWNlID0gc3BhY2U7XG4gICB0aGlzLmNvbnZzID0ge307XG4gICB0aGlzLmNvbnZzW3NwYWNlXSA9IHZhbHVlcztcbiAgIHJldHVybiB0aGlzO1xufTtcblxuLyogR2V0IHRoZSB2YWx1ZXMgZm9yIGEgc3BhY2UuIElmIHRoZXJlJ3MgYWxyZWFkeVxuICBhIGNvbnZlcnNpb24gZm9yIHRoZSBzcGFjZSwgZmV0Y2ggaXQsIG90aGVyd2lzZVxuICBjb21wdXRlIGl0ICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLmdldFZhbHVlcyA9IGZ1bmN0aW9uKHNwYWNlKSB7XG4gICB2YXIgdmFscyA9IHRoaXMuY29udnNbc3BhY2VdO1xuICAgaWYgKCF2YWxzKSB7XG4gICAgICB2YXIgZnNwYWNlID0gdGhpcy5zcGFjZSxcbiAgICAgICAgICBmcm9tID0gdGhpcy5jb252c1tmc3BhY2VdO1xuICAgICAgdmFscyA9IGNvbnZlcnRbZnNwYWNlXVtzcGFjZV0oZnJvbSk7XG5cbiAgICAgIHRoaXMuY29udnNbc3BhY2VdID0gdmFscztcbiAgIH1cbiAgcmV0dXJuIHZhbHM7XG59O1xuXG5bXCJyZ2JcIiwgXCJoc2xcIiwgXCJoc3ZcIiwgXCJjbXlrXCIsIFwia2V5d29yZFwiXS5mb3JFYWNoKGZ1bmN0aW9uKHNwYWNlKSB7XG4gICBDb252ZXJ0ZXIucHJvdG90eXBlW3NwYWNlXSA9IGZ1bmN0aW9uKHZhbHMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJvdXRlU3BhY2Uoc3BhY2UsIGFyZ3VtZW50cyk7XG4gICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb252ZXJ0OyIsIi8qIVxyXG4gKiBAbmFtZSBKYXZhU2NyaXB0L05vZGVKUyBNZXJnZSB2MS4xLjJcclxuICogQGF1dGhvciB5ZWlrb3NcclxuICogQHJlcG9zaXRvcnkgaHR0cHM6Ly9naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZVxyXG5cclxuICogQ29weXJpZ2h0IDIwMTMgeWVpa29zIC0gTUlUIGxpY2Vuc2VcclxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2UvbWFzdGVyL0xJQ0VOU0VcclxuICovXHJcblxyXG47KGZ1bmN0aW9uKGlzTm9kZSkge1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZSgpIHtcclxuXHJcblx0XHR2YXIgaXRlbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG5cdFx0XHRyZXN1bHQgPSBpdGVtcy5zaGlmdCgpLFxyXG5cdFx0XHRkZWVwID0gKHJlc3VsdCA9PT0gdHJ1ZSksXHJcblx0XHRcdHNpemUgPSBpdGVtcy5sZW5ndGgsXHJcblx0XHRcdGl0ZW0sIGluZGV4LCBrZXk7XHJcblxyXG5cdFx0aWYgKGRlZXAgfHwgdHlwZU9mKHJlc3VsdCkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmVzdWx0ID0ge307XHJcblxyXG5cdFx0Zm9yIChpbmRleD0wO2luZGV4PHNpemU7KytpbmRleClcclxuXHJcblx0XHRcdGlmICh0eXBlT2YoaXRlbSA9IGl0ZW1zW2luZGV4XSkgPT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0XHRmb3IgKGtleSBpbiBpdGVtKVxyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gZGVlcCA/IGNsb25lKGl0ZW1ba2V5XSkgOiBpdGVtW2tleV07XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbG9uZShpbnB1dCkge1xyXG5cclxuXHRcdHZhciBvdXRwdXQgPSBpbnB1dCxcclxuXHRcdFx0dHlwZSA9IHR5cGVPZihpbnB1dCksXHJcblx0XHRcdGluZGV4LCBzaXplO1xyXG5cclxuXHRcdGlmICh0eXBlID09PSAnYXJyYXknKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSBbXTtcclxuXHRcdFx0c2l6ZSA9IGlucHV0Lmxlbmd0aDtcclxuXHJcblx0XHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBjbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IHt9O1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleCBpbiBpbnB1dClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IGNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdHlwZU9mKGlucHV0KSB7XHJcblxyXG5cdFx0cmV0dXJuICh7fSkudG9TdHJpbmcuY2FsbChpbnB1dCkubWF0Y2goL1xccyhbXFx3XSspLylbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcblx0fVxyXG5cclxuXHRpZiAoaXNOb2RlKSB7XHJcblxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBtZXJnZTtcclxuXHJcblx0fSBlbHNlIHtcclxuXHJcblx0XHR3aW5kb3cubWVyZ2UgPSBtZXJnZTtcclxuXHJcblx0fVxyXG5cclxufSkodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbjsoZnVuY3Rpb24gKGNvbW1vbmpzKSB7XG4gIGZ1bmN0aW9uIGVycm9yT2JqZWN0KGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGVycm9yLm5hbWUsXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVDYWxsc0Zyb21Pd25lcihmdW5jdGlvbnMsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBMZXQgdGhlIG90aGVyIHNpZGUga25vdyBhYm91dCBvdXIgZnVuY3Rpb25zIGlmIHRoZXkgY2FuJ3QgdXNlIFByb3h5LlxuICAgICAgdmFyIG5hbWVzID0gW107XG4gICAgICBmb3IgKHZhciBuYW1lIGluIGZ1bmN0aW9ucykgbmFtZXMucHVzaChuYW1lKTtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2Z1bmN0aW9uTmFtZXM6IG5hbWVzfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2soaWQpIHtcbiAgICAgIGZ1bmN0aW9uIGNhbGxiYWNrKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2NhbGxSZXNwb25zZTogaWQsIGFyZ3VtZW50czogYXJnc30pO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjay5fYXV0b0Rpc2FibGVkID0gZmFsc2U7XG4gICAgICBjYWxsYmFjay5kaXNhYmxlQXV0byA9IGZ1bmN0aW9uICgpIHsgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IHRydWU7IH07XG5cbiAgICAgIGNhbGxiYWNrLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe2NhbGxSZXNwb25zZTogaWQsIGFyZ3VtZW50czogYXJnc30sIHRyYW5zZmVyTGlzdCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgICBpZiAobWVzc2FnZS5jYWxsKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxJZDtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQuXG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uc1ttZXNzYWdlLmNhbGxdO1xuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBjYWxsUmVzcG9uc2U6IGNhbGxJZCxcbiAgICAgICAgICAgIGFyZ3VtZW50czogW2Vycm9yT2JqZWN0KG5ldyBFcnJvcignVGhhdCBmdW5jdGlvbiBkb2VzIG5vdCBleGlzdCcpKV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IG1lc3NhZ2UuYXJndW1lbnRzIHx8IFtdO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjcmVhdGVDYWxsYmFjayhjYWxsSWQpO1xuICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2F0Y2hFcnJvcnMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBmbi5hcHBseShmdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yT2JqZWN0KGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuVmFsdWUgPSBmbi5hcHBseShmdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIG9wdGlvbiBmb3IgaXQgaXMgZW5hYmxlZCwgYXV0b21hdGljYWxseSBjYWxsIHRoZSBjYWxsYmFjay5cbiAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0NhbGxiYWNrICYmICFjYWxsYmFjay5fYXV0b0Rpc2FibGVkKSB7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV0dXJuVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kQ2FsbHNUb1dvcmtlcih3b3JrZXJzLCBvcHRpb25zKSB7XG4gICAgdmFyIGNhY2hlID0ge30sXG4gICAgICAgIGNhbGxiYWNrcyA9IHt9LFxuICAgICAgICB0aW1lcnMsXG4gICAgICAgIG5leHRDYWxsSWQgPSAxLFxuICAgICAgICBmYWtlUHJveHksXG4gICAgICAgIHF1ZXVlID0gW107XG5cbiAgICAvLyBDcmVhdGUgYW4gYXJyYXkgb2YgbnVtYmVyIG9mIHBlbmRpbmcgdGFza3MgZm9yIGVhY2ggd29ya2VyLlxuICAgIHZhciBwZW5kaW5nID0gd29ya2Vycy5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gMDsgfSk7XG5cbiAgICAvLyBFYWNoIGluZGl2aWR1YWwgY2FsbCBnZXRzIGEgdGltZXIgaWYgdGltaW5nIGNhbGxzLlxuICAgIGlmIChvcHRpb25zLnRpbWVDYWxscykgdGltZXJzID0ge307XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIG5vIFByb3h5IHN1cHBvcnQsIHdlIGhhdmUgdG8gcHJlLWRlZmluZSBhbGwgdGhlIGZ1bmN0aW9ucy5cbiAgICAgIGZha2VQcm94eSA9IHtwZW5kaW5nQ2FsbHM6IDB9O1xuICAgICAgb3B0aW9ucy5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgZmFrZVByb3h5W25hbWVdID0gZ2V0SGFuZGxlcihudWxsLCBuYW1lKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE51bVBlbmRpbmdDYWxscygpIHtcbiAgICAgIHJldHVybiBxdWV1ZS5sZW5ndGggKyBwZW5kaW5nLnJlZHVjZShmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCArIHk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEhhbmRsZXIoXywgbmFtZSkge1xuICAgICAgaWYgKG5hbWUgPT0gJ3BlbmRpbmdDYWxscycpIHJldHVybiBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcbiAgICAgIGlmIChjYWNoZVtuYW1lXSkgcmV0dXJuIGNhY2hlW25hbWVdO1xuXG4gICAgICB2YXIgZm4gPSBjYWNoZVtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBTZW5kcyB0aGUgc2FtZSBjYWxsIHRvIGFsbCB3b3JrZXJzLlxuICAgICAgZm4uYnJvYWRjYXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHNlbmRDYWxsKGksIG5hbWUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmYWtlUHJveHkpIGZha2VQcm94eS5wZW5kaW5nQ2FsbHMgPSBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIE1hcmtzIHRoZSBvYmplY3RzIGluIHRoZSBmaXJzdCBhcmd1bWVudCAoYXJyYXkpIGFzIHRyYW5zZmVyYWJsZS5cbiAgICAgIGZuLnRyYW5zZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICB0cmFuc2Zlckxpc3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHF1ZXVlQ2FsbChuYW1lLCBhcmdzLCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGZuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZsdXNoUXVldWUoKSB7XG4gICAgICAvLyBLZWVwIHRoZSBmYWtlIHByb3h5IHBlbmRpbmcgY291bnQgdXAtdG8tZGF0ZS5cbiAgICAgIGlmIChmYWtlUHJveHkpIGZha2VQcm94eS5wZW5kaW5nQ2FsbHMgPSBnZXROdW1QZW5kaW5nQ2FsbHMoKTtcblxuICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwZW5kaW5nW2ldKSBjb250aW51ZTtcblxuICAgICAgICAvLyBBIHdvcmtlciBpcyBhdmFpbGFibGUuXG4gICAgICAgIHZhciBwYXJhbXMgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBzZW5kQ2FsbChpLCBwYXJhbXNbMF0sIHBhcmFtc1sxXSwgcGFyYW1zWzJdKTtcblxuICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHF1ZXVlQ2FsbChuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICBxdWV1ZS5wdXNoKFtuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0XSk7XG4gICAgICBmbHVzaFF1ZXVlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VuZENhbGwod29ya2VySW5kZXgsIG5hbWUsIGFyZ3MsIG9wdF90cmFuc2Zlckxpc3QpIHtcbiAgICAgIC8vIEdldCB0aGUgd29ya2VyIGFuZCBpbmRpY2F0ZSB0aGF0IGl0IGhhcyBhIHBlbmRpbmcgdGFzay5cbiAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdKys7XG4gICAgICB2YXIgd29ya2VyID0gd29ya2Vyc1t3b3JrZXJJbmRleF07XG5cbiAgICAgIHZhciBpZCA9IG5leHRDYWxsSWQrKztcblxuICAgICAgLy8gSWYgdGhlIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgYXNzdW1lIGl0J3MgdGhlIGNhbGxiYWNrLlxuICAgICAgdmFyIG1heWJlQ2IgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICBpZiAodHlwZW9mIG1heWJlQ2IgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFja3NbaWRdID0gbWF5YmVDYjtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBzcGVjaWZpZWQsIHRpbWUgY2FsbHMgdXNpbmcgdGhlIGNvbnNvbGUudGltZSBpbnRlcmZhY2UuXG4gICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHtcbiAgICAgICAgdmFyIHRpbWVySWQgPSBuYW1lICsgJygnICsgYXJncy5qb2luKCcsICcpICsgJyknO1xuICAgICAgICB0aW1lcnNbaWRdID0gdGltZXJJZDtcbiAgICAgICAgY29uc29sZS50aW1lKHRpbWVySWQpO1xuICAgICAgfVxuXG4gICAgICB3b3JrZXIucG9zdE1lc3NhZ2Uoe2NhbGxJZDogaWQsIGNhbGw6IG5hbWUsIGFyZ3VtZW50czogYXJnc30sIG9wdF90cmFuc2Zlckxpc3QpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RlbmVyKGUpIHtcbiAgICAgIHZhciB3b3JrZXJJbmRleCA9IHdvcmtlcnMuaW5kZXhPZih0aGlzKTtcbiAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgICBpZiAobWVzc2FnZS5jYWxsUmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGNhbGxJZCA9IG1lc3NhZ2UuY2FsbFJlc3BvbnNlO1xuXG4gICAgICAgIC8vIENhbGwgdGhlIGNhbGxiYWNrIHJlZ2lzdGVyZWQgZm9yIHRoaXMgY2FsbCAoaWYgYW55KS5cbiAgICAgICAgaWYgKGNhbGxiYWNrc1tjYWxsSWRdKSB7XG4gICAgICAgICAgY2FsbGJhY2tzW2NhbGxJZF0uYXBwbHkobnVsbCwgbWVzc2FnZS5hcmd1bWVudHMpO1xuICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlcG9ydCB0aW1pbmcsIGlmIHRoYXQgb3B0aW9uIGlzIGVuYWJsZWQuXG4gICAgICAgIGlmIChvcHRpb25zLnRpbWVDYWxscyAmJiB0aW1lcnNbY2FsbElkXSkge1xuICAgICAgICAgIGNvbnNvbGUudGltZUVuZCh0aW1lcnNbY2FsbElkXSk7XG4gICAgICAgICAgZGVsZXRlIHRpbWVyc1tjYWxsSWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIHRhc2sgaXMgbm8gbG9uZ2VyIHBlbmRpbmcgb24gdGhlIHdvcmtlci5cbiAgICAgICAgcGVuZGluZ1t3b3JrZXJJbmRleF0tLTtcbiAgICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmZ1bmN0aW9uTmFtZXMpIHtcbiAgICAgICAgLy8gUmVjZWl2ZWQgYSBsaXN0IG9mIGF2YWlsYWJsZSBmdW5jdGlvbnMuIE9ubHkgdXNlZnVsIGZvciBmYWtlIHByb3h5LlxuICAgICAgICBtZXNzYWdlLmZ1bmN0aW9uTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExpc3RlbiB0byBtZXNzYWdlcyBmcm9tIGFsbCB0aGUgd29ya2Vycy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHdvcmtlcnNbaV0uYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFrZVByb3h5O1xuICAgIH0gZWxzZSBpZiAoUHJveHkuY3JlYXRlKSB7XG4gICAgICByZXR1cm4gUHJveHkuY3JlYXRlKHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm94eSh7fSwge2dldDogZ2V0SGFuZGxlcn0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBlaXRoZXIgYSBXb3JrZXIgaW5zdGFuY2UsIGEgbGlzdCBvZiB0aGVtLCBvciBhIG1hcFxuICAgKiBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkIGluc2lkZSB0aGUgd29ya2VyLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlV29ya2VyUHJveHkod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRfb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgLy8gQXV0b21hdGljYWxseSBjYWxsIHRoZSBjYWxsYmFjayBhZnRlciBhIGNhbGwgaWYgdGhlIHJldHVybiB2YWx1ZSBpcyBub3RcbiAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgIGF1dG9DYWxsYmFjazogZmFsc2UsXG4gICAgICAvLyBDYXRjaCBlcnJvcnMgYW5kIGF1dG9tYXRpY2FsbHkgcmVzcG9uZCB3aXRoIGFuIGVycm9yIGNhbGxiYWNrLiBPZmYgYnlcbiAgICAgIC8vIGRlZmF1bHQgc2luY2UgaXQgYnJlYWtzIHN0YW5kYXJkIGJlaGF2aW9yLlxuICAgICAgY2F0Y2hFcnJvcnM6IGZhbHNlLFxuICAgICAgLy8gQSBsaXN0IG9mIGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSBjYWxsZWQuIFRoaXMgbGlzdCB3aWxsIGJlIHVzZWQgdG8gbWFrZVxuICAgICAgLy8gdGhlIHByb3h5IGZ1bmN0aW9ucyBhdmFpbGFibGUgd2hlbiBQcm94eSBpcyBub3Qgc3VwcG9ydGVkLiBOb3RlIHRoYXRcbiAgICAgIC8vIHRoaXMgaXMgZ2VuZXJhbGx5IG5vdCBuZWVkZWQgc2luY2UgdGhlIHdvcmtlciB3aWxsIGFsc28gcHVibGlzaCBpdHNcbiAgICAgIC8vIGtub3duIGZ1bmN0aW9ucy5cbiAgICAgIGZ1bmN0aW9uTmFtZXM6IFtdLFxuICAgICAgLy8gQ2FsbCBjb25zb2xlLnRpbWUgYW5kIGNvbnNvbGUudGltZUVuZCBmb3IgY2FsbHMgc2VudCB0aG91Z2ggdGhlIHByb3h5LlxuICAgICAgdGltZUNhbGxzOiBmYWxzZVxuICAgIH07XG5cbiAgICBpZiAob3B0X29wdGlvbnMpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvcHRfb3B0aW9ucykge1xuICAgICAgICBpZiAoIShrZXkgaW4gb3B0aW9ucykpIGNvbnRpbnVlO1xuICAgICAgICBvcHRpb25zW2tleV0gPSBvcHRfb3B0aW9uc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZnJlZXplKG9wdGlvbnMpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhbiBhcnJheSBvZiB3b3JrZXJzIChldmVuIGlmIG9ubHkgdXNpbmcgb25lIHdvcmtlcikuXG4gICAgaWYgKHR5cGVvZiBXb3JrZXIgIT0gJ3VuZGVmaW5lZCcgJiYgKHdvcmtlcnNPckZ1bmN0aW9ucyBpbnN0YW5jZW9mIFdvcmtlcikpIHtcbiAgICAgIHdvcmtlcnNPckZ1bmN0aW9ucyA9IFt3b3JrZXJzT3JGdW5jdGlvbnNdO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHdvcmtlcnNPckZ1bmN0aW9ucykpIHtcbiAgICAgIHJldHVybiBzZW5kQ2FsbHNUb1dvcmtlcih3b3JrZXJzT3JGdW5jdGlvbnMsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlQ2FsbHNGcm9tT3duZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tbW9uanMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVdvcmtlclByb3h5O1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29wZTtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBnbG9iYWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHdpbmRvdztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHNlbGY7XG4gICAgfVxuXG4gICAgc2NvcGUuY3JlYXRlV29ya2VyUHJveHkgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfVxufSkodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiZXhwb3J0cy5Xb3JsZCA9IHJlcXVpcmUoJy4vbGliL3dvcmxkJyk7XG5leHBvcnRzLldvcmxkTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL3dvcmxkbWFuYWdlcicpO1xuZXhwb3J0cy5Xb3JsZFJlbmRlcmVyID0gcmVxdWlyZSgnLi9saWIvd29ybGRyZW5kZXJlcicpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWdpb25SZW5kZXJlcjtcblxuXG52YXIgVElMRVNfWCA9IDMyO1xudmFyIFRJTEVTX1kgPSAzMjtcbnZhciBUSUxFU19QRVJfUkVHSU9OID0gVElMRVNfWCAqIFRJTEVTX1k7XG5cbnZhciBIRUFERVJfQllURVMgPSAzO1xudmFyIEJZVEVTX1BFUl9USUxFID0gMjM7XG52YXIgQllURVNfUEVSX1JPVyA9IEJZVEVTX1BFUl9USUxFICogVElMRVNfWDtcbnZhciBCWVRFU19QRVJfUkVHSU9OID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1RJTEUgKiBUSUxFU19QRVJfUkVHSU9OO1xuXG52YXIgVElMRV9XSURUSCA9IDg7XG52YXIgVElMRV9IRUlHSFQgPSA4O1xuXG52YXIgUkVHSU9OX1dJRFRIID0gVElMRV9XSURUSCAqIFRJTEVTX1g7XG52YXIgUkVHSU9OX0hFSUdIVCA9IFRJTEVfSEVJR0hUICogVElMRVNfWTtcblxuXG5mdW5jdGlvbiBnZXRJbnQxNihyZWdpb24sIG9mZnNldCkge1xuICBpZiAocmVnaW9uICYmIHJlZ2lvbi52aWV3KSByZXR1cm4gcmVnaW9uLnZpZXcuZ2V0SW50MTYob2Zmc2V0KTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZW50YXRpb24ob3JpZW50YXRpb25zLCBpbmRleCkge1xuICB2YXIgY3VySW5kZXggPSAwLCBpbWFnZSwgZGlyZWN0aW9uO1xuXG4gIC8vIFRoaXMgaXMgYSB0cmVtZW5kb3VzIGFtb3VudCBvZiBsb2dpYyBmb3IgZGVjaWRpbmcgd2hpY2ggaW1hZ2UgdG8gdXNlLi4uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZW50YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG8gPSBvcmllbnRhdGlvbnNbaV07XG4gICAgaWYgKGN1ckluZGV4ID09IGluZGV4KSB7XG4gICAgICBpZiAoby5pbWFnZUxheWVycykge1xuICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IG11bHRpcGxlIGxheWVycy5cbiAgICAgICAgaW1hZ2UgPSBvLmltYWdlTGF5ZXJzWzBdLmltYWdlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UgPSBvLmltYWdlIHx8IG8ubGVmdEltYWdlIHx8IG8uZHVhbEltYWdlO1xuICAgICAgfVxuICAgICAgZGlyZWN0aW9uID0gby5kaXJlY3Rpb24gfHwgJ2xlZnQnO1xuICAgICAgaWYgKCFpbWFnZSkgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZ2V0IGltYWdlIGZvciBvcmllbnRhdGlvbicpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY3VySW5kZXgrKztcblxuICAgIGlmIChvLmR1YWxJbWFnZSB8fCBvLnJpZ2h0SW1hZ2UpIHtcbiAgICAgIGlmIChjdXJJbmRleCA9PSBpbmRleCkge1xuICAgICAgICBpbWFnZSA9IG8ucmlnaHRJbWFnZSB8fCBvLmR1YWxJbWFnZTtcbiAgICAgICAgZGlyZWN0aW9uID0gJ3JpZ2h0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGN1ckluZGV4Kys7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbWFnZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCBvcmllbnRhdGlvbicpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbWFnZTogaW1hZ2UsXG4gICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgZmxpcDogby5mbGlwSW1hZ2VzIHx8ICEhKG8uZHVhbEltYWdlICYmIGRpcmVjdGlvbiA9PSAnbGVmdCcpLFxuICAgIGluZm86IG9cbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VWludDgocmVnaW9uLCBvZmZzZXQpIHtcbiAgaWYgKHJlZ2lvbiAmJiByZWdpb24udmlldykgcmV0dXJuIHJlZ2lvbi52aWV3LmdldFVpbnQ4KG9mZnNldCk7XG59XG5cblxuZnVuY3Rpb24gUmVnaW9uUmVuZGVyZXIoeCwgeSkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuXG4gIHRoaXMuZW50aXRpZXMgPSBudWxsO1xuICB0aGlzLnZpZXcgPSBudWxsO1xuXG4gIHRoaXMubmVpZ2hib3JzID0gbnVsbDtcbiAgdGhpcy5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1VOSU5JVElBTElaRUQ7XG5cbiAgLy8gV2hldGhlciBhIGxheWVyIG5lZWRzIHRvIGJlIHJlcmVuZGVyZWQuXG4gIHRoaXMuZGlydHkgPSB7YmFja2dyb3VuZDogZmFsc2UsIGZvcmVncm91bmQ6IGZhbHNlLCBzcHJpdGVzOiBmYWxzZX07XG5cbiAgdGhpcy5fc3ByaXRlc01pblggPSAwO1xuICB0aGlzLl9zcHJpdGVzTWluWSA9IDA7XG59XG5cblJlZ2lvblJlbmRlcmVyLlNUQVRFX0VSUk9SID0gLTE7XG5SZWdpb25SZW5kZXJlci5TVEFURV9VTklUSUFMSVpFRCA9IDA7XG5SZWdpb25SZW5kZXJlci5TVEFURV9MT0FESU5HID0gMTtcblJlZ2lvblJlbmRlcmVyLlNUQVRFX1JFQURZID0gMjtcblxuLy8gVE9ETzogSW1wbGVtZW50IHN1cHBvcnQgZm9yIHJlbmRlcmluZyBvbmx5IGEgcGFydCBvZiB0aGUgcmVnaW9uLlxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChyZW5kZXJlciwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuICBpZiAodGhpcy5zdGF0ZSAhPSBSZWdpb25SZW5kZXJlci5TVEFURV9SRUFEWSkgcmV0dXJuO1xuXG4gIHRoaXMuX3JlbmRlckVudGl0aWVzKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKTtcbiAgdGhpcy5fcmVuZGVyVGlsZXMocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLnNldERpcnR5ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpcnR5LmJhY2tncm91bmQgPSB0cnVlO1xuICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSB0cnVlO1xuICB0aGlzLmRpcnR5LnNwcml0ZXMgPSB0cnVlO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLnVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5lbnRpdGllcyA9IG51bGw7XG4gIHRoaXMudmlldyA9IG51bGw7XG5cbiAgdGhpcy5uZWlnaGJvcnMgPSBudWxsO1xuICB0aGlzLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfVU5JTklUSUFMSVpFRDtcbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyRW50aXRpZXMgPSBmdW5jdGlvbiAocmVuZGVyZXIsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgdmFyIGNhbnZhcyA9IHJlbmRlcmVyLmdldENhbnZhcyh0aGlzLCAyKTtcbiAgaWYgKCF0aGlzLmRpcnR5LnNwcml0ZXMpIHtcbiAgICBjYW52YXMuc3R5bGUubGVmdCA9IChvZmZzZXRYICsgdGhpcy5fc3ByaXRlc01pblggKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmJvdHRvbSA9IChvZmZzZXRZICsgKFJFR0lPTl9IRUlHSFQgLSB0aGlzLl9zcHJpdGVzTWF4WSkgKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gIH1cblxuICB0aGlzLmRpcnR5LnNwcml0ZXMgPSBmYWxzZTtcblxuICB2YXIgbWluWCA9IDAsIG1heFggPSAwLCBtaW5ZID0gMCwgbWF4WSA9IDAsXG4gICAgICBvcmlnaW5YID0gdGhpcy54ICogVElMRVNfWCwgb3JpZ2luWSA9IHRoaXMueSAqIFRJTEVTX1ksXG4gICAgICBhbGxTcHJpdGVzID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV0sXG4gICAgICAgIHNwcml0ZXMgPSBudWxsO1xuXG4gICAgc3dpdGNoIChlbnRpdHkuX19uYW1lX18gKyBlbnRpdHkuX192ZXJzaW9uX18pIHtcbiAgICAgIGNhc2UgJ0l0ZW1Ecm9wRW50aXR5MSc6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJJdGVtKHJlbmRlcmVyLCBlbnRpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ01vbnN0ZXJFbnRpdHkxJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlck1vbnN0ZXIocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTnBjRW50aXR5MSc6XG4gICAgICAgIC8vIFRPRE86IENvbnZlcnQgdG8gdmVyc2lvbiAyIGJlZm9yZSByZW5kZXJpbmcuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTnBjRW50aXR5Mic6XG4gICAgICAgIHNwcml0ZXMgPSB0aGlzLl9yZW5kZXJOUEMocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnT2JqZWN0RW50aXR5MSc6XG4gICAgICAgIC8vIFRPRE86IFBvdGVudGlhbCBjb252ZXJzaW9uIGNvZGUuXG4gICAgICBjYXNlICdPYmplY3RFbnRpdHkyJzpcbiAgICAgICAgc3ByaXRlcyA9IHRoaXMuX3JlbmRlck9iamVjdChyZW5kZXJlciwgZW50aXR5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdQbGFudEVudGl0eTEnOlxuICAgICAgICBzcHJpdGVzID0gdGhpcy5fcmVuZGVyUGxhbnQocmVuZGVyZXIsIGVudGl0eSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKCdVbnN1cHBvcnRlZCBlbnRpdHkvdmVyc2lvbjonLCBlbnRpdHkpO1xuICAgIH1cblxuICAgIGlmIChzcHJpdGVzKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNwcml0ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIHNwcml0ZSA9IHNwcml0ZXNbal07XG4gICAgICAgIGlmICghc3ByaXRlIHx8ICFzcHJpdGUuaW1hZ2UpIHtcbiAgICAgICAgICB0aGlzLmRpcnR5LnNwcml0ZXMgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzcHJpdGUuc3gpIHNwcml0ZS5zeCA9IDA7XG4gICAgICAgIGlmICghc3ByaXRlLnN5KSBzcHJpdGUuc3kgPSAwO1xuICAgICAgICBpZiAoIXNwcml0ZS53aWR0aCkgc3ByaXRlLndpZHRoID0gc3ByaXRlLmltYWdlLndpZHRoO1xuICAgICAgICBpZiAoIXNwcml0ZS5oZWlnaHQpIHNwcml0ZS5oZWlnaHQgPSBzcHJpdGUuaW1hZ2UuaGVpZ2h0O1xuXG4gICAgICAgIHNwcml0ZS5jYW52YXNYID0gKHNwcml0ZS54IC0gb3JpZ2luWCkgKiBUSUxFX1dJRFRIO1xuICAgICAgICBzcHJpdGUuY2FudmFzWSA9IFJFR0lPTl9IRUlHSFQgLSAoc3ByaXRlLnkgLSBvcmlnaW5ZKSAqIFRJTEVfSEVJR0hUIC0gc3ByaXRlLmhlaWdodDtcblxuICAgICAgICBtaW5YID0gTWF0aC5taW4oc3ByaXRlLmNhbnZhc1gsIG1pblgpO1xuICAgICAgICBtYXhYID0gTWF0aC5tYXgoc3ByaXRlLmNhbnZhc1ggKyBzcHJpdGUud2lkdGgsIG1heFgpO1xuICAgICAgICBtaW5ZID0gTWF0aC5taW4oc3ByaXRlLmNhbnZhc1ksIG1pblkpO1xuICAgICAgICBtYXhZID0gTWF0aC5tYXgoc3ByaXRlLmNhbnZhc1kgKyBzcHJpdGUuaGVpZ2h0LCBtYXhZKTtcblxuICAgICAgICBhbGxTcHJpdGVzLnB1c2goc3ByaXRlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kaXJ0eS5zcHJpdGVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIHdpbGwgcmVzaXplIHRoZSBjYW52YXMgaWYgbmVjZXNzYXJ5LlxuICBjYW52YXMgPSByZW5kZXJlci5nZXRDYW52YXModGhpcywgMiwgbWF4WCAtIG1pblgsIG1heFkgLSBtaW5ZKTtcbiAgdGhpcy5fc3ByaXRlc01pblggPSBtaW5YO1xuICB0aGlzLl9zcHJpdGVzTWluWSA9IG1pblk7XG5cbiAgaWYgKGFsbFNwcml0ZXMubGVuZ3RoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsU3ByaXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNwcml0ZSA9IGFsbFNwcml0ZXNbaV07XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShzcHJpdGUuaW1hZ2UsIHNwcml0ZS5zeCwgc3ByaXRlLnN5LCBzcHJpdGUud2lkdGgsIHNwcml0ZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAtbWluWCArIHNwcml0ZS5jYW52YXNYLCAtbWluWSArIHNwcml0ZS5jYW52YXNZLCBzcHJpdGUud2lkdGgsIHNwcml0ZS5oZWlnaHQpO1xuICAgIH1cblxuICAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gKG9mZnNldFggKyBtaW5YICogcmVuZGVyZXIuem9vbSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5ib3R0b20gPSAob2Zmc2V0WSArIChSRUdJT05fSEVJR0hUIC0gbWF4WSkgKiByZW5kZXJlci56b29tKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gIH0gZWxzZSB7XG4gICAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgfVxufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJJdGVtID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgLy8gVE9ETzogTm90IHN1cmUgd2hhdCB0byBkbyBhYm91dCBpdGVtcy5cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyTW9uc3RlciA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgbW9uc3RlcnMuXG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlck5QQyA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIC8vIFRPRE86IE5vdCBzdXJlIHdoYXQgdG8gZG8gYWJvdXQgTlBDcy5cbn07XG5cblJlZ2lvblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyT2JqZWN0ID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgdmFyIG9iamVjdHMgPSByZW5kZXJlci5vYmplY3RzLmluZGV4O1xuICBpZiAoIW9iamVjdHMpIHJldHVybjtcblxuICB2YXIgYXNzZXRzID0gcmVuZGVyZXIuYXNzZXRzO1xuICB2YXIgZGVmID0gb2JqZWN0c1tlbnRpdHkubmFtZV07XG4gIGlmICghZGVmKSB7XG4gICAgY29uc29sZS53YXJuKCdPYmplY3Qgbm90IGluIGluZGV4OiAnICsgZW50aXR5Lm5hbWUpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmIChkZWYuYW5pbWF0aW9uKSB7XG4gICAgdmFyIGFuaW1hdGlvblBhdGggPSBhc3NldHMuZ2V0UmVzb3VyY2VQYXRoKGRlZiwgZGVmLmFuaW1hdGlvbik7XG4gICAgLy8gVE9ETzogYXNzZXRzLmdldEFuaW1hdGlvbihhbmltYXRpb25QYXRoKTtcbiAgfVxuXG4gIHZhciBvcmllbnRhdGlvbiA9IGdldE9yaWVudGF0aW9uKGRlZi5vcmllbnRhdGlvbnMsIGVudGl0eS5vcmllbnRhdGlvbkluZGV4KTtcblxuICB2YXIgcGF0aEFuZEZyYW1lID0gb3JpZW50YXRpb24uaW1hZ2Uuc3BsaXQoJzonKTtcbiAgdmFyIGltYWdlUGF0aCA9IGFzc2V0cy5nZXRSZXNvdXJjZVBhdGgoZGVmLCBwYXRoQW5kRnJhbWVbMF0pO1xuICB2YXIgZnJhbWVzID0gYXNzZXRzLmdldEZyYW1lcyhpbWFnZVBhdGgpO1xuXG4gIC8vIEZsaXAgYWxsIHRoZSBmcmFtZXMgaG9yaXpvbnRhbGx5IGlmIHRoZSBzcHJpdGUgaXMgdXNpbmcgYSBkdWFsIGltYWdlLlxuICBpZiAob3JpZW50YXRpb24uZmxpcCkge1xuICAgIGlmICghZnJhbWVzKSByZXR1cm47XG4gICAgaW1hZ2VQYXRoICs9ICc/ZmxpcGdyaWR4PScgKyBmcmFtZXMuZnJhbWVHcmlkLnNpemVbMF07XG4gIH1cblxuICB2YXIgaW1hZ2UgPSBhc3NldHMuZ2V0SW1hZ2UoaW1hZ2VQYXRoKTtcbiAgaWYgKCFmcmFtZXMgfHwgIWltYWdlKSByZXR1cm47XG5cbiAgLy8gVE9ETzogR2V0IHRoZSBjb3JyZWN0IGZyYW1lIGluIHRoZSBmcmFtZSBncmlkLlxuXG4gIHZhciBzcHJpdGUgPSB7XG4gICAgaW1hZ2U6IGltYWdlLFxuICAgIHg6IGVudGl0eS50aWxlUG9zaXRpb25bMF0gKyBvcmllbnRhdGlvbi5pbmZvLmltYWdlUG9zaXRpb25bMF0gLyBUSUxFX1dJRFRILFxuICAgIHk6IGVudGl0eS50aWxlUG9zaXRpb25bMV0gKyBvcmllbnRhdGlvbi5pbmZvLmltYWdlUG9zaXRpb25bMV0gLyBUSUxFX0hFSUdIVCxcbiAgICBzeDogMCxcbiAgICBzeTogMCxcbiAgICB3aWR0aDogZnJhbWVzLmZyYW1lR3JpZC5zaXplWzBdLFxuICAgIGhlaWdodDogZnJhbWVzLmZyYW1lR3JpZC5zaXplWzFdXG4gIH07XG5cbiAgcmV0dXJuIFtzcHJpdGVdO1xufTtcblxuUmVnaW9uUmVuZGVyZXIucHJvdG90eXBlLl9yZW5kZXJQbGFudCA9IGZ1bmN0aW9uIChyZW5kZXJlciwgZW50aXR5KSB7XG4gIHZhciBhc3NldHMgPSByZW5kZXJlci5hc3NldHMsXG4gICAgICBwb3NpdGlvbiA9IGVudGl0eS50aWxlUG9zaXRpb24sXG4gICAgICB4ID0gcG9zaXRpb25bMF0sXG4gICAgICB5ID0gcG9zaXRpb25bMV07XG5cbiAgcmV0dXJuIGVudGl0eS5waWVjZXMubWFwKGZ1bmN0aW9uIChwaWVjZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpbWFnZTogYXNzZXRzLmdldEltYWdlKHBpZWNlLmltYWdlKSxcbiAgICAgIHg6IHggKyBwaWVjZS5vZmZzZXRbMF0sXG4gICAgICB5OiB5ICsgcGllY2Uub2Zmc2V0WzFdXG4gICAgfTtcbiAgfSk7XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlclRpbGVzID0gZnVuY3Rpb24gKHJlbmRlcmVyLCBvZmZzZXRYLCBvZmZzZXRZKSB7XG4gIHZhciBiZyA9IHJlbmRlcmVyLmdldENhbnZhcyh0aGlzLCAxLCBSRUdJT05fV0lEVEgsIFJFR0lPTl9IRUlHSFQpO1xuICBiZy5zdHlsZS5sZWZ0ID0gb2Zmc2V0WCArICdweCc7XG4gIGJnLnN0eWxlLmJvdHRvbSA9IG9mZnNldFkgKyAncHgnO1xuICBiZy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuXG4gIHZhciBmZyA9IHJlbmRlcmVyLmdldENhbnZhcyh0aGlzLCA0LCBSRUdJT05fV0lEVEgsIFJFR0lPTl9IRUlHSFQpO1xuICBmZy5zdHlsZS5sZWZ0ID0gb2Zmc2V0WCArICdweCc7XG4gIGZnLnN0eWxlLmJvdHRvbSA9IG9mZnNldFkgKyAncHgnO1xuICBmZy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuXG4gIGlmICghdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kICYmICF0aGlzLmRpcnR5LmZvcmVncm91bmQpIHJldHVybjtcblxuICB2YXIgYXNzZXRzID0gcmVuZGVyZXIuYXNzZXRzLFxuICAgICAgbWF0ZXJpYWxzID0gcmVuZGVyZXIubWF0ZXJpYWxzLmluZGV4LFxuICAgICAgbWF0bW9kcyA9IHJlbmRlcmVyLm1hdG1vZHMuaW5kZXg7XG5cbiAgLy8gRG9uJ3QgYWxsb3cgcmVuZGVyaW5nIHVudGlsIHJlc291cmNlcyBhcmUgaW5kZXhlZC5cbiAgaWYgKCFtYXRlcmlhbHMgfHwgIW1hdG1vZHMpIHtcbiAgICB0aGlzLmRpcnR5LmJhY2tncm91bmQgPSB0cnVlO1xuICAgIHRoaXMuZGlydHkuZm9yZWdyb3VuZCA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU3RvcmUgZmxhZ3MgZm9yIGNob29zaW5nIHdoZXRoZXIgdG8gcmVuZGVyIGJhY2tncm91bmQvZm9yZWdyb3VuZCB0aWxlcy5cbiAgdmFyIGRyYXdCYWNrZ3JvdW5kID0gdGhpcy5kaXJ0eS5iYWNrZ3JvdW5kIHx8IHRoaXMuZGlydHkuZm9yZWdyb3VuZCxcbiAgICAgIGRyYXdGb3JlZ3JvdW5kID0gdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kO1xuXG4gIC8vIFByZXBhcmUgdGhlIHJlbmRlcmluZyBzdGVwLlxuICB2YXIgYmdDb250ZXh0ID0gYmcuZ2V0Q29udGV4dCgnMmQnKSwgZmdDb250ZXh0ID0gZmcuZ2V0Q29udGV4dCgnMmQnKTtcbiAgaWYgKGRyYXdCYWNrZ3JvdW5kKSBiZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGJnLndpZHRoLCBiZy5oZWlnaHQpO1xuICBpZiAoZHJhd0ZvcmVncm91bmQpIGZnQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgZmcud2lkdGgsIGZnLmhlaWdodCk7XG5cbiAgLy8gUmVzZXQgZGlydHkgZmxhZ3Mgbm93IHNvIHRoYXQgdGhlIGNvZGUgYmVsb3cgY2FuIHJlc2V0IHRoZW0gaWYgbmVlZGVkLlxuICB0aGlzLmRpcnR5LmJhY2tncm91bmQgPSBmYWxzZTtcbiAgdGhpcy5kaXJ0eS5mb3JlZ3JvdW5kID0gZmFsc2U7XG5cbiAgdmFyIHZpZXcgPSB0aGlzLnZpZXcsXG4gICAgICBiYWNrZ3JvdW5kSWQsIGZvcmVncm91bmRJZCwgZm9yZWdyb3VuZDtcblxuICAvLyBVc2VkIHRvIGRhcmtlbiBiYWNrZ3JvdW5kIHRpbGVzLlxuICBiZ0NvbnRleHQuZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgLjUpJztcblxuICB2YXIgbmVpZ2hib3JzID0gW1xuICAgIHRoaXMsIEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9ST1csXG4gICAgdGhpcywgSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9USUxFLFxuICAgIG51bGwsIG51bGwsXG4gICAgdGhpcy5uZWlnaGJvcnNbNF0sIEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1RJTEUsXG4gICAgdGhpcy5uZWlnaGJvcnNbNF0sIEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XLFxuICAgIHRoaXMubmVpZ2hib3JzWzVdLCBCWVRFU19QRVJfUkVHSU9OIC0gQllURVNfUEVSX1RJTEUsXG4gICAgbnVsbCwgbnVsbCxcbiAgICB0aGlzLm5laWdoYm9yc1s2XSwgSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9ST1cgLSBCWVRFU19QRVJfVElMRVxuICBdO1xuXG4gIHZhciB4ID0gMCwgeSA9IDAsIHN4ID0gMCwgc3kgPSBSRUdJT05fSEVJR0hUIC0gVElMRV9IRUlHSFQ7XG4gIGZvciAodmFyIG9mZnNldCA9IEhFQURFUl9CWVRFUzsgb2Zmc2V0IDwgQllURVNfUEVSX1JFR0lPTjsgb2Zmc2V0ICs9IEJZVEVTX1BFUl9USUxFKSB7XG4gICAgaWYgKHggPT0gMCkge1xuICAgICAgbmVpZ2hib3JzWzRdID0gdGhpcztcbiAgICAgIG5laWdoYm9yc1s1XSA9IG9mZnNldCArIEJZVEVTX1BFUl9USUxFO1xuXG4gICAgICBpZiAoeSA9PSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1s4XSA9IHRoaXM7XG4gICAgICAgIG5laWdoYm9yc1s5XSA9IEhFQURFUl9CWVRFUztcbiAgICAgIH1cblxuICAgICAgbmVpZ2hib3JzWzEyXSA9IHRoaXMubmVpZ2hib3JzWzZdO1xuICAgICAgbmVpZ2hib3JzWzEzXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFICsgQllURVNfUEVSX1JPVztcblxuICAgICAgaWYgKHkgPT0gVElMRVNfWSAtIDEpIHtcbiAgICAgICAgbmVpZ2hib3JzWzBdID0gdGhpcy5uZWlnaGJvcnNbMF07XG4gICAgICAgIG5laWdoYm9yc1sxXSA9IEhFQURFUl9CWVRFUztcbiAgICAgICAgbmVpZ2hib3JzWzJdID0gdGhpcy5uZWlnaGJvcnNbMF07XG4gICAgICAgIG5laWdoYm9yc1szXSA9IEhFQURFUl9CWVRFUyArIEJZVEVTX1BFUl9USUxFO1xuICAgICAgICBuZWlnaGJvcnNbMTRdID0gdGhpcy5uZWlnaGJvcnNbN107XG4gICAgICAgIG5laWdoYm9yc1sxNV0gPSBIRUFERVJfQllURVMgKyBCWVRFU19QRVJfUk9XIC0gQllURVNfUEVSX1RJTEU7XG4gICAgICB9IGVsc2UgaWYgKHkgPiAwKSB7XG4gICAgICAgIG5laWdoYm9yc1s2XSA9IHRoaXM7XG4gICAgICAgIG5laWdoYm9yc1s3XSA9IG9mZnNldCAtIEJZVEVTX1BFUl9ST1cgKyBCWVRFU19QRVJfVElMRTtcbiAgICAgICAgbmVpZ2hib3JzWzEwXSA9IHRoaXMubmVpZ2hib3JzWzZdO1xuICAgICAgICBuZWlnaGJvcnNbMTFdID0gb2Zmc2V0IC0gQllURVNfUEVSX1RJTEU7XG4gICAgICAgIG5laWdoYm9yc1sxNF0gPSB0aGlzLm5laWdoYm9yc1s2XTtcbiAgICAgICAgbmVpZ2hib3JzWzE1XSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFICsgQllURVNfUEVSX1JPVyArIEJZVEVTX1BFUl9ST1c7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh4ID09IDEpIHtcbiAgICAgIGlmICh5ID09IDApIHtcbiAgICAgICAgbmVpZ2hib3JzWzEwXSA9IHRoaXMubmVpZ2hib3JzWzRdO1xuICAgICAgICBuZWlnaGJvcnNbMTFdID0gQllURVNfUEVSX1JFR0lPTiAtIEJZVEVTX1BFUl9ST1c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZWlnaGJvcnNbMTBdID0gdGhpcztcbiAgICAgICAgbmVpZ2hib3JzWzExXSA9IG9mZnNldCAtIEJZVEVTX1BFUl9ST1cgLSBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cblxuICAgICAgbmVpZ2hib3JzWzEyXSA9IHRoaXM7XG4gICAgICBuZWlnaGJvcnNbMTNdID0gb2Zmc2V0IC0gQllURVNfUEVSX1RJTEU7XG5cbiAgICAgIGlmICh5ID09IFRJTEVTX1kgLSAxKSB7XG4gICAgICAgIG5laWdoYm9yc1sxNF0gPSB0aGlzLm5laWdoYm9yc1swXTtcbiAgICAgICAgbmVpZ2hib3JzWzE1XSA9IEhFQURFUl9CWVRFUztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5laWdoYm9yc1sxNF0gPSB0aGlzO1xuICAgICAgICBuZWlnaGJvcnNbMTVdID0gb2Zmc2V0ICsgQllURVNfUEVSX1JPVyAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeCA9PSBUSUxFU19YIC0gMSkge1xuICAgICAgaWYgKHkgPT0gVElMRVNfWSAtIDEpIHtcbiAgICAgICAgbmVpZ2hib3JzWzJdID0gdGhpcy5uZWlnaGJvcnNbMV07XG4gICAgICAgIG5laWdoYm9yc1szXSA9IEhFQURFUl9CWVRFUztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5laWdoYm9yc1syXSA9IHRoaXMubmVpZ2hib3JzWzJdO1xuICAgICAgICBuZWlnaGJvcnNbM10gPSBvZmZzZXQgKyBCWVRFU19QRVJfVElMRTtcbiAgICAgIH1cblxuICAgICAgbmVpZ2hib3JzWzRdID0gdGhpcy5uZWlnaGJvcnNbMl07XG4gICAgICBuZWlnaGJvcnNbNV0gPSBvZmZzZXQgLSBCWVRFU19QRVJfUk9XICsgQllURVNfUEVSX1RJTEU7XG5cbiAgICAgIGlmICh5ID09IDApIHtcbiAgICAgICAgbmVpZ2hib3JzWzZdID0gdGhpcy5uZWlnaGJvcnNbM107XG4gICAgICAgIG5laWdoYm9yc1s3XSA9IEJZVEVTX1BFUl9SRUdJT04gLSBCWVRFU19QRVJfUk9XO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3JzWzZdID0gdGhpcy5uZWlnaGJvcnNbMl07XG4gICAgICAgIG5laWdoYm9yc1s3XSA9IG9mZnNldCAtIEJZVEVTX1BFUl9USUxFO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IEZpZ3VyZSBvdXQgdGhlIHJlYWwgdmFyaWFudCBhbGdvcml0aG0uXG4gICAgdmFyIHZhcmlhbnQgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAyNTUpO1xuXG4gICAgZm9yZWdyb3VuZElkID0gdmlldy5nZXRJbnQxNihvZmZzZXQpO1xuICAgIGZvcmVncm91bmQgPSBtYXRlcmlhbHNbZm9yZWdyb3VuZElkXTtcblxuICAgIC8vIE9ubHkgcmVuZGVyIHRoZSBiYWNrZ3JvdW5kIGlmIHRoZSBmb3JlZ3JvdW5kIGRvZXNuJ3QgY292ZXIgaXQuXG4gICAgaWYgKGRyYXdCYWNrZ3JvdW5kICYmICghZm9yZWdyb3VuZCB8fCBmb3JlZ3JvdW5kLnRyYW5zcGFyZW50KSkge1xuICAgICAgaWYgKCF0aGlzLl9yZW5kZXJUaWxlKGJnQ29udGV4dCwgc3gsIHN5LCBhc3NldHMsIG1hdGVyaWFscywgbWF0bW9kcywgdmlldywgb2Zmc2V0LCA3LCB2YXJpYW50LCBuZWlnaGJvcnMpKSB7XG4gICAgICAgIHRoaXMuZGlydHkuYmFja2dyb3VuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIERhcmtlbiBiYWNrZ3JvdW5kIHRpbGVzLlxuICAgICAgYmdDb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtYXRvcCc7XG4gICAgICBiZ0NvbnRleHQuZmlsbFJlY3Qoc3gsIHN5LCA4LCA4KTtcbiAgICAgIGJnQ29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciB0aGUgZm9yZWdyb3VuZCB0aWxlIGFuZC9vciBlZGdlcy5cbiAgICBpZiAoZHJhd0ZvcmVncm91bmQpIHtcbiAgICAgIGlmICghdGhpcy5fcmVuZGVyVGlsZShmZ0NvbnRleHQsIHN4LCBzeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgMCwgdmFyaWFudCwgbmVpZ2hib3JzKSkge1xuICAgICAgICB0aGlzLmRpcnR5LmZvcmVncm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IE9ubHkgaW5jcmVtZW50IHRoZSBvZmZzZXRzIHRoYXQgYWN0dWFsbHkgbmVlZCBpdC5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IDE2OyBpICs9IDIpIHtcbiAgICAgIG5laWdoYm9yc1tpXSArPSBCWVRFU19QRVJfVElMRTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIG5leHQgc2V0IG9mIFgsIFkgY29vcmRpbmF0ZXMuXG4gICAgaWYgKCsreCA9PSAzMikge1xuICAgICAgeCA9IDA7IHkrKztcbiAgICAgIHN4ID0gMDsgc3kgLT0gVElMRV9IRUlHSFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN4ICs9IFRJTEVfV0lEVEg7XG4gICAgfVxuICB9XG59O1xuXG5SZWdpb25SZW5kZXJlci5wcm90b3R5cGUuX3JlbmRlclRpbGUgPSBmdW5jdGlvbiAoY29udGV4dCwgeCwgeSwgYXNzZXRzLCBtYXRlcmlhbHMsIG1hdG1vZHMsIHZpZXcsIG9mZnNldCwgZGVsdGEsIHZhcmlhbnQsIG5laWdoYm9ycykge1xuICB2YXIgbWNlbnRlciA9IHZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgZGVsdGEpLFxuICAgICAgbXRvcCA9IGdldEludDE2KG5laWdoYm9yc1swXSwgbmVpZ2hib3JzWzFdICsgZGVsdGEpLFxuICAgICAgbXJpZ2h0ID0gZ2V0SW50MTYobmVpZ2hib3JzWzRdLCBuZWlnaGJvcnNbNV0gKyBkZWx0YSksXG4gICAgICBtYm90dG9tID0gZ2V0SW50MTYobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSksXG4gICAgICBtbGVmdCA9IGdldEludDE2KG5laWdoYm9yc1sxMl0sIG5laWdoYm9yc1sxM10gKyBkZWx0YSksXG4gICAgICBpY2VudGVyLCBpdG9wLCBpcmlnaHQsIGlib3R0b20sIGlsZWZ0LFxuICAgICAgb2NlbnRlciwgb3RvcCwgb3JpZ2h0LCBvYm90dG9tLCBvbGVmdCxcbiAgICAgIHZjZW50ZXIsIHZ0b3AsIHZyaWdodCwgdmJvdHRvbSwgdmxlZnQ7XG5cbiAgdmFyIGR0b3AgPSBtdG9wID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG10b3ApLFxuICAgICAgZHJpZ2h0ID0gbXJpZ2h0ID4gMCAmJiAobWNlbnRlciA8IDEgfHwgbWNlbnRlciA+IG1yaWdodCksXG4gICAgICBkYm90dG9tID0gbWJvdHRvbSA+IDAgJiYgKG1jZW50ZXIgPCAxIHx8IG1jZW50ZXIgPiBtYm90dG9tKSxcbiAgICAgIGRsZWZ0ID0gbWxlZnQgPiAwICYmIChtY2VudGVyIDwgMSB8fCBtY2VudGVyID4gbWxlZnQpO1xuXG4gIGlmIChkdG9wKSB7XG4gICAgb3RvcCA9IG1hdGVyaWFsc1ttdG9wXTtcbiAgICBpZiAoIW90b3ApIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvdG9wLnBsYXRmb3JtKSB7XG4gICAgICBkdG9wID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0b3AgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG90b3AsICdmcmFtZXMnLCBnZXRVaW50OChuZWlnaGJvcnNbMF0sIG5laWdoYm9yc1sxXSArIGRlbHRhICsgMikpO1xuICAgICAgaWYgKCFpdG9wKSByZXR1cm4gZmFsc2U7XG4gICAgICB2dG9wID0gdmFyaWFudCAlIG90b3AudmFyaWFudHMgKiAxNjtcbiAgICB9XG4gIH1cblxuICBpZiAoZHJpZ2h0KSB7XG4gICAgb3JpZ2h0ID0gbWF0ZXJpYWxzW21yaWdodF07XG4gICAgaWYgKCFvcmlnaHQpIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChvcmlnaHQucGxhdGZvcm0pIHtcbiAgICAgIGRyaWdodCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpcmlnaHQgPSBhc3NldHMuZ2V0VGlsZUltYWdlKG9yaWdodCwgJ2ZyYW1lcycsIGdldFVpbnQ4KG5laWdoYm9yc1s0XSwgbmVpZ2hib3JzWzVdICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWlyaWdodCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdnJpZ2h0ID0gdmFyaWFudCAlIG9yaWdodC52YXJpYW50cyAqIDE2O1xuICAgIH1cbiAgfVxuXG4gIGlmIChkbGVmdCkge1xuICAgIG9sZWZ0ID0gbWF0ZXJpYWxzW21sZWZ0XTtcbiAgICBpZiAoIW9sZWZ0KSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob2xlZnQucGxhdGZvcm0pIHtcbiAgICAgIGRsZWZ0ID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlsZWZ0ID0gYXNzZXRzLmdldFRpbGVJbWFnZShvbGVmdCwgJ2ZyYW1lcycsIGdldFVpbnQ4KG5laWdoYm9yc1sxMl0sIG5laWdoYm9yc1sxM10gKyBkZWx0YSArIDIpKTtcbiAgICAgIGlmICghaWxlZnQpIHJldHVybiBmYWxzZTtcbiAgICAgIHZsZWZ0ID0gdmFyaWFudCAlIG9sZWZ0LnZhcmlhbnRzICogMTY7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBvYm90dG9tID0gbWF0ZXJpYWxzW21ib3R0b21dO1xuICAgIGlmICghb2JvdHRvbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG9ib3R0b20ucGxhdGZvcm0pIHtcbiAgICAgIGRib3R0b20gPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWJvdHRvbSA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob2JvdHRvbSwgJ2ZyYW1lcycsIGdldFVpbnQ4KG5laWdoYm9yc1s4XSwgbmVpZ2hib3JzWzldICsgZGVsdGEgKyAyKSk7XG4gICAgICBpZiAoIWlib3R0b20pIHJldHVybiBmYWxzZTtcbiAgICAgIHZib3R0b20gPSB2YXJpYW50ICUgb2JvdHRvbS52YXJpYW50cyAqIDE2O1xuICAgIH1cbiAgfVxuXG4gIGlmIChtY2VudGVyID4gMCkge1xuICAgIG9jZW50ZXIgPSBtYXRlcmlhbHNbbWNlbnRlcl07XG4gICAgaWYgKCFvY2VudGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgICB2YXIgaHVlU2hpZnQgPSB2aWV3LmdldFVpbnQ4KG9mZnNldCArIGRlbHRhICsgMik7XG5cbiAgICBpZiAob2NlbnRlci5wbGF0Zm9ybSkge1xuICAgICAgaWNlbnRlciA9IGFzc2V0cy5nZXRUaWxlSW1hZ2Uob2NlbnRlciwgJ3BsYXRmb3JtSW1hZ2UnLCBodWVTaGlmdCk7XG4gICAgICBpZiAoIWljZW50ZXIpIHJldHVybiBmYWxzZTtcblxuICAgICAgdmNlbnRlciA9IHZhcmlhbnQgJSBvY2VudGVyLnBsYXRmb3JtVmFyaWFudHMgKiA4O1xuICAgICAgaWYgKG1sZWZ0ID4gMCAmJiBtbGVmdCAhPSBtY2VudGVyICYmIG1yaWdodCA+IDAgJiYgbXJpZ2h0ICE9IG1jZW50ZXIpIHtcbiAgICAgICAgdmNlbnRlciArPSAyNCAqIG9jZW50ZXIucGxhdGZvcm1WYXJpYW50cztcbiAgICAgIH0gZWxzZSBpZiAobXJpZ2h0ID4gMCAmJiBtcmlnaHQgIT0gbWNlbnRlcikge1xuICAgICAgICB2Y2VudGVyICs9IDE2ICogb2NlbnRlci5wbGF0Zm9ybVZhcmlhbnRzO1xuICAgICAgfSBlbHNlIGlmIChtbGVmdCA8IDEgfHwgbWxlZnQgPT0gbWNlbnRlcikge1xuICAgICAgICB2Y2VudGVyICs9IDggKiBvY2VudGVyLnBsYXRmb3JtVmFyaWFudHM7XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGljZW50ZXIsIHZjZW50ZXIsIDAsIDgsIDgsIHgsIHksIDgsIDgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpY2VudGVyID0gYXNzZXRzLmdldFRpbGVJbWFnZShvY2VudGVyLCAnZnJhbWVzJywgaHVlU2hpZnQpO1xuICAgICAgaWYgKCFpY2VudGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHZjZW50ZXIgPSB2YXJpYW50ICUgb2NlbnRlci52YXJpYW50cyAqIDE2O1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWNlbnRlciwgdmNlbnRlciArIDQsIDEyLCA4LCA4LCB4LCB5LCA4LCA4KTtcbiAgICB9XG4gIH1cblxuICBpZiAoZHRvcCkge1xuICAgIGlmIChtdG9wID09IG1sZWZ0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wLCAwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG10b3AgPCBtbGVmdCkge1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDQsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDQsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDEyLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGxlZnQpIHtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICB9XG5cbiAgeCArPSA0O1xuXG4gIGlmIChkdG9wKSB7XG4gICAgaWYgKG10b3AgPT0gbXJpZ2h0KSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpdG9wLCB2dG9wICsgNCwgMCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtdG9wIDwgbXJpZ2h0KSB7XG4gICAgICBpZiAoZHJpZ2h0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpcmlnaHQsIHZyaWdodCwgMTIsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDgsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaXRvcCwgdnRvcCArIDgsIDIwLCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRyaWdodCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxMiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICB5ICs9IDQ7XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBpZiAobWJvdHRvbSA9PSBtcmlnaHQpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA0LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2UgaWYgKG1ib3R0b20gPCBtcmlnaHQpIHtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpYm90dG9tLCB2Ym90dG9tICsgOCwgOCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA4LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGlmIChkcmlnaHQpXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGRyaWdodCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlyaWdodCwgdnJpZ2h0LCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICB4IC09IDQ7XG5cbiAgaWYgKGRib3R0b20pIHtcbiAgICBpZiAobWJvdHRvbSA9PSBtbGVmdCkge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSwgNCwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gICAgfSBlbHNlIGlmIChtYm90dG9tIDwgbWxlZnQpIHtcbiAgICAgIGlmIChkbGVmdClcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWxlZnQsIHZsZWZ0ICsgMTIsIDE2LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGlib3R0b20sIHZib3R0b20gKyA0LCA4LCA0LCA0LCB4LCB5LCA0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaWJvdHRvbSwgdmJvdHRvbSArIDQsIDgsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgICAgaWYgKGRsZWZ0KVxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbGVmdCwgdmxlZnQgKyAxMiwgMTYsIDQsIDQsIHgsIHksIDQsIDQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChkbGVmdCkge1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGlsZWZ0LCB2bGVmdCArIDEyLCAxNiwgNCwgNCwgeCwgeSwgNCwgNCk7XG4gIH1cblxuICAvLyBUT0RPOiBGaWd1cmUgb3V0IGhvdyBtYXRtb2RzIHdvcmsuXG4gIC8vIFJlbmRlciB0aGUgbWF0bW9kIGZvciB0aGlzIHRpbGUuXG4gIHZhciBtb2RJZCA9IHZpZXcuZ2V0SW50MTYob2Zmc2V0ICsgZGVsdGEgKyA0KSwgbW9kLCBtb2RJbWFnZTtcbiAgaWYgKG1vZElkID4gMCkge1xuICAgIG1vZCA9IG1hdG1vZHNbbW9kSWRdO1xuICAgIGlmICghbW9kKSByZXR1cm4gZmFsc2U7XG5cbiAgICBtb2RJbWFnZSA9IGFzc2V0cy5nZXRUaWxlSW1hZ2UobW9kLCAnZnJhbWVzJywgdmlldy5nZXRVaW50OChvZmZzZXQgKyBkZWx0YSArIDYpKTtcbiAgICBpZiAoIW1vZEltYWdlKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb250ZXh0LmRyYXdJbWFnZShtb2RJbWFnZSwgNCArIHZhcmlhbnQgJSBtb2QudmFyaWFudHMgKiAxNiwgMTIsIDgsIDgsIHgsIHkgLSA0LCA4LCA4KTtcbiAgfVxuXG4gIC8vIFJlbmRlciB0aGUgbWF0bW9kIG9mIHRoZSB0aWxlIGJlbG93IHRoaXMgb25lIChpZiBpdCBvdmVyZmxvd3MpLlxuICBpZiAoIW9jZW50ZXIgJiYgbmVpZ2hib3JzWzhdKSB7XG4gICAgbW9kSWQgPSBnZXRJbnQxNihuZWlnaGJvcnNbOF0sIG5laWdoYm9yc1s5XSArIGRlbHRhICsgNCk7XG4gICAgaWYgKG1vZElkID4gMCkge1xuICAgICAgbW9kID0gbWF0bW9kc1ttb2RJZF07XG4gICAgICBpZiAoIW1vZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBtb2RJbWFnZSA9IGFzc2V0cy5nZXRUaWxlSW1hZ2UobW9kLCAnZnJhbWVzJywgZ2V0VWludDgobmVpZ2hib3JzWzhdLCBuZWlnaGJvcnNbOV0gKyBkZWx0YSArIDYpKTtcbiAgICAgIGlmICghbW9kSW1hZ2UpIHJldHVybiBmYWxzZTtcblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UobW9kSW1hZ2UsIDQgKyB2YXJpYW50ICUgbW9kLnZhcmlhbnRzICogMTYsIDgsIDgsIDQsIHgsIHksIDgsIDQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gV29ybGQ7XG5cbmZ1bmN0aW9uIFdvcmxkKG1hbmFnZXIsIGZpbGUsIGluZm8pIHtcbiAgdGhpcy5faGFuZGxlID0gaW5mby5oYW5kbGU7XG4gIHRoaXMuX21hbmFnZXIgPSBtYW5hZ2VyO1xuXG4gIHRoaXMubGFzdE1vZGlmaWVkID0gZmlsZS5sYXN0TW9kaWZpZWREYXRlO1xuICB0aGlzLm1ldGFkYXRhID0gaW5mby5tZXRhZGF0YTtcblxuICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBsb2dpYyBvbmNlIHdvcmxkIG1ldGFkYXRhIGlzIGF1dG9tYXRpY2FsbHkgdXBncmFkZWQuXG4gIHZhciBsb2NhdGlvbiwgZGF0YSwgcGFyYW1zO1xuICBzd2l0Y2ggKGluZm8ubWV0YWRhdGEuX192ZXJzaW9uX18pIHtcbiAgICBjYXNlIDE6XG4gICAgICBkYXRhID0gaW5mby5tZXRhZGF0YS5wbGFuZXQ7XG4gICAgICBwYXJhbXMgPSBkYXRhLmNvbmZpZy5jZWxlc3RpYWxQYXJhbWV0ZXJzO1xuXG4gICAgICB2YXIgY29vcmQgPSBkYXRhLmNvbmZpZy5za3lQYXJhbWV0ZXJzLmNvb3JkaW5hdGU7XG4gICAgICBpZiAoY29vcmQpIHtcbiAgICAgICAgbG9jYXRpb24gPSBjb29yZC5wYXJlbnRTeXN0ZW0ubG9jYXRpb247XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICBjYXNlIDM6XG4gICAgICBkYXRhID0gaW5mby5tZXRhZGF0YS53b3JsZFRlbXBsYXRlO1xuICAgICAgcGFyYW1zID0gZGF0YS5jZWxlc3RpYWxQYXJhbWV0ZXJzO1xuXG4gICAgICBpZiAocGFyYW1zKSB7XG4gICAgICAgIGxvY2F0aW9uID0gcGFyYW1zLmNvb3JkaW5hdGUubG9jYXRpb247XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIG1ldGFkYXRhIHZlcnNpb24gJyArIG1ldGFkYXRhLl9fdmVyc2lvbl9fKTtcbiAgfVxuXG4gIHRoaXMudGlsZXNYID0gZGF0YS5zaXplWzBdO1xuICB0aGlzLnRpbGVzWSA9IGRhdGEuc2l6ZVsxXTtcblxuICB0aGlzLnNwYXduWCA9IGluZm8ubWV0YWRhdGEucGxheWVyU3RhcnRbMF07XG4gIHRoaXMuc3Bhd25ZID0gaW5mby5tZXRhZGF0YS5wbGF5ZXJTdGFydFsxXTtcblxuICAvLyBTaGlwcyBkb24ndCBoYXZlIG5hbWUgb3IgbG9jYXRpb24uXG4gIGlmIChwYXJhbXMpIHtcbiAgICB0aGlzLm5hbWUgPSBwYXJhbXMubmFtZTtcbiAgICB0aGlzLmJpb21lID0gcGFyYW1zLnByaW1hcnlCaW9tZU5hbWUgfHwgcGFyYW1zLnNjYW5EYXRhLnByaW1hcnlCaW9tZU5hbWU7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGZpbGUubmFtZS5tYXRjaCgvXFwuc2hpcHdvcmxkJC8pKSB7XG4gICAgICB0aGlzLm5hbWUgPSAnU2hpcCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubmFtZSA9ICdVbmtub3duJztcbiAgICB9XG4gICAgdGhpcy5iaW9tZSA9IG51bGw7XG4gIH1cblxuICBpZiAobG9jYXRpb24pIHtcbiAgICB0aGlzLnggPSBsb2NhdGlvblswXTtcbiAgICB0aGlzLnkgPSBsb2NhdGlvblsxXTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnggPSBudWxsO1xuICAgIHRoaXMueSA9IG51bGw7XG4gIH1cbn1cblxuV29ybGQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHRoaXMuX21hbmFnZXIuYXBpLmNsb3NlKHRoaXMuX2hhbmRsZSwgY2FsbGJhY2spO1xuICB0aGlzLl9tYW5hZ2VyID0gbnVsbDtcbiAgdGhpcy5faGFuZGxlID0gLTE7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuZ2V0UmVnaW9uID0gZnVuY3Rpb24gKHgsIHksIGNhbGxiYWNrKSB7XG4gIGlmICghdGhpcy5fbWFuYWdlcikgdGhyb3cgbmV3IEVycm9yKCdUaGUgd29ybGQgZmlsZSBpcyBjbG9zZWQnKTtcbiAgdGhpcy5fbWFuYWdlci5hcGkuZ2V0UmVnaW9uKHRoaXMuX2hhbmRsZSwgeCwgeSwgY2FsbGJhY2spO1xufTtcblxuV29ybGQucHJvdG90eXBlLmlzT3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICEhdGhpcy5fbWFuYWdlcjtcbn07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgd29ya2VycHJveHkgPSByZXF1aXJlKCd3b3JrZXJwcm94eScpO1xuXG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRNYW5hZ2VyO1xuXG5mdW5jdGlvbiBXb3JsZE1hbmFnZXIob3B0X29wdGlvbnMpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgd29ya2VyUGF0aDogX19kaXJuYW1lICsgJy93b3JrZXIuanMnXG4gIH07XG5cbiAgT2JqZWN0LnNlYWwob3B0aW9ucyk7XG4gIG1lcmdlKG9wdGlvbnMsIG9wdF9vcHRpb25zKTtcbiAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKG9wdGlvbnMud29ya2VyUGF0aCk7XG4gIHRoaXMuYXBpID0gd29ya2VycHJveHkod29ya2VyKTtcbn1cbnV0aWwuaW5oZXJpdHMoV29ybGRNYW5hZ2VyLCBFdmVudEVtaXR0ZXIpO1xuXG5Xb3JsZE1hbmFnZXIucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAoZmlsZSwgb3B0X2NhbGxiYWNrKSB7XG4gIHRoaXMuYXBpLm9wZW4oZmlsZSwgKGVyciwgaW5mbykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGlmIChvcHRfY2FsbGJhY2spIG9wdF9jYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IENvbnZlcnQgbWV0YWRhdGEgdG8gbGF0ZXN0IHZlcnNpb24uXG4gICAgdmFyIHdvcmxkID0gbmV3IFdvcmxkKHRoaXMsIGZpbGUsIGluZm8pO1xuICAgIHRoaXMuZW1pdCgnbG9hZCcsIHt3b3JsZDogd29ybGR9KTtcbiAgICBpZiAob3B0X2NhbGxiYWNrKSBvcHRfY2FsbGJhY2soZXJyLCB3b3JsZCk7XG4gIH0pO1xufTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG52YXIgUmVnaW9uUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlZ2lvbnJlbmRlcmVyJyk7XG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGRSZW5kZXJlcjtcblxuXG52YXIgVElMRVNfWCA9IDMyO1xudmFyIFRJTEVTX1kgPSAzMjtcbnZhciBUSUxFU19QRVJfUkVHSU9OID0gVElMRVNfWCAqIFRJTEVTX1k7XG5cbnZhciBIRUFERVJfQllURVMgPSAzO1xudmFyIEJZVEVTX1BFUl9USUxFID0gMjM7XG52YXIgQllURVNfUEVSX1JPVyA9IEJZVEVTX1BFUl9USUxFICogVElMRVNfWDtcbnZhciBCWVRFU19QRVJfUkVHSU9OID0gSEVBREVSX0JZVEVTICsgQllURVNfUEVSX1RJTEUgKiBUSUxFU19QRVJfUkVHSU9OO1xuXG52YXIgVElMRV9XSURUSCA9IDg7XG52YXIgVElMRV9IRUlHSFQgPSA4O1xuXG52YXIgUkVHSU9OX1dJRFRIID0gVElMRV9XSURUSCAqIFRJTEVTX1g7XG52YXIgUkVHSU9OX0hFSUdIVCA9IFRJTEVfSEVJR0hUICogVElMRVNfWTtcblxudmFyIE1JTl9aT09NID0gLjE7XG52YXIgTUFYX1pPT00gPSAzO1xuXG5cbmZ1bmN0aW9uIFdvcmxkUmVuZGVyZXIodmlld3BvcnQsIGFzc2V0c01hbmFnZXIsIG9wdF93b3JsZCkge1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICAvLyBFbnN1cmUgdGhhdCBjYW52YXNlcyBjYW4gYmUgYW5jaG9yZWQgdG8gdGhlIHZpZXdwb3J0LlxuICB2YXIgcG9zaXRpb24gPSBnZXRDb21wdXRlZFN0eWxlKHZpZXdwb3J0KS5nZXRQcm9wZXJ0eVZhbHVlKCdwb3NpdGlvbicpO1xuICBpZiAocG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAncmVsYXRpdmUnKSB7XG4gICAgdmlld3BvcnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICB9XG5cbiAgdGhpcy52aWV3cG9ydCA9IHZpZXdwb3J0O1xuICB0aGlzLmFzc2V0cyA9IGFzc2V0c01hbmFnZXI7XG4gIHRoaXMud29ybGQgPSBvcHRfd29ybGQgfHwgbnVsbDtcblxuICB0aGlzLmNlbnRlclggPSAwO1xuICB0aGlzLmNlbnRlclkgPSAwO1xuICB0aGlzLnpvb20gPSAxO1xuXG4gIHRoaXMudmlld3BvcnRYID0gMDtcbiAgdGhpcy52aWV3cG9ydFkgPSAwO1xuICB0aGlzLnNjcmVlblJlZ2lvbldpZHRoID0gUkVHSU9OX1dJRFRIO1xuICB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCA9IFJFR0lPTl9IRUlHSFQ7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcubWF0ZXJpYWwnKTtcbiAgdGhpcy5tYXRtb2RzID0gYXNzZXRzTWFuYWdlci5nZXRSZXNvdXJjZUxvYWRlcignLm1hdG1vZCcpO1xuICB0aGlzLm9iamVjdHMgPSBhc3NldHNNYW5hZ2VyLmdldFJlc291cmNlTG9hZGVyKCcub2JqZWN0Jyk7XG5cbiAgdGhpcy5hc3NldHMub24oJ2ltYWdlcycsICgpID0+IHRoaXMucmVxdWVzdFJlbmRlcigpKTtcbiAgdGhpcy5hc3NldHMub24oJ3Jlc291cmNlcycsICgpID0+IHRoaXMucmVxdWVzdFJlbmRlcigpKTtcblxuICB0aGlzLl9jYW52YXNQb29sID0gW107XG4gIHRoaXMuX2ZyZWVQb29sID0gbnVsbDtcbiAgdGhpcy5fcG9vbExvb2t1cCA9IG51bGw7XG5cbiAgdGhpcy5fYmFja2dyb3VuZHMgPSBbXTtcbiAgdGhpcy5fcmVnaW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgdGhpcy5fYm91bmRzID0gdmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHRoaXMuX3JlZ2lvbnNYID0gMDtcbiAgdGhpcy5fcmVnaW9uc1kgPSAwO1xuICB0aGlzLl90aWxlc1ggPSAwO1xuICB0aGlzLl90aWxlc1kgPSAwO1xuICB0aGlzLl9mcm9tUmVnaW9uWCA9IDA7XG4gIHRoaXMuX2Zyb21SZWdpb25ZID0gMDtcbiAgdGhpcy5fdG9SZWdpb25YID0gMDtcbiAgdGhpcy5fdG9SZWdpb25ZID0gMDtcbiAgdGhpcy5fdmlzaWJsZVJlZ2lvbnNYID0gMDtcbiAgdGhpcy5fdmlzaWJsZVJlZ2lvbnNZID0gMDtcblxuICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgdGhpcy5fcmVxdWVzdGluZ1JlbmRlciA9IGZhbHNlO1xuICB0aGlzLl9zZXR1cCA9IGZhbHNlO1xuXG4gIC8vIFNldCB1cCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgd29ybGQgaWYgaXQncyBhdmFpbGFibGUuXG4gIGlmICh0aGlzLndvcmxkKSB7XG4gICAgdGhpcy5fbG9hZE1ldGFkYXRhKCk7XG4gIH1cbn1cbnV0aWwuaW5oZXJpdHMoV29ybGRSZW5kZXJlciwgRXZlbnRFbWl0dGVyKTtcblxuLyoqXG4gKiBDZW50ZXJzIHRoZSByZW5kZXJlciB2aWV3cG9ydCBvbiB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbGVYIFRoZSBYIGluLWdhbWUgY29vcmRpbmF0ZSB0byBjZW50ZXIgb24uXG4gKiBAcGFyYW0ge251bWJlcn0gdGlsZVkgVGhlIFkgaW4tZ2FtZSBjb29yZGluYXRlIHRvIGNlbnRlciBvbi5cbiAqL1xuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24gKHRpbGVYLCB0aWxlWSkge1xuICB0aGlzLmNlbnRlclggPSB0aWxlWDtcbiAgdGhpcy5jZW50ZXJZID0gdGlsZVk7XG4gIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5nZXRDYW52YXMgPSBmdW5jdGlvbiAocmVnaW9uLCB6LCBvcHRfd2lkdGgsIG9wdF9oZWlnaHQpIHtcbiAgdmFyIGtleSA9IHJlZ2lvbi54ICsgJzonICsgcmVnaW9uLnkgKyAnOicgKyB6O1xuXG4gIHZhciBpdGVtID0gdGhpcy5fcG9vbExvb2t1cFtrZXldLCBjYW52YXM7XG5cbiAgaWYgKGl0ZW0pIHtcbiAgICBjYW52YXMgPSBpdGVtLmNhbnZhcztcbiAgfSBlbHNlIHtcbiAgICBpZiAodGhpcy5fZnJlZVBvb2wubGVuZ3RoKSB7XG4gICAgICBpdGVtID0gdGhpcy5fZnJlZVBvb2wucG9wKCk7XG4gICAgICBjYW52YXMgPSBpdGVtLmNhbnZhcztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ3JlYXRlIG5ldyA8Y2FudmFzPiBlbGVtZW50cyBhcyB0aGV5IGFyZSBuZWVkZWQuXG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICBjYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgICAvLyBSZWdpc3RlciB0aGUgbmV3IGNhbnZhcyBpbiB0aGUgcG9vbC5cbiAgICAgIGl0ZW0gPSB7Y2FudmFzOiBjYW52YXMsIHJlZ2lvbjogcmVnaW9uLCB6OiB6fTtcbiAgICAgIHRoaXMuX2NhbnZhc1Bvb2wucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICBpdGVtLnogPSB6O1xuICAgIGl0ZW0ucmVnaW9uID0gcmVnaW9uO1xuICAgIHRoaXMuX3Bvb2xMb29rdXBba2V5XSA9IGl0ZW07XG5cbiAgICAvLyBNYXJrIHRoZSByZWdpb24gYXMgZGlydHkgc2luY2UgaXQncyBub3QgcmV1c2luZyBhIGNhbnZhcy5cbiAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgfVxuXG4gIC8vIE9ubHkgcmVzaXplIHRoZSBjYW52YXMgaWYgbmVjZXNzYXJ5LCBzaW5jZSByZXNpemluZyBjbGVhcnMgdGhlIGNhbnZhcy5cbiAgdmFyIHdpZHRoID0gdHlwZW9mIG9wdF93aWR0aCA9PSAnbnVtYmVyJyA/IG9wdF93aWR0aCA6IGNhbnZhcy53aWR0aCxcbiAgICAgIGhlaWdodCA9IHR5cGVvZiBvcHRfaGVpZ2h0ID09ICdudW1iZXInID8gb3B0X2hlaWdodCA6IGNhbnZhcy5oZWlnaHQ7XG5cbiAgaWYgKGNhbnZhcy53aWR0aCAhPSB3aWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9IGhlaWdodCkge1xuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgcmVnaW9uLnNldERpcnR5KCk7XG4gIH1cblxuICBjYW52YXMuc3R5bGUud2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy56b29tKSArICdweCc7XG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBNYXRoLnJvdW5kKGhlaWdodCAqIHRoaXMuem9vbSkgKyAncHgnO1xuICBjYW52YXMuc3R5bGUuekluZGV4ID0gejtcblxuICByZXR1cm4gY2FudmFzO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuZ2V0UmVnaW9uID0gZnVuY3Rpb24gKHJlZ2lvblgsIHJlZ2lvblksIG9wdF9za2lwTmVpZ2hib3JzKSB7XG4gIGlmICghdGhpcy5fbG9hZGVkKSByZXR1cm4gbnVsbDtcblxuICAvLyBXcmFwIHRoZSBYIGF4aXMuXG4gIGlmIChyZWdpb25YID49IHRoaXMuX3JlZ2lvbnNYKSB7XG4gICAgcmVnaW9uWCAtPSB0aGlzLl9yZWdpb25zWDtcbiAgfSBlbHNlIGlmIChyZWdpb25YIDwgMCkge1xuICAgIHJlZ2lvblggKz0gdGhpcy5fcmVnaW9uc1g7XG4gIH1cblxuICAvLyBUaGUgWSBheGlzIGRvZXNuJ3Qgd3JhcC5cbiAgaWYgKHJlZ2lvblkgPCAwIHx8IHJlZ2lvblkgPj0gdGhpcy5fcmVnaW9uc1kpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBrZXkgPSByZWdpb25YICsgJzonICsgcmVnaW9uWTtcblxuICAvLyBHZXQgb3IgY3JlYXRlIHRoZSByZWdpb24uXG4gIHZhciByZWdpb247XG4gIGlmIChrZXkgaW4gdGhpcy5fcmVnaW9ucykge1xuICAgIHJlZ2lvbiA9IHRoaXMuX3JlZ2lvbnNba2V5XTtcbiAgfSBlbHNlIHtcbiAgICByZWdpb24gPSBuZXcgUmVnaW9uUmVuZGVyZXIocmVnaW9uWCwgcmVnaW9uWSk7XG4gICAgdGhpcy5fcmVnaW9uc1trZXldID0gcmVnaW9uO1xuICB9XG5cbiAgLy8gTG9hZCB0aGUgcmVnaW9uIGRhdGEgaWYgaXQgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldC5cbiAgaWYgKHJlZ2lvbi5zdGF0ZSA9PSBSZWdpb25SZW5kZXJlci5TVEFURV9VTklOSVRJQUxJWkVEKSB7XG4gICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfTE9BRElORztcblxuICAgIHRoaXMud29ybGQuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblksIChlcnIsIHJlZ2lvbkRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfRVJST1I7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZSAhPSAnS2V5IG5vdCBmb3VuZCcpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChyZWdpb25EYXRhLmJ1ZmZlci5ieXRlTGVuZ3RoICE9IEJZVEVTX1BFUl9SRUdJT04pIHtcbiAgICAgICAgcmVnaW9uLnN0YXRlID0gUmVnaW9uUmVuZGVyZXIuU1RBVEVfRVJST1I7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvcnJ1cHRlZCByZWdpb24gJyArIHJlZ2lvblggKyAnLCAnICsgcmVnaW9uWSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVnaW9uLmVudGl0aWVzID0gcmVnaW9uRGF0YS5lbnRpdGllcztcbiAgICAgIHJlZ2lvbi52aWV3ID0gbmV3IERhdGFWaWV3KHJlZ2lvbkRhdGEuYnVmZmVyKTtcbiAgICAgIHJlZ2lvbi5zdGF0ZSA9IFJlZ2lvblJlbmRlcmVyLlNUQVRFX1JFQURZO1xuXG4gICAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgICAgIHRoaXMucmVxdWVzdFJlbmRlcigpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIHJlZ2lvbiBzaG91bGQgbm90IGdldCBuZWlnaGJvcnMsIHJldHVybiBub3cuXG4gIGlmIChvcHRfc2tpcE5laWdoYm9ycykgcmV0dXJuIHJlZ2lvbjtcblxuICAvLyBBZGQgcmVmZXJlbmNlcyB0byBzdXJyb3VuZGluZyByZWdpb25zLlxuICBpZiAoIXJlZ2lvbi5uZWlnaGJvcnMpIHtcbiAgICByZWdpb24ubmVpZ2hib3JzID0gW1xuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCwgcmVnaW9uWSArIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCArIDEsIHJlZ2lvblkgKyAxLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggKyAxLCByZWdpb25ZLCB0cnVlKSxcbiAgICAgIHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblggKyAxLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YLCByZWdpb25ZIC0gMSwgdHJ1ZSksXG4gICAgICB0aGlzLmdldFJlZ2lvbihyZWdpb25YIC0gMSwgcmVnaW9uWSAtIDEsIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCAtIDEsIHJlZ2lvblksIHRydWUpLFxuICAgICAgdGhpcy5nZXRSZWdpb24ocmVnaW9uWCAtIDEsIHJlZ2lvblkgKyAxLCB0cnVlKVxuICAgIF07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgdmFyIG5laWdoYm9yID0gcmVnaW9uLm5laWdoYm9yc1tpXTtcbiAgICAgIGlmICghbmVpZ2hib3IpIGNvbnRpbnVlO1xuICAgICAgbmVpZ2hib3Iuc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICByZWdpb24uc2V0RGlydHkoKTtcbiAgICB0aGlzLnJlcXVlc3RSZW5kZXIoKTtcbiAgfVxuXG4gIHJldHVybiByZWdpb247XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5pc1JlZ2lvblZpc2libGUgPSBmdW5jdGlvbiAocmVnaW9uKSB7XG4gIGlmICghcmVnaW9uKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGZyb21YID0gdGhpcy5fZnJvbVJlZ2lvblgsIHRvWCA9IHRoaXMuX3RvUmVnaW9uWCxcbiAgICAgIGZyb21ZID0gdGhpcy5fZnJvbVJlZ2lvblksIHRvWSA9IHRoaXMuX3RvUmVnaW9uWTtcblxuICB2YXIgdmlzaWJsZVkgPSByZWdpb24ueSA+PSBmcm9tWSAmJiByZWdpb24ueSA8IHRvWTtcbiAgdmFyIHZpc2libGVYID0gKHJlZ2lvbi54ID49IGZyb21YICYmIHJlZ2lvbi54IDwgdG9YKSB8fFxuICAgIChyZWdpb24ueCA+PSBmcm9tWCAtIHRoaXMuX3JlZ2lvbnNYICYmIHJlZ2lvbi54IDwgdG9YIC0gdGhpcy5fcmVnaW9uc1gpIHx8XG4gICAgKHJlZ2lvbi54ID49IGZyb21YICsgdGhpcy5fcmVnaW9uc1ggJiYgcmVnaW9uLnggPCB0b1ggKyB0aGlzLl9yZWdpb25zWCk7XG5cbiAgcmV0dXJuIHZpc2libGVYICYmIHZpc2libGVZO1xufTtcblxuLy8gU3RhcnQgbG9hZGluZyB0aGUgcmVzb3VyY2UgaW5kZXhlcy5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMubWF0ZXJpYWxzLmxvYWRJbmRleCgpO1xuICB0aGlzLm1hdG1vZHMubG9hZEluZGV4KCk7XG4gIHRoaXMub2JqZWN0cy5sb2FkSW5kZXgoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX2NhbGN1bGF0ZVZpZXdwb3J0KCk7XG59O1xuXG4vLyBUT0RPOiBXaGVuIENocm9tZSBhbmQgRmlyZWZveCBzdXBwb3J0IENhbnZhc1Byb3h5IG9mZmxvYWQgcmVuZGVyaW5nIHRvIHRoZVxuLy8gICAgICAgd29ya2VyLlxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCkgcmV0dXJuO1xuXG4gIGlmICghdGhpcy5fc2V0dXApIHtcbiAgICB0aGlzLl9jYWxjdWxhdGVWaWV3cG9ydCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFByZWNhbGN1bGF0ZSBmcmVlIGNhbnZhc2VzIGFuZCBhIGNhbnZhcyBsb29rdXAgbWFwLlxuICB0aGlzLl9wcmVwYXJlQ2FudmFzUG9vbCgpO1xuXG4gIC8vIFJlbmRlciBiYWNrZ3JvdW5kIG92ZXJsYXlzLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2JhY2tncm91bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJnID0gdGhpcy5fYmFja2dyb3VuZHNbaV07XG5cbiAgICB2YXIgaW1hZ2UgPSB0aGlzLmFzc2V0cy5nZXRJbWFnZShiZy5pbWFnZSk7XG4gICAgaWYgKCFpbWFnZSkgY29udGludWU7XG5cbiAgICB2YXIgd2lkdGggPSBpbWFnZS5uYXR1cmFsV2lkdGggKiB0aGlzLnpvb20sXG4gICAgICAgIGhlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQgKiB0aGlzLnpvb207XG5cbiAgICB2YXIgeCA9IGJnLm1pblswXSAqIHRoaXMuX3NjcmVlblRpbGVXaWR0aCAtIHRoaXMudmlld3BvcnRYLFxuICAgICAgICB5ID0gYmcubWluWzFdICogdGhpcy5fc2NyZWVuVGlsZUhlaWdodCAtIHRoaXMudmlld3BvcnRZO1xuXG4gICAgaW1hZ2Uuc3R5bGUubGVmdCA9IHggKyAncHgnO1xuICAgIGltYWdlLnN0eWxlLmJvdHRvbSA9IHkgKyAncHgnO1xuICAgIGltYWdlLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIGltYWdlLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cbiAgICBpZiAoIWltYWdlLnBhcmVudE5vZGUpIHtcbiAgICAgIGltYWdlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgIGltYWdlLnN0eWxlLnpJbmRleCA9IDA7XG4gICAgICB0aGlzLnZpZXdwb3J0LmFwcGVuZENoaWxkKGltYWdlKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW5kZXIgcmVnaW9ucyBhbmQgdGhlaXIgb2JqZWN0cy5cbiAgZm9yICh2YXIgcmVnaW9uWSA9IHRoaXMuX2Zyb21SZWdpb25ZOyByZWdpb25ZIDwgdGhpcy5fdG9SZWdpb25ZOyByZWdpb25ZKyspIHtcbiAgICBmb3IgKHZhciByZWdpb25YID0gdGhpcy5fZnJvbVJlZ2lvblg7IHJlZ2lvblggPCB0aGlzLl90b1JlZ2lvblg7IHJlZ2lvblgrKykge1xuICAgICAgdmFyIHJlZ2lvbiA9IHRoaXMuZ2V0UmVnaW9uKHJlZ2lvblgsIHJlZ2lvblkpO1xuICAgICAgaWYgKCFyZWdpb24pIGNvbnRpbnVlO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIHJlZ2lvbidzIHBvc2l0aW9uIGluIHRoZSB2aWV3cG9ydCBhbmQgcmVuZGVyIGl0LlxuICAgICAgdmFyIG9mZnNldFggPSByZWdpb25YICogdGhpcy5zY3JlZW5SZWdpb25XaWR0aCAtIHRoaXMudmlld3BvcnRYLFxuICAgICAgICAgIG9mZnNldFkgPSByZWdpb25ZICogdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgLSB0aGlzLnZpZXdwb3J0WTtcbiAgICAgIHJlZ2lvbi5yZW5kZXIodGhpcywgb2Zmc2V0WCwgb2Zmc2V0WSk7XG4gICAgfVxuICB9XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5yZXF1ZXN0UmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2xvYWRlZCB8fCB0aGlzLl9yZXF1ZXN0aW5nUmVuZGVyKSByZXR1cm47XG4gIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSB0cnVlO1xuXG4gIHZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHRoaXMuX3JlcXVlc3RpbmdSZW5kZXIgPSBmYWxzZTtcbiAgfSk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5zY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVksIG9wdF9zY3JlZW5QaXhlbHMpIHtcbiAgaWYgKG9wdF9zY3JlZW5QaXhlbHMpIHtcbiAgICBkZWx0YVggLz0gdGhpcy5fc2NyZWVuVGlsZVdpZHRoO1xuICAgIGRlbHRhWSAvPSB0aGlzLl9zY3JlZW5UaWxlSGVpZ2h0O1xuICB9XG5cbiAgdGhpcy5jZW50ZXJYICs9IGRlbHRhWDtcbiAgdGhpcy5jZW50ZXJZICs9IGRlbHRhWTtcblxuICBpZiAodGhpcy5jZW50ZXJYIDwgMCkge1xuICAgIHRoaXMuY2VudGVyWCArPSB0aGlzLl90aWxlc1g7XG4gIH0gZWxzZSBpZiAodGhpcy5jZW50ZXJYID49IHRoaXMuX3RpbGVzWCkge1xuICAgIHRoaXMuY2VudGVyWCAtPSB0aGlzLl90aWxlc1g7XG4gIH1cblxuICB0aGlzLl9jYWxjdWxhdGVSZWdpb25zKCk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5zZXRXb3JsZCA9IGZ1bmN0aW9uICh3b3JsZCkge1xuICBpZiAoIXdvcmxkIHx8ICEod29ybGQgaW5zdGFuY2VvZiBXb3JsZCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgd29ybGQnKTtcbiAgfVxuXG4gIHRoaXMudW5sb2FkKCk7XG5cbiAgdGhpcy53b3JsZCA9IHdvcmxkO1xuICB0aGlzLl9sb2FkTWV0YWRhdGEoKTtcbiAgdGhpcy5fY2FsY3VsYXRlVmlld3BvcnQoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnNldFpvb20gPSBmdW5jdGlvbiAoem9vbSkge1xuICBpZiAoem9vbSA8IE1JTl9aT09NKSB6b29tID0gTUlOX1pPT007XG4gIGlmICh6b29tID4gTUFYX1pPT00pIHpvb20gPSBNQVhfWk9PTTtcbiAgaWYgKHpvb20gPT0gdGhpcy56b29tKSByZXR1cm47XG5cbiAgdGhpcy56b29tID0gem9vbTtcbiAgdGhpcy5fY2FsY3VsYXRlVmlld3BvcnQoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQpIHJldHVybjtcblxuICB0aGlzLnpvb20gPSAxO1xuICB0aGlzLmNlbnRlclggPSAwO1xuICB0aGlzLmNlbnRlclkgPSAwO1xuXG4gIHRoaXMuX3RpbGVzWCA9IDA7XG4gIHRoaXMuX3RpbGVzWSA9IDA7XG4gIHRoaXMuX3JlZ2lvbnNYID0gMDtcbiAgdGhpcy5fcmVnaW9uc1kgPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2FudmFzUG9vbC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb29sSXRlbSA9IHRoaXMuX2NhbnZhc1Bvb2xbaV07XG4gICAgcG9vbEl0ZW0ucmVnaW9uID0gbnVsbDtcbiAgICBwb29sSXRlbS5jYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICB9XG5cbiAgLy8gVW5sb2FkIHJlZ2lvbnMgdG8gcmVtb3ZlIGN5Y2xpYyByZWZlcmVuY2VzLlxuICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fcmVnaW9ucykge1xuICAgIHRoaXMuX3JlZ2lvbnNba2V5XS51bmxvYWQoKTtcbiAgfVxuICB0aGlzLl9yZWdpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2JhY2tncm91bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGltYWdlID0gdGhpcy5hc3NldHMuZ2V0SW1hZ2UodGhpcy5fYmFja2dyb3VuZHNbaV0uaW1hZ2UpO1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgdGhpcy52aWV3cG9ydC5yZW1vdmVDaGlsZChpbWFnZSk7XG4gICAgfVxuICB9XG4gIHRoaXMuX2JhY2tncm91bmRzID0gW107XG5cbiAgdGhpcy53b3JsZCA9IG51bGw7XG5cbiAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gIHRoaXMuX3NldHVwID0gZmFsc2U7XG5cbiAgdGhpcy5lbWl0KCd1bmxvYWQnKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnpvb21JbiA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zZXRab29tKHRoaXMuem9vbSArIHRoaXMuem9vbSAqIC4xKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLnpvb21PdXQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gLSB0aGlzLnpvb20gKiAuMSk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fY2FsY3VsYXRlUmVnaW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQpIHJldHVybjtcblxuICB0aGlzLl9mcm9tUmVnaW9uWCA9IE1hdGguZmxvb3IodGhpcy5jZW50ZXJYIC8gVElMRVNfWCAtIHRoaXMuX2JvdW5kcy53aWR0aCAvIDIgLyB0aGlzLnNjcmVlblJlZ2lvbldpZHRoKSAtIDE7XG4gIHRoaXMuX2Zyb21SZWdpb25ZID0gTWF0aC5mbG9vcih0aGlzLmNlbnRlclkgLyBUSUxFU19ZIC0gdGhpcy5fYm91bmRzLmhlaWdodCAvIDIgLyB0aGlzLnNjcmVlblJlZ2lvbkhlaWdodCkgLSAyO1xuICB0aGlzLl90b1JlZ2lvblggPSB0aGlzLl9mcm9tUmVnaW9uWCArIHRoaXMuX3Zpc2libGVSZWdpb25zWDtcbiAgdGhpcy5fdG9SZWdpb25ZID0gdGhpcy5fZnJvbVJlZ2lvblkgKyB0aGlzLl92aXNpYmxlUmVnaW9uc1k7XG5cbiAgdGhpcy52aWV3cG9ydFggPSB0aGlzLmNlbnRlclggKiB0aGlzLl9zY3JlZW5UaWxlV2lkdGggLSB0aGlzLl9ib3VuZHMud2lkdGggLyAyLFxuICB0aGlzLnZpZXdwb3J0WSA9IHRoaXMuY2VudGVyWSAqIHRoaXMuX3NjcmVlblRpbGVIZWlnaHQgLSB0aGlzLl9ib3VuZHMuaGVpZ2h0IC8gMjtcblxuICB0aGlzLnJlcXVlc3RSZW5kZXIoKTtcbn07XG5cbldvcmxkUmVuZGVyZXIucHJvdG90eXBlLl9jYWxjdWxhdGVWaWV3cG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9sb2FkZWQpIHJldHVybjtcblxuICB0aGlzLl9zZXR1cCA9IHRydWU7XG5cbiAgdGhpcy5zY3JlZW5SZWdpb25XaWR0aCA9IE1hdGgucm91bmQoUkVHSU9OX1dJRFRIICogdGhpcy56b29tKTtcbiAgdGhpcy5zY3JlZW5SZWdpb25IZWlnaHQgPSBNYXRoLnJvdW5kKFJFR0lPTl9IRUlHSFQgKiB0aGlzLnpvb20pO1xuICB0aGlzLl9zY3JlZW5UaWxlV2lkdGggPSB0aGlzLnNjcmVlblJlZ2lvbldpZHRoIC8gVElMRVNfWDtcbiAgdGhpcy5fc2NyZWVuVGlsZUhlaWdodCA9IHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0IC8gVElMRVNfWTtcblxuICB0aGlzLl9ib3VuZHMgPSB0aGlzLnZpZXdwb3J0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB0aGlzLl92aXNpYmxlUmVnaW9uc1ggPSBNYXRoLmNlaWwodGhpcy5fYm91bmRzLndpZHRoIC8gdGhpcy5zY3JlZW5SZWdpb25XaWR0aCArIDMpO1xuICB0aGlzLl92aXNpYmxlUmVnaW9uc1kgPSBNYXRoLmNlaWwodGhpcy5fYm91bmRzLmhlaWdodCAvIHRoaXMuc2NyZWVuUmVnaW9uSGVpZ2h0ICsgMyk7XG5cbiAgdGhpcy5fY2FsY3VsYXRlUmVnaW9ucygpO1xufTtcblxuV29ybGRSZW5kZXJlci5wcm90b3R5cGUuX2xvYWRNZXRhZGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNwYXduLCBzaXplO1xuXG4gIHRoaXMuY2VudGVyWCA9IHRoaXMud29ybGQuc3Bhd25YO1xuICB0aGlzLmNlbnRlclkgPSB0aGlzLndvcmxkLnNwYXduWTtcblxuICB0aGlzLl90aWxlc1ggPSB0aGlzLndvcmxkLnRpbGVzWDtcbiAgdGhpcy5fdGlsZXNZID0gdGhpcy53b3JsZC50aWxlc1k7XG5cbiAgLy8gVE9ETzogRmlndXJlIG91dCB3aHkgc29tZSB3b3JsZCBzaXplcyBhcmVuJ3QgZGl2aXNpYmxlIGJ5IDMyLlxuICB0aGlzLl9yZWdpb25zWCA9IE1hdGguY2VpbCh0aGlzLl90aWxlc1ggLyBUSUxFU19YKTtcbiAgdGhpcy5fcmVnaW9uc1kgPSBNYXRoLmNlaWwodGhpcy5fdGlsZXNZIC8gVElMRVNfWSk7XG5cbiAgaWYgKHRoaXMud29ybGQubWV0YWRhdGEuY2VudHJhbFN0cnVjdHVyZSkge1xuICAgIHRoaXMuX2JhY2tncm91bmRzID0gdGhpcy53b3JsZC5tZXRhZGF0YS5jZW50cmFsU3RydWN0dXJlLmJhY2tncm91bmRPdmVybGF5cztcbiAgfVxuXG4gIHRoaXMuX2xvYWRlZCA9IHRydWU7XG5cbiAgdGhpcy5lbWl0KCdsb2FkJyk7XG59O1xuXG5Xb3JsZFJlbmRlcmVyLnByb3RvdHlwZS5fcHJlcGFyZUNhbnZhc1Bvb2wgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmcmVlUG9vbCA9IFtdLCBwb29sTG9va3VwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2FudmFzUG9vbC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb29sSXRlbSA9IHRoaXMuX2NhbnZhc1Bvb2xbaV0sXG4gICAgICAgIHJlZ2lvbiA9IHBvb2xJdGVtLnJlZ2lvbjtcblxuICAgIGlmIChyZWdpb24gJiYgdGhpcy5pc1JlZ2lvblZpc2libGUocmVnaW9uKSkge1xuICAgICAgcG9vbExvb2t1cFtyZWdpb24ueCArICc6JyArIHJlZ2lvbi55ICsgJzonICsgcG9vbEl0ZW0uel0gPSBwb29sSXRlbTtcbiAgICB9IGVsc2Uge1xuICAgICAgcG9vbEl0ZW0uY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIGZyZWVQb29sLnB1c2gocG9vbEl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuX2ZyZWVQb29sID0gZnJlZVBvb2w7XG4gIHRoaXMuX3Bvb2xMb29rdXAgPSBwb29sTG9va3VwO1xufTtcbiIsIlxudHJ5IHtcbiAgdmFyIHVhID0gcmVxdWlyZSgndWFfcGFyc2VyL3NyYy9qcy91c2VyQWdlbnQnKS51dGlsLnVzZXJBZ2VudCgpXG4gIHZhciBiID0gdWEuYnJvd3NlclxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBicm93c2VyOiBiLm5hbWUsXG4gICAgb3M6IHVhLm9zLm5hbWUsXG4gICAgcGxhdGZvcm06IHVhLnBsYXRmb3JtLFxuICAgIHZlcnNpb246IGIudmVyc2lvblxuICB9XG59IGNhdGNoIChlcnIpIHtcbiAgaWYoY29uc29sZSkgY29uc29sZS5lcnJvcihlcnIpXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJyb3dzZXI6ICd1bmtub3duJyxcbiAgICBvczogJ3Vua25vd24nLFxuICAgIHBsYXRmb3JtOiAndW5rbm93bicsXG4gICAgdmVyc2lvbjoge2luZm86ICc/Lj8uPyd9XG4gIH1cbn1cblxuIiwiLypqc2hpbnQgYnJvd3NlcjogdHJ1ZVxyXG4qL1xyXG4vKmdsb2JhbCBzbGlkZSwgQ2xhc3MsIGdlc3R1cmUqL1xyXG5cclxuKGZ1bmN0aW9uIChleHBvcnRzKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIHVzZXJBZ2VudCA9IGV4cG9ydHMudXNlckFnZW50ID0gZnVuY3Rpb24gKHVhKSB7XHJcbiAgICAgICAgdWEgPSAodWEgfHwgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBmdW5jdGlvbiBjaGVja1VzZXJBZ2VudCh1YSkge1xyXG4gICAgICAgICAgICB2YXIgYnJvd3NlciA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSAvKGRvbGZpbilbIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAvKGNocm9tZSlbIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAvKHdlYmtpdCkoPzouKnZlcnNpb24pP1sgXFwvXShbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8ob3BlcmEpKD86Lip2ZXJzaW9uKT9bIFxcL10oW1xcdy5dKykvLmV4ZWMoIHVhICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAvKG1zaWUpIChbXFx3Ll0rKS8uZXhlYyggdWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHVhLmluZGV4T2YoXCJjb21wYXRpYmxlXCIpIDwgMCAmJiAvKG1vemlsbGEpKD86Lio/IHJ2OihbXFx3Ll0rKSk/Ly5leGVjKCB1YSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgW1wiXCIsXCJ1bmtub3duXCJdO1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0gPT09IFwid2Via2l0XCIpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoID0gLyhpcGhvbmV8aXBhZHxpcG9kKVtcXFNcXHNdKm9zIChbXFx3Ll9cXC1dKykgbGlrZS8uZXhlYyh1YSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAvKGFuZHJvaWQpWyBcXC9dKFtcXHcuX1xcLV0rKTsvLmV4ZWModWEpIHx8IFttYXRjaFswXSwgXCJzYWZhcmlcIiwgbWF0Y2hbMl1dO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIm1vemlsbGFcIikge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMV0gPSBcImZpcmVmb3hcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvcG9sYXJpc3xuYXRlYnJvd3NlcnwoWzAxMHwwMTF8MDE2fDAxN3wwMTh8MDE5XXszfVxcZHszLDR9XFxkezR9JCkvLnRlc3QodWEpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsxXSA9IFwicG9sYXJpc1wiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicm93c2VyW21hdGNoWzFdXSA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyb3dzZXIubmFtZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBicm93c2VyLnZlcnNpb24gPSB7fTtcclxuXHJcbiAgICAgICAgICAgIHZhciB2ZXJzaW9ucyA9IG1hdGNoWzJdID8gbWF0Y2hbMl0uc3BsaXQoL1xcLnwtfF8vKSA6IFtcIjBcIixcIjBcIixcIjBcIl07XHJcbiAgICAgICAgICAgIGJyb3dzZXIudmVyc2lvbi5pbmZvID0gdmVyc2lvbnMuam9pbihcIi5cIik7XHJcbiAgICAgICAgICAgIGJyb3dzZXIudmVyc2lvbi5tYWpvciA9IHZlcnNpb25zWzBdIHx8IFwiMFwiO1xyXG4gICAgICAgICAgICBicm93c2VyLnZlcnNpb24ubWlub3IgPSB2ZXJzaW9uc1sxXSB8fCBcIjBcIjtcclxuICAgICAgICAgICAgYnJvd3Nlci52ZXJzaW9uLnBhdGNoID0gdmVyc2lvbnNbMl0gfHwgXCIwXCI7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tQbGF0Zm9ybSAodWEpIHtcclxuICAgICAgICAgICAgaWYgKGlzUGModWEpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJwY1wiO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzVGFibGV0KHVhKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGV0XCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNNb2JpbGUodWEpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJtb2JpbGVcIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzUGMgKHVhKSB7XHJcbiAgICAgICAgICAgIGlmICh1YS5tYXRjaCgvbGludXh8d2luZG93cyAobnR8OTgpfG1hY2ludG9zaC8pICYmICF1YS5tYXRjaCgvYW5kcm9pZHxtb2JpbGV8cG9sYXJpc3xsZ3RlbGVjb218dXphcmR8bmF0ZWJyb3dzZXJ8a3RmO3xza3Q7LykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaXNUYWJsZXQgKHVhKSB7XHJcbiAgICAgICAgICAgIGlmICh1YS5tYXRjaCgvaXBhZC8pIHx8ICh1YS5tYXRjaCgvYW5kcm9pZC8pICYmICF1YS5tYXRjaCgvbW9iaXxtaW5pfGZlbm5lYy8pKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc01vYmlsZSAodWEpIHtcclxuICAgICAgICAgICAgaWYgKCEhdWEubWF0Y2goL2lwKGhvbmV8b2QpfGFuZHJvaWQuK21vYmlsZXx3aW5kb3dzIChjZXxwaG9uZSl8YmxhY2tiZXJyeXxzeW1iaWFufHdlYm9zfGZpcmVmb3guK2Zlbm5lY3xvcGVyYSBtKG9ifGluKWl8cG9sYXJpc3xpZW1vYmlsZXxsZ3RlbGVjb218bm9raWF8c29ueWVyaWNzc29ufGRvbGZpbnx1emFyZHxuYXRlYnJvd3NlcnxrdGY7fHNrdDsvKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tPcyAodWEpIHtcclxuICAgICAgICAgICAgdmFyIG9zID0ge30sXHJcbiAgICAgICAgICAgICAgICBtYXRjaCA9ICgvYW5kcm9pZC8udGVzdCh1YSk/IFwiYW5kcm9pZFwiIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvbGlrZSBtYWMgb3MgeC4vLnRlc3QodWEpPyBcImlvc1wiIDogZmFsc2UpfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC8obWFjIG9zKS8udGVzdCh1YSk/IFwibWFjXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC9wb2xhcmlzfG5hdGVicm93c2VyfChbMDEwfDAxMXwwMTZ8MDE3fDAxOHwwMTldezN9XFxkezMsNH1cXGR7NH0kKS8udGVzdCh1YSk/IFwicG9sYXJpc1wiIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvKHdpbmRvd3MpLy50ZXN0KHVhKT8gXCJ3aW5kb3dzXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC8obGludXgpLy50ZXN0KHVhKT8gXCJsaW51eFwiIDogZmFsc2UpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvd2Vib3MvLnRlc3QodWEpPyBcIndlYm9zXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC9iYWRhLy50ZXN0KHVhKT8gXCJiYWRhXCIgOiBmYWxzZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKC8ocmltfGJsYWNrYmVycnkpLy50ZXN0KHVhKT8gXCJibGFja2JlcnJ5XCIgOiBmYWxzZSkgfHwgXCJ1bmtub3duXCI7XHJcbiAgICAgICAgICAgIG9zW21hdGNoXSA9IHRydWU7XHJcbiAgICAgICAgICAgIG9zLm5hbWUgPSBtYXRjaDtcclxuICAgICAgICAgICAgcmV0dXJuIG9zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdWE6IHVhLFxyXG4gICAgICAgICAgICBicm93c2VyOiBjaGVja1VzZXJBZ2VudCh1YSksXHJcbiAgICAgICAgICAgIHBsYXRmb3JtOiBjaGVja1BsYXRmb3JtKHVhKSxcclxuICAgICAgICAgICAgb3M6IGNoZWNrT3ModWEpXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG59KSgoZnVuY3Rpb24gKCl7XHJcbiAgICAvLyBNYWtlIHVzZXJBZ2VudCBhIE5vZGUgbW9kdWxlLCBpZiBwb3NzaWJsZS5cclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBleHBvcnRzLnV0aWwgPSAodHlwZW9mIGV4cG9ydHMudXRpbCA9PT0gJ3VuZGVmaW5lZCcpID8ge30gOiBleHBvcnRzLnV0aWw7XHJcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMudXRpbDtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICB3aW5kb3cudXRpbCA9ICh0eXBlb2Ygd2luZG93LnV0aWwgPT09ICd1bmRlZmluZWQnKSA/IHt9IDogd2luZG93LnV0aWw7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy51dGlsO1xyXG4gICAgfVxyXG59KSgpKTtcclxuIl19

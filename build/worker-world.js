(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
/**
 * The buffer module from node.js, for the browser.
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install buffer`
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
   // Detect if browser supports Typed Arrays. Supported browsers are IE 10+,
   // Firefox 4+, Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+.
  if (typeof Uint8Array !== 'function' || typeof ArrayBuffer !== 'function')
    return false

  // Does the browser support adding properties to `Uint8Array` instances? If
  // not, then that's the same as no `Uint8Array` support. We need to be able to
  // add all the node Buffer API methods.
  // Bug in Firefox 4-29, now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var arr = new Uint8Array(0)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // Assume object is an array
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof Uint8Array === 'function' &&
      subject instanceof Uint8Array) {
    // Speed optimization -- use set if we're copying from a Uint8Array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  // copy!
  for (var i = 0; i < end - start; i++)
    target[i + target_start] = this[i + start]
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array === 'function') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment the Uint8Array *instance* (not the class!) with Buffer methods
 */
function augment (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":3,"ieee754":4}],3:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var ZERO   = '0'.charCodeAt(0)
	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	module.exports.toByteArray = b64ToByteArray
	module.exports.fromByteArray = uint8ToBase64
}())

},{}],4:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],5:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":2}],6:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":7,"./rng":8,"./sha":9,"./sha256":10,"buffer":2}],7:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":5}],8:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],9:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":5}],10:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":5}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],14:[function(require,module,exports){
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
},{"./support/isBuffer":13,"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"inherits":11}],15:[function(require,module,exports){
(function (Buffer){
var Zlib = module.exports = require('./zlib');

// the least I can do is make error messages for the rest of the node.js/zlib api.
// (thanks, dominictarr)
function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/brianloveswords/zlib-browserify'
    ].join('\n'))
}

;['createGzip'
, 'createGunzip'
, 'createDeflate'
, 'createDeflateRaw'
, 'createInflate'
, 'createInflateRaw'
, 'createUnzip'
, 'Gzip'
, 'Gunzip'
, 'Inflate'
, 'InflateRaw'
, 'Deflate'
, 'DeflateRaw'
, 'Unzip'
, 'inflateRaw'
, 'deflateRaw'].forEach(function (name) {
  Zlib[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
});

var _deflate = Zlib.deflate;
var _gzip = Zlib.gzip;

Zlib.deflate = function deflate(stringOrBuffer, callback) {
  return _deflate(Buffer(stringOrBuffer), callback);
};
Zlib.gzip = function gzip(stringOrBuffer, callback) {
  return _gzip(Buffer(stringOrBuffer), callback);
};

}).call(this,require("buffer").Buffer)
},{"./zlib":16,"buffer":2}],16:[function(require,module,exports){
(function (process,Buffer){
/** @license zlib.js 0.1.7 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */(function() {'use strict';function q(b){throw b;}var t=void 0,u=!0;var A="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array;function E(b,a){this.index="number"===typeof a?a:0;this.m=0;this.buffer=b instanceof(A?Uint8Array:Array)?b:new (A?Uint8Array:Array)(32768);2*this.buffer.length<=this.index&&q(Error("invalid index"));this.buffer.length<=this.index&&this.f()}E.prototype.f=function(){var b=this.buffer,a,c=b.length,d=new (A?Uint8Array:Array)(c<<1);if(A)d.set(b);else for(a=0;a<c;++a)d[a]=b[a];return this.buffer=d};
E.prototype.d=function(b,a,c){var d=this.buffer,f=this.index,e=this.m,g=d[f],k;c&&1<a&&(b=8<a?(G[b&255]<<24|G[b>>>8&255]<<16|G[b>>>16&255]<<8|G[b>>>24&255])>>32-a:G[b]>>8-a);if(8>a+e)g=g<<a|b,e+=a;else for(k=0;k<a;++k)g=g<<1|b>>a-k-1&1,8===++e&&(e=0,d[f++]=G[g],g=0,f===d.length&&(d=this.f()));d[f]=g;this.buffer=d;this.m=e;this.index=f};E.prototype.finish=function(){var b=this.buffer,a=this.index,c;0<this.m&&(b[a]<<=8-this.m,b[a]=G[b[a]],a++);A?c=b.subarray(0,a):(b.length=a,c=b);return c};
var aa=new (A?Uint8Array:Array)(256),J;for(J=0;256>J;++J){for(var N=J,Q=N,ba=7,N=N>>>1;N;N>>>=1)Q<<=1,Q|=N&1,--ba;aa[J]=(Q<<ba&255)>>>0}var G=aa;function R(b,a,c){var d,f="number"===typeof a?a:a=0,e="number"===typeof c?c:b.length;d=-1;for(f=e&7;f--;++a)d=d>>>8^S[(d^b[a])&255];for(f=e>>3;f--;a+=8)d=d>>>8^S[(d^b[a])&255],d=d>>>8^S[(d^b[a+1])&255],d=d>>>8^S[(d^b[a+2])&255],d=d>>>8^S[(d^b[a+3])&255],d=d>>>8^S[(d^b[a+4])&255],d=d>>>8^S[(d^b[a+5])&255],d=d>>>8^S[(d^b[a+6])&255],d=d>>>8^S[(d^b[a+7])&255];return(d^4294967295)>>>0}
var ga=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,
2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,
2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,
2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,
3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,
936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117],S=A?new Uint32Array(ga):ga;function ha(){};function ia(b){this.buffer=new (A?Uint16Array:Array)(2*b);this.length=0}ia.prototype.getParent=function(b){return 2*((b-2)/4|0)};ia.prototype.push=function(b,a){var c,d,f=this.buffer,e;c=this.length;f[this.length++]=a;for(f[this.length++]=b;0<c;)if(d=this.getParent(c),f[c]>f[d])e=f[c],f[c]=f[d],f[d]=e,e=f[c+1],f[c+1]=f[d+1],f[d+1]=e,c=d;else break;return this.length};
ia.prototype.pop=function(){var b,a,c=this.buffer,d,f,e;a=c[0];b=c[1];this.length-=2;c[0]=c[this.length];c[1]=c[this.length+1];for(e=0;;){f=2*e+2;if(f>=this.length)break;f+2<this.length&&c[f+2]>c[f]&&(f+=2);if(c[f]>c[e])d=c[e],c[e]=c[f],c[f]=d,d=c[e+1],c[e+1]=c[f+1],c[f+1]=d;else break;e=f}return{index:b,value:a,length:this.length}};function ja(b){var a=b.length,c=0,d=Number.POSITIVE_INFINITY,f,e,g,k,h,l,s,n,m;for(n=0;n<a;++n)b[n]>c&&(c=b[n]),b[n]<d&&(d=b[n]);f=1<<c;e=new (A?Uint32Array:Array)(f);g=1;k=0;for(h=2;g<=c;){for(n=0;n<a;++n)if(b[n]===g){l=0;s=k;for(m=0;m<g;++m)l=l<<1|s&1,s>>=1;for(m=l;m<f;m+=h)e[m]=g<<16|n;++k}++g;k<<=1;h<<=1}return[e,c,d]};function ma(b,a){this.k=na;this.F=0;this.input=A&&b instanceof Array?new Uint8Array(b):b;this.b=0;a&&(a.lazy&&(this.F=a.lazy),"number"===typeof a.compressionType&&(this.k=a.compressionType),a.outputBuffer&&(this.a=A&&a.outputBuffer instanceof Array?new Uint8Array(a.outputBuffer):a.outputBuffer),"number"===typeof a.outputIndex&&(this.b=a.outputIndex));this.a||(this.a=new (A?Uint8Array:Array)(32768))}var na=2,oa={NONE:0,L:1,t:na,X:3},pa=[],T;
for(T=0;288>T;T++)switch(u){case 143>=T:pa.push([T+48,8]);break;case 255>=T:pa.push([T-144+400,9]);break;case 279>=T:pa.push([T-256+0,7]);break;case 287>=T:pa.push([T-280+192,8]);break;default:q("invalid literal: "+T)}
ma.prototype.h=function(){var b,a,c,d,f=this.input;switch(this.k){case 0:c=0;for(d=f.length;c<d;){a=A?f.subarray(c,c+65535):f.slice(c,c+65535);c+=a.length;var e=a,g=c===d,k=t,h=t,l=t,s=t,n=t,m=this.a,p=this.b;if(A){for(m=new Uint8Array(this.a.buffer);m.length<=p+e.length+5;)m=new Uint8Array(m.length<<1);m.set(this.a)}k=g?1:0;m[p++]=k|0;h=e.length;l=~h+65536&65535;m[p++]=h&255;m[p++]=h>>>8&255;m[p++]=l&255;m[p++]=l>>>8&255;if(A)m.set(e,p),p+=e.length,m=m.subarray(0,p);else{s=0;for(n=e.length;s<n;++s)m[p++]=
e[s];m.length=p}this.b=p;this.a=m}break;case 1:var r=new E(A?new Uint8Array(this.a.buffer):this.a,this.b);r.d(1,1,u);r.d(1,2,u);var v=qa(this,f),x,O,y;x=0;for(O=v.length;x<O;x++)if(y=v[x],E.prototype.d.apply(r,pa[y]),256<y)r.d(v[++x],v[++x],u),r.d(v[++x],5),r.d(v[++x],v[++x],u);else if(256===y)break;this.a=r.finish();this.b=this.a.length;break;case na:var D=new E(A?new Uint8Array(this.a.buffer):this.a,this.b),Da,P,U,V,W,qb=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],ca,Ea,da,Fa,ka,sa=Array(19),
Ga,X,la,B,Ha;Da=na;D.d(1,1,u);D.d(Da,2,u);P=qa(this,f);ca=ra(this.U,15);Ea=ta(ca);da=ra(this.T,7);Fa=ta(da);for(U=286;257<U&&0===ca[U-1];U--);for(V=30;1<V&&0===da[V-1];V--);var Ia=U,Ja=V,I=new (A?Uint32Array:Array)(Ia+Ja),w,K,z,ea,H=new (A?Uint32Array:Array)(316),F,C,L=new (A?Uint8Array:Array)(19);for(w=K=0;w<Ia;w++)I[K++]=ca[w];for(w=0;w<Ja;w++)I[K++]=da[w];if(!A){w=0;for(ea=L.length;w<ea;++w)L[w]=0}w=F=0;for(ea=I.length;w<ea;w+=K){for(K=1;w+K<ea&&I[w+K]===I[w];++K);z=K;if(0===I[w])if(3>z)for(;0<
z--;)H[F++]=0,L[0]++;else for(;0<z;)C=138>z?z:138,C>z-3&&C<z&&(C=z-3),10>=C?(H[F++]=17,H[F++]=C-3,L[17]++):(H[F++]=18,H[F++]=C-11,L[18]++),z-=C;else if(H[F++]=I[w],L[I[w]]++,z--,3>z)for(;0<z--;)H[F++]=I[w],L[I[w]]++;else for(;0<z;)C=6>z?z:6,C>z-3&&C<z&&(C=z-3),H[F++]=16,H[F++]=C-3,L[16]++,z-=C}b=A?H.subarray(0,F):H.slice(0,F);ka=ra(L,7);for(B=0;19>B;B++)sa[B]=ka[qb[B]];for(W=19;4<W&&0===sa[W-1];W--);Ga=ta(ka);D.d(U-257,5,u);D.d(V-1,5,u);D.d(W-4,4,u);for(B=0;B<W;B++)D.d(sa[B],3,u);B=0;for(Ha=b.length;B<
Ha;B++)if(X=b[B],D.d(Ga[X],ka[X],u),16<=X){B++;switch(X){case 16:la=2;break;case 17:la=3;break;case 18:la=7;break;default:q("invalid code: "+X)}D.d(b[B],la,u)}var Ka=[Ea,ca],La=[Fa,da],M,Ma,fa,va,Na,Oa,Pa,Qa;Na=Ka[0];Oa=Ka[1];Pa=La[0];Qa=La[1];M=0;for(Ma=P.length;M<Ma;++M)if(fa=P[M],D.d(Na[fa],Oa[fa],u),256<fa)D.d(P[++M],P[++M],u),va=P[++M],D.d(Pa[va],Qa[va],u),D.d(P[++M],P[++M],u);else if(256===fa)break;this.a=D.finish();this.b=this.a.length;break;default:q("invalid compression type")}return this.a};
function ua(b,a){this.length=b;this.N=a}
var wa=function(){function b(a){switch(u){case 3===a:return[257,a-3,0];case 4===a:return[258,a-4,0];case 5===a:return[259,a-5,0];case 6===a:return[260,a-6,0];case 7===a:return[261,a-7,0];case 8===a:return[262,a-8,0];case 9===a:return[263,a-9,0];case 10===a:return[264,a-10,0];case 12>=a:return[265,a-11,1];case 14>=a:return[266,a-13,1];case 16>=a:return[267,a-15,1];case 18>=a:return[268,a-17,1];case 22>=a:return[269,a-19,2];case 26>=a:return[270,a-23,2];case 30>=a:return[271,a-27,2];case 34>=a:return[272,
a-31,2];case 42>=a:return[273,a-35,3];case 50>=a:return[274,a-43,3];case 58>=a:return[275,a-51,3];case 66>=a:return[276,a-59,3];case 82>=a:return[277,a-67,4];case 98>=a:return[278,a-83,4];case 114>=a:return[279,a-99,4];case 130>=a:return[280,a-115,4];case 162>=a:return[281,a-131,5];case 194>=a:return[282,a-163,5];case 226>=a:return[283,a-195,5];case 257>=a:return[284,a-227,5];case 258===a:return[285,a-258,0];default:q("invalid length: "+a)}}var a=[],c,d;for(c=3;258>=c;c++)d=b(c),a[c]=d[2]<<24|d[1]<<
16|d[0];return a}(),xa=A?new Uint32Array(wa):wa;
function qa(b,a){function c(a,c){var b=a.N,d=[],e=0,f;f=xa[a.length];d[e++]=f&65535;d[e++]=f>>16&255;d[e++]=f>>24;var g;switch(u){case 1===b:g=[0,b-1,0];break;case 2===b:g=[1,b-2,0];break;case 3===b:g=[2,b-3,0];break;case 4===b:g=[3,b-4,0];break;case 6>=b:g=[4,b-5,1];break;case 8>=b:g=[5,b-7,1];break;case 12>=b:g=[6,b-9,2];break;case 16>=b:g=[7,b-13,2];break;case 24>=b:g=[8,b-17,3];break;case 32>=b:g=[9,b-25,3];break;case 48>=b:g=[10,b-33,4];break;case 64>=b:g=[11,b-49,4];break;case 96>=b:g=[12,b-
65,5];break;case 128>=b:g=[13,b-97,5];break;case 192>=b:g=[14,b-129,6];break;case 256>=b:g=[15,b-193,6];break;case 384>=b:g=[16,b-257,7];break;case 512>=b:g=[17,b-385,7];break;case 768>=b:g=[18,b-513,8];break;case 1024>=b:g=[19,b-769,8];break;case 1536>=b:g=[20,b-1025,9];break;case 2048>=b:g=[21,b-1537,9];break;case 3072>=b:g=[22,b-2049,10];break;case 4096>=b:g=[23,b-3073,10];break;case 6144>=b:g=[24,b-4097,11];break;case 8192>=b:g=[25,b-6145,11];break;case 12288>=b:g=[26,b-8193,12];break;case 16384>=
b:g=[27,b-12289,12];break;case 24576>=b:g=[28,b-16385,13];break;case 32768>=b:g=[29,b-24577,13];break;default:q("invalid distance")}f=g;d[e++]=f[0];d[e++]=f[1];d[e++]=f[2];var h,k;h=0;for(k=d.length;h<k;++h)m[p++]=d[h];v[d[0]]++;x[d[3]]++;r=a.length+c-1;n=null}var d,f,e,g,k,h={},l,s,n,m=A?new Uint16Array(2*a.length):[],p=0,r=0,v=new (A?Uint32Array:Array)(286),x=new (A?Uint32Array:Array)(30),O=b.F,y;if(!A){for(e=0;285>=e;)v[e++]=0;for(e=0;29>=e;)x[e++]=0}v[256]=1;d=0;for(f=a.length;d<f;++d){e=k=0;
for(g=3;e<g&&d+e!==f;++e)k=k<<8|a[d+e];h[k]===t&&(h[k]=[]);l=h[k];if(!(0<r--)){for(;0<l.length&&32768<d-l[0];)l.shift();if(d+3>=f){n&&c(n,-1);e=0;for(g=f-d;e<g;++e)y=a[d+e],m[p++]=y,++v[y];break}0<l.length?(s=ya(a,d,l),n?n.length<s.length?(y=a[d-1],m[p++]=y,++v[y],c(s,0)):c(n,-1):s.length<O?n=s:c(s,0)):n?c(n,-1):(y=a[d],m[p++]=y,++v[y])}l.push(d)}m[p++]=256;v[256]++;b.U=v;b.T=x;return A?m.subarray(0,p):m}
function ya(b,a,c){var d,f,e=0,g,k,h,l,s=b.length;k=0;l=c.length;a:for(;k<l;k++){d=c[l-k-1];g=3;if(3<e){for(h=e;3<h;h--)if(b[d+h-1]!==b[a+h-1])continue a;g=e}for(;258>g&&a+g<s&&b[d+g]===b[a+g];)++g;g>e&&(f=d,e=g);if(258===g)break}return new ua(e,a-f)}
function ra(b,a){var c=b.length,d=new ia(572),f=new (A?Uint8Array:Array)(c),e,g,k,h,l;if(!A)for(h=0;h<c;h++)f[h]=0;for(h=0;h<c;++h)0<b[h]&&d.push(h,b[h]);e=Array(d.length/2);g=new (A?Uint32Array:Array)(d.length/2);if(1===e.length)return f[d.pop().index]=1,f;h=0;for(l=d.length/2;h<l;++h)e[h]=d.pop(),g[h]=e[h].value;k=za(g,g.length,a);h=0;for(l=e.length;h<l;++h)f[e[h].index]=k[h];return f}
function za(b,a,c){function d(b){var c=h[b][l[b]];c===a?(d(b+1),d(b+1)):--g[c];++l[b]}var f=new (A?Uint16Array:Array)(c),e=new (A?Uint8Array:Array)(c),g=new (A?Uint8Array:Array)(a),k=Array(c),h=Array(c),l=Array(c),s=(1<<c)-a,n=1<<c-1,m,p,r,v,x;f[c-1]=a;for(p=0;p<c;++p)s<n?e[p]=0:(e[p]=1,s-=n),s<<=1,f[c-2-p]=(f[c-1-p]/2|0)+a;f[0]=e[0];k[0]=Array(f[0]);h[0]=Array(f[0]);for(p=1;p<c;++p)f[p]>2*f[p-1]+e[p]&&(f[p]=2*f[p-1]+e[p]),k[p]=Array(f[p]),h[p]=Array(f[p]);for(m=0;m<a;++m)g[m]=c;for(r=0;r<f[c-1];++r)k[c-
1][r]=b[r],h[c-1][r]=r;for(m=0;m<c;++m)l[m]=0;1===e[c-1]&&(--g[0],++l[c-1]);for(p=c-2;0<=p;--p){v=m=0;x=l[p+1];for(r=0;r<f[p];r++)v=k[p+1][x]+k[p+1][x+1],v>b[m]?(k[p][r]=v,h[p][r]=a,x+=2):(k[p][r]=b[m],h[p][r]=m,++m);l[p]=0;1===e[p]&&d(p)}return g}
function ta(b){var a=new (A?Uint16Array:Array)(b.length),c=[],d=[],f=0,e,g,k,h;e=0;for(g=b.length;e<g;e++)c[b[e]]=(c[b[e]]|0)+1;e=1;for(g=16;e<=g;e++)d[e]=f,f+=c[e]|0,f<<=1;e=0;for(g=b.length;e<g;e++){f=d[b[e]];d[b[e]]+=1;k=a[e]=0;for(h=b[e];k<h;k++)a[e]=a[e]<<1|f&1,f>>>=1}return a};function Aa(b,a){this.input=b;this.b=this.c=0;this.g={};a&&(a.flags&&(this.g=a.flags),"string"===typeof a.filename&&(this.filename=a.filename),"string"===typeof a.comment&&(this.w=a.comment),a.deflateOptions&&(this.l=a.deflateOptions));this.l||(this.l={})}
Aa.prototype.h=function(){var b,a,c,d,f,e,g,k,h=new (A?Uint8Array:Array)(32768),l=0,s=this.input,n=this.c,m=this.filename,p=this.w;h[l++]=31;h[l++]=139;h[l++]=8;b=0;this.g.fname&&(b|=Ba);this.g.fcomment&&(b|=Ca);this.g.fhcrc&&(b|=Ra);h[l++]=b;a=(Date.now?Date.now():+new Date)/1E3|0;h[l++]=a&255;h[l++]=a>>>8&255;h[l++]=a>>>16&255;h[l++]=a>>>24&255;h[l++]=0;h[l++]=Sa;if(this.g.fname!==t){g=0;for(k=m.length;g<k;++g)e=m.charCodeAt(g),255<e&&(h[l++]=e>>>8&255),h[l++]=e&255;h[l++]=0}if(this.g.comment){g=
0;for(k=p.length;g<k;++g)e=p.charCodeAt(g),255<e&&(h[l++]=e>>>8&255),h[l++]=e&255;h[l++]=0}this.g.fhcrc&&(c=R(h,0,l)&65535,h[l++]=c&255,h[l++]=c>>>8&255);this.l.outputBuffer=h;this.l.outputIndex=l;f=new ma(s,this.l);h=f.h();l=f.b;A&&(l+8>h.buffer.byteLength?(this.a=new Uint8Array(l+8),this.a.set(new Uint8Array(h.buffer)),h=this.a):h=new Uint8Array(h.buffer));d=R(s,t,t);h[l++]=d&255;h[l++]=d>>>8&255;h[l++]=d>>>16&255;h[l++]=d>>>24&255;k=s.length;h[l++]=k&255;h[l++]=k>>>8&255;h[l++]=k>>>16&255;h[l++]=
k>>>24&255;this.c=n;A&&l<h.length&&(this.a=h=h.subarray(0,l));return h};var Sa=255,Ra=2,Ba=8,Ca=16;function Y(b,a){this.o=[];this.p=32768;this.e=this.j=this.c=this.s=0;this.input=A?new Uint8Array(b):b;this.u=!1;this.q=Ta;this.K=!1;if(a||!(a={}))a.index&&(this.c=a.index),a.bufferSize&&(this.p=a.bufferSize),a.bufferType&&(this.q=a.bufferType),a.resize&&(this.K=a.resize);switch(this.q){case Ua:this.b=32768;this.a=new (A?Uint8Array:Array)(32768+this.p+258);break;case Ta:this.b=0;this.a=new (A?Uint8Array:Array)(this.p);this.f=this.S;this.z=this.O;this.r=this.Q;break;default:q(Error("invalid inflate mode"))}}
var Ua=0,Ta=1;
Y.prototype.i=function(){for(;!this.u;){var b=Z(this,3);b&1&&(this.u=u);b>>>=1;switch(b){case 0:var a=this.input,c=this.c,d=this.a,f=this.b,e=t,g=t,k=t,h=d.length,l=t;this.e=this.j=0;e=a[c++];e===t&&q(Error("invalid uncompressed block header: LEN (first byte)"));g=e;e=a[c++];e===t&&q(Error("invalid uncompressed block header: LEN (second byte)"));g|=e<<8;e=a[c++];e===t&&q(Error("invalid uncompressed block header: NLEN (first byte)"));k=e;e=a[c++];e===t&&q(Error("invalid uncompressed block header: NLEN (second byte)"));k|=
e<<8;g===~k&&q(Error("invalid uncompressed block header: length verify"));c+g>a.length&&q(Error("input buffer is broken"));switch(this.q){case Ua:for(;f+g>d.length;){l=h-f;g-=l;if(A)d.set(a.subarray(c,c+l),f),f+=l,c+=l;else for(;l--;)d[f++]=a[c++];this.b=f;d=this.f();f=this.b}break;case Ta:for(;f+g>d.length;)d=this.f({B:2});break;default:q(Error("invalid inflate mode"))}if(A)d.set(a.subarray(c,c+g),f),f+=g,c+=g;else for(;g--;)d[f++]=a[c++];this.c=c;this.b=f;this.a=d;break;case 1:this.r(Va,Wa);break;
case 2:Xa(this);break;default:q(Error("unknown BTYPE: "+b))}}return this.z()};
var Ya=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],Za=A?new Uint16Array(Ya):Ya,$a=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],ab=A?new Uint16Array($a):$a,bb=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],cb=A?new Uint8Array(bb):bb,db=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],eb=A?new Uint16Array(db):db,fb=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,
10,11,11,12,12,13,13],gb=A?new Uint8Array(fb):fb,hb=new (A?Uint8Array:Array)(288),$,ib;$=0;for(ib=hb.length;$<ib;++$)hb[$]=143>=$?8:255>=$?9:279>=$?7:8;var Va=ja(hb),jb=new (A?Uint8Array:Array)(30),kb,lb;kb=0;for(lb=jb.length;kb<lb;++kb)jb[kb]=5;var Wa=ja(jb);function Z(b,a){for(var c=b.j,d=b.e,f=b.input,e=b.c,g;d<a;)g=f[e++],g===t&&q(Error("input buffer is broken")),c|=g<<d,d+=8;g=c&(1<<a)-1;b.j=c>>>a;b.e=d-a;b.c=e;return g}
function mb(b,a){for(var c=b.j,d=b.e,f=b.input,e=b.c,g=a[0],k=a[1],h,l,s;d<k;){h=f[e++];if(h===t)break;c|=h<<d;d+=8}l=g[c&(1<<k)-1];s=l>>>16;b.j=c>>s;b.e=d-s;b.c=e;return l&65535}
function Xa(b){function a(a,b,c){var d,e,f,g;for(g=0;g<a;)switch(d=mb(this,b),d){case 16:for(f=3+Z(this,2);f--;)c[g++]=e;break;case 17:for(f=3+Z(this,3);f--;)c[g++]=0;e=0;break;case 18:for(f=11+Z(this,7);f--;)c[g++]=0;e=0;break;default:e=c[g++]=d}return c}var c=Z(b,5)+257,d=Z(b,5)+1,f=Z(b,4)+4,e=new (A?Uint8Array:Array)(Za.length),g,k,h,l;for(l=0;l<f;++l)e[Za[l]]=Z(b,3);g=ja(e);k=new (A?Uint8Array:Array)(c);h=new (A?Uint8Array:Array)(d);b.r(ja(a.call(b,c,g,k)),ja(a.call(b,d,g,h)))}
Y.prototype.r=function(b,a){var c=this.a,d=this.b;this.A=b;for(var f=c.length-258,e,g,k,h;256!==(e=mb(this,b));)if(256>e)d>=f&&(this.b=d,c=this.f(),d=this.b),c[d++]=e;else{g=e-257;h=ab[g];0<cb[g]&&(h+=Z(this,cb[g]));e=mb(this,a);k=eb[e];0<gb[e]&&(k+=Z(this,gb[e]));d>=f&&(this.b=d,c=this.f(),d=this.b);for(;h--;)c[d]=c[d++-k]}for(;8<=this.e;)this.e-=8,this.c--;this.b=d};
Y.prototype.Q=function(b,a){var c=this.a,d=this.b;this.A=b;for(var f=c.length,e,g,k,h;256!==(e=mb(this,b));)if(256>e)d>=f&&(c=this.f(),f=c.length),c[d++]=e;else{g=e-257;h=ab[g];0<cb[g]&&(h+=Z(this,cb[g]));e=mb(this,a);k=eb[e];0<gb[e]&&(k+=Z(this,gb[e]));d+h>f&&(c=this.f(),f=c.length);for(;h--;)c[d]=c[d++-k]}for(;8<=this.e;)this.e-=8,this.c--;this.b=d};
Y.prototype.f=function(){var b=new (A?Uint8Array:Array)(this.b-32768),a=this.b-32768,c,d,f=this.a;if(A)b.set(f.subarray(32768,b.length));else{c=0;for(d=b.length;c<d;++c)b[c]=f[c+32768]}this.o.push(b);this.s+=b.length;if(A)f.set(f.subarray(a,a+32768));else for(c=0;32768>c;++c)f[c]=f[a+c];this.b=32768;return f};
Y.prototype.S=function(b){var a,c=this.input.length/this.c+1|0,d,f,e,g=this.input,k=this.a;b&&("number"===typeof b.B&&(c=b.B),"number"===typeof b.M&&(c+=b.M));2>c?(d=(g.length-this.c)/this.A[2],e=258*(d/2)|0,f=e<k.length?k.length+e:k.length<<1):f=k.length*c;A?(a=new Uint8Array(f),a.set(k)):a=k;return this.a=a};
Y.prototype.z=function(){var b=0,a=this.a,c=this.o,d,f=new (A?Uint8Array:Array)(this.s+(this.b-32768)),e,g,k,h;if(0===c.length)return A?this.a.subarray(32768,this.b):this.a.slice(32768,this.b);e=0;for(g=c.length;e<g;++e){d=c[e];k=0;for(h=d.length;k<h;++k)f[b++]=d[k]}e=32768;for(g=this.b;e<g;++e)f[b++]=a[e];this.o=[];return this.buffer=f};
Y.prototype.O=function(){var b,a=this.b;A?this.K?(b=new Uint8Array(a),b.set(this.a.subarray(0,a))):b=this.a.subarray(0,a):(this.a.length>a&&(this.a.length=a),b=this.a);return this.buffer=b};function nb(b){this.input=b;this.c=0;this.G=[];this.R=!1}
nb.prototype.i=function(){for(var b=this.input.length;this.c<b;){var a=new ha,c=t,d=t,f=t,e=t,g=t,k=t,h=t,l=t,s=t,n=this.input,m=this.c;a.C=n[m++];a.D=n[m++];(31!==a.C||139!==a.D)&&q(Error("invalid file signature:"+a.C+","+a.D));a.v=n[m++];switch(a.v){case 8:break;default:q(Error("unknown compression method: "+a.v))}a.n=n[m++];l=n[m++]|n[m++]<<8|n[m++]<<16|n[m++]<<24;a.$=new Date(1E3*l);a.ba=n[m++];a.aa=n[m++];0<(a.n&4)&&(a.W=n[m++]|n[m++]<<8,m+=a.W);if(0<(a.n&Ba)){h=[];for(k=0;0<(g=n[m++]);)h[k++]=
String.fromCharCode(g);a.name=h.join("")}if(0<(a.n&Ca)){h=[];for(k=0;0<(g=n[m++]);)h[k++]=String.fromCharCode(g);a.w=h.join("")}0<(a.n&Ra)&&(a.P=R(n,0,m)&65535,a.P!==(n[m++]|n[m++]<<8)&&q(Error("invalid header crc16")));c=n[n.length-4]|n[n.length-3]<<8|n[n.length-2]<<16|n[n.length-1]<<24;n.length-m-4-4<512*c&&(e=c);d=new Y(n,{index:m,bufferSize:e});a.data=f=d.i();m=d.c;a.Y=s=(n[m++]|n[m++]<<8|n[m++]<<16|n[m++]<<24)>>>0;R(f,t,t)!==s&&q(Error("invalid CRC-32 checksum: 0x"+R(f,t,t).toString(16)+" / 0x"+
s.toString(16)));a.Z=c=(n[m++]|n[m++]<<8|n[m++]<<16|n[m++]<<24)>>>0;(f.length&4294967295)!==c&&q(Error("invalid input size: "+(f.length&4294967295)+" / "+c));this.G.push(a);this.c=m}this.R=u;var p=this.G,r,v,x=0,O=0,y;r=0;for(v=p.length;r<v;++r)O+=p[r].data.length;if(A){y=new Uint8Array(O);for(r=0;r<v;++r)y.set(p[r].data,x),x+=p[r].data.length}else{y=[];for(r=0;r<v;++r)y[r]=p[r].data;y=Array.prototype.concat.apply([],y)}return y};function ob(b){if("string"===typeof b){var a=b.split(""),c,d;c=0;for(d=a.length;c<d;c++)a[c]=(a[c].charCodeAt(0)&255)>>>0;b=a}for(var f=1,e=0,g=b.length,k,h=0;0<g;){k=1024<g?1024:g;g-=k;do f+=b[h++],e+=f;while(--k);f%=65521;e%=65521}return(e<<16|f)>>>0};function pb(b,a){var c,d;this.input=b;this.c=0;if(a||!(a={}))a.index&&(this.c=a.index),a.verify&&(this.V=a.verify);c=b[this.c++];d=b[this.c++];switch(c&15){case rb:this.method=rb;break;default:q(Error("unsupported compression method"))}0!==((c<<8)+d)%31&&q(Error("invalid fcheck flag:"+((c<<8)+d)%31));d&32&&q(Error("fdict flag is not supported"));this.J=new Y(b,{index:this.c,bufferSize:a.bufferSize,bufferType:a.bufferType,resize:a.resize})}
pb.prototype.i=function(){var b=this.input,a,c;a=this.J.i();this.c=this.J.c;this.V&&(c=(b[this.c++]<<24|b[this.c++]<<16|b[this.c++]<<8|b[this.c++])>>>0,c!==ob(a)&&q(Error("invalid adler-32 checksum")));return a};var rb=8;function sb(b,a){this.input=b;this.a=new (A?Uint8Array:Array)(32768);this.k=tb.t;var c={},d;if((a||!(a={}))&&"number"===typeof a.compressionType)this.k=a.compressionType;for(d in a)c[d]=a[d];c.outputBuffer=this.a;this.I=new ma(this.input,c)}var tb=oa;
sb.prototype.h=function(){var b,a,c,d,f,e,g,k=0;g=this.a;b=rb;switch(b){case rb:a=Math.LOG2E*Math.log(32768)-8;break;default:q(Error("invalid compression method"))}c=a<<4|b;g[k++]=c;switch(b){case rb:switch(this.k){case tb.NONE:f=0;break;case tb.L:f=1;break;case tb.t:f=2;break;default:q(Error("unsupported compression type"))}break;default:q(Error("invalid compression method"))}d=f<<6|0;g[k++]=d|31-(256*c+d)%31;e=ob(this.input);this.I.b=k;g=this.I.h();k=g.length;A&&(g=new Uint8Array(g.buffer),g.length<=
k+4&&(this.a=new Uint8Array(g.length+4),this.a.set(g),g=this.a),g=g.subarray(0,k+4));g[k++]=e>>24&255;g[k++]=e>>16&255;g[k++]=e>>8&255;g[k++]=e&255;return g};exports.deflate=ub;exports.deflateSync=vb;exports.inflate=wb;exports.inflateSync=xb;exports.gzip=yb;exports.gzipSync=zb;exports.gunzip=Ab;exports.gunzipSync=Bb;function ub(b,a,c){process.nextTick(function(){var d,f;try{f=vb(b,c)}catch(e){d=e}a(d,f)})}function vb(b,a){var c;c=(new sb(b)).h();a||(a={});return a.H?c:Cb(c)}function wb(b,a,c){process.nextTick(function(){var d,f;try{f=xb(b,c)}catch(e){d=e}a(d,f)})}
function xb(b,a){var c;b.subarray=b.slice;c=(new pb(b)).i();a||(a={});return a.noBuffer?c:Cb(c)}function yb(b,a,c){process.nextTick(function(){var d,f;try{f=zb(b,c)}catch(e){d=e}a(d,f)})}function zb(b,a){var c;b.subarray=b.slice;c=(new Aa(b)).h();a||(a={});return a.H?c:Cb(c)}function Ab(b,a,c){process.nextTick(function(){var d,f;try{f=Bb(b,c)}catch(e){d=e}a(d,f)})}function Bb(b,a){var c;b.subarray=b.slice;c=(new nb(b)).i();a||(a={});return a.H?c:Cb(c)}
function Cb(b){var a=new Buffer(b.length),c,d;c=0;for(d=b.length;c<d;++c)a[c]=b[c];return a};}).call(this); //@ sourceMappingURL=node-zlib.js.map

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),require("buffer").Buffer)
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"buffer":2}],17:[function(require,module,exports){
var World = require('starbound-files').World;
var workerproxy = require('workerproxy');
var worlds = {},
    nextHandle = 1;
workerproxy({
  close: function(handle, callback) {
    handle = handle.toString();
    if (!(handle in worlds)) {
      throw new Error('The specified world is not open.');
    }
    delete worlds[handle];
    callback(null);
  },
  getRegion: function(handle, x, y, callback) {
    handle = handle.toString();
    if (!(handle in worlds)) {
      throw new Error('The specified world is not open.');
    }
    var world = worlds[handle].world;
    var buffer = world.getRegionData(1, x, y),
        entities = world.getEntities(x, y);
    var region = {
      buffer: buffer,
      entities: entities
    };
    callback.transfer([region.buffer], null, region);
  },
  open: function(file, callback) {
    var world = World.open(file),
        metadata = world.getMetadata();
    var handle = nextHandle++;
    worlds[handle] = {world: world};
    callback(null, {
      handle: handle,
      metadata: metadata
    });
  }
}, {catchErrors: true});


},{"starbound-files":18,"workerproxy":31}],18:[function(require,module,exports){
exports.BlockFile = require('./lib/blockfile');
exports.BTreeDB = require('./lib/btreedb');
exports.Document = require('./lib/document');
exports.Package = require('./lib/package');
exports.SbonReader = require('./lib/sbonreader');
exports.World = require('./lib/world');

},{"./lib/blockfile":19,"./lib/btreedb":20,"./lib/document":21,"./lib/package":22,"./lib/sbonreader":23,"./lib/world":24}],19:[function(require,module,exports){
var SbonReader = require('./sbonreader');

module.exports = BlockFile;

/**
 * Size of the initial metadata required to be able to read the rest of the
 * block file.
 */
var METADATA_SIZE = 32;

var fileReader = new FileReaderSync();

function BlockFile(file, headerSize, blockSize) {
  this.file = file;
  this.headerSize = headerSize;
  this.blockSize = blockSize;

  // TODO: Make sure to recalculate this when necessary.
  this.blockCount = Math.floor((file.size - this.headerSize) / this.blockSize);

  this.freeBlockIsDirty = false;
  this.freeBlock = null;

  this._userHeader = null;
}

BlockFile.open = function (file) {
  var buffer = fileReader.readAsArrayBuffer(file.slice(0, METADATA_SIZE));

  var reader = new SbonReader(buffer);

  if (reader.readByteString(6) != 'SBBF02') {
    throw new Error('Unsupported block file format');
  }

  var headerSize = reader.readInt32(),
      blockSize = reader.readInt32();

  var blockFile = new BlockFile(file, headerSize, blockSize);

  blockFile.freeBlockIsDirty = reader.readBoolean();
  blockFile.freeBlock = reader.readInt32();

  return blockFile;
};

/**
 * Loads the data in a block and returns a wrapper for accessing it.
 */
BlockFile.prototype.getBlock = function (index) {
  if (index < 0 || index >= this.blockCount) {
    throw new Error('Index out of bounds');
  }

  var start = this.headerSize + this.blockSize * index,
      end = start + this.blockSize;

  var buffer = fileReader.readAsArrayBuffer(this.file.slice(start, end));

  var typeData = new Uint8Array(buffer, 0, 2);
  var block = {
    type: String.fromCharCode(typeData[0], typeData[1]),
    buffer: buffer.slice(2)
  };

  return block;
};

BlockFile.prototype.getUserHeader = function () {
  if (this._userHeader) return this._userHeader;

  var start = METADATA_SIZE, end = this.headerSize;
  var buffer = fileReader.readAsArrayBuffer(this.file.slice(start, end));
  this._userHeader = buffer;
  return buffer;
};

},{"./sbonreader":23}],20:[function(require,module,exports){
var util = require('util');

var BlockFile = require('./blockfile');
var SbonReader = require('./sbonreader');

module.exports = BTreeDB;

var BLOCK_INDEX = 'II';
var BLOCK_LEAF = 'LL';

function BTreeDB(blockFile, identifier, keySize) {
  this.blockFile = blockFile;
  this.identifier = identifier;
  this.keySize = keySize;

  this.alternateRootNode = false;
  this.rootNode = null;
  this.rootNodeIsLeaf = false;
}

BTreeDB.open = function (file) {
  var blockFile = BlockFile.open(file);

  var buffer = blockFile.getUserHeader();
  var reader = new SbonReader(buffer);

  if (reader.readFixedString(12) != 'BTreeDB4') {
    throw new Error('Unsupported database format');
  }

  var identifier = reader.readFixedString(12),
      keySize = reader.readInt32();

  var db = new BTreeDB(blockFile, identifier, keySize);

  // Whether we should be using the alternate root node reference.
  db.alternateRootNode = reader.readBoolean();

  // Skip ahead based on whether we're alternating references.
  reader.seek(db.alternateRootNode ? 9 : 1, true);

  db.rootNode = reader.readInt32();
  db.rootNodeIsLeaf = reader.readBoolean();

  return db;
};

BTreeDB.prototype.get = function (key) {
  if (key.length != this.keySize) {
    throw new Error('Provided key must be of the correct length');
  }

  return this.search(this.rootNode, key);
};

BTreeDB.prototype.getLeafValue = function (block, key) {
  if (block.type != BLOCK_LEAF) {
    throw new Error('Expected a leaf node');
  }

  var reader = new LeafReader(this.blockFile, block);
  var keyCount = reader.readInt32();

  for (var i = 0; i < keyCount; i++) {
    // Get the key to see if it's the one we're searching for.
    var curKey = reader.readByteString(this.keySize);

    var size = reader.readUintVar();
    if (key == curKey) {
      return reader.readBytes(size);
    }

    // Only seek if this isn't the last block.
    if (i < keyCount - 1) {
      reader.seek(size, true);
    }
  }

  throw new Error('Key not found');
};

/**
 * Begin searching for a key at the given block id. Keep searching down the
 * indexes until a leaf is found and then return the value for the provided
 * key.
 */
BTreeDB.prototype.search = function (blockId, key, callback) {
  var block = this.blockFile.getBlock(blockId);

  // TODO: Cache index blocks.
  while (block.type == BLOCK_INDEX) {
    var nextBlockId = new Index(this.keySize, block).find(key);
    block = this.blockFile.getBlock(nextBlockId);
  }

  if (block.type != BLOCK_LEAF) {
    throw new Error('Did not reach leaf');
  }

  return this.getLeafValue(block, key);
};

/**
 * Wraps a block object to provide functionality for parsing and scanning an
 * index.
 */
function Index(keySize, block) {
  var reader = new SbonReader(block.buffer);

  this.level = reader.readUint8();

  // Number of keys in this index.
  this.keyCount = reader.readInt32();

  // The blocks that the keys point to. There will be one extra block in the
  // beginning of this list that points to the block to go to if the key being
  // searched for is left of the first key in this index.
  this.blockIds = new Int32Array(this.keyCount + 1);
  this.blockIds[0] = reader.readInt32();

  this.keys = [];

  // Load all key/block reference pairs.
  for (var i = 1; i <= this.keyCount; i++) {
    this.keys.push(reader.readByteString(keySize));
    this.blockIds[i] = reader.readInt32();
  }
}

/**
 * Searches this index for the specified key and returns the next block id to
 * search.
 */
Index.prototype.find = function (key) {
  // Maybe overkill considering that an index can't really contain more than
  // around 60 keys.
  var lo = 0, hi = this.keyCount, mid;
  while (lo < hi) {
    mid = (lo + hi) >> 1;
    if (key < this.keys[mid]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return this.blockIds[lo];
};

function LeafReader(blockFile, block) {
  SbonReader.call(this, block.buffer);
  this.blockFile = blockFile;
}
util.inherits(LeafReader, SbonReader);

LeafReader.prototype.readBytes = function (count, opt_noCopy) {
  var buffer = this.view.buffer,
      start = this.view.byteOffset + this.offset,
      chunkLength = Math.min(count, buffer.byteLength - 4 - start);

  var range = new Uint8Array(buffer, start, chunkLength);
  if (opt_noCopy && chunkLength == count) {
    this.offset += chunkLength;
    return range;
  }

  var array = new Uint8Array(count), written = 0;
  while (true) {
    array.set(range, written);
    written += chunkLength;

    if (written == count) break;

    buffer = this._getNextBlock().buffer;
    this.view = new DataView(buffer);

    chunkLength = Math.min(count - written, buffer.byteLength - 4);
    range = new Uint8Array(buffer, 0, chunkLength);
  }

  this.offset = chunkLength;

  return array;
};

LeafReader.prototype.seek = function (offset, opt_relative) {
  var length = this.view.byteLength - 4;
  if (opt_relative) {
    offset = this.offset + offset;
  } else {
    if (offset < 0) {
      offset = length + offset;
    } else {
      offset = offset;
    }
  }

  if (offset < 0) {
    throw new Error('Out of bounds');
  }

  while (offset >= length) {
    offset -= length;
    this.view = new DataView(this._getNextBlock().buffer);
    length = this.view.byteLength - 4;
  }

  this.offset = offset;
  return this;
};

LeafReader.prototype._getNextBlock = function () {
  var nextBlockId = this.view.getInt32(this.view.byteLength - 4);
  if (nextBlockId == -1) throw new Error('Tried to traverse to non-existent block');
  return this.blockFile.getBlock(nextBlockId);
};

},{"./blockfile":19,"./sbonreader":23,"util":14}],21:[function(require,module,exports){
var SbonReader = require('./sbonreader');

module.exports = Document;

var SIGNATURE = 'SBVJ01';

var fileReader = new FileReaderSync();

// TODO: Starbound calls this "versioned JSON", so might refactor naming later.
function Document(data) {
  this.data = data;
}

Document.open = function (file) {
  var buffer = fileReader.readAsArrayBuffer(file);

  var reader = new SbonReader(buffer);
  if (reader.readByteString(SIGNATURE.length) != SIGNATURE) {
    throw new Error('Invalid SBVJ01 file');
  }

  var data = reader.readDocument();
  return new Document(data);
};

},{"./sbonreader":23}],22:[function(require,module,exports){
var sha256 = require('sha256');
var sha256starbound = require('starbound-sha256');

var BlockFile = require('./blockfile');
var BTreeDB = require('./btreedb');
var SbonReader = require('./sbonreader');

module.exports = Package;

var DIGEST_KEY = '_digest';
var INDEX_KEY = '_index';

function Package(database) {
  this.db = database;
}

Package.open = function (file) {
  return new Package(BTreeDB.open(file));
};

Package.prototype.get = function (key) {
  var keyHash = sha256(key, {asString: true});
  try {
    return this.db.get(keyHash);
  } catch (e) {
    // Older versions of Starbound had a buggy hash implementation. Try to use
    // it, since we could be reading an old package file.
    if (key.length == 55) {
      keyHash = sha256starbound(key, {asString: true});
      return this.db.get(keyHash);
    }

    throw e;
  }
};

Package.prototype.getDigest = function () {
  return this.get(DIGEST_KEY);
};

/**
 * Gets the paths and keys of the files in this package.
 */
Package.prototype.getIndex = function () {
  var reader = new SbonReader(this.get(INDEX_KEY));
  switch (this.db.identifier) {
    case 'Assets1':
      var paths = reader.readStringList(), map = {};
      for (var i = 0; i < paths.length; i++) {
        map[paths[i]] = null;
      }
      return map;
    case 'Assets2':
      return reader.readStringDigestMap();
    default:
      throw new Error('Unsupported package type ' + this.identifier);
  }
};

},{"./blockfile":19,"./btreedb":20,"./sbonreader":23,"sha256":25,"starbound-sha256":28}],23:[function(require,module,exports){
module.exports = SbonReader;

function SbonReader(viewOrBuffer) {
  if (viewOrBuffer instanceof ArrayBuffer) {
    viewOrBuffer = new DataView(viewOrBuffer);
  } else if (!(viewOrBuffer instanceof DataView)) {
    viewOrBuffer = new DataView(viewOrBuffer.buffer);
  }

  this.offset = 0;
  this.view = viewOrBuffer;
}

SbonReader.prototype.readBoolean = function () {
  // XXX: Might want to assert that this is only ever 0x00 or 0x01.
  return !!this.readUint8();
};

/**
 * Reads the specified number of bytes. If the optional noCopy flag is passed
 * in, the returned byte array will reference the original buffer instead of
 * making a copy (faster when you only want to read from the array).
 */
SbonReader.prototype.readBytes = function (count, opt_noCopy) {
  var start = this.view.byteOffset + this.offset;
  this.seek(count, true);

  var range = new Uint8Array(this.view.buffer, start, count);
  if (opt_noCopy) return range;

  var array = new Uint8Array(count);
  array.set(range);
  return array;
};

SbonReader.prototype.readByteString = function (length) {
  return String.fromCharCode.apply(null, this.readBytes(length, true));
};

SbonReader.prototype.readDocument = function () {
  var name = this.readString();

  // This seems to always be 0x01.
  var unknown = this.readUint8();

  // TODO: Not sure if this is signed or not.
  var version = this.readInt32();

  var doc = this.readDynamic();
  doc.__name__ = name;
  doc.__version__ = version;

  return doc;
};

SbonReader.prototype.readDocumentList = function () {
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readDocument());
  }
  return list;
};

SbonReader.prototype.readDynamic = function () {
  var type = this.readUint8();
  switch (type) {
    case 1:
      return null;
    case 2:
      return this.readFloat64();
    case 3:
      return this.readBoolean();
    case 4:
      return this.readIntVar();
    case 5:
      return this.readString();
    case 6:
      return this.readList();
    case 7:
      return this.readMap();
  }

  throw new Error('Unknown dynamic type');
};

/**
 * Reads the specified number of bytes and returns them as a string that ends
 * at the first null.
 */
SbonReader.prototype.readFixedString = function (length) {
  var string = this.readByteString(length);
  var nullIndex = string.indexOf('\x00');
  if (nullIndex != -1) {
    return string.substr(0, nullIndex);
  }
  return string;
};

SbonReader.prototype.readFloat32 = function () {
  return this.seek(4, true).view.getFloat32(this.offset - 4);
};

SbonReader.prototype.readFloat64 = function () {
  return this.seek(8, true).view.getFloat64(this.offset - 8);
};

SbonReader.prototype.readInt8 = function () {
  return this.seek(1, true).view.getInt8(this.offset - 1);
};

SbonReader.prototype.readInt16 = function () {
  return this.seek(2, true).view.getInt16(this.offset - 2);
};

SbonReader.prototype.readInt32 = function () {
  return this.seek(4, true).view.getInt32(this.offset - 4);
};

SbonReader.prototype.readIntVar = function () {
  var value = this.readUintVar();

  // Least significant bit represents the sign.
  if (value & 1) {
    return -(value >> 1);
  } else {
    return value >> 1;
  }
};

SbonReader.prototype.readList = function () {
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readDynamic());
  }
  return list;
};

SbonReader.prototype.readMap = function () {
  var length = this.readUintVar();

  var map = Object.create(null);
  for (var i = 0; i < length; i++) {
    var key = this.readString();
    map[key] = this.readDynamic();
  }
  return map;
};

SbonReader.prototype.readString = function () {
  var length = this.readUintVar();

  // This is fucking bullshit.
  var raw = this.readByteString(length);
  return decodeURIComponent(escape(raw));
};

SbonReader.prototype.readStringDigestMap = function () {
  // Special structure of string/digest pairs, used by the assets database.
  var length = this.readUintVar();

  var map = Object.create(null), digest, path;
  for (var i = 0; i < length; i++) {
    path = this.readString();
    // Single space character.
    this.seek(1, true);
    digest = this.readBytes(32);
    map[path] = digest;
  }
  return map;
};

SbonReader.prototype.readStringList = function () {
  // Optimized structure that doesn't have a type byte for every item.
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readString());
  }
  return list;
};

SbonReader.prototype.readUint8 = function () {
  var value = this.view.getUint8(this.offset);
  this.seek(1, true);
  return value;
};

SbonReader.prototype.readUint16 = function () {
  return this.seek(2, true).view.getUint16(this.offset - 2);
};

SbonReader.prototype.readUint32 = function () {
  return this.seek(4, true).view.getUint32(this.offset - 4);
};

SbonReader.prototype.readUintVar = function () {
  var value = 0;
  while (true) {
    var byte = this.readUint8();
    if ((byte & 128) == 0) {
      return value << 7 | byte;
    }
    value = value << 7 | (byte & 127);
  }
};

SbonReader.prototype.seek = function (offset, opt_relative) {
  var length = this.view.byteCount;
  if (opt_relative) {
    offset = this.offset + offset;
  } else {
    if (offset < 0) {
      offset = length + offset;
    } else {
      offset = offset;
    }
  }

  if (offset < 0 || offset >= length) {
    throw new Error('Out of bounds');
  }

  this.offset = offset;
  return this;
};

},{}],24:[function(require,module,exports){
var zlib = require('zlib');

var BTreeDB = require('./btreedb');
var SbonReader = require('./sbonreader');

module.exports = World;

var METADATA_KEY = '\x00\x00\x00\x00\x00';

function World(database) {
  this.db = database;
}

World.open = function (file) {
  return new World(BTreeDB.open(file));
};

World.prototype.getMetadata = function () {
  var reader = new SbonReader(this.db.get(METADATA_KEY));

  // Skip some unknown bytes.
  reader.seek(8);

  var metadata = reader.readDocument();
  if (metadata.__name__ != 'WorldMetadata') {
    throw new Error('Invalid world file');
  }

  return metadata;
};

World.prototype.getRegionData = function (layer, x, y, callback) {
  var key = String.fromCharCode(layer, x >> 8, x & 255, y >> 8, y & 255);
  var buffer = this.db.get(key);
  var inflated = zlib.inflateSync(new Uint8Array(buffer));
  var array = new Uint8Array(inflated);
  return array.buffer;
};

World.prototype.getEntities = function (x, y) {
  var buffer = this.getRegionData(2, x, y);
  return new SbonReader(buffer).readDocumentList();
};

},{"./btreedb":20,"./sbonreader":23,"zlib":15}],25:[function(require,module,exports){
(function (process,Buffer){
!function(globals) {
'use strict'

var _imports = {}

if (typeof module !== 'undefined' && module.exports) { //CommonJS
  if (typeof process !== 'undefined' && process.pid) {
    // Node.js
	module.exports = sha256_node;
  } else {
    _imports.bytesToHex = require('convert-hex').bytesToHex
    _imports.convertString = require('convert-string')
    module.exports = sha256
  }
} else {
  _imports.bytesToHex = globals.convertHex.bytesToHex
  _imports.convertString = globals.convertString
  globals.sha256 = sha256
}


// Node.js has its own Crypto function that can handle this natively
function sha256_node(message, options) {
	var crypto = require('crypto');
	var c = crypto.createHash('sha256');
	
	if (Buffer.isBuffer(message)) {
		c.update(message);
	} else if (Array.isArray(message)) {
		// Array of byte values
		c.update(new Buffer(message));
	} else {
		// Otherwise, treat as a binary string
		c.update(new Buffer(message, 'binary'));
	}
	var buf = c.digest();
	
	if (options && options.asBytes) {
		// Array of bytes as decimal integers
		var a = [];
		for(var i = 0; i < buf.length; i++) {
			a.push(buf[i]);
		}
		return a;
	} else if (options && options.asString) {
		// Binary string
		return buf.toString('binary');
	} else {
		// String of hex characters
		return buf.toString('hex');
	}
}
sha256_node.x2 = function(message, options) {
	return sha256_node(sha256_node(message, { asBytes:true }), options)
}

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/

// Initialization round constants tables
var K = []

// Compute constants
!function () {
  function isPrime(n) {
    var sqrtN = Math.sqrt(n);
    for (var factor = 2; factor <= sqrtN; factor++) {
      if (!(n % factor)) return false
    }

    return true
  }

  function getFractionalBits(n) {
    return ((n - (n | 0)) * 0x100000000) | 0
  }

  var n = 2
  var nPrime = 0
  while (nPrime < 64) {
    if (isPrime(n)) {
      K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3))
      nPrime++
    }

    n++
  }
}()

var bytesToWords = function (bytes) {
  var words = []
  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - b % 32)
  }
  return words
}

var wordsToBytes = function (words) {
  var bytes = []
  for (var b = 0; b < words.length * 32; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF)
  }
  return bytes
}

// Reusable object
var W = []

var processBlock = function (H, M, offset) {
  // Working variables
  var a = H[0], b = H[1], c = H[2], d = H[3]
  var e = H[4], f = H[5], g = H[6], h = H[7]

    // Computation
  for (var i = 0; i < 64; i++) {
    if (i < 16) {
      W[i] = M[offset + i] | 0
    } else {
      var gamma0x = W[i - 15]
      var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
                    ((gamma0x << 14) | (gamma0x >>> 18)) ^
                    (gamma0x >>> 3)

      var gamma1x = W[i - 2];
      var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                    ((gamma1x << 13) | (gamma1x >>> 19)) ^
                    (gamma1x >>> 10)

      W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
    }

    var ch  = (e & f) ^ (~e & g);
    var maj = (a & b) ^ (a & c) ^ (b & c);

    var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
    var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

    var t1 = h + sigma1 + ch + K[i] + W[i];
    var t2 = sigma0 + maj;

    h = g;
    g = f;
    f = e;
    e = (d + t1) | 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) | 0;
  }

  // Intermediate hash value
  H[0] = (H[0] + a) | 0;
  H[1] = (H[1] + b) | 0;
  H[2] = (H[2] + c) | 0;
  H[3] = (H[3] + d) | 0;
  H[4] = (H[4] + e) | 0;
  H[5] = (H[5] + f) | 0;
  H[6] = (H[6] + g) | 0;
  H[7] = (H[7] + h) | 0;
}

function sha256(message, options) {;
  if (message.constructor === String) {
    message = _imports.convertString.UTF8.stringToBytes(message);
  }

  var H =[ 0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
           0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19 ];

  var m = bytesToWords(message);
  var l = message.length * 8;

  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;

  for (var i=0 ; i<m.length; i += 16) {
    processBlock(H, m, i);
  }

  var digestbytes = wordsToBytes(H);
  return options && options.asBytes ? digestbytes :
         options && options.asString ? _imports.convertString.bytesToString(digestbytes) :
         _imports.bytesToHex(digestbytes)
}

sha256.x2 = function(message, options) {
  return sha256(sha256(message, { asBytes:true }), options)
}

}(this);
}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),require("buffer").Buffer)
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"buffer":2,"convert-hex":26,"convert-string":27,"crypto":6}],26:[function(require,module,exports){
!function(globals) {
'use strict'

var convertHex = {
  bytesToHex: function(bytes) {
    /*if (typeof bytes.byteLength != 'undefined') {
      var newBytes = []

      if (typeof bytes.buffer != 'undefined')
        bytes = new DataView(bytes.buffer)
      else
        bytes = new DataView(bytes)

      for (var i = 0; i < bytes.byteLength; ++i) {
        newBytes.push(bytes.getUint8(i))
      }
      bytes = newBytes
    }*/
    return arrBytesToHex(bytes)
  },
  hexToBytes: function(hex) {
    if (hex.length % 2 === 1) throw new Error("hexToBytes can't have a string with an odd number of characters.")
    if (hex.indexOf('0x') === 0) hex = hex.slice(2)
    return hex.match(/../g).map(function(x) { return parseInt(x,16) })
  }
}


// PRIVATE

function arrBytesToHex(bytes) {
  return bytes.map(function(x) { return padLeft(x.toString(16),2) }).join('')
}

function padLeft(orig, len) {
  if (orig.length > len) return orig
  return Array(len - orig.length + 1).join('0') + orig
}


if (typeof module !== 'undefined' && module.exports) { //CommonJS
  module.exports = convertHex
} else {
  globals.convertHex = convertHex
}

}(this);
},{}],27:[function(require,module,exports){
!function(globals) {
'use strict'

var convertString = {
  bytesToString: function(bytes) {
    return bytes.map(function(x){ return String.fromCharCode(x) }).join('')
  },
  stringToBytes: function(str) {
    return str.split('').map(function(x) { return x.charCodeAt(0) })
  }
}

//http://hossa.in/2012/07/20/utf-8-in-javascript.html
convertString.UTF8 = {
   bytesToString: function(bytes) {
    return decodeURIComponent(escape(convertString.bytesToString(bytes)))
  },
  stringToBytes: function(str) {
   return convertString.stringToBytes(unescape(encodeURIComponent(str)))
  }
}

if (typeof module !== 'undefined' && module.exports) { //CommonJS
  module.exports = convertString
} else {
  globals.convertString = convertString
}

}(this);
},{}],28:[function(require,module,exports){
(function (process,Buffer){
!function(globals) {
'use strict'

var _imports = {}

if (typeof module !== 'undefined' && module.exports) { //CommonJS
  if (false && typeof process !== 'undefined' && process.pid) {
    // Node.js
	module.exports = sha256_node;
  } else {
    _imports.bytesToHex = require('convert-hex').bytesToHex
    _imports.convertString = require('convert-string')
    module.exports = sha256
  }
} else {
  _imports.bytesToHex = globals.convertHex.bytesToHex
  _imports.convertString = globals.convertString
  globals.sha256 = sha256
}


// Node.js has its own Crypto function that can handle this natively
function sha256_node(message, options) {
	var crypto = require('crypto');
	var c = crypto.createHash('sha256');
	
	if (Buffer.isBuffer(message)) {
		c.update(message);
	} else if (Array.isArray(message)) {
		// Array of byte values
		c.update(new Buffer(message));
	} else {
		// Otherwise, treat as a binary string
		c.update(new Buffer(message, 'binary'));
	}
	var buf = c.digest();
	
	if (options && options.asBytes) {
		// Array of bytes as decimal integers
		var a = [];
		for(var i = 0; i < buf.length; i++) {
			a.push(buf[i]);
		}
		return a;
	} else if (options && options.asString) {
		// Binary string
		return buf.toString('binary');
	} else {
		// String of hex characters
		return buf.toString('hex');
	}
}
sha256_node.x2 = function(message, options) {
	return sha256_node(sha256_node(message, { asBytes:true }), options)
}

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/

// Initialization round constants tables
var K = []

// Compute constants
!function () {
  function isPrime(n) {
    var sqrtN = Math.sqrt(n);
    for (var factor = 2; factor <= sqrtN; factor++) {
      if (!(n % factor)) return false
    }

    return true
  }

  function getFractionalBits(n) {
    return ((n - (n | 0)) * 0x100000000) | 0
  }

  var n = 2
  var nPrime = 0
  while (nPrime < 64) {
    if (isPrime(n)) {
      K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3))
      nPrime++
    }

    n++
  }
}()

var bytesToWords = function (bytes) {
  var words = []
  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - b % 32)
  }
  return words
}

var wordsToBytes = function (words) {
  var bytes = []
  for (var b = 0; b < words.length * 32; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF)
  }
  return bytes
}

// Reusable object
var W = []

var processBlock = function (H, M, offset) {
  // Working variables
  var a = H[0], b = H[1], c = H[2], d = H[3]
  var e = H[4], f = H[5], g = H[6], h = H[7]

    // Computation
  for (var i = 0; i < 64; i++) {
    if (i < 16) {
      W[i] = M[offset + i] | 0
    } else {
      var gamma0x = W[i - 15]
      var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
                    ((gamma0x << 14) | (gamma0x >>> 18)) ^
                    (gamma0x >>> 3)

      var gamma1x = W[i - 2];
      var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                    ((gamma1x << 13) | (gamma1x >>> 19)) ^
                    (gamma1x >>> 10)

      W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
    }

    var ch  = (e & f) ^ (~e & g);
    var maj = (a & b) ^ (a & c) ^ (b & c);

    var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
    var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

    var t1 = h + sigma1 + ch + K[i] + W[i];
    var t2 = sigma0 + maj;

    h = g;
    g = f;
    f = e;
    e = (d + t1) | 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) | 0;
  }

  // Intermediate hash value
  H[0] = (H[0] + a) | 0;
  H[1] = (H[1] + b) | 0;
  H[2] = (H[2] + c) | 0;
  H[3] = (H[3] + d) | 0;
  H[4] = (H[4] + e) | 0;
  H[5] = (H[5] + f) | 0;
  H[6] = (H[6] + g) | 0;
  H[7] = (H[7] + h) | 0;
}

function sha256(message, options) {;
  if (message.constructor === String) {
    message = _imports.convertString.UTF8.stringToBytes(message);
  }

  var H =[ 0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
           0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19 ];

  var m = bytesToWords(message);
  var l = message.length * 8;

  m[l >> 5] |= 0x80 << (24 - l % 32);
  // This is a hack to make this algorithm compatible with the one in Starbound.
  if ((message.length & 0x3F) == 55) {
    m[31] = l;
  } else {
    m[((l + 64 >> 9) << 4) + 15] = l;
  }

  for (var i=0 ; i<m.length; i += 16) {
    processBlock(H, m, i);
  }

  var digestbytes = wordsToBytes(H);
  return options && options.asBytes ? digestbytes :
         options && options.asString ? _imports.convertString.bytesToString(digestbytes) :
         _imports.bytesToHex(digestbytes)
}

sha256.x2 = function(message, options) {
  return sha256(sha256(message, { asBytes:true }), options)
}

}(this);

}).call(this,require("/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),require("buffer").Buffer)
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"buffer":2,"convert-hex":29,"convert-string":30,"crypto":6}],29:[function(require,module,exports){
module.exports=require(26)
},{}],30:[function(require,module,exports){
module.exports=require(27)
},{}],31:[function(require,module,exports){
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
},{}]},{},[1,17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2VzNmlmeS9ub2RlX21vZHVsZXMvdHJhY2V1ci9zcmMvcnVudGltZS9ydW50aW1lLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvaGVscGVycy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2NyeXB0by1icm93c2VyaWZ5L21kNS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvcm5nLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9jcnlwdG8tYnJvd3NlcmlmeS9zaGEuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2NyeXB0by1icm93c2VyaWZ5L3NoYTI1Ni5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvemxpYi1icm93c2VyaWZ5L2luZGV4LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy96bGliLWJyb3dzZXJpZnkvemxpYi5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9mYWtlXzZjODFmZDYwLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9saWIvYmxvY2tmaWxlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbGliL2J0cmVlZGIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9saWIvZG9jdW1lbnQuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9saWIvcGFja2FnZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWZpbGVzL2xpYi9zYm9ucmVhZGVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbGliL3dvcmxkLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbm9kZV9tb2R1bGVzL3NoYTI1Ni9saWIvc2hhMjU2LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbm9kZV9tb2R1bGVzL3NoYTI1Ni9ub2RlX21vZHVsZXMvY29udmVydC1oZXgvY29udmVydC1oZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9ub2RlX21vZHVsZXMvc2hhMjU2L25vZGVfbW9kdWxlcy9jb252ZXJ0LXN0cmluZy9jb252ZXJ0LXN0cmluZy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWZpbGVzL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtc2hhMjU2L2xpYi9zaGEyNTYuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3dvcmtlcnByb3h5L2luZGV4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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERJLEdBQUEsTUFBQSxFQUFRLFFBQU8sQ0FBQyxpQkFBQSxDQUFBLENBQUEsS0FBQTtBQUNoQixHQUFBLFlBQUEsRUFBYyxRQUFPLENBQUMsYUFBQSxDQUFBO0FBR3RCLEdBQUEsT0FBQSxFQUFTLEVBQUEsQ0FBQTtBQUNULGNBQUEsRUFBYSxFQUFBO0FBRWpCLFdBQVcsQ0FBQztBQUNWLE9BQUEsQ0FBTyxTQUFBLENBQVUsTUFBQSxDQUFRLFNBQUEsQ0FBVTtBQUNqQyxVQUFBLEVBQVMsT0FBQSxDQUFBLFFBQWUsQ0FBQSxDQUFBO0FBQ3hCLE1BQUEsRUFBSSxDQUFDLENBQUMsTUFBQSxHQUFVLE9BQUEsQ0FBQSxDQUFTO0FBQ3ZCLFdBQU0sSUFBSSxNQUFLLENBQUMsa0NBQUEsQ0FBQTtBQUFBO0FBS2xCLFVBQU8sT0FBQSxDQUFPLE1BQUEsQ0FBQTtBQUNkLFlBQVEsQ0FBQyxJQUFBLENBQUE7QUFBQSxHQUFBO0FBR1gsV0FBQSxDQUFXLFNBQUEsQ0FBVSxNQUFBLENBQVEsRUFBQSxDQUFHLEVBQUEsQ0FBRyxTQUFBLENBQVU7QUFDM0MsVUFBQSxFQUFTLE9BQUEsQ0FBQSxRQUFlLENBQUEsQ0FBQTtBQUN4QixNQUFBLEVBQUksQ0FBQyxDQUFDLE1BQUEsR0FBVSxPQUFBLENBQUEsQ0FBUztBQUN2QixXQUFNLElBQUksTUFBSyxDQUFDLGtDQUFBLENBQUE7QUFBQTtBQUdkLE9BQUEsTUFBQSxFQUFRLE9BQUEsQ0FBTyxNQUFBLENBQUEsQ0FBQSxLQUFBO0FBRWYsT0FBQSxPQUFBLEVBQVMsTUFBQSxDQUFBLGFBQW1CLENBQUMsQ0FBQSxDQUFHLEVBQUEsQ0FBRyxFQUFBLENBQUE7QUFDbkMsZ0JBQUEsRUFBVyxNQUFBLENBQUEsV0FBaUIsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFBO0FBRWhDLE9BQUEsT0FBQSxFQUFTO0FBQUMsWUFBQSxDQUFRLE9BQUE7QUFBUSxjQUFBLENBQVU7QUFBQSxLQUFBO0FBQ3hDLFlBQUEsQ0FBQSxRQUFpQixDQUFDLENBQUMsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFnQixLQUFBLENBQU0sT0FBQSxDQUFBO0FBQUEsR0FBQTtBQUczQyxNQUFBLENBQU0sU0FBQSxDQUFVLElBQUEsQ0FBTSxTQUFBLENBQVU7QUFFMUIsT0FBQSxNQUFBLEVBQVEsTUFBQSxDQUFBLElBQVUsQ0FBQyxJQUFBLENBQUE7QUFDbkIsZ0JBQUEsRUFBVyxNQUFBLENBQUEsV0FBaUIsQ0FBQSxDQUFBO0FBRzVCLE9BQUEsT0FBQSxFQUFTLFdBQUEsRUFBQTtBQUNiLFVBQUEsQ0FBTyxNQUFBLENBQUEsRUFBVSxFQUFDLEtBQUEsQ0FBTyxNQUFBLENBQUE7QUFFekIsWUFBUSxDQUFDLElBQUEsQ0FBTTtBQUFDLFlBQUEsQ0FBUSxPQUFBO0FBQVEsY0FBQSxDQUFVO0FBQUEsS0FBQSxDQUFBO0FBQUE7QUFBQSxDQUFBLENBRTNDLEVBQUMsV0FBQSxDQUFhLEtBQUEsQ0FBQSxDQUFBOzs7O0FDOUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDEyIFRyYWNldXIgQXV0aG9ycy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vKipcbiAqIFRoZSB0cmFjZXVyIHJ1bnRpbWUuXG4gKi9cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChnbG9iYWwuJHRyYWNldXJSdW50aW1lKSB7XG4gICAgLy8gUHJldmVudHMgZnJvbSBiZWluZyBleGVjdXRlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgJGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xuICB2YXIgJGZyZWV6ZSA9IE9iamVjdC5mcmVlemU7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICB2YXIgJGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuICB2YXIgJGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuXG4gIGZ1bmN0aW9uIG5vbkVudW0odmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gIH1cblxuICB2YXIgbWV0aG9kID0gbm9uRW51bTtcblxuICBmdW5jdGlvbiBwb2x5ZmlsbFN0cmluZyhTdHJpbmcpIHtcbiAgICAvLyBIYXJtb255IFN0cmluZyBFeHRyYXNcbiAgICAvLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OnN0cmluZ19leHRyYXNcbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcucHJvdG90eXBlLCB7XG4gICAgICBzdGFydHNXaXRoOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgIHJldHVybiB0aGlzLmxhc3RJbmRleE9mKHMsIDApID09PSAwO1xuICAgICAgfSksXG4gICAgICBlbmRzV2l0aDogbWV0aG9kKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgdmFyIHQgPSBTdHJpbmcocyk7XG4gICAgICAgIHZhciBsID0gdGhpcy5sZW5ndGggLSB0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGwgPj0gMCAmJiB0aGlzLmluZGV4T2YodCwgbCkgPT09IGw7XG4gICAgICB9KSxcbiAgICAgIGNvbnRhaW5zOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHMpICE9PSAtMTtcbiAgICAgIH0pLFxuICAgICAgdG9BcnJheTogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGxpdCgnJyk7XG4gICAgICB9KSxcbiAgICAgIGNvZGVQb2ludEF0OiBtZXRob2QoZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgICAgLyohIGh0dHA6Ly9tdGhzLmJlL2NvZGVwb2ludGF0IHYwLjEuMCBieSBAbWF0aGlhcyAqL1xuICAgICAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgICAgICB2YXIgc2l6ZSA9IHN0cmluZy5sZW5ndGg7XG4gICAgICAgIC8vIGBUb0ludGVnZXJgXG4gICAgICAgIHZhciBpbmRleCA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgICAgIGlmIChpc05hTihpbmRleCkpIHtcbiAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWNjb3VudCBmb3Igb3V0LW9mLWJvdW5kcyBpbmRpY2VzOlxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3QgY29kZSB1bml0XG4gICAgICAgIHZhciBmaXJzdCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgdmFyIHNlY29uZDtcbiAgICAgICAgaWYgKCAvLyBjaGVjayBpZiBpdOKAmXMgdGhlIHN0YXJ0IG9mIGEgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICBmaXJzdCA+PSAweEQ4MDAgJiYgZmlyc3QgPD0gMHhEQkZGICYmIC8vIGhpZ2ggc3Vycm9nYXRlXG4gICAgICAgICAgc2l6ZSA+IGluZGV4ICsgMSAvLyB0aGVyZSBpcyBhIG5leHQgY29kZSB1bml0XG4gICAgICAgICkge1xuICAgICAgICAgIHNlY29uZCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG4gICAgICAgICAgaWYgKHNlY29uZCA+PSAweERDMDAgJiYgc2Vjb25kIDw9IDB4REZGRikgeyAvLyBsb3cgc3Vycm9nYXRlXG4gICAgICAgICAgICAvLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nI3N1cnJvZ2F0ZS1mb3JtdWxhZVxuICAgICAgICAgICAgcmV0dXJuIChmaXJzdCAtIDB4RDgwMCkgKiAweDQwMCArIHNlY29uZCAtIDB4REMwMCArIDB4MTAwMDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcsIHtcbiAgICAgIC8vIDIxLjEuMi40IFN0cmluZy5yYXcoY2FsbFNpdGUsIC4uLnN1YnN0aXR1dGlvbnMpXG4gICAgICByYXc6IG1ldGhvZChmdW5jdGlvbihjYWxsc2l0ZSkge1xuICAgICAgICB2YXIgcmF3ID0gY2FsbHNpdGUucmF3O1xuICAgICAgICB2YXIgbGVuID0gcmF3Lmxlbmd0aCA+Pj4gMDsgIC8vIFRvVWludFxuICAgICAgICBpZiAobGVuID09PSAwKVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHMgKz0gcmF3W2ldO1xuICAgICAgICAgIGlmIChpICsgMSA9PT0gbGVuKVxuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgcyArPSBhcmd1bWVudHNbKytpXTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICAvLyAyMS4xLjIuMiBTdHJpbmcuZnJvbUNvZGVQb2ludCguLi5jb2RlUG9pbnRzKVxuICAgICAgZnJvbUNvZGVQb2ludDogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBodHRwOi8vbXRocy5iZS9mcm9tY29kZXBvaW50IHYwLjEuMCBieSBAbWF0aGlhc1xuICAgICAgICB2YXIgY29kZVVuaXRzID0gW107XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIHZhciBoaWdoU3Vycm9nYXRlO1xuICAgICAgICB2YXIgbG93U3Vycm9nYXRlO1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGNvZGVQb2ludCA9IE51bWJlcihhcmd1bWVudHNbaW5kZXhdKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhaXNGaW5pdGUoY29kZVBvaW50KSB8fCAgLy8gYE5hTmAsIGArSW5maW5pdHlgLCBvciBgLUluZmluaXR5YFxuICAgICAgICAgICAgY29kZVBvaW50IDwgMCB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCAgLy8gbm90IGFuIGludGVnZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IFJhbmdlRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludDogJyArIGNvZGVQb2ludCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb2RlUG9pbnQgPD0gMHhGRkZGKSB7ICAvLyBCTVAgY29kZSBwb2ludFxuICAgICAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgICAgICB9IGVsc2UgeyAgLy8gQXN0cmFsIGNvZGUgcG9pbnQ7IHNwbGl0IGluIHN1cnJvZ2F0ZSBoYWx2ZXNcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmcjc3Vycm9nYXRlLWZvcm11bGFlXG4gICAgICAgICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIGhpZ2hTdXJyb2dhdGUgPSAoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMDtcbiAgICAgICAgICAgIGxvd1N1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgJSAweDQwMCkgKyAweERDMDA7XG4gICAgICAgICAgICBjb2RlVW5pdHMucHVzaChoaWdoU3Vycm9nYXRlLCBsb3dTdXJyb2dhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBjb2RlVW5pdHMpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIC8vICMjIyBTeW1ib2xzXG4gIC8vXG4gIC8vIFN5bWJvbHMgYXJlIGVtdWxhdGVkIHVzaW5nIGFuIG9iamVjdCB3aGljaCBpcyBhbiBpbnN0YW5jZSBvZiBTeW1ib2xWYWx1ZS5cbiAgLy8gQ2FsbGluZyBTeW1ib2wgYXMgYSBmdW5jdGlvbiByZXR1cm5zIGEgc3ltYm9sIHZhbHVlIG9iamVjdC5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGVuYWJsZWQgdGhlbiBhbGwgcHJvcGVydHkgYWNjZXNzZXMgYXJlIHRyYW5zZm9ybWVkXG4gIC8vIGludG8gcnVudGltZSBjYWxscyB3aGljaCB1c2VzIHRoZSBpbnRlcm5hbCBzdHJpbmcgYXMgdGhlIHJlYWwgcHJvcGVydHlcbiAgLy8gbmFtZS5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGRpc2FibGVkIHN5bWJvbHMganVzdCB0b1N0cmluZyBhcyB0aGVpciBpbnRlcm5hbFxuICAvLyByZXByZXNlbnRhdGlvbiwgbWFraW5nIHRoZW0gd29yayBidXQgbGVhayBhcyBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG5cbiAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgdW5pcXVlIHN0cmluZy5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgZnVuY3Rpb24gbmV3VW5pcXVlU3RyaW5nKCkge1xuICAgIHJldHVybiAnX18kJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDFlOSkgKyAnJCcgKyArK2NvdW50ZXIgKyAnJF9fJztcbiAgfVxuXG4gIC8vIFRoZSBzdHJpbmcgdXNlZCBmb3IgdGhlIHJlYWwgcHJvcGVydHkuXG4gIHZhciBzeW1ib2xJbnRlcm5hbFByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG5cbiAgLy8gVXNlZCBmb3IgdGhlIFN5bWJvbCB3cmFwcGVyXG4gIHZhciBzeW1ib2xEYXRhUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcblxuICAvLyBBbGwgc3ltYm9sIHZhbHVlcyBhcmUga2VwdCBpbiB0aGlzIG1hcC4gVGhpcyBpcyBzbyB0aGF0IHdlIGNhbiBnZXQgYmFjayB0b1xuICAvLyB0aGUgc3ltYm9sIG9iamVjdCBpZiBhbGwgd2UgaGF2ZSBpcyB0aGUgc3RyaW5nIGtleSByZXByZXNlbnRpbmcgdGhlIHN5bWJvbC5cbiAgdmFyIHN5bWJvbFZhbHVlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgZnVuY3Rpb24gaXNTeW1ib2woc3ltYm9sKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzeW1ib2wgPT09ICdvYmplY3QnICYmIHN5bWJvbCBpbnN0YW5jZW9mIFN5bWJvbFZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gdHlwZU9mKHYpIHtcbiAgICBpZiAoaXNTeW1ib2wodikpXG4gICAgICByZXR1cm4gJ3N5bWJvbCc7XG4gICAgcmV0dXJuIHR5cGVvZiB2O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdW5pcXVlIHN5bWJvbCBvYmplY3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc3RyaW5nIE9wdGlvbmFsIHN0cmluZyB1c2VkIGZvciB0b1N0cmluZy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcbiAgICB2YXIgdmFsdWUgPSBuZXcgU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTeW1ib2wpKVxuICAgICAgcmV0dXJuIHZhbHVlO1xuXG4gICAgLy8gbmV3IFN5bWJvbCBzaG91bGQgdGhyb3cuXG4gICAgLy9cbiAgICAvLyBUaGVyZSBhcmUgdHdvIHdheXMgdG8gZ2V0IGEgd3JhcHBlciB0byBhIHN5bWJvbC4gRWl0aGVyIGJ5IGRvaW5nXG4gICAgLy8gT2JqZWN0KHN5bWJvbCkgb3IgY2FsbCBhIG5vbiBzdHJpY3QgZnVuY3Rpb24gdXNpbmcgYSBzeW1ib2wgdmFsdWUgYXNcbiAgICAvLyB0aGlzLiBUbyBjb3JyZWN0bHkgaGFuZGxlIHRoZXNlIHR3byB3b3VsZCByZXF1aXJlIGEgbG90IG9mIHdvcmsgZm9yIHZlcnlcbiAgICAvLyBsaXR0bGUgZ2FpbiBzbyB3ZSBhcmUgbm90IGRvaW5nIHRob3NlIGF0IHRoZSBtb21lbnQuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGNhbm5vdCBiZSBuZXdcXCdlZCcpO1xuICB9XG5cbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2wucHJvdG90eXBlLCAndG9TdHJpbmcnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgaWYgKCFzeW1ib2xWYWx1ZSlcbiAgICAgIHRocm93IFR5cGVFcnJvcignQ29udmVyc2lvbiBmcm9tIHN5bWJvbCB0byBzdHJpbmcnKTtcbiAgICB2YXIgZGVzYyA9IHN5bWJvbFZhbHVlW3N5bWJvbERlc2NyaXB0aW9uUHJvcGVydHldO1xuICAgIGlmIChkZXNjID09PSB1bmRlZmluZWQpXG4gICAgICBkZXNjID0gJyc7XG4gICAgcmV0dXJuICdTeW1ib2woJyArIGRlc2MgKyAnKSc7XG4gIH0pKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd2YWx1ZU9mJywgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlO1xuICB9KSk7XG5cbiAgZnVuY3Rpb24gU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pIHtcbiAgICB2YXIga2V5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERhdGFQcm9wZXJ0eSwge3ZhbHVlOiB0aGlzfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbEludGVybmFsUHJvcGVydHksIHt2YWx1ZToga2V5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHksIHt2YWx1ZTogZGVzY3JpcHRpb259KTtcbiAgICAkZnJlZXplKHRoaXMpO1xuICAgIHN5bWJvbFZhbHVlc1trZXldID0gdGhpcztcbiAgfVxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbCkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndG9TdHJpbmcnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd2YWx1ZU9mJywge1xuICAgIHZhbHVlOiBTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRmcmVlemUoU3ltYm9sVmFsdWUucHJvdG90eXBlKTtcblxuICBTeW1ib2wuaXRlcmF0b3IgPSBTeW1ib2woKTtcblxuICBmdW5jdGlvbiB0b1Byb3BlcnR5KG5hbWUpIHtcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpXG4gICAgICByZXR1cm4gbmFtZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGdldE93blByb3BlcnR5TmFtZXMgdG8gZmlsdGVyIG91dCBwcml2YXRlIG5hbWUga2V5cy5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICBpZiAoIXN5bWJvbFZhbHVlc1tuYW1lXSlcbiAgICAgICAgcnYucHVzaChuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkge1xuICAgIHJldHVybiAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgdmFyIG5hbWVzID0gJGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3ltYm9sID0gc3ltYm9sVmFsdWVzW25hbWVzW2ldXTtcbiAgICAgIGlmIChzeW1ib2wpXG4gICAgICAgIHJ2LnB1c2goc3ltYm9sKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgT2JqZWN0LnByb3RvdHBlLmhhc093blByb3BlcnR5IHRvIGFsd2F5cyByZXR1cm4gZmFsc2UgZm9yXG4gIC8vIHByaXZhdGUgbmFtZXMuXG4gIGZ1bmN0aW9uIGhhc093blByb3BlcnR5KG5hbWUpIHtcbiAgICByZXR1cm4gJGhhc093blByb3BlcnR5LmNhbGwodGhpcywgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPcHRpb24obmFtZSkge1xuICAgIHJldHVybiBnbG9iYWwudHJhY2V1ciAmJiBnbG9iYWwudHJhY2V1ci5vcHRpb25zW25hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJvcGVydHkob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBzeW0sIGRlc2M7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICBzeW0gPSBuYW1lO1xuICAgICAgbmFtZSA9IG5hbWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgfVxuICAgIG9iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgIGlmIChzeW0gJiYgKGRlc2MgPSAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkpKVxuICAgICAgJGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwge2VudW1lcmFibGU6IGZhbHNlfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKSB7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICAvLyBTeW1ib2xzIHNob3VsZCBub3QgYmUgZW51bWVyYWJsZS4gV2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgZGVzY3JpcHRvclxuICAgICAgLy8gYmVmb3JlIGNhbGxpbmcgdGhlIG9yaWdpbmFsIGRlZmluZVByb3BlcnR5IGJlY2F1c2UgdGhlIHByb3BlcnR5IG1pZ2h0XG4gICAgICAvLyBiZSBtYWRlIG5vbiBjb25maWd1cmFibGUuXG4gICAgICBpZiAoZGVzY3JpcHRvci5lbnVtZXJhYmxlKSB7XG4gICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuY3JlYXRlKGRlc2NyaXB0b3IsIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB7dmFsdWU6IGZhbHNlfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG5hbWUgPSBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIH1cbiAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKTtcblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbE9iamVjdChPYmplY3QpIHtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZGVmaW5lUHJvcGVydHknLCB7dmFsdWU6IGRlZmluZVByb3BlcnR5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2dldE93blByb3BlcnR5TmFtZXMnLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGdldE93blByb3BlcnR5TmFtZXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yJyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3J9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ2hhc093blByb3BlcnR5JyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBoYXNPd25Qcm9wZXJ0eX0pO1xuXG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scztcblxuICAgIC8vIE9iamVjdC5pc1xuXG4gICAgLy8gVW5saWtlID09PSB0aGlzIHJldHVybnMgdHJ1ZSBmb3IgKE5hTiwgTmFOKSBhbmQgZmFsc2UgZm9yICgwLCAtMCkuXG4gICAgZnVuY3Rpb24gaXMobGVmdCwgcmlnaHQpIHtcbiAgICAgIGlmIChsZWZ0ID09PSByaWdodClcbiAgICAgICAgcmV0dXJuIGxlZnQgIT09IDAgfHwgMSAvIGxlZnQgPT09IDEgLyByaWdodDtcbiAgICAgIHJldHVybiBsZWZ0ICE9PSBsZWZ0ICYmIHJpZ2h0ICE9PSByaWdodDtcbiAgICB9XG5cbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnaXMnLCBtZXRob2QoaXMpKTtcblxuICAgIC8vIE9iamVjdC5hc3NpZ24gKDE5LjEuMy4xKVxuICAgIGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BzW3BdXSA9IHNvdXJjZVtwcm9wc1twXV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdhc3NpZ24nLCBtZXRob2QoYXNzaWduKSk7XG5cbiAgICAvLyBPYmplY3QubWl4aW4gKDE5LjEuMy4xNSlcbiAgICBmdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBkZXNjcmlwdG9yLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgZGVzY3JpcHRvciA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBwcm9wc1twXSk7XG4gICAgICAgICRkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BzW3BdLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ21peGluJywgbWV0aG9kKG1peGluKSk7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbEFycmF5KEFycmF5KSB7XG4gICAgLy8gTWFrZSBhcnJheXMgaXRlcmFibGUuXG4gICAgLy8gVE9ETyhhcnYpOiBUaGlzIGlzIG5vdCB2ZXJ5IHJvYnVzdCB0byBjaGFuZ2VzIGluIHRoZSBwcml2YXRlIG5hbWVzXG4gICAgLy8gb3B0aW9uIGJ1dCBmb3J0dW5hdGVseSB0aGlzIGlzIG5vdCBzb21ldGhpbmcgdGhhdCBpcyBleHBlY3RlZCB0byBjaGFuZ2VcbiAgICAvLyBhdCBydW50aW1lIG91dHNpZGUgb2YgdGVzdHMuXG4gICAgZGVmaW5lUHJvcGVydHkoQXJyYXkucHJvdG90eXBlLCBTeW1ib2wuaXRlcmF0b3IsIG1ldGhvZChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgYXJyYXkgPSB0aGlzO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOiBhcnJheVtpbmRleCsrXSwgZG9uZTogZmFsc2V9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWV9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYW5jZWxsZXJcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBEZWZlcnJlZChjYW5jZWxsZXIpIHtcbiAgICB0aGlzLmNhbmNlbGxlcl8gPSBjYW5jZWxsZXI7XG4gICAgdGhpcy5saXN0ZW5lcnNfID0gW107XG4gIH1cblxuICBmdW5jdGlvbiBub3RpZnkoc2VsZikge1xuICAgIHdoaWxlIChzZWxmLmxpc3RlbmVyc18ubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGN1cnJlbnQgPSBzZWxmLmxpc3RlbmVyc18uc2hpZnQoKTtcbiAgICAgIHZhciBjdXJyZW50UmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2VsZi5yZXN1bHRfWzFdKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5lcnJiYWNrKVxuICAgICAgICAgICAgICBjdXJyZW50UmVzdWx0ID0gY3VycmVudC5lcnJiYWNrLmNhbGwodW5kZWZpbmVkLCBzZWxmLnJlc3VsdF9bMF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5jYWxsYmFjaylcbiAgICAgICAgICAgICAgY3VycmVudFJlc3VsdCA9IGN1cnJlbnQuY2FsbGJhY2suY2FsbCh1bmRlZmluZWQsIHNlbGYucmVzdWx0X1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuY2FsbGJhY2soY3VycmVudFJlc3VsdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuZXJyYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoICh1bnVzZWQpIHt9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmlyZShzZWxmLCB2YWx1ZSwgaXNFcnJvcikge1xuICAgIGlmIChzZWxmLmZpcmVkXylcbiAgICAgIHRocm93IG5ldyBFcnJvcignYWxyZWFkeSBmaXJlZCcpO1xuXG4gICAgc2VsZi5maXJlZF8gPSB0cnVlO1xuICAgIHNlbGYucmVzdWx0XyA9IFt2YWx1ZSwgaXNFcnJvcl07XG4gICAgbm90aWZ5KHNlbGYpO1xuICB9XG5cbiAgRGVmZXJyZWQucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBEZWZlcnJlZCxcblxuICAgIGZpcmVkXzogZmFsc2UsXG4gICAgcmVzdWx0XzogdW5kZWZpbmVkLFxuXG4gICAgY3JlYXRlUHJvbWlzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge3RoZW46IHRoaXMudGhlbi5iaW5kKHRoaXMpLCBjYW5jZWw6IHRoaXMuY2FuY2VsLmJpbmQodGhpcyl9O1xuICAgIH0sXG5cbiAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZpcmUodGhpcywgdmFsdWUsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgZXJyYmFjazogZnVuY3Rpb24oZXJyKSB7XG4gICAgICBmaXJlKHRoaXMsIGVyciwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHRoZW46IGZ1bmN0aW9uKGNhbGxiYWNrLCBlcnJiYWNrKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IERlZmVycmVkKHRoaXMuY2FuY2VsLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5saXN0ZW5lcnNfLnB1c2goe1xuICAgICAgICBkZWZlcnJlZDogcmVzdWx0LFxuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgIGVycmJhY2s6IGVycmJhY2tcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuZmlyZWRfKVxuICAgICAgICBub3RpZnkodGhpcyk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNyZWF0ZVByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmZpcmVkXylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbHJlYWR5IGZpbmlzaGVkJyk7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgaWYgKHRoaXMuY2FuY2VsbGVyXykge1xuICAgICAgICByZXN1bHQgPSB0aGlzLmNhbmNlbGxlcl8odGhpcyk7XG4gICAgICAgIGlmICghcmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEVycm9yKHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBuZXcgRXJyb3IoJ2NhbmNlbGxlZCcpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmZpcmVkXykge1xuICAgICAgICB0aGlzLnJlc3VsdF8gPSBbcmVzdWx0LCB0cnVlXTtcbiAgICAgICAgbm90aWZ5KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBTeXN0ZW0uZ2V0L3NldCBhbmQgQHRyYWNldXIvbW9kdWxlIGdldHMgb3ZlcnJpZGRlbiBpbiBAdHJhY2V1ci9tb2R1bGVzIHRvXG4gIC8vIGJlIG1vcmUgY29ycmVjdC5cblxuICBmdW5jdGlvbiBNb2R1bGVJbXBsKHVybCwgZnVuYywgc2VsZikge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZnVuYyA9IGZ1bmM7XG4gICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICB0aGlzLnZhbHVlXyA9IG51bGw7XG4gIH1cbiAgTW9kdWxlSW1wbC5wcm90b3R5cGUgPSB7XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgaWYgKHRoaXMudmFsdWVfKVxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZV87XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZV8gPSB0aGlzLmZ1bmMuY2FsbCh0aGlzLnNlbGYpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbW9kdWxlcyA9IHtcbiAgICAnQHRyYWNldXIvbW9kdWxlJzoge1xuICAgICAgTW9kdWxlSW1wbDogTW9kdWxlSW1wbCxcbiAgICAgIHJlZ2lzdGVyTW9kdWxlOiBmdW5jdGlvbih1cmwsIGZ1bmMsIHNlbGYpIHtcbiAgICAgICAgbW9kdWxlc1t1cmxdID0gbmV3IE1vZHVsZUltcGwodXJsLCBmdW5jLCBzZWxmKTtcbiAgICAgIH0sXG4gICAgICBnZXRNb2R1bGVJbXBsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbdXJsXS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIFN5c3RlbSA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBtb2R1bGUgPSBtb2R1bGVzW25hbWVdO1xuICAgICAgaWYgKG1vZHVsZSBpbnN0YW5jZW9mIE1vZHVsZUltcGwpXG4gICAgICAgIHJldHVybiBtb2R1bGVzW25hbWVdID0gbW9kdWxlLnZhbHVlO1xuICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24obmFtZSwgb2JqZWN0KSB7XG4gICAgICBtb2R1bGVzW25hbWVdID0gb2JqZWN0O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBzZXR1cEdsb2JhbHMoZ2xvYmFsKSB7XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sKVxuICAgICAgZ2xvYmFsLlN5bWJvbCA9IFN5bWJvbDtcbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wuaXRlcmF0b3IpXG4gICAgICBnbG9iYWwuU3ltYm9sLml0ZXJhdG9yID0gU3ltYm9sKCk7XG5cbiAgICBwb2x5ZmlsbFN0cmluZyhnbG9iYWwuU3RyaW5nKTtcbiAgICBwb2x5ZmlsbE9iamVjdChnbG9iYWwuT2JqZWN0KTtcbiAgICBwb2x5ZmlsbEFycmF5KGdsb2JhbC5BcnJheSk7XG4gICAgZ2xvYmFsLlN5c3RlbSA9IFN5c3RlbTtcbiAgICAvLyBUT0RPKGFydik6IERvbid0IGV4cG9ydCB0aGlzLlxuICAgIGdsb2JhbC5EZWZlcnJlZCA9IERlZmVycmVkO1xuICB9XG5cbiAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG5cbiAgLy8gVGhpcyBmaWxlIGlzIHNvbWV0aW1lcyB1c2VkIHdpdGhvdXQgdHJhY2V1ci5qcyBzbyBtYWtlIGl0IGEgbmV3IGdsb2JhbC5cbiAgZ2xvYmFsLiR0cmFjZXVyUnVudGltZSA9IHtcbiAgICBEZWZlcnJlZDogRGVmZXJyZWQsXG4gICAgc2V0UHJvcGVydHk6IHNldFByb3BlcnR5LFxuICAgIHNldHVwR2xvYmFsczogc2V0dXBHbG9iYWxzLFxuICAgIHRvUHJvcGVydHk6IHRvUHJvcGVydHksXG4gICAgdHlwZW9mOiB0eXBlT2YsXG4gIH07XG5cbn0pKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcyk7XG4iLCIvKipcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEF1dGhvcjogICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogTGljZW5zZTogIE1JVFxuICpcbiAqIGBucG0gaW5zdGFsbCBidWZmZXJgXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssXG4gICAvLyBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLCBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IGFkZGluZyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXM/IElmXG4gIC8vIG5vdCwgdGhlbiB0aGF0J3MgdGhlIHNhbWUgYXMgbm8gYFVpbnQ4QXJyYXlgIHN1cHBvcnQuIFdlIG5lZWQgdG8gYmUgYWJsZSB0b1xuICAvLyBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy5cbiAgLy8gQnVnIGluIEZpcmVmb3ggNC0yOSwgbm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMClcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gQXNzdW1lIG9iamVjdCBpcyBhbiBhcnJheVxuICBlbHNlXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCBuZWVkcyB0byBiZSBhIG51bWJlciwgYXJyYXkgb3Igc3RyaW5nLicpXG5cbiAgdmFyIGJ1ZlxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIC8vIFByZWZlcnJlZDogUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBidWYgPSBhdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2YgVWludDhBcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgc3ViamVjdCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSBVaW50OEFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICAvLyBjb3B5IVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyBpKyspXG4gICAgdGFyZ2V0W2kgKyB0YXJnZXRfc3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBhdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNoYXJDb2RlQXQoMClcbiAgfVxuXG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSksICd2YWx1ZSBpcyBub3QgYSBudW1iZXInKVxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdGhpc1tpXSA9IHZhbHVlXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IHRoZSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbmZ1bmN0aW9uIGF1Z21lbnQgKGFycikge1xuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgZ2V0L3NldCBtZXRob2RzIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX2dldCA9IGFyci5nZXRcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZCwgd2lsbCBiZSByZW1vdmVkIGluIG5vZGUgMC4xMytcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxuLy8gc2xpY2Uoc3RhcnQsIGVuZClcbmZ1bmN0aW9uIGNsYW1wIChpbmRleCwgbGVuLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicpIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgaW5kZXggPSB+fmluZGV4OyAgLy8gQ29lcmNlIHRvIGludGVnZXIuXG4gIGlmIChpbmRleCA+PSBsZW4pIHJldHVybiBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICBpbmRleCArPSBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICByZXR1cm4gMFxufVxuXG5mdW5jdGlvbiBjb2VyY2UgKGxlbmd0aCkge1xuICAvLyBDb2VyY2UgbGVuZ3RoIHRvIGEgbnVtYmVyIChwb3NzaWJseSBOYU4pLCByb3VuZCB1cFxuICAvLyBpbiBjYXNlIGl0J3MgZnJhY3Rpb25hbCAoZS5nLiAxMjMuNDU2KSB0aGVuIGRvIGFcbiAgLy8gZG91YmxlIG5lZ2F0ZSB0byBjb2VyY2UgYSBOYU4gdG8gMC4gRWFzeSwgcmlnaHQ/XG4gIGxlbmd0aCA9IH5+TWF0aC5jZWlsKCtsZW5ndGgpXG4gIHJldHVybiBsZW5ndGggPCAwID8gMCA6IGxlbmd0aFxufVxuXG5mdW5jdGlvbiBpc0FycmF5IChzdWJqZWN0KSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoc3ViamVjdCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ViamVjdCkgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgfSkoc3ViamVjdClcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYiA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYgKGIgPD0gMHg3RilcbiAgICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKVxuICAgIGVsc2Uge1xuICAgICAgdmFyIHN0YXJ0ID0gaVxuICAgICAgaWYgKGIgPj0gMHhEODAwICYmIGIgPD0gMHhERkZGKSBpKytcbiAgICAgIHZhciBoID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0ci5zbGljZShzdGFydCwgaSsxKSkuc3Vic3RyKDEpLnNwbGl0KCclJylcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaC5sZW5ndGg7IGorKylcbiAgICAgICAgYnl0ZUFycmF5LnB1c2gocGFyc2VJbnQoaFtqXSwgMTYpKVxuICAgIH1cbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShzdHIpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgcG9zXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpXG4gICAgICBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuXG4vKlxuICogV2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgdmFsdWUgaXMgYSB2YWxpZCBpbnRlZ2VyLiBUaGlzIG1lYW5zIHRoYXQgaXRcbiAqIGlzIG5vbi1uZWdhdGl2ZS4gSXQgaGFzIG5vIGZyYWN0aW9uYWwgY29tcG9uZW50IGFuZCB0aGF0IGl0IGRvZXMgbm90XG4gKiBleGNlZWQgdGhlIG1heGltdW0gYWxsb3dlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdmVyaWZ1aW50ICh2YWx1ZSwgbWF4KSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA+PSAwLCAnc3BlY2lmaWVkIGEgbmVnYXRpdmUgdmFsdWUgZm9yIHdyaXRpbmcgYW4gdW5zaWduZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgaXMgbGFyZ2VyIHRoYW4gbWF4aW11bSB2YWx1ZSBmb3IgdHlwZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmc2ludCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmSUVFRTc1NCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG59XG5cbmZ1bmN0aW9uIGFzc2VydCAodGVzdCwgbWVzc2FnZSkge1xuICBpZiAoIXRlc3QpIHRocm93IG5ldyBFcnJvcihtZXNzYWdlIHx8ICdGYWlsZWQgYXNzZXJ0aW9uJylcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgWkVSTyAgID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSClcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdG1vZHVsZS5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KCkpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG5cbiAgaSArPSBkO1xuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBzID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gZUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIGUgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBtTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXM7XG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KTtcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgIGUgPSBlIC0gZUJpYXM7XG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG59O1xuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcbiIsInZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG52YXIgaW50U2l6ZSA9IDQ7XG52YXIgemVyb0J1ZmZlciA9IG5ldyBCdWZmZXIoaW50U2l6ZSk7IHplcm9CdWZmZXIuZmlsbCgwKTtcbnZhciBjaHJzeiA9IDg7XG5cbmZ1bmN0aW9uIHRvQXJyYXkoYnVmLCBiaWdFbmRpYW4pIHtcbiAgaWYgKChidWYubGVuZ3RoICUgaW50U2l6ZSkgIT09IDApIHtcbiAgICB2YXIgbGVuID0gYnVmLmxlbmd0aCArIChpbnRTaXplIC0gKGJ1Zi5sZW5ndGggJSBpbnRTaXplKSk7XG4gICAgYnVmID0gQnVmZmVyLmNvbmNhdChbYnVmLCB6ZXJvQnVmZmVyXSwgbGVuKTtcbiAgfVxuXG4gIHZhciBhcnIgPSBbXTtcbiAgdmFyIGZuID0gYmlnRW5kaWFuID8gYnVmLnJlYWRJbnQzMkJFIDogYnVmLnJlYWRJbnQzMkxFO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkgKz0gaW50U2l6ZSkge1xuICAgIGFyci5wdXNoKGZuLmNhbGwoYnVmLCBpKSk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuZnVuY3Rpb24gdG9CdWZmZXIoYXJyLCBzaXplLCBiaWdFbmRpYW4pIHtcbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc2l6ZSk7XG4gIHZhciBmbiA9IGJpZ0VuZGlhbiA/IGJ1Zi53cml0ZUludDMyQkUgOiBidWYud3JpdGVJbnQzMkxFO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZuLmNhbGwoYnVmLCBhcnJbaV0sIGkgKiA0LCB0cnVlKTtcbiAgfVxuICByZXR1cm4gYnVmO1xufVxuXG5mdW5jdGlvbiBoYXNoKGJ1ZiwgZm4sIGhhc2hTaXplLCBiaWdFbmRpYW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgYnVmID0gbmV3IEJ1ZmZlcihidWYpO1xuICB2YXIgYXJyID0gZm4odG9BcnJheShidWYsIGJpZ0VuZGlhbiksIGJ1Zi5sZW5ndGggKiBjaHJzeik7XG4gIHJldHVybiB0b0J1ZmZlcihhcnIsIGhhc2hTaXplLCBiaWdFbmRpYW4pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgaGFzaDogaGFzaCB9O1xuIiwidmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlclxudmFyIHNoYSA9IHJlcXVpcmUoJy4vc2hhJylcbnZhciBzaGEyNTYgPSByZXF1aXJlKCcuL3NoYTI1NicpXG52YXIgcm5nID0gcmVxdWlyZSgnLi9ybmcnKVxudmFyIG1kNSA9IHJlcXVpcmUoJy4vbWQ1JylcblxudmFyIGFsZ29yaXRobXMgPSB7XG4gIHNoYTE6IHNoYSxcbiAgc2hhMjU2OiBzaGEyNTYsXG4gIG1kNTogbWQ1XG59XG5cbnZhciBibG9ja3NpemUgPSA2NFxudmFyIHplcm9CdWZmZXIgPSBuZXcgQnVmZmVyKGJsb2Nrc2l6ZSk7IHplcm9CdWZmZXIuZmlsbCgwKVxuZnVuY3Rpb24gaG1hYyhmbiwga2V5LCBkYXRhKSB7XG4gIGlmKCFCdWZmZXIuaXNCdWZmZXIoa2V5KSkga2V5ID0gbmV3IEJ1ZmZlcihrZXkpXG4gIGlmKCFCdWZmZXIuaXNCdWZmZXIoZGF0YSkpIGRhdGEgPSBuZXcgQnVmZmVyKGRhdGEpXG5cbiAgaWYoa2V5Lmxlbmd0aCA+IGJsb2Nrc2l6ZSkge1xuICAgIGtleSA9IGZuKGtleSlcbiAgfSBlbHNlIGlmKGtleS5sZW5ndGggPCBibG9ja3NpemUpIHtcbiAgICBrZXkgPSBCdWZmZXIuY29uY2F0KFtrZXksIHplcm9CdWZmZXJdLCBibG9ja3NpemUpXG4gIH1cblxuICB2YXIgaXBhZCA9IG5ldyBCdWZmZXIoYmxvY2tzaXplKSwgb3BhZCA9IG5ldyBCdWZmZXIoYmxvY2tzaXplKVxuICBmb3IodmFyIGkgPSAwOyBpIDwgYmxvY2tzaXplOyBpKyspIHtcbiAgICBpcGFkW2ldID0ga2V5W2ldIF4gMHgzNlxuICAgIG9wYWRbaV0gPSBrZXlbaV0gXiAweDVDXG4gIH1cblxuICB2YXIgaGFzaCA9IGZuKEJ1ZmZlci5jb25jYXQoW2lwYWQsIGRhdGFdKSlcbiAgcmV0dXJuIGZuKEJ1ZmZlci5jb25jYXQoW29wYWQsIGhhc2hdKSlcbn1cblxuZnVuY3Rpb24gaGFzaChhbGcsIGtleSkge1xuICBhbGcgPSBhbGcgfHwgJ3NoYTEnXG4gIHZhciBmbiA9IGFsZ29yaXRobXNbYWxnXVxuICB2YXIgYnVmcyA9IFtdXG4gIHZhciBsZW5ndGggPSAwXG4gIGlmKCFmbikgZXJyb3IoJ2FsZ29yaXRobTonLCBhbGcsICdpcyBub3QgeWV0IHN1cHBvcnRlZCcpXG4gIHJldHVybiB7XG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSkgZGF0YSA9IG5ldyBCdWZmZXIoZGF0YSlcbiAgICAgICAgXG4gICAgICBidWZzLnB1c2goZGF0YSlcbiAgICAgIGxlbmd0aCArPSBkYXRhLmxlbmd0aFxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9LFxuICAgIGRpZ2VzdDogZnVuY3Rpb24gKGVuYykge1xuICAgICAgdmFyIGJ1ZiA9IEJ1ZmZlci5jb25jYXQoYnVmcylcbiAgICAgIHZhciByID0ga2V5ID8gaG1hYyhmbiwga2V5LCBidWYpIDogZm4oYnVmKVxuICAgICAgYnVmcyA9IG51bGxcbiAgICAgIHJldHVybiBlbmMgPyByLnRvU3RyaW5nKGVuYykgOiByXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVycm9yICgpIHtcbiAgdmFyIG0gPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykuam9pbignICcpXG4gIHRocm93IG5ldyBFcnJvcihbXG4gICAgbSxcbiAgICAnd2UgYWNjZXB0IHB1bGwgcmVxdWVzdHMnLFxuICAgICdodHRwOi8vZ2l0aHViLmNvbS9kb21pbmljdGFyci9jcnlwdG8tYnJvd3NlcmlmeSdcbiAgICBdLmpvaW4oJ1xcbicpKVxufVxuXG5leHBvcnRzLmNyZWF0ZUhhc2ggPSBmdW5jdGlvbiAoYWxnKSB7IHJldHVybiBoYXNoKGFsZykgfVxuZXhwb3J0cy5jcmVhdGVIbWFjID0gZnVuY3Rpb24gKGFsZywga2V5KSB7IHJldHVybiBoYXNoKGFsZywga2V5KSB9XG5leHBvcnRzLnJhbmRvbUJ5dGVzID0gZnVuY3Rpb24oc2l6ZSwgY2FsbGJhY2spIHtcbiAgaWYgKGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwpIHtcbiAgICB0cnkge1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCB1bmRlZmluZWQsIG5ldyBCdWZmZXIocm5nKHNpemUpKSlcbiAgICB9IGNhdGNoIChlcnIpIHsgY2FsbGJhY2soZXJyKSB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIocm5nKHNpemUpKVxuICB9XG59XG5cbmZ1bmN0aW9uIGVhY2goYSwgZikge1xuICBmb3IodmFyIGkgaW4gYSlcbiAgICBmKGFbaV0sIGkpXG59XG5cbi8vIHRoZSBsZWFzdCBJIGNhbiBkbyBpcyBtYWtlIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgcmVzdCBvZiB0aGUgbm9kZS5qcy9jcnlwdG8gYXBpLlxuZWFjaChbJ2NyZWF0ZUNyZWRlbnRpYWxzJ1xuLCAnY3JlYXRlQ2lwaGVyJ1xuLCAnY3JlYXRlQ2lwaGVyaXYnXG4sICdjcmVhdGVEZWNpcGhlcidcbiwgJ2NyZWF0ZURlY2lwaGVyaXYnXG4sICdjcmVhdGVTaWduJ1xuLCAnY3JlYXRlVmVyaWZ5J1xuLCAnY3JlYXRlRGlmZmllSGVsbG1hbidcbiwgJ3Bia2RmMiddLCBmdW5jdGlvbiAobmFtZSkge1xuICBleHBvcnRzW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgIGVycm9yKCdzb3JyeSwnLCBuYW1lLCAnaXMgbm90IGltcGxlbWVudGVkIHlldCcpXG4gIH1cbn0pXG4iLCIvKlxyXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFJTQSBEYXRhIFNlY3VyaXR5LCBJbmMuIE1ENSBNZXNzYWdlXHJcbiAqIERpZ2VzdCBBbGdvcml0aG0sIGFzIGRlZmluZWQgaW4gUkZDIDEzMjEuXHJcbiAqIFZlcnNpb24gMi4xIENvcHlyaWdodCAoQykgUGF1bCBKb2huc3RvbiAxOTk5IC0gMjAwMi5cclxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxyXG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIExpY2Vuc2VcclxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIG1vcmUgaW5mby5cclxuICovXHJcblxyXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5cclxuLypcclxuICogUGVyZm9ybSBhIHNpbXBsZSBzZWxmLXRlc3QgdG8gc2VlIGlmIHRoZSBWTSBpcyB3b3JraW5nXHJcbiAqL1xyXG5mdW5jdGlvbiBtZDVfdm1fdGVzdCgpXHJcbntcclxuICByZXR1cm4gaGV4X21kNShcImFiY1wiKSA9PSBcIjkwMDE1MDk4M2NkMjRmYjBkNjk2M2Y3ZDI4ZTE3ZjcyXCI7XHJcbn1cclxuXHJcbi8qXHJcbiAqIENhbGN1bGF0ZSB0aGUgTUQ1IG9mIGFuIGFycmF5IG9mIGxpdHRsZS1lbmRpYW4gd29yZHMsIGFuZCBhIGJpdCBsZW5ndGhcclxuICovXHJcbmZ1bmN0aW9uIGNvcmVfbWQ1KHgsIGxlbilcclxue1xyXG4gIC8qIGFwcGVuZCBwYWRkaW5nICovXHJcbiAgeFtsZW4gPj4gNV0gfD0gMHg4MCA8PCAoKGxlbikgJSAzMik7XHJcbiAgeFsoKChsZW4gKyA2NCkgPj4+IDkpIDw8IDQpICsgMTRdID0gbGVuO1xyXG5cclxuICB2YXIgYSA9ICAxNzMyNTg0MTkzO1xyXG4gIHZhciBiID0gLTI3MTczMzg3OTtcclxuICB2YXIgYyA9IC0xNzMyNTg0MTk0O1xyXG4gIHZhciBkID0gIDI3MTczMzg3ODtcclxuXHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDE2KVxyXG4gIHtcclxuICAgIHZhciBvbGRhID0gYTtcclxuICAgIHZhciBvbGRiID0gYjtcclxuICAgIHZhciBvbGRjID0gYztcclxuICAgIHZhciBvbGRkID0gZDtcclxuXHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgMF0sIDcgLCAtNjgwODc2OTM2KTtcclxuICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpKyAxXSwgMTIsIC0zODk1NjQ1ODYpO1xyXG4gICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2krIDJdLCAxNywgIDYwNjEwNTgxOSk7XHJcbiAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSsgM10sIDIyLCAtMTA0NDUyNTMzMCk7XHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgNF0sIDcgLCAtMTc2NDE4ODk3KTtcclxuICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpKyA1XSwgMTIsICAxMjAwMDgwNDI2KTtcclxuICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcclxuICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpKyA3XSwgMjIsIC00NTcwNTk4Myk7XHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgOF0sIDcgLCAgMTc3MDAzNTQxNik7XHJcbiAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XHJcbiAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSsxMF0sIDE3LCAtNDIwNjMpO1xyXG4gICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2krMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xyXG4gICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2krMTJdLCA3ICwgIDE4MDQ2MDM2ODIpO1xyXG4gICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2krMTNdLCAxMiwgLTQwMzQxMTAxKTtcclxuICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpKzE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcclxuICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpKzE1XSwgMjIsICAxMjM2NTM1MzI5KTtcclxuXHJcbiAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSsgMV0sIDUgLCAtMTY1Nzk2NTEwKTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKyA2XSwgOSAsIC0xMDY5NTAxNjMyKTtcclxuICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpKzExXSwgMTQsICA2NDM3MTc3MTMpO1xyXG4gICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2krIDBdLCAyMCwgLTM3Mzg5NzMwMik7XHJcbiAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSsgNV0sIDUgLCAtNzAxNTU4NjkxKTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKzEwXSwgOSAsICAzODAxNjA4Myk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsxNV0sIDE0LCAtNjYwNDc4MzM1KTtcclxuICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xyXG4gICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2krIDldLCA1ICwgIDU2ODQ0NjQzOCk7XHJcbiAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSsxNF0sIDkgLCAtMTAxOTgwMzY5MCk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsgM10sIDE0LCAtMTg3MzYzOTYxKTtcclxuICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpKyA4XSwgMjAsICAxMTYzNTMxNTAxKTtcclxuICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpKzEzXSwgNSAsIC0xNDQ0NjgxNDY3KTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKyAyXSwgOSAsIC01MTQwMzc4NCk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsgN10sIDE0LCAgMTczNTMyODQ3Myk7XHJcbiAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSsxMl0sIDIwLCAtMTkyNjYwNzczNCk7XHJcblxyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDVdLCA0ICwgLTM3ODU1OCk7XHJcbiAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSsgOF0sIDExLCAtMjAyMjU3NDQ2Myk7XHJcbiAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSsxMV0sIDE2LCAgMTgzOTAzMDU2Mik7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsxNF0sIDIzLCAtMzUzMDk1NTYpO1xyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDFdLCA0ICwgLTE1MzA5OTIwNjApO1xyXG4gICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2krIDRdLCAxMSwgIDEyNzI4OTMzNTMpO1xyXG4gICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2krIDddLCAxNiwgLTE1NTQ5NzYzMik7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsxMF0sIDIzLCAtMTA5NDczMDY0MCk7XHJcbiAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSsxM10sIDQgLCAgNjgxMjc5MTc0KTtcclxuICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpKyAwXSwgMTEsIC0zNTg1MzcyMjIpO1xyXG4gICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2krIDNdLCAxNiwgLTcyMjUyMTk3OSk7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsgNl0sIDIzLCAgNzYwMjkxODkpO1xyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDldLCA0ICwgLTY0MDM2NDQ4Nyk7XHJcbiAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSsxMl0sIDExLCAtNDIxODE1ODM1KTtcclxuICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpKzE1XSwgMTYsICA1MzA3NDI1MjApO1xyXG4gICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2krIDJdLCAyMywgLTk5NTMzODY1MSk7XHJcblxyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krIDBdLCA2ICwgLTE5ODYzMDg0NCk7XHJcbiAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSsgN10sIDEwLCAgMTEyNjg5MTQxNSk7XHJcbiAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSsxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XHJcbiAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSsgNV0sIDIxLCAtNTc0MzQwNTUpO1xyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krMTJdLCA2ICwgIDE3MDA0ODU1NzEpO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xyXG4gICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2krMTBdLCAxNSwgLTEwNTE1MjMpO1xyXG4gICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2krIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krIDhdLCA2ICwgIDE4NzMzMTMzNTkpO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krMTVdLCAxMCwgLTMwNjExNzQ0KTtcclxuICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcclxuICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpKzEzXSwgMjEsICAxMzA5MTUxNjQ5KTtcclxuICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpKyA0XSwgNiAsIC0xNDU1MjMwNzApO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xyXG4gICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2krIDJdLCAxNSwgIDcxODc4NzI1OSk7XHJcbiAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSsgOV0sIDIxLCAtMzQzNDg1NTUxKTtcclxuXHJcbiAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XHJcbiAgICBiID0gc2FmZV9hZGQoYiwgb2xkYik7XHJcbiAgICBjID0gc2FmZV9hZGQoYywgb2xkYyk7XHJcbiAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XHJcbiAgfVxyXG4gIHJldHVybiBBcnJheShhLCBiLCBjLCBkKTtcclxuXHJcbn1cclxuXHJcbi8qXHJcbiAqIFRoZXNlIGZ1bmN0aW9ucyBpbXBsZW1lbnQgdGhlIGZvdXIgYmFzaWMgb3BlcmF0aW9ucyB0aGUgYWxnb3JpdGhtIHVzZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBtZDVfY21uKHEsIGEsIGIsIHgsIHMsIHQpXHJcbntcclxuICByZXR1cm4gc2FmZV9hZGQoYml0X3JvbChzYWZlX2FkZChzYWZlX2FkZChhLCBxKSwgc2FmZV9hZGQoeCwgdCkpLCBzKSxiKTtcclxufVxyXG5mdW5jdGlvbiBtZDVfZmYoYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKChiICYgYykgfCAoKH5iKSAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5mdW5jdGlvbiBtZDVfZ2coYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKChiICYgZCkgfCAoYyAmICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5mdW5jdGlvbiBtZDVfaGgoYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKGIgXiBjIF4gZCwgYSwgYiwgeCwgcywgdCk7XHJcbn1cclxuZnVuY3Rpb24gbWQ1X2lpKGEsIGIsIGMsIGQsIHgsIHMsIHQpXHJcbntcclxuICByZXR1cm4gbWQ1X2NtbihjIF4gKGIgfCAofmQpKSwgYSwgYiwgeCwgcywgdCk7XHJcbn1cclxuXHJcbi8qXHJcbiAqIEFkZCBpbnRlZ2Vycywgd3JhcHBpbmcgYXQgMl4zMi4gVGhpcyB1c2VzIDE2LWJpdCBvcGVyYXRpb25zIGludGVybmFsbHlcclxuICogdG8gd29yayBhcm91bmQgYnVncyBpbiBzb21lIEpTIGludGVycHJldGVycy5cclxuICovXHJcbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpXHJcbntcclxuICB2YXIgbHN3ID0gKHggJiAweEZGRkYpICsgKHkgJiAweEZGRkYpO1xyXG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcclxuICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcclxufVxyXG5cclxuLypcclxuICogQml0d2lzZSByb3RhdGUgYSAzMi1iaXQgbnVtYmVyIHRvIHRoZSBsZWZ0LlxyXG4gKi9cclxuZnVuY3Rpb24gYml0X3JvbChudW0sIGNudClcclxue1xyXG4gIHJldHVybiAobnVtIDw8IGNudCkgfCAobnVtID4+PiAoMzIgLSBjbnQpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtZDUoYnVmKSB7XHJcbiAgcmV0dXJuIGhlbHBlcnMuaGFzaChidWYsIGNvcmVfbWQ1LCAxNik7XHJcbn07XHJcbiIsIi8vIE9yaWdpbmFsIGNvZGUgYWRhcHRlZCBmcm9tIFJvYmVydCBLaWVmZmVyLlxuLy8gZGV0YWlscyBhdCBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgX2dsb2JhbCA9IHRoaXM7XG5cbiAgdmFyIG1hdGhSTkcsIHdoYXR3Z1JORztcblxuICAvLyBOT1RFOiBNYXRoLnJhbmRvbSgpIGRvZXMgbm90IGd1YXJhbnRlZSBcImNyeXB0b2dyYXBoaWMgcXVhbGl0eVwiXG4gIG1hdGhSTkcgPSBmdW5jdGlvbihzaXplKSB7XG4gICAgdmFyIGJ5dGVzID0gbmV3IEFycmF5KHNpemUpO1xuICAgIHZhciByO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBieXRlc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBpZiAoX2dsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgIHdoYXR3Z1JORyA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KHNpemUpO1xuICAgICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhieXRlcyk7XG4gICAgICByZXR1cm4gYnl0ZXM7XG4gICAgfVxuICB9XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aGF0d2dSTkcgfHwgbWF0aFJORztcblxufSgpKVxuIiwiLypcbiAqIEEgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgU2VjdXJlIEhhc2ggQWxnb3JpdGhtLCBTSEEtMSwgYXMgZGVmaW5lZFxuICogaW4gRklQUyBQVUIgMTgwLTFcbiAqIFZlcnNpb24gMi4xYSBDb3B5cmlnaHQgUGF1bCBKb2huc3RvbiAyMDAwIC0gMjAwMi5cbiAqIE90aGVyIGNvbnRyaWJ1dG9yczogR3JlZyBIb2x0LCBBbmRyZXcgS2VwZXJ0LCBZZG5hciwgTG9zdGluZXRcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZVxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIGRldGFpbHMuXG4gKi9cblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxuLypcbiAqIENhbGN1bGF0ZSB0aGUgU0hBLTEgb2YgYW4gYXJyYXkgb2YgYmlnLWVuZGlhbiB3b3JkcywgYW5kIGEgYml0IGxlbmd0aFxuICovXG5mdW5jdGlvbiBjb3JlX3NoYTEoeCwgbGVuKVxue1xuICAvKiBhcHBlbmQgcGFkZGluZyAqL1xuICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgyNCAtIGxlbiAlIDMyKTtcbiAgeFsoKGxlbiArIDY0ID4+IDkpIDw8IDQpICsgMTVdID0gbGVuO1xuXG4gIHZhciB3ID0gQXJyYXkoODApO1xuICB2YXIgYSA9ICAxNzMyNTg0MTkzO1xuICB2YXIgYiA9IC0yNzE3MzM4Nzk7XG4gIHZhciBjID0gLTE3MzI1ODQxOTQ7XG4gIHZhciBkID0gIDI3MTczMzg3ODtcbiAgdmFyIGUgPSAtMTAwOTU4OTc3NjtcblxuICBmb3IodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpXG4gIHtcbiAgICB2YXIgb2xkYSA9IGE7XG4gICAgdmFyIG9sZGIgPSBiO1xuICAgIHZhciBvbGRjID0gYztcbiAgICB2YXIgb2xkZCA9IGQ7XG4gICAgdmFyIG9sZGUgPSBlO1xuXG4gICAgZm9yKHZhciBqID0gMDsgaiA8IDgwOyBqKyspXG4gICAge1xuICAgICAgaWYoaiA8IDE2KSB3W2pdID0geFtpICsgal07XG4gICAgICBlbHNlIHdbal0gPSByb2wod1tqLTNdIF4gd1tqLThdIF4gd1tqLTE0XSBeIHdbai0xNl0sIDEpO1xuICAgICAgdmFyIHQgPSBzYWZlX2FkZChzYWZlX2FkZChyb2woYSwgNSksIHNoYTFfZnQoaiwgYiwgYywgZCkpLFxuICAgICAgICAgICAgICAgICAgICAgICBzYWZlX2FkZChzYWZlX2FkZChlLCB3W2pdKSwgc2hhMV9rdChqKSkpO1xuICAgICAgZSA9IGQ7XG4gICAgICBkID0gYztcbiAgICAgIGMgPSByb2woYiwgMzApO1xuICAgICAgYiA9IGE7XG4gICAgICBhID0gdDtcbiAgICB9XG5cbiAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XG4gICAgYiA9IHNhZmVfYWRkKGIsIG9sZGIpO1xuICAgIGMgPSBzYWZlX2FkZChjLCBvbGRjKTtcbiAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XG4gICAgZSA9IHNhZmVfYWRkKGUsIG9sZGUpO1xuICB9XG4gIHJldHVybiBBcnJheShhLCBiLCBjLCBkLCBlKTtcblxufVxuXG4vKlxuICogUGVyZm9ybSB0aGUgYXBwcm9wcmlhdGUgdHJpcGxldCBjb21iaW5hdGlvbiBmdW5jdGlvbiBmb3IgdGhlIGN1cnJlbnRcbiAqIGl0ZXJhdGlvblxuICovXG5mdW5jdGlvbiBzaGExX2Z0KHQsIGIsIGMsIGQpXG57XG4gIGlmKHQgPCAyMCkgcmV0dXJuIChiICYgYykgfCAoKH5iKSAmIGQpO1xuICBpZih0IDwgNDApIHJldHVybiBiIF4gYyBeIGQ7XG4gIGlmKHQgPCA2MCkgcmV0dXJuIChiICYgYykgfCAoYiAmIGQpIHwgKGMgJiBkKTtcbiAgcmV0dXJuIGIgXiBjIF4gZDtcbn1cblxuLypcbiAqIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgYWRkaXRpdmUgY29uc3RhbnQgZm9yIHRoZSBjdXJyZW50IGl0ZXJhdGlvblxuICovXG5mdW5jdGlvbiBzaGExX2t0KHQpXG57XG4gIHJldHVybiAodCA8IDIwKSA/ICAxNTE4NTAwMjQ5IDogKHQgPCA0MCkgPyAgMTg1OTc3NTM5MyA6XG4gICAgICAgICAodCA8IDYwKSA/IC0xODk0MDA3NTg4IDogLTg5OTQ5NzUxNDtcbn1cblxuLypcbiAqIEFkZCBpbnRlZ2Vycywgd3JhcHBpbmcgYXQgMl4zMi4gVGhpcyB1c2VzIDE2LWJpdCBvcGVyYXRpb25zIGludGVybmFsbHlcbiAqIHRvIHdvcmsgYXJvdW5kIGJ1Z3MgaW4gc29tZSBKUyBpbnRlcnByZXRlcnMuXG4gKi9cbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpXG57XG4gIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59XG5cbi8qXG4gKiBCaXR3aXNlIHJvdGF0ZSBhIDMyLWJpdCBudW1iZXIgdG8gdGhlIGxlZnQuXG4gKi9cbmZ1bmN0aW9uIHJvbChudW0sIGNudClcbntcbiAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNoYTEoYnVmKSB7XG4gIHJldHVybiBoZWxwZXJzLmhhc2goYnVmLCBjb3JlX3NoYTEsIDIwLCB0cnVlKTtcbn07XG4iLCJcbi8qKlxuICogQSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBTZWN1cmUgSGFzaCBBbGdvcml0aG0sIFNIQS0yNTYsIGFzIGRlZmluZWRcbiAqIGluIEZJUFMgMTgwLTJcbiAqIFZlcnNpb24gMi4yLWJldGEgQ29weXJpZ2h0IEFuZ2VsIE1hcmluLCBQYXVsIEpvaG5zdG9uIDIwMDAgLSAyMDA5LlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICpcbiAqL1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuXG52YXIgc2FmZV9hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59O1xuXG52YXIgUyA9IGZ1bmN0aW9uKFgsIG4pIHtcbiAgcmV0dXJuIChYID4+PiBuKSB8IChYIDw8ICgzMiAtIG4pKTtcbn07XG5cbnZhciBSID0gZnVuY3Rpb24oWCwgbikge1xuICByZXR1cm4gKFggPj4+IG4pO1xufTtcblxudmFyIENoID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICByZXR1cm4gKCh4ICYgeSkgXiAoKH54KSAmIHopKTtcbn07XG5cbnZhciBNYWogPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiAoKHggJiB5KSBeICh4ICYgeikgXiAoeSAmIHopKTtcbn07XG5cbnZhciBTaWdtYTAyNTYgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiAoUyh4LCAyKSBeIFMoeCwgMTMpIF4gUyh4LCAyMikpO1xufTtcblxudmFyIFNpZ21hMTI1NiA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIChTKHgsIDYpIF4gUyh4LCAxMSkgXiBTKHgsIDI1KSk7XG59O1xuXG52YXIgR2FtbWEwMjU2ID0gZnVuY3Rpb24oeCkge1xuICByZXR1cm4gKFMoeCwgNykgXiBTKHgsIDE4KSBeIFIoeCwgMykpO1xufTtcblxudmFyIEdhbW1hMTI1NiA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIChTKHgsIDE3KSBeIFMoeCwgMTkpIF4gUih4LCAxMCkpO1xufTtcblxudmFyIGNvcmVfc2hhMjU2ID0gZnVuY3Rpb24obSwgbCkge1xuICB2YXIgSyA9IG5ldyBBcnJheSgweDQyOEEyRjk4LDB4NzEzNzQ0OTEsMHhCNUMwRkJDRiwweEU5QjVEQkE1LDB4Mzk1NkMyNUIsMHg1OUYxMTFGMSwweDkyM0Y4MkE0LDB4QUIxQzVFRDUsMHhEODA3QUE5OCwweDEyODM1QjAxLDB4MjQzMTg1QkUsMHg1NTBDN0RDMywweDcyQkU1RDc0LDB4ODBERUIxRkUsMHg5QkRDMDZBNywweEMxOUJGMTc0LDB4RTQ5QjY5QzEsMHhFRkJFNDc4NiwweEZDMTlEQzYsMHgyNDBDQTFDQywweDJERTkyQzZGLDB4NEE3NDg0QUEsMHg1Q0IwQTlEQywweDc2Rjk4OERBLDB4OTgzRTUxNTIsMHhBODMxQzY2RCwweEIwMDMyN0M4LDB4QkY1OTdGQzcsMHhDNkUwMEJGMywweEQ1QTc5MTQ3LDB4NkNBNjM1MSwweDE0MjkyOTY3LDB4MjdCNzBBODUsMHgyRTFCMjEzOCwweDREMkM2REZDLDB4NTMzODBEMTMsMHg2NTBBNzM1NCwweDc2NkEwQUJCLDB4ODFDMkM5MkUsMHg5MjcyMkM4NSwweEEyQkZFOEExLDB4QTgxQTY2NEIsMHhDMjRCOEI3MCwweEM3NkM1MUEzLDB4RDE5MkU4MTksMHhENjk5MDYyNCwweEY0MEUzNTg1LDB4MTA2QUEwNzAsMHgxOUE0QzExNiwweDFFMzc2QzA4LDB4Mjc0ODc3NEMsMHgzNEIwQkNCNSwweDM5MUMwQ0IzLDB4NEVEOEFBNEEsMHg1QjlDQ0E0RiwweDY4MkU2RkYzLDB4NzQ4RjgyRUUsMHg3OEE1NjM2RiwweDg0Qzg3ODE0LDB4OENDNzAyMDgsMHg5MEJFRkZGQSwweEE0NTA2Q0VCLDB4QkVGOUEzRjcsMHhDNjcxNzhGMik7XG4gIHZhciBIQVNIID0gbmV3IEFycmF5KDB4NkEwOUU2NjcsIDB4QkI2N0FFODUsIDB4M0M2RUYzNzIsIDB4QTU0RkY1M0EsIDB4NTEwRTUyN0YsIDB4OUIwNTY4OEMsIDB4MUY4M0Q5QUIsIDB4NUJFMENEMTkpO1xuICAgIHZhciBXID0gbmV3IEFycmF5KDY0KTtcbiAgICB2YXIgYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSwgajtcbiAgICB2YXIgVDEsIFQyO1xuICAvKiBhcHBlbmQgcGFkZGluZyAqL1xuICBtW2wgPj4gNV0gfD0gMHg4MCA8PCAoMjQgLSBsICUgMzIpO1xuICBtWygobCArIDY0ID4+IDkpIDw8IDQpICsgMTVdID0gbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtLmxlbmd0aDsgaSArPSAxNikge1xuICAgIGEgPSBIQVNIWzBdOyBiID0gSEFTSFsxXTsgYyA9IEhBU0hbMl07IGQgPSBIQVNIWzNdOyBlID0gSEFTSFs0XTsgZiA9IEhBU0hbNV07IGcgPSBIQVNIWzZdOyBoID0gSEFTSFs3XTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDY0OyBqKyspIHtcbiAgICAgIGlmIChqIDwgMTYpIHtcbiAgICAgICAgV1tqXSA9IG1baiArIGldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgV1tqXSA9IHNhZmVfYWRkKHNhZmVfYWRkKHNhZmVfYWRkKEdhbW1hMTI1NihXW2ogLSAyXSksIFdbaiAtIDddKSwgR2FtbWEwMjU2KFdbaiAtIDE1XSkpLCBXW2ogLSAxNl0pO1xuICAgICAgfVxuICAgICAgVDEgPSBzYWZlX2FkZChzYWZlX2FkZChzYWZlX2FkZChzYWZlX2FkZChoLCBTaWdtYTEyNTYoZSkpLCBDaChlLCBmLCBnKSksIEtbal0pLCBXW2pdKTtcbiAgICAgIFQyID0gc2FmZV9hZGQoU2lnbWEwMjU2KGEpLCBNYWooYSwgYiwgYykpO1xuICAgICAgaCA9IGc7IGcgPSBmOyBmID0gZTsgZSA9IHNhZmVfYWRkKGQsIFQxKTsgZCA9IGM7IGMgPSBiOyBiID0gYTsgYSA9IHNhZmVfYWRkKFQxLCBUMik7XG4gICAgfVxuICAgIEhBU0hbMF0gPSBzYWZlX2FkZChhLCBIQVNIWzBdKTsgSEFTSFsxXSA9IHNhZmVfYWRkKGIsIEhBU0hbMV0pOyBIQVNIWzJdID0gc2FmZV9hZGQoYywgSEFTSFsyXSk7IEhBU0hbM10gPSBzYWZlX2FkZChkLCBIQVNIWzNdKTtcbiAgICBIQVNIWzRdID0gc2FmZV9hZGQoZSwgSEFTSFs0XSk7IEhBU0hbNV0gPSBzYWZlX2FkZChmLCBIQVNIWzVdKTsgSEFTSFs2XSA9IHNhZmVfYWRkKGcsIEhBU0hbNl0pOyBIQVNIWzddID0gc2FmZV9hZGQoaCwgSEFTSFs3XSk7XG4gIH1cbiAgcmV0dXJuIEhBU0g7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNoYTI1NihidWYpIHtcbiAgcmV0dXJuIGhlbHBlcnMuaGFzaChidWYsIGNvcmVfc2hhMjU2LCAzMiwgdHJ1ZSk7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChCdWZmZXIpe1xudmFyIFpsaWIgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vemxpYicpO1xuXG4vLyB0aGUgbGVhc3QgSSBjYW4gZG8gaXMgbWFrZSBlcnJvciBtZXNzYWdlcyBmb3IgdGhlIHJlc3Qgb2YgdGhlIG5vZGUuanMvemxpYiBhcGkuXG4vLyAodGhhbmtzLCBkb21pbmljdGFycilcbmZ1bmN0aW9uIGVycm9yICgpIHtcbiAgdmFyIG0gPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykuam9pbignICcpXG4gIHRocm93IG5ldyBFcnJvcihbXG4gICAgbSxcbiAgICAnd2UgYWNjZXB0IHB1bGwgcmVxdWVzdHMnLFxuICAgICdodHRwOi8vZ2l0aHViLmNvbS9icmlhbmxvdmVzd29yZHMvemxpYi1icm93c2VyaWZ5J1xuICAgIF0uam9pbignXFxuJykpXG59XG5cbjtbJ2NyZWF0ZUd6aXAnXG4sICdjcmVhdGVHdW56aXAnXG4sICdjcmVhdGVEZWZsYXRlJ1xuLCAnY3JlYXRlRGVmbGF0ZVJhdydcbiwgJ2NyZWF0ZUluZmxhdGUnXG4sICdjcmVhdGVJbmZsYXRlUmF3J1xuLCAnY3JlYXRlVW56aXAnXG4sICdHemlwJ1xuLCAnR3VuemlwJ1xuLCAnSW5mbGF0ZSdcbiwgJ0luZmxhdGVSYXcnXG4sICdEZWZsYXRlJ1xuLCAnRGVmbGF0ZVJhdydcbiwgJ1VuemlwJ1xuLCAnaW5mbGF0ZVJhdydcbiwgJ2RlZmxhdGVSYXcnXS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gIFpsaWJbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgZXJyb3IoJ3NvcnJ5LCcsIG5hbWUsICdpcyBub3QgaW1wbGVtZW50ZWQgeWV0JylcbiAgfVxufSk7XG5cbnZhciBfZGVmbGF0ZSA9IFpsaWIuZGVmbGF0ZTtcbnZhciBfZ3ppcCA9IFpsaWIuZ3ppcDtcblxuWmxpYi5kZWZsYXRlID0gZnVuY3Rpb24gZGVmbGF0ZShzdHJpbmdPckJ1ZmZlciwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIF9kZWZsYXRlKEJ1ZmZlcihzdHJpbmdPckJ1ZmZlciksIGNhbGxiYWNrKTtcbn07XG5abGliLmd6aXAgPSBmdW5jdGlvbiBnemlwKHN0cmluZ09yQnVmZmVyLCBjYWxsYmFjaykge1xuICByZXR1cm4gX2d6aXAoQnVmZmVyKHN0cmluZ09yQnVmZmVyKSwgY2FsbGJhY2spO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyKSIsIihmdW5jdGlvbiAocHJvY2VzcyxCdWZmZXIpe1xuLyoqIEBsaWNlbnNlIHpsaWIuanMgMC4xLjcgMjAxMiAtIGltYXlhIFsgaHR0cHM6Ly9naXRodWIuY29tL2ltYXlhL3psaWIuanMgXSBUaGUgTUlUIExpY2Vuc2UgKi8oZnVuY3Rpb24oKSB7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIHEoYil7dGhyb3cgYjt9dmFyIHQ9dm9pZCAwLHU9ITA7dmFyIEE9XCJ1bmRlZmluZWRcIiE9PXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT09dHlwZW9mIFVpbnQxNkFycmF5JiZcInVuZGVmaW5lZFwiIT09dHlwZW9mIFVpbnQzMkFycmF5O2Z1bmN0aW9uIEUoYixhKXt0aGlzLmluZGV4PVwibnVtYmVyXCI9PT10eXBlb2YgYT9hOjA7dGhpcy5tPTA7dGhpcy5idWZmZXI9YiBpbnN0YW5jZW9mKEE/VWludDhBcnJheTpBcnJheSk/YjpuZXcgKEE/VWludDhBcnJheTpBcnJheSkoMzI3NjgpOzIqdGhpcy5idWZmZXIubGVuZ3RoPD10aGlzLmluZGV4JiZxKEVycm9yKFwiaW52YWxpZCBpbmRleFwiKSk7dGhpcy5idWZmZXIubGVuZ3RoPD10aGlzLmluZGV4JiZ0aGlzLmYoKX1FLnByb3RvdHlwZS5mPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcy5idWZmZXIsYSxjPWIubGVuZ3RoLGQ9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKGM8PDEpO2lmKEEpZC5zZXQoYik7ZWxzZSBmb3IoYT0wO2E8YzsrK2EpZFthXT1iW2FdO3JldHVybiB0aGlzLmJ1ZmZlcj1kfTtcbkUucHJvdG90eXBlLmQ9ZnVuY3Rpb24oYixhLGMpe3ZhciBkPXRoaXMuYnVmZmVyLGY9dGhpcy5pbmRleCxlPXRoaXMubSxnPWRbZl0saztjJiYxPGEmJihiPTg8YT8oR1tiJjI1NV08PDI0fEdbYj4+PjgmMjU1XTw8MTZ8R1tiPj4+MTYmMjU1XTw8OHxHW2I+Pj4yNCYyNTVdKT4+MzItYTpHW2JdPj44LWEpO2lmKDg+YStlKWc9Zzw8YXxiLGUrPWE7ZWxzZSBmb3Ioaz0wO2s8YTsrK2spZz1nPDwxfGI+PmEtay0xJjEsOD09PSsrZSYmKGU9MCxkW2YrK109R1tnXSxnPTAsZj09PWQubGVuZ3RoJiYoZD10aGlzLmYoKSkpO2RbZl09Zzt0aGlzLmJ1ZmZlcj1kO3RoaXMubT1lO3RoaXMuaW5kZXg9Zn07RS5wcm90b3R5cGUuZmluaXNoPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcy5idWZmZXIsYT10aGlzLmluZGV4LGM7MDx0aGlzLm0mJihiW2FdPDw9OC10aGlzLm0sYlthXT1HW2JbYV1dLGErKyk7QT9jPWIuc3ViYXJyYXkoMCxhKTooYi5sZW5ndGg9YSxjPWIpO3JldHVybiBjfTtcbnZhciBhYT1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMjU2KSxKO2ZvcihKPTA7MjU2Pko7KytKKXtmb3IodmFyIE49SixRPU4sYmE9NyxOPU4+Pj4xO047Tj4+Pj0xKVE8PD0xLFF8PU4mMSwtLWJhO2FhW0pdPShRPDxiYSYyNTUpPj4+MH12YXIgRz1hYTtmdW5jdGlvbiBSKGIsYSxjKXt2YXIgZCxmPVwibnVtYmVyXCI9PT10eXBlb2YgYT9hOmE9MCxlPVwibnVtYmVyXCI9PT10eXBlb2YgYz9jOmIubGVuZ3RoO2Q9LTE7Zm9yKGY9ZSY3O2YtLTsrK2EpZD1kPj4+OF5TWyhkXmJbYV0pJjI1NV07Zm9yKGY9ZT4+MztmLS07YSs9OClkPWQ+Pj44XlNbKGReYlthXSkmMjU1XSxkPWQ+Pj44XlNbKGReYlthKzFdKSYyNTVdLGQ9ZD4+PjheU1soZF5iW2ErMl0pJjI1NV0sZD1kPj4+OF5TWyhkXmJbYSszXSkmMjU1XSxkPWQ+Pj44XlNbKGReYlthKzRdKSYyNTVdLGQ9ZD4+PjheU1soZF5iW2ErNV0pJjI1NV0sZD1kPj4+OF5TWyhkXmJbYSs2XSkmMjU1XSxkPWQ+Pj44XlNbKGReYlthKzddKSYyNTVdO3JldHVybihkXjQyOTQ5NjcyOTUpPj4+MH1cbnZhciBnYT1bMCwxOTk2OTU5ODk0LDM5OTM5MTk3ODgsMjU2NzUyNDc5NCwxMjQ2MzQxMzcsMTg4NjA1NzYxNSwzOTE1NjIxNjg1LDI2NTczOTIwMzUsMjQ5MjY4Mjc0LDIwNDQ1MDgzMjQsMzc3MjExNTIzMCwyNTQ3MTc3ODY0LDE2Mjk0MTk5NSwyMTI1NTYxMDIxLDM4ODc2MDcwNDcsMjQyODQ0NDA0OSw0OTg1MzY1NDgsMTc4OTkyNzY2Niw0MDg5MDE2NjQ4LDIyMjcwNjEyMTQsNDUwNTQ4ODYxLDE4NDMyNTg2MDMsNDEwNzU4MDc1MywyMjExNjc3NjM5LDMyNTg4Mzk5MCwxNjg0Nzc3MTUyLDQyNTExMjIwNDIsMjMyMTkyNjYzNiwzMzU2MzM0ODcsMTY2MTM2NTQ2NSw0MTk1MzAyNzU1LDIzNjYxMTUzMTcsOTk3MDczMDk2LDEyODE5NTM4ODYsMzU3OTg1NTMzMiwyNzI0Njg4MjQyLDEwMDY4ODgxNDUsMTI1ODYwNzY4NywzNTI0MTAxNjI5LDI3Njg5NDI0NDMsOTAxMDk3NzIyLDExMTkwMDA2ODQsMzY4NjUxNzIwNiwyODk4MDY1NzI4LDg1MzA0NDQ1MSwxMTcyMjY2MTAxLDM3MDUwMTU3NTksXG4yODgyNjE2NjY1LDY1MTc2Nzk4MCwxMzczNTAzNTQ2LDMzNjk1NTQzMDQsMzIxODEwNDU5OCw1NjU1MDcyNTMsMTQ1NDYyMTczMSwzNDg1MTExNzA1LDMwOTk0MzYzMDMsNjcxMjY2OTc0LDE1OTQxOTgwMjQsMzMyMjczMDkzMCwyOTcwMzQ3ODEyLDc5NTgzNTUyNywxNDgzMjMwMjI1LDMyNDQzNjcyNzUsMzA2MDE0OTU2NSwxOTk0MTQ2MTkyLDMxMTU4NTM0LDI1NjM5MDc3NzIsNDAyMzcxNzkzMCwxOTA3NDU5NDY1LDExMjYzNzIxNSwyNjgwMTUzMjUzLDM5MDQ0MjcwNTksMjAxMzc3NjI5MCwyNTE3MjIwMzYsMjUxNzIxNTM3NCwzNzc1ODMwMDQwLDIxMzc2NTY3NjMsMTQxMzc2ODEzLDI0MzkyNzc3MTksMzg2NTI3MTI5NywxODAyMTk1NDQ0LDQ3Njg2NDg2NiwyMjM4MDAxMzY4LDQwNjY1MDg4NzgsMTgxMjM3MDkyNSw0NTMwOTI3MzEsMjE4MTYyNTAyNSw0MTExNDUxMjIzLDE3MDYwODg5MDIsMzE0MDQyNzA0LDIzNDQ1MzIyMDIsNDI0MDAxNzUzMiwxNjU4NjU4MjcxLDM2NjYxOTk3NyxcbjIzNjI2NzAzMjMsNDIyNDk5NDQwNSwxMzAzNTM1OTYwLDk4NDk2MTQ4NiwyNzQ3MDA3MDkyLDM1NjkwMzc1MzgsMTI1NjE3MDgxNywxMDM3NjA0MzExLDI3NjUyMTA3MzMsMzU1NDA3OTk5NSwxMTMxMDE0NTA2LDg3OTY3OTk5NiwyOTA5MjQzNDYyLDM2NjM3NzE4NTYsMTE0MTEyNDQ2Nyw4NTU4NDIyNzcsMjg1MjgwMTYzMSwzNzA4NjQ4NjQ5LDEzNDI1MzM5NDgsNjU0NDU5MzA2LDMxODgzOTYwNDgsMzM3MzAxNTE3NCwxNDY2NDc5OTA5LDU0NDE3OTYzNSwzMTEwNTIzOTEzLDM0NjI1MjIwMTUsMTU5MTY3MTA1NCw3MDIxMzg3NzYsMjk2NjQ2MDQ1MCwzMzUyNzk5NDEyLDE1MDQ5MTg4MDcsNzgzNTUxODczLDMwODI2NDA0NDMsMzIzMzQ0Mjk4OSwzOTg4MjkyMzg0LDI1OTYyNTQ2NDYsNjIzMTcwNjgsMTk1NzgxMDg0MiwzOTM5ODQ1OTQ1LDI2NDc4MTYxMTEsODE0NzA5OTcsMTk0MzgwMzUyMywzODE0OTE4OTMwLDI0ODk1OTY4MDQsMjI1Mjc0NDMwLDIwNTM3OTAzNzYsMzgyNjE3NTc1NSxcbjI0NjY5MDYwMTMsMTY3ODE2NzQzLDIwOTc2NTEzNzcsNDAyNzU1MjU4MCwyMjY1NDkwMzg2LDUwMzQ0NDA3MiwxNzYyMDUwODE0LDQxNTA0MTcyNDUsMjE1NDEyOTM1NSw0MjY1MjIyMjUsMTg1MjUwNzg3OSw0Mjc1MzEzNTI2LDIzMTIzMTc5MjAsMjgyNzUzNjI2LDE3NDI1NTU4NTIsNDE4OTcwODE0MywyMzk0ODc3OTQ1LDM5NzkxNzc2MywxNjIyMTgzNjM3LDM2MDQzOTA4ODgsMjcxNDg2NjU1OCw5NTM3Mjk3MzIsMTM0MDA3NjYyNiwzNTE4NzE5OTg1LDI3OTczNjA5OTksMTA2ODgyODM4MSwxMjE5NjM4ODU5LDM2MjQ3NDE4NTAsMjkzNjY3NTE0OCw5MDYxODU0NjIsMTA5MDgxMjUxMiwzNzQ3NjcyMDAzLDI4MjUzNzk2NjksODI5MzI5MTM1LDExODEzMzUxNjEsMzQxMjE3NzgwNCwzMTYwODM0ODQyLDYyODA4NTQwOCwxMzgyNjA1MzY2LDM0MjMzNjkxMDksMzEzODA3ODQ2Nyw1NzA1NjIyMzMsMTQyNjQwMDgxNSwzMzE3MzE2NTQyLDI5OTg3MzM2MDgsNzMzMjM5OTU0LDE1NTUyNjE5NTYsXG4zMjY4OTM1NTkxLDMwNTAzNjA2MjUsNzUyNDU5NDAzLDE1NDEzMjAyMjEsMjYwNzA3MTkyMCwzOTY1OTczMDMwLDE5Njk5MjI5NzIsNDA3MzU0OTgsMjYxNzgzNzIyNSwzOTQzNTc3MTUxLDE5MTMwODc4NzcsODM5MDgzNzEsMjUxMjM0MTYzNCwzODAzNzQwNjkyLDIwNzUyMDg2MjIsMjEzMjYxMTEyLDI0NjMyNzI2MDMsMzg1NTk5MDI4NSwyMDk0ODU0MDcxLDE5ODk1ODg4MSwyMjYyMDI5MDEyLDQwNTcyNjA2MTAsMTc1OTM1OTk5Miw1MzQ0MTQxOTAsMjE3NjcxODU0MSw0MTM5MzI5MTE1LDE4NzM4MzYwMDEsNDE0NjY0NTY3LDIyODIyNDg5MzQsNDI3OTIwMDM2OCwxNzExNjg0NTU0LDI4NTI4MTExNiwyNDA1ODAxNzI3LDQxNjcyMTY3NDUsMTYzNDQ2Nzc5NSwzNzYyMjk3MDEsMjY4NTA2Nzg5NiwzNjA4MDA3NDA2LDEzMDg5MTg2MTIsOTU2NTQzOTM4LDI4MDg1NTUxMDUsMzQ5NTk1ODI2MywxMjMxNjM2MzAxLDEwNDc0MjcwMzUsMjkzMjk1OTgxOCwzNjU0NzAzODM2LDEwODgzNTkyNzAsXG45MzY5MThFMywyODQ3NzE0ODk5LDM3MzY4Mzc4MjksMTIwMjkwMDg2Myw4MTcyMzM4OTcsMzE4MzM0MjEwOCwzNDAxMjM3MTMwLDE0MDQyNzc1NTIsNjE1ODE4MTUwLDMxMzQyMDc0OTMsMzQ1MzQyMTIwMywxNDIzODU3NDQ5LDYwMTQ1MDQzMSwzMDA5ODM3NjE0LDMyOTQ3MTA0NTYsMTU2NzEwMzc0Niw3MTE5Mjg3MjQsMzAyMDY2ODQ3MSwzMjcyMzgwMDY1LDE1MTAzMzQyMzUsNzU1MTY3MTE3XSxTPUE/bmV3IFVpbnQzMkFycmF5KGdhKTpnYTtmdW5jdGlvbiBoYSgpe307ZnVuY3Rpb24gaWEoYil7dGhpcy5idWZmZXI9bmV3IChBP1VpbnQxNkFycmF5OkFycmF5KSgyKmIpO3RoaXMubGVuZ3RoPTB9aWEucHJvdG90eXBlLmdldFBhcmVudD1mdW5jdGlvbihiKXtyZXR1cm4gMiooKGItMikvNHwwKX07aWEucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oYixhKXt2YXIgYyxkLGY9dGhpcy5idWZmZXIsZTtjPXRoaXMubGVuZ3RoO2ZbdGhpcy5sZW5ndGgrK109YTtmb3IoZlt0aGlzLmxlbmd0aCsrXT1iOzA8YzspaWYoZD10aGlzLmdldFBhcmVudChjKSxmW2NdPmZbZF0pZT1mW2NdLGZbY109ZltkXSxmW2RdPWUsZT1mW2MrMV0sZltjKzFdPWZbZCsxXSxmW2QrMV09ZSxjPWQ7ZWxzZSBicmVhaztyZXR1cm4gdGhpcy5sZW5ndGh9O1xuaWEucHJvdG90eXBlLnBvcD1mdW5jdGlvbigpe3ZhciBiLGEsYz10aGlzLmJ1ZmZlcixkLGYsZTthPWNbMF07Yj1jWzFdO3RoaXMubGVuZ3RoLT0yO2NbMF09Y1t0aGlzLmxlbmd0aF07Y1sxXT1jW3RoaXMubGVuZ3RoKzFdO2ZvcihlPTA7Oyl7Zj0yKmUrMjtpZihmPj10aGlzLmxlbmd0aClicmVhaztmKzI8dGhpcy5sZW5ndGgmJmNbZisyXT5jW2ZdJiYoZis9Mik7aWYoY1tmXT5jW2VdKWQ9Y1tlXSxjW2VdPWNbZl0sY1tmXT1kLGQ9Y1tlKzFdLGNbZSsxXT1jW2YrMV0sY1tmKzFdPWQ7ZWxzZSBicmVhaztlPWZ9cmV0dXJue2luZGV4OmIsdmFsdWU6YSxsZW5ndGg6dGhpcy5sZW5ndGh9fTtmdW5jdGlvbiBqYShiKXt2YXIgYT1iLmxlbmd0aCxjPTAsZD1OdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksZixlLGcsayxoLGwscyxuLG07Zm9yKG49MDtuPGE7KytuKWJbbl0+YyYmKGM9YltuXSksYltuXTxkJiYoZD1iW25dKTtmPTE8PGM7ZT1uZXcgKEE/VWludDMyQXJyYXk6QXJyYXkpKGYpO2c9MTtrPTA7Zm9yKGg9MjtnPD1jOyl7Zm9yKG49MDtuPGE7KytuKWlmKGJbbl09PT1nKXtsPTA7cz1rO2ZvcihtPTA7bTxnOysrbSlsPWw8PDF8cyYxLHM+Pj0xO2ZvcihtPWw7bTxmO20rPWgpZVttXT1nPDwxNnxuOysra30rK2c7azw8PTE7aDw8PTF9cmV0dXJuW2UsYyxkXX07ZnVuY3Rpb24gbWEoYixhKXt0aGlzLms9bmE7dGhpcy5GPTA7dGhpcy5pbnB1dD1BJiZiIGluc3RhbmNlb2YgQXJyYXk/bmV3IFVpbnQ4QXJyYXkoYik6Yjt0aGlzLmI9MDthJiYoYS5sYXp5JiYodGhpcy5GPWEubGF6eSksXCJudW1iZXJcIj09PXR5cGVvZiBhLmNvbXByZXNzaW9uVHlwZSYmKHRoaXMuaz1hLmNvbXByZXNzaW9uVHlwZSksYS5vdXRwdXRCdWZmZXImJih0aGlzLmE9QSYmYS5vdXRwdXRCdWZmZXIgaW5zdGFuY2VvZiBBcnJheT9uZXcgVWludDhBcnJheShhLm91dHB1dEJ1ZmZlcik6YS5vdXRwdXRCdWZmZXIpLFwibnVtYmVyXCI9PT10eXBlb2YgYS5vdXRwdXRJbmRleCYmKHRoaXMuYj1hLm91dHB1dEluZGV4KSk7dGhpcy5hfHwodGhpcy5hPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgzMjc2OCkpfXZhciBuYT0yLG9hPXtOT05FOjAsTDoxLHQ6bmEsWDozfSxwYT1bXSxUO1xuZm9yKFQ9MDsyODg+VDtUKyspc3dpdGNoKHUpe2Nhc2UgMTQzPj1UOnBhLnB1c2goW1QrNDgsOF0pO2JyZWFrO2Nhc2UgMjU1Pj1UOnBhLnB1c2goW1QtMTQ0KzQwMCw5XSk7YnJlYWs7Y2FzZSAyNzk+PVQ6cGEucHVzaChbVC0yNTYrMCw3XSk7YnJlYWs7Y2FzZSAyODc+PVQ6cGEucHVzaChbVC0yODArMTkyLDhdKTticmVhaztkZWZhdWx0OnEoXCJpbnZhbGlkIGxpdGVyYWw6IFwiK1QpfVxubWEucHJvdG90eXBlLmg9ZnVuY3Rpb24oKXt2YXIgYixhLGMsZCxmPXRoaXMuaW5wdXQ7c3dpdGNoKHRoaXMuayl7Y2FzZSAwOmM9MDtmb3IoZD1mLmxlbmd0aDtjPGQ7KXthPUE/Zi5zdWJhcnJheShjLGMrNjU1MzUpOmYuc2xpY2UoYyxjKzY1NTM1KTtjKz1hLmxlbmd0aDt2YXIgZT1hLGc9Yz09PWQsaz10LGg9dCxsPXQscz10LG49dCxtPXRoaXMuYSxwPXRoaXMuYjtpZihBKXtmb3IobT1uZXcgVWludDhBcnJheSh0aGlzLmEuYnVmZmVyKTttLmxlbmd0aDw9cCtlLmxlbmd0aCs1OyltPW5ldyBVaW50OEFycmF5KG0ubGVuZ3RoPDwxKTttLnNldCh0aGlzLmEpfWs9Zz8xOjA7bVtwKytdPWt8MDtoPWUubGVuZ3RoO2w9fmgrNjU1MzYmNjU1MzU7bVtwKytdPWgmMjU1O21bcCsrXT1oPj4+OCYyNTU7bVtwKytdPWwmMjU1O21bcCsrXT1sPj4+OCYyNTU7aWYoQSltLnNldChlLHApLHArPWUubGVuZ3RoLG09bS5zdWJhcnJheSgwLHApO2Vsc2V7cz0wO2ZvcihuPWUubGVuZ3RoO3M8bjsrK3MpbVtwKytdPVxuZVtzXTttLmxlbmd0aD1wfXRoaXMuYj1wO3RoaXMuYT1tfWJyZWFrO2Nhc2UgMTp2YXIgcj1uZXcgRShBP25ldyBVaW50OEFycmF5KHRoaXMuYS5idWZmZXIpOnRoaXMuYSx0aGlzLmIpO3IuZCgxLDEsdSk7ci5kKDEsMix1KTt2YXIgdj1xYSh0aGlzLGYpLHgsTyx5O3g9MDtmb3IoTz12Lmxlbmd0aDt4PE87eCsrKWlmKHk9dlt4XSxFLnByb3RvdHlwZS5kLmFwcGx5KHIscGFbeV0pLDI1Njx5KXIuZCh2WysreF0sdlsrK3hdLHUpLHIuZCh2WysreF0sNSksci5kKHZbKyt4XSx2WysreF0sdSk7ZWxzZSBpZigyNTY9PT15KWJyZWFrO3RoaXMuYT1yLmZpbmlzaCgpO3RoaXMuYj10aGlzLmEubGVuZ3RoO2JyZWFrO2Nhc2UgbmE6dmFyIEQ9bmV3IEUoQT9uZXcgVWludDhBcnJheSh0aGlzLmEuYnVmZmVyKTp0aGlzLmEsdGhpcy5iKSxEYSxQLFUsVixXLHFiPVsxNiwxNywxOCwwLDgsNyw5LDYsMTAsNSwxMSw0LDEyLDMsMTMsMiwxNCwxLDE1XSxjYSxFYSxkYSxGYSxrYSxzYT1BcnJheSgxOSksXG5HYSxYLGxhLEIsSGE7RGE9bmE7RC5kKDEsMSx1KTtELmQoRGEsMix1KTtQPXFhKHRoaXMsZik7Y2E9cmEodGhpcy5VLDE1KTtFYT10YShjYSk7ZGE9cmEodGhpcy5ULDcpO0ZhPXRhKGRhKTtmb3IoVT0yODY7MjU3PFUmJjA9PT1jYVtVLTFdO1UtLSk7Zm9yKFY9MzA7MTxWJiYwPT09ZGFbVi0xXTtWLS0pO3ZhciBJYT1VLEphPVYsST1uZXcgKEE/VWludDMyQXJyYXk6QXJyYXkpKElhK0phKSx3LEsseixlYSxIPW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoMzE2KSxGLEMsTD1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMTkpO2Zvcih3PUs9MDt3PElhO3crKylJW0srK109Y2Fbd107Zm9yKHc9MDt3PEphO3crKylJW0srK109ZGFbd107aWYoIUEpe3c9MDtmb3IoZWE9TC5sZW5ndGg7dzxlYTsrK3cpTFt3XT0wfXc9Rj0wO2ZvcihlYT1JLmxlbmd0aDt3PGVhO3crPUspe2ZvcihLPTE7dytLPGVhJiZJW3crS109PT1JW3ddOysrSyk7ej1LO2lmKDA9PT1JW3ddKWlmKDM+eilmb3IoOzA8XG56LS07KUhbRisrXT0wLExbMF0rKztlbHNlIGZvcig7MDx6OylDPTEzOD56P3o6MTM4LEM+ei0zJiZDPHomJihDPXotMyksMTA+PUM/KEhbRisrXT0xNyxIW0YrK109Qy0zLExbMTddKyspOihIW0YrK109MTgsSFtGKytdPUMtMTEsTFsxOF0rKyksei09QztlbHNlIGlmKEhbRisrXT1JW3ddLExbSVt3XV0rKyx6LS0sMz56KWZvcig7MDx6LS07KUhbRisrXT1JW3ddLExbSVt3XV0rKztlbHNlIGZvcig7MDx6OylDPTY+ej96OjYsQz56LTMmJkM8eiYmKEM9ei0zKSxIW0YrK109MTYsSFtGKytdPUMtMyxMWzE2XSsrLHotPUN9Yj1BP0guc3ViYXJyYXkoMCxGKTpILnNsaWNlKDAsRik7a2E9cmEoTCw3KTtmb3IoQj0wOzE5PkI7QisrKXNhW0JdPWthW3FiW0JdXTtmb3IoVz0xOTs0PFcmJjA9PT1zYVtXLTFdO1ctLSk7R2E9dGEoa2EpO0QuZChVLTI1Nyw1LHUpO0QuZChWLTEsNSx1KTtELmQoVy00LDQsdSk7Zm9yKEI9MDtCPFc7QisrKUQuZChzYVtCXSwzLHUpO0I9MDtmb3IoSGE9Yi5sZW5ndGg7QjxcbkhhO0IrKylpZihYPWJbQl0sRC5kKEdhW1hdLGthW1hdLHUpLDE2PD1YKXtCKys7c3dpdGNoKFgpe2Nhc2UgMTY6bGE9MjticmVhaztjYXNlIDE3OmxhPTM7YnJlYWs7Y2FzZSAxODpsYT03O2JyZWFrO2RlZmF1bHQ6cShcImludmFsaWQgY29kZTogXCIrWCl9RC5kKGJbQl0sbGEsdSl9dmFyIEthPVtFYSxjYV0sTGE9W0ZhLGRhXSxNLE1hLGZhLHZhLE5hLE9hLFBhLFFhO05hPUthWzBdO09hPUthWzFdO1BhPUxhWzBdO1FhPUxhWzFdO009MDtmb3IoTWE9UC5sZW5ndGg7TTxNYTsrK00paWYoZmE9UFtNXSxELmQoTmFbZmFdLE9hW2ZhXSx1KSwyNTY8ZmEpRC5kKFBbKytNXSxQWysrTV0sdSksdmE9UFsrK01dLEQuZChQYVt2YV0sUWFbdmFdLHUpLEQuZChQWysrTV0sUFsrK01dLHUpO2Vsc2UgaWYoMjU2PT09ZmEpYnJlYWs7dGhpcy5hPUQuZmluaXNoKCk7dGhpcy5iPXRoaXMuYS5sZW5ndGg7YnJlYWs7ZGVmYXVsdDpxKFwiaW52YWxpZCBjb21wcmVzc2lvbiB0eXBlXCIpfXJldHVybiB0aGlzLmF9O1xuZnVuY3Rpb24gdWEoYixhKXt0aGlzLmxlbmd0aD1iO3RoaXMuTj1hfVxudmFyIHdhPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gYihhKXtzd2l0Y2godSl7Y2FzZSAzPT09YTpyZXR1cm5bMjU3LGEtMywwXTtjYXNlIDQ9PT1hOnJldHVyblsyNTgsYS00LDBdO2Nhc2UgNT09PWE6cmV0dXJuWzI1OSxhLTUsMF07Y2FzZSA2PT09YTpyZXR1cm5bMjYwLGEtNiwwXTtjYXNlIDc9PT1hOnJldHVyblsyNjEsYS03LDBdO2Nhc2UgOD09PWE6cmV0dXJuWzI2MixhLTgsMF07Y2FzZSA5PT09YTpyZXR1cm5bMjYzLGEtOSwwXTtjYXNlIDEwPT09YTpyZXR1cm5bMjY0LGEtMTAsMF07Y2FzZSAxMj49YTpyZXR1cm5bMjY1LGEtMTEsMV07Y2FzZSAxND49YTpyZXR1cm5bMjY2LGEtMTMsMV07Y2FzZSAxNj49YTpyZXR1cm5bMjY3LGEtMTUsMV07Y2FzZSAxOD49YTpyZXR1cm5bMjY4LGEtMTcsMV07Y2FzZSAyMj49YTpyZXR1cm5bMjY5LGEtMTksMl07Y2FzZSAyNj49YTpyZXR1cm5bMjcwLGEtMjMsMl07Y2FzZSAzMD49YTpyZXR1cm5bMjcxLGEtMjcsMl07Y2FzZSAzND49YTpyZXR1cm5bMjcyLFxuYS0zMSwyXTtjYXNlIDQyPj1hOnJldHVyblsyNzMsYS0zNSwzXTtjYXNlIDUwPj1hOnJldHVyblsyNzQsYS00MywzXTtjYXNlIDU4Pj1hOnJldHVyblsyNzUsYS01MSwzXTtjYXNlIDY2Pj1hOnJldHVyblsyNzYsYS01OSwzXTtjYXNlIDgyPj1hOnJldHVyblsyNzcsYS02Nyw0XTtjYXNlIDk4Pj1hOnJldHVyblsyNzgsYS04Myw0XTtjYXNlIDExND49YTpyZXR1cm5bMjc5LGEtOTksNF07Y2FzZSAxMzA+PWE6cmV0dXJuWzI4MCxhLTExNSw0XTtjYXNlIDE2Mj49YTpyZXR1cm5bMjgxLGEtMTMxLDVdO2Nhc2UgMTk0Pj1hOnJldHVyblsyODIsYS0xNjMsNV07Y2FzZSAyMjY+PWE6cmV0dXJuWzI4MyxhLTE5NSw1XTtjYXNlIDI1Nz49YTpyZXR1cm5bMjg0LGEtMjI3LDVdO2Nhc2UgMjU4PT09YTpyZXR1cm5bMjg1LGEtMjU4LDBdO2RlZmF1bHQ6cShcImludmFsaWQgbGVuZ3RoOiBcIithKX19dmFyIGE9W10sYyxkO2ZvcihjPTM7MjU4Pj1jO2MrKylkPWIoYyksYVtjXT1kWzJdPDwyNHxkWzFdPDxcbjE2fGRbMF07cmV0dXJuIGF9KCkseGE9QT9uZXcgVWludDMyQXJyYXkod2EpOndhO1xuZnVuY3Rpb24gcWEoYixhKXtmdW5jdGlvbiBjKGEsYyl7dmFyIGI9YS5OLGQ9W10sZT0wLGY7Zj14YVthLmxlbmd0aF07ZFtlKytdPWYmNjU1MzU7ZFtlKytdPWY+PjE2JjI1NTtkW2UrK109Zj4+MjQ7dmFyIGc7c3dpdGNoKHUpe2Nhc2UgMT09PWI6Zz1bMCxiLTEsMF07YnJlYWs7Y2FzZSAyPT09YjpnPVsxLGItMiwwXTticmVhaztjYXNlIDM9PT1iOmc9WzIsYi0zLDBdO2JyZWFrO2Nhc2UgND09PWI6Zz1bMyxiLTQsMF07YnJlYWs7Y2FzZSA2Pj1iOmc9WzQsYi01LDFdO2JyZWFrO2Nhc2UgOD49YjpnPVs1LGItNywxXTticmVhaztjYXNlIDEyPj1iOmc9WzYsYi05LDJdO2JyZWFrO2Nhc2UgMTY+PWI6Zz1bNyxiLTEzLDJdO2JyZWFrO2Nhc2UgMjQ+PWI6Zz1bOCxiLTE3LDNdO2JyZWFrO2Nhc2UgMzI+PWI6Zz1bOSxiLTI1LDNdO2JyZWFrO2Nhc2UgNDg+PWI6Zz1bMTAsYi0zMyw0XTticmVhaztjYXNlIDY0Pj1iOmc9WzExLGItNDksNF07YnJlYWs7Y2FzZSA5Nj49YjpnPVsxMixiLVxuNjUsNV07YnJlYWs7Y2FzZSAxMjg+PWI6Zz1bMTMsYi05Nyw1XTticmVhaztjYXNlIDE5Mj49YjpnPVsxNCxiLTEyOSw2XTticmVhaztjYXNlIDI1Nj49YjpnPVsxNSxiLTE5Myw2XTticmVhaztjYXNlIDM4ND49YjpnPVsxNixiLTI1Nyw3XTticmVhaztjYXNlIDUxMj49YjpnPVsxNyxiLTM4NSw3XTticmVhaztjYXNlIDc2OD49YjpnPVsxOCxiLTUxMyw4XTticmVhaztjYXNlIDEwMjQ+PWI6Zz1bMTksYi03NjksOF07YnJlYWs7Y2FzZSAxNTM2Pj1iOmc9WzIwLGItMTAyNSw5XTticmVhaztjYXNlIDIwNDg+PWI6Zz1bMjEsYi0xNTM3LDldO2JyZWFrO2Nhc2UgMzA3Mj49YjpnPVsyMixiLTIwNDksMTBdO2JyZWFrO2Nhc2UgNDA5Nj49YjpnPVsyMyxiLTMwNzMsMTBdO2JyZWFrO2Nhc2UgNjE0ND49YjpnPVsyNCxiLTQwOTcsMTFdO2JyZWFrO2Nhc2UgODE5Mj49YjpnPVsyNSxiLTYxNDUsMTFdO2JyZWFrO2Nhc2UgMTIyODg+PWI6Zz1bMjYsYi04MTkzLDEyXTticmVhaztjYXNlIDE2Mzg0Pj1cbmI6Zz1bMjcsYi0xMjI4OSwxMl07YnJlYWs7Y2FzZSAyNDU3Nj49YjpnPVsyOCxiLTE2Mzg1LDEzXTticmVhaztjYXNlIDMyNzY4Pj1iOmc9WzI5LGItMjQ1NzcsMTNdO2JyZWFrO2RlZmF1bHQ6cShcImludmFsaWQgZGlzdGFuY2VcIil9Zj1nO2RbZSsrXT1mWzBdO2RbZSsrXT1mWzFdO2RbZSsrXT1mWzJdO3ZhciBoLGs7aD0wO2ZvcihrPWQubGVuZ3RoO2g8azsrK2gpbVtwKytdPWRbaF07dltkWzBdXSsrO3hbZFszXV0rKztyPWEubGVuZ3RoK2MtMTtuPW51bGx9dmFyIGQsZixlLGcsayxoPXt9LGwscyxuLG09QT9uZXcgVWludDE2QXJyYXkoMiphLmxlbmd0aCk6W10scD0wLHI9MCx2PW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoMjg2KSx4PW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoMzApLE89Yi5GLHk7aWYoIUEpe2ZvcihlPTA7Mjg1Pj1lOyl2W2UrK109MDtmb3IoZT0wOzI5Pj1lOyl4W2UrK109MH12WzI1Nl09MTtkPTA7Zm9yKGY9YS5sZW5ndGg7ZDxmOysrZCl7ZT1rPTA7XG5mb3IoZz0zO2U8ZyYmZCtlIT09ZjsrK2Upaz1rPDw4fGFbZCtlXTtoW2tdPT09dCYmKGhba109W10pO2w9aFtrXTtpZighKDA8ci0tKSl7Zm9yKDswPGwubGVuZ3RoJiYzMjc2ODxkLWxbMF07KWwuc2hpZnQoKTtpZihkKzM+PWYpe24mJmMobiwtMSk7ZT0wO2ZvcihnPWYtZDtlPGc7KytlKXk9YVtkK2VdLG1bcCsrXT15LCsrdlt5XTticmVha30wPGwubGVuZ3RoPyhzPXlhKGEsZCxsKSxuP24ubGVuZ3RoPHMubGVuZ3RoPyh5PWFbZC0xXSxtW3ArK109eSwrK3ZbeV0sYyhzLDApKTpjKG4sLTEpOnMubGVuZ3RoPE8/bj1zOmMocywwKSk6bj9jKG4sLTEpOih5PWFbZF0sbVtwKytdPXksKyt2W3ldKX1sLnB1c2goZCl9bVtwKytdPTI1Njt2WzI1Nl0rKztiLlU9djtiLlQ9eDtyZXR1cm4gQT9tLnN1YmFycmF5KDAscCk6bX1cbmZ1bmN0aW9uIHlhKGIsYSxjKXt2YXIgZCxmLGU9MCxnLGssaCxsLHM9Yi5sZW5ndGg7az0wO2w9Yy5sZW5ndGg7YTpmb3IoO2s8bDtrKyspe2Q9Y1tsLWstMV07Zz0zO2lmKDM8ZSl7Zm9yKGg9ZTszPGg7aC0tKWlmKGJbZCtoLTFdIT09YlthK2gtMV0pY29udGludWUgYTtnPWV9Zm9yKDsyNTg+ZyYmYStnPHMmJmJbZCtnXT09PWJbYStnXTspKytnO2c+ZSYmKGY9ZCxlPWcpO2lmKDI1OD09PWcpYnJlYWt9cmV0dXJuIG5ldyB1YShlLGEtZil9XG5mdW5jdGlvbiByYShiLGEpe3ZhciBjPWIubGVuZ3RoLGQ9bmV3IGlhKDU3MiksZj1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoYyksZSxnLGssaCxsO2lmKCFBKWZvcihoPTA7aDxjO2grKylmW2hdPTA7Zm9yKGg9MDtoPGM7KytoKTA8YltoXSYmZC5wdXNoKGgsYltoXSk7ZT1BcnJheShkLmxlbmd0aC8yKTtnPW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoZC5sZW5ndGgvMik7aWYoMT09PWUubGVuZ3RoKXJldHVybiBmW2QucG9wKCkuaW5kZXhdPTEsZjtoPTA7Zm9yKGw9ZC5sZW5ndGgvMjtoPGw7KytoKWVbaF09ZC5wb3AoKSxnW2hdPWVbaF0udmFsdWU7az16YShnLGcubGVuZ3RoLGEpO2g9MDtmb3IobD1lLmxlbmd0aDtoPGw7KytoKWZbZVtoXS5pbmRleF09a1toXTtyZXR1cm4gZn1cbmZ1bmN0aW9uIHphKGIsYSxjKXtmdW5jdGlvbiBkKGIpe3ZhciBjPWhbYl1bbFtiXV07Yz09PWE/KGQoYisxKSxkKGIrMSkpOi0tZ1tjXTsrK2xbYl19dmFyIGY9bmV3IChBP1VpbnQxNkFycmF5OkFycmF5KShjKSxlPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KShjKSxnPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KShhKSxrPUFycmF5KGMpLGg9QXJyYXkoYyksbD1BcnJheShjKSxzPSgxPDxjKS1hLG49MTw8Yy0xLG0scCxyLHYseDtmW2MtMV09YTtmb3IocD0wO3A8YzsrK3ApczxuP2VbcF09MDooZVtwXT0xLHMtPW4pLHM8PD0xLGZbYy0yLXBdPShmW2MtMS1wXS8yfDApK2E7ZlswXT1lWzBdO2tbMF09QXJyYXkoZlswXSk7aFswXT1BcnJheShmWzBdKTtmb3IocD0xO3A8YzsrK3ApZltwXT4yKmZbcC0xXStlW3BdJiYoZltwXT0yKmZbcC0xXStlW3BdKSxrW3BdPUFycmF5KGZbcF0pLGhbcF09QXJyYXkoZltwXSk7Zm9yKG09MDttPGE7KyttKWdbbV09Yztmb3Iocj0wO3I8ZltjLTFdOysrcilrW2MtXG4xXVtyXT1iW3JdLGhbYy0xXVtyXT1yO2ZvcihtPTA7bTxjOysrbSlsW21dPTA7MT09PWVbYy0xXSYmKC0tZ1swXSwrK2xbYy0xXSk7Zm9yKHA9Yy0yOzA8PXA7LS1wKXt2PW09MDt4PWxbcCsxXTtmb3Iocj0wO3I8ZltwXTtyKyspdj1rW3ArMV1beF0ra1twKzFdW3grMV0sdj5iW21dPyhrW3BdW3JdPXYsaFtwXVtyXT1hLHgrPTIpOihrW3BdW3JdPWJbbV0saFtwXVtyXT1tLCsrbSk7bFtwXT0wOzE9PT1lW3BdJiZkKHApfXJldHVybiBnfVxuZnVuY3Rpb24gdGEoYil7dmFyIGE9bmV3IChBP1VpbnQxNkFycmF5OkFycmF5KShiLmxlbmd0aCksYz1bXSxkPVtdLGY9MCxlLGcsayxoO2U9MDtmb3IoZz1iLmxlbmd0aDtlPGc7ZSsrKWNbYltlXV09KGNbYltlXV18MCkrMTtlPTE7Zm9yKGc9MTY7ZTw9ZztlKyspZFtlXT1mLGYrPWNbZV18MCxmPDw9MTtlPTA7Zm9yKGc9Yi5sZW5ndGg7ZTxnO2UrKyl7Zj1kW2JbZV1dO2RbYltlXV0rPTE7az1hW2VdPTA7Zm9yKGg9YltlXTtrPGg7aysrKWFbZV09YVtlXTw8MXxmJjEsZj4+Pj0xfXJldHVybiBhfTtmdW5jdGlvbiBBYShiLGEpe3RoaXMuaW5wdXQ9Yjt0aGlzLmI9dGhpcy5jPTA7dGhpcy5nPXt9O2EmJihhLmZsYWdzJiYodGhpcy5nPWEuZmxhZ3MpLFwic3RyaW5nXCI9PT10eXBlb2YgYS5maWxlbmFtZSYmKHRoaXMuZmlsZW5hbWU9YS5maWxlbmFtZSksXCJzdHJpbmdcIj09PXR5cGVvZiBhLmNvbW1lbnQmJih0aGlzLnc9YS5jb21tZW50KSxhLmRlZmxhdGVPcHRpb25zJiYodGhpcy5sPWEuZGVmbGF0ZU9wdGlvbnMpKTt0aGlzLmx8fCh0aGlzLmw9e30pfVxuQWEucHJvdG90eXBlLmg9ZnVuY3Rpb24oKXt2YXIgYixhLGMsZCxmLGUsZyxrLGg9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKDMyNzY4KSxsPTAscz10aGlzLmlucHV0LG49dGhpcy5jLG09dGhpcy5maWxlbmFtZSxwPXRoaXMudztoW2wrK109MzE7aFtsKytdPTEzOTtoW2wrK109ODtiPTA7dGhpcy5nLmZuYW1lJiYoYnw9QmEpO3RoaXMuZy5mY29tbWVudCYmKGJ8PUNhKTt0aGlzLmcuZmhjcmMmJihifD1SYSk7aFtsKytdPWI7YT0oRGF0ZS5ub3c/RGF0ZS5ub3coKTorbmV3IERhdGUpLzFFM3wwO2hbbCsrXT1hJjI1NTtoW2wrK109YT4+PjgmMjU1O2hbbCsrXT1hPj4+MTYmMjU1O2hbbCsrXT1hPj4+MjQmMjU1O2hbbCsrXT0wO2hbbCsrXT1TYTtpZih0aGlzLmcuZm5hbWUhPT10KXtnPTA7Zm9yKGs9bS5sZW5ndGg7ZzxrOysrZyllPW0uY2hhckNvZGVBdChnKSwyNTU8ZSYmKGhbbCsrXT1lPj4+OCYyNTUpLGhbbCsrXT1lJjI1NTtoW2wrK109MH1pZih0aGlzLmcuY29tbWVudCl7Zz1cbjA7Zm9yKGs9cC5sZW5ndGg7ZzxrOysrZyllPXAuY2hhckNvZGVBdChnKSwyNTU8ZSYmKGhbbCsrXT1lPj4+OCYyNTUpLGhbbCsrXT1lJjI1NTtoW2wrK109MH10aGlzLmcuZmhjcmMmJihjPVIoaCwwLGwpJjY1NTM1LGhbbCsrXT1jJjI1NSxoW2wrK109Yz4+PjgmMjU1KTt0aGlzLmwub3V0cHV0QnVmZmVyPWg7dGhpcy5sLm91dHB1dEluZGV4PWw7Zj1uZXcgbWEocyx0aGlzLmwpO2g9Zi5oKCk7bD1mLmI7QSYmKGwrOD5oLmJ1ZmZlci5ieXRlTGVuZ3RoPyh0aGlzLmE9bmV3IFVpbnQ4QXJyYXkobCs4KSx0aGlzLmEuc2V0KG5ldyBVaW50OEFycmF5KGguYnVmZmVyKSksaD10aGlzLmEpOmg9bmV3IFVpbnQ4QXJyYXkoaC5idWZmZXIpKTtkPVIocyx0LHQpO2hbbCsrXT1kJjI1NTtoW2wrK109ZD4+PjgmMjU1O2hbbCsrXT1kPj4+MTYmMjU1O2hbbCsrXT1kPj4+MjQmMjU1O2s9cy5sZW5ndGg7aFtsKytdPWsmMjU1O2hbbCsrXT1rPj4+OCYyNTU7aFtsKytdPWs+Pj4xNiYyNTU7aFtsKytdPVxuaz4+PjI0JjI1NTt0aGlzLmM9bjtBJiZsPGgubGVuZ3RoJiYodGhpcy5hPWg9aC5zdWJhcnJheSgwLGwpKTtyZXR1cm4gaH07dmFyIFNhPTI1NSxSYT0yLEJhPTgsQ2E9MTY7ZnVuY3Rpb24gWShiLGEpe3RoaXMubz1bXTt0aGlzLnA9MzI3Njg7dGhpcy5lPXRoaXMuaj10aGlzLmM9dGhpcy5zPTA7dGhpcy5pbnB1dD1BP25ldyBVaW50OEFycmF5KGIpOmI7dGhpcy51PSExO3RoaXMucT1UYTt0aGlzLks9ITE7aWYoYXx8IShhPXt9KSlhLmluZGV4JiYodGhpcy5jPWEuaW5kZXgpLGEuYnVmZmVyU2l6ZSYmKHRoaXMucD1hLmJ1ZmZlclNpemUpLGEuYnVmZmVyVHlwZSYmKHRoaXMucT1hLmJ1ZmZlclR5cGUpLGEucmVzaXplJiYodGhpcy5LPWEucmVzaXplKTtzd2l0Y2godGhpcy5xKXtjYXNlIFVhOnRoaXMuYj0zMjc2ODt0aGlzLmE9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKDMyNzY4K3RoaXMucCsyNTgpO2JyZWFrO2Nhc2UgVGE6dGhpcy5iPTA7dGhpcy5hPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSh0aGlzLnApO3RoaXMuZj10aGlzLlM7dGhpcy56PXRoaXMuTzt0aGlzLnI9dGhpcy5RO2JyZWFrO2RlZmF1bHQ6cShFcnJvcihcImludmFsaWQgaW5mbGF0ZSBtb2RlXCIpKX19XG52YXIgVWE9MCxUYT0xO1xuWS5wcm90b3R5cGUuaT1mdW5jdGlvbigpe2Zvcig7IXRoaXMudTspe3ZhciBiPVoodGhpcywzKTtiJjEmJih0aGlzLnU9dSk7Yj4+Pj0xO3N3aXRjaChiKXtjYXNlIDA6dmFyIGE9dGhpcy5pbnB1dCxjPXRoaXMuYyxkPXRoaXMuYSxmPXRoaXMuYixlPXQsZz10LGs9dCxoPWQubGVuZ3RoLGw9dDt0aGlzLmU9dGhpcy5qPTA7ZT1hW2MrK107ZT09PXQmJnEoRXJyb3IoXCJpbnZhbGlkIHVuY29tcHJlc3NlZCBibG9jayBoZWFkZXI6IExFTiAoZmlyc3QgYnl0ZSlcIikpO2c9ZTtlPWFbYysrXTtlPT09dCYmcShFcnJvcihcImludmFsaWQgdW5jb21wcmVzc2VkIGJsb2NrIGhlYWRlcjogTEVOIChzZWNvbmQgYnl0ZSlcIikpO2d8PWU8PDg7ZT1hW2MrK107ZT09PXQmJnEoRXJyb3IoXCJpbnZhbGlkIHVuY29tcHJlc3NlZCBibG9jayBoZWFkZXI6IE5MRU4gKGZpcnN0IGJ5dGUpXCIpKTtrPWU7ZT1hW2MrK107ZT09PXQmJnEoRXJyb3IoXCJpbnZhbGlkIHVuY29tcHJlc3NlZCBibG9jayBoZWFkZXI6IE5MRU4gKHNlY29uZCBieXRlKVwiKSk7a3w9XG5lPDw4O2c9PT1+ayYmcShFcnJvcihcImludmFsaWQgdW5jb21wcmVzc2VkIGJsb2NrIGhlYWRlcjogbGVuZ3RoIHZlcmlmeVwiKSk7YytnPmEubGVuZ3RoJiZxKEVycm9yKFwiaW5wdXQgYnVmZmVyIGlzIGJyb2tlblwiKSk7c3dpdGNoKHRoaXMucSl7Y2FzZSBVYTpmb3IoO2YrZz5kLmxlbmd0aDspe2w9aC1mO2ctPWw7aWYoQSlkLnNldChhLnN1YmFycmF5KGMsYytsKSxmKSxmKz1sLGMrPWw7ZWxzZSBmb3IoO2wtLTspZFtmKytdPWFbYysrXTt0aGlzLmI9ZjtkPXRoaXMuZigpO2Y9dGhpcy5ifWJyZWFrO2Nhc2UgVGE6Zm9yKDtmK2c+ZC5sZW5ndGg7KWQ9dGhpcy5mKHtCOjJ9KTticmVhaztkZWZhdWx0OnEoRXJyb3IoXCJpbnZhbGlkIGluZmxhdGUgbW9kZVwiKSl9aWYoQSlkLnNldChhLnN1YmFycmF5KGMsYytnKSxmKSxmKz1nLGMrPWc7ZWxzZSBmb3IoO2ctLTspZFtmKytdPWFbYysrXTt0aGlzLmM9Yzt0aGlzLmI9Zjt0aGlzLmE9ZDticmVhaztjYXNlIDE6dGhpcy5yKFZhLFdhKTticmVhaztcbmNhc2UgMjpYYSh0aGlzKTticmVhaztkZWZhdWx0OnEoRXJyb3IoXCJ1bmtub3duIEJUWVBFOiBcIitiKSl9fXJldHVybiB0aGlzLnooKX07XG52YXIgWWE9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdLFphPUE/bmV3IFVpbnQxNkFycmF5KFlhKTpZYSwkYT1bMyw0LDUsNiw3LDgsOSwxMCwxMSwxMywxNSwxNywxOSwyMywyNywzMSwzNSw0Myw1MSw1OSw2Nyw4Myw5OSwxMTUsMTMxLDE2MywxOTUsMjI3LDI1OCwyNTgsMjU4XSxhYj1BP25ldyBVaW50MTZBcnJheSgkYSk6JGEsYmI9WzAsMCwwLDAsMCwwLDAsMCwxLDEsMSwxLDIsMiwyLDIsMywzLDMsMyw0LDQsNCw0LDUsNSw1LDUsMCwwLDBdLGNiPUE/bmV3IFVpbnQ4QXJyYXkoYmIpOmJiLGRiPVsxLDIsMyw0LDUsNyw5LDEzLDE3LDI1LDMzLDQ5LDY1LDk3LDEyOSwxOTMsMjU3LDM4NSw1MTMsNzY5LDEwMjUsMTUzNywyMDQ5LDMwNzMsNDA5Nyw2MTQ1LDgxOTMsMTIyODksMTYzODUsMjQ1NzddLGViPUE/bmV3IFVpbnQxNkFycmF5KGRiKTpkYixmYj1bMCwwLDAsMCwxLDEsMiwyLDMsMyw0LDQsNSw1LDYsNiw3LDcsOCw4LDksOSwxMCxcbjEwLDExLDExLDEyLDEyLDEzLDEzXSxnYj1BP25ldyBVaW50OEFycmF5KGZiKTpmYixoYj1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMjg4KSwkLGliOyQ9MDtmb3IoaWI9aGIubGVuZ3RoOyQ8aWI7KyskKWhiWyRdPTE0Mz49JD84OjI1NT49JD85OjI3OT49JD83Ojg7dmFyIFZhPWphKGhiKSxqYj1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMzApLGtiLGxiO2tiPTA7Zm9yKGxiPWpiLmxlbmd0aDtrYjxsYjsrK2tiKWpiW2tiXT01O3ZhciBXYT1qYShqYik7ZnVuY3Rpb24gWihiLGEpe2Zvcih2YXIgYz1iLmosZD1iLmUsZj1iLmlucHV0LGU9Yi5jLGc7ZDxhOylnPWZbZSsrXSxnPT09dCYmcShFcnJvcihcImlucHV0IGJ1ZmZlciBpcyBicm9rZW5cIikpLGN8PWc8PGQsZCs9ODtnPWMmKDE8PGEpLTE7Yi5qPWM+Pj5hO2IuZT1kLWE7Yi5jPWU7cmV0dXJuIGd9XG5mdW5jdGlvbiBtYihiLGEpe2Zvcih2YXIgYz1iLmosZD1iLmUsZj1iLmlucHV0LGU9Yi5jLGc9YVswXSxrPWFbMV0saCxsLHM7ZDxrOyl7aD1mW2UrK107aWYoaD09PXQpYnJlYWs7Y3w9aDw8ZDtkKz04fWw9Z1tjJigxPDxrKS0xXTtzPWw+Pj4xNjtiLmo9Yz4+cztiLmU9ZC1zO2IuYz1lO3JldHVybiBsJjY1NTM1fVxuZnVuY3Rpb24gWGEoYil7ZnVuY3Rpb24gYShhLGIsYyl7dmFyIGQsZSxmLGc7Zm9yKGc9MDtnPGE7KXN3aXRjaChkPW1iKHRoaXMsYiksZCl7Y2FzZSAxNjpmb3IoZj0zK1oodGhpcywyKTtmLS07KWNbZysrXT1lO2JyZWFrO2Nhc2UgMTc6Zm9yKGY9MytaKHRoaXMsMyk7Zi0tOyljW2crK109MDtlPTA7YnJlYWs7Y2FzZSAxODpmb3IoZj0xMStaKHRoaXMsNyk7Zi0tOyljW2crK109MDtlPTA7YnJlYWs7ZGVmYXVsdDplPWNbZysrXT1kfXJldHVybiBjfXZhciBjPVooYiw1KSsyNTcsZD1aKGIsNSkrMSxmPVooYiw0KSs0LGU9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKFphLmxlbmd0aCksZyxrLGgsbDtmb3IobD0wO2w8ZjsrK2wpZVtaYVtsXV09WihiLDMpO2c9amEoZSk7az1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoYyk7aD1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoZCk7Yi5yKGphKGEuY2FsbChiLGMsZyxrKSksamEoYS5jYWxsKGIsZCxnLGgpKSl9XG5ZLnByb3RvdHlwZS5yPWZ1bmN0aW9uKGIsYSl7dmFyIGM9dGhpcy5hLGQ9dGhpcy5iO3RoaXMuQT1iO2Zvcih2YXIgZj1jLmxlbmd0aC0yNTgsZSxnLGssaDsyNTYhPT0oZT1tYih0aGlzLGIpKTspaWYoMjU2PmUpZD49ZiYmKHRoaXMuYj1kLGM9dGhpcy5mKCksZD10aGlzLmIpLGNbZCsrXT1lO2Vsc2V7Zz1lLTI1NztoPWFiW2ddOzA8Y2JbZ10mJihoKz1aKHRoaXMsY2JbZ10pKTtlPW1iKHRoaXMsYSk7az1lYltlXTswPGdiW2VdJiYoays9Wih0aGlzLGdiW2VdKSk7ZD49ZiYmKHRoaXMuYj1kLGM9dGhpcy5mKCksZD10aGlzLmIpO2Zvcig7aC0tOyljW2RdPWNbZCsrLWtdfWZvcig7ODw9dGhpcy5lOyl0aGlzLmUtPTgsdGhpcy5jLS07dGhpcy5iPWR9O1xuWS5wcm90b3R5cGUuUT1mdW5jdGlvbihiLGEpe3ZhciBjPXRoaXMuYSxkPXRoaXMuYjt0aGlzLkE9Yjtmb3IodmFyIGY9Yy5sZW5ndGgsZSxnLGssaDsyNTYhPT0oZT1tYih0aGlzLGIpKTspaWYoMjU2PmUpZD49ZiYmKGM9dGhpcy5mKCksZj1jLmxlbmd0aCksY1tkKytdPWU7ZWxzZXtnPWUtMjU3O2g9YWJbZ107MDxjYltnXSYmKGgrPVoodGhpcyxjYltnXSkpO2U9bWIodGhpcyxhKTtrPWViW2VdOzA8Z2JbZV0mJihrKz1aKHRoaXMsZ2JbZV0pKTtkK2g+ZiYmKGM9dGhpcy5mKCksZj1jLmxlbmd0aCk7Zm9yKDtoLS07KWNbZF09Y1tkKysta119Zm9yKDs4PD10aGlzLmU7KXRoaXMuZS09OCx0aGlzLmMtLTt0aGlzLmI9ZH07XG5ZLnByb3RvdHlwZS5mPWZ1bmN0aW9uKCl7dmFyIGI9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKHRoaXMuYi0zMjc2OCksYT10aGlzLmItMzI3NjgsYyxkLGY9dGhpcy5hO2lmKEEpYi5zZXQoZi5zdWJhcnJheSgzMjc2OCxiLmxlbmd0aCkpO2Vsc2V7Yz0wO2ZvcihkPWIubGVuZ3RoO2M8ZDsrK2MpYltjXT1mW2MrMzI3NjhdfXRoaXMuby5wdXNoKGIpO3RoaXMucys9Yi5sZW5ndGg7aWYoQSlmLnNldChmLnN1YmFycmF5KGEsYSszMjc2OCkpO2Vsc2UgZm9yKGM9MDszMjc2OD5jOysrYylmW2NdPWZbYStjXTt0aGlzLmI9MzI3Njg7cmV0dXJuIGZ9O1xuWS5wcm90b3R5cGUuUz1mdW5jdGlvbihiKXt2YXIgYSxjPXRoaXMuaW5wdXQubGVuZ3RoL3RoaXMuYysxfDAsZCxmLGUsZz10aGlzLmlucHV0LGs9dGhpcy5hO2ImJihcIm51bWJlclwiPT09dHlwZW9mIGIuQiYmKGM9Yi5CKSxcIm51bWJlclwiPT09dHlwZW9mIGIuTSYmKGMrPWIuTSkpOzI+Yz8oZD0oZy5sZW5ndGgtdGhpcy5jKS90aGlzLkFbMl0sZT0yNTgqKGQvMil8MCxmPWU8ay5sZW5ndGg/ay5sZW5ndGgrZTprLmxlbmd0aDw8MSk6Zj1rLmxlbmd0aCpjO0E/KGE9bmV3IFVpbnQ4QXJyYXkoZiksYS5zZXQoaykpOmE9aztyZXR1cm4gdGhpcy5hPWF9O1xuWS5wcm90b3R5cGUuej1mdW5jdGlvbigpe3ZhciBiPTAsYT10aGlzLmEsYz10aGlzLm8sZCxmPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSh0aGlzLnMrKHRoaXMuYi0zMjc2OCkpLGUsZyxrLGg7aWYoMD09PWMubGVuZ3RoKXJldHVybiBBP3RoaXMuYS5zdWJhcnJheSgzMjc2OCx0aGlzLmIpOnRoaXMuYS5zbGljZSgzMjc2OCx0aGlzLmIpO2U9MDtmb3IoZz1jLmxlbmd0aDtlPGc7KytlKXtkPWNbZV07az0wO2ZvcihoPWQubGVuZ3RoO2s8aDsrK2spZltiKytdPWRba119ZT0zMjc2ODtmb3IoZz10aGlzLmI7ZTxnOysrZSlmW2IrK109YVtlXTt0aGlzLm89W107cmV0dXJuIHRoaXMuYnVmZmVyPWZ9O1xuWS5wcm90b3R5cGUuTz1mdW5jdGlvbigpe3ZhciBiLGE9dGhpcy5iO0E/dGhpcy5LPyhiPW5ldyBVaW50OEFycmF5KGEpLGIuc2V0KHRoaXMuYS5zdWJhcnJheSgwLGEpKSk6Yj10aGlzLmEuc3ViYXJyYXkoMCxhKToodGhpcy5hLmxlbmd0aD5hJiYodGhpcy5hLmxlbmd0aD1hKSxiPXRoaXMuYSk7cmV0dXJuIHRoaXMuYnVmZmVyPWJ9O2Z1bmN0aW9uIG5iKGIpe3RoaXMuaW5wdXQ9Yjt0aGlzLmM9MDt0aGlzLkc9W107dGhpcy5SPSExfVxubmIucHJvdG90eXBlLmk9ZnVuY3Rpb24oKXtmb3IodmFyIGI9dGhpcy5pbnB1dC5sZW5ndGg7dGhpcy5jPGI7KXt2YXIgYT1uZXcgaGEsYz10LGQ9dCxmPXQsZT10LGc9dCxrPXQsaD10LGw9dCxzPXQsbj10aGlzLmlucHV0LG09dGhpcy5jO2EuQz1uW20rK107YS5EPW5bbSsrXTsoMzEhPT1hLkN8fDEzOSE9PWEuRCkmJnEoRXJyb3IoXCJpbnZhbGlkIGZpbGUgc2lnbmF0dXJlOlwiK2EuQytcIixcIithLkQpKTthLnY9blttKytdO3N3aXRjaChhLnYpe2Nhc2UgODpicmVhaztkZWZhdWx0OnEoRXJyb3IoXCJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZDogXCIrYS52KSl9YS5uPW5bbSsrXTtsPW5bbSsrXXxuW20rK108PDh8blttKytdPDwxNnxuW20rK108PDI0O2EuJD1uZXcgRGF0ZSgxRTMqbCk7YS5iYT1uW20rK107YS5hYT1uW20rK107MDwoYS5uJjQpJiYoYS5XPW5bbSsrXXxuW20rK108PDgsbSs9YS5XKTtpZigwPChhLm4mQmEpKXtoPVtdO2ZvcihrPTA7MDwoZz1uW20rK10pOyloW2srK109XG5TdHJpbmcuZnJvbUNoYXJDb2RlKGcpO2EubmFtZT1oLmpvaW4oXCJcIil9aWYoMDwoYS5uJkNhKSl7aD1bXTtmb3Ioaz0wOzA8KGc9blttKytdKTspaFtrKytdPVN0cmluZy5mcm9tQ2hhckNvZGUoZyk7YS53PWguam9pbihcIlwiKX0wPChhLm4mUmEpJiYoYS5QPVIobiwwLG0pJjY1NTM1LGEuUCE9PShuW20rK118blttKytdPDw4KSYmcShFcnJvcihcImludmFsaWQgaGVhZGVyIGNyYzE2XCIpKSk7Yz1uW24ubGVuZ3RoLTRdfG5bbi5sZW5ndGgtM108PDh8bltuLmxlbmd0aC0yXTw8MTZ8bltuLmxlbmd0aC0xXTw8MjQ7bi5sZW5ndGgtbS00LTQ8NTEyKmMmJihlPWMpO2Q9bmV3IFkobix7aW5kZXg6bSxidWZmZXJTaXplOmV9KTthLmRhdGE9Zj1kLmkoKTttPWQuYzthLlk9cz0oblttKytdfG5bbSsrXTw8OHxuW20rK108PDE2fG5bbSsrXTw8MjQpPj4+MDtSKGYsdCx0KSE9PXMmJnEoRXJyb3IoXCJpbnZhbGlkIENSQy0zMiBjaGVja3N1bTogMHhcIitSKGYsdCx0KS50b1N0cmluZygxNikrXCIgLyAweFwiK1xucy50b1N0cmluZygxNikpKTthLlo9Yz0oblttKytdfG5bbSsrXTw8OHxuW20rK108PDE2fG5bbSsrXTw8MjQpPj4+MDsoZi5sZW5ndGgmNDI5NDk2NzI5NSkhPT1jJiZxKEVycm9yKFwiaW52YWxpZCBpbnB1dCBzaXplOiBcIisoZi5sZW5ndGgmNDI5NDk2NzI5NSkrXCIgLyBcIitjKSk7dGhpcy5HLnB1c2goYSk7dGhpcy5jPW19dGhpcy5SPXU7dmFyIHA9dGhpcy5HLHIsdix4PTAsTz0wLHk7cj0wO2Zvcih2PXAubGVuZ3RoO3I8djsrK3IpTys9cFtyXS5kYXRhLmxlbmd0aDtpZihBKXt5PW5ldyBVaW50OEFycmF5KE8pO2ZvcihyPTA7cjx2Oysrcil5LnNldChwW3JdLmRhdGEseCkseCs9cFtyXS5kYXRhLmxlbmd0aH1lbHNle3k9W107Zm9yKHI9MDtyPHY7KytyKXlbcl09cFtyXS5kYXRhO3k9QXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSx5KX1yZXR1cm4geX07ZnVuY3Rpb24gb2IoYil7aWYoXCJzdHJpbmdcIj09PXR5cGVvZiBiKXt2YXIgYT1iLnNwbGl0KFwiXCIpLGMsZDtjPTA7Zm9yKGQ9YS5sZW5ndGg7YzxkO2MrKylhW2NdPShhW2NdLmNoYXJDb2RlQXQoMCkmMjU1KT4+PjA7Yj1hfWZvcih2YXIgZj0xLGU9MCxnPWIubGVuZ3RoLGssaD0wOzA8Zzspe2s9MTAyNDxnPzEwMjQ6ZztnLT1rO2RvIGYrPWJbaCsrXSxlKz1mO3doaWxlKC0tayk7ZiU9NjU1MjE7ZSU9NjU1MjF9cmV0dXJuKGU8PDE2fGYpPj4+MH07ZnVuY3Rpb24gcGIoYixhKXt2YXIgYyxkO3RoaXMuaW5wdXQ9Yjt0aGlzLmM9MDtpZihhfHwhKGE9e30pKWEuaW5kZXgmJih0aGlzLmM9YS5pbmRleCksYS52ZXJpZnkmJih0aGlzLlY9YS52ZXJpZnkpO2M9Ylt0aGlzLmMrK107ZD1iW3RoaXMuYysrXTtzd2l0Y2goYyYxNSl7Y2FzZSByYjp0aGlzLm1ldGhvZD1yYjticmVhaztkZWZhdWx0OnEoRXJyb3IoXCJ1bnN1cHBvcnRlZCBjb21wcmVzc2lvbiBtZXRob2RcIikpfTAhPT0oKGM8PDgpK2QpJTMxJiZxKEVycm9yKFwiaW52YWxpZCBmY2hlY2sgZmxhZzpcIisoKGM8PDgpK2QpJTMxKSk7ZCYzMiYmcShFcnJvcihcImZkaWN0IGZsYWcgaXMgbm90IHN1cHBvcnRlZFwiKSk7dGhpcy5KPW5ldyBZKGIse2luZGV4OnRoaXMuYyxidWZmZXJTaXplOmEuYnVmZmVyU2l6ZSxidWZmZXJUeXBlOmEuYnVmZmVyVHlwZSxyZXNpemU6YS5yZXNpemV9KX1cbnBiLnByb3RvdHlwZS5pPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcy5pbnB1dCxhLGM7YT10aGlzLkouaSgpO3RoaXMuYz10aGlzLkouYzt0aGlzLlYmJihjPShiW3RoaXMuYysrXTw8MjR8Ylt0aGlzLmMrK108PDE2fGJbdGhpcy5jKytdPDw4fGJbdGhpcy5jKytdKT4+PjAsYyE9PW9iKGEpJiZxKEVycm9yKFwiaW52YWxpZCBhZGxlci0zMiBjaGVja3N1bVwiKSkpO3JldHVybiBhfTt2YXIgcmI9ODtmdW5jdGlvbiBzYihiLGEpe3RoaXMuaW5wdXQ9Yjt0aGlzLmE9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKDMyNzY4KTt0aGlzLms9dGIudDt2YXIgYz17fSxkO2lmKChhfHwhKGE9e30pKSYmXCJudW1iZXJcIj09PXR5cGVvZiBhLmNvbXByZXNzaW9uVHlwZSl0aGlzLms9YS5jb21wcmVzc2lvblR5cGU7Zm9yKGQgaW4gYSljW2RdPWFbZF07Yy5vdXRwdXRCdWZmZXI9dGhpcy5hO3RoaXMuST1uZXcgbWEodGhpcy5pbnB1dCxjKX12YXIgdGI9b2E7XG5zYi5wcm90b3R5cGUuaD1mdW5jdGlvbigpe3ZhciBiLGEsYyxkLGYsZSxnLGs9MDtnPXRoaXMuYTtiPXJiO3N3aXRjaChiKXtjYXNlIHJiOmE9TWF0aC5MT0cyRSpNYXRoLmxvZygzMjc2OCktODticmVhaztkZWZhdWx0OnEoRXJyb3IoXCJpbnZhbGlkIGNvbXByZXNzaW9uIG1ldGhvZFwiKSl9Yz1hPDw0fGI7Z1trKytdPWM7c3dpdGNoKGIpe2Nhc2UgcmI6c3dpdGNoKHRoaXMuayl7Y2FzZSB0Yi5OT05FOmY9MDticmVhaztjYXNlIHRiLkw6Zj0xO2JyZWFrO2Nhc2UgdGIudDpmPTI7YnJlYWs7ZGVmYXVsdDpxKEVycm9yKFwidW5zdXBwb3J0ZWQgY29tcHJlc3Npb24gdHlwZVwiKSl9YnJlYWs7ZGVmYXVsdDpxKEVycm9yKFwiaW52YWxpZCBjb21wcmVzc2lvbiBtZXRob2RcIikpfWQ9Zjw8NnwwO2dbaysrXT1kfDMxLSgyNTYqYytkKSUzMTtlPW9iKHRoaXMuaW5wdXQpO3RoaXMuSS5iPWs7Zz10aGlzLkkuaCgpO2s9Zy5sZW5ndGg7QSYmKGc9bmV3IFVpbnQ4QXJyYXkoZy5idWZmZXIpLGcubGVuZ3RoPD1cbmsrNCYmKHRoaXMuYT1uZXcgVWludDhBcnJheShnLmxlbmd0aCs0KSx0aGlzLmEuc2V0KGcpLGc9dGhpcy5hKSxnPWcuc3ViYXJyYXkoMCxrKzQpKTtnW2srK109ZT4+MjQmMjU1O2dbaysrXT1lPj4xNiYyNTU7Z1trKytdPWU+PjgmMjU1O2dbaysrXT1lJjI1NTtyZXR1cm4gZ307ZXhwb3J0cy5kZWZsYXRlPXViO2V4cG9ydHMuZGVmbGF0ZVN5bmM9dmI7ZXhwb3J0cy5pbmZsYXRlPXdiO2V4cG9ydHMuaW5mbGF0ZVN5bmM9eGI7ZXhwb3J0cy5nemlwPXliO2V4cG9ydHMuZ3ppcFN5bmM9emI7ZXhwb3J0cy5ndW56aXA9QWI7ZXhwb3J0cy5ndW56aXBTeW5jPUJiO2Z1bmN0aW9uIHViKGIsYSxjKXtwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCl7dmFyIGQsZjt0cnl7Zj12YihiLGMpfWNhdGNoKGUpe2Q9ZX1hKGQsZil9KX1mdW5jdGlvbiB2YihiLGEpe3ZhciBjO2M9KG5ldyBzYihiKSkuaCgpO2F8fChhPXt9KTtyZXR1cm4gYS5IP2M6Q2IoYyl9ZnVuY3Rpb24gd2IoYixhLGMpe3Byb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKXt2YXIgZCxmO3RyeXtmPXhiKGIsYyl9Y2F0Y2goZSl7ZD1lfWEoZCxmKX0pfVxuZnVuY3Rpb24geGIoYixhKXt2YXIgYztiLnN1YmFycmF5PWIuc2xpY2U7Yz0obmV3IHBiKGIpKS5pKCk7YXx8KGE9e30pO3JldHVybiBhLm5vQnVmZmVyP2M6Q2IoYyl9ZnVuY3Rpb24geWIoYixhLGMpe3Byb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKXt2YXIgZCxmO3RyeXtmPXpiKGIsYyl9Y2F0Y2goZSl7ZD1lfWEoZCxmKX0pfWZ1bmN0aW9uIHpiKGIsYSl7dmFyIGM7Yi5zdWJhcnJheT1iLnNsaWNlO2M9KG5ldyBBYShiKSkuaCgpO2F8fChhPXt9KTtyZXR1cm4gYS5IP2M6Q2IoYyl9ZnVuY3Rpb24gQWIoYixhLGMpe3Byb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKXt2YXIgZCxmO3RyeXtmPUJiKGIsYyl9Y2F0Y2goZSl7ZD1lfWEoZCxmKX0pfWZ1bmN0aW9uIEJiKGIsYSl7dmFyIGM7Yi5zdWJhcnJheT1iLnNsaWNlO2M9KG5ldyBuYihiKSkuaSgpO2F8fChhPXt9KTtyZXR1cm4gYS5IP2M6Q2IoYyl9XG5mdW5jdGlvbiBDYihiKXt2YXIgYT1uZXcgQnVmZmVyKGIubGVuZ3RoKSxjLGQ7Yz0wO2ZvcihkPWIubGVuZ3RoO2M8ZDsrK2MpYVtjXT1iW2NdO3JldHVybiBhfTt9KS5jYWxsKHRoaXMpOyAvL0Agc291cmNlTWFwcGluZ1VSTD1ub2RlLXpsaWIuanMubWFwXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcikiLCJ2YXIgV29ybGQgPSByZXF1aXJlKCdzdGFyYm91bmQtZmlsZXMnKS5Xb3JsZDtcbnZhciB3b3JrZXJwcm94eSA9IHJlcXVpcmUoJ3dvcmtlcnByb3h5Jyk7XG5cbi8vIEtlZXAgb3BlbiB3b3JsZHMgaW4gYSBtYXAsIGlkZW50aWZpZWQgYnkgYSBoYW5kbGUuXG52YXIgd29ybGRzID0ge30sXG4gICAgbmV4dEhhbmRsZSA9IDE7XG5cbndvcmtlcnByb3h5KHtcbiAgY2xvc2U6IGZ1bmN0aW9uIChoYW5kbGUsIGNhbGxiYWNrKSB7XG4gICAgaGFuZGxlID0gaGFuZGxlLnRvU3RyaW5nKCk7XG4gICAgaWYgKCEoaGFuZGxlIGluIHdvcmxkcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNwZWNpZmllZCB3b3JsZCBpcyBub3Qgb3Blbi4nKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBJcyB0aGVyZSBhbnkgY2xlYW4gdXAgdGhhdCBjb3VsZCBiZSBkb25lIG9uIHRoZSB3b3JsZCBvciBzaG91bGQgd2VcbiAgICAvLyAgICAgICBqdXN0IHJlbHkgb24gdGhlIEdDP1xuICAgIGRlbGV0ZSB3b3JsZHNbaGFuZGxlXTtcbiAgICBjYWxsYmFjayhudWxsKTtcbiAgfSxcblxuICBnZXRSZWdpb246IGZ1bmN0aW9uIChoYW5kbGUsIHgsIHksIGNhbGxiYWNrKSB7XG4gICAgaGFuZGxlID0gaGFuZGxlLnRvU3RyaW5nKCk7XG4gICAgaWYgKCEoaGFuZGxlIGluIHdvcmxkcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNwZWNpZmllZCB3b3JsZCBpcyBub3Qgb3Blbi4nKTtcbiAgICB9XG5cbiAgICB2YXIgd29ybGQgPSB3b3JsZHNbaGFuZGxlXS53b3JsZDtcblxuICAgIHZhciBidWZmZXIgPSB3b3JsZC5nZXRSZWdpb25EYXRhKDEsIHgsIHkpLFxuICAgICAgICBlbnRpdGllcyA9IHdvcmxkLmdldEVudGl0aWVzKHgsIHkpO1xuXG4gICAgdmFyIHJlZ2lvbiA9IHtidWZmZXI6IGJ1ZmZlciwgZW50aXRpZXM6IGVudGl0aWVzfTtcbiAgICBjYWxsYmFjay50cmFuc2ZlcihbcmVnaW9uLmJ1ZmZlcl0sIG51bGwsIHJlZ2lvbik7XG4gIH0sXG5cbiAgb3BlbjogZnVuY3Rpb24gKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgLy8gT3BlbiB0aGUgd29ybGQgYW5kIGdldCBpdHMgbWV0YWRhdGEuXG4gICAgdmFyIHdvcmxkID0gV29ybGQub3BlbihmaWxlKSxcbiAgICAgICAgbWV0YWRhdGEgPSB3b3JsZC5nZXRNZXRhZGF0YSgpO1xuXG4gICAgLy8gU3RvcmUgdGhlIHdvcmxkIGluIHRoZSB3b3JsZHMgbWFwLlxuICAgIHZhciBoYW5kbGUgPSBuZXh0SGFuZGxlKys7XG4gICAgd29ybGRzW2hhbmRsZV0gPSB7d29ybGQ6IHdvcmxkfTtcblxuICAgIGNhbGxiYWNrKG51bGwsIHtoYW5kbGU6IGhhbmRsZSwgbWV0YWRhdGE6IG1ldGFkYXRhfSk7XG4gIH1cbn0sIHtjYXRjaEVycm9yczogdHJ1ZX0pO1xuIiwiZXhwb3J0cy5CbG9ja0ZpbGUgPSByZXF1aXJlKCcuL2xpYi9ibG9ja2ZpbGUnKTtcbmV4cG9ydHMuQlRyZWVEQiA9IHJlcXVpcmUoJy4vbGliL2J0cmVlZGInKTtcbmV4cG9ydHMuRG9jdW1lbnQgPSByZXF1aXJlKCcuL2xpYi9kb2N1bWVudCcpO1xuZXhwb3J0cy5QYWNrYWdlID0gcmVxdWlyZSgnLi9saWIvcGFja2FnZScpO1xuZXhwb3J0cy5TYm9uUmVhZGVyID0gcmVxdWlyZSgnLi9saWIvc2JvbnJlYWRlcicpO1xuZXhwb3J0cy5Xb3JsZCA9IHJlcXVpcmUoJy4vbGliL3dvcmxkJyk7XG4iLCJ2YXIgU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vc2JvbnJlYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrRmlsZTtcblxuLyoqXG4gKiBTaXplIG9mIHRoZSBpbml0aWFsIG1ldGFkYXRhIHJlcXVpcmVkIHRvIGJlIGFibGUgdG8gcmVhZCB0aGUgcmVzdCBvZiB0aGVcbiAqIGJsb2NrIGZpbGUuXG4gKi9cbnZhciBNRVRBREFUQV9TSVpFID0gMzI7XG5cbnZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKCk7XG5cbmZ1bmN0aW9uIEJsb2NrRmlsZShmaWxlLCBoZWFkZXJTaXplLCBibG9ja1NpemUpIHtcbiAgdGhpcy5maWxlID0gZmlsZTtcbiAgdGhpcy5oZWFkZXJTaXplID0gaGVhZGVyU2l6ZTtcbiAgdGhpcy5ibG9ja1NpemUgPSBibG9ja1NpemU7XG5cbiAgLy8gVE9ETzogTWFrZSBzdXJlIHRvIHJlY2FsY3VsYXRlIHRoaXMgd2hlbiBuZWNlc3NhcnkuXG4gIHRoaXMuYmxvY2tDb3VudCA9IE1hdGguZmxvb3IoKGZpbGUuc2l6ZSAtIHRoaXMuaGVhZGVyU2l6ZSkgLyB0aGlzLmJsb2NrU2l6ZSk7XG5cbiAgdGhpcy5mcmVlQmxvY2tJc0RpcnR5ID0gZmFsc2U7XG4gIHRoaXMuZnJlZUJsb2NrID0gbnVsbDtcblxuICB0aGlzLl91c2VySGVhZGVyID0gbnVsbDtcbn1cblxuQmxvY2tGaWxlLm9wZW4gPSBmdW5jdGlvbiAoZmlsZSkge1xuICB2YXIgYnVmZmVyID0gZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlLnNsaWNlKDAsIE1FVEFEQVRBX1NJWkUpKTtcblxuICB2YXIgcmVhZGVyID0gbmV3IFNib25SZWFkZXIoYnVmZmVyKTtcblxuICBpZiAocmVhZGVyLnJlYWRCeXRlU3RyaW5nKDYpICE9ICdTQkJGMDInKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBibG9jayBmaWxlIGZvcm1hdCcpO1xuICB9XG5cbiAgdmFyIGhlYWRlclNpemUgPSByZWFkZXIucmVhZEludDMyKCksXG4gICAgICBibG9ja1NpemUgPSByZWFkZXIucmVhZEludDMyKCk7XG5cbiAgdmFyIGJsb2NrRmlsZSA9IG5ldyBCbG9ja0ZpbGUoZmlsZSwgaGVhZGVyU2l6ZSwgYmxvY2tTaXplKTtcblxuICBibG9ja0ZpbGUuZnJlZUJsb2NrSXNEaXJ0eSA9IHJlYWRlci5yZWFkQm9vbGVhbigpO1xuICBibG9ja0ZpbGUuZnJlZUJsb2NrID0gcmVhZGVyLnJlYWRJbnQzMigpO1xuXG4gIHJldHVybiBibG9ja0ZpbGU7XG59O1xuXG4vKipcbiAqIExvYWRzIHRoZSBkYXRhIGluIGEgYmxvY2sgYW5kIHJldHVybnMgYSB3cmFwcGVyIGZvciBhY2Nlc3NpbmcgaXQuXG4gKi9cbkJsb2NrRmlsZS5wcm90b3R5cGUuZ2V0QmxvY2sgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLmJsb2NrQ291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZGV4IG91dCBvZiBib3VuZHMnKTtcbiAgfVxuXG4gIHZhciBzdGFydCA9IHRoaXMuaGVhZGVyU2l6ZSArIHRoaXMuYmxvY2tTaXplICogaW5kZXgsXG4gICAgICBlbmQgPSBzdGFydCArIHRoaXMuYmxvY2tTaXplO1xuXG4gIHZhciBidWZmZXIgPSBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHRoaXMuZmlsZS5zbGljZShzdGFydCwgZW5kKSk7XG5cbiAgdmFyIHR5cGVEYXRhID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCAwLCAyKTtcbiAgdmFyIGJsb2NrID0ge1xuICAgIHR5cGU6IFN0cmluZy5mcm9tQ2hhckNvZGUodHlwZURhdGFbMF0sIHR5cGVEYXRhWzFdKSxcbiAgICBidWZmZXI6IGJ1ZmZlci5zbGljZSgyKVxuICB9O1xuXG4gIHJldHVybiBibG9jaztcbn07XG5cbkJsb2NrRmlsZS5wcm90b3R5cGUuZ2V0VXNlckhlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX3VzZXJIZWFkZXIpIHJldHVybiB0aGlzLl91c2VySGVhZGVyO1xuXG4gIHZhciBzdGFydCA9IE1FVEFEQVRBX1NJWkUsIGVuZCA9IHRoaXMuaGVhZGVyU2l6ZTtcbiAgdmFyIGJ1ZmZlciA9IGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodGhpcy5maWxlLnNsaWNlKHN0YXJ0LCBlbmQpKTtcbiAgdGhpcy5fdXNlckhlYWRlciA9IGJ1ZmZlcjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIEJsb2NrRmlsZSA9IHJlcXVpcmUoJy4vYmxvY2tmaWxlJyk7XG52YXIgU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vc2JvbnJlYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJUcmVlREI7XG5cbnZhciBCTE9DS19JTkRFWCA9ICdJSSc7XG52YXIgQkxPQ0tfTEVBRiA9ICdMTCc7XG5cbmZ1bmN0aW9uIEJUcmVlREIoYmxvY2tGaWxlLCBpZGVudGlmaWVyLCBrZXlTaXplKSB7XG4gIHRoaXMuYmxvY2tGaWxlID0gYmxvY2tGaWxlO1xuICB0aGlzLmlkZW50aWZpZXIgPSBpZGVudGlmaWVyO1xuICB0aGlzLmtleVNpemUgPSBrZXlTaXplO1xuXG4gIHRoaXMuYWx0ZXJuYXRlUm9vdE5vZGUgPSBmYWxzZTtcbiAgdGhpcy5yb290Tm9kZSA9IG51bGw7XG4gIHRoaXMucm9vdE5vZGVJc0xlYWYgPSBmYWxzZTtcbn1cblxuQlRyZWVEQi5vcGVuID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgdmFyIGJsb2NrRmlsZSA9IEJsb2NrRmlsZS5vcGVuKGZpbGUpO1xuXG4gIHZhciBidWZmZXIgPSBibG9ja0ZpbGUuZ2V0VXNlckhlYWRlcigpO1xuICB2YXIgcmVhZGVyID0gbmV3IFNib25SZWFkZXIoYnVmZmVyKTtcblxuICBpZiAocmVhZGVyLnJlYWRGaXhlZFN0cmluZygxMikgIT0gJ0JUcmVlREI0Jykge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgZGF0YWJhc2UgZm9ybWF0Jyk7XG4gIH1cblxuICB2YXIgaWRlbnRpZmllciA9IHJlYWRlci5yZWFkRml4ZWRTdHJpbmcoMTIpLFxuICAgICAga2V5U2l6ZSA9IHJlYWRlci5yZWFkSW50MzIoKTtcblxuICB2YXIgZGIgPSBuZXcgQlRyZWVEQihibG9ja0ZpbGUsIGlkZW50aWZpZXIsIGtleVNpemUpO1xuXG4gIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBhbHRlcm5hdGUgcm9vdCBub2RlIHJlZmVyZW5jZS5cbiAgZGIuYWx0ZXJuYXRlUm9vdE5vZGUgPSByZWFkZXIucmVhZEJvb2xlYW4oKTtcblxuICAvLyBTa2lwIGFoZWFkIGJhc2VkIG9uIHdoZXRoZXIgd2UncmUgYWx0ZXJuYXRpbmcgcmVmZXJlbmNlcy5cbiAgcmVhZGVyLnNlZWsoZGIuYWx0ZXJuYXRlUm9vdE5vZGUgPyA5IDogMSwgdHJ1ZSk7XG5cbiAgZGIucm9vdE5vZGUgPSByZWFkZXIucmVhZEludDMyKCk7XG4gIGRiLnJvb3ROb2RlSXNMZWFmID0gcmVhZGVyLnJlYWRCb29sZWFuKCk7XG5cbiAgcmV0dXJuIGRiO1xufTtcblxuQlRyZWVEQi5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5Lmxlbmd0aCAhPSB0aGlzLmtleVNpemUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVkIGtleSBtdXN0IGJlIG9mIHRoZSBjb3JyZWN0IGxlbmd0aCcpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuc2VhcmNoKHRoaXMucm9vdE5vZGUsIGtleSk7XG59O1xuXG5CVHJlZURCLnByb3RvdHlwZS5nZXRMZWFmVmFsdWUgPSBmdW5jdGlvbiAoYmxvY2ssIGtleSkge1xuICBpZiAoYmxvY2sudHlwZSAhPSBCTE9DS19MRUFGKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBhIGxlYWYgbm9kZScpO1xuICB9XG5cbiAgdmFyIHJlYWRlciA9IG5ldyBMZWFmUmVhZGVyKHRoaXMuYmxvY2tGaWxlLCBibG9jayk7XG4gIHZhciBrZXlDb3VudCA9IHJlYWRlci5yZWFkSW50MzIoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleUNvdW50OyBpKyspIHtcbiAgICAvLyBHZXQgdGhlIGtleSB0byBzZWUgaWYgaXQncyB0aGUgb25lIHdlJ3JlIHNlYXJjaGluZyBmb3IuXG4gICAgdmFyIGN1cktleSA9IHJlYWRlci5yZWFkQnl0ZVN0cmluZyh0aGlzLmtleVNpemUpO1xuXG4gICAgdmFyIHNpemUgPSByZWFkZXIucmVhZFVpbnRWYXIoKTtcbiAgICBpZiAoa2V5ID09IGN1cktleSkge1xuICAgICAgcmV0dXJuIHJlYWRlci5yZWFkQnl0ZXMoc2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gT25seSBzZWVrIGlmIHRoaXMgaXNuJ3QgdGhlIGxhc3QgYmxvY2suXG4gICAgaWYgKGkgPCBrZXlDb3VudCAtIDEpIHtcbiAgICAgIHJlYWRlci5zZWVrKHNpemUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignS2V5IG5vdCBmb3VuZCcpO1xufTtcblxuLyoqXG4gKiBCZWdpbiBzZWFyY2hpbmcgZm9yIGEga2V5IGF0IHRoZSBnaXZlbiBibG9jayBpZC4gS2VlcCBzZWFyY2hpbmcgZG93biB0aGVcbiAqIGluZGV4ZXMgdW50aWwgYSBsZWFmIGlzIGZvdW5kIGFuZCB0aGVuIHJldHVybiB0aGUgdmFsdWUgZm9yIHRoZSBwcm92aWRlZFxuICoga2V5LlxuICovXG5CVHJlZURCLnByb3RvdHlwZS5zZWFyY2ggPSBmdW5jdGlvbiAoYmxvY2tJZCwga2V5LCBjYWxsYmFjaykge1xuICB2YXIgYmxvY2sgPSB0aGlzLmJsb2NrRmlsZS5nZXRCbG9jayhibG9ja0lkKTtcblxuICAvLyBUT0RPOiBDYWNoZSBpbmRleCBibG9ja3MuXG4gIHdoaWxlIChibG9jay50eXBlID09IEJMT0NLX0lOREVYKSB7XG4gICAgdmFyIG5leHRCbG9ja0lkID0gbmV3IEluZGV4KHRoaXMua2V5U2l6ZSwgYmxvY2spLmZpbmQoa2V5KTtcbiAgICBibG9jayA9IHRoaXMuYmxvY2tGaWxlLmdldEJsb2NrKG5leHRCbG9ja0lkKTtcbiAgfVxuXG4gIGlmIChibG9jay50eXBlICE9IEJMT0NLX0xFQUYpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpZCBub3QgcmVhY2ggbGVhZicpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuZ2V0TGVhZlZhbHVlKGJsb2NrLCBrZXkpO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIGJsb2NrIG9iamVjdCB0byBwcm92aWRlIGZ1bmN0aW9uYWxpdHkgZm9yIHBhcnNpbmcgYW5kIHNjYW5uaW5nIGFuXG4gKiBpbmRleC5cbiAqL1xuZnVuY3Rpb24gSW5kZXgoa2V5U2l6ZSwgYmxvY2spIHtcbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKGJsb2NrLmJ1ZmZlcik7XG5cbiAgdGhpcy5sZXZlbCA9IHJlYWRlci5yZWFkVWludDgoKTtcblxuICAvLyBOdW1iZXIgb2Yga2V5cyBpbiB0aGlzIGluZGV4LlxuICB0aGlzLmtleUNvdW50ID0gcmVhZGVyLnJlYWRJbnQzMigpO1xuXG4gIC8vIFRoZSBibG9ja3MgdGhhdCB0aGUga2V5cyBwb2ludCB0by4gVGhlcmUgd2lsbCBiZSBvbmUgZXh0cmEgYmxvY2sgaW4gdGhlXG4gIC8vIGJlZ2lubmluZyBvZiB0aGlzIGxpc3QgdGhhdCBwb2ludHMgdG8gdGhlIGJsb2NrIHRvIGdvIHRvIGlmIHRoZSBrZXkgYmVpbmdcbiAgLy8gc2VhcmNoZWQgZm9yIGlzIGxlZnQgb2YgdGhlIGZpcnN0IGtleSBpbiB0aGlzIGluZGV4LlxuICB0aGlzLmJsb2NrSWRzID0gbmV3IEludDMyQXJyYXkodGhpcy5rZXlDb3VudCArIDEpO1xuICB0aGlzLmJsb2NrSWRzWzBdID0gcmVhZGVyLnJlYWRJbnQzMigpO1xuXG4gIHRoaXMua2V5cyA9IFtdO1xuXG4gIC8vIExvYWQgYWxsIGtleS9ibG9jayByZWZlcmVuY2UgcGFpcnMuXG4gIGZvciAodmFyIGkgPSAxOyBpIDw9IHRoaXMua2V5Q291bnQ7IGkrKykge1xuICAgIHRoaXMua2V5cy5wdXNoKHJlYWRlci5yZWFkQnl0ZVN0cmluZyhrZXlTaXplKSk7XG4gICAgdGhpcy5ibG9ja0lkc1tpXSA9IHJlYWRlci5yZWFkSW50MzIoKTtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaGVzIHRoaXMgaW5kZXggZm9yIHRoZSBzcGVjaWZpZWQga2V5IGFuZCByZXR1cm5zIHRoZSBuZXh0IGJsb2NrIGlkIHRvXG4gKiBzZWFyY2guXG4gKi9cbkluZGV4LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKGtleSkge1xuICAvLyBNYXliZSBvdmVya2lsbCBjb25zaWRlcmluZyB0aGF0IGFuIGluZGV4IGNhbid0IHJlYWxseSBjb250YWluIG1vcmUgdGhhblxuICAvLyBhcm91bmQgNjAga2V5cy5cbiAgdmFyIGxvID0gMCwgaGkgPSB0aGlzLmtleUNvdW50LCBtaWQ7XG4gIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgbWlkID0gKGxvICsgaGkpID4+IDE7XG4gICAgaWYgKGtleSA8IHRoaXMua2V5c1ttaWRdKSB7XG4gICAgICBoaSA9IG1pZDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzLmJsb2NrSWRzW2xvXTtcbn07XG5cbmZ1bmN0aW9uIExlYWZSZWFkZXIoYmxvY2tGaWxlLCBibG9jaykge1xuICBTYm9uUmVhZGVyLmNhbGwodGhpcywgYmxvY2suYnVmZmVyKTtcbiAgdGhpcy5ibG9ja0ZpbGUgPSBibG9ja0ZpbGU7XG59XG51dGlsLmluaGVyaXRzKExlYWZSZWFkZXIsIFNib25SZWFkZXIpO1xuXG5MZWFmUmVhZGVyLnByb3RvdHlwZS5yZWFkQnl0ZXMgPSBmdW5jdGlvbiAoY291bnQsIG9wdF9ub0NvcHkpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXMudmlldy5idWZmZXIsXG4gICAgICBzdGFydCA9IHRoaXMudmlldy5ieXRlT2Zmc2V0ICsgdGhpcy5vZmZzZXQsXG4gICAgICBjaHVua0xlbmd0aCA9IE1hdGgubWluKGNvdW50LCBidWZmZXIuYnl0ZUxlbmd0aCAtIDQgLSBzdGFydCk7XG5cbiAgdmFyIHJhbmdlID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBzdGFydCwgY2h1bmtMZW5ndGgpO1xuICBpZiAob3B0X25vQ29weSAmJiBjaHVua0xlbmd0aCA9PSBjb3VudCkge1xuICAgIHRoaXMub2Zmc2V0ICs9IGNodW5rTGVuZ3RoO1xuICAgIHJldHVybiByYW5nZTtcbiAgfVxuXG4gIHZhciBhcnJheSA9IG5ldyBVaW50OEFycmF5KGNvdW50KSwgd3JpdHRlbiA9IDA7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgYXJyYXkuc2V0KHJhbmdlLCB3cml0dGVuKTtcbiAgICB3cml0dGVuICs9IGNodW5rTGVuZ3RoO1xuXG4gICAgaWYgKHdyaXR0ZW4gPT0gY291bnQpIGJyZWFrO1xuXG4gICAgYnVmZmVyID0gdGhpcy5fZ2V0TmV4dEJsb2NrKCkuYnVmZmVyO1xuICAgIHRoaXMudmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuXG4gICAgY2h1bmtMZW5ndGggPSBNYXRoLm1pbihjb3VudCAtIHdyaXR0ZW4sIGJ1ZmZlci5ieXRlTGVuZ3RoIC0gNCk7XG4gICAgcmFuZ2UgPSBuZXcgVWludDhBcnJheShidWZmZXIsIDAsIGNodW5rTGVuZ3RoKTtcbiAgfVxuXG4gIHRoaXMub2Zmc2V0ID0gY2h1bmtMZW5ndGg7XG5cbiAgcmV0dXJuIGFycmF5O1xufTtcblxuTGVhZlJlYWRlci5wcm90b3R5cGUuc2VlayA9IGZ1bmN0aW9uIChvZmZzZXQsIG9wdF9yZWxhdGl2ZSkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy52aWV3LmJ5dGVMZW5ndGggLSA0O1xuICBpZiAob3B0X3JlbGF0aXZlKSB7XG4gICAgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgKyBvZmZzZXQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgIG9mZnNldCA9IGxlbmd0aCArIG9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgb2Zmc2V0ID0gb2Zmc2V0O1xuICAgIH1cbiAgfVxuXG4gIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICB3aGlsZSAob2Zmc2V0ID49IGxlbmd0aCkge1xuICAgIG9mZnNldCAtPSBsZW5ndGg7XG4gICAgdGhpcy52aWV3ID0gbmV3IERhdGFWaWV3KHRoaXMuX2dldE5leHRCbG9jaygpLmJ1ZmZlcik7XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmJ5dGVMZW5ndGggLSA0O1xuICB9XG5cbiAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxuTGVhZlJlYWRlci5wcm90b3R5cGUuX2dldE5leHRCbG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5leHRCbG9ja0lkID0gdGhpcy52aWV3LmdldEludDMyKHRoaXMudmlldy5ieXRlTGVuZ3RoIC0gNCk7XG4gIGlmIChuZXh0QmxvY2tJZCA9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdUcmllZCB0byB0cmF2ZXJzZSB0byBub24tZXhpc3RlbnQgYmxvY2snKTtcbiAgcmV0dXJuIHRoaXMuYmxvY2tGaWxlLmdldEJsb2NrKG5leHRCbG9ja0lkKTtcbn07XG4iLCJ2YXIgU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vc2JvbnJlYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERvY3VtZW50O1xuXG52YXIgU0lHTkFUVVJFID0gJ1NCVkowMSc7XG5cbnZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKCk7XG5cbi8vIFRPRE86IFN0YXJib3VuZCBjYWxscyB0aGlzIFwidmVyc2lvbmVkIEpTT05cIiwgc28gbWlnaHQgcmVmYWN0b3IgbmFtaW5nIGxhdGVyLlxuZnVuY3Rpb24gRG9jdW1lbnQoZGF0YSkge1xuICB0aGlzLmRhdGEgPSBkYXRhO1xufVxuXG5Eb2N1bWVudC5vcGVuID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgdmFyIGJ1ZmZlciA9IGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG5cbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKGJ1ZmZlcik7XG4gIGlmIChyZWFkZXIucmVhZEJ5dGVTdHJpbmcoU0lHTkFUVVJFLmxlbmd0aCkgIT0gU0lHTkFUVVJFKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNCVkowMSBmaWxlJyk7XG4gIH1cblxuICB2YXIgZGF0YSA9IHJlYWRlci5yZWFkRG9jdW1lbnQoKTtcbiAgcmV0dXJuIG5ldyBEb2N1bWVudChkYXRhKTtcbn07XG4iLCJ2YXIgc2hhMjU2ID0gcmVxdWlyZSgnc2hhMjU2Jyk7XG52YXIgc2hhMjU2c3RhcmJvdW5kID0gcmVxdWlyZSgnc3RhcmJvdW5kLXNoYTI1NicpO1xuXG52YXIgQmxvY2tGaWxlID0gcmVxdWlyZSgnLi9ibG9ja2ZpbGUnKTtcbnZhciBCVHJlZURCID0gcmVxdWlyZSgnLi9idHJlZWRiJyk7XG52YXIgU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vc2JvbnJlYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhY2thZ2U7XG5cbnZhciBESUdFU1RfS0VZID0gJ19kaWdlc3QnO1xudmFyIElOREVYX0tFWSA9ICdfaW5kZXgnO1xuXG5mdW5jdGlvbiBQYWNrYWdlKGRhdGFiYXNlKSB7XG4gIHRoaXMuZGIgPSBkYXRhYmFzZTtcbn1cblxuUGFja2FnZS5vcGVuID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgcmV0dXJuIG5ldyBQYWNrYWdlKEJUcmVlREIub3BlbihmaWxlKSk7XG59O1xuXG5QYWNrYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBrZXlIYXNoID0gc2hhMjU2KGtleSwge2FzU3RyaW5nOiB0cnVlfSk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGtleUhhc2gpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gT2xkZXIgdmVyc2lvbnMgb2YgU3RhcmJvdW5kIGhhZCBhIGJ1Z2d5IGhhc2ggaW1wbGVtZW50YXRpb24uIFRyeSB0byB1c2VcbiAgICAvLyBpdCwgc2luY2Ugd2UgY291bGQgYmUgcmVhZGluZyBhbiBvbGQgcGFja2FnZSBmaWxlLlxuICAgIGlmIChrZXkubGVuZ3RoID09IDU1KSB7XG4gICAgICBrZXlIYXNoID0gc2hhMjU2c3RhcmJvdW5kKGtleSwge2FzU3RyaW5nOiB0cnVlfSk7XG4gICAgICByZXR1cm4gdGhpcy5kYi5nZXQoa2V5SGFzaCk7XG4gICAgfVxuXG4gICAgdGhyb3cgZTtcbiAgfVxufTtcblxuUGFja2FnZS5wcm90b3R5cGUuZ2V0RGlnZXN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5nZXQoRElHRVNUX0tFWSk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHBhdGhzIGFuZCBrZXlzIG9mIHRoZSBmaWxlcyBpbiB0aGlzIHBhY2thZ2UuXG4gKi9cblBhY2thZ2UucHJvdG90eXBlLmdldEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmVhZGVyID0gbmV3IFNib25SZWFkZXIodGhpcy5nZXQoSU5ERVhfS0VZKSk7XG4gIHN3aXRjaCAodGhpcy5kYi5pZGVudGlmaWVyKSB7XG4gICAgY2FzZSAnQXNzZXRzMSc6XG4gICAgICB2YXIgcGF0aHMgPSByZWFkZXIucmVhZFN0cmluZ0xpc3QoKSwgbWFwID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1hcFtwYXRoc1tpXV0gPSBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hcDtcbiAgICBjYXNlICdBc3NldHMyJzpcbiAgICAgIHJldHVybiByZWFkZXIucmVhZFN0cmluZ0RpZ2VzdE1hcCgpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIHBhY2thZ2UgdHlwZSAnICsgdGhpcy5pZGVudGlmaWVyKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gU2JvblJlYWRlcjtcblxuZnVuY3Rpb24gU2JvblJlYWRlcih2aWV3T3JCdWZmZXIpIHtcbiAgaWYgKHZpZXdPckJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgdmlld09yQnVmZmVyID0gbmV3IERhdGFWaWV3KHZpZXdPckJ1ZmZlcik7XG4gIH0gZWxzZSBpZiAoISh2aWV3T3JCdWZmZXIgaW5zdGFuY2VvZiBEYXRhVmlldykpIHtcbiAgICB2aWV3T3JCdWZmZXIgPSBuZXcgRGF0YVZpZXcodmlld09yQnVmZmVyLmJ1ZmZlcik7XG4gIH1cblxuICB0aGlzLm9mZnNldCA9IDA7XG4gIHRoaXMudmlldyA9IHZpZXdPckJ1ZmZlcjtcbn1cblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEJvb2xlYW4gPSBmdW5jdGlvbiAoKSB7XG4gIC8vIFhYWDogTWlnaHQgd2FudCB0byBhc3NlcnQgdGhhdCB0aGlzIGlzIG9ubHkgZXZlciAweDAwIG9yIDB4MDEuXG4gIHJldHVybiAhIXRoaXMucmVhZFVpbnQ4KCk7XG59O1xuXG4vKipcbiAqIFJlYWRzIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGJ5dGVzLiBJZiB0aGUgb3B0aW9uYWwgbm9Db3B5IGZsYWcgaXMgcGFzc2VkXG4gKiBpbiwgdGhlIHJldHVybmVkIGJ5dGUgYXJyYXkgd2lsbCByZWZlcmVuY2UgdGhlIG9yaWdpbmFsIGJ1ZmZlciBpbnN0ZWFkIG9mXG4gKiBtYWtpbmcgYSBjb3B5IChmYXN0ZXIgd2hlbiB5b3Ugb25seSB3YW50IHRvIHJlYWQgZnJvbSB0aGUgYXJyYXkpLlxuICovXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkQnl0ZXMgPSBmdW5jdGlvbiAoY291bnQsIG9wdF9ub0NvcHkpIHtcbiAgdmFyIHN0YXJ0ID0gdGhpcy52aWV3LmJ5dGVPZmZzZXQgKyB0aGlzLm9mZnNldDtcbiAgdGhpcy5zZWVrKGNvdW50LCB0cnVlKTtcblxuICB2YXIgcmFuZ2UgPSBuZXcgVWludDhBcnJheSh0aGlzLnZpZXcuYnVmZmVyLCBzdGFydCwgY291bnQpO1xuICBpZiAob3B0X25vQ29weSkgcmV0dXJuIHJhbmdlO1xuXG4gIHZhciBhcnJheSA9IG5ldyBVaW50OEFycmF5KGNvdW50KTtcbiAgYXJyYXkuc2V0KHJhbmdlKTtcbiAgcmV0dXJuIGFycmF5O1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEJ5dGVTdHJpbmcgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIHRoaXMucmVhZEJ5dGVzKGxlbmd0aCwgdHJ1ZSkpO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZERvY3VtZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbmFtZSA9IHRoaXMucmVhZFN0cmluZygpO1xuXG4gIC8vIFRoaXMgc2VlbXMgdG8gYWx3YXlzIGJlIDB4MDEuXG4gIHZhciB1bmtub3duID0gdGhpcy5yZWFkVWludDgoKTtcblxuICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB0aGlzIGlzIHNpZ25lZCBvciBub3QuXG4gIHZhciB2ZXJzaW9uID0gdGhpcy5yZWFkSW50MzIoKTtcblxuICB2YXIgZG9jID0gdGhpcy5yZWFkRHluYW1pYygpO1xuICBkb2MuX19uYW1lX18gPSBuYW1lO1xuICBkb2MuX192ZXJzaW9uX18gPSB2ZXJzaW9uO1xuXG4gIHJldHVybiBkb2M7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkRG9jdW1lbnRMaXN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIHZhciBsaXN0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBsaXN0LnB1c2godGhpcy5yZWFkRG9jdW1lbnQoKSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkRHluYW1pYyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLnJlYWRVaW50OCgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gdGhpcy5yZWFkRmxvYXQ2NCgpO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiB0aGlzLnJlYWRCb29sZWFuKCk7XG4gICAgY2FzZSA0OlxuICAgICAgcmV0dXJuIHRoaXMucmVhZEludFZhcigpO1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiB0aGlzLnJlYWRTdHJpbmcoKTtcbiAgICBjYXNlIDY6XG4gICAgICByZXR1cm4gdGhpcy5yZWFkTGlzdCgpO1xuICAgIGNhc2UgNzpcbiAgICAgIHJldHVybiB0aGlzLnJlYWRNYXAoKTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignVW5rbm93biBkeW5hbWljIHR5cGUnKTtcbn07XG5cbi8qKlxuICogUmVhZHMgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgYnl0ZXMgYW5kIHJldHVybnMgdGhlbSBhcyBhIHN0cmluZyB0aGF0IGVuZHNcbiAqIGF0IHRoZSBmaXJzdCBudWxsLlxuICovXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkRml4ZWRTdHJpbmcgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciBzdHJpbmcgPSB0aGlzLnJlYWRCeXRlU3RyaW5nKGxlbmd0aCk7XG4gIHZhciBudWxsSW5kZXggPSBzdHJpbmcuaW5kZXhPZignXFx4MDAnKTtcbiAgaWYgKG51bGxJbmRleCAhPSAtMSkge1xuICAgIHJldHVybiBzdHJpbmcuc3Vic3RyKDAsIG51bGxJbmRleCk7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRGbG9hdDMyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zZWVrKDQsIHRydWUpLnZpZXcuZ2V0RmxvYXQzMih0aGlzLm9mZnNldCAtIDQpO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEZsb2F0NjQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoOCwgdHJ1ZSkudmlldy5nZXRGbG9hdDY0KHRoaXMub2Zmc2V0IC0gOCk7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2VlaygxLCB0cnVlKS52aWV3LmdldEludDgodGhpcy5vZmZzZXQgLSAxKTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRJbnQxNiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2VlaygyLCB0cnVlKS52aWV3LmdldEludDE2KHRoaXMub2Zmc2V0IC0gMik7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkSW50MzIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoNCwgdHJ1ZSkudmlldy5nZXRJbnQzMih0aGlzLm9mZnNldCAtIDQpO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEludFZhciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHZhbHVlID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIC8vIExlYXN0IHNpZ25pZmljYW50IGJpdCByZXByZXNlbnRzIHRoZSBzaWduLlxuICBpZiAodmFsdWUgJiAxKSB7XG4gICAgcmV0dXJuIC0odmFsdWUgPj4gMSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlID4+IDE7XG4gIH1cbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRMaXN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIHZhciBsaXN0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBsaXN0LnB1c2godGhpcy5yZWFkRHluYW1pYygpKTtcbiAgfVxuICByZXR1cm4gbGlzdDtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLnJlYWRVaW50VmFyKCk7XG5cbiAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0gdGhpcy5yZWFkU3RyaW5nKCk7XG4gICAgbWFwW2tleV0gPSB0aGlzLnJlYWREeW5hbWljKCk7XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLnJlYWRVaW50VmFyKCk7XG5cbiAgLy8gVGhpcyBpcyBmdWNraW5nIGJ1bGxzaGl0LlxuICB2YXIgcmF3ID0gdGhpcy5yZWFkQnl0ZVN0cmluZyhsZW5ndGgpO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZShyYXcpKTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRTdHJpbmdEaWdlc3RNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIFNwZWNpYWwgc3RydWN0dXJlIG9mIHN0cmluZy9kaWdlc3QgcGFpcnMsIHVzZWQgYnkgdGhlIGFzc2V0cyBkYXRhYmFzZS5cbiAgdmFyIGxlbmd0aCA9IHRoaXMucmVhZFVpbnRWYXIoKTtcblxuICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKSwgZGlnZXN0LCBwYXRoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgcGF0aCA9IHRoaXMucmVhZFN0cmluZygpO1xuICAgIC8vIFNpbmdsZSBzcGFjZSBjaGFyYWN0ZXIuXG4gICAgdGhpcy5zZWVrKDEsIHRydWUpO1xuICAgIGRpZ2VzdCA9IHRoaXMucmVhZEJ5dGVzKDMyKTtcbiAgICBtYXBbcGF0aF0gPSBkaWdlc3Q7XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRTdHJpbmdMaXN0ID0gZnVuY3Rpb24gKCkge1xuICAvLyBPcHRpbWl6ZWQgc3RydWN0dXJlIHRoYXQgZG9lc24ndCBoYXZlIGEgdHlwZSBieXRlIGZvciBldmVyeSBpdGVtLlxuICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIHZhciBsaXN0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBsaXN0LnB1c2godGhpcy5yZWFkU3RyaW5nKCkpO1xuICB9XG4gIHJldHVybiBsaXN0O1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZFVpbnQ4ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0VWludDgodGhpcy5vZmZzZXQpO1xuICB0aGlzLnNlZWsoMSwgdHJ1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRVaW50MTYgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoMiwgdHJ1ZSkudmlldy5nZXRVaW50MTYodGhpcy5vZmZzZXQgLSAyKTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRVaW50MzIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoNCwgdHJ1ZSkudmlldy5nZXRVaW50MzIodGhpcy5vZmZzZXQgLSA0KTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRVaW50VmFyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdmFsdWUgPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIHZhciBieXRlID0gdGhpcy5yZWFkVWludDgoKTtcbiAgICBpZiAoKGJ5dGUgJiAxMjgpID09IDApIHtcbiAgICAgIHJldHVybiB2YWx1ZSA8PCA3IHwgYnl0ZTtcbiAgICB9XG4gICAgdmFsdWUgPSB2YWx1ZSA8PCA3IHwgKGJ5dGUgJiAxMjcpO1xuICB9XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5zZWVrID0gZnVuY3Rpb24gKG9mZnNldCwgb3B0X3JlbGF0aXZlKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLnZpZXcuYnl0ZUNvdW50O1xuICBpZiAob3B0X3JlbGF0aXZlKSB7XG4gICAgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgKyBvZmZzZXQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgIG9mZnNldCA9IGxlbmd0aCArIG9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgb2Zmc2V0ID0gb2Zmc2V0O1xuICAgIH1cbiAgfVxuXG4gIGlmIChvZmZzZXQgPCAwIHx8IG9mZnNldCA+PSBsZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ091dCBvZiBib3VuZHMnKTtcbiAgfVxuXG4gIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICByZXR1cm4gdGhpcztcbn07XG4iLCJ2YXIgemxpYiA9IHJlcXVpcmUoJ3psaWInKTtcblxudmFyIEJUcmVlREIgPSByZXF1aXJlKCcuL2J0cmVlZGInKTtcbnZhciBTYm9uUmVhZGVyID0gcmVxdWlyZSgnLi9zYm9ucmVhZGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gV29ybGQ7XG5cbnZhciBNRVRBREFUQV9LRVkgPSAnXFx4MDBcXHgwMFxceDAwXFx4MDBcXHgwMCc7XG5cbmZ1bmN0aW9uIFdvcmxkKGRhdGFiYXNlKSB7XG4gIHRoaXMuZGIgPSBkYXRhYmFzZTtcbn1cblxuV29ybGQub3BlbiA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHJldHVybiBuZXcgV29ybGQoQlRyZWVEQi5vcGVuKGZpbGUpKTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5nZXRNZXRhZGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKHRoaXMuZGIuZ2V0KE1FVEFEQVRBX0tFWSkpO1xuXG4gIC8vIFNraXAgc29tZSB1bmtub3duIGJ5dGVzLlxuICByZWFkZXIuc2Vlayg4KTtcblxuICB2YXIgbWV0YWRhdGEgPSByZWFkZXIucmVhZERvY3VtZW50KCk7XG4gIGlmIChtZXRhZGF0YS5fX25hbWVfXyAhPSAnV29ybGRNZXRhZGF0YScpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgd29ybGQgZmlsZScpO1xuICB9XG5cbiAgcmV0dXJuIG1ldGFkYXRhO1xufTtcblxuV29ybGQucHJvdG90eXBlLmdldFJlZ2lvbkRhdGEgPSBmdW5jdGlvbiAobGF5ZXIsIHgsIHksIGNhbGxiYWNrKSB7XG4gIHZhciBrZXkgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxheWVyLCB4ID4+IDgsIHggJiAyNTUsIHkgPj4gOCwgeSAmIDI1NSk7XG4gIHZhciBidWZmZXIgPSB0aGlzLmRiLmdldChrZXkpO1xuICB2YXIgaW5mbGF0ZWQgPSB6bGliLmluZmxhdGVTeW5jKG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpO1xuICB2YXIgYXJyYXkgPSBuZXcgVWludDhBcnJheShpbmZsYXRlZCk7XG4gIHJldHVybiBhcnJheS5idWZmZXI7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuZ2V0RW50aXRpZXMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICB2YXIgYnVmZmVyID0gdGhpcy5nZXRSZWdpb25EYXRhKDIsIHgsIHkpO1xuICByZXR1cm4gbmV3IFNib25SZWFkZXIoYnVmZmVyKS5yZWFkRG9jdW1lbnRMaXN0KCk7XG59O1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLEJ1ZmZlcil7XG4hZnVuY3Rpb24oZ2xvYmFscykge1xuJ3VzZSBzdHJpY3QnXG5cbnZhciBfaW1wb3J0cyA9IHt9XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvL0NvbW1vbkpTXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5waWQpIHtcbiAgICAvLyBOb2RlLmpzXG5cdG1vZHVsZS5leHBvcnRzID0gc2hhMjU2X25vZGU7XG4gIH0gZWxzZSB7XG4gICAgX2ltcG9ydHMuYnl0ZXNUb0hleCA9IHJlcXVpcmUoJ2NvbnZlcnQtaGV4JykuYnl0ZXNUb0hleFxuICAgIF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcgPSByZXF1aXJlKCdjb252ZXJ0LXN0cmluZycpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzaGEyNTZcbiAgfVxufSBlbHNlIHtcbiAgX2ltcG9ydHMuYnl0ZXNUb0hleCA9IGdsb2JhbHMuY29udmVydEhleC5ieXRlc1RvSGV4XG4gIF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcgPSBnbG9iYWxzLmNvbnZlcnRTdHJpbmdcbiAgZ2xvYmFscy5zaGEyNTYgPSBzaGEyNTZcbn1cblxuXG4vLyBOb2RlLmpzIGhhcyBpdHMgb3duIENyeXB0byBmdW5jdGlvbiB0aGF0IGNhbiBoYW5kbGUgdGhpcyBuYXRpdmVseVxuZnVuY3Rpb24gc2hhMjU2X25vZGUobWVzc2FnZSwgb3B0aW9ucykge1xuXHR2YXIgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG5cdHZhciBjID0gY3J5cHRvLmNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuXHRcblx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihtZXNzYWdlKSkge1xuXHRcdGMudXBkYXRlKG1lc3NhZ2UpO1xuXHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobWVzc2FnZSkpIHtcblx0XHQvLyBBcnJheSBvZiBieXRlIHZhbHVlc1xuXHRcdGMudXBkYXRlKG5ldyBCdWZmZXIobWVzc2FnZSkpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIE90aGVyd2lzZSwgdHJlYXQgYXMgYSBiaW5hcnkgc3RyaW5nXG5cdFx0Yy51cGRhdGUobmV3IEJ1ZmZlcihtZXNzYWdlLCAnYmluYXJ5JykpO1xuXHR9XG5cdHZhciBidWYgPSBjLmRpZ2VzdCgpO1xuXHRcblx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hc0J5dGVzKSB7XG5cdFx0Ly8gQXJyYXkgb2YgYnl0ZXMgYXMgZGVjaW1hbCBpbnRlZ2Vyc1xuXHRcdHZhciBhID0gW107XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkrKykge1xuXHRcdFx0YS5wdXNoKGJ1ZltpXSk7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9IGVsc2UgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hc1N0cmluZykge1xuXHRcdC8vIEJpbmFyeSBzdHJpbmdcblx0XHRyZXR1cm4gYnVmLnRvU3RyaW5nKCdiaW5hcnknKTtcblx0fSBlbHNlIHtcblx0XHQvLyBTdHJpbmcgb2YgaGV4IGNoYXJhY3RlcnNcblx0XHRyZXR1cm4gYnVmLnRvU3RyaW5nKCdoZXgnKTtcblx0fVxufVxuc2hhMjU2X25vZGUueDIgPSBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG5cdHJldHVybiBzaGEyNTZfbm9kZShzaGEyNTZfbm9kZShtZXNzYWdlLCB7IGFzQnl0ZXM6dHJ1ZSB9KSwgb3B0aW9ucylcbn1cblxuLypcbkNyeXB0b0pTIHYzLjEuMlxuY29kZS5nb29nbGUuY29tL3AvY3J5cHRvLWpzXG4oYykgMjAwOS0yMDEzIGJ5IEplZmYgTW90dC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbmNvZGUuZ29vZ2xlLmNvbS9wL2NyeXB0by1qcy93aWtpL0xpY2Vuc2VcbiovXG5cbi8vIEluaXRpYWxpemF0aW9uIHJvdW5kIGNvbnN0YW50cyB0YWJsZXNcbnZhciBLID0gW11cblxuLy8gQ29tcHV0ZSBjb25zdGFudHNcbiFmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIGlzUHJpbWUobikge1xuICAgIHZhciBzcXJ0TiA9IE1hdGguc3FydChuKTtcbiAgICBmb3IgKHZhciBmYWN0b3IgPSAyOyBmYWN0b3IgPD0gc3FydE47IGZhY3RvcisrKSB7XG4gICAgICBpZiAoIShuICUgZmFjdG9yKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEZyYWN0aW9uYWxCaXRzKG4pIHtcbiAgICByZXR1cm4gKChuIC0gKG4gfCAwKSkgKiAweDEwMDAwMDAwMCkgfCAwXG4gIH1cblxuICB2YXIgbiA9IDJcbiAgdmFyIG5QcmltZSA9IDBcbiAgd2hpbGUgKG5QcmltZSA8IDY0KSB7XG4gICAgaWYgKGlzUHJpbWUobikpIHtcbiAgICAgIEtbblByaW1lXSA9IGdldEZyYWN0aW9uYWxCaXRzKE1hdGgucG93KG4sIDEgLyAzKSlcbiAgICAgIG5QcmltZSsrXG4gICAgfVxuXG4gICAgbisrXG4gIH1cbn0oKVxuXG52YXIgYnl0ZXNUb1dvcmRzID0gZnVuY3Rpb24gKGJ5dGVzKSB7XG4gIHZhciB3b3JkcyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBiID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSsrLCBiICs9IDgpIHtcbiAgICB3b3Jkc1tiID4+PiA1XSB8PSBieXRlc1tpXSA8PCAoMjQgLSBiICUgMzIpXG4gIH1cbiAgcmV0dXJuIHdvcmRzXG59XG5cbnZhciB3b3Jkc1RvQnl0ZXMgPSBmdW5jdGlvbiAod29yZHMpIHtcbiAgdmFyIGJ5dGVzID0gW11cbiAgZm9yICh2YXIgYiA9IDA7IGIgPCB3b3Jkcy5sZW5ndGggKiAzMjsgYiArPSA4KSB7XG4gICAgYnl0ZXMucHVzaCgod29yZHNbYiA+Pj4gNV0gPj4+ICgyNCAtIGIgJSAzMikpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZXNcbn1cblxuLy8gUmV1c2FibGUgb2JqZWN0XG52YXIgVyA9IFtdXG5cbnZhciBwcm9jZXNzQmxvY2sgPSBmdW5jdGlvbiAoSCwgTSwgb2Zmc2V0KSB7XG4gIC8vIFdvcmtpbmcgdmFyaWFibGVzXG4gIHZhciBhID0gSFswXSwgYiA9IEhbMV0sIGMgPSBIWzJdLCBkID0gSFszXVxuICB2YXIgZSA9IEhbNF0sIGYgPSBIWzVdLCBnID0gSFs2XSwgaCA9IEhbN11cblxuICAgIC8vIENvbXB1dGF0aW9uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgNjQ7IGkrKykge1xuICAgIGlmIChpIDwgMTYpIHtcbiAgICAgIFdbaV0gPSBNW29mZnNldCArIGldIHwgMFxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ2FtbWEweCA9IFdbaSAtIDE1XVxuICAgICAgdmFyIGdhbW1hMCAgPSAoKGdhbW1hMHggPDwgMjUpIHwgKGdhbW1hMHggPj4+IDcpKSAgXlxuICAgICAgICAgICAgICAgICAgICAoKGdhbW1hMHggPDwgMTQpIHwgKGdhbW1hMHggPj4+IDE4KSkgXlxuICAgICAgICAgICAgICAgICAgICAoZ2FtbWEweCA+Pj4gMylcblxuICAgICAgdmFyIGdhbW1hMXggPSBXW2kgLSAyXTtcbiAgICAgIHZhciBnYW1tYTEgID0gKChnYW1tYTF4IDw8IDE1KSB8IChnYW1tYTF4ID4+PiAxNykpIF5cbiAgICAgICAgICAgICAgICAgICAgKChnYW1tYTF4IDw8IDEzKSB8IChnYW1tYTF4ID4+PiAxOSkpIF5cbiAgICAgICAgICAgICAgICAgICAgKGdhbW1hMXggPj4+IDEwKVxuXG4gICAgICBXW2ldID0gZ2FtbWEwICsgV1tpIC0gN10gKyBnYW1tYTEgKyBXW2kgLSAxNl07XG4gICAgfVxuXG4gICAgdmFyIGNoICA9IChlICYgZikgXiAofmUgJiBnKTtcbiAgICB2YXIgbWFqID0gKGEgJiBiKSBeIChhICYgYykgXiAoYiAmIGMpO1xuXG4gICAgdmFyIHNpZ21hMCA9ICgoYSA8PCAzMCkgfCAoYSA+Pj4gMikpIF4gKChhIDw8IDE5KSB8IChhID4+PiAxMykpIF4gKChhIDw8IDEwKSB8IChhID4+PiAyMikpO1xuICAgIHZhciBzaWdtYTEgPSAoKGUgPDwgMjYpIHwgKGUgPj4+IDYpKSBeICgoZSA8PCAyMSkgfCAoZSA+Pj4gMTEpKSBeICgoZSA8PCA3KSAgfCAoZSA+Pj4gMjUpKTtcblxuICAgIHZhciB0MSA9IGggKyBzaWdtYTEgKyBjaCArIEtbaV0gKyBXW2ldO1xuICAgIHZhciB0MiA9IHNpZ21hMCArIG1hajtcblxuICAgIGggPSBnO1xuICAgIGcgPSBmO1xuICAgIGYgPSBlO1xuICAgIGUgPSAoZCArIHQxKSB8IDA7XG4gICAgZCA9IGM7XG4gICAgYyA9IGI7XG4gICAgYiA9IGE7XG4gICAgYSA9ICh0MSArIHQyKSB8IDA7XG4gIH1cblxuICAvLyBJbnRlcm1lZGlhdGUgaGFzaCB2YWx1ZVxuICBIWzBdID0gKEhbMF0gKyBhKSB8IDA7XG4gIEhbMV0gPSAoSFsxXSArIGIpIHwgMDtcbiAgSFsyXSA9IChIWzJdICsgYykgfCAwO1xuICBIWzNdID0gKEhbM10gKyBkKSB8IDA7XG4gIEhbNF0gPSAoSFs0XSArIGUpIHwgMDtcbiAgSFs1XSA9IChIWzVdICsgZikgfCAwO1xuICBIWzZdID0gKEhbNl0gKyBnKSB8IDA7XG4gIEhbN10gPSAoSFs3XSArIGgpIHwgMDtcbn1cblxuZnVuY3Rpb24gc2hhMjU2KG1lc3NhZ2UsIG9wdGlvbnMpIHs7XG4gIGlmIChtZXNzYWdlLmNvbnN0cnVjdG9yID09PSBTdHJpbmcpIHtcbiAgICBtZXNzYWdlID0gX2ltcG9ydHMuY29udmVydFN0cmluZy5VVEY4LnN0cmluZ1RvQnl0ZXMobWVzc2FnZSk7XG4gIH1cblxuICB2YXIgSCA9WyAweDZBMDlFNjY3LCAweEJCNjdBRTg1LCAweDNDNkVGMzcyLCAweEE1NEZGNTNBLFxuICAgICAgICAgICAweDUxMEU1MjdGLCAweDlCMDU2ODhDLCAweDFGODNEOUFCLCAweDVCRTBDRDE5IF07XG5cbiAgdmFyIG0gPSBieXRlc1RvV29yZHMobWVzc2FnZSk7XG4gIHZhciBsID0gbWVzc2FnZS5sZW5ndGggKiA4O1xuXG4gIG1bbCA+PiA1XSB8PSAweDgwIDw8ICgyNCAtIGwgJSAzMik7XG4gIG1bKChsICsgNjQgPj4gOSkgPDwgNCkgKyAxNV0gPSBsO1xuXG4gIGZvciAodmFyIGk9MCA7IGk8bS5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICBwcm9jZXNzQmxvY2soSCwgbSwgaSk7XG4gIH1cblxuICB2YXIgZGlnZXN0Ynl0ZXMgPSB3b3Jkc1RvQnl0ZXMoSCk7XG4gIHJldHVybiBvcHRpb25zICYmIG9wdGlvbnMuYXNCeXRlcyA/IGRpZ2VzdGJ5dGVzIDpcbiAgICAgICAgIG9wdGlvbnMgJiYgb3B0aW9ucy5hc1N0cmluZyA/IF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcuYnl0ZXNUb1N0cmluZyhkaWdlc3RieXRlcykgOlxuICAgICAgICAgX2ltcG9ydHMuYnl0ZXNUb0hleChkaWdlc3RieXRlcylcbn1cblxuc2hhMjU2LngyID0gZnVuY3Rpb24obWVzc2FnZSwgb3B0aW9ucykge1xuICByZXR1cm4gc2hhMjU2KHNoYTI1NihtZXNzYWdlLCB7IGFzQnl0ZXM6dHJ1ZSB9KSwgb3B0aW9ucylcbn1cblxufSh0aGlzKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcikiLCIhZnVuY3Rpb24oZ2xvYmFscykge1xuJ3VzZSBzdHJpY3QnXG5cbnZhciBjb252ZXJ0SGV4ID0ge1xuICBieXRlc1RvSGV4OiBmdW5jdGlvbihieXRlcykge1xuICAgIC8qaWYgKHR5cGVvZiBieXRlcy5ieXRlTGVuZ3RoICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgbmV3Qnl0ZXMgPSBbXVxuXG4gICAgICBpZiAodHlwZW9mIGJ5dGVzLmJ1ZmZlciAhPSAndW5kZWZpbmVkJylcbiAgICAgICAgYnl0ZXMgPSBuZXcgRGF0YVZpZXcoYnl0ZXMuYnVmZmVyKVxuICAgICAgZWxzZVxuICAgICAgICBieXRlcyA9IG5ldyBEYXRhVmlldyhieXRlcylcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5ieXRlTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbmV3Qnl0ZXMucHVzaChieXRlcy5nZXRVaW50OChpKSlcbiAgICAgIH1cbiAgICAgIGJ5dGVzID0gbmV3Qnl0ZXNcbiAgICB9Ki9cbiAgICByZXR1cm4gYXJyQnl0ZXNUb0hleChieXRlcylcbiAgfSxcbiAgaGV4VG9CeXRlczogZnVuY3Rpb24oaGV4KSB7XG4gICAgaWYgKGhleC5sZW5ndGggJSAyID09PSAxKSB0aHJvdyBuZXcgRXJyb3IoXCJoZXhUb0J5dGVzIGNhbid0IGhhdmUgYSBzdHJpbmcgd2l0aCBhbiBvZGQgbnVtYmVyIG9mIGNoYXJhY3RlcnMuXCIpXG4gICAgaWYgKGhleC5pbmRleE9mKCcweCcpID09PSAwKSBoZXggPSBoZXguc2xpY2UoMilcbiAgICByZXR1cm4gaGV4Lm1hdGNoKC8uLi9nKS5tYXAoZnVuY3Rpb24oeCkgeyByZXR1cm4gcGFyc2VJbnQoeCwxNikgfSlcbiAgfVxufVxuXG5cbi8vIFBSSVZBVEVcblxuZnVuY3Rpb24gYXJyQnl0ZXNUb0hleChieXRlcykge1xuICByZXR1cm4gYnl0ZXMubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHBhZExlZnQoeC50b1N0cmluZygxNiksMikgfSkuam9pbignJylcbn1cblxuZnVuY3Rpb24gcGFkTGVmdChvcmlnLCBsZW4pIHtcbiAgaWYgKG9yaWcubGVuZ3RoID4gbGVuKSByZXR1cm4gb3JpZ1xuICByZXR1cm4gQXJyYXkobGVuIC0gb3JpZy5sZW5ndGggKyAxKS5qb2luKCcwJykgKyBvcmlnXG59XG5cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vQ29tbW9uSlNcbiAgbW9kdWxlLmV4cG9ydHMgPSBjb252ZXJ0SGV4XG59IGVsc2Uge1xuICBnbG9iYWxzLmNvbnZlcnRIZXggPSBjb252ZXJ0SGV4XG59XG5cbn0odGhpcyk7IiwiIWZ1bmN0aW9uKGdsb2JhbHMpIHtcbid1c2Ugc3RyaWN0J1xuXG52YXIgY29udmVydFN0cmluZyA9IHtcbiAgYnl0ZXNUb1N0cmluZzogZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICByZXR1cm4gYnl0ZXMubWFwKGZ1bmN0aW9uKHgpeyByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSh4KSB9KS5qb2luKCcnKVxuICB9LFxuICBzdHJpbmdUb0J5dGVzOiBmdW5jdGlvbihzdHIpIHtcbiAgICByZXR1cm4gc3RyLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oeCkgeyByZXR1cm4geC5jaGFyQ29kZUF0KDApIH0pXG4gIH1cbn1cblxuLy9odHRwOi8vaG9zc2EuaW4vMjAxMi8wNy8yMC91dGYtOC1pbi1qYXZhc2NyaXB0Lmh0bWxcbmNvbnZlcnRTdHJpbmcuVVRGOCA9IHtcbiAgIGJ5dGVzVG9TdHJpbmc6IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUoY29udmVydFN0cmluZy5ieXRlc1RvU3RyaW5nKGJ5dGVzKSkpXG4gIH0sXG4gIHN0cmluZ1RvQnl0ZXM6IGZ1bmN0aW9uKHN0cikge1xuICAgcmV0dXJuIGNvbnZlcnRTdHJpbmcuc3RyaW5nVG9CeXRlcyh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSkpXG4gIH1cbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vQ29tbW9uSlNcbiAgbW9kdWxlLmV4cG9ydHMgPSBjb252ZXJ0U3RyaW5nXG59IGVsc2Uge1xuICBnbG9iYWxzLmNvbnZlcnRTdHJpbmcgPSBjb252ZXJ0U3RyaW5nXG59XG5cbn0odGhpcyk7IiwiKGZ1bmN0aW9uIChwcm9jZXNzLEJ1ZmZlcil7XG4hZnVuY3Rpb24oZ2xvYmFscykge1xuJ3VzZSBzdHJpY3QnXG5cbnZhciBfaW1wb3J0cyA9IHt9XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvL0NvbW1vbkpTXG4gIGlmIChmYWxzZSAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5waWQpIHtcbiAgICAvLyBOb2RlLmpzXG5cdG1vZHVsZS5leHBvcnRzID0gc2hhMjU2X25vZGU7XG4gIH0gZWxzZSB7XG4gICAgX2ltcG9ydHMuYnl0ZXNUb0hleCA9IHJlcXVpcmUoJ2NvbnZlcnQtaGV4JykuYnl0ZXNUb0hleFxuICAgIF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcgPSByZXF1aXJlKCdjb252ZXJ0LXN0cmluZycpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzaGEyNTZcbiAgfVxufSBlbHNlIHtcbiAgX2ltcG9ydHMuYnl0ZXNUb0hleCA9IGdsb2JhbHMuY29udmVydEhleC5ieXRlc1RvSGV4XG4gIF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcgPSBnbG9iYWxzLmNvbnZlcnRTdHJpbmdcbiAgZ2xvYmFscy5zaGEyNTYgPSBzaGEyNTZcbn1cblxuXG4vLyBOb2RlLmpzIGhhcyBpdHMgb3duIENyeXB0byBmdW5jdGlvbiB0aGF0IGNhbiBoYW5kbGUgdGhpcyBuYXRpdmVseVxuZnVuY3Rpb24gc2hhMjU2X25vZGUobWVzc2FnZSwgb3B0aW9ucykge1xuXHR2YXIgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG5cdHZhciBjID0gY3J5cHRvLmNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuXHRcblx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihtZXNzYWdlKSkge1xuXHRcdGMudXBkYXRlKG1lc3NhZ2UpO1xuXHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobWVzc2FnZSkpIHtcblx0XHQvLyBBcnJheSBvZiBieXRlIHZhbHVlc1xuXHRcdGMudXBkYXRlKG5ldyBCdWZmZXIobWVzc2FnZSkpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIE90aGVyd2lzZSwgdHJlYXQgYXMgYSBiaW5hcnkgc3RyaW5nXG5cdFx0Yy51cGRhdGUobmV3IEJ1ZmZlcihtZXNzYWdlLCAnYmluYXJ5JykpO1xuXHR9XG5cdHZhciBidWYgPSBjLmRpZ2VzdCgpO1xuXHRcblx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hc0J5dGVzKSB7XG5cdFx0Ly8gQXJyYXkgb2YgYnl0ZXMgYXMgZGVjaW1hbCBpbnRlZ2Vyc1xuXHRcdHZhciBhID0gW107XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkrKykge1xuXHRcdFx0YS5wdXNoKGJ1ZltpXSk7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9IGVsc2UgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hc1N0cmluZykge1xuXHRcdC8vIEJpbmFyeSBzdHJpbmdcblx0XHRyZXR1cm4gYnVmLnRvU3RyaW5nKCdiaW5hcnknKTtcblx0fSBlbHNlIHtcblx0XHQvLyBTdHJpbmcgb2YgaGV4IGNoYXJhY3RlcnNcblx0XHRyZXR1cm4gYnVmLnRvU3RyaW5nKCdoZXgnKTtcblx0fVxufVxuc2hhMjU2X25vZGUueDIgPSBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG5cdHJldHVybiBzaGEyNTZfbm9kZShzaGEyNTZfbm9kZShtZXNzYWdlLCB7IGFzQnl0ZXM6dHJ1ZSB9KSwgb3B0aW9ucylcbn1cblxuLypcbkNyeXB0b0pTIHYzLjEuMlxuY29kZS5nb29nbGUuY29tL3AvY3J5cHRvLWpzXG4oYykgMjAwOS0yMDEzIGJ5IEplZmYgTW90dC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbmNvZGUuZ29vZ2xlLmNvbS9wL2NyeXB0by1qcy93aWtpL0xpY2Vuc2VcbiovXG5cbi8vIEluaXRpYWxpemF0aW9uIHJvdW5kIGNvbnN0YW50cyB0YWJsZXNcbnZhciBLID0gW11cblxuLy8gQ29tcHV0ZSBjb25zdGFudHNcbiFmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIGlzUHJpbWUobikge1xuICAgIHZhciBzcXJ0TiA9IE1hdGguc3FydChuKTtcbiAgICBmb3IgKHZhciBmYWN0b3IgPSAyOyBmYWN0b3IgPD0gc3FydE47IGZhY3RvcisrKSB7XG4gICAgICBpZiAoIShuICUgZmFjdG9yKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEZyYWN0aW9uYWxCaXRzKG4pIHtcbiAgICByZXR1cm4gKChuIC0gKG4gfCAwKSkgKiAweDEwMDAwMDAwMCkgfCAwXG4gIH1cblxuICB2YXIgbiA9IDJcbiAgdmFyIG5QcmltZSA9IDBcbiAgd2hpbGUgKG5QcmltZSA8IDY0KSB7XG4gICAgaWYgKGlzUHJpbWUobikpIHtcbiAgICAgIEtbblByaW1lXSA9IGdldEZyYWN0aW9uYWxCaXRzKE1hdGgucG93KG4sIDEgLyAzKSlcbiAgICAgIG5QcmltZSsrXG4gICAgfVxuXG4gICAgbisrXG4gIH1cbn0oKVxuXG52YXIgYnl0ZXNUb1dvcmRzID0gZnVuY3Rpb24gKGJ5dGVzKSB7XG4gIHZhciB3b3JkcyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBiID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSsrLCBiICs9IDgpIHtcbiAgICB3b3Jkc1tiID4+PiA1XSB8PSBieXRlc1tpXSA8PCAoMjQgLSBiICUgMzIpXG4gIH1cbiAgcmV0dXJuIHdvcmRzXG59XG5cbnZhciB3b3Jkc1RvQnl0ZXMgPSBmdW5jdGlvbiAod29yZHMpIHtcbiAgdmFyIGJ5dGVzID0gW11cbiAgZm9yICh2YXIgYiA9IDA7IGIgPCB3b3Jkcy5sZW5ndGggKiAzMjsgYiArPSA4KSB7XG4gICAgYnl0ZXMucHVzaCgod29yZHNbYiA+Pj4gNV0gPj4+ICgyNCAtIGIgJSAzMikpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZXNcbn1cblxuLy8gUmV1c2FibGUgb2JqZWN0XG52YXIgVyA9IFtdXG5cbnZhciBwcm9jZXNzQmxvY2sgPSBmdW5jdGlvbiAoSCwgTSwgb2Zmc2V0KSB7XG4gIC8vIFdvcmtpbmcgdmFyaWFibGVzXG4gIHZhciBhID0gSFswXSwgYiA9IEhbMV0sIGMgPSBIWzJdLCBkID0gSFszXVxuICB2YXIgZSA9IEhbNF0sIGYgPSBIWzVdLCBnID0gSFs2XSwgaCA9IEhbN11cblxuICAgIC8vIENvbXB1dGF0aW9uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgNjQ7IGkrKykge1xuICAgIGlmIChpIDwgMTYpIHtcbiAgICAgIFdbaV0gPSBNW29mZnNldCArIGldIHwgMFxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ2FtbWEweCA9IFdbaSAtIDE1XVxuICAgICAgdmFyIGdhbW1hMCAgPSAoKGdhbW1hMHggPDwgMjUpIHwgKGdhbW1hMHggPj4+IDcpKSAgXlxuICAgICAgICAgICAgICAgICAgICAoKGdhbW1hMHggPDwgMTQpIHwgKGdhbW1hMHggPj4+IDE4KSkgXlxuICAgICAgICAgICAgICAgICAgICAoZ2FtbWEweCA+Pj4gMylcblxuICAgICAgdmFyIGdhbW1hMXggPSBXW2kgLSAyXTtcbiAgICAgIHZhciBnYW1tYTEgID0gKChnYW1tYTF4IDw8IDE1KSB8IChnYW1tYTF4ID4+PiAxNykpIF5cbiAgICAgICAgICAgICAgICAgICAgKChnYW1tYTF4IDw8IDEzKSB8IChnYW1tYTF4ID4+PiAxOSkpIF5cbiAgICAgICAgICAgICAgICAgICAgKGdhbW1hMXggPj4+IDEwKVxuXG4gICAgICBXW2ldID0gZ2FtbWEwICsgV1tpIC0gN10gKyBnYW1tYTEgKyBXW2kgLSAxNl07XG4gICAgfVxuXG4gICAgdmFyIGNoICA9IChlICYgZikgXiAofmUgJiBnKTtcbiAgICB2YXIgbWFqID0gKGEgJiBiKSBeIChhICYgYykgXiAoYiAmIGMpO1xuXG4gICAgdmFyIHNpZ21hMCA9ICgoYSA8PCAzMCkgfCAoYSA+Pj4gMikpIF4gKChhIDw8IDE5KSB8IChhID4+PiAxMykpIF4gKChhIDw8IDEwKSB8IChhID4+PiAyMikpO1xuICAgIHZhciBzaWdtYTEgPSAoKGUgPDwgMjYpIHwgKGUgPj4+IDYpKSBeICgoZSA8PCAyMSkgfCAoZSA+Pj4gMTEpKSBeICgoZSA8PCA3KSAgfCAoZSA+Pj4gMjUpKTtcblxuICAgIHZhciB0MSA9IGggKyBzaWdtYTEgKyBjaCArIEtbaV0gKyBXW2ldO1xuICAgIHZhciB0MiA9IHNpZ21hMCArIG1hajtcblxuICAgIGggPSBnO1xuICAgIGcgPSBmO1xuICAgIGYgPSBlO1xuICAgIGUgPSAoZCArIHQxKSB8IDA7XG4gICAgZCA9IGM7XG4gICAgYyA9IGI7XG4gICAgYiA9IGE7XG4gICAgYSA9ICh0MSArIHQyKSB8IDA7XG4gIH1cblxuICAvLyBJbnRlcm1lZGlhdGUgaGFzaCB2YWx1ZVxuICBIWzBdID0gKEhbMF0gKyBhKSB8IDA7XG4gIEhbMV0gPSAoSFsxXSArIGIpIHwgMDtcbiAgSFsyXSA9IChIWzJdICsgYykgfCAwO1xuICBIWzNdID0gKEhbM10gKyBkKSB8IDA7XG4gIEhbNF0gPSAoSFs0XSArIGUpIHwgMDtcbiAgSFs1XSA9IChIWzVdICsgZikgfCAwO1xuICBIWzZdID0gKEhbNl0gKyBnKSB8IDA7XG4gIEhbN10gPSAoSFs3XSArIGgpIHwgMDtcbn1cblxuZnVuY3Rpb24gc2hhMjU2KG1lc3NhZ2UsIG9wdGlvbnMpIHs7XG4gIGlmIChtZXNzYWdlLmNvbnN0cnVjdG9yID09PSBTdHJpbmcpIHtcbiAgICBtZXNzYWdlID0gX2ltcG9ydHMuY29udmVydFN0cmluZy5VVEY4LnN0cmluZ1RvQnl0ZXMobWVzc2FnZSk7XG4gIH1cblxuICB2YXIgSCA9WyAweDZBMDlFNjY3LCAweEJCNjdBRTg1LCAweDNDNkVGMzcyLCAweEE1NEZGNTNBLFxuICAgICAgICAgICAweDUxMEU1MjdGLCAweDlCMDU2ODhDLCAweDFGODNEOUFCLCAweDVCRTBDRDE5IF07XG5cbiAgdmFyIG0gPSBieXRlc1RvV29yZHMobWVzc2FnZSk7XG4gIHZhciBsID0gbWVzc2FnZS5sZW5ndGggKiA4O1xuXG4gIG1bbCA+PiA1XSB8PSAweDgwIDw8ICgyNCAtIGwgJSAzMik7XG4gIC8vIFRoaXMgaXMgYSBoYWNrIHRvIG1ha2UgdGhpcyBhbGdvcml0aG0gY29tcGF0aWJsZSB3aXRoIHRoZSBvbmUgaW4gU3RhcmJvdW5kLlxuICBpZiAoKG1lc3NhZ2UubGVuZ3RoICYgMHgzRikgPT0gNTUpIHtcbiAgICBtWzMxXSA9IGw7XG4gIH0gZWxzZSB7XG4gICAgbVsoKGwgKyA2NCA+PiA5KSA8PCA0KSArIDE1XSA9IGw7XG4gIH1cblxuICBmb3IgKHZhciBpPTAgOyBpPG0ubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgcHJvY2Vzc0Jsb2NrKEgsIG0sIGkpO1xuICB9XG5cbiAgdmFyIGRpZ2VzdGJ5dGVzID0gd29yZHNUb0J5dGVzKEgpO1xuICByZXR1cm4gb3B0aW9ucyAmJiBvcHRpb25zLmFzQnl0ZXMgPyBkaWdlc3RieXRlcyA6XG4gICAgICAgICBvcHRpb25zICYmIG9wdGlvbnMuYXNTdHJpbmcgPyBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nLmJ5dGVzVG9TdHJpbmcoZGlnZXN0Ynl0ZXMpIDpcbiAgICAgICAgIF9pbXBvcnRzLmJ5dGVzVG9IZXgoZGlnZXN0Ynl0ZXMpXG59XG5cbnNoYTI1Ni54MiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHNoYTI1NihzaGEyNTYobWVzc2FnZSwgeyBhc0J5dGVzOnRydWUgfSksIG9wdGlvbnMpXG59XG5cbn0odGhpcyk7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcikiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47KGZ1bmN0aW9uIChjb21tb25qcykge1xuICBmdW5jdGlvbiBlcnJvck9iamVjdChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQ2FsbHNGcm9tT3duZXIoZnVuY3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTGV0IHRoZSBvdGhlciBzaWRlIGtub3cgYWJvdXQgb3VyIGZ1bmN0aW9ucyBpZiB0aGV5IGNhbid0IHVzZSBQcm94eS5cbiAgICAgIHZhciBuYW1lcyA9IFtdO1xuICAgICAgZm9yICh2YXIgbmFtZSBpbiBmdW5jdGlvbnMpIG5hbWVzLnB1c2gobmFtZSk7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKHtmdW5jdGlvbk5hbWVzOiBuYW1lc30pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGlkKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9KTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2suX2F1dG9EaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2suZGlzYWJsZUF1dG8gPSBmdW5jdGlvbiAoKSB7IGNhbGxiYWNrLl9hdXRvRGlzYWJsZWQgPSB0cnVlOyB9O1xuXG4gICAgICBjYWxsYmFjay50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtjYWxsUmVzcG9uc2U6IGlkLCBhcmd1bWVudHM6IGFyZ3N9LCB0cmFuc2Zlckxpc3QpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrO1xuICAgIH1cblxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbCkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsSWQ7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLlxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnNbbWVzc2FnZS5jYWxsXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY2FsbFJlc3BvbnNlOiBjYWxsSWQsXG4gICAgICAgICAgICBhcmd1bWVudHM6IFtlcnJvck9iamVjdChuZXcgRXJyb3IoJ1RoYXQgZnVuY3Rpb24gZG9lcyBub3QgZXhpc3QnKSldXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBtZXNzYWdlLmFyZ3VtZW50cyB8fCBbXTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY3JlYXRlQ2FsbGJhY2soY2FsbElkKTtcbiAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgICAgIGlmIChvcHRpb25zLmNhdGNoRXJyb3JzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvck9iamVjdChlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZm4uYXBwbHkoZnVuY3Rpb25zLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBvcHRpb24gZm9yIGl0IGlzIGVuYWJsZWQsIGF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2suXG4gICAgICAgIGlmIChvcHRpb25zLmF1dG9DYWxsYmFjayAmJiAhY2FsbGJhY2suX2F1dG9EaXNhYmxlZCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldHVyblZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vycywgb3B0aW9ucykge1xuICAgIHZhciBjYWNoZSA9IHt9LFxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcbiAgICAgICAgdGltZXJzLFxuICAgICAgICBuZXh0Q2FsbElkID0gMSxcbiAgICAgICAgZmFrZVByb3h5LFxuICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGFycmF5IG9mIG51bWJlciBvZiBwZW5kaW5nIHRhc2tzIGZvciBlYWNoIHdvcmtlci5cbiAgICB2YXIgcGVuZGluZyA9IHdvcmtlcnMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDA7IH0pO1xuXG4gICAgLy8gRWFjaCBpbmRpdmlkdWFsIGNhbGwgZ2V0cyBhIHRpbWVyIGlmIHRpbWluZyBjYWxscy5cbiAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMpIHRpbWVycyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBQcm94eSBzdXBwb3J0LCB3ZSBoYXZlIHRvIHByZS1kZWZpbmUgYWxsIHRoZSBmdW5jdGlvbnMuXG4gICAgICBmYWtlUHJveHkgPSB7cGVuZGluZ0NhbGxzOiAwfTtcbiAgICAgIG9wdGlvbnMuZnVuY3Rpb25OYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROdW1QZW5kaW5nQ2FsbHMoKSB7XG4gICAgICByZXR1cm4gcXVldWUubGVuZ3RoICsgcGVuZGluZy5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIYW5kbGVyKF8sIG5hbWUpIHtcbiAgICAgIGlmIChuYW1lID09ICdwZW5kaW5nQ2FsbHMnKSByZXR1cm4gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXTtcblxuICAgICAgdmFyIGZuID0gY2FjaGVbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MpO1xuICAgICAgfTtcblxuICAgICAgLy8gU2VuZHMgdGhlIHNhbWUgY2FsbCB0byBhbGwgd29ya2Vycy5cbiAgICAgIGZuLmJyb2FkY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzZW5kQ2FsbChpLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBNYXJrcyB0aGUgb2JqZWN0cyBpbiB0aGUgZmlyc3QgYXJndW1lbnQgKGFycmF5KSBhcyB0cmFuc2ZlcmFibGUuXG4gICAgICBmbi50cmFuc2ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgdHJhbnNmZXJMaXN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBxdWV1ZUNhbGwobmFtZSwgYXJncywgdHJhbnNmZXJMaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlKCkge1xuICAgICAgLy8gS2VlcCB0aGUgZmFrZSBwcm94eSBwZW5kaW5nIGNvdW50IHVwLXRvLWRhdGUuXG4gICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gZ2V0TnVtUGVuZGluZ0NhbGxzKCk7XG5cbiAgICAgIGlmICghcXVldWUubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGVuZGluZ1tpXSkgY29udGludWU7XG5cbiAgICAgICAgLy8gQSB3b3JrZXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICB2YXIgcGFyYW1zID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgc2VuZENhbGwoaSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSk7XG5cbiAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUNhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgcXVldWUucHVzaChbbmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdF0pO1xuICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRDYWxsKHdvcmtlckluZGV4LCBuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICAvLyBHZXQgdGhlIHdvcmtlciBhbmQgaW5kaWNhdGUgdGhhdCBpdCBoYXMgYSBwZW5kaW5nIHRhc2suXG4gICAgICBwZW5kaW5nW3dvcmtlckluZGV4XSsrO1xuICAgICAgdmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySW5kZXhdO1xuXG4gICAgICB2YXIgaWQgPSBuZXh0Q2FsbElkKys7XG5cbiAgICAgIC8vIElmIHRoZSBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGFzc3VtZSBpdCdzIHRoZSBjYWxsYmFjay5cbiAgICAgIHZhciBtYXliZUNiID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHR5cGVvZiBtYXliZUNiID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2tzW2lkXSA9IG1heWJlQ2I7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgc3BlY2lmaWVkLCB0aW1lIGNhbGxzIHVzaW5nIHRoZSBjb25zb2xlLnRpbWUgaW50ZXJmYWNlLlxuICAgICAgaWYgKG9wdGlvbnMudGltZUNhbGxzKSB7XG4gICAgICAgIHZhciB0aW1lcklkID0gbmFtZSArICcoJyArIGFyZ3Muam9pbignLCAnKSArICcpJztcbiAgICAgICAgdGltZXJzW2lkXSA9IHRpbWVySWQ7XG4gICAgICAgIGNvbnNvbGUudGltZSh0aW1lcklkKTtcbiAgICAgIH1cblxuICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtjYWxsSWQ6IGlkLCBjYWxsOiBuYW1lLCBhcmd1bWVudHM6IGFyZ3N9LCBvcHRfdHJhbnNmZXJMaXN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcihlKSB7XG4gICAgICB2YXIgd29ya2VySW5kZXggPSB3b3JrZXJzLmluZGV4T2YodGhpcyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgICAgaWYgKG1lc3NhZ2UuY2FsbFJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBjYWxsSWQgPSBtZXNzYWdlLmNhbGxSZXNwb25zZTtcblxuICAgICAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayByZWdpc3RlcmVkIGZvciB0aGlzIGNhbGwgKGlmIGFueSkuXG4gICAgICAgIGlmIChjYWxsYmFja3NbY2FsbElkXSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tjYWxsSWRdLmFwcGx5KG51bGwsIG1lc3NhZ2UuYXJndW1lbnRzKTtcbiAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxJZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBvcnQgdGltaW5nLCBpZiB0aGF0IG9wdGlvbiBpcyBlbmFibGVkLlxuICAgICAgICBpZiAob3B0aW9ucy50aW1lQ2FsbHMgJiYgdGltZXJzW2NhbGxJZF0pIHtcbiAgICAgICAgICBjb25zb2xlLnRpbWVFbmQodGltZXJzW2NhbGxJZF0pO1xuICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbY2FsbElkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyB0YXNrIGlzIG5vIGxvbmdlciBwZW5kaW5nIG9uIHRoZSB3b3JrZXIuXG4gICAgICAgIHBlbmRpbmdbd29ya2VySW5kZXhdLS07XG4gICAgICAgIGZsdXNoUXVldWUoKTtcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5mdW5jdGlvbk5hbWVzKSB7XG4gICAgICAgIC8vIFJlY2VpdmVkIGEgbGlzdCBvZiBhdmFpbGFibGUgZnVuY3Rpb25zLiBPbmx5IHVzZWZ1bCBmb3IgZmFrZSBwcm94eS5cbiAgICAgICAgbWVzc2FnZS5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICBmYWtlUHJveHlbbmFtZV0gPSBnZXRIYW5kbGVyKG51bGwsIG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gbWVzc2FnZXMgZnJvbSBhbGwgdGhlIHdvcmtlcnMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3b3JrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3b3JrZXJzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZha2VQcm94eTtcbiAgICB9IGVsc2UgaWYgKFByb3h5LmNyZWF0ZSkge1xuICAgICAgcmV0dXJuIFByb3h5LmNyZWF0ZSh7Z2V0OiBnZXRIYW5kbGVyfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoe30sIHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggZWl0aGVyIGEgV29ya2VyIGluc3RhbmNlLCBhIGxpc3Qgb2YgdGhlbSwgb3IgYSBtYXBcbiAgICogb2YgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCBpbnNpZGUgdGhlIHdvcmtlci5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZVdvcmtlclByb3h5KHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0X29wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgY2FsbCB0aGUgY2FsbGJhY2sgYWZ0ZXIgYSBjYWxsIGlmIHRoZSByZXR1cm4gdmFsdWUgaXMgbm90XG4gICAgICAvLyB1bmRlZmluZWQuXG4gICAgICBhdXRvQ2FsbGJhY2s6IGZhbHNlLFxuICAgICAgLy8gQ2F0Y2ggZXJyb3JzIGFuZCBhdXRvbWF0aWNhbGx5IHJlc3BvbmQgd2l0aCBhbiBlcnJvciBjYWxsYmFjay4gT2ZmIGJ5XG4gICAgICAvLyBkZWZhdWx0IHNpbmNlIGl0IGJyZWFrcyBzdGFuZGFyZCBiZWhhdmlvci5cbiAgICAgIGNhdGNoRXJyb3JzOiBmYWxzZSxcbiAgICAgIC8vIEEgbGlzdCBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkLiBUaGlzIGxpc3Qgd2lsbCBiZSB1c2VkIHRvIG1ha2VcbiAgICAgIC8vIHRoZSBwcm94eSBmdW5jdGlvbnMgYXZhaWxhYmxlIHdoZW4gUHJveHkgaXMgbm90IHN1cHBvcnRlZC4gTm90ZSB0aGF0XG4gICAgICAvLyB0aGlzIGlzIGdlbmVyYWxseSBub3QgbmVlZGVkIHNpbmNlIHRoZSB3b3JrZXIgd2lsbCBhbHNvIHB1Ymxpc2ggaXRzXG4gICAgICAvLyBrbm93biBmdW5jdGlvbnMuXG4gICAgICBmdW5jdGlvbk5hbWVzOiBbXSxcbiAgICAgIC8vIENhbGwgY29uc29sZS50aW1lIGFuZCBjb25zb2xlLnRpbWVFbmQgZm9yIGNhbGxzIHNlbnQgdGhvdWdoIHRoZSBwcm94eS5cbiAgICAgIHRpbWVDYWxsczogZmFsc2VcbiAgICB9O1xuXG4gICAgaWYgKG9wdF9vcHRpb25zKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb3B0X29wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG9wdGlvbnMpKSBjb250aW51ZTtcbiAgICAgICAgb3B0aW9uc1trZXldID0gb3B0X29wdGlvbnNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYW4gYXJyYXkgb2Ygd29ya2VycyAoZXZlbiBpZiBvbmx5IHVzaW5nIG9uZSB3b3JrZXIpLlxuICAgIGlmICh0eXBlb2YgV29ya2VyICE9ICd1bmRlZmluZWQnICYmICh3b3JrZXJzT3JGdW5jdGlvbnMgaW5zdGFuY2VvZiBXb3JrZXIpKSB7XG4gICAgICB3b3JrZXJzT3JGdW5jdGlvbnMgPSBbd29ya2Vyc09yRnVuY3Rpb25zXTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3b3JrZXJzT3JGdW5jdGlvbnMpKSB7XG4gICAgICByZXR1cm4gc2VuZENhbGxzVG9Xb3JrZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjZWl2ZUNhbGxzRnJvbU93bmVyKHdvcmtlcnNPckZ1bmN0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbW1vbmpzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcGU7XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHNjb3BlID0gZ2xvYmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSB3aW5kb3c7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBzZWxmO1xuICAgIH1cblxuICAgIHNjb3BlLmNyZWF0ZVdvcmtlclByb3h5ID0gY3JlYXRlV29ya2VyUHJveHk7XG4gIH1cbn0pKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==

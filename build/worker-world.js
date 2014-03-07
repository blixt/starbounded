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
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined')
    return false

  // Does the browser support adding properties to `Uint8Array` instances? If
  // not, then that's the same as no `Uint8Array` support. We need to be able to
  // add all the node Buffer API methods.
  // Relevant Firefox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
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
  assert(value >= 0,
      'specified a negative value for writing an unsigned value')
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
var metadata,
    world;
workerproxy({
  getRegion: function(x, y, callback) {
    if (!world) {
      throw new Error('A world has to be opened before getting regions.');
    }
    var buffer = world.getRegionData(1, x, y),
        entities = world.getEntities(x, y);
    var region = {
      buffer: buffer,
      entities: entities
    };
    callback.transfer([region.buffer], null, region);
  },
  open: function(file, callback) {
    if (world) {
      throw new Error('A world has already been opened.');
    }
    world = World.open(file);
    metadata = world.getMetadata();
    callback(null, metadata);
  }
}, {catchErrors: true});


},{"starbound-files":18,"workerproxy":30}],18:[function(require,module,exports){
exports.BlockFile = require('./lib/blockfile');
exports.BTreeDB = require('./lib/btreedb');
exports.Package = require('./lib/package');
exports.SbonReader = require('./lib/sbonreader');
exports.World = require('./lib/world');

},{"./lib/blockfile":19,"./lib/btreedb":20,"./lib/package":21,"./lib/sbonreader":22,"./lib/world":23}],19:[function(require,module,exports){
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

},{"./sbonreader":22}],20:[function(require,module,exports){
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

},{"./blockfile":19,"./sbonreader":22,"util":14}],21:[function(require,module,exports){
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

},{"./blockfile":19,"./btreedb":20,"./sbonreader":22,"sha256":24,"starbound-sha256":27}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{"./btreedb":20,"./sbonreader":22,"zlib":15}],24:[function(require,module,exports){
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
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"buffer":2,"convert-hex":25,"convert-string":26,"crypto":6}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
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
},{"/Users/blixt/src/starbounded/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12,"buffer":2,"convert-hex":28,"convert-string":29,"crypto":6}],28:[function(require,module,exports){
module.exports=require(25)
},{}],29:[function(require,module,exports){
module.exports=require(26)
},{}],30:[function(require,module,exports){
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
        pendingCalls = 0,
        queue = [];

    // Create an array of booleans for the availability of each worker.
    var available = workers.map(function () { return true; });

    // Each individual call gets a timer if timing calls.
    if (options.timeCalls) timers = {};

    if (typeof Proxy == 'undefined') {
      // If we have no Proxy support, we have to pre-define all the functions.
      fakeProxy = {pendingCalls: 0};
      options.functionNames.forEach(function (name) {
        fakeProxy[name] = getHandler(null, name);
      });
    }

    function getHandler(_, name) {
      if (name == 'pendingCalls') return pendingCalls;
      if (cache[name]) return cache[name];

      var fn = cache[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        queueCall(name, args);
      };

      // Sends the same call to all workers.
      fn.broadcast = function () {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < workers.length; i++) {
          pendingCalls++;
          sendCall(i, name, args);
        }
        if (fakeProxy) fakeProxy.pendingCalls = pendingCalls;
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
      if (!queue.length) return;

      for (var i = 0; i < workers.length; i++) {
        if (!available[i]) continue;

        // A worker is available.
        var params = queue.shift();
        sendCall(i, params[0], params[1], params[2]);

        if (!queue.length) return;
      }
    }

    function queueCall(name, args, opt_transferList) {
      pendingCalls++;
      if (fakeProxy) fakeProxy.pendingCalls = pendingCalls;
      queue.push([name, args, opt_transferList]);
      flushQueue();
    }

    function sendCall(workerIndex, name, args, opt_transferList) {
      // Get the worker and mark it as unavailable.
      available[workerIndex] = false;
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

        pendingCalls--;
        if (fakeProxy) fakeProxy.pendingCalls = pendingCalls;

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

        // Make the worker available to handle more calls.
        available[workerIndex] = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2VzNmlmeS9ub2RlX21vZHVsZXMvdHJhY2V1ci9zcmMvcnVudGltZS9ydW50aW1lLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvaGVscGVycy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2NyeXB0by1icm93c2VyaWZ5L21kNS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvcm5nLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9jcnlwdG8tYnJvd3NlcmlmeS9zaGEuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2NyeXB0by1icm93c2VyaWZ5L3NoYTI1Ni5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvemxpYi1icm93c2VyaWZ5L2luZGV4LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy96bGliLWJyb3dzZXJpZnkvemxpYi5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9mYWtlX2NiZjMwZjIwLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvaW5kZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9saWIvYmxvY2tmaWxlLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbGliL2J0cmVlZGIuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9saWIvcGFja2FnZS5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWZpbGVzL2xpYi9zYm9ucmVhZGVyLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbGliL3dvcmxkLmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbm9kZV9tb2R1bGVzL3NoYTI1Ni9saWIvc2hhMjU2LmpzIiwiL1VzZXJzL2JsaXh0L3NyYy9zdGFyYm91bmRlZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLXdvcmxkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtZmlsZXMvbm9kZV9tb2R1bGVzL3NoYTI1Ni9ub2RlX21vZHVsZXMvY29udmVydC1oZXgvY29udmVydC1oZXguanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC1maWxlcy9ub2RlX21vZHVsZXMvc2hhMjU2L25vZGVfbW9kdWxlcy9jb252ZXJ0LXN0cmluZy9jb252ZXJ0LXN0cmluZy5qcyIsIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL3N0YXJib3VuZC13b3JsZC9ub2RlX21vZHVsZXMvc3RhcmJvdW5kLWZpbGVzL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtc2hhMjU2L2xpYi9zaGEyNTYuanMiLCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9zdGFyYm91bmQtd29ybGQvbm9kZV9tb2R1bGVzL3dvcmtlcnByb3h5L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDaUJBLENBQUMsUUFBQSxDQUFTLE1BQUEsQ0FBUTtBQUNoQixjQUFBO0FBRUEsSUFBQSxFQUFJLE1BQUEsQ0FBQSxlQUFB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REksR0FBQSxNQUFBLEVBQVEsUUFBTyxDQUFDLGlCQUFBLENBQUEsQ0FBQSxLQUFBO0FBQ2hCLEdBQUEsWUFBQSxFQUFjLFFBQU8sQ0FBQyxhQUFBLENBQUE7QUFFdEIsR0FBQSxTQUFBO0FBQVUsU0FBQTtBQUVkLFdBQVcsQ0FBQztBQUNWLFdBQUEsQ0FBVyxTQUFBLENBQVUsQ0FBQSxDQUFHLEVBQUEsQ0FBRyxTQUFBLENBQVU7QUFDbkMsTUFBQSxFQUFJLENBQUMsS0FBQSxDQUFPO0FBQ1YsV0FBTSxJQUFJLE1BQUssQ0FBQyxrREFBQSxDQUFBO0FBQUE7QUFJZCxPQUFBLE9BQUEsRUFBUyxNQUFBLENBQUEsYUFBbUIsQ0FBQyxDQUFBLENBQUcsRUFBQSxDQUFHLEVBQUEsQ0FBQTtBQUNuQyxnQkFBQSxFQUFXLE1BQUEsQ0FBQSxXQUFpQixDQUFDLENBQUEsQ0FBRyxFQUFBLENBQUE7QUFFaEMsT0FBQSxPQUFBLEVBQVM7QUFBQyxZQUFBLENBQVEsT0FBQTtBQUFRLGNBQUEsQ0FBVTtBQUFBLEtBQUE7QUFDeEMsWUFBQSxDQUFBLFFBQWlCLENBQUMsQ0FBQyxNQUFBLENBQUEsTUFBQSxDQUFBLENBQWdCLEtBQUEsQ0FBTSxPQUFBLENBQUE7QUFBQSxHQUFBO0FBRzNDLE1BQUEsQ0FBTSxTQUFBLENBQVUsSUFBQSxDQUFNLFNBQUEsQ0FBVTtBQUM5QixNQUFBLEVBQUksS0FBQSxDQUFPO0FBQ1QsV0FBTSxJQUFJLE1BQUssQ0FBQyxrQ0FBQSxDQUFBO0FBQUE7QUFHbEIsU0FBQSxFQUFRLE1BQUEsQ0FBQSxJQUFVLENBQUMsSUFBQSxDQUFBO0FBQ25CLFlBQUEsRUFBVyxNQUFBLENBQUEsV0FBaUIsQ0FBQSxDQUFBO0FBRTVCLFlBQVEsQ0FBQyxJQUFBLENBQU0sU0FBQSxDQUFBO0FBQUE7QUFBQSxDQUFBLENBRWhCLEVBQUMsV0FBQSxDQUFhLEtBQUEsQ0FBQSxDQUFBOzs7O0FDN0JqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDEyIFRyYWNldXIgQXV0aG9ycy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vKipcbiAqIFRoZSB0cmFjZXVyIHJ1bnRpbWUuXG4gKi9cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChnbG9iYWwuJHRyYWNldXJSdW50aW1lKSB7XG4gICAgLy8gUHJldmVudHMgZnJvbSBiZWluZyBleGVjdXRlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgJGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4gIHZhciAkZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gIHZhciAkZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xuICB2YXIgJGZyZWV6ZSA9IE9iamVjdC5mcmVlemU7XG4gIHZhciAkZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICB2YXIgJGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuICB2YXIgJGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuXG4gIGZ1bmN0aW9uIG5vbkVudW0odmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gIH1cblxuICB2YXIgbWV0aG9kID0gbm9uRW51bTtcblxuICBmdW5jdGlvbiBwb2x5ZmlsbFN0cmluZyhTdHJpbmcpIHtcbiAgICAvLyBIYXJtb255IFN0cmluZyBFeHRyYXNcbiAgICAvLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OnN0cmluZ19leHRyYXNcbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcucHJvdG90eXBlLCB7XG4gICAgICBzdGFydHNXaXRoOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgIHJldHVybiB0aGlzLmxhc3RJbmRleE9mKHMsIDApID09PSAwO1xuICAgICAgfSksXG4gICAgICBlbmRzV2l0aDogbWV0aG9kKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgdmFyIHQgPSBTdHJpbmcocyk7XG4gICAgICAgIHZhciBsID0gdGhpcy5sZW5ndGggLSB0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGwgPj0gMCAmJiB0aGlzLmluZGV4T2YodCwgbCkgPT09IGw7XG4gICAgICB9KSxcbiAgICAgIGNvbnRhaW5zOiBtZXRob2QoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHMpICE9PSAtMTtcbiAgICAgIH0pLFxuICAgICAgdG9BcnJheTogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGxpdCgnJyk7XG4gICAgICB9KSxcbiAgICAgIGNvZGVQb2ludEF0OiBtZXRob2QoZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgICAgLyohIGh0dHA6Ly9tdGhzLmJlL2NvZGVwb2ludGF0IHYwLjEuMCBieSBAbWF0aGlhcyAqL1xuICAgICAgICB2YXIgc3RyaW5nID0gU3RyaW5nKHRoaXMpO1xuICAgICAgICB2YXIgc2l6ZSA9IHN0cmluZy5sZW5ndGg7XG4gICAgICAgIC8vIGBUb0ludGVnZXJgXG4gICAgICAgIHZhciBpbmRleCA9IHBvc2l0aW9uID8gTnVtYmVyKHBvc2l0aW9uKSA6IDA7XG4gICAgICAgIGlmIChpc05hTihpbmRleCkpIHtcbiAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWNjb3VudCBmb3Igb3V0LW9mLWJvdW5kcyBpbmRpY2VzOlxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3QgY29kZSB1bml0XG4gICAgICAgIHZhciBmaXJzdCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgdmFyIHNlY29uZDtcbiAgICAgICAgaWYgKCAvLyBjaGVjayBpZiBpdOKAmXMgdGhlIHN0YXJ0IG9mIGEgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICBmaXJzdCA+PSAweEQ4MDAgJiYgZmlyc3QgPD0gMHhEQkZGICYmIC8vIGhpZ2ggc3Vycm9nYXRlXG4gICAgICAgICAgc2l6ZSA+IGluZGV4ICsgMSAvLyB0aGVyZSBpcyBhIG5leHQgY29kZSB1bml0XG4gICAgICAgICkge1xuICAgICAgICAgIHNlY29uZCA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG4gICAgICAgICAgaWYgKHNlY29uZCA+PSAweERDMDAgJiYgc2Vjb25kIDw9IDB4REZGRikgeyAvLyBsb3cgc3Vycm9nYXRlXG4gICAgICAgICAgICAvLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nI3N1cnJvZ2F0ZS1mb3JtdWxhZVxuICAgICAgICAgICAgcmV0dXJuIChmaXJzdCAtIDB4RDgwMCkgKiAweDQwMCArIHNlY29uZCAtIDB4REMwMCArIDB4MTAwMDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAkZGVmaW5lUHJvcGVydGllcyhTdHJpbmcsIHtcbiAgICAgIC8vIDIxLjEuMi40IFN0cmluZy5yYXcoY2FsbFNpdGUsIC4uLnN1YnN0aXR1dGlvbnMpXG4gICAgICByYXc6IG1ldGhvZChmdW5jdGlvbihjYWxsc2l0ZSkge1xuICAgICAgICB2YXIgcmF3ID0gY2FsbHNpdGUucmF3O1xuICAgICAgICB2YXIgbGVuID0gcmF3Lmxlbmd0aCA+Pj4gMDsgIC8vIFRvVWludFxuICAgICAgICBpZiAobGVuID09PSAwKVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHMgKz0gcmF3W2ldO1xuICAgICAgICAgIGlmIChpICsgMSA9PT0gbGVuKVxuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgcyArPSBhcmd1bWVudHNbKytpXTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICAvLyAyMS4xLjIuMiBTdHJpbmcuZnJvbUNvZGVQb2ludCguLi5jb2RlUG9pbnRzKVxuICAgICAgZnJvbUNvZGVQb2ludDogbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBodHRwOi8vbXRocy5iZS9mcm9tY29kZXBvaW50IHYwLjEuMCBieSBAbWF0aGlhc1xuICAgICAgICB2YXIgY29kZVVuaXRzID0gW107XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIHZhciBoaWdoU3Vycm9nYXRlO1xuICAgICAgICB2YXIgbG93U3Vycm9nYXRlO1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGNvZGVQb2ludCA9IE51bWJlcihhcmd1bWVudHNbaW5kZXhdKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhaXNGaW5pdGUoY29kZVBvaW50KSB8fCAgLy8gYE5hTmAsIGArSW5maW5pdHlgLCBvciBgLUluZmluaXR5YFxuICAgICAgICAgICAgY29kZVBvaW50IDwgMCB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCAgLy8gbm90IGEgdmFsaWQgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgICBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCAgLy8gbm90IGFuIGludGVnZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IFJhbmdlRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludDogJyArIGNvZGVQb2ludCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb2RlUG9pbnQgPD0gMHhGRkZGKSB7ICAvLyBCTVAgY29kZSBwb2ludFxuICAgICAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgICAgICB9IGVsc2UgeyAgLy8gQXN0cmFsIGNvZGUgcG9pbnQ7IHNwbGl0IGluIHN1cnJvZ2F0ZSBoYWx2ZXNcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmcjc3Vycm9nYXRlLWZvcm11bGFlXG4gICAgICAgICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIGhpZ2hTdXJyb2dhdGUgPSAoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMDtcbiAgICAgICAgICAgIGxvd1N1cnJvZ2F0ZSA9IChjb2RlUG9pbnQgJSAweDQwMCkgKyAweERDMDA7XG4gICAgICAgICAgICBjb2RlVW5pdHMucHVzaChoaWdoU3Vycm9nYXRlLCBsb3dTdXJyb2dhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBjb2RlVW5pdHMpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIC8vICMjIyBTeW1ib2xzXG4gIC8vXG4gIC8vIFN5bWJvbHMgYXJlIGVtdWxhdGVkIHVzaW5nIGFuIG9iamVjdCB3aGljaCBpcyBhbiBpbnN0YW5jZSBvZiBTeW1ib2xWYWx1ZS5cbiAgLy8gQ2FsbGluZyBTeW1ib2wgYXMgYSBmdW5jdGlvbiByZXR1cm5zIGEgc3ltYm9sIHZhbHVlIG9iamVjdC5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGVuYWJsZWQgdGhlbiBhbGwgcHJvcGVydHkgYWNjZXNzZXMgYXJlIHRyYW5zZm9ybWVkXG4gIC8vIGludG8gcnVudGltZSBjYWxscyB3aGljaCB1c2VzIHRoZSBpbnRlcm5hbCBzdHJpbmcgYXMgdGhlIHJlYWwgcHJvcGVydHlcbiAgLy8gbmFtZS5cbiAgLy9cbiAgLy8gSWYgb3B0aW9ucy5zeW1ib2xzIGlzIGRpc2FibGVkIHN5bWJvbHMganVzdCB0b1N0cmluZyBhcyB0aGVpciBpbnRlcm5hbFxuICAvLyByZXByZXNlbnRhdGlvbiwgbWFraW5nIHRoZW0gd29yayBidXQgbGVhayBhcyBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG5cbiAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgdW5pcXVlIHN0cmluZy5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgZnVuY3Rpb24gbmV3VW5pcXVlU3RyaW5nKCkge1xuICAgIHJldHVybiAnX18kJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDFlOSkgKyAnJCcgKyArK2NvdW50ZXIgKyAnJF9fJztcbiAgfVxuXG4gIC8vIFRoZSBzdHJpbmcgdXNlZCBmb3IgdGhlIHJlYWwgcHJvcGVydHkuXG4gIHZhciBzeW1ib2xJbnRlcm5hbFByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gIHZhciBzeW1ib2xEZXNjcmlwdGlvblByb3BlcnR5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG5cbiAgLy8gVXNlZCBmb3IgdGhlIFN5bWJvbCB3cmFwcGVyXG4gIHZhciBzeW1ib2xEYXRhUHJvcGVydHkgPSBuZXdVbmlxdWVTdHJpbmcoKTtcblxuICAvLyBBbGwgc3ltYm9sIHZhbHVlcyBhcmUga2VwdCBpbiB0aGlzIG1hcC4gVGhpcyBpcyBzbyB0aGF0IHdlIGNhbiBnZXQgYmFjayB0b1xuICAvLyB0aGUgc3ltYm9sIG9iamVjdCBpZiBhbGwgd2UgaGF2ZSBpcyB0aGUgc3RyaW5nIGtleSByZXByZXNlbnRpbmcgdGhlIHN5bWJvbC5cbiAgdmFyIHN5bWJvbFZhbHVlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgZnVuY3Rpb24gaXNTeW1ib2woc3ltYm9sKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzeW1ib2wgPT09ICdvYmplY3QnICYmIHN5bWJvbCBpbnN0YW5jZW9mIFN5bWJvbFZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gdHlwZU9mKHYpIHtcbiAgICBpZiAoaXNTeW1ib2wodikpXG4gICAgICByZXR1cm4gJ3N5bWJvbCc7XG4gICAgcmV0dXJuIHR5cGVvZiB2O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdW5pcXVlIHN5bWJvbCBvYmplY3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gc3RyaW5nIE9wdGlvbmFsIHN0cmluZyB1c2VkIGZvciB0b1N0cmluZy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcbiAgICB2YXIgdmFsdWUgPSBuZXcgU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTeW1ib2wpKVxuICAgICAgcmV0dXJuIHZhbHVlO1xuXG4gICAgLy8gbmV3IFN5bWJvbCBzaG91bGQgdGhyb3cuXG4gICAgLy9cbiAgICAvLyBUaGVyZSBhcmUgdHdvIHdheXMgdG8gZ2V0IGEgd3JhcHBlciB0byBhIHN5bWJvbC4gRWl0aGVyIGJ5IGRvaW5nXG4gICAgLy8gT2JqZWN0KHN5bWJvbCkgb3IgY2FsbCBhIG5vbiBzdHJpY3QgZnVuY3Rpb24gdXNpbmcgYSBzeW1ib2wgdmFsdWUgYXNcbiAgICAvLyB0aGlzLiBUbyBjb3JyZWN0bHkgaGFuZGxlIHRoZXNlIHR3byB3b3VsZCByZXF1aXJlIGEgbG90IG9mIHdvcmsgZm9yIHZlcnlcbiAgICAvLyBsaXR0bGUgZ2FpbiBzbyB3ZSBhcmUgbm90IGRvaW5nIHRob3NlIGF0IHRoZSBtb21lbnQuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGNhbm5vdCBiZSBuZXdcXCdlZCcpO1xuICB9XG5cbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICdjb25zdHJ1Y3RvcicsIG5vbkVudW0oU3ltYm9sKSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2wucHJvdG90eXBlLCAndG9TdHJpbmcnLCBtZXRob2QoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN5bWJvbFZhbHVlID0gdGhpc1tzeW1ib2xEYXRhUHJvcGVydHldO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgaWYgKCFzeW1ib2xWYWx1ZSlcbiAgICAgIHRocm93IFR5cGVFcnJvcignQ29udmVyc2lvbiBmcm9tIHN5bWJvbCB0byBzdHJpbmcnKTtcbiAgICB2YXIgZGVzYyA9IHN5bWJvbFZhbHVlW3N5bWJvbERlc2NyaXB0aW9uUHJvcGVydHldO1xuICAgIGlmIChkZXNjID09PSB1bmRlZmluZWQpXG4gICAgICBkZXNjID0gJyc7XG4gICAgcmV0dXJuICdTeW1ib2woJyArIGRlc2MgKyAnKSc7XG4gIH0pKTtcbiAgJGRlZmluZVByb3BlcnR5KFN5bWJvbC5wcm90b3R5cGUsICd2YWx1ZU9mJywgbWV0aG9kKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeW1ib2xWYWx1ZSA9IHRoaXNbc3ltYm9sRGF0YVByb3BlcnR5XTtcbiAgICBpZiAoIXN5bWJvbFZhbHVlKVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdDb252ZXJzaW9uIGZyb20gc3ltYm9sIHRvIHN0cmluZycpO1xuICAgIGlmICghZ2V0T3B0aW9uKCdzeW1ib2xzJykpXG4gICAgICByZXR1cm4gc3ltYm9sVmFsdWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgcmV0dXJuIHN5bWJvbFZhbHVlO1xuICB9KSk7XG5cbiAgZnVuY3Rpb24gU3ltYm9sVmFsdWUoZGVzY3JpcHRpb24pIHtcbiAgICB2YXIga2V5ID0gbmV3VW5pcXVlU3RyaW5nKCk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERhdGFQcm9wZXJ0eSwge3ZhbHVlOiB0aGlzfSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbEludGVybmFsUHJvcGVydHksIHt2YWx1ZToga2V5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KHRoaXMsIHN5bWJvbERlc2NyaXB0aW9uUHJvcGVydHksIHt2YWx1ZTogZGVzY3JpcHRpb259KTtcbiAgICAkZnJlZXplKHRoaXMpO1xuICAgIHN5bWJvbFZhbHVlc1trZXldID0gdGhpcztcbiAgfVxuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAnY29uc3RydWN0b3InLCBub25FbnVtKFN5bWJvbCkpO1xuICAkZGVmaW5lUHJvcGVydHkoU3ltYm9sVmFsdWUucHJvdG90eXBlLCAndG9TdHJpbmcnLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRkZWZpbmVQcm9wZXJ0eShTeW1ib2xWYWx1ZS5wcm90b3R5cGUsICd2YWx1ZU9mJywge1xuICAgIHZhbHVlOiBTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG4gICRmcmVlemUoU3ltYm9sVmFsdWUucHJvdG90eXBlKTtcblxuICBTeW1ib2wuaXRlcmF0b3IgPSBTeW1ib2woKTtcblxuICBmdW5jdGlvbiB0b1Byb3BlcnR5KG5hbWUpIHtcbiAgICBpZiAoaXNTeW1ib2wobmFtZSkpXG4gICAgICByZXR1cm4gbmFtZVtzeW1ib2xJbnRlcm5hbFByb3BlcnR5XTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGdldE93blByb3BlcnR5TmFtZXMgdG8gZmlsdGVyIG91dCBwcml2YXRlIG5hbWUga2V5cy5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICB2YXIgbmFtZXMgPSAkZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICBpZiAoIXN5bWJvbFZhbHVlc1tuYW1lXSlcbiAgICAgICAgcnYucHVzaChuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkge1xuICAgIHJldHVybiAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgdmFyIG5hbWVzID0gJGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3ltYm9sID0gc3ltYm9sVmFsdWVzW25hbWVzW2ldXTtcbiAgICAgIGlmIChzeW1ib2wpXG4gICAgICAgIHJ2LnB1c2goc3ltYm9sKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgT2JqZWN0LnByb3RvdHBlLmhhc093blByb3BlcnR5IHRvIGFsd2F5cyByZXR1cm4gZmFsc2UgZm9yXG4gIC8vIHByaXZhdGUgbmFtZXMuXG4gIGZ1bmN0aW9uIGhhc093blByb3BlcnR5KG5hbWUpIHtcbiAgICByZXR1cm4gJGhhc093blByb3BlcnR5LmNhbGwodGhpcywgdG9Qcm9wZXJ0eShuYW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRPcHRpb24obmFtZSkge1xuICAgIHJldHVybiBnbG9iYWwudHJhY2V1ciAmJiBnbG9iYWwudHJhY2V1ci5vcHRpb25zW25hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJvcGVydHkob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBzeW0sIGRlc2M7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICBzeW0gPSBuYW1lO1xuICAgICAgbmFtZSA9IG5hbWVbc3ltYm9sSW50ZXJuYWxQcm9wZXJ0eV07XG4gICAgfVxuICAgIG9iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgIGlmIChzeW0gJiYgKGRlc2MgPSAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgbmFtZSkpKVxuICAgICAgJGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwge2VudW1lcmFibGU6IGZhbHNlfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKSB7XG4gICAgaWYgKGlzU3ltYm9sKG5hbWUpKSB7XG4gICAgICAvLyBTeW1ib2xzIHNob3VsZCBub3QgYmUgZW51bWVyYWJsZS4gV2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgZGVzY3JpcHRvclxuICAgICAgLy8gYmVmb3JlIGNhbGxpbmcgdGhlIG9yaWdpbmFsIGRlZmluZVByb3BlcnR5IGJlY2F1c2UgdGhlIHByb3BlcnR5IG1pZ2h0XG4gICAgICAvLyBiZSBtYWRlIG5vbiBjb25maWd1cmFibGUuXG4gICAgICBpZiAoZGVzY3JpcHRvci5lbnVtZXJhYmxlKSB7XG4gICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuY3JlYXRlKGRlc2NyaXB0b3IsIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB7dmFsdWU6IGZhbHNlfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG5hbWUgPSBuYW1lW3N5bWJvbEludGVybmFsUHJvcGVydHldO1xuICAgIH1cbiAgICAkZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBkZXNjcmlwdG9yKTtcblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbE9iamVjdChPYmplY3QpIHtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZGVmaW5lUHJvcGVydHknLCB7dmFsdWU6IGRlZmluZVByb3BlcnR5fSk7XG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ2dldE93blByb3BlcnR5TmFtZXMnLFxuICAgICAgICAgICAgICAgICAgICB7dmFsdWU6IGdldE93blByb3BlcnR5TmFtZXN9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yJyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3J9KTtcbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ2hhc093blByb3BlcnR5JyxcbiAgICAgICAgICAgICAgICAgICAge3ZhbHVlOiBoYXNPd25Qcm9wZXJ0eX0pO1xuXG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scztcblxuICAgIC8vIE9iamVjdC5pc1xuXG4gICAgLy8gVW5saWtlID09PSB0aGlzIHJldHVybnMgdHJ1ZSBmb3IgKE5hTiwgTmFOKSBhbmQgZmFsc2UgZm9yICgwLCAtMCkuXG4gICAgZnVuY3Rpb24gaXMobGVmdCwgcmlnaHQpIHtcbiAgICAgIGlmIChsZWZ0ID09PSByaWdodClcbiAgICAgICAgcmV0dXJuIGxlZnQgIT09IDAgfHwgMSAvIGxlZnQgPT09IDEgLyByaWdodDtcbiAgICAgIHJldHVybiBsZWZ0ICE9PSBsZWZ0ICYmIHJpZ2h0ICE9PSByaWdodDtcbiAgICB9XG5cbiAgICAkZGVmaW5lUHJvcGVydHkoT2JqZWN0LCAnaXMnLCBtZXRob2QoaXMpKTtcblxuICAgIC8vIE9iamVjdC5hc3NpZ24gKDE5LjEuMy4xKVxuICAgIGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BzW3BdXSA9IHNvdXJjZVtwcm9wc1twXV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgICRkZWZpbmVQcm9wZXJ0eShPYmplY3QsICdhc3NpZ24nLCBtZXRob2QoYXNzaWduKSk7XG5cbiAgICAvLyBPYmplY3QubWl4aW4gKDE5LjEuMy4xNSlcbiAgICBmdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgdmFyIHByb3BzID0gJGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIHZhciBwLCBkZXNjcmlwdG9yLCBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgICBmb3IgKHAgPSAwOyBwIDwgbGVuZ3RoOyBwKyspIHtcbiAgICAgICAgZGVzY3JpcHRvciA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBwcm9wc1twXSk7XG4gICAgICAgICRkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BzW3BdLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJGRlZmluZVByb3BlcnR5KE9iamVjdCwgJ21peGluJywgbWV0aG9kKG1peGluKSk7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5ZmlsbEFycmF5KEFycmF5KSB7XG4gICAgLy8gTWFrZSBhcnJheXMgaXRlcmFibGUuXG4gICAgLy8gVE9ETyhhcnYpOiBUaGlzIGlzIG5vdCB2ZXJ5IHJvYnVzdCB0byBjaGFuZ2VzIGluIHRoZSBwcml2YXRlIG5hbWVzXG4gICAgLy8gb3B0aW9uIGJ1dCBmb3J0dW5hdGVseSB0aGlzIGlzIG5vdCBzb21ldGhpbmcgdGhhdCBpcyBleHBlY3RlZCB0byBjaGFuZ2VcbiAgICAvLyBhdCBydW50aW1lIG91dHNpZGUgb2YgdGVzdHMuXG4gICAgZGVmaW5lUHJvcGVydHkoQXJyYXkucHJvdG90eXBlLCBTeW1ib2wuaXRlcmF0b3IsIG1ldGhvZChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgYXJyYXkgPSB0aGlzO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOiBhcnJheVtpbmRleCsrXSwgZG9uZTogZmFsc2V9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWV9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYW5jZWxsZXJcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBEZWZlcnJlZChjYW5jZWxsZXIpIHtcbiAgICB0aGlzLmNhbmNlbGxlcl8gPSBjYW5jZWxsZXI7XG4gICAgdGhpcy5saXN0ZW5lcnNfID0gW107XG4gIH1cblxuICBmdW5jdGlvbiBub3RpZnkoc2VsZikge1xuICAgIHdoaWxlIChzZWxmLmxpc3RlbmVyc18ubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGN1cnJlbnQgPSBzZWxmLmxpc3RlbmVyc18uc2hpZnQoKTtcbiAgICAgIHZhciBjdXJyZW50UmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2VsZi5yZXN1bHRfWzFdKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5lcnJiYWNrKVxuICAgICAgICAgICAgICBjdXJyZW50UmVzdWx0ID0gY3VycmVudC5lcnJiYWNrLmNhbGwodW5kZWZpbmVkLCBzZWxmLnJlc3VsdF9bMF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5jYWxsYmFjaylcbiAgICAgICAgICAgICAgY3VycmVudFJlc3VsdCA9IGN1cnJlbnQuY2FsbGJhY2suY2FsbCh1bmRlZmluZWQsIHNlbGYucmVzdWx0X1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuY2FsbGJhY2soY3VycmVudFJlc3VsdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGN1cnJlbnQuZGVmZXJyZWQuZXJyYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoICh1bnVzZWQpIHt9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmlyZShzZWxmLCB2YWx1ZSwgaXNFcnJvcikge1xuICAgIGlmIChzZWxmLmZpcmVkXylcbiAgICAgIHRocm93IG5ldyBFcnJvcignYWxyZWFkeSBmaXJlZCcpO1xuXG4gICAgc2VsZi5maXJlZF8gPSB0cnVlO1xuICAgIHNlbGYucmVzdWx0XyA9IFt2YWx1ZSwgaXNFcnJvcl07XG4gICAgbm90aWZ5KHNlbGYpO1xuICB9XG5cbiAgRGVmZXJyZWQucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBEZWZlcnJlZCxcblxuICAgIGZpcmVkXzogZmFsc2UsXG4gICAgcmVzdWx0XzogdW5kZWZpbmVkLFxuXG4gICAgY3JlYXRlUHJvbWlzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge3RoZW46IHRoaXMudGhlbi5iaW5kKHRoaXMpLCBjYW5jZWw6IHRoaXMuY2FuY2VsLmJpbmQodGhpcyl9O1xuICAgIH0sXG5cbiAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZpcmUodGhpcywgdmFsdWUsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgZXJyYmFjazogZnVuY3Rpb24oZXJyKSB7XG4gICAgICBmaXJlKHRoaXMsIGVyciwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHRoZW46IGZ1bmN0aW9uKGNhbGxiYWNrLCBlcnJiYWNrKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IERlZmVycmVkKHRoaXMuY2FuY2VsLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5saXN0ZW5lcnNfLnB1c2goe1xuICAgICAgICBkZWZlcnJlZDogcmVzdWx0LFxuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgIGVycmJhY2s6IGVycmJhY2tcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuZmlyZWRfKVxuICAgICAgICBub3RpZnkodGhpcyk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNyZWF0ZVByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmZpcmVkXylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbHJlYWR5IGZpbmlzaGVkJyk7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgaWYgKHRoaXMuY2FuY2VsbGVyXykge1xuICAgICAgICByZXN1bHQgPSB0aGlzLmNhbmNlbGxlcl8odGhpcyk7XG4gICAgICAgIGlmICghcmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEVycm9yKHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBuZXcgRXJyb3IoJ2NhbmNlbGxlZCcpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmZpcmVkXykge1xuICAgICAgICB0aGlzLnJlc3VsdF8gPSBbcmVzdWx0LCB0cnVlXTtcbiAgICAgICAgbm90aWZ5KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBTeXN0ZW0uZ2V0L3NldCBhbmQgQHRyYWNldXIvbW9kdWxlIGdldHMgb3ZlcnJpZGRlbiBpbiBAdHJhY2V1ci9tb2R1bGVzIHRvXG4gIC8vIGJlIG1vcmUgY29ycmVjdC5cblxuICBmdW5jdGlvbiBNb2R1bGVJbXBsKHVybCwgZnVuYywgc2VsZikge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZnVuYyA9IGZ1bmM7XG4gICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICB0aGlzLnZhbHVlXyA9IG51bGw7XG4gIH1cbiAgTW9kdWxlSW1wbC5wcm90b3R5cGUgPSB7XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgaWYgKHRoaXMudmFsdWVfKVxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZV87XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZV8gPSB0aGlzLmZ1bmMuY2FsbCh0aGlzLnNlbGYpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbW9kdWxlcyA9IHtcbiAgICAnQHRyYWNldXIvbW9kdWxlJzoge1xuICAgICAgTW9kdWxlSW1wbDogTW9kdWxlSW1wbCxcbiAgICAgIHJlZ2lzdGVyTW9kdWxlOiBmdW5jdGlvbih1cmwsIGZ1bmMsIHNlbGYpIHtcbiAgICAgICAgbW9kdWxlc1t1cmxdID0gbmV3IE1vZHVsZUltcGwodXJsLCBmdW5jLCBzZWxmKTtcbiAgICAgIH0sXG4gICAgICBnZXRNb2R1bGVJbXBsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbdXJsXS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIFN5c3RlbSA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBtb2R1bGUgPSBtb2R1bGVzW25hbWVdO1xuICAgICAgaWYgKG1vZHVsZSBpbnN0YW5jZW9mIE1vZHVsZUltcGwpXG4gICAgICAgIHJldHVybiBtb2R1bGVzW25hbWVdID0gbW9kdWxlLnZhbHVlO1xuICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24obmFtZSwgb2JqZWN0KSB7XG4gICAgICBtb2R1bGVzW25hbWVdID0gb2JqZWN0O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBzZXR1cEdsb2JhbHMoZ2xvYmFsKSB7XG4gICAgaWYgKCFnbG9iYWwuU3ltYm9sKVxuICAgICAgZ2xvYmFsLlN5bWJvbCA9IFN5bWJvbDtcbiAgICBpZiAoIWdsb2JhbC5TeW1ib2wuaXRlcmF0b3IpXG4gICAgICBnbG9iYWwuU3ltYm9sLml0ZXJhdG9yID0gU3ltYm9sKCk7XG5cbiAgICBwb2x5ZmlsbFN0cmluZyhnbG9iYWwuU3RyaW5nKTtcbiAgICBwb2x5ZmlsbE9iamVjdChnbG9iYWwuT2JqZWN0KTtcbiAgICBwb2x5ZmlsbEFycmF5KGdsb2JhbC5BcnJheSk7XG4gICAgZ2xvYmFsLlN5c3RlbSA9IFN5c3RlbTtcbiAgICAvLyBUT0RPKGFydik6IERvbid0IGV4cG9ydCB0aGlzLlxuICAgIGdsb2JhbC5EZWZlcnJlZCA9IERlZmVycmVkO1xuICB9XG5cbiAgc2V0dXBHbG9iYWxzKGdsb2JhbCk7XG5cbiAgLy8gVGhpcyBmaWxlIGlzIHNvbWV0aW1lcyB1c2VkIHdpdGhvdXQgdHJhY2V1ci5qcyBzbyBtYWtlIGl0IGEgbmV3IGdsb2JhbC5cbiAgZ2xvYmFsLiR0cmFjZXVyUnVudGltZSA9IHtcbiAgICBEZWZlcnJlZDogRGVmZXJyZWQsXG4gICAgc2V0UHJvcGVydHk6IHNldFByb3BlcnR5LFxuICAgIHNldHVwR2xvYmFsczogc2V0dXBHbG9iYWxzLFxuICAgIHRvUHJvcGVydHk6IHRvUHJvcGVydHksXG4gICAgdHlwZW9mOiB0eXBlT2YsXG4gIH07XG5cbn0pKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcyk7XG4iLCIvKipcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEF1dGhvcjogICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogTGljZW5zZTogIE1JVFxuICpcbiAqIGBucG0gaW5zdGFsbCBidWZmZXJgXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssXG4gICAvLyBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLCBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gIGlmICh0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJylcbiAgICByZXR1cm4gZmFsc2VcblxuICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgYWRkaW5nIHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcz8gSWZcbiAgLy8gbm90LCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydC4gV2UgbmVlZCB0byBiZSBhYmxlIHRvXG4gIC8vIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLlxuICAvLyBSZWxldmFudCBGaXJlZm94IGJ1ZzogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDApXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIEFzc3VtZSBvYmplY3QgaXMgYW4gYXJyYXlcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIHN1YmplY3QgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgLy8gU3BlZWQgb3B0aW1pemF0aW9uIC0tIHVzZSBzZXQgaWYgd2UncmUgY29weWluZyBmcm9tIGEgVWludDhBcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSlcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdFtpXVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbicgK1xuICAgICAgJ2xpc3Qgc2hvdWxkIGJlIGFuIEFycmF5LicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHRvdGFsTGVuZ3RoICE9PSAnbnVtYmVyJykge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBfaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9IGkgKiAyXG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIF91dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gX2FzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kICE9PSB1bmRlZmluZWQpXG4gICAgPyBOdW1iZXIoZW5kKVxuICAgIDogZW5kID0gc2VsZi5sZW5ndGhcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgLy8gY29weSFcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgaSsrKVxuICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIF91dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gX2FzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKVxuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBfYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gX2FzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBfaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpKzFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgdmFyIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgICByZXR1cm4gbmV3QnVmXG4gIH1cbn1cblxuLy8gYGdldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgdmFsID0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICB9IGVsc2Uge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV1cbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDJdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgICB2YWwgfD0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0ICsgM10gPDwgMjQgPj4+IDApXG4gIH0gZWxzZSB7XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMV0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMl0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAzXVxuICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0XSA8PCAyNCA+Pj4gMClcbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICB2YXIgbmVnID0gdGhpc1tvZmZzZXRdICYgMHg4MFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQxNihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MzIoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMDAwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZmZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRmxvYXQgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWREb3VibGUgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWREb3VibGUodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWREb3VibGUodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuXG5cbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbn1cblxuZnVuY3Rpb24gX3dyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAgICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZmZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2YsIC0weDgwKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICB0aGlzLndyaXRlVUludDgodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICB0aGlzLndyaXRlVUludDgoMHhmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmLCAtMHg4MDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQxNihidWYsIDB4ZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQzMihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MzIoYnVmLCAweGZmZmZmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5jaGFyQ29kZUF0KDApXG4gIH1cblxuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpLCAndmFsdWUgaXMgbm90IGEgbnVtYmVyJylcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgdGhpcy5sZW5ndGgsICdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KGVuZCA+PSAwICYmIGVuZCA8PSB0aGlzLmxlbmd0aCwgJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHRoaXNbaV0gPSB2YWx1ZVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG91dCA9IFtdXG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgb3V0W2ldID0gdG9IZXgodGhpc1tpXSlcbiAgICBpZiAoaSA9PT0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUykge1xuICAgICAgb3V0W2kgKyAxXSA9ICcuLi4nXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIG91dC5qb2luKCcgJykgKyAnPidcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSlcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCB0aGUgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5mdW5jdGlvbiBhdWdtZW50IChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCxcbiAgICAgICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBaRVJPICAgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0bW9kdWxlLmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0oKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMCxcbiAgICAgIGQgPSBpc0xFID8gLTEgOiAxLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgYyxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMCksXG4gICAgICBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSksXG4gICAgICBkID0gaXNMRSA/IDEgOiAtMSxcbiAgICAgIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDA7XG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDA7XG4gICAgZSA9IGVNYXg7XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpO1xuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLTtcbiAgICAgIGMgKj0gMjtcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKys7XG4gICAgICBjIC89IDI7XG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSBlICsgZUJpYXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpO1xuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG07XG4gIGVMZW4gKz0gbUxlbjtcbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KTtcblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjg7XG59O1xuIiwidmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlcjtcbnZhciBpbnRTaXplID0gNDtcbnZhciB6ZXJvQnVmZmVyID0gbmV3IEJ1ZmZlcihpbnRTaXplKTsgemVyb0J1ZmZlci5maWxsKDApO1xudmFyIGNocnN6ID0gODtcblxuZnVuY3Rpb24gdG9BcnJheShidWYsIGJpZ0VuZGlhbikge1xuICBpZiAoKGJ1Zi5sZW5ndGggJSBpbnRTaXplKSAhPT0gMCkge1xuICAgIHZhciBsZW4gPSBidWYubGVuZ3RoICsgKGludFNpemUgLSAoYnVmLmxlbmd0aCAlIGludFNpemUpKTtcbiAgICBidWYgPSBCdWZmZXIuY29uY2F0KFtidWYsIHplcm9CdWZmZXJdLCBsZW4pO1xuICB9XG5cbiAgdmFyIGFyciA9IFtdO1xuICB2YXIgZm4gPSBiaWdFbmRpYW4gPyBidWYucmVhZEludDMyQkUgOiBidWYucmVhZEludDMyTEU7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmLmxlbmd0aDsgaSArPSBpbnRTaXplKSB7XG4gICAgYXJyLnB1c2goZm4uY2FsbChidWYsIGkpKTtcbiAgfVxuICByZXR1cm4gYXJyO1xufVxuXG5mdW5jdGlvbiB0b0J1ZmZlcihhcnIsIHNpemUsIGJpZ0VuZGlhbikge1xuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzaXplKTtcbiAgdmFyIGZuID0gYmlnRW5kaWFuID8gYnVmLndyaXRlSW50MzJCRSA6IGJ1Zi53cml0ZUludDMyTEU7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4uY2FsbChidWYsIGFycltpXSwgaSAqIDQsIHRydWUpO1xuICB9XG4gIHJldHVybiBidWY7XG59XG5cbmZ1bmN0aW9uIGhhc2goYnVmLCBmbiwgaGFzaFNpemUsIGJpZ0VuZGlhbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSBidWYgPSBuZXcgQnVmZmVyKGJ1Zik7XG4gIHZhciBhcnIgPSBmbih0b0FycmF5KGJ1ZiwgYmlnRW5kaWFuKSwgYnVmLmxlbmd0aCAqIGNocnN6KTtcbiAgcmV0dXJuIHRvQnVmZmVyKGFyciwgaGFzaFNpemUsIGJpZ0VuZGlhbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBoYXNoOiBoYXNoIH07XG4iLCJ2YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyXG52YXIgc2hhID0gcmVxdWlyZSgnLi9zaGEnKVxudmFyIHNoYTI1NiA9IHJlcXVpcmUoJy4vc2hhMjU2JylcbnZhciBybmcgPSByZXF1aXJlKCcuL3JuZycpXG52YXIgbWQ1ID0gcmVxdWlyZSgnLi9tZDUnKVxuXG52YXIgYWxnb3JpdGhtcyA9IHtcbiAgc2hhMTogc2hhLFxuICBzaGEyNTY6IHNoYTI1NixcbiAgbWQ1OiBtZDVcbn1cblxudmFyIGJsb2Nrc2l6ZSA9IDY0XG52YXIgemVyb0J1ZmZlciA9IG5ldyBCdWZmZXIoYmxvY2tzaXplKTsgemVyb0J1ZmZlci5maWxsKDApXG5mdW5jdGlvbiBobWFjKGZuLCBrZXksIGRhdGEpIHtcbiAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihrZXkpKSBrZXkgPSBuZXcgQnVmZmVyKGtleSlcbiAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSkgZGF0YSA9IG5ldyBCdWZmZXIoZGF0YSlcblxuICBpZihrZXkubGVuZ3RoID4gYmxvY2tzaXplKSB7XG4gICAga2V5ID0gZm4oa2V5KVxuICB9IGVsc2UgaWYoa2V5Lmxlbmd0aCA8IGJsb2Nrc2l6ZSkge1xuICAgIGtleSA9IEJ1ZmZlci5jb25jYXQoW2tleSwgemVyb0J1ZmZlcl0sIGJsb2Nrc2l6ZSlcbiAgfVxuXG4gIHZhciBpcGFkID0gbmV3IEJ1ZmZlcihibG9ja3NpemUpLCBvcGFkID0gbmV3IEJ1ZmZlcihibG9ja3NpemUpXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBibG9ja3NpemU7IGkrKykge1xuICAgIGlwYWRbaV0gPSBrZXlbaV0gXiAweDM2XG4gICAgb3BhZFtpXSA9IGtleVtpXSBeIDB4NUNcbiAgfVxuXG4gIHZhciBoYXNoID0gZm4oQnVmZmVyLmNvbmNhdChbaXBhZCwgZGF0YV0pKVxuICByZXR1cm4gZm4oQnVmZmVyLmNvbmNhdChbb3BhZCwgaGFzaF0pKVxufVxuXG5mdW5jdGlvbiBoYXNoKGFsZywga2V5KSB7XG4gIGFsZyA9IGFsZyB8fCAnc2hhMSdcbiAgdmFyIGZuID0gYWxnb3JpdGhtc1thbGddXG4gIHZhciBidWZzID0gW11cbiAgdmFyIGxlbmd0aCA9IDBcbiAgaWYoIWZuKSBlcnJvcignYWxnb3JpdGhtOicsIGFsZywgJ2lzIG5vdCB5ZXQgc3VwcG9ydGVkJylcbiAgcmV0dXJuIHtcbiAgICB1cGRhdGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBpZighQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSBkYXRhID0gbmV3IEJ1ZmZlcihkYXRhKVxuICAgICAgICBcbiAgICAgIGJ1ZnMucHVzaChkYXRhKVxuICAgICAgbGVuZ3RoICs9IGRhdGEubGVuZ3RoXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0sXG4gICAgZGlnZXN0OiBmdW5jdGlvbiAoZW5jKSB7XG4gICAgICB2YXIgYnVmID0gQnVmZmVyLmNvbmNhdChidWZzKVxuICAgICAgdmFyIHIgPSBrZXkgPyBobWFjKGZuLCBrZXksIGJ1ZikgOiBmbihidWYpXG4gICAgICBidWZzID0gbnVsbFxuICAgICAgcmV0dXJuIGVuYyA/IHIudG9TdHJpbmcoZW5jKSA6IHJcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXJyb3IgKCkge1xuICB2YXIgbSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5qb2luKCcgJylcbiAgdGhyb3cgbmV3IEVycm9yKFtcbiAgICBtLFxuICAgICd3ZSBhY2NlcHQgcHVsbCByZXF1ZXN0cycsXG4gICAgJ2h0dHA6Ly9naXRodWIuY29tL2RvbWluaWN0YXJyL2NyeXB0by1icm93c2VyaWZ5J1xuICAgIF0uam9pbignXFxuJykpXG59XG5cbmV4cG9ydHMuY3JlYXRlSGFzaCA9IGZ1bmN0aW9uIChhbGcpIHsgcmV0dXJuIGhhc2goYWxnKSB9XG5leHBvcnRzLmNyZWF0ZUhtYWMgPSBmdW5jdGlvbiAoYWxnLCBrZXkpIHsgcmV0dXJuIGhhc2goYWxnLCBrZXkpIH1cbmV4cG9ydHMucmFuZG9tQnl0ZXMgPSBmdW5jdGlvbihzaXplLCBjYWxsYmFjaykge1xuICBpZiAoY2FsbGJhY2sgJiYgY2FsbGJhY2suY2FsbCkge1xuICAgIHRyeSB7XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIHVuZGVmaW5lZCwgbmV3IEJ1ZmZlcihybmcoc2l6ZSkpKVxuICAgIH0gY2F0Y2ggKGVycikgeyBjYWxsYmFjayhlcnIpIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihybmcoc2l6ZSkpXG4gIH1cbn1cblxuZnVuY3Rpb24gZWFjaChhLCBmKSB7XG4gIGZvcih2YXIgaSBpbiBhKVxuICAgIGYoYVtpXSwgaSlcbn1cblxuLy8gdGhlIGxlYXN0IEkgY2FuIGRvIGlzIG1ha2UgZXJyb3IgbWVzc2FnZXMgZm9yIHRoZSByZXN0IG9mIHRoZSBub2RlLmpzL2NyeXB0byBhcGkuXG5lYWNoKFsnY3JlYXRlQ3JlZGVudGlhbHMnXG4sICdjcmVhdGVDaXBoZXInXG4sICdjcmVhdGVDaXBoZXJpdidcbiwgJ2NyZWF0ZURlY2lwaGVyJ1xuLCAnY3JlYXRlRGVjaXBoZXJpdidcbiwgJ2NyZWF0ZVNpZ24nXG4sICdjcmVhdGVWZXJpZnknXG4sICdjcmVhdGVEaWZmaWVIZWxsbWFuJ1xuLCAncGJrZGYyJ10sIGZ1bmN0aW9uIChuYW1lKSB7XG4gIGV4cG9ydHNbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgZXJyb3IoJ3NvcnJ5LCcsIG5hbWUsICdpcyBub3QgaW1wbGVtZW50ZWQgeWV0JylcbiAgfVxufSlcbiIsIi8qXHJcbiAqIEEgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgUlNBIERhdGEgU2VjdXJpdHksIEluYy4gTUQ1IE1lc3NhZ2VcclxuICogRGlnZXN0IEFsZ29yaXRobSwgYXMgZGVmaW5lZCBpbiBSRkMgMTMyMS5cclxuICogVmVyc2lvbiAyLjEgQ29weXJpZ2h0IChDKSBQYXVsIEpvaG5zdG9uIDE5OTkgLSAyMDAyLlxyXG4gKiBPdGhlciBjb250cmlidXRvcnM6IEdyZWcgSG9sdCwgQW5kcmV3IEtlcGVydCwgWWRuYXIsIExvc3RpbmV0XHJcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZVxyXG4gKiBTZWUgaHR0cDovL3BhamhvbWUub3JnLnVrL2NyeXB0L21kNSBmb3IgbW9yZSBpbmZvLlxyXG4gKi9cclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XHJcblxyXG4vKlxyXG4gKiBQZXJmb3JtIGEgc2ltcGxlIHNlbGYtdGVzdCB0byBzZWUgaWYgdGhlIFZNIGlzIHdvcmtpbmdcclxuICovXHJcbmZ1bmN0aW9uIG1kNV92bV90ZXN0KClcclxue1xyXG4gIHJldHVybiBoZXhfbWQ1KFwiYWJjXCIpID09IFwiOTAwMTUwOTgzY2QyNGZiMGQ2OTYzZjdkMjhlMTdmNzJcIjtcclxufVxyXG5cclxuLypcclxuICogQ2FsY3VsYXRlIHRoZSBNRDUgb2YgYW4gYXJyYXkgb2YgbGl0dGxlLWVuZGlhbiB3b3JkcywgYW5kIGEgYml0IGxlbmd0aFxyXG4gKi9cclxuZnVuY3Rpb24gY29yZV9tZDUoeCwgbGVuKVxyXG57XHJcbiAgLyogYXBwZW5kIHBhZGRpbmcgKi9cclxuICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgobGVuKSAlIDMyKTtcclxuICB4WygoKGxlbiArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBsZW47XHJcblxyXG4gIHZhciBhID0gIDE3MzI1ODQxOTM7XHJcbiAgdmFyIGIgPSAtMjcxNzMzODc5O1xyXG4gIHZhciBjID0gLTE3MzI1ODQxOTQ7XHJcbiAgdmFyIGQgPSAgMjcxNzMzODc4O1xyXG5cclxuICBmb3IodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpXHJcbiAge1xyXG4gICAgdmFyIG9sZGEgPSBhO1xyXG4gICAgdmFyIG9sZGIgPSBiO1xyXG4gICAgdmFyIG9sZGMgPSBjO1xyXG4gICAgdmFyIG9sZGQgPSBkO1xyXG5cclxuICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpKyAwXSwgNyAsIC02ODA4NzY5MzYpO1xyXG4gICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2krIDFdLCAxMiwgLTM4OTU2NDU4Nik7XHJcbiAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSsgMl0sIDE3LCAgNjA2MTA1ODE5KTtcclxuICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKTtcclxuICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpKyA0XSwgNyAsIC0xNzY0MTg4OTcpO1xyXG4gICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2krIDVdLCAxMiwgIDEyMDAwODA0MjYpO1xyXG4gICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2krIDZdLCAxNywgLTE0NzMyMzEzNDEpO1xyXG4gICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2krIDddLCAyMiwgLTQ1NzA1OTgzKTtcclxuICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpKyA4XSwgNyAsICAxNzcwMDM1NDE2KTtcclxuICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpKyA5XSwgMTIsIC0xOTU4NDE0NDE3KTtcclxuICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpKzEwXSwgMTcsIC00MjA2Myk7XHJcbiAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSsxMV0sIDIyLCAtMTk5MDQwNDE2Mik7XHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsxMl0sIDcgLCAgMTgwNDYwMzY4Mik7XHJcbiAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSsxM10sIDEyLCAtNDAzNDExMDEpO1xyXG4gICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2krMTRdLCAxNywgLTE1MDIwMDIyOTApO1xyXG4gICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2krMTVdLCAyMiwgIDEyMzY1MzUzMjkpO1xyXG5cclxuICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpKyAxXSwgNSAsIC0xNjU3OTY1MTApO1xyXG4gICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2krIDZdLCA5ICwgLTEwNjk1MDE2MzIpO1xyXG4gICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2krMTFdLCAxNCwgIDY0MzcxNzcxMyk7XHJcbiAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSsgMF0sIDIwLCAtMzczODk3MzAyKTtcclxuICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpKyA1XSwgNSAsIC03MDE1NTg2OTEpO1xyXG4gICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2krMTBdLCA5ICwgIDM4MDE2MDgzKTtcclxuICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpKzE1XSwgMTQsIC02NjA0NzgzMzUpO1xyXG4gICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2krIDRdLCAyMCwgLTQwNTUzNzg0OCk7XHJcbiAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSsgOV0sIDUgLCAgNTY4NDQ2NDM4KTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKzE0XSwgOSAsIC0xMDE5ODAzNjkwKTtcclxuICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpKyAzXSwgMTQsIC0xODczNjM5NjEpO1xyXG4gICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2krIDhdLCAyMCwgIDExNjM1MzE1MDEpO1xyXG4gICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2krMTNdLCA1ICwgLTE0NDQ2ODE0NjcpO1xyXG4gICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2krIDJdLCA5ICwgLTUxNDAzNzg0KTtcclxuICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpKyA3XSwgMTQsICAxNzM1MzI4NDczKTtcclxuICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpKzEyXSwgMjAsIC0xOTI2NjA3NzM0KTtcclxuXHJcbiAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSsgNV0sIDQgLCAtMzc4NTU4KTtcclxuICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpKyA4XSwgMTEsIC0yMDIyNTc0NDYzKTtcclxuICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpKzExXSwgMTYsICAxODM5MDMwNTYyKTtcclxuICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpKzE0XSwgMjMsIC0zNTMwOTU1Nik7XHJcbiAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSsgMV0sIDQgLCAtMTUzMDk5MjA2MCk7XHJcbiAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSsgNF0sIDExLCAgMTI3Mjg5MzM1Myk7XHJcbiAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSsgN10sIDE2LCAtMTU1NDk3NjMyKTtcclxuICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpKzEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcclxuICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpKzEzXSwgNCAsICA2ODEyNzkxNzQpO1xyXG4gICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2krIDBdLCAxMSwgLTM1ODUzNzIyMik7XHJcbiAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSsgM10sIDE2LCAtNzIyNTIxOTc5KTtcclxuICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpKyA2XSwgMjMsICA3NjAyOTE4OSk7XHJcbiAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSsgOV0sIDQgLCAtNjQwMzY0NDg3KTtcclxuICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpKzEyXSwgMTEsIC00MjE4MTU4MzUpO1xyXG4gICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2krMTVdLCAxNiwgIDUzMDc0MjUyMCk7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsgMl0sIDIzLCAtOTk1MzM4NjUxKTtcclxuXHJcbiAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSsgMF0sIDYgLCAtMTk4NjMwODQ0KTtcclxuICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpKyA3XSwgMTAsICAxMTI2ODkxNDE1KTtcclxuICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpKzE0XSwgMTUsIC0xNDE2MzU0OTA1KTtcclxuICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpKyA1XSwgMjEsIC01NzQzNDA1NSk7XHJcbiAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSsxMl0sIDYgLCAgMTcwMDQ4NTU3MSk7XHJcbiAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSsgM10sIDEwLCAtMTg5NDk4NjYwNik7XHJcbiAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSsxMF0sIDE1LCAtMTA1MTUyMyk7XHJcbiAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSsgMV0sIDIxLCAtMjA1NDkyMjc5OSk7XHJcbiAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSsgOF0sIDYgLCAgMTg3MzMxMzM1OSk7XHJcbiAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSsxNV0sIDEwLCAtMzA2MTE3NDQpO1xyXG4gICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2krIDZdLCAxNSwgLTE1NjAxOTgzODApO1xyXG4gICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2krMTNdLCAyMSwgIDEzMDkxNTE2NDkpO1xyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krIDRdLCA2ICwgLTE0NTUyMzA3MCk7XHJcbiAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSsxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XHJcbiAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSsgMl0sIDE1LCAgNzE4Nzg3MjU5KTtcclxuICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpKyA5XSwgMjEsIC0zNDM0ODU1NTEpO1xyXG5cclxuICAgIGEgPSBzYWZlX2FkZChhLCBvbGRhKTtcclxuICAgIGIgPSBzYWZlX2FkZChiLCBvbGRiKTtcclxuICAgIGMgPSBzYWZlX2FkZChjLCBvbGRjKTtcclxuICAgIGQgPSBzYWZlX2FkZChkLCBvbGRkKTtcclxuICB9XHJcbiAgcmV0dXJuIEFycmF5KGEsIGIsIGMsIGQpO1xyXG5cclxufVxyXG5cclxuLypcclxuICogVGhlc2UgZnVuY3Rpb25zIGltcGxlbWVudCB0aGUgZm91ciBiYXNpYyBvcGVyYXRpb25zIHRoZSBhbGdvcml0aG0gdXNlcy5cclxuICovXHJcbmZ1bmN0aW9uIG1kNV9jbW4ocSwgYSwgYiwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBzYWZlX2FkZChiaXRfcm9sKHNhZmVfYWRkKHNhZmVfYWRkKGEsIHEpLCBzYWZlX2FkZCh4LCB0KSksIHMpLGIpO1xyXG59XHJcbmZ1bmN0aW9uIG1kNV9mZihhLCBiLCBjLCBkLCB4LCBzLCB0KVxyXG57XHJcbiAgcmV0dXJuIG1kNV9jbW4oKGIgJiBjKSB8ICgofmIpICYgZCksIGEsIGIsIHgsIHMsIHQpO1xyXG59XHJcbmZ1bmN0aW9uIG1kNV9nZyhhLCBiLCBjLCBkLCB4LCBzLCB0KVxyXG57XHJcbiAgcmV0dXJuIG1kNV9jbW4oKGIgJiBkKSB8IChjICYgKH5kKSksIGEsIGIsIHgsIHMsIHQpO1xyXG59XHJcbmZ1bmN0aW9uIG1kNV9oaChhLCBiLCBjLCBkLCB4LCBzLCB0KVxyXG57XHJcbiAgcmV0dXJuIG1kNV9jbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5mdW5jdGlvbiBtZDVfaWkoYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKGMgXiAoYiB8ICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5cclxuLypcclxuICogQWRkIGludGVnZXJzLCB3cmFwcGluZyBhdCAyXjMyLiBUaGlzIHVzZXMgMTYtYml0IG9wZXJhdGlvbnMgaW50ZXJuYWxseVxyXG4gKiB0byB3b3JrIGFyb3VuZCBidWdzIGluIHNvbWUgSlMgaW50ZXJwcmV0ZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2FmZV9hZGQoeCwgeSlcclxue1xyXG4gIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XHJcbiAgdmFyIG1zdyA9ICh4ID4+IDE2KSArICh5ID4+IDE2KSArIChsc3cgPj4gMTYpO1xyXG4gIHJldHVybiAobXN3IDw8IDE2KSB8IChsc3cgJiAweEZGRkYpO1xyXG59XHJcblxyXG4vKlxyXG4gKiBCaXR3aXNlIHJvdGF0ZSBhIDMyLWJpdCBudW1iZXIgdG8gdGhlIGxlZnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBiaXRfcm9sKG51bSwgY250KVxyXG57XHJcbiAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1kNShidWYpIHtcclxuICByZXR1cm4gaGVscGVycy5oYXNoKGJ1ZiwgY29yZV9tZDUsIDE2KTtcclxufTtcclxuIiwiLy8gT3JpZ2luYWwgY29kZSBhZGFwdGVkIGZyb20gUm9iZXJ0IEtpZWZmZXIuXG4vLyBkZXRhaWxzIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBfZ2xvYmFsID0gdGhpcztcblxuICB2YXIgbWF0aFJORywgd2hhdHdnUk5HO1xuXG4gIC8vIE5PVEU6IE1hdGgucmFuZG9tKCkgZG9lcyBub3QgZ3VhcmFudGVlIFwiY3J5cHRvZ3JhcGhpYyBxdWFsaXR5XCJcbiAgbWF0aFJORyA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICB2YXIgYnl0ZXMgPSBuZXcgQXJyYXkoc2l6ZSk7XG4gICAgdmFyIHI7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IHNpemU7IGkrKykge1xuICAgICAgaWYgKChpICYgMHgwMykgPT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIGJ5dGVzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIGlmIChfZ2xvYmFsLmNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgd2hhdHdnUk5HID0gZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XG4gICAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGJ5dGVzKTtcbiAgICAgIHJldHVybiBieXRlcztcbiAgICB9XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHdoYXR3Z1JORyB8fCBtYXRoUk5HO1xuXG59KCkpXG4iLCIvKlxuICogQSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBTZWN1cmUgSGFzaCBBbGdvcml0aG0sIFNIQS0xLCBhcyBkZWZpbmVkXG4gKiBpbiBGSVBTIFBVQiAxODAtMVxuICogVmVyc2lvbiAyLjFhIENvcHlyaWdodCBQYXVsIEpvaG5zdG9uIDIwMDAgLSAyMDAyLlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBMaWNlbnNlXG4gKiBTZWUgaHR0cDovL3BhamhvbWUub3JnLnVrL2NyeXB0L21kNSBmb3IgZGV0YWlscy5cbiAqL1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuXG4vKlxuICogQ2FsY3VsYXRlIHRoZSBTSEEtMSBvZiBhbiBhcnJheSBvZiBiaWctZW5kaWFuIHdvcmRzLCBhbmQgYSBiaXQgbGVuZ3RoXG4gKi9cbmZ1bmN0aW9uIGNvcmVfc2hhMSh4LCBsZW4pXG57XG4gIC8qIGFwcGVuZCBwYWRkaW5nICovXG4gIHhbbGVuID4+IDVdIHw9IDB4ODAgPDwgKDI0IC0gbGVuICUgMzIpO1xuICB4WygobGVuICsgNjQgPj4gOSkgPDwgNCkgKyAxNV0gPSBsZW47XG5cbiAgdmFyIHcgPSBBcnJheSg4MCk7XG4gIHZhciBhID0gIDE3MzI1ODQxOTM7XG4gIHZhciBiID0gLTI3MTczMzg3OTtcbiAgdmFyIGMgPSAtMTczMjU4NDE5NDtcbiAgdmFyIGQgPSAgMjcxNzMzODc4O1xuICB2YXIgZSA9IC0xMDA5NTg5Nzc2O1xuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSArPSAxNilcbiAge1xuICAgIHZhciBvbGRhID0gYTtcbiAgICB2YXIgb2xkYiA9IGI7XG4gICAgdmFyIG9sZGMgPSBjO1xuICAgIHZhciBvbGRkID0gZDtcbiAgICB2YXIgb2xkZSA9IGU7XG5cbiAgICBmb3IodmFyIGogPSAwOyBqIDwgODA7IGorKylcbiAgICB7XG4gICAgICBpZihqIDwgMTYpIHdbal0gPSB4W2kgKyBqXTtcbiAgICAgIGVsc2Ugd1tqXSA9IHJvbCh3W2otM10gXiB3W2otOF0gXiB3W2otMTRdIF4gd1tqLTE2XSwgMSk7XG4gICAgICB2YXIgdCA9IHNhZmVfYWRkKHNhZmVfYWRkKHJvbChhLCA1KSwgc2hhMV9mdChqLCBiLCBjLCBkKSksXG4gICAgICAgICAgICAgICAgICAgICAgIHNhZmVfYWRkKHNhZmVfYWRkKGUsIHdbal0pLCBzaGExX2t0KGopKSk7XG4gICAgICBlID0gZDtcbiAgICAgIGQgPSBjO1xuICAgICAgYyA9IHJvbChiLCAzMCk7XG4gICAgICBiID0gYTtcbiAgICAgIGEgPSB0O1xuICAgIH1cblxuICAgIGEgPSBzYWZlX2FkZChhLCBvbGRhKTtcbiAgICBiID0gc2FmZV9hZGQoYiwgb2xkYik7XG4gICAgYyA9IHNhZmVfYWRkKGMsIG9sZGMpO1xuICAgIGQgPSBzYWZlX2FkZChkLCBvbGRkKTtcbiAgICBlID0gc2FmZV9hZGQoZSwgb2xkZSk7XG4gIH1cbiAgcmV0dXJuIEFycmF5KGEsIGIsIGMsIGQsIGUpO1xuXG59XG5cbi8qXG4gKiBQZXJmb3JtIHRoZSBhcHByb3ByaWF0ZSB0cmlwbGV0IGNvbWJpbmF0aW9uIGZ1bmN0aW9uIGZvciB0aGUgY3VycmVudFxuICogaXRlcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHNoYTFfZnQodCwgYiwgYywgZClcbntcbiAgaWYodCA8IDIwKSByZXR1cm4gKGIgJiBjKSB8ICgofmIpICYgZCk7XG4gIGlmKHQgPCA0MCkgcmV0dXJuIGIgXiBjIF4gZDtcbiAgaWYodCA8IDYwKSByZXR1cm4gKGIgJiBjKSB8IChiICYgZCkgfCAoYyAmIGQpO1xuICByZXR1cm4gYiBeIGMgXiBkO1xufVxuXG4vKlxuICogRGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSBhZGRpdGl2ZSBjb25zdGFudCBmb3IgdGhlIGN1cnJlbnQgaXRlcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHNoYTFfa3QodClcbntcbiAgcmV0dXJuICh0IDwgMjApID8gIDE1MTg1MDAyNDkgOiAodCA8IDQwKSA/ICAxODU5Nzc1MzkzIDpcbiAgICAgICAgICh0IDwgNjApID8gLTE4OTQwMDc1ODggOiAtODk5NDk3NTE0O1xufVxuXG4vKlxuICogQWRkIGludGVnZXJzLCB3cmFwcGluZyBhdCAyXjMyLiBUaGlzIHVzZXMgMTYtYml0IG9wZXJhdGlvbnMgaW50ZXJuYWxseVxuICogdG8gd29yayBhcm91bmQgYnVncyBpbiBzb21lIEpTIGludGVycHJldGVycy5cbiAqL1xuZnVuY3Rpb24gc2FmZV9hZGQoeCwgeSlcbntcbiAgdmFyIGxzdyA9ICh4ICYgMHhGRkZGKSArICh5ICYgMHhGRkZGKTtcbiAgdmFyIG1zdyA9ICh4ID4+IDE2KSArICh5ID4+IDE2KSArIChsc3cgPj4gMTYpO1xuICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcbn1cblxuLypcbiAqIEJpdHdpc2Ugcm90YXRlIGEgMzItYml0IG51bWJlciB0byB0aGUgbGVmdC5cbiAqL1xuZnVuY3Rpb24gcm9sKG51bSwgY250KVxue1xuICByZXR1cm4gKG51bSA8PCBjbnQpIHwgKG51bSA+Pj4gKDMyIC0gY250KSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2hhMShidWYpIHtcbiAgcmV0dXJuIGhlbHBlcnMuaGFzaChidWYsIGNvcmVfc2hhMSwgMjAsIHRydWUpO1xufTtcbiIsIlxuLyoqXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFNlY3VyZSBIYXNoIEFsZ29yaXRobSwgU0hBLTI1NiwgYXMgZGVmaW5lZFxuICogaW4gRklQUyAxODAtMlxuICogVmVyc2lvbiAyLjItYmV0YSBDb3B5cmlnaHQgQW5nZWwgTWFyaW4sIFBhdWwgSm9obnN0b24gMjAwMCAtIDIwMDkuXG4gKiBPdGhlciBjb250cmlidXRvcnM6IEdyZWcgSG9sdCwgQW5kcmV3IEtlcGVydCwgWWRuYXIsIExvc3RpbmV0XG4gKlxuICovXG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbnZhciBzYWZlX2FkZCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdmFyIGxzdyA9ICh4ICYgMHhGRkZGKSArICh5ICYgMHhGRkZGKTtcbiAgdmFyIG1zdyA9ICh4ID4+IDE2KSArICh5ID4+IDE2KSArIChsc3cgPj4gMTYpO1xuICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcbn07XG5cbnZhciBTID0gZnVuY3Rpb24oWCwgbikge1xuICByZXR1cm4gKFggPj4+IG4pIHwgKFggPDwgKDMyIC0gbikpO1xufTtcblxudmFyIFIgPSBmdW5jdGlvbihYLCBuKSB7XG4gIHJldHVybiAoWCA+Pj4gbik7XG59O1xuXG52YXIgQ2ggPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiAoKHggJiB5KSBeICgofngpICYgeikpO1xufTtcblxudmFyIE1haiA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgcmV0dXJuICgoeCAmIHkpIF4gKHggJiB6KSBeICh5ICYgeikpO1xufTtcblxudmFyIFNpZ21hMDI1NiA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIChTKHgsIDIpIF4gUyh4LCAxMykgXiBTKHgsIDIyKSk7XG59O1xuXG52YXIgU2lnbWExMjU2ID0gZnVuY3Rpb24oeCkge1xuICByZXR1cm4gKFMoeCwgNikgXiBTKHgsIDExKSBeIFMoeCwgMjUpKTtcbn07XG5cbnZhciBHYW1tYTAyNTYgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiAoUyh4LCA3KSBeIFMoeCwgMTgpIF4gUih4LCAzKSk7XG59O1xuXG52YXIgR2FtbWExMjU2ID0gZnVuY3Rpb24oeCkge1xuICByZXR1cm4gKFMoeCwgMTcpIF4gUyh4LCAxOSkgXiBSKHgsIDEwKSk7XG59O1xuXG52YXIgY29yZV9zaGEyNTYgPSBmdW5jdGlvbihtLCBsKSB7XG4gIHZhciBLID0gbmV3IEFycmF5KDB4NDI4QTJGOTgsMHg3MTM3NDQ5MSwweEI1QzBGQkNGLDB4RTlCNURCQTUsMHgzOTU2QzI1QiwweDU5RjExMUYxLDB4OTIzRjgyQTQsMHhBQjFDNUVENSwweEQ4MDdBQTk4LDB4MTI4MzVCMDEsMHgyNDMxODVCRSwweDU1MEM3REMzLDB4NzJCRTVENzQsMHg4MERFQjFGRSwweDlCREMwNkE3LDB4QzE5QkYxNzQsMHhFNDlCNjlDMSwweEVGQkU0Nzg2LDB4RkMxOURDNiwweDI0MENBMUNDLDB4MkRFOTJDNkYsMHg0QTc0ODRBQSwweDVDQjBBOURDLDB4NzZGOTg4REEsMHg5ODNFNTE1MiwweEE4MzFDNjZELDB4QjAwMzI3QzgsMHhCRjU5N0ZDNywweEM2RTAwQkYzLDB4RDVBNzkxNDcsMHg2Q0E2MzUxLDB4MTQyOTI5NjcsMHgyN0I3MEE4NSwweDJFMUIyMTM4LDB4NEQyQzZERkMsMHg1MzM4MEQxMywweDY1MEE3MzU0LDB4NzY2QTBBQkIsMHg4MUMyQzkyRSwweDkyNzIyQzg1LDB4QTJCRkU4QTEsMHhBODFBNjY0QiwweEMyNEI4QjcwLDB4Qzc2QzUxQTMsMHhEMTkyRTgxOSwweEQ2OTkwNjI0LDB4RjQwRTM1ODUsMHgxMDZBQTA3MCwweDE5QTRDMTE2LDB4MUUzNzZDMDgsMHgyNzQ4Nzc0QywweDM0QjBCQ0I1LDB4MzkxQzBDQjMsMHg0RUQ4QUE0QSwweDVCOUNDQTRGLDB4NjgyRTZGRjMsMHg3NDhGODJFRSwweDc4QTU2MzZGLDB4ODRDODc4MTQsMHg4Q0M3MDIwOCwweDkwQkVGRkZBLDB4QTQ1MDZDRUIsMHhCRUY5QTNGNywweEM2NzE3OEYyKTtcbiAgdmFyIEhBU0ggPSBuZXcgQXJyYXkoMHg2QTA5RTY2NywgMHhCQjY3QUU4NSwgMHgzQzZFRjM3MiwgMHhBNTRGRjUzQSwgMHg1MTBFNTI3RiwgMHg5QjA1Njg4QywgMHgxRjgzRDlBQiwgMHg1QkUwQ0QxOSk7XG4gICAgdmFyIFcgPSBuZXcgQXJyYXkoNjQpO1xuICAgIHZhciBhLCBiLCBjLCBkLCBlLCBmLCBnLCBoLCBpLCBqO1xuICAgIHZhciBUMSwgVDI7XG4gIC8qIGFwcGVuZCBwYWRkaW5nICovXG4gIG1bbCA+PiA1XSB8PSAweDgwIDw8ICgyNCAtIGwgJSAzMik7XG4gIG1bKChsICsgNjQgPj4gOSkgPDwgNCkgKyAxNV0gPSBsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG0ubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgYSA9IEhBU0hbMF07IGIgPSBIQVNIWzFdOyBjID0gSEFTSFsyXTsgZCA9IEhBU0hbM107IGUgPSBIQVNIWzRdOyBmID0gSEFTSFs1XTsgZyA9IEhBU0hbNl07IGggPSBIQVNIWzddO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgaWYgKGogPCAxNikge1xuICAgICAgICBXW2pdID0gbVtqICsgaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBXW2pdID0gc2FmZV9hZGQoc2FmZV9hZGQoc2FmZV9hZGQoR2FtbWExMjU2KFdbaiAtIDJdKSwgV1tqIC0gN10pLCBHYW1tYTAyNTYoV1tqIC0gMTVdKSksIFdbaiAtIDE2XSk7XG4gICAgICB9XG4gICAgICBUMSA9IHNhZmVfYWRkKHNhZmVfYWRkKHNhZmVfYWRkKHNhZmVfYWRkKGgsIFNpZ21hMTI1NihlKSksIENoKGUsIGYsIGcpKSwgS1tqXSksIFdbal0pO1xuICAgICAgVDIgPSBzYWZlX2FkZChTaWdtYTAyNTYoYSksIE1haihhLCBiLCBjKSk7XG4gICAgICBoID0gZzsgZyA9IGY7IGYgPSBlOyBlID0gc2FmZV9hZGQoZCwgVDEpOyBkID0gYzsgYyA9IGI7IGIgPSBhOyBhID0gc2FmZV9hZGQoVDEsIFQyKTtcbiAgICB9XG4gICAgSEFTSFswXSA9IHNhZmVfYWRkKGEsIEhBU0hbMF0pOyBIQVNIWzFdID0gc2FmZV9hZGQoYiwgSEFTSFsxXSk7IEhBU0hbMl0gPSBzYWZlX2FkZChjLCBIQVNIWzJdKTsgSEFTSFszXSA9IHNhZmVfYWRkKGQsIEhBU0hbM10pO1xuICAgIEhBU0hbNF0gPSBzYWZlX2FkZChlLCBIQVNIWzRdKTsgSEFTSFs1XSA9IHNhZmVfYWRkKGYsIEhBU0hbNV0pOyBIQVNIWzZdID0gc2FmZV9hZGQoZywgSEFTSFs2XSk7IEhBU0hbN10gPSBzYWZlX2FkZChoLCBIQVNIWzddKTtcbiAgfVxuICByZXR1cm4gSEFTSDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2hhMjU2KGJ1Zikge1xuICByZXR1cm4gaGVscGVycy5oYXNoKGJ1ZiwgY29yZV9zaGEyNTYsIDMyLCB0cnVlKTtcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKEJ1ZmZlcil7XG52YXIgWmxpYiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi96bGliJyk7XG5cbi8vIHRoZSBsZWFzdCBJIGNhbiBkbyBpcyBtYWtlIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgcmVzdCBvZiB0aGUgbm9kZS5qcy96bGliIGFwaS5cbi8vICh0aGFua3MsIGRvbWluaWN0YXJyKVxuZnVuY3Rpb24gZXJyb3IgKCkge1xuICB2YXIgbSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5qb2luKCcgJylcbiAgdGhyb3cgbmV3IEVycm9yKFtcbiAgICBtLFxuICAgICd3ZSBhY2NlcHQgcHVsbCByZXF1ZXN0cycsXG4gICAgJ2h0dHA6Ly9naXRodWIuY29tL2JyaWFubG92ZXN3b3Jkcy96bGliLWJyb3dzZXJpZnknXG4gICAgXS5qb2luKCdcXG4nKSlcbn1cblxuO1snY3JlYXRlR3ppcCdcbiwgJ2NyZWF0ZUd1bnppcCdcbiwgJ2NyZWF0ZURlZmxhdGUnXG4sICdjcmVhdGVEZWZsYXRlUmF3J1xuLCAnY3JlYXRlSW5mbGF0ZSdcbiwgJ2NyZWF0ZUluZmxhdGVSYXcnXG4sICdjcmVhdGVVbnppcCdcbiwgJ0d6aXAnXG4sICdHdW56aXAnXG4sICdJbmZsYXRlJ1xuLCAnSW5mbGF0ZVJhdydcbiwgJ0RlZmxhdGUnXG4sICdEZWZsYXRlUmF3J1xuLCAnVW56aXAnXG4sICdpbmZsYXRlUmF3J1xuLCAnZGVmbGF0ZVJhdyddLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgWmxpYltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICBlcnJvcignc29ycnksJywgbmFtZSwgJ2lzIG5vdCBpbXBsZW1lbnRlZCB5ZXQnKVxuICB9XG59KTtcblxudmFyIF9kZWZsYXRlID0gWmxpYi5kZWZsYXRlO1xudmFyIF9nemlwID0gWmxpYi5nemlwO1xuXG5abGliLmRlZmxhdGUgPSBmdW5jdGlvbiBkZWZsYXRlKHN0cmluZ09yQnVmZmVyLCBjYWxsYmFjaykge1xuICByZXR1cm4gX2RlZmxhdGUoQnVmZmVyKHN0cmluZ09yQnVmZmVyKSwgY2FsbGJhY2spO1xufTtcblpsaWIuZ3ppcCA9IGZ1bmN0aW9uIGd6aXAoc3RyaW5nT3JCdWZmZXIsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBfZ3ppcChCdWZmZXIoc3RyaW5nT3JCdWZmZXIpLCBjYWxsYmFjayk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLEJ1ZmZlcil7XG4vKiogQGxpY2Vuc2UgemxpYi5qcyAwLjEuNyAyMDEyIC0gaW1heWEgWyBodHRwczovL2dpdGh1Yi5jb20vaW1heWEvemxpYi5qcyBdIFRoZSBNSVQgTGljZW5zZSAqLyhmdW5jdGlvbigpIHsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcShiKXt0aHJvdyBiO312YXIgdD12b2lkIDAsdT0hMDt2YXIgQT1cInVuZGVmaW5lZFwiIT09dHlwZW9mIFVpbnQ4QXJyYXkmJlwidW5kZWZpbmVkXCIhPT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPT10eXBlb2YgVWludDMyQXJyYXk7ZnVuY3Rpb24gRShiLGEpe3RoaXMuaW5kZXg9XCJudW1iZXJcIj09PXR5cGVvZiBhP2E6MDt0aGlzLm09MDt0aGlzLmJ1ZmZlcj1iIGluc3RhbmNlb2YoQT9VaW50OEFycmF5OkFycmF5KT9iOm5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgzMjc2OCk7Mip0aGlzLmJ1ZmZlci5sZW5ndGg8PXRoaXMuaW5kZXgmJnEoRXJyb3IoXCJpbnZhbGlkIGluZGV4XCIpKTt0aGlzLmJ1ZmZlci5sZW5ndGg8PXRoaXMuaW5kZXgmJnRoaXMuZigpfUUucHJvdG90eXBlLmY9ZnVuY3Rpb24oKXt2YXIgYj10aGlzLmJ1ZmZlcixhLGM9Yi5sZW5ndGgsZD1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoYzw8MSk7aWYoQSlkLnNldChiKTtlbHNlIGZvcihhPTA7YTxjOysrYSlkW2FdPWJbYV07cmV0dXJuIHRoaXMuYnVmZmVyPWR9O1xuRS5wcm90b3R5cGUuZD1mdW5jdGlvbihiLGEsYyl7dmFyIGQ9dGhpcy5idWZmZXIsZj10aGlzLmluZGV4LGU9dGhpcy5tLGc9ZFtmXSxrO2MmJjE8YSYmKGI9ODxhPyhHW2ImMjU1XTw8MjR8R1tiPj4+OCYyNTVdPDwxNnxHW2I+Pj4xNiYyNTVdPDw4fEdbYj4+PjI0JjI1NV0pPj4zMi1hOkdbYl0+PjgtYSk7aWYoOD5hK2UpZz1nPDxhfGIsZSs9YTtlbHNlIGZvcihrPTA7azxhOysraylnPWc8PDF8Yj4+YS1rLTEmMSw4PT09KytlJiYoZT0wLGRbZisrXT1HW2ddLGc9MCxmPT09ZC5sZW5ndGgmJihkPXRoaXMuZigpKSk7ZFtmXT1nO3RoaXMuYnVmZmVyPWQ7dGhpcy5tPWU7dGhpcy5pbmRleD1mfTtFLnByb3RvdHlwZS5maW5pc2g9ZnVuY3Rpb24oKXt2YXIgYj10aGlzLmJ1ZmZlcixhPXRoaXMuaW5kZXgsYzswPHRoaXMubSYmKGJbYV08PD04LXRoaXMubSxiW2FdPUdbYlthXV0sYSsrKTtBP2M9Yi5zdWJhcnJheSgwLGEpOihiLmxlbmd0aD1hLGM9Yik7cmV0dXJuIGN9O1xudmFyIGFhPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgyNTYpLEo7Zm9yKEo9MDsyNTY+SjsrK0ope2Zvcih2YXIgTj1KLFE9TixiYT03LE49Tj4+PjE7TjtOPj4+PTEpUTw8PTEsUXw9TiYxLC0tYmE7YWFbSl09KFE8PGJhJjI1NSk+Pj4wfXZhciBHPWFhO2Z1bmN0aW9uIFIoYixhLGMpe3ZhciBkLGY9XCJudW1iZXJcIj09PXR5cGVvZiBhP2E6YT0wLGU9XCJudW1iZXJcIj09PXR5cGVvZiBjP2M6Yi5sZW5ndGg7ZD0tMTtmb3IoZj1lJjc7Zi0tOysrYSlkPWQ+Pj44XlNbKGReYlthXSkmMjU1XTtmb3IoZj1lPj4zO2YtLTthKz04KWQ9ZD4+PjheU1soZF5iW2FdKSYyNTVdLGQ9ZD4+PjheU1soZF5iW2ErMV0pJjI1NV0sZD1kPj4+OF5TWyhkXmJbYSsyXSkmMjU1XSxkPWQ+Pj44XlNbKGReYlthKzNdKSYyNTVdLGQ9ZD4+PjheU1soZF5iW2ErNF0pJjI1NV0sZD1kPj4+OF5TWyhkXmJbYSs1XSkmMjU1XSxkPWQ+Pj44XlNbKGReYlthKzZdKSYyNTVdLGQ9ZD4+PjheU1soZF5iW2ErN10pJjI1NV07cmV0dXJuKGReNDI5NDk2NzI5NSk+Pj4wfVxudmFyIGdhPVswLDE5OTY5NTk4OTQsMzk5MzkxOTc4OCwyNTY3NTI0Nzk0LDEyNDYzNDEzNywxODg2MDU3NjE1LDM5MTU2MjE2ODUsMjY1NzM5MjAzNSwyNDkyNjgyNzQsMjA0NDUwODMyNCwzNzcyMTE1MjMwLDI1NDcxNzc4NjQsMTYyOTQxOTk1LDIxMjU1NjEwMjEsMzg4NzYwNzA0NywyNDI4NDQ0MDQ5LDQ5ODUzNjU0OCwxNzg5OTI3NjY2LDQwODkwMTY2NDgsMjIyNzA2MTIxNCw0NTA1NDg4NjEsMTg0MzI1ODYwMyw0MTA3NTgwNzUzLDIyMTE2Nzc2MzksMzI1ODgzOTkwLDE2ODQ3NzcxNTIsNDI1MTEyMjA0MiwyMzIxOTI2NjM2LDMzNTYzMzQ4NywxNjYxMzY1NDY1LDQxOTUzMDI3NTUsMjM2NjExNTMxNyw5OTcwNzMwOTYsMTI4MTk1Mzg4NiwzNTc5ODU1MzMyLDI3MjQ2ODgyNDIsMTAwNjg4ODE0NSwxMjU4NjA3Njg3LDM1MjQxMDE2MjksMjc2ODk0MjQ0Myw5MDEwOTc3MjIsMTExOTAwMDY4NCwzNjg2NTE3MjA2LDI4OTgwNjU3MjgsODUzMDQ0NDUxLDExNzIyNjYxMDEsMzcwNTAxNTc1OSxcbjI4ODI2MTY2NjUsNjUxNzY3OTgwLDEzNzM1MDM1NDYsMzM2OTU1NDMwNCwzMjE4MTA0NTk4LDU2NTUwNzI1MywxNDU0NjIxNzMxLDM0ODUxMTE3MDUsMzA5OTQzNjMwMyw2NzEyNjY5NzQsMTU5NDE5ODAyNCwzMzIyNzMwOTMwLDI5NzAzNDc4MTIsNzk1ODM1NTI3LDE0ODMyMzAyMjUsMzI0NDM2NzI3NSwzMDYwMTQ5NTY1LDE5OTQxNDYxOTIsMzExNTg1MzQsMjU2MzkwNzc3Miw0MDIzNzE3OTMwLDE5MDc0NTk0NjUsMTEyNjM3MjE1LDI2ODAxNTMyNTMsMzkwNDQyNzA1OSwyMDEzNzc2MjkwLDI1MTcyMjAzNiwyNTE3MjE1Mzc0LDM3NzU4MzAwNDAsMjEzNzY1Njc2MywxNDEzNzY4MTMsMjQzOTI3NzcxOSwzODY1MjcxMjk3LDE4MDIxOTU0NDQsNDc2ODY0ODY2LDIyMzgwMDEzNjgsNDA2NjUwODg3OCwxODEyMzcwOTI1LDQ1MzA5MjczMSwyMTgxNjI1MDI1LDQxMTE0NTEyMjMsMTcwNjA4ODkwMiwzMTQwNDI3MDQsMjM0NDUzMjIwMiw0MjQwMDE3NTMyLDE2NTg2NTgyNzEsMzY2NjE5OTc3LFxuMjM2MjY3MDMyMyw0MjI0OTk0NDA1LDEzMDM1MzU5NjAsOTg0OTYxNDg2LDI3NDcwMDcwOTIsMzU2OTAzNzUzOCwxMjU2MTcwODE3LDEwMzc2MDQzMTEsMjc2NTIxMDczMywzNTU0MDc5OTk1LDExMzEwMTQ1MDYsODc5Njc5OTk2LDI5MDkyNDM0NjIsMzY2Mzc3MTg1NiwxMTQxMTI0NDY3LDg1NTg0MjI3NywyODUyODAxNjMxLDM3MDg2NDg2NDksMTM0MjUzMzk0OCw2NTQ0NTkzMDYsMzE4ODM5NjA0OCwzMzczMDE1MTc0LDE0NjY0Nzk5MDksNTQ0MTc5NjM1LDMxMTA1MjM5MTMsMzQ2MjUyMjAxNSwxNTkxNjcxMDU0LDcwMjEzODc3NiwyOTY2NDYwNDUwLDMzNTI3OTk0MTIsMTUwNDkxODgwNyw3ODM1NTE4NzMsMzA4MjY0MDQ0MywzMjMzNDQyOTg5LDM5ODgyOTIzODQsMjU5NjI1NDY0Niw2MjMxNzA2OCwxOTU3ODEwODQyLDM5Mzk4NDU5NDUsMjY0NzgxNjExMSw4MTQ3MDk5NywxOTQzODAzNTIzLDM4MTQ5MTg5MzAsMjQ4OTU5NjgwNCwyMjUyNzQ0MzAsMjA1Mzc5MDM3NiwzODI2MTc1NzU1LFxuMjQ2NjkwNjAxMywxNjc4MTY3NDMsMjA5NzY1MTM3Nyw0MDI3NTUyNTgwLDIyNjU0OTAzODYsNTAzNDQ0MDcyLDE3NjIwNTA4MTQsNDE1MDQxNzI0NSwyMTU0MTI5MzU1LDQyNjUyMjIyNSwxODUyNTA3ODc5LDQyNzUzMTM1MjYsMjMxMjMxNzkyMCwyODI3NTM2MjYsMTc0MjU1NTg1Miw0MTg5NzA4MTQzLDIzOTQ4Nzc5NDUsMzk3OTE3NzYzLDE2MjIxODM2MzcsMzYwNDM5MDg4OCwyNzE0ODY2NTU4LDk1MzcyOTczMiwxMzQwMDc2NjI2LDM1MTg3MTk5ODUsMjc5NzM2MDk5OSwxMDY4ODI4MzgxLDEyMTk2Mzg4NTksMzYyNDc0MTg1MCwyOTM2Njc1MTQ4LDkwNjE4NTQ2MiwxMDkwODEyNTEyLDM3NDc2NzIwMDMsMjgyNTM3OTY2OSw4MjkzMjkxMzUsMTE4MTMzNTE2MSwzNDEyMTc3ODA0LDMxNjA4MzQ4NDIsNjI4MDg1NDA4LDEzODI2MDUzNjYsMzQyMzM2OTEwOSwzMTM4MDc4NDY3LDU3MDU2MjIzMywxNDI2NDAwODE1LDMzMTczMTY1NDIsMjk5ODczMzYwOCw3MzMyMzk5NTQsMTU1NTI2MTk1NixcbjMyNjg5MzU1OTEsMzA1MDM2MDYyNSw3NTI0NTk0MDMsMTU0MTMyMDIyMSwyNjA3MDcxOTIwLDM5NjU5NzMwMzAsMTk2OTkyMjk3Miw0MDczNTQ5OCwyNjE3ODM3MjI1LDM5NDM1NzcxNTEsMTkxMzA4Nzg3Nyw4MzkwODM3MSwyNTEyMzQxNjM0LDM4MDM3NDA2OTIsMjA3NTIwODYyMiwyMTMyNjExMTIsMjQ2MzI3MjYwMywzODU1OTkwMjg1LDIwOTQ4NTQwNzEsMTk4OTU4ODgxLDIyNjIwMjkwMTIsNDA1NzI2MDYxMCwxNzU5MzU5OTkyLDUzNDQxNDE5MCwyMTc2NzE4NTQxLDQxMzkzMjkxMTUsMTg3MzgzNjAwMSw0MTQ2NjQ1NjcsMjI4MjI0ODkzNCw0Mjc5MjAwMzY4LDE3MTE2ODQ1NTQsMjg1MjgxMTE2LDI0MDU4MDE3MjcsNDE2NzIxNjc0NSwxNjM0NDY3Nzk1LDM3NjIyOTcwMSwyNjg1MDY3ODk2LDM2MDgwMDc0MDYsMTMwODkxODYxMiw5NTY1NDM5MzgsMjgwODU1NTEwNSwzNDk1OTU4MjYzLDEyMzE2MzYzMDEsMTA0NzQyNzAzNSwyOTMyOTU5ODE4LDM2NTQ3MDM4MzYsMTA4ODM1OTI3MCxcbjkzNjkxOEUzLDI4NDc3MTQ4OTksMzczNjgzNzgyOSwxMjAyOTAwODYzLDgxNzIzMzg5NywzMTgzMzQyMTA4LDM0MDEyMzcxMzAsMTQwNDI3NzU1Miw2MTU4MTgxNTAsMzEzNDIwNzQ5MywzNDUzNDIxMjAzLDE0MjM4NTc0NDksNjAxNDUwNDMxLDMwMDk4Mzc2MTQsMzI5NDcxMDQ1NiwxNTY3MTAzNzQ2LDcxMTkyODcyNCwzMDIwNjY4NDcxLDMyNzIzODAwNjUsMTUxMDMzNDIzNSw3NTUxNjcxMTddLFM9QT9uZXcgVWludDMyQXJyYXkoZ2EpOmdhO2Z1bmN0aW9uIGhhKCl7fTtmdW5jdGlvbiBpYShiKXt0aGlzLmJ1ZmZlcj1uZXcgKEE/VWludDE2QXJyYXk6QXJyYXkpKDIqYik7dGhpcy5sZW5ndGg9MH1pYS5wcm90b3R5cGUuZ2V0UGFyZW50PWZ1bmN0aW9uKGIpe3JldHVybiAyKigoYi0yKS80fDApfTtpYS5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihiLGEpe3ZhciBjLGQsZj10aGlzLmJ1ZmZlcixlO2M9dGhpcy5sZW5ndGg7Zlt0aGlzLmxlbmd0aCsrXT1hO2ZvcihmW3RoaXMubGVuZ3RoKytdPWI7MDxjOylpZihkPXRoaXMuZ2V0UGFyZW50KGMpLGZbY10+ZltkXSllPWZbY10sZltjXT1mW2RdLGZbZF09ZSxlPWZbYysxXSxmW2MrMV09ZltkKzFdLGZbZCsxXT1lLGM9ZDtlbHNlIGJyZWFrO3JldHVybiB0aGlzLmxlbmd0aH07XG5pYS5wcm90b3R5cGUucG9wPWZ1bmN0aW9uKCl7dmFyIGIsYSxjPXRoaXMuYnVmZmVyLGQsZixlO2E9Y1swXTtiPWNbMV07dGhpcy5sZW5ndGgtPTI7Y1swXT1jW3RoaXMubGVuZ3RoXTtjWzFdPWNbdGhpcy5sZW5ndGgrMV07Zm9yKGU9MDs7KXtmPTIqZSsyO2lmKGY+PXRoaXMubGVuZ3RoKWJyZWFrO2YrMjx0aGlzLmxlbmd0aCYmY1tmKzJdPmNbZl0mJihmKz0yKTtpZihjW2ZdPmNbZV0pZD1jW2VdLGNbZV09Y1tmXSxjW2ZdPWQsZD1jW2UrMV0sY1tlKzFdPWNbZisxXSxjW2YrMV09ZDtlbHNlIGJyZWFrO2U9Zn1yZXR1cm57aW5kZXg6Yix2YWx1ZTphLGxlbmd0aDp0aGlzLmxlbmd0aH19O2Z1bmN0aW9uIGphKGIpe3ZhciBhPWIubGVuZ3RoLGM9MCxkPU51bWJlci5QT1NJVElWRV9JTkZJTklUWSxmLGUsZyxrLGgsbCxzLG4sbTtmb3Iobj0wO248YTsrK24pYltuXT5jJiYoYz1iW25dKSxiW25dPGQmJihkPWJbbl0pO2Y9MTw8YztlPW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoZik7Zz0xO2s9MDtmb3IoaD0yO2c8PWM7KXtmb3Iobj0wO248YTsrK24paWYoYltuXT09PWcpe2w9MDtzPWs7Zm9yKG09MDttPGc7KyttKWw9bDw8MXxzJjEscz4+PTE7Zm9yKG09bDttPGY7bSs9aCllW21dPWc8PDE2fG47KytrfSsrZztrPDw9MTtoPDw9MX1yZXR1cm5bZSxjLGRdfTtmdW5jdGlvbiBtYShiLGEpe3RoaXMuaz1uYTt0aGlzLkY9MDt0aGlzLmlucHV0PUEmJmIgaW5zdGFuY2VvZiBBcnJheT9uZXcgVWludDhBcnJheShiKTpiO3RoaXMuYj0wO2EmJihhLmxhenkmJih0aGlzLkY9YS5sYXp5KSxcIm51bWJlclwiPT09dHlwZW9mIGEuY29tcHJlc3Npb25UeXBlJiYodGhpcy5rPWEuY29tcHJlc3Npb25UeXBlKSxhLm91dHB1dEJ1ZmZlciYmKHRoaXMuYT1BJiZhLm91dHB1dEJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5P25ldyBVaW50OEFycmF5KGEub3V0cHV0QnVmZmVyKTphLm91dHB1dEJ1ZmZlciksXCJudW1iZXJcIj09PXR5cGVvZiBhLm91dHB1dEluZGV4JiYodGhpcy5iPWEub3V0cHV0SW5kZXgpKTt0aGlzLmF8fCh0aGlzLmE9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKDMyNzY4KSl9dmFyIG5hPTIsb2E9e05PTkU6MCxMOjEsdDpuYSxYOjN9LHBhPVtdLFQ7XG5mb3IoVD0wOzI4OD5UO1QrKylzd2l0Y2godSl7Y2FzZSAxNDM+PVQ6cGEucHVzaChbVCs0OCw4XSk7YnJlYWs7Y2FzZSAyNTU+PVQ6cGEucHVzaChbVC0xNDQrNDAwLDldKTticmVhaztjYXNlIDI3OT49VDpwYS5wdXNoKFtULTI1NiswLDddKTticmVhaztjYXNlIDI4Nz49VDpwYS5wdXNoKFtULTI4MCsxOTIsOF0pO2JyZWFrO2RlZmF1bHQ6cShcImludmFsaWQgbGl0ZXJhbDogXCIrVCl9XG5tYS5wcm90b3R5cGUuaD1mdW5jdGlvbigpe3ZhciBiLGEsYyxkLGY9dGhpcy5pbnB1dDtzd2l0Y2godGhpcy5rKXtjYXNlIDA6Yz0wO2ZvcihkPWYubGVuZ3RoO2M8ZDspe2E9QT9mLnN1YmFycmF5KGMsYys2NTUzNSk6Zi5zbGljZShjLGMrNjU1MzUpO2MrPWEubGVuZ3RoO3ZhciBlPWEsZz1jPT09ZCxrPXQsaD10LGw9dCxzPXQsbj10LG09dGhpcy5hLHA9dGhpcy5iO2lmKEEpe2ZvcihtPW5ldyBVaW50OEFycmF5KHRoaXMuYS5idWZmZXIpO20ubGVuZ3RoPD1wK2UubGVuZ3RoKzU7KW09bmV3IFVpbnQ4QXJyYXkobS5sZW5ndGg8PDEpO20uc2V0KHRoaXMuYSl9az1nPzE6MDttW3ArK109a3wwO2g9ZS5sZW5ndGg7bD1+aCs2NTUzNiY2NTUzNTttW3ArK109aCYyNTU7bVtwKytdPWg+Pj44JjI1NTttW3ArK109bCYyNTU7bVtwKytdPWw+Pj44JjI1NTtpZihBKW0uc2V0KGUscCkscCs9ZS5sZW5ndGgsbT1tLnN1YmFycmF5KDAscCk7ZWxzZXtzPTA7Zm9yKG49ZS5sZW5ndGg7czxuOysrcyltW3ArK109XG5lW3NdO20ubGVuZ3RoPXB9dGhpcy5iPXA7dGhpcy5hPW19YnJlYWs7Y2FzZSAxOnZhciByPW5ldyBFKEE/bmV3IFVpbnQ4QXJyYXkodGhpcy5hLmJ1ZmZlcik6dGhpcy5hLHRoaXMuYik7ci5kKDEsMSx1KTtyLmQoMSwyLHUpO3ZhciB2PXFhKHRoaXMsZikseCxPLHk7eD0wO2ZvcihPPXYubGVuZ3RoO3g8Tzt4KyspaWYoeT12W3hdLEUucHJvdG90eXBlLmQuYXBwbHkocixwYVt5XSksMjU2PHkpci5kKHZbKyt4XSx2WysreF0sdSksci5kKHZbKyt4XSw1KSxyLmQodlsrK3hdLHZbKyt4XSx1KTtlbHNlIGlmKDI1Nj09PXkpYnJlYWs7dGhpcy5hPXIuZmluaXNoKCk7dGhpcy5iPXRoaXMuYS5sZW5ndGg7YnJlYWs7Y2FzZSBuYTp2YXIgRD1uZXcgRShBP25ldyBVaW50OEFycmF5KHRoaXMuYS5idWZmZXIpOnRoaXMuYSx0aGlzLmIpLERhLFAsVSxWLFcscWI9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdLGNhLEVhLGRhLEZhLGthLHNhPUFycmF5KDE5KSxcbkdhLFgsbGEsQixIYTtEYT1uYTtELmQoMSwxLHUpO0QuZChEYSwyLHUpO1A9cWEodGhpcyxmKTtjYT1yYSh0aGlzLlUsMTUpO0VhPXRhKGNhKTtkYT1yYSh0aGlzLlQsNyk7RmE9dGEoZGEpO2ZvcihVPTI4NjsyNTc8VSYmMD09PWNhW1UtMV07VS0tKTtmb3IoVj0zMDsxPFYmJjA9PT1kYVtWLTFdO1YtLSk7dmFyIElhPVUsSmE9VixJPW5ldyAoQT9VaW50MzJBcnJheTpBcnJheSkoSWErSmEpLHcsSyx6LGVhLEg9bmV3IChBP1VpbnQzMkFycmF5OkFycmF5KSgzMTYpLEYsQyxMPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgxOSk7Zm9yKHc9Sz0wO3c8SWE7dysrKUlbSysrXT1jYVt3XTtmb3Iodz0wO3c8SmE7dysrKUlbSysrXT1kYVt3XTtpZighQSl7dz0wO2ZvcihlYT1MLmxlbmd0aDt3PGVhOysrdylMW3ddPTB9dz1GPTA7Zm9yKGVhPUkubGVuZ3RoO3c8ZWE7dys9Syl7Zm9yKEs9MTt3K0s8ZWEmJklbdytLXT09PUlbd107KytLKTt6PUs7aWYoMD09PUlbd10paWYoMz56KWZvcig7MDxcbnotLTspSFtGKytdPTAsTFswXSsrO2Vsc2UgZm9yKDswPHo7KUM9MTM4Pno/ejoxMzgsQz56LTMmJkM8eiYmKEM9ei0zKSwxMD49Qz8oSFtGKytdPTE3LEhbRisrXT1DLTMsTFsxN10rKyk6KEhbRisrXT0xOCxIW0YrK109Qy0xMSxMWzE4XSsrKSx6LT1DO2Vsc2UgaWYoSFtGKytdPUlbd10sTFtJW3ddXSsrLHotLSwzPnopZm9yKDswPHotLTspSFtGKytdPUlbd10sTFtJW3ddXSsrO2Vsc2UgZm9yKDswPHo7KUM9Nj56P3o6NixDPnotMyYmQzx6JiYoQz16LTMpLEhbRisrXT0xNixIW0YrK109Qy0zLExbMTZdKyssei09Q31iPUE/SC5zdWJhcnJheSgwLEYpOkguc2xpY2UoMCxGKTtrYT1yYShMLDcpO2ZvcihCPTA7MTk+QjtCKyspc2FbQl09a2FbcWJbQl1dO2ZvcihXPTE5OzQ8VyYmMD09PXNhW1ctMV07Vy0tKTtHYT10YShrYSk7RC5kKFUtMjU3LDUsdSk7RC5kKFYtMSw1LHUpO0QuZChXLTQsNCx1KTtmb3IoQj0wO0I8VztCKyspRC5kKHNhW0JdLDMsdSk7Qj0wO2ZvcihIYT1iLmxlbmd0aDtCPFxuSGE7QisrKWlmKFg9YltCXSxELmQoR2FbWF0sa2FbWF0sdSksMTY8PVgpe0IrKztzd2l0Y2goWCl7Y2FzZSAxNjpsYT0yO2JyZWFrO2Nhc2UgMTc6bGE9MzticmVhaztjYXNlIDE4OmxhPTc7YnJlYWs7ZGVmYXVsdDpxKFwiaW52YWxpZCBjb2RlOiBcIitYKX1ELmQoYltCXSxsYSx1KX12YXIgS2E9W0VhLGNhXSxMYT1bRmEsZGFdLE0sTWEsZmEsdmEsTmEsT2EsUGEsUWE7TmE9S2FbMF07T2E9S2FbMV07UGE9TGFbMF07UWE9TGFbMV07TT0wO2ZvcihNYT1QLmxlbmd0aDtNPE1hOysrTSlpZihmYT1QW01dLEQuZChOYVtmYV0sT2FbZmFdLHUpLDI1NjxmYSlELmQoUFsrK01dLFBbKytNXSx1KSx2YT1QWysrTV0sRC5kKFBhW3ZhXSxRYVt2YV0sdSksRC5kKFBbKytNXSxQWysrTV0sdSk7ZWxzZSBpZigyNTY9PT1mYSlicmVhazt0aGlzLmE9RC5maW5pc2goKTt0aGlzLmI9dGhpcy5hLmxlbmd0aDticmVhaztkZWZhdWx0OnEoXCJpbnZhbGlkIGNvbXByZXNzaW9uIHR5cGVcIil9cmV0dXJuIHRoaXMuYX07XG5mdW5jdGlvbiB1YShiLGEpe3RoaXMubGVuZ3RoPWI7dGhpcy5OPWF9XG52YXIgd2E9ZnVuY3Rpb24oKXtmdW5jdGlvbiBiKGEpe3N3aXRjaCh1KXtjYXNlIDM9PT1hOnJldHVyblsyNTcsYS0zLDBdO2Nhc2UgND09PWE6cmV0dXJuWzI1OCxhLTQsMF07Y2FzZSA1PT09YTpyZXR1cm5bMjU5LGEtNSwwXTtjYXNlIDY9PT1hOnJldHVyblsyNjAsYS02LDBdO2Nhc2UgNz09PWE6cmV0dXJuWzI2MSxhLTcsMF07Y2FzZSA4PT09YTpyZXR1cm5bMjYyLGEtOCwwXTtjYXNlIDk9PT1hOnJldHVyblsyNjMsYS05LDBdO2Nhc2UgMTA9PT1hOnJldHVyblsyNjQsYS0xMCwwXTtjYXNlIDEyPj1hOnJldHVyblsyNjUsYS0xMSwxXTtjYXNlIDE0Pj1hOnJldHVyblsyNjYsYS0xMywxXTtjYXNlIDE2Pj1hOnJldHVyblsyNjcsYS0xNSwxXTtjYXNlIDE4Pj1hOnJldHVyblsyNjgsYS0xNywxXTtjYXNlIDIyPj1hOnJldHVyblsyNjksYS0xOSwyXTtjYXNlIDI2Pj1hOnJldHVyblsyNzAsYS0yMywyXTtjYXNlIDMwPj1hOnJldHVyblsyNzEsYS0yNywyXTtjYXNlIDM0Pj1hOnJldHVyblsyNzIsXG5hLTMxLDJdO2Nhc2UgNDI+PWE6cmV0dXJuWzI3MyxhLTM1LDNdO2Nhc2UgNTA+PWE6cmV0dXJuWzI3NCxhLTQzLDNdO2Nhc2UgNTg+PWE6cmV0dXJuWzI3NSxhLTUxLDNdO2Nhc2UgNjY+PWE6cmV0dXJuWzI3NixhLTU5LDNdO2Nhc2UgODI+PWE6cmV0dXJuWzI3NyxhLTY3LDRdO2Nhc2UgOTg+PWE6cmV0dXJuWzI3OCxhLTgzLDRdO2Nhc2UgMTE0Pj1hOnJldHVyblsyNzksYS05OSw0XTtjYXNlIDEzMD49YTpyZXR1cm5bMjgwLGEtMTE1LDRdO2Nhc2UgMTYyPj1hOnJldHVyblsyODEsYS0xMzEsNV07Y2FzZSAxOTQ+PWE6cmV0dXJuWzI4MixhLTE2Myw1XTtjYXNlIDIyNj49YTpyZXR1cm5bMjgzLGEtMTk1LDVdO2Nhc2UgMjU3Pj1hOnJldHVyblsyODQsYS0yMjcsNV07Y2FzZSAyNTg9PT1hOnJldHVyblsyODUsYS0yNTgsMF07ZGVmYXVsdDpxKFwiaW52YWxpZCBsZW5ndGg6IFwiK2EpfX12YXIgYT1bXSxjLGQ7Zm9yKGM9MzsyNTg+PWM7YysrKWQ9YihjKSxhW2NdPWRbMl08PDI0fGRbMV08PFxuMTZ8ZFswXTtyZXR1cm4gYX0oKSx4YT1BP25ldyBVaW50MzJBcnJheSh3YSk6d2E7XG5mdW5jdGlvbiBxYShiLGEpe2Z1bmN0aW9uIGMoYSxjKXt2YXIgYj1hLk4sZD1bXSxlPTAsZjtmPXhhW2EubGVuZ3RoXTtkW2UrK109ZiY2NTUzNTtkW2UrK109Zj4+MTYmMjU1O2RbZSsrXT1mPj4yNDt2YXIgZztzd2l0Y2godSl7Y2FzZSAxPT09YjpnPVswLGItMSwwXTticmVhaztjYXNlIDI9PT1iOmc9WzEsYi0yLDBdO2JyZWFrO2Nhc2UgMz09PWI6Zz1bMixiLTMsMF07YnJlYWs7Y2FzZSA0PT09YjpnPVszLGItNCwwXTticmVhaztjYXNlIDY+PWI6Zz1bNCxiLTUsMV07YnJlYWs7Y2FzZSA4Pj1iOmc9WzUsYi03LDFdO2JyZWFrO2Nhc2UgMTI+PWI6Zz1bNixiLTksMl07YnJlYWs7Y2FzZSAxNj49YjpnPVs3LGItMTMsMl07YnJlYWs7Y2FzZSAyND49YjpnPVs4LGItMTcsM107YnJlYWs7Y2FzZSAzMj49YjpnPVs5LGItMjUsM107YnJlYWs7Y2FzZSA0OD49YjpnPVsxMCxiLTMzLDRdO2JyZWFrO2Nhc2UgNjQ+PWI6Zz1bMTEsYi00OSw0XTticmVhaztjYXNlIDk2Pj1iOmc9WzEyLGItXG42NSw1XTticmVhaztjYXNlIDEyOD49YjpnPVsxMyxiLTk3LDVdO2JyZWFrO2Nhc2UgMTkyPj1iOmc9WzE0LGItMTI5LDZdO2JyZWFrO2Nhc2UgMjU2Pj1iOmc9WzE1LGItMTkzLDZdO2JyZWFrO2Nhc2UgMzg0Pj1iOmc9WzE2LGItMjU3LDddO2JyZWFrO2Nhc2UgNTEyPj1iOmc9WzE3LGItMzg1LDddO2JyZWFrO2Nhc2UgNzY4Pj1iOmc9WzE4LGItNTEzLDhdO2JyZWFrO2Nhc2UgMTAyND49YjpnPVsxOSxiLTc2OSw4XTticmVhaztjYXNlIDE1MzY+PWI6Zz1bMjAsYi0xMDI1LDldO2JyZWFrO2Nhc2UgMjA0OD49YjpnPVsyMSxiLTE1MzcsOV07YnJlYWs7Y2FzZSAzMDcyPj1iOmc9WzIyLGItMjA0OSwxMF07YnJlYWs7Y2FzZSA0MDk2Pj1iOmc9WzIzLGItMzA3MywxMF07YnJlYWs7Y2FzZSA2MTQ0Pj1iOmc9WzI0LGItNDA5NywxMV07YnJlYWs7Y2FzZSA4MTkyPj1iOmc9WzI1LGItNjE0NSwxMV07YnJlYWs7Y2FzZSAxMjI4OD49YjpnPVsyNixiLTgxOTMsMTJdO2JyZWFrO2Nhc2UgMTYzODQ+PVxuYjpnPVsyNyxiLTEyMjg5LDEyXTticmVhaztjYXNlIDI0NTc2Pj1iOmc9WzI4LGItMTYzODUsMTNdO2JyZWFrO2Nhc2UgMzI3Njg+PWI6Zz1bMjksYi0yNDU3NywxM107YnJlYWs7ZGVmYXVsdDpxKFwiaW52YWxpZCBkaXN0YW5jZVwiKX1mPWc7ZFtlKytdPWZbMF07ZFtlKytdPWZbMV07ZFtlKytdPWZbMl07dmFyIGgsaztoPTA7Zm9yKGs9ZC5sZW5ndGg7aDxrOysraCltW3ArK109ZFtoXTt2W2RbMF1dKys7eFtkWzNdXSsrO3I9YS5sZW5ndGgrYy0xO249bnVsbH12YXIgZCxmLGUsZyxrLGg9e30sbCxzLG4sbT1BP25ldyBVaW50MTZBcnJheSgyKmEubGVuZ3RoKTpbXSxwPTAscj0wLHY9bmV3IChBP1VpbnQzMkFycmF5OkFycmF5KSgyODYpLHg9bmV3IChBP1VpbnQzMkFycmF5OkFycmF5KSgzMCksTz1iLkYseTtpZighQSl7Zm9yKGU9MDsyODU+PWU7KXZbZSsrXT0wO2ZvcihlPTA7Mjk+PWU7KXhbZSsrXT0wfXZbMjU2XT0xO2Q9MDtmb3IoZj1hLmxlbmd0aDtkPGY7KytkKXtlPWs9MDtcbmZvcihnPTM7ZTxnJiZkK2UhPT1mOysrZSlrPWs8PDh8YVtkK2VdO2hba109PT10JiYoaFtrXT1bXSk7bD1oW2tdO2lmKCEoMDxyLS0pKXtmb3IoOzA8bC5sZW5ndGgmJjMyNzY4PGQtbFswXTspbC5zaGlmdCgpO2lmKGQrMz49Zil7biYmYyhuLC0xKTtlPTA7Zm9yKGc9Zi1kO2U8ZzsrK2UpeT1hW2QrZV0sbVtwKytdPXksKyt2W3ldO2JyZWFrfTA8bC5sZW5ndGg/KHM9eWEoYSxkLGwpLG4/bi5sZW5ndGg8cy5sZW5ndGg/KHk9YVtkLTFdLG1bcCsrXT15LCsrdlt5XSxjKHMsMCkpOmMobiwtMSk6cy5sZW5ndGg8Tz9uPXM6YyhzLDApKTpuP2MobiwtMSk6KHk9YVtkXSxtW3ArK109eSwrK3ZbeV0pfWwucHVzaChkKX1tW3ArK109MjU2O3ZbMjU2XSsrO2IuVT12O2IuVD14O3JldHVybiBBP20uc3ViYXJyYXkoMCxwKTptfVxuZnVuY3Rpb24geWEoYixhLGMpe3ZhciBkLGYsZT0wLGcsayxoLGwscz1iLmxlbmd0aDtrPTA7bD1jLmxlbmd0aDthOmZvcig7azxsO2srKyl7ZD1jW2wtay0xXTtnPTM7aWYoMzxlKXtmb3IoaD1lOzM8aDtoLS0paWYoYltkK2gtMV0hPT1iW2EraC0xXSljb250aW51ZSBhO2c9ZX1mb3IoOzI1OD5nJiZhK2c8cyYmYltkK2ddPT09YlthK2ddOykrK2c7Zz5lJiYoZj1kLGU9Zyk7aWYoMjU4PT09ZylicmVha31yZXR1cm4gbmV3IHVhKGUsYS1mKX1cbmZ1bmN0aW9uIHJhKGIsYSl7dmFyIGM9Yi5sZW5ndGgsZD1uZXcgaWEoNTcyKSxmPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KShjKSxlLGcsayxoLGw7aWYoIUEpZm9yKGg9MDtoPGM7aCsrKWZbaF09MDtmb3IoaD0wO2g8YzsrK2gpMDxiW2hdJiZkLnB1c2goaCxiW2hdKTtlPUFycmF5KGQubGVuZ3RoLzIpO2c9bmV3IChBP1VpbnQzMkFycmF5OkFycmF5KShkLmxlbmd0aC8yKTtpZigxPT09ZS5sZW5ndGgpcmV0dXJuIGZbZC5wb3AoKS5pbmRleF09MSxmO2g9MDtmb3IobD1kLmxlbmd0aC8yO2g8bDsrK2gpZVtoXT1kLnBvcCgpLGdbaF09ZVtoXS52YWx1ZTtrPXphKGcsZy5sZW5ndGgsYSk7aD0wO2ZvcihsPWUubGVuZ3RoO2g8bDsrK2gpZltlW2hdLmluZGV4XT1rW2hdO3JldHVybiBmfVxuZnVuY3Rpb24gemEoYixhLGMpe2Z1bmN0aW9uIGQoYil7dmFyIGM9aFtiXVtsW2JdXTtjPT09YT8oZChiKzEpLGQoYisxKSk6LS1nW2NdOysrbFtiXX12YXIgZj1uZXcgKEE/VWludDE2QXJyYXk6QXJyYXkpKGMpLGU9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKGMpLGc9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKGEpLGs9QXJyYXkoYyksaD1BcnJheShjKSxsPUFycmF5KGMpLHM9KDE8PGMpLWEsbj0xPDxjLTEsbSxwLHIsdix4O2ZbYy0xXT1hO2ZvcihwPTA7cDxjOysrcClzPG4/ZVtwXT0wOihlW3BdPTEscy09biksczw8PTEsZltjLTItcF09KGZbYy0xLXBdLzJ8MCkrYTtmWzBdPWVbMF07a1swXT1BcnJheShmWzBdKTtoWzBdPUFycmF5KGZbMF0pO2ZvcihwPTE7cDxjOysrcClmW3BdPjIqZltwLTFdK2VbcF0mJihmW3BdPTIqZltwLTFdK2VbcF0pLGtbcF09QXJyYXkoZltwXSksaFtwXT1BcnJheShmW3BdKTtmb3IobT0wO208YTsrK20pZ1ttXT1jO2ZvcihyPTA7cjxmW2MtMV07KytyKWtbYy1cbjFdW3JdPWJbcl0saFtjLTFdW3JdPXI7Zm9yKG09MDttPGM7KyttKWxbbV09MDsxPT09ZVtjLTFdJiYoLS1nWzBdLCsrbFtjLTFdKTtmb3IocD1jLTI7MDw9cDstLXApe3Y9bT0wO3g9bFtwKzFdO2ZvcihyPTA7cjxmW3BdO3IrKyl2PWtbcCsxXVt4XStrW3ArMV1beCsxXSx2PmJbbV0/KGtbcF1bcl09dixoW3BdW3JdPWEseCs9Mik6KGtbcF1bcl09YlttXSxoW3BdW3JdPW0sKyttKTtsW3BdPTA7MT09PWVbcF0mJmQocCl9cmV0dXJuIGd9XG5mdW5jdGlvbiB0YShiKXt2YXIgYT1uZXcgKEE/VWludDE2QXJyYXk6QXJyYXkpKGIubGVuZ3RoKSxjPVtdLGQ9W10sZj0wLGUsZyxrLGg7ZT0wO2ZvcihnPWIubGVuZ3RoO2U8ZztlKyspY1tiW2VdXT0oY1tiW2VdXXwwKSsxO2U9MTtmb3IoZz0xNjtlPD1nO2UrKylkW2VdPWYsZis9Y1tlXXwwLGY8PD0xO2U9MDtmb3IoZz1iLmxlbmd0aDtlPGc7ZSsrKXtmPWRbYltlXV07ZFtiW2VdXSs9MTtrPWFbZV09MDtmb3IoaD1iW2VdO2s8aDtrKyspYVtlXT1hW2VdPDwxfGYmMSxmPj4+PTF9cmV0dXJuIGF9O2Z1bmN0aW9uIEFhKGIsYSl7dGhpcy5pbnB1dD1iO3RoaXMuYj10aGlzLmM9MDt0aGlzLmc9e307YSYmKGEuZmxhZ3MmJih0aGlzLmc9YS5mbGFncyksXCJzdHJpbmdcIj09PXR5cGVvZiBhLmZpbGVuYW1lJiYodGhpcy5maWxlbmFtZT1hLmZpbGVuYW1lKSxcInN0cmluZ1wiPT09dHlwZW9mIGEuY29tbWVudCYmKHRoaXMudz1hLmNvbW1lbnQpLGEuZGVmbGF0ZU9wdGlvbnMmJih0aGlzLmw9YS5kZWZsYXRlT3B0aW9ucykpO3RoaXMubHx8KHRoaXMubD17fSl9XG5BYS5wcm90b3R5cGUuaD1mdW5jdGlvbigpe3ZhciBiLGEsYyxkLGYsZSxnLGssaD1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMzI3NjgpLGw9MCxzPXRoaXMuaW5wdXQsbj10aGlzLmMsbT10aGlzLmZpbGVuYW1lLHA9dGhpcy53O2hbbCsrXT0zMTtoW2wrK109MTM5O2hbbCsrXT04O2I9MDt0aGlzLmcuZm5hbWUmJihifD1CYSk7dGhpcy5nLmZjb21tZW50JiYoYnw9Q2EpO3RoaXMuZy5maGNyYyYmKGJ8PVJhKTtoW2wrK109YjthPShEYXRlLm5vdz9EYXRlLm5vdygpOituZXcgRGF0ZSkvMUUzfDA7aFtsKytdPWEmMjU1O2hbbCsrXT1hPj4+OCYyNTU7aFtsKytdPWE+Pj4xNiYyNTU7aFtsKytdPWE+Pj4yNCYyNTU7aFtsKytdPTA7aFtsKytdPVNhO2lmKHRoaXMuZy5mbmFtZSE9PXQpe2c9MDtmb3Ioaz1tLmxlbmd0aDtnPGs7KytnKWU9bS5jaGFyQ29kZUF0KGcpLDI1NTxlJiYoaFtsKytdPWU+Pj44JjI1NSksaFtsKytdPWUmMjU1O2hbbCsrXT0wfWlmKHRoaXMuZy5jb21tZW50KXtnPVxuMDtmb3Ioaz1wLmxlbmd0aDtnPGs7KytnKWU9cC5jaGFyQ29kZUF0KGcpLDI1NTxlJiYoaFtsKytdPWU+Pj44JjI1NSksaFtsKytdPWUmMjU1O2hbbCsrXT0wfXRoaXMuZy5maGNyYyYmKGM9UihoLDAsbCkmNjU1MzUsaFtsKytdPWMmMjU1LGhbbCsrXT1jPj4+OCYyNTUpO3RoaXMubC5vdXRwdXRCdWZmZXI9aDt0aGlzLmwub3V0cHV0SW5kZXg9bDtmPW5ldyBtYShzLHRoaXMubCk7aD1mLmgoKTtsPWYuYjtBJiYobCs4PmguYnVmZmVyLmJ5dGVMZW5ndGg/KHRoaXMuYT1uZXcgVWludDhBcnJheShsKzgpLHRoaXMuYS5zZXQobmV3IFVpbnQ4QXJyYXkoaC5idWZmZXIpKSxoPXRoaXMuYSk6aD1uZXcgVWludDhBcnJheShoLmJ1ZmZlcikpO2Q9UihzLHQsdCk7aFtsKytdPWQmMjU1O2hbbCsrXT1kPj4+OCYyNTU7aFtsKytdPWQ+Pj4xNiYyNTU7aFtsKytdPWQ+Pj4yNCYyNTU7az1zLmxlbmd0aDtoW2wrK109ayYyNTU7aFtsKytdPWs+Pj44JjI1NTtoW2wrK109az4+PjE2JjI1NTtoW2wrK109XG5rPj4+MjQmMjU1O3RoaXMuYz1uO0EmJmw8aC5sZW5ndGgmJih0aGlzLmE9aD1oLnN1YmFycmF5KDAsbCkpO3JldHVybiBofTt2YXIgU2E9MjU1LFJhPTIsQmE9OCxDYT0xNjtmdW5jdGlvbiBZKGIsYSl7dGhpcy5vPVtdO3RoaXMucD0zMjc2ODt0aGlzLmU9dGhpcy5qPXRoaXMuYz10aGlzLnM9MDt0aGlzLmlucHV0PUE/bmV3IFVpbnQ4QXJyYXkoYik6Yjt0aGlzLnU9ITE7dGhpcy5xPVRhO3RoaXMuSz0hMTtpZihhfHwhKGE9e30pKWEuaW5kZXgmJih0aGlzLmM9YS5pbmRleCksYS5idWZmZXJTaXplJiYodGhpcy5wPWEuYnVmZmVyU2l6ZSksYS5idWZmZXJUeXBlJiYodGhpcy5xPWEuYnVmZmVyVHlwZSksYS5yZXNpemUmJih0aGlzLks9YS5yZXNpemUpO3N3aXRjaCh0aGlzLnEpe2Nhc2UgVWE6dGhpcy5iPTMyNzY4O3RoaXMuYT1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMzI3NjgrdGhpcy5wKzI1OCk7YnJlYWs7Y2FzZSBUYTp0aGlzLmI9MDt0aGlzLmE9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKHRoaXMucCk7dGhpcy5mPXRoaXMuUzt0aGlzLno9dGhpcy5PO3RoaXMucj10aGlzLlE7YnJlYWs7ZGVmYXVsdDpxKEVycm9yKFwiaW52YWxpZCBpbmZsYXRlIG1vZGVcIikpfX1cbnZhciBVYT0wLFRhPTE7XG5ZLnByb3RvdHlwZS5pPWZ1bmN0aW9uKCl7Zm9yKDshdGhpcy51Oyl7dmFyIGI9Wih0aGlzLDMpO2ImMSYmKHRoaXMudT11KTtiPj4+PTE7c3dpdGNoKGIpe2Nhc2UgMDp2YXIgYT10aGlzLmlucHV0LGM9dGhpcy5jLGQ9dGhpcy5hLGY9dGhpcy5iLGU9dCxnPXQsaz10LGg9ZC5sZW5ndGgsbD10O3RoaXMuZT10aGlzLmo9MDtlPWFbYysrXTtlPT09dCYmcShFcnJvcihcImludmFsaWQgdW5jb21wcmVzc2VkIGJsb2NrIGhlYWRlcjogTEVOIChmaXJzdCBieXRlKVwiKSk7Zz1lO2U9YVtjKytdO2U9PT10JiZxKEVycm9yKFwiaW52YWxpZCB1bmNvbXByZXNzZWQgYmxvY2sgaGVhZGVyOiBMRU4gKHNlY29uZCBieXRlKVwiKSk7Z3w9ZTw8ODtlPWFbYysrXTtlPT09dCYmcShFcnJvcihcImludmFsaWQgdW5jb21wcmVzc2VkIGJsb2NrIGhlYWRlcjogTkxFTiAoZmlyc3QgYnl0ZSlcIikpO2s9ZTtlPWFbYysrXTtlPT09dCYmcShFcnJvcihcImludmFsaWQgdW5jb21wcmVzc2VkIGJsb2NrIGhlYWRlcjogTkxFTiAoc2Vjb25kIGJ5dGUpXCIpKTtrfD1cbmU8PDg7Zz09PX5rJiZxKEVycm9yKFwiaW52YWxpZCB1bmNvbXByZXNzZWQgYmxvY2sgaGVhZGVyOiBsZW5ndGggdmVyaWZ5XCIpKTtjK2c+YS5sZW5ndGgmJnEoRXJyb3IoXCJpbnB1dCBidWZmZXIgaXMgYnJva2VuXCIpKTtzd2l0Y2godGhpcy5xKXtjYXNlIFVhOmZvcig7ZitnPmQubGVuZ3RoOyl7bD1oLWY7Zy09bDtpZihBKWQuc2V0KGEuc3ViYXJyYXkoYyxjK2wpLGYpLGYrPWwsYys9bDtlbHNlIGZvcig7bC0tOylkW2YrK109YVtjKytdO3RoaXMuYj1mO2Q9dGhpcy5mKCk7Zj10aGlzLmJ9YnJlYWs7Y2FzZSBUYTpmb3IoO2YrZz5kLmxlbmd0aDspZD10aGlzLmYoe0I6Mn0pO2JyZWFrO2RlZmF1bHQ6cShFcnJvcihcImludmFsaWQgaW5mbGF0ZSBtb2RlXCIpKX1pZihBKWQuc2V0KGEuc3ViYXJyYXkoYyxjK2cpLGYpLGYrPWcsYys9ZztlbHNlIGZvcig7Zy0tOylkW2YrK109YVtjKytdO3RoaXMuYz1jO3RoaXMuYj1mO3RoaXMuYT1kO2JyZWFrO2Nhc2UgMTp0aGlzLnIoVmEsV2EpO2JyZWFrO1xuY2FzZSAyOlhhKHRoaXMpO2JyZWFrO2RlZmF1bHQ6cShFcnJvcihcInVua25vd24gQlRZUEU6IFwiK2IpKX19cmV0dXJuIHRoaXMueigpfTtcbnZhciBZYT1bMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV0sWmE9QT9uZXcgVWludDE2QXJyYXkoWWEpOllhLCRhPVszLDQsNSw2LDcsOCw5LDEwLDExLDEzLDE1LDE3LDE5LDIzLDI3LDMxLDM1LDQzLDUxLDU5LDY3LDgzLDk5LDExNSwxMzEsMTYzLDE5NSwyMjcsMjU4LDI1OCwyNThdLGFiPUE/bmV3IFVpbnQxNkFycmF5KCRhKTokYSxiYj1bMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMiwyLDIsMiwzLDMsMywzLDQsNCw0LDQsNSw1LDUsNSwwLDAsMF0sY2I9QT9uZXcgVWludDhBcnJheShiYik6YmIsZGI9WzEsMiwzLDQsNSw3LDksMTMsMTcsMjUsMzMsNDksNjUsOTcsMTI5LDE5MywyNTcsMzg1LDUxMyw3NjksMTAyNSwxNTM3LDIwNDksMzA3Myw0MDk3LDYxNDUsODE5MywxMjI4OSwxNjM4NSwyNDU3N10sZWI9QT9uZXcgVWludDE2QXJyYXkoZGIpOmRiLGZiPVswLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw2LDcsNyw4LDgsOSw5LDEwLFxuMTAsMTEsMTEsMTIsMTIsMTMsMTNdLGdiPUE/bmV3IFVpbnQ4QXJyYXkoZmIpOmZiLGhiPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgyODgpLCQsaWI7JD0wO2ZvcihpYj1oYi5sZW5ndGg7JDxpYjsrKyQpaGJbJF09MTQzPj0kPzg6MjU1Pj0kPzk6Mjc5Pj0kPzc6ODt2YXIgVmE9amEoaGIpLGpiPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KSgzMCksa2IsbGI7a2I9MDtmb3IobGI9amIubGVuZ3RoO2tiPGxiOysra2IpamJba2JdPTU7dmFyIFdhPWphKGpiKTtmdW5jdGlvbiBaKGIsYSl7Zm9yKHZhciBjPWIuaixkPWIuZSxmPWIuaW5wdXQsZT1iLmMsZztkPGE7KWc9ZltlKytdLGc9PT10JiZxKEVycm9yKFwiaW5wdXQgYnVmZmVyIGlzIGJyb2tlblwiKSksY3w9Zzw8ZCxkKz04O2c9YyYoMTw8YSktMTtiLmo9Yz4+PmE7Yi5lPWQtYTtiLmM9ZTtyZXR1cm4gZ31cbmZ1bmN0aW9uIG1iKGIsYSl7Zm9yKHZhciBjPWIuaixkPWIuZSxmPWIuaW5wdXQsZT1iLmMsZz1hWzBdLGs9YVsxXSxoLGwscztkPGs7KXtoPWZbZSsrXTtpZihoPT09dClicmVhaztjfD1oPDxkO2QrPTh9bD1nW2MmKDE8PGspLTFdO3M9bD4+PjE2O2Iuaj1jPj5zO2IuZT1kLXM7Yi5jPWU7cmV0dXJuIGwmNjU1MzV9XG5mdW5jdGlvbiBYYShiKXtmdW5jdGlvbiBhKGEsYixjKXt2YXIgZCxlLGYsZztmb3IoZz0wO2c8YTspc3dpdGNoKGQ9bWIodGhpcyxiKSxkKXtjYXNlIDE2OmZvcihmPTMrWih0aGlzLDIpO2YtLTspY1tnKytdPWU7YnJlYWs7Y2FzZSAxNzpmb3IoZj0zK1oodGhpcywzKTtmLS07KWNbZysrXT0wO2U9MDticmVhaztjYXNlIDE4OmZvcihmPTExK1oodGhpcyw3KTtmLS07KWNbZysrXT0wO2U9MDticmVhaztkZWZhdWx0OmU9Y1tnKytdPWR9cmV0dXJuIGN9dmFyIGM9WihiLDUpKzI1NyxkPVooYiw1KSsxLGY9WihiLDQpKzQsZT1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoWmEubGVuZ3RoKSxnLGssaCxsO2ZvcihsPTA7bDxmOysrbCllW1phW2xdXT1aKGIsMyk7Zz1qYShlKTtrPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KShjKTtoPW5ldyAoQT9VaW50OEFycmF5OkFycmF5KShkKTtiLnIoamEoYS5jYWxsKGIsYyxnLGspKSxqYShhLmNhbGwoYixkLGcsaCkpKX1cblkucHJvdG90eXBlLnI9ZnVuY3Rpb24oYixhKXt2YXIgYz10aGlzLmEsZD10aGlzLmI7dGhpcy5BPWI7Zm9yKHZhciBmPWMubGVuZ3RoLTI1OCxlLGcsayxoOzI1NiE9PShlPW1iKHRoaXMsYikpOylpZigyNTY+ZSlkPj1mJiYodGhpcy5iPWQsYz10aGlzLmYoKSxkPXRoaXMuYiksY1tkKytdPWU7ZWxzZXtnPWUtMjU3O2g9YWJbZ107MDxjYltnXSYmKGgrPVoodGhpcyxjYltnXSkpO2U9bWIodGhpcyxhKTtrPWViW2VdOzA8Z2JbZV0mJihrKz1aKHRoaXMsZ2JbZV0pKTtkPj1mJiYodGhpcy5iPWQsYz10aGlzLmYoKSxkPXRoaXMuYik7Zm9yKDtoLS07KWNbZF09Y1tkKysta119Zm9yKDs4PD10aGlzLmU7KXRoaXMuZS09OCx0aGlzLmMtLTt0aGlzLmI9ZH07XG5ZLnByb3RvdHlwZS5RPWZ1bmN0aW9uKGIsYSl7dmFyIGM9dGhpcy5hLGQ9dGhpcy5iO3RoaXMuQT1iO2Zvcih2YXIgZj1jLmxlbmd0aCxlLGcsayxoOzI1NiE9PShlPW1iKHRoaXMsYikpOylpZigyNTY+ZSlkPj1mJiYoYz10aGlzLmYoKSxmPWMubGVuZ3RoKSxjW2QrK109ZTtlbHNle2c9ZS0yNTc7aD1hYltnXTswPGNiW2ddJiYoaCs9Wih0aGlzLGNiW2ddKSk7ZT1tYih0aGlzLGEpO2s9ZWJbZV07MDxnYltlXSYmKGsrPVoodGhpcyxnYltlXSkpO2QraD5mJiYoYz10aGlzLmYoKSxmPWMubGVuZ3RoKTtmb3IoO2gtLTspY1tkXT1jW2QrKy1rXX1mb3IoOzg8PXRoaXMuZTspdGhpcy5lLT04LHRoaXMuYy0tO3RoaXMuYj1kfTtcblkucHJvdG90eXBlLmY9ZnVuY3Rpb24oKXt2YXIgYj1uZXcgKEE/VWludDhBcnJheTpBcnJheSkodGhpcy5iLTMyNzY4KSxhPXRoaXMuYi0zMjc2OCxjLGQsZj10aGlzLmE7aWYoQSliLnNldChmLnN1YmFycmF5KDMyNzY4LGIubGVuZ3RoKSk7ZWxzZXtjPTA7Zm9yKGQ9Yi5sZW5ndGg7YzxkOysrYyliW2NdPWZbYyszMjc2OF19dGhpcy5vLnB1c2goYik7dGhpcy5zKz1iLmxlbmd0aDtpZihBKWYuc2V0KGYuc3ViYXJyYXkoYSxhKzMyNzY4KSk7ZWxzZSBmb3IoYz0wOzMyNzY4PmM7KytjKWZbY109ZlthK2NdO3RoaXMuYj0zMjc2ODtyZXR1cm4gZn07XG5ZLnByb3RvdHlwZS5TPWZ1bmN0aW9uKGIpe3ZhciBhLGM9dGhpcy5pbnB1dC5sZW5ndGgvdGhpcy5jKzF8MCxkLGYsZSxnPXRoaXMuaW5wdXQsaz10aGlzLmE7YiYmKFwibnVtYmVyXCI9PT10eXBlb2YgYi5CJiYoYz1iLkIpLFwibnVtYmVyXCI9PT10eXBlb2YgYi5NJiYoYys9Yi5NKSk7Mj5jPyhkPShnLmxlbmd0aC10aGlzLmMpL3RoaXMuQVsyXSxlPTI1OCooZC8yKXwwLGY9ZTxrLmxlbmd0aD9rLmxlbmd0aCtlOmsubGVuZ3RoPDwxKTpmPWsubGVuZ3RoKmM7QT8oYT1uZXcgVWludDhBcnJheShmKSxhLnNldChrKSk6YT1rO3JldHVybiB0aGlzLmE9YX07XG5ZLnByb3RvdHlwZS56PWZ1bmN0aW9uKCl7dmFyIGI9MCxhPXRoaXMuYSxjPXRoaXMubyxkLGY9bmV3IChBP1VpbnQ4QXJyYXk6QXJyYXkpKHRoaXMucysodGhpcy5iLTMyNzY4KSksZSxnLGssaDtpZigwPT09Yy5sZW5ndGgpcmV0dXJuIEE/dGhpcy5hLnN1YmFycmF5KDMyNzY4LHRoaXMuYik6dGhpcy5hLnNsaWNlKDMyNzY4LHRoaXMuYik7ZT0wO2ZvcihnPWMubGVuZ3RoO2U8ZzsrK2Upe2Q9Y1tlXTtrPTA7Zm9yKGg9ZC5sZW5ndGg7azxoOysraylmW2IrK109ZFtrXX1lPTMyNzY4O2ZvcihnPXRoaXMuYjtlPGc7KytlKWZbYisrXT1hW2VdO3RoaXMubz1bXTtyZXR1cm4gdGhpcy5idWZmZXI9Zn07XG5ZLnByb3RvdHlwZS5PPWZ1bmN0aW9uKCl7dmFyIGIsYT10aGlzLmI7QT90aGlzLks/KGI9bmV3IFVpbnQ4QXJyYXkoYSksYi5zZXQodGhpcy5hLnN1YmFycmF5KDAsYSkpKTpiPXRoaXMuYS5zdWJhcnJheSgwLGEpOih0aGlzLmEubGVuZ3RoPmEmJih0aGlzLmEubGVuZ3RoPWEpLGI9dGhpcy5hKTtyZXR1cm4gdGhpcy5idWZmZXI9Yn07ZnVuY3Rpb24gbmIoYil7dGhpcy5pbnB1dD1iO3RoaXMuYz0wO3RoaXMuRz1bXTt0aGlzLlI9ITF9XG5uYi5wcm90b3R5cGUuaT1mdW5jdGlvbigpe2Zvcih2YXIgYj10aGlzLmlucHV0Lmxlbmd0aDt0aGlzLmM8Yjspe3ZhciBhPW5ldyBoYSxjPXQsZD10LGY9dCxlPXQsZz10LGs9dCxoPXQsbD10LHM9dCxuPXRoaXMuaW5wdXQsbT10aGlzLmM7YS5DPW5bbSsrXTthLkQ9blttKytdOygzMSE9PWEuQ3x8MTM5IT09YS5EKSYmcShFcnJvcihcImludmFsaWQgZmlsZSBzaWduYXR1cmU6XCIrYS5DK1wiLFwiK2EuRCkpO2Eudj1uW20rK107c3dpdGNoKGEudil7Y2FzZSA4OmJyZWFrO2RlZmF1bHQ6cShFcnJvcihcInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kOiBcIithLnYpKX1hLm49blttKytdO2w9blttKytdfG5bbSsrXTw8OHxuW20rK108PDE2fG5bbSsrXTw8MjQ7YS4kPW5ldyBEYXRlKDFFMypsKTthLmJhPW5bbSsrXTthLmFhPW5bbSsrXTswPChhLm4mNCkmJihhLlc9blttKytdfG5bbSsrXTw8OCxtKz1hLlcpO2lmKDA8KGEubiZCYSkpe2g9W107Zm9yKGs9MDswPChnPW5bbSsrXSk7KWhbaysrXT1cblN0cmluZy5mcm9tQ2hhckNvZGUoZyk7YS5uYW1lPWguam9pbihcIlwiKX1pZigwPChhLm4mQ2EpKXtoPVtdO2ZvcihrPTA7MDwoZz1uW20rK10pOyloW2srK109U3RyaW5nLmZyb21DaGFyQ29kZShnKTthLnc9aC5qb2luKFwiXCIpfTA8KGEubiZSYSkmJihhLlA9UihuLDAsbSkmNjU1MzUsYS5QIT09KG5bbSsrXXxuW20rK108PDgpJiZxKEVycm9yKFwiaW52YWxpZCBoZWFkZXIgY3JjMTZcIikpKTtjPW5bbi5sZW5ndGgtNF18bltuLmxlbmd0aC0zXTw8OHxuW24ubGVuZ3RoLTJdPDwxNnxuW24ubGVuZ3RoLTFdPDwyNDtuLmxlbmd0aC1tLTQtNDw1MTIqYyYmKGU9Yyk7ZD1uZXcgWShuLHtpbmRleDptLGJ1ZmZlclNpemU6ZX0pO2EuZGF0YT1mPWQuaSgpO209ZC5jO2EuWT1zPShuW20rK118blttKytdPDw4fG5bbSsrXTw8MTZ8blttKytdPDwyNCk+Pj4wO1IoZix0LHQpIT09cyYmcShFcnJvcihcImludmFsaWQgQ1JDLTMyIGNoZWNrc3VtOiAweFwiK1IoZix0LHQpLnRvU3RyaW5nKDE2KStcIiAvIDB4XCIrXG5zLnRvU3RyaW5nKDE2KSkpO2EuWj1jPShuW20rK118blttKytdPDw4fG5bbSsrXTw8MTZ8blttKytdPDwyNCk+Pj4wOyhmLmxlbmd0aCY0Mjk0OTY3Mjk1KSE9PWMmJnEoRXJyb3IoXCJpbnZhbGlkIGlucHV0IHNpemU6IFwiKyhmLmxlbmd0aCY0Mjk0OTY3Mjk1KStcIiAvIFwiK2MpKTt0aGlzLkcucHVzaChhKTt0aGlzLmM9bX10aGlzLlI9dTt2YXIgcD10aGlzLkcscix2LHg9MCxPPTAseTtyPTA7Zm9yKHY9cC5sZW5ndGg7cjx2OysrcilPKz1wW3JdLmRhdGEubGVuZ3RoO2lmKEEpe3k9bmV3IFVpbnQ4QXJyYXkoTyk7Zm9yKHI9MDtyPHY7KytyKXkuc2V0KHBbcl0uZGF0YSx4KSx4Kz1wW3JdLmRhdGEubGVuZ3RofWVsc2V7eT1bXTtmb3Iocj0wO3I8djsrK3IpeVtyXT1wW3JdLmRhdGE7eT1BcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLHkpfXJldHVybiB5fTtmdW5jdGlvbiBvYihiKXtpZihcInN0cmluZ1wiPT09dHlwZW9mIGIpe3ZhciBhPWIuc3BsaXQoXCJcIiksYyxkO2M9MDtmb3IoZD1hLmxlbmd0aDtjPGQ7YysrKWFbY109KGFbY10uY2hhckNvZGVBdCgwKSYyNTUpPj4+MDtiPWF9Zm9yKHZhciBmPTEsZT0wLGc9Yi5sZW5ndGgsayxoPTA7MDxnOyl7az0xMDI0PGc/MTAyNDpnO2ctPWs7ZG8gZis9YltoKytdLGUrPWY7d2hpbGUoLS1rKTtmJT02NTUyMTtlJT02NTUyMX1yZXR1cm4oZTw8MTZ8Zik+Pj4wfTtmdW5jdGlvbiBwYihiLGEpe3ZhciBjLGQ7dGhpcy5pbnB1dD1iO3RoaXMuYz0wO2lmKGF8fCEoYT17fSkpYS5pbmRleCYmKHRoaXMuYz1hLmluZGV4KSxhLnZlcmlmeSYmKHRoaXMuVj1hLnZlcmlmeSk7Yz1iW3RoaXMuYysrXTtkPWJbdGhpcy5jKytdO3N3aXRjaChjJjE1KXtjYXNlIHJiOnRoaXMubWV0aG9kPXJiO2JyZWFrO2RlZmF1bHQ6cShFcnJvcihcInVuc3VwcG9ydGVkIGNvbXByZXNzaW9uIG1ldGhvZFwiKSl9MCE9PSgoYzw8OCkrZCklMzEmJnEoRXJyb3IoXCJpbnZhbGlkIGZjaGVjayBmbGFnOlwiKygoYzw8OCkrZCklMzEpKTtkJjMyJiZxKEVycm9yKFwiZmRpY3QgZmxhZyBpcyBub3Qgc3VwcG9ydGVkXCIpKTt0aGlzLko9bmV3IFkoYix7aW5kZXg6dGhpcy5jLGJ1ZmZlclNpemU6YS5idWZmZXJTaXplLGJ1ZmZlclR5cGU6YS5idWZmZXJUeXBlLHJlc2l6ZTphLnJlc2l6ZX0pfVxucGIucHJvdG90eXBlLmk9ZnVuY3Rpb24oKXt2YXIgYj10aGlzLmlucHV0LGEsYzthPXRoaXMuSi5pKCk7dGhpcy5jPXRoaXMuSi5jO3RoaXMuViYmKGM9KGJbdGhpcy5jKytdPDwyNHxiW3RoaXMuYysrXTw8MTZ8Ylt0aGlzLmMrK108PDh8Ylt0aGlzLmMrK10pPj4+MCxjIT09b2IoYSkmJnEoRXJyb3IoXCJpbnZhbGlkIGFkbGVyLTMyIGNoZWNrc3VtXCIpKSk7cmV0dXJuIGF9O3ZhciByYj04O2Z1bmN0aW9uIHNiKGIsYSl7dGhpcy5pbnB1dD1iO3RoaXMuYT1uZXcgKEE/VWludDhBcnJheTpBcnJheSkoMzI3NjgpO3RoaXMuaz10Yi50O3ZhciBjPXt9LGQ7aWYoKGF8fCEoYT17fSkpJiZcIm51bWJlclwiPT09dHlwZW9mIGEuY29tcHJlc3Npb25UeXBlKXRoaXMuaz1hLmNvbXByZXNzaW9uVHlwZTtmb3IoZCBpbiBhKWNbZF09YVtkXTtjLm91dHB1dEJ1ZmZlcj10aGlzLmE7dGhpcy5JPW5ldyBtYSh0aGlzLmlucHV0LGMpfXZhciB0Yj1vYTtcbnNiLnByb3RvdHlwZS5oPWZ1bmN0aW9uKCl7dmFyIGIsYSxjLGQsZixlLGcsaz0wO2c9dGhpcy5hO2I9cmI7c3dpdGNoKGIpe2Nhc2UgcmI6YT1NYXRoLkxPRzJFKk1hdGgubG9nKDMyNzY4KS04O2JyZWFrO2RlZmF1bHQ6cShFcnJvcihcImludmFsaWQgY29tcHJlc3Npb24gbWV0aG9kXCIpKX1jPWE8PDR8YjtnW2srK109Yztzd2l0Y2goYil7Y2FzZSByYjpzd2l0Y2godGhpcy5rKXtjYXNlIHRiLk5PTkU6Zj0wO2JyZWFrO2Nhc2UgdGIuTDpmPTE7YnJlYWs7Y2FzZSB0Yi50OmY9MjticmVhaztkZWZhdWx0OnEoRXJyb3IoXCJ1bnN1cHBvcnRlZCBjb21wcmVzc2lvbiB0eXBlXCIpKX1icmVhaztkZWZhdWx0OnEoRXJyb3IoXCJpbnZhbGlkIGNvbXByZXNzaW9uIG1ldGhvZFwiKSl9ZD1mPDw2fDA7Z1trKytdPWR8MzEtKDI1NipjK2QpJTMxO2U9b2IodGhpcy5pbnB1dCk7dGhpcy5JLmI9aztnPXRoaXMuSS5oKCk7az1nLmxlbmd0aDtBJiYoZz1uZXcgVWludDhBcnJheShnLmJ1ZmZlciksZy5sZW5ndGg8PVxuays0JiYodGhpcy5hPW5ldyBVaW50OEFycmF5KGcubGVuZ3RoKzQpLHRoaXMuYS5zZXQoZyksZz10aGlzLmEpLGc9Zy5zdWJhcnJheSgwLGsrNCkpO2dbaysrXT1lPj4yNCYyNTU7Z1trKytdPWU+PjE2JjI1NTtnW2srK109ZT4+OCYyNTU7Z1trKytdPWUmMjU1O3JldHVybiBnfTtleHBvcnRzLmRlZmxhdGU9dWI7ZXhwb3J0cy5kZWZsYXRlU3luYz12YjtleHBvcnRzLmluZmxhdGU9d2I7ZXhwb3J0cy5pbmZsYXRlU3luYz14YjtleHBvcnRzLmd6aXA9eWI7ZXhwb3J0cy5nemlwU3luYz16YjtleHBvcnRzLmd1bnppcD1BYjtleHBvcnRzLmd1bnppcFN5bmM9QmI7ZnVuY3Rpb24gdWIoYixhLGMpe3Byb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKXt2YXIgZCxmO3RyeXtmPXZiKGIsYyl9Y2F0Y2goZSl7ZD1lfWEoZCxmKX0pfWZ1bmN0aW9uIHZiKGIsYSl7dmFyIGM7Yz0obmV3IHNiKGIpKS5oKCk7YXx8KGE9e30pO3JldHVybiBhLkg/YzpDYihjKX1mdW5jdGlvbiB3YihiLGEsYyl7cHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpe3ZhciBkLGY7dHJ5e2Y9eGIoYixjKX1jYXRjaChlKXtkPWV9YShkLGYpfSl9XG5mdW5jdGlvbiB4YihiLGEpe3ZhciBjO2Iuc3ViYXJyYXk9Yi5zbGljZTtjPShuZXcgcGIoYikpLmkoKTthfHwoYT17fSk7cmV0dXJuIGEubm9CdWZmZXI/YzpDYihjKX1mdW5jdGlvbiB5YihiLGEsYyl7cHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpe3ZhciBkLGY7dHJ5e2Y9emIoYixjKX1jYXRjaChlKXtkPWV9YShkLGYpfSl9ZnVuY3Rpb24gemIoYixhKXt2YXIgYztiLnN1YmFycmF5PWIuc2xpY2U7Yz0obmV3IEFhKGIpKS5oKCk7YXx8KGE9e30pO3JldHVybiBhLkg/YzpDYihjKX1mdW5jdGlvbiBBYihiLGEsYyl7cHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpe3ZhciBkLGY7dHJ5e2Y9QmIoYixjKX1jYXRjaChlKXtkPWV9YShkLGYpfSl9ZnVuY3Rpb24gQmIoYixhKXt2YXIgYztiLnN1YmFycmF5PWIuc2xpY2U7Yz0obmV3IG5iKGIpKS5pKCk7YXx8KGE9e30pO3JldHVybiBhLkg/YzpDYihjKX1cbmZ1bmN0aW9uIENiKGIpe3ZhciBhPW5ldyBCdWZmZXIoYi5sZW5ndGgpLGMsZDtjPTA7Zm9yKGQ9Yi5sZW5ndGg7YzxkOysrYylhW2NdPWJbY107cmV0dXJuIGF9O30pLmNhbGwodGhpcyk7IC8vQCBzb3VyY2VNYXBwaW5nVVJMPW5vZGUtemxpYi5qcy5tYXBcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIvVXNlcnMvYmxpeHQvc3JjL3N0YXJib3VuZGVkL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIpLHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyKSIsInZhciBXb3JsZCA9IHJlcXVpcmUoJ3N0YXJib3VuZC1maWxlcycpLldvcmxkO1xudmFyIHdvcmtlcnByb3h5ID0gcmVxdWlyZSgnd29ya2VycHJveHknKTtcblxudmFyIG1ldGFkYXRhLCB3b3JsZDtcblxud29ya2VycHJveHkoe1xuICBnZXRSZWdpb246IGZ1bmN0aW9uICh4LCB5LCBjYWxsYmFjaykge1xuICAgIGlmICghd29ybGQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSB3b3JsZCBoYXMgdG8gYmUgb3BlbmVkIGJlZm9yZSBnZXR0aW5nIHJlZ2lvbnMuJyk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogQ2FjaGUgcmVnaW9ucy5cbiAgICB2YXIgYnVmZmVyID0gd29ybGQuZ2V0UmVnaW9uRGF0YSgxLCB4LCB5KSxcbiAgICAgICAgZW50aXRpZXMgPSB3b3JsZC5nZXRFbnRpdGllcyh4LCB5KTtcblxuICAgIHZhciByZWdpb24gPSB7YnVmZmVyOiBidWZmZXIsIGVudGl0aWVzOiBlbnRpdGllc307XG4gICAgY2FsbGJhY2sudHJhbnNmZXIoW3JlZ2lvbi5idWZmZXJdLCBudWxsLCByZWdpb24pO1xuICB9LFxuXG4gIG9wZW46IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xuICAgIGlmICh3b3JsZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIHdvcmxkIGhhcyBhbHJlYWR5IGJlZW4gb3BlbmVkLicpO1xuICAgIH1cblxuICAgIHdvcmxkID0gV29ybGQub3BlbihmaWxlKTtcbiAgICBtZXRhZGF0YSA9IHdvcmxkLmdldE1ldGFkYXRhKCk7XG5cbiAgICBjYWxsYmFjayhudWxsLCBtZXRhZGF0YSk7XG4gIH1cbn0sIHtjYXRjaEVycm9yczogdHJ1ZX0pO1xuIiwiZXhwb3J0cy5CbG9ja0ZpbGUgPSByZXF1aXJlKCcuL2xpYi9ibG9ja2ZpbGUnKTtcbmV4cG9ydHMuQlRyZWVEQiA9IHJlcXVpcmUoJy4vbGliL2J0cmVlZGInKTtcbmV4cG9ydHMuUGFja2FnZSA9IHJlcXVpcmUoJy4vbGliL3BhY2thZ2UnKTtcbmV4cG9ydHMuU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vbGliL3Nib25yZWFkZXInKTtcbmV4cG9ydHMuV29ybGQgPSByZXF1aXJlKCcuL2xpYi93b3JsZCcpO1xuIiwidmFyIFNib25SZWFkZXIgPSByZXF1aXJlKCcuL3Nib25yZWFkZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja0ZpbGU7XG5cbi8qKlxuICogU2l6ZSBvZiB0aGUgaW5pdGlhbCBtZXRhZGF0YSByZXF1aXJlZCB0byBiZSBhYmxlIHRvIHJlYWQgdGhlIHJlc3Qgb2YgdGhlXG4gKiBibG9jayBmaWxlLlxuICovXG52YXIgTUVUQURBVEFfU0laRSA9IDMyO1xuXG52YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyU3luYygpO1xuXG5mdW5jdGlvbiBCbG9ja0ZpbGUoZmlsZSwgaGVhZGVyU2l6ZSwgYmxvY2tTaXplKSB7XG4gIHRoaXMuZmlsZSA9IGZpbGU7XG4gIHRoaXMuaGVhZGVyU2l6ZSA9IGhlYWRlclNpemU7XG4gIHRoaXMuYmxvY2tTaXplID0gYmxvY2tTaXplO1xuXG4gIC8vIFRPRE86IE1ha2Ugc3VyZSB0byByZWNhbGN1bGF0ZSB0aGlzIHdoZW4gbmVjZXNzYXJ5LlxuICB0aGlzLmJsb2NrQ291bnQgPSBNYXRoLmZsb29yKChmaWxlLnNpemUgLSB0aGlzLmhlYWRlclNpemUpIC8gdGhpcy5ibG9ja1NpemUpO1xuXG4gIHRoaXMuZnJlZUJsb2NrSXNEaXJ0eSA9IGZhbHNlO1xuICB0aGlzLmZyZWVCbG9jayA9IG51bGw7XG5cbiAgdGhpcy5fdXNlckhlYWRlciA9IG51bGw7XG59XG5cbkJsb2NrRmlsZS5vcGVuID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgdmFyIGJ1ZmZlciA9IGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZS5zbGljZSgwLCBNRVRBREFUQV9TSVpFKSk7XG5cbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKGJ1ZmZlcik7XG5cbiAgaWYgKHJlYWRlci5yZWFkQnl0ZVN0cmluZyg2KSAhPSAnU0JCRjAyJykge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgYmxvY2sgZmlsZSBmb3JtYXQnKTtcbiAgfVxuXG4gIHZhciBoZWFkZXJTaXplID0gcmVhZGVyLnJlYWRJbnQzMigpLFxuICAgICAgYmxvY2tTaXplID0gcmVhZGVyLnJlYWRJbnQzMigpO1xuXG4gIHZhciBibG9ja0ZpbGUgPSBuZXcgQmxvY2tGaWxlKGZpbGUsIGhlYWRlclNpemUsIGJsb2NrU2l6ZSk7XG5cbiAgYmxvY2tGaWxlLmZyZWVCbG9ja0lzRGlydHkgPSByZWFkZXIucmVhZEJvb2xlYW4oKTtcbiAgYmxvY2tGaWxlLmZyZWVCbG9jayA9IHJlYWRlci5yZWFkSW50MzIoKTtcblxuICByZXR1cm4gYmxvY2tGaWxlO1xufTtcblxuLyoqXG4gKiBMb2FkcyB0aGUgZGF0YSBpbiBhIGJsb2NrIGFuZCByZXR1cm5zIGEgd3JhcHBlciBmb3IgYWNjZXNzaW5nIGl0LlxuICovXG5CbG9ja0ZpbGUucHJvdG90eXBlLmdldEJsb2NrID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5ibG9ja0NvdW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbmRleCBvdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICB2YXIgc3RhcnQgPSB0aGlzLmhlYWRlclNpemUgKyB0aGlzLmJsb2NrU2l6ZSAqIGluZGV4LFxuICAgICAgZW5kID0gc3RhcnQgKyB0aGlzLmJsb2NrU2l6ZTtcblxuICB2YXIgYnVmZmVyID0gZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih0aGlzLmZpbGUuc2xpY2Uoc3RhcnQsIGVuZCkpO1xuXG4gIHZhciB0eXBlRGF0YSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgMCwgMik7XG4gIHZhciBibG9jayA9IHtcbiAgICB0eXBlOiBTdHJpbmcuZnJvbUNoYXJDb2RlKHR5cGVEYXRhWzBdLCB0eXBlRGF0YVsxXSksXG4gICAgYnVmZmVyOiBidWZmZXIuc2xpY2UoMilcbiAgfTtcblxuICByZXR1cm4gYmxvY2s7XG59O1xuXG5CbG9ja0ZpbGUucHJvdG90eXBlLmdldFVzZXJIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl91c2VySGVhZGVyKSByZXR1cm4gdGhpcy5fdXNlckhlYWRlcjtcblxuICB2YXIgc3RhcnQgPSBNRVRBREFUQV9TSVpFLCBlbmQgPSB0aGlzLmhlYWRlclNpemU7XG4gIHZhciBidWZmZXIgPSBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHRoaXMuZmlsZS5zbGljZShzdGFydCwgZW5kKSk7XG4gIHRoaXMuX3VzZXJIZWFkZXIgPSBidWZmZXI7XG4gIHJldHVybiBidWZmZXI7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbnZhciBCbG9ja0ZpbGUgPSByZXF1aXJlKCcuL2Jsb2NrZmlsZScpO1xudmFyIFNib25SZWFkZXIgPSByZXF1aXJlKCcuL3Nib25yZWFkZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCVHJlZURCO1xuXG52YXIgQkxPQ0tfSU5ERVggPSAnSUknO1xudmFyIEJMT0NLX0xFQUYgPSAnTEwnO1xuXG5mdW5jdGlvbiBCVHJlZURCKGJsb2NrRmlsZSwgaWRlbnRpZmllciwga2V5U2l6ZSkge1xuICB0aGlzLmJsb2NrRmlsZSA9IGJsb2NrRmlsZTtcbiAgdGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllcjtcbiAgdGhpcy5rZXlTaXplID0ga2V5U2l6ZTtcblxuICB0aGlzLmFsdGVybmF0ZVJvb3ROb2RlID0gZmFsc2U7XG4gIHRoaXMucm9vdE5vZGUgPSBudWxsO1xuICB0aGlzLnJvb3ROb2RlSXNMZWFmID0gZmFsc2U7XG59XG5cbkJUcmVlREIub3BlbiA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHZhciBibG9ja0ZpbGUgPSBCbG9ja0ZpbGUub3BlbihmaWxlKTtcblxuICB2YXIgYnVmZmVyID0gYmxvY2tGaWxlLmdldFVzZXJIZWFkZXIoKTtcbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKGJ1ZmZlcik7XG5cbiAgaWYgKHJlYWRlci5yZWFkRml4ZWRTdHJpbmcoMTIpICE9ICdCVHJlZURCNCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGRhdGFiYXNlIGZvcm1hdCcpO1xuICB9XG5cbiAgdmFyIGlkZW50aWZpZXIgPSByZWFkZXIucmVhZEZpeGVkU3RyaW5nKDEyKSxcbiAgICAgIGtleVNpemUgPSByZWFkZXIucmVhZEludDMyKCk7XG5cbiAgdmFyIGRiID0gbmV3IEJUcmVlREIoYmxvY2tGaWxlLCBpZGVudGlmaWVyLCBrZXlTaXplKTtcblxuICAvLyBXaGV0aGVyIHdlIHNob3VsZCBiZSB1c2luZyB0aGUgYWx0ZXJuYXRlIHJvb3Qgbm9kZSByZWZlcmVuY2UuXG4gIGRiLmFsdGVybmF0ZVJvb3ROb2RlID0gcmVhZGVyLnJlYWRCb29sZWFuKCk7XG5cbiAgLy8gU2tpcCBhaGVhZCBiYXNlZCBvbiB3aGV0aGVyIHdlJ3JlIGFsdGVybmF0aW5nIHJlZmVyZW5jZXMuXG4gIHJlYWRlci5zZWVrKGRiLmFsdGVybmF0ZVJvb3ROb2RlID8gOSA6IDEsIHRydWUpO1xuXG4gIGRiLnJvb3ROb2RlID0gcmVhZGVyLnJlYWRJbnQzMigpO1xuICBkYi5yb290Tm9kZUlzTGVhZiA9IHJlYWRlci5yZWFkQm9vbGVhbigpO1xuXG4gIHJldHVybiBkYjtcbn07XG5cbkJUcmVlREIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKGtleS5sZW5ndGggIT0gdGhpcy5rZXlTaXplKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQcm92aWRlZCBrZXkgbXVzdCBiZSBvZiB0aGUgY29ycmVjdCBsZW5ndGgnKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLnNlYXJjaCh0aGlzLnJvb3ROb2RlLCBrZXkpO1xufTtcblxuQlRyZWVEQi5wcm90b3R5cGUuZ2V0TGVhZlZhbHVlID0gZnVuY3Rpb24gKGJsb2NrLCBrZXkpIHtcbiAgaWYgKGJsb2NrLnR5cGUgIT0gQkxPQ0tfTEVBRikge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYSBsZWFmIG5vZGUnKTtcbiAgfVxuXG4gIHZhciByZWFkZXIgPSBuZXcgTGVhZlJlYWRlcih0aGlzLmJsb2NrRmlsZSwgYmxvY2spO1xuICB2YXIga2V5Q291bnQgPSByZWFkZXIucmVhZEludDMyKCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlDb3VudDsgaSsrKSB7XG4gICAgLy8gR2V0IHRoZSBrZXkgdG8gc2VlIGlmIGl0J3MgdGhlIG9uZSB3ZSdyZSBzZWFyY2hpbmcgZm9yLlxuICAgIHZhciBjdXJLZXkgPSByZWFkZXIucmVhZEJ5dGVTdHJpbmcodGhpcy5rZXlTaXplKTtcblxuICAgIHZhciBzaXplID0gcmVhZGVyLnJlYWRVaW50VmFyKCk7XG4gICAgaWYgKGtleSA9PSBjdXJLZXkpIHtcbiAgICAgIHJldHVybiByZWFkZXIucmVhZEJ5dGVzKHNpemUpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgc2VlayBpZiB0aGlzIGlzbid0IHRoZSBsYXN0IGJsb2NrLlxuICAgIGlmIChpIDwga2V5Q291bnQgLSAxKSB7XG4gICAgICByZWFkZXIuc2VlayhzaXplLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ0tleSBub3QgZm91bmQnKTtcbn07XG5cbi8qKlxuICogQmVnaW4gc2VhcmNoaW5nIGZvciBhIGtleSBhdCB0aGUgZ2l2ZW4gYmxvY2sgaWQuIEtlZXAgc2VhcmNoaW5nIGRvd24gdGhlXG4gKiBpbmRleGVzIHVudGlsIGEgbGVhZiBpcyBmb3VuZCBhbmQgdGhlbiByZXR1cm4gdGhlIHZhbHVlIGZvciB0aGUgcHJvdmlkZWRcbiAqIGtleS5cbiAqL1xuQlRyZWVEQi5wcm90b3R5cGUuc2VhcmNoID0gZnVuY3Rpb24gKGJsb2NrSWQsIGtleSwgY2FsbGJhY2spIHtcbiAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja0ZpbGUuZ2V0QmxvY2soYmxvY2tJZCk7XG5cbiAgLy8gVE9ETzogQ2FjaGUgaW5kZXggYmxvY2tzLlxuICB3aGlsZSAoYmxvY2sudHlwZSA9PSBCTE9DS19JTkRFWCkge1xuICAgIHZhciBuZXh0QmxvY2tJZCA9IG5ldyBJbmRleCh0aGlzLmtleVNpemUsIGJsb2NrKS5maW5kKGtleSk7XG4gICAgYmxvY2sgPSB0aGlzLmJsb2NrRmlsZS5nZXRCbG9jayhuZXh0QmxvY2tJZCk7XG4gIH1cblxuICBpZiAoYmxvY2sudHlwZSAhPSBCTE9DS19MRUFGKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdEaWQgbm90IHJlYWNoIGxlYWYnKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmdldExlYWZWYWx1ZShibG9jaywga2V5KTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBibG9jayBvYmplY3QgdG8gcHJvdmlkZSBmdW5jdGlvbmFsaXR5IGZvciBwYXJzaW5nIGFuZCBzY2FubmluZyBhblxuICogaW5kZXguXG4gKi9cbmZ1bmN0aW9uIEluZGV4KGtleVNpemUsIGJsb2NrKSB7XG4gIHZhciByZWFkZXIgPSBuZXcgU2JvblJlYWRlcihibG9jay5idWZmZXIpO1xuXG4gIHRoaXMubGV2ZWwgPSByZWFkZXIucmVhZFVpbnQ4KCk7XG5cbiAgLy8gTnVtYmVyIG9mIGtleXMgaW4gdGhpcyBpbmRleC5cbiAgdGhpcy5rZXlDb3VudCA9IHJlYWRlci5yZWFkSW50MzIoKTtcblxuICAvLyBUaGUgYmxvY2tzIHRoYXQgdGhlIGtleXMgcG9pbnQgdG8uIFRoZXJlIHdpbGwgYmUgb25lIGV4dHJhIGJsb2NrIGluIHRoZVxuICAvLyBiZWdpbm5pbmcgb2YgdGhpcyBsaXN0IHRoYXQgcG9pbnRzIHRvIHRoZSBibG9jayB0byBnbyB0byBpZiB0aGUga2V5IGJlaW5nXG4gIC8vIHNlYXJjaGVkIGZvciBpcyBsZWZ0IG9mIHRoZSBmaXJzdCBrZXkgaW4gdGhpcyBpbmRleC5cbiAgdGhpcy5ibG9ja0lkcyA9IG5ldyBJbnQzMkFycmF5KHRoaXMua2V5Q291bnQgKyAxKTtcbiAgdGhpcy5ibG9ja0lkc1swXSA9IHJlYWRlci5yZWFkSW50MzIoKTtcblxuICB0aGlzLmtleXMgPSBbXTtcblxuICAvLyBMb2FkIGFsbCBrZXkvYmxvY2sgcmVmZXJlbmNlIHBhaXJzLlxuICBmb3IgKHZhciBpID0gMTsgaSA8PSB0aGlzLmtleUNvdW50OyBpKyspIHtcbiAgICB0aGlzLmtleXMucHVzaChyZWFkZXIucmVhZEJ5dGVTdHJpbmcoa2V5U2l6ZSkpO1xuICAgIHRoaXMuYmxvY2tJZHNbaV0gPSByZWFkZXIucmVhZEludDMyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aGlzIGluZGV4IGZvciB0aGUgc3BlY2lmaWVkIGtleSBhbmQgcmV0dXJucyB0aGUgbmV4dCBibG9jayBpZCB0b1xuICogc2VhcmNoLlxuICovXG5JbmRleC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgLy8gTWF5YmUgb3ZlcmtpbGwgY29uc2lkZXJpbmcgdGhhdCBhbiBpbmRleCBjYW4ndCByZWFsbHkgY29udGFpbiBtb3JlIHRoYW5cbiAgLy8gYXJvdW5kIDYwIGtleXMuXG4gIHZhciBsbyA9IDAsIGhpID0gdGhpcy5rZXlDb3VudCwgbWlkO1xuICB3aGlsZSAobG8gPCBoaSkge1xuICAgIG1pZCA9IChsbyArIGhpKSA+PiAxO1xuICAgIGlmIChrZXkgPCB0aGlzLmtleXNbbWlkXSkge1xuICAgICAgaGkgPSBtaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvID0gbWlkICsgMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5ibG9ja0lkc1tsb107XG59O1xuXG5mdW5jdGlvbiBMZWFmUmVhZGVyKGJsb2NrRmlsZSwgYmxvY2spIHtcbiAgU2JvblJlYWRlci5jYWxsKHRoaXMsIGJsb2NrLmJ1ZmZlcik7XG4gIHRoaXMuYmxvY2tGaWxlID0gYmxvY2tGaWxlO1xufVxudXRpbC5pbmhlcml0cyhMZWFmUmVhZGVyLCBTYm9uUmVhZGVyKTtcblxuTGVhZlJlYWRlci5wcm90b3R5cGUucmVhZEJ5dGVzID0gZnVuY3Rpb24gKGNvdW50LCBvcHRfbm9Db3B5KSB7XG4gIHZhciBidWZmZXIgPSB0aGlzLnZpZXcuYnVmZmVyLFxuICAgICAgc3RhcnQgPSB0aGlzLnZpZXcuYnl0ZU9mZnNldCArIHRoaXMub2Zmc2V0LFxuICAgICAgY2h1bmtMZW5ndGggPSBNYXRoLm1pbihjb3VudCwgYnVmZmVyLmJ5dGVMZW5ndGggLSA0IC0gc3RhcnQpO1xuXG4gIHZhciByYW5nZSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgc3RhcnQsIGNodW5rTGVuZ3RoKTtcbiAgaWYgKG9wdF9ub0NvcHkgJiYgY2h1bmtMZW5ndGggPT0gY291bnQpIHtcbiAgICB0aGlzLm9mZnNldCArPSBjaHVua0xlbmd0aDtcbiAgICByZXR1cm4gcmFuZ2U7XG4gIH1cblxuICB2YXIgYXJyYXkgPSBuZXcgVWludDhBcnJheShjb3VudCksIHdyaXR0ZW4gPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGFycmF5LnNldChyYW5nZSwgd3JpdHRlbik7XG4gICAgd3JpdHRlbiArPSBjaHVua0xlbmd0aDtcblxuICAgIGlmICh3cml0dGVuID09IGNvdW50KSBicmVhaztcblxuICAgIGJ1ZmZlciA9IHRoaXMuX2dldE5leHRCbG9jaygpLmJ1ZmZlcjtcbiAgICB0aGlzLnZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblxuICAgIGNodW5rTGVuZ3RoID0gTWF0aC5taW4oY291bnQgLSB3cml0dGVuLCBidWZmZXIuYnl0ZUxlbmd0aCAtIDQpO1xuICAgIHJhbmdlID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCAwLCBjaHVua0xlbmd0aCk7XG4gIH1cblxuICB0aGlzLm9mZnNldCA9IGNodW5rTGVuZ3RoO1xuXG4gIHJldHVybiBhcnJheTtcbn07XG5cbkxlYWZSZWFkZXIucHJvdG90eXBlLnNlZWsgPSBmdW5jdGlvbiAob2Zmc2V0LCBvcHRfcmVsYXRpdmUpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMudmlldy5ieXRlTGVuZ3RoIC0gNDtcbiAgaWYgKG9wdF9yZWxhdGl2ZSkge1xuICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0ICsgb2Zmc2V0O1xuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICBvZmZzZXQgPSBsZW5ndGggKyBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9mZnNldCA9IG9mZnNldDtcbiAgICB9XG4gIH1cblxuICBpZiAob2Zmc2V0IDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignT3V0IG9mIGJvdW5kcycpO1xuICB9XG5cbiAgd2hpbGUgKG9mZnNldCA+PSBsZW5ndGgpIHtcbiAgICBvZmZzZXQgLT0gbGVuZ3RoO1xuICAgIHRoaXMudmlldyA9IG5ldyBEYXRhVmlldyh0aGlzLl9nZXROZXh0QmxvY2soKS5idWZmZXIpO1xuICAgIGxlbmd0aCA9IHRoaXMudmlldy5ieXRlTGVuZ3RoIC0gNDtcbiAgfVxuXG4gIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICByZXR1cm4gdGhpcztcbn07XG5cbkxlYWZSZWFkZXIucHJvdG90eXBlLl9nZXROZXh0QmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBuZXh0QmxvY2tJZCA9IHRoaXMudmlldy5nZXRJbnQzMih0aGlzLnZpZXcuYnl0ZUxlbmd0aCAtIDQpO1xuICBpZiAobmV4dEJsb2NrSWQgPT0gLTEpIHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gdHJhdmVyc2UgdG8gbm9uLWV4aXN0ZW50IGJsb2NrJyk7XG4gIHJldHVybiB0aGlzLmJsb2NrRmlsZS5nZXRCbG9jayhuZXh0QmxvY2tJZCk7XG59O1xuIiwidmFyIHNoYTI1NiA9IHJlcXVpcmUoJ3NoYTI1NicpO1xudmFyIHNoYTI1NnN0YXJib3VuZCA9IHJlcXVpcmUoJ3N0YXJib3VuZC1zaGEyNTYnKTtcblxudmFyIEJsb2NrRmlsZSA9IHJlcXVpcmUoJy4vYmxvY2tmaWxlJyk7XG52YXIgQlRyZWVEQiA9IHJlcXVpcmUoJy4vYnRyZWVkYicpO1xudmFyIFNib25SZWFkZXIgPSByZXF1aXJlKCcuL3Nib25yZWFkZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWNrYWdlO1xuXG52YXIgRElHRVNUX0tFWSA9ICdfZGlnZXN0JztcbnZhciBJTkRFWF9LRVkgPSAnX2luZGV4JztcblxuZnVuY3Rpb24gUGFja2FnZShkYXRhYmFzZSkge1xuICB0aGlzLmRiID0gZGF0YWJhc2U7XG59XG5cblBhY2thZ2Uub3BlbiA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHJldHVybiBuZXcgUGFja2FnZShCVHJlZURCLm9wZW4oZmlsZSkpO1xufTtcblxuUGFja2FnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIga2V5SGFzaCA9IHNoYTI1NihrZXksIHthc1N0cmluZzogdHJ1ZX0pO1xuICB0cnkge1xuICAgIHJldHVybiB0aGlzLmRiLmdldChrZXlIYXNoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIE9sZGVyIHZlcnNpb25zIG9mIFN0YXJib3VuZCBoYWQgYSBidWdneSBoYXNoIGltcGxlbWVudGF0aW9uLiBUcnkgdG8gdXNlXG4gICAgLy8gaXQsIHNpbmNlIHdlIGNvdWxkIGJlIHJlYWRpbmcgYW4gb2xkIHBhY2thZ2UgZmlsZS5cbiAgICBpZiAoa2V5Lmxlbmd0aCA9PSA1NSkge1xuICAgICAga2V5SGFzaCA9IHNoYTI1NnN0YXJib3VuZChrZXksIHthc1N0cmluZzogdHJ1ZX0pO1xuICAgICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGtleUhhc2gpO1xuICAgIH1cblxuICAgIHRocm93IGU7XG4gIH1cbn07XG5cblBhY2thZ2UucHJvdG90eXBlLmdldERpZ2VzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZ2V0KERJR0VTVF9LRVkpO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBwYXRocyBhbmQga2V5cyBvZiB0aGUgZmlsZXMgaW4gdGhpcyBwYWNrYWdlLlxuICovXG5QYWNrYWdlLnByb3RvdHlwZS5nZXRJbmRleCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJlYWRlciA9IG5ldyBTYm9uUmVhZGVyKHRoaXMuZ2V0KElOREVYX0tFWSkpO1xuICBzd2l0Y2ggKHRoaXMuZGIuaWRlbnRpZmllcikge1xuICAgIGNhc2UgJ0Fzc2V0czEnOlxuICAgICAgdmFyIHBhdGhzID0gcmVhZGVyLnJlYWRTdHJpbmdMaXN0KCksIG1hcCA9IHt9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYXBbcGF0aHNbaV1dID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXA7XG4gICAgY2FzZSAnQXNzZXRzMic6XG4gICAgICByZXR1cm4gcmVhZGVyLnJlYWRTdHJpbmdEaWdlc3RNYXAoKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBwYWNrYWdlIHR5cGUgJyArIHRoaXMuaWRlbnRpZmllcik7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNib25SZWFkZXI7XG5cbmZ1bmN0aW9uIFNib25SZWFkZXIodmlld09yQnVmZmVyKSB7XG4gIGlmICh2aWV3T3JCdWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHZpZXdPckJ1ZmZlciA9IG5ldyBEYXRhVmlldyh2aWV3T3JCdWZmZXIpO1xuICB9IGVsc2UgaWYgKCEodmlld09yQnVmZmVyIGluc3RhbmNlb2YgRGF0YVZpZXcpKSB7XG4gICAgdmlld09yQnVmZmVyID0gbmV3IERhdGFWaWV3KHZpZXdPckJ1ZmZlci5idWZmZXIpO1xuICB9XG5cbiAgdGhpcy5vZmZzZXQgPSAwO1xuICB0aGlzLnZpZXcgPSB2aWV3T3JCdWZmZXI7XG59XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRCb29sZWFuID0gZnVuY3Rpb24gKCkge1xuICAvLyBYWFg6IE1pZ2h0IHdhbnQgdG8gYXNzZXJ0IHRoYXQgdGhpcyBpcyBvbmx5IGV2ZXIgMHgwMCBvciAweDAxLlxuICByZXR1cm4gISF0aGlzLnJlYWRVaW50OCgpO1xufTtcblxuLyoqXG4gKiBSZWFkcyB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBieXRlcy4gSWYgdGhlIG9wdGlvbmFsIG5vQ29weSBmbGFnIGlzIHBhc3NlZFxuICogaW4sIHRoZSByZXR1cm5lZCBieXRlIGFycmF5IHdpbGwgcmVmZXJlbmNlIHRoZSBvcmlnaW5hbCBidWZmZXIgaW5zdGVhZCBvZlxuICogbWFraW5nIGEgY29weSAoZmFzdGVyIHdoZW4geW91IG9ubHkgd2FudCB0byByZWFkIGZyb20gdGhlIGFycmF5KS5cbiAqL1xuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEJ5dGVzID0gZnVuY3Rpb24gKGNvdW50LCBvcHRfbm9Db3B5KSB7XG4gIHZhciBzdGFydCA9IHRoaXMudmlldy5ieXRlT2Zmc2V0ICsgdGhpcy5vZmZzZXQ7XG4gIHRoaXMuc2Vlayhjb3VudCwgdHJ1ZSk7XG5cbiAgdmFyIHJhbmdlID0gbmV3IFVpbnQ4QXJyYXkodGhpcy52aWV3LmJ1ZmZlciwgc3RhcnQsIGNvdW50KTtcbiAgaWYgKG9wdF9ub0NvcHkpIHJldHVybiByYW5nZTtcblxuICB2YXIgYXJyYXkgPSBuZXcgVWludDhBcnJheShjb3VudCk7XG4gIGFycmF5LnNldChyYW5nZSk7XG4gIHJldHVybiBhcnJheTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRCeXRlU3RyaW5nID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCB0aGlzLnJlYWRCeXRlcyhsZW5ndGgsIHRydWUpKTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWREb2N1bWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5hbWUgPSB0aGlzLnJlYWRTdHJpbmcoKTtcblxuICAvLyBUaGlzIHNlZW1zIHRvIGFsd2F5cyBiZSAweDAxLlxuICB2YXIgdW5rbm93biA9IHRoaXMucmVhZFVpbnQ4KCk7XG5cbiAgLy8gVE9ETzogTm90IHN1cmUgaWYgdGhpcyBpcyBzaWduZWQgb3Igbm90LlxuICB2YXIgdmVyc2lvbiA9IHRoaXMucmVhZEludDMyKCk7XG5cbiAgdmFyIGRvYyA9IHRoaXMucmVhZER5bmFtaWMoKTtcbiAgZG9jLl9fbmFtZV9fID0gbmFtZTtcbiAgZG9jLl9fdmVyc2lvbl9fID0gdmVyc2lvbjtcblxuICByZXR1cm4gZG9jO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZERvY3VtZW50TGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMucmVhZFVpbnRWYXIoKTtcblxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgbGlzdC5wdXNoKHRoaXMucmVhZERvY3VtZW50KCkpO1xuICB9XG4gIHJldHVybiBsaXN0O1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZER5bmFtaWMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0eXBlID0gdGhpcy5yZWFkVWludDgoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIHRoaXMucmVhZEZsb2F0NjQoKTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gdGhpcy5yZWFkQm9vbGVhbigpO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiB0aGlzLnJlYWRJbnRWYXIoKTtcbiAgICBjYXNlIDU6XG4gICAgICByZXR1cm4gdGhpcy5yZWFkU3RyaW5nKCk7XG4gICAgY2FzZSA2OlxuICAgICAgcmV0dXJuIHRoaXMucmVhZExpc3QoKTtcbiAgICBjYXNlIDc6XG4gICAgICByZXR1cm4gdGhpcy5yZWFkTWFwKCk7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZHluYW1pYyB0eXBlJyk7XG59O1xuXG4vKipcbiAqIFJlYWRzIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGJ5dGVzIGFuZCByZXR1cm5zIHRoZW0gYXMgYSBzdHJpbmcgdGhhdCBlbmRzXG4gKiBhdCB0aGUgZmlyc3QgbnVsbC5cbiAqL1xuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEZpeGVkU3RyaW5nID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICB2YXIgc3RyaW5nID0gdGhpcy5yZWFkQnl0ZVN0cmluZyhsZW5ndGgpO1xuICB2YXIgbnVsbEluZGV4ID0gc3RyaW5nLmluZGV4T2YoJ1xceDAwJyk7XG4gIGlmIChudWxsSW5kZXggIT0gLTEpIHtcbiAgICByZXR1cm4gc3RyaW5nLnN1YnN0cigwLCBudWxsSW5kZXgpO1xuICB9XG4gIHJldHVybiBzdHJpbmc7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkRmxvYXQzMiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2Vlayg0LCB0cnVlKS52aWV3LmdldEZsb2F0MzIodGhpcy5vZmZzZXQgLSA0KTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRGbG9hdDY0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zZWVrKDgsIHRydWUpLnZpZXcuZ2V0RmxvYXQ2NCh0aGlzLm9mZnNldCAtIDgpO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoMSwgdHJ1ZSkudmlldy5nZXRJbnQ4KHRoaXMub2Zmc2V0IC0gMSk7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkSW50MTYgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnNlZWsoMiwgdHJ1ZSkudmlldy5nZXRJbnQxNih0aGlzLm9mZnNldCAtIDIpO1xufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUucmVhZEludDMyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zZWVrKDQsIHRydWUpLnZpZXcuZ2V0SW50MzIodGhpcy5vZmZzZXQgLSA0KTtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRJbnRWYXIgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB2YWx1ZSA9IHRoaXMucmVhZFVpbnRWYXIoKTtcblxuICAvLyBMZWFzdCBzaWduaWZpY2FudCBiaXQgcmVwcmVzZW50cyB0aGUgc2lnbi5cbiAgaWYgKHZhbHVlICYgMSkge1xuICAgIHJldHVybiAtKHZhbHVlID4+IDEpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZSA+PiAxO1xuICB9XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMucmVhZFVpbnRWYXIoKTtcblxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgbGlzdC5wdXNoKHRoaXMucmVhZER5bmFtaWMoKSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkTWFwID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIHZhciBtYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGtleSA9IHRoaXMucmVhZFN0cmluZygpO1xuICAgIG1hcFtrZXldID0gdGhpcy5yZWFkRHluYW1pYygpO1xuICB9XG4gIHJldHVybiBtYXA7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5yZWFkVWludFZhcigpO1xuXG4gIC8vIFRoaXMgaXMgZnVja2luZyBidWxsc2hpdC5cbiAgdmFyIHJhdyA9IHRoaXMucmVhZEJ5dGVTdHJpbmcobGVuZ3RoKTtcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUocmF3KSk7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkU3RyaW5nRGlnZXN0TWFwID0gZnVuY3Rpb24gKCkge1xuICAvLyBTcGVjaWFsIHN0cnVjdHVyZSBvZiBzdHJpbmcvZGlnZXN0IHBhaXJzLCB1c2VkIGJ5IHRoZSBhc3NldHMgZGF0YWJhc2UuXG4gIHZhciBsZW5ndGggPSB0aGlzLnJlYWRVaW50VmFyKCk7XG5cbiAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCksIGRpZ2VzdCwgcGF0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHBhdGggPSB0aGlzLnJlYWRTdHJpbmcoKTtcbiAgICAvLyBTaW5nbGUgc3BhY2UgY2hhcmFjdGVyLlxuICAgIHRoaXMuc2VlaygxLCB0cnVlKTtcbiAgICBkaWdlc3QgPSB0aGlzLnJlYWRCeXRlcygzMik7XG4gICAgbWFwW3BhdGhdID0gZGlnZXN0O1xuICB9XG4gIHJldHVybiBtYXA7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkU3RyaW5nTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gT3B0aW1pemVkIHN0cnVjdHVyZSB0aGF0IGRvZXNuJ3QgaGF2ZSBhIHR5cGUgYnl0ZSBmb3IgZXZlcnkgaXRlbS5cbiAgdmFyIGxlbmd0aCA9IHRoaXMucmVhZFVpbnRWYXIoKTtcblxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgbGlzdC5wdXNoKHRoaXMucmVhZFN0cmluZygpKTtcbiAgfVxuICByZXR1cm4gbGlzdDtcbn07XG5cblNib25SZWFkZXIucHJvdG90eXBlLnJlYWRVaW50OCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHZhbHVlID0gdGhpcy52aWV3LmdldFVpbnQ4KHRoaXMub2Zmc2V0KTtcbiAgdGhpcy5zZWVrKDEsIHRydWUpO1xuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkVWludDE2ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zZWVrKDIsIHRydWUpLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0IC0gMik7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkVWludDMyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zZWVrKDQsIHRydWUpLnZpZXcuZ2V0VWludDMyKHRoaXMub2Zmc2V0IC0gNCk7XG59O1xuXG5TYm9uUmVhZGVyLnByb3RvdHlwZS5yZWFkVWludFZhciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHZhbHVlID0gMDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICB2YXIgYnl0ZSA9IHRoaXMucmVhZFVpbnQ4KCk7XG4gICAgaWYgKChieXRlICYgMTI4KSA9PSAwKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPDwgNyB8IGJ5dGU7XG4gICAgfVxuICAgIHZhbHVlID0gdmFsdWUgPDwgNyB8IChieXRlICYgMTI3KTtcbiAgfVxufTtcblxuU2JvblJlYWRlci5wcm90b3R5cGUuc2VlayA9IGZ1bmN0aW9uIChvZmZzZXQsIG9wdF9yZWxhdGl2ZSkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy52aWV3LmJ5dGVDb3VudDtcbiAgaWYgKG9wdF9yZWxhdGl2ZSkge1xuICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0ICsgb2Zmc2V0O1xuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICBvZmZzZXQgPSBsZW5ndGggKyBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9mZnNldCA9IG9mZnNldDtcbiAgICB9XG4gIH1cblxuICBpZiAob2Zmc2V0IDwgMCB8fCBvZmZzZXQgPj0gbGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICB0aGlzLm9mZnNldCA9IG9mZnNldDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwidmFyIHpsaWIgPSByZXF1aXJlKCd6bGliJyk7XG5cbnZhciBCVHJlZURCID0gcmVxdWlyZSgnLi9idHJlZWRiJyk7XG52YXIgU2JvblJlYWRlciA9IHJlcXVpcmUoJy4vc2JvbnJlYWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmxkO1xuXG52YXIgTUVUQURBVEFfS0VZID0gJ1xceDAwXFx4MDBcXHgwMFxceDAwXFx4MDAnO1xuXG5mdW5jdGlvbiBXb3JsZChkYXRhYmFzZSkge1xuICB0aGlzLmRiID0gZGF0YWJhc2U7XG59XG5cbldvcmxkLm9wZW4gPSBmdW5jdGlvbiAoZmlsZSkge1xuICByZXR1cm4gbmV3IFdvcmxkKEJUcmVlREIub3BlbihmaWxlKSk7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuZ2V0TWV0YWRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZWFkZXIgPSBuZXcgU2JvblJlYWRlcih0aGlzLmRiLmdldChNRVRBREFUQV9LRVkpKTtcblxuICAvLyBTa2lwIHNvbWUgdW5rbm93biBieXRlcy5cbiAgcmVhZGVyLnNlZWsoOCk7XG5cbiAgdmFyIG1ldGFkYXRhID0gcmVhZGVyLnJlYWREb2N1bWVudCgpO1xuICBpZiAobWV0YWRhdGEuX19uYW1lX18gIT0gJ1dvcmxkTWV0YWRhdGEnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHdvcmxkIGZpbGUnKTtcbiAgfVxuXG4gIHJldHVybiBtZXRhZGF0YTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5nZXRSZWdpb25EYXRhID0gZnVuY3Rpb24gKGxheWVyLCB4LCB5LCBjYWxsYmFjaykge1xuICB2YXIga2V5ID0gU3RyaW5nLmZyb21DaGFyQ29kZShsYXllciwgeCA+PiA4LCB4ICYgMjU1LCB5ID4+IDgsIHkgJiAyNTUpO1xuICB2YXIgYnVmZmVyID0gdGhpcy5kYi5nZXQoa2V5KTtcbiAgdmFyIGluZmxhdGVkID0gemxpYi5pbmZsYXRlU3luYyhuZXcgVWludDhBcnJheShidWZmZXIpKTtcbiAgdmFyIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaW5mbGF0ZWQpO1xuICByZXR1cm4gYXJyYXkuYnVmZmVyO1xufTtcblxuV29ybGQucHJvdG90eXBlLmdldEVudGl0aWVzID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXMuZ2V0UmVnaW9uRGF0YSgyLCB4LCB5KTtcbiAgcmV0dXJuIG5ldyBTYm9uUmVhZGVyKGJ1ZmZlcikucmVhZERvY3VtZW50TGlzdCgpO1xufTtcbiIsIihmdW5jdGlvbiAocHJvY2VzcyxCdWZmZXIpe1xuIWZ1bmN0aW9uKGdsb2JhbHMpIHtcbid1c2Ugc3RyaWN0J1xuXG52YXIgX2ltcG9ydHMgPSB7fVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy9Db21tb25KU1xuICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MucGlkKSB7XG4gICAgLy8gTm9kZS5qc1xuXHRtb2R1bGUuZXhwb3J0cyA9IHNoYTI1Nl9ub2RlO1xuICB9IGVsc2Uge1xuICAgIF9pbXBvcnRzLmJ5dGVzVG9IZXggPSByZXF1aXJlKCdjb252ZXJ0LWhleCcpLmJ5dGVzVG9IZXhcbiAgICBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nID0gcmVxdWlyZSgnY29udmVydC1zdHJpbmcnKVxuICAgIG1vZHVsZS5leHBvcnRzID0gc2hhMjU2XG4gIH1cbn0gZWxzZSB7XG4gIF9pbXBvcnRzLmJ5dGVzVG9IZXggPSBnbG9iYWxzLmNvbnZlcnRIZXguYnl0ZXNUb0hleFxuICBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nID0gZ2xvYmFscy5jb252ZXJ0U3RyaW5nXG4gIGdsb2JhbHMuc2hhMjU2ID0gc2hhMjU2XG59XG5cblxuLy8gTm9kZS5qcyBoYXMgaXRzIG93biBDcnlwdG8gZnVuY3Rpb24gdGhhdCBjYW4gaGFuZGxlIHRoaXMgbmF0aXZlbHlcbmZ1bmN0aW9uIHNoYTI1Nl9ub2RlKG1lc3NhZ2UsIG9wdGlvbnMpIHtcblx0dmFyIGNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuXHR2YXIgYyA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcblx0XG5cdGlmIChCdWZmZXIuaXNCdWZmZXIobWVzc2FnZSkpIHtcblx0XHRjLnVwZGF0ZShtZXNzYWdlKTtcblx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG1lc3NhZ2UpKSB7XG5cdFx0Ly8gQXJyYXkgb2YgYnl0ZSB2YWx1ZXNcblx0XHRjLnVwZGF0ZShuZXcgQnVmZmVyKG1lc3NhZ2UpKTtcblx0fSBlbHNlIHtcblx0XHQvLyBPdGhlcndpc2UsIHRyZWF0IGFzIGEgYmluYXJ5IHN0cmluZ1xuXHRcdGMudXBkYXRlKG5ldyBCdWZmZXIobWVzc2FnZSwgJ2JpbmFyeScpKTtcblx0fVxuXHR2YXIgYnVmID0gYy5kaWdlc3QoKTtcblx0XG5cdGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXNCeXRlcykge1xuXHRcdC8vIEFycmF5IG9mIGJ5dGVzIGFzIGRlY2ltYWwgaW50ZWdlcnNcblx0XHR2YXIgYSA9IFtdO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcblx0XHRcdGEucHVzaChidWZbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gYTtcblx0fSBlbHNlIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXNTdHJpbmcpIHtcblx0XHQvLyBCaW5hcnkgc3RyaW5nXG5cdFx0cmV0dXJuIGJ1Zi50b1N0cmluZygnYmluYXJ5Jyk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gU3RyaW5nIG9mIGhleCBjaGFyYWN0ZXJzXG5cdFx0cmV0dXJuIGJ1Zi50b1N0cmluZygnaGV4Jyk7XG5cdH1cbn1cbnNoYTI1Nl9ub2RlLngyID0gZnVuY3Rpb24obWVzc2FnZSwgb3B0aW9ucykge1xuXHRyZXR1cm4gc2hhMjU2X25vZGUoc2hhMjU2X25vZGUobWVzc2FnZSwgeyBhc0J5dGVzOnRydWUgfSksIG9wdGlvbnMpXG59XG5cbi8qXG5DcnlwdG9KUyB2My4xLjJcbmNvZGUuZ29vZ2xlLmNvbS9wL2NyeXB0by1qc1xuKGMpIDIwMDktMjAxMyBieSBKZWZmIE1vdHQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5jb2RlLmdvb2dsZS5jb20vcC9jcnlwdG8tanMvd2lraS9MaWNlbnNlXG4qL1xuXG4vLyBJbml0aWFsaXphdGlvbiByb3VuZCBjb25zdGFudHMgdGFibGVzXG52YXIgSyA9IFtdXG5cbi8vIENvbXB1dGUgY29uc3RhbnRzXG4hZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBpc1ByaW1lKG4pIHtcbiAgICB2YXIgc3FydE4gPSBNYXRoLnNxcnQobik7XG4gICAgZm9yICh2YXIgZmFjdG9yID0gMjsgZmFjdG9yIDw9IHNxcnROOyBmYWN0b3IrKykge1xuICAgICAgaWYgKCEobiAlIGZhY3RvcikpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiBnZXRGcmFjdGlvbmFsQml0cyhuKSB7XG4gICAgcmV0dXJuICgobiAtIChuIHwgMCkpICogMHgxMDAwMDAwMDApIHwgMFxuICB9XG5cbiAgdmFyIG4gPSAyXG4gIHZhciBuUHJpbWUgPSAwXG4gIHdoaWxlIChuUHJpbWUgPCA2NCkge1xuICAgIGlmIChpc1ByaW1lKG4pKSB7XG4gICAgICBLW25QcmltZV0gPSBnZXRGcmFjdGlvbmFsQml0cyhNYXRoLnBvdyhuLCAxIC8gMykpXG4gICAgICBuUHJpbWUrK1xuICAgIH1cblxuICAgIG4rK1xuICB9XG59KClcblxudmFyIGJ5dGVzVG9Xb3JkcyA9IGZ1bmN0aW9uIChieXRlcykge1xuICB2YXIgd29yZHMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgYiA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKywgYiArPSA4KSB7XG4gICAgd29yZHNbYiA+Pj4gNV0gfD0gYnl0ZXNbaV0gPDwgKDI0IC0gYiAlIDMyKVxuICB9XG4gIHJldHVybiB3b3Jkc1xufVxuXG52YXIgd29yZHNUb0J5dGVzID0gZnVuY3Rpb24gKHdvcmRzKSB7XG4gIHZhciBieXRlcyA9IFtdXG4gIGZvciAodmFyIGIgPSAwOyBiIDwgd29yZHMubGVuZ3RoICogMzI7IGIgKz0gOCkge1xuICAgIGJ5dGVzLnB1c2goKHdvcmRzW2IgPj4+IDVdID4+PiAoMjQgLSBiICUgMzIpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbi8vIFJldXNhYmxlIG9iamVjdFxudmFyIFcgPSBbXVxuXG52YXIgcHJvY2Vzc0Jsb2NrID0gZnVuY3Rpb24gKEgsIE0sIG9mZnNldCkge1xuICAvLyBXb3JraW5nIHZhcmlhYmxlc1xuICB2YXIgYSA9IEhbMF0sIGIgPSBIWzFdLCBjID0gSFsyXSwgZCA9IEhbM11cbiAgdmFyIGUgPSBIWzRdLCBmID0gSFs1XSwgZyA9IEhbNl0sIGggPSBIWzddXG5cbiAgICAvLyBDb21wdXRhdGlvblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDY0OyBpKyspIHtcbiAgICBpZiAoaSA8IDE2KSB7XG4gICAgICBXW2ldID0gTVtvZmZzZXQgKyBpXSB8IDBcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGdhbW1hMHggPSBXW2kgLSAxNV1cbiAgICAgIHZhciBnYW1tYTAgID0gKChnYW1tYTB4IDw8IDI1KSB8IChnYW1tYTB4ID4+PiA3KSkgIF5cbiAgICAgICAgICAgICAgICAgICAgKChnYW1tYTB4IDw8IDE0KSB8IChnYW1tYTB4ID4+PiAxOCkpIF5cbiAgICAgICAgICAgICAgICAgICAgKGdhbW1hMHggPj4+IDMpXG5cbiAgICAgIHZhciBnYW1tYTF4ID0gV1tpIC0gMl07XG4gICAgICB2YXIgZ2FtbWExICA9ICgoZ2FtbWExeCA8PCAxNSkgfCAoZ2FtbWExeCA+Pj4gMTcpKSBeXG4gICAgICAgICAgICAgICAgICAgICgoZ2FtbWExeCA8PCAxMykgfCAoZ2FtbWExeCA+Pj4gMTkpKSBeXG4gICAgICAgICAgICAgICAgICAgIChnYW1tYTF4ID4+PiAxMClcblxuICAgICAgV1tpXSA9IGdhbW1hMCArIFdbaSAtIDddICsgZ2FtbWExICsgV1tpIC0gMTZdO1xuICAgIH1cblxuICAgIHZhciBjaCAgPSAoZSAmIGYpIF4gKH5lICYgZyk7XG4gICAgdmFyIG1haiA9IChhICYgYikgXiAoYSAmIGMpIF4gKGIgJiBjKTtcblxuICAgIHZhciBzaWdtYTAgPSAoKGEgPDwgMzApIHwgKGEgPj4+IDIpKSBeICgoYSA8PCAxOSkgfCAoYSA+Pj4gMTMpKSBeICgoYSA8PCAxMCkgfCAoYSA+Pj4gMjIpKTtcbiAgICB2YXIgc2lnbWExID0gKChlIDw8IDI2KSB8IChlID4+PiA2KSkgXiAoKGUgPDwgMjEpIHwgKGUgPj4+IDExKSkgXiAoKGUgPDwgNykgIHwgKGUgPj4+IDI1KSk7XG5cbiAgICB2YXIgdDEgPSBoICsgc2lnbWExICsgY2ggKyBLW2ldICsgV1tpXTtcbiAgICB2YXIgdDIgPSBzaWdtYTAgKyBtYWo7XG5cbiAgICBoID0gZztcbiAgICBnID0gZjtcbiAgICBmID0gZTtcbiAgICBlID0gKGQgKyB0MSkgfCAwO1xuICAgIGQgPSBjO1xuICAgIGMgPSBiO1xuICAgIGIgPSBhO1xuICAgIGEgPSAodDEgKyB0MikgfCAwO1xuICB9XG5cbiAgLy8gSW50ZXJtZWRpYXRlIGhhc2ggdmFsdWVcbiAgSFswXSA9IChIWzBdICsgYSkgfCAwO1xuICBIWzFdID0gKEhbMV0gKyBiKSB8IDA7XG4gIEhbMl0gPSAoSFsyXSArIGMpIHwgMDtcbiAgSFszXSA9IChIWzNdICsgZCkgfCAwO1xuICBIWzRdID0gKEhbNF0gKyBlKSB8IDA7XG4gIEhbNV0gPSAoSFs1XSArIGYpIHwgMDtcbiAgSFs2XSA9IChIWzZdICsgZykgfCAwO1xuICBIWzddID0gKEhbN10gKyBoKSB8IDA7XG59XG5cbmZ1bmN0aW9uIHNoYTI1NihtZXNzYWdlLCBvcHRpb25zKSB7O1xuICBpZiAobWVzc2FnZS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nKSB7XG4gICAgbWVzc2FnZSA9IF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcuVVRGOC5zdHJpbmdUb0J5dGVzKG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIEggPVsgMHg2QTA5RTY2NywgMHhCQjY3QUU4NSwgMHgzQzZFRjM3MiwgMHhBNTRGRjUzQSxcbiAgICAgICAgICAgMHg1MTBFNTI3RiwgMHg5QjA1Njg4QywgMHgxRjgzRDlBQiwgMHg1QkUwQ0QxOSBdO1xuXG4gIHZhciBtID0gYnl0ZXNUb1dvcmRzKG1lc3NhZ2UpO1xuICB2YXIgbCA9IG1lc3NhZ2UubGVuZ3RoICogODtcblxuICBtW2wgPj4gNV0gfD0gMHg4MCA8PCAoMjQgLSBsICUgMzIpO1xuICBtWygobCArIDY0ID4+IDkpIDw8IDQpICsgMTVdID0gbDtcblxuICBmb3IgKHZhciBpPTAgOyBpPG0ubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgcHJvY2Vzc0Jsb2NrKEgsIG0sIGkpO1xuICB9XG5cbiAgdmFyIGRpZ2VzdGJ5dGVzID0gd29yZHNUb0J5dGVzKEgpO1xuICByZXR1cm4gb3B0aW9ucyAmJiBvcHRpb25zLmFzQnl0ZXMgPyBkaWdlc3RieXRlcyA6XG4gICAgICAgICBvcHRpb25zICYmIG9wdGlvbnMuYXNTdHJpbmcgPyBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nLmJ5dGVzVG9TdHJpbmcoZGlnZXN0Ynl0ZXMpIDpcbiAgICAgICAgIF9pbXBvcnRzLmJ5dGVzVG9IZXgoZGlnZXN0Ynl0ZXMpXG59XG5cbnNoYTI1Ni54MiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHNoYTI1NihzaGEyNTYobWVzc2FnZSwgeyBhc0J5dGVzOnRydWUgfSksIG9wdGlvbnMpXG59XG5cbn0odGhpcyk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIikscmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIpIiwiIWZ1bmN0aW9uKGdsb2JhbHMpIHtcbid1c2Ugc3RyaWN0J1xuXG52YXIgY29udmVydEhleCA9IHtcbiAgYnl0ZXNUb0hleDogZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAvKmlmICh0eXBlb2YgYnl0ZXMuYnl0ZUxlbmd0aCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIG5ld0J5dGVzID0gW11cblxuICAgICAgaWYgKHR5cGVvZiBieXRlcy5idWZmZXIgIT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgIGJ5dGVzID0gbmV3IERhdGFWaWV3KGJ5dGVzLmJ1ZmZlcilcbiAgICAgIGVsc2VcbiAgICAgICAgYnl0ZXMgPSBuZXcgRGF0YVZpZXcoYnl0ZXMpXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgKytpKSB7XG4gICAgICAgIG5ld0J5dGVzLnB1c2goYnl0ZXMuZ2V0VWludDgoaSkpXG4gICAgICB9XG4gICAgICBieXRlcyA9IG5ld0J5dGVzXG4gICAgfSovXG4gICAgcmV0dXJuIGFyckJ5dGVzVG9IZXgoYnl0ZXMpXG4gIH0sXG4gIGhleFRvQnl0ZXM6IGZ1bmN0aW9uKGhleCkge1xuICAgIGlmIChoZXgubGVuZ3RoICUgMiA9PT0gMSkgdGhyb3cgbmV3IEVycm9yKFwiaGV4VG9CeXRlcyBjYW4ndCBoYXZlIGEgc3RyaW5nIHdpdGggYW4gb2RkIG51bWJlciBvZiBjaGFyYWN0ZXJzLlwiKVxuICAgIGlmIChoZXguaW5kZXhPZignMHgnKSA9PT0gMCkgaGV4ID0gaGV4LnNsaWNlKDIpXG4gICAgcmV0dXJuIGhleC5tYXRjaCgvLi4vZykubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHBhcnNlSW50KHgsMTYpIH0pXG4gIH1cbn1cblxuXG4vLyBQUklWQVRFXG5cbmZ1bmN0aW9uIGFyckJ5dGVzVG9IZXgoYnl0ZXMpIHtcbiAgcmV0dXJuIGJ5dGVzLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiBwYWRMZWZ0KHgudG9TdHJpbmcoMTYpLDIpIH0pLmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIHBhZExlZnQob3JpZywgbGVuKSB7XG4gIGlmIChvcmlnLmxlbmd0aCA+IGxlbikgcmV0dXJuIG9yaWdcbiAgcmV0dXJuIEFycmF5KGxlbiAtIG9yaWcubGVuZ3RoICsgMSkuam9pbignMCcpICsgb3JpZ1xufVxuXG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvL0NvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gY29udmVydEhleFxufSBlbHNlIHtcbiAgZ2xvYmFscy5jb252ZXJ0SGV4ID0gY29udmVydEhleFxufVxuXG59KHRoaXMpOyIsIiFmdW5jdGlvbihnbG9iYWxzKSB7XG4ndXNlIHN0cmljdCdcblxudmFyIGNvbnZlcnRTdHJpbmcgPSB7XG4gIGJ5dGVzVG9TdHJpbmc6IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgcmV0dXJuIGJ5dGVzLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoeCkgfSkuam9pbignJylcbiAgfSxcbiAgc3RyaW5nVG9CeXRlczogZnVuY3Rpb24oc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHguY2hhckNvZGVBdCgwKSB9KVxuICB9XG59XG5cbi8vaHR0cDovL2hvc3NhLmluLzIwMTIvMDcvMjAvdXRmLTgtaW4tamF2YXNjcmlwdC5odG1sXG5jb252ZXJ0U3RyaW5nLlVURjggPSB7XG4gICBieXRlc1RvU3RyaW5nOiBmdW5jdGlvbihieXRlcykge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGNvbnZlcnRTdHJpbmcuYnl0ZXNUb1N0cmluZyhieXRlcykpKVxuICB9LFxuICBzdHJpbmdUb0J5dGVzOiBmdW5jdGlvbihzdHIpIHtcbiAgIHJldHVybiBjb252ZXJ0U3RyaW5nLnN0cmluZ1RvQnl0ZXModW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpKVxuICB9XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvL0NvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gY29udmVydFN0cmluZ1xufSBlbHNlIHtcbiAgZ2xvYmFscy5jb252ZXJ0U3RyaW5nID0gY29udmVydFN0cmluZ1xufVxuXG59KHRoaXMpOyIsIihmdW5jdGlvbiAocHJvY2VzcyxCdWZmZXIpe1xuIWZ1bmN0aW9uKGdsb2JhbHMpIHtcbid1c2Ugc3RyaWN0J1xuXG52YXIgX2ltcG9ydHMgPSB7fVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy9Db21tb25KU1xuICBpZiAoZmFsc2UgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MucGlkKSB7XG4gICAgLy8gTm9kZS5qc1xuXHRtb2R1bGUuZXhwb3J0cyA9IHNoYTI1Nl9ub2RlO1xuICB9IGVsc2Uge1xuICAgIF9pbXBvcnRzLmJ5dGVzVG9IZXggPSByZXF1aXJlKCdjb252ZXJ0LWhleCcpLmJ5dGVzVG9IZXhcbiAgICBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nID0gcmVxdWlyZSgnY29udmVydC1zdHJpbmcnKVxuICAgIG1vZHVsZS5leHBvcnRzID0gc2hhMjU2XG4gIH1cbn0gZWxzZSB7XG4gIF9pbXBvcnRzLmJ5dGVzVG9IZXggPSBnbG9iYWxzLmNvbnZlcnRIZXguYnl0ZXNUb0hleFxuICBfaW1wb3J0cy5jb252ZXJ0U3RyaW5nID0gZ2xvYmFscy5jb252ZXJ0U3RyaW5nXG4gIGdsb2JhbHMuc2hhMjU2ID0gc2hhMjU2XG59XG5cblxuLy8gTm9kZS5qcyBoYXMgaXRzIG93biBDcnlwdG8gZnVuY3Rpb24gdGhhdCBjYW4gaGFuZGxlIHRoaXMgbmF0aXZlbHlcbmZ1bmN0aW9uIHNoYTI1Nl9ub2RlKG1lc3NhZ2UsIG9wdGlvbnMpIHtcblx0dmFyIGNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuXHR2YXIgYyA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcblx0XG5cdGlmIChCdWZmZXIuaXNCdWZmZXIobWVzc2FnZSkpIHtcblx0XHRjLnVwZGF0ZShtZXNzYWdlKTtcblx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG1lc3NhZ2UpKSB7XG5cdFx0Ly8gQXJyYXkgb2YgYnl0ZSB2YWx1ZXNcblx0XHRjLnVwZGF0ZShuZXcgQnVmZmVyKG1lc3NhZ2UpKTtcblx0fSBlbHNlIHtcblx0XHQvLyBPdGhlcndpc2UsIHRyZWF0IGFzIGEgYmluYXJ5IHN0cmluZ1xuXHRcdGMudXBkYXRlKG5ldyBCdWZmZXIobWVzc2FnZSwgJ2JpbmFyeScpKTtcblx0fVxuXHR2YXIgYnVmID0gYy5kaWdlc3QoKTtcblx0XG5cdGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXNCeXRlcykge1xuXHRcdC8vIEFycmF5IG9mIGJ5dGVzIGFzIGRlY2ltYWwgaW50ZWdlcnNcblx0XHR2YXIgYSA9IFtdO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcblx0XHRcdGEucHVzaChidWZbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gYTtcblx0fSBlbHNlIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXNTdHJpbmcpIHtcblx0XHQvLyBCaW5hcnkgc3RyaW5nXG5cdFx0cmV0dXJuIGJ1Zi50b1N0cmluZygnYmluYXJ5Jyk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gU3RyaW5nIG9mIGhleCBjaGFyYWN0ZXJzXG5cdFx0cmV0dXJuIGJ1Zi50b1N0cmluZygnaGV4Jyk7XG5cdH1cbn1cbnNoYTI1Nl9ub2RlLngyID0gZnVuY3Rpb24obWVzc2FnZSwgb3B0aW9ucykge1xuXHRyZXR1cm4gc2hhMjU2X25vZGUoc2hhMjU2X25vZGUobWVzc2FnZSwgeyBhc0J5dGVzOnRydWUgfSksIG9wdGlvbnMpXG59XG5cbi8qXG5DcnlwdG9KUyB2My4xLjJcbmNvZGUuZ29vZ2xlLmNvbS9wL2NyeXB0by1qc1xuKGMpIDIwMDktMjAxMyBieSBKZWZmIE1vdHQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5jb2RlLmdvb2dsZS5jb20vcC9jcnlwdG8tanMvd2lraS9MaWNlbnNlXG4qL1xuXG4vLyBJbml0aWFsaXphdGlvbiByb3VuZCBjb25zdGFudHMgdGFibGVzXG52YXIgSyA9IFtdXG5cbi8vIENvbXB1dGUgY29uc3RhbnRzXG4hZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBpc1ByaW1lKG4pIHtcbiAgICB2YXIgc3FydE4gPSBNYXRoLnNxcnQobik7XG4gICAgZm9yICh2YXIgZmFjdG9yID0gMjsgZmFjdG9yIDw9IHNxcnROOyBmYWN0b3IrKykge1xuICAgICAgaWYgKCEobiAlIGZhY3RvcikpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiBnZXRGcmFjdGlvbmFsQml0cyhuKSB7XG4gICAgcmV0dXJuICgobiAtIChuIHwgMCkpICogMHgxMDAwMDAwMDApIHwgMFxuICB9XG5cbiAgdmFyIG4gPSAyXG4gIHZhciBuUHJpbWUgPSAwXG4gIHdoaWxlIChuUHJpbWUgPCA2NCkge1xuICAgIGlmIChpc1ByaW1lKG4pKSB7XG4gICAgICBLW25QcmltZV0gPSBnZXRGcmFjdGlvbmFsQml0cyhNYXRoLnBvdyhuLCAxIC8gMykpXG4gICAgICBuUHJpbWUrK1xuICAgIH1cblxuICAgIG4rK1xuICB9XG59KClcblxudmFyIGJ5dGVzVG9Xb3JkcyA9IGZ1bmN0aW9uIChieXRlcykge1xuICB2YXIgd29yZHMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgYiA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKywgYiArPSA4KSB7XG4gICAgd29yZHNbYiA+Pj4gNV0gfD0gYnl0ZXNbaV0gPDwgKDI0IC0gYiAlIDMyKVxuICB9XG4gIHJldHVybiB3b3Jkc1xufVxuXG52YXIgd29yZHNUb0J5dGVzID0gZnVuY3Rpb24gKHdvcmRzKSB7XG4gIHZhciBieXRlcyA9IFtdXG4gIGZvciAodmFyIGIgPSAwOyBiIDwgd29yZHMubGVuZ3RoICogMzI7IGIgKz0gOCkge1xuICAgIGJ5dGVzLnB1c2goKHdvcmRzW2IgPj4+IDVdID4+PiAoMjQgLSBiICUgMzIpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbi8vIFJldXNhYmxlIG9iamVjdFxudmFyIFcgPSBbXVxuXG52YXIgcHJvY2Vzc0Jsb2NrID0gZnVuY3Rpb24gKEgsIE0sIG9mZnNldCkge1xuICAvLyBXb3JraW5nIHZhcmlhYmxlc1xuICB2YXIgYSA9IEhbMF0sIGIgPSBIWzFdLCBjID0gSFsyXSwgZCA9IEhbM11cbiAgdmFyIGUgPSBIWzRdLCBmID0gSFs1XSwgZyA9IEhbNl0sIGggPSBIWzddXG5cbiAgICAvLyBDb21wdXRhdGlvblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDY0OyBpKyspIHtcbiAgICBpZiAoaSA8IDE2KSB7XG4gICAgICBXW2ldID0gTVtvZmZzZXQgKyBpXSB8IDBcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGdhbW1hMHggPSBXW2kgLSAxNV1cbiAgICAgIHZhciBnYW1tYTAgID0gKChnYW1tYTB4IDw8IDI1KSB8IChnYW1tYTB4ID4+PiA3KSkgIF5cbiAgICAgICAgICAgICAgICAgICAgKChnYW1tYTB4IDw8IDE0KSB8IChnYW1tYTB4ID4+PiAxOCkpIF5cbiAgICAgICAgICAgICAgICAgICAgKGdhbW1hMHggPj4+IDMpXG5cbiAgICAgIHZhciBnYW1tYTF4ID0gV1tpIC0gMl07XG4gICAgICB2YXIgZ2FtbWExICA9ICgoZ2FtbWExeCA8PCAxNSkgfCAoZ2FtbWExeCA+Pj4gMTcpKSBeXG4gICAgICAgICAgICAgICAgICAgICgoZ2FtbWExeCA8PCAxMykgfCAoZ2FtbWExeCA+Pj4gMTkpKSBeXG4gICAgICAgICAgICAgICAgICAgIChnYW1tYTF4ID4+PiAxMClcblxuICAgICAgV1tpXSA9IGdhbW1hMCArIFdbaSAtIDddICsgZ2FtbWExICsgV1tpIC0gMTZdO1xuICAgIH1cblxuICAgIHZhciBjaCAgPSAoZSAmIGYpIF4gKH5lICYgZyk7XG4gICAgdmFyIG1haiA9IChhICYgYikgXiAoYSAmIGMpIF4gKGIgJiBjKTtcblxuICAgIHZhciBzaWdtYTAgPSAoKGEgPDwgMzApIHwgKGEgPj4+IDIpKSBeICgoYSA8PCAxOSkgfCAoYSA+Pj4gMTMpKSBeICgoYSA8PCAxMCkgfCAoYSA+Pj4gMjIpKTtcbiAgICB2YXIgc2lnbWExID0gKChlIDw8IDI2KSB8IChlID4+PiA2KSkgXiAoKGUgPDwgMjEpIHwgKGUgPj4+IDExKSkgXiAoKGUgPDwgNykgIHwgKGUgPj4+IDI1KSk7XG5cbiAgICB2YXIgdDEgPSBoICsgc2lnbWExICsgY2ggKyBLW2ldICsgV1tpXTtcbiAgICB2YXIgdDIgPSBzaWdtYTAgKyBtYWo7XG5cbiAgICBoID0gZztcbiAgICBnID0gZjtcbiAgICBmID0gZTtcbiAgICBlID0gKGQgKyB0MSkgfCAwO1xuICAgIGQgPSBjO1xuICAgIGMgPSBiO1xuICAgIGIgPSBhO1xuICAgIGEgPSAodDEgKyB0MikgfCAwO1xuICB9XG5cbiAgLy8gSW50ZXJtZWRpYXRlIGhhc2ggdmFsdWVcbiAgSFswXSA9IChIWzBdICsgYSkgfCAwO1xuICBIWzFdID0gKEhbMV0gKyBiKSB8IDA7XG4gIEhbMl0gPSAoSFsyXSArIGMpIHwgMDtcbiAgSFszXSA9IChIWzNdICsgZCkgfCAwO1xuICBIWzRdID0gKEhbNF0gKyBlKSB8IDA7XG4gIEhbNV0gPSAoSFs1XSArIGYpIHwgMDtcbiAgSFs2XSA9IChIWzZdICsgZykgfCAwO1xuICBIWzddID0gKEhbN10gKyBoKSB8IDA7XG59XG5cbmZ1bmN0aW9uIHNoYTI1NihtZXNzYWdlLCBvcHRpb25zKSB7O1xuICBpZiAobWVzc2FnZS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nKSB7XG4gICAgbWVzc2FnZSA9IF9pbXBvcnRzLmNvbnZlcnRTdHJpbmcuVVRGOC5zdHJpbmdUb0J5dGVzKG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIEggPVsgMHg2QTA5RTY2NywgMHhCQjY3QUU4NSwgMHgzQzZFRjM3MiwgMHhBNTRGRjUzQSxcbiAgICAgICAgICAgMHg1MTBFNTI3RiwgMHg5QjA1Njg4QywgMHgxRjgzRDlBQiwgMHg1QkUwQ0QxOSBdO1xuXG4gIHZhciBtID0gYnl0ZXNUb1dvcmRzKG1lc3NhZ2UpO1xuICB2YXIgbCA9IG1lc3NhZ2UubGVuZ3RoICogODtcblxuICBtW2wgPj4gNV0gfD0gMHg4MCA8PCAoMjQgLSBsICUgMzIpO1xuICAvLyBUaGlzIGlzIGEgaGFjayB0byBtYWtlIHRoaXMgYWxnb3JpdGhtIGNvbXBhdGlibGUgd2l0aCB0aGUgb25lIGluIFN0YXJib3VuZC5cbiAgaWYgKChtZXNzYWdlLmxlbmd0aCAmIDB4M0YpID09IDU1KSB7XG4gICAgbVszMV0gPSBsO1xuICB9IGVsc2Uge1xuICAgIG1bKChsICsgNjQgPj4gOSkgPDwgNCkgKyAxNV0gPSBsO1xuICB9XG5cbiAgZm9yICh2YXIgaT0wIDsgaTxtLmxlbmd0aDsgaSArPSAxNikge1xuICAgIHByb2Nlc3NCbG9jayhILCBtLCBpKTtcbiAgfVxuXG4gIHZhciBkaWdlc3RieXRlcyA9IHdvcmRzVG9CeXRlcyhIKTtcbiAgcmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5hc0J5dGVzID8gZGlnZXN0Ynl0ZXMgOlxuICAgICAgICAgb3B0aW9ucyAmJiBvcHRpb25zLmFzU3RyaW5nID8gX2ltcG9ydHMuY29udmVydFN0cmluZy5ieXRlc1RvU3RyaW5nKGRpZ2VzdGJ5dGVzKSA6XG4gICAgICAgICBfaW1wb3J0cy5ieXRlc1RvSGV4KGRpZ2VzdGJ5dGVzKVxufVxuXG5zaGEyNTYueDIgPSBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG4gIHJldHVybiBzaGEyNTYoc2hhMjU2KG1lc3NhZ2UsIHsgYXNCeXRlczp0cnVlIH0pLCBvcHRpb25zKVxufVxuXG59KHRoaXMpO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9ibGl4dC9zcmMvc3RhcmJvdW5kZWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIikscmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIpIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuOyhmdW5jdGlvbiAoY29tbW9uanMpIHtcbiAgZnVuY3Rpb24gZXJyb3JPYmplY3QoZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogZXJyb3IubmFtZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICBzdGFjazogZXJyb3Iuc3RhY2tcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZUNhbGxzRnJvbU93bmVyKGZ1bmN0aW9ucywgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgUHJveHkgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIExldCB0aGUgb3RoZXIgc2lkZSBrbm93IGFib3V0IG91ciBmdW5jdGlvbnMgaWYgdGhleSBjYW4ndCB1c2UgUHJveHkuXG4gICAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICAgIGZvciAodmFyIG5hbWUgaW4gZnVuY3Rpb25zKSBuYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7ZnVuY3Rpb25OYW1lczogbmFtZXN9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDYWxsYmFjayhpZCkge1xuICAgICAgZnVuY3Rpb24gY2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7Y2FsbFJlc3BvbnNlOiBpZCwgYXJndW1lbnRzOiBhcmdzfSk7XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrLl9hdXRvRGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIGNhbGxiYWNrLmRpc2FibGVBdXRvID0gZnVuY3Rpb24gKCkgeyBjYWxsYmFjay5fYXV0b0Rpc2FibGVkID0gdHJ1ZTsgfTtcblxuICAgICAgY2FsbGJhY2sudHJhbnNmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIHRyYW5zZmVyTGlzdCA9IGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7Y2FsbFJlc3BvbnNlOiBpZCwgYXJndW1lbnRzOiBhcmdzfSwgdHJhbnNmZXJMaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIG1lc3NhZ2UgPSBlLmRhdGE7XG5cbiAgICAgIGlmIChtZXNzYWdlLmNhbGwpIHtcbiAgICAgICAgdmFyIGNhbGxJZCA9IG1lc3NhZ2UuY2FsbElkO1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZC5cbiAgICAgICAgdmFyIGZuID0gZnVuY3Rpb25zW21lc3NhZ2UuY2FsbF07XG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGNhbGxSZXNwb25zZTogY2FsbElkLFxuICAgICAgICAgICAgYXJndW1lbnRzOiBbZXJyb3JPYmplY3QobmV3IEVycm9yKCdUaGF0IGZ1bmN0aW9uIGRvZXMgbm90IGV4aXN0JykpXVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcmdzID0gbWVzc2FnZS5hcmd1bWVudHMgfHwgW107XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNyZWF0ZUNhbGxiYWNrKGNhbGxJZCk7XG4gICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cbiAgICAgICAgdmFyIHJldHVyblZhbHVlO1xuICAgICAgICBpZiAob3B0aW9ucy5jYXRjaEVycm9ycykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KGZ1bmN0aW9ucywgYXJncyk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyb3JPYmplY3QoZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KGZ1bmN0aW9ucywgYXJncyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgb3B0aW9uIGZvciBpdCBpcyBlbmFibGVkLCBhdXRvbWF0aWNhbGx5IGNhbGwgdGhlIGNhbGxiYWNrLlxuICAgICAgICBpZiAob3B0aW9ucy5hdXRvQ2FsbGJhY2sgJiYgIWNhbGxiYWNrLl9hdXRvRGlzYWJsZWQpIHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXR1cm5WYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRDYWxsc1RvV29ya2VyKHdvcmtlcnMsIG9wdGlvbnMpIHtcbiAgICB2YXIgY2FjaGUgPSB7fSxcbiAgICAgICAgY2FsbGJhY2tzID0ge30sXG4gICAgICAgIHRpbWVycyxcbiAgICAgICAgbmV4dENhbGxJZCA9IDEsXG4gICAgICAgIGZha2VQcm94eSxcbiAgICAgICAgcGVuZGluZ0NhbGxzID0gMCxcbiAgICAgICAgcXVldWUgPSBbXTtcblxuICAgIC8vIENyZWF0ZSBhbiBhcnJheSBvZiBib29sZWFucyBmb3IgdGhlIGF2YWlsYWJpbGl0eSBvZiBlYWNoIHdvcmtlci5cbiAgICB2YXIgYXZhaWxhYmxlID0gd29ya2Vycy5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfSk7XG5cbiAgICAvLyBFYWNoIGluZGl2aWR1YWwgY2FsbCBnZXRzIGEgdGltZXIgaWYgdGltaW5nIGNhbGxzLlxuICAgIGlmIChvcHRpb25zLnRpbWVDYWxscykgdGltZXJzID0ge307XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIG5vIFByb3h5IHN1cHBvcnQsIHdlIGhhdmUgdG8gcHJlLWRlZmluZSBhbGwgdGhlIGZ1bmN0aW9ucy5cbiAgICAgIGZha2VQcm94eSA9IHtwZW5kaW5nQ2FsbHM6IDB9O1xuICAgICAgb3B0aW9ucy5mdW5jdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgZmFrZVByb3h5W25hbWVdID0gZ2V0SGFuZGxlcihudWxsLCBuYW1lKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEhhbmRsZXIoXywgbmFtZSkge1xuICAgICAgaWYgKG5hbWUgPT0gJ3BlbmRpbmdDYWxscycpIHJldHVybiBwZW5kaW5nQ2FsbHM7XG4gICAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXTtcblxuICAgICAgdmFyIGZuID0gY2FjaGVbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MpO1xuICAgICAgfTtcblxuICAgICAgLy8gU2VuZHMgdGhlIHNhbWUgY2FsbCB0byBhbGwgd29ya2Vycy5cbiAgICAgIGZuLmJyb2FkY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBwZW5kaW5nQ2FsbHMrKztcbiAgICAgICAgICBzZW5kQ2FsbChpLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gcGVuZGluZ0NhbGxzO1xuICAgICAgfTtcblxuICAgICAgLy8gTWFya3MgdGhlIG9iamVjdHMgaW4gdGhlIGZpcnN0IGFyZ3VtZW50IChhcnJheSkgYXMgdHJhbnNmZXJhYmxlLlxuICAgICAgZm4udHJhbnNmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIHRyYW5zZmVyTGlzdCA9IGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgcXVldWVDYWxsKG5hbWUsIGFyZ3MsIHRyYW5zZmVyTGlzdCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gZm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmx1c2hRdWV1ZSgpIHtcbiAgICAgIGlmICghcXVldWUubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWF2YWlsYWJsZVtpXSkgY29udGludWU7XG5cbiAgICAgICAgLy8gQSB3b3JrZXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICB2YXIgcGFyYW1zID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgc2VuZENhbGwoaSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSk7XG5cbiAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUNhbGwobmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdCkge1xuICAgICAgcGVuZGluZ0NhbGxzKys7XG4gICAgICBpZiAoZmFrZVByb3h5KSBmYWtlUHJveHkucGVuZGluZ0NhbGxzID0gcGVuZGluZ0NhbGxzO1xuICAgICAgcXVldWUucHVzaChbbmFtZSwgYXJncywgb3B0X3RyYW5zZmVyTGlzdF0pO1xuICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRDYWxsKHdvcmtlckluZGV4LCBuYW1lLCBhcmdzLCBvcHRfdHJhbnNmZXJMaXN0KSB7XG4gICAgICAvLyBHZXQgdGhlIHdvcmtlciBhbmQgbWFyayBpdCBhcyB1bmF2YWlsYWJsZS5cbiAgICAgIGF2YWlsYWJsZVt3b3JrZXJJbmRleF0gPSBmYWxzZTtcbiAgICAgIHZhciB3b3JrZXIgPSB3b3JrZXJzW3dvcmtlckluZGV4XTtcblxuICAgICAgdmFyIGlkID0gbmV4dENhbGxJZCsrO1xuXG4gICAgICAvLyBJZiB0aGUgbGFzdCBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uLCBhc3N1bWUgaXQncyB0aGUgY2FsbGJhY2suXG4gICAgICB2YXIgbWF5YmVDYiA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgIGlmICh0eXBlb2YgbWF5YmVDYiA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpZF0gPSBtYXliZUNiO1xuICAgICAgICBhcmdzID0gYXJncy5zbGljZSgwLCAtMSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHNwZWNpZmllZCwgdGltZSBjYWxscyB1c2luZyB0aGUgY29uc29sZS50aW1lIGludGVyZmFjZS5cbiAgICAgIGlmIChvcHRpb25zLnRpbWVDYWxscykge1xuICAgICAgICB2YXIgdGltZXJJZCA9IG5hbWUgKyAnKCcgKyBhcmdzLmpvaW4oJywgJykgKyAnKSc7XG4gICAgICAgIHRpbWVyc1tpZF0gPSB0aW1lcklkO1xuICAgICAgICBjb25zb2xlLnRpbWUodGltZXJJZCk7XG4gICAgICB9XG5cbiAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7Y2FsbElkOiBpZCwgY2FsbDogbmFtZSwgYXJndW1lbnRzOiBhcmdzfSwgb3B0X3RyYW5zZmVyTGlzdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoZSkge1xuICAgICAgdmFyIHdvcmtlckluZGV4ID0gd29ya2Vycy5pbmRleE9mKHRoaXMpO1xuICAgICAgdmFyIG1lc3NhZ2UgPSBlLmRhdGE7XG5cbiAgICAgIGlmIChtZXNzYWdlLmNhbGxSZXNwb25zZSkge1xuICAgICAgICB2YXIgY2FsbElkID0gbWVzc2FnZS5jYWxsUmVzcG9uc2U7XG5cbiAgICAgICAgcGVuZGluZ0NhbGxzLS07XG4gICAgICAgIGlmIChmYWtlUHJveHkpIGZha2VQcm94eS5wZW5kaW5nQ2FsbHMgPSBwZW5kaW5nQ2FsbHM7XG5cbiAgICAgICAgLy8gQ2FsbCB0aGUgY2FsbGJhY2sgcmVnaXN0ZXJlZCBmb3IgdGhpcyBjYWxsIChpZiBhbnkpLlxuICAgICAgICBpZiAoY2FsbGJhY2tzW2NhbGxJZF0pIHtcbiAgICAgICAgICBjYWxsYmFja3NbY2FsbElkXS5hcHBseShudWxsLCBtZXNzYWdlLmFyZ3VtZW50cyk7XG4gICAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tjYWxsSWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVwb3J0IHRpbWluZywgaWYgdGhhdCBvcHRpb24gaXMgZW5hYmxlZC5cbiAgICAgICAgaWYgKG9wdGlvbnMudGltZUNhbGxzICYmIHRpbWVyc1tjYWxsSWRdKSB7XG4gICAgICAgICAgY29uc29sZS50aW1lRW5kKHRpbWVyc1tjYWxsSWRdKTtcbiAgICAgICAgICBkZWxldGUgdGltZXJzW2NhbGxJZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHRoZSB3b3JrZXIgYXZhaWxhYmxlIHRvIGhhbmRsZSBtb3JlIGNhbGxzLlxuICAgICAgICBhdmFpbGFibGVbd29ya2VySW5kZXhdID0gdHJ1ZTtcbiAgICAgICAgZmx1c2hRdWV1ZSgpO1xuICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmZ1bmN0aW9uTmFtZXMpIHtcbiAgICAgICAgLy8gUmVjZWl2ZWQgYSBsaXN0IG9mIGF2YWlsYWJsZSBmdW5jdGlvbnMuIE9ubHkgdXNlZnVsIGZvciBmYWtlIHByb3h5LlxuICAgICAgICBtZXNzYWdlLmZ1bmN0aW9uTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIGZha2VQcm94eVtuYW1lXSA9IGdldEhhbmRsZXIobnVsbCwgbmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExpc3RlbiB0byBtZXNzYWdlcyBmcm9tIGFsbCB0aGUgd29ya2Vycy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHdvcmtlcnNbaV0uYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFrZVByb3h5O1xuICAgIH0gZWxzZSBpZiAoUHJveHkuY3JlYXRlKSB7XG4gICAgICByZXR1cm4gUHJveHkuY3JlYXRlKHtnZXQ6IGdldEhhbmRsZXJ9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm94eSh7fSwge2dldDogZ2V0SGFuZGxlcn0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBlaXRoZXIgYSBXb3JrZXIgaW5zdGFuY2UsIGEgbGlzdCBvZiB0aGVtLCBvciBhIG1hcFxuICAgKiBvZiBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkIGluc2lkZSB0aGUgd29ya2VyLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlV29ya2VyUHJveHkod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRfb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgLy8gQXV0b21hdGljYWxseSBjYWxsIHRoZSBjYWxsYmFjayBhZnRlciBhIGNhbGwgaWYgdGhlIHJldHVybiB2YWx1ZSBpcyBub3RcbiAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgIGF1dG9DYWxsYmFjazogZmFsc2UsXG4gICAgICAvLyBDYXRjaCBlcnJvcnMgYW5kIGF1dG9tYXRpY2FsbHkgcmVzcG9uZCB3aXRoIGFuIGVycm9yIGNhbGxiYWNrLiBPZmYgYnlcbiAgICAgIC8vIGRlZmF1bHQgc2luY2UgaXQgYnJlYWtzIHN0YW5kYXJkIGJlaGF2aW9yLlxuICAgICAgY2F0Y2hFcnJvcnM6IGZhbHNlLFxuICAgICAgLy8gQSBsaXN0IG9mIGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSBjYWxsZWQuIFRoaXMgbGlzdCB3aWxsIGJlIHVzZWQgdG8gbWFrZVxuICAgICAgLy8gdGhlIHByb3h5IGZ1bmN0aW9ucyBhdmFpbGFibGUgd2hlbiBQcm94eSBpcyBub3Qgc3VwcG9ydGVkLiBOb3RlIHRoYXRcbiAgICAgIC8vIHRoaXMgaXMgZ2VuZXJhbGx5IG5vdCBuZWVkZWQgc2luY2UgdGhlIHdvcmtlciB3aWxsIGFsc28gcHVibGlzaCBpdHNcbiAgICAgIC8vIGtub3duIGZ1bmN0aW9ucy5cbiAgICAgIGZ1bmN0aW9uTmFtZXM6IFtdLFxuICAgICAgLy8gQ2FsbCBjb25zb2xlLnRpbWUgYW5kIGNvbnNvbGUudGltZUVuZCBmb3IgY2FsbHMgc2VudCB0aG91Z2ggdGhlIHByb3h5LlxuICAgICAgdGltZUNhbGxzOiBmYWxzZVxuICAgIH07XG5cbiAgICBpZiAob3B0X29wdGlvbnMpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvcHRfb3B0aW9ucykge1xuICAgICAgICBpZiAoIShrZXkgaW4gb3B0aW9ucykpIGNvbnRpbnVlO1xuICAgICAgICBvcHRpb25zW2tleV0gPSBvcHRfb3B0aW9uc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZnJlZXplKG9wdGlvbnMpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhbiBhcnJheSBvZiB3b3JrZXJzIChldmVuIGlmIG9ubHkgdXNpbmcgb25lIHdvcmtlcikuXG4gICAgaWYgKHR5cGVvZiBXb3JrZXIgIT0gJ3VuZGVmaW5lZCcgJiYgKHdvcmtlcnNPckZ1bmN0aW9ucyBpbnN0YW5jZW9mIFdvcmtlcikpIHtcbiAgICAgIHdvcmtlcnNPckZ1bmN0aW9ucyA9IFt3b3JrZXJzT3JGdW5jdGlvbnNdO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHdvcmtlcnNPckZ1bmN0aW9ucykpIHtcbiAgICAgIHJldHVybiBzZW5kQ2FsbHNUb1dvcmtlcih3b3JrZXJzT3JGdW5jdGlvbnMsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlQ2FsbHNGcm9tT3duZXIod29ya2Vyc09yRnVuY3Rpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tbW9uanMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVdvcmtlclByb3h5O1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29wZTtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgc2NvcGUgPSBnbG9iYWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHdpbmRvdztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBzY29wZSA9IHNlbGY7XG4gICAgfVxuXG4gICAgc2NvcGUuY3JlYXRlV29ya2VyUHJveHkgPSBjcmVhdGVXb3JrZXJQcm94eTtcbiAgfVxufSkodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19

function getReader(viewOrBuffer) {
  if (viewOrBuffer instanceof ArrayBuffer) {
    viewOrBuffer = new DataView(viewOrBuffer);
  } else if (!(viewOrBuffer instanceof DataView)) {
    viewOrBuffer = new DataView(viewOrBuffer.buffer);
  }

  return Object.create(readerProto, {
    offset: {value: 0, writable: true},
    view: {value: viewOrBuffer}
  });
}

/**
 * The functionality for the reader type.
 *
 * A note about the implementation below: Seek is called before reading to
 * verify that the read wouldn't go out of bounds, then the seeked amount is
 * substracted from the new offset.
 */
var readerProto = {
  readBoolean: function () {
    // XXX: Might want to assert that this is only ever 0x00 or 0x01.
    return !!this.readUint8();
  },

  /**
   * Reads the specified number of bytes. If the optional noCopy flag is passed
   * in, the returned byte array will reference the original buffer instead of
   * making a copy (faster when you only want to read from the array).
   */
  readBytes: function (count, opt_noCopy) {
    var start = this.view.byteOffset + this.offset;
    this.seek(count, true);

    var range = new Uint8Array(this.view.buffer, start, count);
    if (opt_noCopy) return range;

    var array = new Uint8Array(count);
    array.set(range);
    return array;
  },

  readByteString: function (length) {
    return String.fromCharCode.apply(null, this.readBytes(length, true));
  },

  readDocument: function () {
    var doc = {name: this.readString()};

    // This is some kind of signature (0x0100000001).
    this.seek(5, true);

    doc.data = this.readDynamic();
    return doc;
  },

  readDocumentList: function () {
    var length = this.readUintVar();

    var list = [];
    for (var i = 0; i < length; i++) {
      list.push(this.readDocument());
    }
    return list;
  },

  readDynamic: function () {
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
  },

  /**
   * Reads the specified number of bytes and returns them as a string that ends
   * at the first null.
   */
  readFixedString: function (length) {
    var string = this.readByteString(length);
    var nullIndex = string.indexOf('\x00');
    if (nullIndex != -1) {
      return string.substr(0, nullIndex);
    }
    return string;
  },

  readFloat32: function () {
    return this.seek(4, true).view.getFloat32(this.offset - 4);
  },

  readFloat64: function () {
    return this.seek(8, true).view.getFloat64(this.offset - 8);
  },

  readInt8: function () {
    return this.seek(1, true).view.getInt8(this.offset - 1);
  },

  readInt16: function () {
    return this.seek(2, true).view.getInt16(this.offset - 2);
  },

  readInt32: function () {
    return this.seek(4, true).view.getInt32(this.offset - 4);
  },

  readIntVar: function () {
    var value = this.readUintVar();

    // Least significant bit represents the sign.
    if (value & 1) {
      return -(value >> 1);
    } else {
      return value >> 1;
    }
  },

  readList: function () {
    var length = this.readUintVar();

    var list = [];
    for (var i = 0; i < length; i++) {
      list.push(this.readDynamic());
    }
    return list;
  },

  readMap: function () {
    var length = this.readUintVar();

    var map = {};
    for (var i = 0; i < length; i++) {
      var key = this.readString();
      map[key] = this.readDynamic();
    }
    return map;
  },

  readString: function () {
    var length = this.readUintVar();

    // This is fucking bullshit.
    var raw = this.readByteString(length);
    return decodeURIComponent(escape(raw));
  },

  readStringList: function () {
    // Optimized structure that doesn't have a type byte for every item.
    var length = this.readUintVar();

    var list = [];
    for (var i = 0; i < length; i++) {
      list.push(this.readString());
    }
    return list;
  },

  readUint8: function () {
    return this.seek(1, true).view.getUint8(this.offset - 1);
  },

  readUint16: function () {
    return this.seek(2, true).view.getUint16(this.offset - 2);
  },

  readUint32: function () {
    return this.seek(4, true).view.getUint32(this.offset - 4);
  },

  readUintVar: function () {
    var value = 0;
    while (true) {
      var byte = this.readUint8();
      if ((byte & 128) == 0) {
        return value << 7 | byte;
      }
      value = value << 7 | (byte & 127);
    }
  },

  seek: function (offset, opt_relative) {
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
  }
};

exports.getReader = getReader;

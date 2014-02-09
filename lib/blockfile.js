var sbon = require('./sbon');
var utils = require('./utils');

/**
 * Size of the initial metadata required to be able to read the rest of the
 * block file.
 */
var METADATA_SIZE = 32;

/**
 * Reads from the provided file reference and returns a block file API through
 * a callback once the file has been loaded.
 */
exports.open = function (file, callback) {
  utils.getBufferFromFile(file, 0, METADATA_SIZE, function (buffer) {
    var reader = sbon.getReader(buffer);

    if (reader.readByteString(6) != 'SBBF02') {
      throw new Error('Unsupported block file format');
    }

    var headerSize = reader.readInt32(),
        blockSize = reader.readInt32(),
        freeBlockIsDirty = reader.readBoolean(),
        freeBlock = reader.readInt32();

    var blockFile = Object.create(blockFileProto, {
      file: {value: file},
      headerSize: {value: headerSize},
      blockSize: {value: blockSize},
      freeBlock: {value: freeBlock, writable: true},
      freeBlockIsDirty: {value: freeBlockIsDirty, writable: true},
      _userHeader: {value: null, writable: true}
    });

    callback(blockFile);
  });
};

// Functionality for block file objects.
var blockFileProto = {
  /**
   * Loads the data in a block and returns a wrapper for accessing it.
   */
  getBlock: function (index, callback) {
    var start = this.headerSize + this.blockSize * index,
        length = this.blockSize;
    utils.getBufferFromFile(this.file, start, start + length, function (buffer) {
      var view = new Uint8Array(buffer, 0, 2);
      var block = {
        type: String.fromCharCode(view[0], view[1]),
        buffer: buffer.slice(2)
      };
      callback(block);
    });
  },

  getUserHeader: function (callback) {
    if (this._userHeader) callback(this._userHeader);

    var self = this;
    var start = METADATA_SIZE, end = this.headerSize;
    utils.getBufferFromFile(this.file, start, end, function (buffer) {
      self._userHeader = buffer;
      callback(buffer);
    });
  }
};

var sbon = require('./sbon');

var BLOCK_INDEX = 'II';
var BLOCK_LEAF = 'LL';

exports.open = function (blockFile, callback) {
  blockFile.getUserHeader(function (buffer) {
    var reader = sbon.getReader(buffer);

    if (reader.readFixedString(12) != 'BTreeDB4') {
      throw new Error('Unsupported database format');
    }

    var identifier = reader.readFixedString(12);
    var keySize = reader.readInt32();

    // Whether we should be using the alternate root node reference.
    var alternate = reader.readBoolean();

    // Skip ahead based on whether we're alternating references.
    reader.seek(alternate ? 9 : 1, true);

    var rootNode = reader.readInt32(),
        rootNodeIsLeaf = reader.readBoolean();

    var database = Object.create(databaseProto, {
      identifier: {value: identifier},
      blockFile: {value: blockFile},
      keySize: {value: keySize},
      alternateRootNode: {value: alternate, writable: true},
      rootNode: {value: rootNode, writable: true},
      rootNodeIsLeaf: {value: rootNodeIsLeaf, writable: true}
    });

    callback(database);
  });
};

/**
 * Wraps a block object to provide functionality for parsing and scanning an
 * index.
 */
function index(keySize, block) {
  var reader = new sbon.getReader(block.buffer);

  var indexLevel = reader.readUint8();

  // Number of keys in this index.
  var keyCount = reader.readInt32();

  // The blocks that the keys point to. There will be one extra block in the
  // beginning of this list that points to the block to go to if the key being
  // searched for is left of the first key in this index.
  var blockIds = new Int32Array(keyCount + 1);
  blockIds[0] = reader.readInt32();

  var index = Object.create(indexProto, {
    level: {value: indexLevel},
    keyCount: {value: keyCount},
    keys: {value: []},
    blockIds: {value: blockIds}
  });

  // Load all key/block reference pairs.
  for (var i = 1; i < keyCount; i++) {
    index.keys.push(reader.readByteString(keySize));
    blockIds[i] = reader.readInt32();
  }

  return index;
}

var databaseProto = {
  get: function (key, callback) {
    if (key.length != this.keySize) {
      throw new Error('Provided key must be of the correct length');
    }

    this.search(this.rootNode, key, callback);
  },

  getLeafValue: function (block, key, callback) {
    if (block.type != BLOCK_LEAF) {
      throw new Error('Expected a leaf node');
    }

    var reader = sbon.getReader(block.buffer);

    var keyCount = reader.readInt32();
    for (var i = 0; i < keyCount; i++) {
      // Get the key to see if it's the one we're searching for.
      var curKey = reader.readByteString(this.keySize);

      var size = reader.readUintVar();
      if (key == curKey) {
        this.readLeafData(new Uint8Array(size), block, reader.offset, 0, callback);
        return;
      }
      reader.seek(size, true);
    }

    throw new Error('Could not find key');
  },

  /**
   * Reads leaf data into an array, starting at the specified offset in the
   * block data.
   */
  readLeafData: function (dest, block, blockOffset, bytesWritten, callback) {
    // The number of bytes we could possibly read from the current block. The
    // last 4 bytes contain a reference to the next block, so are off limits.
    var blockDataEnd = block.buffer.byteLength - 4;
    var potentialBytes = blockDataEnd - blockOffset;

    // Figure out how many bytes we can copy over and copy them.
    var bytesToSet = Math.min(potentialBytes, dest.length - bytesWritten);

    // TODO: Is there a better way to copy data out of a buffer?
    var source = new Uint8Array(block.buffer, blockOffset, bytesToSet);
    dest.set(source, bytesWritten);

    bytesWritten += bytesToSet;

    // We still have more to go...
    if (bytesWritten < dest.length) {
      var self = this;

      // TODO: Is there no better way to get a single value out of a buffer?
      var nextBlock = new DataView(block.buffer, blockDataEnd, 4).getInt32(0);
      this.blockFile.getBlock(nextBlock, function (block) {
        self.readLeafData(dest, block, 0, bytesWritten, callback);
      });

      return;
    }

    callback(dest.buffer);
  },

  /**
   * Begin searching for a key at the given block id. Keep searching down the
   * indexes until a leaf is found and then return the value for the provided
   * key.
   */
  search: function (blockId, key, callback) {
    var self = this;
    this.blockFile.getBlock(blockId, function (block) {
      if (block.type == BLOCK_LEAF) {
        self.getLeafValue(block, key, callback);
        return;
      }

      if (block.type != BLOCK_INDEX) {
        throw new Error('Expected an index block');
      }

      // TODO: Cache index blocks.
      var nextBlockId = index(self.keySize, block).find(key);
      self.search(nextBlockId, key, callback);
    });
  }
};

var indexProto = {
  /**
   * Searches this index for the specified key and returns the next block id to
   * search.
   */
  find: function (key) {
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
  }
};

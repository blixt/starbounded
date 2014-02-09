var starbound = require('starbound-files');

var openButton = document.getElementById('open');

/**
 * Called after a user chooses a directory to open, so that we can remember
 * that directory for future launches of that app.
 */
function initRoot(root) {
  // TODO: Only if verified as valid Starbound directory.
  var retainId = chrome.fileSystem.retainEntry(root);
  chrome.storage.sync.set({rootRetainId: retainId});

  readRoot(root);
}

function readAssets(root) {
  root.getFile('assets/packed.pak', {}, function (assets) {
    assets.file(function (file) {
      starbound.blockfile.open(file, function (blockFile) {
        console.log('blockfile', blockFile);
        starbound.btreedb.open(blockFile, function (db) {
          console.log('btreedb', db);
          db.get('\xbe\x94<\\\xff\xbaT\xd8~\xcf#P\t\xe2\xa4\xdc2~4mX\xe2\x05Q\x0b}n\x84=\x01\x81\x93', function (buffer) {
            var reader = starbound.sbon.getReader(buffer);
            console.log(reader.readStringList());
          });
        });
      });
    });
  });
}

/**
 * Called when the root Starbound directory has been opened.
 */
function readRoot(root) {
  openButton.style.display = 'none';
  readAssets(root);
}

function init() {
  // Attempt to get a previously retained directory entry.
  chrome.storage.sync.get('rootRetainId', function (value) {
    if (value && value.rootRetainId) {
      chrome.fileSystem.restoreEntry(value.rootRetainId, function (root) {
        readRoot(root);
      });
    } else {
      openButton.removeAttribute('disabled');
      openButton.addEventListener('click', function () {
        chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function (root) {
          initRoot(root);
        });
      });
    }
  });
}

init();

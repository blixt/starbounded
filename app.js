var starbound = require('starbound-assets');

// Create an assets manager which will deal with package files etc.
var assets = new starbound.AssetsManager({workerPath: 'build/worker.js'});

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
  // Add the assets directory.
  root.getDirectory('assets', {}, function (entry) {
    assets.addRoot(entry, function () {
      // Proof of concept: load an image through the worker and render it on screen.
      assets.getBlobURL('/objects/tiered/tier3door/tier3door.png', function (err, url) {
        var img = new Image();
        img.src = url;
        document.body.appendChild(img);
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

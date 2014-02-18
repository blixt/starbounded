var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;
var WorldRenderer = require('starbound-world').WorldRenderer;

// Create an assets manager which will deal with package files etc.
var assets = new AssetsManager({workerPath: 'build/worker-assets.js'});
var world = new WorldManager({workerPath: 'build/worker-world.js'});

// Set up a renderer that will render the graphics onto screen.
var renderer = new WorldRenderer(document.getElementById('viewport'), world, assets);

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

/**
 * Called when the root Starbound directory has been opened.
 */
function readRoot(root) {
  openButton.style.display = 'none';

  document.body.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
      case 37:
        renderer.scroll(-1, 0);
        break;
      case 38:
        renderer.scroll(0, 1);
        break;
      case 39:
        renderer.scroll(1, 0);
        break;
      case 40:
        renderer.scroll(0, -1);
        break;
    }
  });

  // Load all the assets.
  root.getDirectory('assets', {}, function (entry) {
    assets.addRoot(entry, function () {
      renderer.preload();

      var path = 'universe/beta_73998977_11092106_-913658_12_8.world';
      root.getFile(path, {}, function (entry) {
        entry.file(function (file) {
          console.log('Loading world', path);
          world.open(file, function (err, metadata) {
            renderer.center(metadata.playerStart[0], metadata.playerStart[1]);
          });
        });
      });
    });
  });
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

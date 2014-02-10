var starbound = require('starbound-files');

// Create an assets manager which will deal with package files etc.
var assets = starbound.assets.createManager();

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
  root.getFile('universe/beta_73998977_11092106_-913658_12_8.world', {}, function (entry) {
    starbound.world.open(entry, function (err, world) {
      world.getMetadata(function (err, data) {
        // Get the spawn point.
        var x = data.playerStart[0] >> 5,
            y = data.playerStart[1] >> 5;

        // Load the region data around the spawn point.
        world.getRegion(x, y, function (err, region) {
          for (var tx = 0; tx < 32; tx++) {
            for (var ty = 0; ty < 32; ty++) {
              var bg = region.getBackground(tx, ty);
              var fg = region.getForeground(tx, ty);
              // TODO: Render background and foreground tiles.
            }
          }
        });
      });
    });
  });

  // Add the assets directory.
  root.getDirectory('assets', {}, function (entry) {
    assets.addRoot(entry, function () {
      console.log('Loaded', Object.keys(assets._index).length, 'files into the index');
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

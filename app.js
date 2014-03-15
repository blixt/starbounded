var starbound = require('./lib/starbound').setup(document.getElementById('viewport'));

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

  // Load all the assets.
  root.getDirectory('assets', {}, function (entry) {
    starbound.assets.addRoot(entry, function () {
      starbound.renderer.preload();

      var path = 'universe/beta_73998977_11092106_-913658_12_8.world';
      root.getFile(path, {}, function (entry) {
        entry.file(function (file) {
          starbound.world.open(file, function (err, metadata) {
            starbound.renderer.render();
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

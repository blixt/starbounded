var Q = require('q');
var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;

// Create an assets manager which will deal with package files etc.
var assets = new AssetsManager({workerPath: 'build/worker-assets.js'});
var world = new WorldManager({workerPath: 'build/worker-world.js'});

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

function loadAssets(root) {
  var deferred = Q.defer();

  root.getDirectory('assets', {}, function (entry) {
    assets.addRoot(entry, deferred.resolve);
  });

  return deferred.promise;
}

function loadWorld(root, path) {
  var deferred = Q.defer();

  root.getFile(path, {}, function (entry) {
    entry.file(function (file) {
      console.log('loading world', path);
      world.open(file, deferred.makeNodeResolver());
    });
  });

  return deferred.promise;
}

var loadRegion = Q.nbind(world.getRegion, world);
var loadTileResources = Q.nbind(assets.loadTileResources, assets);

function createCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  document.body.appendChild(canvas);
  return canvas;
}

function readAssets(root) {
  var resources = loadAssets(root)
    .then(function () {
      return loadTileResources();
    });

  loadWorld(root, 'universe/beta_73998977_11092106_-913658_12_8.world')
    .then(function (metadata) {
      console.log('world metadata', metadata);

      // Get the spawn point.
      var x = metadata.playerStart[0] >> 5,
          y = metadata.playerStart[1] >> 5;

      renderRegion(createCanvas(), 249, y + 1, resources);
      renderRegion(createCanvas(), x, y + 1, resources);
      renderRegion(createCanvas(), x + 1, y + 1, resources);
      renderRegion(createCanvas(), 249, y, resources);
      renderRegion(createCanvas(), x, y, resources);
      renderRegion(createCanvas(), x + 1, y, resources);
    });
}

function renderRegion(canvas, x, y, resources) {
  var region = loadRegion(x, y);

  return Q.all([region, resources]).spread(function (region, resources) {
    var resourceIds = region.getResourceIds();

    var materialPromises = getResourceImages(resourceIds.materials, resources.materials);
    var matmodPromises = getResourceImages(resourceIds.matmods, resources.matmods);

    var allPromises = Q.all(Q.all(materialPromises), Q.all(matmodPromises));
    allPromises.then(function (materialImages, matmodImages) {
      var images = {};
      for (var i = 0; i < resourceIds.materials.length; i++) {
        images[resourceIds.materials[i]] = materialImages[i];
      }

      var context = canvas.getContext('2d');

      console.time('render region');

      context.fillStyle = '#000';
      context.fillRect(0, 0, 256, 256);

      for (var y = 0; y < 32; y++) {
        for (var x = 0; x < 32; x++) {
          var tile = region.getTile(x, y);

          // TODO: Figure out the real variant algorithm.
          var variant = Math.round(Math.random() * 256);

          // TODO: The right way to do this is to darken the pixel values.
          // TODO: The background doesn't need to be rendered if the foreground
          //       tile is opaque (i.e., not glass).
          context.globalAlpha = .5;
          drawTile(context, tile[5], x * 8, y * 8, variant, region.getNeighbors(x, y, true), images, resources.materials);
          context.globalAlpha = 1;
          drawTile(context, tile[0], x * 8, y * 8, variant, region.getNeighbors(x, y), images, resources.materials);
        }
      }

      console.timeEnd('render region');
    });
  });
}

function drawTile(context, material, x, y, variant, neighbors, images, materials) {
  var dtop = neighbors.top > 0 && neighbors.top != 39,
      dright = neighbors.right > 0 && neighbors.right != 39,
      dbottom = neighbors.bottom > 0 && neighbors.bottom != 39,
      dleft = neighbors.left > 0 && neighbors.left != 39;

  if (material > 0 && material != 39) {
    context.drawImage(images[material], variant % materials[material].variants * 16 + 4, 12, 8, 8, x, y, 8, 8);
    dtop = dtop && material > neighbors.top;
    dright = dright && material > neighbors.right;
    dbottom = dbottom && material > neighbors.bottom;
    dleft = dleft && material > neighbors.left;
  }

  var itop, iright, ibottom, ileft,
      vtop, vright, vbottom, vleft;

  if (dright) {
    iright = images[neighbors.right];
    vright = variant % materials[neighbors.right].variants * 16;
  }

  if (dleft) {
    ileft = images[neighbors.left];
    vleft = variant % materials[neighbors.left].variants * 16;
  }

  if (dtop) {
    itop = images[neighbors.top];
    vtop = variant % materials[neighbors.top].variants * 16;

    if (neighbors.top == neighbors.left) {
      context.drawImage(itop, vtop, 0, 4, 4, x, y, 4, 4);
    } else if (neighbors.top < neighbors.left) {
      if (dleft)
        context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 4, 20, 4, 4, x, y, 4, 4);
      if (dleft)
        context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 12, 4, 4, x, y, 4, 4);
  }

  x += 4;

  if (dtop) {
    if (neighbors.top == neighbors.right) {
      context.drawImage(itop, vtop + 4, 0, 4, 4, x, y, 4, 4);
    } else if (neighbors.top < neighbors.right) {
      if (dright)
        context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(itop, vtop + 8, 20, 4, 4, x, y, 4, 4);
      if (dright)
        context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 12, 4, 4, x, y, 4, 4);
  }

  y += 4;

  if (dbottom) {
    ibottom = images[neighbors.bottom];
    vbottom = variant % materials[neighbors.bottom].variants * 16;

    if (neighbors.bottom == neighbors.right) {
      context.drawImage(ibottom, vbottom + 4, 4, 4, 4, x, y, 4, 4);
    } else if (neighbors.bottom < neighbors.right) {
      if (dright)
        context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 8, 8, 4, 4, x, y, 4, 4);
      if (dright)
        context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dright) {
    context.drawImage(iright, vright, 16, 4, 4, x, y, 4, 4);
  }

  x -= 4;

  if (dbottom) {
    if (neighbors.bottom == neighbors.left) {
      context.drawImage(ibottom, vbottom, 4, 4, 4, x, y, 4, 4);
    } else if (neighbors.bottom < neighbors.left) {
      if (dleft)
        context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
    } else {
      context.drawImage(ibottom, vbottom + 4, 8, 4, 4, x, y, 4, 4);
      if (dleft)
        context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
    }
  } else if (dleft) {
    context.drawImage(ileft, vleft + 12, 16, 4, 4, x, y, 4, 4);
  }
}

function resourcePath(resource, property) {
  var path = resource[property];

  if (path[0] == '/') {
    return path;
  }

  var base = resource.__path__;
  return base.substr(0, base.lastIndexOf('/') + 1) + path;
}

function getResourceImages(ids, resources) {
  var promises = [];
  for (var i = 0; i < ids.length; i++) {
    var resource = resources[ids[i]];

    if (resource.platform) {
      promises.push(null);
      continue;
    }

    var path = resourcePath(resource, 'frames');
    var imagePromise = Q.ninvoke(assets, 'getBlobURL', path)
      .then(function (url) {
        var image = new Image();
        image.src = url;

        var deferred = Q.defer();
        image.onerror = deferred.reject;
        image.onload = function () {
          deferred.resolve(image);
        }
        return deferred.promise;
      });

    promises.push(imagePromise);
  }
  return promises;
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

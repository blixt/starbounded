var starbound = require('./lib/starbound').setup(document.getElementById('viewport'));

// Set up UI components.
require('./lib/ui/os')();
require('./lib/ui/progress')(starbound);
require('./lib/ui/world-selector')(starbound);

require('./lib/ui/web-selector')(starbound, (error, info) => {
  // Find the most recent world, load it, and render it.
  var mostRecentWorld = null;
  for (var i = 0; i < info.worldFiles.length; i++) {
    var world = info.worldFiles[i];

    var isMoreRecent = !mostRecentWorld || world.lastModifiedDate > mostRecentWorld.lastModifiedDate;

    if (world.name.match(/\.world$/) && isMoreRecent) {
      mostRecentWorld = world;
    }
  }

  if (mostRecentWorld) {
    starbound.worlds.open(mostRecentWorld, function (error, world) {
      if (!error) starbound.renderer.setWorld(world);
    });
  }
});

starbound.renderer.on('load', () => {
  $('#world-status').text(starbound.renderer.world.name);
});

starbound.renderer.on('unload', () => {
  $('#world-status').text('No world loaded');
});

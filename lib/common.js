var AssetsManager = require('starbound-assets').AssetsManager;
var WorldManager = require('starbound-world').WorldManager;
var WorldRenderer = require('starbound-world').WorldRenderer;

exports.setup = function (viewport) {
  // Create an assets manager which will deal with package files etc.
  var assets = new AssetsManager({
    workerPath: 'build/worker-assets.js',
    workers: 4
  });

  // Create a world manager that handles loading the world and its regions.
  var world = new WorldManager({workerPath: 'build/worker-world.js'});

  // Set up a renderer that will render the graphics onto screen.
  var renderer = new WorldRenderer(viewport, world, assets);

  // Enable keyboard scrolling.
  document.body.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
      case 37:
        renderer.scroll(-10, 0, true);
        break;
      case 38:
        renderer.scroll(0, 10, true);
        break;
      case 39:
        renderer.scroll(10, 0, true);
        break;
      case 40:
        renderer.scroll(0, -10, true);
        break;
      default:
        return;
    }

    event.preventDefault();
  });

  // Enable dragging to scroll.
  var dragging = null;
  viewport.addEventListener('mousedown', function (e) {
    dragging = [e.clientX, e.clientY];
  });

  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    renderer.scroll(dragging[0] - e.clientX, e.clientY - dragging[1], true);
    dragging[0] = e.clientX;
    dragging[1] = e.clientY;
  });

  document.addEventListener('mouseup', function () {
    dragging = null;
  });

  // Enable zooming with the mouse wheel.
  viewport.addEventListener('wheel', function (e) {
    if (e.deltaY > 0) renderer.zoomOut();
    if (e.deltaY < 0) renderer.zoomIn();
    e.preventDefault();
  });

  return {
    assets: assets,
    renderer: renderer,
    world: world,
  };
};

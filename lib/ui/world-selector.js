var moment = require('moment');

module.exports = function (starbound) {
  var addWorlds = document.getElementById('add-world-files');
  addWorlds.onchange = (event) => {
    for (var i = 0; i < addWorlds.files.length; i++) {
      starbound.worlds.open(addWorlds.files[i]);
    }
  };

  var worldList = $('#worlds');

  var worlds = [];

  worldList.on('click', '.list-group-item', (event) => {
    var item = $(event.target).closest('.list-group-item');

    var index = item.data('index');
    starbound.renderer.setWorld(worlds[index]);
    starbound.renderer.requestRender();
  });

  starbound.renderer.on('load', () => {
    worldList.find('.list-group-item').removeClass('active');
    for (var i = 0; i < worlds.length; i++) {
      if (worlds[i] == starbound.renderer.world) {
        worldList.find('[data-index=' + i + ']').addClass('active');
        break;
      }
    }
  });

  starbound.renderer.on('unload', () => {
    worldList.find('.list-group-item').removeClass('active');
  });

  starbound.worlds.on('load', (event) => {
    var world = event.world;

    var index = worlds.length;
    worlds.push(world);

    var item = $('<a href="#" class="list-group-item">')
      .attr('data-index', index)
      .append(
        $('<h4 class="list-group-item-heading">').text(world.name),
        $('<p class="list-group-item-text">').text('Played ' + moment(world.lastModified).fromNow())
      );

    worldList.append(item);
  });
};

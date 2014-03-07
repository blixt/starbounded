var moment = require('moment');

var common = require('./lib/common');

var viewport = document.getElementById('viewport');
var starbound = common.setup(viewport);


// Attempt to play the music for the world.
starbound.world.on('load', function (world) {
  // I'm too lazy to support Angry Koala worlds. :)
  if (world.metadata.__version__ != 2) return;

  try {
    var tracks = world.metadata.worldTemplate.templateData.biomes[0].musicTrack.day.tracks;
  } catch (e) {
    return;
  }

  var trackIndex = Math.round(Math.random() * (tracks.length - 1));

  starbound.assets.getBlobURL(tracks[trackIndex], function (err, url) {
    if (err) return;

    var audio = document.createElement('audio');
    audio.autoplay = true;
    audio.controls = true;
    audio.src = url;
    document.getElementById('audio').appendChild(audio);
  });
});


function loadAssets(file) {
  starbound.assets.addFile('/', file, function (err) {
    starbound.renderer.preload();
  });
}

function loadWorld(file) {
  starbound.world.open(file, function (err, metadata) {
    starbound.renderer.render();
  });
}

var worldsAdded, groups = {};
function addWorld(file) {
  // Verify that the world file is valid.
  var reader = new FileReader();
  reader.onloadend = function () {
    if (reader.result != 'SBBF02') return;

    var list = document.starbounded.worldList;

    if (!worldsAdded) {
      // Remove the "Select directory" message.
      list.remove(0);
      list.removeAttribute('disabled');
      document.starbounded.loadWorld.removeAttribute('disabled');
      worldsAdded = {};
    }

    worldsAdded[file.name] = file;

    var groupName, label;
    if (file.name.substr(-10) == '.shipworld') {
      groupName = 'ships';
      label = 'Ship for ' + file.name.substr(0, file.name.length - 10);
    } else {
      var pieces = file.name.replace('.world', '').split('_');

      groupName = pieces[0];

      label = 'planet ' + pieces[4];
      if (pieces[5]) label += ' moon ' + pieces[5];
      label += ' @ (' + pieces[1] + ', ' + pieces[2] + ')';
      label += ', played ' + moment(file.lastModifiedDate).fromNow();
    }

    var group = groups[groupName];
    if (!group) {
      group = document.createElement('optgroup');
      group.setAttribute('label', groupName);
      groups[groupName] = group;
      list.appendChild(group);
    }

    // Add the world in the right place according to time modified.
    for (var i = 0; i < group.childNodes.length; i++) {
      var other = worldsAdded[group.childNodes[i].value];
      if (other.lastModifiedDate < file.lastModifiedDate) break;
    }

    var option = new Option(label, file.name);
    group.insertBefore(option, group.childNodes[i]);
  };
  reader.readAsText(file.slice(0, 6));
}

if (document.starbounded.root.webkitdirectory) {
  // The browser supports selecting the directory.
  document.body.classList.add('directory-support');

  document.starbounded.root.onchange = function () {
    var pendingFiles = 0;

    for (var i = 0; i < this.files.length; i++) {
      var file = this.files[i],
          path = file.webkitRelativePath,
          match;

      // Skip hidden files/directories.
      if (file.name[0] == '.') continue;

      if (file.name.match(/\.(ship)?world$/)) {
        addWorld(file);
      } else if (match = path.match(/^Starbound\/assets(\/.*)/)) {
        // Not sure why music files are stored incorrectly like this.
        if (match[1].substr(0, 13) == '/music/music/') {
          match[1] = match[1].substr(6);
        }

        // Add the file and then preload the renderer once all assets have been
        // added.
        pendingFiles++;
        starbound.assets.addFile(match[1], file, function (err) {
          pendingFiles--;
          if (!pendingFiles) {
            starbound.renderer.preload();
          }
        });
      }
    }
  };

  document.starbounded.loadWorld.onclick = function () {
    var file = worldsAdded && worldsAdded[document.starbounded.worldList.value];
    if (!file) return;
    loadWorld(file);

    document.starbounded.loadWorld.setAttribute('disabled', '');
    document.starbounded.worldList.setAttribute('disabled', '');
  };
} else {
  // Separate files solution.
  document.starbounded.assets.onchange = function () {
    loadAssets(this.files[0]);
  };

  document.starbounded.world.onchange = function () {
    loadWorld(this.files[0]);
  };
}

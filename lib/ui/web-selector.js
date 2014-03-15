var once = require('once');

module.exports = function (starbound, callback) {
  var directory = document.getElementById('directory'),
      file = document.getElementById('file');

  if (directory.webkitdirectory) {
    $('#directory-selector').modal({backdrop: 'static', keyboard: false});
    directory.onchange = function () {
      // Verify that a Starbound directory is selected.
      var verified = false;
      for (var i = 0; i < this.files.length; i++) {
        var file = this.files[i];
        if (file.webkitRelativePath == 'Starbound/assets/packed.pak') {
          verified = true;
          break;
        }
      }

      var status = $('#directory-status');
      if (verified) {
        status.attr('class', 'text-success');
        status.find('span').attr('class', 'glyphicon glyphicon-ok');
        status.find('strong').text('Click Load assets to continue')
        $('#load-directory').attr('disabled', false);
      } else {
        status.attr('class', 'text-danger');
        status.find('span').attr('class', 'glyphicon glyphicon-remove');
        status.find('strong').text('That does not appear to be the Starbound directory')
        $('#load-directory').attr('disabled', true);
      }
    };
  } else {
    $('#file-selector').modal({backdrop: 'static', keyboard: false});
    file.onchange = function () {
      // Verify that packed.pak is selected.
      var status = $('#file-status');
      if (this.files[0].name == 'packed.pak') {
        status.attr('class', 'text-success');
        status.find('span').attr('class', 'glyphicon glyphicon-ok');
        status.find('strong').text('Click Load assets to continue')
        $('#load-file').attr('disabled', false);
      } else {
        status.attr('class', 'text-danger');
        status.find('span').attr('class', 'glyphicon glyphicon-remove');
        status.find('strong').text('That does not appear to be the packed.pak file')
        $('#load-file').attr('disabled', true);
      }
    };
  }

  $('#load-directory').click(function () {
    var pendingFiles = 0;

    var worldFiles = [];
    for (var i = 0; i < directory.files.length; i++) {
      var file = directory.files[i],
          path = file.webkitRelativePath,
          match;

      // Skip hidden files/directories.
      if (file.name[0] == '.') continue;

      if (file.name.match(/\.(ship)?world$/)) {
        worldFiles.push(file);
      } else if (match = path.match(/^Starbound\/(?:assets|mods)(\/.*)/)) {
        // Not sure why music files are stored incorrectly like this.
        if (match[1].substr(0, 13) == '/music/music/') {
          match[1] = match[1].substr(6);
        }

        // Add the file and then preload the renderer once all assets have been
        // added.
        pendingFiles++;
        starbound.assets.addFile(match[1], file, once(function (err) {
          pendingFiles--;
          if (!pendingFiles) {
            starbound.renderer.preload();
            callback(null, {worldFiles: worldFiles});
          }
        }));
      }
    }

    $('#directory-selector').modal('hide');
  });

  $('#load-file').click(function () {
    // TODO: Allow adding mods?
    starbound.assets.addFile('/', file.files[0], once(function () {
      starbound.renderer.preload();
      callback(null, {worldFiles: []});
    }));

    $('#file-selector').modal('hide');
  });
};

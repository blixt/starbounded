module.exports = function (starbound) {
  var maxTasks = 0,
      progress = $('#progress');

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame;

  requestAnimationFrame(function loop() {
    var pendingTasks = starbound.assets.api.pendingCalls +
                       starbound.worlds.api.pendingCalls;

    if (pendingTasks) {
      if (maxTasks < pendingTasks) {
        maxTasks = pendingTasks;
      }

      var percentage = (maxTasks * 1.1 - pendingTasks) / (maxTasks * 1.1) * 100;
      progress.css('width', percentage + '%');
      progress.show();
    } else if (maxTasks) {
      maxTasks = 0;
      progress.css('width', '100%');
      progress.fadeOut();
    }

    requestAnimationFrame(loop);
  });
};

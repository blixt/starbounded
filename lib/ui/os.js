var ua = require('useragent-wtf');

module.exports = function () {
  switch (ua.os) {
    case 'mac':
      $('.mac').show();
      break;
    case 'windows':
      $('.windows').show();
      break;
  }
};

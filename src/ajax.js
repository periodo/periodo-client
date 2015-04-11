var $ = require('jquery')
  , Promise = require('dexie').Promise

module.exports = {
  ajax: function () {
    var args = arguments;
    return new Promise(function (resolve, reject) {
      $.ajax.apply($, args).then(resolve, reject);
    });
  },
  getJSON: function () {
    var args = arguments;
    return new Promise(function (resolve, reject) {
      $.getJSON.apply($, args).then(resolve, reject);
    });
  }
}

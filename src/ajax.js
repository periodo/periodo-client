var $ = require('jquery')

module.exports = {
  ajax: function () {
    var args = arguments;
    return new Promise(function (resolve, reject) {
      $.ajax.apply($, args).then(
        (...retArgs) => resolve(retArgs),
        (...retArgs) => reject(retArgs)
      );
    });
  },
  getJSON: function () {
    var args = arguments;
    return new Promise(function (resolve, reject) {
      $.getJSON.apply($, args).then(
        (...retArgs) => resolve(retArgs),
        (...retArgs) => reject(retArgs)
      );
    });
  }
}

"use strict";

// FIXME
var $ = {}

module.exports = {
  ajax: function () {
    var args = arguments

    return new Promise(function (resolve, reject) {
      var end = window.periodo.emit.bind(window.periodo, 'requestEnd')
        , promise

      window.periodo.emit('request');

      promise = $.ajax.apply($, args);

      promise.then(end, end);
      promise.then(
        (...retArgs) => resolve(retArgs),
        (...retArgs) => reject(retArgs)
      );
    });
  },
  getJSON: function () {
    var args = arguments

    return new Promise(function (resolve, reject) {
      var end = window.periodo.emit.bind(window.periodo, 'requestEnd')
        , promise

      window.periodo.emit('request');

      promise = $.getJSON.apply($, args);

      promise.then(end, end);
      promise.then(
        (...retArgs) => resolve(retArgs),
        (...retArgs) => reject(retArgs)
      );
    });
  }
}

"use strict";

var $ = require('jquery')

module.exports = {
  ajax: function () {
    var args = arguments
      , app = require('./app')

    return new Promise(function (resolve, reject) {
      var end = app.trigger.bind(app, 'requestEnd')
        , promise

      app.trigger('request');

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
      , app = require('./app')

    return new Promise(function (resolve, reject) {
      var end = app.trigger.bind(app, 'requestEnd')
        , promise

      app.trigger('request');

      promise = $.getJSON.apply($, args);

      promise.then(end, end);
      promise.then(
        (...retArgs) => resolve(retArgs),
        (...retArgs) => reject(retArgs)
      );
    });
  }
}

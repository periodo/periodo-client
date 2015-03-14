var $ = require('jquery')
  , Backbone = require('../backbone')

function isLocalLD() {
  var dfd = $.Deferred();
  $.getJSON('/').then(function (data) {
    if (data.dataset) {
      dfd.resolve(true);
    } else {
      dfd.resolve(false);
    }
  }, function () {
    dfd.resolve(false);
  });
  return dfd.promise()
}

module.exports = Backbone.View.extend({
  initialize: function () {
    var that = this;
    var dbNames = JSON.parse(localStorage['Dexie.DatabaseNames']);

    this.dbNames = dbNames;
    this.render();
  },
  render: function () {
    var template = require('../templates/db_select.html');
    this.$el.html(template({
      localDBNames: this.dbNames
    }));
  }
});

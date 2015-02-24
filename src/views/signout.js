var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  initialize: function (opts) {
    var that = this;
    delete localStorage.auth;
    setTimeout(opts.authCallback, 0);
    this.render();
  },
  render: function () {
    var template = require('../templates/signout.html');
    this.$el.html(template());
  }
});

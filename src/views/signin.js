var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  events: {
    'click #connect-orcid-link': 'initOrcidAuth'
  },
  initialize: function (opts) {
    this.authCallback = opts.authCallback;
    this.render();
  },
  render: function () {
    var template = require('../templates/signin.html');
    this.$el.html(template());
  },
  initOrcidAuth: function () {
    var that = this;
    var check;
    var oauthWindow = window.open('/register', "_blank", "toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500");

    check = setInterval(function () {
      if (!oauthWindow || !oauthWindow.closed) return;
      clearInterval(check);
      if ('auth' in localStorage) {
        that.success.call(that);
      }
      that.authCallback()
    }, 100);
  },
  success: function () {
    this.$el.html('<p>Signed in.</p>');
  }
});

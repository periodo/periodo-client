var Backbone = require('backbone')

require('jquery-bootstrap')

function getErrorText(el) {
}

module.exports = Backbone.View.extend({
  events: {
    'dragstart .js-error-item': 'handleDragError',
    'click .js-error-item': 'handleClickError',
    'click .js-clear-errors': 'handleClearErrors',
  },
  initialize: function () {
    this.render();
    this.$el
    this.listenTo(this.collection, 'add', this.render);
    this.listenTo(this.collection, 'reset', this.render);
  },
  render: function () {
    var template = require('../templates/errors.html');
    if (!this.collection.length) {
      this.$el.html('');
    } else {
      this.$el.html(template({ errors: this.collection }));
    }
  },
  getErrorText: function (el) {
    var cid = el.dataset.cid
      , errModel = this.collection.get(cid)
      , error = errModel.get('error')
      , ret

    return [
      'Time: ' + errModel.get('time').toLocaleString(),
      'Version: ' + require('../../package.json').version,
      'Page: ' + window.location.hash,
      '=========',
      error.stack || error
    ].join('\n')
  },
  handleDragError: function (e) {
    var dt = e.originalEvent.dataTransfer
      , text = this.getErrorText(e.currentTarget)

    dt.clearData('text/uri-list');
    dt.setData('text/plain', text);
    dt.setData('text/html', text);
  },
  handleClickError: function (e) {
    var text = this.getErrorText(e.currentTarget);
    prompt('Copy text to clipboard and report issue.', text);
  },
  handleClearErrors: function () {
    this.collection.reset([]);
  }
});

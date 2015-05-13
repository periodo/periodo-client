"use strict";

var Backbone = require('../../backbone')
  , Immutable = require('immutable')
  , Spinner = require('spin.js')

module.exports = Backbone.View.extend({
  events: {
    'input textarea': 'handleSourceTextChange',
    'click #js-reject-source': 'handleRejectSource',
  },
  className: 'row',
  id: 'ld-source',
  initialize: function (opts) {
    this.state = null;
    this.render();
  },
  render: function () {
    var template = require('./templates/ld_source_form.html');
    this.$el.html(template());
    this.$srcMsg = this.$('#message-text');
    this.spinner = new Spinner({
      lines: 11,
      length: 0,
      width: 2,
      radius: 4,
      left: '-10px',
      top: '50%'
    });
    this.$spinner = this.$('#source-loading');
  },
  getData: function () {
    return this.state;
  },
  handleSourceTextChange: function (e) {
    var fetchLD = require('../../utils/source_ld_fetch')
      , text = e.currentTarget.value
      , url = fetchLD.match(text)

    if (!text) {
      this.$srcMsg.text('');
      return;
    }

    if (!url) {
      this.$srcMsg.html('<strong>Could not detect source</strong>');
      return
    }

    this.$srcMsg.text('Fetching source information...');
    this.$spinner.append(this.spinner.spin().el);

    fetchLD.fetch(url)
      .then(data => {
        this.spinner.stop();
        this.$srcMsg.text('');
        this.state = Immutable.fromJS(data);
        this.handleSourceSelection(data);
      })
  },
  handleSourceSelection: function (data) {
    var template = require('../../templates/source.html');
    this.$('#source-information').html(template({ source: data }));
    this.$('#source-accept-dialog').removeClass('hide');
    this.$('#source-select').addClass('hide');
  },
  handleRejectSource: function () {
    this.$('textarea').val('');
    this.$('#source-information').html('');
    this.$('#source-accept-dialog').addClass('hide');
    this.$('#source-select').removeClass('hide');
    //this.model.clear();
  }
});

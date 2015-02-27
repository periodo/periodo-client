"use strict";

var Backbone = require('../backbone')
  , Source = require('../models/source')
  , Spinner = require('spin.js')

var URL_PATTERNS = [
  {
    pattern: /worldcat.org\/.*?oclc\/(\d+).*/i,
    replaceFn: function (match, oclcID) { return 'http://www.worldcat.org/oclc/' + oclcID }
  },
  {
    pattern: /(?:dx.doi.org\/|doi:)([^\/]+\/[^\/\s]+)/i,
    replaceFn: function (match, doi) { return 'http://dx.doi.org/' + doi }
  }
]

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  className: 'row',
  id: 'ld-source',
  events: {
    'input textarea': 'handleSourceTextChange',
    'click #js-accept-source': 'handleAcceptSource',
    'click #js-reject-source': 'handleRejectSource'
  },
  render: function () {
    var template = require('../templates/ld_source_form.html');
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
  handleSourceTextChange: function (e) {
    var that = this
      , text = e.currentTarget.value
      , match
      , url
      , source

    if (!text) {
      this.$srcMsg.text('');
      return;
    }

    for (var i = 0; i < URL_PATTERNS.length; i++) {
      match = text.match(URL_PATTERNS[i].pattern);
      if (match) {
        url = match[0].replace(URL_PATTERNS[i].pattern, URL_PATTERNS[i].replaceFn);
        break;
      }
    }

    if (!url) {
      this.$srcMsg.html('<strong>Could not detect source</strong>');
    } else {
      source = Source.findOrCreate({ 'id': url });
      this.$srcMsg.text('Fetching source information...');
      this.$spinner.append(this.spinner.spin().el);
      source.fetchLD().then(function () {
        that.spinner.stop();
        that.$srcMsg.text('');
        that.handleSourceSelection.call(that, source);
      });
    }
  },
  handleSourceSelection: function (source) {
    var template = require('../templates/source.html');
    this.$('#source-information').html(template({ source: source.toJSON() }));
    this.$('#source-accept-dialog').removeClass('hide');
    this.$('#non-ld-source-toggle').addClass('hide');
    this.model = source;
  },
  handleAcceptSource: function (e) {
    this.trigger('sourceSelected', this.model);
  },
  handleRejectSource: function (e) {
    this.$('textarea').val('');
    this.$('#source-information').html('');
    this.$('#source-accept-dialog').addClass('hide');
    this.$('#non-ld-source-toggle').removeClass('hide');
    this.model = null;
  }
});

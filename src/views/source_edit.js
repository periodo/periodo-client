"use strict";

var Backbone = require('../backbone')
  , Source = require('../models/source')

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
  events: {
    'input textarea': 'handleSourceTextChange'
  },
  render: function () {
    var template = require('../templates/source_form.html');
    this.$el.html(template());
    this.$srcMsg = this.$('.message');
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
      this.$srcMsg.text('Could not detect source');
    } else {
      source = Source.findOrCreate({ 'id': url });
      this.$srcMsg.text('Fetching source information...');
      source.fetchLD().then(function () {
        that.$srcMsg.text('');
        that.trigger('sourceSelected', source);
      });
    }
  }
});

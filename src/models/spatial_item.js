"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.Model.extend({
  validation: {
    '@id': {
      required: true,
      pattern: 'url'
    },
    'label': {
      required: true
    }
  }
});

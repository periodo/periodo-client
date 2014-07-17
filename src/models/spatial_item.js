"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  validation: {
    '@id': {
      required: true,
      pattern: 'url'
    },
    'label': {
      required: true
    }
  },
  idAttribute: '@id'
});

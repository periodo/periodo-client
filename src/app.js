"use strict";

var $ = require('jquery')
  , Source = require('./models/source')

$(document).ready(function () {
  var SourceEditView = require('./views/source');

  // Test item
  var view = new SourceEditView({ model: new Source({
    '@id': 'http://www.worldcat.org/oclc/26257582'
  })});

  view.$el.appendTo('#main')
});

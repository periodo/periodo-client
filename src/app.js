"use strict";

var $ = require('jquery')
  , Period = require('./models/period')

$(document).ready(function () {
  var PeriodEditView = require('./views/period');

  var view = new PeriodEditView({ model: new Period() });

  view.$el
    .appendTo('#main')
    .css('width', '500px')

});

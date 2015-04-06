"use strict";

var Backbone = require('backbone')
  , classifyDiff = require('../utils/patch').classifyDiff

module.exports = Backbone.Model.extend({
  classify: function () { return classifyDiff(this.get('path')) }
});

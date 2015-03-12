"use strict";

var $ = require('jquery')
  , Backbone = require('../../backbone');

require('jquery-bootstrap');

module.exports = Backbone.View.extend({
  className: 'modal',
  events: {
    'click .select-countries': 'handleSelect'
  },
  initialize: function (options) {
    var that = this;

    this.suggestion = options.suggestion;
    this.suggestion.uses.sort(function (a, b) { return a.count > b.count ? -1 : 1 });
    this.render();
    this.$el.appendTo('body').modal();

    this.$el.on('hidden.bs.modal', function () { that.remove() });
  },
  render: function () {
    var template = require('./templates/select_coverage_modal.html');
    this.$el.html(template({ suggestion: this.suggestion }));
  },
  handleSelect: function (e) {
    var data = JSON.parse(e.currentTarget.dataset.countries);
    this.selectedCountries = data;
    this.$el.modal('hide');
  }
});

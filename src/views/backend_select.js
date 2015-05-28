"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  events: {
    'change select': 'handleSelectChange',
    'click #js-add-backend': 'handleAdd',
    'click .js-remove-backend': 'handleRemove',
    'input': 'validateForm'
  },
  initialize: function (opts) {
    var backends

    opts = opts || {};
    backends = opts.backends;

    if (!backends) {
      throw new Error('Must pass object with backends to select view.');
    }

    this.existingBackends = backends;
    this.render({ backends });
  },
  render: function (opts) {
    var template = require('../templates/backend_select.html');
    this.$el.html(template(opts));
    this.handleSelectChange();
  },
  handleSelectChange: function () {
    var selectedBackendType = this.$('select').val()
      , showId = '#js-' + selectedBackendType + '-form-controls'

    this.$('.backend-form-controls').hide();
    this.$('input').val('');
    this.$(showId).show();
  },
  handleAdd: function () {
    var { addBackend } = require('./backends')
      , type = this.$('#js-backend-type').val()
      , form = this.$('#js-' + type + '-form-controls')
      , opts = { type }

    opts.name = form.find('#js-' + type + '-name').val();
    if (type === 'web') {
      opts.url = form.find('#js-web-source').val()
    }

    addBackend(opts).then(window.location.reload);
  },
  handleRemove: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },
  validateForm: function () {
    var form = $('.backend-form-controls:visible')
      , emptyInputs = form.find('input').filter(function (i, el) { return !el.value })
      , valid = false
      , reservedNames

    if (!emptyInputs.length) valid = true;

    reservedNames = _.pluck(this.existingBackends, 'name');
    if (reservedNames.indexOf(this.$('.name-input').val()) !== -1) {
      valid = false;
    }

    if (valid) {
      this.$('button').prop('disabled', null);
    } else {
      this.$('button').prop('disabled', 'disabled');
    }
  }
});

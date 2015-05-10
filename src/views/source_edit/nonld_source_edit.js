"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  events: {
    'click #js-cancel': 'handleCancel',
    'click .js-name-add': 'handleAddName',
    'click .js-name-remove': 'handleRemoveName'
  },
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('./templates/non_ld_source_form.html');
    this.$el.html(template({ data: this.model ? this.model.toJS() : {} }));
  },
  getData: function () {
    var data = {};

    ['citation', 'title', 'url', 'yearPublished'].forEach(field => {
      var el = this.el.querySelector(`[data-field="${field}"]`);
      if (el.value) data[field] = el.value;
    });

    ['creators', 'contributors'].forEach(field => {
      var names = this.$(`[data-field="${field}"] input`)
        .toArray()
        .map(el => ({ name: el.value }))
        .filter(person => person.name)

      if (names.length) data[field] = names;
    });

    return data;
  },
  handleAddName: function (e) {
    var $name = this.$(e.currentTarget).closest('.source-person');
    if ($name.find('input').val().length) {
      $name.clone().insertAfter($name).find('input').val('');
    }
  },
  handleRemoveName: function (e) {
    var $name = this.$(e.currentTarget).closest('.source-person');
    if ($name.siblings('.source-person').length) {
      $name.remove();
    } else {
      $name.find('input').val('');
    }
  },
  renderValidationErrors: function (errors) {
    errors.forEach(function (error) {
      var $container = null
        , msg = '<div class="error-message alert alert-danger">' + error.message + '</div>';

      if (error.field) $container = this.$('[data-field="' + error.field + '"]');

      if ($container && $container.length) {
        $container.find('label').after(msg);
      } else {
        this.$('form').prepend(msg);
      }
    }, this);
  },
  /*
  handleSave: function (e) {
    var that = this;
    e.preventDefault();
    this.$('.error-message').hide();
    if (this.model.isValid()) {
      this.trigger('sourceSelected', this.model);
    } else {
      this.renderValidationErrors(this.model.validationError);
    }
  },
  */
  handleCancel: function (e) {
    e.preventDefault();
  }
});

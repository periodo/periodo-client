"use strict";

var _ = require('underscore')
  , Immutable = require('immutable')

module.exports = {
  validate: function () {
    var data
      , errors

    if (!this.validator) {
      throw new Error('Must define `validator` function to use validate mixin.');
    }

    data = Immutable.fromJS(this.getData())
    errors = this.validator(data)

    this.$('.error-message').remove();
    if (errors) {
      _.forEach(errors, (messages, label) => this.renderValidationErrors(label, messages));
      return [errors, null];
    } else {
      return [null, data];
    }
  },
  renderValidationErrors: function (label, messages) {
    var $container = this.$('[data-error-container=' + label + ']')
      , html
      , $label

    html = '<div class="error-message alert alert-danger"><ul class="list-unstyled">'
    html += messages.map(function (message) { return '<li>' + message + '</li>' });
    html += '</ul></li>'

    if (!$container.length) {
      this.$el.prepend(html);
    } else {
      $label = $container.find('label').first();
      if ($label.length) {
        $label.after(html);
      } else {
        $container.prepend(html);
      }
    }
  }
}

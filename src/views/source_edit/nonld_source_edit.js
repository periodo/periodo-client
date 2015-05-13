"use strict";

var Backbone = require('backbone')
  , Immutable = require('immutable')

module.exports = Backbone.View.extend({
  events: {
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

    return Immutable.fromJS(data);
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
});

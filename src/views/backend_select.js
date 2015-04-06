var $ = require('jquery')
  , _ = require('underscore')
  , Backbone = require('../backbone')
  , getBackends = require('../backends')

module.exports = Backbone.View.extend({
  events: {
    'change select': 'handleSelect',
    'click #js-add-backend': 'handleAdd',
    'click .js-remove-backend': 'handleRemove',
    'input': 'validateForm'
  },
  initialize: function () {
    var that = this;
    this.render();
    this.handleSelect();
  },
  render: function () {
    var template = require('../templates/backend_select.html');
    this.$el.html(template({ backends: getBackends() }));
  },
  handleSelect: function () {
    var selected = this.$('select').val()
      , showId = '#js-' + selected + '-form-controls'

    this.$('.backend-form-controls').hide();
    this.$('input').val('');
    this.$(showId).show();
  },
  handleAdd: function () {
    var type = this.$('#js-backend-type').val()
      , form = this.$('#js-' + type + '-form-controls')
      , name
      , url
      , webBackends
    
    if (type === 'idb') {
      var db = require('../db');
      name = form.find('#js-idb-name').val();
      db(name).on('ready', function () { window.location.reload() });
    } else if (type === 'web') {
      name = form.find('#js-web-name').val();
      url = form.find('#js-web-source').val();

      webBackends = JSON.parse(localStorage.WebDatabaseNames || '{}');

      webBackends[name] = {
        type: 'web',
        name: name,
        editable: false,
        url: url
      }

      localStorage.WebDatabaseNames = JSON.stringify(webBackends);
      window.location.reload();
    }
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

    reservedNames = _.pluck(getBackends(), 'name');
    reservedNames.push('web');

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

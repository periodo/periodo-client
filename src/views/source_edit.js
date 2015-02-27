"use strict";

var Backbone = require('../backbone')
  , Source = require('../models/source')
  , NameView

NameView = Backbone.View.extend({
  bindings: {
    'input': 'name'
  },
  events: {
    'click .js-name-add': 'handleNameAdd',
    'click .js-name-remove': 'handleNameRemove'
  },
  initialize: function () {
    this.render();
    this.stickit();
  },
  render: function () {
    var template = require('../templates/source_name_form.html');
    this.$el.html(template());
  },
  handleNameAdd: function (e) {
    e.preventDefault();
    if (this.model.get('name')) {
      this.model.collection.add({ name: null });
    }
  },
  handleNameRemove: function (e) {
    e.preventDefault();
    this.unstickit();
    this.remove();
    this.model.collection.remove(this.model);
  }
});

module.exports = Backbone.View.extend({
  events: {
    'click #js-save': 'handleSave',
    'click #js-cancel': 'handleCancel'
  },
  bindings: {
    '#source-citation': 'citation',
    '#source-url': 'url',
    '#source-year-published': 'yearPublished'
  },
  initialize: function () {
    this.model = new Source({
      citation: null,
      url: null,
      datePublished: null,
      creators: [{ name: null }],
      contributors: [{ name: null }]
    });

    this.render();
    this.stickit();

    this.listenTo(this.model.get('creators'), 'add', this.addName.bind(this, 'creators'));
    this.listenTo(this.model.get('creators'), 'remove', this.removeName.bind(this, 'creators'));
    this.addName('creators', this.model.get('creators').at(0));

    this.listenTo(this.model.get('contributors'), 'add', this.addName.bind(this, 'contributors'));
    this.listenTo(this.model.get('contributors'), 'remove', this.removeName.bind(this, 'contributors'));
    this.addName('contributors', this.model.get('contributors').at(0));
  },
  render: function () {
    var template = require('../templates/source_form.html');
    this.$el.html(template());
  },
  addName: function (type, model) {
    var $container = this.$('.form-group[data-type="' + type + '"] .names')
      , nameView = new NameView({ model: model })

    $container.append(nameView.$el);
    nameView.$('input').focus();

  },
  removeName: function (type, model) {
    var $container = this.$('.form-group[data-type="' + type + '"] .names');
    if (!$container.find('.input-group').length) {
      this.model.get(type).add({ name: null });
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
  handleCancel: function (e) {
    e.preventDefault();
  }
});

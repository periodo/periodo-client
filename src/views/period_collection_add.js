"use strict";

var Backbone = require('../backbone')
  , SourceEditView = require('./source_edit')
  , Periodization = require('../models/period_collection')

module.exports = Backbone.View.extend({
  events: {
    'click #js-save': 'handleSave',
    'click #js-delete-periodCollection': 'handleDelete',
    'click .change-ld-source': function () {
      this.model.source().clear();
      this.initSourceEdit();
    }
  },
  bindings: {
    '#js-editorial-note': 'editorialNote',
  },
  initialize: function () {
    var sourceTemplate;

    if (!this.model) {
      this.model = new Periodization();
    } else {
      this.originalJSON = this.model.toJSON();
    }

    this.render();
    this.stickit();

    if (this.model && this.model.source() && this.model.source().isLinkedData()) {
      sourceTemplate = require('../templates/source.html');
      this.$('#js-edit-source-container').html(
        '<p>Source attributes currently generated from linked data.</p>' +
        sourceTemplate({ source: this.model.source().toJSON() }) +
        '<a class="btn btn-warning change-ld-source">Change source</a>'
      );
    } else {
      this.initSourceEdit();
    }
  },
  initSourceEdit: function () {
    this.sourceEditView = new SourceEditView({
      el: this.$('#js-edit-source-container'),
      model: this.model.source()
    });
  },
  render: function () {
    var template = require('../templates/period_collection_add.html')
      , action = (this.model && !(this.model.isNew())) ? 'Edit': 'Add'

    this.$el.html(template({ action: action, periodCollection: this.model }));
  },
  handleSave: function () {
    var that = this;

    if (this.model.isValid()) {
      var source = this.model.source();
      var message = (source.isNew() ? 'Created ' : 'Edited ') +
        'period collection based on ' + (source.get('title') || source.get('citation'));

      this.model.save(null, { message: message }).then(function (savedObj) {
        that.saved = true;
        var encodedURI = encodeURIComponent(savedObj.id);
        Backbone.history.navigate('periodCollections/' + encodedURI + '/', { trigger: true });
      }).catch(function (err) {
        console.error(err.stack || err);
      });
    } else {
      this.renderValidationErrors(this.model.validationError);
    }
  },
  handleDelete: function () {
    var that = this;
    var confirmed = window.confirm('Really delete this period collection?');
    var source = this.model.source();
    var message = 'Deleted period collection based on ' +
      (source.get('title') || source.get('citation'));

    if (confirmed) {
      this.model.destroy({ message: message }).then(function () {
        that.saved = true;
        Backbone.history.navigate('/', { trigger: true });
      }).catch(function (err) {
        console.error(err.stack || err);
      });
    }
  },
  renderValidationErrors: function (errors) {
    this.$('.error-message').remove();
    errors.forEach(function (error) {
      var $container = null
        , msg = '<div class="error-message alert alert-danger">' + error.message + '</div>';

      if (error.field) $container = this.$('[data-field="' + error.field + '"]');

      if ($container && $container.length && $container.is(':visible')) {
        $container.prepend(msg);
      } else {
        this.$('.misc-error-container').prepend(msg);
      }
    }, this);
  },
  remove: function () {
    this.unstickit();
    if (this.sourceEditView) this.sourceEditView.remove();
    if (!this.saved && !this.model.isNew()) {
      this.model.clear();
      var toset = this.model.parse(this.originalJSON);
      this.model.set(toset);
    }
    Backbone.View.prototype.remove.call(this);
  }
});

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
  initialize: function (opts) {
    var sourceTemplate

    opts = opts || {};
    this.backend = opts.backend || require('../backends').current()

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

    this.$el.html(template({
      action: action,
      periodCollection: this.model,
      backend: this.backend
    }));
  },
  handleSave: function () {
    if (this.model.isValid()) {
      let source = this.model.source()
        , action = source.isNew() ? 'Created' : 'Edited'
        , sourceDescription = source.get('title') || source.get('citation')
        , message = `${action} period collection based on ${sourceDescription}`

      this.model.save(null, { message: message })
        .then(savedObj => {
          var encodedID = encodeURIComponent(savedObj.id)
            , redirect = this.backend.path + 'periodCollections/' + encodedID

          this.saved = true;
          Backbone.history.navigate(redirect, { trigger: true });
        })
        .catch(function (err) {
          console.error(err.stack || err);
        });
    } else {
      this.renderValidationErrors(this.model.validationError);
    }
  },
  handleDelete: function () {
    var confirmed = window.confirm('Really delete this period collection?')
      , source = this.model.source()
      , sourceDescription = source.get('title') || source.get('citation')
      , message = `Deleted period collection based on ${sourceDescription}`

    if (confirmed) {
      this.model.destroy({ message })
        .then(() => {
          this.saved = true;
          Backbone.history.navigate(this.backend.path, { trigger: true });
        })
        .catch(function (err) {
          console.error(err.stack || err);
        })
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

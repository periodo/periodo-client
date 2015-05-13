"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Immutable = require('immutable')
  , Cursor = require('immutable/contrib/cursor')
  , SourceEditView = require('./source_edit')
  , PeriodCollectionEditView

PeriodCollectionEditView = Backbone.View.extend({
  events: {
    'click #js-save': 'handleSave',
    'click #js-delete-periodCollection': 'handleDelete',
  },
  initialize: function (opts) {
    this.backend = opts.backend;
    this.state = opts.state;
    this.action = this.state.cursor.deref() === undefined ? 'Add' : 'Edit';

    this.render();

    this.sourceEditView = new SourceEditView({
      el: this.$('#js-edit-source-container'),
      cursor: Cursor.from(this.state.cursor, ['source'])
    });
  },
  render: function () {
    var template = require('../templates/period_collection_add.html');
    this.$el.html(template({
      action: this.action,
      periodCollection: this.state.cursor.toJS(),
      backend: this.backend
    }));
  },
  getData: function () {
    var definitions = this.state.cursor.get('definitions', Immutable.Map())
      , editorialNote = this.$('#js-editorial-note').val().trim()
      , source = this.sourceEditView.getData()

    return Immutable.Map()
      .set('type', 'PeriodCollection')
      .set('definitions', definitions)
      .update('editorialNote', () => editorialNote || undefined)
      .update('source', () => (source && source.size) ? source : undefined)
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
  remove: function () {
    if (this.sourceEditView) this.sourceEditView.remove();
    Backbone.View.prototype.remove.call(this);
  },
  validator: require('../helpers/periodization').validate
});

_.defaults(PeriodCollectionEditView.prototype, require('./mixins/validate'));

module.exports = PeriodCollectionEditView;

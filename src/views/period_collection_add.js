"use strict";

var Backbone = require('../backbone')
  , LDSourceSelectView = require('./ld_source_edit')
  , SourceSelectView = require('./source_edit')
  , Periodization = require('../models/period_collection')

module.exports = Backbone.View.extend({
  events: {
    'click .toggle-form-type': 'toggleView'
  },
  initialize: function () {
    var ldSourceSelectionView
      , sourceSelectionView

    this.render();

    this.ldSourceSelectionView = new LDSourceSelectView({ el: this.$('#ld-source-select') });
    this.listenTo(this.ldSourceSelectionView, 'sourceSelected', this.handleSourceSelection);

    this.sourceSelectionView = new SourceSelectView({ el: this.$('#no-ld-source-select') });
    this.listenTo(this.sourceSelectionView, 'sourceSelected', this.handleSourceSelection);
  },
  render: function () {
    var template = require('../templates/period_collection_add.html');
    this.$el.html(template());
  },
  handleSourceSelection: function (source) {
    var periodCollection = new Periodization({ source: source });
    var options = { message: 'Created period collection based on ' + source.get('title') };
    periodCollection.save(null, options).then(function () {
      var encodedURI = encodeURIComponent(periodCollection.id);
      Backbone.history.navigate('periodCollections/' + encodedURI + '/', { trigger: true });
    });
  },
  /*
  handleAcceptSource: function () {
    var periodCollection = new Periodization({ source: this.model });
    var options = { message: 'Created period collection based on ' + this.model.get('title') };
    periodCollection.save(null, options).then(function () {
      var encodedURI = encodeURIComponent(periodCollection.id);
      Backbone.history.navigate('periodCollections/' + encodedURI + '/', { trigger: true });
    });
  },
  handleRejectSource: function () {
    this.$('textarea').val('');
    this.$('#source-information').html('');
    this.$('#source-confirm').addClass('hide');
    this.model = null;
  },
  */
  toggleView: function () {
    this.ldSourceSelectionView.$el.toggleClass('hide');
    this.sourceSelectionView.$el.toggleClass('hide');
  }
});

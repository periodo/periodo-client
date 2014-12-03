"use strict";

var Backbone = require('../backbone')
  , SourceSelectView = require('./source_edit')
  , Periodization = require('../models/period_collection')

module.exports = Backbone.View.extend({
  events: {
    'click #js-accept-source': 'handleAcceptSource',
    'click #js-reject-source': 'handleRejectSource'
  },
  initialize: function () {
    var sourceSelectionView;
    this.render();

    sourceSelectionView = new SourceSelectView({el: this.$('#source-select')});
    this.listenTo(sourceSelectionView, 'sourceSelected', this.handleSourceSelection);
  },
  render: function () {
    var template = require('../templates/period_collection_add.html');
    this.$el.html(template());
  },
  handleSourceSelection: function (source) {
    var template = require('../templates/source.html');
    this.$('#source-information').html(template({ source: source.toJSON() }));
    this.$('#source-confirm').removeClass('hide');
    this.model = source;
  },
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
  }
});

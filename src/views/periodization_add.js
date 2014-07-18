"use strict";

var Backbone = require('../backbone')
  , SourceSelectView = require('./source_edit')
  , Periodization = require('../models/periodization')

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
    var template = require('../templates/periodization_add.html');
    this.$el.html(template());
  },
  handleSourceSelection: function (source) {
    var template = require('../templates/source.html');
    this.$('#source-information').html(template({ source: source.toJSON() }));
    this.model = source;
  },
  handleAcceptSource: function () {
    var periodization = new Periodization({ source: this.model });
    periodization.save().then(function () {
      Backbone.history.navigate('periodizations/' + periodization.id + '/', { trigger: true });
    });
  },
  handleRejectSource: function () {
    this.$('textarea').val('');
    this.$('#source-information').html('');
    this.model = null;
  }
});

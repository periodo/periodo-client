"use strict";

var Backbone = require('../backbone')
  , genid = require('../utils/generate_skolem_id')

module.exports = Backbone.View.extend({
  events: {
    'click #js-add-period': 'handleAddPeriod'
  },
  initialize: function () {
    this.render();

    this.$periodAdd = this.$('#period-add');
    this.$periodList = this.$('#period-list');
    this.$addPeriodContainer = this.$('#add-period-container');
  },
  render: function () {
    var template = require('../templates/periodization_show.html')
      , sourceTemplate = require('../templates/source.html')
      , periodListTemplate = require('../templates/period_list.html')
      , json = this.model.toJSON()

    this.$el.html(template());

    this.$periodAdd = this.$('#period-add');
    this.$periodList = this.$('#period-list');
    this.$addPeriodContainer = this.$('#add-period-container');

    this.$('#source-information').html(sourceTemplate({ source: json.source }));
    this.$periodList.html(periodListTemplate({ periods: json.definitions }));
  },
  handleAddPeriod: function () {

    this.$periodList.hide();
    this.$addPeriodContainer.hide();

    var that = this;
    var PeriodEditView = require('./period_edit');
    var period = this.model.get('definitions').add({ start: {}, stop: {} });
    var periodEditView = new PeriodEditView({ model: period });
    periodEditView.$el.appendTo(this.$periodAdd);

    periodEditView.$el.on('click', '#js-save-period', function (e) {
      period.set('id', genid());
      that.model.save().then(function (data) {
        periodEditView.remove();
        that.render();
      });
    });
    periodEditView.$el.on('click', '#js-cancel-period', function (e) {
      e.preventDefault();
      period.destroy();
      periodEditView.remove();
      that.$periodList.show();
      that.$addPeriodContainer.show();
    });
  }
});

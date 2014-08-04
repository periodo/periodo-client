"use strict";

var Backbone = require('../backbone')
  , genid = require('../utils/generate_skolem_id')

module.exports = Backbone.View.extend({
  events: {
    'click #js-add-period': 'handleAddPeriod',
    'click .edit-period': 'handleEditPeriod'
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
  editPeriod: function (period) {
    var that = this
      , prevData = period.toJSON()

    this.$periodList.hide();
    this.$addPeriodContainer.hide();

    var PeriodEditView = require('./period_edit');
    var periodEditView = new PeriodEditView({ model: period });
    periodEditView.$el.appendTo(this.$periodAdd);

    periodEditView.$el.on('click', '#js-save-period', function (e) {
      if (period.isValid()) {
        if (period.isNew()) period.set('id', genid());
        that.model.save(null, { validate: false }).then(function (data) {
          periodEditView.remove();
          that.render();
        });
      }
    });

    periodEditView.$el.on('click', '#js-cancel-period', function (e) {
      e.preventDefault();
      if (period.isNew()) {
        period.destroy();
      } else {
        period.set(prevData);
      }
      periodEditView.remove();
      that.render();
    });

    periodEditView.$el.on('click', '#js-delete-period', function (e) {
      that.model.get('definitions').remove(period);
      that.model.save(null, { validate: false }).then(function () {
        periodEditView.remove();
        that.render();
      });
    });

  },
  handleAddPeriod: function () {
    var period = this.model.get('definitions').add({ start: {}, stop: {} });
    this.editPeriod(period);
  },
  handleEditPeriod: function (e) {
    var periodID = this.$(e.currentTarget).closest('tr').data('period-id')
      , period = this.model.get('definitions').get(periodID)

    this.editPeriod(period);
  }
});

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
  },
  render: function () {
    var template = require('../templates/periodization_show.html');
    this.$el.html(template({ periodization: this.model.toJSON() }));

    this.$periodAdd = this.$('#period-add');
    this.$periodList = this.$('#period-list');
    this.$addPeriodContainer = this.$('#add-period-container');
  },
  editPeriod: function (period, $row) {
    var that = this
      , prevData = period.toJSON()
      , $container

    this.$addPeriodContainer.hide();

    this.$periodList.find('table').addClass('editing').removeClass('table-hover');

    var PeriodEditView = require('./period_edit');
    var periodEditView = new PeriodEditView({ model: period });

    if ($row) {
      $row.hide();
      $container = Backbone.$('<tr>')
        .css('margin', 'auto')
        .hide()
      $container
        .append('<td colspan=6></td>').find('td')
        .append(periodEditView.$el)
      $container
        .insertBefore($row)
        .show(500)
    } else {
      periodEditView.$el.appendTo($container || this.$periodAdd);
    }

    periodEditView.$el.on('click', '#js-save-period', function () {
      var message;
      if (period.isValid()) {
        if (period.isNew()) {
          message = 'Created period ' + period.get('label');
          period.set('id', genid());
        } else {
          message = 'Edited period ' + period.get('label');
        }
        that.model.save(null, { validate: false, message: message }).then(function () {
          periodEditView.remove();
          that.render();
        });
      }
    });

    periodEditView.$el.on('click', '#js-cancel-period', function () {
      if (period.isNew()) {
        period.destroy();
      } else {
        period.set(prevData);
      }
      periodEditView.remove();
      that.render();
    });

    periodEditView.$el.on('click', '#js-delete-period', function () {
      var message = 'Deleted period ' + period.get('label');
      that.model.get('definitions').remove(period);
      that.model.save(null, { validate: false, message: message }).then(function () {
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
    var $row = this.$(e.currentTarget).closest('tr')
      , periodID = $row.data('period-id')
      , period = this.model.get('definitions').get(periodID)

    this.editPeriod(period, $row);
  }
});

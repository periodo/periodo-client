"use strict";

var Backbone = require('../backbone')
  , genid = require('../utils/generate_skolem_id')
  , stringify = require('json-stable-stringify')

module.exports = Backbone.View.extend({
  events: {
    'click #js-add-period': 'handleAddPeriod',
    'click .edit-period': 'handleEditPeriod',
    'click #period-list-options .nav-pills a': 'handleChangeFormat',
    'click .download-file': 'handleSaveAs'
  },
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/period_collection_show.html');
    this.$el.html(template({
      editable: Backbone._app.currentBackend.editable,
      periodCollection: this.model.toJSON()
    }));

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
        .append('<td colspan=7></td>').find('td')
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
      that.model.definitions().remove(period);
      that.model.save(null, { validate: false, message: message }).then(function () {
        periodEditView.remove();
        that.render();
      });
    });

  },
  handleSaveAs: function (e) {
    var saveAs = require('filesaver.js')
      , filetype = e.currentTarget.dataset.filetype
      , filename = encodeURIComponent(this.model.id) + '.' + filetype

    e.preventDefault();
    e.stopPropagation();

    if (filetype === 'csv') {
      this.model.asCSV().then(function (data) {
        var blob = new Blob([data], { type: 'text/csv' });
        saveAs(blob, filename);
      });
    }

  },
  handleAddPeriod: function () {
    var period = this.model.definitions().add({ start: {}, stop: {} });
    this.editPeriod(period);
  },
  handleEditPeriod: function (e) {
    var $row = this.$(e.currentTarget).closest('tr')
      , periodID = $row.data('period-id')
      , period = this.model.definitions().get(periodID)

    this.editPeriod(period, $row);
  },
  handleChangeFormat: function (e) {
    var that = this
      , $target
      , format

    e.preventDefault();
    e.stopPropagation();

    $target = Backbone.$(e.currentTarget);
    format = $target.data('type');

    $target.closest('li').addClass('active').siblings().removeClass('active');

    if (format === 'list') {
      var template = require('../templates/period_list.html');
      this.$periodList.html(template({
        periods: that.model.toJSON().definitions,
        editable: Backbone._app.currentBackend.editable
      }));
    } else if (format === 'ttl') {
      var $pre = Backbone.$('<pre>');
      this.model.asTurtle().then(function (result) {
        $pre.text(result);
        that.$periodList.html('').append($pre);
      });
    } else if (format === 'jsonld') {
      var $pre = Backbone.$('<pre>').text(stringify(this.model.asJSONLD(), { space: '  ' }));
      that.$periodList.html('').append($pre);
    } else if (format === 'viz') {
      var View = require('./period_collection_viz')
        , view = new View({ model: this.model, el: this.$periodList })
    }
  }
});

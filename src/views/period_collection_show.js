"use strict";

var Backbone = require('../backbone')
  , Cursor = require('immutable/contrib/cursor')
  , genid = require('../utils/generate_skolem_id')
  , stringify = require('json-stable-stringify')

module.exports = Backbone.View.extend({
  events: {
    'click #js-add-period': 'handleAddPeriod',
    'click .edit-period': 'handleEditPeriod',
    'click #period-list-options .nav-pills a': 'handleChangeFormat',
    'click .download-file': 'handleSaveAs'
  },
  initialize: function (opts) {
    this.state = opts.state;
    this.backend = opts.backend || require('../backends').current()
    this.render();
  },
  render: function () {
    var template = require('../templates/period_collection_show.html');

    this.$el.html(template({
      backend: this.backend,
      periodCollection: this.state.cursor.toJSON()
    }));

    this.$periodAdd = this.$('#period-add');
    this.$periodList = this.$('#period-list');
    this.$addPeriodContainer = this.$('#add-period-container');
  },
  handlePeriodChange: function (view, newData, oldData, path) {
    var edited = newData.getIn(path)
      , id = path.slice(-1)[0]
      , promise

    if (edited && edited.size === 0) {
      newData = newData.deleteIn(path);
    } else if (!newData.getIn(path.concat('id'))) {
      newData = newData.updateIn(path.concat('id'), id);
    }

    if (!newData.is(oldData)) {
      this.state.cursor = this.state.cursor.setIn(path, newData);
      promise = this.saveData().then(null, () => {
        this.state.cursor = this.state.cursor.setIn(path, oldData);
      });
    } else {
      promise = Promise.resolve(null);
    }

    promise
      .then(() => {
        this.periodEditView.remove();
        this.render();
      })
      .catch(require('../app').handleError)
  },
  saveData: function () {
    return this.backend.saveStore(this.state.data);
  },
  editPeriod: function (id, $row) {
    var PeriodEditView = require('./period_edit')
      , cursor = Cursor.from(this.state.cursor, [id], this.handlePeriodChange)
      , editView = new PeriodEditView({ cursor, store: this.store })
      , $container

    this.periodEditView = editView;
    this.$addPeriodContainer.hide();
    this.$periodList.find('table').addClass('editing').removeClass('table-hover');

    if ($row) {
      $row.hide();
      $container = Backbone.$('<tr>')
        .css('margin', 'auto')
        .hide()
      $container
        .append('<td colspan=7></td>').find('td')
        .append(editView.$el)
      $container
        .insertBefore($row)
        .show(500)
    } else {
      editView.$el.appendTo(this.$periodAdd);
    }
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
    } else if (filetype === 'ttl') {
      this.model.asTurtle().then(data => {
        var blob = new Blob([data], { type: 'text/turtle' });
        saveAs(blob, filename);
      });
    } else if (filetype === 'jsonld') {
      var stringify = require('json-stable-stringify');
      var json = stringify(this.model.asJSONLD(), { space: '  ' });
      var blob = new Blob([json], { type: 'application/json+ld' });
      saveAs(blob, filename);
    }

  },
  handleAddPeriod: function () {
    this.editPeriod(genid());
  },
  handleEditPeriod: function (e) {
    var $row = this.$(e.currentTarget).closest('tr')
      , periodID = $row.data('period-id')

    this.editPeriod(periodID, $row);
  },
  handleChangeFormat: function (e) {
    var $target
      , format

    e.preventDefault();
    e.stopPropagation();

    $target = Backbone.$(e.currentTarget);
    format = $target.data('type');

    $target.closest('li').addClass('active').siblings().removeClass('active');

    if (format === 'list') {
      var template = require('../templates/period_list.html');
      this.$periodList.html(template({
        periods: this.model.toJSON().definitions,
        editable: this._editable
      }));
    } else if (format === 'ttl') {
      var $pre = Backbone.$('<pre>');
      this.model.asTurtle().then(result => {
        $pre.text(result);
        this.$periodList.html('').append($pre);
      });
    } else if (format === 'jsonld') {
      var $pre = Backbone.$('<pre>').text(stringify(this.model.asJSONLD(), { space: '  ' }));
      this.$periodList.html('').append($pre);
    } else if (format === 'viz') {
      var View = require('./period_collection_viz')
        , view = new View({ model: this.model, el: this.$periodList })
    }
  }
});

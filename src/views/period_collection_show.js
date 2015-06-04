"use strict";

var Backbone = require('../backbone')
  , Immutable = require('immutable')
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
    this.backend = opts.backend;
    this.render();

    var RangeSelectionWidget = require('./widgets/range_selection')

      /*
    try {
      this.rangeSelector = new RangeSelectionWidget({
        data: this.state.cursor.get('definitions'),
        el: this.$('#period-collection-range')[0]
      });
    } catch(e) { }
    */

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
  handlePeriodChange: function (newData, oldData, path) {
    var edited = newData.getIn(path)
      , id = path.slice(-1)[0]
      , promise

    if (edited && edited.size === 0) {
      newData = newData.deleteIn(path);
    } else if (!newData.getIn(path.concat('id'))) {
      newData = newData.setIn(path.concat('id'), id);
    }

    if (!newData.equals(oldData)) {
      this.state.cursor = this.state.cursor.update(() => newData);
      promise = this.saveData().then(null, () => {
        this.state.cursor = this.state.cursor.setIn(() => oldData);
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
      , { getSpatialCoverages } = require('../helpers/periodization_collection')
      , cursor
      , spatialCoverages
      , editView
      , $container

    cursor = Cursor.from(
      this.state.cursor,
      ['definitions', id],
      this.handlePeriodChange.bind(this));

    spatialCoverages = getSpatialCoverages(
      this.state.data.getIn(['periodCollections'], Immutable.Map())
    )

    editView = this.periodEditView = new PeriodEditView({ cursor, spatialCoverages });

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
      , stringify = require('json-stable-stringify')
      , { asCSV, asJSONLD, asTurtle } = require('../helpers/periodization')
      , filetype = e.currentTarget.dataset.filetype
      , filename = encodeURIComponent(this.state.cursor.get('id')) + '.' + filetype

    e.preventDefault();
    e.stopPropagation();

    if (filetype === 'csv') {
      asCSV(this.state.cursor)
        .then(data => new Blob([data], { type: 'text/csv' }))
        .then(blob => saveAs(blob, filename));
    } else if (filetype === 'ttl') {
      asTurtle(this.state.cursor)
        .then(data => new Blob([data], { type: 'text/turtle' }))
        .then(blob => saveAs(blob, filename));
    } else if (filetype === 'jsonld') {
      Promise.resolve(asJSONLD(this.state.cursor))
        .then(obj => stringify(obj, { space: '  ' }))
        .then(data => new Blob([data], { type: 'application/json+ld' }))
        .then(blob => saveAs(blob, filename))
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
        periods: this.state.cursor.get('definitions').toJS(),
        editable: this.backend.editable
      }));
    } else if (format === 'ttl') {
      let { asTurtle } = require('../helpers/periodization');
      asTurtle(this.state.cursor)
        .then(ttl => {
          var $pre = Backbone.$('<pre>');
          $pre.text(ttl);
          this.$periodList.html('').append($pre);
        });
    } else if (format === 'jsonld') {
      let { asJSONLD } = require('../helpers/periodization')
        , $pre = Backbone.$('<pre>')

      $pre.text(stringify(asJSONLD(this.state.cursor), { space: '  ' }));
      this.$periodList.html('').append($pre);
    } else if (format === 'viz') {
      var View = require('./period_collection_viz')
        , view = new View({ model: this.state.cursor.toJS(), el: this.$periodList })
    }
  },
  remove: function () {
    if (this.rangeSelector) this.rangeSelector.remove();
    Backbone.View.prototype.remove.call(this);
  }
});

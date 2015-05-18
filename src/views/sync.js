"use strict";

var _ = require('underscore')
  , ajax = require('../ajax')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')
  , PeriodizationCollection = function () { throw new Error() }

module.exports = Backbone.View.extend({
  events: {
    'click #js-fetch-data': 'fetchData',
    'click #js-accept-new-periods': 'handleAcceptPeriodizations',
    'click #js-accept-patches': 'handleAcceptPatches',
    'change .select-all-patches': 'handleSelectAllPatches'
  },
  initialize: function (opts) {
    this.localData = opts.localData;
    this.render();
    this.url = null;
  },
  render: function () {
    var template = require('../templates/sync.html');
    this.$el.html(template());

    this.$acceptDialog = this.$('#js-sync-dialog').hide();
    this.$changesList = this.$('#js-list-changes').hide();
    this.$success = this.$('#js-sync-success').hide();
  },
  fetchData: function () {
    var db = require('../db')
      , backends = require('../backends')
      , url = this.url = this.$('#js-sync-root').val()

    this.$changesList.hide();
    this.$acceptDialog.hide();

    require('../app').trigger('request');

    db(backends.current().name).dumps.orderBy('synced').last()
      .then(function (lastDump) {
        var headers = {};

        //headers['If-Modified-Since'] = lastDump ? lastDump.modified : new Date(0).toGMTString();

        return ajax.ajax({
          url: url + 'd/',
          headers: headers
        }).then(([dump, textStatus, xhr]) => {
          return Promise.resolve(dump);
          var promise
            , data = { lastSync: lastDump ? new Date(lastDump.synced) : null }

          if (xhr.status === 304) {
            data.updated = false;
            data.dump = lastDump;
            return data;
          } else {

            data.dump = {
              modified: xhr.getResponseHeader('Last-Modified'),
              synced: new Date().getTime(),
              data: dump
            }
            return db.updateDumpData(data.dump).then(function () {
              data.updated = true;
              return data;
            });
          }

          return promise;
        })
      })
      .then(this.handleDump.bind(this))
      .finally(() => { require('../app').trigger('requestEnd') });
  },
  handleDump: function (data) {
    var PatchDiffCollection = require('../collections/patch_diff')
      , template = require('../templates/changes_list.html')
      , diffs

    diffs = PatchDiffCollection.fromDatasets({
      local: this.localData.data,
      remote: data,
      to: 'local'
    })

    diffs.filterByHash().then(remoteChanges => {
      var { groupByChangeType } = require('../helpers/patch_collection');
      this.$changesList.show().html(template({
        diffs: groupByChangeType(remoteChanges).toJS()
      }));
    });
  },
  handleAcceptPeriodizations: function () {
    var that = this;
    var options = { message: 'Synced data from ' + this.url }

    require('../app').trigger('request');
    this.collection.sync('put', this.collection, options).then(function () {
      that.$acceptDialog.hide();
      that.$success
        .html('<div class="alert alert-success">Data synced.</div>')
        .show()
    })
    .finally(() => require('../app').trigger('requestEnd'))
  },
  handleSelectAllPatches: function (e) {
    var $checkbox = this.$(e.currentTarget)
      , $toToggle = $checkbox.closest('.patch-collection').find('table input[type="checkbox"]')

    if ($checkbox.is(':checked')) {
      $toToggle.prop('checked', true);
    } else {
      $toToggle.prop('checked', false);
    }
  },
  handleAcceptPatches: function () {
    var $selected = this.$('.toggle-patch-select input:checked')
      , patches
      , newData
      , newCollection

    patches = $selected.toArray().map(el => {
      var cids = el.dataset.patchIds.split(',');
      return this.remoteDiffs
        .filter(patch => cids.indexOf(patch.cid) !== -1)
        .map(patch => patch.toJSON())
    });
    patches = _.flatten(patches);

    newData = JSON.parse(JSON.stringify(this.localData.data));
    patch.apply(newData, patches);
    newCollection = new PeriodizationCollection(newData, { parse: true });

    var that = this;
    var options = { message: 'Synced data from ' + this.url }

    require('../app').trigger('request');
    newCollection.sync('put', newCollection, options).then(function () {
      that.$success
        .html('<div class="alert alert-success">Data synced.</div>')
        .show()
    })
    .finally(() => require('../app').trigger('requestEnd'));
  }
});

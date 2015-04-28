"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')
  , PeriodizationCollection = require('../collections/period_collection')

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
    var url = this.url = this.$('#js-sync-root').val();
    var db = require('../db')(Backbone._app.currentBackend.name);

    this.$changesList.hide();
    this.$acceptDialog.hide();

    Backbone._app.trigger('request');

    db.dumps.orderBy('synced').last()
      .then(function (lastDump) {
        var headers = {};

        //headers['If-Modified-Since'] = lastDump ? lastDump.modified : new Date(0).toGMTString();

        return Backbone.$.ajax({
          url: url + 'd/',
          headers: headers
        }).then(function (dump, textStatus, xhr) {
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
      .finally(() => { Backbone._app.trigger('requestEnd') });
  },
  handleDump: function (data) {
    var PatchDiffCollection = require('../collections/patch_diff')
      , template = require('../templates/changes_list.html')
      , diffs

    diffs = PatchDiffCollection.fromDatasets({
      local: this.localData.data,
      remote: data.dump.data,
      to: 'local'
    })

    diffs.filterByHash().then(remoteChanges => {
      this.remoteDiffs = new PatchDiffCollection(remoteChanges);
      this.$changesList.show().html(template({
        diffs: this.remoteDiffs
      }));
    });
  },
  handleAcceptPeriodizations: function () {
    var that = this;
    var options = { message: 'Synced data from ' + this.url }

    Backbone._app.trigger('request');
    this.collection.sync('put', this.collection, options).then(function () {
      that.$acceptDialog.hide();
      that.$success
        .html('<div class="alert alert-success">Data synced.</div>')
        .show()
    })
    .finally(() => Backbone._app.trigger('requestEnd'))
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

    Backbone._app.trigger('request');
    newCollection.sync('put', newCollection, options).then(function () {
      that.$success
        .html('<div class="alert alert-success">Data synced.</div>')
        .show()
    })
    .finally(() => Backbone._app.trigger('requestEnd'));
  }
});

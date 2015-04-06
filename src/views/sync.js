"use strict";

var Backbone = require('../backbone')
  , PeriodizationCollection = require('../collections/period_collection')
  , Dexie = require('Dexie')
  , Spinner = require('spin.js')

module.exports = Backbone.View.extend({
  events: {
    'click #js-fetch-data': 'fetchData',
    'click #js-accept-new-periods': 'handleAcceptPeriodizations'
  },
  initialize: function (opts) {
    this.localData = opts.localData;
    this.render();
    this.url = null;
  },
  render: function () {
    var template = require('../templates/sync.html');
    this.$el.html(template());

    this.$fetchSpinner = this.$('#js-sync-loading');
    this.$syncSpinner = this.$('#js-sync-saving');
    this.$acceptDialog = this.$('#js-sync-dialog').hide();
    this.$changesList = this.$('#js-list-changes').hide();
    this.$success = this.$('#js-sync-success').hide();

    this.spinner = new Spinner({
      lines: 11,
      length: 3,
      width: 3,
      radius: 6,
      left: '18px',
      top: '50%'
    });
  },
  fetchData: function () {
    var url = this.url = this.$('#js-sync-root').val();
    var db = require('../db')(Backbone._app.currentBackend.name);

    this.$changesList.hide();
    this.$acceptDialog.hide();
    this.$fetchSpinner.append(this.spinner.spin().el);

    db.dumps.orderBy('synced').last()
      .then(function (lastDump) {
        var headers = {};

        headers['If-Modified-Since'] = lastDump ? lastDump.modified : new Date(0).toGMTString();

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
      .finally(this.spinner.stop.bind(this.spinner))
  },
  handleDump: function (data) {
    var PatchDiffCollection = require('../collections/patch_diff')
      , diffs = PatchDiffCollection.fromDatasets(this.localData.data, data.dump.data)
      , template = require('../templates/changes_list.html')

    // Get the difference between the local data and the dump

    //this.collection = diffs;

    // newPeriodizations.sort();

    this.$changesList.show().html(template({ diffs: diffs }));
    //this.$acceptDialog.show();
  },
  handleAcceptPeriodizations: function () {
    var that = this;
    var options = { message: 'Synced data from ' + this.url }

    this.$syncSpinner.append(this.spinner.spin().el);
    this.collection.sync('put', this.collection, options).then(function () {
      that.$acceptDialog.hide();
      that.$success
        .html('<div class="alert alert-success">Data synced.</div>')
        .show()
    })
    .finally(this.spinner.stop.bind(this.spinner));
  }
});

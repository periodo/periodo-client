"use strict";

var Immutable = require('immutable')
  , ajax = require('../ajax')
  , Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  events: {
    'click #js-fetch-data': 'fetchData',
    'click #js-accept-reviewed-patches': 'handleAcceptPatches',
    'change .select-all-patches': 'handleSelectAllPatches'
  },
  initialize: function ({ backend, state }) {
    this.backend = backend;
    this.state = state;

    this.render();

    this.subviews = new Map();
    this.$cache = new Map([
      ['acceptDialog', this.$('#js-sync-dialog').hide()],
      ['changesList', this.$('#js-list-changes').hide()],
      ['success', this.$('#js-sync-success').hide()]
    ]);

    this.url = null;
  },
  render: function () {
    var template = require('../templates/sync.html');
    this.$el.html(template());
  },
  fetchData: function () {
    var db = require('../db')
      , backends = require('../backends')
      , serverURL = this.url = this.$('#js-sync-root').val()

    this.$cache.get('changesList').hide();
    this.$cache.get('acceptDialog').hide();

    require('../app').trigger('request');

    db(backends.current().name).dumps.orderBy('synced').last()
      .then(function (lastDump) {
        var url = require('url')
          , headers = {}

        //headers['If-Modified-Since'] = lastDump ? lastDump.modified : new Date(0).toGMTString();

        return ajax.ajax({
          url: url.resolve(serverURL, 'd/'),
          headers: headers
        }).then(([dump, textStatus, xhr]) => {
          return Promise.resolve(dump);
          /*
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
          */
        })
      })
      .then(this.handleDump.bind(this))
      .finally(() => { require('../app').trigger('requestEnd') });
  },
  initChangeList: function (patches) {
    var ChangeListView = require('./select_patches')
      , changeList

    changeList = new ChangeListView({
      patches,
      fromState: Immutable.fromJS(this.collection.datasets.local),
      toState: Immutable.fromJS(this.collection.datasets.remote),
    });

    this.subviews.set('changeList', changeList);
    this.$cache.get('changesList').show().append(changeList.el);
    changeList.on('selectedPatches', patches => {
      changeList.remove();
      this.$cache.get('changesList').hide();
      this.subviews.delete('changeList');
      this.reviewSelectedPatches(patches);
    });
  },
  handleDump: function (data) {
    var PatchDiffCollection = require('../collections/patch_diff')

    this.collection = PatchDiffCollection.fromDatasets({
      local: this.state.data.toJS(),
      remote: data,
      to: 'local'
    });

    this.collection.filterByHash()
      .then(patches => this.initChangeList(patches));
  },
  reviewSelectedPatches: function (patches) {
    var ReviewPatchesView = require('./patches_review')
      , reviewPatches

    this.$cache.get('acceptDialog').show();
    reviewPatches = new ReviewPatchesView({
      patches,
      acceptText: 'Add the following changes to current backend?', // FIXME: better error messages
      acceptButtonText: 'Yes',
      fromState: Immutable.fromJS(this.collection.datasets.local),
      toState: Immutable.fromJS(this.collection.datasets.remote),
    });

    this.$cache.get('acceptDialog').show().find('#selected-changes-list').append(reviewPatches.el);
    this.subviews.set('reviewPatches', reviewPatches);
  },
  handleAcceptPatches: function () {
    var patch = require('immpatch')
      , patches = this.subviews.get('reviewPatches').patches.toJS()
      , newState = patch(this.state.data, patches)

    this.backend.saveStore(newState)
      .then(() => {
        this.$cache.get('acceptDialog').hide();
        this.subviews.get('reviewPatches').remove();
        this.subviews.delete('reviewPatches');

        this.$cache.get('success')
          .html('<div class="alert alert-success">Data synced.</div>')
          .show()
      })
      .catch(require('../app').handleError)
  },
  remove: function () {
    this.subviews.forEach(view => view.remove());
    this.$cache.clear();
    Backbone.View.prototype.remove.call(this);
  }
});

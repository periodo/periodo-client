"use strict";

var url = require('url')
  , Immutable = require('immutable')
  , Backbone = require('../backbone')
  , ChangeListView = require('./select_patches')

module.exports = Backbone.View.extend({
  events: {
    'click #js-find-changes': 'findChanges',
    'click #js-accept-reviewed-patches': 'handleSubmit'
  },
  initialize: function ({ backend, state }) {
    this.backend = backend;
    this.state = state;
    this.render();
    this.subviews = new Map();
  },
  render: function () {
    var template = require('../templates/submit_patch.html');
    this.$el.html(template());
  },
  handleSubmit: function () {
    var ajax = require('../ajax')
      , patches = this.subviews.get('reviewPatches').patches
      , ajaxOpts

    ajaxOpts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(patches),
      headers: {}
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    require('../app').trigger('request');

    return ajax.ajax(ajaxOpts)
      .then(([data, textStatus, xhr]) => {
        var patchURI = xhr.getResponseHeader('Location');
        return this.addLocalPatch(patchURI, patches);
      }, err => {
        this.handlePatchSubmitError(err);
        require('../app').trigger('requestEnd');
        throw err[1];
      })
      .then(() => {
        this.render();
        this.$el.prepend('<div class="alert alert-success">Patch submitted.</div>');
        require('../app').trigger('requestEnd');
      })
      .catch(err => require('../app').handleError(err))
  },
  addLocalPatch: function(id, patches) {
    var db = require('../db')
      , patchObj
      , html

    html = this.subviews.get('reviewPatches')
      .$('.patch-collection')
      .toArray()
      .map(el => el.outerHTML)
      .join('\n')

    patchObj = {
      id,
      html,
      resolved: false,
      data: patches.toJS(),
      submitted: new Date()
    }

    return db(this.backend.name).localPatches
      .put(patchObj)
      .then(() => id);
  },
  initChangeListView: function (patches) {
    var changeList

    changeList = new ChangeListView({
      patches: patches,
      fromState: Immutable.fromJS(this.collection.datasets.local),
      toState: Immutable.fromJS(this.collection.datasets.remote),
    });

    this.subviews.set('changeList', changeList);

    changeList.on('selectedPatches', patches => {
      changeList.remove();
      this.subviews.delete('changeList');
      this.reviewSelectedPatches(patches);
    });

    this.$('#js-patch-list').append(changeList.el);
  },
  reviewSelectedPatches: function (patches) {
    var ReviewPatchesView = require('./patches_review')
      , reviewPatches

    reviewPatches = new ReviewPatchesView({
      patches,
      acceptText: 'Submit the following patches?', // FIXME: better error messages
      acceptButtonText: 'Yes',
      fromState: Immutable.fromJS(this.collection.datasets.local),
      toState: Immutable.fromJS(this.collection.datasets.remote),
    });

    this.$('#js-patch-list').append(reviewPatches.el);

    this.subviews.set('reviewPatches', reviewPatches);
  },
  handlePatchSubmitError: function ([xhr, textStatus, errorThrown]) {
    var errorMessages
      , msg

    errorMessages = {
      0: 'Connection error- could not connect to server.',
      400: 'Bad patch format.',
      401: 'Unauthorized to send patch. Login and try again.'
    }

    msg = errorMessages[xhr.status];

    alert(msg);

    // FIXME? this.addError(msg);

    // TODO: If authentication error...
 
    // TODO: If bad patch error...
 
    // TODO: If another error...
  },
  findChanges: function () {
    var ajax = require('../ajax')
      , url = this.$('input').val()
      , PatchDiffCollection = require('../collections/patch_diff')

    require('../app').trigger('request');
    ajax.getJSON(url + '/d/')
      .then(([remoteData]) => this.collection = PatchDiffCollection.fromDatasets({
        local: this.state.data.toJS(),
        remote: remoteData,
        to: 'remote'
      }))
      .then(patches => patches.filterByHash())
      .then(patches => {
        this.initChangeListView(patches);
        this.patches = patches;
      })
      .then(() => require('../app').trigger('requestEnd'))
      .catch(err => require('../app').handleError(err))
  },
  remove: function () {
    Backbone.View.prototype.remove.call(this);
    this.subviews.forEach(view => view.remove());
  }
});

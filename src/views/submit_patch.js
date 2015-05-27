"use strict";

var url = require('url')
  , Immutable = require('immutable')
  , Backbone = require('../backbone')
  , ChangeListView = require('./change_list')

module.exports = Backbone.View.extend({
  events: {
    'click #js-find-changes': 'findChanges',
    'click #js-accept-patches': 'handleContinue',
    'click #js-submit-patches': 'handleSubmit',
  },
  initialize: function (opts) {
    opts = opts || {};
    this.backend = opts.backend || require('../backends').current()
    this.localData = opts.localData;
    this.render();
  },
  render: function () {
    var template = require('../templates/submit_patch.html');
    this.$el.html(template());
  },
  handleContinue: function () {
    var patches = this.getSelectedPatches();
    this.renderConfirmPatches(patches);
  },
  renderConfirmPatches: function (patches) {
    var patchHTML = this.makeDiffHTML(patches)
      , template = require('../templates/confirm_patch.html')

    this.$el.html(template());
    this.$('#js-patch-list').html(patchHTML);
    this.$('#js-patch-list').find('td:first-child, .select-patch-header').remove();
    this.$('#js-accept-patches').remove();

    patches = patches.map(patch => patch.delete('fake'));

    this.selectedPatch = { patches: patches }
  },
  handleSubmit: function () {
    var ajax = require('../ajax')
      , patches = this.selectedPatch.patches
      , ajaxOpts

    ajaxOpts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(patches),
      headers: {
      }
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
        this.$el.prepend('<div type="alert alert-success">Patch submitted.</div>');
      })
      .catch(err => require('../app').handleError(err))
  },
  addLocalPatch: function(id, patches) {
    var db = require('../db');

    return db(this.backend.name).localPatches
      .put({ id: id, resolved: false, data: patches, submitted: new Date() })
      .then(() => id);
  },
  initChangeListView: function (patches) {
    this.changeListView = new ChangeListView({
      patches: patches,
      fromState: Immutable.fromJS(this.collection.datasets.local),
      toState: Immutable.fromJS(this.collection.datasets.remote),
      el: this.$('#js-patch-list')
    });
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
        local: this.localData.data,
        remote: remoteData,
        to: 'remote'
      }))
      .then(patches => patches.filterByHash())
      .then(patches => {
        // FIXME: Make new ChangeListView
        this.initChangeListView(patches);
        this.patches = patches;
      })
      .then(() => require('../app').trigger('requestEnd'))
      .catch(err => require('../app').handleError(err))
  }
});

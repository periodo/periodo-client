"use strict";

var TEMP_URL = 'http://localhost:5000/'

var $ = require('jquery')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')

var Patch = Backbone.Model.extend({
  url: function () { return this.get('url') },
  fetchAll: function () {
    var that = this;

    var datasetP = $.get(TEMP_URL + 'd/').then(this.set.bind(this, 'target_dataset'));
    var patchP = this.fetch().then(function (data) {
      return $.get(data.text).then(that.set.bind(that, 'patch_text'));
    });

    return $.when(datasetP, patchP).then(function () { return that });
  }
})

var PatchText = Backbone.Model.extend({
})

var PatchCollection = Backbone.Collection.extend({
  model: Patch,
  url: TEMP_URL + 'patches/'
})

PatchCollection.prototype.sync = Patch.prototype.sync = Backbone.ajaxSync;

module.exports = Backbone.View.extend({
  events: {
    'click .patch': 'showPatch'
  },
  initialize: function () {
    var that = this;

    this.render();
    this.collection = new PatchCollection();

    this.collection.fetch().then(function () {
      var template = require('../templates/patch_list.html');
      var $el = that.$('#patch-list');
      $el.html(template({ patches: that.collection.toJSON() }));
    });
  },
  render: function () {
    var template = require('../templates/apply_patch.html')
    this.$el.html(template());
  },
  showPatch: function (e) {
    var that = this;
    $('.patch').removeClass('patch-selected');
    var $patch = this.$(e.currentTarget).addClass('patch-selected');
    var patch = this.collection.findWhere({ url: $patch.data('patch-url') });
    patch.fetchAll().then(function () {
      that.renderPatch(patch);
    });
  },
  renderPatch: function (patch) {
    var template = require('../templates/patch_detail.html');
    console.log(patch.toJSON());
    this.$('#patch-detail').html(template({ patch: patch.toJSON() }));
  }
})

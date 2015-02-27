"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , Backbone = require('../backbone')
  , Creator = require('./creator')
  , CreatorCollection = require('../collections/creator')
  , parseSourceLD = require('../utils/source_ld_parser')

var WORLDCAT_REGEX = /www.worldcat.org\/oclc\/(\d+)/
  , DXDOI_REGEX = /dx.doi.org\/(.*)/

module.exports = Backbone.RelationalModel.extend({
  relations: [
    {
      type: Backbone.HasMany,
      key: 'creators',
      relatedModel: Creator,
      collectionType: CreatorCollection
    },
    {
      type: Backbone.HasMany,
      key: 'contributors',
      relatedModel: Creator,
      collectionType: CreatorCollection
    }
  ],
  validate: function (attrs) {
    var errors = []
      , hasCitation = attrs.citation

    if (!this.ld && !hasCitation) {
      errors.push({
        field: 'citation',
        message: 'This field is required for non-linked data sources.'
      });
    }

    return errors.length ? errors : null;
  },
  fetchLD: function () {
    var that = this
      , uri = this.id || ''
      , ldUri
      , promise

    if (uri.match(WORLDCAT_REGEX)) {
      ldUri = 'http://experiment.worldcat.org/oclc/' + uri.match(WORLDCAT_REGEX)[1] + '.jsonld';
      promise = $.ajax(ldUri, {dataType: 'text', accepts: {text: 'application/ld+json'}})
        .then(parseSourceLD.bind(null, that.id, null))
    } else if (uri.match(DXDOI_REGEX)) {
      ldUri = 'http://data.crossref.org/' + encodeURIComponent(uri.match(DXDOI_REGEX)[1]);
      promise = $.ajax(ldUri, {dataType: 'text', accepts: {text: 'text/turtle'}})
        .then(parseSourceLD.bind(null, that.id))
    }

    if (promise) {
      promise = promise
        .then(that.set.bind(that))
        .then(function () { that.ld = true })
      return promise;
    }
  },
  toJSON: function () {
    var ret = Backbone.RelationalModel.prototype.toJSON.call(this);

    for (var key in ret) {
      if (_.isArray(ret[key])) {
        ret[key] = ret[key].filter(function (item) { return !_.isEmpty(item) });
      }
      if (!ret[key]) {
        delete ret[key];
      }
    }

    return ret;
  }
})

"use strict";

var $ = require('jquery')
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

    if (promise) return promise.done(that.set.bind(that));
  },
  toJSON: function () {
    var ret = Backbone.RelationalModel.prototype.toJSON.call(this);
    if (ret.creators && !ret.creators.length) {
      delete ret.creators;
    }
    if (ret.contributors && !ret.contributors.length) {
      delete ret.contributors;
    }
    return ret;
  }
})

"use strict";

var Backbone = require('../backbone')
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
  url: function () {
    var uri = this.id || ''

    if (uri.match(WORLDCAT_REGEX)) {
      return 'http://ptgolden.org/oclc/' + uri.match(WORLDCAT_REGEX)[1];
      //return 'http://experiment.worldcat.org/oclc/' + uri.match(WORLDCAT_REGEX)[1] + '.ttl';
    } else if (uri.match(DXDOI_REGEX)) {
      return 'http://data.crossref.org/' + global.encodeURIComponent(uri.match(DXDOI_REGEX)[1]);
    }
  },
  fetchLD: function () {
    var that = this;

    return this.sync('read', this, {
      dataType: 'text',
      accepts: { text: 'text/turtle' }
    }).then(parseSourceLD.bind(null, that.id)).done(function (data) {
      that.set(data);
    });
  },
})

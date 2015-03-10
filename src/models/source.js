"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , Backbone = require('../backbone')
  , Creator = require('./creator')
  , CreatorCollection = require('../collections/creator')
  , parseSourceLD = require('../utils/source_ld_parser')
  , Supermodel = require('supermodel')
  , Source

var WORLDCAT_REGEX = /www.worldcat.org\/oclc\/(\d+)/
  , DXDOI_REGEX = /dx.doi.org\/(.*)/

Source = Supermodel.Model.extend({
  validate: function (attrs) {
    var errors = []
      , hasCitation = attrs.citation

    // FIXME: "this.ld" will only be set when explicitly fetching ld, not
    // when sources have just been loaded from text.
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
    var ret = Supermodel.Model.prototype.toJSON.call(this);

    ret.creators = this.creators().map(function (creator) { return creator.toJSON() });
    ret.contributors = this.contributors().map(function (contributor) { return contributor.toJSON() });

    for (var key in ret) {
      if (_.isArray(ret[key])) {
        ret[key] = ret[key].filter(function (item) { return !_.isEmpty(item) });
        if (!ret[key].length) {
          delete ret[key];
        }
      } else if (!ret[key]) {
        delete ret[key];
      }
    }

    return ret;
  }
});

Source.has().many('creators', {
  collection: CreatorCollection,
  inverse: 'source',
  source: 'creators'
});

Source.has().many('contributors', {
  collection: CreatorCollection,
  inverse: 'source',
  source: 'contributors'
});

module.exports = Source;

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
  isLinkedData: function () {
    var id = this.get('id') || '';
    return !!(id.match(WORLDCAT_REGEX) || id.match(DXDOI_REGEX));

  },
  validate: function (attrs) {
    var errors = []
      , hasCitation = attrs.citation || attrs.title

    if (!this.isLinkedData() && !hasCitation) {
      errors.push({
        field: 'citation',
        message: 'This field is required for non-linked data sources.'
      });
    }

    return errors.length ? errors : null;
  },
  clear: function (options) {
    var ret = Supermodel.Model.prototype.clear.call(this, options);
    this.contributors().reset([], options);
    this.creators().reset([], options);
    return ret;
  },
  fetchLD: function (url) {
    var that = this
      , uri = url || this.id || ''
      , ldUri
      , promise

    if (uri.match(WORLDCAT_REGEX)) {
      ldUri = 'http://experiment.worldcat.org/oclc/' + uri.match(WORLDCAT_REGEX)[1] + '.jsonld';
      promise = $.ajax(ldUri, {dataType: 'text', accepts: {text: 'application/ld+json'}})
        .then(parseSourceLD.bind(null, uri, null))
    } else if (uri.match(DXDOI_REGEX)) {
      ldUri = 'http://data.crossref.org/' + encodeURIComponent(uri.match(DXDOI_REGEX)[1]);
      promise = $.ajax(ldUri, {dataType: 'text', accepts: {text: 'text/turtle'}})
        .then(parseSourceLD.bind(null, uri))
    }

    if (promise) {
      promise = promise.then(function (data) {
        var parsed = that.parse(data)
        return that.set(parsed);
      });
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
  },
  displayTitle: function () {
    var creators = this.getCreators()
      , year = this.getYearPublished() || 'unknown'
      , title = this.getTitle()
      , ret = ''

    if (creators.length) {
      if (creators.length > 2) {
        ret += creators[0].name + ', et al.';
      } else if (creators.length > 1) {
        ret += creators[0].name + ' and ' + creators[1].name;
      } else {
        ret += creators[0].name;
      }
    }

    if (ret) ret += ' ';
    ret += '(' + year + ')';

    if (ret) ret += ', ';

    ret += title;

    return ret;
  },
  getCreators: function () {
    if (this.creators().length) {
      return this.creators().toJSON();
    } else if (this.has('partOf') && this.get('partOf').creators) {
      return this.get('partOf').creators;
    } else {
      return [];
    }
  },
  getYearPublished: function () {
    if (this.has('yearPublished')) {
      return this.get('yearPublished');
    } else if (this.has('partOf') && this.get('partOf').yearPublished) {
      return this.get('partOf').yearPublished;
    } else {
      return null;
    }
  },
  getTitle: function () {
    return this.get('title') ||
      this.get('citation') ||
      this.get('partOf').title ||
      this.get('partOf').citation
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

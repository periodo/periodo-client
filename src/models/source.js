"use strict";

var Backbone = require('../backbone')
  , CreatorCollection = require('../collections/creator')
  , parseSourceLD = require('../utils/source_ld_parser')
  , stringify = require('json-stable-stringify')
  , stringifyOpts = {
    space: '  ',
    cmp: function (a, b) { return a.key > b.key ? 1 : -1; },
  }

var WORLDCAT_REGEX = /www.worldcat.org\/oclc\/(\d+)/
  , DXDOI_REGEX = /dx.doi.org\/(.*)/

module.exports = Backbone.Model.extend({
  idAttribute: '@id',
  initialize: function () {
    this.contributors = new CreatorCollection();
    this.creators = new CreatorCollection();
    global.z = this;
  },
  url: function () {
    var uri = this.get('@id') || ''

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
      data = that.parse(data);
      that.set(data);
      // TODO: Trigger events here
    });
  },
  parse: function (resp) {
    if ('contributors' in resp) {
      this.contributors.set(resp.contributors);
      delete resp.contributors;
    }
    if ('creators' in resp) {
      this.creators.set(resp.creators);
      delete resp.creators;
    }
    return resp;
  },
  toJSONLD: function () {
    var obj = this.toJSON();
    if (this.contributors.length) {
      obj.contributors = this.contributors.toJSON();
    }
    if (this.creators.length) {
      obj.creators = this.creators.toJSON();
    }
    return stringify(obj, stringifyOpts);
  }
})

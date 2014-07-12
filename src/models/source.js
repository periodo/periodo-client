"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , CreatorCollection = require('../collections/creator')
  , stringify = require('json-stable-stringify')
  , stringifyOpts = {
    space: '  ',
    cmp: function (a, b) { return a.key > b.key ? 1 : -1; },
  }

var BASE_URL = 'http://ptgolden.org/oclc/'

function formatContrib(graph, contribId) {
  var contrib = _(graph).findWhere({ '@id': contribId })
    , data = {}
    , name

  data['@id'] = contribId;
  if ('schema:name' in contrib) {
    name = contrib['schema:name'];
    if (_.isArray(name)) name = name[0];
    data['name'] = name
  }
  return data;
}

module.exports = Backbone.Model.extend({
  idAttribute: '@id',
  initialize: function () {
    this.contributors = new CreatorCollection();
    this.creators = new CreatorCollection();
  },
  url: function () {
    return BASE_URL + this.get('@id').match(/\d+$/);
  },
  parse: function (resp) {
    var data = {}
      , graph = resp['@graph']
      , item = _(graph).findWhere({ '@id': this.id })

    // Need year published, title, creators, contributors, and PartOf
    if ('schema:datePublished' in item) {
      data.yearPublished = item['schema:datePublished'];
    }

    if ('schema:name' in item) {
      data.title = item['schema:name']['@value'];
    }

    if ('contributor' in item) {
      this.contributors.set([].concat(item.contributor).map(formatContrib.bind(null, graph)));
    }
    if ('creator' in item) {
      this.creators.set([].concat(item.creator).map(formatContrib.bind(null, graph)));
    }
    return data;
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

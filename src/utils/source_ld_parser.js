"use strict";

var _ = require('underscore')
  , N3Store = require('n3/lib/N3Store')
  , N3Util = require('n3/lib/N3Util')
  , parseRDF = require('./parse_rdf')
  , parseJsonLD = require('./parse_jsonld')

const DEFAULT_PREDICATES = {
  title: [
    'http://purl.org/dc/terms/title',
    'http://schema.org/name'
  ],
  yearPublished: [
    'http://purl.org/dc/terms/date',
    'http://schema.org/datePublished'
  ],
  creators: [
    'http://purl.org/dc/terms/creator',
    'http://schema.org/creator'
  ],
  contributors: [
    'http://purl.org/dc/terms/contributor',
    'http://schema.org/contributor',
    'http://schema.org/editor'
  ],
  name: [
    'http://xmlns.com/foaf/0.1/name',
    'http://schema.org/name'
  ]
}

/*
 * Parsers for worldcat and citeseer citations. Returns the following
 * attributes, if they exist:
 *   title, yearPublished, creators, contributors, and partOf
 */

function getFirstMatchingPredicate(store, subject, predicates) {
  var matchingObjects;
  predicates = _.isArray(predicates) ? predicates : Array.prototype.slice.call(arguments, 2);
  for (var i = 0; i < predicates.length; i++) {
    matchingObjects = store.find(subject, predicates[i], null);
    if (matchingObjects.length) break;
  }
  return matchingObjects;
}

function getFirstLiteralObject() {
  return _.chain(getFirstMatchingPredicate.apply(null, arguments))
    .pluck('object')
    .map(N3Util.getLiteralValue)
    .first()
    .value();
}

function formatContrib(store, entity) {
  return {
    'id': entity,
    'name': getFirstLiteralObject(store, entity, DEFAULT_PREDICATES.name)
  }
}

function makeSourceRepr(entity, store) {
  var data = { id: entity };

  // FIXME: Need to handle partOf dates too

  ['title', 'yearPublished'].forEach(key => {
    var val = getFirstLiteralObject(store, entity, DEFAULT_PREDICATES[key]);
    if (val) data[key] = val;
  });

  ['creators', 'contributors'].forEach(key => {
    var val = getFirstMatchingPredicate(store, entity, DEFAULT_PREDICATES[key]);
    if (val) data[key] = val.map(pred => formatContrib(store, pred.object));
  });

  return data;
}

module.exports = function (entity, ttl) {
  if (!ttl) throw new Error('Must pass turtle string to parse.');

  return parseRDF(ttl)
    .then(({ triples, prefixes }) => {
      var store = N3Store();

      store.addPrefixes(prefixes);
      store.addTriples(triples);

      return makeSourceRepr(entity, store);
    });
}

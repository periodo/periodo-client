"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , N3 = require('n3')
  , jsonld = require('jsonld')

var DEFAULT_PREDICATES = {
  title: ['http://purl.org/dc/terms/title', 'http://schema.org/name'],
  yearPublished: ['http://purl.org/dc/terms/date', 'http://schema.org/datePublished'],
  creators: ['http://purl.org/dc/terms/creator', 'http://schema.org/creator'],
  contributors: ['http://purl.org/dc/terms/contributor', 'http://schema.org/contributor'],
  name: ['http://xmlns.com/foaf/0.1/name', 'http://schema.org/name']
}

/*
 * Parsers for worldcat and citeseer citations. Returns the following
 * attributes, if they exist:
 *   title, yearPublished, creators, contributors, and partOf
 */


/*
 * Returns Promise that resolves with an N3.store
 */
function parseTurtle(turtle) {
  var parser = N3.Parser()
    , store = N3.Store()
    , dfd = $.Deferred()

  parser.parse(turtle, function (error, triple, prefixes) {
    if (triple) {
      store.addTriple(triple);
    } else if (error) {
      // TODO: error handling
      console.error(error);
    } else {
      store.addPrefixes(prefixes);
      dfd.resolve(store);
    }
  });

  return dfd.promise();
}

function parseJsonLD(doc) {
  var parser = N3.Parser()
    , store = N3.Store()
    , dfd = $.Deferred()

  doc = JSON.parse(doc);

  jsonld.toRDF(doc, {format: 'application/nquads'}, function (err, nquads) {
    if (err) {
      console.error(error);
      dfd.error(err);
    }
    parser.parse(nquads, function (error, triple, prefixes) {
      if (triple) {
        store.addTriple(triple);
      } else if (error) {
        // TODO: error handling
        console.error(error);
      } else {
        store.addPrefixes(prefixes);
        dfd.resolve(store);
      }
    });
  });

  return dfd.promise();
}

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
    .map(N3.Util.getLiteralValue)
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
  var data = {}

  data.title = getFirstLiteralObject(store, entity, DEFAULT_PREDICATES.title);

  data.yearPublished = getFirstLiteralObject(store, entity, DEFAULT_PREDICATES.yearPublished);

  data.creators = _.chain(getFirstMatchingPredicate(store, entity, DEFAULT_PREDICATES.creators))
    .pluck('object')
    .map(formatContrib.bind(null, store))
    .value();

  data.contributors = _.chain(getFirstMatchingPredicate(store, entity, DEFAULT_PREDICATES.contributors))
    .pluck('object')
    .map(formatContrib.bind(null, store))
    .value();

  return data;
}

module.exports = function (entity, ttl, jsonld) {
  var promise;

  if (!(ttl || jsonld)) console.error('no linked data to parse.');

  return (ttl ? parseTurtle(ttl) : parseJsonLD(jsonld)).then(makeSourceRepr.bind(null, entity));
}

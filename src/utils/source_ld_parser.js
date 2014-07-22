"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , N3 = require('n3')

var DEFAULT_PREDICATES = {
  title: ['http://purl.org/dc/terms/title', 'schema:name'],
  yearPublished: ['http://purl.org/dc/terms/date', 'schema:datePublished'],
  creators: ['http://purl.org/dc/terms/creator', 'schema:creator'],
  contributors: ['http://purl.org/dc/terms/contributor', 'schema:contributor'],
  name: ['http://xmlns.com/foaf/0.1/name', 'schema:name']
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

function getFirstMatchingPredicate(store, subject, predicates) {
  var matchingObjects;
  predicates = _.isArray(predicates) ? predicates : Array.prototype.slice.call(arguments, 2);
  for (var i = 0; i < predicates.length; i++) {
    matchingObjects = store.find(subject, predicates[i], null);
    if (matchingObjects.length) break;
  }
  return matchingObjects;
}

function getFirstLiteralObject(store, subject, predicates) {
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

module.exports = function (entity, ttl) {
  return parseTurtle(ttl).then(makeSourceRepr.bind(null, entity));
}

"use strict";

const N3Store = require('n3/lib/N3Store')
    , { getLiteralValue } = require('n3/lib/N3Util')
    , parseRDF = require('./parse_rdf')
    , parseJsonLD = require('./parse_jsonld')


const availablePredicates = Immutable.fromJS({
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
})


/*
 * Parsers for worldcat and citeseer citations. Returns the following
 * attributes, if they exist:
 *   title, yearPublished, creators, contributors, and partOf
 */

const SOURCE_FIELDS = ['title', 'yearPublished', 'creators', 'contributors'];


function getFirstMatchingStatement(store, subjectURI, field) {
  for (const predicateURI of predicateList.get(field)) {
    const matchingObjects = store.find(subjectURI, predicateURI, null)

    if (matchingObjects) {
      return matchingObjects;
    }
  }

  return null;
}


function getFirstObjectLiteral() {
  const statements = getFirstMatchingStatement(...arguments) || [];

  return statements && getLiteralValue(statements[0].object);
}


function makeSourceRepr(store, entity) {
  const _getFirstLiteralObject = getFirstLiteralObject.bind(null, store, entity)

  const fields = SOURCE_FIELDS.map(getFirstLiteralObject.bind(null, store, entity));

  const data = { id: entity }

  fields.forEach((val, i) => {
    if (!val) return

    const key = SOURCE_FIELDS[i];

    data[key] = val !== 'creators' && val !== 'contributors'
      ? val
      : val.map(pred => ({
        id: entity,
        name: getFirstLiteralObject(store, entity, availablePredicates.get('name'))
      }))
  });

  return data;
}


module.exports = function (entity, ttl) {
  if (!ttl) throw new Error('Must pass turtle string to parse.');

  return parseRDF(ttl)
    .then(({ triples, prefixes }) => {
      const store = N3Store();

      store.addPrefixes(prefixes);
      store.addTriples(triples);

      return makeSourceRepr(store, entity);
    });
}

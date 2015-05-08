"use strict";

var Immutable = require('immutable')
  , terminusUtils = require('./terminus')

function describe(collection) {
  var definitions = collection.get('definitions')
    , starts = definitions.map(def => def.get('start'))
    , stops = definitions.map(def => def.get('stop'))

  return {
    id: collection.get('id'),
    source: require('./source').getDisplayTitle(collection.get('source')),
    definitions: collection.get('definitions', { size: 0 }).size,
    earliest: terminusUtils.minYear(starts),
    latest:terminusUtils.maxYear(stops)
  }
}

function getSpatialCoverageCounts(periodList) {
  return periodList
    .countBy(period => period.get('spatialCoverage'))
    .map((count, countries) => Immutable.Map({ count, countries }))
    .toList()
}

function getSpatialCoverages(collections) {
  return collections
    .flatMap(val => val.get('definitions'))
    .groupBy(val => val.get('spatialCoverageDescription'))
    .filter((val, key) => !!key)
    .map(getSpatialCoverageCounts)
    .map((uses, label) => Immutable.Map({ uses, label }))
    .toList()
}

module.exports = {
  describe: describe,
  getSpatialCoverages: getSpatialCoverages
}

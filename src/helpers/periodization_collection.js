"use strict";

var Immutable = require('immutable')

function getSpatialCoverageCounts(periodList) {
  return periodList
    .countBy(period => period.get('spatialCoverage'))
    .map((count, countries) => Immutable.Map({
      count,
      countries: countries ? countries.toOrderedSet() : Immutable.OrderedSet()
    }))
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

module.exports = { getSpatialCoverages }

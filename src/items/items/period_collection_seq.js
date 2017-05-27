"use strict";

const R = require('ramda')

// Iterable<Authority> -> List<Period>
//
// Get all of the individual periods within the sequence of authorities.
const getPeriods = R.chain(R.prop('definitions'))

const getSpatialCoverageCounts = R.pipe(
  R.map(p => p.spatialCoverage.map(
    R.pipe(R.prop('id'), encodeURIComponent))),
  R.countBy(R.identity),
  R.mapObjIndexed((count, countries) => ({
    count,
    countries: countries.split(',').map(x => encodeURIComponent(x)),
  })),
  R.values()
)

// Iterable<Authority> -> Array<Object({ uses, label })>
const getSpatialCoverages = R.pipe(
  getPeriods,
  R.groupBy(R.prop('spatialCoverageDescription')),
  R.pickBy(R.identity),
  R.map(getSpatialCoverageCounts),
  R.mapObjIndexed((uses, label) => ({ uses, label })),
  R.values
)


module.exports = {
  getPeriods,
  getSpatialCoverages,
  getSpatialCoverageCounts,
}

"use strict";

const R = require('ramda')
    , { periodsWithAuthority } = require('./authority')

// Iterable<Authority> -> List<Period>
//
// Get all of the individual periods within the sequence of authorities.
const periods = R.chain(periodsWithAuthority)

const spatialCoverageCounts = R.pipe(
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
const spatialCoverages = R.pipe(
  periods,
  R.groupBy(R.prop('spatialCoverageDescription')),
  R.pickBy(R.identity),
  R.map(spatialCoverageCounts),
  R.mapObjIndexed((uses, label) => ({
    uses,
    label,
  })),
  R.values
)


module.exports = {
  periods,
  spatialCoverages,
  spatialCoverageCounts,
}

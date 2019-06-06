"use strict";

const $$Sorts = Symbol('sorts')
    , { authorityList, terminus } = require('periodo-utils')
    , natsort = require('natsort')

const sorter = natsort({ insensitive: true })

function sort(getter, vals) {
  return [...vals].sort((a, b) => {
    const _a = getter(a)
    const _b = getter(b)

    if (_a == null) return 1
    if (_b == null) return -1

    return sorter(_a, _b)
  })
}

// Add sorts for label, earliest start, and latest stop
function initSorts(dataset) {
  const periods = []
      , sorts = {}

  Object.values(dataset.authorities).forEach(auth => {
    Object.values(auth.periods).forEach(period => {
      periods.push(period)
    })
  })

  sorts.label = Object.freeze(sort(p => p.label, periods))
  sorts.start = Object.freeze(sort(p => terminus.earliestYear(p.start), periods))
  sorts.stop = Object.freeze(sort(p => terminus.latestYear(p.stop), periods))

  dataset[$$Sorts] = sorts
}

function cachedSort(dataset, periods, field, rev=false) {
  const sorted = dataset[$$Sorts][field]

  if (!sorted) {
    throw new Error('No cached sort available for field `' + field + '`')
  }

  const ret = sorted.filter(p => periods.indexOf(p) > -1)

  return rev ? ret.reverse() : ret
}

module.exports = {
  initSorts,
  cachedSort,
}

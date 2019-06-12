"use strict";

const $$Sorts = Symbol('sorts')
    , { terminus } = require('periodo-utils')
    , natsort = require('natsort')

const sorter = natsort({ insensitive: true })

function sort(getter, vals) {
  const ret = new Map()

  const sorted = [...vals].sort((a, b) => {
    const _a = getter(a)
    const _b = getter(b)

    if (_a == null) return 1
    if (_b == null) return -1

    return sorter(_a, _b)
  })

  sorted.forEach((period, i) => {
    ret.set(period, i)
  })

  return ret
}

function reverse(getter, map) {
  let reversed = [...map.keys()].reverse()

  const toEnd = []
      , ret = new Map()

  while (reversed[0] && (getter(reversed[0]) == null)) {
    toEnd.push(reversed.shift())
  }

  reversed = reversed.concat(toEnd)

  reversed.forEach((period, i) => {
    ret.set(period, i)
  })

  return ret
}

const sortDefs = [
  ['label', p => p.label],
  ['start', p => terminus.earliestYear(p.start)],
  ['stop', p => terminus.latestYear(p.stop)],
]

// Add sorts for label, earliest start, and latest stop
function initSorts(dataset) {
  const periods = []
      , sorts = { forward: {}, reverse: {}}

  Object.values(dataset.authorities).forEach(auth => {
    Object.values(auth.periods).forEach(period => {
      periods.push(period)
    })
  })

  sortDefs.forEach(([ key, fn ]) => {
    const forwardSort = sort(fn, periods)
        , reverseSort = reverse(fn, forwardSort)

    sorts.forward[key] = forwardSort
    sorts.reverse[key] = reverseSort
  })

  dataset[$$Sorts] = sorts
}

function cachedSort(dataset, periods, field, rev=false) {
  const accessor = rev ? 'reverse' : 'forward'
      , map = dataset[$$Sorts][accessor][field]

  if (!map) {
    throw new Error('No cached sort available for field `' + field + '`')
  }

  const sorted = []

  periods.forEach(period => {
    sorted[map.get(period)] = period
  })

  return Object.values(sorted)
}

module.exports = {
  initSorts,
  cachedSort,
}

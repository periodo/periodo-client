"use strict";

const { $$Authority } = require('periodo-utils/src/symbols')
    , { getSorts } = require('./sort')

module.exports = class DatasetProxy {
  constructor(raw) {
    this.raw = raw
    this.indexItems()
  }

  indexItems() {
    this.periods = []
    this.authorities = []
    this.periodsByID = {}
    this.authoritiesByID = {}

    Object.values(this.raw.authorities).forEach(authority => {
      this.authorities.push(authority)
      this.authorityID[authority.id] = authority

      Object.values(authority.periods).forEach(period => {
        this.periods.push(period)
        this.periodsByID[period.id] = period

        period[$$Authority] = authority
      })
    })
  }

  async initSorts() {
    if (this.sorts) return

    this.sorts = await getSorts(this.periods)
  }

  async cachedSort(periods, field, rev=false) {
    if (!this.sorts) {
      throw new Error('Must call `initSorts` before getting a cached sort')
    }

    const accessor = rev ? 'reverse' : 'forward'
        , map = this.sorts[accessor][field]

    /*
    if (process.env.NODE_ENV !== 'production') {
      if (!periods.every(p => this.periods.includes(p))) {
        throw new Error(
          'Cached sort not possible: the periods passed to the function are not ' +
          'the same objects referenced by the dataset object.'
        )
      }
    }
    */

    if (!map) {
      throw new Error('No cached sort available for field `' + field + '`')
    }

    const sorted = []

    periods.forEach(period => {
      sorted[map.get(period)] = period
    })

    return Object.values(sorted)
  }
}

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

    Object.values(this.raw.authorities || {}).forEach(authority => {
      this.authoritiesByID[authority.id] = authority
      Object.values(authority.periods || {}).forEach(period => {
        this.periodsByID[period.id] = period
        period[$$Authority] = authority
      })
    })

    this.periods = Object.values(this.periodsByID)
    this.authorities = Object.values(this.authoritiesByID)
  }

  periodByID(periodID) {
    return this.periodsByID(periodID)
  }

  authorityByID(authorityID) {
    return this.authoritiesByID(authorityID)
  }

  async initSorts() {
    if (this.sorts) return

    this.sorts = await getSorts(this)
  }

  async cachedSort(periods, field, rev=false) {
    await this.initSorts()

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

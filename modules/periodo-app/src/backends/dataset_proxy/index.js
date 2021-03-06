"use strict";

const { getSort } = require('./sort')
    , work = require('webworkify')
    , PromiseWorker = require('promise-worker')
    , indexItems = require('./index_items')

function copy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const SINGLE_VALUED_RELATED_PERIOD_FIELDS = [ 'broader' ]
    , MULTI_VALUED_RELATED_PERIOD_FIELDS = [ 'narrower', 'derivedFrom' ]


module.exports = class DatasetProxy {
  constructor(raw) {
    this.raw = raw
    Object.assign(this, indexItems(raw))
    this.sorts = {}
  }

  get validated() {
    const validated = {
      type: 'rdf:Bag',
      authorities: copy(this.authoritiesByID),
    }

    const { periods, periodsByID } = indexItems(validated)
        , periodInDataset = periodID => periodID in periodsByID

    // Filter out related periods that won't exist in the target dataset. This
    // will be the case if someone adds local period A, which references local
    // period B, but does not add local period B.
    for (const period of periods) {
      for (const attr of MULTI_VALUED_RELATED_PERIOD_FIELDS) {
        const value = period[attr]

        if (!value) continue

        period[attr] = period[attr].filter(periodInDataset)
      }

      for (const attr of SINGLE_VALUED_RELATED_PERIOD_FIELDS) {
        const value = period[attr]

        if (!value) continue

        if (!periodInDataset(value)) {
          delete period[attr]
        }
      }
    }

    return validated
  }

  getWorker() {
    if (this._worker) {
      return this._worker
    }

    const worker = work(require('./worker'))
        , promiseWorker = new PromiseWorker(worker)

    promiseWorker.postMessage({
      type: 'initialize',
      rawDataset: this.raw,
    })

    return this._worker = {
      worker,
      promiseWorker,
    }
  }

  periodByID(periodID) {
    return this.periodsByID[periodID]
  }

  authorityByID(authorityID) {
    return this.authoritiesByID[authorityID]
  }

  async cachedSort(periods, field, rev=false) {
    if (!this.sorts[field]) {
      this.sorts[field] = await getSort(this, this.getWorker().promiseWorker, field)
    }

    const map = this.sorts[field][rev ? 'reverse' : 'forward']

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

"use strict";

const { getSort } = require('./sort')
    , work = require('webworkify')
    , PromiseWorker = require('promise-worker')
    , indexItems = require('./index_items')

module.exports = class DatasetProxy {
  constructor(raw) {
    this.raw = raw
    Object.assign(this, indexItems(raw))

    if (typeof window !== 'undefined') {
      this.globalWorker = this.spawnWorker()
    }

    this.sorts = {}
  }

  spawnWorker() {
    const worker = work(require('./worker'))
        , promiseWorker = new PromiseWorker(worker)

    promiseWorker.postMessage({
      type: 'initialize',
      rawDataset: this.raw,
    })

    return { worker, promiseWorker }
  }

  periodByID(periodID) {
    return this.periodsByID[periodID]
  }

  authorityByID(authorityID) {
    return this.authoritiesByID[authorityID]
  }

  async cachedSort(periods, field, rev=false) {
    if (!this.sorts[field]) {
      this.sorts[field] = await getSort(this, this.globalWorker.promiseWorker, field)
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
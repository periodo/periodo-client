"use strict";

const work = require('webworkify')
    , PromiseWorker = require('promise-worker')

function union(...sets) {
  return sets.reduce((acc, s) => new Set([ ...acc, ...s ]), new Set())
}

function intersection(...sets) {
  const all = union(...sets)

  return new Set([ ...all ].filter(x => sets.every(s => s.has(x))))
}

class FacetCalculator {
  constructor (dataset, aspects, resetAspectCounts, setAspectCount) {
    this.dataset = dataset
    this.aspects = aspects
    this.resetAspectCounts = resetAspectCounts
    this.setAspectCount = setAspectCount
    this.workers = null
  }

  async getWorkers () {
    if (! this.workers) {

      this.workers = this.aspects.map(() => {
        const worker = work(require('./worker'))
        return {
          worker,
          promiseWorker: new PromiseWorker(worker),
        }
      })

      await Promise.all(this.workers.map(w => w.promiseWorker.postMessage({
        type: 'initialize',
        rawDataset: this.dataset.raw,
      })))
    }
    return this.workers
  }

  async runCalculations (selected={}, settings={}, periods) {
    const workers = await this.getWorkers()

    this.resetAspectCounts()

    let idsByWorker

    if (Object.keys(selected).length === 0) {
      idsByWorker = workers.map(() => new Set(periods.map(p => p.id)))
    }

    if (!idsByWorker) {
      const matchers = this.aspects.map((key, i) =>
        workers[i].promiseWorker.postMessage({
          type: 'get_matching',
          aspect: key,
          settings: settings[key] || {},
          selected: new Set(selected[key] || []),
          periods,
        }))

      idsByWorker = (await Promise.all(matchers)).map(resp => resp.ids)
    }

    const matchingIDs = intersection(...idsByWorker)

    this.aspects.map((aspect, i) => {
      const matchingIDsForAspect = intersection(
        ...idsByWorker.filter((_, j) => i !== j)
      )
      const remainingPeriods = periods.filter(
        period => matchingIDsForAspect.has(period.id)
      )

      workers[i].promiseWorker.postMessage({
        type: 'get_counts',
        aspect,
        periods: remainingPeriods,
        settings: settings[aspect] || {},
        selected: new Set(selected[aspect] || []),
      }).then(({ countArr }) => {
        this.setAspectCount(aspect, countArr)
      })
    })

    return new Set(matchingIDs)
  }

  shutdown () {
    if (this.workers) {
      this.workers.forEach(w => {
        w.worker.terminate()
      })
    }
  }

}

module.exports = FacetCalculator

"use strict";

const work = require('webworkify')
    , PromiseWorker = require('promise-worker')

// Get the exact periods from the dataset, since the object identities will have
// changed after coming from the web worker
function restore(sortedPosByID, dataset) {
  return new Map([...sortedPosByID].map(([ id, pos ]) => [ dataset.periodByID(id), pos ]))
}

// Add sorts for label, earliest start, and latest stop
async function getSorts(dataset) {
  const worker = work(require('./worker'))
      , promiseWorker = new PromiseWorker(worker)
      , periods = dataset.periods
      , sorts = { forward: {}, reverse: {}}

  for (const key of ['label', 'stop', 'start']) {
    const { forward, reverse } = await promiseWorker.postMessage({
      key,
      periods
    })

    sorts.forward[key] = restore(forward, dataset)
    sorts.reverse[key] = restore(reverse, dataset)
  }

  worker.terminate()

  return sorts
}

module.exports = {
  getSorts,
}

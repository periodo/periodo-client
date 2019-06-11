"use strict";

const work = require('webworkify')

function createSorts(field, periods) {
  const worker = work(require('./worker'))

  return new Promise(resolve => {
    worker.addEventListener('message', e => {
      resolve(e.data)
    })

    worker.postMessage({
      key: 'label',
      periods
    })
  })
}

// Get the exact periods from the dataset, since the object identities will have
// changed after coming from the web worker
function restore(sortedPosByID, dataset) {
  return new Map([...sortedPosByID].map(([ id, pos ]) => [ dataset.periodByID(id), pos ]))
}

// Add sorts for label, earliest start, and latest stop
async function getSorts(dataset) {
  const periods = dataset.periods
      , sorts = { forward: {}, reverse: {}}

  await Promise.all((['label', 'stop', 'start']).map(async key => {
    const { forward, reverse } = await createSorts(key, periods)

    sorts.forward[key] = restore(forward, dataset)
    sorts.reverse[key] = restore(reverse, dataset)
  }))

  return sorts
}

module.exports = {
  getSorts,
}

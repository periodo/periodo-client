"use strict";

// Get the exact periods from the dataset, since the object identities will have
// changed after coming from the web worker
function restore(sortedPosByID, dataset) {
  return new Map([ ...sortedPosByID ].map(([ id, pos ]) => [ dataset.periodByID(id), pos ]))
}

// Add sorts for label, earliest start, and latest stop
async function getSort(dataset, promiseWorker, field) {
  const { forward, reverse } = await promiseWorker.postMessage({
    type: 'getSort',
    field,
  })

  return {
    forward: restore(forward, dataset),
    reverse: restore(reverse, dataset),
  }
}

module.exports = {
  getSort,
}

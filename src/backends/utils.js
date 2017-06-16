"use strict";

const { Backend } = require('./types')

function makeEmptyDataset() {
  return {
    periodCollections: {},
    type: 'rdf:Bag'
  }
}

// Gets current backend in localStorage. If not in the browser, or if the
// current backend is unset or malformed, returns null.
function getCurrentBackend() {
  if (!global.localStorage) return null;

  const { currentBackend } = global.localStorage

  try {
    return Backend.deserialize(currentBackend);
  } catch (err) {
    return null;
  }
}

function urlParam(backend) {
  return backend.case({
    IndexedDB: id => `local-${id}`,
    Web: url => `web-${url}`,
    _: () => {
      throw new Error('not yet')
    }
  })
}

module.exports = {
  getCurrentBackend,
  makeEmptyDataset,
  urlParam,
}

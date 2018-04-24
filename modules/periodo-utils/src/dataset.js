"use strict";

const R = require('ramda')

function isDataset(obj) {
  return (
    typeof obj === 'object' &&
    typeof obj.periodCollections === 'object'
  )
}

function getAuthority(obj, collectionID) {
  return R.path(['periodCollections', collectionID], obj)
}

function getPeriod(obj, collectionID, periodID) {
  return R.path(['periodCollections', collectionID, 'definitions', periodID], obj)
}

module.exports = {
  isDataset,
  getAuthority: R.curry(getAuthority),
  getPeriod: R.curry(getPeriod),
}

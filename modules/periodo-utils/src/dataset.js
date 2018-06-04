"use strict";

const R = require('ramda')

function isDataset(obj) {
  return (
    typeof obj === 'object' &&
    typeof obj.authorities === 'object'
  )
}

function getAuthority(obj, authorityID) {
  return R.path(['authorities', authorityID], obj)
}

function getPeriod(obj, authorityID, periodID) {
  return R.path(['authorities', authorityID, 'periods', periodID], obj)
}

module.exports = {
  isDataset,
  getAuthority: R.curry(getAuthority),
  getPeriod: R.curry(getPeriod),
}

"use strict";

const R = require('ramda')

// Takes a set of Immutable Maps with keys language, script, and value,
// and returns a Map grouped by language-script code
const groupByCode = R.pipe(
  R.groupBy(getCode),
  R.map(R.map(R.prop('value')))
)

function getCode(label) {
  return `${label.language}-${label.script}`
}

module.exports = {
  getCode,
  groupByCode,
}

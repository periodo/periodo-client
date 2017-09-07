"use strict";

const R = require('ramda')

// Takes a set of Immutable Maps with keys language, script, and value,
// and returns a Map grouped by language-script code
const groupByCode = R.pipe(
  R.groupBy(code),
  R.map(R.map(R.prop('value')))
)

function code(label) {
  return `${label.language}-${label.script}`
}

module.exports = {
  code,
  groupByCode,
}

"use strict";

// Takes a set of Immutable Maps with keys language, script, and value,
// and returns a Map grouped by language-script code
function groupByCode(labels) {
  return labels
    .groupBy(getCode)
    .map(labels => labels.map(label => label.get('value')))
}

function getCode(label) {
  return `${label.get('language')}-${label.get('script')}`
}

module.exports = {
  getCode,
  groupByCode,
}

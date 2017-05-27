"use strict";

const R = require('ramda')
    , { formatName } = require('./contributor')

// Iterable<Contributor> -> Iterable<String>
function formatContributorList(contributors) {
  return contributors.length < 3
    ? contributors.map(formatName).join(' and ')
    : formatName(R.head(contributors))
}

module.exports = {
  formatContributorList,
}

"use strict";

function formatContributorList(contributors) {
  const { formatName } = require('./contributor')

  return contributors.size < 3
    ? contributors.map(formatName).join(' and ')
    : formatName(contributors.first())
}

module.exports = { formatContributorList }

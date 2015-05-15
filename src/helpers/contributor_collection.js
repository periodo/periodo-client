"use strict";

function formatContributorList(contributors) {
  var { formatName } = require('./contributor');

  if (contributors.size < 3) {
    return contributors.map(formatName).join(' and ');
  } else {
    return formatName(contributors.first());
  }
}

module.exports = { formatContributorList }

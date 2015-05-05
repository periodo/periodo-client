"use strict";

var Immutable = require('immutable')


function formatName(contributor) {
  // TODO: fixme
  return contributor.get('name');
}

function formatContributorList(contributors) {
  if (contributors.size < 3) {
    return contributors.map(formatName).join(' and ');
  } else {
    return formatName(contributors.first());
  }
}

module.exports = {
  formatName: formatName,
  formatContributorList: formatContributorList
}

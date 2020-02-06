"use strict";

const R = require('ramda')
    , contributor = require('./contributor')

function asString(contributors) {
  return contributors.length < 3
    ? contributors.map(contributor.asString).join(' and ')
    : R.pipe(R.head, contributor.asString)(contributors) + ' et al.'
}

module.exports = {
  asString,
}

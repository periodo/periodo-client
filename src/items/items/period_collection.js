"use strict";

const R = require('ramda')
    , { minYear, maxYear } = require('./terminus_seq')
    , { getDisplayTitle } = require('./source')

function describe(periodization) {
  const { minYear, maxYear } = require('./terminus_seq')
      , definitions = R.values(periodization.definitions || {})

  return {
    id: periodization.id,
    source: getDisplayTitle(periodization.source),
    definitions: definitions.length,
    earliest: minYear(R.map(R.path(['start']))(definitions)),
    latest: maxYear(R.map(R.path(['stop']))(definitions)),
  }
}

module.exports = {
  describe
}

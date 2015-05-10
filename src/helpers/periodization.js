"use strict";

function describe(periodization) {
  var { minYear, maxYear } = require('./terminus_collection')
    , definitions = periodization.get('definitions')
    , starts = definitions.map(def => def.get('start'))
    , stops = definitions.map(def => def.get('stop'))

  return {
    id: periodization.get('id'),
    source: require('./source').getDisplayTitle(periodization.get('source')),
    definitions: periodization.get('definitions', { size: 0 }).size,
    earliest: minYear(starts),
    latest: maxYear(stops)
  }
}

module.exports = { describe }

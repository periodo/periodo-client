"use strict";

var terminusUtils = require('./terminus')

function describe(collection) {
  var definitions = collection.get('definitions')
    , starts = definitions.map(def => def.get('start'))
    , stops = definitions.map(def => def.get('stop'))

  return {
    id: collection.get('id'),
    source: require('./source').getDisplayTitle(collection.get('source')),
    definitions: collection.get('definitions', { size: 0 }).size,
    earliest: terminusUtils.minYear(starts),
    latest:terminusUtils.maxYear(stops)
  }
}

module.exports = {
  describe: describe
}

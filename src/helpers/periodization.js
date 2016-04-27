"use strict";

const _ = require('underscore')
    , d3 = require('d3')
    , Immutable = require('immutable')
    , { asJSONLD, asTurtle } = require('./data')

function describe(periodization) {
  const { minYear, maxYear } = require('./terminus_collection')
      , definitions = periodization.get('definitions')
      , starts = definitions.map(def => def.get('start', Immutable.Map()))
      , stops = definitions.map(def => def.get('stop', Immutable.Map()))

  return {
    id: periodization.get('id'),
    source: require('./source').getDisplayTitle(periodization.get('source')),
    definitions: periodization.get('definitions', { size: 0 }).size,
    earliest: minYear(starts),
    latest: maxYear(stops)
  }
}

function validate(periodization) {
  const { isLinkedData } = require('./source')
      , source = periodization.get('source')
      , errors = {}

  if (!source) {
    errors.source = ['A source is required for a period collection.'];
  } else if (!isLinkedData(source)) {
    if (!source.get('citation') && !source.get('title')) {
      errors.source = ['Non linked data sources must have a citation or title.'];
    }
  }

  return _.isEmpty(errors) ? null : errors;
}

function asCSV(periodization) {
  const { getEarliestYear, getLatestYear } = require('./terminus')

  return d3.csv.format(periodization.get('definitions').map(period => {
    const start = period.get('start')
        , stop = period.get('stop')

    return {
      'label': period.get('label'),
      'start_label': start.get('label'),
      'earliest_start': getEarliestYear(start),
      'latest_start': getLatestYear(start),
      'stop_label': stop.get('label'),
      'earliest_stop': getEarliestYear(stop),
      'latest_stop': getLatestYear(stop),
      'spatialCoverages': (
        period.get('spatialCoverage', Immutable.List())
          .map(sc => sc.get('id'))
          .join('|')),
      'note': period.get('note'),
      'editorial_note': period.get('editorialNote')
    }
  }))
}

module.exports = { describe, validate, asCSV, asJSONLD, asTurtle }

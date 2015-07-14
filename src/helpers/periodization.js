"use strict";

var _ = require('underscore')
  , Immutable = require('immutable')
  , { asJSONLD, asTurtle } = require('./data')

function describe(periodization) {
  var { minYear, maxYear } = require('./terminus_collection')
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
  var { isLinkedData } = require('./source')
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
  var csv = require('csv-write-stream')
    , concat = require('concat-stream')
    , headers

  headers = [
    'label',
    'start_label',
    'earliest_start',
    'latest_start',
    'stop_label',
    'earliest_stop',
    'latest_stop',
    'spatialCoverages',
    'note',
    'editorial_note',
  /*'alternateLabels', */
  ]

  return new Promise((resolve, reject) => {
    var writer = csv({ headers })
      , { getEarliestYear, getLatestYear } = require('./terminus')


    writer.pipe(concat(resolve));
    writer.on('error', reject);

    periodization.get('definitions').forEach(period => {
      var start = period.get('start')
        , stop = period.get('stop')

      writer.write([
        period.get('label'),
        start.get('label'),
        getEarliestYear(start),
        getLatestYear(start),
        stop.get('label'),
        getEarliestYear(stop),
        getLatestYear(stop),
        period.get('spatialCoverage', Immutable.List()).map(sc => sc.get('id')).join('|'),
        period.get('note'),
        period.get('editorialNote')
      ]);
    });

    writer.end();
  });
}

module.exports = { describe, validate, asCSV, asJSONLD, asTurtle }

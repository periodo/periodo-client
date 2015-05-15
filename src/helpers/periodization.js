"use strict";

var _ = require('underscore')
  , Immutable = require('immutable')

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

function asJSONLD(periodization) {
  var json = periodization.toJS();
  json['@context'] = require('../context');
  return json;
}

function processStatement(statement) {
  var val;

  if (statement.type !== 'literal') return statement.value;

  val = '"' + statement.value.replace(/"/g, '\\"') + '"';
  if (statement.datatype === 'http://www.w3.org/2001/XMLSchema#string') {
    // Good!
  } else if (statement.datatype === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
    val += '@' + statement.language;
  } else {
    val += '^^' + statement.datatype;
  }

  return val;
}

function asTurtle(periodization) {
  var jsonld = require('jsonld')
    , N3 = require('n3')

  return new Promise((resolve, reject) => {
    jsonld.toRDF(asJSONLD(periodization), (err, dataset) => {
      var writer

      if (err) reject(err);

      writer = N3.Writer({
        skos: 'http://www.w3.org/2004/02/skos/core#',
        dcterms: 'http://purl.org/dc/terms/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        time: 'http://www.w3.org/2006/time#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
        periodo: 'http://perio.do/temporary/'
      });

      dataset['@default'].forEach(triple => writer.addTriple({
        subject: processStatement(triple.subject),
        predicate: processStatement(triple.predicate),
        object: processStatement(triple.object)
      }));

      writer.end((err, result) => {
        if (err) reject(err);
        result = result
          .replace(/\n</g, '\n\n<')
          .replace(/(\n<.*?>) /g, "$1\n    ")

        resolve(result);
      });
    });
  });
}

module.exports = { describe, validate, asCSV, asJSONLD, asTurtle }

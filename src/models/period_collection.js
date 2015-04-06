"use strict";

var _ = require('underscore')
  , Dexie = require('dexie')
  , PeriodCollection = require('../collections/period')
  , Source = require('../models/source')
  , Supermodel = require('supermodel')
  , Periodization

Periodization = Supermodel.Model.extend({
  skolemID: true,
  defaults: {
    source: {}
  },
  parse: function (data, options) {
    options = options || {};
    if (_.isObject(data.definitions)) {
      if (options.noMutate) data = JSON.parse(JSON.stringify(data));
      data.definitions = _.values(data.definitions);
    }
    return Supermodel.Model.prototype.parse.call(this, data, options);
  },
  clear: function (options) {
    this.definitions().reset([], options);
    this.source().clear();
    var ret = Supermodel.Model.prototype.clear.call(this, options);
    return ret;
  },
  validate: function (attrs) {
    var errors = []
      , source = this.source()

    if (!source || _.isEmpty(source.toJSON())) {
      errors.push({
        field: 'source',
        message: 'A source is required for a period collection.'
      });
    } else {
      if (!source.isValid()) {
        errors = errors.concat(source.validationError);
      }
    }

    return errors.length ? errors : null;
  },
  getTimespan: function () {
    var starts = this.definitions()
      .map(function (period) { return period.start() })
      .filter(function (t) { return t.hasYearData() })

    var stops = this.definitions()
      .map(function (period) { return period.stop() })
      .filter(function (t) { return t.hasYearData() })

    function intYear(min, terminus) {
      var year = terminus.get('year') || terminus.get(min ? 'earliestYear' : 'latestYear');
      return parseInt(year, 10)
    }

    return {
      lower: starts.length ? _.min(starts, function (t) { return t.getEarliestYear() }) : undefined,
      upper: starts.length ? _.max(stops, function (t) { return t.getLatestYear() }) : undefined,
    }
  },
  toJSON: function () {
    // change to structure of dataset
    var ret = Supermodel.Model.prototype.toJSON.call(this);
    delete ret.source_id;
    ret.definitions = this.definitions().reduce(function (acc, period) {
      acc[period.id] = period.toJSON();
      return acc;
    }, {});
    ret.source = this.source().toJSON();
    ret.type = 'PeriodCollection';
    return ret;
  },
  asCSV: function () {
    var that = this;
    return new Dexie.Promise(function (resolve, reject) {
      var csv = require('csv-write-stream')
        , concat = require('concat-stream')

      var headers = [
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
      var writer = csv({ headers: headers });

      writer.pipe(concat(function(data) {
        resolve(data);
      }));
      that.definitions().forEach(function (period) {
        writer.write([
          period.get('label'),
          period.start().get('label'),
          period.start().getEarliestYear(),
          period.start().getLatestYear(),
          period.stop().get('label'),
          period.stop().getEarliestYear(),
          period.stop().getLatestYear(),
          period.spatialCoverage().map(function (sc) { return sc.get('@id') }).join('|'),
          period.get('note'),
          period.get('editorialNote'),
        ]);
      });
      writer.end();
    });
  },
  asJSONLD: function () {
    var json = this.toJSON();
    json['@context'] = this.collection.context;
    return json;
  },
  asTurtle: function () {
    var that = this
      , jsonld = require('jsonld')
      , N3 = require('n3')

    return new Dexie.Promise(function (resolve, reject) {
      jsonld.toRDF(that.asJSONLD(), function (err, dataset) {
        if (err) { reject(err) }
        var writer = N3.Writer({
          skos: 'http://www.w3.org/2004/02/skos/core#',
          dcterms: 'http://purl.org/dc/terms/',
          foaf: 'http://xmlns.com/foaf/0.1/',
          time: 'http://www.w3.org/2006/time#',
          xsd: 'http://www.w3.org/2001/XMLSchema#',
          periodo: 'http://perio.do/temporary/'
        });

        function processPart(part) {
          var val;

          if (part.type !== 'literal') return part.value;

          val = '"' + part.value.replace(/"/g, '\\"') + '"';
          if (part.datatype === 'http://www.w3.org/2001/XMLSchema#string') {
            // Good!
          } else if (part.datatype === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
            val += '@' + part.language;
          } else {
            val += '^^' + part.datatype;
          }

          return val;
        }

        function processTriple(triple) {
          return {
            subject: processPart(triple.subject),
            predicate: processPart(triple.predicate),
            object: processPart(triple.object)
          }
        }

        dataset['@default'].forEach(function (triple) {
          writer.addTriple(processTriple(triple));
        });

        writer.end(function (err, result) {
          if (err) { reject(err) }
          result = result
            .replace(/\n</g, '\n\n<')
            .replace(/(\n<.*?>) /g, "$1\n    ")

          resolve(result);
        });
      });
    });
  }
});

Periodization.has().many('definitions', {
  collection: PeriodCollection,
  inverse: 'periodization',
  source: 'definitions'
});

Periodization.has().one('source', {
  model: Source,
  inverse: 'periodization',
  source: 'source'
});

module.exports = Periodization;

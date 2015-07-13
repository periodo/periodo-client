"use strict";

var Immutable = require('immutable')
  , iso639_3 = require('iso-639-3').all()

// formatValue

module.exports = {
  source: {
    label: 'Source',
    fn: function (period) {
      var { getDisplayTitle } = require('../../helpers/source')
      return getDisplayTitle(this.props.dataset.getIn([
        'periodCollections', period.get('collection_id'), 'source'
      ]));
    }
  },
  language: {
    label: 'Language',
    fn: function (period) {
      var alternateLabels = period.get('alternateLabel')
        , languages

      languages = period
        .get('originalLabel', Immutable.Map())
        .keySeq()
        .toSet()

      if (alternateLabels) {
        languages = languages.union(alternateLabels.keySeq());
      }

      return languages.map(code => iso639_3[code.split('-')[0]].name);
    },
    multiValue: true
  },
  spatialCoverage: {
    label: 'Spatial coverage',
    fn: function (period) {
      return period.get('spatialCoverageDescription')
    }
  }
}

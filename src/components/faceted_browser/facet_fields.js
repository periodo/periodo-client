"use strict";

var Immutable = require('immutable')
  , tags = require('language-tags')

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
      return period
        .get('localizedLabels', Immutable.Map())
        .keySeq()
        .map(tag => tags.check(tag)
          ? tags(tag).language().descriptions().join('/')
          : tag)
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

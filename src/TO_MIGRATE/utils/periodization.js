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

  return Object.keys(errors).length ? null : errors;
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

module.exports = {
  describe,
  validate,
  asCSV,
  asJSONLD,
  asTurtle
}

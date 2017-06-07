"use strict";

const R = require('ramda')
    , { Result } = require('../util/types')
    , terminus = require('../util/terminus')

function addError(obj, label, err) {
  return R.over(
    R.lensProp(label),
    (v=[]) => v.concat(err),
    obj
  )
}

function validateAuthority(authority) {
  const { isLinkedData } = require('../util/source')
      , { source, definitions={} } = authority

  let errors = {}

  if (!source || R.equals(source, {})) {
    errors = addError(errors, 'source', 'A source is required for a period collection.')
  } else if (!isLinkedData(source)) {
    if (!source.citation && !source.title) {
      errors = addError(errors, 'source', 'Non linked data sources must have a citation or title.')
    }
  }

  if (R.equals(errors, {})) {
    return Result.Ok({
      source,
      definitions,
      type: 'PeriodCollection'
    })
  } else {
    debugger;
    return Result.Err(errors)
  }
}

const VALID_PERIOD_FIELDS = [
  'id',
  'ul',
  'sameAs',
  'source',
  'label',
  'language',
  'localizedLabels',
  'spatialCoverage',
  'spatialCoverageDescription',
  'start',
  'stop',
  'note',
  'editorialNote',
]

function validatePeriod(period) {
  let errors = {}

  if (!period.label) {
    errors = addError(errors, 'label', 'This field is required.');
  }

  const periodPresent = type =>
    R.prop(type, period) &&
    R.hasIn([type, 'label']) &&
    terminus.earliestYear(R.prop(type, period)) !== null &&
    terminus.latestYear(R.prop(type, period)) !== null

  const badTerminusRange = terminus =>
    terminus.isMultiPart(terminus) &&
    terminus.earliestYear(terminus) > terminus.latestYear(terminus)

  if (!periodPresent('start') || !periodPresent('stop')) {
    errors = addError(errors, 'dates', 'A period must have start and stop dates.');
  } else if (terminus.latestYear(period.stop) < terminus.earliestYear(period.start)) {
    errors = addError(errors, 'dates', 'A period\'s stop must come after its start.');
  } else {
    if (badTerminusRange(period.get('start'))) {
      errors = addError(errors, 'dates', 'Date range for period start has a beginning later than its end.')
    }

    if (badTerminusRange(period.get('stop'))) {
      errors = addError(errors, 'dates', 'Date range for period stop has a beginning later than its end.')
    }
  }

  if (R.equals(errors, {})) {
    const cleanedPeriod = {
      type: 'PeriodDefinition',
    }

    VALID_PERIOD_FIELDS.forEach(field => {
      const val = period[field]

      if (val) {
        cleanedPeriod[field] = val;
      }
    })

    return Result.Ok(cleanedPeriod);

  } else {
    return Result.Err(errors);
  }
}

module.exports = {
  validateAuthority,
  validatePeriod,
}

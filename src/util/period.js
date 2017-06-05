"use strict";

const R = require('ramda')
    , Immutable = require('immutable')
    , terminus = require('./terminus')


function addError(map, label, err) {
  return map.update(label, Immutable.List(), list => list.push(err));
}

function parseLang(langSpec) {
  const [ language, script ] = langSpec.split('-')

  return { language, script }
}

function originalLabel(period) {
  const { label, language } = period

  if(!label || !language) return null;

  return Object.assign({ value: label }, parseLang(language))
}

const allLabels = R.pipe(
  R.propOr({}, 'localizedLabels'),
  R.mapObjIndexed((labels, isoCode) => labels.map(label =>
    Object.assign({ value: label }, parseLang(isoCode)))),
  R.values,
  R.unnest
)

function alternateLabels(period) {
  return R.without([originalLabel(period)], allLabels(period))
}

function validate(period) {

  let errors = Immutable.Map()

  if (!period.get('label')) {
    errors = addError(errors, 'label', 'This field is required.');
  }

  const periodPresent = type =>
    period.get(type) &&
    period.getIn([type, 'label']) &&
    terminus.earliestYear(period.get(type)) !== null

  const badTerminusRange = terminus =>
    terminus.hasIn(['in', 'latestYear']) &&
    terminus.earliestYear(terminus) > terminus.latestYear(terminus)

  if (!periodPresent('start') || !periodPresent('stop')) {
    errors = addError(errors, 'dates', 'A period must have start and stop dates.');
  } else if (terminus.latestYear(period.get('stop')) < terminus.earliestYear(period.get('start'))) {
    errors = addError(errors, 'dates', 'A period\'s stop must come after its start.');
  } else {
    if (badTerminusRange(period.get('start'))) {
      errors = addError(errors, 'dates', 'Date range for period start has a beginning later than its end.')
    }

    if (badTerminusRange(period.get('stop'))) {
      errors = addError(errors, 'dates', 'Date range for period stop has a beginning later than its end.')
    }
  }

  return errors.size ? errors.toJS() : null;
}

module.exports = {
  validate,
  originalLabel,
  allLabels,
  alternateLabels,
}

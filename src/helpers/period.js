var _ = require('underscore')

function validate(period) {
  var { getEarliestYear, getLatestYear } = require('./terminus')
    , errors = {}

  function addError(label, err) { errors[label] = (errors[label] || []).concat(err) }

  if (!period.get('label')) {
    addError('label', 'This field is required.');
  }

  function periodPresent(type) {
    return (
      period.get(type) &&
      period.getIn([type, 'label']) &&
      !!getEarliestYear(period.get(type))
    )
  }

  if (!periodPresent('start') || !periodPresent('stop')) {
    addError('dates', 'A period must have start and stop dates.');
  } else if (getLatestYear(period.get('stop')) < getEarliestYear(period.get('start'))) {
    addError('dates', 'A period\'s stop must come after its start.');
  }

  return _.isEmpty(errors) ? null : errors;
}

module.exports = { validate }

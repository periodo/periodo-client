"use strict";

const R = require('ramda')
    , Type = require('union-type')

function isIdentified(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    'id' in value &&
    value.id !== '@id'
  )
}

// Is there any reason for this to exist? Wouldn't all non-identified values
// be anonymous?
function isAnonymous(value) {
  return (
    value != null && (
      typeof value === 'string' ||
      typeof value === 'number' ||
      (typeof value === 'object' && !isIdentified(value))
    )
  )
}

function valueEquals(a, b) {
  if (isIdentified(a)) {
    return a.id === b.id
  }

  return R.equals(a, b)
}

function isValidValue(x) {
  return isIdentified(x) || isAnonymous(x)
}

const Change = Type({
  Addition: {
    value: isValidValue,
  },
  Deletion: {
    value: isValidValue,
  },
  Preservation: {
    value: isValidValue,
  },
  Mutation: {
    from: isIdentified,
    to: isIdentified,
  },
})

module.exports = {
  Change,
  isIdentified,
  isAnonymous,
  isValidValue,
  valueEquals,
}

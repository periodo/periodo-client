"use strict";

const R = require('ramda')
    , Type = require('union-type')

function isIdentified(value) {
  return (
    typeof value === 'object' &&
    'id' in value &&
    value.id !== '@id'
  )
}

/*
// Is there any reason for this to exist? Wouldn't all non-identified values
// be anonymous?
function isAnonymous(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    (typeof value === 'object' && !isIdentified(value))
  )
}
*/

function valueEquals(a, b) {
  if (isIdentified(a)) {
    return a.id === b.id
  }

  return R.equals(a, b)
}

const Change = Type({
  Addition: {
    value: R.T,
  },
  Deletion: {
    value: R.T,
  },
  Preservation: {
    value: R.T,
  },
  Mutation: {
    from: isIdentified,
    to: isIdentified,
  },
})

module.exports = {
  Change,
  isIdentified,
  valueEquals,
}

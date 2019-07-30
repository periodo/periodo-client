"use strict";

const R = require('ramda')
    , Type = require('union-type')

const isIdentified = R.ifElse(
  R.is(Object),       // don't treat @context.id as an id
  R.both(R.has('id'), R.complement(R.propEq('id', '@id'))),
  R.F
)

const isAnonymous = R.cond([
  // string or number or object without id
  [ R.is(String), R.T ],
  [ R.is(Number), R.T ],
  [ R.both(R.is(Object), R.complement(isIdentified)), R.T ],
  [ R.T, R.F ],
]);

const Value = Type({
  Identified:    [ isIdentified ],
  Anonymous: [ isAnonymous ],
})

const asValue = R.ifElse(isIdentified, Value.Identified, Value.Anonymous)

const valueEquality = Value.caseOn({
  Identified:
    (a,b) => Value.case({ Identified: R.propEq('id', a.id), _: R.F }, b),
  Anonymous:
    (a,b) => Value.case({ Anonymous:  R.equals(a),          _: R.F }, b),
})

const Change = Type({
  Addition:     [ R.either(isAnonymous, isIdentified) ],
  Deletion:     [ R.either(isAnonymous, isIdentified) ],
  Preservation: [ R.either(isAnonymous, isIdentified) ],
  Mutation:     [ isIdentified, isIdentified ],
})

module.exports = { Value, Change, asValue, valueEquality }

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , { Span, Italic } = require('./Misc')
    , { ensureArray } = require('../util/misc')

const ensureProps = R.ifElse(
  R.is(Object),
  R.identity,
  R.pipe(ensureArray, R.objOf('children')),
)

const hasID = R.ifElse(R.is(Object), R.has('id'), R.F)

const equalityByID = R.curry(
  (x, y) => hasID(x) && hasID(y)
    ? R.equals(x.id, y.id)
    : R.equals(x, y)
)

const contains = value => R.any(equalityByID(value))

const symmetricDifference = (a, b) =>
  [ R.differenceWith(equalityByID, a, b)
  , R.differenceWith(equalityByID, b, a)
  ]

const equalLists = (a, b) => {
  const [ deleted, added ] = symmetricDifference(a, b)
  return deleted.length === 0 && added.length === 0
}

const compareLists = ([ a, b ]) => {
  const [ deleted, added ] = symmetricDifference(a, b)
  return R.map(
    v => [ v, contains(v)(added), contains(v)(deleted) ],
    R.unionWith(equalityByID, a, b)
  )
}

const compareFields = (fieldsA, fieldsB) => {

  if (fieldsB === undefined) return fieldsA

  const labelsA = R.map(R.prop('label'), fieldsA)
      , labelsB = R.map(R.prop('label'), fieldsB)
      , indexedFieldsA = R.indexBy(R.prop('label'), fieldsA)
      , indexedFieldsB = R.indexBy(R.prop('label'), fieldsB)

  return R.map(
    ([ label, added, deleted ]) => {
      if (added) {
        return R.merge(
          indexedFieldsB[label],
          { backgroundColor: Diff.colors.insert }
        )
      }
      if (deleted) {
        return R.merge(
          indexedFieldsA[label],
          { backgroundColor: Diff.colors.delete }
        )
      }
      return R.merge(
        indexedFieldsA[label],
        { changed: R.pick(['values'], indexedFieldsB[label]) }
      )
    },
    compareLists([ labelsA, labelsB ])
  )
}

const addChanges = values => R.pipe(
  R.zip(values),
  R.map(([ value, change ]) => R.merge(value, {changed: change}))
)

function Problem(props) {
  const { children } = props
  return h(
    Italic,
    R.merge(R.omit(['children'], props), { color: 'red' }),
    `Warning: ${children}`
  )
}

const checkRequired = isRequired => R.ifElse(
  R.both(R.isEmpty, R.always(isRequired)),
  R.always([ h(Problem, 'missing required value') ]),
  R.identity,
)

const wrapValues = props => R.addIndex(R.map)(
  (value, i) => h(Box, R.merge(props, { key: `v${i}` }), value)
)

const listValues = component => R.map(R.pipe(ensureProps, component))

const diffValues = component => R.pipe(
  compareLists,
  R.map(
    ([ v, added, deleted ]) => {
      const color = (
        added ? Diff.colors.insert :
        deleted ? Diff.colors.delete :
        null
      )
      return h(component, R.merge(ensureProps(v), {backgroundColor: color}))
    }
  ),
)

const resolve = fieldSpec => R.pipe(
  fieldSpec.values,
  values => R.assoc('values', values, fieldSpec),
)

const getFields = fieldSpecs => R.pipe(
  R.of,
  R.ap(R.map(resolve, fieldSpecs)),
  R.filter(({required, values}) => required || values.length > 0),
)

function Field(props) {
  const {
    label,
    values,
    valueComponent = Span,
    changed = {},
    required = false,
    immutable = false,
    hidden = false,
    diffInside = false,
  } = props

  const show = listValues(valueComponent)
  const compare = diffValues(valueComponent)
  const wrap = R.pipe(checkRequired(required), wrapValues({ is: 'dd', ml: 1 }))

  return h(
    Box,
    R.mergeAll(
      [
        R.omit(
          [ 'label', 'values', 'valueComponent', 'changed',
            'required', 'immutable', 'hidden', 'diffInside' ],
          props
        ),
        { key: label, mt: 1 },
        hidden ? { css: {display: 'none'} } : {},
      ]
    ),
    [
      h(Box, { is: 'dt', bold: true }, label),

      immutable && changed.values && (! equalLists(values, changed.values))
        ? h(Problem, 'changing immutable field')
        : null,

      wrap(
        (changed.values === undefined)
          ? show(values)
          : diffInside
            ? show(addChanges(values)(changed.values))
            : compare([ values, changed.values ])
      )
    ]
  )
}

function FieldList(props) {
  const { fields, changed = {} } = props
  return h(
    Box,
    R.merge(R.omit(['fields', 'changed'], props), { is: 'dl' }),
    R.map(Field, compareFields(fields, changed.fields)),
  )
}

module.exports = { FieldList, getFields, diffValues }

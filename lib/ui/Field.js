"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { compareLists, ensureArray } = require('../util/misc')
    , { Diff } = require('./Diff')
    , { Span, Italic } = require('./Misc')

const ensureProps = R.ifElse(
  R.is(Object),
  R.identity,
  R.pipe(ensureArray, R.objOf('children')),
)

const addChanges = values => R.pipe(
  R.zip(values),
  R.map(([ value, change ]) => R.merge(value, {changed: change}))
)

const Problem = props => Italic(R.merge(props, { color: 'red' }))

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
exports.diffValues = diffValues

const resolve = fieldSpec => R.pipe(
  fieldSpec.values,
  values => R.assoc('values', values, fieldSpec),
)

exports.getFields = fieldSpecs => R.pipe(
  R.of,
  R.ap(R.map(resolve, fieldSpecs)),
  R.filter(({required, values}) => required || values.length > 0),
)

function Field(props) {
  const {
    label,
    values,
    valueComponent = Span,
    required = false,
    changed = {},
    diffInside = false,
  } = props

  const show = listValues(valueComponent)
  const compare = diffValues(valueComponent)
  const wrap = R.pipe(checkRequired(required), wrapValues({ is: 'dd', ml: 1 }))

  return h(
    Box,
    R.merge(
      R.omit(
        [ 'label', 'values', 'valueComponent',
          'required', 'changed', 'diffInside' ],
        props
      ),
      { key: label, mt: 1 }
    ),
    [
      h(Box, { is: 'dt', bold: true }, label),
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
exports.Field = Field

exports.FieldsDiff = function FieldsDiff(props) {
  const { fieldsA, fieldsB } = props
      , labelsA = R.map(R.prop('label'), fieldsA)
      , labelsB = R.map(R.prop('label'), fieldsB)
      , indexedFieldsA = R.indexBy(R.prop('label'), fieldsA)
      , indexedFieldsB = R.indexBy(R.prop('label'), fieldsB)

  const comparedFields = R.map(
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

  return h(
    Box,
    R.merge(R.omit(['fieldsA', 'fieldsB'], props), { is: 'dl' }),
    R.map(Field, comparedFields),
  )
}

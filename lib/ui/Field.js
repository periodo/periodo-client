"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { PrimitiveValue, show } = require('./Value')
    , { Info, Warn } = require('./Misc')
    , { Value, Change, asValue } = require('./types')
    , { findChanges, showChanges } = require('./Diff')
    , { ensureArray } = require('../util/misc')

const extract = keyOrPath => R.pipe(
  R.pathOr([], ensureArray(keyOrPath)),
  ensureArray,
  R.map(asValue)
)

const extractIndexedValues = keyOrPath => R.pipe(
  R.pathOr({}, ensureArray(keyOrPath)),
  R.values,
  R.map(asValue)
)

const as = key => fn => R.pipe(
  fn,
  R.addIndex(R.map)(Value.caseOn({
    Identified: v => Value.Identified(v),
    Anonymous: (v, index) => Value.Identified({ id: index, [key]: v })
  }))
)

const checkRequired = isRequired => values => (isRequired && R.isEmpty(values))
  ? [ 'missing required value' ] : []

const check = isImmutable => isRequired => values => changed => {
  const warnings = (isImmutable && ! R.equals(values, changed.values))
    ? [ 'changing immutable field' ] : []
  return warnings.concat(checkRequired(isRequired)(changed.values))
}

const wrap = props => R.map(x => h(Box, props, x))

const countChanges = R.pipe(
  R.countBy(Change.case({
    Addition: () => 'added',
    Deletion: () => 'deleted',
    Mutation: () => 'changed',
    Preservation: () => 'unchanged',
  })),
  R.merge({ added: 0, deleted: 0, changed: 0, unchanged: 0 })
)

const formatCounts = counts => `
 ${counts.deleted} deleted,
 ${counts.added} added,
 ${counts.changed} changed,
 and ${counts.unchanged} unchanged
 ${counts.unchanged > 0 ? '(not shown)' : ''}
`

const showValues = ({
  values,
  component = PrimitiveValue,
  required = false
}) => (

  { warnings: checkRequired(required)(values)
  , summary: null
  , items: R.map(show(component), values)
  }
)

const compareValues = ({
  values,
  component = PrimitiveValue,
  required = false,
  immutable = false,
  hideUnchanged = false,
}, compare) => {

  const changes = findChanges(values, compare.values)
  const counts = countChanges(changes)
  const didChange = counts.unchanged < changes.length
  const summarizeChanges = (didChange && hideUnchanged) ? true : false
  const filteredChanges = (didChange && hideUnchanged)
    ? R.filter(Change.case({ Preservation: R.F, _: R.T }), changes)
    : changes

  return (
    { warnings: check(immutable)(required)(values)(compare.values)
    , summary: summarizeChanges ? h(Info, {}, formatCounts(counts)) : null
    , items: showChanges(component)(filteredChanges)
    }
  )
}

const fieldExtractor = fieldSpec => R.pipe(
  fieldSpec.values,
  values => R.assoc('values', values, fieldSpec),
  R.assoc('id', fieldSpec.label)
)

const fieldsExtractor = fieldSpecs => R.pipe(
  R.of,
  R.ap(R.map(fieldExtractor, fieldSpecs)),
  R.filter(({ required, values }) => (required || values.length > 0)),
  R.map(Value.Identified)
)

function Warnings(props) {
  const { warnings } = props
  return h(
    Box,
    R.omit([ 'warnings' ], props),
    R.map(warning => h(Warn, {}, `Warning: ${warning}`), warnings)
  )
}

function Field(props) {
  const { value, compare } = props
      , { label, hidden = false } = value
      , { warnings
        , summary
        , items
        } = compare ? compareValues(value, compare) : showValues(value)
      , hide = hidden && R.isEmpty(warnings)

  return h(
    Box,
    R.mergeAll(
      [
        R.omit([ 'value', 'compare' ], props),
        { mt: 1 },
        hide ? { css: {display: 'none'} } : {},
      ]
    ),
    [
      h(Box, { is: 'dt', bold: true }, label),

      warnings.length ? h(Warnings, { warnings }) : null,

      summary,

      ...wrap({ is: 'dd', ml: 1 })(items)
    ]
  )
}

const FieldList = fieldSpecs => props => {
  const { value, compare } = props
      , fields = fieldsExtractor(fieldSpecs)

  return h(
    Box,
    R.merge(R.omit([ 'value', 'compare' ], props), { is: 'dl' }),
    compare
      ? showChanges(Field)(findChanges(fields(value), fields(compare)))
      : R.map(show(Field), fields(value))
  )
}

module.exports = { extract, extractIndexedValues, as, FieldList }

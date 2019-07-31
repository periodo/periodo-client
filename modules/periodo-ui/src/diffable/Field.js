"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('../Base')
    , { PrimitiveValue, show } = require('./Value')
    , { InfoText, WarnText } = require('../Typography')
    , { Value, Change, asValue } = require('./types')
    , { findChanges, showChanges } = require('./Diff')

// Extract the value of a key or path from the item being rendered, then
// convert it to a list of Value types
function extract(path) {
  path = [].concat(path)
  return item => {
    const extracted = R.pathOr([], path, item)
    return [].concat(extracted).map(v => asValue(v))
  }
}

// Same as above, but for indexed values
function extractIndexedValues(path) {
  path = [].concat(path)

  return item => {
    const extracted = R.pathOr({}, path, item)
        , ret = {}

    Object.entries(extracted).forEach(([ k, v ]) => {
      ret[k] = asValue(v)
    })

    return ret
  }
}

// Make an extractor function return an array of Value objects with a certain
// key in them (??). Was called `as'
function extractWithKey(key) {
  return fn => item => fn(item).map((value, i) => value.case({
    Identified: v => Value.Identified(v),
    Anonymous: v => Value.Identified({ id: i, [key]: v }),
  }))
}

function checkRequired(isRequired, values) {
  return (isRequired && R.isEmpty(values))
    ? [ 'missing required value' ]
    : []
}

function checkImmutable(isImmutable, values, changedValues) {
  return (isImmutable && !R.equals(values, changedValues))
    ? [ 'changing immutable field' ]
    : []
}

function runComparisonChecks({
  isImmutable,
  isRequired,
  values,
  comparedValues,
}) {
  const warnings = [].concat(
    checkImmutable(isImmutable, values, comparedValues),
    checkRequired(isRequired, comparedValues)
  )

  return warnings
}

function countChanges(changes) {
  return R.pipe(
    R.countBy(Change.case({
      Addition: () => 'added',
      Deletion: () => 'deleted',
      Mutation: () => 'changed',
      Preservation: () => 'unchanged',
    })),
    R.merge({ added: 0, deleted: 0, changed: 0, unchanged: 0 })
  )(changes)
}

function formatCounts(counts) {
  return `
   ${counts.deleted} deleted,
   ${counts.added} added,
   ${counts.changed} changed,
   and ${counts.unchanged} unchanged
   ${counts.unchanged > 0 ? '(not shown)' : ''}
  `
}

function showValues(props) {
  const {
    values,
    component=PrimitiveValue,
    required=false,
    ...childProps
  } = props

  return {
    warnings: checkRequired(required, values),
    summary: null,
    items: R.map(show(component, childProps), values),
  }
}

function compareValues(fieldValue, compareTo) {
  const {
    values,
    component,
    required=false,
    immutable=false,
    hideUnchanged=false,
  } = fieldValue

  const changes = findChanges(values, compareTo.values)
      , counts = countChanges(changes)
      , didChange = counts.unchanged < changes.length
      , summarizeChanges = (didChange && hideUnchanged) ? true : false

  const filteredChanges = !(didChange && hideUnchanged)
    ? changes
    : changes.filter(change => change.case({
        Preservation: () => false,
        _: () => true,
      }))

  return {
    warnings: runComparisonChecks({
      isImmutable: immutable,
      isRequired: required,
      values,
      comparedValues: compareTo.values,
    }),
    summary: summarizeChanges ? h(InfoText, {}, formatCounts(counts)) : null,
    items: showChanges(component)(filteredChanges),
  }
}

function fieldExtractor(props) {
  return fieldSpec => item => {
    //TODO: const { getValue, useProps, ...ret } = fieldSpec
    const values = fieldSpec.getValues(item)

    const ret = R.omit(['getValue', 'useProps'], fieldSpec)

    ret.id = fieldSpec.label;
    ret.values = values;

    (fieldSpec.useProps || []).forEach(prop => {
      ret[prop] = props[prop]
    })

    return ret
  }
}

const fieldsExtractor = (fieldSpecs, props) => R.pipe(
  R.of,
  R.ap(R.map(fieldExtractor(props), fieldSpecs)),
  R.filter(({ required, values }) => (required || values.length > 0)),
  R.map(Value.Identified)
)

function Warnings(props) {
  const { warnings, ...childProps } = props

  return (
    h(Box, childProps, warnings.map(warning =>
      h(WarnText, [
        `Warning: ${warning}`,
      ])
    ))
  )
}

// A field takes a value (which is extracted from the item being rendered
// using an extractor function, and renders it as a <dt>/<dd> pair. Optionally,
// another value can be compared to the value, using the `compare' prop.
function Field(props) {
  const { value, compare, ...childProps } = props
      , { label, hidden=false } = value
      , values = compare ? compareValues(value, compare) : showValues(value)
      , { warnings, summary, items } = values
      , hide = hidden && R.isEmpty(warnings)

  childProps.mt = 2

  if (hide) {
    childProps.style = { display: 'none' }
  }

  return (
    h(Box, childProps, [
      h(Box, { is: 'dt', fontWeight: 'bold' }, label),

      warnings.length === 0 ? null : h(Warnings, { warnings }),

      summary,

      ...items.map(item => h(Box, {
        is: 'dd',
        ml: 3,
      }, item)),
    ])
  )
}

const usedProps = R.reduce(
  (usedProps, fieldSpec) => R.union(
    usedProps, R.propOr([], 'useProps', fieldSpec)
  )
)

function FieldList (fieldSpecs) {
  return props => {
    const { value, compare } = props
        , fields = fieldsExtractor(fieldSpecs, props)
        , omitProps = usedProps([ 'value', 'compare' ], fieldSpecs)

    const childProps = Object.assign(R.omit(omitProps, props), {
      is: 'dl',
    })

    return (
      h(Box, childProps, [
        compare
          ? showChanges(Field)(findChanges(fields(value), fields(compare)))
          : R.map(show(Field), fields(value)),
      ])
    )
  }
}

module.exports = { extract, extractIndexedValues, FieldList, extractWithKey }

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('../Base')
    , { PrimitiveValue, show } = require('./Value')
    , { InfoText, WarnText } = require('../Typography')
    , { Change, isIdentified } = require('./types')
    , { findChanges, showChanges } = require('./Diff')


function extract(path, opts={}) {
  const { withKey, indexed=false } = opts

  path = [].concat(path)

  return item => {
    const defaultValue = indexed ? {} : []
        , extracted = R.pathOr(defaultValue, path, item)

    if (indexed) {
      const ret = {}

      Object.entries(extracted).forEach(([ k, v ]) => {
        ret[k] = v
      })

      return ret
    } else {
      let ret = [].concat(extracted)

      if (withKey) {
        ret = ret.map((value, i) =>
          isIdentified(value)
            ? value
            : {
              id: i,
              [withKey]: value,
            })
      }

      return ret
    }
  }
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
    checkRequired(isRequired, values),
    checkImmutable(isImmutable, values, comparedValues)
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
    R.merge({
      added: 0,
      deleted: 0,
      changed: 0,
      unchanged: 0,
    })
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

function processFieldSpec(fieldSpecs, props) {
  return function fieldsFor(item) {
    const fields = []

    fieldSpecs.forEach(fieldSpec => {
      const { getValues, useProps=[], ...field } = fieldSpec
          , values = getValues(item)

      field.id = fieldSpec.label
      field.values = values

      useProps.forEach(prop => {
        field[prop] = props[prop]
      })

      if (field.required || field.values.length > 0) {
        fields.push(field)
      }
    })

    return fields
  }
}

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
      h(Box, {
        is: 'dt',
        fontWeight: 'bold',
      }, label),

      warnings.length === 0 ? null : h(Warnings, { warnings }),

      summary,

      ...items.map(item => h(Box, {
        is: 'dd',
        ml: 3,
      }, item)),
    ])
  )
}

function DiffableItem (props) {
  const { fieldList, value, compare, ...rest } = props
      , fieldsFor = processFieldSpec(fieldList, {
        value,
        compare,
        ...rest,
      })

  // Don't include props only meant for fields on the outer Box, but include
  // everything else (e.g. for styling or event handling)
  const outerProps = R.omit(
    [ 'value', 'compare' ].concat(fieldList.map(f => f.usedProps)),
    props
  )

  outerProps.is = 'dl'

  let children

  if (compare) {
    const changes = findChanges(fieldsFor(value), fieldsFor(compare))

    children = showChanges(Field)(changes)
  } else {
    children = fieldsFor(value).map(f => show(Field)(f))
  }

  return (
    h(Box, outerProps, children)
  )
}

module.exports = {
  extract,
  DiffableItem,
}

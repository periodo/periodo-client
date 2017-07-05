"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')

const hasID = R.ifElse(
  R.is(Object),       // don't treat @context.id as an id
  R.both(R.has('id'), R.complement(R.propEq('id', '@id'))),
  R.F
)

const wrapAnonymousValues = R.addIndex(R.map)(
  (v, i) => hasID(v) ? v : ({id: i, wrapped: v})
)

const unwrapAnonymousValue = v => R.propOr(v, 'wrapped', v)

const equalByIDOrValue = R.curry((x, y) => {
  if (hasID(x) && hasID(y)) {
    return R.equals(x.id, y.id)
  } else {
    return R.equals(x, y)
  }
})

const compareLists = R.curry((diffInside, a, b) => {
  const listA = diffInside ? wrapAnonymousValues(a) : a
      , listB = b
          ? diffInside ? wrapAnonymousValues(b) : b
          : listA
  return R.map(
    value => {
      const changed = R.find(equalByIDOrValue(value), listB)
      const o = {
        value: unwrapAnonymousValue(value),
        added:   R.none(equalByIDOrValue(value), listA),
        deleted: R.none(equalByIDOrValue(value), listB)
      }
      return diffInside
        ? R.assoc('changed', unwrapAnonymousValue(changed), o)
        : o
    },
    R.unionWith(equalByIDOrValue, listA, listB)
  )
})

const compareImmutableValues = compareLists(false)

const compareMutableValues = compareLists(true)

const removeUnchanged = R.reject(
  ({ value, changed }) => R.equals(value, changed)
)

const color = ({ deleted, added }) => deleted
  ? Diff.colors.delete
  : added ? Diff.colors.insert : null

const ensureProps = R.ifElse(
  R.is(Object),
  R.identity,
  R.objOf('text')
)

const showChanges = component => R.addIndex(R.map)(
  ({ deleted, added, value, changed }, i) => h(
    component,
    R.mergeAll([
      ensureProps(value),
      { key: `v${i}`
      , backgroundColor: color({ deleted, added })
      },
      changed ? { changed } : {}
    ])
  )
)

const Message = props => Box(
  R.merge(props, { color: 'darkgray', css: {fontStyle: 'italic'} })
)

function Problems(props) {
  const { problems } = props
  return h(
    Box,
    R.merge(
      R.omit(['problems'], props),
      { color: 'red', css: {fontStyle: 'italic'} }
    ),
    R.map(problem => h(Box, {}, `Warning: ${problem}`), problems)
  )
}

const check = isImmutable => isRequired => values => changed => {
  const problems = []
  if (isImmutable && ! R.equals(values, changed.values)) {
    problems.push('changing immutable field')
  }
  if (isRequired && R.isEmpty(changed.values)) {
    problems.push('missing required value')
  }
  return problems
}

const wrap = props => R.map(x => h(Box, props, x))

const countChanges = R.reduce(
  (counts, { added, deleted, value, changed }) => {
    if (added) {
      return R.assoc('added', counts.added + 1, counts)
    }
    if (deleted) {
      return R.assoc('deleted', counts.deleted + 1, counts)
    }
    if (R.equals(value, changed)) {
      return R.assoc('unchanged', counts.unchanged + 1, counts)
    }
    else {
      return R.assoc('changed', counts.changed + 1, counts)
    }
  },
  { added: 0, deleted: 0, changed: 0, unchanged: 0 }
)

const formatCounts = counts => `
 ${counts.deleted} deleted,
 ${counts.added} added,
 ${counts.changed} changed,
 and ${counts.unchanged} unchanged
 ${counts.unchanged > 0 ? '(not shown)' : ''}
`

function Field(props) {
  const {
    label,
    values,
    valueComponent = Diff,
    changed = {},
    diffInside = false,
    required = false,
    immutable = false,
    hidden = false,
    hideUnchanged = false,
  } = props

  const problems = check(immutable)(required)(values)(changed)
  const hide = hidden && R.isEmpty(problems)
  const comparison = compareLists(diffInside)(values, changed.values)
  const counts = countChanges(comparison)
  const didChange = counts.unchanged < comparison.length
  const summarizeChanges = (didChange && hideUnchanged) ? true : false
  const changes = (didChange && hideUnchanged)
    ? removeUnchanged(comparison)
    : comparison

  return h(
    Box,
    R.mergeAll(
      [
        R.omit(
          [ 'label', 'values', 'valueComponent', 'changed',
            'required', 'immutable', 'hidden', 'diffInside', 'hideUnchanged' ],
          props
        ),
        { mt: 1 },
        hide ? { css: {display: 'none'} } : {},
      ]
    ),
    [
      h(Box, { is: 'dt', bold: true }, label),

      problems.length ? h(Problems, { problems }) : null,

      summarizeChanges ? h(Message, {}, formatCounts(counts)) : null,

      ...wrap({ is: 'dd', ml: 1 })(showChanges(valueComponent)(changes))
    ]
  )
}

function FieldList(props) {
  const { fields, changed = {} } = props
  return h(
    Box,
    R.merge(R.omit(['fields', 'changed'], props), { is: 'dl' }),
    showChanges(Field)(compareMutableValues(fields, changed.fields))
  )
}

const resolve = fieldSpec => R.pipe(
  fieldSpec.values,
  values => R.assoc('values', values, fieldSpec),
)

const assignFieldID = spec => R.assoc('id', spec.label, spec)

const getFields = fieldSpecs => R.pipe(
  R.of,
  R.ap(R.map(resolve, R.map(assignFieldID, fieldSpecs))),
  R.filter(({required, values}) => required || values.length > 0),
)

module.exports = {
  FieldList,
  compareLists,
  compareImmutableValues,
  equalByIDOrValue,
  getFields,
  hasID,
  showChanges,
}

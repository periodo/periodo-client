"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , DMP = require('diff-match-patch')
    , { Box } = require('../Base')
    , { Value, Change, valueEquality } = require('./types')

const dmp = new DMP()

const colors = {
  insert: '#e4ffee',
  delete: '#ffeef0',
}

const styles = {
  [DMP.DIFF_INSERT]: {
    backgroundColor: colors.insert,
  },
  [DMP.DIFF_DELETE]: {
    backgroundColor: colors.delete,
  },
}


function Diff(props) {
  const { value, compare, ...childProps } = props
      , diffs = dmp.diff_main(value + '', compare + '')

  dmp.diff_cleanupSemantic(diffs)

  childProps.is = 'span'

  return (
    h(Box, childProps, diffs.map(([ operation, string ]) =>
      h('span', {
        style: styles[operation],
      }, string)
    ))
  )
}

const mergeObjects = R.reduce(R.mergeDeepRight, {})

const findChanges = (valuesA, valuesB) => R.reduce(
  (changes, value) => {
    const equivalentsA = R.filter(valueEquality(value), valuesA)
        , equivalentsB = R.filter(valueEquality(value), valuesB)

    return Value.case({
      Anonymous: v => {
        const countA = R.length(equivalentsA)
            , countB = R.length(equivalentsB)
            , difference = countB - countA
        return changes.concat(
          Array(Math.min(countA, countB))
            .fill(Change.Preservation(v)),
          Array(Math.abs(difference))
            .fill(difference > 0 ? Change.Addition(v) : Change.Deletion(v))
        )
      },
      Identified: v => {
        const objA = mergeObjects(R.map(v => v[0], equivalentsA))
            , objB = mergeObjects(R.map(v => v[0], equivalentsB))
            , change =
                ( R.isEmpty(objA)      ? Change.Addition(v)
                : R.isEmpty(objB)      ? Change.Deletion(v)
                : R.equals(objA, objB) ? Change.Preservation(v)
                                       : Change.Mutation(objA, objB)
                )
        return R.append(change, changes)
      },
    }, value)
  },
  [],
  R.unionWith(valueEquality, valuesA, valuesB)
)

const showChanges = component => R.map(
  Change.case({
    Preservation:
      value => h(component, { value }),
    Mutation:
      (value, compare) => h(component, { value, compare }),
    Addition:
      value => h(component, { value, bg: colors.insert }),
    Deletion:
      value => h(component, { value, bg: colors.delete }),
  })
)

module.exports = { Diff, findChanges, showChanges }

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , DMP = require('diff-match-patch')
    , { Box } = require('../Base')
    , { isIdentified, Change, valueEquals } = require('./types')

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

function mergeDeepAll(objects) {
  return objects.reduce(
    (acc, obj) => R.mergeDeepRight(acc, obj),
    {})
}

function findChanges(valuesA, valuesB) {
  const allValues = R.unionWith(valueEquals, valuesA, valuesB)

  return allValues.reduce((acc, value) => {
    const matchingValues = v => valueEquals(v, value)
        , equivalentsA = valuesA.filter(matchingValues)
        , equivalentsB = valuesB.filter(matchingValues)

    if (isIdentified(value)) {
      const objA = mergeDeepAll(equivalentsA)
          , objB = mergeDeepAll(equivalentsB)

      let change

      if (R.isEmpty(objA)) {
        change = Change.Addition(value)
      } else if (R.isEmpty(objB)) {
        change = Change.Deletion(value)
      } else if (R.equals(objA, objB)) {
        change = Change.Preservation(value)
      } else {
        change = Change.Mutation(objA, objB)
      }

      return [...acc, change]
    } else {
      const countA = R.length(equivalentsA)
          , countB = R.length(equivalentsB)
          , difference = countB - countA
      return acc.concat(
        Array(Math.min(countA, countB))
          .fill(Change.Preservation(value)),
        Array(Math.abs(difference))
          .fill(difference > 0 ? Change.Addition(value) : Change.Deletion(value))
      )
    }
  }, [])
}

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

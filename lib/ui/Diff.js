"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , DMP = require('diff-match-patch')
    , { Box } = require('axs-ui')

const dmp = new DMP()

const colors = {insert: '#e4ffee', delete: '#ffeef0'}

const styles =
  { [DMP.DIFF_INSERT]: { backgroundColor: colors.insert }
  , [DMP.DIFF_DELETE]: { backgroundColor: colors.delete }
  }

const diff = (a, b) => {
  const diffs = dmp.diff_main(a + '', b + '')
  dmp.diff_cleanupSemantic(diffs)
  return diffs
}

const format = ([operation, string]) => h(
  Box,
  R.merge({ is: 'span'}, styles[operation] || {}),
  string
)

function Diff(props) {
  const { pair } = props
  return h(
    Box,
    R.merge(R.omit(['pair'], props), { is: 'span' }),
    diff(...pair).map(format),
  )
}

const fn = Diff
fn.colors = colors

exports.Diff = fn

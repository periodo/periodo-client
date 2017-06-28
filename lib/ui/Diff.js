"use strict";

const h = require('react-hyperscript')
    , DMP = require('diff-match-patch')
    , { Span } = require('axs-ui')

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

const format = ([operation, string]) => h(Span, styles[operation] || {}, string)

function Diff({ pair }) {
  return h(Span, diff(pair[0], pair[1]).map(format))
}

const fn = Diff
fn.colors = colors

exports.Diff = fn

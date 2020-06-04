"use strict";

const h = require('react-hyperscript')
    , Type = require('union-type')
    , { Box } = require('./Base')

const PatchStatus = Type({
  Open: {},
  Rejected: {},
  Merged: {},
})

function Status({ open, merged }) {
  let type

  if (open) {
    type = PatchStatus.Open
  } else if (merged) {
    type = PatchStatus.Merged
  } else {
    type = PatchStatus.Rejected
  }

  const bg = type.case({
    Open: () => '#fafad2',
    Rejected: () => '#ff9a9a',
    Merged: () => '#8fbd8f',
  })

  const label =  type.case({
    Open: () => 'Open',
    Rejected: () => 'Rejected',
    Merged: () => 'Merged',
  })

  return (
    h(Box, {
      sx: {
        textAlign: 'center',
        p: 1,
        bg,
        fontWeight: 'bold',
      },
    }, label)
  )
}

exports.Status = Status

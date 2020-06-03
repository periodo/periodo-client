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

  const type = PatchStatus[open ? 'Open' : merged ? 'Merged' : 'Rejected']

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
      textAlign: 'center',
      p: 1,
      bg,
      fontWeight: 'bold',
    }, label)
  )
}

exports.Status = Status

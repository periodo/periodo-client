"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, DropdownMenu, DropdownMenuItem } = require('periodo-ui')

function ColumnSelector({ columns, shownColumns, updateOpts, ...props }) {

  const toggleColumn = key => () => {
    updateOpts(opts =>
      R.over(
        R.lensProp('shownColumns'),
        (shownColumns.includes(key)
          ? R.without
          : R.flip(R.union)
        )([ key ]),
        opts
      )
    )
  }

  return h(Box, props, [
    h(DropdownMenu, {
      closeOnSelection: false,
      openLeft: true,
      label: 'Columns',
    }, Object.keys(columns).map(key =>
      h(DropdownMenuItem, {
        key,
        textAlign: 'left',
        onClick: toggleColumn(key),
      }, [
        h('input', {
          type: 'checkbox',
          checked: shownColumns.includes(key),
          onChange: toggleColumn(key),
        }),

        columns[key].label,
      ])
    )),
  ])
}

module.exports = ColumnSelector

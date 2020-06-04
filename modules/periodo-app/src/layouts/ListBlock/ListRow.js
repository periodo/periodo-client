"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text, Link } = require('periodo-ui')

function ListRow({
  item,
  index,
  start,
  columns,
  shownColumns,
  backend,
  itemViewRoute,
  itemEditRoute,
}) {
  return h(Box, {
    as: 'tr',
    key: item.id,
    m: 0,
    bg: 'gray.1',
    css: {
      ':hover': { backgroundColor: 'white' },
    },
  }, [
    h(Box, {
      as: 'td',
      key: '_numbering',
      p: 2,
      verticalAlign: 'middle',
      css: { whiteSpace: 'nowrap' },
    }, [
      h(Text, {
        display: 'inline-block',
        color: 'gray.6',
        width: '4ch',
        textAlign: 'right',
      }, index + 1 + start),

      h(Link, {
        ml: 2,
        fontWeight: 100,
        route: itemViewRoute(item, { backend }),
      }, 'view'),

      backend.isEditable() && itemEditRoute
        ? (
          h(Link, {
            ml: 2,
            fontWeight: 100,
            route: itemEditRoute(item, { backend }),
          }, 'edit')
        )
        : null,
    ]),
  ].concat(R.values(R.pick(shownColumns, columns)).map(
    col => h(Box, {
      as: 'td',
      key: col.label,
      p: 2,
      verticalAlign: 'middle',
    }, (col.render || R.identity)(col.getValue(item)))
  )))
}

module.exports = ListRow

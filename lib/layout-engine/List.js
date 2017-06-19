"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , Consumer = require('./Consumer')
    , concat = [].concat.bind([])


module.exports = function makeList(label, description, defaultOpts, xf, columns) {
  const deriveOpts = (opts={}) => R.merge(defaultOpts, opts)

  const next = (prev, items) => {
    return R.transduce(
      xf,
      concat,
      prev || [],
      items
    )
  }

  const Component = Consumer(next, Infinity, props => {
    const items = props.data
        , { start, limit, shownColumns } = props

    const shownItems = items.slice(start, limit)

    return (
      h(Box, [
        (items.length === 0 && props.finished)
          ? 'No matched periods.'
          : `${start + 1}‒${start + shownItems.length} of ${items.length}`,

        h('table', { width: '100%' }, [
          h('colgroup', shownColumns.map(() => h('col', {
            width: `${100 / shownColumns.length}%`
          }))),

          h('thead', [
            h('tr', shownColumns.map(n => h('th', { key: n, }, columns[n].label)))
          ]),


          h('tbody',
            shownItems.map(
              item => h(Box, {
                is: 'tr',
                key: item.id,
                css: {
                  ':hover': {
                    backgroundColor: '#e4e2e0',
                  }
                }
              }, R.values(R.pick(shownColumns, columns)).map(
                col =>
                  h('td', { key: col.label }, col.getValue(item, props.backend))
              ))
            )
          )
        ])
      ])
    )
  })

  return {
    label,
    description,
    Component,
    deriveOpts,
  }
}

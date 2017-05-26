"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')
    , { Box } = require('axs-ui')
    , columns = require('./columns')
    , Hoverable = require('../../utils/Hoverable')
    , Consumer = require('../Consumer')

exports.label = 'Period List';

exports.description = 'Selectable list of periods.';

/*
exports.filterItems = function (getRecord, opts) {
  const ids = opts.get('selectedPeriodIDs')

  return period => ids.size ? ids.includes(period.get('id')) : true
}
*/

exports.defaultOpts = {
  limit: 20,
  start: 0,
  selectedPeriodIDs: Immutable.List(),
  shownColumns: Immutable.OrderedSet(['label', 'start', 'stop']),
}

const ListRow = Hoverable(props =>
  h(Box, {
    is: 'tr',
    bg: props.hovered ? '#e4e2e0' : undefined,
  }, props.columns.map(col =>
    h('td', { key: col.label }, col.getValue(props.period))
  ))
)

exports.renderer = Consumer('period', 500, props => {
  const start = 0
      , limit = 50
      , periods = props.period

  const shownPeriods = periods.slice(0, 50)

  const shownColumns = ['label', 'spatialCoverage']

  return (
    h(Box, [
      periods.length === 0
        ? 'No matched periods.'
        : `${start + 1}‒${start + shownPeriods.length} of ${periods.length}`,

      h('table', { width: '100%' }, [
        h('colgroup', shownColumns.map(() => h('col', {
          width: `${100 / shownColumns.length}%`
        }))),

        h('thead', [
          h('tr', shownColumns.map(n => h('th', { key: n, }, columns[n].label)))
        ]),


        shownPeriods.map(period => [
          h('tbody', [
            h(ListRow, {
              key: period.id,
              period,
              columns: shownColumns.map(name => columns[name]),
              /*
              onClick: () => updateOpts(opts =>
                opts.update(
                  'selectedPeriodIDs',
                  Immutable.List(),
                  ids => {
                    const id = period.get('id')
                        , idx = ids.indexOf(id)

                    return idx === -1 ? ids.push(id) : ids.delete(idx)
                  })),
              */
            })
          ])
        ])
      ])

    ])
  )
})

/*
    const { data, updateOpts, selectedPeriodIDs, start, limit, shownColumns } = this.props

    const periods = data.get('periodCollections')
      .flatMap(c => c.get('definitions'))

    const shownPeriods = periods
      .skip(start)
      .take(limit)
      .toArray()

    return (
      h('div', [
        h('div', [
          periods.size === 0
            ? 'No matched periods.'
            : `${start + 1}‒${start + limit} of ${periods.size}`,

          h(Button, {
            onClick: () => {
              updateOpts(opts =>
                opts.update('start', s => (s - limit < 0) ? 0 : s - limit))
            }
          }, '<'),

          h(Button, {
            onClick: () => {
              updateOpts(opts =>
                opts.update('start', s => (s + limit > periods.size) ? s : s + limit))
            }
          }, '>'),
        ]),

      ])
    )
  }
})
*/

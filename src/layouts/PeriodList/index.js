"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Immutable = require('immutable')
    , { Box } = require('axs-ui')
    , columns = require('./columns')
    , Consumer = require('../Consumer')
    , { periodsWithAuthority } = require('../../util/authority')


exports.filterItems = function (getRecord, opts) {
  const ids = opts.selectedPeriodIDs || []

  return period => ids.length ? ids.includes(period.get('id')) : true
}

exports.defaultOpts = {
  limit: 20,
  start: 0,
  selectedPeriodIDs: Immutable.List(),
  shownColumns: Immutable.OrderedSet(['label', 'start', 'stop']),
}

const ListRow = props =>
  h(Box, {
    is: 'tr',
    css: {
      ':hover': {
        backgroundColor: '#e4e2e0',
      }
    }
  }, props.columns.map(col =>
    h('td', { key: col.label }, col.getValue(props.period))
  ))


const next = (prev, items) => {
  return R.transduce(
    R.map(periodsWithAuthority),
    R.concat,
    prev || [],
    items
  )
}


const PeriodList = Consumer(next, Infinity, props => {
  const periods = props.data
      , start = 0
      , limit = 50

  const shownPeriods = periods.slice(start, limit)

  const shownColumns = ['label', 'spatialCoverage', 'source']

  return (
    h(Box, [
      (periods.length === 0 && props.finished)
        ? 'No matched periods.'
        : `${start + 1}‒${start + shownPeriods.length} of ${periods.length}`,

      h('table', { width: '100%' }, [
        h('colgroup', shownColumns.map(() => h('col', {
          width: `${100 / shownColumns.length}%`
        }))),

        h('thead', [
          h('tr', shownColumns.map(n => h('th', { key: n, }, columns[n].label)))
        ]),


        h('tbody',
          shownPeriods.map(period => [
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
        )
      ])

    ])
  )
})

exports.handler = {
  label: 'Period List',
  description: 'Selectable list of periods.',
  Component: PeriodList
}


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

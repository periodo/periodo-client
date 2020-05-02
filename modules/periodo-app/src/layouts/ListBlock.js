"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , natsort = require('natsort')
    , { Flex, Box, Text, Link, Pager, PagerControls } = require('periodo-ui')
    , { DropdownMenu, DropdownMenuItem } = require('periodo-ui')


function Counter({ start, total, shown }) {
  return h(Box, {
    textAlign: 'left',
    flex: '1 1 auto',
  }, [
    shown === 0
      ? null
      : h(Text,
        { mx: 2 },
        `${ start + 1 }–${ start + shown } of ${ total }`
      ),
  ])
}

function ColumnSelector({ columns, shownColumns, updateOpts }) {
  return h(Box, {
    textAlign: 'right',
    flex: '1 1 auto',
  }, [
    h(DropdownMenu, {
      closeOnSelection: false,
      openLeft: true,
      label: 'Columns',
    }, Object.keys(columns).map(key =>
      h(DropdownMenuItem, {
        key,
        textAlign: 'left',
      }, [
        h('input', {
          type: 'checkbox',
          checked: shownColumns.includes(key),
          onChange: () => {
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
          },
        }),

        columns[key].label,
      ])
    )),
  ])
}

function ListHeader({
  start,
  limit,
  total,
  shown,
  columns,
  shownColumns,
  toPrevPage,
  toNextPage,
  toFirstPage,
  toLastPage,
  updateOpts,
}) {
  return h(Flex, {
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 3,
  }, [

    h(Counter, {
      start,
      total,
      shown,
    }),

    h(PagerControls, {
      start,
      limit,
      total,
      shown,
      toFirstPage,
      toPrevPage,
      toNextPage,
      toLastPage,
      updateOpts,
    }),

    h(ColumnSelector, {
      columns,
      shownColumns,
      updateOpts,
    }),
  ])
}

module.exports = function makeList(opts) {
  const {
    label,
    description,
    defaultOpts={},
    columns,
    itemViewRoute,
    itemEditRoute,
  } = opts

  const withDefaults = obj => ({
    start: 0,
    limit: 25,
    shownColumns: Object.keys(columns),
    ...defaultOpts,
    ...obj,
  })

  class List extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        sortedData: null,
      }
    }

    componentDidUpdate(prevProps) {
      const updateSort = (
        prevProps.sortBy !== this.props.sortBy ||
        prevProps.sortDirection !== this.props.sortDirection ||
        prevProps.data !== this.props.data
      )

      if (updateSort) {
        this.updateSort()
      }
    }

    async updateSort() {
      const { sortBy, sortDirection, data } = this.props
          , column = columns[sortBy]

      if (column) {
        if (column.sort) {
          const sortedData = await column.sort(data, this.props)
          this.setState({ sortedData })
        } else {
          const sorter = natsort({
            insensitive: true,
            desc: sortDirection === 'desc',
          })

          const sortedData = [ ...data ].sort((a, b) => {
            let [ _a, _b ] = [ a, b ]
              .map(column.getValue)

            if (column.getSortValue) {
              [ _a, _b ] = [ _a, _b ].map(column.getSortValue)
            }

            if (_a == null) return 1
            if (_b == null) return -1

            return sorter(_a, _b)
          })

          this.setState({ sortedData })
        }
      } else {
        this.setState({ sortedData: data })
      }
    }

    render() {
      const {
        backend,
        shownColumns,
        sortBy,
        sortDirection,
        opts: { limit },
        updateOpts,
      } = this.props

      const { sortedData: items } = this.state
          , total = items ? items.length : 0

      return h(Pager, {
        total,
        limit,
        render({
          start,
          limit,
          shown,
          toPrevPage,
          toNextPage,
          toFirstPage,
          toLastPage,
        }) {

          return (
            h(Box, {
              tabIndex: 0,
              onKeyDown: e => {
                if (e.key === 'ArrowLeft') toPrevPage();
                if (e.key === 'ArrowRight') toNextPage();
              },
            }, [
              h(ListHeader, {
                start,
                limit,
                total,
                shown,
                columns,
                shownColumns,
                toPrevPage,
                toNextPage,
                toFirstPage,
                toLastPage,
                updateOpts,
              }),

              h(Box, {
                is: 'table',
                minHeight: limit * 34,
                css: {
                  tableLayout: 'fixed',
                  width: '100%',
                  borderCollapse: 'collapse',
                },
              }, [

                h(Box, {
                  is: 'thead',
                  mb: 1,
                }, [
                  h(Box, {
                    is: 'tr',
                    bg: 'gray.1',
                    textAlign: 'left',
                  }, [
                    h(Box, {
                      is: 'th',
                      key: 'first',
                      style: {
                        width: backend.isEditable()
                          ? '112px'
                          : '80px',
                      },
                    }),
                  ].concat(shownColumns.map(n =>
                    h(Box, {
                      is: 'th',
                      key: n,
                      p: 2,
                      fontWeight: 'bold',
                      style: {
                        width: columns[n].width || 'unset',
                        cursor: 'pointer',
                      },
                      onClick: () => {
                        updateOpts((opts={}) => ({
                          ...opts,
                          sortBy: n,
                          sortDirection: opts.sortBy === n
                            ? (
                              !opts.sortDirection ||
                              opts.sortDirection === 'asc'
                            )
                              ? 'desc' : 'asc'
                            : 'asc',
                        }))
                        toFirstPage()
                      },
                    }, [
                      columns[n].label,
                      n === sortBy && (
                        sortDirection === 'desc' ? '▲' : '▼'
                      ),
                    ])
                  ))),
                ]),

                h('tbody',
                  (items || []).slice(start, start + shown).map(
                    (item, i) => h(Box, {
                      is: 'tr',
                      key: item.id,
                      m: 0,
                      bg: 'gray.1',
                      css: {
                        ':hover': {
                          backgroundColor: 'white',
                        },
                      },
                    }, [
                      h(Box, {
                        is: 'td',
                        key: '_numbering',
                        p: 2,
                        verticalAlign: 'middle',
                        css: {
                          whiteSpace: 'nowrap',
                        },
                      }, [
                        h(Text, {
                          display: 'inline-block',
                          color: 'gray.6',
                          width: '4ch',
                          textAlign: 'right',
                        }, i + 1 + start),
                        h(Link, {
                          ml: 2,
                          fontWeight: 100,
                          route: itemViewRoute(item, { backend }),
                        }, 'view'),
                        (
                          backend.isEditable() && itemEditRoute
                            ? (
                              h(Link, {
                                ml: 2,
                                fontWeight: 100,
                                route: itemEditRoute(item, { backend }),
                              }, 'edit')
                            )
                            : null
                        ),
                      ]),
                    ].concat(R.values(R.pick(shownColumns, columns)).map(
                      col => h(Box, {
                        is: 'td',
                        key: col.label,
                        p: 2,
                        verticalAlign: 'middle',
                      }, (col.render || R.identity)(col.getValue(item)))
                    ))
                    )
                  )
                ),
              ]),

              items && shown > 0 ? null : (
                h(Text, {
                  align: 'center',
                  fontSize: 4,
                  p: 2,
                }, 'No items to display')
              ),

              items ? null : (
                h(Text, {
                  align: 'center',
                  fontSize: 4,
                  p: 2,
                }, 'Loading...')
              ),
            ])
          )
        },
      })
    }
  }

  return {
    label,
    description,
    processOpts: withDefaults,
    defaultOpts,
    Component: List,
  }
}

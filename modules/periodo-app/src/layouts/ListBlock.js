"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , natsort = require('natsort')
    , { Flex, Box, Text, Select, Link } = require('periodo-ui')
    , { Button, DropdownMenu, DropdownMenuItem } = require('periodo-ui')
    , Icon = require('react-geomicons').default

const ListHeader = ({
  start,
  shownItems,
  items,
  loaded,
  limit,
  columns,
  shownColumns,
  prevPage,
  nextPage,
  firstPage,
  lastPage,
  updateOpts,
}) =>
  h(Flex, {
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 3,
  }, [
    h(Box, {
      textAlign: 'left',
      flex: '1 1 auto',
    }, [
      (!loaded || shownItems.length === 0) ? null : h(Text, {
        mx: 2,
      }, `${start + 1}–${start + shownItems.length} of ${items.length}`),
    ]),

    h(Flex, {
      justifyContent: 'center',
      flex: '1 1 auto',
    }, [
      h(Button, {
        borderRadius: 0,
        disabled: start === 0,
        onClick: firstPage,
      }, h(Icon, {
        onMouseDown: e => {
          if (start === 0) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        name: 'previous',
        color: 'black',
      })),

      h(Button, {
        borderRadius: 0,
        disabled: start === 0,
        onClick: prevPage,
        ml: '-1px',
      }, h(Icon, {
        onMouseDown: e => {
          if (start === 0) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        name: 'triangleLeft',
        color: 'black',
      })),

      h(Select, {
        bg: 'gray.1',
        value: limit,
        minWidth: '60px',
        onChange: e => {
          updateOpts(R.set(
            R.lensProp('limit'),
            e.target.value
          ))
        },
      }, [ 10, 25, 50, 100, 250 ].map(n =>
        h('option', {
          key: n,
          value: n,
        }, `Show ${n}`),
      )),

      h(Button, {
        borderRadius: 0,
        disabled: !loaded || start + shownItems.length >= items.length,
        onClick: nextPage,
        mr: '-1px',
      }, h(Icon, {
        onMouseDown: e => {
          if (start + shownItems.length >= items.length) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        name: 'triangleRight',
        color: 'black',
      })),

      h(Button, {
        borderRadius: 0,
        disabled: !loaded || start + shownItems.length >= items.length,
        onClick: lastPage,
      }, h(Icon, {
        onMouseDown: e => {
          if (start + shownItems.length >= items.length) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        name: 'next',
        color: 'black',
      })),
    ]),

    h(Box, {
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
                  (shownColumns.includes(key) ? R.without : R.flip(R.union))([ key ]),
                  opts
                )
              )
            },
          }),

          columns[key].label,
        ])
      )),
    ]),
  ])

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
        start: withDefaults(props).start,
        sortedData: null,
      }

      this.firstPage = this.firstPage.bind(this);
      this.lastPage = this.lastPage.bind(this);
      this.nextPage = this.nextPage.bind(this);
      this.prevPage = this.prevPage.bind(this);
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
          this.setState({
            sortedData,
            start: 0,
          })
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

          this.setState({
            sortedData,
            start: 0,
          })
        }
      } else {
        this.setState({ sortedData: data })
      }
    }

    firstPage() {
      this.setState({ start: 0 })
    }

    lastPage() {
      const { data, limit } = this.props

      let start = 0

      while (start * limit < data.length) start++

      start--
      start = start * limit;

      this.setState({ start })
    }

    nextPage() {
      const { data } = this.props
          , limit = parseInt(this.props.limit)

      this.setState(prev => {
        let start = prev.start + limit

        if (start >= data.length) start = prev.start;

        return { start }
      })
    }

    prevPage() {
      const limit = parseInt(this.props.limit)

      this.setState(prev => {
        let start = prev.start - limit

        if (start < 0) start = 0;

        return { start }
      })
    }

    render() {
      const { shownColumns, sortBy, sortDirection, updateOpts } = this.props
          , limit = parseInt(this.props.limit)
          , { start, sortedData: items } = this.state
          , shownItems = (items || []).slice(start, start + limit)
          , loaded = items != null

      return (
        h(Box, {
          tabIndex: 0,
          onKeyDown: e => {
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
          },

          style: {
            minHeight: limit * 24,
          },
        }, [
          h(ListHeader, {
            items,
            limit,
            shownItems,
            loaded,
            prevPage: this.prevPage,
            nextPage: this.nextPage,
            firstPage: this.firstPage,
            lastPage: this.lastPage,
            columns,
            shownColumns,
            ...this.props,
            ...this.state,
          }),

          h(Box, {
            is: 'table',
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
                    width: this.props.backend.isEditable() ? '112px' : '80px',
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
                        ?  (!opts.sortDirection || opts.sortDirection === 'asc') ? 'desc' : 'asc'
                        : 'asc',
                    }))
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
              shownItems.map(
                (item, i) => h(Box, {
                  is: 'tr',
                  key: item.id,
                  m: 0,
                  bg: 'gray.1',
                  css: {
                    height: '24px',
                    ':hover': {
                      backgroundColor: 'white',
                    },
                  },
                }, [
                  h(Box, {
                    is: 'td',
                    key: '_numbering',
                    p: 2,
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
                      route: itemViewRoute(item, this.props),
                    }, 'view'),
                    (
                      this.props.backend.isEditable() && itemEditRoute
                        ? (
                          h(Link, {
                            ml: 2,
                            fontWeight: 100,
                            route: itemEditRoute(item, this.props),
                          }, 'edit')
                        )
                        : null
                    ),
                  ]),
                ].concat(R.values(R.pick(shownColumns, columns)).map(
                  col =>
                    h(Box, {
                      is: 'td',
                      key: col.label,
                      p: 2,
                      css: {
                      },
                    }, (col.render || R.identity)(
                      col.getValue(item)
                    ))
                ))
                )
              )
            ),
          ]),

          !(loaded && shownItems.length === 0) ? null : (
            h(Text, {
              align: 'center',
              fontSize: 4,
              p: 2,
            }, 'No items to display')
          ),

          loaded ? null : (
            h(Text, {
              align: 'center',
              fontSize: 4,
              p: 2,
            }, 'Loading...')
          ),
        ])
      )
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

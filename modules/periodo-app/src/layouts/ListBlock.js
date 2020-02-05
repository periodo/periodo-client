"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , natsort = require('natsort')
    , { Flex, Box, Text, Select } = require('periodo-ui')
    , { colors } = require('periodo-ui').theme
    , { Button, DropdownMenu, DropdownMenuItem, Link } = require('periodo-ui')
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
    bg: 'gray.1',
    p: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  }, [
    h(Box, {
      textAlign: 'left',
      flex: '1 1 auto',
    }, [
      (!loaded || shownItems.length === 0) ? null : h(Text, {
        mx: 2,
      }, `${start + 1}‒${start + shownItems.length} of ${items.length}`),
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
        bg: '#fafafa',
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
        }, n),
      )),

      h(Button, {
        borderRadius: 0,
        disabled: !loaded || start + shownItems.length >= items.length,
        onClick: nextPage,
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

function DefaultRowNumbering({ number }) {
  return h(Box, {
    px: 1,
    css: {
      color: '#999',
      display: 'inline-block',
      fontSize: '12px',
      lineHeight: '24px',
      width: '5ch',
    },
  }, number)
}

function LinkedRowNumbering(props) {
  return (
    h(Link, {
      px: 1,
      css: {
        display: 'inline-block',
        fontSize: '12px',
        lineHeight: '24px',
        width: '5ch',
        ':hover': {
          textDecoration: 'none',
          backgroundColor: colors.blue5,
          color: 'white',
        },
      },
      route: props.makeItemRoute(props),
    }, props.number)
  )
}

module.exports = function makeList(opts) {
  const {
    label,
    description,
    defaultOpts={},
    columns,
    makeItemRoute,
    navigateToItem,
  } = opts

  const withDefaults = obj => ({
    start: 0,
    limit: 25,
    shownColumns: Object.keys(columns),
    ...defaultOpts,
    ...obj,
  })

  const RowNumbering = makeItemRoute ? LinkedRowNumbering : DefaultRowNumbering

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
                  p: 1,
                  style: {
                    width: '42px',
                  },
                }),
              ].concat(shownColumns.map(n =>
                h(Box, {
                  is: 'th',
                  key: n,
                  p: 1,
                  style: {
                    width: columns[n].width || 'unset',
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
                  css: {
                    height: '24px',
                    ':hover': {
                      backgroundColor: '#e4e2e0',
                    },
                  },
                  ...(!navigateToItem ? null : {
                    role: 'link',
                    tabIndex: 0,
                    style: {
                      cursor: 'pointer',
                    },
                    onClick: e => {
                      if (e.target.tagName === 'A') return true
                      navigateToItem(item, this.props)
                    },
                    onKeyDown: e => {
                      if (e.key === 'Enter') {
                        navigateToItem(item, this.props)
                      }
                    },
                  }),
                }, [
                  h(Box, {
                    is: 'td',
                    key: '_numbering',
                    p: 0,
                    css: {
                      width: '.1%',
                      whiteSpace: 'nowrap',
                    },
                  }, h(RowNumbering, {
                    ...this.props,
                    item,
                    number: i + 1 + start,
                    makeItemRoute,
                  })),
                ].concat(R.values(R.pick(shownColumns, columns)).map(
                  col =>
                    h(Box, {
                      is: 'td',
                      key: col.label,
                      px: 1,
                      py: 0,
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

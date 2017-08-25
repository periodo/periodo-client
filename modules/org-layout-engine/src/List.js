"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , natsort = require('natsort')
    , { Flex, Box, Text, Select } = require('axs-ui')
    , { colors } = require('axs-ui').config
    , { Button, DropdownMenu, DropdownMenuItem, Link } = require('periodo-ui')
    , Icon = require('react-geomicons').default
    , Consumer = require('./Consumer')
    , concat = [].concat.bind([])

const ListHeader = ({
  start,
  shownItems,
  hide,
  items,
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
    bg: 'gray1',
    p: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  }, [
    h(Box, { css: { textAlign: 'left', width: '33%'} }, [
      !hide && h(Text, {
        mx: 2,
      }, `${start + 1}‒${start + shownItems.length} of ${items.length}`),
    ]),

    h(Flex, { css: { justifyContent: 'center', width: '33%'} }, [
      h(Button, {
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
        onChange: e => {
          updateOpts(R.set(
            R.lensProp('limit'),
            e.target.value
          ))
        }
      }, [10, 25, 50, 100, 250].map(n =>
        h('option', { key: n, value: n, }, n),
      )),

      h(Button, {
        disabled: start + shownItems.length >= items.length,
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
        css: { borderRadius: 0 },
        disabled: start + shownItems.length >= items.length,
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

    h(Box, { css: { textAlign: 'right', width: '33%'} }, [
      h(DropdownMenu, {
        closeOnSelection: false,
        openLeft: true,
        label: 'Columns',
      }, Object.keys(columns).map(key =>
        h(DropdownMenuItem, {
          key
        }, [
          h('input', {
            type: 'checkbox',
            checked: shownColumns.includes(key),
            onChange: () => {
              updateOpts(opts =>
                R.over(
                  R.lensProp('shownColumns'),
                  (shownColumns.includes(key) ? R.without : R.flip(R.union))([key]),
                  opts
                )
              )
            }
          }),

          columns[key].label,
        ])
      ))
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
    }
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
        }
      },
      href: props.makeItemRoute(props)
    }, props.number)
  )
}

module.exports = function makeList(opts) {
  const { label, description, defaultOpts={}, transducer, columns, makeItemRoute } = opts

  const withDefaults = obj => Object.assign({
    start: 0,
    limit: 25,
    shownColumns: Object.keys(columns),
  }, defaultOpts, obj)

  const RowNumbering = makeItemRoute ? LinkedRowNumbering : DefaultRowNumbering

  const next = (prev, items, props={}) => {
    let ret = R.transduce(
      transducer || R.map(R.identity),
      concat,
      prev || [],
      items
    )

    if (props && props.sortBy) {
      const col = columns[props.sortBy]

      if (col) {
        const sorter = natsort({
          insensitive: true,
          desc: props.sortDirection === 'desc',
        })

        ret = ret.sort((a, b) => {
          const [_a, _b] = [a, b].map(col.getValue)

          if (_a == null) return 1
          if (_b == null) return -1

          return sorter(_a, _b)
        })
      }
    }

    return ret
  }

  class List extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        start: withDefaults(props).start,
      }

      this.firstPage = this.firstPage.bind(this);
      this.lastPage = this.lastPage.bind(this);
      this.nextPage = this.nextPage.bind(this);
      this.prevPage = this.prevPage.bind(this);
    }

    componentWillReceiveProps(nextProps) {
      const updateSort = (
        nextProps.sortBy !== this.props.sortBy ||
        nextProps.sortDirection !== this.props.sortDirection
      )

      if (updateSort) {
        this.props.updateData(data => next(data, [], nextProps))
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
      const items = this.props.data
          , { shownColumns, sortBy, sortDirection, updateOpts } = this.props
          , limit = parseInt(this.props.limit)
          , { start } = this.state
          , shownItems = items.slice(start, start + limit)
          , hide = shownItems.length === 0

      return (
        h(Box, {
          tabIndex: 0,
          onKeyDown: e => {
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
          }
        }, [
          h(ListHeader, Object.assign({
            hide,
            items,
            limit,
            shownItems,
            prevPage: this.prevPage,
            nextPage: this.nextPage,
            firstPage: this.firstPage,
            lastPage: this.lastPage,
            columns,
            shownColumns,
          }, this.props, this.state)),

          h(Box, {
            is: 'table',
            css: {
              width: '100%',
              borderCollapse: 'collapse',
            }
          }, [

            h(Box, {
              is: 'thead',
              mb: 1,
            }, [
              h(Box, {
                is: 'tr',
                bg: 'gray1',
                css: {
                  textAlign: 'left',
                }
              }, [
                h(Box, {
                  is: 'th',
                  key: 'first',
                  p: 1,
                })
              ].concat(shownColumns.map(n =>
                h(Box, {
                  is: 'th',
                  key: n,
                  p: 1,
                  onClick: () => {
                    updateOpts((opts={}) => Object.assign(
                      {},
                      opts,
                      {
                        sortBy: n,
                        sortDirection: opts.sortBy === n
                          ?  (!opts.sortDirection || opts.sortDirection === 'asc') ? 'desc' : 'asc'
                          : 'asc'
                      }
                    ))
                  }
                }, [
                  columns[n].label,
                  n === sortBy && (
                    sortDirection === 'desc' ? '▲' : '▼'
                  )
                ])
              )))
            ]),

            h('tbody',
              shownItems.map(
                (item, i) => h(Box, {
                  is: 'tr',
                  key: item.id,
                  m: 0,
                  css: {
                    height: 24,
                    ':hover': {
                      backgroundColor: '#e4e2e0',
                    }
                  }
                }, [
                    h(Box, {
                      is: 'td',
                      key: '_numbering',
                      p: 0,
                      css: {
                        width: '.1%',
                        whiteSpace: 'nowrap',
                      }
                    }, h(RowNumbering, Object.assign({}, this.props, {
                      item,
                      number: i + 1 + start,
                      makeItemRoute,
                    })))
                ].concat(R.values(R.pick(shownColumns, columns)).map(
                  col =>
                    h(Box, {
                      is: 'td',
                      key: col.label,
                      px: 1,
                      py: 0,
                      css: {
                      }
                    }, col.getValue(item, this.props.backend))
                  ))
                )
              )
            )
          ]),

          hide && (
            h(Text, {
              align: 'center',
              fontSize: 4,
              p: 2,
            }, 'No items to display')
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
    Component: Consumer(next, Infinity, List)
  }
}

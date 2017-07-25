"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text, Select } = require('axs-ui')
    , { Button, DropdownMenu, DropdownMenuItem, } = require('lib/ui')
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
  updateOpts,
}) =>
  h(Flex, {
    bg: 'gray1',
    p: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  }, [

    h(Flex, {
      alignItems: 'center',
    }, [
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

      !hide && h(Text, {
        mx: 2,
      }, `${start + 1}‒${start + shownItems.length} of ${items.length}`),

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
    ]),

    h(Box, [
      h(DropdownMenu, {
        css: {
          alignSelf: 'right',
        },
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

module.exports = function makeList(label, description, defaultOpts, xf, columns) {
  const processOpts = (opts={}) => R.merge(defaultOpts, opts)

  const next = (prev, items, props={}) => {
    let ret = R.transduce(
      xf,
      concat,
      prev || [],
      items
    )

    if (props && props.sortBy) {
      const col = columns[props.sortBy]

      if (col) {
        const sortFn = col.sort
          ? R.sort(col.sort.bind(null, props.sortDirection === 'desc'))
          : R.pipe(
              R.sortBy(col.getValue),
              props.sortDirection === 'desc' ? R.reverse : R.identity
            )

        ret = sortFn(ret)
      }
    }

    return ret
  }

  class List extends React.Component {
    constructor(props) {
      super(props);

      props = processOpts(props)


      this.state = {
        start: props.start,
      }

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
              }, shownColumns.map(n =>
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
              ))
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
                    h(Box, {
                      is: 'td',
                      key: col.label,
                      px: 1,
                      py: '2px',
                      css: {
                        borderTop: '1px solid #eee',
                        borderBottom: '1px solid #eee',
                      }
                    }, col.getValue(item, this.props.backend))
                  ).concat(
                    h(Box, {
                      is: 'td',
                      key: '__blank',
                      css: {
                        width: '1px',
                        borderTop: '1px solid #eee',
                        borderBottom: '1px solid #eee',
                      }
                    })
                  )
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
    processOpts,
    defaultOpts,
    Component: Consumer(next, Infinity, List)
  }
}

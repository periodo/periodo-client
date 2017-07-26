"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , Icon = require('react-geomicons').default
    , Consumer = require('./Consumer')
    , concat = [].concat.bind([])

const ListHeader = ({
  start,
  limit,
  shownItems,
  items,
  onChange,
}) =>
  h(Flex, {
    bg: 'gray1',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }, [

    h(Box, {
      is: 'a',
      href: '',
      style: {
        height: '1em',
      },
      onClick: () => {
        onChange(prev => ({
          start: prev.start - limit
        }))
      }
    }, h(Icon, { name: 'triangleLeft', color: 'black', })),

    h(Text, {
      mx: '4px',
    }, `${start + 1}‒${start + shownItems.length} of ${items.length}`),

    h(Box, {
      is: 'a',
      href: '',
      style: {
        height: '1em',
      },
      onClick: () => {
        onChange(prev => ({
          start: prev.start + limit
        }))
      }
    }, h(Icon, { name: 'triangleRight', color: 'black', })),
  ])

class ColumnSelectorButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shown: false,
      selected: props.shownColumns || [],
    }
  }

  render () {
    const { columns, shownColumns } = this.props
        , { shown } = this.state

    return (
      h(Box, {
        is: 'th',
        css: {
          position: 'relative',
        },
        p: 1,
      }, [
        h(Box, {
          is: 'button',
          onClick: () => this.setState(prev => ({ shown: !prev.shown })),
        }, '+'),

        shown && h(Box, {
          p: 1,
          css: {
            whiteSpace: 'nowrap',
            position: 'absolute',
            height: 200,
            right: 8,
            backgroundColor: 'white',
            border: '1px solid #ccc',
          }
        }, Object.keys(columns).map(key =>
          h(Box, {
            mb: 1,
            key
          }, [
            h('input', {
              type: 'checkbox',
              checked: shownColumns.includes(key),
              onChange: () => null,
            }),

            columns[key].label,
          ])
        ))
      ])
    )
  }
}

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

  class List extends React.Component {
    constructor(props) {
      super(props);

      props = deriveOpts(props)


      this.state = {
        start: props.start,
      }
    }

    render() {
      const items = this.props.data
          , { limit, shownColumns } = this.props
          , { start } = this.state

      const shownItems = items.slice(start, start + limit)

      return (
        h(Box, [

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
                }, columns[n].label)
              ).concat(h(ColumnSelectorButton, {
                columns,
                shownColumns,
              })))
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

          h(ListHeader, Object.assign({
            items,
            shownItems,
            onChange: this.setState.bind(this)
          }, this.props, this.state)),
        ])
      )
    }
  }

  return {
    label,
    description,
    deriveOpts,
    Component: Consumer(next, Infinity, List)
  }
}

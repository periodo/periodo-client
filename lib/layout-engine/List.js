"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , { Button } = require('lib/ui')
    , Icon = require('react-geomicons').default
    , Consumer = require('./Consumer')
    , concat = [].concat.bind([])

const ListHeader = ({
  start,
  shownItems,
  items,
  prevPage,
  nextPage,
}) =>
  h(Flex, {
    bg: 'gray1',
    p: 1,
    alignItems: 'center',
  }, [

    h(Button, {
      disabled: start === 0,
      onClick: prevPage,
    }, h(Icon, { name: 'triangleLeft', color: 'black', })),

    h(Button, {
      disabled: start + shownItems.length >= items.length,
      onClick: nextPage,
    }, h(Icon, { name: 'triangleRight', color: 'black', })),

    h(Text, {
      mx: 2,
    }, `${start + 1}‒${start + shownItems.length} of ${items.length}`),
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

      this.nextPage = this.nextPage.bind(this);
      this.prevPage = this.prevPage.bind(this);
    }

    nextPage() {
      const { data, limit } = this.props

      this.setState(prev => {
        let start = prev.start + limit

        if (start >= data.length) start = prev.start;

        return { start }
      })
    }

    prevPage() {
      const { limit } = this.props

      this.setState(prev => {
        let start = prev.start - limit

        if (start < 0) start = 0;

        return { start }
      })
    }

    render() {
      const items = this.props.data
          , { limit, shownColumns } = this.props
          , { start } = this.state

      const shownItems = items.slice(start, start + limit)

      return (
        h(Box, {
          tabIndex: 0,
          onKeyDown: e => {
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
          }
        }, [
          h(ListHeader, Object.assign({
            items,
            shownItems,
            prevPage: this.prevPage,
            nextPage: this.nextPage,
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

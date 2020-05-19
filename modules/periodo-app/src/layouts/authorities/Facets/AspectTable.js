"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { Box, Flex, Link } = require('periodo-ui')

const Table = Box.extend([], {
  overflowY: 'scroll',
  '& td': {
    padding: '2px 5px',
  },
  '& td:first-of-type': {
    color: '#999',
  },
  '& td:last-of-type': {
    width: '100%',
  },
})

function withoutValue(val, set) {
  const newSet = new Set(set)
  newSet.delete(val)
  return newSet;
}

function withValue(val, set) {
  const newSet = new Set(set)
  newSet.add(val)
  return newSet;
}

const AspectContainer = styled(Flex)`
&:not(:last-of-type) {
  margin-right: 16px;
}
`

class AspectTable extends React.Component {
  constructor() {
    super()
  }

  shouldComponentUpdate(prevProps) {
    return (
      prevProps.counts !== this.props.counts
    )
  }

  render() {
    const { aspect, aspectID, opts, updateOpts, counts } = this.props
        , { label, flexBasis } = aspect
        , render = aspect.render || R.identity
        , height = parseInt(opts.height || '256')
        , selected = new Set(R.path([ 'selected', aspectID ], opts) || [])

    const selectedRows = []
        , unselectedRows = []

    if (counts) {
      counts.forEach(([ value, count, label ]) => {
        const isSelected = selected.has(value)

        const el = (
          h('tr', [
            h('td', count),
            h('td', [
              h(Link, {
                href: '',
                color: `blue.${ isSelected ? 8 : 4 }`,
                onClick: e => {
                  e.preventDefault();
                  updateOpts(R.pipe(
                    R.over(
                      R.lensPath([ 'selected', aspectID ]),
                      () => [ ...(isSelected
                        ? withoutValue(value, selected)
                        : withValue(value, selected)) ]),
                    R.ifElse(
                      val => val.selected[aspectID].length,
                      R.identity,
                      R.dissocPath([ 'selected', aspectID ])),
                    R.ifElse(
                      val => R.isEmpty(val.selected),
                      R.dissoc('selected'),
                      R.identity)
                  ), true)

                },
              }, render(label === undefined ? value : label)),
            ]),
          ])
        )

        if (isSelected) {
          selectedRows.push(el)
        } else {
          unselectedRows.push(el)
        }
      })
    }

    return (
      h(AspectContainer, {
        style: {
          flex: 1,
          flexBasis,
        },
        flexDirection: 'column',
        height,
      }, [
        h(Flex, {
          justifyContent: 'space-between',
          alignItems: 'center',
          bg: 'gray.1',
          p: 2,
          fontWeight: 'bold',
          fontSize: 1,
        }, [
          h('span', label),

          h('span', {}, selected.size === 0 ? null : (
            h('a', {
              href: '',
              style: {
                color: 'red',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 100,
              },
              onClick: e => {
                e.preventDefault();
                updateOpts(R.dissocPath([ 'selected', aspectID ]), true)
              },
            }, 'Clear')
          )),
        ]),

        h('div', {
          style: {
            height:'100%',
            overflowY: 'scroll',
            overscrollBehaviorY: 'contain',
          },
        }, counts == null ? (
          h('div', {
            style: {
              textAlign: 'center',
              padding: '1em',
            },
          }, '. . .')
        ): [
          selectedRows.length === 0 ? null : (
            h(Table, {
              is: 'table',
              className: 'selected',
              px: 1,
              py: 1,
              width: '100%',
            }, [
              h('tbody', selectedRows),
            ])
          ),

          unselectedRows.length === 0 ? null : (
            h(Table, {
              is: 'table',
              px: 1,
              width: '100%',
              bg: 'gray.1',
            }, [
              h('tbody', unselectedRows),
            ])
          ),
        ]),
      ])
    )
  }
}

module.exports = AspectTable

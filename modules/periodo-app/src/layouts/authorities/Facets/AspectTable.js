"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Flex, Link, Table } = require('periodo-ui')

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

const AspectContainer = props =>
  h(Flex, {
    sx: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'colorsets.table.border',
      '&:not(:last-of-type)': {
        mr: '16px',
      },

      'a:hover': {
        textDecoration: 'none',
      },

      'tr': {
        cursor: 'pointer',
      },
    },
    ...props,
  })

class AspectTable extends React.Component {
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
          h('tr', {
            onClick: () => {
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
          }, [
            h('td', count),
            h('td', [
              h(Link, {
                onClick: e => {
                  e.preventDefault();
                },
                href: '',
                color: `blue.${ isSelected ? 9 : 6 }`,
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
          bg: 'colorsets.secondary.bg',
          color: 'colorsets.secondary.fg',
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
        ): h(Box, {
          sx: {
            '& table td:first-of-type': {
              color: 'gray.6',
            },
            '& table td:last-of-type': {
              width: '100%',
            },
          },
        }, [
          selectedRows.length === 0 ? null : (
            h(Table, {
              className: 'selected', // FIXME: necessary anywhere?
              compact: true,
              secondary: true,
              px: 1,
              py: 1,
              mb: 1,
              width: '100%',
            }, [
              h('tbody', selectedRows),
            ])
          ),

          unselectedRows.length === 0 ? null : (
            h(Table, {
              compact: true,
              px: 1,
              width: '100%',
            }, [
              h('tbody', unselectedRows),
            ])
          ),
        ])),
      ])
    )
  }
}

module.exports = AspectTable

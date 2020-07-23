"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Text, SettingsButton, Flex, Link, Table } = require('periodo-ui')

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

function AspectSettings({ aspect, aspectID, opts, updateOpts }) {
  const aspectSettings = R.path([ 'settings', aspectID ], opts) || {}

  return (
    h(Box, {
      p: 2,
    }, Object.entries(aspect.settings).map(([ settingKey, setting ]) =>
      h(Box, {
        key: settingKey,
        sx: {
          ':not(:last-of-type)': {
            mb: 3,
          },
        },
      }, [
        h(Text, {
          fontWeight: 'bold',
        }, setting.label),
        setting.choices.map(({ key: choiceKey, label: choiceLabel }, i) =>
          h('label', {
            key: choiceKey,
            style: {
              margin: '2px 0',
              display: 'flex',
              alignItems: 'center',
            },
          }, [
            h('input', {
              type: 'radio',
              name: `${aspectID}:${settingKey}`,
              value: choiceKey,
              style: {
                margin: '0 6px',
              },
              onChange: () => {
                updateOpts(
                  R.assocPath(
                    [ 'settings', aspectID, settingKey ],
                    choiceKey),
                  true
                )
              },
              checked: (
                aspectSettings[settingKey] === choiceKey ||
              !(settingKey in aspectSettings) && i === 0
              ),

            }),
            h('span', choiceLabel),
            h('br'),
          ])
        ),
      ])
    ))
  )
}

class AspectTable extends React.Component {
  constructor() {
    super();

    this.state = {
      showOptions: false,
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (this.state.showOptions || this.state.showOptions !== prevState.showOptions ) return true

    return (
      prevProps.counts !== this.props.counts
    )
  }

  render() {
    const { aspect, aspectID, opts, updateOpts, counts } = this.props
        , { showOptions } = this.state
        , { label, flexBasis } = aspect
        , render = aspect.render || R.identity
        , height = parseInt(opts.height || '256')
        , selected = new Set(R.path([ 'selected', aspectID ], opts) || [])

    const selectedRows = []
        , unselectedRows = []

    if (!showOptions && counts) {
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

          h('span', {
            style: {
              flex: 'auto',
              paddingRight: '4px',
              textAlign: 'right',
            },
          }, selected.size === 0 ? null : (
            h('a', {
              href: '',
              style: {
                marginRight: '3px',
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

          h(SettingsButton, {
            onClick: () => {
              this.setState(prev => ({
                ...prev,
                showOptions: !prev.showOptions,
              }))
            },
          }),
        ]),

        h('div', {
          style: {
            height:'100%',
            overflowY: 'scroll',
            overscrollBehaviorY: 'contain',
          },
        }, showOptions ? (
          h(AspectSettings, {
            aspect,
            aspectID,
            opts,
            updateOpts,
          })
        ) : counts == null ? (
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

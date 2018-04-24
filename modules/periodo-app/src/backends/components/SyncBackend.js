"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Heading } = require('axs-ui')
    , { Button$Primary, InputBlock, Patch, Authority } = require('periodo-ui')
    , { period, authority, dataset } = require('periodo-utils')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { fetchBackend } = require('../actions')
    , { makePatch } = require('../../patches/patch')
    , { PatchType } = require('../../patches/types')

function NewAuthority({ patch }) {
  return (
    h(Authority, { px: 1, bg: 'green0', value: patch.value })
  )
}

function addOrRemove(items, key) {
  const set = new Set(items)

  if (set.has(key)) {
    set.delete(key)
  } else {
    set.add(key)
  }

  return set
}

class Compare extends React.Component {
  constructor() {
    super();

    this.state = {
      filteredTypes: [],
      expandedAuthorities: new Set(),
      expandedPeriods: new Set(),
      viewedAllPeriods: new Set(),
      checkedAuthorities: new Set(),
    }

    this.getPatchFromSelection = this.getPatchFromSelection.bind(this);
    this.getLocalAuthorityLabel = this.getLocalAuthorityLabel.bind(this);
    this.getLocalPeriodLabel = this.getLocalPeriodLabel.bind(this);
    this.getRemoteAuthorityLabel = this.getRemoteAuthorityLabel.bind(this);
    this.getRemotePeriodLabel = this.getRemotePeriodLabel.bind(this);
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    const update = (
      nextProps.sourceDataset !== nextState.sourceDataset ||
      nextProps.remoteDataset !== nextState.remoteDataset
    )

    if (!update) return null

    const { sourceDataset, remoteDataset } = nextProps

    const allPatches = makePatch(sourceDataset, Object.assign({}, sourceDataset, {
      periodCollections: remoteDataset.periodCollections
    })).map((p, i) => ({
      key: i,
      patch: p,
      type: PatchType.fromPatch(p),
    }))

    return {
      sourceDataset,
      remoteDataset,
      allPatches,
      expandedAuthorities: new Set(),
      selected: new Set(),
    }
  }

  getPatchFromSelection() {
  }

  getRemoteAuthorityLabel() {
    return R.pipe(
      dataset.getAuthority(this.props.remoteDataset),
      authority.displayTitle
    )(...arguments)
  }

  getRemotePeriodLabel() {
    return R.pipe(
      dataset.getPeriod(this.props.remoteDataset),
      period.originalLabel,
      R.prop('language')
    )(...arguments)
  }

  getLocalAuthorityLabel() {
    return R.pipe(
      dataset.getAuthority(this.props.remoteDataset),
      authority.displayTitle
    )(...arguments)
  }

  getLocalPeriodLabel() {
    return R.pipe(
      dataset.getPeriod(this.props.localDataset),
      period.originalLabel,
      R.prop('language')
    )(...arguments)
  }

  componentDidUpdate(prevProps) {
    const { onChange=R.T } = this.props

    if (this.props.selected !== prevProps.selected) {
      onChange(this.getPatchFromSelection())
    }
  }

  render() {
    const { allPatches, filteredTypes, viewedAllPeriods, expandedAuthorities, selected } = this.state

    const filteredPatches =
      filteredTypes.length
        ? allPatches.filter(p => filteredTypes.contains(p.type._name))
        : allPatches

    const countsByType = R.countBy(p => p.type._name, allPatches)

    return (
      h(Box, [
        h(Box, [
          Object.entries(countsByType).map(([label, count]) =>
            h(Box, { key: label }, `${label} (${count})`)
          )
        ]),
        h('hr'),

        h(Box, {
          is: 'table',
          css: {
            borderCollapse: 'collapse',
          }
        }, [
          h('colgroup', [
            h('col', { style: { width: "50%" }}),
            h('col', { style: { width: "50%" }}),
          ]),
          h('thead', [
            h('tr', [
              h('th', 'Authority'),
              h('th', 'Period'),
            ])
          ]),
          h('tbody', filteredPatches.map(({ patch, type, key }) =>
            h(Box, {
              is: 'tr',
              css: { verticalAlign: 'top' },
              key,
            }, [
              h(Box, {
                is: 'td',
                css: {
                  border: '1px solid #ccc',
                  borderRight: 'none',
                }
              }, [
                h(Flex, {
                  alignItems: 'center',
                }, [
                  h(Box, {
                    is: 'input',
                    mx: 1,
                    type: 'checkbox',
                    checked: selected.has(key),
                    onChange: () => this.setState({
                      selected: addOrRemove(selected, key)
                    })
                  }),

                  h('span', {
                    style: {
                      fontWeight: 'bold',
                      color: 'limegreen',
                      width: 108,
                      textAlign: 'center',
                    }
                  }, 'New'),

                  h(Box, {
                    onClick: () => this.setState({
                      expandedAuthorities: addOrRemove(expandedAuthorities, key)
                    }),
                    p: '8px 4px',
                    css: {
                      width: '100%',
                      cursor: 'pointer',
                      ':hover': {
                        backgroundColor: '#eee',
                      }
                    }
                  }, type.case({
                    AddAuthority: this.getRemoteAuthorityLabel,
                    ChangeAuthority: this.getLocalAuthorityLabel,
                    RemoteAuthority: this.getLocalAuthorityLabel,
                    AddPeriod: this.getRemoteAuthorityLabel,
                    ChangePeriod: this.getLocalAuthorityLabel,
                    RemovePeriod: this.getLocalAuthorityLabel,
                    _: () => "this shouldn't happen",
                  })),
                ]),
                expandedAuthorities.has(key) && NewAuthority({ patch }),
              ]),

              h(Box, {
                is: 'td',
                css: {
                  padding: '4px 0',
                  border: '1px solid #ccc',
                  borderLeft: 'none',
                }
              }, R.pipe(
                R.path(['value', 'definitions']),
                R.values,
                R.map((period, i) => h(Box, { key: i, }, period.label)),
                R.ifElse(
                  list => list.length > 5 && !viewedAllPeriods.has(key),
                  list => [
                    list.slice(0, 5),
                    h(Box, {
                      is: 'a',
                      href: '',
                      mt: 1,
                      display: 'inline-block',
                      color: 'blue',
                      onClick: e => {
                        e.preventDefault();
                        this.setState({
                          viewedAllPeriods: addOrRemove(viewedAllPeriods, key)
                        })
                      }
                    }, `View ${list.length - 5} more`)
                  ],
                  R.identity
                )
              )(patch)),
            ])
          ))
        ])

      ])
      /*
      h(Patch, {
        data: sourceDataset,
        patch,
      })
      */
    )
  }
}

class SyncBackend extends React.Component {
  constructor() {
    super()

    this.state = {
      fetchErr: null,
      remoteBackend: null,
      remoteDataset: null,
      url: window.location.origin,
    }

    this.fetchBackend = this.fetchBackend.bind(this)
  }

  async fetchBackend(storage) {
    const { dispatch } = this.props

    const action = await dispatch(fetchBackend(storage, true))

    handleCompletedAction(action,
      ({ backend, dataset }) => {
        this.setState({
          remoteBackend: backend,
          remoteDataset: dataset,
        })
      },
      err => {
        this.setState({ fetchErr: err })
      }
    )

  }

  render() {
    if (this.state.remoteBackend) {
      return h(Compare, {
        sourceBackend: this.props.backend,
        sourceDataset: this.props.dataset,
        remoteBackend: this.state.remoteBackend,
        remoteDataset: this.state.remoteDataset,
      })
    }

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Sync backend'),

        h(InputBlock, {
          label: 'PeriodO server URL',
          value: this.state.url,
          onChange: e => this.setState({ url: e.target.value }),
        }),

        h(Button$Primary, {
          onClick: () => this.fetchBackend(BackendStorage.Web(this.state.url)),
        }, 'Continue')
      ])
    )
  }
}

module.exports = SyncBackend;

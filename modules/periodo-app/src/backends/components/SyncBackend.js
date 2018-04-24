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

const colors = {
  "New": "limegreen",
  "Changed": "yellow",
  "Removed": "red",
}

function Indicator({ label }) {
  return h('span', {
    style: {
      fontWeight: 'bold',
      color: colors[label] || 'black',
      width: 108,
      textAlign: 'center',
    }
  }, label)
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

function PeriodCell(props) {
  const {
    patchID,
    setState,
    type,
    period,
    authority,
    expandedPeriods,
    selectedPeriods,
    selectedAuthorities,
  } = props

  const deferToAuthority = type._name === 'AddAuthority'

  const selectAll = (
    deferToAuthority &&
    patchID in selectedAuthorities &&
    !R.has(patchID, selectedPeriods)
  )

  const explicitlySelected = R.path([patchID, period.id], selectedPeriods)
      , checked = !!(selectAll || explicitlySelected)

  return (
    h(Flex, { alignItems: 'center' }, [

      h(Box, {
        is: 'input',
        mx: 1,
        type: 'checkbox',
        checked,
        onChange: () => setState(prev => {
          if (explicitlySelected) {
            return {
              selectedPeriods: R.dissocPath([patchID, period.id], prev.selectedPeriods)
            }
          }

          // Deselect *only* this period, keep all others selected
          if (selectAll) {
            return {
              selectedPeriods: R.assoc(patchID, R.pipe(
                R.prop('definitions'),
                R.dissoc(period.id),
                R.map(R.T)
              )(authority))(prev.selectedPeriods)
            }
          }

          // Select this period, *along with* the authority
          if (deferToAuthority) {
            return {
              selectedPeriods: R.assocPath([patchID, period.id], true, prev.selectedPeriods),
              selectedAuthorities: R.assoc(patchID, true, prev.selectedAuthorities)
            }
          }

          // Else, just add the damned period
          return {
            selectedPeriods: R.assocPath([patchID, period.id], true, prev.selectedPeriods),
          }
        })
      }),


      h(Indicator, {
        label: type.case({
          AddAuthority: () => 'New',
          RemoveAuthority: () => 'Removed',
          AddPeriod: () => 'New',
          ChangePeriod: () => 'Changed',
          RemovePeriod: () => 'Removed',
        })
      }),
      h(Box, {
        onClick: () => setState({
          expandedPeriods: addOrRemove(expandedPeriods, period.id)
        }),
        p: '4px',
        css: {
          width: '100%',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: '#eee',
          }
        }
      }, period.label)
    ])
  )
}

function AuthorityRow(props) {
  const {
    id,
    type,
    patch,
    selectedPeriods,
    selectedAuthorities,
    viewedAllPeriods,
    expandedAuthorities,
    setState,
    localDataset,
    remoteDataset,
  } = props

  const patchID = id

  const authority = type.case({
    AddAuthority: dataset.getAuthority(remoteDataset),
    ChangeAuthority: dataset.getAuthority(localDataset),
    RemoveAuthority: dataset.getAuthority(localDataset),
    AddPeriod: dataset.getAuthority(remoteDataset),
    ChangePeriod: dataset.getAuthority(localDataset),
    RemovePeriod: dataset.getAuthority(localDataset),
    _: R.always(null),
  })

  const periodList = [].concat(type.case({
    AddAuthority: () => R.pipe(R.prop('definitions'), R.values),
    ChangeAuthority: () => R.always([]),
    RemoveAuthority: () => R.pipe(R.prop('definitions'), R.values),
    AddPeriod: (_, id) => R.path(['definitions', id]),
    ChangePeriod: (_, id) => R.path(['definitions', id]),
    RemovePeriod: (_, id) => R.path(['definitions', id]),
  })(authority))

  return (
    h(Box, {
      is: 'tr',
      css: { verticalAlign: 'top' },
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
          type._name.endsWith('Authority') && h(Box, {
            is: 'input',
            mx: 1,
            type: 'checkbox',
            checked: patchID in selectedAuthorities,
            onChange: () => setState({
              selectedAuthorities: (patchID in selectedAuthorities)
                ? R.dissoc(patchID, selectedAuthorities)
                : Object.assign({ [patchID]: true }, selectedAuthorities),
              selectedPeriods: (patchID in selectedPeriods)
                ? R.dissoc(patchID, selectedPeriods)
                : selectedPeriods
            })
          }),

          type.case({
            AddAuthority: () => h(Indicator, { label: 'New' }),
            ChangeAuthority: () => h(Indicator, { label: 'Changed' }),
            RemoveAuthority: () => h(Indicator, { label: 'Removed' }),
            _: () => null,
          }),

          h(Box, {
            onClick: () => setState({
              expandedAuthorities: addOrRemove(expandedAuthorities, patchID)
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
            AddAuthority: props.getRemoteAuthorityLabel,
            ChangeAuthority: props.getLocalAuthorityLabel,
            RemoteAuthority: props.getLocalAuthorityLabel,
            AddPeriod: props.getRemoteAuthorityLabel,
            ChangePeriod: props.getLocalAuthorityLabel,
            RemovePeriod: props.getLocalAuthorityLabel,
            _: () => "this shouldn't happen",
          })),
        ]),
        expandedAuthorities.has(patchID) && NewAuthority({ patch }),
      ]),

      h(Box, {
        is: 'td',
        css: {
          padding: '4px 0',
          border: '1px solid #ccc',
          borderLeft: 'none',
        }
      }, R.pipe(
        R.map(period => h(PeriodCell, Object.assign({
          key: period.id,
          authority,
          period,
          patchID,
        }, props))),
        R.ifElse(
          list => list.length > 5 && !viewedAllPeriods.has(id),
          list => [
            list.slice(0, 5),
            h(Box, {
              key: 'view-more',
              is: 'a',
              href: '',
              mt: 1,
              display: 'inline-block',
              color: 'blue',
              onClick: e => {
                e.preventDefault();
                setState({
                  viewedAllPeriods: addOrRemove(viewedAllPeriods, id)
                })
              }
            }, `View ${list.length - 5} more`)
          ],
          R.identity
        )
      )(periodList)),
    ])
  )
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
      id: `patch-${i}`,
      patch: p,
      type: PatchType.fromPatch(p),
    }))

    return {
      sourceDataset,
      remoteDataset,
      allPatches,
      expandedAuthorities: new Set(),
      selectedPeriods: {},
      selectedAuthorities: {}
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

  componentDidUpdate(prevProps, prevState) {
    const { onChange=R.T } = this.props

    const updateSelection = (
      this.state.selectedPeriods !== prevState.selectedPeriods ||
      this.state.selectedAuthorities !== prevState.selectedAuthoritiest
    )

    if (updateSelection) {
      onChange(this.getPatchFromSelection())
    }
  }

  render() {
    const { allPatches, filteredTypes } = this.state

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
          h('tbody', filteredPatches.map(patch =>
            h(AuthorityRow, Object.assign(
              {
                key: patch.id,
                setState: this.setState.bind(this),
                getLocalAuthorityLabel: this.getLocalAuthorityLabel,
                getLocalPeriodLabel: this.getLocalPeriodLabel,
                getRemoteAuthorityLabel: this.getRemoteAuthorityLabel,
                getRemotePeriodLabel: this.getRemotePeriodLabel,
              },
              this.state,
              patch,
            ))
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

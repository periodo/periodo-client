"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box } = require('axs-ui')
    , { Authority, Period } = require('periodo-ui')
    , { period, authority, dataset } = require('periodo-utils')
    , { makePatch } = require('./patch')
    , { PatchType } = require('./types')

function NewAuthority({ patch }) {
  return (
    h(Authority, { p: 1, bg: 'green0', value: patch.value })
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
    editing,
    setState,
    type,
    period,
    authority,
    expandedPeriods,
    selectedPeriods,
    selectedPatches,
  } = props

  const deferToAuthority = type._name === 'AddAuthority'

  const selectAll = (
    deferToAuthority &&
    patchID in selectedPatches &&
    !R.has(patchID, selectedPeriods)
  )

  const explicitlySelected = deferToAuthority
    ? R.path([patchID, period.id], selectedPeriods)
    : patchID in selectedPatches

  const checked = !!(selectAll || explicitlySelected)

  return (
    h(Box, [
      h(Flex, { alignItems: 'center' }, [
        editing && h(Box, {
          is: 'input',
          mx: 1,
          type: 'checkbox',
          checked,
          onChange: () => setState(prev => {
            // In the simple case, where the period is not a "subperiod" of a
            // patch adding an authority, just toggle whether this patch is
            // selected.
            if (!deferToAuthority) {
              return {
                selectedPatches: patchID in prev.selectedPatches
                  ? R.dissoc(patchID, prev.selectedPeriods)
                  : R.assoc(patchID, true, prev.selectedPeriods)
              }
            }

            // If only the authority has been selected, by default,
            // everything is checked. By unchecking one period, every period
            // *but* this one will be selected.
            if (selectAll) {
              return {
                selectedPeriods: R.assoc(patchID, R.pipe(
                  R.prop('definitions'),
                  R.dissoc(period.id),
                  R.map(R.T)
                )(authority))(prev.selectedPeriods)
              }
            }

            // If this one has been explicitly selected, unselect it.
            if (explicitlySelected) {
              return {
                selectedPeriods: R.dissocPath([patchID, period.id], prev.selectedPeriods)
              }
            }

            // Otherwise, neither the authority, nor the period has been
            // selected. In that case, select both the period and the
            // authority.
            return {
              selectedPeriods: R.assocPath([patchID, period.id], true, prev.selectedPeriods),
              selectedPatches: R.assoc(patchID, true, prev.selectedPatches)
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
            _: () => null,
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
      ]),

      expandedPeriods.has(period.id) && type.case({
        AddAuthority: () => h(Period, { p: 1, bg: 'green0', value: period }),
        AddPeriod: () => h(Period, { p: 1, bg: 'green0', value: period }),
        RemoveAuthority: () => h(Period, { p: 1, bg: 'red0', value: period }),
        RemovePeriod: () => h(Period, { p: 1, bg: 'red0', value: period }),
        _: () => null,
      }),
    ])
  )
}

function AuthorityRow(props) {
  const {
    id,
    type,
    patch,
    editing,
    selectedPeriods,
    selectedPatches,
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
          editing && type._name.endsWith('Authority') && h(Box, {
            is: 'input',
            mx: 1,
            type: 'checkbox',
            checked: patchID in selectedPatches,
            onChange: () => setState({
              selectedPatches: (patchID in selectedPatches)
                ? R.dissoc(patchID, selectedPatches)
                : Object.assign({ [patchID]: true }, selectedPatches),
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

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state !== nextState ||
      this.props.sourceDataset !== nextProps.sourceDataset ||
      this.props.remoteDataset !== nextProps.remoteDataset
    )
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
    })).slice(0,2)

    return {
      sourceDataset,
      remoteDataset,
      allPatches,
      expandedAuthorities: new Set(),
      selectedPeriods: {},
      selectedPatches: {}
    }
  }

  getPatchFromSelection() {
    const { allPatches, selectedPeriods, selectedPatches } = this.state

    return allPatches
      .filter(patch => patch.id in selectedPatches)
      .map(({ type, patch, id }) => {
        if (type._name !== 'AddAuthority') return patch;
        if (!(id in selectedPeriods)) return patch;

        return R.over(
          R.lensPath(['value', 'definitions']),
          R.pipe(
            Object.entries,
            R.filter(([periodID]) => selectedPeriods[id][periodID]),
            R.fromPairs
          ),
          patch
        )
      })
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
    const { onChange } = this.props

    if (!onChange) return;

    const updateSelection = (
      this.state.selectedPeriods !== prevState.selectedPeriods ||
      this.state.selectedPatches !== prevState.selectedPatches
    )

    if (updateSelection) {
      onChange(this.getPatchFromSelection())
    }
  }

  render() {
    const { allPatches, filteredTypes } = this.state
        , editing = !!this.props.onChange

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
            width: '100%',
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
                editing,
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

module.exports = Compare

"use strict";

// TODO: Still no support for showing/selecting multiple changes to the same
// item. I believe periods with multiple edits will show up twice as changed,
// and only the first change for an authority will be selectable

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Type = require('union-type')
    , { saveAs } = require('file-saver')
    , { Flex, Box, Link, Heading } = require('periodo-ui')
    , { Authority, Period } = require('periodo-ui')
    , util = require('periodo-utils')
    , { makePatch } = require('./patch')
    , { PatchType } = require('./types')

const Side = Type({
  Unpatched: {},
  Patched: {},
})

const colors = {
  "New": "limegreen",
  "Changed": "goldenrod",
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
    patches,
    editing,
    setState,
    period,
    authority,
    expandAll,
    selectAll,
    unpatchedPeriodByID,
    patchedPeriodByID,
    expandedPeriods,
    selectedPeriods,
    selectedPatches,
  } = props

  const patch = patches[0]

  const deferToAuthority = patch.type._name === 'AddAuthority'

  const selectAllPeriods = (
    deferToAuthority &&
    patch.id in selectedPatches &&
    !R.has(patch.id, selectedPeriods)
  )

  const explicitlySelected = deferToAuthority
    ? R.path([patch.id, period.id], selectedPeriods)
    : patch.id in selectedPatches

  const checked = selectAll || !!(selectAllPeriods || explicitlySelected)

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
                selectedPatches: patch.id in prev.selectedPatches
                  ? R.dissoc(patch.id, prev.selectedPatches)
                  : R.assoc(patch.id, true, prev.selectedPatches)
              }
            }

            // If only the authority has been selected, by default,
            // everything is checked. By unchecking one period, every period
            // *but* this one will be selected.
            if (selectAllPeriods) {
              return {
                selectedPeriods: R.assoc(patch.id, R.pipe(
                  R.prop('periods'),
                  R.dissoc(period.id),
                  R.map(R.T)
                )(authority))(prev.selectedPeriods)
              }
            }

            // If this one has been explicitly selected, unselect it.
            if (explicitlySelected) {
              return {
                selectedPeriods: R.dissocPath([patch.id, period.id], prev.selectedPeriods)
              }
            }

            // Otherwise, neither the authority, nor the period has been
            // selected. In that case, select both the period and the
            // authority.
            return {
              selectedPeriods: R.assocPath([patch.id, period.id], true, prev.selectedPeriods),
              selectedPatches: R.assoc(patch.id, true, prev.selectedPatches)
            }
          })
        }),


        h(Indicator, {
          label: patch.type.case({
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

      (expandAll || expandedPeriods.has(period.id)) && patch.type.case({
        AddAuthority: () => h(Period, { p: 1, bg: 'green0', value: period }),
        AddPeriod: () => h(Period, { p: 1, bg: 'green0', value: period }),
        ChangePeriod: () => h(Period, {
          p: 1,
          value: unpatchedPeriodByID(period.id),
          compare: patchedPeriodByID(period.id),
        }),
        RemoveAuthority: () => h(Period, { p: 1, bg: 'red0', value: period }),
        RemovePeriod: () => h(Period, { p: 1, bg: 'red0', value: period }),
        _: () => null,
      }),
    ])
  )
}

function AuthorityRow(props) {
  const {
    patches,
    editing,
    datasetAuthorityByID,
    datasetPeriodByID,
    selectedPeriods,
    selectedPatches,
    viewedAllPeriods,
    expandAll,
    selectAll,
    expandedAuthorities,
    setState,
  } = props

  const patchedAuthorityByID = datasetAuthorityByID(Side.Patched)
      , unpatchedAuthorityByID = datasetAuthorityByID(Side.Unpatched)
      , patchedPeriodByID = datasetPeriodByID(Side.Patched)
      , unpatchedPeriodByID = datasetPeriodByID(Side.Unpatched)

  const authority = patches[0].type.case({
    AddAuthority: patchedAuthorityByID,
    ChangeAuthority: unpatchedAuthorityByID,
    RemoveAuthority: unpatchedAuthorityByID,
    AddPeriod: unpatchedAuthorityByID,
    ChangePeriod: unpatchedAuthorityByID,
    RemovePeriod: unpatchedAuthorityByID,
    _: R.F,
  })

  const periods = R.pipe(
    R.chain(patch => {
      const periods = [].concat(patch.type.case({
        AddAuthority: () => util.authority.periods(patch.patch.value),
        RemoveAuthority: () => util.authority.periods(authority),
        ChangeAuthority: R.always([]),
        AddPeriod: (authorityID, periodID) => patchedPeriodByID(periodID),
        ChangePeriod: (authorityID, periodID) => unpatchedPeriodByID(periodID),
        RemovePeriod: (authorityID, periodID) => unpatchedPeriodByID(periodID),
        _: R.F,
      }))

      return periods.map(period => ({
        period,
        authority,
        patch,
      }))
    }),
    R.groupBy(R.path(['period', 'id'])),
    R.values,
    R.map(p => ({
      period: p[0].period,
      authority: p[0].authority,
      patches: p.map(R.prop('patch'))
    }))
  )(patches)

  const authorityPatches = patches
    .filter(({ type }) => type._name.endsWith('Authority'))

  const patchID = authorityPatches.map(p => p.id).toString()

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
          editing && authorityPatches.length > 0 && h(Box, {
            is: 'input',
            mx: 1,
            type: 'checkbox',
            checked: selectAll || (patchID in selectedPatches),
            onChange: () => setState({
              selectedPatches: (patchID in selectedPatches)
                ? R.dissoc(patchID, selectedPatches)
                : Object.assign({ [patchID]: true }, selectedPatches),
              selectedPeriods: (patchID in selectedPeriods)
                ? R.dissoc(patchID, selectedPeriods)
                : selectedPeriods
            })
          }),

          authorityPatches.length > 0 && authorityPatches[0].type.case({
            AddAuthority: () => h(Indicator, { label: 'New' }),
            ChangeAuthority: () => h(Indicator, { label: 'Changed' }),
            RemoveAuthority: () => h(Indicator, { label: 'Removed' }),
            _: () => null,
          }),

          h(Box, {
            onClick: () => setState({
              expandedAuthorities: addOrRemove(expandedAuthorities, authority.id)
            }),
            p: '8px 4px',
            css: {
              width: '100%',
              cursor: 'pointer',
              ':hover': {
                backgroundColor: '#eee',
              }
            }
          }, util.authority.displayTitle(authority))
        ]),
        (expandAll || expandedAuthorities.has(authority.id)) && h(Authority, Object.assign({
          p: 1,
          value: authority,
        }, authorityPatches.length && authorityPatches[0].type.case({
          AddAuthority: () => ({ bg: 'green0' }),
          ChangeAuthority: () => ({ /* FIXME: compare to remote */ }),
          RemoveAuthority: () => ({ bg: 'red0' }),
          _: () => ({})
        })))
      ]),

      h(Box, {
        is: 'td',
        css: {
          padding: '4px 0',
          border: '1px solid #ccc',
          borderLeft: 'none',
        }
      }, R.pipe(
        R.map(({ period, patch, authority }) => h(PeriodCell, Object.assign({
          key: period.id,
          period,
          patch,
          authority,
          unpatchedPeriodByID,
          patchedPeriodByID,
        }, props))),
        R.ifElse(
          list => list.length > 5 && !(expandAll || viewedAllPeriods.has(authority.id)),
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
                  viewedAllPeriods: addOrRemove(viewedAllPeriods, authority.id)
                })
              }
            }, `View ${list.length - 5} more`)
          ],
          R.identity
        )
      )(periods)),
    ])
  )
}

class Compare extends React.Component {
  constructor() {
    super();

    this.state = {}

    this.getPatchFromSelection = this.getPatchFromSelection.bind(this);
    this.datasetPeriodByID = this.datasetPeriodByID.bind(this);
    this.datasetAuthorityByID = this.datasetAuthorityByID.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state !== nextState ||
      this.props.localDataset !== nextProps.localDataset ||
      this.props.remoteDataset !== nextProps.remoteDataset ||
      this.props.patch !== nextProps.patch
    )
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    const update = (
      nextProps.localDataset !== nextState.localDataset ||
      nextProps.remoteDataset !== nextState.remoteDataset ||
      nextProps.patch !== nextState.explicitPatch
    )

    if (!update) return null

    const { direction, localDataset, remoteDataset, patch } = nextProps

    const [ unpatchedDataset, patchedDataset ] = direction.case({
      Push: () => [ remoteDataset, localDataset ],
      Pull: () => [ localDataset, remoteDataset ],
    })

    let allPatches = patch

    if (!allPatches) {
      allPatches = makePatch(unpatchedDataset.raw, patchedDataset.raw)
    }

    allPatches = allPatches.map((p, i) => ({
      id: `patch-${i}`,
      patch: p,
      type: PatchType.fromPatch(p),
    }))

    return {
      allPatches,
      explicitPatch: patch,
      unpatchedDataset,
      patchedDataset,
      localDataset,
      remoteDataset,
      selectedPeriods: {},
      selectedPatches: {},
      filteredTypes: [],
      expandAll: false,
      selectAll: false,
      expandedAuthorities: new Set(),
      expandedPeriods: new Set(),
      viewedAllPeriods: new Set(),
      checkedAuthorities: new Set(),
    }
  }

  getPatchFromSelection() {
    const { selectAll, allPatches, selectedPeriods, selectedPatches } = this.state

    return allPatches
      .filter(patch => selectAll ? true : patch.id in selectedPatches)
      .map(({ type, patch, id }) => {
        if (type._name !== 'AddAuthority') return patch;
        if (!(id in selectedPeriods)) return patch;

        return R.over(
          R.lensPath(['value', 'periods']),
          R.pipe(
            Object.entries,
            R.filter(([periodID]) => selectedPeriods[id][periodID]),
            R.fromPairs
          ),
          patch
        )
      })
  }

  datasetAuthorityByID(side) {
    const dataset = side.case({
      Unpatched: () => this.state.unpatchedDataset,
      Patched: () => this.state.patchedDataset,
    })

    return authorityID => dataset.authorityByID(authorityID)
  }

  datasetPeriodByID(side) {
    const dataset = side.case({
      Unpatched: () => this.state.unpatchedDataset,
      Patched: () => this.state.patchedDataset,
    })

    return periodID => dataset.periodByID(periodID)
  }

  componentDidUpdate(prevProps, prevState) {
    const { onChange } = this.props

    if (!onChange) return;

    const updateSelection = (
      this.state.selectedPeriods !== prevState.selectedPeriods ||
      this.state.selectedPatches !== prevState.selectedPatches ||
      this.state.selectAll !== prevState.selectAll

    )

    if (updateSelection) {
      onChange(this.getPatchFromSelection())
    }
  }

  render() {
    const { allPatches, filteredTypes, expandAll } = this.state
        , { selectAll } = this.props
        , editing = !!this.props.onChange

    const filteredPatches =
      filteredTypes.length
        ? allPatches.filter(p => filteredTypes.contains(p.type._name))
        : allPatches

    const countsByType = R.countBy(p => p.type.getLabel(true), allPatches)

    // First, separate out all patches that have to do with periods and
    // authorities. They'll be treated specially
    const [ itemPatches, other ] = R.partition(
      ({ type }) => type.case({
        AddAuthority: R.T,
        ChangeAuthority: R.T,
        RemoveAuthority: R.T,
        AddPeriod: R.T,
        ChangePeriod: R.T,
        RemovePeriod: R.T,
        _: R.F,
      }),
      filteredPatches
    )

    // Then, partition by authority, so that changes to periods in the same
    // authority can be grouped together
    const byAuthority = R.groupBy(R.path(['type', 'authorityID']), itemPatches)

    return (
      h(Box, [
        h(Flex, {
          p: 3,
          mb: 3,
          justifyContent: 'space-between',
          alignItems: 'center',
          bg: 'gray.0',
          border: 1,
          borderColor: 'gray.4',
        }, [
          h(Box, [
            h(Heading, { level: 4, }, 'Patch summary'),
            h(Box, { is: 'ul', ml: 3 }, [
              Object.entries(countsByType).map(([label, count]) =>
                h(Box, { is: 'li', key: label }, `${label} (${count})`)
              )
            ])
          ]),

          h(Box, [
            h(Link, {
              fontSize: 16,
              fontWeight: 'bold',
              href: ' ',
              onClick(e) {
                e.preventDefault();
                const patch = new Blob([
                  JSON.stringify(allPatches.map(p => p.patch), true, '  ')
                ], { type: 'application/json' })

                saveAs(patch, 'patch.jsonpatch')
              }
            }, 'Download patch'),
          ]),
        ]),

        editing && h(Box, {
          is: 'a',
          href: '',
          color: 'blue',
          onClick: e => {
            e.preventDefault();

            this.setState(prev => {
              if (prev.expandAll) {
                return {
                  expandAll: false,
                  expandedPeriods: new Set(),
                  expandedAuthorities: new Set(),
                  viewedAllPeriods: new Set(),
                }
              } else {
                return {
                  expandAll: true,
                }
              }
            })
          }
        }, expandAll ? 'Collapse all' : 'Expand all'),

        editing && h(Box, {
          is: 'a',
          href: '',
          color: 'blue',
          onClick: e => {
            e.preventDefault();

            this.setState(prev => {
              if (prev.selectAll) {
                return {
                  selectAll: false,
                  selectedPatches: new Set(),
                  selectedPeriods: new Set(),
                }
              } else {
                return {
                  selectAll: true,
                }
              }
            })
          }
        }, selectAll ? 'Unselect all' : 'Select all'),

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
          h('tbody', Object.entries(byAuthority).map(([authorityID, patches]) =>
            h(AuthorityRow, Object.assign({
              key: authorityID,
              editing,
              setState: this.setState.bind(this),
              datasetAuthorityByID: this.datasetAuthorityByID,
              datasetPeriodByID: this.datasetPeriodByID,
              patches,
            }, this.state))
          ))
        ])
      ])
    )
  }
}

module.exports = Compare

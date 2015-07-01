"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , ChangeGroup

ChangeGroup = React.createClass({
  render: function () {
    var allPatches = this.props.changes.map(change => change.get('patches')).toSet()

    return (
      <div>
        {
          !this.props.source ? null :
            <h4>In source: {this.props.source} </h4>
        }
        {
          !this.props.select ? null :
            <div>
              <label>
                <input
                    type="checkbox"
                    checked={!allPatches.subtract(this.props.selectedPatches).size}
                    onChange={this.props.onPatchSelectionChange.bind(null, allPatches)} />
                {' '} Select all
              </label>
            </div>
        }
        <table className="table table-bordered">
          <tbody>
          {
            this.props.changes.map(change =>
              <tr className="select-patch" key={change.hashCode()}>
                {
                  !this.props.select ? null :
                    <td className="toggle-patch-select">
                      <label>
                        <input
                            type="checkbox"
                            checked={this.props.selectedPatches.contains(change.get('patches'))}
                            onChange={this.props.onPatchSelectionChange.bind(null,
                                Immutable.Set.of(change.get('patches')))} />
                      </label>
                    </td>
                }
                <td>{change.get('component')}</td>
              </tr>
            )
          }
          </tbody>
        </table>

      </div>
    )
  }
});

function formatPeriodCollectionAddition(addition) {
  var { describe } = require('../../../helpers/periodization')
    , description = describe(addition.get('value'))

  return Immutable.Map({
    patches: Immutable.List.of(addition),
    component: (
      <div>
        <div>{ description.source }</div>
        <div>Definitions: { description.definitions }</div>
        <div>
          Time span: {
            (description.earliest && description.earliest.label) ?
              description.earliest.label : null
          } to {
            (description.latest && description.latest.label) ?
              description.latest.label : null
          }
        </div>
      </div>
    )
  })
}

function formatPeriodAddition(addition) {
  var Period = require('../period.jsx')
  return Immutable.Map({
    patches: Immutable.List.of(addition),
    component: (
      <div className="diff-addition">
        <Period period={addition.get('value')} />
      </div>
    )
  })
}

function formatPeriodEdit(patches, collectionID, periodID, sourceStore, destStore) {
  var periodDiff = require('../../../utils/period_diff')
    , periodPath = ['periodCollections', collectionID, 'definitions', periodID]
    , oldPeriod = sourceStore.getIn(periodPath)
    , newPeriod = destStore.getIn(periodPath)

  return Immutable.Map({
    patches,
    component: <div dangerouslySetInnerHTML={{ __html: periodDiff(oldPeriod, newPeriod) }} />
  })
}

module.exports = React.createClass({
  displayName: 'ChangeList',

  propTypes: {
    patches: React.PropTypes.instanceOf(Immutable.List).isRequired,
    sourceStore: React.PropTypes.instanceOf(Immutable.Map).isRequired,
    destStore: React.PropTypes.instanceOf(Immutable.Map).isRequired,
    select: React.PropTypes.bool.isRequired
  },

  getInitialState: function () {
    return this.props.select ? { selectedPatches: Immutable.Set() } : {}
  },
  getSelectedPatches: function () {
    return this.state.selectedPatches;
  },
  handlePatchSelectionChange: function (patches, e) {
    var checked = e.target.checked;
    this.setState(prev => ({
      selectedPatches: prev.selectedPatches[checked ? 'union' : 'subtract'](patches)
    }));
  },
  getGroupedChanges: function (changes) {
    var { groupByChangeType } = require('../../../helpers/patch_collection')
      , { getDisplayTitle } = require('../../../helpers/source')
      , grouped = groupByChangeType(changes)
      , groupedChanges = Immutable.List()

    if (grouped.has('addPeriodCollection')) {
      groupedChanges = groupedChanges.push(Immutable.Map({
        header: 'New period collections',
        groups: Immutable.fromJS([{
          header: null,
          changes: grouped.get('addPeriodCollection').map(formatPeriodCollectionAddition)
        }])
      }))
    }

    if (grouped.has('addPeriod')) {
      groupedChanges = groupedChanges.push(Immutable.Map({
        header: 'New periods',
        groups: grouped.get('addPeriod').map((additions, collectionID) => {
          var sourcePath = ['periodCollections', collectionID, 'source']
            , source = this.props.sourceStore.getIn(sourcePath)

          return Immutable.Map({
            header: <h3>In source: { getDisplayTitle(source) }</h3>,
            changes: additions.map(formatPeriodAddition)
          })
        })
      }))
    }

    if (grouped.has('editPeriod')) {
      groupedChanges = groupedChanges.push(Immutable.Map({
        header: 'Edited periods',
        groups: grouped.get('editPeriod').map((periods, collectionID) => {
          var sourcePath = ['periodCollections', collectionID, 'source']
            , source = this.props.sourceStore.getIn(sourcePath)

          return Immutable.Map({
            header: <h3>In source: { getDisplayTitle(source) }</h3>,
            changes: periods.map((patches, periodID) => (
              formatPeriodEdit(
                patches, collectionID, periodID,
                this.props.sourceStore, this.props.destStore)
            ))
          })
        })
      }));
    }

    return groupedChanges;
  },
  handleContinue: function () {
    this.props.onAcceptPatches(this.state.selectedPatches.flatten(1));
  },
  render: function () {
    var grouped = this.getGroupedChanges(this.props.patches)
      , changeGroupOpts

    changeGroupOpts = !this.props.select ? {} : {
      select: true,
      selectedPatches: this.state.selectedPatches,
      onPatchSelectionChange: this.handlePatchSelectionChange
    }

    return (
      grouped.size === 0 ?
        <p>No changes detected</p> :
        <div>
          {
            !this.props.select ? null :
              <button
                  className="btn btn-default"
                  disabled={!this.state.selectedPatches.size}
                  onClick={this.handleContinue}>
                Continue
              </button>
          }
          {
            grouped.map(group =>
              <div key={group.hashCode()}>
                <h2>{group.get('header')}</h2>
                {
                  group.get('groups').map(changes =>
                    <ChangeGroup
                        key={changes.hashCode()}
                        header={changes.get('header')}
                        changes={changes.get('changes')}
                        {...changeGroupOpts} />
                  )
                }
              </div>
            )
          }
        </div>
    )
  }
});

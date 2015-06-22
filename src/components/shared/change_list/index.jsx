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
  return {
    patches: Immutable.List.of(addition),
    component: <pre>A PERIOD ADDITION</pre>
  }
}

module.exports = React.createClass({
  displayName: 'ChangeList',
  propTypes: {
    changes: React.PropTypes.instanceOf(Immutable.List).isRequired,
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
          return Immutable.Map({
            header: 'In source: ' + collectionID,
            changes: additions.map(formatPeriodAddition)
          })
        })
      }))
    }

    return groupedChanges;
  },
  handleContinue: function () {
    this.props.onAcceptPatches(this.state.selectedPatches.flatten(1));
  },
  render: function () {
    var grouped = this.getGroupedChanges(this.props.changes)
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
                <h1>{group.get('header')}</h1>
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

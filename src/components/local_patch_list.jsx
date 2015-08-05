"use strict";

var React = require('react')
  , Immutable = require('immutable')

function fetchPatch(localPatch) {
  var { getJSON } = require('../ajax')
  return getJSON(localPatch.get('id'))
    .then(([serverPatch]) => [localPatch, serverPatch])
}

module.exports = React.createClass({
  displayName: 'LocalPatchList',

  getInitialState: function () {
    return {
      checkingStatuses: false,
      statuses: Immutable.Map()
    }
  },

  handleCheckStatus: function () {
    this.setState({
      checkingStatuses: true,
      statuses: Immutable.Map()
    }, this.checkStatuses);
  },

  checkStatuses: function () {
    this.props.localPatches
      .filter(patch => {
        if (patch.get('resolved')) {
          this.setState(prev => ({
            statuses: prev.statuses.set(patch.get('id'), [true, patch.get('merged')])
          }));
          return false;
        }
        return true;
      })
      .map(patch => fetchPatch(patch).then(([localPatch, serverPatch]) => {
        var fn

        if (serverPatch.open) {
          this.setState(prev => ({
            statuses: prev.statuses.set(localPatch.get('id'), [false])
          }));
          return Promise.resolve();
        }

        fn = serverPatch.merged ?
          this.props.backend.markSubmittedPatchMerged.bind(this.props.backend) :
          this.props.backend.markSubmittedPatchNotMerged.bind(this.props.backend)

        return fn(localPatch.get('id'), serverPatch)
          .then(() => this.setState(prev => ({
            statuses: prev.statuses.set(localPatch.get('id'), [true, serverPatch.merged])
          })));
      }));
  },

  renderPatchRow: function (patch) {
    var Spinner = require('./shared/spinner.jsx')
      , patchID = patch.get('id')
      , hasCheckedStatus = this.state.statuses.has(patchID)
      , resolved
      , merged

    if (hasCheckedStatus) {
      [resolved, merged] = this.state.statuses.get(patchID);
    }

    return (
      <tr>
        {
          !this.state.checkingStatuses ?
            <td>{ patch.get('resolved') ? 'Yes' : 'No' }</td> :
            hasCheckedStatus ?
              <td>{ resolved ? 'Yes' : 'No' }</td> :
              <td style={{ position: 'relative', padding: '0' }}>
                <Spinner spin={true} />
              </td>
        }
        {
          !this.state.checkingStatuses ?
            <td>{ patch.get('merged') ? 'Yes' : 'No' }</td> :
            hasCheckedStatus ?
              <td>{ merged === undefined ? '--' : (merged ? 'Yes' : 'No') }</td> :
              <td style={{ position: 'relative', padding: '0' }}>
                <Spinner spin={true} />
              </td>
        }
        <td>{patch.get('submitted').toLocaleString()}</td>
        <td><a href="">Details</a></td>
      </tr>
    )
  },

  render: function () {
    return (
      <div>
        <h1>Submitted patches</h1>

        <button className="btn btn-primary" onClick={this.handleCheckStatus}>
        Refresh patch status
        </button>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Resolved</th>
              <th>Merged</th>
              <th>Submitted on</th>
              <th />
            </tr>
          </thead>
          <tbody>
            { this.props.localPatches.map(this.renderPatchRow) }
          </tbody>
        </table>
      </div>
    )
  }
});

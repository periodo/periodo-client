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
    return { checkingStatuses: false, statuses: null }
  },

  handleCheckStatus: function () {
    this.setState({ checkingStatuses: true, statuses: Immutable.Map() }, this.checkStatuses);
  },

  checkStatuses: function () {

    this.props.localPatches
      .filter(patch => !patch.get('resolved'))
      .map(patch => fetchPatch(patch).then(([localPatch, serverPatch]) => {
        var fn = serverPatch.merged ?
          this.props.backend.markSubmittedPatchMerged :
          this.props.backend.markSubmittedPatchNotMerged

        return fn(localPatch.get('id'), serverPatch)
            .then(() => this.setState(prev => ({
              statuses: prev.statuses.set(localPatch.get('id'), serverPatch.merged)
            })));
      }));
  },

  render: function () {
    var Spinner = require('./shared/spinner.jsx')

    return (
      <div>
        <h1>Submitted patches</h1>

        <button className="btn btn-primary" onClick={this.handleCheckStatus}>
        Refresh patch status
        </button>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Resolved?</th>
              <th>Submitted on</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {
              this.props.localPatches.map(patch =>
                <tr>
                    {
                      !this.state.checkingStatuses ?
                        <td>{patch.get('resolved') ? 'Yes' : 'No'}</td> :
                          this.state.statuses.has(patch.get('id')) ?
                            <td>
                              {
                                this.state.statuses.get(patch.get('id')) ?
                                  'Yes' : 'No'
                              }
                            </td> :
                            <td style={{ position: 'relative', padding: '0' }}>
                              <Spinner spin={true} />
                            </td>
                    }
                  <td>{patch.get('submitted').toLocaleString()}</td>
                  <td><a href="">Details</a></td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>
    )
  }
});

"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , PatchList

PatchList = React.createClass({
  render: function () {
    var urlForPatch

    urlForPatch = patchURI => this.props.router.generate(
      'review-patch-detail', { patchURI }
    )

    return (
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>Submitted by</th>
            <th>Submitted on</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {this.props.patches.map(patch => (
          <tr className="submitted-patch">
            <td>
              <a href={patch.created_by}>
                {this.props.orcids[patch.created_by]}
              </a>
            </td>
            <td>{patch.created_at}</td>
            <td>
              <a href={urlForPatch(patch.url)}>
              Review
              </a>
            </td>
          </tr>
          ))}
        </tbody>
      </table>
    )
  }
});


module.exports = React.createClass({
  displayName: 'ReviewPatches',

  getInitialState: function () {
    return { patches: null, showingPatch: null }
  },

  componentDidMount: function () {
    this.fetchPatches();
  },

  fetchPatches: function () {
    var url = require('url')
      , { getJSON } = require('../ajax')
      , { getOrcids } = require('../helpers/patch_collection')
      , fetchOrcids = require('../utils/fetch_orcids')
      , serverURL = window.location.origin + window.location.pathname
      , datasetP
      , patchP

    datasetP = getJSON(url.resolve(serverURL, 'd/'))
      .then(([dataset]) => dataset)

    patchP = getJSON(url.resolve(serverURL, 'patches/?open=true'))
      .then(([patches]) => patches)

    return patchP
      .then(patches => Promise.all([
        patches,
        fetchOrcids(getOrcids(Immutable.fromJS(patches)))
      ]))
      .then(promises => Promise.all([datasetP].concat(promises)))
      .then(([dataset, patches, orcids]) => {
        this.setState({ dataset, patches, orcids })
      });
  },

  render: function () {
    return (
      <div>
        <h1>Patches submitted to server</h1>
        <p>
        These are patches submitted to the server which have not been rejected
        nor merged. To review a patch's changes and take action on it, click
        the "Review" link.
        </p>
        {
          this.state.patches && (
            <PatchList
                patches={this.state.patches}
                orcids={this.state.orcids}
                router={this.props.router} />
          )
        }
      </div>
    )
  }
});

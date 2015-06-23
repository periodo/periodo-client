"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , N3 = require('n3')
  , PatchDetail
  , PatchList

PatchList = React.createClass({
  render: function () {
    return (
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>Submitted by</th>
            <th>Submitted on</th>
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
              <a href="" onClick={this.props.onEditPatch.bind(null, patch.url, patch.text)}>
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

PatchDetail = React.createClass({
  handleMerge: function () {
    var { ajax } = require('../ajax')
      , ajaxOpts

    ajaxOpts = {
      url: this.props.data.url + 'merge',
      method: 'POST',
      headers: {}
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    ajax(ajaxOpts)
      .then(() => {
        alert('merged!');
      }, err => {
        console.log(err);
      });
  },
  render: function () {
    var ChangeList = require('./shared/change_list')
      , patch = this.props.data

    debugger;
    return (
      <div>
        <button className="btn btn-default" onClick={this.props.onHidePatch}>‹ Back to list</button>
        <h2>Review patch</h2>
        <p>Submitted at {patch.created_at} by {this.props.orcids[patch.created_by]}</p>
        {
          !patch.mergeable ?
            <div className="alert alert-warning">Unable to merge patch</div> :
            <div>
              <div className="alert alert-success">
                <p className="lead">Able to merge patch.</p>
                <br />
                <button onClick={this.handleMerge} className="btn btn-primary">Merge</button>
              </div>
              <ChangeList select={false} changes={Immutable.fromJS(this.props.patchText)} />
            </div>
        }
      </div>
    )
  }
});


function fetchOrcids(patches) {
  var ld = require('../linked_data_cache')
    , store = N3.Store()
    , orcids

  orcids = Immutable.fromJS(patches)
    .map(patch => patch.get('created_by'))
    .toSet()
    .map(orcid => ld.get(orcid))

  return Promise.all(orcids)
    .then(authors => authors.reduce((acc, { url, triples, prefixes }) => {
      var fullName = ''
        , givenName
        , familyName

      store.addTriples(triples);
      store.addPrefixes(prefixes);

      givenName = store.find(url, 'foaf:givenName', null);
      if (givenName.length) {
        givenName = N3.Util.getLiteralValue(givenName[0].object);
        fullName += (givenName + ' ');
      }

      familyName = store.find(url, 'foaf:familyName', null);
      if (familyName.length) {
        familyName = N3.Util.getLiteralValue(familyName[0].object);
        fullName += familyName;
      }

      acc[url] = fullName ? fullName.trim() : url;
      return acc;
    }, {}));
}

module.exports = React.createClass({
  displayName: 'ReviewPatches',

  getInitialState: function () {
    return { patches: null, showingPatch: null }
  },

  componentDidMount: function () {
    this.fetchPatches();
  },

  handleEditPatch: function (url, jsonpatchURL) {
    var { getJSON } = require('../ajax')

    Promise.all([getJSON(url), getJSON(jsonpatchURL)])
      .then(([[data], [patchText]]) => {
        this.setState({
          viewingDetail: { data, patchText }
        });
      });
  },

  fetchPatches: function () {
    var url = require('url')
      , { getJSON } = require('../ajax')
      , serverURL = window.location.origin + window.location.pathname
      , datasetP
      , patchP

    datasetP = getJSON(url.resolve(serverURL, 'd/'))
      .then(([dataset]) => dataset)

    patchP = getJSON(url.resolve(serverURL, 'patches/'))
      .then(([patches]) => patches)

    return patchP
      .then(patches => Promise.all([patches, fetchOrcids(patches)]))
      .then(promises => Promise.all([datasetP].concat(promises)))
      .then(([dataset, patches, orcids]) => {
        this.setState({ dataset, patches, orcids })
      });
  },

  render: function () {
    if (this.state.viewingDetail) {
      return (
        <PatchDetail
            dataset={this.props.datset}
            orcids={this.state.orcids}
            data={this.state.viewingDetail.data}
            patchText={this.state.viewingDetail.patchText}
            onHidePatch={() => this.setState({ viewingDetail: null })} />
      )
    } else if (this.state.patches) {
      return (
        <PatchList
            patches={this.state.patches}
            orcids={this.state.orcids}
            onEditPatch={this.handleEditPatch} />
      )
    } else {
      return <div></div>
    }
  }
});

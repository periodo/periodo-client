"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , N3 = require('n3')
  , React = require('react')
  , Immutable = require('immutable')
  , jsonpatch = require('fast-json-patch')
  , PatchReviewBrowser
  , PatchDetail
  , PatchList


PatchDetail = React.createClass({
  makeDiffRepresentation: function () {
    var changeListTemplate = require('../../templates/change_list')
      , fromDataset = this.props.dataset
      , toDataset = JSON.parse(JSON.stringify(fromDataset))

    jsonpatch.apply(toDataset, this.props.patchText);

    return changeListTemplate(Immutable.fromJS(this.props.patchText), {
      from: Immutable.fromJS(fromDataset),
      to: Immutable.fromJS(toDataset)
    }, true);
  },
  handleMerge: function () {
    var { ajax } = require('../../ajax')
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
    var patch = this.props.data
      , diffHTML = ''
      , mergeMessage = (<div className="alert alert-warning">Unable to merge patch</div>)

    if (patch.mergeable) {
      mergeMessage = (
        <div className="alert alert-success">
          <p className="lead">Able to merge patch.</p>
          <br />
          <button onClick={this.handleMerge} className="btn btn-primary">Merge</button>
        </div>
      )
      diffHTML = <div dangerouslySetInnerHTML={{ __html: this.makeDiffRepresentation() }} />
    }
    return (
      <div>
        <button className="btn btn-default" onClick={this.props.onHidePatch}>‹ Back to list</button>
        <h2>Review patch</h2>
        <p>Submitted at {patch.created_at} by {this.props.orcids[patch.created_by]}</p>
        {mergeMessage}
        {diffHTML}
      </div>
    )
  }
});

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
          {this.props.data.map(patch => (
          <tr className="submitted-patch">
            <td>
              <a href={patch.created_by}>
                {this.props.orcids[patch.created_by]}
              </a>
            </td>
            <td>{patch.created_at}</td>
            <td>
              <a href="" onClick={this.props.onEditPatch.bind(null, patch.url, patch.text)}>
              EDIT
              </a>
            </td>
          </tr>
          ))}
        </tbody>
      </table>
    )
  }
});

PatchReviewBrowser = React.createClass({
  showPatch: function (url, jsonpatchURL) {
    var { getJSON } = require('../../ajax')

    Promise.all([getJSON(url), getJSON(jsonpatchURL)])
      .then(([[data], [patchText]]) => {
        this.setState({
          detail: { data, patchText }
        });
      });
  },
  hidePatch: function () {
    this.setState({ detail: null });
  },
  getInitialState: function () {
    return { detail: null }
  },
  render: function () {
    if (this.state.detail) {
      return (
        <PatchDetail
          dataset={this.props.dataset}
          orcids={this.props.orcids}
          data={this.state.detail.data}
          patchText={this.state.detail.patchText}
          onHidePatch={this.hidePatch} />
      )
    } else {
      return (
        <PatchList
          data={this.props.patches}
          orcids={this.props.orcids}
          onEditPatch={this.showPatch} />
      )
    }
  }
})

module.exports = Backbone.View.extend({
  initialize: function ({ patches }) {
    this.patches = patches;
    Promise.all([this.fetchOrcids(), this.fetchDataset()])
      .then(([orcids, dataset]) => {
        this.orcids = orcids;
        this.dataset = dataset;
        this.render();
      });
  },
  fetchDataset: function () {
    var { getJSON } = require('../../ajax');
    return getJSON(window.location.origin + '/d/')
      .then(([data]) => data);
  },
  fetchOrcids: function () {
    var ld = require('../../linked_data_cache')
      , store = N3.Store()
      , orcids

    orcids = _.unique(this.patches.map(patch => patch.created_by))
      .map(orcidURL => ld.get(orcidURL))

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
  },
  render: function () {
    this.tableContainer = document.createElement('div');
    this.el.appendChild(this.tableContainer);
    React.render(<PatchReviewBrowser
      dataset={this.dataset}
      patches={this.patches}
      orcids={this.orcids} />, this.tableContainer);
  }
});

/*
    var ld = require('./linked_data_cache')

      .then(([patches]) => {
        var authors

        authors = _.unique(patches.map(patch => patch.created_by))
          .map(orcidURL => ld.get(orcidURL))

        Promise.all(authors)
          .then(authors => {
            console.log(authors);
          }, err => { throw err })
      });
*/

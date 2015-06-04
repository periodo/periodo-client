"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , N3 = require('n3')
  , React = require('react')
  , PatchReviewBrowser
  , PatchDetail
  , PatchList


PatchDetail = React.createClass({
  render: function () {
    var patch = this.props.data;
    return (
      <div>
        <button className="btn btn-default" onClick={this.props.handleClick}>‹ Back to list</button>
        <h2>Review patch</h2>
        <p>Submitted at {patch.created_at} by {this.props.orcids[patch.created_by]}</p>
        <p>{patch.mergeable ? 'Able to merge' : 'Not able to merge with current dataset.'}</p>
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
              <a href="" onClick={this.props.handleClick.bind(null, patch.url, patch.text)}>
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
        console.log(patchDetail, patchText);
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
          orcids={this.props.orcids}
          data={this.state.detail.data}
          handleClick={this.hidePatch.bind(this)} />
      )
    } else {
      return (
        <PatchList
          data={this.props.data}
          orcids={this.props.orcids}
          handleClick={this.showPatch.bind(this)} />
      )
    }
  }
})

module.exports = Backbone.View.extend({
  initialize: function ({ patches }) {
    this.patches = patches;
    this.fetchOrcids()
      .then(orcids => {
        this.orcids = orcids;
        this.render();
      });
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
    React.render(<PatchReviewBrowser data={this.patches} orcids={this.orcids} />, this.tableContainer);
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

"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'ReviewPatchDetail',

  getInitialState: function () {
    return { patchData: null, patchText: null }
  },

  componentDidMount: function () {
    this.fetchPatch();
  },

  fetchPatch: function () {
    var { getJSON } = require('../ajax')
      , { getOrcids } = require('../helpers/patch_collection')
      , fetchOrcids = require('../utils/fetch_orcids')

    getJSON(this.props.patchURI)
      .then(([data]) => Promise.all([
        data,
        getJSON(data.text),
        fetchOrcids(getOrcids(Immutable.fromJS([data])))
      ]))
      .then(([patchData, [patchText], orcids]) => this.setState({
        patchData, patchText, orcids
      }))
  },

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
  renderPatch: function () {
    var ChangeList = require('./shared/change_list')
      , patchData = this.state.patchData

    if (!patchData.mergeable) {
      return <div className="alert alert-warning">Unable to merge patch</div>
    } else {
      return (
        <div>
          <div className="alert alert-success">
            <p className="lead">Able to merge patch.</p>
            <br />
            <button onClick={this.handleMerge} className="btn btn-primary">Merge</button>
          </div>
          <ChangeList select={false} changes={Immutable.fromJS(this.state.patchText)} />
        </div>
      )
    }
  },
  render: function () {
    return (
      <div>
        <a className="btn btn-default" href={this.props.router.generate('review-patch-list')}>
          ‹ Back to list
        </a>
        <h2>Review patch</h2>
        { !this.state.patchData ? null : this.renderPatch() }
      </div>
    )
  }
});

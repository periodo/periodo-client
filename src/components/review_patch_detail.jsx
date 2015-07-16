"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , jsonpatch = require('fast-json-patch')

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
        getJSON(data.created_from),
        fetchOrcids(getOrcids(Immutable.fromJS([data])))
      ]))
      .then(([patchData, [patchText], [sourceData], orcids]) => this.setState({
        patchData,
        patchText,
        sourceData,
        orcids
      }))
  },

  handleMerge: function () {
    var { ajax } = require('../ajax')
      , ajaxOpts

    ajaxOpts = {
      url: this.state.patchData.url + 'merge',
      method: 'POST',
      headers: {}
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    ajax(ajaxOpts)
      .then(
        () => {
          alert('merged!');
        },
        ([xhr]) => {
          if (xhr.status === 403) {
            alert('You do not have permission to merge patches.');
          } else if (xhr.status === 401) {
            alert('Bad authentication credentials. Sign out and sign back in.');
          } else {
            alert(xhr.responseText);
          }

          window.periodo.handleError(xhr.responseText);
          throw new Error(xhr.responseText);
        }
      )
  },
  renderPatch: function () {
    var ChangeList = require('./shared/change_list')
      , patchData = this.state.patchData
      , destData

    if (!patchData.mergeable) {
      return <div className="alert alert-warning">Unable to merge patch</div>
    } else {

      destData = JSON.parse(JSON.stringify(this.state.sourceData));
      jsonpatch.apply(destData, this.state.patchText);

      return (
        <div>
          <div className="alert alert-success">
            <p className="lead">Able to merge patch.</p>
            <br />
            <button onClick={this.handleMerge} className="btn btn-primary">Merge</button>
          </div>
          <ChangeList
              select={false}
              patches={Immutable.fromJS(this.state.patchText)}
              sourceStore={Immutable.fromJS(this.state.sourceData)}
              destStore={Immutable.fromJS(destData)} />
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
        { this.state.patchData && this.renderPatch() }
      </div>
    )
  }
});

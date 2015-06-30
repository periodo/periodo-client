"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PatchSubmit',

  getInitialState: function () {
    return { savedPatchID: null }
  },

  saveLocalPatch: function (patchID, patches) {
    var patchObj = {
      id: patchID,
      html: React.renderToStaticMarkup(this.refs.selectChanges.refs.changes.render()),
      resolved: false,
      data: patches,
      submitted: new Date()
    }

    return this.props.backend.saveSubmittedPatch(patchObj)
  },

  handleAcceptPatches: function (patches) {
    var url = require('url')
      , { ajax } = require('../ajax')
      , opts

    opts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(patches),
      headers: {}
    }

    // Set auth header
    if (this.props.user) {
      opts.headers.Authorization = 'Bearer ' + this.props.user.token;
    }

    ajax(opts)
      .then(([, , xhr]) => {
        return xhr.getResponseHeader('Location');
      })
      .then(patchID => this.saveLocalPatch(patchID, patches))
      .then(savedPatchID => {
        this.setState({ savedPatchID }, () => this.refs.selectChanges.reset())
      })

  },

  renderSubmitPatch: function () {
    var SelectChanges = require('./shared/select_changes.jsx')
      , getChanges = data => this.props.backend.getChangesFromLocal(data)

    return (
      <div>
        <h1>Submit patch</h1>
        {
          !this.state.savedPatchID ? null :
            <div className="alert alert-success">
            Patch {this.state.savedPatchID} saved!
            </div>
        }
        <SelectChanges
            ref="selectChanges"
            confirmTitle="Submit changes?"
            getChanges={getChanges}
            onAcceptPatches={this.handleAcceptPatches} />
      </div>
    )
  },

  renderMustLogIn: function () {
    return (
      <div>
        <h1>Submit patch</h1>
        <h2>Log in required</h2>
        <p>You must be <a href={this.props.router.generate('sign-in')}>logged in</a> to submit a patch to the server.</p>
      </div>
    )
  },

  render: function () {
    return this.props.user ? this.renderSubmitPatch() : this.renderMustLogIn();
  }

});

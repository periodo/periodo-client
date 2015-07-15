"use strict";

var React = require('react')
  , Immutable = require('immutable')

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

  handleAcceptPatches: function (localPatch) {
    var url = require('url')
      , pointer = require('json-pointer')
      , { replaceIDs } = require('../helpers/skolem_ids')
      , serverURL = url.resolve(window.location.href, './')

    this.props.backend.getMappedIDs(serverURL)
      .then(idMap => {
        var remotePatch

        // Flip so that server IDs are the keys and clientIDs are the values
        idMap = idMap.flip()

        // Replace local IDs with server in the patch objet
        remotePatch = replaceIDs(Immutable.fromJS(localPatch), idMap.flip())

        // Replace values in the patch path as well
        remotePatch = remotePatch.map(patch => patch.update('path', path => pointer.compile(
          pointer.parse(path).map(key => idMap.get(key, key))
        )));

        return remotePatch;
      })
      .then(remotePatch => this.sendPatch(localPatch, remotePatch));
  },

  sendPatch: function (localPatch, remotePatch) {
    var url = require('url')
      , { ajax } = require('../ajax')
      , opts

    // TODO: replace local identifiers with server identifiers!!!!!!
    opts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(remotePatch),
      headers: {}
    }

    // Set auth header
    if (this.props.user) {
      opts.headers.Authorization = 'Bearer ' + this.props.user.token;
    }

    ajax(opts)
      .then(([, , xhr]) => xhr.getResponseHeader('Location'))
      .then(patchID => this.saveLocalPatch(patchID, localPatch))
      .then(savedPatchID => {
        this.setState({ savedPatchID }, () => this.refs.selectChanges.reset())
      })

  },

  renderSubmitPatch: function () {
    var SelectChanges = require('./shared/select_changes.jsx')
      , getChanges = (data, url) => this.props.backend.getChangesFromLocalToRemote(data, url)

    return (
      <div>
        <h1>Submit patch</h1>
        {
          this.state.savedPatchID && (
            <div className="alert alert-success">
            Patch {this.state.savedPatchID} saved!
            </div>
          )
        }
        <SelectChanges
            ref="selectChanges"
            confirmTitle="Submit changes?"
            getChanges={getChanges}
            localStore={this.props.store}
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

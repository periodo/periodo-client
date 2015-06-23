"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'Sync',

  componentWillReceiveProps: function (nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      this.refs.selectChanges.reset();
    }
  },

  handleAcceptPatches: function (patches) {
    var immpatch = require('immpatch')
      , patchedStore

    patches = patches.map(patch => {
      patch.value = Immutable.fromJS(patch.value);
      return patch;
    });

    patchedStore = immpatch(this.props.store, patches);
    this.props.cursor.update(() => patchedStore);
  },

  render: function () {
    var SelectChanges = require('./shared/select_changes.jsx')
      , getChanges = data => this.props.backend.getChangesFromRemote(data)

    return (
      <div>
        <h1>Sync</h1>
        <SelectChanges
            ref="selectChanges"
            confirmTitle="Accept changes?"
            getChanges={getChanges}
            onAcceptPatches={this.handleAcceptPatches} />
      </div>
    )
  }
});

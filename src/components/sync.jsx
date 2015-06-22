"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , randomstr = require('../utils/randomstr')

module.exports = React.createClass({
  displayName: 'Sync',
  getInitialState: function () {
    return { url: window.location.origin + window.location.pathname }
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      this.setState({ acceptedPatches: null, changes: null });
    }
  },

  handleChange: function (e) {
    this.setState({ url: e.target.value });
  },

  handleAcceptPatches: function (acceptedPatches) {
    this.setState({ acceptedPatches });
  },

  handleAcceptChanges: function () {
    var immpatch = require('immpatch')
      , patches
      , patchedStore

    patches = this.state.acceptedPatches.toJS().map(patch => {
      patch.value = Immutable.fromJS(patch.value);
      return patch;
    });

    patchedStore = immpatch(this.props.store, patches);

    this.props.cursor.update(() => patchedStore);
  },

  fetchPeriods: function () {
    var url = require('url')
      , ajax = require('../ajax')

    this.setState({ changes: null }, () => ajax
      .getJSON(url.resolve(this.state.url, 'd/'))
      .then(([data]) => this.props.backend.getChangesFromRemote(data))
      .then(changes => this.setState({ changes })))

  },
  renderConfirmChanges: function () {
    var ChangeList = require('./shared/change_list')

    return (
      <div>
        <h1>Accept changes?</h1>
        <div>
          <button
              className="btn btn-primary"
              onClick={this.handleAcceptChanges}>
            Yes
          </button>
        </div>

        <ChangeList changes={this.state.acceptedPatches} select={false} />
      </div>
    )
  },
  renderSelectChanges: function () {
    var ChangeList = require('./shared/change_list')
      , randomID = randomstr()

    return (
      <div>
        <h1>Sync</h1>
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label htmlFor={'sync-url-' + randomID}>
            PeriodO server URL
          </label>
          <input
              id={'sync-url-' + randomID}
              type="text"
              className="form-control"
              value={this.state.url}
              onChange={this.handleChange} />
          <p className="help-block">
            URL of a PeriodO server from which you will be able to download periods.
          </p>

          <button className="btn btn-default" onClick={this.fetchPeriods}>
            Fetch
          </button>
        </div>

        {
          !this.state.changes ? null :
            <ChangeList
                onAcceptPatches={this.handleAcceptPatches}
                changes={this.state.changes}
                select={true} />
        }
      </div>
    )
  },
  render: function () {
    return this.state.acceptedPatches ?
      this.renderConfirmChanges() :
      this.renderSelectChanges()
  }
});

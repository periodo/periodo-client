"use strict";

var React = require('react')
  , randomstr = require('../../utils/randomstr')

module.exports = React.createClass({
  displayName: 'SelectChanges',

  propTypes: {
    getChanges: React.PropTypes.func.isRequired,
    confirmTitle: React.PropTypes.string.isRequired,
    onAcceptPatches: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return { url: window.location.origin + window.location.pathname }
  },

  reset: function (cb) {
    return this.setState({ acceptedPatches: null, changes: null }, cb);
  },

  handleChange: function (e) {
    this.setState({ url: e.target.value });
  },

  handleAcceptPatches: function (acceptedPatches) {
    this.setState({ acceptedPatches });
  },

  handleAcceptChanges: function () {
    this.props.onAcceptPatches(this.state.acceptedPatches.toJS());
  },

  fetchPeriods: function () {
    var url = require('url')
      , ajax = require('../../ajax')
      , serverURL = this.state.url

    if (!serverURL.slice(-1) === '/') {
      serverURL += '/';
    }

    this.setState({ changes: null }, () => ajax
      .getJSON(url.resolve(serverURL, 'd/'))
      .then(([data]) => this.props.getChanges(data, serverURL))
      .then(changes => this.setState({ changes })))

  },
  renderConfirmChanges: function () {
    var ChangeList = require('./change_list')

    return (
      <div>
        <h2>{this.props.confirmTitle}</h2>
        <div>
          <button
              className="btn btn-primary"
              onClick={this.handleAcceptChanges}>
            Yes
          </button>
        </div>

        <ChangeList
            ref="changes"
            select={false}
            {...this.state.changes}
            patches={this.state.acceptedPatches} />
      </div>
    )
  },
  renderSelectChanges: function () {
    var ChangeList = require('./change_list')
      , randomID = randomstr()

    return (
      <div>
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
            URL of a PeriodO server.
          </p>

          <button className="btn btn-default" onClick={this.fetchPeriods}>
            Fetch
          </button>
        </div>

        { this.state.changes && (
            <ChangeList
                select={true}
                onAcceptPatches={this.handleAcceptPatches}
                {...this.state.changes} />
        ) }
      </div>
    )
  },
  render: function () {
    return this.state.acceptedPatches ?
      this.renderConfirmChanges() :
      this.renderSelectChanges()
  }
});

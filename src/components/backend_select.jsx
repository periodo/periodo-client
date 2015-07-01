"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , BackendForm

BackendForm = React.createClass({
  getInitialState: function () {
    return { type: 'idb' }
  },
  handleChange: function (e) {
    if (e.target.name === 'type') {
      this.replaceState({ type: e.target.value });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  },
  handleSave: function () {
    require('../backends')
      .create(this.state)
      .then(() => window.location.reload())
  },
  isValidState: function () {
    var isValid = (
      !!this.state.type &&
      !!this.state.name &&
      /^\w+$/.test(this.state.name) &&
      this.props.existing.indexOf(this.state.name) === -1
    )

    if (this.state.type === 'web') {
      isValid = isValid && !!this.state.url;
    }

    return isValid;
  },
  render: function () {
    var Input = require('./shared/input.jsx')

    var webSource = this.state.type !== 'web' ? '' : (
      <Input
          id="js-web-source"
          name="url"
          label="Source"
          value={this.state.source}
          onChange={this.handleChange} />
    )

    return (
      <div className="row">
        <div className="col-md-4">
          <h2>Add backend</h2>

          <div className="form-group">
            <label htmlFor="js-backend-type">Type</label>
            <select
                name="type"
                value={this.state.type}
                onChange={this.handleChange}
                id="js-backend-type"
                className="form-control">
              <option value="idb">IndexedDB (editable, stored locally)</option>
              <option value="web">Web (read-only, accessed remotely)</option>
            </select>
          </div>

          <div className="form-group">
            <Input
                id="js-name"
                name="name"
                label="Name"
                value={this.state.name}
                onChange={this.handleChange} />
            { webSource }
          </div>

          <div>
            <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleSave}
                disabled={!this.isValidState()}>Add</button>
          </div>
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  displayName: 'BackendSelect',
  render: function () {
    var sortedBackends = Immutable.fromJS(this.props.backends)

    sortedBackends = sortedBackends
      .toOrderedMap()
      .sort((a, b) => b === 'web' ? 1 : 0)
      .valueSeq()

    return (
      <div>
        <h2>Select backends</h2>
        <p>Select a backend to use.</p>
        <ul>
          {sortedBackends.map(backend => (
            <li key={backend.get('name')} className="backend-option">
              <a href={'#p/' + backend.get('name') + '/'}>
                { backend.get('name') } ({ backend.get('type') })
              </a>
            </li>
          ))}
        </ul>
        <BackendForm existing={Object.keys(this.props.backends)} />
      </div>
    )
  }
});

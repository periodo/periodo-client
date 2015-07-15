"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  getInitialState: function () {
    return {
      data: Immutable.Map({
        creators: Immutable.fromJS([{ name: '' }]),
        contributors: Immutable.fromJS([{ name: '' }])
      }).merge(this.props.data || Immutable.Map())
    }
  },
  handleSourceChange: function () {
    var source = this.state.data
      .map(val => val instanceof Immutable.Iterable ? val.filter(v => v) : val)
      .filter(val => val instanceof Immutable.Iterable ? val.size : val.length)

    this.props.onSourceChange(source);
  },
  handleChange: function (e) {
    var name = e.target.name
      , value = e.target.value

    this.setState(prev => ({
      data: value ? prev.data.set(name, value) : prev.data.delete(name)
    }), this.handleSourceChange);
  },
  handleNameChange: function (type, idx, e) {
    var value = e.target.value;
    this.setState(prev => ({
      data: prev.data.update(type, names => names.update(idx, name => name.set('name', value)))
    }), this.handleSourceChange);
  },
  handleNameRemove: function (type, idx) {
    var newState = this.state.data.get(type).delete(idx)

    if (!newState.size) newState = newState.push('');

    this.setState(prev => ({
      data: prev.data.set(type, newState)
    }), this.handleSourceChange);
  },
  handleNameAdd: function (type, idx) {
    if (!this.state.data.get(type).get(idx)) return;

    this.setState(prev => ({
      data: prev.data.update(type, names => names.splice(idx + 1, 0, Immutable.Map({ name: '' })))
    }), this.handleSourceChange)
  },
  render: function () {
    var Input = require('../input.jsx')
    return (
      <div>
        <h3>Non linked data source</h3>
        <div>
          <div className="form-group">
            <label htmlFor="source-citation">Citation (required)</label>
            <p className="small">
              Include any identifying information for this source. A full formatted citation is encouraged, but a title alone is sufficient.
            </p>
            <textarea
                className="form-control"
                id="source-citation"
                name="citation"
                value={this.state.data.get('citation')}
                onChange={this.handleChange}
                rows={4} />
          </div>

          <Input
              name="title"
              id="source-title"
              label="Title"
              value={this.state.data.get('title')}
              onChange={this.handleChange} />

          <Input
              name="url"
              id="source-url"
              label="URL"
              value={this.state.data.get('url')}
              onChange={this.handleChange} />

          <Input
              name="sameAs"
              id="source-sameAs"
              label="Same as (read-only)"
              value={this.state.data.get('sameAs')}
              disabled={true} />

          <Input
              name="yearPublished"
              id="source-year-published"
              label="Year published"
              value={this.state.data.get('yearPublished')}
              onChange={this.handleChange} />

          <div className="form-group">
            <label htmlFor="source-name">Creators</label>
            {this.state.data.get('creators').map((name, i) => (
              <div className="input-group">
                <input
                    className="form-control"
                    name="source-name"
                    key={'creators' + i}
                    type="text"
                    value={name.get('name')}
                    onChange={this.handleNameChange.bind(null, 'creators', i)} />
                <span
                    className="input-group-addon btn"
                    onClick={this.handleNameAdd.bind(null, 'creators', i)}>
                  <strong>+</strong>
                </span>
                <span
                    className="input-group-addon btn"
                    onClick={this.handleNameRemove.bind(null, 'creators', i)}>
                  <strong>-</strong>
                </span>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="source-name">Contributors</label>
            {this.state.data.get('contributors').map((name, i) => (
              <div className="input-group">
                <input
                    className="form-control"
                    name="source-name"
                    key={'contributors' + i}
                    type="text"
                    value={name.get('name')}
                    onChange={this.handleNameChange.bind(null, 'contributors', i)} />
                <span
                    className="input-group-addon btn"
                    onClick={this.handleNameAdd.bind(null, 'contributors', i)}>
                  <strong>+</strong>
                </span>
                <span
                    className="input-group-addon btn"
                    onClick={this.handleNameRemove.bind(null, 'contributors', i)}>
                  <strong>-</strong>
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    )
  }
});

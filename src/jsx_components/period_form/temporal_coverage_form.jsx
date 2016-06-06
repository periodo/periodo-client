"use strict";

var React = require('react')
  , TerminusInput = require('./terminus_input.jsx')

module.exports = React.createClass({
  displayName: 'PeriodTemporalCoverageForm',

  getInitialState() {
    var { wasAutoparsed } = require('../../helpers/terminus')
      , autoparse

    if (!this.props.start && !this.props.stop) {
      autoparse = true;
    } else {
      autoparse = (
        wasAutoparsed(this.props.start) &&
        wasAutoparsed(this.props.stop)
      )
    }

    return {
      start: this.props.start,
      stop: this.props.stop,
      autoparse
    }
  },

  getValue() {
    return { start: this.state.start, stop: this.state.stop }
  },

  toggleAutoparse() {
    this.setState(
      prev => ({ autoparse: !prev.autoparse }),
      () => {
        if (this.state.autoparse) {
          this.refs.startTerminus.refreshAutoparse();
          this.refs.stopTerminus.refreshAutoparse();
        }
      });
  },

  handleTerminusChange(terminusType, value) {
    this.setState({ [terminusType]: value });
  },

  render() {
    return (
      <div>
        <h3>Temporal coverage</h3>

        <div>
          <label>
            <input
                type="checkbox"
                checked={this.state.autoparse}
                onChange={this.toggleAutoparse} /> Parse dates automatically
          </label>
        </div>

        <h4 className="field-required-label">Start</h4>
        <TerminusInput
            ref="startTerminus"
            terminus={this.state.start}
            autoparse={this.state.autoparse}
            onChange={this.handleTerminusChange.bind(null, 'start')}
            terminusType="start" />

        <h4 className="field-required-label">Stop</h4>
        <TerminusInput
            ref="stopTerminus"
            terminus={this.state.stop}
            autoparse={this.state.autoparse}
            onChange={this.handleTerminusChange.bind(null, 'stop')}
            terminusType="stop" />
      </div>
    )
  }
});
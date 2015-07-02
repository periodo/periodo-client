"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'RangeSelection',

  propTypes: {
    periods: React.PropTypes.instanceOf(Immutable.Iterable),
    onChange: React.PropTypes.func
  },

  getInitialState: function () {
    return {}
  },

  componentDidMount: function () {
    var RangeSelectionVis = require('../../visualizations/range_selection')
      , vis

    vis = new RangeSelectionVis({
      data: this.props.periods,
      el: React.findDOMNode(this.refs.vis),
      onChange: this.props.onChange
    });

    this.setState({
      vis,
      earliest: vis.dateRangeStart,
      latest: vis.dateRangeStop,
    });
  },

  componentDidUnmount: function () {
    if (this.state.vis) {
      this.state.vis.remove();
    }
  },

  componentWillReceiveProps: function (nextProps) {
    var shouldUpdateVis = (
      this.state.vis &&
      nextProps.periods &&
      !nextProps.periods.equals(this.props.periods)
    );

    if (shouldUpdateVis) {
      this.state.vis.update(nextProps.periods);
      this.setState({
        earliest: this.state.vis.dateRangeStart,
        latest: this.state.vis.dateRangeStop,
      });
    }
  },

  render: function () {
    return (
      <div>
        <div ref="vis" />
        <div>
          Viewing from {this.state.earliest} to {this.state.latest}
        </div>
      </div>
    )
  }
});

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

    this.setState({ vis });
  },

  componentDidUnmount: function () {
    if (this.state.vis) {
      this.state.vis.remove();
    }
  },

  getExtent: function () {
    if (!this.state.vis) return [null, null];

    var { dateRangeStart, dateRangeStop } = this.state.vis
      , start
      , end

    if (this.state.vis.brush) {
      [start, end] = this.state.vis.brush.extent();
      if (start === end) {
        start = dateRangeStart;
        end = dateRangeStop;
      }
    }

    if (start === undefined || end === undefined) {
      start = dateRangeStart;
      end = dateRangeStop;
    }

    return [Math.floor(start), Math.floor(end)];
  },

  isBrushed: function () {
    var brushStart
      , brushStop

    if (!this.state.vis || !this.state.vis.brush) {
      return false
    }

    [brushStart, brushStop] = this.state.vis.brush.extent();

    return brushStart !== brushStop;
  },

  componentWillReceiveProps: function (nextProps) {
    var shouldUpdateVis = (
      this.state.vis &&
      nextProps.periods &&
      !nextProps.periods.equals(this.props.periods)
    );

    if (shouldUpdateVis) {
      this.state.vis.update(nextProps.periods);
      this.forceUpdate();
    }
  },

  render: function () {
    var [earliest, latest] = this.getExtent();
    return (
      <div className="clearfix">
        <div style={{ float: "left" }} ref="vis" />
        <div>
          Viewing from {earliest} to {latest}
          {/*
          <br />
          <button
              disabled={!this.isBrushed()}
              className="btn btn-default">
            Select
          </button>
          */}
        </div>
      </div>
    )
  }
});

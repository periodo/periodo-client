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
    return { vis: null, hideOutliers: true }
  },

  handleCheck: function (e) {
    var hideOutliers = e.target.checked;
    this.setState({ hideOutliers });
  },

  componentDidMount: function () {
    var RangeSelectionVis = require('../../visualizations/range_selection')
      , vis

    vis = new RangeSelectionVis({
      data: this.props.periods,
      el: React.findDOMNode(this.refs.vis),
      onChange: this.props.onChange,
      hideOutliers: true
    });

    this.setState({ vis });
  },

  componentDidUnmount: function () {
    if (this.state.vis) this.state.vis.remove();
  },

  getBrushedExtent: function () {
    if (this.state.vis && this.state.vis.brush) {
      let [start, end] = this.state.vis.brush.extent();
      if (start !== end) return [start, end];
    }

    return null
  },

  getHiddenRange: function () {
    if (this.state.vis) {
      var [absoluteRangeStart] = this.state.vis.absoluteRange
        , visibleRangeStart = this.state.vis.dateRangeStart

      if (absoluteRangeStart < visibleRangeStart) {
        return [absoluteRangeStart, visibleRangeStart];
      }
    }

    return null;
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

  componentWillUpdate: function (nextProps, nextState) {
    var hasNewPeriods
      , updatedHideOutliers

    if (!this.state.vis) return;

    hasNewPeriods = (
      nextProps.periods &&
      !nextProps.periods.equals(this.props.periods)
    );

    if (hasNewPeriods) {
      this.state.vis.brush.clear();
      this.props.onChange({ start: null, end: null });
      this.state.vis.update(nextProps.periods);
    }

    updatedHideOutliers = (
      nextState.hasOwnProperty('hideOutliers') &&
      nextState.hideOutliers !== this.state.hideOutliers
    )

    if (updatedHideOutliers) {
      this.state.vis.brush.clear();
      this.props.onChange({ start: null, end: null });
      this.state.vis.hideOutliers = nextState.hideOutliers;
      this.state.vis.render();
    }
  },

  render: function () {
    var hiddenRange = this.getHiddenRange();

    return (
      <div className="clearfix">
        <div style={{ float: "left" }} ref="vis" />
        <div>
          <div className="checkbox">
            <label>
              Hide outliers?
              {' '}
              <input onChange={this.handleCheck} checked={this.state.hideOutliers} type="checkbox" />
            </label>
          </div>
          {
            hiddenRange && (
              <div>
                <div>Hiding range from {hiddenRange[0]} to {hiddenRange[1]}</div>
              </div>
            )
          }
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

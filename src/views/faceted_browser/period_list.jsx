"use strict";

var React = require('react')
  , PeriodRow

PeriodRow = React.createClass({
  render: function () {
    return (
      <tr>
        <td>{this.props.data.get('label') }</td>
        <td>{this.props.data.getIn(['start', 'label']) || ''}</td>
        <td>{this.props.data.getIn(['stop', 'label']) || ''}</td>
      </tr>
    )
  }
});

module.exports = React.createClass({
  render: function () {
    var periods = this.props.periods.toSeq().take(20).map(period => (
      <PeriodRow key={period.get('id')} data={period} />
    ));
    return (
      <div>
        <h2>Matched periods</h2>
        <div>Viewing 1 - 20 of {this.props.periods.size}</div>
        <table className="table table-hover">
          <thead className="nowrap">
            <tr>
              <th>Label</th>
              <th>Earliest start</th>
              <th>Latest stop</th>
            </tr>
          </thead>
          <tbody>
            {periods}
          </tbody>
        </table>
      </div>
    )
  }
});

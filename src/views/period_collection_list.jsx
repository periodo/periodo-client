"use strict";

var React = require('react')
  , PeriodCollectionRow

PeriodCollectionRow = React.createClass({
  getTerminusDate: function (type) {
    var terminus = this.props.data[type];
    return terminus && terminus.iso
  },
  getTerminusLabel: function (type) {
    var terminus = this.props.data[type];
    return terminus && terminus.label
  },
  getURL: function () {
    var id = encodeURIComponent(this.props.data.id);
    return `#${this.props.backend.path}periodCollections/${id}/`;
  },
  render: function () {
    return (
      <tr>
        <td>
          <a href={this.getURL()}>{this.props.data.source}</a>
        </td>

        <td>
          {this.props.data.definitions}
        </td>

        <td data-sort={this.getTerminusDate('earliest')}>
          {this.getTerminusLabel('earliest')}
        </td>

        <td data-sort={this.getTerminusDate('latest')}>
          {this.getTerminusLabel('latest')}
        </td>
      </tr>
    )
  }
});

module.exports = React.createClass({
  componentDidMount: function () {
    var sortTable = require('../utils/sort_table')
      , table = React.findDOMNode(this)

    sortTable(table);
  },
  render: function () {
    var rows = this.props.data.map(collection => (
      <PeriodCollectionRow key={collection.id}
                           backend={this.props.backend}
                           data={collection} />
    ));
    return (
      <table className="table table-hover">
        <thead className="nowrap">
          <tr>
            <th data-sort-method="natural"
                className="sort-default">Source title</th>
            <th data-sort-method="num">Defined periods</th>
            <th data-sort-method="num">Earliest start</th>
            <th data-sort-method="num">Latest stop</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    )
  }
});

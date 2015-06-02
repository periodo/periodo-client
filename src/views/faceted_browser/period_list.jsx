"use strict";

var React = require('react')
  , Paginate = require('react-paginate')
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
  getInitialState: function () {
    return { limit: 20, start: 0, page: 0}
  },
  componentWillReceiveProps: function () {
    this.setState({ start: 0, page: 0 });
  },
  getFirstIndex: function () {
    return this.state.start + 1;
  },
  getLastIndex: function () {
    var { start, limit } = this.state
      , numPeriods = this.props.periods.size

    return (start + limit) > numPeriods ? numPeriods : start + limit;
  },
  getNumberOfPages: function () {
    var numPeriods = this.props.periods.size
    return numPeriods ?  Math.ceil(numPeriods / this.state.limit) : 1;
  },
  handlePageClick: function (data) {
    this.setState({
      start: data.selected * this.state.limit,
      page: data.selected
    });
  },
  render: function () {
    var periods = this.props.periods
      .toSeq()
      .skip(this.state.start)
      .take(this.state.limit)
      .map(period => (<PeriodRow key={period.get('id')} data={period} />))

    return (
      <div>
        <h2>Matched periods</h2>
        <div>
          Viewing {this.getFirstIndex()} - {this.getLastIndex()} of {this.props.periods.size}
        </div>
        <div>
          <Paginate containerClassName="pagination-container pagination"
                    subContainerClassName="pages pagination"
                    activeClass="active"
                    forceSelected={this.state.page}
                    marginPagesDisplayed={2}
                    breakLabel={<li className="break"><a href="">...</a></li>}
                    pageNum={this.getNumberOfPages()}
                    clickCallback={this.handlePageClick} />
        </div>
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

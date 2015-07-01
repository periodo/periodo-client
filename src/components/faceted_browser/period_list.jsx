"use strict";

var React = require('react')
  , { getDisplayTitle } = require('../../helpers/source')
  , PeriodDetails
  , PeriodRow

PeriodRow = React.createClass({
  render: function () {
    return (
      <tr onClick={this.props.handleClick}>
        <td>{this.props.data.get('label') }</td>
        <td>{this.props.data.getIn(['start', 'label']) || ''}</td>
        <td>{this.props.data.getIn(['stop', 'label']) || ''}</td>
      </tr>
    )
  }
});

PeriodDetails = React.createClass({
  render: function () {
    var Period = require('../../components/shared/period.jsx')
      , linkBase = this.props.dataset.getIn(['@context', '@base'])
      , collectionID = this.props.period.get('collection_id')
      , collectionURL = `#${this.props.backend.path}periodCollections/${encodeURIComponent(collectionID)}/`
      , source
      , sourceHTML
      , addPermalink
      , permalink

    // Only show source if it was included in the list of periods
    source = collectionID && getDisplayTitle(this.props.dataset.getIn([
      'periodCollections', collectionID, 'source'
    ]));

    sourceHTML = !source ? '' : (
      <div>
        <span>
        In collection: <a href={collectionURL}>{source}</a>
        </span>
      </div>
    )

    addPermalink = (
      linkBase &&
      this.props.period.get('id').indexOf('.well-known/genid') !== 0
    )

    if (addPermalink) {
      let url = linkBase + this.props.period.get('id');
      permalink = (
        <div>
          <span>
          Permalink: <a href={url}>{url}</a>
          </span>
        </div>
      )
    }

    return (
      <div>
        <h4>{this.props.period.get('label')}</h4>
        {permalink}
        {sourceHTML}
        <br />
        <Period period={this.props.period} />
      </div>
    )
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    return {
      limit: 20,
      currentPage: 0,
      viewingDetails: []
    }
  },
  getDefaultProps: function () {
    return { allowClicks: true }
  },
  componentWillReceiveProps: function () {
    this.setState({ currentPage: 0, viewingDetails: []});
  },
  handlePageChange: function (currentPage) {
    this.setState({ currentPage, viewingDetails: [] });
  },
  showPeriodRow: function (period) {
    this.setState(prev => {
      prev.viewingDetails = prev.viewingDetails.concat(period.get('id'));
      return prev;
    });
  },
  hidePeriodRow: function (period, e) {
    // Don't hide row if user clicked on a link
    var shouldHide = e.target.nodeName !== 'A'
      , selection = window.getSelection()

    // Don't hide row if user selected text within the row
    if (shouldHide && selection.type === 'Range') {
      let thisNode = React.findDOMNode(this)
        , cmpNode = selection.baseNode

      do {
        shouldHide = cmpNode !== thisNode;
        if (!shouldHide) break;
      } while ((cmpNode = cmpNode.parentNode));
    }

    if (shouldHide) {
      this.setState(prev => {
        prev.viewingDetails = prev.viewingDetails.filter(id => id !== period.get('id'));
      });
    }
  },
  renderShownPeriod: function (period) {
    return (
        <PeriodDetails
            period={period}
            backend={this.props.backend}
            dataset={this.props.dataset} />
    )
  },
  getMatchedPeriods: function () {
    return this.props.periods
      .toSeq()
      .skip(this.getFirstIndex())
      .take(this.state.limit)
      .map(period => {
        if (this.state.viewingDetails.indexOf(period.get('id')) === -1) {
          return (
            <PeriodRow
                key={period.get('id')}
                data={period}
                handleClick={this.showPeriodRow.bind(this, period)} />
          )
        } else {
          return (
            <tr key={period.get('id')}
                className="period-details-row"
                onClick={this.hidePeriodRow.bind(this, period)}>
              <td colSpan={3}>
                {(this.props.renderShownPeriod || this.renderShownPeriod)(period)}
              </td>
            </tr>
          )
        }
      });
  },
  getFirstIndex: function () {
    return this.state.currentPage * this.state.limit;
  },
  render: function () {
    var Paginator = require('../../components/shared/paginate.jsx')
      , periods = this.getMatchedPeriods()
      , firstIndex = this.getFirstIndex()

    return (
      <div>
        <div>
          Viewing {firstIndex + 1} - {firstIndex + periods.size} of {this.props.periods.size}
        </div>
        <div>
          <Paginator
              numItems={this.props.periods.size}
              limit={this.state.limit}
              currentPage={this.state.currentPage}
              onPageChange={this.handlePageChange} />
        </div>
        <table className="period-detail-table table table-hover">
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

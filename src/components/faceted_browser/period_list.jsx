"use strict";

var React = require('react')
  , { getDisplayTitle } = require('../../helpers/source')
  , PeriodDetails
  , PeriodRow

PeriodRow = React.createClass({
  render: function () {
    var { getEarliestYear, getLatestYear } = require('../../helpers/terminus')
      , earliestStart = getEarliestYear(this.props.data.get('start'))
      , latestStop = getLatestYear(this.props.data.get('stop'))

    return (
      <tr onClick={this.props.handleClick}>
        <td>{this.props.data.get('label') }</td>
        <td>
          {
            earliestStart !== null ?
              earliestStart :
              <em className="quiet">{ this.props.data.getIn(['start', 'label'], 'none') }</em>
          }
        </td>
        <td>
          {
            latestStop !== null ?
              latestStop :
              <em className="quiet">{ this.props.data.getIn(['stop', 'label'], 'none') }</em>
          }
        </td>
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
  propTypes: {
    /*
     * backend,
     * dataset,
     * periods,
     * renderShownPeriod
     *
     * initiallyShownPeriodID
     *
     */
  },

  getPageFor(periodID, sequence) {
    var foundPeriod = sequence.find(period => period.get('id') === periodID);
    return foundPeriod ?
      Math.floor(sequence.indexOf(foundPeriod) / this.state.limit) :
      null
  },

  getInitialState: function () {
    return {
      periodSeq: null,
      limit: 20,
      sortBy: 'label',
      sortOrder: 'asc',
      currentPage: 0,
      viewingDetails: []
    }
  },

  componentWillMount: function () {
    var periodSeq
      , updatedPage

    periodSeq = this.updateSortedPeriodSeq();

    if (this.props.initiallyShownPeriodID) {
      updatedPage = this.getPageFor(this.props.initiallyShownPeriodID, periodSeq);
      if (updatedPage) {
        this.setState({
          currentPage: updatedPage,
          viewingDetails: [this.props.initiallyShownPeriodID]
        });
      }
    }
  },
  getDefaultProps: function () {
    return { allowClicks: true }
  },
  componentWillReceiveProps: function (nextProps) {
    var toSet = { currentPage: 0, viewingDetails: [] }

    if (nextProps.periods) {
      toSet.periodSeq = this.getSortedPeriodSeq(nextProps.periods);
    }

    this.setState(toSet);
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
  updateSortedPeriodSeq: function () {
    var periodSeq = this.getSortedPeriodSeq(this.props.periods);
    this.setState({ periodSeq });
    return periodSeq;
  },
  getSortedPeriodSeq: function (periods) {
    var { getEarliestYear, getLatestYear } = require('../../helpers/terminus')
      , naturalSort = require('javascript-natural-sort')

    return periods
      .sort((a, b) => {
        var ret;

        if (this.state.sortBy === 'label') {
          ret = naturalSort(a.get('label'), b.get('label'));
        } else {
          let yearA
            , yearB

          yearA = this.state.sortBy === 'earliestStart' ?
            getEarliestYear(a.get('start')) :
            getLatestYear(a.get('stop'))

          yearB = this.state.sortBy === 'earliestStart' ?
            getEarliestYear(b.get('start')) :
            getLatestYear(b.get('stop'))

          if (yearA === null) return 1;
          if (yearB === null) return -1;
          if (yearA === yearB) return 0;

          ret = yearA < yearB ? -1 : 1;
        }

        return this.state.sortOrder === 'asc' ? ret : -ret;
      })
      .toSeq()
  },
  getMatchedPeriods: function () {
    return this.state.periodSeq
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
  handleHeaderClick: function (fieldName) {
    this.setState(prev => {
      var toSet = {};

      if (prev.sortBy === fieldName) {
        toSet.sortOrder = prev.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        toSet.sortBy = fieldName;
      }

      return toSet;
    }, this.updateSortedPeriodSeq);
  },
  render: function () {
    var Paginator = require('../../components/shared/paginate.jsx')
      , periods = this.getMatchedPeriods()
      , firstIndex = this.getFirstIndex()
      , sortClassName = 'sort-' + this.state.sortOrder

    return (
      <div>
        <div>
          Viewing {firstIndex + 1} - {firstIndex + periods.size} of {this.props.periods.size}
        </div>

        <div>
          <Paginator
              numItems={this.props.periods.size}
              limit={this.state.limit}
              initialPage={this.state.currentPage}
              currentPage={this.state.currentPage}
              onPageChange={this.handlePageChange} />
        </div>
        <table className="period-detail-table table table-hover">
          <thead className="nowrap">
            <tr className="sort-headers">
              <th onClick={this.handleHeaderClick.bind(null, 'label')}
                  className={ this.state.sortBy !== 'label' ? '' : sortClassName }>
                Label
              </th>
              <th onClick={this.handleHeaderClick.bind(null, 'earliestStart')}
                  className={ this.state.sortBy !== 'earliestStart' ? '' : sortClassName }>
                Earliest start
              </th>
              <th onClick={this.handleHeaderClick.bind(null, 'latestStop')}
                  className={ this.state.sortBy !== 'latestStop' ? '' : sortClassName }>
                Latest stop
              </th>
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

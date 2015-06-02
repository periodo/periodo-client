"use strict";

var React = require('react')
  , Paginate = require('react-paginate')
  , linkify = require('linkify-it')()
  , { getDisplayTitle } = require('../../helpers/source')
  , PeriodDetailsRow
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

function makePeriodDetail(period) {
  var template = require('../../templates/period.html')
    , html = template({ period: period.toJSON() })
    , links = linkify.match(html) || []

  links.reverse().forEach(match => {
    let minusOne = ',;.'.indexOf(match.url.slice(-1)) !== -1
      , url = minusOne ? match.url.slice(0,-1) : match.url
      , lastIndex = minusOne ? match.lastIndex - 1 : match.lastIndex

    html = (
      html.slice(0, match.index) +
      `<a target="_blank" href=${url}>${url}</a>` +
      html.slice(lastIndex)
    )
  });

  return html
}

PeriodDetailsRow = React.createClass({
  render: function () {
    var html = { __html: makePeriodDetail(this.props.data) }
      , linkBase = this.props.dataset.getIn(['@context', '@base'])
      , collectionID = this.props.data.get('id').slice(0,7)
      , collectionURL = `#${this.props.backend.path}periodCollections/${collectionID}/`
      , source
      , addPermalink
      , permalink

    debugger;
    source = getDisplayTitle(this.props.dataset.getIn([
      'periodCollections', collectionID, 'source'
    ]));

    addPermalink = (
      linkBase &&
      this.props.data.get('id').indexOf('.well-known/genid') !== 0
    )

    if (addPermalink) {
      let url = linkBase + this.props.data.get('id');
      permalink = (
        <div>
          <span>
          Permalink: <a href={url}>{url}</a>
          </span>
        </div>
      )
    }

    return (
      <tr onClick={this.props.handleClick} className="period-details-row">
        <td colSpan={3}>
          <h4>{this.props.data.get('label')}</h4>
          {permalink}
          <div>
            <span>
            In collection: <a href={collectionURL}>{source}</a>
            </span>
          </div>
          <br />
          <div dangerouslySetInnerHTML={html} />
        </td>
      </tr>
    )
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    return { limit: 20, start: 0, page: 0, viewingDetails: [] }
  },
  componentWillReceiveProps: function () {
    this.setState({ start: 0, page: 0, viewingDetails: []});
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
      page: data.selected,
      viewingDetails: []
    });
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
  render: function () {
    var periods = this.props.periods
      .toSeq()
      .skip(this.state.start)
      .take(this.state.limit)
      .map(period => {
        if (this.state.viewingDetails.indexOf(period.get('id')) === -1) {
          return <PeriodRow
            key={period.get('id')}
            data={period}
            handleClick={this.showPeriodRow.bind(this, period)} />;
        } else {
          return <PeriodDetailsRow
            key={period.get('id')}
            data={period}
            dataset={this.props.dataset}
            backend={this.props.backend}
            handleClick={this.hidePeriodRow.bind(this, period)} />;
        }
      });

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

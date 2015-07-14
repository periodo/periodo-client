"use strict";

var React = require('react')
  , CollectionList

CollectionList = React.createClass({
  displayName: 'CollectionList',
  getInitialState: function () {
    return { limit: 20, currentPage: 0 }
  },
  getMatchedCollections: function () {
    var { describe } = require('../helpers/periodization')

    return this.props.store.get('periodCollections')
      .valueSeq()
      .skip(this.state.currentPage * this.state.limit)
      .take(this.state.limit)
      .map(describe)
  },
  handlePageChange: function (currentPage) {
    this.setState({ currentPage });
  },
  renderCollectionList: function () {
    var Paginator = require('./shared/paginate.jsx')
      , collections = this.getMatchedCollections()
      , numCollections = this.props.store.get('periodCollections').size
      , firstIndex = this.state.currentPage * this.state.limit
      , urlForCollection

    urlForCollection = collectionID => (
      this.props.router.generate('period-collection-show', {
        collectionID: encodeURIComponent(collectionID),
        backendName: this.props.backend.name
      })
    )

    return (
      <div>
        <div>
          Viewing { firstIndex + 1 } - { firstIndex + collections.size } of { numCollections }
        </div>
        <div className="row">
          <div className="col-md-7">
            <Paginator
                numItems={numCollections}
                limit={this.state.limit}
                currentPage={this.state.currentPage}
                onPageChange={this.handlePageChange} />
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Source title</th>
              <th>Num. of periods</th>
              <th>Earliest start</th>
              <th>Latest stop</th>
            </tr>
          </thead>
          <tbody>
            {
              collections.map(collection =>
                <tr key={collection.id}>
                  <td>
                    <a href={urlForCollection(collection.id)}>
                      { collection.source }
                    </a>
                  </td>
                  <td>{ collection.definitions }</td>
                  <td>{ collection.earliest && collection.earliest.iso }</td>
                  <td>{ collection.latest && collection.latest.iso }</td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>
    )
  },
  render: function () {
    return (
      <div>
        <h2>Period Collections</h2>

        <hr />
        <div>
          <a href={window.location.hash + 'periodCollections/add/'}
              className="btn btn-lg btn-primary">
            Add period collection
          </a>
        </div>
        <hr />

        {
          this.props.store.get('periodCollections').size === 0 ?
            <p>No period collections defined</p> :
            this.renderCollectionList()
        }
      </div>
    )

  }
});

module.exports = React.createClass({
  displayName: 'BackendHome',
  getInitialState: function () {
    return { browseBy: 'period' }
  },
  handleBrowseBy: function (browseBy) {
    this.setState({ browseBy });
  },
  render: function () {
    var FacetedBrowser = require('./faceted_browser/browser.jsx')

    return (
      <div>
        <div className="select-browse-item">
          <div>
            <ul className="nav nav-tabs">
              <li>
                <h2 style={{
                  margin: 0,
                  padding: 0,
                  marginTop: '-1px',
                  paddingRight: '14px',
                  lineHeight: '42px',
                  borderBottom: '1px solid white'
                }}>Browse by:</h2>
              </li>
              <li className={this.state.browseBy === 'period' ? 'active' : ''}>
                <a href="" onClick={this.handleBrowseBy.bind(null, 'period')}>
                  Period
                </a>
              </li>
              <li className={this.state.browseBy === 'collection' ? 'active' : ''}>
                <a href="" onClick={this.handleBrowseBy.bind(null, 'collection')}>
                  Collection
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={this.state.browseBy === 'period' ? '' : 'hide'}>
          <FacetedBrowser backend={this.props.backend} dataset={this.props.store} />
        </div>
        <div className={this.state.browseBy === 'period' ? 'hide' : ''}>
          <CollectionList
              backend={this.props.backend}
              router={this.props.router}
              store={this.props.store} />
        </div>
      </div>
    )
  }
});

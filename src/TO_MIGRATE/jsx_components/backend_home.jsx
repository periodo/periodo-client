"use strict";

var React = require('react')
  , CollectionList

CollectionList = React.createClass({
  displayName: 'CollectionList',

  getInitialState() {
    return { limit: 20, currentPage: 0 }
  },

  getMatchedCollections() {
    var { describe } = require('../utils/periodization')

    return this.props.store.get('periodCollections')
      .valueSeq()
      .skip(this.state.currentPage * this.state.limit)
      .take(this.state.limit)
      .map(describe)
  },

  handlePageChange(currentPage) {
    this.setState({ currentPage });
  },

  renderCollectionList() {
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
              collections.toArray().map(collection =>
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

  render() {
    var { backend } = this.props

    return (
      <div>
        <h2>Period Collections</h2>

        {
          backend.editable && (
            <div>
              <hr />
              <div>
                <a href={window.location.hash + 'periodCollections/add/'}
                    className="btn btn-lg btn-primary">
                  Add period collection
                </a>
              </div>
              <hr />
            </div>
          )
        }

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

  getInitialState() {
    return { browseBy: 'period' }
  },

  handleBrowseBy(browseBy) {
    this.setState({ browseBy });
  },

  render() {
    var FacetedBrowser = require('./faceted_browser/browser.jsx')

    return (
      <div>
        <div className="select-browse-item">
          <div>
            <h2 style={{
              position: 'absolute',
              margin: 0,
              padding: 0,
              lineHeight: '42px'
            }}>Browse by:</h2>
            <ul style={{ marginLeft: '120px' }} className="nav nav-tabs">
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

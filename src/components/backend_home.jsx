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
  render: function () {
    var collections = this.getMatchedCollections()
      , urlForCollection

    urlForCollection = collectionID => (
      this.props.router.generate('period-collection-show', {
        collectionID: encodeURIComponent(collectionID),
        backendName: this.props.backend.name
      })
    )

    return (
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
                    {collection.source}
                  </a>
                </td>
                <td>{collection.definitions}</td>
                <td>{collection.earliest ? collection.earliest.iso : null}</td>
                <td>{collection.latest ? collection.latest.iso : null}</td>
              </tr>
            )
          }
        </tbody>
      </table>
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
    var FacetedBrowser = require('../views/faceted_browser/browser.jsx')

    return (
      <div>
        <div className="select-browse-item">
          <h2>Browse by</h2>
          <div>
            <ul className="nav nav-pills">
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

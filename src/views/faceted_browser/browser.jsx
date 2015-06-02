"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , immfacet = require('immfacet')
  , PeriodList = require('./period_list.jsx')
  , SourceFacet = require('./source_facet.jsx')

module.exports = React.createClass({
  getInitialPeriods: function () {
    if (!this._initialPeriods) {
      this._initialPeriods = this.props.dataset
        .get('periodCollections')
        .flatMap(collection => collection.get('definitions'))
    }
    return this._initialPeriods;
  },
  getInitialFacets: function () {
    var periods
      , facets

    periods = this.props.dataset
      .get('periodCollections')
      .flatMap(collection => collection
        .get('definitions')
        .map(period => period.set('collection_id', collection.get('id'))))

    facets = immfacet(periods)
      .addFacet('source', period => {
        var collectionID = period.get('collection_id')
          , source

        source = this.props.dataset.getIn([
          'periodCollections', collectionID, 'source'
        ])

        return source.set('collection_id', collectionID);
      });

    return facets;
  },
  getInitialState: function () {
    var facets = this.getInitialFacets();
    return {
      facets,
      previouslySelectedField: null,
      previousFacets: null
    }
  },
  setFacetState: function (lastSelectedFacetField, facets) {
    this.setState(prev => {
      var { previouslySelectedField, previousFacets } = prev

      if (lastSelectedFacetField !== previouslySelectedField) {
        previouslySelectedField = lastSelectedFacetField;
        previousFacets = prev.facets;
      }

      return { facets, previouslySelectedField, previousFacets }
    });
  },
  handleSelectFacet: function (facetFieldName, value) {
    var toSelect
      , facets

    toSelect = this.state.facets.getSelectedFacetValues().get(facetFieldName) || Immutable.Set();
    toSelect = toSelect.toSet().add(value);
    facets = this.state.facets.reset(facetFieldName).select(facetFieldName, toSelect);

    this.setFacetState(facetFieldName, facets);

  },
  handleDeselectFacet: function (facetFieldName, value) {
    var toSelect
      , facets

    toSelect = this.state.facets
      .getSelectedFacetValues()
      .get(facetFieldName)
      .toSet()
      .remove(value);

    facets = toSelect.size ?
      this.state.facets.reset(facetFieldName).select(facetFieldName, toSelect) :
      this.state.facets.reset(facetFieldName);

    this.setFacetState(facetFieldName, facets);
  },
  handleResetFacet: function (facetFieldName) {
  },
  render: function () {
    var facetValues = this.state.facets.getFacetValues()
      , previousFacetValues = this.state.previousFacets && this.state.previousFacets.getFacetValues()
      , selectedFacetValues = this.state.facets.getSelectedFacetValues()
      , values

    values = this.state.previouslySelectedField === 'source' ?
      previousFacetValues.get('source') :
      facetValues.get('source')

    return (
      <div className="row">
        <div className="col-md-7">
          <PeriodList
            periods={this.state.facets.getMatchedDocuments()}
            dataset={this.props.dataset}
            backend={this.props.backend} />
        </div>
        <div className="col-md-5">
          <h2>Filters</h2>
          <SourceFacet
            selectedValues={selectedFacetValues.get('source') || []}
            onSelectFacet={this.handleSelectFacet.bind(this, 'source')}
            onDeselectFacet={this.handleDeselectFacet.bind(this, 'source')}
            values={values} />
        </div>
      </div>
    )
  }
});

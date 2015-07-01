"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , immfacet = require('immfacet')
  , PeriodList = require('./period_list.jsx')
  , FacetField = require('./facet_field.jsx')

module.exports = React.createClass({
  getInitialFacets: function () {
    var facetFields = require('./facet_fields')
      , periods
      , facets

    periods = this.props.dataset
      .get('periodCollections')
      .flatMap(collection => collection
        .get('definitions')
        .map(period => period.set('collection_id', collection.get('id'))))

    facets = immfacet(periods)

    Object.keys(facetFields).forEach(facetName => {
      let field = facetFields[facetName];
      facets = facets.addFacet(facetName, field.fn.bind(this), {
        multiValue: field.multiValue
      });
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
      , selectedFacetValues = this.state.facets.getSelectedFacetValues()
      , previousFacetValues
      , facetFields

    previousFacetValues = (
      this.state.previousFacets &&
      this.state.previousFacets.getFacetValues()
    )

    facetFields = facetValues.keySeq().map(facetName => {
      var usePreviousFacets = this.state.previouslySelectedField === facetName
        , field = require('./facet_fields')[facetName]
        , values

      values = usePreviousFacets ?
        previousFacetValues.get(facetName) :
        facetValues.get(facetName)

      return React.createElement(FacetField, {
        values,
        key: facetName,
        facetName: field.label,
        getDisplayTitle: field.getDisplayTitle,
        selectedValues: selectedFacetValues.get(facetName) || Immutable.OrderedMap(),
        onSelectFacet: this.handleSelectFacet.bind(this, facetName),
        onDeselectFacet: this.handleDeselectFacet.bind(this, facetName)
      });
    });

    var periods = this.state.facets.getMatchedDocuments()

    return (
        <div className="row">
          <div className="col-md-7">
            <h2>Periods</h2>
            {
              !periods.size ?
                <p>No periods yet defined.</p> :
                <PeriodList
                  periods={periods}
                  dataset={this.props.dataset}
                  backend={this.props.backend} />
            }
          </div>
          <div className="col-md-5">
            <h2>Filters</h2>
            {facetFields}
          </div>
        </div>
    )
  }
});

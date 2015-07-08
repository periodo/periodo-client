"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , immfacet = require('immfacet')
  , PeriodList = require('./period_list.jsx')
  , FacetField = require('./facet_field.jsx')

module.exports = React.createClass({
  getInitialState: function () {
    return {
      facets: this.getInitialFacets(),
      selectedValues: Immutable.Map(),
      brushedRange: null
    }
  },
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
      var field = facetFields[facetName];
      facets = facets.addFacet(facetName, field.fn.bind(this), {
        multiValue: field.multiValue
      });
    });

    return facets;
  },
  handleSelectFacet: function (facetFieldName, value) {
    this.setState(prev => ({
      selectedValues: prev.selectedValues.update(facetFieldName, values => {
        return (values || Immutable.Set()).add(value)
      })
    }));
  },
  handleDeselectFacet: function (facetFieldName, value) {
    this.setState(prev => {
      var selectedValues = prev.selectedValues
        .update(facetFieldName, values => values.remove(value))

      if (!selectedValues.get(facetFieldName).size) {
        selectedValues = selectedValues.delete(facetFieldName);
      }

      return { selectedValues }
    });
  },
  getFacetValues: function (fieldName) {
    var initialFacets = this.state.facets

    if (this.state.brushedRange) {
      initialFacets = initialFacets.select('_range', [true]);
    }

    // First, get the matched documents for all other fields
    var intersectingIDs = this.state.selectedValues
      .delete(fieldName)
      .reduce((facets, values, name) => facets.select(name, values), initialFacets)
      .getMatchedIDs()

    // Now, get values matching all other constraints
    return this.state.facets
      .getFacetValues({ fields: [fieldName], ids: intersectingIDs })
      .get(fieldName);
  },
  getMatchedPeriods: function (onlyInRange) {
    var initialFacets = this.state.facets

    if (this.state.brushedRange && onlyInRange) {
      initialFacets = initialFacets.select('_range', [true]);
    }

    return this.state.selectedValues
      .reduce((facets, values, name) => facets.select(name, values), initialFacets)
      .getMatchedDocuments()
  },
  handleResetFacet: function (facetName) {
    this.setState(prev => ({
      selectedValues: prev.selectedValues.delete(facetName)
    }));
  },
  handleRangeBrush: function ({ start, end }) {
    var { getEarliestYear, getLatestYear } = require('../../helpers/terminus')
      , intersects = require('../../utils/intersects')

    if (start === null && end === null) {
      this.setState(prev => ({
        brushedRange: null,
        facets: prev.facets.removeFacet('_range')
      }));
    } else {
      this.setState(prev => ({
        brushedRange: [start, end],
        facets: prev.facets.removeFacet('_range').addFacet('_range', period => {
          var earliest = period.get('start', null) && getLatestYear(period.get('start'))
            , latest = period.get('stop', null) && getEarliestYear(period.get('stop'))

          // Check if any part of the period lies within the given range [start,end]
          return (
            earliest !== null &&
            latest !== null &&
            intersects([start, end], [earliest, latest])
          )
        })
      }));
    }
  },
  render: function () {
    var RangeSelection = require('../shared/range_selection.jsx')
      , anyPeriods = this.props.dataset.get('periodCollections').size > 0
      , periodsInRange = this.getMatchedPeriods(true)
      , periods = this.getMatchedPeriods(false)
      , facetFields

    facetFields = this.state.facets.facets
      .keySeq()
      .filter(key => key !== '_range')
      .map(facetName => {
        var field = require('./facet_fields')[facetName]
          , values = this.getFacetValues(facetName)

        return React.createElement(FacetField, {
          values,
          key: facetName,
          facetName: field.label,
          getDisplayTitle: field.getDisplayTitle,
          selectedValues: this.state.selectedValues.get(facetName, Immutable.List()),
          onSelectFacet: this.handleSelectFacet.bind(this, facetName),
          onDeselectFacet: this.handleDeselectFacet.bind(this, facetName),
          onResetFacet: this.handleResetFacet.bind(this, facetName)
        });
      });

    return (
        <div className="row">
          <div className="col-md-7">
            <h2>Periods</h2>
            { !anyPeriods && <p>No periods yet defined.</p> }
            { anyPeriods && periodsInRange.size === 0 ?
                <p>No periods match filter criteria.</p> :
                <PeriodList
                  periods={periodsInRange}
                  dataset={this.props.dataset}
                  backend={this.props.backend} />
            }
          </div>
          {
            anyPeriods && (
              <div className="col-md-5">
                <h2>Filters</h2>
                <RangeSelection
                    onChange={this.handleRangeBrush}
                    periods={periods} />
                {facetFields}
              </div>
            )
          }
        </div>
    )
  }
});
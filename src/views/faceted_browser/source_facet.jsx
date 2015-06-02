"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , { getDisplayTitle } = require('../../helpers/source')
  , Source

Source = React.createClass({
  render: function () {
    return (
      <tr className="facet-result-row">
        <td className="facet-result-count">{this.props.count}</td>
        <td className="facet-result-value">
          <a href="#"
             onClick={this.props.handleClick}
             data-no-redirect>
            {getDisplayTitle(this.props.source)}
          </a>
        </td>
      </tr>
    )
  }
});

module.exports = React.createClass({
  handleFacetSelected: function (facetValue) {
    this.props.onSelectFacet(facetValue);
  },
  handleFacetDeselected: function (facetValue) {
    this.props.onDeselectFacet(facetValue);
  },
  render: function () {
    var unselectedValues = this.props.values
      , selectedValues = Immutable.OrderedMap()

    this.props.selectedValues.forEach(value => {
      let matchedIDs = unselectedValues.get(value);
      unselectedValues = unselectedValues.delete(value);
      selectedValues = selectedValues.set(value, matchedIDs);
    });

    var selectedSources = selectedValues.map((periodIDs, source) => (
        <Source key={source.get('collection_id')}
                source={source}
                count={periodIDs.size}
                handleClick={this.handleFacetDeselected.bind(this, source)} />
    ));

    var unselectedSources = unselectedValues.map((periodIDs, source) => (
        <Source key={source.get('collection_id')}
                source={source}
                count={periodIDs.size}
                handleClick={this.handleFacetSelected.bind(this, source)} />
    ));

    var selectedSection = selectedSources.length === 0 ? (<div></div>) : (
      <div>
        <h4>Selected</h4>
        <table>
          <tbody>
            {selectedSources}
          </tbody>
        </table>
        <hr />
      </div>
    )

    return (
        <div>
          <div className="facet-header clearfix">
            <span className="facet-title">Sources</span>
            <span className="facet-menu pull-right">
              <a href="#">Reset</a>
            </span>
          </div>
          <div className="facet-body">
            {selectedSection}
            <table>
              <tbody>
                {unselectedSources}
              </tbody>
            </table>
          </div>
        </div>
    )
  }
});

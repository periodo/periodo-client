"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , FacetValue

FacetValue = React.createClass({
  render: function () {
    var value = this.props.value;

    if (this.props.formatFacetValue) {
      value = this.props.formatFacetValue(value);
    }

    return (
      <tr className="facet-result-row">
        <td className="facet-result-count">{this.props.count}</td>
        <td className="facet-result-value">
          <a href="#"
             onClick={this.props.handleClick}
             data-no-redirect>
             {value}
          </a>
        </td>
      </tr>
    )
  }
});

module.exports = React.createClass({
  propTypes: {
    facetName: React.PropTypes.string.isRequired,
    values: React.PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
    selectedValues: React.PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
    formatFacetValue: React.PropTypes.func,
    onSelectFacet: React.PropTypes.func,
    onDeselectFacet: React.PropTypes.func,
    onResetFacet: React.PropTypes.func
  },

  makeFacetValueField: function (isSelected, periodIDs, value) {
    var handler = isSelected ? this.props.onDeselectFacet : this.props.onSelectFacet;
    return React.createElement(FacetValue, {
      key: value instanceof Immutable.Iterable ? value.hashCode() : value,
      value: value,
      count: periodIDs.size,
      handleClick: handler.bind(null, value),
      formatFacetValue: this.props.formatFacetValue
    });
  },

  getFacetValues: function () {
    var unselectedValues = this.props.values
      , selectedValues = Immutable.OrderedMap()

    this.props.selectedValues.forEach(value => {
      let matchedIDs = unselectedValues.get(value);
      unselectedValues = unselectedValues.delete(value);
      selectedValues = selectedValues.set(value, matchedIDs);
    });

    return [selectedValues, unselectedValues];
  },
  render: function () {
    var [selectedFacetValues, unselectedFacetValues] = this.getFacetValues()

    var selectedSection = selectedFacetValues.size === 0 ? <div /> : (
      <div>
        <h4>Selected</h4>
        <table>
          <tbody>
            {selectedFacetValues
               .map(this.makeFacetValueField.bind(this, true))
               .toList()}
          </tbody>
        </table>
        <hr />
      </div>
    )

    return (
      <div>
        <div className="facet-header clearfix">
          <span className="facet-title">{this.props.facetName}</span>
          <span className="facet-menu pull-right">
            <a onClick={this.props.onResetFacet} href="#">Reset</a>
          </span>
        </div>
        <div className="facet-body">
          {selectedSection}
          <table>
            <tbody>
              {unselectedFacetValues
                 .map(this.makeFacetValueField.bind(this, false))
                 .toList()}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
});

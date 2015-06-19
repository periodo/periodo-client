"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , randomstr = require('../../utils/randomstr')
  , UsesSelect

UsesSelect = React.createClass({
  displayName: 'UsesSelect',
  renderUses: function () {
    return this.props.uses.map(use =>
      <li key={use.hashCode()} onClick={this.props.onSelect.bind(null, use.get('countries'))} >
        <h4>{use.get('count')} uses</h4>
        <ul>
          {
            use.get('countries').map(country =>
              <li key={country.get('id')}>
                {country.get('label')}
              </li>
            )
          }
        </ul>
      </li>
    )
  },
  render: function () {
    var Dropdown = require('../shared/dropdown.jsx')

    return (
      <div>
        <Dropdown
            label={this.props.uses.size + ' different uses of ' + this.props.label}
            renderMenuItems={this.renderUses} />
      </div>
    )
  }
});

module.exports = React.createClass({
  displayName: 'PeriodSpatialCoverageForm',
  getInitialState: function () {
    return {
      description: this.props.description || '',
      coverage: (this.props.coverage || Immutable.List()).toOrderedSet()
    }
  },
  getValue: function () {
    return {
      spatialCoverageDescription: this.state.description,
      spatialCoverage: this.state.coverage
    }
  },
  removeCoverage: function (toRemove) {
    this.setState(prev => ({ coverage: prev.coverage.delete(toRemove) }));
  },
  handleDescriptionChange: function (e) {
    var description = e.target.value;
    this.setState({ description, uses: null });
  },
  handleSelect: function (coverage) {
    this.setState({
      description: coverage.get('label'),
      coverage: coverage.getIn(['uses', 0, 'countries']),
      uses: coverage.get('uses')
    }, () => {
      React.findDOMNode(this).querySelector('input').blur();
    });
  },
  handleSelectUse: function (countries) {
    this.setState({ coverage: countries });
  },
  render: function () {
    var InputAutocomplete = require('../shared/input_autocomplete.jsx')
      , randomID = randomstr()

    return (
      <div>
        <InputAutocomplete
            ref="autocomplete"
            id={'spatial-coverage-description' + randomID}
            name="spatialCoverageDescription"
            label="Spatial coverage description"
            placeholder="Text from the source describing the set of regions selected below."
            value={this.state.description}
            onChange={this.handleDescriptionChange}

            autocompleteFrom={this.props.coverageDescriptionSet}
            autocompleteGetter={coverage => coverage.get('label')}
            onSelect={this.handleSelect} />

        <div className="form-group">
          {
            !(this.state.uses && this.state.uses.size > 1) ? null :
              <UsesSelect
                uses={this.state.uses}
                label={this.state.description}
                onSelect={this.handleSelectUse} />
          }
          <label>Spatial Coverage Extent</label>
          <ul className="list-unstyled">
            {
              this.state.coverage.map(coverage =>
                <li key={coverage.hashCode()}>
                  <button
                      style={{
                        'float': 'none',
                        marginRight: '5px',
                        opacity: '1',
                        color: '#ccc'
                      }}
                      onClick={this.removeCoverage.bind(null, coverage)}
                      className="close">×</button> {coverage.get('label')}
                </li>
              )
            }
          </ul>
        </div>
      </div>
    )
  }
});

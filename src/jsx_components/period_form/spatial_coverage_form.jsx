"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , randomstr = require('../../utils/randomstr')
  , UsesSelect

UsesSelect = React.createClass({
  displayName: 'UsesSelect',

  renderUses() {
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

  render() {
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

  getInitialState() {
    return {
      description: this.props.description || '',
      coverageText: '',
      coverage: (this.props.coverage || Immutable.List()).toOrderedSet()
    }
  },

  getValue() {
    return {
      spatialCoverageDescription: this.state.description,
      spatialCoverage: this.state.coverage.toList()
    }
  },

  removeCoverage(toRemove) {
    this.setState(prev => ({ coverage: prev.coverage.delete(toRemove) }));
  },

  handleDescriptionChange(e) {
    var description = e.target.value;
    this.setState({ description, uses: null });
  },

  handleCoverageTextChange(e) {
    var coverageText = e.target.value;
    this.setState({ coverageText });
  },

  handleSelect(coverage) {
    this.setState({
      description: coverage.get('label'),
      coverage: coverage.getIn(['uses', 0, 'countries']),
      uses: coverage.get('uses')
    }, () => {
      React.findDOMNode(this).querySelector('input').blur();
    });
  },

  handleSelectUse(countries) {
    this.setState({ coverage: countries });
  },

  handleAddSpatialCoverage(coverage) {
    this.setState(prev => ({
      coverageText: '',
      coverage: prev.coverage.add(Immutable.Map({
        id: coverage.get('id'),
        label: coverage.get('label')
      }))
    }));
  },

  render() {
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

        <div className="form-group SpatialCoverageExtent">
          {
            this.state.uses && this.state.uses.size > 1 && (
              <UsesSelect
                uses={this.state.uses}
                label={this.state.description}
                onSelect={this.handleSelectUse} />
            )
          }
          <InputAutocomplete
              id={'spatial-coverage' + randomID}
              ref="spatialCoverageAdd"
              name="spatialCoverage"
              placeholder="Begin typing to search"
              label="Spatial coverage extent"
              value={this.state.coverageText}
              onChange={this.handleCoverageTextChange}
              autocompleteFrom={Immutable.fromJS(require('../../data/dbpedia_countries.json'))}
              autocompleteGetter={coverage => coverage.get('label')}
              onSelect={this.handleAddSpatialCoverage} />

          <ul className="list-unstyled SpatialCoverageExtent--list">
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

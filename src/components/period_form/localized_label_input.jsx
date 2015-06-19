"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PeriodLabelsForm',
  handleSelect: function (field, value) {
    var newLabel = this.props.label.set(field, value.get('code').toLowerCase());
    this.props.onChange(newLabel);
  },
  handleChange: function (field, e) {
    var newLabel = this.props.label.set(field, e.target.value);
    this.props.onChange(newLabel);
  },
  render: function () {
    var DropdownAutocomplete = require('../shared/dropdown_autocomplete.jsx')
      , languages = require('../../utils/languages')
      , scripts = require('../../utils/scripts')

    return (
      <div className="form-group" data-field="alternate-label">
        <div className="input-group">

          <div className="input-group-btn">
            <DropdownAutocomplete
                label={this.props.label.get('language')}
                list={languages}
                getter={language => language.get('name')}
                onSelect={this.handleSelect.bind(null, 'language')} />
            <DropdownAutocomplete
                label={this.props.label.get('script')}
                list={scripts}
                getter={script => script.get('name')}
                onSelect={this.handleSelect.bind(null, 'script')} />
          </div>

          <input
              className="form-control"
              id={this.props.id}
              value={this.props.label.get('value')}
              onChange={this.handleChange.bind(null, 'value')}
              type="text" />
          {
            !this.props.handleAddLabel ? null :
              <span className="input-group-addon btn" onClick={this.props.handleAddLabel}>
                <strong>+</strong>
              </span>
          }
          {
            !this.props.handleRemoveLabel ? null :
              <span className="input-group-addon btn" onClick={this.props.handleRemoveLabel}>
                <strong>-</strong>
              </span>
          }
        </div>
      </div>
    )
  }
});


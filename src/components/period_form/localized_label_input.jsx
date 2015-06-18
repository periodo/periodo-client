"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , LanguageSelectDropdown
  , ScriptSelectDropdown

LanguageSelectDropdown = React.createClass({
  displayName: 'LanguageSelectDropdown',
  handleSelect: function (language) {
    this.props.onChange(language);
  },
  getMatchingLanguages: function (text) {
    var languages = require('../../utils/languages')

    if (text) {
      let matchingSet = Immutable.Set(text);
      languages = languages
        .filter(lang => matchingSet.subtract(Immutable.Set(lang.get('name'))).size === 0)
    } else {
      languages = languages
        .filter(lang => lang.get('iso6391'))
        .sortBy(lang => lang.get('name'))
    }

    return languages.take(10);
  },
  render: function () {
    var DropdownAutocomplete = require('../shared/dropdown_autocomplete.jsx')

    return <DropdownAutocomplete
      label={this.props.language}
      getMatchingItems={this.getMatchingLanguages}
      renderMatch={lang => lang.get('name')}
      onSelect={this.handleSelect} />
  }
});

ScriptSelectDropdown = React.createClass({
  displayName: 'ScriptSelectDropdown',
  handleSelect: function (script) {
    this.props.onChange(script);
  },
  getMatchingScripts: function (text) {
    var scripts = require('../../utils/scripts');
    if (text) {
      let matchingSet = Immutable.Set(text);
      scripts = scripts
        .filter(script => matchingSet.subtract(Immutable.Set(script.get('name'))).size === 0)
    }

    return scripts.take(10);
  },
  render: function () {
    var DropdownAutocomplete = require('../shared/dropdown_autocomplete.jsx')

    return <DropdownAutocomplete
      label={this.props.script}
      getMatchingItems={this.getMatchingScripts}
      renderMatch={script => script.get('name')}
      onSelect={this.handleSelect} />
  }
});

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
    return (
      <div className="form-group" data-field="alternate-label">
        <div className="input-group">

          <div className="input-group-btn">
            <LanguageSelectDropdown
                onChange={this.handleSelect.bind(null, 'language')}
                language={this.props.label.get('language')} />
            <ScriptSelectDropdown
                onChange={this.handleSelect.bind(null, 'script')}
                script={this.props.label.get('script')} />
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


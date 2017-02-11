"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , tags = require('language-tags')
  , languages = Immutable.Map(
      require('language-subtag-registry/data/json/language')).keySeq()
  , scripts = Immutable.Map(
      require('language-subtag-registry/data/json/script')).keySeq()

const describe = tag => tag ? tag.descriptions().join('/') : ''
const language = tag => tags(tag).language()
const script = tag => tag ? tags(tag).script() : undefined

module.exports = React.createClass({
  displayName: 'PeriodLabelsForm',
  handleSelect: function (field, value) {
    var newLabel = this.props.label.set(field, value);
    this.props.onChange(newLabel);
  },
  handleChange: function (field, e) {
    var newLabel = this.props.label.set(field, e.target.value);
    this.props.onChange(newLabel);
  },
  render: function () {
    var DropdownAutocomplete = require('../shared/dropdown_autocomplete.jsx')

    return (
      <div className="form-group" data-field="alternate-label">
        <div className="input-group">

          <div className="input-group-btn">
            <DropdownAutocomplete
                label={this.props.label.get('language')}
                initialInput={
                  describe(language(this.props.label.get('language')))
                }
                list={languages}
                getter={tag => describe(language(tag))}
                onSelect={this.handleSelect.bind(null, 'language')} />
            <DropdownAutocomplete
                label={this.props.label.get('script')}
                initialInput={
                  describe(script(this.props.label.get('script')))
                }
                list={scripts}
                getter={tag => describe(script(tag))}
                onSelect={this.handleSelect.bind(null, 'script')} />
          </div>

          <input
              className="form-control"
              id={this.props.id}
              value={this.props.label.get('value')}
              onChange={this.handleChange.bind(null, 'value')}
              type="text" />
          {
            this.props.handleAddLabel && (
              <span className="input-group-addon btn" onClick={this.props.handleAddLabel}>
                <strong>+</strong>
              </span>
            )
          }
          {
            this.props.handleRemoveLabel && (
              <span className="input-group-addon btn" onClick={this.props.handleRemoveLabel}>
                <strong>-</strong>
              </span>
            )
          }
        </div>
      </div>
    )
  }
});


"use strict"

var React = require('react')
  , Immutable = require('immutable')
  , LocalizedLabelInput = require('./localized_label_input.jsx')


function getCode(label) {
  return `${label.get('language')}-${label.get('script')}`;
}

const DEFAULT_ORIGINAL_LABEL = Immutable.Map({ 'en-us': '' })
    , DEFAULT_ALTERNATE_LABEL = Immutable.List()

module.exports = React.createClass({
  displayName: 'LabelForm',
  getInitialState: function () {
    var { getAlternateLabels, getOriginalLabel } = require('../../helpers/period.js')
      , originalLabel
      , alternateLabels

    originalLabel = getOriginalLabel(Immutable.Map({
      originalLabel: this.props.originalLabel || DEFAULT_ORIGINAL_LABEL
    }));

    alternateLabels = getAlternateLabels(Immutable.Map({
      alternateLabel: this.props.alternateLabels || DEFAULT_ALTERNATE_LABEL
    }));

    if (!alternateLabels.size) {
      alternateLabels = Immutable.List.of(Immutable.Map({
        value: '',
        language: 'eng',
        script: 'latn'
      }));
    }

    return { originalLabel, alternateLabels }
  },
  getValue: function () {
    var alternateLabels

    alternateLabels = this.state.alternateLabels
      .groupBy(getCode)
      .toMap()
      .map(labels => labels.map(label => label.get('value')))

    return {
      label: this.state.originalLabel.get('value'),
      originalLabel: {
        [getCode(this.state.originalLabel)]: this.state.originalLabel.get('value')
      },
      alternateLabels
    }
  },

  handleOriginalLabelChange: function (originalLabel) {
    this.setState({ originalLabel });
  },

  handleAlternateLabelChange: function (idx, label) {
    this.setState(prev => {
      return { alternateLabels: prev.alternateLabels.set(idx, label) }
    });
  },

  addAlternateLabel: function (i) {
    if (!this.state.alternateLabels.getIn([i, 'value'])) return;

    this.setState(prev => {
      var after = prev.alternateLabels.get(i)
        , alternateLabels = prev.alternateLabels

      alternateLabels = alternateLabels.splice(i + 1, 0, after.set('value', ''));
      return { alternateLabels }
    });
  },

  removeAlternateLabel: function (i) {
    this.setState(prev => {
      var alternateLabels = prev.alternateLabels.size === 1 ?
        prev.alternateLabels.setIn([0, 'value'], '') :
        prev.alternateLabels.splice(i, 1)

      return { alternateLabels }
    });
  },

  render: function () {
    return (
      <div>
        <label className="field-required-label" htmlFor="js-label">Label</label>
        <LocalizedLabelInput
            id="js-label"
            label={this.state.originalLabel}
            onChange={this.handleOriginalLabelChange} />

        <label htmlFor="js-label">Alternate labels</label>
        {
          this.state.alternateLabels.map((label, i) =>
            <LocalizedLabelInput id="js-label"
                key={i}
                label={label}
                onChange={this.handleAlternateLabelChange.bind(null, i)}
                handleAddLabel={this.addAlternateLabel.bind(null, i)}
                handleRemoveLabel={this.removeAlternateLabel.bind(null, i)} />
          )
        }
      </div>
    )
  }
});

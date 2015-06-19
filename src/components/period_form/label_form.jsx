"use strict"

var React = require('react')
  , Immutable = require('immutable')
  , LocalizedLabelInput = require('./localized_label_input.jsx')
  , randomstr = require('../../utils/randomstr')


function getCode(label) {
  return `${label.get('language')}-${label.get('script')}`;
}

const DEFAULT_LANGUAGE_CODE = 'eng-latn'
    , DEFAULT_ALTERNATE_LABEL = Immutable.List()

module.exports = React.createClass({
  displayName: 'LabelForm',
  getInitialState: function () {
    var { getAlternateLabels, getOriginalLabel } = require('../../helpers/period.js')
      , originalLabel
      , alternateLabels

    originalLabel = getOriginalLabel(Immutable.Map({
      originalLabel: this.props.originalLabel || Immutable.Map({
        [DEFAULT_LANGUAGE_CODE]: this.props.label || ''
      })
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
    var value = {}
      , alternateLabel

    alternateLabel = this.state.alternateLabels
      .filter(label => label.get('value'))
      .groupBy(getCode)
      .toMap()
      .map(labels => labels.map(label => label.get('value')))

    if (this.state.originalLabel.get('value')) {
      value.originalLabel = {
        [getCode(this.state.originalLabel)]: this.state.originalLabel.get('value')
      }
      value.label = this.state.originalLabel.get('value');
    } else {
      value.originalLabel = value.label = null
    }

    value.alternateLabel = alternateLabel.size ? alternateLabel : null;

    return value;
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
    var randomID = randomstr()

    return (
      <div>
        <label className="field-required-label" htmlFor={'label-' + randomID}>
          Label
        </label>
        <LocalizedLabelInput
            id={'label-' + randomID}
            label={this.state.originalLabel}
            onChange={this.handleOriginalLabelChange} />

        <label htmlFor="js-label">Alternate labels</label>
        {
          this.state.alternateLabels.map((label, i) =>
            <LocalizedLabelInput
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

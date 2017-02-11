"use strict"

var React = require('react')
  , Immutable = require('immutable')
  , LocalizedLabelInput = require('./localized_label_input.jsx')
  , randomstr = require('../../utils/randomstr')


const DEFAULT_LABEL = Immutable.Map({ value: '', language: 'en' })

module.exports = React.createClass({
  displayName: 'LabelForm',

  getInitialState: function () {
    var { getAlternateLabels, getOriginalLabel } = require('../../helpers/period.js')
      , originalLabel = getOriginalLabel(this.props.period)
      , alternateLabels = getAlternateLabels(this.props.period).toList()

    originalLabel = originalLabel || DEFAULT_LABEL;

    if (!alternateLabels.size) {
      alternateLabels = Immutable.List.of(DEFAULT_LABEL)
    }

    return { originalLabel, alternateLabels }
  },
  getValue: function () {
    var { getCode, groupByCode } = require('../../helpers/label')
      , value = Immutable.Map()
      , localizedLabels

    if (this.state.originalLabel.get('value')) {
      value = value.set('label', this.state.originalLabel.get('value'))
      value = value.set('language', getCode(this.state.originalLabel))
    }

    localizedLabels = this.state.alternateLabels
      .unshift(this.state.originalLabel)
      .filter(label => label.get('value'))

    if (localizedLabels.size) {
      value = value.set('localizedLabels', groupByCode(localizedLabels));
    }

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

"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , LocalizedLabelInput = require('./LocalizedLabelInput')
    , RandomID = require('./RandomID')
    , { getAlternateLabels, getOriginalLabel } = require('periodo-utils/lib/items/period')
    , { getCode, groupByCode } = require('periodo-utils/lib/items/label')
    , { Box } = require('axs-ui')


const defaultLabel = Immutable.Map({
  value: '',
  language: 'eng',
  script: 'latn'
})

const LabelForm = ({
  randomID,
  period,
  onValueChange,
}) =>
  h(Box, [
    h('div', [
      h('label', { htmlFor: randomID('label') }, 'Label'),
      h(LocalizedLabelInput, {
        id: randomID('label'),
        label: period.get('originalLabel', defaultLabel),
        onValueChange: value => {
          onValueChange(
            period.set('originalLabel', value))
        },
      }),

      h('label', { htmlFor: randomID('alt-labels') }, 'Alternate labels'),
      period.get('alternateLabels', Immutable.List([defaultLabel])).map((label, i) =>
        h(LocalizedLabelInput, {
          key: i,
          label,
          onValueChange: value => {
            onValueChange(
              period.update('alternateLabels', labels =>
                (labels || Immutable.List()).set(i, value)))
          },

          handleAddLabel: () => {
            let after = period.getIn(['alternateLabels', i])

            // Don't add another if this one is still empty
            if (after && !after.get('value')) return;

            after = after || defaultLabel()

            onValueChange(
              period.update('alternateLabels', labels =>
                labels.splice(i + 1, 0, after.set('value', ''))))

          },

          handleRemoveLabel: () => {
            if (!period.get('alternateLabels').size) return;

            onValueChange(
              period.get('alternateLabels').size === 1
                ? period.setIn(['alternateLabels', 0, 'value'], '')
                : period.update('alternateLabels', labels => labels.splice(i, 1)))
          }
        })
      )
    ])
  ])

/*

class LabelForm extends React.Component {
  constructor() {
    super();

    const { period } = this.props
        , originalLabel = getOriginalLabel(period) || defaultLabel

    let alternateLabels = getAlternateLabels(period).toList()

    if (!alternateLabels.size) {
      alternateLabels = Immutable.List.of(defaultLabel);
    }

    this.state = { originalLabel, alternateLabels }
  }

  getValue() {
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
  }


  handleOriginalLabelChange(originalLabel) {
    this.setState({ originalLabel });
  }


  handleAlternateLabelChange(idx, label) {
    this.setState(prev => {
      return { alternateLabels: prev.alternateLabels.set(idx, label) }
    });
  }


  addAlternateLabel(i) {
    if (!this.state.alternateLabels.getIn([i, 'value'])) return;

    this.setState(prev => {
      var after = prev.alternateLabels.get(i)
        , alternateLabels = prev.alternateLabels

      alternateLabels = alternateLabels.splice(i + 1, 0, after.set('value', ''));
      return { alternateLabels }
    });
  }


  removeAlternateLabel(i) {
    this.setState(prev => {
      var alternateLabels = prev.alternateLabels.size === 1 ?
        prev.alternateLabels.setIn([0, 'value'], '') :
        prev.alternateLabels.splice(i, 1)

      return { alternateLabels }
    });
  }


  render() {
    const { randomID } = this.props
        , { originalLabel, alternateLabels } = this.state

  }
}
*/

module.exports = RandomID(LabelForm)

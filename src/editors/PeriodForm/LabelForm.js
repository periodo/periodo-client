"use strict"

const h = require('react-hyperscript')
    , Immutable = require('immutable')
    , LocalizedLabelInput = require('./LocalizedLabelInput')
    , { RandomID } = require('../../util').hoc
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

module.exports = RandomID(LabelForm)

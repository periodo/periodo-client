"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , LocalizedLabelInput = require('./LocalizedLabelInput')
    , { RandomID } = require('lib/util/hoc')
    , { Box, Label } = require('axs-ui')

const defaultLabel = Object.freeze({
  value: '',
  language: 'eng',
  script: 'latn'
})

module.exports = RandomID(props => {
  const { randomID, period, onValueChange } = props

  return (
    h(Box, [
      h(Label, { htmlFor: randomID('label') }, 'Label'),
      h(LocalizedLabelInput, {
        id: randomID('label'),
        label: period.originalLabel || defaultLabel,
        onValueChange: value => {
          onValueChange(R.assoc('originalLabel', value, period))
        },
      }),

      h('label', { htmlFor: randomID('alt-labels') }, 'Alternate labels'),
      R.defaultTo([defaultLabel], period.alternateLabels).map((label, i) =>
        h(LocalizedLabelInput, {
          key: i,
          label,
          onValueChange: value => {
            onValueChange(
              R.set(
                R.lensPath(['alternateLabels', i]),
                value,
                period
              )
            )
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
            if (!period.alternateLabels.length) return;

            onValueChange(
              period.alternateLabels.length === 1
                ? R.assocPath(['alternateLabels', 0, 'value'], '', period)
                : R.over(
                    R.lensProp('alternateLabels'),
                    R.remove(i, 1),
                    period
                  )
            )
          }
        })
      )
    ])
  )
})

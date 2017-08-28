"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , LocalizedLabelInput = require('./LocalizedLabelInput')
    , { RandomID } = require('periodo-utils/src/hoc')
    , { Box } = require('axs-ui')
    , { Label } = require('periodo-ui')

const defaultLabel = Object.freeze({
  value: '',
  language: 'eng',
  script: 'latn'
})

module.exports = RandomID(props => {
  const { randomID, period, onValueChange } = props

  return (
    h(Box, [
      h(Label, {
        htmlFor: randomID('label'),
        isRequired: true,
      }, 'Original label'),

      h(LocalizedLabelInput, {
        id: randomID('label'),
        label: period.originalLabel || defaultLabel,
        onValueChange: value => {
          onValueChange(R.assoc('originalLabel', value, period))
        },
      }),

      h(Label, {
        mt: 2,
        htmlFor: randomID('alt-labels')
      }, 'Alternate labels'),

      R.defaultTo([defaultLabel], period.alternateLabels).map((label, i) =>
        h(LocalizedLabelInput, {
          key: i + (label.newIdx || ''),
          label,
          mb: 1,
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
            let after = R.path(['alternateLabels', i], period)

            // Don't add another if this one is still empty
            if (after && !after.value) return;

            after = R.pipe(
              R.assoc('value', ''),
              R.assoc('newIdx', Math.random())
            )(after || defaultLabel)


            onValueChange(
              R.over(
                R.lensProp('alternateLabels'),
                R.insert(i + 1, after),
                period
              ))
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

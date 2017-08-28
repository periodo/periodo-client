"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , dateParser = require('periodo-date-parser')
    , { Box, Flex } = require('axs-ui')
    , { isMultipart } = require('periodo-utils/src/terminus')
    , { InputBlock, Checkbox } = require('periodo-ui')

const emptyTerminus = {
  label: '',
  in: { year: '' }
}

const toggleMultipart = terminus => isMultipart(terminus)
  ? {
      label: terminus.label,
      in: { year: R.path(['in', 'earliest'], terminus) || '' }
    }
  : {
      label: terminus.label,
      in: { earliestYear: R.path(['in', 'year'], terminus) || '', latestYear: '' }
    }

function parse(label) {
  try {
    return dateParser.parse(label)
  } catch (err) {
    return Object.assign({}, emptyTerminus, { label })
  }
}

module.exports = class TerminusInput extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (!this.props.autoparse && nextProps.autoparse) {
      this.props.onValueChange(parse(nextProps.terminus.labe))
    }
  }

  render() {
    const { terminus, autoparse, onValueChange } = this.props

    return (
      h(Box, { width: 1 }, [
        h(Flex, { mb: 1, alignItems: 'center' }, [
          h(InputBlock, {
            name: 'label',
            label: 'Label',
            width: .5,
            pr: 2,
            value: terminus.label || '',
            onChange: e => autoparse
              ? onValueChange(parse(e.target.value))
              : onValueChange(R.assoc('label', e.target.value, terminus))
          }),

          h(Box, { width: .5 }, [
            h(Checkbox, {
              disabled: autoparse,
              checked: isMultipart(terminus),
              onChange: () => {
                onValueChange(toggleMultipart(terminus))
              },
            }),
            'Two part date',
          ]),
        ]),

        h(Flex, [
          isMultipart(terminus)
            ? h(InputBlock, {
                name: 'earliest',
                label: 'Earliest',
                width: .5,
                pr: 2,
                disabled: autoparse,
                value: R.path(['in', 'earliestYear'], terminus) || '',
                onChange: e => {
                  onValueChange(
                    R.assocPath(
                      ['in', 'earliestYear'],
                      e.target.value, terminus
                    )
                  )
                }
              })
            : h(InputBlock, {
                name: 'year',
                label: 'Year',
                width: .5,
                pr: 2,
                disabled: autoparse,
                value: R.path(['in', 'year'], terminus) || '',
                onChange: e => {
                  onValueChange(
                    R.assocPath(
                      ['in', 'year'],
                      e.target.value, terminus
                    )
                  )
                }
              }),

          isMultipart(terminus) && h(InputBlock, {
            name: 'latest',
            label: 'Latest',
            width: .5,
            disabled: autoparse,
            value: R.path(['in', 'latestYear'], terminus) || '',
              onChange: e => {
                onValueChange(
                  R.assocPath(
                    ['in', 'latestYear'],
                    e.target.value, terminus
                  )
                )
              }
          }),
        ])
      ])
    )
  }
}

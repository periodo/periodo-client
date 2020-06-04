"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { textMatcher, period: { alternateLabels }} = require('periodo-utils')
    , { Box, Flex, Input, Label, HelpText } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , styled = require('@emotion/styled').default

const Container = styled(Box)`
input[type="radio"] {
  margin: 0;
  margin-right: 4px;
  vertical-align: middle;
  margin-top: -6px;
}
`

const _alternateLabels = R.memoizeWith(p => p.id, alternateLabels)

class Search extends React.Component {
  toggleRadio(withAlternate) {
    const { opts, updateOpts } = this.props
        , nextOpts = { ...opts }

    if (withAlternate) {
      nextOpts.withAlternate = true
    } else {
      nextOpts.withAlternate = undefined
    }

    const invalidate = (
      !!opts.text &&
      !!opts.withAlternate !== !!nextOpts.withAlternate
    )

    updateOpts(nextOpts, invalidate)
  }

  render() {
    const { opts, updateOpts, randomID } = this.props
        , { text, withAlternate } = opts
        , inputID = randomID('search')
        , radioName = randomID('radio')

    return (
      h(Container, [
        h(Label, { htmlFor: inputID }, 'By label'),

        h(HelpText,
          'Show periods with matching labels'
          + '—regular expressions are supported'),

        h(Flex, {
          my: 1,
          height: 20,
        }, [
          h(Box, { mr: 3 }, [
            h('input', {
              id: randomID('radio1'),
              type: 'radio',
              name: radioName,
              checked: !withAlternate,
              onChange: () => {
                this.toggleRadio(false)
              },
            }),
            h('label', { htmlFor: randomID('radio1') }, 'Match labels'),
          ]),

          h(Box, [
            h('input', {
              id: randomID('radio2'),
              type: 'radio',
              name: radioName,
              checked: !!withAlternate,
              onChange: () => {
                this.toggleRadio(true)
              },
            }),
            h('label', {
              htmlFor: randomID('radio2'),
            }, 'Match labels + alternate labels'),
          ]),
        ]),

        h(Input, {
          type: 'text',
          id: inputID,
          value: text || '',
          placeholder: 'e.g. bronze',
          onChange: e => {
            updateOpts({
              ...opts,
              text: e.target.value,
            }, true)
          },
        }),
      ])
    )
  }
}

module.exports = {
  label: 'Period search',
  description: 'Search for periods by label',
  makeFilter(opts) {
    const text = opts && opts.text

    if (!text) return null

    const test = textMatcher(text)

    let filter

    if (opts.withAlternate) {
      filter = period => (
        test(period.label) ||
        _alternateLabels(period).some(({ label }) => test(label))
      )
    } else {
      filter = period => test(period.label)
    }

    return filter
  },
  Component: RandomID(Search),
}

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { alternateLabels } = require('periodo-utils/src/period')
    , { Box, Flex, Input, Label } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , styled = require('styled-components').default

const Container = styled(Box)`
input[type="radio"] {
  margin: 0;
  margin-right: 4px;
}
`

const _alternateLabels = R.memoizeWith(p => p.id, alternateLabels)

class Search extends React.Component {
  toggleRadio(withAlternate) {
    const { opts, updateOpts } = this.props
        , nextOpts = Object.assign({}, opts)

    if (withAlternate) {
      nextOpts.withAlternate = true
    } else {
      nextOpts.withAlternate = undefined
    }

    const invalidate = !!opts.withAlternate !== !!nextOpts.withAlternate

    updateOpts(nextOpts, invalidate)
  }

  render() {
    const { opts, updateOpts, randomID } = this.props
        , { text, withAlternate } = opts
        , inputID = randomID('search')
        , radioName = randomID('radio')

    return (
      h(Container, [
        h(Label, { htmlFor: inputID }, 'Search'),

        h(Flex, { mt: 1, mb: 2 }, [
          h(Flex, { mr: 3 }, [
            h('input', {
              id: randomID('radio1'),
              type: 'radio',
              name: radioName,
              checked: !withAlternate,
              onChange: e => {
                this.toggleRadio(false)
              },
            }),
            h('label', { htmlFor: randomID('radio1') }, 'Labels'),
          ]),

          h(Flex, [
            h('input', {
              id: randomID('radio2'),
              type: 'radio',
              name: radioName,
              checked: !!withAlternate,
              onChange: e => {
                this.toggleRadio(true)
              },
            }),
            h('label', { htmlFor: randomID('radio2') }, 'Labels + alternate labels'),
          ]),
        ]),

        h(Input, {
          type: 'text',
          id: inputID,
          value: text || '',
          onChange: e => {
            const text = e.target.value
                , invalidate = text.slice(-1) !== '|'

            updateOpts(Object.assign({}, opts, { text }), invalidate)
          },
        }),
      ])
    )
  }
}

module.exports = {
  label: 'Text search',
  description: 'Search for periods by text.',
  makeFilter(opts) {
    const text = opts && opts.text

    if (!text) return null

    const regex = text && new RegExp(text, 'i')

    let test

    if (opts.withAlternate) {
      test = period => (
        regex.test(period.label) ||
        _alternateLabels(period).some(({ label }) => regex.test(label))
      )
    } else {
      test = period => regex.test(period.label)
    }

    return test
  },
  Component: RandomID(Search),
}

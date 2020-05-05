"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { InputBlock } = require('periodo-ui')
    , { textMatcher, authority: { displayTitle }} = require('periodo-utils')

class Search extends React.Component {

  render() {
    const { data, opts, updateOpts } = this.props
        , { text } = opts

    if (data.length <= 10) {
      return null // no reason to search over < 10 authorities
    }

    return h(InputBlock, {
      name: 'filter',
      label: 'Filter authorities by source',
      helpText: 'Show authorities with matching sources',
      placeholder: 'e.g. library',
      value: text || '',
      onChange: e => {
        updateOpts({
          ...opts,
          text: e.target.value,
        }, true)
      },
    })
  }
}

module.exports = {
  label: 'Authority search',
  description: 'Search for authorties by source',
  makeFilter(opts) {
    const text = opts && opts.text
    if (!text) return null

    const test = textMatcher(text)

    return authority => test(displayTitle(authority))
  },
  Component: Search,
}

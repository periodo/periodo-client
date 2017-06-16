"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , { connect } = require('react-redux')
    , { Source } = require('../../ui')

function mapStateToProps(state) {
  return {
    backend: state.backends.current,
  }
}

module.exports = connect(mapStateToProps)(props => {
  const { backend, id } = props
      , authority = backend.dataset.periodCollections[id]

  console.log(authority.source);

  return (
    h(Box, [
      h('h1', 'View authority'),
      h(Source, { source: authority.source }),
    ])
  )
})

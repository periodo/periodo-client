"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')

function mapStateToProps(state) {
  return {
    backend: state.backends.current
  }
}

const BackendHome = props =>
  h('div', [
    h('h1', props.backend.metadata.label),
    h('pre', JSON.stringify(props.backend.dataset, true, '  ')),
  ])

module.exports = connect(mapStateToProps)(BackendHome)

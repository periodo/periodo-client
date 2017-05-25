"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { connect } = require('react-redux')
    , { PeriodAuthorityForm } = require('../../editors')

function mapStateToProps(state) {
  return {
    backend: state.backends.current
  }
}

class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: undefined
    }
  }

  render() {
    return (
      h('div', [
        h('h1', this.props.backend.metadata.label),
      ])
    )
  }
}

module.exports = connect(mapStateToProps)(BackendHome)

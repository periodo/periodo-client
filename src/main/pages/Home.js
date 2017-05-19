"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , { compose } = require('redux')
    , { connect } = require('react-redux')
    , { getCurrentBackend } = require('../../backends/utils')
    , routerKnower = require('../components/util/router_knower')

const Home = React.createClass({
  render() {
    const { navigateToRoute } = this.props
        , currentBackend = getCurrentBackend()

    if (currentBackend) {
      currentBackend.case({
        IndexedDB: () => navigateToRoute('local-backend-home', currentBackend),
        Web: () => navigateToRoute('web-backend-home', currentBackend),
        _: () => null,
      })
    } else {
      navigateToRoute('backend-select')
    }

    return h('div', `Backend homepage for ${currentBackend._name} not yet implemented.`)
  }
})

module.exports = compose(
  routerKnower,
  connect(state => ({ backend: state.get('backend') }))
)(Home)

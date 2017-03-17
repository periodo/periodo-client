"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , { compose } = require('redux')
    , { connect } = require('react-redux')
    , routerKnower = require('../components/util/router_knower')

exports.name = 'home'

exports.path = '/'

const Home = React.createClass({
  componentDidMount() {
    const { navigateToRoute } = this.props
        , { currentBackend } = localStorage

    if (currentBackend) {
      const [ name, type ] = currentBackend.split('-')

      navigateToRoute('backend-home', { name, type })
    } else {
      navigateToRoute('backend-select')
    }
  },

  render() {
    return h('div')
  }
})

exports.Component = compose(
  routerKnower,
  connect(state => ({ backend: state.get('backend') }))
)(Home)

"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { compose } = require('redux')
    , { connect } = require('react-redux')
    , routerKnower = require('../util/router_knower')

const Home = React.createClass({
  render() {
    const { router, backend } = this.props

    return h('h1', 'Home')
  }
})

module.exports =compose(
  routerKnower,
  connect(state => ({ backend: state.get('backend') }))
)(Home)

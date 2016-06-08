"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , LocationBar = require('location-bar')
    , { Provider } = require('react-redux')
    , Application = require('./application')

const Root = ({ store }) =>
  h(Provider, { store }, [
    h(Application, {
      router: require('../router')(),
      locationBar: new LocationBar()
    })
  ]);

Root.propTypes = {
  store: React.PropTypes.object
}

module.exports = Root;

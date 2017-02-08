"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { getBackendWithDataset } = require('../actions/backends')
    , types = require('../types')

exports.name = 'backend-home';

exports.path = '/:type/:nameOrURL/';

exports.onLoad = function load(dispatch, { type, nameOrURL }) {
    let name, url

    if (type === 'web') {
      type = types.backends.WEB;
      url = decodeURIComponent(nameOrURL)
    }

    if (type === 'local') {
      type = types.backends.INDEXED_DB;
      name = nameOrURL;
    }

    return dispatch(getBackendWithDataset({ type, name, url }));
}

exports.Component = React.createClass({
  render () {
    return h('h1', 'HOME')
  }
})

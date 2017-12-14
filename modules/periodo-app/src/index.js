"use strict";

const PropTypes = require('prop-types')

Object.defineProperty(require('react'), 'PropTypes', {
  get: () => PropTypes
})

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , Application = require('./main/Application')


global.CORS_PROXY_URL = 'https://ptgolden.org/cors-anywhere/'
global.CORS_PROXY_ENABLED = true

if (process.browser) {
  fastclick(document.body);

  ReactDOM.render(h(Application), document.getElementById('main'))
}

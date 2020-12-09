"use strict";

const PropTypes = require('prop-types')

Object.defineProperty(require('react'), 'PropTypes', {
  get: () => PropTypes,
})

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , Application = require('./main/Application')

if (process.browser) {
  ReactDOM.render(h(Application), document.getElementById('main'))
}

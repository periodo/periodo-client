"use strict";

const PropTypes = require('prop-types')

Object.defineProperty(require('react'), 'PropTypes', {
  get: () => PropTypes,
})

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , Application = require('./main/Application')

if (process.browser) {
  fastclick(document.body);

  ReactDOM.render(h(Application), document.getElementById('main'))
}

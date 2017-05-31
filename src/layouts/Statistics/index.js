"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , through = require('through2')
    , concat = require('concat-stream')
    , { Box } = require('axs-ui')
    , Consumer = require('../Consumer')

exports.handler = {
  label: 'Statistics',
  description: 'Simple stastics about the dataset.',
  Component: Consumer('periods', Infinity, props =>
    h(Box, [
      h('h1', 'Statistics'),
      h('div', {}, props.periods.length),
    ])
  )
}

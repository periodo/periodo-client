"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , through = require('through2')
    , concat = require('concat-stream')
    , { Box } = require('axs-ui')
    , Consumer = require('../Consumer')

exports.label = 'Statistics';

exports.description = 'Simple stastics about the dataset.';

exports.renderer = Consumer('period', Infinity, props =>
  h(Box, [
    h('h1', 'Statistics'),
    props.period && h('div', {}, props.period.length)
  ])
)

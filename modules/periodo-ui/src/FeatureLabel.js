"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text, Heading } = require('./Base')
    , { Italic } = require('./Typography')
    , { InlineList } = require('./InlineList')

const otherNames = feature => feature.names
  ? feature.names
      .map(n => n.toponym)
      .filter(t => t && t !== feature.properties.title)
  : []

const description = feature => feature.descriptions
  ? feature.descriptions
      .map(d => d.value)
      .filter(d => (! R.isNil(d)))
      .join('; ')
  : ''

exports.FeatureLabel = ({ feature, ...props }) => {
  const show = feature && feature.properties && feature.properties.title
  return h(Box, {
    p: show ? 2 : 0,
    ...props,
  },
  show
    ? [
      h(Heading, {
        level: 5,
        pb: 1,
      }, [
        h(Box, feature.properties.title),
        feature.geometry === undefined
          ? h(Italic, {
            fontSize: 'smaller',
            color: 'gray.6',
          },
          'not shown on map')
          : null,
      ]),
      h(InlineList, {
        fontSize: 'x-small',
        pb: 1,
      }, otherNames(feature)),
      h(Text, { fontSize: 'small' }, description(feature)),
    ]
    : []
  )
}

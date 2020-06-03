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

const singleFeatureLabel = feature => [
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

const MAX_FEATURES = 15

const multipleFeaturesLabel = features => {

  const remainder = features.length - MAX_FEATURES

  const titles = remainder > 0
    ? features
        .map(f => f.properties.title)
        .slice(0, MAX_FEATURES)
        .join(', ') + ` and ${remainder} more`
    : features
        .map(f => f.properties.title)
        .slice(0, -1)
        .join(', ') + ` and ${features[features.length - 1].properties.title}`

  return h(Heading, {
    level: 5,
    pb: 1,
  }, [
    h(Box, {
      overflow: 'hidden',
    }, titles),
    features.some(feature => feature.geometry === undefined)
      ? h(Italic, {
        fontSize: 'smaller',
        color: 'gray.6',
      },
      'some not shown on map')
      : null,
  ])
}

exports.FeatureLabel = ({ features, ...props }) => {
  const showFeatures = features.filter(
    feature => feature && feature.properties && feature.properties.title
  )
  const show = showFeatures.length > 0

  return h(Box, {
    p: show ? 2 : 0,
    borderLeft: show ? '1px solid #ccc' : null,
    width: show ? 200 : '0px',
    ...props,
  },
  show
    ? showFeatures.length === 1
      ? singleFeatureLabel(showFeatures[0])
      : multipleFeaturesLabel(showFeatures)
    : []
  )
}

"use strict";

const h = require('react-hyperscript')
    , { Flex } = require('./Base')
    , { WorldMap } = require('./WorldMap')
    , { FeatureLabel } = require('./FeatureLabel')

exports.LabeledMap = ({
  focusedFeatures,
  features,
  ...props
}) =>
  h(Flex, {
    ...props,
  }, [
    h(WorldMap, {
      focusedFeatures,
      features,
      flex: '1 1',
    }),
    h(FeatureLabel, {
      features: focusedFeatures,
    }),
  ])

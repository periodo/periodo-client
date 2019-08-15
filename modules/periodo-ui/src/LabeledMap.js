"use strict";

const h = require('react-hyperscript')
    , { Flex } = require('./Base')
    , { WorldMap } = require('./WorldMap')
    , { FeatureLabel } = require('./FeatureLabel')

exports.LabeledMap = ({
  focusedFeatures,
  features,
  height=200,
  ...props
}) => h(Flex, {
  border: '1px solid #ccc',
  ...props,
}, [
  h(WorldMap, {
    focusedFeatures,
    features,
    flex: '1 1',
    height,
  }),
  h(FeatureLabel, {
    features: focusedFeatures,
    height,
  }),
])
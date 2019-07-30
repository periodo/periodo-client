"use strict";

const h = require('react-hyperscript')
    , { Flex, WorldMap } = require('periodo-ui')
    , FeatureLabel = require('./FeatureLabel')

const LabeledMap = ({ focusedFeature, features, ...props }) => h(Flex, {
  border: '1px solid #ccc',
  borderBottom: 'none',
  ...props,
}, [
  h(WorldMap, {
    focusedFeature,
    features,
    flex: '1 1',
  }),
  h(FeatureLabel, {
    feature: focusedFeature,
    borderLeft: focusedFeature ? '1px solid #ccc' : null,
    width: focusedFeature ? 200 : '0px',
    height: 200,
    css: {transition: 'width 0.25s'},
  }),
])

module.exports = LabeledMap

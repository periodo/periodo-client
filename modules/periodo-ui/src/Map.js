"use strict";

const R = require('ramda')
    , regl = require('regl')
    , mixmap = require('mixmap')
    , zoomTo = require('mixmap-zoom')
    , mixtiles = require('mixmap-tiles')
    , createMesh = require('earth-mesh')
    , easing = require('eases/circ-out')
    , h = require('react-hyperscript')
    , { useRef, useLayoutEffect } = require('react')
    , { Box } = require('./Base')
    , useRect = require('./useRect')

const mix = mixmap(regl)
const map = mix.create({backgroundColor: [0, 0, 0, 0]})

mixtiles(map, {
  path: '/images/maptiles',
  layers: require('../../../images/maptiles/layers.json'),
  load: require('mixmap-tiles/xhr')
})

const PURPLE = 'vec4(1.0,0.0,1.0,0.5)'
const YELLOW = 'vec4(1.0,1.0,0.0,0.5)'

const drawTriangle = color => map.createDraw({
  frag: `
    void main () {
      gl_FragColor = ${color};
    }
  `,
  uniforms: {
    zindex: 100
  },
  blend: {
    enable: true,
    func: { src: 'src alpha', dst: 'one minus src alpha' }
  },
  attributes: {
    position: map.prop('positions')
  },
  elements: map.prop('cells')
})

const drawFeatures = drawTriangle(YELLOW)
const drawFocusedFeature = drawTriangle(PURPLE)

const length = bbox => {
  const lonDelta = bbox[2] - bbox[0]
  const latDelta = bbox[3] - bbox[1]
  if (lonDelta > 359) {
    return latDelta
  }
  return Math.max(lonDelta, latDelta)
}

const padding = bbox => Math.max(1,
  // the coefficients here were determined through trial & error
  Math.round((-0.68 * Math.log(length(bbox))) + 3.91)
)

const bbox = mesh => {
  const box = [180,90,-180,-90]
  for (let i = 0; i < mesh.triangle.positions.length; i++) {
    box[0] = Math.min(box[0], mesh.triangle.positions[i][0])
    box[1] = Math.min(box[1], mesh.triangle.positions[i][1])
    box[2] = Math.max(box[2], mesh.triangle.positions[i][0])
    box[3] = Math.max(box[3], mesh.triangle.positions[i][1])
  }
  return box
}

const zoom = viewbox => zoomTo(map, {
  viewbox, duration: 750, padding: padding(viewbox), easing
})

const display = (features, focusedFeature) => {
  const focusedFeatureId = focusedFeature ? focusedFeature.id : undefined
  const unfocusedFeatures = features.filter(
    f => (f.id !== focusedFeatureId) && f.geometry
  )
  let viewbox = undefined
  if (unfocusedFeatures.length > 0) {
    const mesh = createMesh({features: unfocusedFeatures})
    drawFeatures.props = [mesh.triangle]
    viewbox = bbox(mesh)
  } else {
    drawFeatures.props = []
  }
  if (focusedFeature && focusedFeature.geometry) {
    const mesh = createMesh(focusedFeature)
    drawFocusedFeature.props = [mesh.triangle]
    viewbox = bbox(mesh)
  } else {
    drawFocusedFeature.props = []
  }
  map.draw()
  if (viewbox) {
    zoom(viewbox)
  }
}

// shared webgl context, only needs to be rendered once
const renderMix = R.once(() => document.body.appendChild(mix.render()))

const _Map = ({ features=[], focusedFeature, height }) => {

  const innerRef = useRef()
      , outerRef = useRef()
      , width = useRect(outerRef).width

  useLayoutEffect(() => {
    renderMix()
    if (innerRef.current.firstChild) {
      map.resize(width, height)
    } else {
      innerRef.current.appendChild(map.render({width, height}))
    }
    display(features, focusedFeature)
  })

  return h('div', { ref: outerRef, style: {height} }, [
    h('div', { ref: innerRef, style: {position: 'absolute'} })
  ])
}

exports.Map = ({ features, focusedFeature, height=200, ...props }) => h(
  Box,
  {
    css: {backgroundColor: '#6194b9'}, // ocean color
    ...props
  },
  [ h(_Map, { key: 2, features, focusedFeature, height }) ]
)

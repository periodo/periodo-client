"use strict";

const R = require('ramda')
    , regl = require('regl')
    , resl = require('resl')
    , mixmap = require('mixmap')
    , glsl = require('glslify')
    , createMesh = require('earth-mesh')
    , h = require('react-hyperscript')
    , { useRef, useLayoutEffect } = require('react')
    , { Box } = require('./Base')
    , useRect = require('./useRect')

const tiles = require('../../../images/maptiles/manifest.json')

const length = bbox => {
  const lonDelta = bbox[2] - bbox[0]
  const latDelta = bbox[3] - bbox[1]
  if (lonDelta > 359) {
    return latDelta
  }
  return Math.max(lonDelta, latDelta)
}

const ln360 = Math.log2(360)

const bboxToZoom = bbox => {
  const dx = bbox[2] - bbox[0]
  const dy = bbox[3] - bbox[1]
  const d = Math.max(dx,dy)
  const zoom = ln360 - Math.log2(d) + 1
  return Math.max(Math.min(zoom,21),1)
}

const zoomToBbox = (bbox,zoom) => {
  const dx = bbox[2] - bbox[0]
  const dy = bbox[3] - bbox[1]
  const d = Math.pow(2, ln360 - zoom)
  const x = (bbox[2] + bbox[0]) * 0.5
  const y = (bbox[3] + bbox[1]) * 0.5
  const sx = dx < dy ? dx / dy : 1
  const sy = dy < dx ? dy / dx : 1
  bbox[0] = x - d * sx
  bbox[1] = y - d * sy
  bbox[2] = x + d * sx
  bbox[3] = y + d * sy
  return bbox
}

const pad = (map, bbox) => {

  const zoom = bboxToZoom(bbox)

  const padding = Math.max(1,
    // the coefficients here were determined through trial & error
    Math.round((-0.68 * Math.log(length(bbox))) + 3.91)
  ) + (map._size[0] > map._size[1] ? map._size[0]/map._size[1]*0.5 : 0)

  return padding ? zoomToBbox(bbox, zoom - padding) : bbox
}

const initializeMap = mix => {

  const map = mix.create({backgroundColor: [0, 0, 0, 0]})

  const drawTile = map.createDraw({
    frag: glsl`
    precision highp float;
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
    uniform float id;
    uniform sampler2D texture;
    varying vec2 vtcoord;
    void main () {
      float h = mod(id/8.0,1.0);
      float s = mod(id/4.0,1.0)*0.5+0.25;
      float l = mod(id/16.0,1.0)*0.5+0.25;
      vec3 c = hsl2rgb(h,s,l);
      vec4 tc = texture2D(texture,vtcoord);
      gl_FragColor = vec4(c*(1.0-tc.a)+tc.rgb*tc.a,0.5+tc.a*0.5);
    }
    `,
    vert: `
    precision highp float;
    attribute vec2 position;
    uniform vec4 viewbox;
    uniform vec2 offset;
    uniform float zindex, aspect;
    attribute vec2 tcoord;
    varying vec2 vtcoord;
    void main () {
      vec2 p = position + offset;
      vtcoord = tcoord;
      gl_Position = vec4(
        (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
        ((p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0) * aspect,
        1.0/(2.0+zindex), 1);
    }
    `,
    uniforms: {
      id: map.prop('id'),
      zindex: map.prop('zindex'),
      texture: map.prop('texture'),
    },
    attributes: {
      position: map.prop('points'),
      tcoord: [0,1,0,0,1,1,1,0], // sw,se,nw,ne
    },
    elements: [0,1,2,1,2,3],
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' },
    },
  })

  map.addLayer({
    viewbox(bbox, zoom, cb) {
      zoom = Math.round(zoom)
      if (zoom < 2) cb(null, tiles[0])
      else if (zoom < 4) cb(null, tiles[1])
      else cb(null, tiles[2])
    },
    add(key, bbox) {
      const file = key.split('!')[1]
      const level = Number(file.split('/')[0])
      const prop = {
        id: Number(key.split('!')[0]),
        key,
        zindex: 2 + level,
        texture: map.regl.texture(),
        points: [
          bbox[0], bbox[1], // sw
          bbox[0], bbox[3], // se
          bbox[2], bbox[1], // nw
          bbox[2], bbox[3],  // ne
        ],
      }
      drawTile.props.push(prop)
      map.draw()
      resl({
        manifest: { tile: { type: 'image', src: '/images/maptiles/'+file } },
        onDone(assets) {
          prop.texture = map.regl.texture(assets.tile)
          map.draw()
        },
      })
    },
    remove(key) {
      drawTile.props = drawTile.props.filter(p => p.key !== key)
    },
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
      zindex: 100,
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' },
    },
    attributes: {
      position: map.prop('positions'),
    },
    elements: map.prop('cells'),
  })

  const drawFeatures = drawTriangle(YELLOW)
  const drawFocusedFeature = drawTriangle(PURPLE)

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

  map.display = (features, focusedFeature) => {
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
    if (viewbox) {
      map.setViewbox(pad(map, viewbox))
    }
    map.draw()
  }

  return map
}

// shared webgl context, only needs to be rendered once
const mix = mixmap(regl)
const renderMix = R.once(() => document.body.appendChild(mix.render()))

const _Map = ({ features=[], focusedFeature, height }) => {

  const innerRef = useRef()
      , outerRef = useRef()
      , width = useRect(outerRef).width
      , map = initializeMap(mix)

  renderMix()

  const mapNode = map.render({width, height})

  map.display(features, focusedFeature)

  useLayoutEffect(() => {
    innerRef.current.appendChild(mapNode)
    return function cleanup() {
      innerRef.current.removeChild(mapNode)
    }
  })

  return h('div', { ref: outerRef, style: {height} }, [
    h('div', { ref: innerRef, style: {position: 'absolute'} }),
  ])
}

exports.WorldMap = ({ features, focusedFeature, height=200, ...props }) => h(
  Box,
  {
    css: {backgroundColor: '#6194b9'}, // ocean color
    ...props,
  },
  [ h(_Map, { key: 2, features, focusedFeature, height }) ]
)

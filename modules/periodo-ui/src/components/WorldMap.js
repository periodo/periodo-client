"use strict";

const h = require('react-hyperscript')
    , regl = require('regl')
    , resl = require('resl')
    , glsl = require('glslify')
    , createMesh = require('earth-mesh')
    , debounce = require('debounce')
    , { createRef, Component } = require('react')
    , { Box } = require('./Base')
    , { AriaButton } = require('./Buttons')

let createMap

// Skip on server
if (typeof window !== 'undefined') {
  createMap = require('mixmap')
}

const tiles = require('../../../../images/maptiles/manifest.json')

const DEFAULT_VBOX = [ -180, -90, 180, 90 ]
const MIN_VBOX_HEIGHT = 5
const MIN_VBOX_WIDTH = 10
const MAX_ASPECT_RATIO = 2
const SMALL_POLYGON_THRESHOLD = 0.1

const pad = (bbox, width, height) => {
  const bboxW = bbox[2] - bbox[0]
  const bboxH = bbox[3] - bbox[1]
  const bboxRatio = bboxW / bboxH
  const viewRatio = width / height
  let w, h
  if (viewRatio > bboxRatio) {
    // wide map; pad based on bbox height
    h = Math.max(bboxH * 4, MIN_VBOX_HEIGHT)
    w = h * viewRatio
  } else {
    // narrow map; pad based on bbox width
    w = Math.max(bboxW * 4, MIN_VBOX_WIDTH)
    h = w / viewRatio
  }
  const px = (w - bboxW) / 2
  const py = (h - bboxH) / 2
  bbox[0] = Math.max(bbox[0] - px, -180)
  bbox[1] = Math.max(bbox[1] - py, -90)
  bbox[2] = Math.min(bbox[2] + px,  180)
  bbox[3] = Math.min(bbox[3] + py,  90)
  return bbox
}

const findBbox = positions => {
 if (positions.length > 0) {
   const box = [ 180, 90, -180, -90 ]
   for (let i = 0; i < positions.length; i++) {
     box[0] = Math.min(box[0], positions[i][0])
     box[1] = Math.min(box[1], positions[i][1])
     box[2] = Math.max(box[2], positions[i][0])
     box[3] = Math.max(box[3], positions[i][1])
   }
   return box
 }
 return undefined
}

const shiftNegativeLongitudes = ([lon, lat]) => [lon < 0 ? 360 + lon : lon, lat]

const mesh2bbox = mesh => {
  if (mesh) {
    const positions = mesh.triangle.positions.length > 0
          ? mesh.triangle.positions
          : mesh.point.positions

    let box = findBbox(positions)
    // A box of width 360 (entire earth) may be due to
    // positions crossing the +/- 180 longitude. Try to
    // fix this by shifting the negative longitudes to
    // positive.
    if (box[2] - box[0] === 360) {
      box = findBbox(positions.map(shiftNegativeLongitudes))
    }
    return box
  }
  return undefined
}

const geometryOf = feature => 'geometry' in feature ? feature.geometry.geometries[0] : null

const coordinatesOf = geometry => geometry.type == "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0].flat()

const splitIntoPolygonsAndPoints = features => {
  const polygons = []
  const points = []
  for (const feature of features) {
    const geometry = geometryOf(feature)
    if (geometry) {
      // change small polygons to points
      if (geometry.type == "Polygon" || geometry.type == "MultiPolygon") {
        let minLon = 180
        let maxLon = -180
        let minLat = 90
        let maxLat = -90
        for (const [lon, lat] of coordinatesOf(geometry)) {
          if (lon < minLon) {
            minLon = lon
          }
          if (lon > maxLon) {
            maxLon = lon
          }
          if (lat < minLat) {
            minLat = lat
          }
          if (lat > maxLat) {
            maxLat = lat
          }
        }
        const w = maxLon - minLon
        const h = maxLat - minLat
        if (w < SMALL_POLYGON_THRESHOLD && h < SMALL_POLYGON_THRESHOLD) {
          const centerLon = (minLon + maxLon) / 2
          const centerLat = (minLat + maxLat) / 2
          feature.geometry.geometries[0] = {
            "coordinates": [ centerLon, centerLat ],
            "type": "Point"
          }
          points.push(feature)
        } else {
          polygons.push(feature)
        }
      } else if (geometry.type == "Point") {
        points.push(feature)
      }
    }
  }
  return { polygons, points }
}

const initializeMap = () => {

  const map = createMap(regl, { backgroundColor: [ 0, 0, 0, 0 ]})

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
    uniform float zindex;
    attribute vec2 tcoord;
    varying vec2 vtcoord;
    void main () {
      vec2 p = position + offset;
      vtcoord = tcoord;
      gl_Position = vec4(
        (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
        (p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0,
        1.0/(1.0+zindex), 1);
    }
    `,
    uniforms: {
      id: map.prop('id'),
      zindex: map.prop('zindex'),
      texture: map.prop('texture'),
    },
    attributes: {
      position: map.prop('points'),
      tcoord: [ 0,1,0,0,1,1,1,0 ], // sw,se,nw,ne
    },
    elements: [ 0,1,2,1,2,3 ],
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha',
      },
    },
  })

  map.addLayer({
    viewbox(bbox, zoom, cb) {
      zoom = Math.round(zoom)
      cb(null, tiles[(zoom < 2) ? 0 : (zoom < 3) ? 1 : 2])
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
          bbox[2], bbox[3], // ne
        ],
      }
      drawTile.props.push(prop)
      map.draw()
      resl({
        manifest: {
          tile: {
            type: 'image',
            src: '/images/maptiles/'+file,
          },
        },
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

  const drawTriangle = (color, zindex) => map.createDraw({
    frag: `
    void main () {
      gl_FragColor = ${color};
    }
   `,
    vert: `
    precision highp float;
    attribute vec2 position;
    uniform vec4 viewbox;
    uniform vec2 offset;
    uniform float zindex;
    void main () {
      vec2 p = position + offset;
      gl_Position = vec4(
        (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
        (p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0,
        1.0/(1.0+zindex), 1);
    }
    `,
    uniforms: {
      zindex,
    },
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha',
      },
    },
    attributes: {
      position: map.prop('positions'),
    },
    elements: map.prop('cells'),
  })

  const drawPoint = (color, zindex) => map.createDraw({
    frag: `
    precision highp float;
    void main () {
      gl_FragColor = ${color};
    }
    `,
    vert: `
    precision highp float;
    attribute vec2 position;
    uniform vec4 viewbox;
    uniform vec2 offset;
    uniform float zindex;
    uniform float zoom;
    void main () {
      vec2 p = position + offset;
      gl_PointSize = pow(zoom,1.2)*2.0;
      gl_Position = vec4(
        (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
        (p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0,
        1.0/(1.0+zindex), 1);
    }
    `,
    uniforms: {
      zindex,
    },
    primitive: 'points',
    attributes: {
      position: map.prop('positions'),
    },
    count: map.prop('count'),
  })

  const RED = 'vec4(1.0,0.0,0.0,0.6)'
  const PURPLE = 'vec4(0.8,0.4,0.9,0.4)'

  const drawFeatures = drawTriangle(PURPLE, 100)
  const drawFocusedFeatures = drawTriangle(RED, 200)
  const drawPointFeatures = drawPoint(PURPLE, 300)
  const drawFocusedPointFeatures = drawPoint(RED, 400)

  map.display = ({ width, height, features, focusedFeatures }) => {

    const unfocusedFeatures = features.filter(
      feature => focusedFeatures.every(f => f.id !== feature.id))
    const {
      polygons:focusedPolygons,
      points:focusedPoints
    } = splitIntoPolygonsAndPoints(focusedFeatures)
    const {
      polygons:unfocusedPolygons,
      points:unfocusedPoints
    } = splitIntoPolygonsAndPoints(unfocusedFeatures)

    let mesh
    if (unfocusedPolygons.length > 0) {
      mesh = createMesh({ features: unfocusedPolygons })
      drawFeatures.props = [ mesh.triangle ]
    } else {
      drawFeatures.props = []
    }
    if (focusedPolygons.length > 0) {
      mesh = createMesh({ features: focusedPolygons })
      drawFocusedFeatures.props = [ mesh.triangle ]
    } else {
      drawFocusedFeatures.props = []
    }
    if (unfocusedPoints.length > 0) {
      mesh = createMesh({ features: unfocusedPoints })
      drawPointFeatures.props = [ mesh.point ]
    } else {
      drawPointFeatures.props = []
    }
    if (focusedPoints.length > 0) {
      mesh = createMesh({ features: focusedPoints })
      drawFocusedPointFeatures.props = [ mesh.point ]
    } else {
      drawFocusedPointFeatures.props = []
    }

    const bbox = mesh2bbox(mesh)
    if (bbox) {
      map.setViewbox(pad(bbox, width, height))
    } else {
      map.setViewbox(DEFAULT_VBOX)
    }
    map.draw()
  }
  return map
}

const clear = node => {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

const ZoomButton = ({
  top='2px',
  left='2px',
  children,
  ...props
}) =>
  h(AriaButton, {
    sx: {
      position: 'absolute',
      top,
      left,
      cursor: 'pointer',
      backgroundImage: 'linear-gradient(to bottom, #f8f9fa 0%, #f1f3f5 85%)',
      ':hover': {
        backgroundImage: 'linear-gradient(to bottom, #f1f3f5 0%, #e9ecef 85%)',
      },
      userSelect: 'none',
    },
    bg: 'white',
    fontSize: 5,
    lineHeight: 1,
    textAlign: 'center',
    width: 30,
    border: 1,
    borderColor: 'gray.3',
    ...props,
  }, children)

class _Map extends Component {

  constructor(props) {
    super(props)

    this.state = { map: undefined }

    this.onKeyDown = this.onKeyDown.bind(this)
    this.zoomIn = this.zoomIn.bind(this)
    this.zoomOut = this.zoomOut.bind(this)
    this.setZoom = this.setZoom.bind(this)
    this.draw = this.draw.bind(this)
    this.redraw = this.redraw.bind(this)
    this.getWidth = this.getWidth.bind(this)
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
    this.debouncedShow = debounce(this.show)

    this.innerContainer = createRef()
    this.outerContainer = createRef()
  }

  render() {
    return (
      h('div', {
        ref: this.outerContainer,
        style: {
          backgroundColor: '#000000',
          height: this.props.height,
          position: 'relative',
        },
      }, [
        h('div', {
          className: 'mapCanvas',
          ref: this.innerContainer,
          style: { position: 'absolute' },
        }),
        h(ZoomButton, {
          onSelect: this.zoomIn,
        }, '+'),
        h(ZoomButton, {
          top: '36px',
          onSelect: this.zoomOut,
        }, '−'),
      ])
    )
  }

  componentDidMount() {
    const map = initializeMap()
        , width = this.getWidth()
        , { height, features, focusedFeatures } =  this.props
    this.innerContainer.current.appendChild(
      map.render({
        width,
        height,
      })
    )
    map.display({
      width,
      height,
      features,
      focusedFeatures,
    })
    this.setState({ map })

    window.addEventListener('resize', this.debouncedShow)
    window.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('layoutChanged', this.redraw)
  }

  onKeyDown(e) {
    if (e.code === 'Equal') {
      this.zoomIn()
    } else if (e.code === 'Minus') {
      this.zoomOut()
    }
  }

  zoomIn() {
    if (this.state.map) {
      this.setZoom(this.state.map.getZoom() + 1)
    }
  }

  zoomOut() {
    if (this.state.map) {
      this.setZoom(this.state.map.getZoom() - 1)
    }
  }

  setZoom(zoom) {
    if (this.state.map) {
      this.state.map.setZoom(zoom)
    }
  }

  draw() {
    if (this.state.map) {
      this.state.map.draw()
    }
  }

  redraw() {
    this.draw()
    window.requestAnimationFrame(this.draw)
  }

  getWidth() {
    if (this.outerContainer.current) {
      return this.outerContainer.current.getBoundingClientRect().width
    } else {
      return 0
    }
  }

  show() {
    if (this.state.map) {
      const width = this.getWidth()
      const { height, features, focusedFeatures } = this.props
      this.state.map.resize(width, height)
      this.state.map.display({
        width,
        height,
        features,
        focusedFeatures,
      })
    }
  }

  hide() {
    if (this.state.map) {
      this.state.map.resize(0, 0)
      this.state.map.display({
        width: 0,
        height: 0,
        features: [],
        focusedFeatures: [],
      })
    }
  }

  componentDidUpdate(prevProps) {
    const { height, features, focusedFeatures } = this.props

    const reshow = (
      prevProps.height !== height ||
      prevProps.features !== features ||
      prevProps.focusedFeatures !== focusedFeatures
    )

    if (reshow) {
      this.show()
    }
  }

  componentWillUnmount() {
    document.removeEventListener('layoutChanged', this.redraw)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('resize', this.debouncedShow)

    this.hide()

    clear(this.innerContainer.current)
  }
}

exports.WorldMap = ({
  features,
  focusedFeatures,
  height=400,
  ...props
}) =>
  h(Box, {
    sx: {
      maxWidth: height * MAX_ASPECT_RATIO,
    },
    ...props,
  }, [
    h(_Map, {
      features,
      focusedFeatures,
      height,
    }),
  ])

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

const length = bbox => {
  const lonDelta = bbox[2] - bbox[0]
  const latDelta = bbox[3] - bbox[1]
  if (lonDelta > 359) {
    return latDelta
  }
  return Math.max(lonDelta, latDelta)
}


const MINIMUM_ZOOM = 0.25
const MAXIMUM_ZOOM = 21

const bounded = zoom => Math.max(Math.min(zoom, MAXIMUM_ZOOM), MINIMUM_ZOOM)

const ln360 = Math.log2(360)

const bboxToZoom = bbox => {
  const dx = bbox[2] - bbox[0]
  const dy = bbox[3] - bbox[1]
  const d = Math.max(dx,dy)
  const zoom = ln360 - Math.log2(d) + 1
  return bounded(zoom)
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

  return padding
    ? zoomToBbox(bbox, bounded(zoom - padding))
    : bbox
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

  const RED = 'vec4(1.0,0.0,0.0,0.5)'
  const DEEP_PURPLE = 'vec4(0.4,0.0,0.4,0.25)'

  const drawTriangle = (color, zindex) => map.createDraw({
    frag: `
    void main () {
      gl_FragColor = ${color};
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

  const drawFeatures = drawTriangle(DEEP_PURPLE, 100)
  const drawFocusedFeatures = drawTriangle(RED, 200)

  const bbox = mesh => {
    const box = [ 180,90,-180,-90 ]
    for (let i = 0; i < mesh.triangle.positions.length; i++) {
      box[0] = Math.min(box[0], mesh.triangle.positions[i][0])
      box[1] = Math.min(box[1], mesh.triangle.positions[i][1])
      box[2] = Math.max(box[2], mesh.triangle.positions[i][0])
      box[3] = Math.max(box[3], mesh.triangle.positions[i][1])
    }
    return box
  }

  map.display = (features, focusedFeatures) => {
    const unfocusedFeatures = features.filter(
      f => f.geometry && focusedFeatures.every(feature => feature.id !== f.id)
    )
    let viewbox = undefined
    if (unfocusedFeatures.length > 0) {
      const mesh = createMesh({ features: unfocusedFeatures })
      drawFeatures.props = [ mesh.triangle ]
      viewbox = bbox(mesh)
    } else {
      drawFeatures.props = []
    }
    if (focusedFeatures.length > 0) {
      const mesh = createMesh({ features: focusedFeatures })
      drawFocusedFeatures.props = [ mesh.triangle ]
      viewbox = bbox(mesh)
    } else {
      drawFocusedFeatures.props = []
    }
    if (viewbox) {
      map.setViewbox(pad(map, viewbox))
    }
    map.draw()
  }

  return map
}

const getWidth = element => element ? element.getBoundingClientRect().width : 0

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
    pb: '4px',
    fontSize: 4,
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
          position: 'relative',
          height: this.props.height,
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
          top: '32px',
          onSelect: this.zoomOut,
        }, '−'),
      ])
    )
  }

  componentDidMount() {
    const map = initializeMap()
    this.innerContainer.current.appendChild(
      map.render({
        width: getWidth(this.outerContainer.current),
        height: this.props.height,
      })
    )
    map.display(this.props.features, this.props.focusedFeatures)
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
      this.setZoom(
        Math.min(6, Math.round(this.state.map.getZoom() + 1))
      )
    }
  }

  zoomOut() {
    if (this.state.map) {
      this.setZoom(
        this.state.map.getZoom() - 1
      )
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

  show() {
    if (this.state.map) {
      const { height, features, focusedFeatures } = this.props
      this.state.map.resize(getWidth(this.outerContainer.current), height)
      this.state.map.display(features, focusedFeatures)
    }
  }

  hide() {
    if (this.state.map) {
      this.state.map.resize(0, 0)
      this.state.map.display([], [])
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
  height=200,
  ...props
}) =>
  h(Box, {
    sx: {
      // FIXME: Move to theme
      bg: '#6194b9', // ocean color
    },
    ...props,
  }, [
    h(_Map, {
      features,
      focusedFeatures,
      height,
    }),
  ])

"use strict";

const h = require('react-hyperscript')
    , React = require('react')

class LoadingIcon extends React.Component {
  render() {
    const {
      stroke='#000',
      width=12,
      strokeWidth='2px',
    } = this.props

    return (
      h('svg', {
        width,
        viewBox: '0 0 20 20',
      }, [
        h('line', {
          stroke,
          strokeWidth,
          x1: 0,
          y1: 10,
          x2: 20,
          y2: 10,
          ref: el => {
            if (el && !this.animated) {
              const animation = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
              animation.setAttribute('attributeName', 'transform')
              animation.setAttribute('type', 'rotate')
              animation.setAttribute('from', '0 10 10')
              animation.setAttribute('to', '360 10 10')
              animation.setAttribute('dur', '1.2s')
              animation.setAttribute('repeatCount', 'indefinite')
              el.appendChild(animation)
              this.animated = true
            }
          },
        }),
      ])
    )
  }
}

function LinkIcon({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
  title='title',
}) {
  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'arcs',
      fill: 'none',
    }, [
      h('title', title),

      h('path', {
        d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
      }),

      h('path', {
        d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
      }),
    ])
  )
}

function RefreshIcon({
  color='white',
  width='1em',
  height='1em',
}) {
  return (
    h('svg', {
      color,
      width,
      height,
      fill: 'currentColor',
      viewBox: '0 0 32 32',
    }, [
      h('path', {
        d: 'M16 2 A14 14 0 0 0 2 16 A14 14 0 0 0 16 30 A14 14 0 0 0 26 26 L 23.25 23 A10 10 0 0 1 16 26 A10 10 0 0 1 6 16 A10 10 0 0 1 16 6 A10 10 0 0 1 23.25 9 L19 13 L30 13 L30 2 L26 6 A14 14 0 0 0 16 2',
      }),
    ])
  )
}

function FirstIcon({
  color='black',
  width='1em',
  height='1em',
}) {
  return (
    h('svg', {
      color,
      width,
      height,
      fill: 'currentColor',
      viewBox: '0 0 32 32',
    }, [
      h('path', {
        d: 'M4 4 H8 V14 L28 4 V28 L8 18 V28 H4 z',
      }),
    ])
  )
}

function PrevIcon({
  color='black',
  width='1em',
  height='1em',
}) {
  return (
    h('svg', {
      color,
      width,
      height,
      fill: 'currentColor',
      viewBox: '0 0 32 32',
    }, [
      h('path', {
        d: 'M24 4 V28 L6 16 z',
      }),
    ])
  )
}

function NextIcon({
  color='black',
  width='1em',
  height='1em',
}) {
  return (
    h('svg', {
      color,
      width,
      height,
      fill: 'currentColor',
      viewBox: '0 0 32 32',
    }, [
      h('path', {
        d: 'M8 4 V28 L26 16 z',
      }),
    ])
  )
}

function LastIcon({
  color='black',
  width='1em',
  height='1em',
}) {
  return (
    h('svg', {
      color,
      width,
      height,
      fill: 'currentColor',
      viewBox: '0 0 32 32',
    }, [
      h('path', {
        d: 'M4 4 L24 14 V4 H28 V28 H24 V18 L4 28 z',
      }),
    ])
  )
}

module.exports = {
  LoadingIcon,
  LinkIcon,
  RefreshIcon,
  FirstIcon,
  PrevIcon,
  NextIcon,
  LastIcon,
}

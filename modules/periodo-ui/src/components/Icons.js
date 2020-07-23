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

function SettingsIcon({
  color='black',
  width='18px',
  height='18px',
  strokeWidth='1',
}) {
  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 32 32',
      color,
      fill: 'currentColor',
      stroke: 'currentColor',
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'arcs',
    }, [
      h('circle', {
        cx: 16,
        cy: 16,
        r: 3,
      }),
      h('path', {
        d: 'M29,13h-2.41c-0.24-0.82-0.57-1.61-0.99-2.36l1.72-1.71c0.18-0.19,0.29-0.45,0.29-0.71c0-0.27-0.11-0.52-0.29-0.71   l-2.83-2.83c-0.39-0.39-1.03-0.39-1.42,0L21.36,6.4C20.61,5.98,19.82,5.65,19,5.41V3c0-0.55-0.45-1-1-1h-4c-0.55,0-1,0.45-1,1v2.41   c-0.82,0.24-1.61,0.57-2.36,0.99L8.93,4.68c-0.39-0.39-1.03-0.39-1.42,0L4.68,7.51C4.5,7.7,4.39,7.95,4.39,8.22   c0,0.26,0.11,0.52,0.29,0.71l1.72,1.71C5.98,11.39,5.65,12.18,5.41,13H3c-0.55,0-1,0.45-1,1v4c0,0.55,0.45,1,1,1h2.41   c0.24,0.82,0.57,1.61,0.99,2.36l-1.72,1.71c-0.18,0.19-0.29,0.44-0.29,0.71c0,0.26,0.11,0.52,0.29,0.71l2.83,2.83   c0.39,0.39,1.03,0.39,1.42,0l1.71-1.72c0.75,0.42,1.54,0.75,2.36,0.99V29c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1v-2.41   c0.82-0.24,1.61-0.57,2.36-0.99l1.71,1.72c0.39,0.39,1.03,0.39,1.42,0l2.83-2.83c0.18-0.19,0.29-0.45,0.29-0.71   c0-0.27-0.11-0.52-0.29-0.71l-1.72-1.71c0.42-0.75,0.75-1.54,0.99-2.36H29c0.55,0,1-0.45,1-1v-4C30,13.45,29.55,13,29,13z M16,24   c-4.41,0-8-3.59-8-8c0-4.41,3.59-8,8-8s8,3.59,8,8C24,20.41,20.41,24,16,24z',
      }),
    ])
  )
}

module.exports = {
  LoadingIcon,
  LinkIcon,
  RefreshIcon,
  SettingsIcon,
  FirstIcon,
  PrevIcon,
  NextIcon,
  LastIcon,
}

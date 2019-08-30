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


module.exports = {
  LoadingIcon,
  LinkIcon,
}

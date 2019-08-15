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

module.exports = {
  LoadingIcon,
}

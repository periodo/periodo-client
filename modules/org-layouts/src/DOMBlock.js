"use strict";

const h = require('react-hyperscript')
    , React = require('react')

const noop = () => null

module.exports = function makeDOMBlock(obj) {
  const proto = Object.assign({
    init: noop,
    update: noop,
    destroy: noop,
  }, obj)

  class DOMBlock extends React.Component {
    constructor() {
      super();

      this.state = {
        streamCount: 0
      }
    }

    componentDidMount() {
      this.blockEl = document.createElement('div')

      this.instance = Object.create(proto)
      this.instance.init(this.blockEl, this.props)
      this.update()

      this._rootEl.appendChild(this.blockEl)
    }

    componentDidUpdate(prevProps) {
      if (this.props.data !== prevProps.data) {
        this.update()
      }
    }

    componentWillUnmount() {
      this.instance.destroy();
    }

    update() {
      this.instance.update(this.props.data, this.props)
    }

    render() {
      return h('div', {
        ref: el => this._rootEl = el
      })
    }
  }

  return Object.assign({}, obj, {
    Component: DOMBlock,
  })
}

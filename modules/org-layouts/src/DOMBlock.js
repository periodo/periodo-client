"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , StreamConsumingBlock = require('./StreamConsumingBlock')

const noop = () => null

module.exports = function makeDOMBlock(obj) {
  const next = obj.next || ((prev=[], items) => prev.concat(items))
      , steps = obj.steps || Infinity

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
      this.instance.init(this.blockEl)

      this._rootEl.appendChild(this.blockEl)
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.stream !== nextProps.stream) {
        this.setState(prev => ({ streamCount: prev.streamCount + 1 }))
      }
    }

    componentDidUpdate(prevProps) {
      if (this.props.started && this.props.data !== prevProps.data) {
        if (!this.props.finished && !this.props.data.length) return
        this.instance.update(this.props.data, this.state.streamCount)
      }
    }

    componentWillUnmount() {
      this.instance.destroy();
    }

    render() {
      return h('div', {
        ref: el => this._rootEl = el
      })
    }
  }

  return Object.assign({}, obj, {
    Component: StreamConsumingBlock(next, steps)(DOMBlock)
  })
}

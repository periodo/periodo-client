"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Consumer = require('./Consumer')

const noop = () => null

module.exports = function makeDOMLayout(proto) {
  proto = Object.assign({
    init: noop,
    update: noop,
    destroy: noop,
    steps: Infinity,
    next(prev=[], items) {
      return prev.concat(items)
    }
  }, proto)

  class DOMLayout extends React.Component {
    constructor() {
      super();

      this.reset = () => {
        if (this.layoutObj) {
          this.layoutObj.destroy();
          this.reactEl.removeChild(this.container)
        }

        this.container = document.createElement('div')
        this.reactEl.appendChild(this.container);
        this.layoutObj = Object.create(proto)
        this.layoutObj.init(this.container)
      }
    }

    componentDidMount() {
      this.reset();
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.stream !== nextProps.stream) {
        this.reset();
      }
    }

    componentDidUpdate(prevProps) {
      if (this.props.started && this.props.data !== prevProps.data) {
        this.layoutObj.update(this.props.data)
      }
    }

    render() {
      return h('div', {
        ref: el => this.reactEl = el
      })
    }
  }

  return Consumer(proto.next, proto.steps, DOMLayout)
}

"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , through = require('through2')

module.exports = function makeConsumer(type, step, Component) {
  return class Consumer extends React.Component {
    constructor() {
      super();

      this.state = {
        [type]: [],
        finished: false,
      }
    }

    componentDidMount() {
      this.consumeStream();
    }

    consumeStream() {
      const items = []

      const flush = () => {
        this.setState(prev => ({
          [type]: prev[type].concat(items.splice(0, Infinity))
        }))
      }

      let i = 0;

      this.props.stream
        .pipe(through.obj((get, enc, cb) => {
          items.push(get(type))

          i++

          if (i % step === 0) {
            flush();
            setTimeout(cb, 0);
          } else {
            cb();
          }
        }))
        .on('finish', () => {
          flush();

          this.setState({ finished: true })
        })
    }

    render() {
      return h(Component, Object.assign({}, this.state, this.props, {
        consumeStream: this.consumeStream
      }))
    }
  }
}

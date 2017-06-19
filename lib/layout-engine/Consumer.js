"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , through = require('through2')

module.exports = function makeConsumer(next, stepToRender, Component) {
  return class Consumer extends React.Component {
    constructor() {
      super();

      this.state = {
        data: next(undefined, []),
        finished: false,
      }
    }

    componentDidUpdate(prevProps) {
      if (this.props.stream && prevProps.stream !== this.props.stream) {
        this.consumeStream();
      }
    }

    consumeStream() {
      let i = 0;

      const items = []

      const flush = () => {
        this.setState(prev => {
          return {
            data: next(prev.data, items),
          }
        })
      }

      const consume = () => {
        this.props.stream
          .pipe(through.obj((data, enc, cb) => {

            items.push(data)

            i++

            if (i % stepToRender === 0) {
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

      this.setState({
        data: next(undefined, []),
        finished: false
      }, consume)
    }

    render() {
      return h(Component, Object.assign({}, this.state, this.props, {
        consumeStream: this.consumeStream
      }))
    }
  }
}

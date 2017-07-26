"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , through = require('through2')

module.exports = function makeConsumer(next, stepToRender, Component) {
  return class Consumer extends React.Component {
    constructor() {
      super();

      this.state = {
        started: false,
        finished: false,
        data: next(undefined, []),
      }
    }

    componentDidMount() {
      this.consumeInputStream()
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.stream !== nextProps.stream) {
        this.consumeInputStream()
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (!nextState.started && !nextState.finished) {
        return false
      }

      return true
    }

    consumeInputStream() {
      let i = 0;

      const items = []
          , start = R.once(() => this.setState({ started: true }))

      const flush = () => {
        start();

        this.setState(prev => {
          return {
            started: true,
            data: next(prev.data, items.splice(0), this.props),
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
            console.log('finished');
            flush();
            this.setState({ finished: true })
          })
      }

      this.setState({
        data: next(undefined, [], this.props),
        started: false,
        finished: false,
      }, consume)
    }

    render() {
      return h(Component, Object.assign({}, this.state, this.props, {
        consumeStream: this.consumeStream,
        updateData: fn => this.setState(prev => ({ data: fn(prev.data) })),
      }))
    }
  }
}

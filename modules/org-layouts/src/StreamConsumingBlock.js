"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , through = require('through2')

function emptyState(next, props) {
  return {
    started: false,
    finished: false,
    data: next(undefined, [], props),
  }
}

module.exports = function makeStreamConsumingBlock(next, stepToRender) {
  return Component => {
    class StreamConsumingBlock extends React.Component {
      constructor() {
        super();
        this.state = emptyState(next)
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
        // If there is a new stream coming which has not yet started, then wait
        // to render again.
        if (!nextState.started && !nextState.finished) {
          return false
        }

        return true
      }

      consumeInputStream() {
        const { stream } = this.props
            , items = []
            , start = R.once(() => this.setState({ started: true }))

        let i = 0;

        this.setState(emptyState(next, this.props), () =>
          stream
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
        )

        function flush() {
          start();

          this.setState(prev => ({
            started: true,
            data: next(prev.data, items.splice(0), this.props),
          }))
        }
      }

      render() {
        return h(Component, Object.assign({}, this.state, this.props, {
          consumeStream: this.consumeInputStream,
          updateData: fn => this.setState(prev => ({ data: fn(prev.data) })),
        }))
      }
    }

    StreamConsumingBlock.displayName = `StreamConsumingBlock(${Component.displayName})`

    return StreamConsumingBlock

  }
}

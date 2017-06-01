"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , debounce = require('debounce')
    , PropTypes = require('prop-types')
    , consume = require('stream-consume')
    , parseEngineState = require('./state')
    , { Box } = require('axs-ui')
    , { PassThrough } = require('stream')

class Layout extends React.Component {
  render() {
    const { layout, updateOpts, stream } = this.props
        , { handler, props, derivedOpts } = layout
        , { Component } = handler

    return h(Box, props, h(Component, Object.assign({}, derivedOpts, {
      updateOpts,
      stream
    })))
  }
}

class LayoutEngine extends React.Component {
  constructor(props) {
    super();
    this.state = {}
    this.refresh = this.refresh.bind(this);
    this.startStreaming = this.startStreaming.bind(this);

    const updateLayoutOptsCache = {}
    this.updateLayoutOpts = (i, j) => {
      const key = [i, j]

      if (!updateLayoutOptsCache[key]) {
        updateLayoutOptsCache[key] = props.updateLayoutOpts.bind(null, i, j)
      }

      return updateLayoutOptsCache[key]
    }
  }

  componentWillMount() {
    this.refresh();
    this.startStreaming = debounce(this.startStreaming, 400);
  }

  componentWillReceiveProps() {
    setTimeout(this.refresh, 0);
  }

  startStreaming() {
    let streams, prevStreams

    this.setState(prev => {
      streams = this.state.getStreams()
      prevStreams = prev.streams

      const layoutStreams = this.state.groups.map(({ layouts }, i) =>
        layouts.map(() =>
          streams[i].pipe(new PassThrough({ objectMode: true }))))

      return { layoutStreams }
    }, () => {
      consume(R.last(streams))

      if (prevStreams) {
        prevStreams[0].destroy();
      }
    })
  }

  refresh() {
    const { layouts, createReadStream, spec } = this.props
        , { getStreams, groups } = parseEngineState(layouts, createReadStream, spec)


    this.setState({ getStreams, groups }, this.startStreaming);
  }

  render() {
    const { groups, layoutStreams } = this.state

    return (
      h(Box, groups.map((group, i) =>
        h(Box, Object.assign({}, group.props, {
          key: i,
        }), group.layouts.map((layout, j) =>
          h(Layout, {
            key: j + layout.name,
            layout,
            stream: R.path([i, j], layoutStreams),
            updateOpts: this.updateLayoutOpts(i, j)
          })
        ))
      ))
    )
  }
}

LayoutEngine.propTypes = {
  createReadStream: PropTypes.func.isRequired,
  layouts: PropTypes.object.isRequired,
  spec: PropTypes.object,
  updateLayoutOpts: PropTypes.func.isRequired,
}

module.exports = LayoutEngine;

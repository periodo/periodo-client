"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , consume = require('stream-consume')
    , parseEngineState = require('./state')
    , { Box } = require('axs-ui')
    , { PassThrough } = require('stream')

function Layout({ layout, stream }) {
  const { handler, props, derivedOpts } = layout
      , { Component } = handler

  console.log(layout);

  return h(Box, props, h(Component, { stream, derivedOpts }))
}

class LayoutEngine extends React.Component {
  constructor() {
    super();
    this.refresh = this.refresh.bind(this);
  }

  componentWillMount() {
    this.refresh();
  }

  refresh() {
    const { layouts, createReadStream, spec } = this.props
        , { streams, groups } = parseEngineState(layouts, createReadStream, spec)

    const layoutStreams = groups.map(({ layouts }, i) =>
      layouts.map(() =>
        streams[i].pipe(new PassThrough({ objectMode: true }))))

    this.setState({
      groups,
      layoutStreams
    })

    consume(R.last(streams));
  }

  render() {
    const { groups, layoutStreams } = this.state

    return (
      h(Box, groups.map((group, i) =>
        h(Box, Object.assign({}, group.props, {
          key: i
        }), group.layouts.map((layout, j) =>
          h(Layout, {
            key: j,
            layout,
            stream: layoutStreams[i][j]
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
}

module.exports = LayoutEngine;

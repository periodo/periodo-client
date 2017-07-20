"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , debounce = require('debounce')
    , PropTypes = require('prop-types')
    , consume = require('stream-consume')
    , { Box } = require('axs-ui')
    , { PassThrough } = require('stream')
    , parseEngineState = require('./parse_spec')
    , LayoutChooser = require('./Chooser')

class Layout extends React.Component {
  render() {
    const { layout, updateOpts, stream, extra } = this.props
        , { handler, props, derivedOpts } = layout
        , { Component } = handler

    return h(Box, props, h(Component, Object.assign({}, derivedOpts, extra, {
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

  componentWillUnmount() {
    this._unmounted = true;
  }

  componentWillReceiveProps(nextProps) {
    // FIXME: This should not always refresh after receiving props
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

    if (!this._unmounted) {
      this.setState({ getStreams, groups }, this.startStreaming);
    }
  }

  render() {
    const { extra, layouts, spec, onSpecChange, } = this.props
        , { groups, layoutStreams } = this.state

    return (
      h(Box, groups.map((group, i) =>
        h(Box, Object.assign({}, group.props, {
          key: i,
        }),
          group.layouts.length === 0
            ? h(LayoutChooser, {
                layouts,
                onSelect: name => onSpecChange(
                  R.set(
                    R.lensPath(['groups', i, 'layouts', 0]),
                    { name },
                    spec
                  )
                )
              })
            : group.layouts.map((layout, j) =>
                h(Layout, {
                  key: j + layout.name,
                  layout,
                  extra,
                  stream: R.path([i, j], layoutStreams),
                  updateOpts: fn =>
                    onSpecChange(
                      R.over(
                        R.lensPath(['groups', i, 'layouts', j]),
                        fn,
                        spec,
                      )
                    )
                })
              )
        )
      ))
    )
  }
}

LayoutEngine.propTypes = {
  createReadStream: PropTypes.func.isRequired,
  layouts: PropTypes.object.isRequired,
  spec: PropTypes.object,
  onSpecChange: PropTypes.func.isRequired,
  extra: PropTypes.object,
}

module.exports = LayoutEngine;

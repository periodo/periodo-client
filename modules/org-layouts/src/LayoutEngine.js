"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , consume = require('stream-consume')
    , { Box } = require('axs-ui')
    , processLayout = require('./process_layout')

const DEFAULT_STREAM_RESET_DELAY = 256

class LayoutRenderer extends React.Component {
  constructor() {
    super();

    this.state = {
      streams: null
    }

    this.reset = this.reset.bind(this);
    this.resetStreams = this.resetStreams.bind(this);

  }

  componentDidMount() {
    this.reset(this.props)
    this.updateProcessedOpts(this.props.blockOpts)
    this.resetStreams();
    this._resetStreams = this.resetStreams;
    this.resetStreams = debounce(
      this.resetStreams,
      this.props.streamResetDelay || DEFAULT_STREAM_RESET_DELAY
    )
  }

  componentWillReceiveProps(nextProps) {
    const reset = (
      !R.equals(this.props.layout, nextProps.layout) ||
      !R.equals(this.props.blocks, nextProps.blocks) ||
      !R.equals(this.props.extraProps, nextProps.extraProps)
    )

    if (reset) {
      this.reset(nextProps)
      this.resetStreams()
    }

    if (this.props.blockOpts !== nextProps.blockOpts) {
      this.updateProcessedOpts(nextProps.blockOpts)
    }
  }

  reset(props) {
    this.setState({
      processedLayout: processLayout(props.blocks, props.layout),
    })
  }

  updateProcessedOpts(opts={}) {
    this.setState(prev => {
      const processedOpts = prev.processedLayout.blocks.map(block =>
        block.block.processOpts(
          Object.assign({}, block.baseOpts, opts[block.id])))

      return { processedOpts }
    })
  }

  resetStreams(startFrom=0) {
    this.setState(prev => {
      const _streams = prev.processedLayout.blocks.reduce((_streams, { block }, i) => {
        const processedOpts = prev.processedOpts[i]
            , lastOutput = (R.last(_streams) || { output: this.props.createReadStream() }).output
            , input = lastOutput.pipe(block.makeInputStream())
            , output = input.pipe(block.makeOutputStream(processedOpts))

        return [..._streams, { input, output }]
      }, [])

      return {
        _streams,
        streams: [
          ...(prev.streams || []).slice(0, startFrom),
          ..._streams.slice(startFrom)
        ]
      }
    })
  }

  render() {
    const { extraProps, blockOpts, onBlockOptsChange } = this.props
        , { processedLayout, processedOpts, streams, _streams } = this.state

    if (!processedLayout || !streams || !processedOpts) return null

    const children = processedLayout.blocks.map(({
      id,
      name,
      opts,
      block: { Component },
      gridRow,
      gridColumn,
      baseOpts,
    }, i) =>
      h(Box, {
        key: `${i}-${name}`,
        mt: 1,
        style: {
          gridRow,
          gridColumn,
        },
        css: {
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
      }, [
        h(Component, Object.assign({
          opts,
          stream: streams[i].input,
          updateOpts: (x, invalidate) => {
            const base = Object.assign({}, baseOpts, blockOpts[id])

            const updated = typeof x === 'object'
              ? Object.assign({}, base, x)
              : x(base)

            const changed = {}

            for (const k in updated) {
              if (updated[k] && baseOpts[k] !== updated[k]) {
                changed[k] = updated[k]
              }
            }

            onBlockOptsChange(Object.assign({}, blockOpts, { [id]: changed }))

            if (invalidate) {
              this.resetStreams(i)
            }
          },
        }, processedOpts[i], extraProps)),

        h(() => {
          // Consume the output stream after the block has had a chance to
          // attach itself to the DOM
          consume(_streams[i].output)

          return null;
        }),
      ])
    )

    return (
      h(Box, {
        css: { display: 'grid' },
        style: {
          gridTemplateColumns: processedLayout.gridTemplateColumns,
          gridTemplateRows: processedLayout.gridTemplateRows,
          gridGap: processedLayout.gridGap,
        },
      }, children)
    )
  }
}

module.exports = Object.assign(LayoutRenderer, {
  propTypes: {
    extra: PropTypes.object,
    blocks: PropTypes.objectOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      Component: PropTypes.any.isRequired,
      makeInputStream: PropTypes.func,
      makeOutputStream: PropTypes.func,
      processOpts: PropTypes.func,
    })).isRequired,
    layout: PropTypes.string.isRequired,
    blockOpts: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]).isRequired,
    onBlockOptsChange: PropTypes.func.isRequired,
    createReadStream: PropTypes.func.isRequired,
    streamResetDelay: PropTypes.number,
  }
})

"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , consume = require('stream-consume')
    , { Box } = require('periodo-ui')
    , processLayout = require('./process_layout')

const DEFAULT_STREAM_RESET_DELAY = 333

class LayoutBlock extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.stream !== this.props.stream) return true;

    const monitored = ['extraProps', 'processedOpts', 'passedOpts', 'defaultOpts']
        , changed = []

    for (const key of monitored) {
      if (!R.equals(this.props[key], nextProps[key])) {
        changed.push(key)
      }
    }

    if (changed.length) return true;

    return false;
  }

  render() {
    const {
      stream,
      gridRow,
      gridColumn,
      defaultOpts,
      passedOpts,
      processedOpts,
      extraProps,
      block: { Component },
      onOptsChange,
    } = this.props

    const opts = Object.assign({}, defaultOpts, passedOpts)

    const updateOpts = (fn, invalidate) => {
      const updated = typeof fn === 'object'
        ? Object.assign({}, opts, fn)
        : fn(opts)

      const newOpts = {}

      for (const k in updated) {
        const addToNewOpts = (
          updated[k] != undefined &&
          defaultOpts[k] !== updated[k] &&
          !!(defaultOpts[k] || updated[k])
        )

        if (addToNewOpts) {
          newOpts[k] = updated[k]
        }
      }

      onOptsChange(newOpts)

      if (invalidate) {
        this.props.reset();
      }
    }

    return (
      h('div', {
        style: {
          gridRow,
          gridColumn,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
      }, [
        h(Component, Object.assign({
          opts,
          stream,
          updateOpts,
        }, processedOpts, extraProps)),
      ])
    )
  }
}

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
      !R.equals(this.props.extraProps, nextProps.extraProps) ||
      (R.isEmpty(nextProps.blockOpts) && !R.isEmpty(this.props.blockOpts))
    )

    if (reset) {
      this.reset(nextProps)
      this._resetStreams()
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

    const currentOpts = () => this.props.blockOpts

    if (!processedLayout || !streams || !processedOpts) return null

    const children = processedLayout.blocks.map((block, i) => [
      h(LayoutBlock, Object.assign({
        key: `${i}-${block.type}`,
        stream: streams[i].input,
        extraProps,
        processedOpts: processedOpts[i],
        passedOpts: blockOpts[block.id],
        onOptsChange(newOpts) {
          onBlockOptsChange(
            R.isEmpty(newOpts)
              ? R.dissoc(block.id, currentOpts())
              : R.merge(currentOpts(), { [block.id]: newOpts })
          )
        },
        reset: this.resetStreams.bind(this, i),
      }, block)),

      h(() => {
        consume(_streams[i].output);
        return null;
      }, { key: `stream-consume-${i}` }),
    ])

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

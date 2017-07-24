"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , through = require('through2')
    , consume = require('stream-consume')
    , { Box } = require('axs-ui')
    , LayoutChooser = require('./Chooser')

class LayoutEngine extends React.Component {
  constructor() {
    super();

    this.state = {
      streams: []
    }

    this.debouncedResetStreams = debounce(this.resetStreams.bind(this), 400)
  }

  componentDidMount() {
    this.processSpec(this.props.spec);
    this.resetStreams()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.spec !== nextProps.spec) {
      const updateStreams = this.props.spec.length !== nextProps.spec.length

      this.processSpec(nextProps.spec)

      if (updateStreams) this.resetStreams();
    }
  }

  processSpec(spec) {
    const { layouts } = this.props

    this.setState({
      processedSpec: spec.map(({ name, opts }) => {
        const {
          Component=() => h(Box, { bg: 'red4' }, `No such layout: ${name}`),
          makeInputStream=through.obj,
          makeOutputStream=through.obj,
          processOpts=R.defaultTo({}, R.identity),
        } = (layouts[name] || {})

        return {
          name,
          opts,
          layout: {
            Component,
            makeInputStream,
            makeOutputStream,
            processOpts,
          },
          processedOpts: processOpts(opts),
        }
      })
    })
  }

  debouncedResetStreams(startFrom=0) {
    this.resetStreams(startFrom);
  }

  resetStreams(startFrom=0) {
    const { createReadStream } = this.props

    this.setState(prev => {
      const _streams = prev.processedSpec.reduce((_streams, { layout, processedOpts }) => {
        const lastOutput = (R.last(_streams) || { output: createReadStream() }).output
            , input = lastOutput.pipe(layout.makeInputStream())
            , output = input.pipe(layout.makeOutputStream(processedOpts))

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
    const { addAt, extraProps, layouts, spec, onSpecChange } = this.props
        , { processedSpec, streams, _streams } = this.state

    if (!processedSpec) return null;

    const children = processedSpec.map(({ name, layout, opts, processedOpts }, i) =>
      h(Box, {
        key: `${i}-${name}`,
        mt: 1,
      }, [
        h(layout.Component, Object.assign({
          opts,
          stream: streams[i].input,
          updateOpts: fn => onSpecChange(
            R.over(R.lensPath([i, 'opts']), fn, spec)
          ),
          invalidate: () => this.debouncedResetStreams(i),
        }, processedOpts, extraProps)),

        h(() => {
          // Consume the output stream after the layout has had a chance to
          // attach itself
          consume(_streams[i].output)

          return null;
        }),
      ])
    )

    if (addAt != null) {
      children.splice(addAt, 0, h(LayoutChooser, {
        key: `add-at-${addAt}`,
        layouts,
        onSelect: name => {
          onSpecChange(R.insert(addAt, { name }, spec))
        }
      }))
    }

    return h('div', {}, children);
  }
}

module.exports = Object.assign(LayoutEngine, {
  propTypes: {
    addAt: PropTypes.number,
    extra: PropTypes.object,
    layouts: PropTypes.objectOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      Component: PropTypes.any.isRequired,
      makeInputStream: PropTypes.func,
      makeOutputStream: PropTypes.func,
      processOpts: PropTypes.func,
    })).isRequired,
    spec: PropTypes.array.isRequired,
    onSpecChange: PropTypes.func.isRequired,
    createReadStream: PropTypes.func.isRequired,
  }
})

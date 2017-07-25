"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , through = require('through2')
    , consume = require('stream-consume')
    , { Flex, Box, Heading, Span, Input } = require('axs-ui')
    , { AriaButton } = require('lib/ui')
    , LayoutChooser = require('./Chooser')

class LayoutEngine extends React.Component {
  constructor() {
    super();

    this.state = {
      streams: []
    }

    this.debouncedResetStreams = debounce(this.resetStreams.bind(this), 256)
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
          defaultOpts={}
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
          defaultOpts,
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
    const { editGrid, addAt, extraProps, layouts, spec, onSpecChange } = this.props
        , { processedSpec, streams, _streams } = this.state

    if (!processedSpec) return null;

    const children = processedSpec.map(({ name, layout, opts, processedOpts, defaultOpts }, i) =>
      h(Box, {
        key: `${i}-${name}`,
        mt: 1,
        css: editGrid && {
          position: 'relative',
          minHeight: '8em',
        }
      }, [
        editGrid && (
          h(Box, {
            bg: 'yellow1',
            border: 1,
            borderColor: 'gray4',
            css: {
              boxShadow: '1px 1px 6px #999',
              position: 'absolute',
              borderRadius: '2px',
              top: 4,
              right: 4,
              zIndex: 2,
            }
          }, h(Box, { m: 1 }, [
            h(Box, {
              fontSize: 4,
              pb: '2px',
              css: {
                borderBottom: '1px solid #666',
              },
            }, 'Grid placement'),

            h(Flex, { my: 1 }, [
              h(Span, {
                mr: 2,
                alignItems: 'center',
                css: {
                  lineHeight: '1.5em',
                  fontWeight: 'bold',
                  flexGrow: 1,
                }
              }, 'Column'),
              h(Input, {
                type: 'number',
                height: '1em',
                width: 48,
                bg: 'white',
                p: '2px',
                min: 1,
                max: 2,
                mr: '6px',
              }),
              h(Input, {
                type: 'number',
                width: 48,
                bg: 'white',
                p: '2px',
                min: 1,
                max: 2,
                mr: '6px',
              }),

              h(AriaButton, {
                bg: 'red',
                color: 'white',
                title: 'Reset',
                css: {
                  fontSize: '16px',
                  height: '1.2em',
                  width: '1.2em',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  lineHeight: '1.2em',
                  borderRadius: 12,
                  ':hover': {
                    cursor: 'pointer',
                    backgroundColor: 'darkred',
                  },
                }
              }, '×'),
            ]),

            h(Flex, { my: 1 }, [
              h(Span, {
                mr: 2,
                alignItems: 'center',
                css: {
                  lineHeight: '1.5em',
                  fontWeight: 'bold',
                  flexGrow: 1,
                }
              }, 'Row'),
              h(Input, {
                type: 'number',
                height: '1em',
                width: 48,
                bg: 'white',
                p: '2px',
                min: 1,
                max: 2,
                mr: '6px',
              }),
              h(Input, {
                type: 'number',
                width: 48,
                bg: 'white',
                p: '2px',
                min: 1,
                max: 2,
                mr: '6px',
              }),

              h(AriaButton, {
                bg: 'red',
                color: 'white',
                title: 'Reset',
                css: {
                  fontSize: '16px',
                  height: '1.2em',
                  width: '1.2em',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  lineHeight: '1.2em',
                  borderRadius: 12,
                  ':hover': {
                    cursor: 'pointer',
                    backgroundColor: 'darkred',
                  },
                }
              }, '×'),
            ]),
          ]))
        ),

        h(layout.Component, Object.assign({
          opts,
          stream: streams[i].input,
          updateOpts: fn => onSpecChange(
            R.over(
              R.lensPath([i, 'opts']),
              R.pipe(
                R.merge(defaultOpts || {}),
                fn
              ),
              spec
            )
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

    return h('div', [
      editGrid && h(Box, {
        p: 2,
        my: 2,
        bg: 'yellow1',
        borderColor: 'gray4',
        css: {
          boxShadow: '1px 1px 6px #999',
          borderRadius: '2px',
        }
      }, [
        h(Heading, {
          level: 2,
          css: {
            borderBottom: '1px solid #666',
          }
        }, 'Grid'),

        h(Flex, [
          h(Box, { width: .5 }, [
            h(Heading, { level: 3 }, 'Columns'),
          ]),
          h(Box, { width: .5 }, [
            h(Heading, { level: 3 }, 'Rows'),
          ])
        ])
      ]),

      h('div', {
        style: {
          display: 'grid'
        },
      }, children),
    ])
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

"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , through = require('through2')
    , consume = require('stream-consume')
    , { Flex, Box, Heading, Span, Input } = require('axs-ui')
    , BlockChooser = require('./BlockChooser')

class LayoutEngine extends React.Component {
  constructor() {
    super();

    this.state = {
      streams: [],
    }

    this.debouncedResetStreams = debounce(this.resetStreams.bind(this), 256)
  }

  componentDidMount() {
    this.processSpec(this.props.spec);
    this.resetStreams()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.spec !== nextProps.spec) {
      const updateStreams = this.props.spec.blocks.length !== nextProps.spec.blocks.length

      this.processSpec(nextProps.spec)

      if (updateStreams) this.resetStreams();
    }
  }

  processSpec(spec) {
    const { blocks } = this.props

    this.setState({
      processedSpec: R.pipe(
        R.over(
          R.lensProp('blocks'),
          R.map(({ name, opts, gridRow='auto', gridColumn='auto' }) => {
            const {
              Component=() => h(Box, { bg: 'red4' }, `No such layout: ${name}`),
              makeInputStream=through.obj,
              makeOutputStream=through.obj,
              processOpts=R.defaultTo({}, R.identity),
              defaultOpts={}
            } = (blocks[name] || {})

            return {
              name,
              opts,
              gridRow,
              gridColumn,
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
        ),
        R.over(
          R.lensProp('gridGap'),
          R.defaultTo('')
        ),

        R.over(
          R.lensProp('gridTemplateColumns'),
          R.defaultTo('')
        ),

        R.over(
          R.lensProp('gridTemplateRows'),
          R.defaultTo('')
        ),
      )(spec)
    })
  }

  debouncedResetStreams(startFrom=0) {
    this.resetStreams(startFrom);
  }

  resetStreams(startFrom=0) {
    const { createReadStream } = this.props

    this.setState(prev => {
      const _streams = prev.processedSpec.blocks.reduce((_streams, { layout, processedOpts }) => {
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
    const { editGrid, addAt, extraProps, blocks, spec, onSpecChange } = this.props
        , { processedSpec, streams, _streams } = this.state

    if (!processedSpec) return null;

    const children = processedSpec.blocks.map(({
      name,
      layout,
      gridRow,
      gridColumn,
      opts,
      processedOpts,
      defaultOpts
    }, i) =>
      h(Box, {
        key: `${i}-${name}`,
        mt: 1,
        style: {
          gridRow,
          gridColumn,
        },
        css: Object.assign({
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }, editGrid && {
          position: 'relative',
          minHeight: '8em',
        })
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
                css: {
                  lineHeight: '1.5em',
                  fontWeight: 'bold',
                  flexGrow: 1,
                }
              }, 'grid-column:'),
              h(Input, {
                width: 100,
                value: gridColumn,
                onChange: e => {
                  onSpecChange(
                    R.set(
                      R.lensPath(['blocks', i, 'gridColumn']),
                      e.target.value,
                      spec
                    )
                  )
                },
                bg: 'white',
                p: '2px',
                mr: '6px',
              }),
            ]),

            h(Flex, { my: 1 }, [
              h(Span, {
                mr: 2,
                css: {
                  lineHeight: '1.5em',
                  fontWeight: 'bold',
                  flexGrow: 1,
                }
              }, 'grid-row:'),
              h(Input, {
                value: gridRow,
                onChange: e => {
                  onSpecChange(
                    R.set(
                      R.lensPath(['blocks', i, 'gridRow']),
                      e.target.value,
                      spec
                    )
                  )
                },
                width: 100,
                bg: 'white',
                p: '2px',
                min: 1,
                max: 2,
                mr: '6px',
              }),
            ]),
          ]))
        ),

        h(layout.Component, Object.assign({
          opts,
          stream: streams[i].input,
          updateOpts: fn => onSpecChange(
            R.over(
              R.lensPath(['blocks', i, 'opts']),
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
        blocks,
        onSelect: name => {
          onSpecChange(
            R.over(
              R.lensProp('blocks'),
              R.insert(addAt, { name }),
              spec
            )
          )
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
          mb: 2,
          css: {
            borderBottom: '1px solid #666',
          },
        }, 'CSS Grid'),

        h(Box, {
          css: {
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'center',
            gridGap: '1em 12px',
          },
        }, [

          h(Span, 'grid-template-columns'),
          h(Input, {
            bg: 'white',
            value: processedSpec.gridTemplateColumns,
            onChange: e => {
              onSpecChange(
                R.set(
                  R.lensProp('gridTemplateColumns'),
                  e.target.value,
                  spec
                )
              )
            },
            css: {
              width: 256,
            }
          }),

          h(Span, 'grid-template-rows'),
          h(Input, {
            bg: 'white',
            value: processedSpec.gridTemplateRows,
            onChange: e => {
              onSpecChange(
                R.set(
                  R.lensProp('gridTemplateRows'),
                  e.target.value,
                  spec
                )
              )
            },
            css: {
              width: 256,
            }
          }),

          h(Span, 'grid-gap'),
          h(Input, {
            bg: 'white',
            value: processedSpec.gridGap,
            onChange: e => {
              onSpecChange(
                R.set(
                  R.lensProp('gridGap'),
                  e.target.value,
                  spec
                )
              )
            },
            css: {
              width: 256,
            }
          }),
        ]),
      ]),

      h(Box, {
        css: {
          display: 'grid',
        },

        style: {
          gridTemplateColumns: processedSpec.gridTemplateColumns,
          gridTemplateRows: processedSpec.gridTemplateRows,
          gridGap: processedSpec.gridGap,
        },
      }, children),
    ])
  }
}

module.exports = Object.assign(LayoutEngine, {
  propTypes: {
    addAt: PropTypes.number,
    extra: PropTypes.object,
    blocks: PropTypes.objectOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      Component: PropTypes.any.isRequired,
      makeInputStream: PropTypes.func,
      makeOutputStream: PropTypes.func,
      processOpts: PropTypes.func,
    })).isRequired,
    spec: PropTypes.shape({
      blocks: PropTypes.array.isRequired,
      gridTemplateColumns: PropTypes.string,
      gridTemplateRows: PropTypes.string,
      gridGap: PropTypes.string,
    }).isRequired,
    onSpecChange: PropTypes.func.isRequired,
    createReadStream: PropTypes.func.isRequired,
  }
})

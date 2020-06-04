"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , { Box, SectionHeading, Section, Details } = require('periodo-ui')
    , LayoutBlock = require('./LayoutBlock')
    , processLayout = require('./process_layout')

const RESET_DEBOUNCE_TIME = 275

const layoutChangedEvent = new Event('layoutChanged')

function computeLayout(blocks, layoutDefinition) {
  return processLayout(blocks, layoutDefinition)
}

function computeLayoutOptions(layout, opts={}) {
  return layout.blocks.map(block =>
    block.block.processOpts( {
      ...block.baseOpts,
      ...opts[block.id],
    }))
}

function renderSection (section, blocksProps) {
  switch (section) {
  case 'hidden':
    return blocksProps.map(
      (props, key) => h('div', { key }, [
        h(LayoutBlock, {
          ...props,
          hidden: true,
        }),
      ])
    )

  case 'undefined':
    return blocksProps.map(
      (props, i) => h(Section, { key: `section-${i}` }, [
        h(LayoutBlock, props),
      ])
    )

  case 'untitled':
    return [ h(Section, blocksProps.map(props => h(LayoutBlock, props))) ]

  default:
    return [
      h(Details, {
        open: true,
        onToggle: () => document.dispatchEvent(layoutChangedEvent),
        summary: h(
          SectionHeading, {
            display: 'inline-block',
            style: { lineHeight: 1 },
          },
          section
        ),
        summaryProps: {
          css: {
            '::marker': { color: '#495057' },
            '::-webkit-details-marker': { color: '#495057' },
          },
          fontSize: '1.5rem', // h3
        },
      }, [
        hidden => {
          const blocks = blocksProps
            .map(
              props => (hidden && !props.block.keepMounted)
                ? null
                : h(LayoutBlock, {
                  ...props,
                  hidden,
                })
            )
            .filter(block => block !== null)

          return blocks.length > 0 ? h(Section, blocks) : null
        },
      ]),
    ]
  }
}

class LayoutRenderer extends React.Component {
  constructor(props) {
    super(props);

    const processedLayout = computeLayout(props.blocks, props.layout)
        , processedOpts = computeLayoutOptions(processedLayout, props.blockOpts)

    this.state = {
      processedLayout,
      processedOpts,
      dataForBlocks: processedOpts.map(() => []),
    }

    this.blockState = processedOpts.map(() => ({}))

    this.dataResets = 0

    this.resetLayout = this.resetLayout.bind(this);
    this.resetData = this.resetData.bind(this);
    this.debouncedResetData = debounce(this.resetData, RESET_DEBOUNCE_TIME)
    this.invalidate = this.invalidate.bind(this)

    this._isMounted = false
  }

  componentDidMount() {
    this._isMounted = true
    this.resetData()
  }

  componentDidUpdate(prevProps) {
    const resetLayout = (
      !R.equals(this.props.layout, prevProps.layout) ||
      !R.equals(this.props.blocks, prevProps.blocks) ||
      !R.equals(this.props.extraProps, prevProps.extraProps) ||
      (R.isEmpty(prevProps.blockOpts) && !R.isEmpty(this.props.blockOpts))
    )

    if (resetLayout) {
      this.resetLayout()
    }

    if (this.props.blockOpts !== prevProps.blockOpts) {
      this.updateProcessedOpts(this.props.blockOpts)
    }

    const resetData = (
      this.props.data !== prevProps.data
    )

    if (resetData) {
      this.resetData()
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  resetLayout() {
    const { blocks, layout, blockOpts } = this.props
        , processedLayout = processLayout(blocks, layout)
        , processedOpts = computeLayoutOptions(processedLayout, blockOpts)

    this.setState({
      processedLayout,
      processedOpts,
      blockState: processedOpts.map(() => {}),
    })
  }

  invalidate(i) {
    setTimeout(() => this.debouncedResetData(i), 0)
  }

  // TODO: Add startFrom=0 argument in order to prevent having to run filters
  // on every single block unnecessarily
  async resetData(/*startFrom=0*/) {
    this.dataResets += 1

    const { processedLayout, processedOpts } = this.state
        , renderID = this.dataResets
        , numBlocks = processedLayout.blocks.length

    const dataForBlocks = [ ...this.state.dataForBlocks ]

    dataForBlocks[0] = this.props.data

    for (let i = 0; i < numBlocks; i++) {
      await new Promise(async resolve => {
        const block = processedLayout.blocks[i]
            , blockOpts = processedOpts[i]
            , lastData = dataForBlocks[i]
            , state = this.blockState[i]

        if (this.dataResets !== renderID) {
          return resolve()
        }

        let nextData = lastData

        const { makeFilter } = block.block

        if (makeFilter) {
          const filterFn = await makeFilter(blockOpts, state, lastData)

          if (filterFn) {
            nextData = await lastData.filter(filterFn)
          }
        }

        dataForBlocks[i+1] = nextData

        if (this.dataResets !== renderID) {
          return resolve()
        }

        if (this._isMounted) {
          this.setState({ dataForBlocks })
        }
        setTimeout(resolve, 0)
      })
    }
  }


  updateProcessedOpts(opts={}) {
    this.setState(prev => {
      const processedOpts = prev.processedLayout.blocks.map(block =>
        block.block.processOpts(
          {
            ...block.baseOpts,
            ...opts[block.id],
          }))

      return { processedOpts }
    })
  }

  render() {
    const { extraProps, blockOpts, onBlockOptsChange, data } = this.props
        , { processedLayout, processedOpts, dataForBlocks } = this.state

    const currentOpts = () => this.props.blockOpts

    if (!processedLayout || !data || !processedOpts) return null

    const sections = processedLayout.blocks.reduce((sections, block, i) => {
      if (! (block.section in sections)) {
        sections[block.section] = []
      }
      sections[block.section].push(
        {
          key: `${i}-${block.type}`,
          data: dataForBlocks[i] || [],
          extraProps,
          processedOpts: processedOpts[i],
          passedOpts: blockOpts[block.id],
          invalidate: this.invalidate,
          setBlockState: (obj) => {
            const nextState = typeof obj === 'function'
              ? obj(this.blockState[i])
              : obj
            this.blockState[i] = nextState
          },
          onOptsChange: (newOpts, invalidate) => {
            onBlockOptsChange(
              R.isEmpty(newOpts)
                ? R.dissoc(block.id, currentOpts())
                : R.mergeRight(currentOpts(), { [block.id]: newOpts })
            )
            if (invalidate) {
              this.invalidate(i)
            }
          },
          ...block,
        }
      )
      return sections
    }, {})

    const children = Object.entries(sections).reduce(
      (children, [ section, blocksProps ]) => [
        ...children,
        ...renderSection(section, blocksProps),
      ], []
    )

    return h(Box, {}, children)
  }
}

module.exports = Object.assign(LayoutRenderer, {
  propTypes: {
    extra: PropTypes.object,
    blocks: PropTypes.objectOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      Component: PropTypes.any.isRequired,
      makeFilter: PropTypes.func,
      processOpts: PropTypes.func,
      keepMounted: PropTypes.bool,
    })).isRequired,
    layout: PropTypes.string.isRequired,
    blockOpts: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]).isRequired,
    onBlockOptsChange: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
  },
})

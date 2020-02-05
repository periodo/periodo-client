"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , PropTypes = require('prop-types')
    , debounce = require('debounce')
    , { Box } = require('periodo-ui')
    , processLayout = require('./process_layout')

const RESET_DEBOUNCE_TIME = 275

class LayoutBlock extends React.Component {
  shouldComponentUpdate(nextProps) {
    const monitored = [ 'extraProps', 'processedOpts', 'passedOpts', 'defaultOpts' ]

    if (this.props.data !== nextProps.data) {
      return true
    }

    for (const key of monitored) {
      if (!R.equals(this.props[key], nextProps[key])) {
        return true
      }
    }

    return false;
  }

  render() {
    const {
      gridRow,
      gridColumn,
      defaultOpts,
      passedOpts,
      processedOpts,
      extraProps,
      setBlockState,
      data,
      block: { Component },
      onOptsChange,
      invalidate,
    } = this.props

    const opts = {
      ...defaultOpts,
      ...passedOpts,
    }

    const updateOpts = (fn, invalidate) => {
      const updated = typeof fn === 'object'
        ? ({
          ...opts,
          ...fn,
        })
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

      onOptsChange(newOpts, invalidate)
    }

    return (
      h('div', {
        style: {
          gridRow,
          gridColumn,
          minWidth: 0,
          minHeight: 0,
        },
      }, [
        h(Component, {
          opts,
          updateOpts,
          data,
          setBlockState,
          invalidate,
          ...processedOpts,
          ...extraProps,
        }),
      ])
    )
  }
}

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
  }

  componentDidMount() {
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

    // let dataForBlocks = [ ...this.state.dataForBlocks ]

    const dataForBlocks = [ this.props.data ]

    for (let i = 0; i < numBlocks; i++) {
      await new Promise(async resolve => {
        const block = processedLayout.blocks[i]
            , blockOpts = processedOpts[i]
            , lastData = dataForBlocks[i]
            , state = this.blockState[i]

        if (this.dataResets !== renderID) resolve()

        let nextData = lastData

        const { makeFilter } = block.block

        if (makeFilter) {
          const filterFn = await makeFilter(blockOpts, state, lastData)

          if (filterFn) {
            nextData = await lastData.filter(filterFn)
          }
        }

        dataForBlocks.push(nextData)

        if (this.dataResets !== renderID) resolve()

        this.setState({ dataForBlocks })
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

    const children = processedLayout.blocks.map((block, i) =>
      h(LayoutBlock, {
        key: `${i}-${block.type}`,
        data: dataForBlocks[i] || [],
        extraProps,
        processedOpts: processedOpts[i],
        passedOpts: blockOpts[block.id],
        setBlockState: (obj, cb) => {
          const nextState = typeof obj === 'function'
            ? obj(this.blockState[i])
            : obj

          this.blockState[i] = obj
        },
        invalidate: this.invalidate,
        onOptsChange: (newOpts, invalidate) => {
          onBlockOptsChange(
            R.isEmpty(newOpts)
              ? R.dissoc(block.id, currentOpts())
              : R.merge(currentOpts(), { [block.id]: newOpts }))

          if (invalidate) {
            this.invalidate(i)
          }

        },
        ...block,
      }),
    )

    return (
      h(Box, {
        css: { display: 'grid' },
        style: {
          gridTemplateColumns: processedLayout.gridTemplateColumns,
          gridTemplateRows: processedLayout.gridTemplateRows,
          gridGap: processedLayout.gridGap,
          overflow: 'hidden',
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
      makeFilter: PropTypes.func,
      processOpts: PropTypes.func,
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
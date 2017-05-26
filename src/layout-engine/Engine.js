"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , PropTypes = require('prop-types')
    , consume = require('stream-consume')
    , EngineState = require('./state')
    , { Box } = require('axs-ui')
    , Layout = require('./Layout')

class LayoutEngine extends React.Component {
  render() {
    const { spec=[] } = this.props

    const state = new EngineState(
      this.props.dataset,
      this.props.layouts,
      this.props.recordAccessors,
    )

    const { layoutProps, streams } = state.getLayoutProps(spec)

    // Slurp up the final stream
    consume(streams.slice(-1)[0])

    return (
      h(Box, spec.map((group, i) =>
        h(Box, Object.assign({}, group.props, {
          key: i
        }), group.layouts.map((layout, j) =>
          h(Layout, Object.assign({}, layoutProps[i][j], {
            name: layout.name,
          }))
        ))
      ))
    )
  }
}

function isIterable(props, propName, componentName) {
  const isObject = typeof props[propName] === 'object'

  if (!isObject || !(Symbol.iterator in props[propName])) {
    throw new Error(
      `Invalid prop '${propName}' supplied to component '${componentName}'. ` +
      'Value must be an iterable.'
    )
  }
}
LayoutEngine.propTypes = {
  dataset: isIterable,
  recordAccessors: PropTypes.object.isRequired,
  layouts: PropTypes.object.isRequired,

  spec: PropTypes.array,
  onSpecChange: PropTypes.func,
  editing: PropTypes.bool,

  onError: PropTypes.func.isRequired,
  onItemFocus: PropTypes.func,
}

module.exports = LayoutEngine;

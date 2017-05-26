"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , PropTypes = require('prop-types')
    , EngineState = require('./state')
    , { PanelContainer, GroupContainer } = require('./ui')
    , Layout = require('./Layout')

class LayoutEngine extends React.Component {
  render() {
    const { spec=[] } = this.props

    const state = new EngineState(
      this.props.dataset,
      this.props.layouts,
      this.props.attrGetters
    )

    const layoutProps = state.getLayoutProps(spec)

    return (
      h(PanelContainer, spec.map((group, i) =>
        h(GroupContainer, Object.assign({}, group.props, {
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

LayoutEngine.propTypes = {
  dataset: PropTypes.object.isRequired,
  recordsFromItem: PropTypes.func.isRequired,
  layouts: PropTypes.array.isRequired,

  spec: PropTypes.array,
  onSpecChange: PropTypes.func,
  editing: PropTypes.bool,

  onError: PropTypes.func.isRequired,
  onItemFocus: PropTypes.func,
}

"use strict";

const h = require('react-hyperscript')
    , React = require('react')

/*
 * A component with a layout that can be edited, but will not persist across
 * page loads
 */
module.exports = function makeTransientSpecEditor(initialSpec) {
  return Component => (
    class TransientSpecEditor extends React.Component {
      constructor(props) {
        super(props)
        this.state = { spec: initialSpec }
      }

      render() {
        return h(Component, Object.assign({}, this.props, this.state, {
          onSpecChange: spec => this.setState({ spec })
        }))
      }
    }
  )
}


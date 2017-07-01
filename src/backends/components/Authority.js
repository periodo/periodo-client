"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Source, Button } = require('lib/ui')

const ViewAuthority = props =>
  h(Box, [
    h(Button, {
      onClick: props.toggleForm,
    }, 'Add period'),

    h(Button, {
      onClick: props.toggleForm,
    }, 'Edit authority'),
    h(Source, { source: props.authority.source }),
  ])

const EditPeriod = props =>
  h(Box, [
    h('h1', 'Editor the preiod'),
    h(Button, {
      onClick: props.toggleForm,
    }, 'Cancel'),
  ])

module.exports = class Authority extends React.Component {
  constructor() {
    super();

    this.state = {
      addingPeriod: false,
      period: {},
    }
  }

  render() {
    const { addingPeriod } = this.state
        , { authority, id } = this.props

    const childProps = {
      authority,
      toggleForm: () => this.setState(prev => ({ addingPeriod: !prev.addingPeriod  })),
      handleSavePeriod: period => {
        period;
      }
    }

    const Component = addingPeriod ? EditPeriod : ViewAuthority;

    return h(Component, childProps)
  }
}

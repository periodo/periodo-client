"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , PeriodAuthorityForm = require('../../editors/PeriodAuthorityForm')

module.exports = class AddAuthority extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: {}
    }
  }

  render() {
    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Add authority'),
        h(PeriodAuthorityForm, {
          value: this.state.authority,
          onValueChange: authority => {
            this.setState({ authority })
          }
        }),
      ])
    )
  }
}

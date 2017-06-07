"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box, Heading } = require('axs-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalBackendDataset } = require('../actions')
    , AuthorityForm = require('../../editors/AuthorityForm')

function mapStateToProps(state) {
  return {
    backend: state.backends.current,
  }
}

module.exports = connect(mapStateToProps)(class AddAuthority extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: {}
    }
  }

  render() {
    const { dispatch, backend } = this.props

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Add authority'),
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: authority => {
            const id = generateID()

            dispatch(updateLocalBackendDataset(
              backend.type,
              R.assocPath(
                ['periodCollections', id],
                Object.assign({ id }, authority),
                backend.dataset
              ),
              `Added period collection ${id}`
            ))
          },
          onValueChange: authority => {
            this.setState({ authority })
          }
        }),
      ])
    )
  }
})

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , BackendAction = require('../actions')
    , AuthorityForm = require('../../forms/AuthorityForm')
    , { LocationStreamAware, Route } = require('org-shell')

module.exports = LocationStreamAware(class AddAuthority extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authority: props.initialValue || {}
    }
  }

  render() {
    const { dispatch, backend, dataset, locationStream } = this.props

    return (
      h(Box, [
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: async authority => {
            const id = generateID()

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              R.assocPath(
                ['authorities', id],
                Object.assign({ id }, authority),
                dataset.raw
              ),
              `Added authority ${id}`
            ))

            locationStream.write({
              route: Route('backend-home', {
                backendID: backend.asIdentifier()
              })
            })
          },
          onValueChange: authority => {
            this.setState({ authority })
          }
        }),
      ])
    )
  }
})

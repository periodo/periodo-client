"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , BackendAction = require('../actions')
    , AuthorityForm = require('../../forms/AuthorityForm')
    , { LocationStreamAware, Route } = require('org-shell')

class AuthorityAddOrEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authority: props.authority || {}
    }
  }

  render() {
    const {
      dispatch,
      backend,
      dataset,
      locationStream,
      randomID
    } = this.props

    return (
      h(Box, [
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: async authority => {

            const isEdit = !!authority.id
                , id = isEdit ? authority.id : randomID('authority')

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              R.assocPath(
                ['authorities', id],
                Object.assign({ id }, authority),
                dataset
              ),
              isEdit
                ? `Edited authority ${id}`
                : `Added authority ${id}`
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
}

module.exports = RandomID(LocationStreamAware(AuthorityAddOrEdit))

"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , BackendAction = require('../actions')
    , AuthorityForm = require('../../forms/AuthorityForm')
    , { Navigable, Route } = require('org-shell')

class AuthorityAddOrEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authority: props.authority || {},
    }
  }

  render() {
    const {
      dispatch,
      backend,
      dataset,
      navigateTo,
      randomID,
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
                [ 'authorities', id ],
                {
                  id,
                  ...authority,
                },
                dataset.raw
              ),
              isEdit
                ? `Edited authority ${id}`
                : `Added authority ${id}`
            ))

            navigateTo(Route('backend-home', {
              backendID: backend.asIdentifier(),
            }))
          },
          onValueChange: authority => {
            this.setState({ authority })
          },
        }),
      ])
    )
  }
}

module.exports = RandomID(Navigable(AuthorityAddOrEdit))

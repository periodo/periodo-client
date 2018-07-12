"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading, ResourceTitle, InfoText, Link } = require('periodo-ui')
    , { Button$Primary } = require('periodo-ui')
    , { LocationStreamAware, Route } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , PatchAction = require('../../patches/actions')
    , { PatchDirection } = require('../../patches/types')
    , SelectChanges = require('../../patches/SelectChanges')


class SubmitPatch extends React.Component {
  constructor() {
    super()

    this.state = {
      selectedPatch: null,
      reviewComponent: null,
    }
  }

  async acceptPatch() {
    const { dispatch, locationStream, backend } = this.props
        , { selectedPatch, remoteBackend } = this.state

    const action = await dispatch(PatchAction.SubmitPatch(backend.storage, selectedPatch))

    handleCompletedAction(action,
      () => {
        locationStream.write({
          route: Route('backend-home', {
            backendID: backend.asIdentifier()
          })
        })
      },
      err => {
        throw err;
      }
    )
  }

  render() {
    const { settings } = this.props

    let child

    console.log(this.props.settings)

    if (this.state.selectedPatch) {
      child = h(Box, [
        this.state.compareComponent,

        h(Button$Primary, {
          onClick: () => {
            this.acceptPatch()
          }
        }, 'Submit patch'),
      ])
    } else {
      child = h(Box, [
        h(Box, { mb: 3 }, [
          h(InfoText, { mb: 3 },
            settings.oauthName
              ? `Submitting patches as ${settings.oauthName}`
              : [
                  'You are not currently logged in, so you are unable to submit a patch. ',
                  h(Link, { route: Route('settings') }, 'Log in'),
                ]
          )
        ]),
        h(SelectChanges, {
          direction: PatchDirection.Push,
          dispatch: this.props.dispatch,
          localBackend: this.props.backend,
          handleSelectPatch: (selectedPatch, compareComponent) => {
            this.setState({
              selectedPatch,
              compareComponent,
            })
          }
        })
      ])
    }

    return (
      h(Box, [
        h(ResourceTitle, 'Submit patch'),
        child,
      ])
    )
  }
}

module.exports = LocationStreamAware(SubmitPatch);

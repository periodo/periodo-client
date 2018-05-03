"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , { Button$Primary } = require('periodo-ui')
    , { LocationStreamAware, Route } = require('org-shell')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { submitPatch } = require('../actions')
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

    const action = await dispatch(submitPatch(remoteBackend, selectedPatch))

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
    let child

    if (this.state.selectedPatch) {
      child = h(Box, [
        this.state.compareComponent,

        h(Button$Primary, {
          onClick: () => {
            this.submitPatch()
          }
        }, 'Submit patch'),
      ])
    } else {
      child = h(SelectChanges, {
        direction: PatchDirection.Push,
        dispatch: this.props.dispatch,
        localDataset: this.props.dataset,
        handleSelectPatch: (selectedPatch, compareComponent) => {
          this.setState({
            selectedPatch,
            compareComponent,
          })
        }
      })
    }

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Submit patch'),
        child,
      ])
    )
  }
}

module.exports = LocationStreamAware(SubmitPatch);

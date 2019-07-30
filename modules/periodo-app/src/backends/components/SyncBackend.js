"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , jsonpatch = require('fast-json-patch')
    , { Box, Heading } = require('periodo-ui')
    , { Button$Primary } = require('periodo-ui')
    , { LocationStreamAware, Route } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , BackendAction = require('../actions')
    , { PatchDirection } = require('../../patches/types')
    , SelectChanges = require('../../patches/SelectChanges')


class SyncBackend extends React.Component {
  constructor() {
    super()

    this.state = {
      selectedPatch: null,
      reviewComponent: null,
    }
  }

  async acceptPatch() {
    const { dispatch, backend, dataset, locationStream } = this.props
        , { selectedPatch } = this.state

    // FIXME? this could throw if patch is invalid... But how could the patch
    // be invalid?
    const newRawDataset = jsonpatch.applyPatch(
      JSON.parse(JSON.stringify(dataset.raw)),
      JSON.parse(JSON.stringify(selectedPatch)),
    ).newDocument

    const action = await dispatch(BackendAction.UpdateLocalDataset(
      backend.storage,
      newRawDataset,
      'Sync' // FIXME: better message
    ))

    handleCompletedAction(action,
      () => {
        locationStream.write({
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
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
            this.acceptPatch()
          },
        }, 'Accept changes'),
      ])
    } else {
      child = h(SelectChanges, {
        direction: PatchDirection.Pull,
        dispatch: this.props.dispatch,
        localBackend: this.props.backend,
        handleSelectPatch: (selectedPatch, compareComponent) => {
          this.setState({ selectedPatch, compareComponent })
        },
      })
    }

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Sync backend'),
        child,
      ])
    )
  }
}

module.exports = LocationStreamAware(SyncBackend);

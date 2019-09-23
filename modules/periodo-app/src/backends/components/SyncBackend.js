"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , jsonpatch = require('fast-json-patch')
    , { Box, Heading, Text } = require('periodo-ui')
    , { Button$Primary } = require('periodo-ui')
    , { Navigable, Route } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , BackendAction = require('../actions')
    , BackendSelector = require('./BackendSelector')
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
    const { dispatch, backend, dataset, navigateTo } = this.props
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
        navigateTo(Route('backend-home', {
          backendID: backend.asIdentifier(),
        }))
      },
      err => {
        throw err;
      }
    )
  }

  render() {
    const { selectedPatch, selectedBackend } = this.state
        , { backends } = this.props

    let child

    if (selectedPatch) {
      child = (
        h(Box, [
          this.state.compareComponent,

          h(Button$Primary, {
            mt: 2,
            onClick: () => {
              this.acceptPatch()
            },
          }, 'Accept changes'),
        ])
      )
    } else if (selectedBackend) {
      child = (
        h(SelectChanges, {
          direction: PatchDirection.Pull,
          localBackend: this.props.backend,
          remoteBackend: selectedBackend,
          handleSelectPatch: (selectedPatch, compareComponent) => {
            this.setState({
              selectedPatch,
              compareComponent,
            })
          },
        })
      )
    } else {
      child = (
        h(Box, [
          h(Text, { mb: 3 }, 'Select a data source to sync changes from it'),

          h(BackendSelector, {
            value: selectedBackend,
            label: 'Available data sources',
            backends: Object.values(backends).filter(b => b !== this.props.backend),
            onChange: val => {
              this.setState({
                selectedBackend: val,
              })
            },
          }),
        ])
      )
    }

    return (
      h(Box, [
        h(Heading, {
          level: 2,
          mb: 3,
        }, 'Sync data source'),
        child,
      ])
    )
  }
}

module.exports = Navigable(SyncBackend);

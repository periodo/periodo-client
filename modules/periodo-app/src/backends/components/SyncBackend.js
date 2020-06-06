"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , jsonpatch = require('fast-json-patch')
    , { Box, HelpText, Section } = require('periodo-ui')
    , { Button, Breadcrumb, Link } = require('periodo-ui')
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
      JSON.parse(JSON.stringify(selectedPatch))
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
        h(Section, [
          h(HelpText, { mb: 3 },
            'The following changes have been selected to be imported'),

          this.state.compareComponent,

          h(Button, {
            variant: 'primary',
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
        h(Section, [
          h(HelpText, { mb: 3 },
            'Select a data source to import changes from'),

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
        h(Breadcrumb, [
          h(Link, {
            route: Route('backend-home', {
              backendID: this.props.backend.asIdentifier(),
            }),
          }, this.props.backend.metadata.label),
          'Import changes',
        ]),
        child,
      ])
    )
  }
}

module.exports = Navigable(SyncBackend);

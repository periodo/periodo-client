"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Button$Primary } = require('periodo-ui')
    , BackendSelector = require('./BackendSelector')
    , { Navigable } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , PatchAction = require('../../patches/actions')
    , { PatchDirection } = require('../../patches/types')
    , SelectChanges = require('../../patches/SelectChanges')
    , ORCIDSettings = require('../../auth/components/ORCID')


const {
  Box,
  ResourceTitle,
  Text,
  InfoText,
  Alert$Error,
  Alert$Success,
} = require('periodo-ui')


class SubmitPatch extends React.Component {
  constructor() {
    super()

    this.state = {
      showCompare: false,
      selectedWebBackendID: null,
      selectedPatch: null,
      reviewComponent: null,
    }
  }

  async submitPatch() {
    const { dispatch, backend, backends } = this.props
        , { selectedPatch, selectedWebBackendID } = this.state
        , remoteBackend = backends[selectedWebBackendID]

    const action = await dispatch(PatchAction.SubmitPatch(
      backend,
      remoteBackend,
      selectedPatch
    ))

    handleCompletedAction(action,
      () => {
        this.setState({
          showCompare: false,
          selectedWebBackendID: null,
          selectedPatch: null,
          reviewComponent: null,
          message: (
            h(Alert$Success, {
            }, 'Submitted patch')
          ),
        })
      },
      err => {
        this.setState({
          message: (
            h(Alert$Error, {
            }, err.message)
          ),
        })
        throw err;
      }
    )
  }

  render() {
    const { backends } = this.props

    const webBackends = Object.values(backends)
      .filter(b => b.storage._name === 'Web')

    let child

    if (this.state.selectedPatch) {
      child = h(Box, [
        this.state.compareComponent,

        h(Button$Primary, {
          onClick: () => {
            this.submitPatch()
          },
        }, 'Submit patch'),
      ])
    } else if (this.state.showCompare) {
      child = h(Box, [
        h(SelectChanges, {
          direction: PatchDirection.Push,
          localBackend: this.props.backend,
          remoteBackend: backends[this.state.selectedWebBackendID],
          handleSelectPatch: (selectedPatch, compareComponent) => {
            this.setState({
              message: null,
              selectedPatch,
              compareComponent,
            })
          },
        }),
      ])
    } else if (webBackends.length === 0) {
      child = h(InfoText, [
        'In order to submit a patch to a Web server, you must create a Web data source',
      ])
    } else {
      const { selectedWebBackendID } = this.state
          , selectedWebBackend = backends[selectedWebBackendID]

      // I'm incredibly sorry
      let childChildren = null

      if (selectedWebBackend) {
        childChildren = h(Box, { mt: 3 }, [
          h(ORCIDSettings, {
            backend: selectedWebBackend,
            showAlerts: false,
          }),

          !selectedWebBackend.metadata.orcidCredential ? null : (
            h(Box, { mt: 3 }, [
              h(Button$Primary, {
                onClick: () => {
                  this.setState({
                    message: null,
                    showCompare: true,
                  })
                },
              }, 'Continue'),
            ])
          ),
        ])
      }

      child = h(Box, [
        h(Text, { mb: 3 }, 'Select a remote server to submit a patch to it.'),

        h(BackendSelector, {
          value: selectedWebBackend,
          label: 'Available Web data sources',
          backends: webBackends,
          onChange: val => {
            this.setState({
              message: null,
              selectedWebBackendID: val.asIdentifier(),
            })
          },
        }),

        childChildren,
      ])
    }

    return (
      h(Box, [
        h(ResourceTitle, 'Submit patch'),
        this.state.message,
        child,
      ])
    )
  }
}

module.exports = Navigable(SubmitPatch)

"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , BackendSelector = require('./BackendSelector')
    , { Navigable, Route } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , PatchAction = require('../../patches/actions')
    , { PatchDirection } = require('../../patches/types')
    , SelectChanges = require('../../patches/SelectChanges')
    , ORCIDSettings = require('../../auth/components/ORCID')


const {
  Box,
  Flex,
  Breadcrumb,
  Section,
  Text,
  Link,
  HelpText,
  Button$Primary,
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
            h(Flex, [
              h(Alert$Success, { mb: 2 }, 'Submitted changes'),
              h(Link, {
                p: 2,
                route: Route('backend-patches', {
                  backendID: remoteBackend.asIdentifier(),
                }),
              }, 'Review submitted changes'),
            ])
          ),
        })
      },
      err => {
        this.setState({
          message: (
            h(Alert$Error, {
              mb: 2,
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
      const backend = backends[this.state.selectedWebBackendID]
      child = h(Section, [
        this.state.message,
        h(Box, [
          this.state.compareComponent,

          h(Box, { my: 3 }, [
            h(ORCIDSettings, {
              backend,
              showAlerts: false,
            }),
          ]),

          h(Button$Primary, {
            mt: 2,
            disabled: !backend.metadata.orcidCredential,
            onClick: () => {
              this.submitPatch()
            },
          }, 'Submit changes'),
        ]),
      ])
    } else if (this.state.showCompare) {
      child = h(SelectChanges, {
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
      })
    } else if (webBackends.length === 0) {
      child = h(HelpText, [
        'In order to submit changes, you must first create a web data source.',
      ])
    } else {
      child = h(Section, [
        h(Text, { mb: 3 }, 'Select a web data source to submit changes to'),

        h(BackendSelector, {
          label: 'Available web data sources',
          backends: webBackends,
          onChange: val => {
            this.setState({
              message: null,
              showCompare: true,
              selectedWebBackendID: val.asIdentifier(),
            })
          },
        }),
      ])
    }

    return (
      h(Box, [
        h(Breadcrumb, [
          h(Link, {
            route: Route('backend-home', {
              backendID: this.props.backend.asIdentifier(),
            }),
          }, this.props.backend.metadata.label),
          'Submit changes',
        ]),
        child,
      ])
    )
  }
}

module.exports = Navigable(SubmitPatch)

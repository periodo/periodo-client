"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , nanostate = require('nanostate')
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
  TextareaBlock,
  Button$Primary,
  Alert$Error,
  Alert$Success,
  LoadingIcon,
} = require('periodo-ui')


const defaultState = {
  pending: false,
  selectedWebBackendID: null,
  selectedPatch: null,
  compareComponent: null,
  patchURL: null,
  comment: '',
}

class SubmitPatch extends React.Component {
  constructor() {
    super()

    this.state = defaultState

    this.machine = nanostate(
      'chooseRemote', {
        chooseRemote: { next: 'selectChanges' },
        selectChanges: { next: 'confirmChanges' },
        confirmChanges: { next: 'submitChanges' },
        submitChanges: {
          success: 'writeComment',
          failure: 'confirmChanges',
        },
        writeComment: { next: 'postComment' },
        postComment: {
          success: 'done',
          failure: 'writeComment',
        },
        done: {},
      }
    )

    this.machine.on('submitChanges', () => this.submitPatch())
    this.machine.on('postComment', () => this.postComment())
  }

  async submitPatch() {
    const { dispatch, backend, backends } = this.props
        , { selectedPatch, selectedWebBackendID } = this.state
        , remoteBackend = backends[selectedWebBackendID]

    this.setState({ pending: true })

    const submitted = await dispatch(PatchAction.SubmitPatch(
      backend,
      remoteBackend,
      selectedPatch
    ))

    handleCompletedAction(submitted,
      ({ patchURL }) => {
        this.machine.emit('success')
        this.setState({
          pending: false,
          patchURL,
          message: h(
            Alert$Success,
            { mb: 2 },
            'Successfully submitted changes'
          ),
        })
      },
      () => {
        this.machine.emit('failure')
        this.setState({
          pending: false,
          message: (
            h(Alert$Error, {
              mb: 2,
            }, 'Submission failed')
          ),
        })
      }
    )
  }

  async postComment() {
    const { dispatch, backends } = this.props
        , { selectedWebBackendID } = this.state
        , remoteBackend = backends[selectedWebBackendID]

    this.setState({ pending: true })

    const commented = await dispatch(PatchAction.AddPatchComment(
      remoteBackend,
      this.state.patchURL,
      this.state.comment
    ))

    handleCompletedAction(commented,
      () => {
        this.machine.emit('success')
        this.setState({
          pending: false,
          comment: '',
          message: (
            h(Flex, [
              h(Alert$Success, 'Successfully submitted comment.'),
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
      () => {
        this.machine.emit('failure')
        this.setState({
          pending: false,
          message: h(Alert$Error, {
            mb: 2,
          }, 'Comment submission failed'),
        })
      }
    )
  }

  render() {
    const { backends } = this.props

    const webBackends = Object.values(backends)
      .filter(b => b.storage._name === 'Web')

    let child

    switch (this.machine.state) {

    case 'chooseRemote': {
      if (webBackends.length === 0) {
        child = h(HelpText, [
          `In order to submit changes,
 you must first create a web data source.`,
        ])
      } else {
        child = h(Section, [
          h(Text, { mb: 3 }, 'Select a web data source to submit changes to'),
          h(BackendSelector, {
            label: 'Available web data sources',
            backends: webBackends,
            onChange: val => {
              this.machine.emit('next')
              this.setState({
                selectedWebBackendID: val.asIdentifier(),
              })
            },
          }),
        ])
      }
      break
    }

    case 'selectChanges': {
      child = h(SelectChanges, {
        direction: PatchDirection.Push,
        localBackend: this.props.backend,
        remoteBackend: backends[this.state.selectedWebBackendID],
        handleSelectPatch: (selectedPatch, compareComponent) => {
          this.machine.emit('next')
          this.setState({
            selectedPatch,
            compareComponent,
          })
        },
      })
      break
    }

    case 'confirmChanges': {
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
            onClick: () => this.machine.emit('next'),
            disabled: (!backend.metadata.orcidCredential) || this.state.pending,
          }, 'Submit changes'),
        ]),
      ])
      break
    }

    case 'writeComment': {
      child = h(Section, [
        this.state.message,
        h(TextareaBlock, {
          helpText: 'Describe the changes submitted in a brief comment',
          value: this.state.comment,
          onChange: e => {
            this.setState({ comment: e.target.value })
          },
        }),

        h(Button$Primary, {
          disabled: (!this.state.comment) || this.state.pending,
          onClick: () => this.machine.emit('next'),
        }, 'Add comment'),

      ])
      break
    }

    case 'done': {
      child = h(Section, [
        this.state.message,
      ])
      break
    }

    default: {
      child = this.state.pending
        ? h(Section, [
          h('span', { style: { marginRight: '8px' }}, [
            h(LoadingIcon),
          ]),
          'Submitting…',
        ])
        : null
      break
    }
    } // end switch

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

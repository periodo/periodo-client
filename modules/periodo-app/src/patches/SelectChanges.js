"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Section, Box, LoadingIcon, HelpText } = require('periodo-ui')
    , { Heading, Button, Alert } = require('periodo-ui')
    , { handleCompletedAction } = require('org-async-actions')
    , { connect } = require('react-redux')
    , { validatePatch } = require('./patch')
    , PatchAction = require('./actions')
    , Compare = require('./Compare')

class SelectChanges extends React.Component {
  constructor() {
    super()

    this.state = {
      fetchErr: null,

      patch: null,
      localDataset: null,
      remoteDataset: null,

      currentPatch: [],
    }

    this.regeneratePatch = this.regeneratePatch.bind(this)
    this.generatePatch = this.generatePatch.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.regeneratePatch()
  }

  // Sorry for redundant name...
  regeneratePatch() {
    if (this.props.remoteBackend) {
      this.setState({
        patch: null,
        localDataset: null,
        remoteDataset: null,
        currentPatch: [],
        updatedIdentifiers: null,
      }, () => {
        this.generatePatch(this.props.remoteBackend.storage)
          .catch(error => {
            this.setState({ error })
          })
      })
    }
  }

  async replaceIdentifiers() {
    const { dispatch, localBackend, remoteBackend } = this.props
        , { updatedIdentifiers } = this.state

    await dispatch(PatchAction.ReplaceIdentifiers(
      localBackend.storage,
      remoteBackend.storage,
      updatedIdentifiers
    ))

    this.regeneratePatch()
  }

  async generatePatch(remoteBackend) {
    const { dispatch, localBackend, direction } = this.props

    this.setState({ generatingPatch: true })

    const [ patchReq, mapReq ] = await Promise.allSettled([
      dispatch(PatchAction.GeneratePatch(
        localBackend.storage,
        remoteBackend,
        direction
      )),

      dispatch(PatchAction.GetReplaceableIdentifiers(
        localBackend.storage,
        remoteBackend,
      )),
    ])


    const nextState = {}

    handleCompletedAction(patchReq.value,
      ({ patch, localDataset, remoteDataset }) => {
        nextState.patch = patch
        nextState.localDataset = localDataset
        nextState.remoteDataset = remoteDataset
      },
      error => {
        throw error
      }
    )

    handleCompletedAction(mapReq.value,
      ({ identifiers }) => {
        nextState.updatedIdentifiers = identifiers
      },
      error => {
        throw error
      }
    )

    this.setState(nextState)
  }

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  getValidatedPatch() {
    const { direction } = this.props
        , { currentPatch, localDataset, remoteDataset } = this.state

    const dataset = direction.case({
      Push: () => remoteDataset,
      Pull: () => localDataset,
    })

    return validatePatch(dataset.raw, currentPatch)
  }

  render() {
    const { direction, handleSelectPatch } = this.props
        , { patch, error, localDataset, remoteDataset, updatedIdentifiers } = this.state

    if (error) {
      return (
        h(Alert, {
          variant: 'error',
          p: 3,
        }, [
          h(Heading, { level: 3 }, 'Error generating patch'),
          h(Box, error.message || error.toString()),
        ])
      )
    }

    const action = direction.case({
      Push: () => 'submitted',
      Pull: () => 'imported',
    })

    if (patch && patch.length === 0) {
      return (
        h(Section, [
          `There are no changes to be ${ action }.`,
        ])
      )
    }

    if (patch) {
      const numUpdatedIdentifiers = Object.keys(updatedIdentifiers).length
          , plural = numUpdatedIdentifiers > 1

      return (
        h(Section, [
          numUpdatedIdentifiers === 0 ? null : (
            h(Alert, {
              mb: 3,
            }, [
              numUpdatedIdentifiers +
              ` item${plural ? 's' : ''} ha${plural ? 've' : 's'} been accepted into
              this Web data source and assigned a persistent identifier. Merge the
              new identifier${plural ? 's' : ''} into your local data source?`,
              h(Box, {
                mt: 2,
              }, [
                h(Button, {
                  variant: 'primary',
                  onClick: () => {
                    this.replaceIdentifiers()
                  },
                }, 'Accept new identifiers'),
              ]),
            ])
          ),
          h(HelpText, { mb: 3 },
            `Select the changes to be ${ action }`),

          h(Compare, {
            onChange: this.handleChange,
            localDataset,
            remoteDataset,
            direction,
            patch,
          }),

          h(Button, {
            variant: 'primary',
            mt: 2,
            disabled: !this.state.currentPatch.length,
            onClick: () => {
              const validatedPatch = this.getValidatedPatch()

              handleSelectPatch(
                validatedPatch,
                h(Compare, {
                  localDataset,
                  remoteDataset,
                  direction,
                  patch: validatedPatch,
                })
              )
            },
          }, 'Continue'),
        ])
      )
    }

    return h(Box, [
      h('span', { style: { marginRight: '8px' }}, [
        h(LoadingIcon),
      ]),
      'Getting changes',
    ])
  }
}

module.exports = connect()(SelectChanges)

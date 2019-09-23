"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { Heading, Button$Primary, Alert$Error } = require('periodo-ui')
    , { handleCompletedAction } = require('org-async-actions')
    , { connect } = require('react-redux')
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

    this.generatePatch = this.generatePatch.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    if (this.props.remoteBackend) {
      this.generatePatch(this.props.remoteBackend.storage)
        .catch(error => {
          this.setState({ error })
        })
    }
  }

  async generatePatch(remoteBackend) {
    const { dispatch, localBackend, direction } = this.props

    this.setState({ generatingPatch: true })

    const patchReq = await dispatch(PatchAction.GeneratePatch(
      localBackend.storage,
      remoteBackend,
      direction
    ))

    handleCompletedAction(patchReq,
      ({ patch, localDataset, remoteDataset }) => this.setState({
        patch,
        localDataset,
        remoteDataset,
      }),
      error => {
        throw error
      }
    )
  }

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  render() {
    const { direction, handleSelectPatch } = this.props
        , { patch, error, localDataset, remoteDataset } = this.state

    if (error) {
      return (
        h(Alert$Error, {
          p: 3,
        }, [
          h(Heading, { level: 3 }, 'Error generating patch'),
          h(Box, error.message || error.toString()),
        ])
      )
    }

    if (patch) {
      return (
        h(Box, [
          h(Compare, {
            onChange: this.handleChange,
            localDataset,
            remoteDataset,
            direction,
            patch,
          }),

          h(Button$Primary, {
            mt: 2,
            disabled: !this.state.currentPatch.length,
            onClick: () => handleSelectPatch(
              this.state.currentPatch,
              h(Compare, {
                localDataset,
                remoteDataset,
                direction,
                patch: this.state.currentPatch,
              }),
            ),
          }, 'Continue'),
        ])
      )
    }

    return h(Box, [
      'Generating patch...',
    ])
  }
}

module.exports = connect()(SelectChanges)

"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { Button$Primary, InputBlock } = require('periodo-ui')
    , { BackendStorage } = require('../backends/types')
    , { handleCompletedAction } = require('org-async-actions')
    , PatchAction = require('./actions')
    , Compare = require('./Compare')

class SelectChanges extends React.Component {
  constructor() {
    super()

    this.state = {
      fetchErr: null,
      remoteBackend: null,
      remoteDataset: null,
      url: window.location.origin,
      currentPatch: [],
    }

    this.generatePatch = this.generatePatch.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async generatePatch(remoteBackend) {
    const { dispatch, localBackend, direction } = this.props

    const patchReq = await dispatch(PatchAction.GenerateDatasetPatch(
      localBackend.storage,
      remoteBackend,
      direction
    ))

    handleCompletedAction(patchReq,
      ({ patch, localDataset, remoteDataset }) => this.setState({ patch, localDataset, remoteDataset }),
      err => {
        throw err;
      }
    )
  }

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  render() {
    const { direction, handleSelectPatch } = this.props
        , { patch, localDataset, remoteDataset } = this.state

    if (patch) {
      return h(Box, [
        h(Compare, {
          onChange: this.handleChange,
          localDataset,
          remoteDataset,
          direction,
          patch
        }),

        h(Button$Primary, {
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
    }

    return (
      h(Box, [

        h(InputBlock, {
          label: 'PeriodO server URL',
          value: this.state.url,
          onChange: e => this.setState({ url: e.target.value }),
        }),

        h(Button$Primary, {
          onClick: () => this.generatePatch(BackendStorage.Web(this.state.url)),
        }, 'Compare')
      ])
    )
  }
}

module.exports = SelectChanges

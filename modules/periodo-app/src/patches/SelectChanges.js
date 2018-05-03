"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Button$Primary, InputBlock } = require('periodo-ui')
    , { BackendStorage } = require('../backends/types')
    , { handleCompletedAction } = require('../typed-actions/utils')
    , { fetchBackend } = require('../backends/actions')
    , Compare = require('./Compare')
    , { PatchDirection } = require('./types')

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

    this.fetchBackend = this.fetchBackend.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async fetchBackend(storage) {
    const { dispatch } = this.props

    const action = await dispatch(fetchBackend(storage, true))

    handleCompletedAction(action,
      ({ backend, dataset }) => {
        this.setState({
          remoteBackend: backend,
          remoteDataset: dataset,
        })
      },
      err => {
        this.setState({ fetchErr: err })
      }
    )
  }

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  render() {
    const {
      localDataset,
      handleSelectPatch,
      direction=PatchDirection.Pull
    } = this.props

    const {
      remoteDataset,
    } = this.state

    const compareOpts = direction.case({
      Push: () => ({
        remoteDataset: localDataset,
        localDataset: remoteDataset,
      }),
      Pull: () => ({
        localDataset,
        remoteDataset,
      })
    })

    if (remoteDataset) {
      return h(Box, [
        h(Compare, Object.assign({ onChange: this.handleChange }, compareOpts)),

        h(Button$Primary, {
          disabled: !this.state.currentPatch.length,
          onClick: () => handleSelectPatch(
            this.state.currentPatch,
            h(Compare, Object.assign({ patch: this.state.currentPatch }, compareOpts))
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
          onClick: () => this.fetchBackend(BackendStorage.Web(this.state.url)),
        }, 'Compare')
      ])
    )
  }
}

module.exports = SelectChanges

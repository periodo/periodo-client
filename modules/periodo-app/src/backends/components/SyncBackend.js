"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , jsonpatch = require('fast-json-patch')
    , { Box, Heading } = require('axs-ui')
    , { Button$Primary, InputBlock } = require('periodo-ui')
    , { LocationStreamAware, Route } = require('org-shell')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { fetchBackend, updateLocalDataset } = require('../actions')
    , Compare = require('../../patches/Compare')

class SyncBackend extends React.Component {
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

  async acceptPatch() {
    const { dispatch, backend, dataset, locationStream } = this.props
        , { currentPatch } = this.state

    // FIXME? this could throw if patch is invalid... But how could the patch
    // be invalid?
    const newDataset = jsonpatch.applyPatch(
      JSON.parse(JSON.stringify(dataset)),
      JSON.parse(JSON.stringify(currentPatch)),
    ).newDocument

    const action = await dispatch(updateLocalDataset(
      backend.storage,
      newDataset,
      'Sync' // FIXME: better message
    ))

    handleCompletedAction(action,
      () => {
        locationStream.write({
          route: Route('backend-home', {
            backendID: backend.asIdentifier()
          })
        })
      },
      err => {
        throw err;
      }
    )
  }

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  render() {
    if (this.state.confirm) {
      return h(Box, [
        h(Compare, {
          localDataset: this.props.dataset,
          remoteDataset: this.state.remoteDataset,
          patch: this.state.currentPatch,
        }),

        h(Button$Primary, {
          disabled: !this.state.currentPatch.length,
          onClick: () => {
            this.acceptPatch()
          }
        }, 'Accept changes'),
      ])
    }

    if (this.state.remoteBackend) {
      return h(Box, [
        h(Compare, {
          localDataset: this.props.dataset,
          remoteDataset: this.state.remoteDataset,
          onChange: this.handleChange,
        }),

        h(Button$Primary, {
          disabled: !this.state.currentPatch.length,
          onClick: () => this.setState({ confirm: true }),
        }, 'Continue'),
      ])
    }

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Sync backend'),

        h(InputBlock, {
          label: 'PeriodO server URL',
          value: this.state.url,
          onChange: e => this.setState({ url: e.target.value }),
        }),

        h(Button$Primary, {
          onClick: () => this.fetchBackend(BackendStorage.Web(this.state.url)),
        }, 'Sync')
      ])
    )
  }
}

module.exports = LocationStreamAware(SyncBackend);

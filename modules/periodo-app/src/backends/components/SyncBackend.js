"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading, Label } = require('axs-ui')
    , { Button$Primary, InputBlock } = require('periodo-ui')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { fetchBackend } = require('../actions')

class Compare extends React.Component {
  render() {
    return (
      h('div', 'Ready to compare!')
    )
  }
}

class SyncBackend extends React.Component {
  constructor() {
    super()

    this.state = {
      fetchErr: null,
      remoteBackend: null,
      remoteDataset: null,
      url: window.location.origin,
    }

    this.fetchBackend = this.fetchBackend.bind(this)
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

  render() {
    if (this.state.remoteBackend) {
      return h(Compare, {
        sourceBackend: this.props.backend,
        sourceDataset: this.props.dataset,
        remoteBackend: this.state.remoteBackend,
        remoteDataset: this.state.remoteDataset,
      })
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
        }, 'Continue')
      ])
    )
  }
}

module.exports = SyncBackend;

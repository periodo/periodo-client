"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , { Button$Primary, InputBlock } = require('periodo-ui')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { fetchBackend } = require('../actions')
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

  handleChange(patch) {
    this.setState({ currentPatch: patch })
  }

  render() {
    if (this.state.remoteBackend) {
      return h(Box, [
        h(Compare, {
          sourceDataset: this.props.dataset,
          remoteDataset: this.state.remoteDataset,
          onChange: this.handleChange,
        }),

        h('pre', {}, JSON.stringify(this.state.currentPatch, true, '  ')),
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
        }, 'Continue')
      ])
    )
  }
}

module.exports = SyncBackend;

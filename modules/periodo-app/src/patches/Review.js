"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { handleCompletedAction } = require('org-async-actions')
    , Compare = require('./Compare')
    , { PatchDirection, PatchFate } = require('./types')
    , PatchAction = require('./actions')

const {
  Box,
  Text,
  Link,
  Heading,
  TextareaBlock,
  Button$Default,
  Button$Danger,
  Alert$Success,
  Alert$Error,
} = require('periodo-ui')


class ReviewPatch extends React.Component {
  constructor() {
    super()

    this.state = {
      message: null,
      comment: '',
      submitting: false,
    }

    this.addComment = this.addComment.bind(this)
    this.decideFate = this.decideFate.bind(this)
  }

  async addComment() {
    const { dispatch, backend, patch } = this.props

    this.setState({
      message: null,
      submitting: true,
    })

    const resp = await dispatch(PatchAction.AddPatchComment(
      backend,
      patch.url,
      this.state.comment,
    ))

    handleCompletedAction(resp,
      () => {
        this.setState({ comment: '' })
      },
      err => {
        this.setState({
          message: h(Alert$Error, {
            mb: 2,
          }, err.message),
        })
      }
    )

    this.setState({ submitting: false })
  }

  async decideFate(fate) {
    const { dispatch, backend, mergeURL } = this.props

    this.setState({ message: null })

    this.setState({ deciding: true })

    const resp = await dispatch(PatchAction.DecidePatchFate(
      backend,
      mergeURL,
      fate
    ))

    this.setState({ deciding: false })

    handleCompletedAction(resp,
      () => {
        this.setState({
          message: h(Alert$Success, {
            mb: 2,
          }, `Successfully ${fate._name.toLowerCase()}ed patch`),
        })
      },
      err => {
        this.setState({
          message: h(Alert$Error, {
            mb: 2,
          }, err.message),
        })
      },
    )
  }

  render() {
    const { fromDataset, toDataset, patchText, patch } = this.props
        , { comment, submitting, deciding } = this.state

    return (
      h(Box, [
        this.state.message,

        h(Heading, {
          level: 2,
        }, 'Submitted changes'),

        h(Compare, {
          localDataset: fromDataset,
          remoteDataset: toDataset,
          patch: patchText,
          direction: PatchDirection.Pull,
        }),

        h(Heading, {
          level: 2,
          mt: 2,
          mb: 1,
        }, 'Comments'),

        patch.comments.map((comment, i) =>
          h(Box, {
            key: i,
            mb: 3,
          }, [
            h(Link, { href: comment.author.url }, comment.author.label),
            h(Text, { color: 'gray.6' }, [
              new Date(comment.posted_at).toLocaleString(),
            ]),
            h(Text, comment.message),
          ])
        ),

        h(TextareaBlock, {
          value: comment,
          onChange: e => {
            this.setState({ comment: e.target.value })
          },
        }),

        h(Button$Default, {
          disabled: !comment || submitting,
          onClick: this.addComment,
        }, 'Add comment'),

        !patch.open ? null : h(Box, [
          h(Heading, {
            level: 2,
            mt: 2,
            mb: 1,
          }, 'Accept changes?'),

          h(Button$Default, {
            mr: 1,
            disabled: deciding,
            onClick: () => this.decideFate(PatchFate.Accept),
          }, 'Accept'),

          h(Button$Danger, {
            disabled: deciding,
            onClick: () => this.decideFate(PatchFate.Reject),
          }, 'Reject'),

        ]),

        !deciding ? null : (
          h('p', 'Loading...')
        ),
      ])
    )
  }
}

module.exports = ReviewPatch;

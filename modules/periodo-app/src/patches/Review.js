"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { handleCompletedAction } = require('org-async-actions')
    , { Box, Text, Link, Heading, TextareaBlock, Button$Default, Button$Danger } = require('periodo-ui')
    , { Route } = require('org-shell')
    , Compare = require('./Compare')
    , { PatchDirection, PatchFate } = require('./types')
    , PatchAction = require('./actions')

class ReviewPatch extends React.Component {
  constructor() {
    super()

    this.state = {
      comment: '',
      submitting: false,
    }

    this.addComment = this.addComment.bind(this)
    this.decideFate = this.decideFate.bind(this)
  }

  async addComment() {
    const { dispatch, patch } = this.props

    this.setState({ submitting: true })

    const resp = await dispatch(PatchAction.AddPatchComment(
      patch.url,
      this.state.comment,
    ))

    handleCompletedAction(resp,
      () => {
        this.setState({ comment: '' })
      },
      () => {
      }
    )

    this.setState({ submitting: false })
  }

  async decideFate(fate) {
    const { dispatch, mergeURL } = this.props

    const resp = await dispatch(PatchAction.DecidePatchFate(
      mergeURL,
      fate
    ))
  }

  render() {
    const { fromDatasetProxy, toDatasetProxy, patchText, patch, mergeURL } = this.props
        , { comment, submitting } = this.state

    return (
      h(Box, [
        h(Heading, {
          level: 2,
        }, 'Patch'),

        h(Compare, {
          localDatasetProxy: fromDatasetProxy,
          remoteDatasetProxy: toDatasetProxy,
          patch: patchText,
          direction: PatchDirection.Pull,
        }),

        h(Heading, {
          level: 2,
          mt: 2,
          mb: 1,
        }, 'Comments'),

        patch.comments.map((comment, i) =>
          h(Box, { key: i, mb: 3 }, [
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

        h(Heading, {
          level: 2,
          mt: 2,
          mb: 1,
        }, 'Accept patch?'),

        h(Button$Default, {
          mr: 1,
          onClick: () => this.decideFate(PatchFate.Accept),
        }, 'Accept'),

        h(Button$Danger, {
          onClick: () => this.decideFate(PatchFate.Reject),
        }, 'Reject'),


      ])
    )
  }
}

module.exports = ReviewPatch;

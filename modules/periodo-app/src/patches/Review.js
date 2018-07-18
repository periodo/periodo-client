"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { handleCompletedAction } = require('org-async-actions')
    , { Box, Text, Link, Heading, TextareaBlock, Button$Default } = require('periodo-ui')
    , { Route } = require('org-shell')
    , Compare = require('./Compare')
    , { PatchDirection } = require('./types')
    , PatchAction = require('./actions')

class ReviewPatch extends React.Component {
  constructor() {
    super()

    this.state = {
      comment: '',
      submitting: false,
    }

    this.addComment = this.addComment.bind(this)
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

  render() {
    const { fromDataset, toDataset, patchText, patch } = this.props
        , { comment, submitting } = this.state

    return (
      h(Box, [
        h(Heading, {
          level: 2,
        }, 'Patch'),

        h(Compare, {
          localDataset: fromDataset,
          remoteDataset: toDataset,
          patch: patchText,
          direction: PatchDirection.Pull,
        }),

        h(Heading, {
          level: 2,
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
        }, 'Add comment')

      ])
    )
  }
}

module.exports = ReviewPatch;

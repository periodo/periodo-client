"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { handleCompletedAction } = require('org-async-actions')
    , Compare = require('./Compare')
    , { PatchDirection, PatchFate } = require('./types')
    , PatchAction = require('./actions')
    , ORCIDSettings = require('../auth/components/ORCID')


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
  ResourceTitle,
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
    const {
      fromDataset,
      toDataset,
      patchText,
      patch,
      backend,
      mergeURL,
    } = this.props

    const { comment, submitting, deciding } = this.state

    let children = [
      this.state.message,

      h(ResourceTitle, 'Submitted change'),

      h(Compare, {
        localDataset: fromDataset,
        remoteDataset: toDataset,
        patch: patchText,
        direction: PatchDirection.Pull,
      }),
    ]

    if (backend.metadata.orcidCredential) {
      children = children.concat([
        h(Heading, {
          level: 3,
          mt: 4,
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
      ])
    } else {
      children = children.concat([
        h(Text, {
          my: 3,
        }, 'To comment on these changes, please log in.'),

        h(ORCIDSettings, {
          backend,
          showAlerts: false,
        }),
      ])
    }

    if (patch.open && mergeURL) {
      children = children.concat([
        h(Box, [
          h(Heading, {
            level: 3,
            mt: 4,
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
      ])
    }

    if (deciding) {
      children.push(h('p', 'Loading...'))
    }

    return h(Box, children)
  }
}

module.exports = ReviewPatch;

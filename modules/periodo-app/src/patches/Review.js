"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { handleCompletedAction } = require('org-async-actions')
    , { formatDate, patchNumber } = require('periodo-utils')
    , { linkify } = require('periodo-ui')
    , Compare = require('./Compare')
    , { PatchDirection, PatchFate } = require('./types')
    , PatchAction = require('./actions')
    , ORCIDSettings = require('../auth/components/ORCID')


const {
  Box,
  Flex,
  Text,
  Link,
  Section,
  SectionHeading,
  TextareaBlock,
  Button,
  Alert,
  Status,
  LoadingIcon,
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
      this.state.comment
    ))

    handleCompletedAction(resp,
      () => {
        this.setState({ comment: '' })
      },
      err => {
        this.setState({
          message: h(Alert, {
            variant: 'error',
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
          message: h(Alert, {
            variant: 'success',
            mb: 2,
          }, `Successfully ${fate._name.toLowerCase()}ed patch`),
        })
      },
      err => {
        this.setState({
          message: h(Alert, {
            variant: 'error',
            mb: 2,
          }, err.message),
        })
      }
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
      reloadData,
    } = this.props

    const { comment, submitting, deciding } = this.state

    const number = patchNumber(patch.url)

    let children = [
      this.state.message,

      number ? h(SectionHeading, `Change #${ number }`) : null,
      h(Section, [
        h(Status, patch),
        h(Compare, {
          localDataset: fromDataset,
          remoteDataset: toDataset,
          patch: patchText,
          direction: PatchDirection.Pull,
        }),
      ]),

      h(SectionHeading, 'Comments'),
      h(Section, [
        ...(
          patch.comments.map((comment, i) =>
            h(Box, {
              key: i,
              mb: i < patch.comments.length - 1 ? 3 : 0,
            }, [
              h(Flex, { mb: 1 }, [
                h(Link, { href: comment.author.url }, comment.author.label),
                h(Text, {
                  ml: 2,
                  color: 'gray.6',
                }, formatDate(new Date(comment.posted_at))),
              ]),
              h(Text, linkify(comment.message)),
            ])
          )
        ),

        ...(backend.metadata.orcidCredential
          ? [
            h(TextareaBlock, {
              mt: patch.comments.length ? 3 : 0,
              value: comment,
              onChange: e => {
                this.setState({ comment: e.target.value })
              },
            }),

            h(Button, {
              disabled: !comment || submitting,
              onClick: this.addComment,
            }, 'Add comment'),
          ]
          : []
        ),
      ]),
    ]

    if (! backend.metadata.orcidCredential) {
      children = children.concat([
        h(Text, {
          my: 3,
        }, 'To comment on these changes, please log in.'),

        h(ORCIDSettings, {
          backend,
          showAlerts: false,
          onSuccess: () => {
            reloadData()
          },
        }),
      ])
    }

    if (patch.open && mergeURL) {
      children = children.concat([
        h(Box, [
          h(SectionHeading, 'Accept changes?'),
          h(Section, [
            deciding
              ? h(Box, { mt: 1 }, [
                h('span', { style: { marginRight: '8px' }}, [
                  h(LoadingIcon),
                ]),
                'Merging changes',
              ])
              : h(Flex, {
                justifyContent: 'space-between',
              }, [
                h(Button, {
                  variant: 'danger',
                  disabled: deciding,
                  onClick: () => this.decideFate(PatchFate.Reject),
                }, 'Reject'),

                h(Button, {
                  mr: 1,
                  disabled: deciding,
                  onClick: () => this.decideFate(PatchFate.Accept),
                }, 'Accept'),
              ]),
          ]),
        ]),
      ])
    }

    return h(Box, children)
  }
}

module.exports = ReviewPatch;

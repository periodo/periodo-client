"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , BackendAction = require('../../backends/actions')
    , { Box, Span, Alert$Success } = require('periodo-ui')
    , { Link } = require('periodo-ui')
    , { connect } = require('react-redux')

class SignIn extends React.Component {
  constructor() {
    super();

    this.state = {
      message: null,
    }

    this.handleMessage = this.handleMessage.bind(this)
  }

  async handleMessage(e) {
    const { dispatch, backend } = this.props
        , { name, token } = e.data

    if (!this.oauthWindow) return

    this.oauthWindow.close()
    this.oauthWindow = null;

    await dispatch(BackendAction.AddOrcidCredential(
      backend.storage,
      token,
      name
    ))

    this.setState({
      message: h(Alert$Success, 'Successfully authenticated'),
    })
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage)
  }

  initOrcidAuth(e) {
    const { backend } = this.props

    e.preventDefault();

    const orcidURL = new URL(
      `register?origin=${window.location.origin}`,
      backend.storage.url).href

    this.oauthWindow = window.open(
      orcidURL,
      '_blank',
      'toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500');

    window.addEventListener('message', this.handleMessage)
  }

  async signOut(e) {
    const { dispatch, backend } = this.props

    e.preventDefault();

    await dispatch(BackendAction.RemoveOrcidCredential(backend.storage))

    this.setState({
      message: h(Alert$Success, 'Successfully signed out'),
    })
  }

  render() {
    const { backend, showAlerts=true } = this.props
        , { message } = this.state
        , { orcidCredential } = backend.metadata

    return (
      h('div', [
        !(message && showAlerts) ? null : h(Box, { mb: 2 }, [
          message,
        ]),

        !orcidCredential && (
          h(Link, {
            href: '',
            onClick: this.initOrcidAuth.bind(this),
            style: {
              display: 'flex',
              alignItems: 'center',
            },
          }, [
            h('img', {
              src: 'https://orcid.org/sites/default/files/images/orcid_24x24.png',
              width: '24',
              height: '24',
              alt: 'ORCID logo',
            }),
            h(Span, { ml: 1 }, 'Log in with your ORCID'),
          ])
        ),

        !!orcidCredential && (
          h(Box, [
            h(Span, `Currently signed in as ${orcidCredential.name}.`),
            h(Link, {
              ml: 2,
              href: '',
              onClick: this.signOut.bind(this),
              fontWeight: 100,
            }, 'Sign out'),
          ])
        ),
      ])
    )
  }
}

module.exports = connect()(SignIn)

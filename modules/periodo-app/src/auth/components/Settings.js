"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , globals = require('../../globals')
    , AuthAction = require('../actions')
    , BackendAction = require('../../backends/actions')
    , LinkedDataAction = require('../../linked-data/actions')
    , { Heading, Box, Span, ResourceTitle, Alert$Success, Button$Danger, Button$Default } = require('periodo-ui')
    , { Link } = require('periodo-ui')

class SignIn extends React.Component {
  constructor() {
    super();

    this.state = {
      message: '',
    }

    this.handleMessage = this.handleMessage.bind(this)
  }

  handleMessage(e) {
    console.log('received message')

    const { dispatch } = this.props
        , oauthName = e.data.name
        , oauthToken = e.data.token

    dispatch(AuthAction.UpdateSettings(
      R.flip(R.merge)({ oauthName, oauthToken })
    ))

    e.target.close()
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage)
  }

  initOrcidAuth(e) {
    e.preventDefault();

    const oauthWindow = window.open(
      globals.orcidURL,
      '_blank',
      'toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500');

    console.log('Setting global variable `oauthWindow`')

    global.oauthWindow = oauthWindow

    window.addEventListener('message', this.handleMessage)
  }

  signOut(e) {
    const { dispatch } = this.props

    e.preventDefault();

    dispatch(AuthAction.UpdateSettings(
      R.omit(['oauthName', 'oauthToken'])
    ))
  }

  render() {
    const { oauthName, oauthToken } = this.props

    return (
      h(Box, [
        h(Heading, {
          level: 3,
          mb: 1,
        }, 'Authorization'),

        !oauthToken && (
          h(Link, {
            href: '',
            onClick: this.initOrcidAuth.bind(this),
            display: 'flex',
            alignItems: 'center',
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

        !!oauthToken && (
          h(Box, [
            h(Span, `Currently signed in as ${oauthName}`),
            h(Link, {
              ml: 1,
              href: '',
              onClick: this.signOut.bind(this)
            }, 'Sign out'),
          ])
        ),


      ])
    )
  }
}

module.exports = function Settings(props) {
  const { dispatch, settings } = props
      , { oauthName, oauthToken } = settings

  return (
    h(Box, [
      h(ResourceTitle, 'Settings'),

      h(Box, { mb: 3 }, [
        h(SignIn, {
          dispatch,
          oauthName,
          oauthToken,
        }),
      ]),

      h(Box, { mb: 3 }, [
        h(Heading, {
          level: 3,
          mb: 1,
        }, 'Local data'),

        h(Button$Default, {
          mr: 2,
          onClick: async () => {
            await dispatch(LinkedDataAction.ClearLinkedDataCache);
            window.location.reload()
          }
        }, 'Clear linked data cache'),

        h(Button$Danger, {
          onClick: async () => {
            if (confirm('Continue deleting all backends? Local data will not be able to be recovered.')) {
              await dispatch(BackendAction.DeleteAllBackends);
              window.location.reload()
            }
          }
        }, 'Clear all data'),
      ]),
    ])
  )
}

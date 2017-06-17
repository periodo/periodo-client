"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , { SuccessAlert } = require('lib/ui')

module.exports = class SignIn extends React.Component {
  constructor() {
    super();

    this.state = {
      message: '',
    }
  }

  initOrcidAuth() {
    const oauthWindow = window.open(
      '/register',
      '_blank',
      'toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500');

    const check = setInterval(() => {
      if (!oauthWindow || !oauthWindow.closed) return;
      clearInterval(check);

      if ('auth' in localStorage) {
        const user = JSON.parse(localStorage.auth);
        window.periodo.emit('signin', user);
        this.setState({ message: 'Signed in as ' + user.name });
      }
    }, 100);
  }

  render() {
    const { message } = this.state

    return (
      h(Box, [
        h(Heading, { level: 1 }, 'Sign in'),
        message && h(SuccessAlert, message),
        h('a', { onClick: this.initOrcidAuth.bind(this) }, [
          h('img', {
            src: 'https://orcid.org/sites/default/files/images/orcid_32x32.png',
            width: '32',
            height: '32',
            alt: 'ORCID logo',
          }),

          'Log in with your ORCID',
        ])
      ])
    )
  }
}

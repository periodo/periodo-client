"use strict";

var React = require('react')

module.exports = React.createClass({
  getInitialState: function () {
    return { message: '' }
  },
  initOrcidAuth: function () {
    var oauthWindow
      , check

    oauthWindow = window.open(
      '/register',
      '_blank',
      'toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500');

    check = setInterval(() => {
      if (!oauthWindow || !oauthWindow.closed) return;
      clearInterval(check);

      if ('auth' in localStorage) {
        let user = JSON.parse(localStorage.auth);
        window.periodo.emit('signin', user);
        this.setState({ message: 'Signed in as ' + user.name });
      }
    }, 100);
  },
  render: function () {
    var msg = !this.state.message ? '' : (
      <div className="alert alert-success">{this.state.message}</div>
    )
    return (
      <div>
        <h1>Sign in</h1>
        {msg}
        <br />
        <a onClick={this.initOrcidAuth} className="connect-orcid-link">
          <img
              className="orcid-id-logo"
              src="http://orcid.org/sites/default/files/images/orcid_32x32.png"
              width="32"
              height="32"
              alt="ORCID logo" />
            Create or Connect your ORCID iD
        </a>
      </div>
    )
  }
});

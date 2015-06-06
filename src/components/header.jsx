"use strict"

var React = require('react')
  , Spinner = require('spin.js')
  , Auth
  , SpinIcon
  , ActionsMenu

require('jquery-bootstrap');

SpinIcon = React.createClass({
  getDefaultProps: function () {
    return { spin: false }
  },
  componentDidMount: function () {
    this.spinner = new Spinner({
      lines: 12,
      length: 5,
      width: 2,
      radius: 6,
      trail: 40
    });
    this.refreshSpin();
  },
  componentDidUpdate: function () {
    this.refreshSpin();
  },
  componentWillUnmount: function () {
    this.spinner.stop();
  },
  refreshSpin: function () {
    if (this.props.spin) {
      this.spinner.spin(React.findDOMNode(this));
    } else {
      this.spinner.stop();
    }
  },
  render: function () {
    return <div className="spinner-wrapper" />
  }
});

Auth = React.createClass({
  getDefaultProps: function () {
    return { user: null }
  },
  render: function () {
    var html = this.props.user ?
      (<span>Signed in as {this.props.user} <a href="signout/">Sign out</a></span>) :
      (<a href="#signin/"> Sign in </a>)

    return (
      <ul className="nav navBar-nav">
        <li>{html}</li>
      </ul>
    )
  }
});

ActionsMenu = React.createClass({
  render: function () {
    return (
      <div className="btn-group">
        <button className="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Menu <span className="caret"></span>
        </button>
        <ul className="dropdown-menu">
          <li><a href="">fixme</a></li>
          <li><a href="">fixme</a></li>
          <li><a href="">fixme</a></li>
        </ul>
      </div>
    )
  }
});

module.exports = React.createClass({
  render: function () {
    var backendMessage = this.props.backend ?
      (<span>
         Current backend: {this.props.backend.name} [
         <a href="#p/">switch</a>
         ]
       </span>)
      : '';

    var logoHref = this.props.backend ? `#p/${this.props.backend.name}/` : '#p/';

    return (
      <div data-FIXME="nav" className="navbar">
        <div className="container">
          <div className="navbar-header">
            <a className="navbar-brand" href={logoHref}>PeriodO</a>
            <p className="navbar-text">{backendMessage}</p>
            <SpinIcon spin={this.props.loading} />
          </div>
          <div className="navbar-header pull-right">
            <Auth user={this.props.user} />
            <ActionsMenu />
          </div>
        </div>
      </div>
    )
  }
});

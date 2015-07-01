"use strict"

var React = require('react')
  , Auth
  , ActionsMenu

Auth = React.createClass({
  getDefaultProps: function () {
    return { user: null }
  },
  render: function () {
    var html = this.props.user ?
      (
        <span style={{ lineHeight: '48px' }}>
          Signed in as {this.props.user.name} (<a href="#signout/">sign out</a>)
        </span>
      ) :
      (<a style={{ paddingTop: '14px' }} href="#signin/"> Sign in </a>)

    return (
      <ul className="nav">
        <li>{html}</li>
      </ul>
    )
  }
});

ActionsMenu = React.createClass({
  getInitialState: function (){
    return { open: false }
  },
  getMenuItems: function () {
    var style = { display: this.state.open ? 'block' : 'none' }

    return (
      <ul style={style} className="dropdown-menu dropdown-menu-right">
        {this.props.backend ? this.getBackendMenuItems() : ''}
        <li><a href={this.props.router.generate('backend-select')}>Switch backends</a></li>
        <li><a href={this.props.router.generate('review-patch-list')}>Review patches</a></li>
      </ul>
    )
  },
  getEditableMenuItems: function (){
    var routerOpts = { backendName: this.props.backend.name }
    return [
      <li key="sync">
        <a href={this.props.router.generate('sync', routerOpts)}>
          Sync with server
        </a>
      </li>,
      <li key="submit-patch">
        <a href={this.props.router.generate('patch-submit', routerOpts)}>
          Submit patch to server
        </a>
      </li>,
      <li key="view-patches">
        <a href={this.props.router.generate('local-patch-list', routerOpts)}>
          View submitted patches
        </a>
      </li>,
      <li key="add-collection">
        <a href={this.props.router.generate('period-collection-add', routerOpts)}>
          Add period collection
        </a>
      </li>,
    ]
  },
  getBackendMenuItems: function () {
    var additionalItems = (
      this.props.backend &&
      this.props.backend.editable &&
      this.getEditableMenuItems()
    )

    return [
      <li key="current-backend" className="dropdown-header">
        Current backend:
        <br/>
        <strong>{ this.props.backend.name } { !this.props.backend.editable && '(read-only)' }</strong>
      </li>,

      additionalItems,

      <li key="divider" className="divider" />
    ]
  },
  open: function () {
    this.setState({ open: true });
    document.addEventListener('click', this.close);
  },
  close: function () {
    this.setState({ open: false });
    document.removeEventListener('click', this.close);
  },
  handleClick: function () {
    if (this.state.open) {
      this.close();
    } else {
      this.open()
    }
  },
  render: function () {
    // TODO: this can be changed to use ./shared/dropdown.jsx
    return (
      <div className={'actions-menu dropdown' + (this.state.open ? ' open' : '')}>
        <button
            className="btn btn-default"
            onBlur={this.handleBlur}
            onClick={this.handleClick}>
          Menu <span className="caret"></span>
        </button>
        {this.props.router ? this.getMenuItems() : ''}
      </div>
    )
  }
});

module.exports = React.createClass({
  displayName: 'Header',
  render: function () {
    var Spinner = require('./shared/spinner.jsx')

    var backendMessage = this.props.backend ?
      (<span>
         Current backend: {this.props.backend.name} [
         <a href="#p/">switch</a>
         ]
       </span>)
      : '';

    var logoHref = this.props.backend ? `#p/${this.props.backend.name}/` : '#p/';

    return (
      <div className="navbar">
        <div className="container">
          <div className="navbar-header">
            <a className="navbar-brand" href={logoHref}>PeriodO</a>
            <p className="navbar-text">{backendMessage}</p>
            <Spinner spin={this.props.loading} />
          </div>
          <div className="navbar-header status-nav pull-right">
            <Auth user={this.props.user} />
            <ActionsMenu backend={this.props.backend} router={this.props.router} />
          </div>
        </div>
      </div>
    )
  }
});

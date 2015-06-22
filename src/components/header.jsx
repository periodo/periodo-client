"use strict"

var React = require('react')
  , Spinner = require('spin.js')
  , Auth
  , SpinIcon
  , ActionsMenu

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
      (<span>Signed in as {this.props.user.name} <a href="#signout/">Sign out</a></span>) :
      (<a href="#signin/"> Sign in </a>)

    return (
      <ul className="nav navBar-nav">
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
      <li key="add-collection">
        <a href={this.props.router.generate('period-collection-add', routerOpts)}>
          Add period collection
        </a>
      </li>,
    ]
  },
  getBackendMenuItems: function () {
    var additionalItems = (this.props.backend && this.props.backend.editable) ?
      this.getEditableMenuItems() : null;
    return [
      <li key="current-backend" className="dropdown-header">
        Current backend:
        <br/>
        <strong>{this.props.backend.name} {this.props.backend.editable ? '' : '(read-only)'}</strong>
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
    return (
      <div className={'btn-group dropdown' + (this.state.open ? ' open' : '')}>
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
            <SpinIcon spin={this.props.loading} />
          </div>
          <div className="navbar-header pull-right">
            <Auth user={this.props.user} />
            <ActionsMenu backend={this.props.backend} router={this.props.router} />
          </div>
        </div>
      </div>
    )
  }
});

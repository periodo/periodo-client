"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'DropdownMenu',

  propTypes: {
    label: React.PropTypes.string.isRequired,
    renderMenuItems: React.PropTypes.func.isRequired,
    openRight: React.PropTypes.bool.isRequired,
    onShown: React.PropTypes.func
  },

  getDefaultProps: function () {
    return { openRight: false }
  },

  getInitialState: function () {
    return { open: false }
  },

  open: function () {
    this.setState({ open: true }, () => {
      if (this.props.onShown) this.props.onShown();
    });
    document.addEventListener('click', this.close);
  },
  close: function () {
    this.setState({ open: false }, () => {
      if (this.props.onHidden) this.props.onHidden();
    });
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
    var style = { display: this.state.open ? 'block' : 'none' }
      , listClass = 'dropdown-menu' + (this.props.openRight ? ' dropdown-menu-right' : '')

    return (
      <div className={'btn-group dropdown' + (this.state.open ? ' open' : '')}>
        <button className="btn btn-default" onClick={this.handleClick}>
          {this.props.label} <span className="caret"></span>
        </button>
        <ul style={style} className={listClass}>
          {this.props.renderMenuItems()}
        </ul>
      </div>
    )
  }
});

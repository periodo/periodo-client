"use strict";

var React = require('react')

class DropdownMenu extends React.Component {
  constructor() {
    super();

    this.state = {
    }
  }
}

module.exports = React.createClass({
  displayName: 'DropdownMenu',

  propTypes: {
    label: React.PropTypes.node.isRequired,
    renderMenuItems: React.PropTypes.func.isRequired,
    openRight: React.PropTypes.bool,
    openUp: React.PropTypes.bool,
    onShown: React.PropTypes.func
  },


  getDefaultProps() {
    return {
      openRight: false,
      openUp: false,
      containerClassName: 'btn-group',
      togglerClassName: 'btn btn-default'
    }
  },


  getInitialState() {
    return { open: false }
  },


  open() {
    this.setState({ open: true }, () => {
      if (this.props.onShown) this.props.onShown();
    });
    document.addEventListener('click', this.close);
  },

  close() {
    this.setState({ open: false }, () => {
      if (this.props.onHidden) this.props.onHidden();
    });
    document.removeEventListener('click', this.close);
  },

  handleClick() {
    if (this.state.open) {
      this.close();
    } else {
      this.open()
    }
  },

  render() {
    var style = { display: this.state.open ? 'block' : 'none' }
      , listClass = 'dropdown-menu' + (this.props.openRight ? ' dropdown-menu-right' : '')
      , containerClassName = `drop${this.props.openUp ? 'up' : 'down'}`

    if (this.state.open) {
      containerClassName += ' open';
    }

    if (this.props.containerClassName) {
      containerClassName += (' ' + this.props.containerClassName)
    }

    return (
      <div className={containerClassName} style={{ position: 'relative' }}>
        <div className={this.props.togglerClassName} onClick={this.handleClick}>
          {this.props.label} <span className="caret"></span>
        </div>
        <ul style={style} className={listClass}>
          {this.props.renderMenuItems()}
        </ul>
      </div>
    )
  }
});

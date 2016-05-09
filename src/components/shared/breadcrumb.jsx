"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Breadcrumb',

  propTypes: {
    crumbs: React.PropTypes.list
  },


  renderCrumb(crumb, i) {
    var last = i === this.props.crumbs.length - 1

    return last ?
      <li className="active">{ crumb.label }</li> :
      <li><a href={ crumb.url }>{ crumb.label }</a></li>
  },


  render() {
    return (
      <ol className="breadcrumb">
        { this.props.crumbs.map(this.renderCrumb, this) }
      </ol>
    )
  }
});

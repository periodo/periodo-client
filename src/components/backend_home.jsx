"use strict";

var React = require('react')

module.exports = React.createClass({
  render: function () {
    var FacetedBrowser = require('../views/faceted_browser/browser.jsx')

    return (
      <div>
        <FacetedBrowser backend={this.props.backend} dataset={this.props.store} />
      </div>
    )
  }
});

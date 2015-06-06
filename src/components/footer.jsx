"use strict";

var React = require('react')

module.exports = React.createClass({
  render: function () {
    var version = require('../../package.json').version
      , githubURL = `https://github.com/periodo/periodo-client/tree/${version}`
    return (
      <div className="content-footer">
        <div className="container">
          <div className="version-number-display">
            PeriodO client <a href={githubURL}>{version}</a>
          </div>
          <div className="error-list">
          </div>
        </div>
      </div>
    )
  }
});

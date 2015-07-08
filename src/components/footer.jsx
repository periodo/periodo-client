"use strict";

var React = require('react')

function errorAsText(err) {
  var error = err.get('error');
  return [
    'Time: ' + err.get('time').toLocaleString(),
    'Version: ' + require('../../package.json').version,
    'Page: ' + window.location.hash,
    '=========',
    error.stack || error
  ].join('\n')
}

module.exports = React.createClass({
  displayName: 'Footer',
  renderErrorLabel: function () {
    return (
      <span className="error-list">
        <img className="error-icon" src="/lib/noun_2189_cc.svg" />
        Errors ({ this.props.errors.size })
      </span>
    )
  },
  handleDragError: function (error, e) {
    var dt = e.nativeEvent.dataTransfer
      , text = errorAsText(error)

    dt.clearData('text/uri-list');
    dt.setData('text/plain', text);
    dt.setData('text/html', text);
  },
  handleClickError: function (error) {
    var text = errorAsText(error);
    prompt('Copy text to clipboard and report issue.', text);
  },
  handleClearErrors: function () {
    window.periodo.clearErrors();
  },
  renderErrors: function () {
    return this.props.errors.map((err, i) => {
      var ret = []
        , keybase = 'err' + i

      ret.push(
        <li key={keybase + '-time'} className="dropdown-header">
          {err.get('time').toLocaleString()}
        </li>
      );

      ret.push(
        <li key={keybase + '-error'}>
          <a href=""
              onClick={this.handleClickError.bind(null, err)}
              onDragStart={this.handleDragError.bind(null, err)}>
            { err.get('error').toString() }
          </a>
        </li>
      );

      ret.push(
        <li key={keybase + '-divider'} className="divider" />
      )

      return ret;
    }).push(
      <li key="clear-errors" style={{ textAlign: 'center' }}>
        <button
            className="btn btn-danger"
            onClick={this.handleClearErrors}>
          Clear errors
        </button>
      </li>
    )
  },
  render: function () {
    var Dropdown = require('./shared/dropdown.jsx')
      , version = require('../../package.json').version
      , githubURL = `https://github.com/periodo/periodo-client/tree/v${version}`

    return (
      <div className="content-footer">
        <div className="container">
          <div className="version-number-display">
            PeriodO client <a href={githubURL}>{ version }</a>
          </div>
          {
            !!this.props.errors.size && (
              <Dropdown
                  openUp={true}
                  containerClassName={' '}
                  togglerClassName={' '}
                  label={this.renderErrorLabel()}
                  renderMenuItems={this.renderErrors} />
            )
          }
        </div>
      </div>
    )
  }
});

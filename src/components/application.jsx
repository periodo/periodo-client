"use strict";

var React = require('react')
  , Header = require('./header.jsx')
  , Footer = require('./footer.jsx')

module.exports = React.createClass({
  displayName: 'PeriodoApplication',
  render: function () {
    var ActiveComponent = this.props.Component
      , componentProps = {}
      , activeComponent

    Object.keys(this.props)
      .filter(key => ['Component', 'data'].indexOf(key) === -1)
      .forEach(key => componentProps[key] = this.props[key])

    activeComponent = ActiveComponent ?
      <ActiveComponent {...componentProps} {...this.props.data} /> :
      <div />;

    return (
      <div className="outer">
        <div className="content-wrapper">

          <Header
            backend={this.props.backend}
            loading={this.props.loading}
            router={this.props.router}
            user={this.props.user} />

          <div className="container">{activeComponent}</div>

          <div className="push" />
        </div>
        <Footer errors={this.props.errors} />
      </div>
    )
  }
});

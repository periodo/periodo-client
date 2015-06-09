"use strict";

var React = require('react')

module.exports = React.createClass({
  render: function () {
    var PeriodCollectionForm = require('./shared/period_collection_form');
    return (
      <div>
        <h1>Add period collection</h1>
        <PeriodCollectionForm />
      </div>
    )
  }
});

"use strict";

var React = require('react')
  , skolemID = require('../utils/generate_skolem_id')

module.exports = React.createClass({
  displayName: 'PeriodCollectionAdd',
  handleSave: function () {
    var id = skolemID()
      , collection = this.refs.form.getValue()

    collection = collection.set('id', id);

    this.props.cursor.set(id, collection);
  },
  render: function () {
    var PeriodCollectionForm = require('./shared/period_collection_form');
    return (
      <div>
        <h1>Add period collection</h1>
        <PeriodCollectionForm ref="form" />
        <div>
          <button className="btn btn-primary" onClick={this.handleSave}>
            Save
          </button>
        </div>
      </div>
    )
  }
});

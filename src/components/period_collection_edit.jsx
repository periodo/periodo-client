"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PeriodCollectionAdd',
  handleSave: function () {
    var value = this.refs.form.getValue()
      , collection

    collection = this.props.cursor.deref()
      .set('source', value.get('source'))
      .set('editorialNote', value.get('editorialNote'))

    if (!collection.get('editorialNote')) {
      collection = collection.delete('editorialNote')
    }

    this.props.cursor.update(() => collection);
  },
  render: function () {
    var PeriodCollectionForm = require('./shared/period_collection_form');

    return (
      <div>
        <h1>Edit period collection</h1>
        <PeriodCollectionForm
            ref="form"
            collection={this.props.cursor} />
        <div>
          <button className="btn btn-primary" onClick={this.handleSave}>
            Save
          </button>
        </div>
      </div>
    )
  }
});

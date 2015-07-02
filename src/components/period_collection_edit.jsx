"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PeriodCollectionAdd',
  componentWillReceiveProps: function (nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      let url = this.props.router.generate('period-collection-show', {
        backendName: this.props.backend.name,
        collectionID: encodeURIComponent(this.props.cursor.get('id'))
      });
      window.location.href = url;
    }
  },
  handleSave: function () {
    var value = this.refs.form.getValue()
      , collection

    collection = this.props.cursor.deref()
      .set('source', value.get('source'))
      .set('editorialNote', value.get('editorialNote'))

    if (!collection.get('editorialNote')) {
      collection = collection.delete('editorialNote')
    }

    if (this.refs.form.isValid()) {
      this.props.cursor.update(() => collection);
    }
  },
  render: function () {
    var PeriodCollectionForm = require('./shared/period_collection_form');

    return (
      <div>
        <h1>Edit period collection</h1>
        <PeriodCollectionForm
            ref="form"
            collection={this.props.cursor.deref()} />
        <div>
          <button className="btn btn-primary" onClick={this.handleSave}>
            Save
          </button>
        </div>
      </div>
    )
  }
});

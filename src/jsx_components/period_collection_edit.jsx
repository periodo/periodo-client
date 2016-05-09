"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PeriodCollectionAdd',

  componentWillReceiveProps(nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      this.redirectToPeriod();
    }
  },

  redirectToPeriod() {
    var url = this.props.router.generate('period-collection-show', {
      backendName: this.props.backend.name,
      collectionID: encodeURIComponent(this.props.cursor.get('id'))
    });
    window.location.href = url;
  },

  handleSave() {
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

  handleDelete() {
    var { getDisplayTitle } = require('../helpers/source')
      , collection = this.props.cursor.deref()
      , defs = collection.get('definitions').size
      , msg

    msg = `Delete period based on "${getDisplayTitle(collection.get('source'))}"?`

    if (defs) {
      msg += `\n\nAll of its ${defs} period definitions will also be deleted.`
    }

    if (confirm(msg)) {
      this.props.cursor.update(() => void 0);
      window.location.href = this.props.router.generate('home');
    }
  },

  render() {
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

          <button className="btn btn-default pull-right" onClick={this.redirectToPeriod}>
            Cancel
          </button>

          <button
              className="btn btn-danger pull-right"
              style={{ marginRight: '8px' }}
              onClick={this.handleDelete}>
            Delete
          </button>
        </div>
      </div>
    )
  }
});

"use strict";

var React = require('react')
  , skolemID = require('../utils/generate_skolem_id')

module.exports = React.createClass({
  displayName: 'PeriodCollectionAdd',
  componentWillReceiveProps: function (nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      let url = this.props.router.generate('period-collection-show', {
        backendName: this.props.backend.name,
        collectionID: encodeURIComponent(this.state.savedID)
      });
      window.location.href = url;
    }
  },
  handleSave: function () {
    var id = skolemID()
      , collection = this.refs.form.getValue()

    if (this.refs.form.isValid()) {
      this.setState({ savedID: id }, () => {
        collection = collection.set('id', id);
        this.props.cursor.set(id, collection);
      });
    }
  },
  handleCancel: function () {
    window.location.href = this.props.router.generate('home');
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

          <button className="btn btn-default pull-right" onClick={this.handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }
});

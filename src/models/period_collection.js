"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Periodization

Periodization = Backbone.Model.extend({
  skolemID: true,
  validate: function () {
    var errors = []
      , source = this.source()

    if (!source || _.isEmpty(source.toJSON())) {
      errors.push({
        field: 'source',
        message: 'A source is required for a period collection.'
      });
    } else {
      if (!source.isValid()) {
        errors = errors.concat(source.validationError);
      }
    }

    return errors.length ? errors : null;
  },
  toJSON: function () {
    // change to structure of dataset
    var ret = Backbone.Model.prototype.toJSON.call(this);
    delete ret.source_id;
    ret.definitions = this.definitions().reduce(function (acc, period) {
      acc[period.id] = period.toJSON();
      return acc;
    }, {});
    ret.source = this.source().toJSON();
    ret.type = 'PeriodCollection';
    return ret;
  }
});

module.exports = Periodization;

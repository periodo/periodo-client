"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  initialize: function ({ patches }) {
    this.patches = patches;
    this.render();
  },
  render: function () {
    this.$el.html('<pre>' + JSON.stringify(this.patches, false, '  ') + '</pre>');
  }
});

/*
    var ld = require('./linked_data_cache')

      .then(([patches]) => {
        var authors

        authors = _.unique(patches.map(patch => patch.created_by))
          .map(orcidURL => ld.get(orcidURL))

        Promise.all(authors)
          .then(authors => {
            console.log(authors);
          }, err => { throw err })
      });
*/

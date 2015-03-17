"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , LDSourceSelectView = require('./ld_source_edit')
  , SourceSelectView = require('./nonld_source_edit')

module.exports = Backbone.View.extend({
  events: {
    'click .toggle-form-type': 'toggleView'
  },
  initialize: function () {
    var ldSourceSelectionView
      , sourceSelectionView

    this.render();

    this.ldSourceSelectionView = new LDSourceSelectView({
      el: this.$('#ld-source-select'),
      model: this.model
    });

    this.sourceSelectionView = new SourceSelectView({
      el: this.$('#no-ld-source-select'),
      model: this.model
    });

    if (!_.isEmpty(this.model.toJSON()) && !this.model.isLinkedData()) this.toggleView({ clear: false });
  },
  render: function () {
    var template = require('./templates/source_edit.html');
    this.$el.html(template());
  },
  toggleView: function (opts) {
    var msg
      , opts = opts || {}
      , $rejectLD = this.$('#js-reject-source')

    if ($rejectLD.is(':visible')) {
      $rejectLD.trigger('click');
    }

    if (!opts.hasOwnProperty('clear')) opts.clear = true;

    if (opts.clear) {
      this.model.clear();
    }

    this.ldSourceSelectionView.$el.toggleClass('hide');
    this.sourceSelectionView.$el.toggleClass('hide');

    msg = 'My source is ' + (this.sourceSelectionView.$el.hasClass('hide') ? 'not ' : '') + 'linked data';
    this.$('.toggle-form-type').html(msg + ' &rsaquo;').blur();
  },
  remove: function () {
    this.ldSourceSelectionView.remove();
    this.sourceSelectionView.remove();
    Backbone.View.prototype.remove.call(this);
  }
});

"use strict";

var Backbone = require('../../backbone')
  , LDSourceSelectView = require('./ld_source_edit')
  , SourceSelectView = require('./nonld_source_edit')

module.exports = Backbone.View.extend({
  events: {
    'click .toggle-form-type': 'handleToggleForm',
    'click .js-change-ld-source': 'showSourceForms'
  },
  initialize: function (opts) {
    var { isLinkedData } = require('../../helpers/source')
      , isNew

    this.cursor = opts.cursor;

    isNew = this.cursor.deref() === undefined;
    this.isExistingLD = !isNew && isLinkedData(this.cursor);
    this.formsRendered = false;

    if (this.isExistingLD) {
      this.showCurrentLD();
    } else {
      // Show linked data form if this is a new source
      this.showSourceForms(isNew);
    }
  },
  getData: function () {
    if (!this.formsRendered) {
      return this.cursor.deref();
    } else if (this.ldSourceSelectionView.$el.hasClass('hide')) {
      return this.sourceSelectionView.getData();
    } else {
      return this.ldSourceSelectionView.getData();
    }
  },
  showCurrentLD: function () {
    var template = require('./templates/ld_source_current.html');
    this.$el.html(template({ source: this.cursor.toJS() }));
  },
  showSourceForms: function (toLD) {
    var template = require('./templates/source_edit.html')

    this.formsRendered = true;
    this.$el.html(template());

    this.ldSourceSelectionView = new LDSourceSelectView({
      el: this.$('#ld-source-select'),
    });

    this.sourceSelectionView = new SourceSelectView({
      el: this.$('#no-ld-source-select'),
      model: this.isExistingLD ? undefined : this.cursor
    });

    this.switchSource(!!toLD);
  },
  handleToggleForm: function () {
    var toLD = this.ldSourceSelectionView.$el.hasClass('hide');
    this.switchSource(toLD);
  },
  switchSource: function (toLD) {
    var msg = `My source <strong>is ${toLD ? 'not ' : ''}</strong> linked data. &rsaquo;`

    if (!toLD) this.$('#js-reject-source').trigger('click');

    debugger;
    this.ldSourceSelectionView.$el.toggleClass('hide', !toLD)
    this.sourceSelectionView.$el.toggleClass('hide', toLD)

    this.$('.toggle-form-type').html(msg).blur();
  },
  remove: function () {
    this.ldSourceSelectionView.remove();
    this.sourceSelectionView.remove();
    Backbone.View.prototype.remove.call(this);
  }
});

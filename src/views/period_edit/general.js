"use strict";

var Backbone = require('../../backbone')
  , _ = require('underscore')
  , $ = require('jquery')
  , LanguageSelectView = require('./select_language')

require('jquery-bootstrap');

module.exports = Backbone.View.extend({
  events: {
    'click .original-label-language': 'handleOriginalLabelLanguage',
    'click .label-language': 'handleLabelLanguage',
    'click .label-script': 'handleLabelScript',
    'input .alternate-label-field': 'handleAlternateLabelInput',
    'click .js-altlabel-add': 'handleAddAltLabel',
    'click .js-altlabel-remove': 'handleRemoveAltLabel'
  },
  bindings: {
    '#js-same-as': 'sameAs',
    '#js-locator': 'locator',
    '#js-label': {
      observe: 'label',
      set: function (binding, value) {
        var localized = this.model.get('originalLabel');
        this.model.set(binding, value);

        localized[Object.keys(localized)[0]] = value;
        this.model.set('originalLabel', localized);
      }
    },
    '#js-label-language': {
      observe: 'originalLabel',
      onGet: function (value) {
        return Object.keys(value || { 'eng-latn': ''})[0];
      }
    }
  },
  initialize: function () {
    var that = this;

    this.render();

    var alternateLabels = this.model.get('alternateLabel') || {};

    var labelFields = Object.keys(alternateLabels).reduce(function (arr, lang) {
      arr = arr.concat(alternateLabels[lang].map(function (value) {
        return {
          value: value,
          language: lang
        }
      }));
      return arr;
    }, []);

    if (!labelFields.length) labelFields.push({ value: '', language: 'eng-latn' });

    labelFields.forEach(function (field) {
      var template = require('./templates/label_field.html');
      that.$('#js-alternate-labels').append(template(field));
    });

    this.stickit();
  },
  render: function () {
    var template = require('./templates/general_form.html');
    this.$el.html(template());
  },
  handleOriginalLabelLanguage: function (e) {
    var that = this;
    this.originalLanguageSelectView = new LanguageSelectView();
    this.originalLanguageSelectView.$el.on('hide.bs.modal', function () {
      var code = that.originalLanguageSelectView.code
        , data

      if (code) {
        data = {}
        data[code] = that.model.get('label');
        that.model.set('originalLabel', data);
      }
    });
  },
  handleLabelLanguage: function (e) {
    var that = this;
    this.alternateLanguageSelectView = new LanguageSelectView();
    this.alternateLanguageSelectView.$el.on('hide.bs.modal', function () {
      var code = that.alternateLanguageSelectView.code;
      if (code) {
        e.currentTarget.textContent = code;
        $(e.currentTarget).next('input').trigger('input');
      }
    });
  },
  handleAlternateLabelInput: function (e) {
    var alternateLabels = this.$('.alternate-label-field').toArray().reduce(function (acc, el) {
      var $el = $(el)
        , lang = $el.find('.label-language').text()
        , val = $el.find('input').val()

      if (val) {
        if (!acc.hasOwnProperty(lang)) acc[lang] = [];
        acc[lang].push(val);
      }

      return acc;
    }, {});

    if (_.isEmpty(alternateLabels)) {
      this.model.unset('alternateLabel');
    } else {
      this.model.set('alternateLabel', alternateLabels);
    }
  },
  handleAddAltLabel: function (e) {
    var $el = $(e.currentTarget).closest('.alternate-label-field')
      , $newEl

    if (!$el.find('input').val()) return;

    $newEl = $el.clone().appendTo($el.parent());
    $newEl.find('input').val('');
  },
  handleRemoveAltLabel: function (e) {
    var $el = $(e.currentTarget).closest('.alternate-label-field')
      , $siblings = $el.siblings('.alternate-label-field')

    if (!$siblings.length) {
      $el.find('input').val('').trigger('input');
    } else {
      $el.remove();
      $siblings.first().find('input').trigger('input');
    }
  }
});

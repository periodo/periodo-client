"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , Backbone = require('../../backbone')

require('jquery-bootstrap');

module.exports = Backbone.View.extend({
  events: {
    'click [data-field="label-language"]': 'handleLabelLanguage',
    'click [data-field="alternate-label-language"]': 'handleLabelLanguage',
    'input [data-field="alternate-label"]': 'handleAlternateLabelInput',
    'click .js-altlabel-add': 'handleAddAltLabel',
    'click .js-altlabel-remove': 'handleRemoveAltLabel'
  },
  bindings: {
    '[data-field="same-as"]': 'sameAs',
    '[data-field="locator"]': 'locator',
    '[data-field="label"]': {
      observe: 'label',
      set: function (binding, value) {
        var localized = this.model.get('originalLabel');
        this.model.set(binding, value);

        localized[Object.keys(localized)[0]] = value;
        this.model.set('originalLabel', localized);
      }
    },
    '[data-field="label-language"]': {
      observe: 'originalLabel',
      onGet: function (value) {
        return Object.keys(value)[0] || 'eng-latn'
      }
    }
  },
  initialize: function () {
    this.render();
    this.initAlternateLabelFields()
    this.stickit();
    this.$('[data-field="label"]').trigger('input');
  },
  render: function () {
    var template = require('./templates/general_form.html');
    this.$el.html(template());
  },
  initAlternateLabelFields: function () {
    var fieldTemplate = require('./templates/label_field.html')
      , alternateLabels = this.model.get('alternateLabel') || {}
      , $alternateFields = this.$('[data-field="alternate-labels"]')
      , labelFields

    labelFields = Object.keys(alternateLabels).reduce((arr, language) => {
      alternateLabels[language].forEach(value => arr.push({ value, language }));
      return arr;
    }, []);

    if (!labelFields.length) labelFields.push({ value: '', language: 'eng-latn' });

    labelFields.forEach(field => $alternateFields.append(fieldTemplate(field)));
  },
  handleLabelLanguage: function (e) {
    var LanguageSelectView = require('./select_language')
      , languageView = new LanguageSelectView()
      , $code = $(e.currentTarget)
      , isAlternate = $code.data('field') === 'alternateLabel'

    languageView.on('codeSelected', code => {
      if (isAlternate) {
        $code.text(code).next('input').trigger('input');
      } else {
        let data = {};
        data[code] = this.model.get('label');
        this.model.set('originalLabel', data);
      }
    });

    languageView.$el.on('hidden.bs.modal', () => languageView.remove());
  },
  handleAlternateLabelInput: function () {
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

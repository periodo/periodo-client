"use strict";

var Backbone = require('backbone')

function labelFromEl(el) {
  var lang = el.querySelector('[data-field="label-language"]').textContent
    , label = el.querySelector('[data-field="label"]').value

  return [lang.trim(), label]
}

module.exports = Backbone.View.extend({
  events: {
    'click [data-trigger="change-label-language"]': 'handleLabelLanguage',
    'click [data-trigger="add-alt-label"]': 'handleAddAltLabel',
    'click [data-trigger="remove-alt-label"]': 'handleRemoveAltLabel'
  },
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('./templates/language_form.html');
    this.$el.html(template({ data: this.model.toJS() }));
  },
  getData: function () {
    var data = {}
      , label
      , language

    [language, label] = labelFromEl(this.$('[data-field="originalLabel"]')[0]);

    data.label = label;
    data.originalLabel = { [language]: label }
    data.alternateLabel = this.$('[data-field="alternateLabel"]').toArray().reduce((acc, el) => {
      var [language, label] = labelFromEl(el)

      if (label) {
        if (!acc.hasOwnProperty(language)) acc[language] = [];
        acc[language].push(label);
      }

      return acc;
    }, {});

    return data;
  },
  handleLabelLanguage: function (e) {
    var LanguageSelectView = require('./select_language')
      , languageView = new LanguageSelectView()

    languageView.on('codeSelected', code => e.currentTarget.textContent = code);
    languageView.$el.on('hidden.bs.modal', () => languageView.remove());
  },
  handleAddAltLabel: function (e) {
    var $el = this.$(e.currentTarget).closest('[data-field="alternateLabel"]')
      , $newEl

    if (!$el.find('input').val()) return;

    $newEl = $el.clone().appendTo($el.parent());
    $newEl.find('input').val('');
  },
  handleRemoveAltLabel: function (e) {
    var $altLabel = this.$(e.currentTarget).closest('[data-field="alternateLabel"]');
    if ($altLabel.siblings('[data-field="alternateLabel"]').length) {
      $altLabel.remove();
    } else {
      $altLabel.find('input').val('');
    }
  },
});

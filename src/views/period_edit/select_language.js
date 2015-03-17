"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , iso639_3 = require('iso-639-3')

var isoLanguages = _.chain(iso639_3.all())
  .map(function (val, key) {
    return _.extend(val, { code: key });
  })
  .sort(function (b, a) {
    if (a.iso6391 && !b.iso6391) {
      return 1;
    } else if (a.iso6392T && !b.iso6392T) {
      return 1;
    } else if (!a.iso6391 && !a.iso6392T && !b.iso6391 && !b.iso6392T) {
      return 0;
    } else {
      return -1;
    }
  })
  .value();

// From http://unicode.org/iso15924/iso15924-codes.html
var isoScripts = require('./scripts.json').sort(function (a, b) {
  var aDate = new Date(a), bDate = new Date(b);
  if (bDate > aDate) {
    return 1;
  } else if (bDate === aDate) {
    return 0;
  } else {
    return -1;
  }
});

module.exports = Backbone.View.extend({
  className: 'modal',
  events: {
    'click .accept-language': 'handleAccept'
  },
  initialize: function () {
    var that = this;

    this.render();

    var languages = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: isoLanguages,
      limit : 10
    });
    languages.initialize();

    var scripts = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: isoScripts,
      limit : 10
    });
    scripts.initialize();

    this.$('#js-language-autocomplete').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'languages',
      displayKey: 'name',
      source: languages.ttAdapter(),
    }).on('typeahead:selected', function (e, suggestion) {
      this.value = suggestion.name;
      that.language = suggestion.code;
    });

    this.$('#js-script-autocomplete').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'scripts',
      displayKey: 'name',
      source: scripts.ttAdapter(),
    }).on('typeahead:selected', function (e, suggestion) {
      this.value = suggestion.name;
      that.script = suggestion.code;
    });

  },
  render: function () {
    var template = require('./templates/select_language.html');
    this.$el.html(template());
    this.$el.appendTo('body').modal();
  },
  handleAccept: function () {
    var code;
    if (this.language && this.script) {
      code = (this.language + '-' + this.script).toLowerCase();
      this.code = code;
    }

    this.$el.modal('hide');
  }
});

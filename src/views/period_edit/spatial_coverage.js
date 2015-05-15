"use strict";

var Immutable = require('immutable')
  , Backbone = require('../../backbone')

require('jquery-typeahead');

module.exports = Backbone.View.extend({
  initialize: function (options) {
    this.cursor = options.cursor;
    this.state = {
      countries: this.cursor.get('spatialCoverage', Immutable.List()).toSet()
    }

    this.render();
    this.initTypeahead();
    this.initCoverageType(options.spatialCoverages.toJS());
  },
  render: function () {
    var template = require('./templates/spatial_coverage_form.html');
    this.$el.html(template({ data: this.cursor.toJS() }));
    this.renderList();
  },
  getData: function () {
    var description = this.$('#js-spatialCoverageLabel').val()
      , coverage = this.state.countries.toJS()
      , data = {}

    if (description.length) data.spatialCoverageDescription = description;
    if (coverage.length) data.spatialCoverage = coverage;

    return data;
  },
  renderList: function () {
    var template = require('./templates/spatial_coverage_item.html')
      , items = this.state.countries.map(country => template({ item: country.toJS () }))

    this.$('.spatial-coverage-list').html(items.join(''));
  },
  initCoverageType: function (coverageData) {
    var that = this
      , $input = this.$('#js-spatialCoverageLabel')
      , coverages


    coverages = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: coverageData
    });
    coverages.initialize();

    $input
      .typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: 'coverages',
        displayKey: 'label',
        source: coverages.ttAdapter(),
        templates: {
          suggestion: require('./templates/spatial_description_suggestion.html')
        }
      })
      .on('typeahead:selected', function (e, suggestion) {
        var input = this;

        if (suggestion.uses.length === 1) {
          input.value = suggestion.label;
          that.state.collection = Immutable.Set.from(suggestion.uses[0].countries);
          that.renderList();
          input.blur();
        } else {
          input.blur();
          var ModalView = require('./select_coverage_modal')
            , view = new ModalView({ suggestion: suggestion });

          view.$el.one('hide.bs.modal', function () {
            var selectedCountries = view.selectedCountries;
            if (selectedCountries) {
              that.collection.state = Immutable.Set.from(view.selectedCountries);
              that.renderList();
            }
          });
        }
      });

    $input.closest('.twitter-typeahead').css('width', '100%');
  },
  initTypeahead: function () {
    var that = this
      , $input
      , countries

    $input = this.$('input.country-autocomplete');

    countries = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: require('../../data/dbpedia_countries.json')
    });
    countries.initialize();

    $input
      .typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: 'countries',
        displayKey: 'label',
        source: countries.ttAdapter(),
        templates: {
          suggestion: require('./templates/spatial_suggestion.html')
        }
      })
      .on('typeahead:selected', function (e, suggestion) {
        this.value = '';
        that.state.countries.add(suggestion);
        that.renderList();
      })
      .on('blur', function () { this.value = '' })
  }
});
